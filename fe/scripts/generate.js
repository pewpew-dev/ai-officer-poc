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
const htmlContent = document.getElementById('html-content');
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
            model: selectedModel.name,
            max_tokens: 100000 // 기본 max_tokens 값 설정
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
 * 배포 함수
 */
async function deployWebsite() {
    try {
        // 확인 대화상자
        const confirmed = await confirmDialog(
            '웹사이트 배포', 
            '생성된 코드로 웹사이트를 배포하시겠습니까? 이미지 플레이스홀더는 저장된 이미지 URL로 대체됩니다.'
        );
        
        if (!confirmed) return;
        
        // 로딩 표시
        showLoading('웹사이트 배포 중...');
        
        // HTML 코드에서 이미지 플레이스홀더를 실제 URL로 변환
        let processedHtmlCode = generatedHtmlCode;
        
        // 각 이미지에 대해 저장된 URL로 대체
        for (const image of generatedImages) {
            try {
                console.log(`이미지 ${image.key} 처리 중...`);
                showLoading(`이미지 "${image.key}" 처리 중...`);
                
                if (image.url) {
                    console.log(`이미지 ${image.key}를 URL로 대체: ${image.url}`);
                    
                    // 이스케이프 처리된 키 생성 (정규식 특수문자 처리)
                    const escapedKey = image.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    
                    // HTML 코드에서 플레이스홀더 대체
                    // img 태그의 src 속성 대체
                    const srcRegex = new RegExp(`src=["']${escapedKey}["']`, 'g');
                    processedHtmlCode = processedHtmlCode.replace(srcRegex, `src="${image.url}"`);
                    
                    // CSS background-image URL 대체 (다양한 형태 처리)
                    // 1. url('KEY') - 작은따옴표
                    // 2. url("KEY") - 큰따옴표 
                    // 3. url(KEY) - 따옴표 없음
                    // 4. url( 'KEY' ) - 공백과 따옴표 조합
                    // 5. url( "KEY" ) - 공백과 따옴표 조합
                    // 6. url( KEY ) - 공백만 있는 경우
                    const bgRegex = new RegExp(`url\\(\\s*['"]?${escapedKey}['"]?\\s*\\)`, 'g');
                    processedHtmlCode = processedHtmlCode.replace(bgRegex, `url("${image.url}")`);
                    
                    // 인라인 스타일 내 background URL이 세미콜론 없이 끝나는 경우 처리
                    const inlineStyleRegex = new RegExp(`background(-image)?:\\s*url\\(\\s*['"]?${escapedKey}['"]?\\s*\\)`, 'g');
                    processedHtmlCode = processedHtmlCode.replace(inlineStyleRegex, `background$1: url("${image.url}")`);
                    
                    // 다른 속성에서도 키워드 대체가 필요한 경우를 위한 범용 패턴
                    // 예: content: url('KEY') 또는 list-style-image: url('KEY')
                    const otherUrlsRegex = new RegExp(`:\\s*url\\(\\s*['"]?${escapedKey}['"]?\\s*\\)`, 'g');
                    processedHtmlCode = processedHtmlCode.replace(otherUrlsRegex, `: url("${image.url}")`);
                } else {
                    console.warn(`이미지 ${image.key}의 URL이 없습니다. 플레이스홀더를 유지합니다.`);
                }
            } catch (error) {
                console.error(`이미지 ${image.key} 처리 오류:`, error);
                // 오류가 발생해도 계속 진행 (중요 오류가 아니므로)
                console.warn(`이미지 ${image.key} 처리 중 오류가 발생했습니다: ${error.message}`);
            }
        }
        
        // HTML 파일 업로드
        showLoading('웹사이트 HTML 코드 업로드 중...');
        console.log('HTML 코드 업로드 중...');
        
        const htmlUploadResponse = await callSecureApi(
            apiEndpoints.backend.storage, 
            'POST', 
            {
                content: processedHtmlCode,
                fileName: `website-${Date.now()}.html`,
                contentType: 'text/html'
            }
        );
        
        if (!htmlUploadResponse.success) {
            throw new Error(`HTML 파일 업로드 실패: ${htmlUploadResponse.error?.message || '알 수 없는 오류'}`);
        }
        
        // 배포 URL 가져오기
        const deployedUrl = htmlUploadResponse.data.url;
        
        // 결과 처리: 배포 정보 표시
        deployUrl.value = deployedUrl;
        visitSiteBtn.href = deployedUrl;
        
        // UI 업데이트
        deployInfo.classList.remove('hidden');
        deployEmptyState.classList.add('hidden');
        
        // 배포가 이미 완료되었으므로 다음 단계 안내 메시지 숨기기
        if (nextStepGuide) {
            nextStepGuide.classList.add('hidden');
        }
        
        // 로컬 스토리지에 배포 정보 저장
        localStorage.setItem('flowbang-deploy', JSON.stringify({
            url: deployedUrl,
            images: generatedImages.map(img => ({
                key: img.key,
                url: img.url
            })),
            html_file: htmlUploadResponse.data.fileName,
            timestamp: Date.now()
        }));
        
        showToast('웹사이트가 성공적으로 배포되었습니다!', 'success');
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
        
        // 이미지 불러오기 (배포 기능에 필요한 이미지 데이터 로드)
        const savedImages = localStorage.getItem(LOCAL_STORAGE_KEYS.image);
        if (savedImages) {
            const parsedImageData = JSON.parse(savedImages);
            
            if (parsedImageData.images && parsedImageData.images.length > 0) {
                generatedImages = parsedImageData.images;
                hasGeneratedContent = true;
                console.log('저장된 이미지 데이터를 불러왔습니다.');
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