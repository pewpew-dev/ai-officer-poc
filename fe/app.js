// app.js - 웹사이트 생성 응용 프로그램의 주 진입점
// 모든 모듈을 import하고 이벤트 리스너를 설정하여 앱 기능을 초기화합니다.

// Firebase 인증 모듈 import
import * as auth from './scripts/auth.js';
// core.js 모듈 import - 주요 전역 변수 및 기본 기능
import * as core from './scripts/core.js';
// ui-handler.js 모듈 import - UI 관련 기능
import * as ui from './scripts/ui-handler.js';
// ai-service.js 모듈 import - AI API 호출 관련 기능
import * as aiService from './scripts/ai-service.js';

// 1단계: 아이디어에서 기획 및 디자인 생성
async function generatePlanning() {
    const idea = document.getElementById('idea-input').value.trim();
    if (!idea) {
        ui.showErrorModal('웹사이트 아이디어를 입력해주세요.');
        return;
    }

    try {
        // 로딩 표시
        ui.showLoading(true);
        
        // 현재 단계(1단계) 데이터 저장
        core.saveStepToLocalStorage(1, idea);
        
        // 기획 및 디자인 요구사항 생성
        await aiService.generatePlanning();
        
    } catch (error) {
        ui.showLoading(false);
        ui.showErrorModal(`기획 및 디자인 요구사항 생성 중 오류가 발생했습니다: ${error.message}`);
        console.error('기획 생성 오류:', error);
    }
}

// 2단계: 기획 및 디자인 요구사항으로 프롬프트 생성 (DALL-E 및 GPT-4o 프롬프트)
async function generatePrompts() {
    try {
        // 프롬프트 생성
        await aiService.generatePrompts();
    } catch (error) {
        ui.showErrorModal(`오류가 발생했습니다: ${error.message}`);
        console.error('Error:', error);
    } finally {
        // 로딩 상태 해제
        ui.showLoading(false);
    }
}

// 3단계: DALL-E 프롬프트로 이미지 생성
async function generateImages() {
    try {
        console.log("generateImages 함수 시작");
        console.log("localStorage step3:", localStorage.getItem('ai-website-generator-step3'));
        
        // 이미지 생성
        await aiService.generateImages();
    } catch (error) {
        ui.showErrorModal(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
        console.error('이미지 생성 오류:', error);
        ui.showLoading(false);
    }
}

// 4단계: 생성된 이미지와 프롬프트로 최종 코드 생성
async function generateFinalCode() {
    try {
        // 최종 코드 생성
        await aiService.generateFinalCode();
    } catch (error) {
        ui.showLoading(false);
        ui.showErrorModal(`코드 생성 중 오류가 발생했습니다: ${error.message}`);
        console.error('코드 생성 오류:', error);
    }
}

// 완료된 가장 높은 단계로 이동
function moveToHighestCompletedStep() {
    // 완료된 단계 중 가장 높은 단계 찾기
    let highestStep = 0;
    for (let i = 5; i >= 1; i--) {
        if (core.checkStepData(i)) {
            highestStep = i; // 실제 단계 번호 사용 (인덱스로 변환하지 않음)
            break;
        }
    }
    
    // 가장 높은 단계로 이동 (단, 데이터가 있는 경우만)
    if (highestStep > 0) {
        ui.showStep(highestStep);
    } else {
        // 완료된 단계가 없으면 1단계로 이동
        ui.showStep(1);
    }
    
    // 초기 로딩 인디케이터 숨기기
    document.getElementById('initial-loading-indicator').classList.add('hidden');
}

// 미리보기 함수
function showPreview() {
    try {
        // HTML 코드 가져오기
        let htmlCode = document.getElementById('generated-code').textContent;
        if (!htmlCode) {
            ui.showErrorModal('먼저 HTML 코드를 생성해주세요.');
            return;
        }
        
        // 미리보기 창에 표시할 HTML 수정 (도메인 보안 제한으로 인해 일부 기능 제거)
        htmlCode = htmlCode.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // 스크립트 태그 제거
        
        // 플레이스홀더를 OpenAI URL로 변경
        const step4Data = core.loadStepFromLocalStorage(4);
        if (step4Data) {
            Object.keys(step4Data).forEach(key => {
                if (step4Data[key] && typeof step4Data[key] === 'object' && step4Data[key].url) {
                    const placeholder = step4Data[key].placeholder;
                    const url = step4Data[key].url;
                    if (placeholder && url) {
                        // 이미지 URL이 있으면 해당 플레이스홀더를 URL로 교체
                        htmlCode = htmlCode.replace(new RegExp(placeholder, 'g'), url);
                    }
                }
            });
        }
        
        // HTML 파일 다운로드 대신 core.js의 downloadCode 함수 활용
        core.downloadCode(htmlCode, "preview.html");
    } catch (error) {
        console.error('미리보기 오류:', error);
        ui.showErrorModal('미리보기를 표시하는 중 오류가 발생했습니다.');
    }
}

// 프롬프트 편집 적용 함수
function applyPlanningEdit() {
    const newContent = document.getElementById('planning-editor').value.trim();
    if (newContent) {
        document.getElementById('planning-output').innerHTML = marked.parse(newContent);
    }
}

// DALL-E 프롬프트 편집 적용
function applyDalleEdit() {
    const dallePromptEditor = document.getElementById('dalle-prompt-editor');
    if (dallePromptEditor) {
        const editedPrompt = dallePromptEditor.value.trim();
        document.getElementById('dalle-prompt').innerHTML = `<p>${editedPrompt}</p>`;
        // 프롬프트 저장
        core.saveStepToLocalStorage(3, {
            dalle: editedPrompt,
            gpt4o: core.loadStepFromLocalStorage(3).gpt4o
        });
        
        // 프롬프트 길이 업데이트
        window.updateDallePromptLength && window.updateDallePromptLength();
    }
}

// GPT-4o 프롬프트 편집 적용
function applyGpt4oEdit() {
    const gpt4oPromptEditor = document.getElementById('gpt4o-prompt-editor');
    const gpt4oPromptOutput = document.getElementById('gpt4o-prompt');
    const newContent = gpt4oPromptEditor.value.trim();
    if (newContent) {
        gpt4oPromptOutput.innerHTML = marked.parse(newContent);
        // 프롬프트 저장
        core.saveStepToLocalStorage(3, {
            dalle: core.loadStepFromLocalStorage(3).dalle,
            gpt4o: newContent
        });
    }
}

// 이벤트 리스너 등록 함수
function setupEventListeners() {
    try {
        // 진행 단계 아이콘 클릭 이벤트 추가
        const progressSteps = document.querySelectorAll('.progress-step');
        progressSteps.forEach(step => {
            step.addEventListener('click', function() {
                const targetStep = parseInt(this.getAttribute('data-step'));
                ui.showStep(targetStep);
            });
        });
        
        // 기능 버튼 이벤트 리스너 추가
        document.getElementById('generate-planning')?.addEventListener('click', generatePlanning);
        document.getElementById('back-to-idea')?.addEventListener('click', () => ui.showStep(1));
        document.getElementById('apply-planning-edit')?.addEventListener('click', applyPlanningEdit);
        document.getElementById('generate-prompts')?.addEventListener('click', generatePrompts);
        document.getElementById('back-to-planning')?.addEventListener('click', () => ui.showStep(2));
        document.getElementById('generate-images')?.addEventListener('click', generateImages);
        document.getElementById('back-to-prompts')?.addEventListener('click', () => ui.showStep(3));
        document.getElementById('generate-final-code')?.addEventListener('click', generateFinalCode);
        document.getElementById('back-to-images')?.addEventListener('click', () => ui.showStep(4));
        document.getElementById('deploy-gcs-btn')?.addEventListener('click', deployToBackend);
        document.getElementById('reset-cache')?.addEventListener('click', core.resetLocalStorageCache);
        
        // 미리보기 버튼 이벤트 리스너 추가
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', showPreview);
        }
        
        // 로그인/로그아웃 버튼 이벤트 리스너
        const googleLoginButton = document.getElementById('google-login-button');
        if (googleLoginButton) {
            googleLoginButton.addEventListener('click', auth.googleLogin);
        }
        
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', auth.logout);
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

// 로컬 스토리지 데이터를 UI에 표시하는 함수
function renderLoadedData() {
    try {
        console.log("로드된 데이터:", {
            step1: core.stepsMemory.step1,
            step2: core.stepsMemory.step2,
            step3: core.stepsMemory.step3,
            step4: core.stepsMemory.step4,
            step5: core.stepsMemory.step5
        });
        
        // 1단계: 아이디어
        if (core.stepsMemory.step1) {
            if (core.ideaInput) core.ideaInput.value = core.stepsMemory.step1;
        }
        
        // 2단계: 기획안
        if (core.stepsMemory.step2) {
            let planningData = '';
            if (typeof core.stepsMemory.step2 === 'string') {
                planningData = core.stepsMemory.step2;
            } else if (typeof core.stepsMemory.step2 === 'object' && core.stepsMemory.step2 !== null) {
                // 객체인 경우 planning 속성 확인
                planningData = core.stepsMemory.step2.planning || JSON.stringify(core.stepsMemory.step2);
            }
                
            if (core.planningOutput) core.planningOutput.innerHTML = marked.parse(planningData);
            if (core.planningEditor) core.planningEditor.value = planningData;
        }
        
        // 3단계: 프롬프트
        if (core.stepsMemory.step3) {
            if (typeof core.stepsMemory.step3 === 'object' && core.stepsMemory.step3 !== null) {
                if (core.stepsMemory.step3.dalle) {
                    if (core.dallePromptOutput) core.dallePromptOutput.innerHTML = core.stepsMemory.step3.dalle;
                    if (core.dallePromptEditor) core.dallePromptEditor.value = core.stepsMemory.step3.dalle;
                    
                    // core.prompts 객체 업데이트
                    core.prompts.dalle = core.stepsMemory.step3.dalle;
                }
                if (core.stepsMemory.step3.gpt4o) {
                    if (core.gpt4oPromptOutput) core.gpt4oPromptOutput.innerHTML = core.stepsMemory.step3.gpt4o;
                    if (core.gpt4oPromptEditor) core.gpt4oPromptEditor.value = core.stepsMemory.step3.gpt4o;
                    
                    // core.prompts 객체 업데이트
                    core.prompts.gpt4o = core.stepsMemory.step3.gpt4o;
                }
            }
        }
        
        // 4단계: 이미지
        if (core.stepsMemory.step4 && typeof core.stepsMemory.step4 === 'object' && core.stepsMemory.step4 !== null) {
            // 이미지 요소 직접 업데이트
            const imageKeys = ['header', 'hero', 'content1', 'content2', 'content3'];
            imageKeys.forEach(key => {
                if (core.stepsMemory.step4[key] && core.stepsMemory.step4[key].url) {
                    const imgElement = document.getElementById(`${key}-image`);
                    if (imgElement) {
                        imgElement.src = core.stepsMemory.step4[key].url;
                        imgElement.style.display = 'block';
                    }
                }
            });
        }
        
        // 5단계: 생성된 코드
        if (core.stepsMemory.step5) {
            let codeData = '';
            if (typeof core.stepsMemory.step5 === 'string') {
                codeData = core.stepsMemory.step5;
            } else if (typeof core.stepsMemory.step5 === 'object' && core.stepsMemory.step5 !== null) {
                // 객체인 경우 html 또는 code 속성 확인하거나 JSON으로 변환
                codeData = core.stepsMemory.step5.html || core.stepsMemory.step5.code || JSON.stringify(core.stepsMemory.step5, null, 2);
            }
            
            if (core.generatedCode) core.generatedCode.textContent = codeData;
            ui.updatePreview(codeData);
        }
    } catch (error) {
        console.error("데이터 렌더링 오류:", error);
    }
}

// DALL-E 프롬프트 편집 적용
function applyDallePromptEdit() {
    const dallePromptEditor = document.getElementById('dalle-prompt-editor');
    
    if (dallePromptEditor) {
        const editedPrompt = dallePromptEditor.value.trim();
        document.getElementById('dalle-prompt').innerHTML = `<p>${editedPrompt}</p>`;
        
        // 기존 gpt4o 프롬프트 가져오기
        const currentStep3Data = core.loadStepFromLocalStorage(3) || {};
        const gpt4oPrompt = currentStep3Data.gpt4o || '';
        
        // 프롬프트 저장
        core.saveStepToLocalStorage(3, {
            dalle: editedPrompt,
            gpt4o: gpt4oPrompt
        });
        
        // 프롬프트 길이 업데이트
        window.updateDallePromptLength();
    }
}

// GPT-4o 프롬프트 편집 적용
function applyGpt4oPromptEdit() {
    const gpt4oPromptEditor = document.getElementById('gpt4o-prompt-editor');
    const gpt4oPromptOutput = document.getElementById('gpt4o-prompt');
    const newContent = gpt4oPromptEditor.value.trim();
    
    if (newContent) {
        gpt4oPromptOutput.innerHTML = marked.parse(newContent);
        
        // 기존 dalle 프롬프트 가져오기
        const currentStep3Data = core.loadStepFromLocalStorage(3) || {};
        const dallePrompt = currentStep3Data.dalle || '';
        
        // 프롬프트 저장
        core.saveStepToLocalStorage(3, {
            dalle: dallePrompt,
            gpt4o: newContent
        });
    }
}

// 메인 초기화 함수
async function initialize() {
    try {
        // 초기 로딩 인디케이터 표시
        document.getElementById('initial-loading-indicator').classList.remove('hidden');
        
        // 외부 라이브러리 로드 (marked.js)
        await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
        
        // DOM 요소 참조 초기화
        const elements = {
            ideaInput: document.getElementById('idea-input'),
            apiKeyInput: document.getElementById('api-key-input'),
            planningOutput: document.getElementById('planning-output'),
            planningEditor: document.getElementById('planning-editor'),
            dallePromptOutput: document.getElementById('dalle-prompt'),
            gpt4oPromptOutput: document.getElementById('gpt4o-prompt'),
            
            planningCopyBtn: document.getElementById('copy-planning-btn'),
            dallePromptCopyBtn: document.getElementById('copy-dalle-prompt-btn'),
            gpt4oPromptCopyBtn: document.getElementById('copy-gpt4o-prompt-btn'),
            
            generatePlanningBtn: document.getElementById('generate-planning'),
            generatePromptsBtn: document.getElementById('generate-prompts'),
            generateImagesBtn: document.getElementById('generate-images'),
            generateCodeBtn: document.getElementById('generate-code'),
            
            backToIdeaBtn: document.getElementById('back-to-idea'),
            backToPlanningBtn: document.getElementById('back-to-planning'),
            backToPromptsBtn: document.getElementById('back-to-prompts'),
            backToImagesBtn: document.getElementById('back-to-images'),
            
            dallePromptEditor: document.getElementById('dalle-prompt-editor'),
            gpt4oPromptEditor: document.getElementById('gpt4o-prompt-editor'),
            
            stepContainers: document.querySelectorAll('.step-content'),
            loadingIndicator: document.getElementById('loading-indicator'),
            errorModal: document.getElementById('error-modal'),
            
            generatedCode: document.getElementById('generated-code'),
            previewFrame: document.getElementById('preview-iframe'),
            downloadBtn: document.getElementById('download-btn'),
            deployBtn: document.getElementById('deploy-btn'),
            
            dallePromptCharCount: document.getElementById('dalle-prompt-count')
        };
        core.initDomReferences(elements);
        
        // Firebase 인증 초기화
        await auth.initFirebaseAuth();
        
        // 이벤트 리스너 등록
        setupEventListeners();
        
        // 로컬 스토리지에서 모든 단계 데이터 로드
        for (let i = 1; i <= 5; i++) {
            core.loadStepFromLocalStorage(i);
        }
        
        // 로드된 데이터 UI에 표시
        renderLoadedData();
        
        // 가장 높은 완료 단계로 이동
        moveToHighestCompletedStep();
        
        // DALL-E 프롬프트 길이 초기화
        if (window.updateDallePromptLength) {
            window.updateDallePromptLength();
        }
        
    } catch (error) {
        console.error("앱 초기화 오류:", error);
        ui.showErrorModal('필요한 라이브러리를 불러오는 데 실패했습니다.');
        // 오류 발생 시에도 로딩 인디케이터 숨기기
        document.getElementById('initial-loading-indicator').classList.add('hidden');
    }
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

// 클라우드에 배포
async function deployToBackend() {
    try {
        // ui-handler.js의 deployToCloud 함수 호출
        await ui.deployToCloud();
    } catch (error) {
        console.error('배포 오류:', error);
        ui.showErrorModal(`배포 준비 중 오류가 발생했습니다: ${error.message}`);
    }
}

// 초기화 실행
document.addEventListener('DOMContentLoaded', initialize);
