> AI Officer POC


# AI Officer POC 서비스 개요

AI Officer POC는 사용자의 간단한 아이디어 입력만으로 정적 웹사이트를 자동 생성하는 서비스입니다. OpenAI API와 Firebase를 활용하여 아이디어 기획부터 HTML 코드 생성, 이미지 생성, 웹사이트 배포까지 전 과정을 AI로 자동화합니다.

## 시스템 아키텍처

### Backend : /be/

+ **기술 스택**: Node.js, Express.js, Firebase Functions, Firestore
+ **핵심 기능**: OpenAI API 연동, Firebase Storage 관리, 사용자 인증 및 권한 관리
+ **API 엔드포인트**:
  - `/api/openai`: OpenAI API 호출 (텍스트/이미지 생성)
  - `/api/storage/upload`: Firebase Storage에 파일 업로드
  - `/api/storage/upload-from-url`: URL에서 이미지를 다운로드하여 Storage에 업로드
  - `/api/usage`: 사용자 크레딧 사용량 조회

### Frontend : /fe/

+ **기술 스택**: Vanilla JS, HTML, CSS, Firebase SDK
+ **특징**: 단일 페이지 애플리케이션(SPA), 로컬 스토리지 활용
+ **사용자 인증**: Firebase Authentication (Google 로그인)

## 서비스 흐름 및 동작 원리

AI Officer POC는 다음과 같은 5단계 프로세스를 통해 웹사이트를 생성합니다:

### 1. 웹사이트 아이디어 입력
- 사용자가 간단한 웹사이트 아이디어를 텍스트로 입력
- Firebase Auth를 통해 사용자 인증 및 크레딧 확인

### 2. 기획 및 디자인 요구사항 생성
- OpenAI GPT-4o를 활용하여 사용자 아이디어를 기반으로 상세한 웹사이트 기획서와 디자인 요구사항 생성
- 생성된 내용은 프론트엔드 로컬 스토리지에 저장되어 세션 간 유지

### 3. DALL-E 프롬프트 생성 및 이미지 생성
- 기획서와 디자인 요구사항을 기반으로 DALL-E 이미지 생성 프롬프트 작성
- 이미지 생성 시 다음 5가지 이미지를 자동 생성:
  * 헤더 이미지
  * 히어로 이미지
  * 컨텐츠 이미지 (3개)
- 생성된 이미지는 OpenAI 임시 URL로 저장되며, 이후 배포 시 Firebase Storage로 이동

### 4. HTML 코드 생성
- 기획서, 디자인 요구사항, 이미지 URL을 통합하여 완전한 HTML 웹사이트 코드 생성
- 이미지는 플레이스홀더 형식(`{{IMAGE_HEADER}}` 등)으로 코드에 삽입되어 미리보기와 배포 시 실제 URL로 변환

### 5. 배포 및 미리보기
- **미리보기**: 생성된 HTML 코드를 브라우저에서 직접 볼 수 있으며, 플레이스홀더가 OpenAI 이미지 URL로 대체됨
- **배포 프로세스**:
  1. 이미지를 OpenAI 임시 URL에서 Firebase Storage로 업로드
  2. HTML 코드의 이미지 플레이스홀더를 Firebase Storage URL로 대체
  3. 최종 HTML 파일을 Firebase Storage에 업로드
  4. 완성된 웹사이트 URL 제공

## 백엔드-프론트엔드 통신 흐름

프론트엔드와 백엔드 간의 통신은 HTTP/REST API를 기반으로 이루어지며, 다음과 같은 흐름을 따릅니다:

### 인증 및 권한 흐름
1. **클라이언트 인증**: 
   - 프론트엔드에서 Firebase Auth SDK를 통해 사용자 로그인
   - 로그인 성공 시 Firebase에서 ID 토큰(JWT) 발급
   - 모든 API 요청에 `Authorization: Bearer {token}` 헤더 포함

2. **서버 인증 처리**:
   - 백엔드는 모든 요청에서 JWT 토큰 검증 (`authenticateUser` 미들웨어)
   - 검증 성공 시 사용자 정보를 `req.user`에 저장하여 후속 미들웨어에서 접근 가능
   - 크레딧 확인 미들웨어(`checkUsage`)에서 사용자의 API 호출 가능 여부 검증

### API 요청 흐름

#### 텍스트 생성 요청 흐름:
1. 프론트엔드: `/api/openai` 엔드포인트로 POST 요청 전송
   ```javascript
   {
     type: "text",
     model: "gpt-4o",
     messages: [...],
     temperature: 0.7
   }
   ```
2. 백엔드: 요청 검증 후 OpenAI API 호출 및 결과 반환
3. 프론트엔드: 응답 처리 및 다음 단계 진행

#### 이미지 생성 요청 흐름:
1. 프론트엔드: `/api/openai` 엔드포인트로 POST 요청 전송
   ```javascript
   {
     type: "image",
     prompt: "DALL-E 프롬프트",
     size: "1024x1024",
     n: 1
   }
   ```
2. 백엔드: DALL-E API 호출 및 이미지 URL 반환
3. 프론트엔드: 반환된 URL을 화면에 표시 및 로컬 스토리지에 저장

#### 파일 업로드 흐름:
1. 프론트엔드: `/api/storage/upload` 엔드포인트로 POST 요청 전송
   ```javascript
   {
     content: "HTML 코드 또는 Base64 이미지 데이터",
     fileName: "파일 경로/이름",
     contentType: "text/html 또는 image/png"
   }
   ```
2. 백엔드: Firebase Storage에 파일 업로드 및 공개 URL 반환
3. 프론트엔드: 반환된 URL을 사용자에게 제공 (최종 웹사이트 URL)

#### URL에서 이미지 업로드 흐름:
1. 프론트엔드: `/api/storage/upload-from-url` 엔드포인트로 POST 요청 전송
   ```javascript
   {
     imageUrl: "OpenAI 이미지 URL",
     fileName: "저장할 파일 경로/이름",
     contentType: "image/png"
   }
   ```
2. 백엔드: URL에서 이미지 다운로드 후 Firebase Storage에 업로드
3. 프론트엔드: 반환된 영구 URL로 HTML 내 이미지 플레이스홀더 교체

### 에러 핸들링 및 응답 형식
- 모든 API 응답은 일관된 형식으로 반환됨:
  ```javascript
  // 성공 응답
  {
    success: true,
    data: { ... }
  }
  
  // 실패 응답
  {
    success: false,
    error: {
      code: "ERROR_CODE",
      message: "에러 메시지"
    }
  }
  ```
- 프론트엔드에서는 응답의 `success` 필드를 확인하여 에러 처리
- 타임아웃, 권한 부족, 크레딧 부족 등의 상황에 대한 전용 에러 코드 제공

### 크레딧 관리 흐름
1. 프론트엔드: API 호출 전 예상 크레딧 계산
2. 백엔드: 실제 요청 처리 전 크레딧 확인
3. 요청 완료 후 사용된 크레딧 차감 및 DB 업데이트
4. 프론트엔드: `/api/usage` 엔드포인트로 현재 크레딧 상태 조회 및 표시

## 핵심 기술 요소

### 크레딧 시스템
- 사용자별 API 호출 제한을 관리하는 크레딧 시스템 구현
- 요청 타입(텍스트/이미지)과 크기에 따라 차등 크레딧 소비

### 보안 및 인증
- Firebase Authentication을 통한 사용자 인증
- API 요청 시 JWT 토큰 기반 인증 체계
- 사용자별 리소스 접근 제한

### 데이터 저장 및 관리
- 프론트엔드: 로컬 스토리지를 활용한 단계별 데이터 저장
- 백엔드: Firestore를 활용한 사용자 크레딧 관리
- Firebase Storage: 생성된 이미지와 HTML 파일 저장

## 환경 설정

백엔드 환경 변수:
- OpenAI API 키
- Firebase 프로젝트 설정
- 스토리지 버킷 설정

프론트엔드 환경 변수:
- Firebase SDK 설정
- API 엔드포인트 URL