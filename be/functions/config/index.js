/**
 * 설정 모듈 통합 파일
 */

const apiConfig = require('./api');
const openaiConfig = require('./openai');
const storageConfig = require('./storage');
const envConfig = require('./env');
const functions = require('firebase-functions');

// Firebase Functions config에서 값을 가져옵니다
const getConfig = () => {
  return functions.config();
};

// 초기화된 설정값을 저장할 객체
const settings = {
  // 초기화 함수
  initialize() {
    // Firebase config에서 값 가져오기
    const functionConfig = getConfig();
    
    // 설정 값을 저장할 객체
    this.values = {
      port: Number(functionConfig?.server?.port || 3000),
      userCreditLimit: apiConfig.apiDefaults.userCreditLimit,
      firebaseUsageCollection: functionConfig?.app?.usage_collection,
      firestoreDatabaseId: functionConfig?.app?.database_id,
      gcsBucketUrl: functionConfig?.gcs?.bucket_url,
      gcsBucketName: functionConfig?.gcs?.bucket_name
    };
    
    // 로그만 출력하고 실행 계속 진행
    if (isNaN(this.values.port) || this.values.port <= 0) {
      console.warn('PORT 값이 유효한 숫자가 아닙니다. 기본값 3000을 사용합니다.');
      this.values.port = 3000;
    }
    
    return this.values;
  },
  
  // 설정값 가져오기
  get() {
    if (!this.values) {
      throw new Error('설정값이 초기화되지 않았습니다. initialize() 함수를 호출하세요.');
    }
    return this.values;
  }
};

// GCS 설정 초기화
let gcsSettings;

const initializeGcsSettings = () => {
  gcsSettings = storageConfig.gcsSettings(settings);
  return gcsSettings;
};

const getGcsSettings = () => {
  if (!gcsSettings) {
    throw new Error('GCS 설정이 초기화되지 않았습니다. initializeGcsSettings() 함수를 호출하세요.');
  }
  return gcsSettings;
};

module.exports = {
  // 환경변수 및 설정 초기화 관련
  settings,
  initializeGcsSettings,
  
  // api 설정
  ...apiConfig,
  
  // openai 설정
  ...openaiConfig,
  
  // env 설정
  ...envConfig,
  
  // gcs 설정
  get gcsSettings() { return getGcsSettings(); }
};
