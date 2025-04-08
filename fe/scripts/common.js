/**
 * 공통 유틸리티 함수들을 모아서 export하는 진입점 파일
 * 기존 코드를 모듈화하여 더 작고 관리하기 쉬운 파일들로 분리한 후,
 * 이 파일에서 다시 재내보내는(re-export) 방식으로 구성
 */

// 컴포넌트 로더 모듈
import { loadComponent, loadCommonComponents } from './utils/component-loader.js';

// API 호출 모듈
import { callSecureApi, isAuthenticated, uploadFile } from './utils/api-utils.js';

// UI 유틸리티 모듈
import { showToast, showLoading, hideLoading, confirmDialog, alertDialog } from './utils/ui-utils.js';

// 모델 유틸리티 모듈
import { 
    getModels, 
    getDefaultModel, 
    getModelKey, 
    getModelFromKey, 
    getSelectedModel, 
    createModelSelector 
} from './utils/model-utils.js';

// 로컬 스토리지 키 가져오기
import { LOCAL_STORAGE_KEYS } from '../configs/config.js';

// 페이지 로드 즉시 네비게이터를 먼저 로드
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM 로드됨 - 네비게이션 및 공통 컴포넌트 로드 시작');
    
    // 공통 컴포넌트 로드
    await loadCommonComponents([
        // 탐색 버튼을 최우선으로 로드
        { name: 'navigation', selector: 'body', position: 'beforeend', highPriority: true },
        // 로딩 인디케이터 컴포넌트 로드
        { name: 'loading-indicator', selector: 'body', position: 'beforeend' },
        // 모달 컴포넌트 로드
        { name: 'modal', selector: 'body', position: 'beforeend' }
    ]);
    
    // 로그인 상태 확인 (로그인 페이지는 제외) - idToken으로 직접 확인
    if (!window.location.pathname.includes('auth.html')) {
        const idToken = localStorage.getItem(LOCAL_STORAGE_KEYS.auth);
        if (!idToken) {
            console.log('로그인 정보 없음, 로그인 페이지로 이동');
            // 현재 페이지 저장
            const currentPage = window.location.pathname.split('/').pop();
            localStorage.setItem('redirect_after_login', currentPage);
            window.location.href = 'auth.html';
        } else {
            console.log('로그인 정보 확인됨');
        }
    }
    
    console.log('공통 컴포넌트 로드 완료');
});

// 모든 함수를 다시 내보내기(re-export)
export {
    // 컴포넌트 로더
    loadComponent,
    loadCommonComponents,
    
    // API 유틸리티
    callSecureApi,
    isAuthenticated,
    uploadFile,
    
    // UI 유틸리티
    showToast,
    showLoading,
    hideLoading,
    confirmDialog,
    alertDialog,
    
    // 모델 유틸리티
    getModels,
    getDefaultModel,
    getModelKey,
    getModelFromKey,
    getSelectedModel,
    createModelSelector
}; 