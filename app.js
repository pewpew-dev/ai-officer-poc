/**
 * 프롬프트 템플릿 설정
 * 수정이 필요한 경우 이 부분만 변경하세요.
 */
const promptTemplates = {
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
        system_prompt: "당신은 프롬프트 생성 전문가입니다. 사용자가 제공한 웹사이트 기획서와 디자인 요구사항을 바탕으로 두 가지 프롬프트를 생성해야 합니다: 1) DALL-E 3를 위한 이미지 생성 프롬프트, 2) GPT-4o를 위한 HTML 코드 생성 프롬프트. 두 프롬프트는 일관된 웹사이트를 생성하는 데 사용됩니다. 중요: 반드시 JSON 형식으로 응답해주세요. 다음 형식을 사용하세요: {\"dalle_prompt\": \"DALL-E 프롬프트 내용...\", \"gpt4o_prompt\": \"GPT-4o 프롬프트 내용...\"}",
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

// 클라우드 스토리지 관련 설정
const cloudStorageConfig = {
    // GCS Signed URL 방식 설정
    signedUrl: {
        endpoint: "https://your-cloud-function-url/getSignedUrl", // Cloud Function URL로 대체 필요
        bucket: "your-gcs-bucket-name", // GCS 버킷 이름으로 대체 필요
        publicUrlBase: "https://storage.googleapis.com/your-gcs-bucket-name" // 버킷 이름 대체 필요
    },
    
    // Firebase Storage 설정
    firebase: {
        apiKey: "", // 실제 Firebase API 키로 대체 필요
        authDomain: "", // 실제 값으로 대체 필요
        projectId: "", // 실제 값으로 대체 필요
        storageBucket: "", // 실제 값으로 대체 필요
        messagingSenderId: "", // 실제 값으로 대체 필요
        appId: "" // 실제 값으로 대체 필요
    },
    
    // GCS 서비스 계정 키 직접 사용 설정
    serviceAccount: {
        projectId: "", // 프로젝트 ID로 대체 필요
        bucket: "your-gcs-bucket-name", // GCS 버킷 이름으로 대체 필요
        clientEmail: "", // 서비스 계정 이메일로 대체 필요
        privateKey: "", // 서비스 계정 비공개 키로 대체 필요 (보안 위험 주의!)
        publicUrlBase: "https://storage.googleapis.com/your-gcs-bucket-name" // 버킷 이름 대체 필요
    }
};

// API 키 관리
let apiKey = '';

// 이미지 URL 저장 
let imageUrls = {
    header: '',
    hero: '',
    content1: '',
    content2: '',
    content3: ''
};

// 프롬프트 저장
let prompts = {
    dalle: '',
    gpt4o: ''
};

// 기획 및 디자인 문서
let planningDoc = '';

// 각 단계의 결과를 저장할 메모리 객체
const stepsMemory = {
    step1: null, // 1단계: 웹사이트 아이디어
    step2: null, // 2단계: 기획 및 디자인 요구사항
    step3: null, // 3단계: 프롬프트 생성
    step4: null, // 4단계: 이미지 생성
    step5: null  // 5단계: HTML 코드 생성
};

// 로컬 스토리지 키
const LOCAL_STORAGE_KEYS = {
    STEP1: 'ai-website-generator-step1',
    STEP2: 'ai-website-generator-step2', 
    STEP3: 'ai-website-generator-step3',
    STEP4: 'ai-website-generator-step4',
    STEP5: 'ai-website-generator-step5'
};

// 로컬 스토리지에 단계 데이터 저장
function saveStepToLocalStorage(stepNumber, data) {
    try {
        const key = LOCAL_STORAGE_KEYS[`STEP${stepNumber}`];
        localStorage.setItem(key, JSON.stringify(data));
        // 메모리 객체도 업데이트
        stepsMemory[`step${stepNumber}`] = data;
    } catch (error) {
        console.error('로컬 스토리지 저장 오류:', error);
    }
}

// 로컬 스토리지에서 단계 데이터 로드
function loadStepFromLocalStorage(stepNumber) {
    try {
        const key = LOCAL_STORAGE_KEYS[`STEP${stepNumber}`];
        const data = localStorage.getItem(key);
        
        if (data) {
            // 메모리 객체 업데이트
            stepsMemory[`step${stepNumber}`] = JSON.parse(data);
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('로컬 스토리지 로드 오류:', error);
        return null;
    }
}

// 모든 단계 데이터 로드
function loadAllStepsFromLocalStorage() {
    for (let i = 1; i <= 5; i++) {
        loadStepFromLocalStorage(i);
    }
}

// 단계 데이터가 있는지 확인하는 함수
function checkStepData(stepNumber) {
    try {
        const key = LOCAL_STORAGE_KEYS[`STEP${stepNumber}`];
        return !!localStorage.getItem(key);
    } catch (error) {
        console.error('로컬 스토리지 확인 오류:', error);
        // 로컬 스토리지에 접근할 수 없는 경우 메모리 객체 확인
        return !!stepsMemory[`step${stepNumber}`];
    }
}

// 특정 단계의 메모리 존재 여부 확인
function checkStepMemory(stepNumber) {
    return checkStepData(stepNumber);
}

// DOM 요소
const apiKeyInput = document.getElementById('api-key');
const saveApiKeyBtn = document.getElementById('save-api-key');
const generatePlanningBtn = document.getElementById('generate-planning');
const generatePromptsBtn = document.getElementById('generate-prompts');
const generateImagesBtn = document.getElementById('generate-images');
const generateFinalCodeBtn = document.getElementById('generate-final-code');
const backToIdeaBtn = document.getElementById('back-to-idea');
const backToPlanningBtn = document.getElementById('back-to-planning');
const backToPromptsBtn = document.getElementById('back-to-prompts');
const backToImagesBtn = document.getElementById('back-to-images');
const copyCodeBtn = document.getElementById('copy-code');
const downloadCodeBtn = document.getElementById('download-code');
const ideaInput = document.getElementById('idea-input');
const planningOutput = document.getElementById('planning-output');
const planningEditor = document.getElementById('planning-editor');
const dallePromptOutput = document.getElementById('dalle-prompt');
const dallePromptEditor = document.getElementById('dalle-prompt-editor');
const gpt4oPromptOutput = document.getElementById('gpt4o-prompt');
const gpt4oPromptEditor = document.getElementById('gpt4o-prompt-editor');
const headerImage = document.getElementById('header-image');
const heroImage = document.getElementById('hero-image');
const contentImage1 = document.getElementById('content-image-1');
const contentImage2 = document.getElementById('content-image-2');
const contentImage3 = document.getElementById('content-image-3');
const generatedCode = document.getElementById('generated-code');
const previewFrame = document.getElementById('preview-frame');
const loadingIndicator = document.getElementById('loading-indicator');

// 모든 단계 컨테이너
const stepContainers = document.querySelectorAll('.step-content');

// 앱 초기화
function initApp() {
    // 로컬 스토리지에서 API 키 불러오기
    apiKey = localStorage.getItem('openai-api-key') || '';
    if (apiKey) {
        apiKeyInput.value = '********';
    }

    // 로컬 스토리지에서 단계 데이터 불러오기
    loadAllStepsFromLocalStorage();

    // 이벤트 리스너 등록
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    generatePlanningBtn.addEventListener('click', generatePlanning);
    generatePromptsBtn.addEventListener('click', generatePrompts);
    generateImagesBtn.addEventListener('click', generateImages);
    generateFinalCodeBtn.addEventListener('click', generateFinalCode);
    backToIdeaBtn.addEventListener('click', () => showStep(0));
    backToPlanningBtn.addEventListener('click', () => showStep(1));
    backToPromptsBtn.addEventListener('click', () => showStep(2));
    backToImagesBtn.addEventListener('click', () => showStep(3));
    copyCodeBtn.addEventListener('click', copyCode);
    downloadCodeBtn.addEventListener('click', downloadHtmlFile);
    document.getElementById('apply-planning-edit').addEventListener('click', applyPlanningEdit);
    document.getElementById('apply-dalle-edit').addEventListener('click', applyDalleEdit);
    document.getElementById('apply-gpt4o-edit').addEventListener('click', applyGpt4oEdit);
}

// API 키 저장
function saveApiKey() {
    const newApiKey = apiKeyInput.value.trim();
    if (newApiKey) {
        apiKey = newApiKey;
        localStorage.setItem('openai-api-key', apiKey);
        apiKeyInput.value = '********';
        alert('API 키가 저장되었습니다.');
    } else {
        alert('유효한 API 키를 입력해주세요.');
    }
}

// 단계 표시 함수
function showStep(stepIndex) {
    stepContainers.forEach((container, index) => {
        if (index === stepIndex) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });

    // 진행 단계 아이콘 활성화 상태 업데이트
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
        const circleElement = step.querySelector('div:first-child');
        const textElement = step.querySelector('span');
        
        if (index === stepIndex) {
            circleElement.classList.remove('bg-gray-300');
            circleElement.classList.add('bg-indigo-600');
            circleElement.classList.remove('text-gray-600');
            circleElement.classList.add('text-white');
            textElement.classList.remove('text-gray-500');
            textElement.classList.add('text-indigo-600');
        } else if (index < stepIndex) {
            // 이전 단계는 메모리 존재 여부에 따라 완료 표시
            const hasMemory = checkStepMemory(index + 1);
            
            if (hasMemory) {
                // 메모리가 있으면 녹색(완료)
                circleElement.classList.remove('bg-gray-300');
                circleElement.classList.add('bg-green-500');
                circleElement.classList.remove('text-gray-600');
                circleElement.classList.add('text-white');
                textElement.classList.remove('text-gray-500');
                textElement.classList.add('text-green-500');
            } else {
                // 메모리가 없으면 주황색(주의)
                circleElement.classList.remove('bg-gray-300');
                circleElement.classList.add('bg-yellow-500');
                circleElement.classList.remove('text-gray-600');
                circleElement.classList.add('text-white');
                textElement.classList.remove('text-gray-500');
                textElement.classList.add('text-yellow-500');
            }
        } else {
            // 나중 단계는 비활성화 표시
            circleElement.classList.add('bg-gray-300');
            circleElement.classList.remove('bg-indigo-600', 'bg-green-500', 'bg-yellow-500');
            circleElement.classList.add('text-gray-600');
            circleElement.classList.remove('text-white');
            textElement.classList.add('text-gray-500');
            textElement.classList.remove('text-indigo-600', 'text-green-500', 'text-yellow-500');
        }
    });
    
    // 현재 단계에 따른 뒤로 가기 버튼 상태 설정
    backToIdeaBtn.style.display = stepIndex === 1 ? 'inline-block' : 'none';
    backToPlanningBtn.style.display = stepIndex === 2 ? 'inline-block' : 'none';
    backToPromptsBtn.style.display = stepIndex === 3 ? 'inline-block' : 'none';
    backToImagesBtn.style.display = stepIndex === 4 ? 'inline-block' : 'none';
}

// 1단계: 아이디어에서 기획 및 디자인 생성
async function generatePlanning() {
    const idea = ideaInput.value.trim();
    if (!idea) {
        alert('웹사이트 아이디어를 입력해주세요.');
        return;
    }

    if (!apiKey) {
        alert('OpenAI API 키를 입력해주세요.');
        return;
    }

    showLoading(true);

    try {
        // 템플릿 변수 채우기
        const userPrompt = promptTemplates.planner_ai.user_prompt_template.replace('{user_description}', idea);
        
        const response = await callOpenAI({
            messages: [
                {
                    role: "system",
                    content: promptTemplates.planner_ai.system_prompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ]
        });

        if (response) {
            planningDoc = response;
            planningOutput.innerHTML = marked.parse(response);
            planningEditor.value = response; // 에디터에도 내용 설정
            saveStepToLocalStorage(1, idea);
            showStep(1);
        }
    } catch (error) {
        alert(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// 2단계: 기획안으로부터 프롬프트 생성 (DALL-E 및 GPT-4o 프롬프트)
async function generatePrompts() {
    if (!apiKey) {
        alert('OpenAI API 키를 입력해주세요.');
        return;
    }

    const planning = planningDoc;

    showLoading(true);

    try {
        // JSON 형식의 기획안에서 각 부분 추출 시도
        let planningPart = planning;
        let designRequirementsPart = planning;
        
        try {
            const planningJson = JSON.parse(planning);
            if (planningJson && planningJson.기획서 && planningJson.디자인_요구사항) {
                planningPart = JSON.stringify(planningJson.기획서, null, 2);
                designRequirementsPart = JSON.stringify(planningJson.디자인_요구사항, null, 2);
            }
        } catch (e) {
            console.log('JSON 파싱 실패, 전체 텍스트를 사용합니다:', e);
        }
        
        // JSON 형식으로 응답 요청을 명시
        const systemPrompt = promptTemplates.prompt_generator_ai.system_prompt + 
            "\n중요: 반드시 JSON 형식으로 응답해주세요. 다음 형식을 사용하세요: {\"dalle_prompt\": \"DALL-E 프롬프트 내용...\", \"gpt4o_prompt\": \"GPT-4o 프롬프트 내용...\"}";
            
        // 템플릿 변수 채우기
        const userPrompt = promptTemplates.prompt_generator_ai.user_prompt_template
            .replace('{planning_doc}', planningPart)
            .replace('{design_requirements}', designRequirementsPart) + 
            "\n\n반드시 JSON 형식으로 응답해주세요. 응답은 {\"dalle_prompt\": \"...\", \"gpt4o_prompt\": \"...\"}의 형식이어야 합니다.";

        const response = await callOpenAI({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ]
        });

        if (response) {
            console.log('API 응답:', response);
            
            try {
                // JSON 응답 파싱 시도
                let promptData;
                
                // JSON 부분만 추출 시도
                const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                                response.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    try {
                        promptData = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
                    } catch (e) {
                        console.log('JSON 블록 파싱 실패, 전체 응답 시도:', e);
                        promptData = JSON.parse(response);
                    }
                } else {
                    promptData = JSON.parse(response);
                }
                
                console.log('파싱된 JSON:', promptData);
                
                if (promptData.dalle_prompt) {
                    prompts.dalle = promptData.dalle_prompt;
                    dallePromptOutput.innerHTML = marked.parse(prompts.dalle);
                    dallePromptEditor.value = prompts.dalle;
                    console.log('DALL-E 프롬프트 찾음:', prompts.dalle.substring(0, 100) + '...');
                } else {
                    console.error('DALL-E 프롬프트가 JSON에 없음');
                    dallePromptOutput.innerHTML = "<p>DALL-E 프롬프트를 찾을 수 없습니다.</p>";
                    prompts.dalle = "웹사이트를 위한 시각적으로 매력적인 이미지를 생성해주세요. 1024x1024 해상도의 고품질 이미지가 필요합니다.";
                    dallePromptEditor.value = prompts.dalle;
                }
                
                if (promptData.gpt4o_prompt) {
                    prompts.gpt4o = promptData.gpt4o_prompt;
                    gpt4oPromptOutput.innerHTML = marked.parse(prompts.gpt4o);
                    gpt4oPromptEditor.value = prompts.gpt4o;
                    console.log('GPT-4o 프롬프트 찾음:', prompts.gpt4o.substring(0, 100) + '...');
                } else {
                    console.error('GPT-4o 프롬프트가 JSON에 없음');
                    gpt4oPromptOutput.innerHTML = "<p>GPT-4o 프롬프트를 찾을 수 없습니다.</p>";
                    prompts.gpt4o = "제공된 이미지 URL을 사용하여 단일 HTML 파일로 정적 웹사이트를 생성해주세요. 인라인 CSS 스타일링, 반응형 디자인, 부드러운 스크롤링을 포함하세요. DALL-E 3가 생성한 이미지의 URL을 플레이스홀더(예: \"header_image_url\", \"hero_image_url\", \"content_image_1_url\" 등)로 사용하세요.";
                    gpt4oPromptEditor.value = prompts.gpt4o;
                }
                
            } catch (error) {
                console.error('JSON 파싱 실패:', error, '원본 응답:', response);
                
                // 파싱 실패시 기본값 제공
                dallePromptOutput.innerHTML = "<p>프롬프트 파싱에 실패했습니다. 기본값을 사용합니다.</p>";
                gpt4oPromptOutput.innerHTML = "<p>프롬프트 파싱에 실패했습니다. 기본값을 사용합니다.</p>";
                
                prompts.dalle = "웹사이트를 위한 시각적으로 매력적인 이미지를 생성해주세요. 1024x1024 해상도의 고품질 이미지가 필요합니다.";
                prompts.gpt4o = "제공된 이미지 URL을 사용하여 단일 HTML 파일로 정적 웹사이트를 생성해주세요. 인라인 CSS 스타일링, 반응형 디자인, 부드러운 스크롤링을 포함하세요. DALL-E 3가 생성한 이미지의 URL을 플레이스홀더(예: \"header_image_url\", \"hero_image_url\", \"content_image_1_url\" 등)로 사용하세요.";
                
                dallePromptEditor.value = prompts.dalle;
                gpt4oPromptEditor.value = prompts.gpt4o;
            }
            
            saveStepToLocalStorage(2, {
                planning: planningPart,
                designRequirements: designRequirementsPart
            });
            showStep(2);
        }
    } catch (error) {
        alert(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// 3단계: DALL-E 프롬프트로 이미지 생성
async function generateImages() {
    if (!apiKey) {
        alert('OpenAI API 키를 입력해주세요.');
        return;
    }

    if (!prompts.dalle) {
        alert('DALL-E 프롬프트가 생성되지 않았습니다.');
        return;
    }

    showLoading(true);

    try {
        // 헤더 이미지 생성
        const headerPrompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', 
            prompts.dalle + "\n\n이것은 헤더 배너 이미지입니다.");
        const headerResponse = await callOpenAIImage(headerPrompt, "1024x1024");
        if (headerResponse && headerResponse.data && headerResponse.data.length > 0) {
            imageUrls.header = headerResponse.data[0].url;
            headerImage.src = imageUrls.header;
        }
        
        // 히어로 배경 이미지 생성
        const heroPrompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', 
            prompts.dalle + "\n\n이것은 히어로 섹션 배경 이미지입니다.");
        const heroResponse = await callOpenAIImage(heroPrompt, "1024x1024");
        if (heroResponse && heroResponse.data && heroResponse.data.length > 0) {
            imageUrls.hero = heroResponse.data[0].url;
            heroImage.src = imageUrls.hero;
        }
        
        // 콘텐츠 이미지 1 생성
        const content1Prompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', 
            prompts.dalle + "\n\n이것은 첫 번째 콘텐츠 섹션 이미지입니다.");
        const content1Response = await callOpenAIImage(content1Prompt, "1024x1024");
        if (content1Response && content1Response.data && content1Response.data.length > 0) {
            imageUrls.content1 = content1Response.data[0].url;
            contentImage1.src = imageUrls.content1;
        }
        
        // 콘텐츠 이미지 2 생성
        const content2Prompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', 
            prompts.dalle + "\n\n이것은 두 번째 콘텐츠 섹션 이미지입니다.");
        const content2Response = await callOpenAIImage(content2Prompt, "1024x1024");
        if (content2Response && content2Response.data && content2Response.data.length > 0) {
            imageUrls.content2 = content2Response.data[0].url;
            contentImage2.src = imageUrls.content2;
        }
        
        // 콘텐츠 이미지 3 생성
        const content3Prompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', 
            prompts.dalle + "\n\n이것은 세 번째 콘텐츠 섹션 이미지입니다.");
        const content3Response = await callOpenAIImage(content3Prompt, "1024x1024");
        if (content3Response && content3Response.data && content3Response.data.length > 0) {
            imageUrls.content3 = content3Response.data[0].url;
            contentImage3.src = imageUrls.content3;
        }
        
        saveStepToLocalStorage(3, {
            dalle: prompts.dalle,
            gpt4o: prompts.gpt4o
        });
        saveStepToLocalStorage(4, { ...imageUrls });
        showStep(3);
    } catch (error) {
        alert(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
        console.error('Image generation error:', error);
    } finally {
        showLoading(false);
    }
}

// 4단계: GPT-4o 프롬프트와 이미지 URL을 사용하여 최종 코드 생성
async function generateFinalCode() {
    if (!apiKey) {
        alert('OpenAI API 키를 입력해주세요.');
        return;
    }

    if (!prompts.gpt4o) {
        alert('HTML 생성 프롬프트가 없습니다. 이전 단계를 완료해주세요.');
        return;
    }

    // 생성된 이미지 URL 모두 있는지 확인
    if (!imageUrls.header || !imageUrls.hero || !imageUrls.content1 || 
        !imageUrls.content2 || !imageUrls.content3) {
        alert('모든 이미지가 생성되지 않았습니다. 이전 단계를 완료해주세요.');
        return;
    }

    showLoading(true);

    try {
        // Firebase SDK 로드 (필요시에만)
        await loadFirebaseSDK();
        
        // GPT-4o 프롬프트에 이미지 URL 삽입
        const htmlGenerationPrompt = prompts.gpt4o
            .replace(/header_image_url/g, imageUrls.header)
            .replace(/hero_image_url/g, imageUrls.hero)
            .replace(/content_image_1_url/g, imageUrls.content1)
            .replace(/content_image_2_url/g, imageUrls.content2)
            .replace(/content_image_3_url/g, imageUrls.content3);

        // 템플릿 변수 채우기
        const userPrompt = promptTemplates.gpt4o_template.user_prompt_template
            .replace('{html_generation_prompt}', htmlGenerationPrompt);

        const response = await callOpenAI({
            messages: [
                {
                    role: "system",
                    content: promptTemplates.gpt4o_template.system_prompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ]
        });

        if (response) {
            console.log('HTML 생성 응답:', response);
            
            try {
                // JSON 응답 파싱 시도
                let htmlData;
                
                // JSON 부분만 추출 시도
                const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                                response.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    try {
                        htmlData = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
                    } catch (e) {
                        console.log('JSON 블록 파싱 실패, 전체 응답 시도:', e);
                        htmlData = JSON.parse(response);
                    }
                } else {
                    htmlData = JSON.parse(response);
                }
                
                console.log('파싱된 JSON:', htmlData);
                
                if (htmlData.html_code) {
                    htmlCode = htmlData.html_code;
                } else {
                    console.error('HTML 코드가 JSON에 없음');
                    htmlCode = response;
                }
                
                // HTML 코드 표시
                generatedCode.textContent = htmlCode;
                
                // 미리보기 업데이트
                updatePreview(htmlCode);
                
                // 생성된 코드를 브라우저에서 저장하고 다운로드 링크 설정
                saveHtmlToOutputFolder(htmlCode);
                
                saveStepToLocalStorage(5, htmlCode);
                showStep(4);
            } catch (error) {
                console.error('HTML 처리 실패:', error);
                generatedCode.textContent = response;
                updatePreview(response);
                saveHtmlToOutputFolder(response);
                saveStepToLocalStorage(5, response);
                showStep(4);
            }
        }
    } catch (error) {
        alert(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// 생성된 코드를 저장하고 다운로드 링크 생성
function saveHtmlToOutputFolder(htmlCode) {
    try {
        // 현재 날짜와 시간을 파일명에 포함
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        const filename = `generated_website_${timestamp}.html`;
        
        // Blob 생성 및 URL 생성
        const blob = new Blob([htmlCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // 다운로드 링크 설정
        setupDownloadLink(filename, htmlCode, url);
        
        return filename;
    } catch (error) {
        console.error('HTML 파일 저장 실패:', error);
        return null;
    }
}

// 다운로드 링크 설정
function setupDownloadLink(filename, htmlCode, blobUrl) {
    const downloadBtn = document.getElementById('download-code');
    const container = document.createElement('div');
    container.className = 'mt-4 flex flex-col items-start';
    
    // 파일명 표시
    const pathInfo = document.createElement('p');
    pathInfo.className = 'text-sm text-gray-600 mb-2';
    pathInfo.textContent = `파일명: ${filename}`;
    
    // 직접 열기 링크
    const openLink = document.createElement('a');
    openLink.href = blobUrl;
    openLink.className = 'text-indigo-600 hover:text-indigo-800 transition mb-2';
    openLink.textContent = '생성된 웹사이트 미리보기';
    openLink.target = '_blank';
    
    // 배포 버튼 컨테이너 (나란히 배치)
    const deployBtnContainer = document.createElement('div');
    deployBtnContainer.className = 'flex flex-wrap gap-2 mb-3';
    
    // Signed URL 방식 배포 버튼
    const deployGCSBtn = document.createElement('button');
    deployGCSBtn.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded';
    deployGCSBtn.textContent = 'GCS에 배포 (Signed URL)';
    deployGCSBtn.onclick = () => deployToGCS(htmlCode, filename);
    
    // Firebase 직접 배포 버튼
    const deployFirebaseBtn = document.createElement('button');
    deployFirebaseBtn.className = 'bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded';
    deployFirebaseBtn.textContent = 'Firebase에 직접 배포';
    deployFirebaseBtn.onclick = () => deployToFirebase(htmlCode, filename);
    
    // 서비스 계정 키 직접 사용 배포 버튼
    const deployServiceAccountBtn = document.createElement('button');
    deployServiceAccountBtn.className = 'bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded';
    deployServiceAccountBtn.textContent = 'GCS에 직접 배포 (서비스 계정)';
    deployServiceAccountBtn.onclick = () => deployWithServiceAccount(htmlCode, filename);
    
    deployBtnContainer.appendChild(deployGCSBtn);
    deployBtnContainer.appendChild(deployFirebaseBtn);
    deployBtnContainer.appendChild(deployServiceAccountBtn);
    
    container.appendChild(pathInfo);
    container.appendChild(openLink);
    container.appendChild(deployBtnContainer);
    
    // 기존 컨테이너가 있으면 내용 교체, 없으면 새로 생성
    const linkContainer = document.getElementById('link-container');
    if (linkContainer) {
        linkContainer.innerHTML = '';
        linkContainer.appendChild(container);
    } else {
        const newLinkContainer = document.createElement('div');
        newLinkContainer.id = 'link-container';
        newLinkContainer.appendChild(container);
        downloadBtn.parentNode.insertBefore(newLinkContainer, downloadBtn.nextSibling);
    }
    
    // 기존 다운로드 버튼 클릭 이벤트 업데이트
    downloadBtn.onclick = () => {
        downloadHtmlFile(htmlCode, filename);
    };
}

// GCS에 배포하는 함수 (Signed URL 방식)
async function deployToGCS(htmlCode, filename) {
    try {
        // 배포 버튼 상태 변경
        const deployBtn = document.querySelector('#link-container button:nth-child(1)');
        if (deployBtn) {
            deployBtn.disabled = true;
            deployBtn.textContent = 'GCS 배포 중...';
            deployBtn.className = 'bg-gray-400 text-white font-bold py-2 px-4 rounded';
        }
        
        // Signed URL 요청
        const response = await fetch(cloudStorageConfig.signedUrl.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: filename,
                contentType: 'text/html'
            })
        });
        
        if (!response.ok) {
            throw new Error('Signed URL을 가져오는데 실패했습니다.');
        }
        
        const data = await response.json();
        const signedUrl = data.url;
        
        // Signed URL을 사용하여 파일 업로드
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=86400'
            },
            body: htmlCode
        });
        
        if (!uploadResponse.ok) {
            throw new Error('파일 업로드에 실패했습니다.');
        }
        
        // 성공 메시지 및 링크 표시
        const publicUrl = `${cloudStorageConfig.signedUrl.publicUrlBase}/${filename}`;
        showDeploymentSuccess(publicUrl, 'GCS (Signed URL)');
        
        // 배포 버튼 상태 복원
        if (deployBtn) {
            deployBtn.disabled = false;
            deployBtn.textContent = 'GCS에 배포 (Signed URL)';
            deployBtn.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded';
        }
        
        return publicUrl;
    } catch (error) {
        // 오류 처리
        console.error('GCS 배포 실패:', error);
        alert(`GCS 배포 중 오류가 발생했습니다: ${error.message}`);
        
        // 배포 버튼 상태 복원
        const deployBtn = document.querySelector('#link-container button:nth-child(1)');
        if (deployBtn) {
            deployBtn.disabled = false;
            deployBtn.textContent = 'GCS에 배포 (Signed URL)';
            deployBtn.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded';
        }
        
        return null;
    }
}

// Firebase Storage에 직접 배포하는 함수
async function deployToFirebase(htmlCode, filename) {
    try {
        // Firebase가 로드되었는지 확인
        if (!window.firebase || !window.firebase.storage) {
            await loadFirebaseSDK();
        }
        
        // 배포 버튼 상태 변경
        const deployBtn = document.querySelector('#link-container button:nth-child(2)');
        if (deployBtn) {
            deployBtn.disabled = true;
            deployBtn.textContent = 'Firebase 배포 중...';
            deployBtn.className = 'bg-gray-400 text-white font-bold py-2 px-4 rounded';
        }
        
        // Firebase Storage 참조 생성
        const storage = window.firebase.storage();
        const storageRef = storage.ref();
        const fileRef = storageRef.child(filename);
        
        // 파일 데이터 생성 및 업로드
        const blob = new Blob([htmlCode], { type: 'text/html' });
        
        // 파일 업로드
        const uploadTask = fileRef.put(blob, {
            contentType: 'text/html',
            customMetadata: {
                'cache-control': 'public, max-age=86400'
            }
        });
        
        // 업로드 완료 대기
        await uploadTask;
        
        // 다운로드 URL 획득
        const downloadURL = await fileRef.getDownloadURL();
        
        // 성공 메시지 및 링크 표시
        showDeploymentSuccess(downloadURL, 'Firebase Storage');
        
        // 배포 버튼 상태 복원
        if (deployBtn) {
            deployBtn.disabled = false;
            deployBtn.textContent = 'Firebase에 직접 배포';
            deployBtn.className = 'bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded';
        }
        
        return downloadURL;
    } catch (error) {
        // 오류 처리
        console.error('Firebase 배포 실패:', error);
        alert(`Firebase 배포 중 오류가 발생했습니다: ${error.message}`);
        
        // 배포 버튼 상태 복원
        const deployBtn = document.querySelector('#link-container button:nth-child(2)');
        if (deployBtn) {
            deployBtn.disabled = false;
            deployBtn.textContent = 'Firebase에 직접 배포';
            deployBtn.className = 'bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded';
        }
        
        return null;
    }
}

// 서비스 계정 키를 사용하여 GCS에 직접 배포하는 함수
async function deployWithServiceAccount(htmlCode, filename) {
    try {
        // 서비스 계정 SDK 로드
        await loadGoogleCloudSDK();
        
        // 배포 버튼 상태 변경
        const deployBtn = document.querySelector('#link-container button:nth-child(3)');
        if (deployBtn) {
            deployBtn.disabled = true;
            deployBtn.textContent = '서비스 계정으로 배포 중...';
            deployBtn.className = 'bg-gray-400 text-white font-bold py-2 px-4 rounded';
        }
        
        // 서비스 계정 정보 확인
        if (!cloudStorageConfig.serviceAccount.privateKey || 
            !cloudStorageConfig.serviceAccount.clientEmail || 
            !cloudStorageConfig.serviceAccount.projectId) {
            throw new Error('서비스 계정 정보가 설정되지 않았습니다.');
        }
        
        // 서비스 계정 인증 준비
        const serviceAccount = {
            projectId: cloudStorageConfig.serviceAccount.projectId,
            clientEmail: cloudStorageConfig.serviceAccount.clientEmail,
            privateKey: cloudStorageConfig.serviceAccount.privateKey
        };
        
        // 파일 데이터 및 메타데이터 준비
        const blob = new Blob([htmlCode], { type: 'text/html' });
        const contentType = 'text/html';
        const bucket = cloudStorageConfig.serviceAccount.bucket;
        
        // Google Cloud Storage API 직접 호출 (CORS 문제 발생 가능)
        // 실제로는 이 부분이 브라우저에서 직접 작동하지 않을 수 있음 (CORS 및 보안 문제)
        // 일반적으로는 서버사이드에서 수행되어야 하는 작업
        
        // 임시 업로드 코드 (직접 호출은 실제 환경에서 작동하지 않을 수 있음)
        const now = new Date();
        const expiresInSeconds = 15 * 60; // 15분
        const expiry = Math.floor(now.getTime() / 1000) + expiresInSeconds;
        
        // 서명 생성 (이 부분은 실제 서버에서 수행되어야 함)
        const signedUrl = await generateSignedUrl(
            serviceAccount,
            'PUT',
            bucket,
            filename,
            expiry,
            contentType
        );
        
        if (!signedUrl) {
            throw new Error('Signed URL을 생성할 수 없습니다. 서비스 계정 키를 확인하세요.');
        }
        
        // 생성된 Signed URL로 업로드
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400'
            },
            body: htmlCode
        });
        
        if (!uploadResponse.ok) {
            throw new Error('서비스 계정을 사용한 파일 업로드에 실패했습니다.');
        }
        
        // 성공 메시지 및 링크 표시
        const publicUrl = `${cloudStorageConfig.serviceAccount.publicUrlBase}/${filename}`;
        showDeploymentSuccess(publicUrl, 'GCS (서비스 계정)');
        
        // 배포 버튼 상태 복원
        if (deployBtn) {
            deployBtn.disabled = false;
            deployBtn.textContent = 'GCS에 직접 배포 (서비스 계정)';
            deployBtn.className = 'bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded';
        }
        
        return publicUrl;
    } catch (error) {
        // 오류 처리
        console.error('서비스 계정 배포 실패:', error);
        alert(`서비스 계정 배포 중 오류가 발생했습니다: ${error.message}\n\n참고: 보안상의 이유로 브라우저에서 서비스 계정 키를 직접 사용한 업로드는 제한될 수 있습니다.`);
        
        // 배포 버튼 상태 복원
        const deployBtn = document.querySelector('#link-container button:nth-child(3)');
        if (deployBtn) {
            deployBtn.disabled = false;
            deployBtn.textContent = 'GCS에 직접 배포 (서비스 계정)';
            deployBtn.className = 'bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded';
        }
        
        return null;
    }
}

// Google Cloud Storage SDK 로드
async function loadGoogleCloudSDK() {
    // 이미 로드되었는지 확인
    if (window.gapi && window.gapi.client && window.gapi.client.storage) {
        return Promise.resolve();
    }
    
    // Google API 클라이언트 라이브러리 로드
    await loadScript('https://apis.google.com/js/api.js');
    
    return new Promise((resolve, reject) => {
        window.gapi.load('client', async () => {
            try {
                // 스토리지 API 초기화
                await window.gapi.client.init({
                    apiKey: '',
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/storage/v1/rest']
                });
                
                console.log('Google Cloud SDK 로드 완료');
                resolve();
            } catch (error) {
                console.error('Google Cloud SDK 초기화 실패:', error);
                reject(error);
            }
        });
    });
}

// 서명된 URL 생성 함수 (브라우저 환경에서는 작동하지 않을 수 있음)
async function generateSignedUrl(serviceAccount, method, bucket, fileName, expiry, contentType) {
    try {
        // 실제 구현은 서버에서 이루어져야 합니다.
        // 브라우저 환경에서 직접 서명을 생성하는 것은 보안상 권장되지 않습니다.
        console.warn('서비스 계정 키를 사용한 서명 생성은 브라우저에서 직접 수행할 수 없습니다.');
        console.warn('이 기능은 데모 목적이며, 실제로는 서버에서 구현해야 합니다.');
        
        // 주의 메시지 표시
        alert('서비스 계정 키를 사용한 직접 배포는 브라우저에서 제한됩니다. 서버측 구현이 필요합니다.');
        
        // 실제 환경에서는 서버 API를 호출하여 서명된 URL을 받아와야 합니다.
        return null;
    } catch (error) {
        console.error('서명된 URL 생성 실패:', error);
        return null;
    }
}

// Firebase SDK 동적 로드
async function loadFirebaseSDK() {
    // 이미 로드되었는지 확인
    if (window.firebase && window.firebase.storage) {
        return Promise.resolve();
    }
    
    // Firebase 앱 SDK 로드
    await loadScript('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
    // Firebase 스토리지 SDK 로드
    await loadScript('https://www.gstatic.com/firebasejs/9.6.10/firebase-storage-compat.js');
    
    // Firebase 초기화
    try {
        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(cloudStorageConfig.firebase);
        }
        console.log('Firebase SDK 로드 완료');
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        // 실패해도 계속 진행 (배포 시도 시 오류 처리)
    }
}

// 배포 성공 시 메시지 표시
function showDeploymentSuccess(publicUrl, deployType) {
    const linkContainer = document.getElementById('link-container');
    if (!linkContainer) return;
    
    const successMessage = document.createElement('div');
    successMessage.className = 'mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded';
    
    const successText = document.createElement('p');
    successText.className = 'font-semibold';
    successText.textContent = `웹사이트가 ${deployType}에 성공적으로 배포되었습니다!`;
    
    const urlContainer = document.createElement('div');
    urlContainer.className = 'mt-2';
    
    const urlLink = document.createElement('a');
    urlLink.href = publicUrl;
    urlLink.className = 'text-blue-600 hover:text-blue-800 underline';
    urlLink.textContent = '배포된 웹사이트 방문하기';
    urlLink.target = '_blank';
    
    const urlText = document.createElement('p');
    urlText.className = 'text-sm text-gray-600 mt-1';
    urlText.textContent = publicUrl;
    
    urlContainer.appendChild(urlLink);
    urlContainer.appendChild(urlText);
    
    successMessage.appendChild(successText);
    successMessage.appendChild(urlContainer);
    
    // 성공 메시지 추가
    const existingMessage = linkContainer.querySelector('.bg-green-100');
    if (existingMessage) {
        linkContainer.replaceChild(successMessage, existingMessage);
    } else {
        linkContainer.appendChild(successMessage);
    }
}

// HTML 파일 다운로드
function downloadHtmlFile(htmlCode, filename) {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'generated_website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 미리보기 업데이트
function updatePreview(code) {
    const iframe = previewFrame;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    iframeDoc.open();
    iframeDoc.write(code);
    iframeDoc.close();
}

// 코드 복사
function copyCode() {
    const code = generatedCode.textContent;
    navigator.clipboard.writeText(code)
        .then(() => {
            const originalText = copyCodeBtn.textContent;
            copyCodeBtn.textContent = '복사됨!';
            setTimeout(() => {
                copyCodeBtn.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('클립보드 복사 실패:', err);
            alert('코드 복사에 실패했습니다.');
        });
}

// 로딩 표시
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// 프롬프트 편집 적용 함수
function applyPlanningEdit() {
    const newContent = planningEditor.value.trim();
    if (newContent) {
        planningDoc = newContent;
        planningOutput.innerHTML = marked.parse(planningDoc);
    }
}

function applyDalleEdit() {
    const newContent = dallePromptEditor.value.trim();
    if (newContent) {
        prompts.dalle = newContent;
        dallePromptOutput.innerHTML = marked.parse(prompts.dalle);
    }
}

function applyGpt4oEdit() {
    const newContent = gpt4oPromptEditor.value.trim();
    if (newContent) {
        prompts.gpt4o = newContent;
        gpt4oPromptOutput.innerHTML = marked.parse(prompts.gpt4o);
    }
}

// OpenAI API 텍스트 생성 호출 함수
async function callOpenAI(data) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: data.messages,
            temperature: 0.7,
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API 호출 중 오류가 발생했습니다.');
    }

    const result = await response.json();
    return result.choices[0].message.content;
}

// OpenAI API 이미지 생성 호출 함수
async function callOpenAIImage(prompt, size = "1024x1024") {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            prompt: prompt,
            n: 1,
            size: size,
            response_format: "url"
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '이미지 생성 중 오류가 발생했습니다.');
    }

    return await response.json();
}

// 필요한 외부 라이브러리 추가 - marked.js (마크다운 파싱)
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 앱 실행
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
        initApp();
    } catch (error) {
        console.error('라이브러리 로딩 오류:', error);
        alert('필요한 라이브러리를 불러오는 데 실패했습니다.');
    }
});

// 초기 설정
window.onload = function() {
    // 진행 단계 아이콘 클릭 이벤트 추가
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach(step => {
        step.onclick = function() {
            const stepIndex = parseInt(this.getAttribute('data-step')) - 1;
            showStep(stepIndex);
        };
    });
    
    // 첫 단계 표시
    showStep(0);
};

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
  .step-tab {
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: all 0.3s;
  }
  .step-tab:hover {
    color: #4f46e5;
    background-color: #f3f4f6;
  }
  .active-tab {
    color: #4f46e5;
    border-bottom-color: #4f46e5;
    font-weight: 600;
  }
  .disabled-tab {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .enabled-tab {
    cursor: pointer;
  }
`;
document.head.appendChild(style);
