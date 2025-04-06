// 로컬 스토리지 키 - config.js에서 가져온 키로 통일합니다
import { LOCAL_STORAGE_KEYS } from '../config.js';

// 설정 및 API 엔드포인트 가져오기
import { apiEndpoints, modelSettings, firebaseConfig } from '../config.js';
import * as ui from './ui-handler.js';
import * as auth from './auth.js';
import { callOpenAI, callGoogleGemini } from './ai-service.js';
import * as core from './core.js'; // core.js의 공통 기능 사용

// 전역 변수 및 요소
const improve = {
    previewIframe: null,
    codeDisplay: null,
    improvementPrompt: null,
    improveButton: null,
    viewCodeBtn: null,
    downloadCodeBtn: null,
    codeModal: null,
    closeModalBtn: null,
    loadingIndicator: null,
    modelSelect: null,
    currentCode: '',
    originalCode: '', // 원본 코드 저장
    originalRequirements: {
        idea: '',
        planning: '',
        prompts: { dalle: '', gpt4o: '' }
    },
    
    loginSection: null,
    loggedInSection: null,
    userEmailDisplay: null,
    userUsageDisplay: null,
    googleLoginBtn: null,
    logoutBtn: null,
    
    // 로컬 스토리지 정보 표시 관련 요소 추가
    storageSection: null,
    storageSectionHeader: null,
    storageContent: null,
    storageArrow: null,
    
    // 프롬프트 표시 관련 요소 추가
    promptSectionHeader: null,
    promptContent: null,
    promptArrow: null,
    sentPrompt: null,
    lastSentPrompt: '',
    
    // 토스트 알림 관련 요소
    toastNotification: null,
    toastMessage: null
};

// 외부에서 접근할 수 있도록 window 객체에 추가
window.improve = improve;

// 초기화 함수
async function init() {
    try {
        // Firebase 인증 초기화
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        // 요소 참조 가져오기
        improve.previewIframe = document.getElementById('preview-iframe');
        improve.codeDisplay = document.getElementById('code-display');
        improve.improvementPrompt = document.getElementById('improvement-prompt');
        improve.improveButton = document.getElementById('improve-code-btn');
        improve.viewCodeBtn = document.getElementById('view-code-btn');
        improve.downloadCodeBtn = document.getElementById('download-code-btn');
        improve.codeModal = document.getElementById('code-modal');
        improve.closeModalBtn = document.getElementById('close-modal-btn');
        improve.loadingIndicator = document.getElementById('loading-indicator');
        improve.modelSelect = document.getElementById('model-select');
        
        // 로그인 관련 요소
        improve.loginSection = document.getElementById('not-logged-in');
        improve.loggedInSection = document.getElementById('logged-in');
        improve.userEmailDisplay = document.getElementById('user-email');
        improve.userUsageDisplay = document.getElementById('user-usage');
        improve.googleLoginBtn = document.getElementById('google-login-button');
        improve.logoutBtn = document.getElementById('logout-button');
        
        // 로컬 스토리지 정보 표시 관련 요소
        improve.storageSection = document.getElementById('storage-section');
        improve.storageSectionHeader = document.getElementById('storage-section-header');
        improve.storageContent = document.getElementById('storage-content');
        improve.storageArrow = document.getElementById('storage-arrow');
        
        // 프롬프트 표시 관련 요소
        improve.promptSectionHeader = document.getElementById('prompt-section-header');
        improve.promptContent = document.getElementById('prompt-content');
        improve.promptArrow = document.getElementById('prompt-arrow');
        improve.sentPrompt = document.getElementById('sent-prompt');
        
        // 토스트 알림 요소
        improve.toastNotification = document.getElementById('toast-notification');
        improve.toastMessage = document.getElementById('toast-message');
        
        // 사용자 인증 확인
        const user = await auth.checkAuth();
        
        // 인증 상태에 따라 UI 업데이트
        updateAuthUI(user);
        
        // 로컬 스토리지에서 데이터 로드
        loadDataFromLocalStorage();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 코드 미리보기 업데이트
        if (user) {
            updatePreview();
        }
    } catch (error) {
        console.error('초기화 오류:', error);
        ui.showErrorModal('페이지 초기화 중 오류가 발생했습니다.');
    }
}

// 인증 상태에 따라 UI 업데이트
function updateAuthUI(user) {
    if (user) {
        // 로그인 상태
        if (improve.loginSection) improve.loginSection.classList.add('hidden');
        if (improve.loggedInSection) improve.loggedInSection.classList.remove('hidden');
        if (improve.userEmailDisplay) improve.userEmailDisplay.textContent = user.email || '사용자';
        
        // 사용량 정보 로드 (있는 경우)
        if (typeof auth.loadUserUsage === 'function') {
            auth.loadUserUsage(user.uid);
        }
        
        // 메인 콘텐츠 표시
        document.querySelector('main').classList.remove('hidden');
    } else {
        // 비로그인 상태
        if (improve.loginSection) improve.loginSection.classList.remove('hidden');
        if (improve.loggedInSection) improve.loggedInSection.classList.add('hidden');
        
        // 메인 콘텐츠 숨김
        document.querySelector('main').classList.add('hidden');
    }
}

// 로컬 스토리지에서 데이터 로드
function loadDataFromLocalStorage() {
    try {
        // 마지막 단계 데이터 로드 (단계 5)
        const step5Key = LOCAL_STORAGE_KEYS.step5;
        let step5Data = localStorage.getItem(step5Key);
        
        // HTML 코드 로드
        if (step5Data) {
            const data = JSON.parse(step5Data);
            if (data.html) {
                improve.currentCode = data.html;
                improve.originalCode = data.html;
            }
        } else {
            // 단계 5 데이터가 없으면 단계 4에서 HTML 확인
            const step4Key = LOCAL_STORAGE_KEYS.step4;
            let step4Data = localStorage.getItem(step4Key);
            
            if (step4Data) {
                const data = JSON.parse(step4Data);
                if (data.html) {
                    improve.currentCode = data.html;
                    improve.originalCode = data.html;
                }
            }
        }
        
        // 요구사항 데이터 로드
        // step1의 아이디어 데이터 가져오기
        const step1Key = LOCAL_STORAGE_KEYS.step1;
        let ideaData = localStorage.getItem(step1Key) || '';
        
        // step2의 기획서 데이터 가져오기
        const step2Key = LOCAL_STORAGE_KEYS.step2;
        let planningData = localStorage.getItem(step2Key) || '';
        
        // 기본 요구사항 객체 구성
        improve.originalRequirements = {
            idea: ideaData,
            planning: planningData,
            prompts: { dalle: '', gpt4o: '' }
        };
        
        // step3에 prompts 데이터가 있으면 함께 로드
        const step3Key = LOCAL_STORAGE_KEYS.step3;
        let step3Data = localStorage.getItem(step3Key);
        if (step3Data) {
            try {
                const promptsData = JSON.parse(step3Data);
                improve.originalRequirements.prompts = promptsData;
            } catch (e) {
                // 파싱 오류시 기본값 유지
            }
        }
        
        // 로컬 스토리지 데이터 정보를 UI에 표시
        updateLocalStorageInfo();
    } catch (error) {
        console.error('로컬 스토리지 데이터 로드 오류:', error);
        // 오류 발생 시 기본값 설정
        improve.originalRequirements = {
            idea: '',
            planning: '',
            prompts: { dalle: '', gpt4o: '' }
        };
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // Google 로그인 버튼
    if (improve.googleLoginBtn) {
        improve.googleLoginBtn.addEventListener('click', () => {
            auth.googleLogin().then(user => {
                if (user) {
                    updateAuthUI(user);
                    updatePreview();
                }
            });
        });
    }
    
    // 로그아웃 버튼
    if (improve.logoutBtn) {
        improve.logoutBtn.addEventListener('click', () => {
            auth.logout().then(() => {
                updateAuthUI(null);
            });
        });
    }
    
    // 코드 개선 버튼
    if (improve.improveButton) {
        improve.improveButton.addEventListener('click', improveCode);
    }
    
    // 코드 보기 버튼
    if (improve.viewCodeBtn) {
        improve.viewCodeBtn.addEventListener('click', () => {
            if (improve.codeDisplay) improve.codeDisplay.textContent = improve.currentCode;
            if (improve.codeModal) improve.codeModal.classList.remove('hidden');
        });
    }
    
    // 모달 닫기 버튼
    if (improve.closeModalBtn) {
        improve.closeModalBtn.addEventListener('click', () => {
            if (improve.codeModal) improve.codeModal.classList.add('hidden');
        });
    }
    
    // 코드 다운로드 버튼
    if (improve.downloadCodeBtn) {
        improve.downloadCodeBtn.addEventListener('click', downloadCode);
    }
    
    // 프롬프트 섹션 토글 (추가)
    if (improve.promptSectionHeader) {
        improve.promptSectionHeader.addEventListener('click', () => {
            // 프롬프트 컨텐츠 토글
            if (improve.promptContent.classList.contains('hidden')) {
                improve.promptContent.classList.remove('hidden');
                improve.promptArrow.classList.add('rotate-180');
            } else {
                improve.promptContent.classList.add('hidden');
                improve.promptArrow.classList.remove('rotate-180');
            }
        });
    }

    // 로컬 스토리지 섹션 토글 (추가)
    if (improve.storageSectionHeader) {
        improve.storageSectionHeader.addEventListener('click', () => {
            // 스토리지 컨텐츠 토글
            if (improve.storageContent.classList.contains('hidden')) {
                improve.storageContent.classList.remove('hidden');
                improve.storageArrow.classList.add('rotate-180');
            } else {
                improve.storageContent.classList.add('hidden');
                improve.storageArrow.classList.remove('rotate-180');
            }
        });
    }
}

// 미리보기 업데이트
function updatePreview() {
    if (improve.previewIframe && improve.currentCode) {
        // 미리보기 업데이트
        const iframe = improve.previewIframe;
        iframe.srcdoc = improve.currentCode;
    }
}

// 코드 개선 요청
async function improveCode() {
    try {
        // 신규 요구사항 가져오기
        const newRequirement = improve.improvementPrompt.value.trim();
        
        if (!newRequirement) {
            ui.showErrorModal('개선 요구사항을 입력해주세요.');
            return;
        }
        
        // 선택된 AI 모델 확인
        const selectedModel = improve.modelSelect ? improve.modelSelect.value : 'openai';
        
        // 토스트 알림 표시
        showToast(`${selectedModel === 'openai' ? 'OpenAI' : 'Google Gemini'}에 코드 개선 요청 중...`);
        
        // 로딩 표시 - 버튼만 비활성화하고 다른 UI는 활성 상태 유지
        showLoadingIndicator();
        improve.improveButton.disabled = true;
        improve.improveButton.classList.add('opacity-50', 'cursor-not-allowed');
        
        // 코드 개선 전에 현재 코드를 원본으로 저장
        improve.originalCode = improve.currentCode;
        
        // 개선 요청 프롬프트 생성
        const prompt = generateImprovementPrompt(newRequirement);
        
        // 프롬프트를 저장하고 표시
        improve.lastSentPrompt = prompt;
        if (improve.sentPrompt) {
            improve.sentPrompt.textContent = prompt;
        }
        
        // 프롬프트 컨텐츠 표시 (코드 개선 중에도 볼 수 있도록)
        if (improve.promptContent && improve.promptContent.classList.contains('hidden')) {
            improve.promptContent.classList.remove('hidden');
            improve.promptArrow.classList.add('rotate-180');
        }
        
        // API 호출
        let response;
        if (selectedModel === 'openai') {
            // OpenAI API 호출
            const systemPrompt = "당신은 웹 개발 전문가입니다. 사용자의 요구사항을 정확히 반영하여 웹사이트 코드를 개선해주세요.";
            response = await callOpenAI(modelSettings.openai.text, systemPrompt, prompt);
        } else if (selectedModel === 'gemini') {
            try {
                // Google Gemini API 호출
                const apiResponse = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.google}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('idToken')}`
                    },
                    body: JSON.stringify({
                        type: "text",
                        model: modelSettings.google.text,
                        contents: [
                            prompt
                        ]
                    })
                });
                
                if (!apiResponse.ok) {
                    const error = await apiResponse.json();
                    throw new Error(error.error?.message || 'API 호출 실패');
                }
                
                const responseData = await apiResponse.json();
                response = responseData.data.content;
            } catch (error) {
                console.error('Google Gemini API 호출 오류:', error);
                throw error;
            }
        } else {
            throw new Error('지원되지 않는 AI 모델입니다.');
        }
        
        if (!response) {
            throw new Error('API 응답이 유효하지 않습니다.');
        }
        
        // 응답에서 코드 추출 (core.js의 extractCode 함수 활용)
        const improvedCode = core.extractCode(response);
        
        if (!improvedCode) {
            throw new Error('응답에서 HTML 코드를 추출할 수 없습니다.');
        }
        
        // 개선된 코드 저장
        improve.currentCode = improvedCode;
        
        // 미리보기 업데이트
        updatePreview();
        
        // 로컬 스토리지에 개선된 코드 저장
        saveImprovedCode(improvedCode);
        
        // 로딩 표시 숨기기 및 버튼 활성화
        hideLoadingIndicator();
        improve.improveButton.disabled = false;
        improve.improveButton.classList.remove('opacity-50', 'cursor-not-allowed');
        
        // 성공 메시지 표시
        showToast('개선된 코드가 저장되었습니다!');
    } catch (error) {
        console.error('코드 개선 오류:', error);
        
        // 로딩 표시 숨기기 및 버튼 활성화 (오류 발생 시에도)
        hideLoadingIndicator();
        improve.improveButton.disabled = false;
        improve.improveButton.classList.remove('opacity-50', 'cursor-not-allowed');
        
        // 오류 메시지 표시
        showToast('코드 개선 중 오류가 발생했습니다', true);
        ui.showErrorModal('코드 개선 중 오류가 발생했습니다: ' + error.message);
    }
}

// 로딩 인디케이터 표시
function showLoadingIndicator() {
    if (improve.loadingIndicator) {
        improve.loadingIndicator.classList.remove('hiding');
        improve.loadingIndicator.classList.remove('hidden');
    }
}

// 로딩 인디케이터 숨기기 (애니메이션 효과 포함)
function hideLoadingIndicator() {
    if (improve.loadingIndicator) {
        // 애니메이션 효과 추가
        improve.loadingIndicator.classList.add('hiding');
        
        // 애니메이션 완료 후 실제로 숨김
        setTimeout(() => {
            improve.loadingIndicator.classList.add('hidden');
            improve.loadingIndicator.classList.remove('hiding');
        }, 300); // 애니메이션 시간과 일치
    }
}

// 토스트 알림 표시
function showToast(message, isError = false) {
    if (!improve.toastNotification || !improve.toastMessage) return;
    
    // 이전 타이머 초기화
    if (window.toastTimer) {
        clearTimeout(window.toastTimer);
    }
    
    // 메시지 설정
    improve.toastMessage.textContent = message;
    
    // 에러 스타일 적용
    if (isError) {
        improve.toastNotification.style.backgroundColor = 'rgba(220, 38, 38, 0.9)';  // 빨간색
    } else {
        improve.toastNotification.style.backgroundColor = 'rgba(99, 102, 241, 0.9)';  // 기본 파란색
    }
    
    // 토스트 표시
    improve.toastNotification.classList.add('show');
    
    // 3초 후 토스트 숨기기
    window.toastTimer = setTimeout(() => {
        improve.toastNotification.classList.remove('show');
    }, 3000);
}

// 개선된 코드 저장
function saveImprovedCode(improvedCode) {
    try {
        // 단계 5 데이터 가져오기
        let step5Data = localStorage.getItem(LOCAL_STORAGE_KEYS.step5);
        let data = {};
        
        if (step5Data) {
            data = JSON.parse(step5Data);
        }
        
        // 데이터 업데이트
        data.html = improvedCode;
        data.lastUpdated = new Date().toISOString();
        
        // 로컬 스토리지에 저장
        localStorage.setItem(LOCAL_STORAGE_KEYS.step5, JSON.stringify(data));
        
        return true;
    } catch (error) {
        console.error('코드 저장 오류:', error);
        return false;
    }
}

// 개선 요청 프롬프트 생성
function generateImprovementPrompt(newRequirement) {
    // requirements가 undefined이거나 빈 값인 경우 처리
    const idea = improve.originalRequirements?.idea || '정의되지 않음';
    const planning = improve.originalRequirements?.planning || '정의되지 않음';
    
    return `당신은 웹 개발 전문가입니다. 기존 웹사이트 코드와 사용자의 새로운 요구사항을 바탕으로 웹사이트 코드를 개선해주세요.

## 원래 웹사이트 요구사항
아이디어: ${idea}

기획 및 디자인:
${planning}

## 현재 코드
\`\`\`html
${improve.currentCode}
\`\`\`

## 새로운 요구사항
${newRequirement}

위 요구사항을 반영하여 웹사이트 코드를 개선해주세요. 응답은 HTML, CSS, JavaScript가 포함된 완전한 웹페이지 코드만 제공해주세요. 현재 코드의 전체 구조와 기능을 유지하면서 새로운 요구사항을 추가해주세요.`;
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 코드 다운로드
function downloadCode() {
    if (!improve.currentCode) {
        ui.showErrorModal('다운로드할 코드가 없습니다.');
        return;
    }
    
    // core.js의 downloadCode 함수 활용
    core.downloadCode(improve.currentCode, 'improved-website.html');
}

// 로컬 스토리지 정보 UI 업데이트
function updateLocalStorageInfo() {
    // 요소가 없으면 리턴
    if (!improve.storageContent) return;
    
    // 로컬 스토리지 정보 HTML 생성
    let html = '<div class="space-y-4">';
    
    // Step 1 정보
    const step1Key = LOCAL_STORAGE_KEYS.step1;
    const step1Value = localStorage.getItem(step1Key);
    html += `
    <div class="bg-gray-100 p-3 rounded-lg">
        <div class="flex justify-between items-center cursor-pointer storage-header" data-target="storage-step1">
            <h4 class="font-semibold text-sm">단계 1: 아이디어</h4>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform transition-transform storage-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
        <div class="storage-summary bg-white p-2 rounded text-xs overflow-auto max-h-20 mt-2">
            ${step1Value ? (step1Value.length > 100 ? step1Value.substring(0, 100) + '...' : step1Value) : '데이터 없음'}
        </div>
        <div class="storage-content hidden bg-white p-2 rounded text-xs overflow-auto mt-2" id="storage-step1">
            <pre class="whitespace-pre-wrap">${step1Value || '데이터 없음'}</pre>
        </div>
    </div>`;
    
    // Step 2 정보 (기획서)
    const step2Key = LOCAL_STORAGE_KEYS.step2;
    const step2Value = localStorage.getItem(step2Key);
    html += `
    <div class="bg-gray-100 p-3 rounded-lg">
        <div class="flex justify-between items-center cursor-pointer storage-header" data-target="storage-step2">
            <h4 class="font-semibold text-sm">단계 2: 기획서</h4>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform transition-transform storage-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
        <div class="storage-summary bg-white p-2 rounded text-xs overflow-auto max-h-20 mt-2 whitespace-pre-wrap">
            ${step2Value ? (step2Value.length > 100 ? step2Value.substring(0, 100) + '...' : step2Value) : '데이터 없음'}
        </div>
        <div class="storage-content hidden bg-white p-2 rounded text-xs overflow-auto mt-2" id="storage-step2">
            <pre class="whitespace-pre-wrap">${step2Value || '데이터 없음'}</pre>
        </div>
    </div>`;
    
    // Step 3 정보 (프롬프트)
    const step3Key = LOCAL_STORAGE_KEYS.step3;
    const step3Value = localStorage.getItem(step3Key);
    let step3Summary = '데이터 없음';
    let step3FullContent = '데이터 없음';
    try {
        if (step3Value) {
            const step3Json = JSON.parse(step3Value);
            step3Summary = `<strong>DALL-E:</strong> ${step3Json.dalle ? (step3Json.dalle.length > 50 ? step3Json.dalle.substring(0, 50) + '...' : step3Json.dalle) : '없음'}<br>
                          <strong>GPT-4o:</strong> ${step3Json.gpt4o ? (step3Json.gpt4o.length > 50 ? step3Json.gpt4o.substring(0, 50) + '...' : step3Json.gpt4o) : '없음'}`;
            
            step3FullContent = `<div><strong>DALL-E:</strong></div>
                            <pre class="whitespace-pre-wrap mt-1 mb-3">${step3Json.dalle || '없음'}</pre>
                            <div><strong>GPT-4o:</strong></div>
                            <pre class="whitespace-pre-wrap mt-1">${step3Json.gpt4o || '없음'}</pre>`;
        }
    } catch (e) {
        step3Summary = `파싱 오류: ${step3Value ? step3Value.substring(0, 50) + '...' : '데이터 없음'}`;
        step3FullContent = `<div>파싱 오류:</div><pre class="whitespace-pre-wrap mt-1">${step3Value || '데이터 없음'}</pre>`;
    }
    html += `
    <div class="bg-gray-100 p-3 rounded-lg">
        <div class="flex justify-between items-center cursor-pointer storage-header" data-target="storage-step3">
            <h4 class="font-semibold text-sm">단계 3: 프롬프트</h4>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform transition-transform storage-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
        <div class="storage-summary bg-white p-2 rounded text-xs overflow-auto max-h-20 mt-2">
            ${step3Summary}
        </div>
        <div class="storage-content hidden bg-white p-2 rounded text-xs overflow-auto mt-2" id="storage-step3">
            ${step3FullContent}
        </div>
    </div>`;
    
    // Step 4 정보 (이미지 및 초기 HTML)
    const step4Key = LOCAL_STORAGE_KEYS.step4;
    const step4Value = localStorage.getItem(step4Key);
    let step4Summary = '데이터 없음';
    let step4FullContent = '데이터 없음';
    try {
        if (step4Value) {
            const step4Json = JSON.parse(step4Value);
            step4Summary = `<strong>HTML:</strong> ${step4Json.html ? '존재함 (' + step4Json.html.length + '자)' : '없음'}`;
            
            if (step4Json.html) {
                const htmlPreview = step4Json.html.substring(0, 150) + (step4Json.html.length > 150 ? '...' : '');
                step4FullContent = `<div class="mb-2"><strong>HTML 미리보기:</strong></div>
                                <pre class="whitespace-pre-wrap p-2 bg-gray-50 rounded border max-h-[300px] overflow-auto">${escapeHtml(htmlPreview)}</pre>
                                <div class="mt-4 mb-2">
                                    <button class="view-full-html-btn px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200" data-content="${encodeURIComponent(step4Json.html)}">
                                        전체 HTML 보기
                                    </button>
                                </div>`;
            } else {
                step4FullContent = `<div>HTML 데이터가 없습니다.</div>`;
            }
        }
    } catch (e) {
        step4Summary = `파싱 오류: ${step4Value ? step4Value.substring(0, 50) + '...' : '데이터 없음'}`;
        step4FullContent = `<div>파싱 오류:</div><pre class="whitespace-pre-wrap mt-1">${step4Value || '데이터 없음'}</pre>`;
    }
    html += `
    <div class="bg-gray-100 p-3 rounded-lg">
        <div class="flex justify-between items-center cursor-pointer storage-header" data-target="storage-step4">
            <h4 class="font-semibold text-sm">단계 4: 초기 HTML</h4>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform transition-transform storage-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
        <div class="storage-summary bg-white p-2 rounded text-xs overflow-auto max-h-20 mt-2">
            ${step4Summary}
        </div>
        <div class="storage-content hidden bg-white p-2 rounded text-xs overflow-auto mt-2" id="storage-step4">
            ${step4FullContent}
        </div>
    </div>`;
    
    // Step 5 정보 (현재 HTML)
    const step5Key = LOCAL_STORAGE_KEYS.step5;
    const step5Value = localStorage.getItem(step5Key);
    let step5Summary = '데이터 없음';
    let step5FullContent = '데이터 없음';
    try {
        if (step5Value) {
            const step5Json = JSON.parse(step5Value);
            step5Summary = `<strong>HTML:</strong> ${step5Json.html ? '존재함 (' + step5Json.html.length + '자)' : '없음'}<br>
                          <strong>마지막 수정:</strong> ${step5Json.lastUpdated || '없음'}`;
            
            if (step5Json.html) {
                const htmlPreview = step5Json.html.substring(0, 150) + (step5Json.html.length > 150 ? '...' : '');
                step5FullContent = `<div class="mb-2"><strong>HTML 미리보기:</strong></div>
                                <pre class="whitespace-pre-wrap p-2 bg-gray-50 rounded border max-h-[300px] overflow-auto">${escapeHtml(htmlPreview)}</pre>
                                <div class="mt-2 mb-2"><strong>마지막 수정:</strong> ${step5Json.lastUpdated || '없음'}</div>
                                <div class="mt-4 mb-2">
                                    <button class="view-full-html-btn px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200" data-content="${encodeURIComponent(step5Json.html)}">
                                        전체 HTML 보기
                                    </button>
                                </div>`;
            } else {
                step5FullContent = `<div>HTML 데이터가 없습니다.</div>
                                <div class="mt-2"><strong>마지막 수정:</strong> ${step5Json.lastUpdated || '없음'}</div>`;
            }
        }
    } catch (e) {
        step5Summary = `파싱 오류: ${step5Value ? step5Value.substring(0, 50) + '...' : '데이터 없음'}`;
        step5FullContent = `<div>파싱 오류:</div><pre class="whitespace-pre-wrap mt-1">${step5Value || '데이터 없음'}</pre>`;
    }
    html += `
    <div class="bg-gray-100 p-3 rounded-lg">
        <div class="flex justify-between items-center cursor-pointer storage-header" data-target="storage-step5">
            <h4 class="font-semibold text-sm">단계 5: 현재 HTML</h4>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform transition-transform storage-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
        <div class="storage-summary bg-white p-2 rounded text-xs overflow-auto max-h-20 mt-2">
            ${step5Summary}
        </div>
        <div class="storage-content hidden bg-white p-2 rounded text-xs overflow-auto mt-2" id="storage-step5">
            ${step5FullContent}
        </div>
    </div>`;
    
    html += `
    <!-- HTML 전체 보기 모달 -->
    <div id="full-html-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center">
        <div class="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] w-full overflow-auto">
            <div class="flex justify-between mb-4">
                <h3 class="text-lg font-bold">HTML 전체 내용</h3>
                <button id="close-html-modal-btn" class="text-gray-600 hover:text-gray-900">
                    &times;
                </button>
            </div>
            <pre id="full-html-display" class="bg-gray-100 p-4 rounded overflow-auto max-h-[70vh] text-xs whitespace-pre-wrap"></pre>
        </div>
    </div>`;
    
    html += '</div>';
    
    // 생성된 HTML을 로컬 스토리지 정보 컨테이너에 삽입
    improve.storageContent.innerHTML = html;
    
    // 로컬 스토리지 아이템 헤더에 이벤트 리스너 추가
    const storageHeaders = improve.storageContent.querySelectorAll('.storage-header');
    storageHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-target');
            const contentElement = document.getElementById(targetId);
            const arrowElement = header.querySelector('.storage-arrow');
            
            if (contentElement.classList.contains('hidden')) {
                contentElement.classList.remove('hidden');
                arrowElement.classList.add('rotate-180');
                // 해당 요약 정보 숨기기
                header.parentElement.querySelector('.storage-summary').classList.add('hidden');
            } else {
                contentElement.classList.add('hidden');
                arrowElement.classList.remove('rotate-180');
                // 해당 요약 정보 표시
                header.parentElement.querySelector('.storage-summary').classList.remove('hidden');
            }
        });
    });
    
    // HTML 전체 보기 버튼 이벤트 리스너
    const viewFullHtmlBtns = improve.storageContent.querySelectorAll('.view-full-html-btn');
    const fullHtmlModal = document.getElementById('full-html-modal');
    const fullHtmlDisplay = document.getElementById('full-html-display');
    const closeHtmlModalBtn = document.getElementById('close-html-modal-btn');
    
    viewFullHtmlBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const htmlContent = decodeURIComponent(btn.getAttribute('data-content'));
            fullHtmlDisplay.textContent = htmlContent;
            fullHtmlModal.classList.remove('hidden');
        });
    });
    
    if (closeHtmlModalBtn) {
        closeHtmlModalBtn.addEventListener('click', () => {
            fullHtmlModal.classList.add('hidden');
        });
    }
    
    // 모달 외부 클릭 시 닫기
    if (fullHtmlModal) {
        fullHtmlModal.addEventListener('click', (e) => {
            if (e.target === fullHtmlModal) {
                fullHtmlModal.classList.add('hidden');
            }
        });
    }
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', init);

// 이 모듈에서 노출할 함수들
export {
    updatePreview,
    improveCode,
    downloadCode
};