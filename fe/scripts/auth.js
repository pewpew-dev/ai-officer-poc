import { firebaseConfig } from '../configs/config.js';
import { apiEndpoints } from '../configs/config.js';
import { LOCAL_STORAGE_KEYS } from '../configs/config.js';
import { showToast, callSecureApi } from './common.js';

// Firebase 초기화 함수
export function initializeFirebase() {
    // Firebase가 아직 초기화되지 않았다면 초기화
    if (window.firebase && !firebase.apps.length) {
        console.log('Firebase 초기화');
        firebase.initializeApp(firebaseConfig);
    }
}

// 초기화 즉시 실행
initializeFirebase();

// DOM 요소
const loginSection = document.getElementById('login-section');
const loggedInSection = document.getElementById('logged-in-section');
const usageInfo = document.getElementById('usage-info');
const googleLoginBtn = document.getElementById('google-login');
const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');
const usedCreditsSpan = document.getElementById('used-credits');
const totalCreditsSpan = document.getElementById('total-credits');
const remainingCreditsSpan = document.getElementById('remaining-credits');
const debugContent = document.getElementById('debug-content');

// Google 로그인
googleLoginBtn?.addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        
        // ID 토큰 저장
        const idToken = await user.getIdToken();
        localStorage.setItem(LOCAL_STORAGE_KEYS.auth, idToken);
        
        // 사용자 정보 표시
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (loginSection) loginSection.classList.add('hidden');
        if (loggedInSection) loggedInSection.classList.remove('hidden');
        
        // 사용량 정보 조회
        await fetchUsageInfo();

        // 이전에 저장된 페이지가 있으면 해당 페이지로, 없으면 홈으로 리다이렉션
        setTimeout(() => {
            const redirectUrl = localStorage.getItem('redirect_after_login') || 'index.html';
            localStorage.removeItem('redirect_after_login'); // 사용 후 삭제
            window.location.href = redirectUrl;
        }, 1000); // 1초 후 리다이렉션 (사용자가 로그인 완료를 확인할 시간을 줌)
    } catch (error) {
        console.error('로그인 오류:', error);
        showToast('로그인 중 오류가 발생했습니다: ' + error.message, 'error');
    }
});

// 로그아웃
logoutBtn?.addEventListener('click', async () => {
    try {
        await firebase.auth().signOut();
        localStorage.removeItem(LOCAL_STORAGE_KEYS.auth);
        if (loginSection) loginSection.classList.remove('hidden');
        if (loggedInSection) loggedInSection.classList.add('hidden');
        if (usageInfo) usageInfo.classList.add('hidden');
        showToast('로그아웃되었습니다.', 'success');
    } catch (error) {
        console.error('로그아웃 오류:', error);
        showToast('로그아웃 중 오류가 발생했습니다: ' + error.message, 'error');
    }
});

/**
 * 로그인 상태를 확인하고 로그인되지 않은 경우 로그인 페이지로 리다이렉트
 * @returns {boolean} 로그인 상태
 */
export function checkAuthState() {
    console.log('로그인 상태 확인 (auth.js)');
    const idToken = localStorage.getItem(LOCAL_STORAGE_KEYS.auth);
    if (!idToken) {
        console.log('로그인 정보 없음, 로그인 페이지로 이동');
        window.location.href = 'auth.html';
        return false;
    }
    console.log('로그인 정보 확인됨');
    return true;
}

// 사용량 정보 조회
async function fetchUsageInfo() {
    try {
        // DOM 요소 확인
        if (!usageInfo || !usedCreditsSpan || !totalCreditsSpan || !remainingCreditsSpan) {
            return;
        }
        
        try {
            // API 호출 함수 사용 (common.js에서 import)
            const data = await callSecureApi(apiEndpoints.backend.usage, 'GET');
            
            if (data.success) {
                const { used, limit, remaining } = data.data;
                usedCreditsSpan.textContent = used;
                totalCreditsSpan.textContent = limit;
                remainingCreditsSpan.textContent = remaining;
                usageInfo.classList.remove('hidden');
            } else {
                throw new Error(data.error?.message || '사용량 정보 조회 실패');
            }
        } catch (error) {
            console.error('사용량 정보 조회 오류:', error);
        }
    } catch (error) {
        console.error('사용량 정보 조회 오류:', error);
    }
}

// 디버그 정보 업데이트
function updateDebugInfo() {
    if (!debugContent) return;
    
    try {
        const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.auth);
        debugContent.textContent = `AUTH 토큰: ${authToken ? authToken.substring(0, 10) + '...' : '없음'}\n`;
        debugContent.textContent += `현재 경로: ${window.location.pathname}\n`;
        
        // 로컬 스토리지 키 목록
        const storageKeys = Object.keys(localStorage);
        debugContent.textContent += `로컬 스토리지 키 (${storageKeys.length}): ${storageKeys.join(', ')}\n`;
    } catch (error) {
        console.error('디버그 정보 업데이트 오류:', error);
    }
}

// 초기화 함수
export function initAuth() {
    // 디버그 정보 초기 업데이트
    updateDebugInfo();

    // 인증 상태 변경 감지
    firebase.auth().onAuthStateChanged(async (user) => {
        updateDebugInfo();
        
        if (user) {
            // 로그인된 상태
            if (userEmailSpan) userEmailSpan.textContent = user.email;
            if (loginSection) loginSection.classList.add('hidden');
            if (loggedInSection) loggedInSection.classList.remove('hidden');
            
            // ID 토큰 확인 및 갱신
            try {
                const idToken = await user.getIdToken(true);
                localStorage.setItem(LOCAL_STORAGE_KEYS.auth, idToken);
                
                // 사용량 정보 조회
                await fetchUsageInfo();
            } catch (error) {
                console.error('토큰 갱신 오류:', error);
            }
        } else {
            // 로그아웃된 상태
            if (loginSection) loginSection.classList.remove('hidden');
            if (loggedInSection) loggedInSection.classList.add('hidden');
            if (usageInfo) usageInfo.classList.add('hidden');
        }
    });
}

// 페이지 로드 시 인증 초기화
document.addEventListener('DOMContentLoaded', initAuth); 