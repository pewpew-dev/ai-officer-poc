/**
 * 프롬프트 템플릿 설정
 * 수정이 필요한 경우 이 부분만 변경하세요.
 */
// config.js에서 프롬프트 템플릿을 가져옵니다.
import { firebaseConfig, apiEndpoints, LOCAL_STORAGE_KEYS, promptTemplates, modelSettings } from './config.js';
import { initFirebaseAuth, loadUserUsage, googleLogin, logout } from './auth.js';

// 이미지 URL 저장 
let imageUrls = {
    header: { placeholder: '{{IMAGE_HEADER}}', url: '' },
    hero: { placeholder: '{{IMAGE_HERO}}', url: '' },
    content1: { placeholder: '{{IMAGE_CONTENT1}}', url: '' },
    content2: { placeholder: '{{IMAGE_CONTENT2}}', url: '' },
    content3: { placeholder: '{{IMAGE_CONTENT3}}', url: '' }
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
            const ideaInput = document.getElementById('idea-input');
            if (ideaInput) ideaInput.value = step1Data;
        }
    }
    
    // 2단계: 기획 및 디자인 요구사항
    const step2Data = loadStepFromLocalStorage(2);
    if (step2Data) {
        if (step2Data.planning) {
            planningDoc = step2Data.planning;
            
            let fullText = step2Data.planning;
            if (step2Data.designRequirements) {
                fullText += "\n\n" + step2Data.designRequirements;
            }
            
            const planningEditor = document.getElementById('planning-editor');
            if (planningEditor) planningEditor.value = fullText;
            const planningOutput = document.getElementById('planning-output');
            if (planningOutput) planningOutput.innerHTML = marked.parse(fullText);
        }
    }
    
    // 3단계: 프롬프트
    const step3Data = loadStepFromLocalStorage(3);
    if (step3Data) {
        if (step3Data.dalle) {
            const dallePromptEditor = document.getElementById('dalle-prompt-editor');
            if (dallePromptEditor) dallePromptEditor.value = step3Data.dalle;
            const dallePromptOutput = document.getElementById('dalle-prompt');
            if (dallePromptOutput) dallePromptOutput.innerHTML = `<p>${step3Data.dalle}</p>`;
            prompts.dalle = step3Data.dalle;
            
            // 프롬프트 길이 업데이트
            window.updateDallePromptLength && window.updateDallePromptLength();
        }
        
        if (step3Data.gpt4o) {
            const gpt4oPromptEditor = document.getElementById('gpt4o-prompt-editor');
            if (gpt4oPromptEditor) gpt4oPromptEditor.value = step3Data.gpt4o;
            const gpt4oPromptOutput = document.getElementById('gpt4o-prompt');
            if (gpt4oPromptOutput) gpt4oPromptOutput.innerHTML = `<p>${step3Data.gpt4o}</p>`;
            prompts.gpt4o = step3Data.gpt4o;
        }
    }
    
    // 4단계: 이미지 URL
    const step4Data = loadStepFromLocalStorage(4);
    if (step4Data) {
        if (step4Data.header) {
            const headerImage = document.getElementById('header-image');
            if (headerImage) headerImage.src = step4Data.header.url;
            if (headerImage) headerImage.style.display = 'block';
            imageUrls.header = step4Data.header;
        }
        
        if (step4Data.hero) {
            const heroImage = document.getElementById('hero-image');
            if (heroImage) heroImage.src = step4Data.hero.url;
            if (heroImage) heroImage.style.display = 'block';
            imageUrls.hero = step4Data.hero;
        }
        
        if (step4Data.content1) {
            const contentImage1 = document.getElementById('content-image-1');
            if (contentImage1) contentImage1.src = step4Data.content1.url;
            if (contentImage1) contentImage1.style.display = 'block';
            imageUrls.content1 = step4Data.content1;
        }
        
        if (step4Data.content2) {
            const contentImage2 = document.getElementById('content-image-2');
            if (contentImage2) contentImage2.src = step4Data.content2.url;
            if (contentImage2) contentImage2.style.display = 'block';
            imageUrls.content2 = step4Data.content2;
        }
        
        if (step4Data.content3) {
            const contentImage3 = document.getElementById('content-image-3');
            if (contentImage3) contentImage3.src = step4Data.content3.url;
            if (contentImage3) contentImage3.style.display = 'block';
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
            
        const generatedCode = document.getElementById('generated-code');
        if (generatedCode) generatedCode.textContent = htmlCode;
    }
}

// 완료된 가장 높은 단계로 이동
function moveToHighestCompletedStep() {
    // 완료된 단계 중 가장 높은 단계 찾기
    let highestStep = 0;
    for (let i = 5; i >= 1; i--) {
        if (checkStepData(i)) {
            highestStep = i; // 실제 단계 번호 사용 (인덱스로 변환하지 않음)
            break;
        }
    }
    
    // 가장 높은 단계로 이동 (단, 데이터가 있는 경우만)
    if (highestStep > 0) {
        showStep(highestStep);
    }
    
    // 초기 로딩 인디케이터 숨기기
    document.getElementById('initial-loading-indicator').classList.add('hidden');
}

// 단계 데이터가 있는지 확인하는 함수
function checkStepData(stepNumber) {
    try {
        // 로컬 스토리지 데이터 확인
        const key = LOCAL_STORAGE_KEYS[`STEP${stepNumber}`];
        return !!localStorage.getItem(key);
    } catch (error) {
        console.error('로컬 스토리지 확인 오류:', error);
        // 로컬 스토리지에 접근할 수 없는 경우 메모리 객체 확인
        return !!stepsMemory[`step${stepNumber}`];
    }
}

// DOM 요소
const apiKeyInput = null;
const saveApiKeyBtn = null;
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

// 메인 초기화 함수
async function initialize() {
    try {
        // 초기 로딩 인디케이터 표시
        document.getElementById('initial-loading-indicator').classList.remove('hidden');
        
        // 외부 라이브러리 로드 (marked.js)
        await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
        
        // Firebase 인증 초기화
        initFirebaseAuth();
        
        // 초기화 완료 후 이벤트 리스너 등록
        registerEventListeners();
        
        // 로컬 스토리지에서 모든 단계 데이터 로드
        loadAllStepsFromLocalStorage();
        
        // 가장 높은 완료 단계로 이동
        moveToHighestCompletedStep();
        
        // DALL-E 프롬프트 길이 초기화
        if (window.updateDallePromptLength) {
            window.updateDallePromptLength();
        }
        
        // 참고: 로딩 인디케이터는 moveToHighestCompletedStep 함수에서 숨겨집니다.
    } catch (error) {
        console.error("앱 초기화 오류:", error);
        showErrorModal('필요한 라이브러리를 불러오는 데 실패했습니다.');
        // 오류 발생 시에도 로딩 인디케이터 숨기기
        document.getElementById('initial-loading-indicator').classList.add('hidden');
    }
}

// 이벤트 리스너 등록 함수
function registerEventListeners() {
    try {
        // 진행 단계 아이콘 클릭 이벤트 추가
        const progressSteps = document.querySelectorAll('.progress-step');
        progressSteps.forEach(step => {
            step.addEventListener('click', function() {
                const targetStep = parseInt(this.getAttribute('data-step'));
                showStep(targetStep);
            });
        });
        
        // 기능 버튼 이벤트 리스너 추가
        document.getElementById('generate-planning')?.addEventListener('click', generatePlanning);
        document.getElementById('back-to-idea')?.addEventListener('click', () => showStep(1));
        document.getElementById('apply-planning-edit')?.addEventListener('click', applyPlanningEdit);
        document.getElementById('generate-prompts')?.addEventListener('click', generatePrompts);
        document.getElementById('back-to-planning')?.addEventListener('click', () => showStep(2));
        document.getElementById('generate-images')?.addEventListener('click', generateImages);
        document.getElementById('back-to-prompts')?.addEventListener('click', () => showStep(3));
        document.getElementById('generate-final-code')?.addEventListener('click', generateFinalCode);
        document.getElementById('back-to-images')?.addEventListener('click', () => showStep(4));
        document.getElementById('deploy-gcs-btn')?.addEventListener('click', deployToBackend);
        document.getElementById('reset-cache')?.addEventListener('click', resetLocalStorageCache);
        
        // 미리보기 버튼 이벤트 리스너 추가
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', showPreview);
        }
        
        // 로그인/로그아웃 버튼 이벤트 리스너
        const googleLoginButton = document.getElementById('google-login-button');
        if (googleLoginButton) {
            googleLoginButton.addEventListener('click', googleLogin);
        }
        
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }
        
        // DALL-E 프롬프트 길이 업데이트 함수
        window.updateDallePromptLength = function() {
            const dallePromptElement = document.getElementById('dalle-prompt');
            let dallePromptText = '';
            
            // p 태그 내용 추출
            if (dallePromptElement) {
                const pTags = dallePromptElement.querySelectorAll('p');
                if (pTags.length > 0) {
                    // 모든 p 태그의 내용을 합침
                    dallePromptText = Array.from(pTags).map(p => p.textContent || '').join('\n');
                } else {
                    // p 태그가 없으면 전체 내용 사용
                    dallePromptText = dallePromptElement.textContent || '';
                }
                
                // 카운터 요소가 없는 경우 생성
                let promptCounter = document.getElementById('dalle-prompt-counter');
                if (!promptCounter) {
                    promptCounter = document.createElement('div');
                    promptCounter.id = 'dalle-prompt-counter';
                    promptCounter.className = 'absolute bottom-2 right-3 text-sm text-gray-500 bg-white px-1 py-0.5 border border-gray-200 rounded';
                    dallePromptElement.appendChild(promptCounter);
                }
                
                const charCount = dallePromptText.length;
                
                if (promptCounter) {
                    promptCounter.textContent = `${charCount}/900 bytes`;
                    
                    // 글자 수에 따라 색상 변경
                    if (charCount > 900) {
                        promptCounter.classList.add('text-red-500');
                        promptCounter.classList.remove('text-yellow-500');
                        promptCounter.classList.remove('text-gray-500');
                    } else if (charCount > 850) {
                        promptCounter.classList.add('text-yellow-500');
                        promptCounter.classList.remove('text-red-500');
                        promptCounter.classList.remove('text-gray-500');
                    } else {
                        promptCounter.classList.remove('text-red-500');
                        promptCounter.classList.remove('text-yellow-500');
                        promptCounter.classList.add('text-gray-500');
                    }
                }
            }
        }
        
        // DALL-E 프롬프트 편집기 변경 이벤트 리스너 추가
        const dallePromptEditor = document.getElementById('dalle-prompt-editor');
        if (dallePromptEditor) {
            dallePromptEditor.addEventListener('input', window.updateDallePromptLength);
        }
    } catch (error) {
        console.error("이벤트 리스너 등록 오류:", error);
    }
}

// 단계 표시 함수
function showStep(stepIndex) {
    // 단계 컨테이너 표시 설정
    stepContainers.forEach((container, index) => {
        if (index === stepIndex - 1) {
            container.style.display = 'block';
            
            // 현재 단계의 출력과 편집기 표시 설정
            if (index === 0) {
                // 아이디어 입력 단계 - 특별한 표시 설정 없음
            } else if (index === 1) {
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
        
        if (index === stepIndex - 1) {
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

// 1단계: 아이디어에서 기획 및 디자인 생성
async function generatePlanning() {
    const idea = ideaInput.value.trim();
    if (!idea) {
        showErrorModal('웹사이트 아이디어를 입력해주세요.');
        return;
    }

    try {
        // 로딩 표시
        showLoading(true);
        
        // 현재 단계(1단계) 데이터 저장
        saveStepToLocalStorage(1, idea);
        
        // OpenAI API를 사용하여 GPT-4o로 기획 및 디자인 요구사항 생성
        const systemPrompt = promptTemplates.planner_ai.system_prompt;
        const userPrompt = promptTemplates.planner_ai.user_prompt_template.replace('{user_description}', idea);
        
        const response = await callOpenAI('gpt-4o', systemPrompt, userPrompt);
        
        if (response) {
            // 로딩 끝
            showLoading(false);
            
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
                
                // 사용량 정보 갱신
                loadUserUsage();
                
                showStep(2);
            } catch (parseError) {
                console.error('기획서 파싱 오류:', parseError);
                // 오류 발생시에도 전체 내용을 planning으로 저장
                saveStepToLocalStorage(2, {
                    planning: response,
                    designRequirements: ""
                });
                
                // 사용량 정보 갱신
                loadUserUsage();
                
                showStep(2);
            }
        }
    } catch (error) {
        showLoading(false);
        showErrorModal(`기획 및 디자인 요구사항 생성 중 오류가 발생했습니다: ${error.message}`);
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
    const planning = planningDoc;

    // 로딩 상태 표시
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
            // JSON 파싱 실패, 전체 텍스트를 사용
        }
        
        // JSON 형식으로 응답 요청을 명시
        const systemPrompt = promptTemplates.prompt_generator_ai.system_prompt + 
            "\n중요: 반드시 JSON 형식으로 응답해주세요. 다음 형식을 사용하세요: {\"dalle_prompt\": \"DALL-E 프롬프트 내용...\", \"gpt4o_prompt\": \"GPT-4o 프롬프트 내용...\"}";
            
        // 템플릿 변수 채우기
        const userPrompt = promptTemplates.prompt_generator_ai.user_prompt_template
            .replace('{planning_doc}', planningPart)
            .replace('{design_requirements}', designRequirementsPart) + 
            "\n\n반드시 JSON 형식으로 응답해주세요. 응답은 {\"dalle_prompt\": \"...\", \"gpt4o_prompt\": \"...\"}의 형식이어야 합니다.";

        // Claude 대신 OpenAI GPT-4o 사용으로 변경
        const response = await callOpenAI('gpt-4o', systemPrompt, userPrompt);
        
        if (response) {
            try {
                // JSON 응답 파싱 시도
                let promptData;
                let responseContent = response;
                
                // 응답이 객체 형태인지 확인하고 처리
                try {
                    const responseObj = JSON.parse(response);
                    if (responseObj.success && responseObj.data && responseObj.data.content) {
                        responseContent = responseObj.data.content;
                        console.log("Gemini API 응답에서 content를 추출했습니다:", responseContent);
                    }
                } catch (e) {
                    // 이미 문자열인 경우 그대로 사용
                    console.log("응답이 이미 문자열 형태입니다");
                }
                
                // 특별 케이스: HTML 코드를 포함한 JSON 처리
                if (responseContent.includes("html") && responseContent.includes("body")) {
                    // HTML이 포함된 JSON 수동 파싱
                    try {
                        const dalle_match = responseContent.match(/"dalle_prompt":\s*"([^"]*)"/);
                        const gpt4o_start = responseContent.indexOf('"gpt4o_prompt":');
                        
                        if (dalle_match && gpt4o_start > -1) {
                            promptData = {
                                dalle_prompt: dalle_match[1],
                                // 안내 메시지 대신 실제 HTML 코드를 저장
                                gpt4o_prompt: responseContent.match(/<html>[\s\S]*<\/html>/i)[0]
                            };
                            
                            console.log("HTML 코드 포함 응답 수동 파싱 성공");
                        }
                    } catch (e) {
                        console.error("HTML 포함 JSON 수동 파싱 실패:", e);
                    }
                }
                
                // 기존 파싱 로직 유지 (수동 파싱 실패 시 사용)
                if (!promptData) {
                    // 코드 블록 내 JSON 추출 시도 (백틱으로 둘러싸인 JSON)
                    const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                                   responseContent.match(/```\s*([\s\S]*?)\s*```/);
                    
                    if (jsonMatch) {
                        let jsonContent = jsonMatch[1] || jsonMatch[0];
                        jsonContent = jsonContent.replace(/```json|```/g, '').trim();
                        try {
                            promptData = JSON.parse(jsonContent);
                        } catch (e) {
                            console.error("JSON 블록 파싱 실패:", e);
                            console.log("파싱 실패한 내용:", jsonContent);
                            // 파싱 실패 시 기본값 사용
                            showErrorModal("프롬프트 파싱에 실패했습니다. 기본값을 사용합니다.");
                            promptData = {
                                dalle_prompt: promptTemplates.prompt_generator_ai.default_dalle_prompt,
                                gpt4o_prompt: promptTemplates.prompt_generator_ai.default_gpt4o_prompt
                            };
                        }
                    } else {
                        try {
                            promptData = JSON.parse(responseContent);
                        } catch (e) {
                            console.error("전체 응답 파싱 실패:", e);
                            console.log("파싱 실패한 내용:", responseContent);
                            // 파싱 실패 시 기본값 사용
                            showErrorModal("프롬프트 파싱에 실패했습니다. 기본값을 사용합니다.");
                            promptData = {
                                dalle_prompt: promptTemplates.prompt_generator_ai.default_dalle_prompt,
                                gpt4o_prompt: promptTemplates.prompt_generator_ai.default_gpt4o_prompt
                            };
                        }
                    }
                }
                
                if (promptData.dalle_prompt) {
                    // dalle_prompt가 배열인 경우
                    if (Array.isArray(promptData.dalle_prompt)) {
                        // 첫 번째 항목만 사용하거나 모든 항목을 문자열로 변환
                        if (promptData.dalle_prompt.length > 0) {
                            if (typeof promptData.dalle_prompt[0] === 'object' && promptData.dalle_prompt[0].prompt) {
                                // 배열 내 객체에서 prompt 필드 추출 (첫 번째 항목만)
                                prompts.dalle = promptData.dalle_prompt[0].prompt;
                            } else {
                                // 모든 항목을 문자열로 변환
                                prompts.dalle = JSON.stringify(promptData.dalle_prompt, null, 2);
                            }
                        } else {
                            prompts.dalle = "DALL-E 프롬프트 배열이 비어 있습니다.";
                        }
                    } else {
                        // 문자열인 경우 그대로 사용
                        prompts.dalle = promptData.dalle_prompt;
                    }
                    
                    dallePromptOutput.innerHTML = marked.parse(prompts.dalle);
                    dallePromptEditor.value = prompts.dalle;
                    window.updateDallePromptLength && window.updateDallePromptLength();
                } else {
                    console.error('DALL-E 프롬프트가 JSON에 없음');
                    dallePromptOutput.innerHTML = "<p>DALL-E 프롬프트를 찾을 수 없습니다.</p>";
                    prompts.dalle = promptTemplates.prompt_generator_ai.default_dalle_prompt;
                    dallePromptEditor.value = prompts.dalle;
                }
                
                if (promptData.gpt4o_prompt) {
                    prompts.gpt4o = promptData.gpt4o_prompt;
                    gpt4oPromptOutput.innerHTML = marked.parse(prompts.gpt4o);
                    gpt4oPromptEditor.value = prompts.gpt4o;
                } else {
                    console.error('GPT-4o 프롬프트가 JSON에 없음');
                    gpt4oPromptOutput.innerHTML = "<p>GPT-4o 프롬프트를 찾을 수 없습니다.</p>";
                    prompts.gpt4o = promptTemplates.prompt_generator_ai.default_gpt4o_prompt;
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
                
                // 사용량 정보 갱신
                loadUserUsage();
                
                showStep(3);
            } catch (error) {
                console.error('JSON 파싱 실패:', error);
                
                // 파싱 실패시 기본값 제공
                dallePromptOutput.innerHTML = "<p>프롬프트 파싱에 실패했습니다. 기본값을 사용합니다.</p>";
                gpt4oPromptOutput.innerHTML = "<p>프롬프트 파싱에 실패했습니다. 기본값을 사용합니다.</p>";
                
                prompts.dalle = promptTemplates.prompt_generator_ai.default_dalle_prompt;
                prompts.gpt4o = promptTemplates.prompt_generator_ai.default_gpt4o_prompt;
                
                dallePromptEditor.value = prompts.dalle;
                gpt4oPromptEditor.value = prompts.gpt4o;
            }
            
            showStep(3);
        }
    } catch (error) {
        showErrorModal(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    } finally {
        // 로딩 상태 해제
        showLoading(false);
    }
}

// 3단계: DALL-E 프롬프트로 이미지 생성
async function generateImages() {
    if (!dallePromptEditor?.value?.trim()) {
        showErrorModal('먼저 DALL-E 프롬프트를 생성해주세요.');
        return;
    }

    try {
        // 로딩 표시
        showLoading(true);
        
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
        
        // 헤더 이미지 - config의 템플릿 사용
        const headerPrompt = promptTemplates.image_generation.header_template.replace('{dalle_prompt}', prompts.dalle);
        const headerResponse = await generateImage(headerPrompt);
        if (headerResponse && headerResponse.data && headerResponse.data[0].url) {
            imageUrls.header.url = headerResponse.data[0].url;
            if (headerImage) headerImage.src = imageUrls.header.url;
            if (headerImage) headerImage.style.display = 'block';
        }
        
        // 히어로 이미지 - config의 템플릿 사용
        const heroPrompt = promptTemplates.image_generation.hero_template.replace('{dalle_prompt}', prompts.dalle);
        const heroResponse = await generateImage(heroPrompt);
        if (heroResponse && heroResponse.data && heroResponse.data[0].url) {
            imageUrls.hero.url = heroResponse.data[0].url;
            if (heroImage) heroImage.src = heroResponse.data[0].url;
            if (heroImage) heroImage.style.display = 'block';
        }
        
        // 컨텐츠 이미지 1 - config의 템플릿 사용
        const content1Prompt = promptTemplates.image_generation.content1_template.replace('{dalle_prompt}', prompts.dalle);
        const content1Response = await generateImage(content1Prompt);
        if (content1Response && content1Response.data && content1Response.data[0].url) {
            imageUrls.content1.url = content1Response.data[0].url;
            if (contentImage1) contentImage1.src = content1Response.data[0].url;
            if (contentImage1) contentImage1.style.display = 'block';
        }
        
        // 컨텐츠 이미지 2 - config의 템플릿 사용
        const content2Prompt = promptTemplates.image_generation.content2_template.replace('{dalle_prompt}', prompts.dalle);
        const content2Response = await generateImage(content2Prompt);
        if (content2Response && content2Response.data && content2Response.data[0].url) {
            imageUrls.content2.url = content2Response.data[0].url;
            if (contentImage2) contentImage2.src = content2Response.data[0].url;
            if (contentImage2) contentImage2.style.display = 'block';
        }
        
        // 컨텐츠 이미지 3 - config의 템플릿 사용
        const content3Prompt = promptTemplates.image_generation.content3_template.replace('{dalle_prompt}', prompts.dalle);
        const content3Response = await generateImage(content3Prompt);
        if (content3Response && content3Response.data && content3Response.data[0].url) {
            imageUrls.content3.url = content3Response.data[0].url;
            if (contentImage3) contentImage3.src = content3Response.data[0].url;
            if (contentImage3) contentImage3.style.display = 'block';
        }
        
        // 로딩 끝
        showLoading(false);
        
        // 응답 데이터로 4단계 데이터 저장
        saveStepToLocalStorage(4, { ...imageUrls });
        
        // 사용량 정보 갱신
        loadUserUsage();
        
        showStep(4);
    } catch (error) {
        showErrorModal(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
        console.error('이미지 생성 오류:', error);
        showLoading(false);
    }
}

// 4단계: 생성된 이미지와 프롬프트로 최종 코드 생성
async function generateFinalCode() {
    if (!imageUrls.header.url || !imageUrls.hero.url) {
        showErrorModal('먼저 이미지를 생성해주세요.');
        return;
    }

    try {
        // 로딩 표시
        showLoading(true);
        
        // 현재 단계(4단계) 데이터 저장
        saveStepToLocalStorage(4, { ...imageUrls });
        
        // HTML 생성 프롬프트 설정 - GPT-4o 프롬프트 직접 사용
        const userPrompt = promptTemplates.gpt4o_template.user_prompt_template
            .replace('{gpt4o_content}', prompts.gpt4o);
            
        // 이미지 URL 정보 추가
        const imageContent = `
## 이미지 플레이스홀더 정보:
- 헤더 이미지: ${imageUrls.header.url || '이미지 없음'}
- 히어로 이미지: ${imageUrls.hero.url || '이미지 없음'}
- 콘텐츠 이미지 1: ${imageUrls.content1.url || '이미지 없음'}
- 콘텐츠 이미지 2: ${imageUrls.content2.url || '이미지 없음'}
- 콘텐츠 이미지 3: ${imageUrls.content3.url || '이미지 없음'}

웹사이트 코드에서는 실제 이미지 URL을 직접 사용해주세요. 모든 HTML, CSS, JavaScript를 단일 파일로 통합하여 완전한 웹사이트를 생성해주세요.`;

        const finalPrompt = userPrompt + '\n\n' + imageContent;
        
        // Gemini API 호출하여 HTML 코드 생성
        const systemPrompt = promptTemplates.gpt4o_template.system_prompt;
        const response = await callGoogleGemini('gemini-1.5-pro', finalPrompt);
        
        if (response) {
            try {
                let htmlCode = '';
                
                // JSON 파싱 시도
                if (response.trim().startsWith('{') && response.includes('html_code')) {
                    try {
                        const jsonResponse = JSON.parse(response);
                        if (jsonResponse.html_code) {
                            htmlCode = jsonResponse.html_code;
                        } else {
                            console.error('HTML 코드 필드가 JSON에 없음');
                            htmlCode = response;
                        }
                    } catch (e) {
                        console.error('JSON 파싱 실패:', e);
                        htmlCode = response;
                    }
                } else {
                    // 코드 블록 추출 시도
                    const codeBlockMatch = response.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
                    if (codeBlockMatch) {
                        htmlCode = codeBlockMatch[1].trim();
                    } else {
                        htmlCode = response;
                    }
                }
                
                // 내부 플레이스홀더를 외부 플레이스홀더로 변환
                const placeholderMap = {
                    '__IMG_HEADER__': imageUrls.header.placeholder,
                    '__IMG_HERO__': imageUrls.hero.placeholder,
                    '__IMG_CONTENT1__': imageUrls.content1.placeholder,
                    '__IMG_CONTENT2__': imageUrls.content2.placeholder,
                    '__IMG_CONTENT3__': imageUrls.content3.placeholder
                };
                
                // 모든 플레이스홀더 변환
                Object.entries(placeholderMap).forEach(([externalPlaceholder, internalPlaceholder]) => {
                    htmlCode = htmlCode.replaceAll(externalPlaceholder, internalPlaceholder);
                });
                
                // 로딩 표시 끝
                showLoading(false);
                
                // generatedCode 엘리먼트에 하이라이트 처리된 HTML 코드 표시
                generatedCode.textContent = htmlCode;
                
                // 생성된 코드를 브라우저에서 저장하고 다운로드 링크 설정
                saveHtmlToOutputFolder(htmlCode);
                
                // 응답 데이터로 5단계 데이터 저장
                saveStepToLocalStorage(5, { html: htmlCode });
                
                // 사용량 정보 갱신
                loadUserUsage();
                
                showStep(5);
            } catch (error) {
                console.error('HTML 처리 실패:', error);
                showErrorModal(`HTML 처리 중 오류가 발생했습니다: ${error.message}`);
            }
        }
    } catch (error) {
        showLoading(false);
        showErrorModal(`코드 생성 중 오류가 발생했습니다: ${error.message}`);
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

// 배포 관련 함수
async function deployToBackend() {
    try {
        // 로딩 표시
        const deployBtn = document.getElementById('deploy-gcs-btn');
        const originalText = deployBtn.textContent;
        deployBtn.textContent = '배포 준비 중...';
        deployBtn.disabled = true;
        
        // 사용자 인증 확인
        const user = firebase.auth().currentUser;
        if (!user) {
            showErrorModal('배포하려면 로그인이 필요합니다.');
            deployBtn.textContent = originalText;
            deployBtn.disabled = false;
            return;
        }
        
        // 생성된 HTML 코드와 이미지 URL 가져오기
        const step5Data = loadStepFromLocalStorage(5);
        const step4Data = loadStepFromLocalStorage(4);
        
        if (!step5Data || !step5Data.html) {
            showErrorModal('배포할 HTML 코드가 없습니다. 먼저 코드를 생성해주세요.');
            deployBtn.textContent = originalText;
            deployBtn.disabled = false;
            return;
        }
        
        if (!step4Data || (!step4Data.imageUrls || step4Data.imageUrls.length === 0) && !step4Data.content1 && !step4Data.content2 && !step4Data.content3 && !step4Data.header && !step4Data.hero) {
            showErrorModal('업로드할 이미지가 없습니다. 먼저 이미지를 생성해주세요.');
            deployBtn.textContent = originalText;
            deployBtn.disabled = false;
            return;
        }
        
        // 예상 크레딧 비용 계산
        // 이미지 업로드 크레딧: 각 이미지 100KB로 가정하면 5개 이미지 = 500KB = 5 크레딧
        // HTML 파일 업로드 크레딧: 50KB로 가정하면 0.5 크레딧
        const estimatedStorageKB = 500 + 50; // 총 550KB 예상
        const estimatedCredits = Math.max(5, Math.ceil(estimatedStorageKB * 0.01)); // 100KB당 1 크레딧, 최소 5 크레딧
        
        // 확인 모달 표시
        showConfirmModal(
            `배포 시 약 ${estimatedCredits} 크레딧이 사용될 예정입니다. 계속하시겠습니까?`,
            async () => {
                try {
                    deployBtn.textContent = '배포 중...';
                    
                    // 토큰 가져오기
                    const idToken = await user.getIdToken();
                    
                    // 사이트 고유 식별자 생성 (타임스탬프 + 랜덤 문자열)
                    const siteId = `site_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
                    
                    // 1. 이미지 다운로드 및 업로드
                    const imageUrls = step4Data;
                    const newImageUrls = {};
                    
                    deployBtn.textContent = '이미지 처리 중...';
                    
                    // 모든 이미지 처리 (병렬 처리)
                    await Promise.all(Object.keys(imageUrls).filter(key => {
                        // 유효한 URL만 처리 (undefined, null, 빈 문자열 제외)
                        return imageUrls[key] && 
                               typeof imageUrls[key] === 'object' && 
                               imageUrls[key].url && 
                               key !== '__proto__' && 
                               key !== 'constructor';
                    }).map(async (key) => {
                        try {
                            // 이미지 파일명 생성 (폴더 경로 포함)
                            const fileName = `${siteId}/image_${key}_${Date.now()}.png`;
                            
                            // 새로운 백엔드 API를 사용하여 이미지 URL로부터 직접 업로드
                            const uploadResponse = await fetch(`${apiEndpoints.backend.base}/api/storage/upload-from-url`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${idToken}`
                                },
                                body: JSON.stringify({
                                    imageUrl: imageUrls[key].url,
                                    fileName,
                                    contentType: 'image/png'
                                })
                            });
                            
                            if (!uploadResponse.ok) {
                                const errorData = await uploadResponse.json();
                                console.error(`이미지 업로드 실패:`, errorData);
                                throw new Error(`이미지 업로드 실패 (${key}): ${errorData.error?.message || uploadResponse.status}`);
                            }
                            
                            const uploadResult = await uploadResponse.json();
                            if (uploadResult.success && uploadResult.data) {
                                newImageUrls[key] = uploadResult.data.url;
                            } else {
                                throw new Error(`이미지 업로드 응답 형식 오류 (${key})`);
                            }
                        } catch (error) {
                            console.error(`이미지 ${key} 처리 실패:`, error);
                            // 오류가 발생해도 전체 처리를 중단하지 않음
                        }
                    }));

                    // 2. HTML 내 이미지 URL 교체
                    deployBtn.textContent = 'HTML 코드 처리 중...';
                    let htmlCode = step5Data.html;
                    
                    // 이미지 URL 교체
                    Object.keys(step4Data).forEach(key => {
                        if (step4Data[key] && typeof step4Data[key] === 'object' && step4Data[key].url) {
                            // 플레이스홀더 패턴 ({{IMAGE_KEY}})
                            const placeholder = step4Data[key].placeholder;
                            htmlCode = htmlCode.replace(new RegExp(placeholder, 'g'), step4Data[key].url);
                        }
                    });
                    
                    // 3. 최종 HTML 업로드
                    deployBtn.textContent = 'HTML 업로드 중...';
                    const htmlResponse = await fetch(`${apiEndpoints.backend.base}/api/storage/upload`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({
                            content: htmlCode,
                            fileName: `${siteId}/index.html`,
                            contentType: 'text/html'
                        })
                    });
                    
                    if (!htmlResponse.ok) {
                        throw new Error(`HTML 업로드 실패: ${htmlResponse.status}`);
                    }
                    
                    const htmlResult = await htmlResponse.json();
                    
                    // 4. 배포 완료 알림
                    showSuccessModal(
                        `배포가 완료되었습니다!`,
                        htmlResult.data.url
                    );
                    
                    // 사용량 정보 갱신
                    loadUserUsage();
                    
                } catch (error) {
                    console.error('배포 처리 오류:', error);
                    showErrorModal(`배포 중 오류가 발생했습니다: ${error.message}`);
                } finally {
                    deployBtn.textContent = originalText;
                    deployBtn.disabled = false;
                }
            },
            // 취소 콜백
            () => {
                deployBtn.textContent = originalText;
                deployBtn.disabled = false;
            }
        );
        
    } catch (error) {
        console.error('배포 오류:', error);
        showErrorModal(`배포 준비 중 오류가 발생했습니다: ${error.message}`);
        
        // 버튼 원래 상태로 복원
        const deployBtn = document.getElementById('deploy-gcs-btn');
        deployBtn.textContent = '배포하기';
        deployBtn.disabled = false;
    }
}

// 미리보기 버튼에 이벤트 리스너 추가
const previewBtn = document.getElementById('preview-btn');
if (previewBtn) previewBtn.addEventListener('click', showPreview);

// 미리보기 함수
function showPreview() {
    try {
        // HTML 코드 가져오기
        let htmlCode = document.getElementById('generated-code').textContent;
        if (!htmlCode) {
            showErrorModal('먼저 HTML 코드를 생성해주세요.');
            return;
        }
        
        console.log('원본 HTML 길이:', htmlCode.length);
        
        // 플레이스홀더를 OpenAI URL로 변경
        const step4Data = loadStepFromLocalStorage(4);
        if (step4Data) {
            Object.keys(step4Data).forEach(key => {
                if (step4Data[key] && typeof step4Data[key] === 'object' && step4Data[key].url) {
                    // 플레이스홀더 패턴 ({{IMAGE_KEY}})
                    const placeholder = step4Data[key].placeholder;
                    htmlCode = htmlCode.replace(new RegExp(placeholder, 'g'), step4Data[key].url);
                }
            });
        }
        
        // iframe에서 로드될 HTML에 스크립트 추가 (CORS 모드를 no-cors로 변경)
        const noCorsScript = `
        <script>
            // 모든 이미지에 대해 fetch 요청을 no-cors 모드로 미리 시도
            window.addEventListener('DOMContentLoaded', () => {
                document.querySelectorAll('img').forEach(img => {
                    // 원본 src 저장
                    const originalSrc = img.src;
                    
                    // 임시 처리로 인라인 로딩 표시
                    img.style.border = '1px dashed #ccc';
                    img.style.background = '#f0f0f0';
                    img.style.minHeight = '50px';
                    img.style.minWidth = '50px';
                    
                    // no-cors 모드로 이미지 미리 로드 시도
                    fetch(originalSrc, { mode: 'no-cors' })
                    .then(() => {
                        // 이미지 로드 시도 (성공 여부는 확인할 수 없지만 브라우저 캐시에 저장)
                        img.src = originalSrc;
                    })
                    .catch(err => {
                        console.log('이미지 미리 로드 실패:', err);
                    });
                    
                    // 이미지 로드 실패 시 처리
                    img.onerror = () => {
                        img.style.border = '2px solid red';
                        img.style.padding = '5px';
                        img.alt = '이미지 로드 실패';
                    };
                    
                    // 이미지 로드 성공 시 처리
                    img.onload = () => {
                        img.style.border = '';
                        img.style.background = '';
                    };
                });
            });
        </script>`;
        
        // 이미지 태그에 crossorigin 속성 제거 (역효과를 일으킬 수 있음)
        htmlCode = htmlCode.replace(/ crossorigin="anonymous"/g, '');
        
        // HTML 헤드에 no-cors 스크립트 삽입
        htmlCode = htmlCode.replace('</head>', `${noCorsScript}</head>`);
        
        // Blob URL 생성
        const blob = new Blob([htmlCode], { type: 'text/html' });
        const blobURL = URL.createObjectURL(blob);
        
        // 새 탭에서 Blob URL 열기
        window.open(blobURL, '_blank');
    } catch (error) {
        console.error('미리보기 오류:', error);
        showErrorModal('미리보기를 표시하는 중 오류가 발생했습니다.');
    }
}

// HTML 파일 다운로드
function downloadHtmlFile(htmlCode, fileName) {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'generated_website.html';
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
        showErrorModal('팝업 차단이 활성화되어 있습니다. 미리보기를 허용해주세요.');
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
            showErrorModal('코드 복사에 실패했습니다.');
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
    const dallePromptEditor = document.getElementById('dalle-prompt-editor');
    if (dallePromptEditor) {
        const editedPrompt = dallePromptEditor.value.trim();
        document.getElementById('dalle-prompt').innerHTML = `<p>${editedPrompt}</p>`;
        // 프롬프트 저장
        prompts.dalle = editedPrompt;
        // 현재 단계 데이터 업데이트
        saveStepToLocalStorage(3, {
            dalle: editedPrompt,
            gpt4o: prompts.gpt4o
        });
        
        // 프롬프트 길이 업데이트
        window.updateDallePromptLength();
    }
}

function applyGpt4oEdit() {
    const newContent = gpt4oPromptEditor.value.trim();
    if (newContent) {
        prompts.gpt4o = newContent;
        gpt4oPromptOutput.innerHTML = marked.parse(prompts.gpt4o);
    }
}

// OpenAI API 텍스트 생성 호출 함수 (백엔드 API 사용)
async function callOpenAI(model, systemPrompt, userPrompt) {
    // 현재 인증된 사용자의 ID 토큰 가져오기
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('로그인이 필요합니다.');
    }
    
    const idToken = await user.getIdToken();
    
    const response = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.openai}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
            type: "text",
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
        throw new Error(error.message || 'API 호출 중 오류가 발생했습니다.');
    }

    const result = await response.json();
    
    // 간소화된 백엔드 응답 구조에 맞게 파싱
    if (result.success && result.data && result.data.content) {
        return result.data.content;
    } else {
        throw new Error('응답 데이터 형식이 올바르지 않습니다.');
    }
}

// Google Gemini API 텍스트 생성 호출 함수 (백엔드 API 사용)
async function callGoogleGemini(model, content) {
    // 현재 인증된 사용자의 ID 토큰 가져오기
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('로그인이 필요합니다.');
    }
    
    const idToken = await user.getIdToken();
    
    const response = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.google}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
            type: "text",
            model: model,
            contents: [content],
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google Gemini API 호출 중 오류가 발생했습니다.');
    }

    const result = await response.json();
    
    // 간소화된 백엔드 응답 구조에 맞게 파싱
    if (result.success && result.data && result.data.content) {
        return result.data.content;
    } else {
        throw new Error('Google Gemini 응답 데이터 형식이 올바르지 않습니다.');
    }
}

// Anthropic Claude API 텍스트 생성 호출 함수 (백엔드 API 사용)
async function callAnthropicClaude(model, systemPrompt, userPrompt) {
    // 현재 인증된 사용자의 ID 토큰 가져오기
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('로그인이 필요합니다.');
    }
    
    const idToken = await user.getIdToken();
    
    const response = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.anthropic}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
            type: "text",
            model: model,
            messages: [
                {
                    "role": "user",
                    "content": userPrompt
                }
            ],
            max_tokens: 4000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Anthropic Claude API 호출 중 오류가 발생했습니다.');
    }

    const result = await response.json();
    
    // 간소화된 백엔드 응답 구조에 맞게 파싱
    if (result.success && result.data && result.data.content) {
        return result.data.content;
    } else {
        throw new Error('Anthropic Claude 응답 데이터 형식이 올바르지 않습니다.');
    }
}

// OpenAI API 이미지 생성 호출 함수 (백엔드 API 사용)
async function callOpenAIImage(prompt, size = "1024x1024") {
    // 현재 인증된 사용자의 ID 토큰 가져오기
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('로그인이 필요합니다.');
    }
    
    const idToken = await user.getIdToken();
    
    const response = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.openai}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
            type: "image",
            model: modelSettings.openai.image,
            prompt: prompt,
            n: 1,
            size: size,
            response_format: "url"
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '이미지 생성 중 오류가 발생했습니다.');
    }

    const result = await response.json();
    
    // 간소화된 백엔드 응답 구조에 맞게 수정
    if (result.success && result.data && result.data.images) {
        return {
            data: result.data.images
        };
    } else {
        throw new Error('응답 데이터 형식이 올바르지 않습니다.');
    }
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

// 템플릿 파일 로드 함수
async function loadTemplateFile(templatePath) {
  try {
    const response = await fetch(templatePath);
    return await response.text();
  } catch (error) {
    console.error('템플릿 로드 오류:', error);
    return null;
  }
}

// 캐시 초기화 함수
function resetLocalStorageCache() {
    showConfirmModal(
        '정말 모든 캐시를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        () => {
            try {
                // 로컬 스토리지의 모든 단계 데이터 삭제
                for (let i = 1; i <= 5; i++) {
                    const key = LOCAL_STORAGE_KEYS[`STEP${i}`];
                    localStorage.removeItem(key);
                }
                
                // 사용자에게 알림
                showSuccessModal('캐시가 성공적으로 초기화되었습니다. 페이지를 새로고침합니다.');
                
                // 1초 후 페이지 새로고침
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (error) {
                console.error('캐시 초기화 오류:', error);
                showErrorModal('캐시 초기화 중 오류가 발생했습니다.');
            }
        }
    );
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

// 모달 관련 함수
function showModal(title, content, actions = []) {
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalActions = document.getElementById('modal-actions');
    
    // 제목과 내용 설정
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    
    // 액션 버튼 설정
    modalActions.innerHTML = '';
    actions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.text;
        button.className = action.primary 
            ? 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded';
        button.onclick = action.onClick;
        modalActions.appendChild(button);
    });
    
    // 모달 표시
    modalContainer.classList.remove('hidden');
    
    // 닫기 버튼에 이벤트 리스너 추가
    document.getElementById('modal-close').onclick = closeModal;
}

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

// 에러 모달 표시
function showErrorModal(message, onClose = null) {
    showModal(
        '오류 발생', 
        `<p class="text-red-500">${message}</p>`, 
        [
            { 
                text: '확인', 
                primary: true, 
                onClick: () => {
                    closeModal();
                    if (onClose) onClose();
                } 
            }
        ]
    );
}

// 성공 모달 표시
function showSuccessModal(message, url = null) {
    let content = `<p class="text-green-500 mb-3">${message}</p>`;
    
    if (url) {
        content += `<p class="text-gray-700">배포된 주소: <a href="${url}" target="_blank" class="text-blue-500 hover:underline break-all">${url}</a></p>`;
    }
    
    showModal(
        '성공', 
        content, 
        [
            { 
                text: '닫기', 
                primary: false, 
                onClick: closeModal 
            },
            ...(url ? [{ 
                text: '사이트로 이동', 
                primary: true, 
                onClick: () => {
                    window.open(url, '_blank');
                    closeModal();
                } 
            }] : [])
        ]
    );
}

// 확인 모달 표시 (예/아니오 선택 가능)
function showConfirmModal(message, onConfirm, onCancel = null) {
    showModal(
        '확인', 
        `<p class="text-gray-700 mb-3">${message}</p>`, 
        [
            { 
                text: '아니오', 
                primary: false, 
                onClick: () => {
                    closeModal();
                    if (onCancel) onCancel();
                } 
            },
            { 
                text: '예', 
                primary: true, 
                onClick: () => {
                    closeModal();
                    if (onConfirm) onConfirm();
                } 
            }
        ]
    );
}

// 전역에서 모달 함수에 접근할 수 있도록 설정
window.showModal = showModal;
window.closeModal = closeModal;
window.showErrorModal = showErrorModal;
window.showSuccessModal = showSuccessModal;
window.showConfirmModal = showConfirmModal;

// 초기 설정
window.addEventListener('DOMContentLoaded', initialize);

// 진행 단계 아이콘 클릭 이벤트 추가
window.onload = function() {
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach(step => {
        step.onclick = function() {
            const stepIndex = parseInt(this.getAttribute('data-step'));
            showStep(stepIndex);
        };
    });
}
