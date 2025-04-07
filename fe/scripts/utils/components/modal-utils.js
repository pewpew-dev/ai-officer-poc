/**
 * 모달 관련 유틸리티 함수
 * 모달 열기, 닫기 및 이벤트 처리
 */

/**
 * 모달 초기화
 * 모달 관련 이벤트 리스너 설정 및 전역 함수 노출
 * @returns {boolean} 초기화 성공 여부
 */
export function initModal() {
    try {
        console.log('모달 초기화 시작');
        
        const modal = document.getElementById('modal');
        const closeModalBtn = document.getElementById('close-modal');
        
        if (!modal || !closeModalBtn) {
            console.warn('모달 컴포넌트가 로드되지 않았습니다.');
            return false;
        }
        
        // 모달 닫기 버튼 클릭 이벤트
        closeModalBtn.addEventListener('click', () => {
            closeModal();
        });
        
        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // 전역 함수로 노출
        window.openModal = openModal;
        window.closeModal = closeModal;
        
        console.log('모달 유틸리티 초기화 완료');
        return true;
    } catch (error) {
        console.error('모달 초기화 오류:', error);
        return false;
    }
}

/**
 * 모달 열기
 * @param {string} title - 모달 제목
 * @param {string} content - 모달 내용 (HTML 문자열 가능)
 * @param {boolean} editMode - 편집 모드 활성화 여부
 */
export function openModal(title, content, editMode = false) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalEditContent = document.getElementById('modal-edit-content');
    const editTextarea = document.getElementById('edit-textarea');
    const saveEditBtn = document.getElementById('save-edit-btn');
    
    if (!modal) {
        console.error('모달 엘리먼트를 찾을 수 없습니다.');
        return;
    }
    
    // 모달 제목 설정
    if (modalTitle) modalTitle.textContent = title || '';
    
    // 모달 내용 설정
    if (modalContent) modalContent.innerHTML = content || '';
    
    // 편집 모드 설정
    setEditMode(editMode, modalContent, modalEditContent, editTextarea, saveEditBtn, content);
    
    // 모달 표시
    modal.classList.remove('hidden');
    
    // 전역 이벤트 발생
    const event = new CustomEvent('modalOpened', { 
        detail: { title, editMode } 
    });
    window.dispatchEvent(event);
}

/**
 * 모달 닫기
 */
export function closeModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    
    modal.classList.add('hidden');
    
    // 전역 이벤트 발생
    const event = new CustomEvent('modalClosed');
    window.dispatchEvent(event);
}

/**
 * 편집 모드 설정
 * @private
 */
function setEditMode(editMode, modalContent, modalEditContent, editTextarea, saveEditBtn, content) {
    if (!modalEditContent || !editTextarea) return;
    
    if (editMode) {
        // 편집 모드 활성화
        modalContent.classList.add('hidden');
        modalEditContent.classList.remove('hidden');
        editTextarea.value = content || '';
        if (saveEditBtn) saveEditBtn.classList.remove('hidden');
    } else {
        // 보기 모드 활성화
        modalContent.classList.remove('hidden');
        modalEditContent.classList.add('hidden');
        if (saveEditBtn) saveEditBtn.classList.add('hidden');
    }
} 