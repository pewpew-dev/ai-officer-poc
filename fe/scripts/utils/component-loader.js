/**
 * 컴포넌트 로딩 관련 유틸리티 함수
 * 공통 컴포넌트를 로드하고 관리하는 기능 제공
 */

// 컴포넌트별 초기화 유틸리티 가져오기
import { initLoadingIndicator } from './components/loading-indicator-utils.js';
import { initModal } from './components/modal-utils.js';

// 네비게이션 사전 로드 (페이지 로드 전에 즉시 실행)
(async function preloadNavigation() {
    try {
        console.log('네비게이션 사전 로드 시작');
        const navigationPath = '../components/navigation.html';
        
        // 사전 로드를 위한 fetch 요청
        const response = await fetch(navigationPath, { 
            method: 'GET',
            cache: 'force-cache' // 캐시 활용
        });
        
        if (response.ok) {
            console.log('네비게이션 사전 로드 완료');
            // 여기서는 응답을 바로 사용하지 않고 캐시에만 저장
        }
    } catch (error) {
        console.error('네비게이션 사전 로드 오류:', error);
    }
})();

/**
 * 컴포넌트 초기화 함수 매핑
 * 컴포넌트 이름과 해당 초기화 함수를 연결
 */
const componentInitializers = {
    'loading-indicator': initLoadingIndicator,
    'modal': initModal,
    // 다른 컴포넌트 초기화 함수도 여기에 추가 가능
};

/**
 * HTML 컴포넌트를 로드하여 지정된 선택자 위치에 삽입
 * @param {string} componentName - 컴포넌트 파일명(확장자 제외)
 * @param {string} selector - 컴포넌트를 삽입할 위치의 CSS 선택자
 * @param {string} position - 삽입 위치 (beforeend, afterbegin, afterend, beforebegin)
 * @param {boolean} highPriority - 우선 순위가 높은지 여부 (true인 경우 스크립트 및 스타일 우선 로드)
 * @returns {Promise<void>}
 */
export async function loadComponent(componentName, selector, position = 'beforeend', highPriority = false) {
    try {
        // 경로 계산 (페이지에서 components 폴더로의 경로)
        const componentPath = `../components/${componentName}.html`;
        
        console.log(`컴포넌트 로드 시도: ${componentPath} ${highPriority ? '(우선순위 높음)' : ''}`);
        
        // 컴포넌트 가져오기
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`컴포넌트 로드 실패: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log(`컴포넌트 로드 성공: ${componentName}`);
        
        // 대상 요소에 컴포넌트 삽입
        const targetElement = document.querySelector(selector);
        if (targetElement) {
            // 우선순위가 높은 경우, document.head에 직접 추가
            if (highPriority) {
                // 임시 div에 HTML 파싱
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // 스크립트와 스타일을 찾아 즉시 적용
                Array.from(tempDiv.querySelectorAll('link[rel="stylesheet"], style')).forEach(node => {
                    const clone = document.createElement(node.tagName);
                    Array.from(node.attributes).forEach(attr => clone.setAttribute(attr.name, attr.value));
                    clone.textContent = node.textContent;
                    document.head.appendChild(clone);
                    node.parentNode.removeChild(node); // 원본에서 제거
                });
                
                // 나머지 HTML 삽입
                targetElement.insertAdjacentHTML(position, tempDiv.innerHTML);
            } else {
                // 일반적인 방식으로 HTML 삽입
                targetElement.insertAdjacentHTML(position, html);
            }
            
            console.log(`컴포넌트 삽입 완료: ${componentName}`);
            
            // 컴포넌트별 초기화 함수 호출
            if (componentInitializers[componentName]) {
                console.log(`${componentName} 컴포넌트 초기화 시작`);
                const initResult = componentInitializers[componentName]();
                if (initResult) {
                    console.log(`${componentName} 컴포넌트 초기화 완료`);
                } else {
                    console.warn(`${componentName} 컴포넌트 초기화 실패`);
                }
            }
            
            // 네비게이션 컴포넌트가 로드된 경우 커스텀 이벤트 발생
            if (componentName === 'navigation') {
                // 이벤트 발생 (플레이스홀더 제거용)
                const event = new CustomEvent('navigationLoaded');
                window.dispatchEvent(event);
                console.log('네비게이션 로드 이벤트 발생');
            }
            
            // 컴포넌트 로드 완료 이벤트 발생
            const event = new CustomEvent('componentLoaded', {
                detail: { name: componentName, highPriority }
            });
            window.dispatchEvent(event);
        } else {
            console.warn(`선택자 '${selector}'에 해당하는 요소를 찾을 수 없습니다.`);
        }
    } catch (error) {
        console.error('컴포넌트 로드 오류:', error);
    }
}

/**
 * 공통 컴포넌트 로드 함수
 * 여러 컴포넌트를 한 번에 로드하는 기능
 * @param {Array<{name: string, selector: string, position: string, highPriority: boolean}>} components - 로드할 컴포넌트 목록
 * @returns {Promise<void>}
 */
export async function loadCommonComponents(components) {
    try {
        for (const component of components) {
            await loadComponent(
                component.name, 
                component.selector, 
                component.position || 'beforeend', 
                component.highPriority || false
            );
        }
    } catch (error) {
        console.error('공통 컴포넌트 로드 오류:', error);
    }
} 