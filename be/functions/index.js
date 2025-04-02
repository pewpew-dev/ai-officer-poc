const express = require('express');
const cors = require('cors');
const path = require('path');

const admin = require('firebase-admin');
const { OpenAI } = require('openai');
const { onRequest } = require("firebase-functions/v1/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const config = require('./config/index');
const axios = require('axios');

// 환경변수 로드 및 설정 (Firebase Functions config 활용)
const loadConfig = () => {
  try {
    // Firebase Functions 환경 변수 사용
    const functionConfig = functions.config();
    
    // 필수 구성 요소 확인
    const requiredConfigs = [
      ['app', 'project_id'],
      ['app', 'private_key'],
      ['app', 'client_email'],
      ['openai', 'api_key']
    ];
    
    const missingConfigs = [];
    
    // 필수 구성 요소 확인
    for (const [category, key] of requiredConfigs) {
      if (!functionConfig?.[category]?.[key]) {
        missingConfigs.push(`${category}.${key}`);
      }
    }
    
    // private_key가 있는 경우 줄바꿈 처리
    if (functionConfig?.app?.private_key) {
      functionConfig.app.private_key = functionConfig.app.private_key.replace(/\\n/g, '\n');
    }
    
    // 필수 환경변수 누락 시 오류 발생
    if (missingConfigs.length > 0) {
      throw new Error(`필수 Firebase 구성이 누락되었습니다: ${missingConfigs.join(', ')}\n구성을 설정하려면: firebase functions:config:set 명령어를 사용하세요.`);
    }
    
    return functionConfig;
  } catch (error) {
    console.error('Firebase 구성 로드 중 오류가 발생했습니다:', error);
    throw error;
  }
};

// 환경변수 로드 실행
const functionConfig = loadConfig();

// 초기 설정값 로드
const settings = config.settings.initialize();

// GCS 설정 초기화
config.initializeGcsSettings();

logger.info(config.logMessages.CONFIG_INITIALIZED, { structuredData: settings });

// Express 앱 초기화
const app = express();
const port = process.env.PORT || config.settings.get().port;

// CORS 설정 수정 - 모든 출처에서의 요청 허용
app.use(cors({ 
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '100kb' }));

// Firebase 설정
const serviceAccount = {
  type: 'service_account',
  project_id: functionConfig.app.project_id,
  private_key: functionConfig.app.private_key,
  client_email: functionConfig.app.client_email
};

// Firebase 초기화 옵션
const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  storageBucket: functionConfig.gcs.bucket_name
};

// 데이터베이스 URL이 있으면 추가
if (functionConfig.app.database_url) {
  firebaseConfig.databaseURL = functionConfig.app.database_url;
}

// Firebase 앱 초기화
admin.initializeApp(firebaseConfig);

// Firestore 데이터베이스 설정
let db;
try {
  // Firestore 인스턴스 가져오기
  db = admin.firestore();
  
  // 필요한 경우 데이터베이스 ID 설정을 로그에 기록
  if (settings.firestoreDatabaseId !== '(default)') {
    logger.info(`Firestore 데이터베이스 ID: ${settings.firestoreDatabaseId}`);
  }
} catch (error) {
  logger.error('Firestore 데이터베이스 초기화 중 오류가 발생했습니다.', { structuredData: error || true });
  throw error;
}

const bucket = admin.storage().bucket();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: functionConfig.openai.api_key
});

// API 응답 생성 헬퍼 함수
const createResponse = (res, status, success, data, errorCode, errorMessage) => {
  const response = { success };
  
  if (success) {
    response.data = data;
  } else {
    response.error = {
      code: errorCode,
      message: errorMessage
    };
  }
  
  return res.status(status).json(response);
};

// API 요청 타임아웃 미들웨어 
const apiTimeout = (req, res, next) => {
  const type = req.body.type;
  let timeout = config.requestLimits.timeouts.default; // config에서 기본 타임아웃 가져오기
  
  if (type === 'image') {
    timeout = config.requestLimits.timeouts.image; // config에서 이미지 타임아웃 가져오기
  } else if (type === 'code') {
    timeout = config.requestLimits.timeouts.code; // config에서 코드 타임아웃 가져오기
  }
  
  // 타임아웃 설정
  req.setTimeout(timeout, () => {
    if (!res.headersSent) {
      return createResponse(
        res, 
        408, 
        false, 
        null, 
        config.errorCodes.REQUEST_TIMEOUT, 
        config.errorMessages.REQUEST_TIMEOUT
      );
    }
  });
  
  next();
};

// 사용자 인증 미들웨어
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse(
        res, 
        401, 
        false, 
        null, 
        config.errorCodes.UNAUTHORIZED, 
        config.errorMessages.UNAUTHORIZED
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error(config.logMessages.AUTH_ERROR, error);
    return createResponse(
      res, 
      401, 
      false, 
      null, 
      config.errorCodes.INVALID_TOKEN, 
      config.errorMessages.INVALID_TOKEN
    );
  }
};

// 사용량 체크 미들웨어
const checkUsage = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const settings = config.settings.get();
    const usageRef = db.collection(settings.firebaseUsageCollection).doc(userId);
    const usageDoc = await usageRef.get();
    
    let usage = {
      used: 0,
      limit: settings.userCreditLimit,
      remaining: settings.userCreditLimit
    };
    
    if (usageDoc.exists) {
      usage = { ...usage, ...usageDoc.data() };
    }
    
    // 요청 타입에 따른 예상 사용량(크레딧) 계산
    let estimatedCredits = 0;
    
    if (req.originalUrl.includes('/api/storage/upload')) {
      // 스토리지 업로드 요청의 경우
      const content = req.body.content || '';
      // KB 단위로 계산 (소수점 없애기 위해)
      const contentSizeInKB = Buffer.byteLength(content, 'utf8') / 1024;
      
      estimatedCredits = Math.max(
        config.apiUsageCalc.storage.minCredits,
        Math.ceil(contentSizeInKB * config.apiUsageCalc.storage.kbFactor)
      );
    } else {
      // OpenAI API 요청의 경우
      const type = req.body.type;
      
      if (type === 'text') {
        // 텍스트 요청의 경우 입력 토큰 기준으로 예상 크레딧 계산
        let inputTokens = 0;
        
        if (req.body.messages && Array.isArray(req.body.messages)) {
          // 모든 메시지의 내용에 대해 토큰 수 계산
          inputTokens = req.body.messages.reduce((total, msg) => {
            return total + config.estimateTokens(msg.content || '');
          }, 0);
        }
        
        // 토큰 수에 가중치 적용 (100토큰당 크레딧 1)
        estimatedCredits = Math.max(
          config.apiUsageCalc.text.minCredits,
          Math.ceil(inputTokens * config.apiUsageCalc.text.inputTokenFactor)
        );
      } else if (type === 'image') {
        // 이미지 요청의 경우 이미지 크기와 수량에 따라 계산
        const size = req.body.size || config.apiUsageCalc.image.defaultSize;
        const n = req.body.n || 1;
        
        // 이미지 크기별 크레딧 적용
        const sizeCredits = config.apiUsageCalc.image[size] || config.apiUsageCalc.image['1024x1024'];
        estimatedCredits = sizeCredits * n;
      }
    }
    
    // 사용량 초과 체크
    if (usage.used + estimatedCredits > usage.limit) {
      return createResponse(
        res, 
        429, 
        false, 
        null, 
        config.errorCodes.QUOTA_EXCEEDED, 
        config.errorMessages.QUOTA_EXCEEDED
      );
    }
    
    req.usage = usage;
    req.estimatedCredits = estimatedCredits;
    req.usageRef = usageRef;
    next();
  } catch (error) {
    console.error(config.logMessages.USAGE_CHECK_ERROR, error);
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      config.errorCodes.SERVER_ERROR, 
      config.errorMessages.SERVER_ERROR
    );
  }
};

// API 요청 검증 통합 미들웨어
const validateApiRequest = (validationConfig) => {
  return (req, res, next) => {
    const { type, requiredFields, specificValidation } = validationConfig;
    
    // 타입 검증
    if (type && req.body.type !== type) {
      return createResponse(
        res,
        400,
        false,
        null,
        config.errorCodes.INVALID_REQUEST,
        config.errorMessages.INVALID_TYPE(type)
      );
    }
    
    // 필수 필드 검증
    if (requiredFields && Array.isArray(requiredFields)) {
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return createResponse(
            res,
            400,
            false,
            null,
            config.errorCodes.INVALID_REQUEST,
            config.errorMessages.MISSING_FIELD(field)
          );
        }
      }
    }
    
    // 타입별 특수 검증 로직
    if (specificValidation && typeof specificValidation === 'function') {
      const validationResult = specificValidation(req, res);
      if (validationResult) return validationResult;
    }
    
    next();
  };
};

// OpenAI 타입별 검증 함수
const validateOpenAIRequestType = (req, res) => {
  if (!req.body.type) {
    return createResponse(
      res, 
      400, 
      false, 
      null, 
      config.errorCodes.INVALID_REQUEST, 
      config.errorMessages.MISSING_TYPE
    );
  }
  
  switch (req.body.type) {
    case 'text':
      if (!req.body.model || !req.body.messages) {
        return createResponse(
          res, 
          400, 
          false, 
          null, 
          config.errorCodes.INVALID_REQUEST, 
          config.errorMessages.MISSING_MODEL_MESSAGES
        );
      }
      break;
      
    case 'image':
      if (!req.body.prompt) {
        return createResponse(
          res, 
          400, 
          false, 
          null, 
          config.errorCodes.INVALID_REQUEST, 
          config.errorMessages.MISSING_PROMPT
        );
      }
      break;
      
    default:
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.UNSUPPORTED_TYPE, 
        config.errorMessages.UNSUPPORTED_TYPE
      );
  }
  
  return null; // 검증 통과
};

// 사용량 업데이트 함수
const updateUsage = async (usageRef, currentUsage, credits) => {
  await usageRef.set({
    used: currentUsage.used + credits,
    limit: currentUsage.limit,
    remaining: currentUsage.limit - (currentUsage.used + credits)
  });
};

// 로깅 개선을 위해 logger 사용
const logInfo = (message, data) => {
  logger.info(message, {structuredData: data || true});
};

const logError = (message, error) => {
  logger.error(message, {structuredData: error || true});
};

// OpenAI API 호출 엔드포인트
app.post('/api/openai', authenticateUser, checkUsage, apiTimeout, validateApiRequest({
  requiredFields: ['type'],
  specificValidation: validateOpenAIRequestType
}), async (req, res) => {
  try {
    const { type, model, messages, prompt, n, size } = req.body;
    
    let result;
    
    switch (type) {
      case 'text':
        result = await openai.chat.completions.create({
          model,
          messages,
        });
        
        // 텍스트 응답 구조 간소화
        result = {
          content: result.choices[0].message.content
        };
        break;
        
      case 'image':
        result = await openai.images.generate({
          prompt,
          n: n || config.openAIDefaults.imageSettings.n,
          size: size || config.openAIDefaults.imageSettings.size,
        });
        
        // 이미지 응답 구조 간소화
        result = {
          images: result.data.map(item => ({ url: item.url }))
        };
        break;
        
      default:
        return createResponse(
          res, 
          400, 
          false, 
          null, 
          config.errorCodes.INVALID_REQUEST, 
          config.errorMessages.UNSUPPORTED_TYPE
        );
    }
    
    // 사용량 업데이트
    await updateUsage(req.usageRef, req.usage, req.estimatedCredits);
    
    // API 응답 형식을 문서와 일치시킴
    return createResponse(res, 200, true, result, null, null);
  } catch (error) {
    logError(config.logMessages.OPENAI_API_ERROR, error);
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      config.errorCodes.OPENAI_ERROR, 
      error.message || config.errorMessages.OPENAI_ERROR
    );
  }
});

// 스토리지 업로드 엔드포인트
app.post('/api/storage/upload', authenticateUser, validateApiRequest({
  requiredFields: ['content', 'fileName']
}), checkUsage, async (req, res) => {
  try {
    const { content, fileName, contentType } = req.body;
    
    // 파일 내용 크기 검증 (config에서 최대 크기 가져오기)
    const contentSizeInMB = Buffer.byteLength(content, 'utf8') / (1024 * 1024);
    if (contentSizeInMB > config.requestLimits.maxContentSizeMB) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.CONTENT_TOO_LARGE, 
        config.errorMessages.CONTENT_TOO_LARGE
      );
    }
    
    const user = req.user;
    const userId = user.uid;
    const timestamp = new Date().toISOString();
    const filePath = `output/${userId}/${fileName}`;
    
    const file = bucket.file(filePath);
    await file.save(content, {
      metadata: {
        contentType: contentType || config.gcsSettings.contentTypes.html
      }
    });
    
    // 파일에 공개 접근 URL 생성
    const bucketUrl = config.settings.get().gcsBucketUrl;
    const bucketName = config.settings.get().gcsBucketName;
    const url = `${bucketUrl}/${bucketName}/${filePath}`;
    
    // 사용량 업데이트
    await updateUsage(req.usageRef, req.usage, req.estimatedCredits);
    
    return createResponse(res, 200, true, {
      url,
      fileName
    }, null, null);
  } catch (error) {
    logError(config.logMessages.STORAGE_UPLOAD_ERROR, error);
    
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      config.errorCodes.STORAGE_UPLOAD_ERROR, 
      error.message || config.errorMessages.STORAGE_UPLOAD_ERROR
    );
  }
});

// 이미지 URL 업로드 엔드포인트
app.post('/api/storage/upload-from-url', authenticateUser, validateApiRequest({
  requiredFields: ['imageUrl', 'fileName']
}), checkUsage, async (req, res) => {
  try {
    const { imageUrl, fileName, contentType } = req.body;
    
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.INVALID_URL, 
        config.errorMessages.INVALID_URL
      );
    }
    
    // URL에서 이미지 다운로드
    let response;
    try {
      response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000 // 10초 타임아웃
      });
    } catch (downloadError) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.IMAGE_DOWNLOAD_FAILED, 
        config.errorMessages.IMAGE_DOWNLOAD_FAILED + ': ' + downloadError.message
      );
    }
    
    // 이미지 데이터 가져오기
    const imageBuffer = Buffer.from(response.data);
    
    // 파일 내용 크기 검증
    const contentSizeInMB = imageBuffer.length / (1024 * 1024);
    if (contentSizeInMB > config.requestLimits.maxContentSizeMB) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.CONTENT_TOO_LARGE, 
        config.errorMessages.CONTENT_TOO_LARGE
      );
    }
    
    const user = req.user;
    const userId = user.uid;
    const filePath = `output/${userId}/${fileName}`;
    
    const file = bucket.file(filePath);
    await file.save(imageBuffer, {
      metadata: {
        contentType: contentType || 'image/png'
      }
    });
    
    // 스토리지 경로로 URL 생성 (allUsers에게 읽기 권한이 있으므로 공개 URL 생성 필요 없음)
    const bucketUrl = config.settings.get().gcsBucketUrl;
    const bucketName = config.settings.get().gcsBucketName;
    const url = `${bucketUrl}/${bucketName}/${filePath}`;
    
    // 사용량 업데이트 - 이미지 크기에 따른 크레딧 계산
    const fileSizeKB = imageBuffer.length / 1024;
    const estimatedCredits = Math.max(
      config.apiUsageCalc.storage.minCredits,
      Math.ceil(fileSizeKB * config.apiUsageCalc.storage.kbFactor)
    );
    
    // 기존 추정 크레딧을 새로운 값으로 업데이트
    req.estimatedCredits = estimatedCredits;
    await updateUsage(req.usageRef, req.usage, req.estimatedCredits);
    
    return createResponse(res, 200, true, {
      url,
      fileName
    }, null, null);
  } catch (error) {
    logError(config.logMessages.URL_UPLOAD_ERROR, error);
    
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      config.errorCodes.URL_UPLOAD_ERROR, 
      error.message || config.errorMessages.URL_UPLOAD_ERROR
    );
  }
});

// 사용량 확인 엔드포인트
app.get('/api/usage', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const settings = config.settings.get();
    const usageRef = db.collection(settings.firebaseUsageCollection).doc(userId);
    const usageDoc = await usageRef.get();
    
    let usage = {
      used: 0,
      limit: settings.userCreditLimit,
      remaining: settings.userCreditLimit
    };
    
    if (usageDoc.exists) {
      usage = { ...usage, ...usageDoc.data() };
    }
    
    return createResponse(res, 200, true, usage, null, null);
  } catch (error) {
    logError(config.logMessages.USAGE_CHECK_ERROR_RESPONSE, error);
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      config.errorCodes.SERVER_ERROR, 
      config.errorMessages.SERVER_ERROR
    );
  }
});

// Firebase Functions 설정
// 1세대 함수 형식으로 명시적 정의
exports.ai_officer_api = onRequest((req, res) => {
  return app(req, res);
});

// 로컬 개발 환경에서만 서버 시작 (Firebase Functions 환경에서는 서버 시작 안함)
if (functionConfig?.app?.node_env !== 'production' && 
    !process.env.FUNCTIONS_EMULATOR && 
    !process.env.FIREBASE_CONFIG) {
  app.listen(port, () => {
    console.log(`로컬 개발 환경에서 서버가 ${port} 포트에서 실행 중입니다.`);
  });
}
