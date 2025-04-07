/**
 * API 관련 유틸리티 함수
 * 백엔드 API 호출 및 인증 처리를 위한 기능 제공
 */

import { LOCAL_STORAGE_KEYS, apiEndpoints } from '../../configs/config.js';

/**
 * 일반적인 API 호출을 위한 공통 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {string} method - HTTP 메서드 ('GET', 'POST', 'PUT', 'DELETE' 등)
 * @param {Object} data - 요청 데이터 (POST, PUT에 필요)
 * @returns {Promise<Object>} 응답 데이터
 */
export async function callApi(endpoint, method = 'GET', data = null) {
    // ID 토큰 확인
    const idToken = localStorage.getItem(LOCAL_STORAGE_KEYS.auth);
    if (!idToken) {
        throw new Error('로그인이 필요합니다.');
    }

    // URL 생성
    const url = `${apiEndpoints.backend.base}${endpoint}`;
    
    // 요청 옵션 생성
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        }
    };

    // POST나 PUT 요청인 경우 데이터 추가
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        // API 호출
        const response = await fetch(url, options);
        
        if (!response.ok) {
            console.error('API 호출 실패:', response.status, response.statusText);
            
            // 401 Unauthorized 오류 처리
            if (response.status === 401) {
                throw new Error('인증이 필요합니다.');
            }
            
            // 응답 본문 확인 시도
            try {
                const errorData = await response.json();
                if (errorData.error && errorData.error.code === 'INVALID_TOKEN') {
                    throw new Error('인증이 필요합니다.');
                }
                throw new Error(errorData.error?.message || 'API 호출 실패');
            } catch (jsonError) {
                // 응답 본문을 파싱할 수 없는 경우
                throw new Error('API 호출 실패');
            }
        }

        return await response.json();
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
}

/**
 * 로그인 상태에서만 API 호출을 수행하는 래퍼 함수
 * 로그인되지 않은 경우 에러를 발생시키는 대신 로그인 페이지로 리다이렉트
 * @param {string} endpoint - API 엔드포인트
 * @param {string} method - HTTP 메서드
 * @param {Object} data - 요청 데이터
 * @returns {Promise<Object>} 응답 데이터
 */
export async function callSecureApi(endpoint, method = 'GET', data = null) {
    try {
        return await callApi(endpoint, method, data);
    } catch (error) {
        // 로그인이 필요한 오류나 인증 관련 오류 처리
        if (error.message === '로그인이 필요합니다.' || 
            error.message === '인증이 필요합니다.' || 
            error.message === '유효하지 않은 인증 토큰입니다.' ||
            error.message.includes('인증') || 
            error.message.includes('로그인')) {
            
            // 로컬 스토리지에서 만료된 토큰 제거
            localStorage.removeItem(LOCAL_STORAGE_KEYS.auth);
            
            console.log('인증 오류로 인해 로그인 페이지로 이동합니다.');
            
            // 현재 페이지 URL을 저장하여 로그인 후 다시 돌아올 수 있도록 함
            const currentPage = window.location.pathname;
            if (!currentPage.includes('auth.html')) {
                localStorage.setItem('redirect_after_login', currentPage);
            }
            
            // 로그인 페이지로 리다이렉트
            window.location.href = '/pages/auth.html';
            return; // 리다이렉션 후 더 이상 진행하지 않음
        }
        
        // 다른 오류는 그대로 throw
        throw error;
    }
}

/**
 * 인증 토큰 유효성 검사
 * @returns {boolean} 토큰이 유효한지 여부
 */
export function isAuthenticated() {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.auth);
    return !!token; // 토큰이 존재하면 true, 없으면 false
}

/**
 * 파일 업로드 API 호출
 * @param {File} file - 업로드할 파일
 * @param {string} type - 파일 타입 (예: 'image', 'document')
 * @returns {Promise<Object>} 업로드 결과
 */
export async function uploadFile(file, type) {
    const idToken = localStorage.getItem(LOCAL_STORAGE_KEYS.auth);
    if (!idToken) {
        throw new Error('로그인이 필요합니다.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${idToken}`
        },
        body: formData
    };

    try {
        const response = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.storage}`, options);
        
        if (!response.ok) {
            console.error('파일 업로드 실패:', response.status, response.statusText);
            throw new Error('파일 업로드 실패');
        }

        return await response.json();
    } catch (error) {
        console.error('파일 업로드 오류:', error);
        throw error;
    }
} 