const admin = require('firebase-admin');
const config = require('../config/index');
const { createResponse } = require('../utils/response');

// 토큰 수 계산 함수 (대략적인 추정)
const estimateTokens = (text) => {
  if (!text) return 0;
  // 간단한 추정 공식: 영문자 길이 ÷ 4 + 한글 길이 ÷ 1.5
  
  const englishChars = text.replace(/[^a-zA-Z0-9]/g, '').length;
  const koreanChars = text.replace(/[a-zA-Z0-9]/g, '').length;
  
  return Math.ceil(englishChars / 4 + koreanChars / 1.5);
};

// 사용량 체크 미들웨어
const checkUsage = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const settings = config.settings.get();
    const db = admin.firestore();
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
      if (!req.body.content) {
        return createResponse(
          res, 
          400, 
          false, 
          null, 
          config.errorCodes.INVALID_REQUEST, 
          '콘텐츠가 필요합니다.'
        );
      }
      
      const content = req.body.content;
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
            if (!msg.content) {
              return total;
            }
            return total + estimateTokens(msg.content);
          }, 0);
        }
        
        // 토큰 수에 가중치 적용 (100토큰당 크레딧 1)
        estimatedCredits = Math.max(
          config.apiUsageCalc.text.minCredits,
          Math.ceil(inputTokens * config.apiUsageCalc.text.inputTokenFactor)
        );
      } else if (type === 'image') {
        // 이미지 요청의 경우 이미지 크기와 수량에 따라 계산
        if (!req.body.size) {
          return createResponse(
            res, 
            400, 
            false, 
            null, 
            config.errorCodes.INVALID_REQUEST, 
            '이미지 크기(size)가 필요합니다.'
          );
        }
        
        if (!req.body.n) {
          return createResponse(
            res, 
            400, 
            false, 
            null, 
            config.errorCodes.INVALID_REQUEST, 
            '이미지 수량(n)이 필요합니다.'
          );
        }
        
        const size = req.body.size;
        const n = req.body.n;
        
        // 이미지 크기별 크레딧 적용
        if (!config.apiUsageCalc.image[size]) {
          return createResponse(
            res, 
            400, 
            false, 
            null, 
            config.errorCodes.INVALID_REQUEST, 
            '지원하지 않는 이미지 크기입니다.'
          );
        }
        
        const sizeCredits = config.apiUsageCalc.image[size];
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

// 사용량 업데이트 함수
const updateUsage = async (usageRef, currentUsage, credits) => {
  await usageRef.set({
    used: currentUsage.used + credits,
    limit: currentUsage.limit,
    remaining: currentUsage.limit - (currentUsage.used + credits)
  });
};

module.exports = {
  checkUsage,
  updateUsage,
  estimateTokens
};
