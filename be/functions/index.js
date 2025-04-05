const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const config = require('./config/index');
const { logInfo, logError } = require('./utils/logger');

// 환경변수 로드 및 설정은 config/index.js의 loadConfig 함수로 이동했습니다.

// 환경변수 로드 실행
try {
  // Firebase App 초기화
  const firebaseConfig = config.loadConfig();
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.app.project_id,
      privateKey: firebaseConfig.app.private_key,
      clientEmail: firebaseConfig.app.client_email
    }),
    databaseURL: `https://${firebaseConfig.app.project_id}.firebaseio.com`,
    storageBucket: firebaseConfig.gcs.bucket_name
  });
  
  // Firestore 데이터베이스 설정
  if (firebaseConfig.app.database_id) {
    admin.firestore().settings({
      databaseId: firebaseConfig.app.database_id
    });
  }
  
  // Firebase Functions config 로드 완료 로그
  logInfo('Firebase Functions 설정 로드 완료');
} catch (error) {
  logError('Firebase 초기화 중 오류 발생', error);
  process.exit(1);
}

// 초기 설정값 로드
const settings = config.settings.initialize();

// GCS 설정 초기화
config.initializeGcsSettings();

logInfo(config.logMessages.CONFIG_INITIALIZED, { structuredData: settings });

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

// 라우터 가져오기
const openaiRouter = require('./routes/openai'); // 기존 라우터 (deprecated)
const modelRouter = require('./routes/model'); // 새로운 통합 모델 라우터
const storageRouter = require('./routes/storage');
const usageRouter = require('./routes/usage');

// 라우터 등록
app.use('/api/model', modelRouter); // 새 모델 API 라우터 등록
app.use('/api/openai', openaiRouter); // 기존 라우터 유지 (deprecated)
app.use('/api/storage', storageRouter);
app.use('/api/usage', usageRouter);

// 루트 엔드포인트 추가
app.get('/', (req, res) => {
  res.send('AI Officer API 서버가 실행중입니다.');
});

// 로컬 개발 환경에서만 사용
if (process.env.NODE_ENV === 'development') {
  app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  });
}

// Firebase Functions로 내보내기
exports.ai_officer_api = functions.https.onRequest(app);