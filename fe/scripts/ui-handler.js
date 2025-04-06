// ui-handlers.js
// UI 조작 및 이벤트 처리 함수

// 필요한 변수와 함수 import
import { apiEndpoints } from '../config.js';
import * as core from './core.js';
import * as auth from './auth.js';

// 단계 표시 함수
export function showStep(stepIndex) {
    // 단계 컨테이너 표시 설정
    core.stepContainers.forEach((container, index) => {
        if (index === stepIndex - 1) {
            container.style.display = 'block';
            
            // 현재 단계의 출력과 편집기 표시 설정
            if (index === 0) {
                // 아이디어 입력 단계 - 특별한 표시 설정 없음
            } else if (index === 1) {
                if (core.planningOutput) core.planningOutput.style.display = 'block';
                if (core.planningCopyBtn) core.planningCopyBtn.style.display = 'block';
            } else if (index === 2) {
                if (core.dallePromptOutput) core.dallePromptOutput.style.display = 'block';
                if (core.gpt4oPromptOutput) core.gpt4oPromptOutput.style.display = 'block';
                if (core.dallePromptCopyBtn) core.dallePromptCopyBtn.style.display = 'block';
                if (core.gpt4oPromptCopyBtn) core.gpt4oPromptCopyBtn.style.display = 'block';
            } else if (index === 3) {
                // 이미지 컨테이너 표시
            } else if (index === 4) {
                if (core.generatedCode) core.generatedCode.style.display = 'block';
                if (core.previewFrame) core.previewFrame.style.display = 'block';
                if (core.downloadBtn) core.downloadBtn.style.display = 'block';
            }
        } else {
            container.style.display = 'none';
        }
    });

    // 진행 단계 아이콘 활성화 상태 업데이트
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
        const circleElement = step.querySelector('div:first-child');
        const textElement = step.querySelector('span');
        
        // 모든 클래스 제거
        circleElement.classList.remove('bg-gray-300', 'bg-indigo-600', 'bg-green-500', 'bg-yellow-500');
        circleElement.classList.remove('text-gray-600', 'text-white');
        textElement.classList.remove('text-gray-500', 'text-indigo-600', 'text-green-500', 'text-yellow-500');
        
        // 데이터 존재 여부 확인
        const hasData = core.checkStepData(index + 1);
        
        if (index === stepIndex - 1) {
            // 현재 단계는 항상 파란색
            circleElement.classList.add('bg-indigo-600', 'text-white');
            textElement.classList.add('text-indigo-600');
        } else if (hasData) {
            // 데이터가 있는 단계는 녹색
            circleElement.classList.add('bg-green-500', 'text-white');
            textElement.classList.add('text-green-500');
        } else {
            // 데이터가 없는 단계는 회색
            circleElement.classList.add('bg-gray-300', 'text-gray-600');
            textElement.classList.add('text-gray-500');
        }
    });
    
    // 현재 단계에 따른 뒤로 가기 버튼 상태 설정
    if (core.backToIdeaBtn) core.backToIdeaBtn.style.display = stepIndex === 1 ? 'inline-block' : 'none';
    if (core.backToPlanningBtn) core.backToPlanningBtn.style.display = stepIndex === 2 ? 'inline-block' : 'none';
    if (core.backToPromptsBtn) core.backToPromptsBtn.style.display = stepIndex === 3 ? 'inline-block' : 'none';
    if (core.backToImagesBtn) core.backToImagesBtn.style.display = stepIndex === 4 ? 'inline-block' : 'none';
}

// 로딩 표시
export function showLoading(show) {
    if (core.loadingIndicator) {
        if (show) {
            core.loadingIndicator.classList.remove('hidden');
        } else {
            core.loadingIndicator.classList.add('hidden');
        }
    }
}

// 오류 모달 표시
export function showErrorModal(message) {
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
    if (core.errorModal) {
        core.errorModal.style.display = 'block';
    }
}

// 콘텐츠 복사
export function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('클립보드에 복사되었습니다.');
        })
        .catch(err => {
            console.error('클립보드 복사 오류:', err);
            showErrorModal('클립보드에 복사할 수 없습니다.');
        });
}

// 토스트 메시지 표시
export function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// DALL-E 프롬프트 문자 수 업데이트
export function updateDallePromptCharCount() {
    if (core.dallePromptCharCount && core.dallePromptEditor) {
        const count = core.dallePromptEditor.value.length;
        core.dallePromptCharCount.textContent = count;
        
        // 문자 수에 따른 색상 설정
        core.dallePromptCharCount.className = 'text-sm';
        if (count > 950) {
            core.dallePromptCharCount.classList.add('text-red-500');
        } else if (count > 850) {
            core.dallePromptCharCount.classList.add('text-yellow-500');
        } else {
            core.dallePromptCharCount.classList.add('text-green-500');
        }
    }
}

// 이미지 요소 업데이트
export function updateImageElements() {
    // 각 이미지 요소 참조
    const headerImg = document.getElementById('header-image');
    const heroImg = document.getElementById('hero-image');
    const content1Img = document.getElementById('content1-image');
    const content2Img = document.getElementById('content2-image');
    const content3Img = document.getElementById('content3-image');
    
    // 이미지 URL이 있으면 이미지 요소 업데이트
    if (headerImg && core.imageUrls.header.url) {
        headerImg.src = core.imageUrls.header.url;
        headerImg.style.display = 'block';
    }
    
    if (heroImg && core.imageUrls.hero.url) {
        heroImg.src = core.imageUrls.hero.url;
        heroImg.style.display = 'block';
    }
    
    if (content1Img && core.imageUrls.content1.url) {
        content1Img.src = core.imageUrls.content1.url;
        content1Img.style.display = 'block';
    }
    
    if (content2Img && core.imageUrls.content2.url) {
        content2Img.src = core.imageUrls.content2.url;
        content2Img.style.display = 'block';
    }
    
    if (content3Img && core.imageUrls.content3.url) {
        content3Img.src = core.imageUrls.content3.url;
        content3Img.style.display = 'block';
    }
}

// HTML 미리보기 업데이트
export function updatePreview(htmlCode) {
    if (core.previewFrame) {
        const iframe = core.previewFrame;
        iframe.srcdoc = htmlCode;
    }
}

// HTML 파일 다운로드
export function downloadHtmlFile() {
    // 로컬 스토리지에서 생성된 HTML 코드 로드
    const htmlCode = core.stepsMemory.step5;
    if (!htmlCode) {
        showErrorModal('다운로드할 HTML 코드가 없습니다.');
        return;
    }
    
    // core.js의 downloadCode 함수 활용
    core.downloadCode(htmlCode, 'generated_website.html');
}

// 클라우드에 배포
export async function deployToCloud() {
    try {
        // 로컬 스토리지에서 생성된 HTML 코드 로드
        const htmlCode = core.stepsMemory.step5;
        if (!htmlCode) {
            showErrorModal('배포할 HTML 코드가 없습니다.');
            return;
        }
        
        // 로딩 상태 표시
        showLoading(true);
        
        // Firebase Storage에 업로드할 파일 이름 생성
        const fileName = `${core.siteId}/index.html`;
        
        // 이미지 URL 확인 및 업로드
        const newImageUrls = {};
        
        try {
            // 이미지 URL이 유효한 경우만 필터링
            const imageUploadPromises = Object.keys(core.imageUrls).filter(key => {
                return core.imageUrls[key] && 
                       typeof core.imageUrls[key] === 'object' && 
                       core.imageUrls[key].url && 
                       key !== '__proto__' && 
                       key !== 'constructor';
            }).map(async (key) => {
                try {
                    // 이미지 파일명 생성 (폴더 경로 포함)
                    const fileName = `${core.siteId}/image_${key}_${Date.now()}.png`;
                    
                    // 백엔드 API를 통해 이미지 URL 업로드
                    const uploadResponse = await fetch(`${apiEndpoints.backend.base}/api/storage/upload-from-url`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('idToken')}`
                        },
                        body: JSON.stringify({
                            imageUrl: core.imageUrls[key].url,
                            fileName,
                            contentType: 'image/png'
                        })
                    });
                    
                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        console.error(`이미지 업로드 실패:`, errorData);
                        throw new Error(`이미지 업로드 실패 (${key}): ${errorData.error?.message || uploadResponse.status}`);
                    }
                    
                    const uploadResult = await uploadResponse.json();
                    if (uploadResult.success && uploadResult.data) {
                        newImageUrls[key] = uploadResult.data.url;
                    } else {
                        throw new Error(`이미지 업로드 응답 형식 오류 (${key})`);
                    }
                } catch (error) {
                    console.error(`이미지 ${key} 처리 실패:`, error);
                    throw error; // 상위 catch 블록으로 오류 전파
                }
            });
            
            // 모든 이미지 업로드 완료 대기
            await Promise.all(imageUploadPromises);
            
            // 업로드된 이미지 URL로 HTML 코드 내 URL 교체
            let updatedHtmlCode = htmlCode;
            Object.keys(newImageUrls).forEach(key => {
                // 각 이미지 URL을 원본에서 GCS URL로 교체
                const originalUrl = core.imageUrls[key].url;
                const newUrl = newImageUrls[key];
                
                if (originalUrl && newUrl) {
                    // 이미지 URL을 모두 교체 (URL 인코딩 여부 고려)
                    updatedHtmlCode = updatedHtmlCode.replace(new RegExp(escapeRegExp(originalUrl), 'g'), newUrl);
                    updatedHtmlCode = updatedHtmlCode.replace(new RegExp(escapeRegExp(encodeURIComponent(originalUrl)), 'g'), encodeURIComponent(newUrl));
                }
            });
            
            // HTML 파일 업로드
            const htmlUploadResponse = await fetch(`${apiEndpoints.backend.base}/api/storage/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('idToken')}`
                },
                body: JSON.stringify({
                    content: updatedHtmlCode,
                    fileName,
                    contentType: 'text/html'
                })
            });
            
            if (!htmlUploadResponse.ok) {
                const errorData = await htmlUploadResponse.json();
                throw new Error(`HTML 업로드 실패: ${errorData.error?.message || htmlUploadResponse.status}`);
            }
            
            const htmlUploadResult = await htmlUploadResponse.json();
            if (htmlUploadResult.success && htmlUploadResult.data && htmlUploadResult.data.url) {
                // 업로드 성공 시 결과 URL 표시
                showLoading(false);
                
                // 결과 URL을 모달 또는 새 탭으로 표시
                const deployUrl = htmlUploadResult.data.url;
                
                // 새 창으로 배포된 사이트 열기
                window.open(deployUrl, '_blank');
                
                // 사용자에게 배포 성공 알림
                showToast('웹사이트가 성공적으로 배포되었습니다!');
                
                // 콘솔에 배포 URL 로깅
                console.log('배포 URL:', deployUrl);
            } else {
                throw new Error('HTML 업로드 응답 형식 오류');
            }
        } catch (error) {
            console.error('배포 오류:', error);
            showErrorModal(`웹사이트 배포 중 오류가 발생했습니다: ${error.message}`);
            showLoading(false);
        }
    } catch (error) {
        console.error('배포 오류:', error);
        showErrorModal(`웹사이트 배포 중 오류가 발생했습니다: ${error.message}`);
        showLoading(false);
    }
}

// 정규식 특수문자 이스케이프 함수
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 성공 모달 표시
export function showSuccessModal(message) {
    const modal = document.getElementById('success-modal');
    const modalMessage = document.getElementById('success-modal-message');
    
    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
        
        // 3초 후 모달 자동 닫기
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 3000);
    } else {
        // 모달 엘리먼트가 없으면 대신 토스트 메시지 표시
        showToast(message);
    }
}