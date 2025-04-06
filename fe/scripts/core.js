// core.js
// 전역 변수, 초기화 함수, 로컬 스토리지 관련 함수 등

// 다른 JS 파일에서 필요한 함수와 변수 import
import { firebaseConfig, apiEndpoints, LOCAL_STORAGE_KEYS, promptTemplates, modelSettings } from '../config.js';
import { initFirebaseAuth, loadUserUsage, googleLogin, logout } from './auth.js';

// 전역 변수 정의
export let apiKey = '';
export let siteId = '';
export let planningDoc = '';
export let prompts = {
    dalle: '',
    gpt4o: ''
};
export let imageUrls = {
    header: { placeholder: '{{IMAGE_HEADER}}', url: '' },
    hero: { placeholder: '{{IMAGE_HERO}}', url: '' },
    content1: { placeholder: '{{IMAGE_CONTENT1}}', url: '' },
    content2: { placeholder: '{{IMAGE_CONTENT2}}', url: '' },
    content3: { placeholder: '{{IMAGE_CONTENT3}}', url: '' }
};

// DOM 요소 참조
export let ideaInput, apiKeyInput, planningOutput, planningEditor, dallePromptOutput, gpt4oPromptOutput;
export let planningCopyBtn, dallePromptCopyBtn, gpt4oPromptCopyBtn;
export let generatePlanningBtn, generatePromptsBtn, generateImagesBtn, generateCodeBtn;
export let backToIdeaBtn, backToPlanningBtn, backToPromptsBtn, backToImagesBtn;
export let dallePromptEditor, gpt4oPromptEditor;
export let stepContainers, loadingIndicator, errorModal;
export let generatedCode, previewFrame, downloadBtn, deployBtn;
export let dallePromptCharCount;

// DOM 요소 초기화 함수
export function initDomReferences(elements) {
    ideaInput = elements.ideaInput;
    apiKeyInput = elements.apiKeyInput;
    planningOutput = elements.planningOutput;
    planningEditor = elements.planningEditor;
    dallePromptOutput = elements.dallePromptOutput;
    gpt4oPromptOutput = elements.gpt4oPromptOutput;
    
    planningCopyBtn = elements.planningCopyBtn;
    dallePromptCopyBtn = elements.dallePromptCopyBtn;
    gpt4oPromptCopyBtn = elements.gpt4oPromptCopyBtn;
    
    generatePlanningBtn = elements.generatePlanningBtn;
    generatePromptsBtn = elements.generatePromptsBtn;
    generateImagesBtn = elements.generateImagesBtn;
    generateCodeBtn = elements.generateCodeBtn;
    
    backToIdeaBtn = elements.backToIdeaBtn;
    backToPlanningBtn = elements.backToPlanningBtn;
    backToPromptsBtn = elements.backToPromptsBtn;
    backToImagesBtn = elements.backToImagesBtn;
    
    dallePromptEditor = elements.dallePromptEditor;
    gpt4oPromptEditor = elements.gpt4oPromptEditor;
    
    stepContainers = elements.stepContainers;
    loadingIndicator = elements.loadingIndicator;
    errorModal = elements.errorModal;
    
    generatedCode = elements.generatedCode;
    previewFrame = elements.previewFrame;
    downloadBtn = elements.downloadBtn;
    deployBtn = elements.deployBtn;
    
    dallePromptCharCount = elements.dallePromptCharCount;
}

// 로컬 스토리지 관련 함수
export const stepsMemory = {
    step1: null, // 아이디어
    step2: null, // 기획안
    step3: null, // 프롬프트
    step4: null, // 이미지 URL
    step5: null  // 생성된 코드
};

// 로컬스토리지에서 단계 데이터 로드
export function loadStepFromLocalStorage(stepNumber) {
    try {
        const key = LOCAL_STORAGE_KEYS[`step${stepNumber}`];
        const data = localStorage.getItem(key);
        if (data) {
            const parsedData = JSON.parse(data);
            stepsMemory[`step${stepNumber}`] = parsedData;
            return parsedData;
        }
    } catch (error) {
        console.error('로컬 스토리지 로드 오류:', error);
    }
    return null;
}

// 로컬스토리지에 단계 데이터 저장
export function saveStepToLocalStorage(stepNumber, data) {
    try {
        const key = LOCAL_STORAGE_KEYS[`step${stepNumber}`];
        localStorage.setItem(key, JSON.stringify(data));
        // 메모리 객체도 업데이트
        stepsMemory[`step${stepNumber}`] = data;
    } catch (error) {
        console.error('로컬 스토리지 저장 오류:', error);
    }
}

// 단계별 데이터 체크
export function checkStepData(step) {
    return stepsMemory[`step${step}`] !== null;
}

// 사이트 ID 생성 함수
export function generateSiteId() {
    return 'site_' + Math.random().toString(36).substring(2, 11);
}

// HTML/코드 추출 함수
export function extractCode(response) {
    // 응답이 문자열이 아닌 경우 처리
    const responseText = typeof response === 'string' ? response : response;
    
    // HTML 코드 블록 추출 (```html ... ``` 또는 ```... ``` 형식)
    const htmlRegex = /```html\s*([\s\S]*?)\s*```|```\s*([\s\S]*?)\s*```|<!DOCTYPE html>[\s\S]*<\/html>/i;
    const match = responseText.match(htmlRegex);
    
    if (match) {
        // HTML 코드 블록이 있는 경우 추출
        if (match[1]) {
            return match[1].trim();
        } else if (match[2]) {
            return match[2].trim();
        } else {
            return match[0].trim();
        }
    } else {
        // HTML 코드 블록이 없는 경우 전체 텍스트를 반환
        return responseText;
    }
}

// 코드 다운로드 함수
export function downloadCode(code, filename = 'generated_website.html') {
    if (!code) {
        console.error('다운로드할 코드가 없습니다.');
        return;
    }
    
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
}

// 초기화 함수 (다른 파일의 함수들을 import 후 사용할 예정)
export async function init() {
    // DOM 요소 참조 초기화 함수는 추후 import된 다른 모듈 사용 후 구현 예정
}

// 이벤트 리스너 설정 (다른 파일의 함수들을 import 후 사용할 예정)
export function setupEventListeners() {
    // 모든 이벤트 리스너 설정은 추후 import된 다른 모듈 사용 후 구현 예정
}