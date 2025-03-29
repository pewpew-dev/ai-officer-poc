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

// GCS 설정 저장
function saveGCSSettings() {
    try {
        const projectId = document.getElementById('gcs-project-id').value.trim();
        const bucketName = document.getElementById('gcs-bucket-name').value.trim();
        const serviceAccountKey = document.getElementById('gcs-service-account-key').value.trim();
        
        if (projectId && bucketName && serviceAccountKey) {
            localStorage.setItem('gcs-project-id', projectId);
            localStorage.setItem('gcs-bucket-name', bucketName);
            localStorage.setItem('gcs-service-account-key', serviceAccountKey);
            alert('GCS 설정이 저장되었습니다.');
            
            // 서비스 계정 키 입력란은 보안을 위해 마스킹 처리
            document.getElementById('gcs-service-account-key').value = '********';
        } else {
            alert('모든 GCS 설정 필드를 입력해주세요.');
        }
    } catch (error) {
        console.error('GCS 설정 저장 오류:', error);
        alert('GCS 설정 저장 중 오류가 발생했습니다.');
    }
}

// GCS 설정 불러오기
function loadGCSSettings() {
    try {
        const projectId = localStorage.getItem('gcs-project-id') || '';
        const bucketName = localStorage.getItem('gcs-bucket-name') || '';
        const serviceAccountKey = localStorage.getItem('gcs-service-account-key') || '';
        
        const projectIdInput = document.getElementById('gcs-project-id');
        const bucketNameInput = document.getElementById('gcs-bucket-name');
        const serviceAccountKeyInput = document.getElementById('gcs-service-account-key');
        
        if (projectIdInput && projectId) projectIdInput.value = projectId;
        if (bucketNameInput && bucketName) bucketNameInput.value = bucketName;
        if (serviceAccountKeyInput && serviceAccountKey) serviceAccountKeyInput.value = '********';
    } catch (error) {
        console.error('GCS 설정 불러오기 오류:', error);
    }
}

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
            try {
                // 메모리 객체 업데이트
                const parsedData = JSON.parse(data);
                stepsMemory[`step${stepNumber}`] = parsedData;
                return parsedData;
            } catch (parseError) {
                console.error(`단계 ${stepNumber} 데이터 파싱 오류:`, parseError);
                return null;
            }
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
    
    // 로드된 데이터를 각 입력 필드에 채우기
    populateFieldsFromLocalStorage();
}

// 로컬 스토리지 데이터로 입력 필드 채우기
function populateFieldsFromLocalStorage() {
    // 1단계: 웹사이트 아이디어
    const step1Data = loadStepFromLocalStorage(1);
    if (step1Data) {
        if (typeof step1Data === 'string') {
            ideaInput.value = step1Data;
        }
    }
    
    // 2단계: 기획 및 디자인 요구사항
    const step2Data = loadStepFromLocalStorage(2);
    if (step2Data) {
        console.log('2단계 데이터 로드됨:', step2Data);
        
        if (step2Data.planning) {
            planningDoc = step2Data.planning;
            
            let fullText = step2Data.planning;
            if (step2Data.designRequirements) {
                fullText += "\n\n" + step2Data.designRequirements;
            }
            
            planningEditor.value = fullText;
            planningOutput.innerHTML = marked.parse(fullText);
        }
    }
    
    // 3단계: 프롬프트
    const step3Data = loadStepFromLocalStorage(3);
    if (step3Data) {
        if (step3Data.dalle) {
            dallePromptEditor.value = step3Data.dalle;
            dallePromptOutput.innerHTML = `<p>${step3Data.dalle}</p>`;
            prompts.dalle = step3Data.dalle;
        }
        
        if (step3Data.gpt4o) {
            gpt4oPromptEditor.value = step3Data.gpt4o;
            gpt4oPromptOutput.innerHTML = `<p>${step3Data.gpt4o}</p>`;
            prompts.gpt4o = step3Data.gpt4o;
        }
    }
    
    // 4단계: 이미지 URL
    const step4Data = loadStepFromLocalStorage(4);
    if (step4Data) {
        if (step4Data.header) {
            headerImage.src = step4Data.header;
            headerImage.style.display = 'block';
            imageUrls.header = step4Data.header;
        }
        
        if (step4Data.hero) {
            heroImage.src = step4Data.hero;
            heroImage.style.display = 'block';
            imageUrls.hero = step4Data.hero;
        }
        
        if (step4Data.content1) {
            contentImage1.src = step4Data.content1;
            contentImage1.style.display = 'block';
            imageUrls.content1 = step4Data.content1;
        }
        
        if (step4Data.content2) {
            contentImage2.src = step4Data.content2;
            contentImage2.style.display = 'block';
            imageUrls.content2 = step4Data.content2;
        }
        
        if (step4Data.content3) {
            contentImage3.src = step4Data.content3;
            contentImage3.style.display = 'block';
            imageUrls.content3 = step4Data.content3;
        }
    }
    
    // 5단계: 생성된 HTML 코드
    const step5Data = loadStepFromLocalStorage(5);
    if (step5Data) {
        // 객체인 경우 html 속성 가져오기, 문자열인 경우 그대로 사용 (하위 호환성)
        const htmlCode = typeof step5Data === 'object' && step5Data !== null && step5Data.html 
            ? step5Data.html 
            : step5Data;
            
        generatedCode.textContent = htmlCode;
        updatePreview(htmlCode);
    }
    
    // 데이터가 있는 가장 높은 단계로 이동 (선택 사항)
    moveToHighestCompletedStep();
}

// 완료된 가장 높은 단계로 이동
function moveToHighestCompletedStep() {
    // 완료된 단계 중 가장 높은 단계 찾기
    let highestStep = 0;
    for (let i = 5; i >= 1; i--) {
        if (checkStepData(i)) {
            highestStep = i - 1; // 배열 인덱스로 변환
            break;
        }
    }
    
    // 가장 높은 단계로 이동 (단, 데이터가 있는 경우만)
    if (highestStep > 0) {
        showStep(highestStep);
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
const planningLoading = document.getElementById('planning-loading');
const promptsLoading = document.getElementById('prompts-loading');
const imagesLoading = document.getElementById('images-loading');
const codeLoading = document.getElementById('code-loading');
const planningCopyBtn = document.getElementById('copy-planning');
const dallePromptCopyBtn = document.getElementById('copy-dalle-prompt');
const gpt4oPromptCopyBtn = document.getElementById('copy-gpt4o-prompt');
const downloadBtn = document.getElementById('download-link');

// 모든 단계 컨테이너
const stepContainers = document.querySelectorAll('.step-content');

// 앱 초기화
function initApp() {
    try {
        // 로컬 스토리지에서 API 키 불러오기
        apiKey = localStorage.getItem('openai-api-key') || '';
        if (apiKey) {
            apiKeyInput.value = '********';
        }
    
        // 로컬 스토리지에서 단계 데이터 불러오기
        loadAllStepsFromLocalStorage();
        
        // 요소 확인 후 이벤트 리스너 등록
        if (saveApiKeyBtn) saveApiKeyBtn.addEventListener('click', saveApiKey);
        if (generatePlanningBtn) generatePlanningBtn.addEventListener('click', generatePlanning);
        if (generatePromptsBtn) generatePromptsBtn.addEventListener('click', generatePrompts);
        if (generateImagesBtn) generateImagesBtn.addEventListener('click', generateImages);
        if (generateFinalCodeBtn) generateFinalCodeBtn.addEventListener('click', generateFinalCode);
        if (backToIdeaBtn) backToIdeaBtn.addEventListener('click', () => showStep(0));
        if (backToPlanningBtn) backToPlanningBtn.addEventListener('click', () => showStep(1));
        if (backToPromptsBtn) backToPromptsBtn.addEventListener('click', () => showStep(2));
        if (backToImagesBtn) backToImagesBtn.addEventListener('click', () => showStep(3));
        if (copyCodeBtn) copyCodeBtn.addEventListener('click', copyCode);
        if (downloadCodeBtn) downloadCodeBtn.addEventListener('click', downloadHtmlFile);
        
        const applyPlanningEditBtn = document.getElementById('apply-planning-edit');
        if (applyPlanningEditBtn) applyPlanningEditBtn.addEventListener('click', applyPlanningEdit);
        
        const applyDalleEditBtn = document.getElementById('apply-dalle-edit');
        if (applyDalleEditBtn) applyDalleEditBtn.addEventListener('click', applyDalleEdit);
        
        const applyGpt4oEditBtn = document.getElementById('apply-gpt4o-edit');
        if (applyGpt4oEditBtn) applyGpt4oEditBtn.addEventListener('click', applyGpt4oEdit);
        
        // 미리보기 버튼 이벤트 리스너 추가 (DOM이 완전히 로드된 후에 추가)
        document.addEventListener('DOMContentLoaded', function() {
            const previewBtn = document.getElementById('preview-btn');
            if (previewBtn) {
                previewBtn.addEventListener('click', showPreview);
                console.log('미리보기 버튼 이벤트 리스너 등록 완료');
            }
        });
        
        // GCS 배포 버튼 이벤트 리스너 추가
        const deployGcsBtn = document.getElementById('deploy-gcs-btn');
        if (deployGcsBtn) {
            deployGcsBtn.addEventListener('click', () => {
                const htmlCode = document.getElementById('generated-code').textContent;
                if (!htmlCode) {
                    alert('먼저 HTML 코드를 생성해주세요.');
                    return;
                }
                
                const now = new Date();
                const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
                const filename = `generated_website_${timestamp}.html`;
                
                deployToGCSDirect(htmlCode, filename);
            });
        }
        
        // GCS 설정 저장 버튼 이벤트 리스너 추가
        const saveGcsSettingsBtn = document.getElementById('save-gcs-settings');
        if (saveGcsSettingsBtn) saveGcsSettingsBtn.addEventListener('click', saveGCSSettings);
        
        // GCS 설정 불러오기
        loadGCSSettings();
        
        console.log("이벤트 리스너 등록 완료");
    } catch (error) {
        console.error("초기화 오류:", error);
    }
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
    // 단계 컨테이너 표시 설정
    stepContainers.forEach((container, index) => {
        if (index === stepIndex) {
            container.style.display = 'block';
            
            // 현재 단계의 출력과 편집기 표시 설정
            if (index === 1) {
                if (planningOutput) planningOutput.style.display = 'block';
                if (planningCopyBtn) planningCopyBtn.style.display = 'block';
            } else if (index === 2) {
                if (dallePromptOutput) dallePromptOutput.style.display = 'block';
                if (gpt4oPromptOutput) gpt4oPromptOutput.style.display = 'block';
                if (dallePromptCopyBtn) dallePromptCopyBtn.style.display = 'block';
                if (gpt4oPromptCopyBtn) gpt4oPromptCopyBtn.style.display = 'block';
            } else if (index === 3) {
                // 이미지 컨테이너 표시
            } else if (index === 4) {
                if (generatedCode) generatedCode.style.display = 'block';
                if (previewFrame) previewFrame.style.display = 'block';
                if (downloadBtn) downloadBtn.style.display = 'block';
            }
        } else {
            container.style.display = 'none';
        }
    });

    // 진행 단계 아이콘 활성화 상태 업데이트
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
        const circleElement = step.querySelector('div:first-child');
        const textElement = step.querySelector('span');
        
        // 모든 클래스 제거
        circleElement.classList.remove('bg-gray-300', 'bg-indigo-600', 'bg-green-500', 'bg-yellow-500');
        circleElement.classList.remove('text-gray-600', 'text-white');
        textElement.classList.remove('text-gray-500', 'text-indigo-600', 'text-green-500', 'text-yellow-500');
        
        // 데이터 존재 여부 확인
        const hasData = checkStepData(index + 1);
        
        if (index === stepIndex) {
            // 현재 단계는 항상 파란색
            circleElement.classList.add('bg-indigo-600', 'text-white');
            textElement.classList.add('text-indigo-600');
        } else if (hasData) {
            // 데이터가 있는 단계는 녹색
            circleElement.classList.add('bg-green-500', 'text-white');
            textElement.classList.add('text-green-500');
        } else {
            // 데이터가 없는 단계는 회색
            circleElement.classList.add('bg-gray-300', 'text-gray-600');
            textElement.classList.add('text-gray-500');
        }
    });
    
    // 현재 단계에 따른 뒤로 가기 버튼 상태 설정
    if (backToIdeaBtn) backToIdeaBtn.style.display = stepIndex === 1 ? 'inline-block' : 'none';
    if (backToPlanningBtn) backToPlanningBtn.style.display = stepIndex === 2 ? 'inline-block' : 'none';
    if (backToPromptsBtn) backToPromptsBtn.style.display = stepIndex === 3 ? 'inline-block' : 'none';
    if (backToImagesBtn) backToImagesBtn.style.display = stepIndex === 4 ? 'inline-block' : 'none';
}

// 로딩 표시
function showLoading(show) {
    if (loadingIndicator) {
        if (show) {
            loadingIndicator.classList.remove('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
        }
    }
}

// 특정 단계 로딩 표시
function showStepLoading(stepNumber, show) {
    let loadingElement;
    
    switch (stepNumber) {
        case 1:
            loadingElement = planningLoading;
            break;
        case 2:
            loadingElement = promptsLoading;
            break;
        case 3:
            loadingElement = imagesLoading;
            break;
        case 4:
            loadingElement = codeLoading;
            break;
    }
    
    if (loadingElement) {
        if (show) {
            loadingElement.style.display = 'flex';
        } else {
            loadingElement.style.display = 'none';
        }
    }
}

// 1단계: 아이디어에서 기획 및 디자인 생성
async function generatePlanning() {
    const idea = ideaInput.value.trim();
    if (!idea) {
        alert('웹사이트 아이디어를 입력해주세요.');
        return;
    }

    try {
        // 로딩 표시
        showStepLoading(1, true);
        
        // 현재 단계(1단계) 데이터 저장
        saveStepToLocalStorage(1, idea);
        
        // OpenAI API를 사용하여 GPT-4o로 기획 및 디자인 요구사항 생성
        const systemPrompt = promptTemplates.planner_ai.system_prompt;
        const userPrompt = promptTemplates.planner_ai.user_prompt_template.replace('{user_description}', idea);
        
        const response = await callOpenAI('gpt-4o', systemPrompt, userPrompt);
        
        if (response) {
            // 로딩 끝
            showStepLoading(1, false);
            
            // 응답 처리
            planningDoc = response;
            if (planningOutput) planningOutput.innerHTML = marked.parse(response);
            if (planningEditor) planningEditor.value = response; // 에디터에도 내용 설정
            
            // 응답 데이터로 2단계 데이터 저장 (planning과 designRequirements 구분)
            try {
                // 기획 부분과 디자인 요구사항 부분 분리 (추출 실패해도 전체 저장)
                const parts = extractPlanningParts(response);
                
                if (parts && parts.planningPart && parts.designRequirementsPart) {
                    // 추출 성공시 분리해서 저장
                    saveStepToLocalStorage(2, {
                        planning: parts.planningPart,
                        designRequirements: parts.designRequirementsPart
                    });
                } else {
                    // 추출 실패시 전체 내용을 planning으로 저장
                    saveStepToLocalStorage(2, {
                        planning: response,
                        designRequirements: ""
                    });
                }
                
                console.log('2단계 데이터 저장 완료:', localStorage.getItem(LOCAL_STORAGE_KEYS.STEP2));
            } catch (parseError) {
                console.error('기획서 파싱 오류:', parseError);
                // 오류 발생시에도 전체 내용을 planning으로 저장
                saveStepToLocalStorage(2, {
                    planning: response,
                    designRequirements: ""
                });
            }
            
            showStep(1);
        }
    } catch (error) {
        showStepLoading(1, false);
        alert(`기획 및 디자인 요구사항 생성 중 오류가 발생했습니다: ${error.message}`);
        console.error('기획 생성 오류:', error);
    }
}

// 기획서에서 planning과 design requirements 부분 추출
function extractPlanningParts(text) {
    try {
        let planningPart = "";
        let designRequirementsPart = "";
        
        // 기획 부분과 디자인 요구사항 부분 분리 정규식 패턴
        const planningPattern = /## 웹사이트 기획서([\s\S]*?)(?=## 디자인 요구사항)/i;
        const designRequirementsPattern = /## 디자인 요구사항([\s\S]*)/i;
        
        // 기획 부분 추출
        const planningMatch = text.match(planningPattern);
        if (planningMatch && planningMatch[0]) {
            planningPart = planningMatch[0];
        } else {
            // 전통적인 방식으로 추출 시도
            const planningHeaderIndex = text.indexOf("## 웹사이트 기획서");
            const designHeaderIndex = text.indexOf("## 디자인 요구사항");
            
            if (planningHeaderIndex !== -1 && designHeaderIndex !== -1 && designHeaderIndex > planningHeaderIndex) {
                planningPart = text.substring(planningHeaderIndex, designHeaderIndex);
            }
        }
        
        // 디자인 요구사항 부분 추출
        const designRequirementsMatch = text.match(designRequirementsPattern);
        if (designRequirementsMatch && designRequirementsMatch[0]) {
            designRequirementsPart = designRequirementsMatch[0];
        } else {
            // 전통적인 방식으로 추출 시도
            const designHeaderIndex = text.indexOf("## 디자인 요구사항");
            
            if (designHeaderIndex !== -1) {
                designRequirementsPart = text.substring(designHeaderIndex);
            }
        }
        
        // 둘 다 추출 실패 시 기본값 설정
        if (!planningPart && !designRequirementsPart) {
            planningPart = text;
        }
        
        return {
            planningPart: planningPart.trim(),
            designRequirementsPart: designRequirementsPart.trim()
        };
    } catch (error) {
        console.error('기획서 파싱 오류:', error);
        return {
            planningPart: text,
            designRequirementsPart: ""
        };
    }
}

// 2단계: 기획 및 디자인 요구사항으로 프롬프트 생성 (DALL-E 및 GPT-4o 프롬프트)
async function generatePrompts() {
    if (!apiKey) {
        alert('OpenAI API 키를 입력해주세요.');
        return;
    }

    const planning = planningDoc;

    // 로딩 상태 표시
    showStepLoading(2, true);
    
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

        const response = await callOpenAI('gpt-4o', systemPrompt, userPrompt);
        
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
                    prompts.gpt4o = "제공된 이미지 URL을 사용하여 단일 HTML 파일로 정적 웹사이트를 생성해주세요. 인라인 CSS 스타일링, 반응형 디자인, 부드러운 스크롤링을 포함하세요. 특히 단순 모바일 환경 기준으로 작성 후 확대하는 것이 아니라, 일정 크기 이상에서는 pc 혹은 태블릿을 대상으로 하여 별도로 디자인 해 주세요. DALL-E 3가 생성한 이미지의 URL을 플레이스홀더(예: \"header_image_url\", \"hero_image_url\", \"content_image_1_url\" 등)로 사용하세요.";
                    gpt4oPromptEditor.value = prompts.gpt4o;
                }
                
            } catch (error) {
                console.error('JSON 파싱 실패:', error, '원본 응답:', response);
                
                // 파싱 실패시 기본값 제공
                dallePromptOutput.innerHTML = "<p>프롬프트 파싱에 실패했습니다. 기본값을 사용합니다.</p>";
                gpt4oPromptOutput.innerHTML = "<p>프롬프트 파싱에 실패했습니다. 기본값을 사용합니다.</p>";
                
                prompts.dalle = "웹사이트를 위한 시각적으로 매력적인 이미지를 생성해주세요. 1024x1024 해상도의 고품질 이미지가 필요합니다.";
                prompts.gpt4o = "제공된 이미지 URL을 사용하여 단일 HTML 파일로 정적 웹사이트를 생성해주세요. 인라인 CSS 스타일링, 반응형 디자인, 부드러운 스크롤링을 포함하세요. 특히 단순 모바일 환경 기준으로 작성 후 확대하는 것이 아니라, 일정 크기 이상에서는 pc 혹은 태블릿을 대상으로 하여 별도로 디자인 해 주세요. DALL-E 3가 생성한 이미지의 URL을 플레이스홀더(예: \"header_image_url\", \"hero_image_url\", \"content_image_1_url\" 등)로 사용하세요.";
                
                dallePromptEditor.value = prompts.dalle;
                gpt4oPromptEditor.value = prompts.gpt4o;
            }
            
            // 현재 단계(2단계) 데이터 저장
            saveStepToLocalStorage(2, {
                planning: planningPart,
                designRequirements: designRequirementsPart
            });
            
            // 현재 단계(3단계) 데이터 저장
            saveStepToLocalStorage(3, {
                dalle: prompts.dalle,
                gpt4o: prompts.gpt4o
            });
            
            showStep(2);
        }
    } catch (error) {
        alert(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    } finally {
        // 로딩 상태 해제
        showStepLoading(2, false);
    }
}

// 3단계: DALL-E 프롬프트로 이미지 생성
async function generateImages() {
    if (!dallePromptEditor?.value?.trim()) {
        alert('먼저 DALL-E 프롬프트를 생성해주세요.');
        return;
    }

    try {
        // 로딩 표시
        showStepLoading(3, true);
        
        // 현재 편집된 프롬프트 가져오기
        const currentDallePrompt = dallePromptEditor?.value?.trim() || '';
        const currentGpt4oPrompt = gpt4oPromptEditor?.value?.trim() || '';
        
        // 현재 단계(3단계) 데이터 저장
        saveStepToLocalStorage(3, {
            dalle: currentDallePrompt,
            gpt4o: currentGpt4oPrompt
        });
        
        // 이미지 영역 초기화
        if (headerImage) headerImage.style.display = 'none';
        if (heroImage) heroImage.style.display = 'none';
        if (contentImage1) contentImage1.style.display = 'none';
        if (contentImage2) contentImage2.style.display = 'none';
        if (contentImage3) contentImage3.style.display = 'none';
        
        // 5개의 이미지 생성
        prompts.dalle = currentDallePrompt;
        
        // 헤더 이미지
        const headerPrompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', prompts.dalle + "\n\n이것은 헤더 배너 이미지입니다.");
        const headerResponse = await generateImage(headerPrompt);
        if (headerResponse && headerResponse.data && headerResponse.data[0].url) {
            imageUrls.header = headerResponse.data[0].url;
            if (headerImage) headerImage.src = imageUrls.header;
            if (headerImage) headerImage.style.display = 'block';
        }
        
        // 히어로 이미지
        const heroPrompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', prompts.dalle + "\n\n이것은 히어로 배너 이미지입니다.");
        const heroResponse = await generateImage(heroPrompt);
        if (heroResponse && heroResponse.data && heroResponse.data[0].url) {
            imageUrls.hero = heroResponse.data[0].url;
            if (heroImage) heroImage.src = imageUrls.hero;
            if (heroImage) heroImage.style.display = 'block';
        }
        
        // 컨텐츠 이미지 1
        const content1Prompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', prompts.dalle + "\n\n이것은 웹사이트 컨텐츠용 이미지입니다.");
        const content1Response = await generateImage(content1Prompt);
        if (content1Response && content1Response.data && content1Response.data[0].url) {
            imageUrls.content1 = content1Response.data[0].url;
            if (contentImage1) contentImage1.src = imageUrls.content1;
            if (contentImage1) contentImage1.style.display = 'block';
        }
        
        // 컨텐츠 이미지 2
        const content2Prompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', prompts.dalle + "\n\n이것은 웹사이트 컨텐츠용 이미지로, 첫 번째 이미지와 다른 스타일입니다.");
        const content2Response = await generateImage(content2Prompt);
        if (content2Response && content2Response.data && content2Response.data[0].url) {
            imageUrls.content2 = content2Response.data[0].url;
            if (contentImage2) contentImage2.src = imageUrls.content2;
            if (contentImage2) contentImage2.style.display = 'block';
        }
        
        // 컨텐츠 이미지 3
        const content3Prompt = promptTemplates.dalle_template.user_prompt_template.replace('{dalle_prompt}', prompts.dalle + "\n\n이것은 웹사이트 컨텐츠용 이미지로, 이전 이미지들과 다른 주제입니다.");
        const content3Response = await generateImage(content3Prompt);
        if (content3Response && content3Response.data && content3Response.data[0].url) {
            imageUrls.content3 = content3Response.data[0].url;
            if (contentImage3) contentImage3.src = imageUrls.content3;
            if (contentImage3) contentImage3.style.display = 'block';
        }
        
        // 로딩 끝
        showStepLoading(3, false);
        
        // 응답 데이터로 4단계 데이터 저장
        saveStepToLocalStorage(4, { ...imageUrls });
        
        showStep(3);
    } catch (error) {
        alert(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
        console.error('이미지 생성 오류:', error);
        showStepLoading(3, false);
    }
}

// 4단계: 생성된 이미지와 프롬프트로 최종 코드 생성
async function generateFinalCode() {
    if (!imageUrls.header || !imageUrls.hero) {
        alert('먼저 이미지를 생성해주세요.');
        return;
    }

    try {
        // 로딩 표시
        showStepLoading(4, true);
        
        // 현재 단계(4단계) 데이터 저장
        saveStepToLocalStorage(4, { ...imageUrls });
        
        // HTML 생성 프롬프트 설정
        const htmlGenerationPrompt = `
# 웹사이트 생성 요청
다음 정보를 기반으로 완전한 HTML 정적 웹사이트를 생성해주세요:

## 기획 문서
${planningDoc}

## 이미지 URL
헤더 이미지: ${imageUrls.header}
히어로 이미지: ${imageUrls.hero}
컨텐츠 이미지 1: ${imageUrls.content1}
컨텐츠 이미지 2: ${imageUrls.content2}
컨텐츠 이미지 3: ${imageUrls.content3}

## 추가 지침
${prompts.gpt4o}

이미지는 OpenAI URL이니 출력물에 직접 사용할 수 있습니다. 모든 내용을 단일 HTML 파일에 넣어 반환해주세요.
`;

        // OpenAI API를 사용하여 GPT-4o로 HTML 코드 생성
        const systemPrompt = promptTemplates.gpt4o_template.system_prompt;
        const userPrompt = promptTemplates.gpt4o_template.user_prompt_template.replace('{html_generation_prompt}', htmlGenerationPrompt);
        
        const response = await callOpenAI('gpt-4o', systemPrompt, userPrompt);
        
        if (response) {
            // 로딩 끝
            showStepLoading(4, false);
            
            try {
                // JSON 응답 파싱 시도
                let htmlData;
                let htmlCode;
                
                // JSON 부분만 추출 시도
                const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                                response.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    try {
                        // JSON 파싱 시도
                        htmlData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                        
                        // HTML 코드 추출 성공
                        if (htmlData && htmlData.html_code) {
                            htmlCode = htmlData.html_code;
                            generatedCode.textContent = htmlCode;
                            updatePreview(htmlCode);
                            
                            // 생성된 코드를 브라우저에서 저장하고 다운로드 링크 설정
                            saveHtmlToOutputFolder(htmlCode);
                            
                            // 응답 데이터로 5단계 데이터 저장
                            saveStepToLocalStorage(5, { html: htmlCode });
                            
                            showStep(4);
                            return;
                        }
                        
                        // html_code가 없는 경우 html 키 확인 (하위 호환성)
                        if (htmlData && htmlData.html) {
                            htmlCode = htmlData.html;
                            generatedCode.textContent = htmlCode;
                            updatePreview(htmlCode);
                            
                            // 생성된 코드를 브라우저에서 저장하고 다운로드 링크 설정
                            saveHtmlToOutputFolder(htmlCode);
                            
                            // 응답 데이터로 5단계 데이터 저장
                            saveStepToLocalStorage(5, { html: htmlCode });
                            
                            showStep(4);
                            return;
                        }
                    } catch (e) {
                        console.error('JSON 파싱 실패:', e);
                    }
                }
                
                // JSON 파싱 실패 시 HTML 코드 부분만 추출
                let htmlOnly = response;
                
                // HTML 태그가 있는지 확인하고 추출
                const htmlMatch = response.match(/<html[\s\S]*<\/html>/i) || 
                                 response.match(/<body[\s\S]*<\/body>/i) || 
                                 response.match(/<!DOCTYPE[\s\S]*<\/html>/i);
                
                if (htmlMatch) {
                    htmlOnly = htmlMatch[0];
                } else {
                    // <html> 태그는 없지만 코드 블록 안에 HTML이 있는 경우
                    const codeBlockMatch = response.match(/```html\s*([\s\S]*?)\s*```/) || 
                                         response.match(/```\s*([\s\S]*?)\s*```/);
                    if (codeBlockMatch) {
                        htmlOnly = codeBlockMatch[1];
                    }
                }
                
                generatedCode.textContent = htmlOnly;
                updatePreview(htmlOnly);
                saveHtmlToOutputFolder(htmlOnly);
                
                // 응답 데이터로 5단계 데이터 저장
                saveStepToLocalStorage(5, { html: htmlOnly });
                
                showStep(4);
            } catch (error) {
                console.error('HTML 처리 실패:', error);
                alert(`HTML 처리 중 오류가 발생했습니다: ${error.message}`);
            }
        }
    } catch (error) {
        showStepLoading(4, false);
        alert(`코드 생성 중 오류가 발생했습니다: ${error.message}`);
        console.error('코드 생성 오류:', error);
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
    
    // 기존 다운로드 버튼 클릭 이벤트 업데이트
    downloadBtn.onclick = () => {
        downloadHtmlFile(htmlCode, filename);
    };
}

// 미리보기 버튼에 이벤트 리스너 추가
const previewBtn = document.getElementById('preview-btn');
if (previewBtn) previewBtn.addEventListener('click', showPreview);

// 미리보기 함수
function showPreview() {
    try {
        const htmlCode = document.getElementById('generated-code').textContent;
        if (!htmlCode) {
            alert('먼저 HTML 코드를 생성해주세요.');
            return;
        }
        
        // Blob URL 생성
        const blob = new Blob([htmlCode], { type: 'text/html' });
        const blobURL = URL.createObjectURL(blob);
        
        // 새 탭에서 Blob URL 열기
        window.open(blobURL, '_blank');
    } catch (error) {
        console.error('미리보기 오류:', error);
        alert('미리보기를 표시하는 중 오류가 발생했습니다.');
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
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
        previewWindow.document.open();
        previewWindow.document.write(code);
        previewWindow.document.close();
    } else {
        alert('팝업 차단이 활성화되어 있습니다. 미리보기를 허용해주세요.');
    }
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
async function callOpenAI(model, systemPrompt, userPrompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    "role": "system",
                    "content": systemPrompt
                },
                {
                    "role": "user",
                    "content": userPrompt
                }
            ],
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

// OpenAI API로 이미지 생성
async function generateImage(prompt, size = "1024x1024") {
    return await callOpenAIImage(prompt, size);
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

// GCS에 직접 업로드 함수
async function deployToGCSDirect(htmlContent, filename) {
    try {
        console.log("GCS 직접 업로드 시작");
        
        // 로컬 스토리지에서 GCS 설정 가져오기
        const projectId = localStorage.getItem('gcs-project-id');
        const bucketName = localStorage.getItem('gcs-bucket-name');
        const serviceAccountKey = localStorage.getItem('gcs-service-account-key');
        
        if (!projectId || !bucketName || !serviceAccountKey) {
            alert('GCS 설정을 먼저 저장해주세요.');
            return;
        }
        
        // 로딩 표시
        showLoading(true);
        
        try {
            // 서비스 계정 키 JSON 파싱
            const serviceAccount = JSON.parse(serviceAccountKey);
            console.log("서비스 계정 키 파싱 성공");
            
            // HTML 컨텐츠로부터 Blob 생성
            const blob = new Blob([htmlContent], { type: 'text/html' });
            console.log("Blob 생성 완료:", blob.size, "bytes");
            
            try {
                // GCS 버킷에 CORS 설정이 되어있는지 확인
                const corsTestUrl = `https://storage.googleapis.com/${bucketName}/cors-test`;
                
                // CORS 테스트 - HEAD 요청을 보내 CORS가 설정되어 있는지 확인
                const corsTest = await fetch(corsTestUrl, {
                    method: 'HEAD',
                    mode: 'cors'
                }).catch(e => {
                    console.log("CORS 테스트 실패:", e);
                    return { ok: false, status: e.message };
                });
                
                if (corsTest && corsTest.ok) {
                    console.log("CORS 설정 확인됨");
                    
                    // Firebase Storage를 통한 업로드 시도
                    // Firebase 초기화
                    if (!firebase.apps.length) {
                        firebase.initializeApp({
                            projectId: projectId,
                            storageBucket: `${bucketName}.appspot.com`
                        });
                    }
                    
                    // Firebase Storage 참조 생성
                    const storage = firebase.storage();
                    const storageRef = storage.ref();
                    const fileRef = storageRef.child(filename);
                    
                    // 파일 업로드
                    console.log("Firebase Storage 업로드 시작");
                    const uploadTask = await fileRef.put(blob);
                    console.log("업로드 완료:", uploadTask);
                    
                    // 다운로드 URL 가져오기
                    const downloadURL = await fileRef.getDownloadURL();
                    console.log("다운로드 URL:", downloadURL);
                    
                    // 로딩 숨기기
                    showLoading(false);
                    
                    // 성공 알림
                    alert('GCS 업로드 성공! URL: ' + downloadURL);
                    
                    // 업로드 완료 후 링크 생성 및 표시
                    displayUploadedLink(downloadURL, filename);
                    
                    return downloadURL;
                } else {
                    // CORS가 설정되어 있지 않은 경우 가이드 표시
                    console.log("CORS 설정이 필요합니다.");
                    
                    // 로딩 숨기기
                    showLoading(false);
                    
                    // 파일 다운로드로 대체
                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(blob);
                    downloadLink.download = filename;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    
                    // CORS 설정 가이드 표시
                    const linkContainer = document.getElementById('link-container') || createLinkContainer();
                    const guideElement = document.createElement('div');
                    guideElement.className = 'mt-4 p-4 bg-yellow-100 rounded';
                    guideElement.innerHTML = `
                        <p class="font-semibold">GCS CORS 설정 가이드</p>
                        <p class="my-2">직접 업로드를 위해 GCS 버킷에 CORS 설정이 필요합니다:</p>
                        <ol class="list-decimal ml-5 mt-2">
                            <li>GCS 콘솔에 접속: <a href="https://console.cloud.google.com/storage/browser/${bucketName}" target="_blank" class="text-blue-600 underline">GCS 버킷 바로가기</a></li>
                            <li>"설정" 탭으로 이동</li>
                            <li>"CORS 구성"에 다음 JSON을 추가하세요:</li>
                        </ol>
                        <pre class="bg-gray-800 text-white p-3 rounded mt-2 overflow-auto">
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "OPTIONS"],
    "responseHeader": ["Content-Type", "Content-Length", "Content-Encoding", "Content-Disposition", "Cache-Control", "Authorization"],
    "maxAgeSeconds": 3600
  }
]</pre>
                        <p class="mt-3">설정 후 다시 시도해주세요. 파일은 이미 다운로드되었습니다: ${filename}</p>
                    `;
                    linkContainer.appendChild(guideElement);
                    
                    return null;
                }
            } catch (uploadError) {
                console.error("파일 업로드 오류:", uploadError);
                
                // 로딩 숨기기
                showLoading(false);
                
                alert('파일 업로드 실패: ' + uploadError.message);
                return null;
            }
        } catch (error) {
            console.error("GCS 업로드 준비 오류:", error);
            
            // 로딩 숨기기
            showLoading(false);
            
            alert('GCS 업로드 준비 실패: ' + error.message);
            return null;
        }
    } catch (error) {
        console.error("GCS 직접 업로드 오류:", error);
        
        // 로딩 숨기기
        showLoading(false);
        
        alert('GCS 업로드 실패: ' + error.message);
        return null;
    }
}

// 로딩 표시/숨김 함수
function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        if (show) {
            loadingIndicator.classList.remove('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
        }
    }
}

// 업로드된 링크 표시 함수
function displayUploadedLink(url, filename) {
    // 링크 컨테이너 찾기 또는 생성
    let container = document.getElementById('link-container');
    if (!container) {
        container = createLinkContainer();
    }
    
    // 기존 링크 제거
    const existingLink = container.querySelector(`a[data-filename="${filename}"]`);
    if (existingLink) {
        existingLink.parentElement.remove();
    }
    
    // 새 링크 아이템 생성
    const linkItem = document.createElement('div');
    linkItem.className = 'bg-white shadow rounded p-3 my-2 flex justify-between items-center';
    
    const linkAnchor = document.createElement('a');
    linkAnchor.href = url;
    linkAnchor.target = '_blank';
    linkAnchor.textContent = filename;
    linkAnchor.className = 'text-blue-600 hover:underline';
    linkAnchor.setAttribute('data-filename', filename);
    
    linkItem.appendChild(linkAnchor);
    container.appendChild(linkItem);
}

// 링크 컨테이너 생성 함수
function createLinkContainer() {
    const container = document.createElement('div');
    container.id = 'link-container';
    container.className = 'mt-6';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold mb-2';
    title.textContent = '배포된 사이트 링크';
    
    container.appendChild(title);
    document.getElementById('step-5-content').appendChild(container);
    
    return container;
}
