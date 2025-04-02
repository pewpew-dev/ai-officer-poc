/**
 * Firebase 인증 관련 기능
 * 사용자 회원가입, 로그인, 로그아웃 및 상태 관리를 담당합니다.
 */

import { firebaseConfig, apiEndpoints } from './config.js';

// Firebase 인증 초기화
export function initFirebaseAuth() {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // 인증 상태 변경 감지
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // 사용자가 로그인한 경우
            console.log('사용자 로그인됨:', user.email);
            
            // 로그인 섹션 업데이트
            document.getElementById('not-logged-in').classList.add('hidden');
            document.getElementById('logged-in').classList.remove('hidden');
            
            // 사용자 이메일 표시
            document.getElementById('user-email').textContent = user.email;
            
            // 사용량 정보 로드
            loadUserUsage(user.uid);
        } else {
            // 사용자가 로그아웃한 경우
            console.log('사용자 로그아웃됨');
            
            // 로그인 섹션 업데이트
            document.getElementById('not-logged-in').classList.remove('hidden');
            document.getElementById('logged-in').classList.add('hidden');
        }
    });
    
    // Google 로그인 버튼에 이벤트 리스너 추가
    document.getElementById('google-login-button').addEventListener('click', googleLogin);
    
    // 로그아웃 버튼에 이벤트 리스너 추가
    document.getElementById('logout-button').addEventListener('click', logout);
    
    // 오류 메시지 초기화
    clearAuthErrors();
}

// Google 로그인
export async function googleLogin() {
    try {
        clearAuthErrors();
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
    } catch (error) {
        console.error('Google 로그인 오류:', error);
        showLoginError(`로그인 실패: ${error.message}`);
    }
}

// 로그아웃
export async function logout() {
    try {
        await firebase.auth().signOut();
    } catch (error) {
        console.error('로그아웃 오류:', error);
    }
}

// 사용자 사용량 정보 로드
export async function loadUserUsage(userId = null) {
    try {
        const usageElement = document.getElementById('user-usage');
        
        // 현재 로그인한 사용자의 ID 토큰 가져오기
        const user = firebase.auth().currentUser;
        if (!user) {
            usageElement.textContent = "로그인이 필요합니다";
            return;
        }
        
        // userId가 제공되지 않은 경우 현재 로그인한 사용자의 ID 사용
        const uid = userId || user.uid;
        
        const idToken = await user.getIdToken();
        
        // 백엔드 API에서 사용량 정보 가져오기
        const response = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.usage}?uid=${uid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        if (response.ok) {
            const responseData = await response.json();
            // 응답 구조: {"success":true,"data":{"used":0,"limit":10000,"remaining":10000}}
            if (responseData.success && responseData.data) {
                const usageData = responseData.data;
                // 사용량 표시 (남은 크레딧 / 총 크레딧)
                usageElement.textContent = `${usageData.remaining} / ${usageData.limit} 크레딧`;
            } else {
                usageElement.textContent = "사용량 정보를 불러올 수 없습니다";
            }
        } else {
            // API 오류 발생 시 기본값 표시
            usageElement.textContent = "사용량 정보를 불러올 수 없습니다";
        }
    } catch (error) {
        console.error('사용량 정보 로드 오류:', error);
        document.getElementById('user-usage').textContent = "사용량 정보를 불러올 수 없습니다";
    }
}

// 로그인 오류 메시지 표시
function showLoginError(message) {
    // 모달 사용
    if (window.showErrorModal) {
        window.showErrorModal(message);
    } else {
        console.error('로그인 오류:', message);
    }
}

// 인증 오류 메시지 초기화
function clearAuthErrors() {
    // 모달 사용하므로 더 이상 DOM 요소를 직접 초기화할 필요 없음
    // 아무 작업도 수행하지 않음
}
