/**
 * 설정 모듈 통합 파일
 */

const apiConfig = require('./api');
const functions = require('firebase-functions');
const { requiredConfigs } = require('./required');

// Firebase Functions config에서 값을 가져옵니다
const getConfig = () => {
  return functions.config();
};

// 환경변수 로드 및 필수 구성 요소 검증
const loadConfig = () => {
  try {
    // Firebase Functions 환경 변수 사용
    const functionConfig = getConfig();
    
    const missingConfigs = [];
    const errorMessages = [];
    
    // 필수 구성 요소 확인
    for (const [category, key, errorMsg] of requiredConfigs) {
      if (!functionConfig?.[category]?.[key]) {
        missingConfigs.push(`${category}.${key}`);
        errorMessages.push(errorMsg || `환경 변수 '${category}.${key}'가 설정되지 않았습니다.`);
      }
    }
    
    // 필수 환경변수 누락 시 오류 발생
    if (missingConfigs.length > 0) {
      const missingEnvsMessage = `필수 Firebase 환경 변수가 누락되었습니다: ${missingConfigs.join(', ')}`;
      const errorDetailsMessage = errorMessages.map((msg, i) => `${i+1}. ${msg}`).join('\n');
      
      throw new Error(`
${missingEnvsMessage}

상세 오류 내용:
${errorDetailsMessage}

이 오류를 해결하려면:
1. firebase functions:config:set 명령어를 사용하여 누락된 환경 변수를 설정하세요.
2. 로컬 개발 환경에서는 .runtimeconfig.json 파일에 필요한 환경 변수를 추가하세요.

예시:
firebase functions:config:set ${missingConfigs[0]}="값"
      `);
    }
    
    // private_key가 있는 경우 줄바꿈 처리
    if (functionConfig?.app?.private_key) {
      functionConfig.app.private_key = functionConfig.app.private_key.replace(/\\n/g, '\n');
    }
    
    return functionConfig;
  } catch (error) {
    console.error('Firebase 환경 변수 검증 중 오류가 발생했습니다:', error);
    throw error;
  }
};

// 초기화된 설정값을 저장할 객체
const settings = {
  // 초기화 함수
  initialize() {
    // Firebase config에서 값 가져오기
    const functionConfig = loadConfig();
    
    // 설정 값을 저장할 객체
    this.values = {
      port: Number(functionConfig?.server?.port || 3000),
      userCreditLimit: Number(functionConfig?.app?.user_credit_limit),
      firebaseUsageCollection: functionConfig?.app?.usage_collection,
      firestoreDatabaseId: functionConfig?.app?.database_id,
      gcsBucketUrl: functionConfig?.gcs?.bucket_url,
      gcsBucketName: functionConfig?.gcs?.bucket_name
    };
    
    // 포트 번호 검증
    if (isNaN(this.values.port) || this.values.port <= 0) {
      console.warn('PORT 값이 유효한 숫자가 아닙니다. 기본값 3000을 사용합니다.');
      this.values.port = 3000;
    }
    
    // 유저 크레딧 제한 검증
    if (isNaN(this.values.userCreditLimit) || this.values.userCreditLimit <= 0) {
      throw new Error('user_credit_limit 값이 유효한 숫자가 아닙니다. 양수 값을 설정해야 합니다.');
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

function initializeGcsSettings() {
  // Firebase Functions config에서 GCS 설정 가져오기
  const config = getConfig();
  
  // 설정값 저장
  gcsSettings = {
    bucketName: config?.gcs?.bucket_name,
    bucketUrl: config?.gcs?.bucket_url
  };
  
  // GCS 버킷 설정 검증
  if (!gcsSettings.bucketName || !gcsSettings.bucketUrl) {
    throw new Error('GCS 설정이 완전하지 않습니다. gcs.bucket_name과 gcs.bucket_url을 모두 설정해야 합니다.');
  }
}

function getGcsSettings() {
  if (!gcsSettings) {
    initializeGcsSettings();
  }
  return gcsSettings;
}

module.exports = {
  // 환경변수 및 설정 초기화 관련
  settings,
  initializeGcsSettings,
  loadConfig,
  
  // api 설정
  ...apiConfig,
  
  // env 설정
  
  // gcs 설정
  get gcsSettings() { return getGcsSettings(); }
};
