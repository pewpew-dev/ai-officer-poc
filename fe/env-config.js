/**
 * 환경 설정 파일
 * 민감한 API 키 및 설정값을 관리하기 위한 파일입니다.
 * 이 파일은 .gitignore에 추가하여 버전 관리에서 제외하는 것이 좋습니다.
 */

export const ENV = {
    // Firebase 설정 (인증에 필요한 것만 유지)
    FIREBASE_API_KEY: "AIzaSyBgxyrWCdPH6JgYhMslA1f_vidwbGXAiqg",
    FIREBASE_AUTH_DOMAIN: "pewpew-453314.firebaseapp.com",
    FIREBASE_PROJECT_ID: "pewpew-453314",
    
    // 백엔드 API 서버 주소
    // BACKEND_API_URL: "http://127.0.0.1:5001/pewpew-453314/us-central1/ai_officer_api"
    BACKEND_API_URL: "https://us-central1-pewpew-453314.cloudfunctions.net/ai_officer_api"
};