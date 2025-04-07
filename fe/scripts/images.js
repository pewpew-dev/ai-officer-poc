import { LOCAL_STORAGE_KEYS } from '../configs/config.js';
import { showToast, createModelSelector, callSecureApi, showLoading, hideLoading, alertDialog } from './common.js';
import { apiEndpoints, PROMPT_TEMPLATES } from '../configs/config.js';

// DOM 요소
const warningAlert = document.getElementById('warning-alert');
const warningMessage = document.getElementById('warning-message');
const dismissWarningBtn = document.getElementById('dismiss-warning');
const imageSlider = document.getElementById('image-slider');
const sliderPrevBtn = document.getElementById('slider-prev');
const sliderNextBtn = document.getElementById('slider-next');
const noImagesMsg = document.getElementById('no-images');
const imageEditSection = document.getElementById('image-edit-section');
const currentImage = document.getElementById('current-image');
const currentImageKey = document.getElementById('current-image-key');
const currentImageUrl = document.getElementById('current-image-url');
const currentImageDescription = document.getElementById('current-image-description');
const newImage = document.getElementById('new-image');
const imagePlaceholder = document.getElementById('image-placeholder');
const imageUrlInput = document.getElementById('image-url-input');
const imageDescription = document.getElementById('image-description');
const applyUrlBtn = document.getElementById('apply-url-btn');
const generateImageBtn = document.getElementById('generate-image-btn');
const searchImageBtn = document.getElementById('search-image-btn');
const searchResults = document.getElementById('search-results');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveImageBtn = document.getElementById('save-image-btn');
const textAiModelSelectorContainer = document.getElementById('text-ai-model-selector-container');
const sampleImageItems = document.querySelectorAll('.sample-image-item');
const newImageUrlPreview = document.getElementById('new-image-url');
const newImageDescriptionPreview = document.getElementById('new-image-description');
const saveNotice = document.getElementById('save-notice');

// 상태 변수
let currentEditingImageKey = '';
let selectedSearchImage = null;
let imageAIModelSelector;
let textAIModelSelector;
let currentSlideIndex = 0;
let totalSlides = 0;
let hasCode = false; // 코드 생성 여부 상태

/**
 * 페이지 초기화
 */
function initPage() {
    console.log('이미지 관리 페이지 초기화');
    
    // 코드 생성 여부 확인 및 경고 표시
    checkCodeGeneration();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 모델 선택기 설정
    setupModelSelectors();
    
    // 이미지 목록 로드
    loadImageList();
}

/**
 * 코드 생성 여부 확인 및 경고 표시
 */
function checkCodeGeneration() {
    try {
        const savedCodeData = localStorage.getItem(LOCAL_STORAGE_KEYS.code);
        
        if (!savedCodeData) {
            // 코드가 없는 경우 경고 표시
            showWarning('웹사이트 코드가 생성되지 않았습니다. 이미지를 관리하려면 먼저 <a href="generate.html" class="text-yellow-800 font-medium underline hover:text-yellow-900">코드 생성 페이지</a>에서 웹사이트 코드를 생성해주세요.');
            hasCode = false;
        } else {
            // 코드가 있는 경우 경고 숨김
            hideWarning();
            hasCode = true;
        }
    } catch (error) {
        console.error('코드 생성 확인 오류:', error);
        showWarning('로컬 스토리지 데이터를 확인하는 중 오류가 발생했습니다.');
        hasCode = false;
    }
}

/**
 * 경고 메시지 표시
 * @param {string} message - 표시할 경고 메시지 (HTML 포함 가능)
 */
function showWarning(message) {
    if (warningMessage) {
        warningMessage.innerHTML = message;
    }
    if (warningAlert) {
        warningAlert.classList.remove('hidden');
    }
}

/**
 * 경고 메시지 숨김
 */
function hideWarning() {
    if (warningAlert) {
        warningAlert.classList.add('hidden');
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 경고 닫기 버튼
    if (dismissWarningBtn) {
        dismissWarningBtn.addEventListener('click', hideWarning);
    }
    
    // 슬라이더 네비게이션 버튼
    if (sliderPrevBtn) {
        sliderPrevBtn.addEventListener('click', () => {
            moveSlider('prev');
        });
    }
    
    if (sliderNextBtn) {
        sliderNextBtn.addEventListener('click', () => {
            moveSlider('next');
        });
    }
    
    // URL 적용 버튼
    if (applyUrlBtn) {
        applyUrlBtn.addEventListener('click', applyImageUrl);
    }
    
    // 이미지 URL 입력 필드 Enter 키 이벤트
    if (imageUrlInput) {
        imageUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                applyImageUrl();
            }
        });
        
        // 입력 변화시 처리 - 자동 미리보기 로직 제거 (isValidImageUrl 검사 제거)
        imageUrlInput.addEventListener('input', () => {
            // URL 입력 시 변경 예정 정보만 업데이트
            updateEditPreview();
        });
    }
    
    // 이미지 설명 입력 필드 변경 이벤트
    if (imageDescription) {
        imageDescription.addEventListener('input', () => {
            // 설명 변경 시 변경 예정 정보 업데이트
            updateEditPreview();
            
            // 설명이 변경되면 저장 버튼 활성화
            if (imageDescription.value.trim() !== currentImageDescription.textContent.trim()) {
                saveImageBtn.disabled = false;
            }
        });
    }
    
    // 샘플 이미지 선택 이벤트
    if (sampleImageItems && sampleImageItems.length > 0) {
        sampleImageItems.forEach(item => {
            item.addEventListener('click', () => {
                const imageUrl = item.getAttribute('data-url');
                if (imageUrl) {
                    // URL 입력 필드에 자동 입력
                    imageUrlInput.value = imageUrl;
                    
                    // 미리보기 표시
                    previewImageFromUrl(imageUrl);
                    
                    // 저장 버튼 활성화
                    saveImageBtn.disabled = false;
                    
                    // 변경 예정 정보 업데이트
                    updateEditPreview();
                    
                    // 저장 안내 메시지 표시 (URL이 변경된 경우)
                    if (imageUrl !== currentImageUrl.textContent && saveNotice) {
                        saveNotice.classList.remove('hidden');
                    }
                    
                    // 알림 표시
                    showToast('이미지가 선택되었습니다. 필요한 경우 설명을 수정한 후 저장해주세요.', 'success');
                }
            });
        });
    }
    
    // 이미지 생성 버튼
    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', generateImageWithAI);
    }
    
    // 이미지 검색 버튼
    if (searchImageBtn) {
        searchImageBtn.addEventListener('click', searchImagesOnWeb);
    }
    
    // 취소 버튼
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', hideEditSection);
    }
    
    // 저장 버튼
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', saveImageChanges);
    }
    
    // 키보드 이벤트 (슬라이더 네비게이션)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            moveSlider('prev');
        } else if (e.key === 'ArrowRight') {
            moveSlider('next');
        }
    });
    
    // 마우스 휠 이벤트 (슬라이더 스크롤)
    if (imageSlider) {
        imageSlider.addEventListener('wheel', (e) => {
            e.preventDefault();
            imageSlider.scrollLeft += e.deltaY;
        });
    }
}

/**
 * 모델 선택기 설정
 */
function setupModelSelectors() {
    // 이미지 AI 모델 선택기 (이미지 생성용)
    imageAIModelSelector = createModelSelector(
        '#image-ai-model-selector-container',
        'all',
        'image',
        'image-ai-model',
        '',
        (provider, model) => {
            console.log(`이미지 AI 모델 선택: ${provider} - ${model}`);
        }
    );
    
    // 텍스트 AI 모델 선택기 (이미지 검색용)
    textAIModelSelector = createModelSelector(
        '#text-ai-model-selector-container',
        'all',
        'text',
        'text-ai-model',
        '',
        (provider, model) => {
            console.log(`텍스트 AI 모델 선택: ${provider} - ${model}`);
        }
    );
}

/**
 * 이미지 목록 로드 및 표시
 */
function loadImageList() {
    try {
        // 코드가 생성되지 않은 경우 이미지 목록 로드 안함
        if (!hasCode) {
            imageSlider.innerHTML = '';
            noImagesMsg.classList.remove('hidden');
            showWarning('웹사이트 코드가 생성되지 않았습니다. 이미지를 관리하려면 먼저 <a href="generate.html" class="text-yellow-800 font-medium underline hover:text-yellow-900">코드 생성 페이지</a>에서 웹사이트 코드를 생성해주세요.');
            return;
        }
        
        showLoading('이미지 목록을 불러오는 중...');
        
        // 로컬 스토리지에서 이미지 데이터 로드
        const imagesData = getImagesFromLocalStorage();
        
        // UI 업데이트
        if (imagesData && imagesData.images && imagesData.images.length > 0) {
            displayImageSlider(imagesData.images);
            noImagesMsg.classList.add('hidden');
            
            // 페이지 로드 시 첫 번째 이미지 자동 선택 및 편집창 열기
            selectImage(imagesData.images[0], 0);
        } else {
            imageSlider.innerHTML = '';
            noImagesMsg.classList.remove('hidden');
            hideEditSection();
        }
        
        hideLoading();
        console.log('이미지 목록 로드 완료');
    } catch (error) {
        console.error('이미지 목록 로드 오류:', error);
        hideLoading();
        showToast('이미지 목록을 불러오는데 실패했습니다.', 'error');
    }
}

/**
 * 로컬 스토리지에서 이미지 데이터 가져오기
 * @returns {Object|null} 이미지 데이터 객체 또는 null
 */
function getImagesFromLocalStorage() {
    try {
        const savedImagesData = localStorage.getItem(LOCAL_STORAGE_KEYS.image);
        console.log('로드된 이미지 데이터:', savedImagesData);
        return savedImagesData ? JSON.parse(savedImagesData) : null;
    } catch (error) {
        console.error('로컬 스토리지 이미지 데이터 파싱 오류:', error);
        return null;
    }
}

/**
 * 이미지 슬라이더에 이미지 목록 표시
 * @param {Array} images - 이미지 객체 배열
 */
function displayImageSlider(images) {
    imageSlider.innerHTML = '';
    totalSlides = images.length;
    
    images.forEach((image, index) => {
        const imageSlide = document.createElement('div');
        imageSlide.className = 'image-slide';
        imageSlide.dataset.index = index;
        imageSlide.dataset.key = image.key;
        
        const description = image.desc || '설명 없음';
        
        // 이미지 미리보기는 background-image로 설정하여 이미지 로딩을 최적화
        // CSS의 background-image는 필요할 때만 로드됨 (사용자에게 보일 때)
        imageSlide.innerHTML = `
            <div class="image-preview" style="background-image: url('${image.url}')" data-url="${image.url}"></div>
            <div class="image-info">
                <h4 class="text-sm font-medium text-gray-800 truncate" title="${image.key}">${image.key}</h4>
            </div>
        `;
        
        // 전체 슬라이드 클릭 이벤트
        imageSlide.addEventListener('click', () => {
            selectImage(image, index);
        });
        
        imageSlider.appendChild(imageSlide);
    });
    
    // 슬라이더 네비게이션 버튼 상태 업데이트
    updateSliderNavButtons();
}

/**
 * 이미지 선택 처리
 * @param {Object} image - 선택한 이미지 객체
 * @param {number} index - 선택한 이미지의 인덱스
 */
function selectImage(image, index) {
    // 이전 선택 해제
    document.querySelectorAll('.image-slide').forEach(slide => {
        slide.classList.remove('selected');
    });
    
    // 현재 슬라이드 선택
    const selectedSlide = document.querySelector(`.image-slide[data-index="${index}"]`);
    if (selectedSlide) {
        selectedSlide.classList.add('selected');
        
        // 현재 이미지 인덱스 업데이트
        currentSlideIndex = index;
        
        // 슬라이더 스크롤 위치 조정
        scrollToSelectedSlide(selectedSlide);
        
        // 이미지 선택 시 자동으로 편집창 열기
        openEditSection(image);
    }
}

/**
 * 선택한 슬라이드가 보이도록 스크롤 조정
 * @param {HTMLElement} selectedSlide - 선택된 슬라이드 요소
 */
function scrollToSelectedSlide(selectedSlide) {
    if (!selectedSlide || !imageSlider) return;
    
    const sliderRect = imageSlider.getBoundingClientRect();
    const slideRect = selectedSlide.getBoundingClientRect();
    
    // 슬라이드가 슬라이더의 왼쪽 밖에 있는 경우
    if (slideRect.left < sliderRect.left) {
        imageSlider.scrollLeft = imageSlider.scrollLeft - (sliderRect.left - slideRect.left) - 20;
    }
    // 슬라이드가 슬라이더의 오른쪽 밖에 있는 경우
    else if (slideRect.right > sliderRect.right) {
        imageSlider.scrollLeft = imageSlider.scrollLeft + (slideRect.right - sliderRect.right) + 20;
    }
}

/**
 * 슬라이더 이동 처리
 * @param {string} direction - 이동 방향 ('prev' 또는 'next')
 */
function moveSlider(direction) {
    const totalSlides = document.querySelectorAll('.image-slide').length;
    if (totalSlides === 0) return;
    
    if (direction === 'prev' && currentSlideIndex > 0) {
        currentSlideIndex--;
    } else if (direction === 'next' && currentSlideIndex < totalSlides - 1) {
        currentSlideIndex++;
    } else {
        return;
    }
    
    // 해당 인덱스의 슬라이드 요소 선택
    const slideToSelect = document.querySelector(`.image-slide[data-index="${currentSlideIndex}"]`);
    if (slideToSelect) {
        // 이미지 객체 정보 가져오기
        const key = slideToSelect.dataset.key;
        const imagesData = getImagesFromLocalStorage();
        if (imagesData && imagesData.images) {
            const image = imagesData.images.find(img => img.key === key);
            if (image) {
                selectImage(image, currentSlideIndex);
            }
        }
    }
    
    // 슬라이더 네비게이션 버튼 상태 업데이트
    updateSliderNavButtons();
}

/**
 * 슬라이더 네비게이션 버튼 상태 업데이트
 */
function updateSliderNavButtons() {
    if (!sliderPrevBtn || !sliderNextBtn) return;
    
    const totalSlides = document.querySelectorAll('.image-slide').length;
    
    // 이전 버튼 상태
    if (currentSlideIndex <= 0) {
        sliderPrevBtn.classList.add('opacity-50', 'cursor-not-allowed');
        sliderPrevBtn.disabled = true;
    } else {
        sliderPrevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        sliderPrevBtn.disabled = false;
    }
    
    // 다음 버튼 상태
    if (currentSlideIndex >= totalSlides - 1) {
        sliderNextBtn.classList.add('opacity-50', 'cursor-not-allowed');
        sliderNextBtn.disabled = true;
    } else {
        sliderNextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        sliderNextBtn.disabled = false;
    }
}

/**
 * 이미지 편집 섹션 열기
 * @param {Object} image - 편집할 이미지 객체
 */
function openEditSection(image) {
    // 코드가 생성되지 않은 경우 편집 불가
    if (!hasCode) {
        showWarning('웹사이트 코드가 생성되지 않았습니다. 이미지 편집을 위해 <a href="generate.html" class="text-yellow-800 font-medium underline hover:text-yellow-900">코드 생성 페이지</a>에서 웹사이트 코드를 생성해주세요.');
        return;
    }
    
    if (!image || !image.key || !image.url) {
        showToast('이미지 정보가 올바르지 않습니다.', 'error');
        return;
    }
    
    console.log('편집할 이미지 정보:', image);
    
    // 현재 편집 중인 이미지 키 저장
    currentEditingImageKey = image.key;
    
    // 이미지 로딩 감지를 위한 이벤트 제거 (기존 이벤트 리스너가 있을 경우 제거)
    currentImage.onload = null;
    currentImage.onerror = null;
    
    // 현재 이미지 정보 표시 - 이미 슬라이더에서 이미지가 로드되었으므로 추가 로딩 방지
    if (currentImage.src !== image.url) {
        currentImage.src = image.url;
    }
    currentImageKey.textContent = image.key;
    currentImageUrl.textContent = image.url;
    currentImageDescription.textContent = image.desc || '이미지 설명이 없습니다.';
    
    // 입력 필드 초기화
    imageDescription.value = image.desc || '';
    imageUrlInput.value = '';
    
    // 새 이미지 초기화
    newImage.classList.add('hidden');
    imagePlaceholder.classList.remove('hidden');
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');
    
    // 변경 예정 정보 초기화 및 기본 텍스트 색상 설정
    if (newImageUrlPreview) {
        newImageUrlPreview.textContent = image.url;
        newImageUrlPreview.classList.remove('text-blue-600');
        newImageUrlPreview.classList.add('text-gray-800');
    }
    
    if (newImageDescriptionPreview) {
        newImageDescriptionPreview.textContent = image.desc || '이미지 설명이 없습니다.';
        newImageDescriptionPreview.classList.remove('text-blue-600');
        newImageDescriptionPreview.classList.add('text-gray-800');
    }
    
    // 저장 안내 메시지 초기에는 숨김
    if (saveNotice) {
        saveNotice.classList.add('hidden');
    }
    
    // 저장 버튼 비활성화
    saveImageBtn.disabled = true;
    
    // 편집 섹션 표시
    imageEditSection.classList.remove('hidden');
    
    // DOM 렌더링을 위한 짧은 지연 후 show 클래스 추가
    setTimeout(() => {
        imageEditSection.classList.add('show');
    }, 10);
}

/**
 * 이미지 편집 섹션 숨기기
 */
function hideEditSection() {
    // show 클래스 제거
    imageEditSection.classList.remove('show');
    
    // 애니메이션 완료 후 hidden 클래스 추가
    setTimeout(() => {
        imageEditSection.classList.add('hidden');
        
        // 상태 초기화
        currentEditingImageKey = '';
        selectedSearchImage = null;
    }, 400); // 트랜지션 시간과 맞춤(CSS의 트랜지션 시간보다 약간 길게)
}

/**
 * 입력된 URL로 이미지 미리보기 표시
 */
function applyImageUrl() {
    const url = imageUrlInput.value.trim();
    
    if (!url) {
        showToast('이미지 URL을 입력해주세요.', 'warning');
        return;
    }
    
    // 확장자 검사 대신 바로 이미지 미리보기를 시도
    previewImageFromUrl(url);
}

/**
 * URL로부터 이미지를 미리보기
 * @param {string} url - 미리볼 이미지 URL
 */
function previewImageFromUrl(url) {
    if (!url || url.trim() === '') {
        showToast('이미지 URL을 입력해주세요.', 'error');
        return;
    }
    
    // 이미 같은 URL로 미리보기 중인 경우 중복 로딩 방지
    if (newImage.src === url && !newImage.classList.contains('hidden')) {
        // 저장 버튼 활성화 및 안내 메시지 처리는 계속 진행
        saveImageBtn.disabled = false;
        
        // URL 변경 여부에 따라 저장 안내 메시지 표시
        if (url !== currentImageUrl.textContent && saveNotice) {
            saveNotice.classList.remove('hidden');
        }
        
        // 변경 예정 정보 업데이트
        updateEditPreview();
        return;
    }
    
    // 기존 미리보기 이미지 숨김 및 로딩 표시
    newImage.classList.add('hidden');
    imagePlaceholder.classList.remove('hidden');
    imagePlaceholder.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div><p class="text-gray-400 mt-2">이미지 로딩 중...</p>';
    
    // 이미지 로드 시도
    const tempImg = new Image();
    tempImg.onload = function() {
        // 이미지 로드 성공 - 유효한 이미지 URL
        newImage.src = url;
        newImage.classList.remove('hidden');
        imagePlaceholder.classList.add('hidden');
        
        // 저장 버튼 활성화
        saveImageBtn.disabled = false;
        
        // 변경 예정 정보 업데이트
        updateEditPreview();
        
        // 저장 안내 메시지 표시
        if (saveNotice) {
            saveNotice.classList.remove('hidden');
        }
        
        showToast('이미지를 가져왔습니다. 저장 버튼을 클릭하여 변경사항을 적용하세요.', 'info');
        console.log('이미지 미리보기 성공:', url);
    };
    
    tempImg.onerror = function() {
        // 이미지 로드 실패 - 유효하지 않은 이미지 URL
        imagePlaceholder.innerHTML = '<i class="fas fa-exclamation-circle text-4xl text-red-500 mb-2"></i><p class="text-gray-400">이미지를 불러올 수 없습니다</p>';
        newImage.classList.add('hidden');
        saveImageBtn.disabled = true;
        console.error('이미지 미리보기 실패:', url);
        showToast('이미지를 불러올 수 없습니다. URL을 확인해주세요.', 'error');
    };
    
    // CORS 이슈 발생 가능성 처리
    tempImg.crossOrigin = "anonymous";
    tempImg.src = url;
}

/**
 * 변경 예정 정보 업데이트
 */
function updateEditPreview() {
    if (!newImageUrlPreview || !newImageDescriptionPreview) return;
    
    // 현재 이미지 URL과 설명
    const currentUrl = currentImageUrl.textContent;
    const currentDesc = currentImageDescription.textContent;
    
    // 새 정보
    const newUrl = newImage.src || imageUrlInput.value.trim();
    const newDesc = imageDescription.value.trim();
    
    // URL 변경 여부를 추적하는 변수
    let urlChanged = false;
    
    // URL 업데이트 및 스타일 변경
    if (newUrl && newUrl !== 'about:blank' && newUrl !== window.location.href) {
        newImageUrlPreview.textContent = newUrl;
        // URL이 변경된 경우에만 파란색으로 표시
        if (newUrl !== currentUrl) {
            newImageUrlPreview.classList.add('text-blue-600');
            newImageUrlPreview.classList.remove('text-gray-800');
            urlChanged = true; // URL이 변경됨
        } else {
            newImageUrlPreview.classList.remove('text-blue-600');
            newImageUrlPreview.classList.add('text-gray-800');
        }
    } else {
        newImageUrlPreview.textContent = currentUrl;
        newImageUrlPreview.classList.remove('text-blue-600');
        newImageUrlPreview.classList.add('text-gray-800');
    }
    
    // 설명 업데이트 및 스타일 변경
    if (newDesc) {
        newImageDescriptionPreview.textContent = newDesc;
        // 설명이 변경된 경우에만 파란색으로 표시
        if (newDesc !== currentDesc && currentDesc !== "이미지 설명이 없습니다.") {
            newImageDescriptionPreview.classList.add('text-blue-600');
            newImageDescriptionPreview.classList.remove('text-gray-800');
        } else if (newDesc !== "이미지 설명이 없습니다." && currentDesc === "이미지 설명이 없습니다.") {
            // 원래 설명이 없었는데 새로 추가된 경우
            newImageDescriptionPreview.classList.add('text-blue-600');
            newImageDescriptionPreview.classList.remove('text-gray-800');
        } else {
            newImageDescriptionPreview.classList.remove('text-blue-600');
            newImageDescriptionPreview.classList.add('text-gray-800');
        }
    } else {
        newImageDescriptionPreview.textContent = '변경된 설명이 없습니다.';
        newImageDescriptionPreview.classList.remove('text-blue-600');
        newImageDescriptionPreview.classList.add('text-gray-800');
    }
    
    // URL 변경 여부에 따라 저장 안내 메시지 표시/숨김
    if (saveNotice) {
        if (urlChanged) {
            saveNotice.classList.remove('hidden');
        } else {
            saveNotice.classList.add('hidden');
        }
    }
}

/**
 * AI를 사용하여 이미지 생성
 */
function generateImageWithAI() {
    // 코드가 생성되지 않은 경우 기능 비활성화
    if (!hasCode) {
        showWarning('웹사이트 코드가 생성되지 않았습니다. 이미지 생성을 위해 <a href="generate.html" class="text-yellow-800 font-medium underline hover:text-yellow-900">코드 생성 페이지</a>에서 웹사이트 코드를 생성해주세요.');
        return;
    }
    
    // 이미지 설명 가져오기
    const prompt = imageDescription.value.trim();
    
    if (!prompt) {
        showToast('이미지 생성을 위한 설명을 입력해주세요.', 'warning');
        return;
    }
    
    // 선택된 이미지 모델 가져오기
    const selectedModel = getSelectedAIModel('image-ai-model');
    if (!selectedModel) {
        showToast('이미지 생성 모델을 선택해주세요.', 'warning');
        return;
    }
    
    showLoading('AI로 이미지를 생성하는 중...');
    
    // 실제 구현 시에는 실제 API 호출로 대체
    // 현재는 UI/UX 틀만 구현하므로 모의 응답을 표시
    setTimeout(() => {
        hideLoading();
        
        // 모의 결과 - 실제로는 API에서 생성된 이미지 URL을 사용
        const mockGeneratedImageUrl = 'https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=AI+Generated+Image';
        
        // 이미지 미리보기 업데이트
        previewImageFromUrl(mockGeneratedImageUrl);
        
        // 저장 안내 메시지 표시
        if (saveNotice) {
            saveNotice.classList.remove('hidden');
        }
        
        showToast('이미지가 생성되었습니다. 저장 버튼을 클릭하여 변경사항을 적용하세요.', 'success');
    }, 1500);
}

/**
 * 웹에서 이미지 검색
 */
function searchImagesOnWeb() {
    // 코드가 생성되지 않은 경우 기능 비활성화
    if (!hasCode) {
        showWarning('웹사이트 코드가 생성되지 않았습니다. 이미지 검색을 위해 <a href="generate.html" class="text-yellow-800 font-medium underline hover:text-yellow-900">코드 생성 페이지</a>에서 웹사이트 코드를 생성해주세요.');
        return;
    }
    
    // 이미지 설명 가져오기
    const query = imageDescription.value.trim();
    
    if (!query) {
        showToast('이미지 검색을 위한 설명을 입력해주세요.', 'warning');
        return;
    }
    
    // 선택된 텍스트 모델 가져오기
    const selectedModel = getSelectedAIModel('text-ai-model');
    if (!selectedModel) {
        showToast('이미지 검색 모델을 선택해주세요.', 'warning');
        return;
    }
    
    showLoading('이미지를 검색하는 중...');
    
    // 실제 구현 시에는 실제 API 호출로 대체
    // 현재는 UI/UX 틀만 구현하므로 모의 검색 결과 표시
    setTimeout(() => {
        hideLoading();
        
        // 검색 결과 컨테이너 초기화 및 표시
        searchResults.innerHTML = '';
        searchResults.classList.remove('hidden');
        
        // 모의 검색 결과 - 실제로는 API 응답에서 이미지 URL 목록을 사용
        const mockSearchResults = [
            { url: 'https://via.placeholder.com/400x300/FF5733/FFFFFF?text=Search+1' },
            { url: 'https://via.placeholder.com/400x300/33FF57/FFFFFF?text=Search+2' },
            { url: 'https://via.placeholder.com/400x300/3357FF/FFFFFF?text=Search+3' },
            { url: 'https://via.placeholder.com/400x300/F3FF33/000000?text=Search+4' },
            { url: 'https://via.placeholder.com/400x300/33FFF3/000000?text=Search+5' },
            { url: 'https://via.placeholder.com/400x300/FF33F3/FFFFFF?text=Search+6' }
        ];
        
        // 검색 결과 표시
        mockSearchResults.forEach((result, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'relative';
            
            const img = document.createElement('img');
            img.className = 'search-result-image';
            img.src = result.url;
            img.alt = `검색 결과 ${index + 1}`;
            img.dataset.url = result.url;
            
            // 이미지 클릭 이벤트
            img.addEventListener('click', () => {
                // 이전 선택 해제
                searchResults.querySelectorAll('.search-result-image').forEach(image => {
                    image.classList.remove('selected');
                });
                
                // 현재 이미지 선택
                img.classList.add('selected');
                selectedSearchImage = result.url;
                
                // 입력 필드에 URL 설정 및 미리보기 업데이트
                imageUrlInput.value = result.url;
                previewImageFromUrl(result.url);
                
                // 저장 안내 메시지 표시
                if (saveNotice) {
                    saveNotice.classList.remove('hidden');
                }
                
                showToast('이미지를 선택했습니다. 저장 버튼을 클릭하여 변경사항을 적용하세요.', 'info');
            });
            
            imgContainer.appendChild(img);
            searchResults.appendChild(imgContainer);
        });
        
        showToast('검색 결과가 로드되었습니다. 이미지를 선택한 후 저장 버튼을 클릭하세요.', 'success');
    }, 1000);
}

/**
 * 선택된 AI 모델 정보 가져오기
 * @param {string} modelSelectorId - 모델 선택기 ID
 * @returns {Object|null} 선택된 모델 정보 또는 null
 */
function getSelectedAIModel(modelSelectorId) {
    try {
        const modelSelect = document.getElementById(modelSelectorId);
        if (!modelSelect) return null;
        
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        if (!selectedOption) return null;
        
        const provider = selectedOption.dataset.provider;
        const modelName = selectedOption.value;
        
        return {
            provider: provider,
            name: modelName
        };
    } catch (error) {
        console.error('모델 정보 가져오기 오류:', error);
        return null;
    }
}

/**
 * 이미지 변경 사항 저장
 */
function saveImageChanges() {
    // 코드가 생성되지 않은 경우 기능 비활성화
    if (!hasCode) {
        showWarning('웹사이트 코드가 생성되지 않았습니다. 이미지 저장을 위해 <a href="generate.html" class="text-yellow-800 font-medium underline hover:text-yellow-900">코드 생성 페이지</a>에서 웹사이트 코드를 생성해주세요.');
        return;
    }
    
    if (!currentEditingImageKey) {
        showToast('수정할 이미지 정보가 없습니다.', 'error');
        return;
    }
    
    const newImageUrl = newImage.src;
    const newDescription = imageDescription.value.trim();
    
    if (!newImageUrl && !newDescription) {
        showToast('변경된 내용이 없습니다.', 'warning');
        return;
    }
    
    showLoading('이미지 변경사항을 저장하는 중...');
    
    try {
        // 로컬 스토리지에서 현재 이미지 데이터 가져오기
        const imagesData = getImagesFromLocalStorage();
        
        if (!imagesData || !imagesData.images) {
            throw new Error('이미지 데이터를 찾을 수 없습니다.');
        }
        
        // 현재 편집 중인 이미지 찾기
        const imageIndex = imagesData.images.findIndex(img => img.key === currentEditingImageKey);
        
        if (imageIndex === -1) {
            throw new Error('수정할 이미지를 찾을 수 없습니다.');
        }
        
        // 이미지 정보 업데이트
        if (newImageUrl && newImageUrl !== currentImage.src) {
            imagesData.images[imageIndex].url = newImageUrl;
        }
        
        // 설명 업데이트
        imagesData.images[imageIndex].desc = newDescription;
        
        // 타임스탬프 업데이트
        imagesData.images[imageIndex].timestamp = new Date().toISOString();
        imagesData.updated_at = new Date().toISOString();
        
        // 로컬 스토리지에 저장
        localStorage.setItem(LOCAL_STORAGE_KEYS.image, JSON.stringify(imagesData));
        
        // 완료 후 UI 갱신
        setTimeout(() => {
            hideLoading();
            hideEditSection();
            loadImageList();
            showToast('이미지가 성공적으로 업데이트되었습니다.', 'success');
        }, 500);
    } catch (error) {
        console.error('이미지 저장 오류:', error);
        hideLoading();
        showToast(error.message || '이미지 저장에 실패했습니다.', 'error');
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initPage); 