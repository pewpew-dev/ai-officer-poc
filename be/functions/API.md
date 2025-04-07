# AI Officer 백엔드 API 가이드

## 개요

이 문서는 AI Officer 백엔드 API의 사용법과 엔드포인트에 대한 설명을 제공합니다. 프론트엔드 개발자가 백엔드 API를 쉽게 이해하고 활용할 수 있도록 작성되었습니다.

## 인증

요청 헤더에 다음과 같이 토큰을 포함해야 합니다:

```
Authorization: Bearer {idToken}
```

여기서 `{idToken}`은 Firebase Authentication에서 발급한 ID 토큰입니다.

## 공통 요청 파라미터

- **type**: 생성할 결과물의 타입을 지정합니다. 
  - `text`: 텍스트 생성 (모든 AI 모델 공급자 지원)
  - `image`: 이미지 생성 (현재 OpenAI만 지원)
  
  모든 요청에는 반드시 `type` 필드가 포함되어야 합니다. 멀티모달 입력(이미지와 텍스트 함께 입력)은 별도의 type 값이 아닌, 모델명과 입력 데이터 구조로 구분합니다.

## API 엔드포인트

### 1. AI 모델 API 호출

다양한 AI 모델(OpenAI, Google, Anthropic)을 호출하여 텍스트 생성, 이미지 생성 등의 기능을 수행합니다.

#### 1.1. OpenAI 모델 API

##### 요청

```
POST /api/model/openai
```

##### 헤더

```
Content-Type: application/json
Authorization: Bearer {idToken}
```

##### 요청 본문 (텍스트 생성)

```json
{
  "type": "text",
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "시스템 프롬프트"
    },
    {
      "role": "user",
      "content": "사용자 프롬프트"
    }
  ]
}
```

##### 요청 본문 (이미지 생성)

```json
{
  "type": "image",
  "prompt": "이미지 생성을 위한 프롬프트",
  "n": 1,
  "size": "1024x1024"
}
```

> **참고**: 이미지 생성 요청에서 `prompt`, `n`, `size`는 모두 필수 파라미터입니다.

##### 응답 (텍스트 생성)

```json
{
  "success": true,
  "data": {
    "content": "OpenAI API가 생성한 텍스트 내용"
  }
}
```

##### 응답 (이미지 생성)

```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "https://example.com/image.jpg"
      }
    ]
  }
}
```

#### 1.2. Google 모델 API (Gemini)

##### 요청

```
POST /api/model/google
```

##### 헤더

```
Content-Type: application/json
Authorization: Bearer {idToken}
```

##### 요청 본문 (텍스트 생성)

```json
{
  "type": "text",
  "model": "gemini-pro",
  "contents": [
    "사용자 프롬프트"
  ]
}
```

> **참고**: Google Gemini API는 contents 배열의 첫 번째 항목(`contents[0]`)을 직접 모델에 전달합니다. 따라서 단순 문자열을 배열에 담아 전송합니다.

##### 요청 본문 (멀티모달 입력을 통한 텍스트 생성)

```json
{
  "type": "text",
  "model": "gemini-pro-vision",
  "contents": [
    "이미지에 대해 설명해주세요",
    {
      "inlineData": {
        "data": "BASE64_ENCODED_IMAGE_DATA",
        "mimeType": "image/jpeg"
      }
    }
  ]
}
```

> **참고**: 멀티모달 입력의 경우 텍스트와 이미지 데이터를 배열 형태로 함께 전달합니다. 이미지는 Base64로 인코딩된 데이터여야 합니다.

##### 응답 (텍스트 생성)

```json
{
  "success": true,
  "data": {
    "content": "Google Gemini API가 생성한 텍스트 내용"
  }
}
```

#### 1.3. Anthropic 모델 API (Claude)

##### 요청

```
POST /api/model/anthropic
```

##### 헤더

```
Content-Type: application/json
Authorization: Bearer {idToken}
```

##### 요청 본문 (텍스트 생성)

```json
{
  "type": "text",
  "model": "claude-3-opus-20240229",
  "messages": [
    {
      "role": "user",
      "content": "사용자 프롬프트"
    }
  ],
  "max_tokens": 2048,
  "temperature": 0.7
}
```

> **참고**: Claude API 요청에서 `model`, `messages`, `max_tokens`, `temperature`는 모두 필수 파라미터입니다.

##### 요청 본문 (멀티모달 입력을 통한 텍스트 생성)

```json
{
  "type": "text",
  "model": "claude-3-opus-20240229",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "이 이미지에 대해 설명해주세요"
        },
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": "BASE64_ENCODED_IMAGE_DATA"
          }
        }
      ]
    }
  ],
  "max_tokens": 2048,
  "temperature": 0.7
}
```

##### 응답 (텍스트 생성)

```json
{
  "success": true,
  "data": {
    "content": "Anthropic Claude API가 생성한 텍스트 내용"
  }
}
```

### 2. OpenAI API 호출 (사용 중단 예정)

> **주의**: 이 엔드포인트는 사용 중단 예정(deprecated)입니다. 새로운 `/api/model/openai` 엔드포인트를 사용하세요.

OpenAI API를 통해 텍스트 생성, 이미지 생성 등의 기능을 수행합니다.

#### 요청

```
POST /api/openai
```

#### 헤더

```
Content-Type: application/json
Authorization: Bearer {idToken}
```

#### 요청 본문 (텍스트 생성)

```json
{
  "type": "text",
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "시스템 프롬프트"
    },
    {
      "role": "user",
      "content": "사용자 프롬프트"
    }
  ]
}
```

#### 요청 본문 (이미지 생성)

```json
{
  "type": "image",
  "prompt": "이미지 생성을 위한 프롬프트",
  "n": 1,
  "size": "1024x1024"
}
```

> **참고**: 이미지 생성 요청에서 `prompt`, `n`, `size`는 모두 필수 파라미터입니다.

#### 응답 (텍스트 생성)

```json
{
  "success": true,
  "data": {
    "content": "OpenAI API가 생성한 텍스트 내용"
  }
}
```

#### 응답 (이미지 생성)

```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "https://example.com/image.jpg"
      }
    ]
  }
}
```

> **참고**: OpenAI API를 통해 생성된 이미지 URL은 생성 후 **24시간** 동안만 유효합니다. 이 시간이 지나면 URL에 접근할 수 없으며 이미지는 자동으로 삭제됩니다. 장기 보관이 필요한 경우 생성된 이미지를 다운로드하여 `/api/storage/upload` 엔드포인트를 통해 GCS에 업로드해야 합니다.

### 3. GCS에 파일 업로드

HTML 파일 등을 Google Cloud Storage에 업로드합니다.

#### 요청

```
POST /api/storage/upload
```

#### 헤더

```
Content-Type: application/json
Authorization: Bearer {idToken}
```

#### 요청 본문

```json
{
  "content": "파일 내용(HTML 등)",
  "fileName": "파일명.확장자",
  "contentType": "text/html"
}
```

#### 매개변수 설명

- `content`: 업로드할 파일 내용(Base64 인코딩 등) (필수)
- `fileName`: 저장할 파일명 (필수)
- `contentType`: 파일의 MIME 타입 (필수)

#### 응답

```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/bucket-name/output/user-id/filename.html",
    "fileName": "filename.html"
  }
}
```

#### 응답 필드 설명

- `url`: 파일에 접근 가능한 공개 URL
- `fileName`: 저장된 파일명

#### 참고사항

- 모든 파일은 공개 버킷에 저장되며, 인증 없이 접근 가능한 공개 URL로 제공됩니다.
- URL 형식: `https://storage.googleapis.com/버킷명/파일경로`

### 4. URL에서 이미지 다운로드 및 GCS에 업로드

URL에서 이미지를 다운로드하여 Google Cloud Storage에 업로드합니다. 이 엔드포인트는 CORS 문제를 우회하여 OpenAI API 등에서 제공하는 이미지 URL을 직접 처리할 수 있습니다.

#### 요청

```
POST /api/storage/upload-from-url
```

#### 헤더

```
Content-Type: application/json
Authorization: Bearer {idToken}
```

#### 요청 본문

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "fileName": "image.jpg",
  "contentType": "image/jpeg"
}
```

#### 매개변수 설명

- `imageUrl`: 다운로드할 이미지 URL (필수)
- `fileName`: 저장할 파일명 (필수)
- `contentType`: 파일의 MIME 타입 (필수)

#### 응답

```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/bucket-name/output/user-id/image.jpg",
    "fileName": "image.jpg"
  }
}
```

#### 오류 코드

- `INVALID_URL`: 유효하지 않은 URL 형식
- `URL_UPLOAD_ERROR`: 서버 내부 오류
- `IMAGE_DOWNLOAD_FAILED`: 이미지 다운로드 실패
- `CONTENT_TOO_LARGE`: 이미지 크기가 최대 허용 크기를 초과
- `STORAGE_UPLOAD_ERROR`: 파일 업로드 중 오류

### 5. 사용량 확인

현재 사용자의 API 호출 사용량을 확인합니다.

#### 요청

```
GET /api/usage
```

#### 헤더

```
Authorization: Bearer {idToken}
```

#### 응답

```json
{
  "success": true,
  "data": {
    "used": 45,
    "limit": 100,
    "remaining": 55
  }
}
```

## 오류 응답

API 호출 중 오류가 발생하면 다음과 같은 형식의 응답이 반환됩니다:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "오류 메시지"
  }
}
```

### 오류 코드

- `UNAUTHORIZED`: 인증 오류
- `INVALID_TOKEN`: 유효하지 않은 인증 토큰
- `QUOTA_EXCEEDED`: 사용량 한도 초과
- `INVALID_REQUEST`: 잘못된 요청
- `INVALID_URL`: 유효하지 않은 URL 형식
- `UNSUPPORTED_TYPE`: 지원하지 않는 요청 타입
- `CONTENT_TOO_LARGE`: 파일 크기 제한 초과
- `REQUEST_TIMEOUT`: 요청 처리 시간 초과
- `OPENAI_ERROR`: OpenAI API 오류
- `STORAGE_ERROR`: 파일 저장 오류
- `STORAGE_UPLOAD_ERROR`: 파일 업로드 중 오류
- `URL_UPLOAD_ERROR`: URL에서 파일 업로드 중 오류
- `IMAGE_DOWNLOAD_FAILED`: 이미지 다운로드 실패
- `SERVER_ERROR`: 서버 내부 오류

### 보안 고려사항
- 모든 요청은 Firebase Authentication을 통해 인증되어야 합니다.
- 사용자는 자신의 데이터만 접근할 수 있습니다.
- 파일은 사용자별 폴더에 저장되며, 사용자는 다른 사용자의 파일에 접근할 수 없습니다.

## 사용량 제한

- 각 사용자는 월 10,000 크레딧의 API 사용 한도가 있습니다.
- 크레딧 계산 방법:
  - 텍스트 생성: 토큰 수 기준 (100토큰당 1 크레딧, 최소 10 크레딧)
    - 토큰 계산: 영문 기준 약 4자당 1토큰, 한글은 약 1.5자당 1토큰으로 추정
    - 예시: 1,000자 영문 텍스트는 약 250토큰으로 추정되어 3 크레딧 소모
  - 이미지 생성: 이미지 크기와 수량에 따라 계산
    - 1024x1024: 이미지당 100 크레딧
    - 512x512: 이미지당 50 크레딧
    - 256x256: 이미지당 25 크레딧
  - 스토리지 업로드: 파일 크기 기준 (100KB당 1 크레딧, 최소 5 크레딧)

## 추가 제한사항

### 요청 크기 제한
- JSON 요청 본문 최대 크기: **100KB** (Express 미들웨어 레벨에서 제한)
- `/api/storage/upload`의 파일 내용(content) 최대 크기: **10MB**

### 응답 시간 제한
- 텍스트 생성: 최대 50초
- 이미지 생성: 최대 30초

응답 시간이 초과되면 `REQUEST_TIMEOUT` 오류가 반환됩니다.

## 구현 참고사항

### 토큰 계산 방식
API 사용량 계산에 사용되는 토큰 추정 함수는 OpenAI의 실제 토큰 계산 방식과 다를 수 있습니다. 이 함수는 대략적인 추정을 제공하며, 실제 과금과 차이가 있을 수 있습니다.

### 타임아웃 처리
모든 API 요청은 유형에 따라 다른 타임아웃이 적용됩니다. 타임아웃이 발생하면 응답 받을 때까지 기다리지 않고 즉시 오류가 반환됩니다.

### 에러 처리 전략
클라이언트는 다음과 같은 에러 처리 전략을 구현하는 것이 좋습니다:
1. `QUOTA_EXCEEDED` 에러 발생 시 사용자에게 한도 초과 알림
2. `REQUEST_TIMEOUT` 발생 시 요청 단순화 후 재시도 안내
3. 네트워크 오류 발생 시 자동 재시도 로직 구현 (최대 3회)