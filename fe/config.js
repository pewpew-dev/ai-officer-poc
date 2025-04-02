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
        openai: "/api/openai",
        storage: "/api/storage/upload",
        usage: "/api/usage"
    }
};

// 로컬 스토리지 키 상수
export const LOCAL_STORAGE_KEYS = {
    STEP1: 'ai-website-generator-step1',
    STEP2: 'ai-website-generator-step2',
    STEP3: 'ai-website-generator-step3',
    STEP4: 'ai-website-generator-step4',
    STEP5: 'ai-website-generator-step5'
};

/**
 * 프롬프트 템플릿 설정
 * 수정이 필요한 경우 이 부분만 변경하세요.
 */
export const promptTemplates = {
    // 1단계: 웹사이트 기획 및 디자인 템플릿
    planner_ai: {
        /**
         * 시스템 프롬프트: 웹사이트 기획 및 디자인 전문가에게 요청하는 내용
         */
        system_prompt: "당신은 웹사이트 기획 및 디자인 전문가입니다. 사용자가 제공한 간단한 웹사이트 설명을 바탕으로 구체적인 기획서와 디자인 요구사항을 작성해주세요. 결과물은 JSON 형식의 두 부분으로 나누어 제공하세요: 1) '기획서' - 웹사이트의 목적, 타겟 사용자, 주요 기능, 콘텐츠 구성, 페이지 섹션 등을 포함한 상세 기획, 2) '디자인_요구사항' - 색상 스키마, 타이포그래피, 레이아웃 스타일, 이미지 스타일, UI 요소 등에 관한 디자인 가이드라인. 응답은 반드시 JSON 형식으로 제공하며, 키는 '기획서'와 '디자인_요구사항'입니다.",
        /**
         * 사용자 프롬프트 템플릿: 사용자 입력을 포함하는 템플릿
         */
        user_prompt_template: "다음은 사용자가 원하는 웹사이트에 대한 간단한 설명입니다: \"{user_description}\". 이 설명을 바탕으로 구체적인 웹사이트 기획서와 디자인 요구사항을 JSON 형식으로 작성해주세요."
    },
    
    // 2단계: 프롬프트 생성 템플릿
    prompt_generator_ai: {
        /**
         * 시스템 프롬프트: 프롬프트 생성 전문가에게 요청하는 내용
         */
        system_prompt: "당신은 프롬프트 생성 전문가입니다. 사용자가 제공한 웹사이트 기획서와 디자인 요구사항을 바탕으로 두 가지 프롬프트를 생성해야 합니다: 1) DALL-E 3를 위한 이미지 생성 프롬프트, 2) GPT-4o를 위한 HTML 코드 생성 프롬프트. 두 프롬프트는 일관된 웹사이트를 생성하는 데 사용됩니다. \n\n중요: DALL-E 프롬프트는 1000자 제한이 있습니다. 모든 추가 텍스트를 포함하여 전체 프롬프트 길이가 1000자를 초과하면 API에서 오류가 발생합니다. 따라서 DALL-E 프롬프트는 간결하게 작성해주시고, 최대 800자 이내로 유지해주세요.\n\n반드시 JSON 형식으로 응답해주세요. 다음 형식을 사용하세요: {\"dalle_prompt\": \"DALL-E 프롬프트 내용...\", \"gpt4o_prompt\": \"GPT-4o 프롬프트 내용...\"}",
        /**
         * 사용자 프롬프트 템플릿: 기획서와 디자인 요구사항을 포함하는 템플릿
         */
        user_prompt_template: "다음은 웹사이트를 위한 기획서와 디자인 요구사항입니다:\n\n기획서: {planning_doc}\n\n디자인 요구사항: {design_requirements}\n\n이 정보를 바탕으로 다음 두 가지 프롬프트를 생성해주세요:\n\n1. DALL-E 3를 위한 이미지 생성 프롬프트: 헤더 배너 이미지 1개, 히어로 섹션 배경 이미지 1개, 콘텐츠 섹션 이미지 3개를 생성하는 프롬프트. 모든 이미지는 1024x1024 크기여야 합니다.\n\n2. GPT-4o를 위한 HTML 코드 생성 프롬프트: DALL-E 3가 생성한 이미지를 사용하여 단일 HTML 파일로 정적 SPA 웹사이트를 생성하는 프롬프트. 인라인 CSS 스타일링, 반응형 디자인, 부드러운 스크롤링을 포함하세요. 특히 단순 모바일 환경 기준으로 작성 후 확대하는 것이 아니라, 일정 크기 이상에서는 pc 혹은 태블릿을 대상으로 하여 별도로 디자인 해 주세요. DALL-E 3가 생성한 이미지의 URL을 플레이스홀더(예: \"header_image_url\", \"hero_image_url\", \"content_image_1_url\" 등)로 사용하세요.\n\n반드시 JSON 형식으로 응답해주세요. 응답은 {\"dalle_prompt\": \"...\", \"gpt4o_prompt\": \"...\"}의 형식이어야 합니다."
    },
    
    // 3단계: DALL-E 이미지 생성 템플릿
    dalle_template: {
        /**
         * 시스템 프롬프트: DALL-E 3 이미지 생성을 위한 프롬프트
         */
        system_prompt: "당신은 DALL-E 3 이미지 생성을 위한 프롬프트를 해석하는 AI입니다. 주어진 프롬프트에 따라 웹사이트를 위한 이미지들을 생성합니다.",
        /**
         * 사용자 프롬프트 템플릿: DALL-E 프롬프트를 포함하는 템플릿
         */
        user_prompt_template: "{dalle_prompt}"
    },
    
    // 4단계: GPT-4o HTML 코드 생성 템플릿
    gpt4o_template: {
        /**
         * 시스템 프롬프트: GPT-4o를 위한 HTML 코드 생성 프롬프트
         */
        system_prompt: "당신은 전문 웹 개발자이자 UI/UX 디자이너입니다. 사용자가 제공한 웹사이트 기획서와 디자인 요구사항을 바탕으로 단일 HTML 파일에 HTML, CSS, JavaScript를 포함한 정적 웹페이지를 생성하세요. 반드시 제공된 이미지 URL을 사용하여 웹사이트를 구현해야 합니다. 중요: 반드시 JSON 형식으로 응답해주세요. 다음 형식을 사용하세요: {\"html_code\": \"HTML 코드 내용...\"}",
        /**
         * 사용자 프롬프트 템플릿: HTML 코드 생성 프롬프트를 포함하는 템플릿
         */
        user_prompt_template: "{html_generation_prompt}\n\n반드시 JSON 형식으로 응답해주세요. 응답은 {\"html_code\": \"...\"}의 형식이어야 합니다."
    }
};
