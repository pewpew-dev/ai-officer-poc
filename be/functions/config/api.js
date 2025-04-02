/**
 * API 요청 관련 설정
 */

// API 기본 설정값
const apiDefaults = {
  userCreditLimit: 10000  // 사용자 크레딧 제한값
};

// API 크레딧 사용량 계산 설정
const apiUsageCalc = {
  // 텍스트 요청의 토큰 계산 설정
  text: {
    // 100 토큰당 크레딧 1로 계산 (소수점 최소화)
    inputTokenFactor: 0.01,    // 1 크레딧 = 100 토큰
    outputTokenFactor: 0.01,
    minCredits: 10            // 최소 사용량은 10 크레딧
  },
  // 이미지 요청의 크기별 가중치
  image: {
    '1024x1024': 100,         // 1024x1024 크기 이미지는 100 크레딧
    '512x512': 50,
    '256x256': 25,
    defaultSize: '1024x1024'
  },
  // 스토리지 사용량 계산 설정 추가
  storage: {
    // 100KB당 크레딧 1로 계산
    kbFactor: 0.01,          // 1 크레딧 = 100 KB
    minCredits: 5            // 최소 사용량은 5 크레딧
  }
};

// 요청 제한 설정
const requestLimits = {
  maxContentSizeMB: 10,  // 최대 컨텐츠 크기 (MB)
  timeouts: {
    default: 60000,      // 기본 타임아웃: 60초
    image: 30000         // 이미지 요청: 30초
  }
};

// 에러 코드
const errorCodes = {
  // 인증 관련 에러
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // 사용량 관련 에러
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // 요청 관련 에러
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  CONTENT_TOO_LARGE: 'CONTENT_TOO_LARGE',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  INVALID_URL: 'INVALID_URL',
  
  // 서비스 관련 에러
  OPENAI_ERROR: 'OPENAI_ERROR', 
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_UPLOAD_ERROR: 'STORAGE_UPLOAD_ERROR',
  URL_UPLOAD_ERROR: 'URL_UPLOAD_ERROR',
  IMAGE_DOWNLOAD_FAILED: 'IMAGE_DOWNLOAD_FAILED',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // 환경 설정 관련 에러
  MISSING_ENV_VARS: 'MISSING_ENV_VARS',
  CONFIG_ERROR: 'CONFIG_ERROR'
};

// 에러 메시지
const errorMessages = {
  // 일반 에러
  UNAUTHORIZED: '인증이 필요합니다.',
  INVALID_TOKEN: '유효하지 않은 인증 토큰입니다.',
  QUOTA_EXCEEDED: '월간 API 호출 한도를 초과했습니다.',
  INVALID_REQUEST: '잘못된 요청입니다.',
  OPENAI_ERROR: 'OpenAI API 호출 중 오류가 발생했습니다.',
  STORAGE_ERROR: '파일 업로드 중 오류가 발생했습니다.',
  STORAGE_UPLOAD_ERROR: '파일 업로드 중 오류가 발생했습니다.',
  SERVER_ERROR: '서버 내부 오류가 발생했습니다.',
  MISSING_ENV_VARS: '필수 환경 변수가 설정되지 않았습니다.',
  REQUEST_TIMEOUT: '요청 처리 시간이 초과되었습니다.',
  CONFIG_ERROR: '설정 오류가 발생했습니다.',
  INVALID_URL: '유효한 이미지 URL이 아닙니다.',
  URL_UPLOAD_ERROR: '이미지 URL에서 업로드 중 오류가 발생했습니다.',
  IMAGE_DOWNLOAD_FAILED: '이미지 다운로드에 실패했습니다.',
  
  // 필드 검증 에러
  MISSING_TYPE: '요청 타입이 지정되지 않았습니다.',
  MISSING_MODEL_MESSAGES: '모델과 메시지가 필요합니다.',
  MISSING_PROMPT: '프롬프트가 필요합니다.',
  MISSING_PLANNING_DOC: '기획 문서가 필요합니다.',
  UNSUPPORTED_TYPE: '지원하지 않는 요청 타입입니다.',
  MISSING_CONTENT_FILENAME: 'content와 filename이 필요합니다.',
  CONTENT_TOO_LARGE: '파일 크기가 제한을 초과했습니다.',
  
  // 동적 오류 메시지 생성 함수
  INVALID_TYPE: (type) => `요청 타입이 '${type}'이어야 합니다.`,
  MISSING_FIELD: (field) => `'${field}' 필드가 필요합니다.`
};

// 로그 메시지
const logMessages = {
  AUTH_ERROR: '인증 오류:',
  USAGE_CHECK_ERROR: '사용량 체크 오류:',
  OPENAI_API_ERROR: 'OpenAI API 오류:',
  STORAGE_UPLOAD_ERROR: '스토리지 업로드 오류:',
  URL_UPLOAD_ERROR: '이미지 URL 업로드 오류:',
  IMAGE_DOWNLOAD_ERROR: '이미지 다운로드 오류:',
  USAGE_CHECK_ERROR_RESPONSE: '사용량 확인 오류:',
  SERVER_RUNNING: '서버가 포트 {port}에서 실행 중입니다.',
  CONFIG_INITIALIZED: '서버 설정이 초기화되었습니다.'
};

module.exports = {
  apiDefaults,
  apiUsageCalc,
  requestLimits,
  errorCodes,
  errorMessages,
  logMessages
};
