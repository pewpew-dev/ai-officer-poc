/**
 * Firebase Functions 필수 환경 변수 목록
 * 
 * 이 파일은 애플리케이션 실행에 필요한 필수 Firebase Functions 환경 변수를 정의합니다.
 * Firebase Functions 환경 변수는 firebase functions:config:set 명령어를 통해 설정할 수 있습니다.
 * 
 * 예시:
 * firebase functions:config:set app.project_id="your-project-id" app.private_key="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 * 
 * 환경 변수 예제 구조:
 * {
 *   "app": {
 *     "project_id": "pewpew-453314",
 *     "client_email": "firebase-adminsdk-fbsvc@pewpew-453314.iam.gserviceaccount.com",
 *     "usage_collection": "usage",
 *     "database_id": "ai-officer-poc",
 *     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
 *     "user_credit_limit": "10000"
 *   },
 *   "gcs": {
 *     "bucket_name": "ai-officer-poc",
 *     "bucket_url": "https://storage.googleapis.com"
 *   },
 *   "openai": {
 *     "api_key": "sk-..."
 *   },
 *   "google": {
 *     "api_key": "aig-..."
 *   },
 *   "anthropic": {
 *     "api_key": "sk-ant-..."
 *   },
 *   "server": {
 *     "port": "3000"
 *   }
 * }
 * 
 * Firebase Functions 환경 변수 확인 명령어:
 * firebase functions:config:get
 */

// 필수 환경 변수 목록 - [카테고리, 키, 오류 메시지] 형식으로 정의
const requiredConfigs = [
  ['app', 'project_id', '프로젝트 ID가 설정되지 않았습니다.'],
  ['app', 'private_key', 'Firebase Admin SDK 비공개 키가 설정되지 않았습니다.'],
  ['app', 'client_email', 'Firebase Admin SDK 클라이언트 이메일이 설정되지 않았습니다.'],
  ['app', 'user_credit_limit', '사용자 크레딧 제한이 설정되지 않았습니다.'],
  ['app', 'usage_collection', '사용량 컬렉션 이름이 설정되지 않았습니다.'],
  ['app', 'database_id', '데이터베이스 ID가 설정되지 않았습니다.'],
  ['openai', 'api_key', 'OpenAI API 키가 설정되지 않았습니다. OpenAI 서비스를 사용하려면 유효한 API 키가 필요합니다.'],
  ['google', 'api_key', 'Google Gemini API 키가 설정되지 않았습니다. Google AI 서비스를 사용하려면 유효한 API 키가 필요합니다.'],
  ['anthropic', 'api_key', 'Anthropic Claude API 키가 설정되지 않았습니다. Anthropic 서비스를 사용하려면 유효한 API 키가 필요합니다.'],
  ['gcs', 'bucket_name', 'Google Cloud Storage 버킷 이름이 설정되지 않았습니다.'],
  ['gcs', 'bucket_url', 'Google Cloud Storage 버킷 URL이 설정되지 않았습니다.'],
  ['server', 'port', '서버 포트가 설정되지 않았습니다.']
];

module.exports = {
  requiredConfigs
};
