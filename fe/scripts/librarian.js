import { LOCAL_STORAGE_KEYS, apiEndpoints, PROMPT_TEMPLATES } from '../configs/config.js';
import { 
    showToast, 
    createModelSelector, 
    getSelectedModel, 
    callSecureApi, 
    showLoading, 
    hideLoading, 
    alertDialog,
    confirmDialog,
    uploadFile
} from './common.js';

// DOM 요소 참조
const imageDescription = document.getElementById('image-description');
const generateCount = document.getElementById('generate-count');
const searchCount = document.getElementById('search-count');
const generateImagesBtn = document.getElementById('generate-images-btn');
const searchImagesBtn = document.getElementById('search-images-btn');
const imageGrid = document.getElementById('image-grid');
const loadingImages = document.getElementById('loading-images');
const noImages = document.getElementById('no-images');
const pagination = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumbers = document.getElementById('page-numbers');
const sortFilter = document.getElementById('sort-filter');
const categoryFilter = document.getElementById('category-filter');
const searchLibrary = document.getElementById('search-library');
const addFirstImageBtn = document.getElementById('add-first-image-btn');

// 모달 요소
const viewImageModal = document.getElementById('view-image-modal');
const closeViewModalBtn = document.getElementById('close-view-modal-btn');
const fullsizeImage = document.getElementById('fullsize-image');
const fullsizeTitle = document.getElementById('fullsize-title');
const fullsizeInfo = document.getElementById('fullsize-info');

// 모델 선택기 인스턴스
let imageModelSelector;
let textModelSelector;

// 상태 변수
let libraryImages = [];
let currentPage = 1;
let itemsPerPage = 15;
let totalPages = 1;
let currentSort = 'newest';
let currentCategory = 'all';
let currentSearch = '';

// 페이지 초기화
document.addEventListener('DOMContentLoaded', async () => {
    console.log('이미지 라이브러리 페이지 초기화 시작');

    // 모델 선택기 초기화
    setupModelSelectors();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 라이브러리 이미지 로드
    loadLibraryImages();
    
    // 임시 저장된 이미지 설명 불러오기
    loadSavedImageDescription();
    
    console.log('이미지 라이브러리 페이지 초기화 완료');
});

/**
 * 모델 선택기 초기화
 */
function setupModelSelectors() {
    // 이미지 모델 선택기 (이미지 생성용)
    imageModelSelector = createModelSelector(
        '#image-model-selector-container',
        'openai',  // OpenAI 모델만 표시 (이미지 생성 지원)
        'image',   // 이미지 타입 모델만 표시
        'image-model',
        '',
        (provider, model) => {
            console.log(`이미지 생성 모델 선택: ${provider} - ${model}`);
            localStorage.setItem('flowbang-model-image-model', `${provider}:${model}`);
        }
    );
    
    // 텍스트 모델 선택기 (이미지 검색용)
    textModelSelector = createModelSelector(
        '#text-model-selector-container',
        'all',     // 모든 제공자의 모델 표시
        'text',    // 텍스트 타입 모델만 표시
        'text-model',
        '',
        (provider, model) => {
            console.log(`텍스트 모델 선택: ${provider} - ${model}`);
            localStorage.setItem('flowbang-model-text-model', `${provider}:${model}`);
        }
    );
    
    // 초기화 후 선택된 모델 확인 - 콘솔에 출력
    console.log('초기화 후 선택된 이미지 모델:', getSelectedModel('image-model'));
    console.log('초기화 후 선택된 텍스트 모델:', getSelectedModel('text-model'));
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 이미지 생성 버튼
    generateImagesBtn.addEventListener('click', generateImages);
    
    // 이미지 검색 버튼
    searchImagesBtn.addEventListener('click', searchImages);
    
    // 정렬 및 필터 변경
    sortFilter.addEventListener('change', () => {
        currentSort = sortFilter.value;
        currentPage = 1;
        renderLibraryImages();
    });
    
    categoryFilter.addEventListener('change', () => {
        currentCategory = categoryFilter.value;
        currentPage = 1;
        renderLibraryImages();
    });
    
    // 검색 입력
    searchLibrary.addEventListener('input', () => {
        currentSearch = searchLibrary.value.trim().toLowerCase();
        currentPage = 1;
        renderLibraryImages();
    });
    
    // 이미지 모달 닫기
    closeViewModalBtn.addEventListener('click', () => {
        viewImageModal.classList.add('hidden');
    });
    
    // 페이지네이션
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderLibraryImages();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderLibraryImages();
        }
    });
}

/**
 * DALL-E 이미지 생성
 */
async function generateImages() {
    const description = imageDescription.value.trim();
    if (!description) {
        showToast('이미지 설명을 입력해주세요.', 'warning');
        return;
    }
    
    try {
        showLoading('AI 이미지 생성 중...');
        
        // 선택된 모델 정보 가져오기
        const selectedModel = getSelectedModel('image-model');
        console.log('선택된 이미지 모델:', selectedModel);
        
        // 이미지 생성에 적합한 모델인지 확인
        if (!selectedModel || selectedModel.type !== 'image') {
            throw new Error('이미지 생성에 적합한 이미지 모델을 선택해주세요.');
        }
        
        // OpenAI 모델인지 확인 (현재는 OpenAI 모델만 지원)
        if (selectedModel.provider !== 'openai') {
            throw new Error('현재는 OpenAI 이미지 모델만 지원합니다.');
        }
        
        // 생성 개수
        const n = parseInt(generateCount.value);
        
        // config에서 이미지 생성용 프롬프트 템플릿 가져오기
        const templateData = PROMPT_TEMPLATES.artist_ai_create;
        const formattedPrompt = templateData.user_prompt_template.replace(
            '{image_description}', 
            description
        );
        
        // 결과 이미지 배열 초기화
        const generatedImages = [];
        
        console.log(`이미지 생성 모델: ${selectedModel.provider}:${selectedModel.name}`);
        console.log(`이미지 생성 프롬프트: ${formattedPrompt}`);
        
        // 순차적으로 이미지 생성 요청 (병렬 처리 개념으로 n개 준비)
        const generationPromises = Array(n).fill().map(async (_, index) => {
            try {
                showToast(`이미지 ${index + 1}/${n} 생성 중...`, 'info', 1000);
                
                // API 요청 준비 - OpenAI 이미지 생성 모델만 사용
                const requestData = {
                    type: 'image',
                    provider: selectedModel.provider,
                    model: selectedModel.name,
                    prompt: formattedPrompt,
                    n: 1,  // 한 번에 1개씩 생성
                    size: '1024x1024'
                };
                
                console.log(`이미지 생성 요청 ${index + 1} 데이터:`, requestData);
                
                // API 호출
                const response = await callSecureApi(apiEndpoints.backend.openai, 'POST', requestData);
                
                if (!response.success) {
                    console.error(`이미지 생성 응답 오류(${index + 1}):`, response.error);
                    throw new Error(response.message || response.error?.message || `이미지 ${index + 1} 생성에 실패했습니다.`);
                }
                
                // 결과 처리
                const images = response.data.images;
                
                if (!images || images.length === 0) {
                    throw new Error(`이미지 ${index + 1} 생성 결과가 없습니다.`);
                }
                
                // 생성된 이미지 추가
                generatedImages.push({
                    url: images[0].url,
                    title: `AI 생성 이미지 ${index + 1}`,
                    description: description,
                    createdAt: new Date().toISOString(),
                    category: 'ai-generated'
                });
                
                return true;
            } catch (error) {
                console.error(`이미지 ${index + 1} 생성 오류:`, error);
                return false;
            }
        });
        
        // 모든 이미지 생성 요청 완료 대기
        await Promise.all(generationPromises);
        
        // 생성된 이미지가 없는 경우
        if (generatedImages.length === 0) {
            throw new Error('이미지 생성에 실패했습니다.');
        }
        
        // 생성된 이미지 자동으로 라이브러리에 추가 (URL만 저장)
        await addImagesToLibrary(generatedImages);
        
        showToast(`${generatedImages.length}개의 이미지를 생성하고 라이브러리에 추가했습니다.`, 'success');
    } catch (error) {
        console.error('이미지 생성 오류:', error);
        showToast(error.message || '이미지 생성에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 이미지 검색 기능
 */
async function searchImages() {
    const imageSearchQuery = imageDescription.value.trim();
    if (!imageSearchQuery) {
        showToast('검색어를 입력해주세요.', 'warning');
        return;
    }
    
    try {
        showLoading('이미지 검색 중...');
        
        // 검색 개수
        const n = parseInt(searchCount.value);
        
        // config에서 이미지 검색용 프롬프트 템플릿 가져오기
        const templateData = PROMPT_TEMPLATES.artist_ai_search;
        const formattedPrompt = templateData.user_prompt_template.replace(
            '{image_description}', 
            imageSearchQuery
        );
        
        console.log(`이미지 검색 프롬프트: ${formattedPrompt}`);
        
        // API 요청 준비 - 텍스트 모델 사용
        const selectedModel = getSelectedModel('text-model');
        if (!selectedModel) {
            throw new Error('텍스트 모델을 선택해주세요.');
        }
        
        console.log(`이미지 검색에 사용할 모델: ${selectedModel.provider}:${selectedModel.name}`);
        
        // API 요청 준비
        let requestData = {
            type: 'text',
            model: selectedModel.name,
            messages: [
                {
                    role: 'system',
                    content: templateData.system_prompt
                },
                {
                    role: 'user',
                    content: formattedPrompt
                }
            ]
        };
        
        // 모델 제조사에 맞는 API 엔드포인트 선택
        let apiEndpoint;
        switch (selectedModel.provider) {
            case 'openai':
                apiEndpoint = apiEndpoints.backend.openai;
                break;
            case 'google':
                apiEndpoint = apiEndpoints.backend.google;
                // Google API의 경우 messages 대신 contents 사용
                requestData = {
                    type: 'text',
                    model: selectedModel.name,
                    contents: [
                        templateData.system_prompt + "\n\n" + formattedPrompt
                    ]
                };
                break;
            case 'anthropic':
                apiEndpoint = apiEndpoints.backend.anthropic;
                break;
            default:
                throw new Error('지원하지 않는 모델 제조사입니다.');
        }
        
        console.log('이미지 검색 요청 데이터:', requestData);
        console.log('요청 엔드포인트:', apiEndpoint);
        
        // API 호출
        const response = await callSecureApi(apiEndpoint, 'POST', requestData);
        
        if (!response.success) {
            console.error('이미지 검색 응답 오류:', response.error);
            throw new Error(response.message || response.error?.message || '이미지 검색에 실패했습니다.');
        }
        
        // 결과 처리 - 응답은 JSON 형식의 문자열로 반환될 수 있음
        const content = response.data.content;
        let searchResults;
        
        try {
            // JSON 파싱 시도
            if (typeof content === 'string') {
                searchResults = JSON.parse(content);
            } else {
                throw new Error('응답 데이터가 올바른 형식이 아닙니다.');
            }
        } catch (error) {
            console.error('JSON 파싱 오류:', error);
            // JSON 파싱 실패 시 응답 데이터에서 URL 추출 시도
            const urlRegex = /(https?:\/\/[^\s"']+\.(jpe?g|png|gif|webp))/gi;
            const urls = content.match(urlRegex);
            
            if (urls && urls.length > 0) {
                searchResults = urls.map((url, idx) => ({
                    url: url,
                    title: `검색 이미지 ${idx + 1}`,
                    description: imageSearchQuery
                }));
            } else {
                throw new Error('검색 결과에서 이미지를 찾을 수 없습니다.');
            }
        }
        
        if (!searchResults || searchResults.length === 0) {
            throw new Error('검색 결과가 없습니다.');
        }
        
        console.log(`이미지 검색 결과: ${searchResults.length}개 발견`);
        
        // 검색 결과 이미지 정보 생성
        const searchedImages = searchResults.map((result, index) => ({
            url: result.url || '',
            title: result.title || result.alt_text || `검색 이미지 ${index + 1}`,
            description: result.desc || result.description || imageSearchQuery,
            createdAt: new Date().toISOString(),
            source: result.source || 'web-search',
            category: 'web-search',
            sourceUrl: result.source_url || null,
            license: result.license || '무료 사용 가능'
        }));
        
        // 검색된 이미지 자동으로 라이브러리에 추가 (URL만 저장)
        await addImagesToLibrary(searchedImages);
        
        showToast(`${searchedImages.length}개의 이미지를 검색하고 라이브러리에 추가했습니다.`, 'success');
    } catch (error) {
        console.error('이미지 검색 오류:', error);
        showToast(error.message || '이미지 검색에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * AI 결과 렌더링
 */
function renderAiResults() {
    // 결과 미리보기 영역 표시
    aiResultPreview.classList.remove('hidden');
    
    // 그리드 초기화
    aiResultGrid.innerHTML = '';
    
    // 결과 이미지 렌더링
    aiResultImages.forEach((image, index) => {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow';
        imageCard.dataset.index = index;
        
        imageCard.innerHTML = `
            <div class="aspect-video bg-gray-100 relative">
                <img src="${image.url}" alt="${image.title}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                    <div class="flex space-x-2">
                        <button class="view-result-btn p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100" title="크게 보기">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="p-2">
                <h3 class="image-title text-sm font-medium text-gray-800 truncate">${image.title}</h3>
                <p class="image-category text-xs text-gray-500 mt-1">${image.category === 'ai-generated' ? 'AI 생성' : 'AI 검색'}</p>
            </div>
        `;
        
        // 크게 보기 버튼 이벤트
        const viewBtn = imageCard.querySelector('.view-result-btn');
        viewBtn.addEventListener('click', () => {
            viewImage(image);
        });
        
        aiResultGrid.appendChild(imageCard);
    });
    
    // 추가 버튼 활성화 (자동 추가되므로 비활성화)
    addToLibraryBtn.disabled = true;
}

/**
 * 이미지 크게 보기
 */
function viewImage(image) {
    fullsizeImage.src = image.url;
    fullsizeTitle.textContent = image.title;
    
    let infoText = image.description;
    if (image.license) {
        infoText += ` | 라이센스: ${image.license}`;
    }
    if (image.sourceUrl) {
        infoText += ` | <a href="${image.sourceUrl}" target="_blank" class="text-blue-600 hover:underline">원본 링크</a>`;
    }
    
    fullsizeInfo.innerHTML = infoText;
    viewImageModal.classList.remove('hidden');
}

/**
 * 고유 ID 생성
 * @returns {string} 랜덤 생성된 고유 ID
 */
function generateUniqueId() {
    return 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

/**
 * 라이브러리 데이터 로드
 * @returns {Array} 이미지 배열
 */
function loadLibraryData() {
    try {
        const libraryJson = localStorage.getItem(LOCAL_STORAGE_KEYS.library);
        if (!libraryJson) return [];
        
        const parsedData = JSON.parse(libraryJson);
        
        // 기존 형식이 { images: [] } 구조인 경우
        if (parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.images)) {
            return parsedData.images;
        }
        
        // 이미 배열인 경우
        if (Array.isArray(parsedData)) {
            return parsedData;
        }
        
        // 그 외의 경우는 빈 배열 반환
        return [];
    } catch (error) {
        console.error('라이브러리 데이터 파싱 오류:', error);
        return [];
    }
}

/**
 * 이미지를 라이브러리에 추가 (URL만 저장)
 * @param {Array} images - 추가할 이미지 객체 배열
 * @returns {Array} 이미지 배열
 */
async function addImagesToLibrary(images) {
    if (!images || images.length === 0) return [];
    
    try {
        // 기존 라이브러리 데이터 로드
        const existingLibrary = loadLibraryData();
        
        // 새 이미지를 라이브러리에 추가
        images.forEach(image => {
            // 기본 메타데이터 설정
            const imageData = {
                id: generateUniqueId(),
                url: image.url,
                title: image.title || '제목 없음',
                description: image.description || '',
                category: image.category || 'uncategorized',
                tags: image.tags || [],
                createdAt: image.createdAt || new Date().toISOString(),
                source: image.source || 'user',
                sourceUrl: image.sourceUrl || null
            };
            
            // 라이브러리에 추가
            existingLibrary.push(imageData);
        });
        
        // 라이브러리 데이터 저장 - 일관된 형식으로 저장
        localStorage.setItem(LOCAL_STORAGE_KEYS.library, JSON.stringify({
            images: existingLibrary,
            updatedAt: new Date().toISOString()
        }));
        
        // 라이브러리 UI 업데이트
        loadLibraryImages();
        
        return existingLibrary;
    } catch (error) {
        console.error('이미지 라이브러리 추가 오류:', error);
        showToast('이미지를 라이브러리에 추가하는 데 실패했습니다.', 'error');
        return [];
    }
}

/**
 * AI 결과 이미지를 라이브러리에 추가 (수동 방식 - 현재는 자동화로 대체)
 */
async function addAiResultToLibrary() {
    // 이 함수는 이제 자동 추가 방식으로 대체되어 사용되지 않습니다.
    // 호환성을 위해 유지됩니다.
    
    if (!window.aiResultImages || !Array.isArray(window.aiResultImages) || window.aiResultImages.length === 0) {
        showToast('추가할 이미지가 없습니다.', 'warning');
        return;
    }
    
    try {
        showLoading('이미지를 라이브러리에 추가하는 중...');
        
        // 이미지를 라이브러리에 추가 (공통 함수 사용)
        const addedImages = await addImagesToLibrary(window.aiResultImages);
        
        if (addedImages && addedImages.length > 0) {
            // 결과 미리보기 지우기
            if (typeof clearPreview === 'function') {
                clearPreview();
            }
            
            showToast(`${window.aiResultImages.length}개의 이미지가 라이브러리에 추가되었습니다.`, 'success');
            
            // 변수 정리
            window.aiResultImages = [];
        } else {
            throw new Error('이미지를 라이브러리에 추가하는 데 실패했습니다.');
        }
    } catch (error) {
        console.error('라이브러리 추가 오류:', error);
        showToast(error.message || '이미지를 라이브러리에 추가하는 데 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 라이브러리 이미지 로드
 */
function loadLibraryImages() {
    try {
        // 로딩 상태 표시
        loadingImages.classList.remove('hidden');
        noImages.classList.add('hidden');
        imageGrid.querySelectorAll('.image-item').forEach(item => item.remove());
        
        // 라이브러리 데이터 로드
        const libraryData = loadLibraryData();
        
        if (!libraryData || libraryData.length === 0) {
            // 이미지가 없는 경우
            loadingImages.classList.add('hidden');
            noImages.classList.remove('hidden');
            pagination.classList.add('hidden');
            return;
        }
        
        // 이미지 필터링 (카테고리, 검색)
        let filteredImages = libraryData;
        
        if (currentCategory !== 'all') {
            filteredImages = filteredImages.filter(img => img.category === currentCategory);
        }
        
        if (currentSearch) {
            filteredImages = filteredImages.filter(img => 
                (img.title && img.title.toLowerCase().includes(currentSearch)) || 
                (img.description && img.description.toLowerCase().includes(currentSearch))
            );
        }
        
        // 이미지 정렬
        filteredImages = sortImages(filteredImages, currentSort);
        
        // 페이지네이션 계산
        totalPages = Math.ceil(filteredImages.length / itemsPerPage);
        if (currentPage > totalPages) {
            currentPage = 1;
        }
        
        // 현재 페이지 이미지
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredImages.length);
        const currentImages = filteredImages.slice(startIndex, endIndex);
        
        // 이미지 렌더링
        renderLibraryImages(currentImages);
        
        // 페이지네이션 업데이트
        updatePagination();
        
        // 로딩 상태 숨기기
        loadingImages.classList.add('hidden');
        
        // 빈 상태 표시
        if (filteredImages.length === 0) {
            noImages.classList.remove('hidden');
            pagination.classList.add('hidden');
        } else {
            noImages.classList.add('hidden');
            pagination.classList.remove('hidden');
        }
    } catch (error) {
        console.error('라이브러리 이미지 로드 오류:', error);
        loadingImages.classList.add('hidden');
        showToast('이미지 로드에 실패했습니다.', 'error');
    }
}

/**
 * 이미지 정렬
 */
function sortImages(images, sortType) {
    switch (sortType) {
        case 'newest':
            return [...images].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'oldest':
            return [...images].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        case 'name':
            return [...images].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        default:
            return images;
    }
}

/**
 * 라이브러리 이미지 렌더링
 */
function renderLibraryImages(images) {
    // 이미지 그리드 초기화
    imageGrid.querySelectorAll('.image-item').forEach(item => item.remove());
    
    // 템플릿 가져오기
    const template = document.querySelector('.image-item-template');
    
    // 이미지 렌더링
    images.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = template.innerHTML;
        
        // 이미지 정보 설정
        const img = imageItem.querySelector('img');
        img.src = image.url;
        img.alt = image.title || '이미지';
        
        const title = imageItem.querySelector('.image-title');
        title.textContent = image.title || '제목 없음';
        
        const date = imageItem.querySelector('.image-date');
        date.textContent = formatDate(image.createdAt);
        
        // 버튼 컨테이너 가져오기
        const btnContainer = imageItem.querySelector('.flex.space-x-2');
        
        if (btnContainer) {
            // 기존 버튼들 정리
            const existingButtons = btnContainer.querySelectorAll('button');
            let viewBtn = null;
            
            // 보기 버튼 찾거나 생성
            viewBtn = btnContainer.querySelector('.view-image-btn');
            if (!viewBtn) {
                viewBtn = document.createElement('button');
                viewBtn.className = 'view-image-btn p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100';
                viewBtn.title = '크게 보기';
                viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                btnContainer.appendChild(viewBtn);
            }
            
            // 보기 버튼 이벤트
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                viewImage(image);
            });
            
            // 편집 버튼 제거
            const editBtn = btnContainer.querySelector('.edit-image-btn');
            if (editBtn) {
                btnContainer.removeChild(editBtn);
            }
            
            // 삭제 버튼 생성 또는 가져오기
            let deleteBtn = btnContainer.querySelector('.delete-image-btn');
            if (!deleteBtn) {
                deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-image-btn p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100';
                deleteBtn.title = '삭제';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                btnContainer.appendChild(deleteBtn);
            }
            
            // 삭제 버튼 이벤트
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteImage(index);
            });
            
            // 링크 복사 버튼 추가
            let copyLinkBtn = btnContainer.querySelector('.copy-link-btn');
            if (!copyLinkBtn) {
                copyLinkBtn = document.createElement('button');
                copyLinkBtn.className = 'copy-link-btn p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100';
                copyLinkBtn.title = '링크 복사';
                copyLinkBtn.innerHTML = '<i class="fas fa-link"></i>';
                btnContainer.appendChild(copyLinkBtn);
            }
            
            // 링크 복사 버튼 이벤트
            copyLinkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyImageLink(image.url);
            });
        }
        
        imageGrid.appendChild(imageItem);
    });
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * 페이지네이션 업데이트
 */
function updatePagination() {
    // 페이지 번호 영역 초기화
    pageNumbers.innerHTML = '';
    
    // 페이지가 1페이지뿐이면 페이지네이션 숨기기
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }
    
    pagination.classList.remove('hidden');
    
    // 처음에 보여줄 최대 페이지 수
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // startPage 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 처음으로 버튼
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'page-number px-3 py-1 border-t border-b border-l border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
        firstBtn.textContent = '1';
        firstBtn.addEventListener('click', () => {
            currentPage = 1;
            loadLibraryImages();
        });
        pageNumbers.appendChild(firstBtn);
        
        // 생략 표시
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'px-3 py-1 border-t border-b border-gray-300 bg-white text-gray-700';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }
    }
    
    // 페이지 번호 생성
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number px-3 py-1 border-t border-b border-gray-300 ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`;
        pageBtn.textContent = i.toString();
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            loadLibraryImages();
        });
        pageNumbers.appendChild(pageBtn);
    }
    
    // 마지막으로 버튼
    if (endPage < totalPages) {
        // 생략 표시
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'px-3 py-1 border-t border-b border-gray-300 bg-white text-gray-700';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.className = 'page-number px-3 py-1 border-t border-b border-r border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
        lastBtn.textContent = totalPages.toString();
        lastBtn.addEventListener('click', () => {
            currentPage = totalPages;
            loadLibraryImages();
        });
        pageNumbers.appendChild(lastBtn);
    }
    
    // 이전/다음 버튼 상태 업데이트
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

/**
 * 이미지 삭제
 */
async function deleteImage(index) {
    try {
        // 컨펌 모달 없이 즉시 삭제
        
        // 라이브러리 데이터 로드
        let libraryData = loadLibraryData();
        if (!libraryData || libraryData.length === 0) return;
        
        // 필터링된 이미지 중 해당 인덱스에 해당하는 이미지 찾기
        let filteredImages = [...libraryData]; // 복사본 생성
        
        if (currentCategory !== 'all') {
            filteredImages = filteredImages.filter(img => img.category === currentCategory);
        }
        
        if (currentSearch) {
            filteredImages = filteredImages.filter(img => 
                (img.title && img.title.toLowerCase().includes(currentSearch)) || 
                (img.description && img.description.toLowerCase().includes(currentSearch))
            );
        }
        
        filteredImages = sortImages(filteredImages, currentSort);
        
        // 페이지네이션 반영
        const startIndex = (currentPage - 1) * itemsPerPage;
        const targetImage = filteredImages[startIndex + index];
        
        if (!targetImage) return;
        
        // 전체 이미지 배열에서 해당 이미지 찾기
        const originalIndex = libraryData.findIndex(img => 
            img.url === targetImage.url && 
            img.title === targetImage.title && 
            img.createdAt === targetImage.createdAt
        );
        
        if (originalIndex === -1) return;
        
        // 이미지 삭제
        libraryData.splice(originalIndex, 1);
        
        // 로컬 스토리지에 저장 - 일관된 형식으로 저장
        localStorage.setItem(LOCAL_STORAGE_KEYS.library, JSON.stringify({
            images: libraryData,
            updatedAt: new Date().toISOString()
        }));
        
        // 라이브러리 다시 로드
        loadLibraryImages();
        
        showToast('이미지가 삭제되었습니다.', 'success');
    } catch (error) {
        console.error('이미지 삭제 오류:', error);
        showToast('이미지 삭제에 실패했습니다.', 'error');
    }
}

/**
 * 이미지 URL을 클립보드에 복사
 * @param {string} url - 복사할 이미지 URL
 */
function copyImageLink(url) {
    if (!url) return;
    
    try {
        // 클립보드에 복사
        navigator.clipboard.writeText(url)
            .then(() => {
                showToast('이미지 링크가 클립보드에 복사되었습니다.', 'success');
            })
            .catch(err => {
                console.error('클립보드 복사 실패:', err);
                showToast('링크 복사에 실패했습니다.', 'error');
                
                // 대체 방법 시도
                fallbackCopyTextToClipboard(url);
            });
    } catch (error) {
        console.error('링크 복사 오류:', error);
        showToast('링크 복사에 실패했습니다.', 'error');
        
        // 대체 방법 시도
        fallbackCopyTextToClipboard(url);
    }
}

/**
 * 클립보드 API를 지원하지 않는 브라우저를 위한 대체 복사 방법
 * @param {string} text - 복사할 텍스트
 */
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 화면 밖에 위치시키기
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // 텍스트 선택 및 복사
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('이미지 링크가 클립보드에 복사되었습니다.', 'success');
        } else {
            showToast('링크 복사에 실패했습니다.', 'error');
        }
    } catch (err) {
        console.error('대체 클립보드 복사 실패:', err);
        showToast('링크 복사에 실패했습니다.', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * 임시 저장된 이미지 설명 불러오기
 */
function loadSavedImageDescription() {
    try {
        // 로컬 스토리지에서 이미지 설명 가져오기
        const savedDescription = localStorage.getItem('flowbang-temp-image-description');
        
        if (savedDescription) {
            console.log('저장된 이미지 설명 불러옴:', savedDescription);
            
            // 이미지 설명 필드에 설정
            imageDescription.value = savedDescription;
            
            // 사용 후 삭제하여 일회성으로 만들기
            localStorage.removeItem('flowbang-temp-image-description');
        }
    } catch (error) {
        console.error('저장된 이미지 설명 불러오기 오류:', error);
    }
} 