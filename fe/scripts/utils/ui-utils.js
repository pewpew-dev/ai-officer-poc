/**
 * UI 관련 유틸리티 함수
 * 토스트 메시지, 로딩 인디케이터 등 UI 요소 관리
 */

/**
 * 토스트 알림을 화면에 표시하는 함수
 * @param {string} message - 표시할 메시지
 * @param {string} type - 알림 타입 ('success', 'error', 'info', 'warning' 중 하나)
 * @param {number} duration - 표시 지속 시간 (밀리초)
 */
export function showToast(message, type = 'info', duration = 3000) {
    // 토스트 요소 가져오기
    let toast = document.getElementById('toast-notification');
    let toastMessage = document.getElementById('toast-message');
    
    // 토스트 요소가 없으면 생성
    if (!toast) {
        const newToast = document.createElement('div');
        newToast.id = 'toast-notification';
        newToast.className = 'hidden';
        
        const newToastMessage = document.createElement('span');
        newToastMessage.id = 'toast-message';
        
        newToast.appendChild(newToastMessage);
        document.body.appendChild(newToast);
        
        // 참조 업데이트
        toast = newToast;
        toastMessage = newToastMessage;
    }
    
    // 이전 타이머 취소
    if (window.toastTimer) {
        clearTimeout(window.toastTimer);
        toast.classList.remove('show', 'hide');
    }
    
    // 모든 배경색 클래스 제거
    toast.classList.remove('bg-success', 'bg-error', 'bg-warning', 'bg-info');
    
    // 타입에 따른 스타일 설정
    switch (type) {
        case 'success':
            toast.classList.add('bg-success');
            break;
        case 'error':
            toast.classList.add('bg-error');
            break;
        case 'warning':
            toast.classList.add('bg-warning');
            break;
        case 'info':
        default:
            toast.classList.add('bg-info');
            break;
    }
    
    // 메시지 설정
    toastMessage.textContent = message;
    
    // 토스트 표시
    toast.classList.add('show');
    toast.classList.remove('hidden');
    
    // 지정된 시간 후 토스트 숨기기
    window.toastTimer = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        // 애니메이션 후 완전히 숨기기
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('hide');
        }, 300);
    }, duration);
}

/**
 * 로딩 인디케이터 표시
 * 이미 로딩 인디케이터 컴포넌트가 로드된 경우에만 작동
 */
import { showLoadingIndicator as showIndicator, hideLoadingIndicator as hideIndicator } from './components/loading-indicator-utils.js';

/**
 * 로딩 인디케이터 표시
 */
export function showLoading() {
    showIndicator();
}

/**
 * 로딩 인디케이터 숨기기
 */
export function hideLoading() {
    hideIndicator();
}

/**
 * 확인 대화상자 표시
 * 모달 컴포넌트를 사용하여 확인 대화상자를 표시합니다.
 * @param {string} message - 대화상자에 표시할 메시지
 * @param {string} title - 대화상자 제목 
 * @returns {Promise<boolean>} 사용자 선택 결과 (확인: true, 취소: false)
 */
export async function confirmDialog(message, title = '확인') {
    return new Promise((resolve) => {
        // DOM 요소 가져오기
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const closeModalBtn = document.getElementById('close-modal');
        const saveEditBtn = document.getElementById('save-edit-btn');
        const modalEditContent = document.getElementById('modal-edit-content');
        
        if (!modal || !modalTitle || !modalContent) {
            // 모달이 없는 경우 기본 confirm으로 대체
            const result = confirm(message);
            resolve(result);
            return;
        }
        
        // 확인 및 취소 버튼 생성
        const actionButtons = document.createElement('div');
        actionButtons.className = 'flex justify-end space-x-2 mt-4';
        actionButtons.innerHTML = `
            <button id="modal-cancel-btn" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                취소
            </button>
            <button id="modal-confirm-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                확인
            </button>
        `;
        
        // 모달 내용 설정
        modalTitle.textContent = title;
        modalContent.innerHTML = message;
        
        // 편집 관련 UI 숨기기
        if (modalEditContent) modalEditContent.classList.add('hidden');
        if (saveEditBtn) saveEditBtn.classList.add('hidden');
        
        // 액션 버튼 추가
        modalContent.appendChild(actionButtons);
        
        // 버튼에 이벤트 리스너 추가
        const cancelBtn = actionButtons.querySelector('#modal-cancel-btn');
        const confirmBtn = actionButtons.querySelector('#modal-confirm-btn');
        
        const handleCancel = () => {
            modal.classList.add('hidden');
            cleanupListeners();
            resolve(false);
        };
        
        const handleConfirm = () => {
            modal.classList.add('hidden');
            cleanupListeners();
            resolve(true);
        };
        
        const handleClose = () => {
            modal.classList.add('hidden');
            cleanupListeners();
            resolve(false);
        };
        
        // 이벤트 리스너 정리 함수
        const cleanupListeners = () => {
            cancelBtn.removeEventListener('click', handleCancel);
            confirmBtn.removeEventListener('click', handleConfirm);
            closeModalBtn.removeEventListener('click', handleClose);
            document.removeEventListener('keydown', handleKeypress);
        };
        
        // 이벤트 리스너 추가
        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
        closeModalBtn.addEventListener('click', handleClose);
        
        // ESC 키로 모달 닫기
        const handleKeypress = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        document.addEventListener('keydown', handleKeypress);
        
        // 모달 표시
        modal.classList.remove('hidden');
    });
}

/**
 * 알림 대화상자 표시
 * 모달 컴포넌트를 사용하여 알림 대화상자를 표시합니다.
 * @param {string} message - 대화상자에 표시할 메시지
 * @param {string} title - 대화상자 제목
 */
export async function alertDialog(message, title = '알림') {
    return new Promise((resolve) => {
        // DOM 요소 가져오기
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const closeModalBtn = document.getElementById('close-modal');
        const saveEditBtn = document.getElementById('save-edit-btn');
        const modalEditContent = document.getElementById('modal-edit-content');
        
        if (!modal || !modalTitle || !modalContent) {
            // 모달이 없는 경우 기본 alert으로 대체
            alert(message);
            resolve();
            return;
        }
        
        // 확인 버튼 생성
        const actionButtons = document.createElement('div');
        actionButtons.className = 'flex justify-end space-x-2 mt-4';
        actionButtons.innerHTML = `
            <button id="modal-ok-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                확인
            </button>
        `;
        
        // 모달 내용 설정
        modalTitle.textContent = title;
        modalContent.innerHTML = message;
        
        // 편집 관련 UI 숨기기
        if (modalEditContent) modalEditContent.classList.add('hidden');
        if (saveEditBtn) saveEditBtn.classList.add('hidden');
        
        // 액션 버튼 추가
        modalContent.appendChild(actionButtons);
        
        // 버튼에 이벤트 리스너 추가
        const okBtn = actionButtons.querySelector('#modal-ok-btn');
        
        const handleOk = () => {
            modal.classList.add('hidden');
            cleanupListeners();
            resolve();
        };
        
        const handleClose = () => {
            modal.classList.add('hidden');
            cleanupListeners();
            resolve();
        };
        
        // 이벤트 리스너 정리 함수
        const cleanupListeners = () => {
            okBtn.removeEventListener('click', handleOk);
            closeModalBtn.removeEventListener('click', handleClose);
            document.removeEventListener('keydown', handleKeypress);
        };
        
        // 이벤트 리스너 추가
        okBtn.addEventListener('click', handleOk);
        closeModalBtn.addEventListener('click', handleClose);
        
        // ESC 키로 모달 닫기
        const handleKeypress = (e) => {
            if (e.key === 'Escape') {
                handleOk();
            }
        };
        
        document.addEventListener('keydown', handleKeypress);
        
        // 모달 표시
        modal.classList.remove('hidden');
    });
} 