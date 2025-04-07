/**
 * 로딩 인디케이터 관련 유틸리티 함수
 * 로딩 인디케이터 컴포넌트의 표시 및 숨김 기능 제공
 */

/**
 * 로딩 인디케이터 초기화 함수
 * 컴포넌트가 로드된 후 호출되어야 함
 * @returns {boolean} 초기화 성공 여부
 */
export function initLoadingIndicator() {
    try {
        console.log('로딩 인디케이터 초기화 시작');
        
        // 전역 함수로 로딩 인디케이터 표시 함수 노출
        window.showLoadingIndicator = function() {
            const indicator = document.getElementById('loading-indicator');
            if (indicator) {
                indicator.classList.remove('hidden');
            } else {
                console.warn('로딩 인디케이터 요소를 찾을 수 없습니다.');
            }
        };
        
        // 전역 함수로 로딩 인디케이터 숨기기 함수 노출
        window.hideLoadingIndicator = function() {
            const indicator = document.getElementById('loading-indicator');
            if (indicator) {
                indicator.classList.add('hidden');
            } else {
                console.warn('로딩 인디케이터 요소를 찾을 수 없습니다.');
            }
        };
        
        console.log('로딩 인디케이터 초기화 완료');
        return true;
    } catch (error) {
        console.error('로딩 인디케이터 초기화 오류:', error);
        return false;
    }
}

/**
 * 로딩 인디케이터 표시 함수
 */
export function showLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.classList.remove('hidden');
    } else {
        console.warn('로딩 인디케이터 요소를 찾을 수 없습니다.');
    }
}

/**
 * 로딩 인디케이터 숨기기 함수
 */
export function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.classList.add('hidden');
    } else {
        console.warn('로딩 인디케이터 요소를 찾을 수 없습니다.');
    }
} 