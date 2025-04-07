import { LOCAL_STORAGE_KEYS } from '../configs/config.js';
import { showToast, confirmDialog } from './common.js';

// DOM 요소
let modal = null;
let modalContent = null;
let modalTitle = null;
let closeModalBtn = null;
let modalEditContent = null;
let editTextarea = null;
let saveEditBtn = null;
const clearAllBtn = document.getElementById('clear-all-btn');

// 모든 버튼 가져오기
const viewButtons = document.querySelectorAll('.view-btn');
const editButtons = document.querySelectorAll('.edit-btn');
const deleteButtons = document.querySelectorAll('.delete-btn');

// 현재 편집 중인 키
let currentKey = null;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', async () => {
    console.log('스토리지 페이지 초기화 시작');
    
    // 컴포넌트 로드 완료 이벤트 리스너 추가
    window.addEventListener('componentLoaded', (e) => {
        if (e.detail.name === 'modal') {
            console.log('모달 컴포넌트 로드 완료 이벤트 감지');
            // 모달 요소 참조 업데이트
            updateModalReferences();
        }
    });
    
    // 초기에 한 번 모달 요소 참조 시도
    updateModalReferences();
    
    // 초기 상태 업데이트
    updateStorageStatus();
    
    // 새로고침 버튼
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
        updateStorageStatus();
        showToast('스토리지 정보가 새로고침되었습니다.', 'info');
    });
    
    // 전체 삭제 버튼
    clearAllBtn?.addEventListener('click', async () => {
        await clearAllStorage();
    });
    
    // 모든 보기 버튼에 이벤트 리스너 추가
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const key = button.dataset.key;
            const keyName = button.dataset.keyName;
            viewContent(key, keyName);
        });
    });
    
    // 모든 수정 버튼에 이벤트 리스너 추가
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const key = button.dataset.key;
            const keyName = button.dataset.keyName;
            editContent(key, keyName);
        });
    });
    
    // 모든 삭제 버튼에 이벤트 리스너 추가
    deleteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const key = button.dataset.key;
            const keyName = button.dataset.keyName;
            await deleteContent(key, keyName);
        });
    });
    
    console.log('스토리지 페이지 초기화 완료');
});

// 모달 요소 참조 업데이트 함수
function updateModalReferences() {
    modal = document.getElementById('modal');
    modalContent = document.getElementById('modal-content');
    modalTitle = document.getElementById('modal-title');
    closeModalBtn = document.getElementById('close-modal');
    modalEditContent = document.getElementById('modal-edit-content');
    editTextarea = document.getElementById('edit-textarea');
    saveEditBtn = document.getElementById('save-edit-btn');
    
    // 저장 버튼 이벤트 추가
    if (saveEditBtn) {
        console.log('저장 버튼 이벤트 리스너 추가');
        
        // 이전 이벤트 리스너 제거 (중복 방지)
        saveEditBtn.removeEventListener('click', saveEditedContent);
        
        // 새 이벤트 리스너 추가
        saveEditBtn.addEventListener('click', saveEditedContent);
    } else {
        console.warn('저장 버튼 요소를 찾을 수 없습니다.');
    }
}

// localStorage 데이터의 상태 정보를 표시하는 함수
function updateStorageStatus() {
    try {
        console.log('스토리지 상태 업데이트 중...');
        
        // 각 키에 대한 상태 정보 업데이트
        Object.entries(LOCAL_STORAGE_KEYS).forEach(([name, key]) => {
            // 상태를 표시할 요소 확인 또는 생성
            let statusElement = document.getElementById(`${key}-status`);
            if (!statusElement) {
                console.log(`'${key}-status' 요소가 없어 찾지 못했습니다. key=${key}, name=${name}`);
                // key를 사용하는 다른 방법 시도
                const elements = document.querySelectorAll(`[data-key="${key}"]`);
                if (elements.length > 0) {
                    // 첫 번째 요소의 부모 div 찾기 (키 영역)
                    const keyArea = elements[0].closest('.border.rounded-lg');
                    if (keyArea) {
                        // 상태 표시 요소가 있는지 확인
                        statusElement = keyArea.querySelector('[id$="-status"]');
                        if (!statusElement) {
                            console.log(`${key} 관련 상태 요소를 찾지 못해 새로 생성합니다.`);
                        }
                    }
                }
            }
            
            // 상태 요소가 없으면 건너뜀
            if (!statusElement) {
                console.log(`${key} 키에 대한 상태 요소를 찾지 못해 건너뜁니다.`);
                return;
            }

            const data = localStorage.getItem(key);
            if (!data) {
                statusElement.innerHTML = '<span class="text-red-500">저장된 데이터 없음</span>';
                return;
            }

            try {
                const parsedData = JSON.parse(data);
                let statusHtml = '';
                
                if (typeof parsedData === 'object') {
                    // 업데이트 날짜 표시
                    const updatedAt = parsedData.updatedAt 
                        ? new Date(parsedData.updatedAt).toLocaleString('ko-KR') 
                        : '알 수 없음';
                    
                    // 아이디어 키인 경우 내용 일부 표시
                    if (key === LOCAL_STORAGE_KEYS.idea && parsedData.content) {
                        const preview = parsedData.content.substring(0, 15) + 
                                      (parsedData.content.length > 15 ? '...' : '');
                        statusHtml = `<span class="text-green-500">저장됨</span> <span class="text-gray-500 text-xs">(${updatedAt})</span>`;
                        statusHtml += `<div class="text-xs text-gray-500 mt-1 italic">"${preview}"</div>`;
                    }
                    // 기획안 키인 경우 어떤 데이터가 있는지 표시
                    else if (key === LOCAL_STORAGE_KEYS.planning) {
                        const hasPlanning = parsedData.planning && parsedData.planning.trim().length > 0; 
                        const hasDesign = parsedData.design && parsedData.design.trim().length > 0;
                        
                        let contentInfo = [];
                        if (hasPlanning) contentInfo.push('기획안');
                        if (hasDesign) contentInfo.push('디자인 요구사항');
                        
                        statusHtml = `<span class="text-green-500">저장됨</span> <span class="text-gray-500 text-xs">(${updatedAt})</span>`;
                        if (contentInfo.length > 0) {
                            statusHtml += `<div class="text-xs text-gray-500 mt-1">${contentInfo.join(', ')} 포함</div>`;
                        }
                    } 
                    // 이미지 데이터 처리
                    else if (key === LOCAL_STORAGE_KEYS.image) {
                        const generatedAt = parsedData.generated_at 
                            ? new Date(parsedData.generated_at).toLocaleString('ko-KR')
                            : updatedAt;
                            
                        const imageCount = parsedData.images && Array.isArray(parsedData.images) 
                            ? parsedData.images.length 
                            : 0;
                            
                        statusHtml = `<span class="text-green-500">저장됨</span> <span class="text-gray-500 text-xs">(${generatedAt})</span>`;
                        statusHtml += `<div class="text-xs text-gray-500 mt-1">이미지 ${imageCount}개 포함</div>`;
                    }
                    // 그 외 일반 객체
                    else {
                        statusHtml = `<span class="text-green-500">저장됨</span> <span class="text-gray-500 text-xs">(${updatedAt})</span>`;
                    }
                } else {
                    // 단순 데이터
                    statusHtml = `<span class="text-yellow-500">저장됨 (단순 데이터)</span>`;
                }
                
                statusElement.innerHTML = statusHtml;
            } catch (e) {
                console.error(`${key} 데이터 파싱 오류:`, e);
                statusElement.innerHTML = `<span class="text-yellow-500">저장됨 (단순 데이터)</span>`;
            }
        });
        
        console.log('스토리지 상태 업데이트 완료');
    } catch (error) {
        console.error('상태 업데이트 오류:', error);
    }
}

// 마크다운을 HTML로 변환하는 간단한 함수
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // 마크다운 컨텐츠를 위한 래퍼 추가
    let htmlContent = '<div class="markdown-content">';
    
    // 기본 마크다운 변환
    htmlContent += markdown
        // 헤더 변환
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        // 리스트 변환
        .replace(/^\s*\- (.*$)/gm, '<li>$1</li>')
        // 볼드체 변환
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 이탤릭체 변환
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // 코드 블록 변환
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // 인라인 코드 변환
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 줄바꿈 변환
        .replace(/\n/g, '<br>');
    
    // 래퍼 닫기
    htmlContent += '</div>';
    
    return htmlContent;
}

// 내용 보기
function viewContent(key, keyName) {
    try {
        console.log(`viewContent 호출됨: 키 "${key}" 데이터 조회 중...`);
        
        // window.openModal 함수가 있는지 확인
        if (typeof window.openModal !== 'function') {
            console.error('모달 열기 함수가 정의되지 않았습니다. 모달이 로드되지 않았을 수 있습니다.');
            showToast('데이터를 표시할 수 없습니다. 페이지를 새로고침해 주세요.', 'error');
            return;
        }
        
        const data = localStorage.getItem(key);
        if (!data) {
            console.log(`  > 키 "${key}"에 저장된 데이터가 없습니다.`);
            showToast('저장된 데이터가 없습니다.', 'warning');
            return;
        }

        console.log(`  > 키 "${key}"에서 데이터를 찾았습니다. 내용 분석 중...`);
        let parsedData;
        try {
            parsedData = JSON.parse(data);
            console.log(`  > 데이터 파싱 성공: ${typeof parsedData} 타입`);
        } catch (parseError) {
            console.error(`  > 데이터 파싱 실패:`, parseError);
            parsedData = data; // 파싱 실패 시 원시 문자열로 취급
        }

        let content = '';
        let isMarkdown = false;
        let updatedAt = null;

        // 데이터 타입에 따른 표시
        if (typeof parsedData === 'object') {
            if (Array.isArray(parsedData)) {
                console.log(`  > 배열 데이터 처리`);
                content = parsedData.map(item => JSON.stringify(item, null, 2)).join('\n\n');
            } else {
                // 키별 특별 처리
                if (key === LOCAL_STORAGE_KEYS.idea) {
                    console.log(`  > 아이디어 데이터 특별 처리`);
                    // content 필드 확인
                    if (parsedData.content) {
                        content = parsedData.content;
                        console.log(`  > content 필드 사용: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`);
                    } else {
                        // content 필드가 없으면 전체 객체를 문자열로 표시
                        content = JSON.stringify(parsedData, null, 2);
                        console.log(`  > content 필드 없음, 전체 객체 사용`);
                    }
                    updatedAt = parsedData.updatedAt;
                }
                // planning 데이터 특별 처리
                else if (key === LOCAL_STORAGE_KEYS.planning) {
                    console.log(`  > 기획안 데이터 특별 처리`);
                    if (parsedData.planning) {
                        content = parsedData.planning;
                        isMarkdown = true;
                        console.log(`  > planning 필드 사용 (마크다운 처리)`);
                        
                        // 디자인 요구사항이 있다면 함께 표시
                        if (parsedData.design && parsedData.design.trim().length > 0) {
                            content = `${content}\n\n${parsedData.design}`;
                            console.log(`  > 디자인 요구사항 추가`);
                        }
                    } else {
                        content = JSON.stringify(parsedData, null, 2);
                        console.log(`  > planning 필드 없음, 전체 객체 사용`);
                    }
                    updatedAt = parsedData.updatedAt;
                }
                // 이미지 데이터 특별 처리
                else if (key === LOCAL_STORAGE_KEYS.image) {
                    console.log(`  > 이미지 데이터 특별 처리`);
                    // 이미지 미리보기 HTML 생성
                    if (parsedData.images && Array.isArray(parsedData.images) && parsedData.images.length > 0) {
                        // 이미지 타임스탬프
                        updatedAt = parsedData.generated_at || parsedData.updatedAt;
                        
                        // 이미지 프리뷰 HTML 생성
                        const imgCount = parsedData.images.length;
                        content = `<div class="image-preview-container">
                            <h3 class="text-lg font-medium mb-2">이미지 ${imgCount}개</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
                            
                        // 각 이미지 추가
                        parsedData.images.forEach(img => {
                            content += `
                                <div class="border rounded-lg overflow-hidden shadow-sm">
                                    <div class="p-2 bg-gray-100 border-b"><strong>${img.key || 'IMAGE'}</strong></div>
                                    <img src="${img.url}" alt="${img.key}" class="w-full h-48 object-cover">
                                    <div class="p-3">
                                        <p class="text-sm text-gray-700">${img.desc ? (img.desc.length > 100 ? img.desc.substring(0, 100) + '...' : img.desc) : '설명 없음'}</p>
                                        ${img.reference ? `<p class="text-xs text-gray-500 mt-1">출처: ${img.reference}</p>` : ''}
                                    </div>
                                </div>`;
                        });
                        
                        content += `</div></div>`;
                        isMarkdown = false; // HTML 직접 사용
                    } else {
                        content = JSON.stringify(parsedData, null, 2);
                        console.log(`  > 이미지 필드 없음, 전체 객체 사용`);
                    }
                }
                // 다른 객체 데이터는 JSON으로 표시
                else {
                    console.log(`  > 일반 객체 데이터 처리`);
                    content = JSON.stringify(parsedData, null, 2);
                    
                    // updatedAt 필드가 있다면 추출
                    if (parsedData.updatedAt) {
                        updatedAt = parsedData.updatedAt;
                    }
                }
            }
        } else {
            // 원시 타입 데이터 (문자열, 숫자 등)
            console.log(`  > 원시 타입 데이터 처리: ${typeof parsedData}`);
            content = String(parsedData);
        }

        // 업데이트 날짜 표시
        let title = keyName ? `${keyName.charAt(0).toUpperCase() + keyName.slice(1)} 데이터` : key;
        if (updatedAt) {
            const date = new Date(updatedAt);
            title += ` (${date.toLocaleString('ko-KR')})`;
        }

        // 마크다운 형식이면 HTML로 변환
        if (isMarkdown) {
            content = markdownToHtml(content);
        } else {
            // 일반 텍스트는 HTML 태그를 이스케이프 처리하고 줄바꿈 유지
            content = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/\n/g, '<br>');
        }

        // 공통 모달 컴포넌트 활용
        window.openModal(title, content);
        currentKey = key;
    } catch (error) {
        console.error('내용 보기 오류:', error);
        showToast('데이터 로드 중 오류가 발생했습니다.', 'error');
    }
}

// 내용 편집
function editContent(key, keyName) {
    try {
        console.log(`editContent 호출됨: 키 "${key}" 데이터 편집 준비 중...`);
        
        // 모달 요소 참조 업데이트 (호출 시점에)
        modal = document.getElementById('modal');
        modalContent = document.getElementById('modal-content');
        modalTitle = document.getElementById('modal-title');
        modalEditContent = document.getElementById('modal-edit-content');
        editTextarea = document.getElementById('edit-textarea');
        saveEditBtn = document.getElementById('save-edit-btn');
        
        // saveEditBtn이 없는 경우 오류 방지
        if (!saveEditBtn) {
            console.error('저장 버튼 요소를 찾을 수 없습니다. 모달이 로드되지 않았을 수 있습니다.');
            showToast('편집 기능을 사용할 수 없습니다. 페이지를 새로고침해 주세요.', 'error');
            return;
        }
        
        const data = localStorage.getItem(key);
        if (!data) {
            console.log(`  > 키 "${key}"에 저장된 데이터가 없습니다.`);
            showToast('편집할 데이터가 없습니다.', 'warning');
            return;
        }

        let content = '';
        let parsedData;
        
        try {
            parsedData = JSON.parse(data);
            console.log(`  > 데이터 파싱 성공: ${typeof parsedData} 타입`);
            
            // JSON 객체를 문자열로 변환하여 편집
            content = JSON.stringify(parsedData, null, 2);
            
            // 아이디어 데이터의 경우 content 필드만 가져오기
            if (key === LOCAL_STORAGE_KEYS.idea && parsedData.content) {
                content = parsedData.content;
            }
            // 기획안 데이터 특별 처리
            else if (key === LOCAL_STORAGE_KEYS.planning) {
                if (parsedData.planning && parsedData.design) {
                    // 기획안과 디자인 요구사항이 모두 존재하는 경우 특수 구분자로 구분
                    content = `## 웹사이트 기획서\n\n${parsedData.planning}\n\n## 디자인 요구사항\n\n${parsedData.design}`;
                } else if (parsedData.planning) {
                    content = parsedData.planning;
                } else if (parsedData.design) {
                    content = parsedData.design;
                }
            }
            // 이미지 데이터 편집 준비
            else if (key === LOCAL_STORAGE_KEYS.image) {
                // 이미지 데이터는 JSON 형태 그대로 편집 (고급 사용자용)
                if (parsedData.images) {
                    // JSON 보기 좋게 정렬
                    content = JSON.stringify(parsedData, null, 2);
                }
            }
        } catch (parseError) {
            console.error(`  > 데이터 파싱 실패:`, parseError);
            content = data; // 파싱 실패 시 원시 문자열로 취급
        }

        let title = keyName ? `${keyName.charAt(0).toUpperCase() + keyName.slice(1)} 편집` : `${key} 편집`;
        
        // 공통 모달 컴포넌트 활용 (편집 모드)
        window.openModal(title, content, true);
        currentKey = key;
        
        // 저장 버튼 이벤트를 위한 데이터 설정
        saveEditBtn.dataset.key = key;
        saveEditBtn.dataset.keyName = keyName || '';
        
    } catch (error) {
        console.error('편집 오류:', error);
        showToast('데이터 로드 중 오류가 발생했습니다.', 'error');
    }
}

// 편집한 내용 저장
function saveEditedContent() {
    try {
        // 모달 요소 참조 업데이트 (호출 시점에)
        editTextarea = document.getElementById('edit-textarea');
        
        if (!editTextarea) {
            console.error('편집 영역 요소를 찾을 수 없습니다.');
            showToast('편집 내용을 저장할 수 없습니다. 페이지를 새로고침해 주세요.', 'error');
            return;
        }
        
        if (!currentKey) {
            showToast('저장할 키가 지정되지 않았습니다.', 'error');
            return;
        }

        const content = editTextarea.value;
        
        if (currentKey === LOCAL_STORAGE_KEYS.idea) {
            // 아이디어 저장 로직
            const ideaData = {
                content: content,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(currentKey, JSON.stringify(ideaData));
        }
        else if (currentKey === LOCAL_STORAGE_KEYS.planning) {
            // 기획서 저장 로직 - 기획서와 디자인 요구사항 구분
            const planningMatch = content.match(/## 웹사이트 기획서\s*([\s\S]*?)(?=## 디자인 요구사항|$)/i);
            const designMatch = content.match(/## 디자인 요구사항\s*([\s\S]*)/i);
            
            const planningData = {
                planning: planningMatch ? planningMatch[1].trim() : '',
                design: designMatch ? designMatch[1].trim() : '',
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem(currentKey, JSON.stringify(planningData));
        }
        else if (currentKey === LOCAL_STORAGE_KEYS.image) {
            // 이미지 데이터 저장 로직 - JSON 검증
            try {
                const imageData = JSON.parse(content);
                // 기존 generated_at을 유지하거나 새로 생성
                if (!imageData.generated_at) {
                    imageData.generated_at = new Date().toISOString();
                }
                // 업데이트 시간 추가
                imageData.updatedAt = new Date().toISOString();
                localStorage.setItem(currentKey, JSON.stringify(imageData));
            } catch (e) {
                console.error('이미지 데이터 파싱 오류:', e);
                showToast('유효한 JSON 형식이 아닙니다. 이미지 데이터는 저장되지 않았습니다.', 'error');
                return;
            }
        }
        else {
            // 기타 키 저장 로직 - JSON 문자열 검증
            try {
                const jsonData = JSON.parse(content);
                localStorage.setItem(currentKey, JSON.stringify(jsonData));
            } catch (e) {
                // JSON이 아닌 경우 그대로 저장
                localStorage.setItem(currentKey, content);
            }
        }
        
        // 공통 모달 닫기
        window.closeModal();
        currentKey = null;
        
        // 상태 업데이트
        updateStorageStatus();
        showToast('데이터가 저장되었습니다.', 'success');
    } catch (error) {
        console.error('저장 오류:', error);
        showToast('데이터 저장 중 오류가 발생했습니다.', 'error');
    }
}

// 내용 삭제
async function deleteContent(key, keyName) {
    try {
        const confirmed = await confirmDialog(`정말로 ${keyName || key} 데이터를 삭제하시겠습니까?`);
        if (confirmed) {
            localStorage.removeItem(key);
            updateStorageStatus();
            showToast(`${keyName || key} 데이터가 삭제되었습니다.`, 'success');
        }
    } catch (error) {
        console.error('삭제 오류:', error);
        showToast('데이터 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 모든 스토리지 데이터 지우기
async function clearAllStorage() {
    try {
        const confirmed = await confirmDialog('모든 로컬 스토리지 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
        if (confirmed) {
            // 모든 스토리지 데이터 삭제 (auth 제외)
            Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
                if (key !== LOCAL_STORAGE_KEYS.auth) {
                    localStorage.removeItem(key);
                }
            });
            
            updateStorageStatus();
            showToast('모든 데이터가 삭제되었습니다.', 'success');
        }
    } catch (error) {
        console.error('전체 삭제 오류:', error);
        showToast('데이터 삭제 중 오류가 발생했습니다.', 'error');
    }
}