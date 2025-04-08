import { LOCAL_STORAGE_KEYS } from '../configs/config.js';
import { showToast, createModelSelector, getSelectedModel, callSecureApi, showLoading, hideLoading, alertDialog } from './common.js';
import { apiEndpoints } from '../configs/config.js';
import { PROMPT_TEMPLATES } from '../configs/config.js';

// DOM 요소
const promptBtn = document.getElementById('prompt-btn');
const promptModal = document.getElementById('prompt-modal');
const usageDataElement = document.getElementById('usage-data');
const previewContainer = document.getElementById('preview-container');
const previewFrame = document.getElementById('preview-frame');
const emptyStateContainer = document.getElementById('empty-state-container');
const mainContent = document.getElementById('main-content');
const improvementPromptInput = document.getElementById('improvement-prompt');
const submitPromptBtn = document.getElementById('submit-prompt');
const revertChangesBtn = document.getElementById('revert-changes-btn');
const forwardChangesBtn = document.getElementById('forward-changes-btn');
// 히스토리 정보 표시 요소
const historyPositionElement = document.getElementById('history-position');

// HTML 미리보기 관련 로컬스토리지 키
const HTML_STORAGE_KEY = 'saved_html_content';

// 웹사이트 상태 히스토리 관련 키
const HISTORY_STATES_KEY = 'website_history_states'; // 상태 기록 배열
const HISTORY_POSITION_KEY = 'website_history_position'; // 현재 위치 인덱스

// 버튼 상태 관리 플래그
let hasRevertHistory = false;
let hasForwardHistory = false;
let isPromptOpen = false;

// 현재 히스토리 위치
let currentHistoryPosition = -1;
// 히스토리 상태 배열
let historyStates = [];

// 모델 선택기 인스턴스
let promptModelSelector;

// 드래그 관련 변수
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let modalStartX = 0;
let modalStartY = 0;

/**
 * 드래그 기능 설정
 */
function setupDraggable() {
    if (!promptModal) return;
    
    // 모달 내 클릭 이벤트 리스너 추가
    promptModal.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', dragModal);
    document.addEventListener('mouseup', stopDrag);
    
    // 터치 이벤트 지원
    promptModal.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', dragModal, { passive: false });
    document.addEventListener('touchend', stopDrag);
    
    // 초기 위치 저장된 값이 있으면 적용
    const savedPosition = localStorage.getItem('prompt_modal_position');
    if (savedPosition) {
        try {
            const position = JSON.parse(savedPosition);
            promptModal.style.position = 'fixed';
            promptModal.style.left = position.left;
            promptModal.style.top = position.top;
            promptModal.style.right = 'auto';
            promptModal.style.bottom = 'auto';
            promptModal.style.transform = 'none';
            promptModal.style.margin = '0';
        } catch (e) {
            console.error('저장된 모달 위치 적용 실패:', e);
        }
    }
}

/**
 * 요소가 상호작용이 필요한 요소인지 확인
 * @param {HTMLElement} element - 확인할 HTML 요소
 * @returns {boolean} - 상호작용 요소 여부
 */
function isInteractiveElement(element) {
    // 요소 자체 또는 부모 중에 상호작용 요소가 있는지 확인
    let current = element;
    while (current && current !== promptModal) {
        // textarea, button, select, a 태그 등 상호작용 요소 확인
        if (
            current.tagName === 'TEXTAREA' || 
            current.tagName === 'BUTTON' || 
            current.tagName === 'SELECT' || 
            current.tagName === 'A' ||
            current.tagName === 'INPUT' ||
            current.tagName === 'LABEL' ||
            current.id === 'prompt-model-selector-container' ||  // 모델 선택기
            current.id === 'usage-info' ||  // 크레딧 정보
            current.classList.contains('select-container') ||
            current.getAttribute('role') === 'button' ||
            current.getAttribute('role') === 'option'
        ) {
            return true;
        }
        current = current.parentElement;
    }
    return false;
}

/**
 * 드래그 시작 핸들러
 * @param {Event} e - 마우스 또는 터치 이벤트
 */
function startDrag(e) {
    // 클릭된 요소가 textarea 또는 버튼인 경우 드래그 방지
    if (isInteractiveElement(e.target)) {
        return;
    }
    
    e.preventDefault();
    
    // 현재 모달이 가운데 정렬된 상태면 위치를 절대값으로 변경
    if (!promptModal.style.left) {
        const rect = promptModal.getBoundingClientRect();
        promptModal.style.position = 'fixed';
        promptModal.style.left = rect.left + 'px';
        promptModal.style.top = rect.top + 'px';
        promptModal.style.right = 'auto';
        promptModal.style.bottom = 'auto';
        promptModal.style.transform = 'none';
        promptModal.style.margin = '0';
    }
    
    isDragging = true;
    promptModal.classList.add('dragging');
    
    // 마우스 또는 터치 시작 위치
    if (e.type === 'touchstart') {
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
    } else {
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }
    
    // 모달 현재 위치
    modalStartX = parseInt(promptModal.style.left) || 0;
    modalStartY = parseInt(promptModal.style.top) || 0;
    
    // 시각적 피드백 추가
    document.body.style.cursor = 'grabbing';
}

/**
 * 모달 드래그 핸들러
 * @param {Event} e - 마우스 또는 터치 이벤트
 */
function dragModal(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    let currentX, currentY;
    if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
    } else {
        currentX = e.clientX;
        currentY = e.clientY;
    }
    
    // 이동 거리 계산
    const deltaX = currentX - dragStartX;
    const deltaY = currentY - dragStartY;
    
    // 새 위치 설정
    const newLeft = modalStartX + deltaX;
    const newTop = modalStartY + deltaY;
    
    // 화면 경계 확인
    const modalRect = promptModal.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 모달이 화면 밖으로 나가지 않도록 제한
    if (newLeft < 0) {
        promptModal.style.left = '0px';
    } else if (newLeft + modalRect.width > windowWidth) {
        promptModal.style.left = (windowWidth - modalRect.width) + 'px';
    } else {
        promptModal.style.left = newLeft + 'px';
    }
    
    if (newTop < 0) {
        promptModal.style.top = '0px';
    } else if (newTop + modalRect.height > windowHeight) {
        promptModal.style.top = (windowHeight - modalRect.height) + 'px';
    } else {
        promptModal.style.top = newTop + 'px';
    }
}

/**
 * 드래그 종료 핸들러
 */
function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    promptModal.classList.remove('dragging');
    
    // 현재 위치 저장
    const position = {
        left: promptModal.style.left,
        top: promptModal.style.top
    };
    localStorage.setItem('prompt_modal_position', JSON.stringify(position));
    
    // 시각적 피드백 제거
    document.body.style.cursor = 'default';
}

/**
 * 프롬프트 모달 상태 토글
 */
function togglePromptModal() {
    // 현재 모달 상태 확인 (hidden 클래스 존재 여부로 판단)
    const isCurrentlyHidden = promptModal.classList.contains('hidden');
    
    if (isCurrentlyHidden) {
        // 모달 열기
        promptModal.classList.remove('hidden');
        promptBtn.classList.add('close-mode');
        isPromptOpen = true;
        
        // 텍스트 에어리어에 포커스
        setTimeout(() => improvementPromptInput.focus(), 300);
        
        // 버튼 상태 업데이트
        updateButtonStates();
        
        // 저장된 위치가 있으면 복원, 없으면 가운데 정렬 상태로 유지
        const savedPosition = localStorage.getItem('prompt_modal_position');
        if (savedPosition) {
            try {
                const position = JSON.parse(savedPosition);
                promptModal.style.position = 'fixed';
                promptModal.style.left = position.left;
                promptModal.style.top = position.top;
                promptModal.style.right = 'auto';
                promptModal.style.bottom = 'auto';
                promptModal.style.transform = 'none';
                promptModal.style.margin = '0';
            } catch (e) {
                console.error('저장된 모달 위치 적용 실패:', e);
            }
        }
    } else {
        // 모달 닫기
        promptModal.classList.add('hidden');
        promptBtn.classList.remove('close-mode');
        isPromptOpen = false;
    }
    
    console.log('프롬프트 모달 토글:', isPromptOpen ? '열림' : '닫힘');
}

/**
 * 페이지 초기화 시 히스토리 상태 로드
 */
function loadHistoryStates() {
    try {
        // 히스토리 배열 로드
        const historyJson = localStorage.getItem(HISTORY_STATES_KEY);
        historyStates = historyJson ? JSON.parse(historyJson) : [];
        
        // 현재 위치 로드
        const positionJson = localStorage.getItem(HISTORY_POSITION_KEY);
        currentHistoryPosition = positionJson ? parseInt(JSON.parse(positionJson)) : -1;
        
        // 상태 확인 (배열이 비어있거나 위치가 유효하지 않은 경우 초기화)
        if (historyStates.length === 0 || currentHistoryPosition < 0 || currentHistoryPosition >= historyStates.length) {
            historyStates = [];
            currentHistoryPosition = -1;
            localStorage.removeItem(HISTORY_STATES_KEY);
            localStorage.removeItem(HISTORY_POSITION_KEY);
        }
        
        console.log(`히스토리 상태 로드: ${historyStates.length}개, 현재 위치: ${currentHistoryPosition}`);
        
        // 버튼 상태 업데이트
        updateButtonStates();
    } catch (error) {
        console.error('히스토리 상태 로드 오류:', error);
        historyStates = [];
        currentHistoryPosition = -1;
        localStorage.removeItem(HISTORY_STATES_KEY);
        localStorage.removeItem(HISTORY_POSITION_KEY);
        updateButtonStates();
    }
}

/**
 * 버튼 활성화/비활성화 상태 업데이트
 */
function updateButtonStates() {
    console.log(`버튼 상태 업데이트: 현재 위치 ${currentHistoryPosition}, 전체 상태 수: ${historyStates.length}`);
    
    // 뒤로 되돌리기 버튼 상태 업데이트 (현재 위치가 0보다 크면 이전 상태가 있음)
    hasRevertHistory = currentHistoryPosition > 0;
    if (hasRevertHistory) {
        revertChangesBtn.removeAttribute('disabled');
        revertChangesBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        console.log('뒤로 되돌리기 버튼 활성화됨');
    } else {
        revertChangesBtn.setAttribute('disabled', 'disabled');
        revertChangesBtn.classList.add('opacity-50', 'cursor-not-allowed');
        console.log('뒤로 되돌리기 버튼 비활성화됨');
    }
    
    // 앞으로 되돌리기 버튼 상태 업데이트 (현재 위치가 마지막 위치보다 작으면 앞으로 갈 상태가 있음)
    hasForwardHistory = historyStates.length > 0 && currentHistoryPosition < historyStates.length - 1;
    if (hasForwardHistory) {
        forwardChangesBtn.removeAttribute('disabled');
        forwardChangesBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        console.log('앞으로 되돌리기 버튼 활성화됨');
    } else {
        forwardChangesBtn.setAttribute('disabled', 'disabled');
        forwardChangesBtn.classList.add('opacity-50', 'cursor-not-allowed');
        console.log('앞으로 되돌리기 버튼 비활성화됨');
    }
    
    // 히스토리 상태 정보 업데이트
    if (historyPositionElement) {
        const totalStates = historyStates.length;
        const currentPosition = totalStates > 0 ? currentHistoryPosition + 1 : 0;
        historyPositionElement.textContent = `${currentPosition}/${totalStates}`;
        console.log(`히스토리 상태 표시 업데이트: ${currentPosition}/${totalStates}`);
    }
}

/**
 * 현재 웹사이트 상태를 저장하는 함수
 * @returns {boolean} 저장 성공 여부
 */
function saveCurrentState() {
    try {
        const currentState = {
            code: localStorage.getItem(LOCAL_STORAGE_KEYS.code),
            image: localStorage.getItem(LOCAL_STORAGE_KEYS.image),
            savedAt: new Date().toISOString()
        };
        
        // 현재 위치 다음의 모든 상태 제거 (중간에 새 상태를 추가하는 경우)
        if (currentHistoryPosition >= 0 && currentHistoryPosition < historyStates.length - 1) {
            historyStates = historyStates.slice(0, currentHistoryPosition + 1);
            console.log(`히스토리 수정: 인덱스 ${currentHistoryPosition + 1} 이후 상태 제거됨`);
        }
        
        // 새 상태 추가
        historyStates.push(currentState);
        currentHistoryPosition = historyStates.length - 1;
        
        // 로컬 스토리지에 저장
        localStorage.setItem(HISTORY_STATES_KEY, JSON.stringify(historyStates));
        localStorage.setItem(HISTORY_POSITION_KEY, JSON.stringify(currentHistoryPosition));
        
        console.log(`웹사이트 상태 저장됨. 총 ${historyStates.length}개 상태, 현재 위치: ${currentHistoryPosition}`);
        
        // 버튼 상태 업데이트
        updateButtonStates();
        
        return true;
    } catch (error) {
        console.error('웹사이트 상태 저장 오류:', error);
        return false;
    }
}

/**
 * 이전 웹사이트 상태로 되돌리는 함수
 * @returns {boolean} 복원 성공 여부
 */
function revertToPreviousState() {
    if (currentHistoryPosition <= 0) {
        console.warn('이전 상태가 없습니다.');
        return false;
    }
    
    try {
        console.log(`이전 상태로 되돌리기: 현재 위치 ${currentHistoryPosition} → ${currentHistoryPosition - 1}`);
        
        // 이전 위치로 이동
        currentHistoryPosition--;
        
        // 해당 상태 복원
        const state = historyStates[currentHistoryPosition];
        
        // 코드 복원
        localStorage.setItem(LOCAL_STORAGE_KEYS.code, state.code);
        
        // 이미지 정보가 있다면 복원
        if (state.image) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.image, state.image);
        }
        
        // 현재 위치 저장 (히스토리 내용은 수정하지 않음)
        localStorage.setItem(HISTORY_POSITION_KEY, JSON.stringify(currentHistoryPosition));
        
        console.log(`웹사이트가 이전 상태로 복원됨. 현재 위치: ${currentHistoryPosition}/${historyStates.length - 1}`);
        
        // 버튼 상태 업데이트
        updateButtonStates();
        
        return true;
    } catch (error) {
        console.error('웹사이트 이전 상태 복원 오류:', error);
        return false;
    }
}

/**
 * 앞으로 가기 상태로 복원하는 함수
 * @returns {boolean} 복원 성공 여부
 */
function restoreForwardState() {
    if (currentHistoryPosition >= historyStates.length - 1) {
        console.warn('다음 상태가 없습니다.');
        return false;
    }
    
    try {
        console.log(`다음 상태로 이동: 현재 위치 ${currentHistoryPosition} → ${currentHistoryPosition + 1}`);
        
        // 다음 위치로 이동
        currentHistoryPosition++;
        
        // 해당 상태 복원
        const state = historyStates[currentHistoryPosition];
        
        // 코드 복원
        localStorage.setItem(LOCAL_STORAGE_KEYS.code, state.code);
        
        // 이미지 정보가 있다면 복원
        if (state.image) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.image, state.image);
        }
        
        // 현재 위치 저장 (히스토리 내용은 수정하지 않음)
        localStorage.setItem(HISTORY_POSITION_KEY, JSON.stringify(currentHistoryPosition));
        
        console.log(`웹사이트가 다음 상태로 복원됨. 현재 위치: ${currentHistoryPosition}/${historyStates.length - 1}`);
        
        // 버튼 상태 업데이트
        updateButtonStates();
        
        return true;
    } catch (error) {
        console.error('웹사이트 다음 상태 복원 오류:', error);
        return false;
    }
}

/**
 * 사용량 정보를 가져와 화면에 표시
 */
async function fetchAndDisplayUsageInfo() {
    try {
        const response = await callSecureApi(apiEndpoints.backend.usage);
        
        // API 응답 구조 확인: {"success":true,"data":{"used":4140,"limit":10000,"remaining":5860}}
        if (response && response.success && response.data) {
            const usageData = response.data;
            
            // 사용량 데이터 표시 형식 지정 (예: '5860/10000')
            const formattedUsage = `${usageData.remaining || 0}/${usageData.limit || 0}`;
            usageDataElement.textContent = formattedUsage;
            
            // 사용량에 따라 색상 변경
            const usagePercentage = (usageData.used / usageData.limit) * 100;
            const remainingPercentage = 100 - usagePercentage;
            
            // 이전 색상 클래스 제거
            usageDataElement.classList.remove('text-yellow-600', 'text-red-600', 'text-gray-400');
            
            // 남은 크레딧에 따른 색상 적용
            if (remainingPercentage <= 5) {
                usageDataElement.classList.add('text-red-600');
            } else if (remainingPercentage <= 20) {
                usageDataElement.classList.add('text-yellow-600');
            }
            
            console.log('크레딧 정보 로드 완료:', usageData);
        } else {
            throw new Error('유효하지 않은 크레딧 데이터');
        }
    } catch (error) {
        console.error('크레딧 정보 로드 실패:', error);
        usageDataElement.textContent = '정보 없음';
        
        // 이전 색상 클래스 제거 후 회색 적용
        usageDataElement.classList.remove('text-yellow-600', 'text-red-600');
        usageDataElement.classList.add('text-gray-400');
    }
}

// 사용량 정보 자동 업데이트 설정 (5분마다)
let usageUpdateInterval;

/**
 * 사용량 정보 자동 업데이트 시작
 */
function startUsageUpdateInterval() {
    // 기존 인터벌이 있으면 제거
    if (usageUpdateInterval) {
        clearInterval(usageUpdateInterval);
    }
    
    // 5분(300000ms)마다 크레딧 정보 업데이트
    usageUpdateInterval = setInterval(fetchAndDisplayUsageInfo, 300000);
    console.log('크레딧 정보 자동 업데이트 시작 (5분 간격)');
}

/**
 * 프롬프트 모달 설정
 */
function setupModals() {
    if (promptBtn && promptModal) {
        // 프롬프트 버튼 클릭 이벤트 리스너
        promptBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            togglePromptModal();
        });
        
        // ESC 키로 모달 숨기기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !promptModal.classList.contains('hidden')) {
                togglePromptModal();
            }
        });
        
        // 모달 외부 클릭 시 닫기 (document 이벤트)
        document.addEventListener('click', (e) => {
            // 모달이 열려있고, 클릭된 요소가 모달 내부가 아니며, 
            // 프롬프트 버튼도 아닌 경우에만 닫기
            const isModalOpen = !promptModal.classList.contains('hidden');
            const isClickInsideModal = promptModal.contains(e.target);
            const isClickOnPromptBtn = promptBtn.contains(e.target);
            
            if (isModalOpen && !isClickInsideModal && !isClickOnPromptBtn) {
                console.log('외부 클릭으로 모달 닫기');
                togglePromptModal();
            }
        });
        
        // 이벤트 전파 방지 (모달 내부 클릭이 document까지 전파되지 않도록)
        promptModal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // 프롬프트 버튼에 마우스 오버 시 닫기 힌트 표시 (모달이 열려 있을 때만)
        promptBtn.addEventListener('mouseenter', () => {
            const isModalOpen = !promptModal.classList.contains('hidden');
            promptBtn.title = isModalOpen ? "프롬프트 닫기" : "웹사이트 개선 요청";
            
            // 닫기 모드 클래스 동기화
            if (isModalOpen) {
                promptBtn.classList.add('close-mode');
            }
        });
    }
    
    // 제출 버튼 클릭 이벤트 설정
    if (submitPromptBtn && improvementPromptInput) {
        submitPromptBtn.addEventListener('click', () => {
            const improvementRequest = improvementPromptInput.value.trim();
            if (improvementRequest) {
                // 처리 진행
                processImprovementRequest(improvementRequest);
                togglePromptModal(); // 모달 닫기
            } else {
                showToast('개선 요구사항을 입력해주세요.', 'warning');
            }
        });
    }
    
    // 뒤로 되돌리기 버튼 클릭 이벤트 설정
    if (revertChangesBtn) {
        revertChangesBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            showLoading('이전 상태로 되돌리는 중...');
            
            setTimeout(() => {
                try {
                    // 이전 상태로 되돌리기
                    const isReverted = revertToPreviousState();
                    
                    if (isReverted) {
                        // 미리보기 갱신
                        loadAndShowHtmlPreview();
                        showToast('웹사이트가 이전 상태로 되돌아갔습니다.', 'success');
                    } else {
                        showToast('이전 상태로 되돌리기에 실패했습니다.', 'error');
                    }
                } catch (error) {
                    console.error('되돌리기 오류:', error);
                    showToast(error.message || '이전 상태로 되돌리기에 실패했습니다.', 'error');
                } finally {
                    hideLoading();
                    // 모달을 닫지 않도록 변경
                    // togglePromptModal(); // 모달 닫기
                }
            }, 300); // 로딩 효과를 위한 약간의 딜레이
        });
    }
    
    // 앞으로 되돌리기 버튼 클릭 이벤트 설정
    if (forwardChangesBtn) {
        forwardChangesBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            showLoading('변경 내용 복원 중...');
            
            setTimeout(() => {
                try {
                    // 앞으로 가기 상태로 복원
                    const isRestored = restoreForwardState();
                    
                    if (isRestored) {
                        // 미리보기 갱신
                        loadAndShowHtmlPreview();
                        showToast('웹사이트가 다음 상태로 복원되었습니다.', 'success');
                    } else {
                        showToast('다음 상태 복원에 실패했습니다.', 'error');
                    }
                } catch (error) {
                    console.error('앞으로 되돌리기 오류:', error);
                    showToast(error.message || '다음 상태 복원에 실패했습니다.', 'error');
                } finally {
                    hideLoading();
                    // 모달을 닫지 않도록 변경
                    // togglePromptModal(); // 모달 닫기
                }
            }, 300); // 로딩 효과를 위한 딜레이
        });
    }
}

/**
 * 모델 선택기 초기화
 */
function setupModelSelectors() {
    // 프롬프트 모델 선택기
    promptModelSelector = createModelSelector(
        '#prompt-model-selector-container',
        'all',
        'text',
        'prompt-model',
        '',
        (provider, model) => {
            console.log(`프롬프트 모델 선택: ${provider} - ${model}`);
        }
    );
}

/**
 * 미리보기 모드로 전환
 */
function showPreviewMode() {
    // 메인 컨텐츠 숨기기
    mainContent.style.display = 'none';
    
    // 미리보기 표시
    previewContainer.classList.remove('hidden');
}

/**
 * 소개 화면 모드로 전환
 */
function showIntroductionMode() {
    // 미리보기 숨기기
    previewContainer.classList.add('hidden');
    
    // 메인 컨텐츠 표시
    mainContent.style.display = 'block';
    
    // 소개 화면 표시
    emptyStateContainer.classList.remove('hidden');
}

/**
 * HTML 코드에서 이미지 플레이스홀더를 실제 URL로 대체
 * @param {string} htmlCode - 원본 HTML 코드
 * @param {Array} images - 이미지 정보 배열 (key, url 포함)
 * @returns {string} 이미지 URL이 대체된 HTML 코드
 */
function replaceImagePlaceholders(htmlCode, images) {
    if (!htmlCode || !images || !images.length) {
        return htmlCode;
    }
    
    let processedHtml = htmlCode;
    
    // 각 이미지 플레이스홀더를 실제 URL로 대체
    images.forEach(image => {
        if (image.key && image.url) {
            // 이스케이프 처리된 키 생성 (정규식 특수문자 처리)
            const escapedKey = image.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // img 태그의 src 속성 대체
            const srcRegex = new RegExp(`src=["']${escapedKey}["']`, 'g');
            processedHtml = processedHtml.replace(srcRegex, `src="${image.url}"`);
            
            // CSS background-image URL 대체 (다양한 형태 처리)
            // 1. url('KEY') - 작은따옴표
            // 2. url("KEY") - 큰따옴표
            // 3. url(KEY) - 따옴표 없음
            // 4. url( 'KEY' ) - 공백과 따옴표 조합
            // 5. url( "KEY" ) - 공백과 따옴표 조합
            // 6. url( KEY ) - 공백만 있는 경우
            const bgRegex = new RegExp(`url\\(\\s*['"]?${escapedKey}['"]?\\s*\\)`, 'g');
            processedHtml = processedHtml.replace(bgRegex, `url("${image.url}")`);
            
            // 인라인 스타일 내 background URL이 세미콜론 없이 끝나는 경우 처리
            const inlineStyleRegex = new RegExp(`background(-image)?:\\s*url\\(\\s*['"]?${escapedKey}['"]?\\s*\\)`, 'g');
            processedHtml = processedHtml.replace(inlineStyleRegex, `background$1: url("${image.url}")`);
            
            // 다른 속성에서도 키워드 대체가 필요한 경우를 위한 범용 패턴
            // 예: content: url('KEY') 또는 list-style-image: url('KEY')
            const otherUrlsRegex = new RegExp(`:\\s*url\\(\\s*['"]?${escapedKey}['"]?\\s*\\)`, 'g');
            processedHtml = processedHtml.replace(otherUrlsRegex, `: url("${image.url}")`);
        }
    });
    
    return processedHtml;
}

/**
 * 로컬스토리지에서 HTML 코드를 불러와 미리보기 표시
 */
function loadAndShowHtmlPreview() {
    try {
        // 코드 데이터 가져오기
        const savedCodeData = localStorage.getItem(LOCAL_STORAGE_KEYS.code);
        
        if (savedCodeData) {
            const codeData = JSON.parse(savedCodeData);
            
            if (codeData && codeData.html_code) {
                let htmlCode = codeData.html_code;
                let imageKeyMap = {}; // 이미지 URL과 키 매핑을 저장할 객체
                
                // 이미지 데이터 가져오기
                const savedImagesData = localStorage.getItem(LOCAL_STORAGE_KEYS.image);
                if (savedImagesData) {
                    const imagesData = JSON.parse(savedImagesData);
                    if (imagesData && imagesData.images && imagesData.images.length > 0) {
                        // 이미지 URL과 키 매핑 저장
                        imagesData.images.forEach(img => {
                            if (img.key && img.url) {
                                imageKeyMap[img.url] = img.key;
                            }
                        });
                        
                        // 이미지 플레이스홀더를 실제 URL로 대체
                        htmlCode = replaceImagePlaceholders(htmlCode, imagesData.images);
                    }
                }
                
                // iframe에 HTML 코드 표시
                const blob = new Blob([htmlCode], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);
                
                previewFrame.src = blobUrl;
                
                // 미리보기 모드로 전환
                showPreviewMode();
                
                // iframe 로드 완료 후 이미지 요소에 클릭 이벤트 추가
                previewFrame.onload = () => {
                    // 리소스 해제
                    URL.revokeObjectURL(blobUrl);
                    
                    try {
                        const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
                        
                        // iframe 내부에 스타일 추가
                        const styleEl = iframeDoc.createElement('style');
                        styleEl.textContent = `
                            /* 이미지 편집 커서 및 호버 효과 */
                            .editable-image {
                                position: relative !important;
                                transition: all 0.3s ease !important;
                                cursor: pointer !important;
                                z-index: 1 !important;
                                isolation: isolate !important;
                            }
                            
                            .editable-image:hover::before {
                                content: '' !important;
                                position: absolute !important;
                                top: 0 !important;
                                left: 0 !important;
                                width: 100% !important;
                                height: 100% !important;
                                background-color: rgba(0, 255, 0, 0.3) !important;
                                z-index: 2147483647 !important; /* 최대 z-index 값 */
                                pointer-events: none !important;
                                transform: translateZ(0) !important;
                                will-change: transform !important;
                                box-sizing: border-box !important;
                                mix-blend-mode: overlay !important;
                                display: block !important;
                                visibility: visible !important;
                                opacity: 1 !important;
                            }
                            
                            .editable-image:hover {
                                outline: 3px solid rgba(0, 255, 0, 0.7) !important;
                                position: relative !important;
                                z-index: 2147483646 !important; /* 최대 z-index 값 - 1 */
                                transform: translateZ(0) !important;
                                will-change: transform !important;
                                box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.3) !important;
                                filter: none !important;
                            }
                            
                            /* 부모 요소에 overflow 속성이 적용된 경우를 위한 추가 스타일 */
                            *:has(.editable-image:hover) {
                                overflow: visible !important;
                            }
                        `;
                        iframeDoc.head.appendChild(styleEl);
                        
                        // 이미지 URL을 키로 변환하는 함수
                        const findImageKey = (url) => {
                            if (!url) return null;
                            
                            // URL에서 쿼리 파라미터 제거 (있을 경우)
                            const cleanUrl = url.split('?')[0];
                            
                            // 정확한 매치 시도
                            if (imageKeyMap[cleanUrl]) return imageKeyMap[cleanUrl];
                            
                            // 부분 매치 시도 (URL이 일부만 일치할 수 있음)
                            for (const mappedUrl in imageKeyMap) {
                                if (cleanUrl.includes(mappedUrl) || mappedUrl.includes(cleanUrl)) {
                                    return imageKeyMap[mappedUrl];
                                }
                            }
                            
                            return null;
                        };
                        
                        // img 태그 이벤트 추가
                        const imgElements = iframeDoc.querySelectorAll('img');
                        imgElements.forEach(img => {
                            const imageKey = findImageKey(img.src);
                            if (imageKey) {
                                img.classList.add('editable-image');
                                img.title = `클릭하여 ${imageKey} 이미지 관리`;
                                img.addEventListener('click', (e) => {
                                    navigateToImageManager(imageKey);
                                });
                            }
                        });
                        
                        // CSS background-image를 가진 요소 찾기
                        const allElements = iframeDoc.querySelectorAll('*');
                        allElements.forEach(el => {
                            const style = window.getComputedStyle(el);
                            const backgroundImage = style.backgroundImage;
                            
                            if (backgroundImage && backgroundImage !== 'none') {
                                // url("...") 형식에서 URL 추출
                                const urlMatch = backgroundImage.match(/url\(['"](.*?)['"]\)/);
                                if (urlMatch && urlMatch[1]) {
                                    const imageUrl = urlMatch[1];
                                    const imageKey = findImageKey(imageUrl);
                                    
                                    if (imageKey) {
                                        el.classList.add('editable-image');
                                        el.title = `클릭하여 ${imageKey} 이미지 관리`;
                                        el.addEventListener('click', (event) => {
                                            // 링크나 버튼 등의 기본 동작 방지를 위한 조건 체크
                                            const clickedTag = event.target.tagName.toLowerCase();
                                            if (clickedTag !== 'a' && clickedTag !== 'button' && 
                                                clickedTag !== 'input' && clickedTag !== 'textarea') {
                                                navigateToImageManager(imageKey);
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        console.error('iframe 내 이미지 이벤트 설정 오류:', e);
                    }
                };
                
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('HTML 미리보기 로드 오류:', error);
        return false;
    }
}

/**
 * 이미지 관리 페이지로 이동하는 함수
 * @param {string} imageKey - 선택할 이미지 키
 */
function navigateToImageManager(imageKey) {
    // 이미지 키를 URL 파라미터로 전달하며 이미지 관리 페이지로 이동
    window.location.href = `images.html?key=${encodeURIComponent(imageKey)}`;
}

/**
 * 개선 요구사항 처리
 */
async function processImprovementRequest(improvementRequest) {
    try {
        // 로딩 표시
        showLoading('웹사이트 개선 중...');
        
        // 필요한 데이터 가져오기
        const savedPlanningData = localStorage.getItem(LOCAL_STORAGE_KEYS.planning);
        const savedCodeData = localStorage.getItem(LOCAL_STORAGE_KEYS.code);
        
        if (!savedCodeData) {
            throw new Error('개선할 웹사이트 코드가 없습니다. 먼저 코드를 생성해주세요.');
        }
        
        // 데이터 파싱
        const codeData = JSON.parse(savedCodeData);
        const planningData = savedPlanningData ? JSON.parse(savedPlanningData) : { planning: '', design: '' };
        
        // 선택된 모델 정보 가져오기
        const selectedModel = getSelectedModel('prompt-model');
        if (!selectedModel) {
            throw new Error('모델을 선택해주세요.');
        }
        
        // 참고 웹사이트 URL 가져오기 (있는 경우)
        const referenceWebsite = codeData.reference_website || '';
        
        // 개선 요청 프롬프트 준비
        let improvementPrompt = PROMPT_TEMPLATES.improvement_ai.user_prompt_template
            .replace('{planning_doc}', planningData.planning || '')
            .replace('{design_requirements}', planningData.design || '')
            .replace('{current_html_code}', codeData.html_code || '')
            .replace('{reference_website}', referenceWebsite)
            .replace('{improvement_request}', improvementRequest);
        
        // 프로바이더에 따른 API 엔드포인트 선택
        let apiEndpoint;
        let requestData = {
            type: "text",
            model: selectedModel.name,
            max_tokens: 100000 // 기본 max_tokens 값 설정
        };
        
        switch (selectedModel.provider) {
            case 'openai':
                apiEndpoint = apiEndpoints.backend.openai;
                requestData.messages = [
                    {
                        role: "system",
                        content: PROMPT_TEMPLATES.improvement_ai.system_prompt
                    },
                    {
                        role: "user",
                        content: improvementPrompt
                    }
                ];
                break;
            case 'google':
                apiEndpoint = apiEndpoints.backend.google;
                requestData.contents = [
                    PROMPT_TEMPLATES.improvement_ai.system_prompt + "\n\n" + improvementPrompt
                ];
                break;
            case 'anthropic':
                apiEndpoint = apiEndpoints.backend.anthropic;
                requestData.system = PROMPT_TEMPLATES.improvement_ai.system_prompt;
                requestData.messages = [
                    {
                        role: "user",
                        content: improvementPrompt
                    }
                ];
                requestData.max_tokens = 4096;
                requestData.temperature = 0.7;
                break;
            default:
                throw new Error('지원되지 않는 모델 제공자입니다.');
        }
        
        // API 호출
        const response = await callSecureApi(apiEndpoint, 'POST', requestData);
        
        // 결과 처리
        if (response && response.success) {
            try {
                let result;
                
                // data.content가 JSON 문자열로 온 경우 처리
                if (response.data && response.data.content && typeof response.data.content === 'string') {
                    try {
                        // content에서 JSON 문자열 추출 (```json과 ``` 태그 제거)
                        const jsonContent = response.data.content.replace(/^```json\n|\n```$/g, '');
                        result = JSON.parse(jsonContent);
                        console.log('응답 데이터 파싱 성공 (data.content):', result);
                    } catch (contentParseError) {
                        console.error('content 파싱 오류:', contentParseError);
                        throw new Error('응답 content 형식이 올바르지 않습니다.');
                    }
                } else {
                    // 기존 처리 방식 유지
                    result = typeof response.data === 'string' 
                        ? JSON.parse(response.data) 
                        : response.data;
                    console.log('응답 데이터 파싱 성공 (기존 방식):', result);
                }
                
                if (result.html_code) {
                    // 코드 업데이트
                    codeData.html_code = result.html_code;
                    codeData.updated_at = new Date().toISOString();
                    
                    // 로컬 스토리지에 저장
                    localStorage.setItem(LOCAL_STORAGE_KEYS.code, JSON.stringify(codeData));
                    
                    // 이미지가 있는 경우
                    if (result.images && result.images.length > 0) {
                        // 기존 이미지 데이터 가져오기
                        const savedImagesData = localStorage.getItem(LOCAL_STORAGE_KEYS.image);
                        let imagesData = savedImagesData ? JSON.parse(savedImagesData) : { images: [] };
                        
                        // 새로운 이미지 또는 변경된 이미지 업데이트
                        result.images.forEach(newImage => {
                            const existingIndex = imagesData.images.findIndex(img => img.key === newImage.key);
                            if (existingIndex !== -1) {
                                // 기존 이미지 업데이트
                                imagesData.images[existingIndex] = newImage;
                            } else {
                                // 새 이미지 추가
                                imagesData.images.push(newImage);
                            }
                        });
                        
                        // 이미지 데이터 저장
                        imagesData.updated_at = new Date().toISOString();
                        localStorage.setItem(LOCAL_STORAGE_KEYS.image, JSON.stringify(imagesData));
                    }
                    
                    // 미리보기 갱신
                    loadAndShowHtmlPreview();
                    
                    // 응답으로 받은 새 상태(B 코드)를 히스토리에 저장
                    saveCurrentState();
                    console.log('API 응답 후 새 상태를 히스토리에 저장했습니다.');
                    
                    // 변경 사항 메시지 표시
                    if (result.changes) {
                        let changesMessage = '웹사이트 개선 완료!\n\n변경 사항:\n';
                        changesMessage += Array.isArray(result.changes) 
                            ? result.changes.map(change => `• ${change}`).join('\n') 
                            : result.changes;
                        
                        alertDialog('개선 완료', changesMessage);
                    } else {
                        showToast('웹사이트 개선 완료!', 'success');
                    }
                } else {
                    throw new Error('응답 형식이 올바르지 않습니다: html_code 속성이 없습니다.');
                }
            } catch (parseError) {
                console.error('응답 파싱 오류:', parseError);
                showToast(parseError.message || '응답 형식이 올바르지 않습니다.', 'error');
            }
        } else {
            throw new Error(response?.message || '웹사이트 개선에 실패했습니다.');
        }
    } catch (error) {
        console.error('웹사이트 개선 오류:', error);
        showToast(error.message || '웹사이트 개선에 실패했습니다.', 'error');
    } finally {
        hideLoading();
        // 입력 필드 초기화
        improvementPromptInput.value = '';
    }
}

/**
 * 페이지 초기화 함수
 */
function initPage() {
    console.log('메인 페이지 초기화 시작');
    
    // 히스토리 상태 로드
    loadHistoryStates();
    
    // 모달 설정
    setupModals();
    
    // 드래그 기능 설정
    setupDraggable();
    
    // 모델 선택기 설정
    setupModelSelectors();
    
    // 페이지 로드 시 자동으로 HTML 미리보기 표시 시도
    const hasLoadedPreview = loadAndShowHtmlPreview();
    
    // 미리보기가 없는 경우 웹사이트 소개 화면 표시
    if (!hasLoadedPreview) {
        showIntroductionMode();
    } else {
        // 미리보기가 로드됐지만 히스토리에 기록이 없는 경우 첫 번째 상태로 저장
        if (historyStates.length === 0) {
            saveCurrentState();
        }
    }
    
    // 크레딧 정보 로드 및 자동 업데이트 설정
    fetchAndDisplayUsageInfo();
    startUsageUpdateInterval();
    
    // 초기 상태는 열림으로 변경
    promptModal.classList.remove('hidden');
    isPromptOpen = true;
    promptBtn.classList.add('close-mode');
    
    // 텍스트 에어리어에 포커스
    setTimeout(() => improvementPromptInput.focus(), 300);
    
    // 텍스트 에어리어 이벤트 설정
    if (improvementPromptInput) {
        // 포커스/블러 이벤트는 이제 CSS에서 처리 (hover/focus-within)
        
        // Enter 키 누를 때 Shift와 함께 누르지 않으면 제출
        improvementPromptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && improvementPromptInput.value.trim()) {
                e.preventDefault();
                submitPromptBtn.click();
            }
        });
    }
    
    console.log('메인 페이지 초기화 완료');
}

// 초기 로드 시 설정
document.addEventListener('DOMContentLoaded', initPage);

// 페이지 언로드 시 인터벌 정리
window.addEventListener('beforeunload', () => {
    if (usageUpdateInterval) {
        clearInterval(usageUpdateInterval);
        console.log('크레딧 정보 자동 업데이트 중지');
    }
}); 