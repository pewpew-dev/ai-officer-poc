/**
 * 애플리케이션 설정 파일
 * 환경별 설정값 및 API 키 관리를 위한 파일입니다.
 */

// 환경 설정 임포트
import { ENV } from './env-config.js';

// Firebase 설정
export const firebaseConfig = {
    apiKey: ENV.FIREBASE_API_KEY,
    authDomain: ENV.FIREBASE_AUTH_DOMAIN, 
    projectId: ENV.FIREBASE_PROJECT_ID
};

// API 엔드포인트 설정
export const apiEndpoints = {
    backend: {
        base: ENV.BACKEND_API_URL,
        openai: "/api/model/openai",
        google: "/api/model/google", 
        anthropic: "/api/model/anthropic",
        storage: "/api/storage/upload",
        usage: "/api/usage"
    }
};

// 모델 설정
export const modelSettings = [
    // OpenAI 모델
    { provider: 'openai', name: 'gpt-4o', type: 'text', recommended: true },
    { provider: 'openai', name: 'gpt-4-turbo', type: 'text' },
    { provider: 'openai', name: 'gpt-3.5-turbo', type: 'text' },
    { provider: 'openai', name: 'dall-e-3', type: 'image', recommended: true, default: true },
    { provider: 'openai', name: 'dall-e-2', type: 'image' },
    
    // Google 모델
    { provider: 'google', name: 'gemini-1.5-pro', type: 'text', recommended: true, default: true },
    { provider: 'google', name: 'gemini-1.5-flash', type: 'text' },
    { provider: 'google', name: 'gemini-1.0-pro', type: 'text' },
    
    // Anthropic 모델
    { provider: 'anthropic', name: 'claude-3-opus-20240229', type: 'text' },
    { provider: 'anthropic', name: 'claude-3-sonnet-20240229', type: 'text' },
    { provider: 'anthropic', name: 'claude-3-haiku-20240307', type: 'text', recommended: true }
];

// 로컬 스토리지 키 상수
export const LOCAL_STORAGE_KEYS = {
    auth : 'flowbang-auth', // 유저의 인증 정보 (idToken)
    idea : 'flowbang-idea', // 유저의 아이디어
    planning : 'flowbang-planning', // ai를 통해 생성된 기획안
    code : 'flowbang-code', // ai를 통해 생성된 코드
    image : 'flowbang-image', // 코드에 사용될 이미지 (키 : 플레이스홀더, 값 : url)
    library : 'flowbang-library', // 이미지 라이브러리
};

export const PROMPT_TEMPLATES = {
    planner_ai : {
        system_prompt : `당신은 프로페셔널한 웹 기획자이자 UX/UI 디자이너로, 클라이언트의 아이디어를 포괄적이고 상세한 웹사이트 기획서로 변환하는 전문가입니다.`,
        user_prompt_template: `다음 아이디어를 바탕으로 프로페셔널한 웹사이트 기획서와 디자인 요구사항을 작성해주세요:

[{user_description}]

응답은 마크다운 형식으로 제공해주시고, "## 웹사이트 기획서"와 "## 디자인 요구사항" 두 개의 주요 섹션으로 나누어 상세하게 작성해주세요. 
이 기획서는 다음 단계에서 이미지 생성과 HTML 코드 생성을 위한 중요한 기초 자료로 사용되므로, 구체적이고 명확한 지침을 포함해야 합니다.`
    },
    generator_ai : {
        system_prompt : `당신은 세계적인 수준의 웹 개발자이자 UI/UX 디자이너입니다. 주어진 웹사이트 기획서와 디자인 요구사항을 바탕으로 완전한 웹사이트를 직접 구현할 수 있습니다. 또한 참고 웹사이트의 디자인과 레이아웃을 분석하여 유사한 느낌의 사이트를 구현할 수 있습니다.`,
        user_prompt_template: `다음 웹사이트 기획서와 디자인 요구사항을 바탕으로 완성된, 단일 HTML 파일의 웹사이트를 생성해주세요:

### 참고 웹사이트 : 
[{reference_website}]
위 웹사이트의 디자인, 레이아웃, UX 패턴, 색상 구성 등을 분석하여 유사한 느낌의 사이트를 생성해주세요. 완전히 동일한 복제가 아닌, 참고 사이트의 전체적인 디자인 스타일과 사용자 경험을 반영한 새로운 사이트를 만들어주세요.

### 웹사이트 기획서:
[{planning_doc}]

### 디자인 요구사항:
[{design_requirements}]

다음 개발 지침을 따라주세요:

1. 이미지 플레이스홀더 사용: 
   - 이미지는 플레이스홀더로 처리하고, 이미지에 대한 설명과 함께 추천 URL을 제공해주세요.
   - 이미지는 유사한 다른 이미지로 대체할 수 있게 500자 내외의 충분한 설명을 곁들여주세요.
   - 이미지 플레이스홀더는 반드시 대문자와 언더스코어만 사용하여 "HEADER_IMAGE", "HERO_IMAGE", "CONTENT_IMAGE_1" 등의 형태로 지정해주세요.
   - HTML 내에서는 <img src="HEADER_IMAGE"> 같은 형태로 사용하세요.
   - 가능하면 참고 웹사이트의 이미지 사용 패턴과 유사하게 배치해주세요.

2. 코드 요구사항:
   - 단일 HTML 파일로 모든 HTML, CSS, JavaScript를 포함해야 합니다.
   - 인라인 스타일과 스크립트를 사용하세요.
   - 반응형으로 모바일, 태블릿, 데스크탑을 모두 지원해야 합니다.
   - CDN을 통해 부트스트랩, Tailwind, Font Awesome 등 필요한 라이브러리를 로드할 수 있습니다.
   - 접근성 지침(WCAG)을 준수하세요.
   - 기획서에 자세히 명시되지 않은 부분은 참고 사이트를 바탕으로 임의 생성하여 풍성한 사이트를 만들어 주세요.

3. 최적화:
   - 빠른 로딩 시간을 위해 코드를 최적화하세요.
   - 사용자 경험을 향상시키는 애니메이션과 트랜지션을 적절히 사용하세요.

4. 추가 지침:
   - 모든 텍스트 콘텐츠는 기획서를 바탕으로 생성하세요.
   - 디자인 요구사항에 명시된 색상 팔레트, 폰트, 스타일을 정확히 따라주세요.
   - 모든 링크와 버튼이 적절한 상호작용 효과를 가지도록 하세요.
   - 코드 내 주석을 사용하여 섹션을 명확히 구분하세요.
   - 디자인이나 레이아웃은 구체적인 지침이 없다면 최대한 참고 웹사이트와 유사한 느낌을 내도록 하세요.
   - 참고 웹사이트와 유사한 컴포넌트 구성, 여백, 정렬, 타이포그래피 등을 적용하세요.

5. 응답 형식:
   - JSON 형식으로 응답해주세요. JSON에는 두 개의 최상위 속성이 있어야 합니다:
     1) html_code: HTML 코드 전체를 포함하는 문자열
     2) images: 이미지 정보 객체 배열 (각 객체는 key, url, desc 속성 포함)

   - comment : 기타 코멘트가 필요한 경우 여기 작성하세요. 이외의 곳에는 절대 코멘트 등을 작성하지 마세요.
   - html_code: HTML 파일 전체 내용
   - images: 배열 형태로 각 이미지 정보 포함
     - key: 이미지 플레이스홀더 식별자 (예: "HEADER_IMAGE")
     - url: 추천 이미지 URL
     - desc: 이미지 설명

추천 이미지 URL은 Unsplash, Pexels, Pixabay 등의 무료 이미지 사이트에서 제공하는 적합한 이미지를 추천해주세요. 모든 이미지는 저작권에 문제가 없어야 합니다.

웹사이트 코드는 즉시 브라우저에서 실행 가능해야 하며, 모든 기능이 정상적으로 작동해야 합니다.`
    },
    improvement_ai : {
        system_prompt: `당신은 경험이 풍부한 웹 개발자이자 UI/UX 개선 전문가입니다. 
    기존 웹사이트를 사용자의 요구사항에 맞게 개선하는 역할을 수행합니다. 
    HTML, CSS, JavaScript를 능숙하게 다루며, 사용자 경험과 디자인 측면에서 최고의 솔루션을 제공합니다.
    기존 코드를 세심하게 분석하고 사용자 피드백에 기반하여 필요한 개선사항을 구현하세요.
    
    중요: 응답은 항상 순수한 JSON 객체만 반환해야 합니다. 마크다운 코드 블록(\`\`\`)이나 설명 텍스트를 포함하지 마세요.`,
    
        user_prompt_template: `현재 웹사이트를 사용자 요구사항에 맞게 개선해주세요. 다음은 관련 정보입니다:
    
    ### 원래 기획서
    [{planning_doc}]

    ## 원래 디자인 요구사항
    [{design_requirements}]
    
    ### 현재 HTML 코드
    \`\`\`html
    {current_html_code}
    \`\`\`
    
    ### 참고 웹사이트 (있는 경우)
    [{reference_website}]
    
    ### 사용자 개선 요구사항
    [{improvement_request}]
    
    다음 개발 지침을 따라주세요:

    0. 가장 중요한 것
       - 이 항목의 내용은 반드시 준수하세요.
       - 사용자 개선 요구사항은 반드시 엄수되어야 하는 최우선 과제입니다.
       - 우선순위는 사용자 요구사항 > 기존 기능 유지 > 참고 웹사이트 > 기획, 디자인안 순입니다.
       - 별도 요구사항이 없는 경우 기존의 기능이나 데이터가 유실되어서는 안됩니다.
       - 응답 형식을 반드시 준수해주세요.
    
    1. 이미지 처리
       - 기존 이미지 플레이스홀더 유지: 'HEADER_IMAGE'와 같은 기존 형식을 그대로 유지하세요.
       - 새 이미지가 필요한 경우: 대문자와 언더스코어만 사용하여 "NEW_IMAGE_1"과 같은 형식으로 지정하세요.
       - 이미지는 유사한 다른 이미지로 대체할 수 있게 500자 내외의 충분한 설명을 곁들여주세요.
       - 이미지 변경 시 설명 추가: 변경된 이미지에 대한 상세한 설명을 제공하세요.
    
    2. 코드 유지 지침
       - 단일 HTML 파일로 모든 HTML, CSS, JavaScript를 포함해야 합니다.
       - 인라인 스타일과 스크립트를 사용하세요.
       - 반응형으로 모바일, 태블릿, 데스크탑을 모두 지원해야 합니다.
       - CDN을 통해 부트스트랩, Tailwind, Font Awesome 등 필요한 라이브러리를 로드할 수 있습니다.
       - 접근성 지침(WCAG)을 준수하세요.
       - 기존 라이브러리와 CDN 링크를 유지하세요.
    
    3. 반응형 디자인
       - 모바일, 태블릿, 데스크탑 화면 모두 지원하도록 변경사항을 구현하세요.
       - 기존 반응형 브레이크포인트를 유지하세요.
    
    4. 접근성과 성능
       - WCAG 접근성 지침을 준수하세요.
       - 성능 최적화를 고려하세요.
    
    5. 응답 형식
       - 순수한 JSON 형식으로만 응답하세요. 마크다운 코드 블록(\`\`\`)이나 설명 텍스트를 포함하지 마세요.
       - JSON에는 최소 두 개의 최상위 속성이 있어야 합니다:
          a) html_code: HTML 코드 전체를 포함하는 문자열
          b) images: 이미지 정보 객체 배열 (각 객체는 key, url, desc 속성 포함)
       - 선택적으로 세 번째 속성을 포함할 수 있습니다:
          c) changes: 구현한 변경 사항 목록 (문자열 또는 문자열 배열)

    JSON 응답 예시:
    {
      "html_code": "<html>...</html>",
      "images": [
        {
          "key": "HEADER_IMAGE",
          "url": "https://example.com/image.jpg",
          "desc": "설명..."
        }
      ],
      "changes": [
        "헤더 섹션 디자인 개선",
        "모바일 반응형 레이아웃 수정"
      ],
      "comment" : "기타 코멘트가 필요한 경우 여기 작성하세요. 이외의 곳에는 절대 코멘트 등을 작성하지 마세요."
    }

추천 이미지 URL은 Unsplash, Pexels, Pixabay 등의 무료 이미지 사이트에서 제공하는 적합한 이미지를 추천해주세요. 모든 이미지는 저작권에 문제가 없어야 합니다.

웹사이트 코드는 즉시 브라우저에서 실행 가능해야 하며, 모든 기능이 정상적으로 작동해야 합니다.

중요: 응답은, 위의 예시처럼 순수한 JSON 객체만 제공하세요. 마크다운 형식이나 \`\`\`json 코드 블록 없이 그냥 JSON을 직접 반환하세요.`
    },
    artist_ai_create: {
        system_prompt: `당신은 전문적인 디지털 아티스트로, 사용자의 요청에 따라 고품질의 이미지를 생성하는 전문가입니다. 웹사이트용 이미지를 생성하기 위한 자세한 프롬프트를 작성할 수 있으며, 다양한 스타일과 주제에 능숙합니다.`,
        
        user_prompt_template: `고품질 웹사이트용 이미지: [{image_description}]

이미지 요구사항:
- 선명하고 고해상도
- 텍스트 없음
- 전문적인 느낌의 디자인
- 웹사이트에 적합한 16:9 비율
- 깨끗하고 단정한 구도`
    },
    artist_ai_search: {
        system_prompt: `당신은 웹사이트 디자인을 위한 이미지를 검색하는 전문가입니다. 사용자의 요청에 따라 웹에서 무료로 사용 가능한 최적의 이미지를 찾아주는 역할을 합니다. 저작권, 이미지 품질, 웹사이트 맥락에 적합성 등을 종합적으로 고려할 수 있습니다.`,
        
        user_prompt_template: `다음 설명에 맞는 웹사이트용 이미지를 검색해 주세요:

[{image_description}]

검색 요구사항:
1. 모든 이미지는 반드시 무료로 사용 가능한 것이어야 합니다(CC0, Public Domain, 또는 상업적 사용 허가된 라이센스).
2. 가능한 Unsplash, Pexels, Pixabay 등의 신뢰할 수 있는 무료 이미지 사이트에서 검색해 주세요.
3. 높은 해상도(최소 1600px 이상)와 전문적인 품질의 이미지를 선택해 주세요.
4. 웹사이트의 컨텍스트에 맞는 이미지를 선택해 주세요.
5. 가능하면 5개이내에서 최대한 많은 옵션을 제공해 주세요.

각 이미지에 대해 다음 정보의 배열을 JSON 형식으로 제공해 주세요:
1. url: 이미지 직접 링크
2. source_url: 이미지 출처 페이지 링크
3. alt_text: 이미지에 대한 적절한 대체 텍스트
4. desc: 이미지에 대한 간략한 설명
5. license: 이미지 라이센스 정보
6. attribution: 필요한 경우 저작자 표시 정보

사용자의 설명에 가장 적합한 이미지를 찾고, 웹사이트에 바로 사용할 수 있는 형태로 정보를 제공해 주세요.`
    }
};
