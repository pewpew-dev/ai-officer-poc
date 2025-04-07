import { LOCAL_STORAGE_KEYS, apiEndpoints } from '../configs/config.js';
import { 
    showToast, 
    showLoading, 
    hideLoading, 
    alertDialog, 
    confirmDialog,
    createModelSelector,
    callSecureApi,
    getSelectedModel
} from './common.js';
import { PROMPT_TEMPLATES } from '../configs/config.js';

// DOM 요소
const planningStatus = document.getElementById('planning-status');
const generateCodeBtn = document.getElementById('generate-code-btn');
const deployBtn = document.getElementById('deploy-btn');
const codePreview = document.getElementById('code-preview');
const htmlTab = document.getElementById('html-tab');
const imagesTab = document.getElementById('images-tab');
const htmlContent = document.getElementById('html-content');
const imagesContent = document.getElementById('images-content');
const imagesContainer = document.getElementById('images-container');
const copyHtmlBtn = document.getElementById('copy-html-btn');
const deployInfo = document.getElementById('deploy-info');
const deployEmptyState = document.getElementById('deploy-empty-state');
const deployUrl = document.getElementById('deploy-url');
const copyUrlBtn = document.getElementById('copy-url-btn');
const visitSiteBtn = document.getElementById('visit-site-btn');
const nextStepGuide = document.getElementById('next-step-guide');
const deployGuideBtn = document.getElementById('deploy-guide-btn');
const referenceWebsiteUrl = document.getElementById('reference-website-url');

// 모델 선택기 인스턴스
let codeModelSelector;

// 생성된 코드와 이미지 데이터
let generatedHtmlCode = '';
let generatedImages = [];

/**
 * 기획서 상태 확인 및 표시
 */
function checkPlanningStatus() {
    try {
        const savedPlanningData = localStorage.getItem(LOCAL_STORAGE_KEYS.planning);
        let hasPlanningData = false;
        
        if (savedPlanningData) {
            const parsed = JSON.parse(savedPlanningData);
            if (parsed.planning && parsed.design) {
                hasPlanningData = true;
            }
        }
        
        if (hasPlanningData) {
            // 기획서가 있는 경우, 안내 메시지 숨기기
            planningStatus.classList.add('hidden');
            generateCodeBtn.disabled = false;
        } else {
            // 기획서가 없는 경우, 안내 메시지 표시
            planningStatus.classList.remove('hidden');
            generateCodeBtn.disabled = true;
        }
    } catch (error) {
        console.error('기획서 상태 확인 오류:', error);
        // 오류 발생 시 안내 메시지 표시
        planningStatus.classList.remove('hidden');
        generateCodeBtn.disabled = true;
    }
}

/**
 * 코드 생성 함수
 */
async function generateCode() {
    try {
        // 기획서와 디자인 요구사항 확인
        const savedPlanningData = localStorage.getItem(LOCAL_STORAGE_KEYS.planning);
        if (!savedPlanningData) {
            alertDialog('기획서 필요', '먼저 아이디어 페이지에서 웹사이트 기획서를 작성해주세요.');
            return;
        }
        
        // 저장된 데이터 파싱
        const planningData = JSON.parse(savedPlanningData);
        if (!planningData.planning || !planningData.design) {
            alertDialog('기획서 필요', '기획서와 디자인 요구사항이 모두 필요합니다.');
            return;
        }
        
        // 로딩 표시
        showLoading('코드 생성 중...');
        
        // 선택된 모델 정보 가져오기
        const selectedModel = getSelectedModel('code-model');
        if (!selectedModel) {
            hideLoading();
            alertDialog('모델 오류', '모델을 선택해주세요.');
            return;
        }
        
        // 참고 웹사이트 URL 가져오기
        const referenceUrl = referenceWebsiteUrl.value.trim();
        
        // 생성 API 호출
        let generatorPrompt = PROMPT_TEMPLATES.generator_ai.user_prompt_template
            .replace('{planning_doc}', planningData.planning)
            .replace('{design_requirements}', planningData.design);
            
        // 참고 웹사이트 URL이 있는 경우 추가
        generatorPrompt = generatorPrompt.replace('{reference_website}', referenceUrl || '참고 사이트 없음');
        
        // 프로바이더에 따른 API 엔드포인트 선택
        let apiEndpoint;
        let requestData = {
            type: "text",
            model: selectedModel.name
        };
        
        switch (selectedModel.provider) {
            case 'openai':
                apiEndpoint = apiEndpoints.backend.openai;
                requestData.messages = [
                    {
                        role: "system",
                        content: PROMPT_TEMPLATES.generator_ai.system_prompt
                    },
                    {
                        role: "user",
                        content: generatorPrompt
                    }
                ];
                break;
            case 'google':
                apiEndpoint = apiEndpoints.backend.google;
                // Google API 요청 형식 업데이트: system_prompt와 user_prompt 함께 전달
                requestData.contents = [
                    PROMPT_TEMPLATES.generator_ai.system_prompt + "\n\n" + generatorPrompt
                ];
                break;
            case 'anthropic':
                apiEndpoint = apiEndpoints.backend.anthropic;
                // Anthropic API 요청 형식 업데이트: system 필드 별도 사용
                requestData.system = PROMPT_TEMPLATES.generator_ai.system_prompt;
                requestData.messages = [
                    {
                        role: "user",
                        content: generatorPrompt
                    }
                ];
                requestData.max_tokens = 4096;
                requestData.temperature = 0.7;
                break;
            default:
                throw new Error('지원되지 않는 모델 제공자입니다.');
        }
        
        const response = await callSecureApi(apiEndpoint, 'POST', requestData);
        
        // 결과 처리
        if (response && response.success) {
            try {
                let result;
                
                // data.content가 JSON 문자열로 온 경우 처리
                if (response.data && response.data.content && typeof response.data.content === 'string') {
                    try {
                        // content에서 JSON 문자열 추출 (```json과 ``` 태그 제거)
                        const jsonContent = response.data.content.replace(/^```json\n|\n```$/g, '');
                        result = JSON.parse(jsonContent);
                        console.log('응답 데이터 파싱 성공 (data.content):', result);
                    } catch (contentParseError) {
                        console.error('content 파싱 오류:', contentParseError);
                        throw new Error('응답 content 형식이 올바르지 않습니다.');
                    }
                } else {
                    // 기존 처리 방식 유지
                    result = typeof response.data === 'string' 
                        ? JSON.parse(response.data) 
                        : response.data;
                    console.log('응답 데이터 파싱 성공 (기존 방식):', result);
                }
                
                if (result.html_code && result.images) {
                    generatedHtmlCode = result.html_code;
                    generatedImages = result.images;
                    
                    // 코드 표시
                    codePreview.textContent = generatedHtmlCode;
                    
                    // 이미지 표시
                    renderImages(generatedImages);
                    
                    // 별도의 로컬 스토리지에 코드와 이미지 저장
                    localStorage.setItem(LOCAL_STORAGE_KEYS.code, JSON.stringify({
                        html_code: result.html_code,
                        reference_website: referenceWebsiteUrl.value.trim(),
                        generated_at: new Date().toISOString()
                    }));
                    
                    // 이미지 별도 저장
                    localStorage.setItem(LOCAL_STORAGE_KEYS.image, JSON.stringify({
                        images: result.images,
                        generated_at: new Date().toISOString()
                    }));
                    
                    // 배포 버튼 활성화
                    deployBtn.disabled = false;
                    
                    // 다음 단계 안내 표시
                    showNextStepGuide();
                    
                    showToast('코드 생성 완료!', 'success');
                } else {
                    throw new Error('응답 형식이 올바르지 않습니다: html_code 또는 images 속성이 없습니다.');
                }
            } catch (parseError) {
                console.error('응답 파싱 오류:', parseError);
                showToast(parseError.message || '응답 형식이 올바르지 않습니다.', 'error');
            }
        } else {
            throw new Error(response?.message || '코드 생성에 실패했습니다.');
        }
    } catch (error) {
        console.error('코드 생성 오류:', error);
        showToast(error.message || '코드 생성에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 이미지 목록 렌더링
 */
function renderImages(images) {
    if (!images || images.length === 0) {
        imagesContainer.innerHTML = `
            <div class="p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
                <i class="fas fa-images text-4xl mb-2"></i>
                <p>아직 생성된 이미지가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    imagesContainer.innerHTML = '';
    
    images.forEach(image => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        imageItem.innerHTML = `
            <img src="${image.url}" alt="${image.desc}" class="image-preview">
            <div class="image-info">
                <div class="image-key">${image.key}</div>
                <p class="image-desc">${image.desc.length > 100 ? image.desc.substring(0, 100) + '...' : image.desc}</p>
                <div class="flex justify-between mt-3">
                    <button class="text-blue-600 text-sm hover:underline view-desc-btn">
                        <i class="fas fa-info-circle mr-1"></i> 설명 보기
                    </button>
                    <button class="text-green-600 text-sm hover:underline change-img-btn">
                        <i class="fas fa-exchange-alt mr-1"></i> 이미지 변경
                    </button>
                </div>
            </div>
        `;
        
        // 설명 보기 버튼 이벤트
        const viewDescBtn = imageItem.querySelector('.view-desc-btn');
        viewDescBtn.addEventListener('click', () => {
            alertDialog('이미지 설명', image.desc);
        });
        
        // 이미지 변경 버튼 이벤트 (나중에 구현)
        const changeImgBtn = imageItem.querySelector('.change-img-btn');
        changeImgBtn.addEventListener('click', () => {
            alertDialog('준비 중', '이미지 변경 기능은 준비 중입니다.');
        });
        
        imagesContainer.appendChild(imageItem);
    });
}

/**
 * 배포 함수
 */
async function deployWebsite() {
    try {
        // 확인 대화상자
        const confirmed = await confirmDialog(
            '웹사이트 배포', 
            '생성된 코드로 웹사이트를 배포하시겠습니까?'
        );
        
        if (!confirmed) return;
        
        // 로딩 표시
        showLoading('웹사이트 배포 중...');
        
        // 배포 API 호출 (실제로는 구현 필요)
        // const response = await callSecureApi('/api/deploy', 'POST', {
        //     code: generatedHtmlCode,
        //     images: generatedImages
        // });
        
        // 테스트용 임시 응답
        const response = {
            success: true,
            data: {
                url: 'https://example.com/your-website-' + Date.now()
            }
        };
        
        // 결과 처리
        if (response && response.success) {
            // 배포 정보 표시
            deployUrl.value = response.data.url;
            visitSiteBtn.href = response.data.url;
            
            // UI 업데이트
            deployInfo.classList.remove('hidden');
            deployEmptyState.classList.add('hidden');
            
            // 배포가 이미 완료되었으므로 다음 단계 안내 메시지 숨기기
            if (nextStepGuide) {
                nextStepGuide.classList.add('hidden');
            }
            
            // 로컬 스토리지에 배포 정보 저장
            localStorage.setItem('flowbang-deploy', JSON.stringify({
                url: response.data.url,
                timestamp: Date.now()
            }));
            
            showToast('웹사이트가 성공적으로 배포되었습니다!', 'success');
        } else {
            throw new Error(response?.message || '배포에 실패했습니다.');
        }
    } catch (error) {
        console.error('배포 오류:', error);
        showToast(error.message || '배포에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 텍스트 복사 함수
 */
function copyText(text, button) {
    navigator.clipboard.writeText(text)
        .then(() => {
            // 버튼에 복사 완료 표시
            button.classList.add('copied');
            
            // 잠시 후 원래 상태로 복귀
            setTimeout(() => {
                button.classList.remove('copied');
            }, 1000);
            
            showToast('클립보드에 복사되었습니다.', 'success');
        })
        .catch(err => {
            console.error('복사 실패:', err);
            showToast('복사에 실패했습니다.', 'error');
        });
}

/**
 * 저장된 코드 불러오기
 */
function loadSavedCode() {
    try {
        let hasGeneratedContent = false;
        
        // 코드 불러오기
        const savedCode = localStorage.getItem(LOCAL_STORAGE_KEYS.code);
        if (savedCode) {
            const parsedCodeData = JSON.parse(savedCode);
            
            if (parsedCodeData.html_code) {
                generatedHtmlCode = parsedCodeData.html_code;
                
                // 코드 표시
                codePreview.textContent = generatedHtmlCode;
                
                // 참고 웹사이트 URL 복원
                if (parsedCodeData.reference_website) {
                    referenceWebsiteUrl.value = parsedCodeData.reference_website;
                }
                
                hasGeneratedContent = true;
                console.log('저장된 코드를 불러왔습니다.');
            }
        }
        
        // 이미지 불러오기
        const savedImages = localStorage.getItem(LOCAL_STORAGE_KEYS.image);
        if (savedImages) {
            const parsedImageData = JSON.parse(savedImages);
            
            if (parsedImageData.images && parsedImageData.images.length > 0) {
                generatedImages = parsedImageData.images;
                
                // 이미지 표시
                renderImages(generatedImages);
                
                hasGeneratedContent = true;
                console.log('저장된 이미지를 불러왔습니다.');
            }
        }
        
        // 생성된 콘텐츠가 있으면 배포 버튼 활성화 및 안내 표시
        if (hasGeneratedContent) {
            deployBtn.disabled = false;
            showNextStepGuide();
        }
        
        // 배포 정보 불러오기
        const savedDeploy = localStorage.getItem('flowbang-deploy');
        if (savedDeploy) {
            const deployData = JSON.parse(savedDeploy);
            
            if (deployData.url) {
                deployUrl.value = deployData.url;
                visitSiteBtn.href = deployData.url;
                
                // UI 업데이트
                deployInfo.classList.remove('hidden');
                deployEmptyState.classList.add('hidden');
                
                // 배포가 이미 완료되었으므로 다음 단계 안내 메시지 숨기기
                if (nextStepGuide) {
                    nextStepGuide.classList.add('hidden');
                }
            }
        }
    } catch (error) {
        console.error('저장된 데이터 불러오기 오류:', error);
    }
}

/**
 * 탭 전환 함수
 */
function switchTab(tabName) {
    // 모든 탭 비활성화
    htmlTab.classList.remove('border-blue-600', 'text-blue-600');
    imagesTab.classList.remove('border-blue-600', 'text-blue-600');
    htmlTab.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
    imagesTab.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
    
    // 모든 컨텐츠 숨기기
    htmlContent.classList.add('hidden');
    imagesContent.classList.add('hidden');
    
    // 선택된 탭 활성화
    if (tabName === 'html') {
        htmlTab.classList.add('border-blue-600', 'text-blue-600');
        htmlTab.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
        htmlContent.classList.remove('hidden');
    } else if (tabName === 'images') {
        imagesTab.classList.add('border-blue-600', 'text-blue-600');
        imagesTab.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
        imagesContent.classList.remove('hidden');
    }
}

/**
 * 모델 선택기 초기화
 */
function setupModelSelectors() {
    codeModelSelector = createModelSelector(
        '#code-model-selector-container',
        'all',
        'text',
        'code-model',
        '',
        (provider, model) => {
            console.log(`코드 생성 모델 선택: ${provider} - ${model}`);
        }
    );
}

/**
 * 다음 단계 안내 표시 함수
 */
function showNextStepGuide() {
    if (nextStepGuide) {
        nextStepGuide.classList.remove('hidden');
    }
}

/**
 * 배포 섹션으로 스크롤 함수
 */
function scrollToDeploySection() {
    const deploySection = document.querySelector('.bg-white.rounded-lg.shadow-lg.p-6:last-child');
    if (deploySection) {
        deploySection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 코드 생성 버튼
    generateCodeBtn.addEventListener('click', generateCode);
    
    // 배포 버튼
    deployBtn.addEventListener('click', deployWebsite);
    
    // 다음 단계 안내 버튼
    if (deployGuideBtn) {
        deployGuideBtn.addEventListener('click', scrollToDeploySection);
    }
    
    // 탭 전환 버튼
    htmlTab.addEventListener('click', () => switchTab('html'));
    imagesTab.addEventListener('click', () => switchTab('images'));
    
    // 복사 버튼
    copyHtmlBtn.addEventListener('click', () => copyText(generatedHtmlCode, copyHtmlBtn));
    copyUrlBtn.addEventListener('click', () => copyText(deployUrl.value, copyUrlBtn));
}

/**
 * 페이지 초기화 함수
 */
function initPage() {
    console.log('코드 생성 페이지 초기화 시작');
    
    // 모델 선택기 설정
    setupModelSelectors();
    
    // 기획서 상태 확인
    checkPlanningStatus();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 저장된 코드 불러오기
    loadSavedCode();
    
    console.log('코드 생성 페이지 초기화 완료');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initPage); 