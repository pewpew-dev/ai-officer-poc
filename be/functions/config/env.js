/**
 * 환경 변수 설정
 */

// 필수 환경 변수 목록
const requiredEnvVars = [
  'PORT',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'OPENAI_API_KEY',
  'GCS_BUCKET_NAME',
  'FIREBASE_USAGE_COLLECTION',
  'FIRESTORE_DATABASE_ID',
  'GCS_BUCKET_URL'
];

module.exports = {
  requiredEnvVars
};
