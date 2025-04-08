/**
 * 이미지 관리 JavaScript
 * 웹사이트에서 사용 중인 이미지 목록을 관리하는 기능을 제공합니다.
 */

import { LOCAL_STORAGE_KEYS } from '../configs/config.js';
import { showToast } from './common.js';

// DOM 요소
const imageList = document.getElementById('image-list');
const imageListLoading = document.getElementById('image-list-loading');
const noImagesMessage = document.getElementById('no-images-message');
const imageEditor = document.getElementById('image-editor');
const imageKey = document.getElementById('image-key');
const imageUrl = document.getElementById('image-url');
const imageDescription = document.getElementById('image-description');
const currentImage = document.getElementById('current-image');
const imagePlaceholder = document.getElementById('image-placeholder');
const loadPreviewBtn = document.getElementById('load-preview-btn');
const saveImageBtn = document.getElementById('save-image-btn');
const backToSiteBtn = document.getElementById('back-to-site-btn');
const copyKeyBtn = document.getElementById('copy-key-btn');
const createImageBtn = document.getElementById('create-image-btn');

// 상태 변수
let currentImages = {};
let selectedImageKey = null;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('이미지 관리 페이지 초기화');

    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 이미지 목록 로드
    loadImages();
    
    // URL 파라미터에서 이미지 키 확인
    checkUrlParameter();
});

/**
 * URL 파라미터에서 이미지 키 확인
 */
function checkUrlParameter() {
    try {
        // URL에서 파라미터 추출
        const urlParams = new URLSearchParams(window.location.search);
        const keyParam = urlParams.get('key');
        
        // 키 파라미터가 있으면 해당 이미지 선택
        if (keyParam) {
            console.log(`URL 파라미터에서 이미지 키 발견: ${keyParam}`);
            // 이미지 로드 후 선택하기 위해 setTimeout 사용
            setTimeout(() => {
                if (currentImages && currentImages[keyParam]) {
                    selectImage(keyParam);
                } else {
                    console.log(`키 '${keyParam}'에 해당하는 이미지를 찾을 수 없습니다.`);
                }
            }, 500); // 이미지 로드 후 실행되도록 약간의 지연 적용
        }
    } catch (error) {
        console.error('URL 파라미터 확인 오류:', error);
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 이미지 URL 입력 후 미리보기 버튼
    loadPreviewBtn.addEventListener('click', loadImagePreview);
    
    // URL 필드에서 Enter 키 입력 시 미리보기 로드
    imageUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadImagePreview();
        }
    });
    
    // 저장 버튼
    saveImageBtn.addEventListener('click', saveImageChanges);
    
    // 뒤로가기 버튼
    backToSiteBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // 이미지 키 복사 버튼
    copyKeyBtn.addEventListener('click', () => {
        const key = imageKey.value;
        if (!key) return;
        
        navigator.clipboard.writeText(key)
            .then(() => {
                showToast('이미지 키가 클립보드에 복사되었습니다.', 'success');
            })
            .catch(err => {
                console.error('클립보드 복사 실패:', err);
                showToast('키 복사에 실패했습니다.', 'error');
            });
    });
    
    // 이미지 만들기 버튼 (librarian 페이지로 이동)
    createImageBtn.addEventListener('click', () => {
        // 현재 이미지 설명 저장
        if (selectedImageKey) {
            const description = imageDescription.value.trim();
            
            // 설명을 임시 저장소에 저장
            localStorage.setItem('flowbang-temp-image-description', description);
            
            // librarian 페이지로 이동
            window.location.href = 'librarian.html';
        } else {
            // 선택된 이미지가 없는 경우
            showToast('이미지가 선택되지 않았습니다.', 'warning');
        }
    });
}

/**
 * 로컬 스토리지에서 이미지 목록 로드
 */
function loadImages() {
    try {
        // 로딩 상태 표시
        imageListLoading.classList.remove('hidden');
        noImagesMessage.classList.add('hidden');
        
        // 기존 이미지 항목 제거 (로딩 및 noImages 메시지 제외)
        const imageItems = imageList.querySelectorAll('.image-item');
        imageItems.forEach(item => item.remove());
        
        // 로컬 스토리지에서 이미지 정보 로드
        const imagesJson = localStorage.getItem(LOCAL_STORAGE_KEYS.image);
        
        if (!imagesJson) {
            // 저장된 이미지가 없는 경우
            currentImages = {};
            showNoImagesMessage();
            return;
        }
        
        // 이미지 JSON 파싱
        try {
            const parsedData = JSON.parse(imagesJson);
            
            // generate.js의 구조에 맞춰 처리
            if (parsedData.images && Array.isArray(parsedData.images)) {
                // generate.js 형식: {images: [{key: "KEY", url: "URL", desc: "DESC"}, ...]}
                currentImages = {};
                
                // 배열을 객체 형태로 변환
                parsedData.images.forEach(img => {
                    if (img.key && img.url) {
                        currentImages[img.key] = {
                            url: img.url,
                            description: img.desc || ''
                        };
                    }
                });
            } else {
                // 직접 객체인 경우 (기존 구조)
                currentImages = parsedData;
            }
            
            // 이미지가 없거나 객체가 아닌 경우
            if (!currentImages || typeof currentImages !== 'object' || Object.keys(currentImages).length === 0) {
                currentImages = {};
                showNoImagesMessage();
                return;
            }
            
            // 이미지 목록 렌더링
            renderImageList();
            
            // 기본적으로 첫 번째 이미지를 선택하지 않음
            // URL 파라미터에서 직접 key 값을 받은 경우에만 selectImage 함수를 통해 선택됨
            
        } catch (parseError) {
            console.error('이미지 JSON 파싱 오류:', parseError);
            currentImages = {};
            showNoImagesMessage();
        }
    } catch (error) {
        console.error('이미지 로드 오류:', error);
        showToast('이미지 목록을 불러오는 데 실패했습니다.', 'error');
        showNoImagesMessage();
    } finally {
        // 로딩 상태 숨기기
        imageListLoading.classList.add('hidden');
    }
}

/**
 * 이미지가 없을 때 메시지 표시
 */
function showNoImagesMessage() {
    imageListLoading.classList.add('hidden');
    noImagesMessage.classList.remove('hidden');
    imageEditor.classList.add('hidden');
    selectedImageKey = null;
}

/**
 * 이미지 목록 렌더링
 */
function renderImageList() {
    // 로딩 및 empty 메시지 숨기기
    imageListLoading.classList.add('hidden');
    noImagesMessage.classList.add('hidden');
    
    // 이미지 목록 비우기 (로딩 및 empty 메시지 제외)
    const imageItems = imageList.querySelectorAll('.image-item');
    imageItems.forEach(item => item.remove());
    
    // 이미지가 없는 경우
    if (Object.keys(currentImages).length === 0) {
        showNoImagesMessage();
        return;
    }
    
    // 이미지 목록 채우기
    Object.entries(currentImages).forEach(([key, data]) => {
        // 데이터가 문자열인 경우 (URL만 저장된 경우)
        let url = '';
        let description = '';
        
        if (typeof data === 'string') {
            url = data;
        } else if (typeof data === 'object' && data !== null) {
            url = data.url || '';
            description = data.description || '';
        }
        
        // 이미지 항목 요소 생성
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item flex-shrink-0 w-48 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer';
        imageItem.dataset.key = key;
        
        // 선택된 이미지인 경우 강조 표시
        if (key === selectedImageKey) {
            imageItem.classList.add('ring-2', 'ring-blue-500');
        }
        
        imageItem.innerHTML = `
            <div class="aspect-video bg-gray-100 relative">
                <img src="${url}" alt="${key}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='../assets/placeholder.png'; this.classList.add('p-4');">
            </div>
            <div class="p-2">
                <h3 class="text-sm font-medium text-gray-800 truncate">${key}</h3>
                <p class="text-xs text-gray-500 mt-1 truncate">${description || '설명 없음'}</p>
            </div>
        `;
        
        // 이미지 클릭 이벤트
        imageItem.addEventListener('click', () => {
            selectImage(key);
        });
        
        // 이미지 목록에 추가
        imageList.insertBefore(imageItem, imageListLoading);
    });
}

/**
 * 이미지 선택
 * @param {string} key - 선택할 이미지 키
 */
function selectImage(key) {
    if (!key || !currentImages[key]) return;
    
    // 이전 선택 클래스 제거
    const previousSelected = imageList.querySelector('.image-item.ring-2');
    if (previousSelected) {
        previousSelected.classList.remove('ring-2', 'ring-blue-500');
    }
    
    // 새 이미지 선택
    selectedImageKey = key;
    
    // 현재 선택된 이미지에 클래스 추가
    const currentSelected = imageList.querySelector(`.image-item[data-key="${key}"]`);
    if (currentSelected) {
        currentSelected.classList.add('ring-2', 'ring-blue-500');
        
        // 스크롤 위치를 선택된 이미지로 조정
        currentSelected.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    
    // 이미지 에디터 표시
    imageEditor.classList.remove('hidden');
    
    // 이미지 정보 채우기
    imageKey.value = key;
    
    // 이미지 데이터 가져오기
    const imageData = currentImages[key];
    let url = '';
    let description = '';
    
    if (typeof imageData === 'string') {
        url = imageData;
    } else if (typeof imageData === 'object' && imageData !== null) {
        url = imageData.url || '';
        description = imageData.description || '';
    }
    
    imageUrl.value = url;
    imageDescription.value = description;
    
    // 이미지 미리보기 표시
    updateImagePreview(url);
}

/**
 * 이미지 미리보기 업데이트
 * @param {string} url - 미리보기할 이미지 URL
 */
function updateImagePreview(url) {
    if (!url) {
        // URL이 없는 경우 플레이스홀더 표시
        currentImage.classList.add('hidden');
        imagePlaceholder.classList.remove('hidden');
        return;
    }
    
    // 이미지 로드 시도
    const tempImage = new Image();
    tempImage.onload = () => {
        // 이미지 로드 성공 시 표시
        currentImage.src = url;
        currentImage.classList.remove('hidden');
        imagePlaceholder.classList.add('hidden');
    };
    
    tempImage.onerror = () => {
        // 이미지 로드 실패 시 플레이스홀더 표시
        currentImage.classList.add('hidden');
        imagePlaceholder.classList.remove('hidden');
        showToast('이미지를 불러올 수 없습니다.', 'warning');
    };
    
    // 이미지 로드 시작
    tempImage.src = url;
}

/**
 * 이미지 미리보기 로드
 */
function loadImagePreview() {
    const url = imageUrl.value.trim();
    
    if (!url) {
        showToast('이미지 URL을 입력해주세요.', 'warning');
        return;
    }
    
    // 이미지 미리보기 업데이트
    updateImagePreview(url);
}

/**
 * 이미지 변경사항 저장
 */
function saveImageChanges() {
    if (!selectedImageKey) {
        showToast('선택된 이미지가 없습니다.', 'warning');
        return;
    }
    
    const url = imageUrl.value.trim();
    if (!url) {
        showToast('이미지 URL을 입력해주세요.', 'warning');
        return;
    }
    
    try {
        // 이미지 데이터 준비
        const description = imageDescription.value.trim();
        
        // 이미지 데이터 저장 (객체 형태로 저장)
        currentImages[selectedImageKey] = {
            url: url,
            description: description
        };
        
        // 생성된 이미지 배열 구성 (generate.js 구조와 호환성 유지)
        const imageArray = Object.entries(currentImages).map(([key, data]) => {
            return {
                key: key,
                url: typeof data === 'string' ? data : data.url,
                desc: typeof data === 'string' ? '' : (data.description || '')
            };
        });
        
        // 로컬 스토리지에 저장 (generate.js 구조 형식으로 저장)
        localStorage.setItem(LOCAL_STORAGE_KEYS.image, JSON.stringify({
            images: imageArray,
            generated_at: new Date().toISOString()
        }));
        
        // 이미지 목록 갱신
        renderImageList();
        
        showToast('이미지가 저장되었습니다.', 'success');
    } catch (error) {
        console.error('이미지 저장 오류:', error);
        showToast('이미지 저장에 실패했습니다.', 'error');
    }
} 