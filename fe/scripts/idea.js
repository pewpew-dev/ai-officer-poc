import { LOCAL_STORAGE_KEYS } from '../configs/config.js';
import { PROMPT_TEMPLATES } from '../configs/config.js';
import { apiEndpoints } from '../configs/config.js';
import { 
    createModelSelector, 
    getSelectedModel, 
    callSecureApi,
    showLoading, 
    hideLoading,
    alertDialog,
    confirmDialog
} from './common.js';

// DOM 요소를 미리 초기화
const domElements = {
    ideaInput: null,
    generateBtn: null,
    resultSection: null,
    emptyState: null,
    planningDoc: null,
    designRequirements: null,
    saveBtn: null,
    clearBtn: null,
    controlsContainer: null,
    nextStepGuide: null
};

// DOM 요소 참조 초기화 함수
function initDomElements() {
    domElements.ideaInput = document.getElementById('idea-input');
    domElements.generateBtn = document.getElementById('generate-btn');
    domElements.resultSection = document.getElementById('result-section');
    domElements.emptyState = document.getElementById('empty-state');
    domElements.planningDoc = document.getElementById('planning-doc');
    domElements.designRequirements = document.getElementById('design-requirements');
    domElements.saveBtn = document.getElementById('save-btn');
    domElements.clearBtn = document.getElementById('clear-btn');
    domElements.controlsContainer = document.getElementById('controls-container');
    domElements.nextStepGuide = document.getElementById('next-step-guide');
}

// 이벤트 리스너 설정 함수
function setupEventListeners() {
    // 기획안 생성
    domElements.generateBtn.addEventListener('click', generatePlanningDoc);
    
    // 결과 저장
    domElements.saveBtn.addEventListener('click', savePlanningDoc);
    
    // 초기화 (저장된 값으로 되돌리기)
    domElements.clearBtn.addEventListener('click', async () => {
        await resetToSaved();
    });
    
    // 텍스트 영역 변경 감지 - 자동 저장 기능 제거
    domElements.planningDoc.addEventListener('input', () => {
        console.log('기획안이 수정되었습니다. 저장 버튼을 눌러 저장하세요.');
    });
    
    domElements.designRequirements.addEventListener('input', () => {
        console.log('디자인 요구사항이 수정되었습니다. 저장 버튼을 눌러 저장하세요.');
    });
    
    // 아이디어 입력 필드 변경 감지 (아이디어만 자동 저장 유지)
    domElements.ideaInput.addEventListener('input', handleIdeaInputChange);
}

// 아이디어 입력 필드 변경 감지 핸들러
function handleIdeaInputChange() {
    // 아이디어가 변경될 때마다 로컬 스토리지에 저장
    saveIdeaToLocalStorage();
    console.log('아이디어가 변경되어 자동 저장되었습니다.');
}

// 아이디어만 로컬 스토리지에 저장하는 함수
function saveIdeaToLocalStorage() {
    const ideaContent = domElements.ideaInput.value;
    if (!ideaContent) return; // 내용이 없으면 저장하지 않음
    
    // 아이디어는 오직 idea 키에만 저장하고, planning 키에는 더 이상 저장하지 않음
    const ideaData = {
        content: ideaContent,
        updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_KEYS.idea, JSON.stringify(ideaData));
    
    console.log('아이디어가 idea 키에 저장되었습니다.');
}

// 모델 선택기 초기화
let modelSelector;

// 페이지 초기화 - DOMContentLoaded 이벤트에서 실행
document.addEventListener('DOMContentLoaded', async () => {
    console.log('아이디어 페이지 초기화 시작');
    
    // DOM 요소 초기화
    initDomElements();
    
    // 모델 선택기 생성 (텍스트 모델만 표시)
    modelSelector = createModelSelector(
        '#model-selector-container', 
        'all', 
        'text', 
        'idea-model', 
        '', 
        (provider, model) => {
            console.log(`선택된 모델: ${provider} - ${model}`);
        }
    );
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 저장된 데이터 불러오기
    loadSavedData();
    
    console.log('아이디어 페이지 초기화 완료');
});

// 모델별 API 요청 데이터 구성
function buildApiRequestData(selectedModel, idea) {
    const baseData = {
        type: selectedModel.type,
        model: selectedModel.name
    };
    
    // 모델 제공자별 특화된 요청 데이터 구성
    switch (selectedModel.provider) {
        case 'openai':
            return {
                ...baseData,
                messages: [
                    {
                        role: 'system',
                        content: PROMPT_TEMPLATES.planner_ai.system_prompt
                    },
                    {
                        role: 'user',
                        content: PROMPT_TEMPLATES.planner_ai.user_prompt_template.replace('{user_description}', idea)
                    }
                ]
            };
            
        case 'google':
            // 백엔드 구현과 일치하도록 수정 - contents[0]이 직접 sendMessage()에 전달됨
            return {
                ...baseData,
                contents: [
                    // 백엔드는 contents[0]을 직접 chat.sendMessage()에 전달하므로
                    // text 형식의 문자열을 직접 전달
                    PROMPT_TEMPLATES.planner_ai.system_prompt + "\n\n" + 
                    PROMPT_TEMPLATES.planner_ai.user_prompt_template.replace('{user_description}', idea)
                ]
            };
            
        case 'anthropic':
            return {
                ...baseData,
                system: PROMPT_TEMPLATES.planner_ai.system_prompt,
                messages: [
                    {
                        role: 'user',
                        content: PROMPT_TEMPLATES.planner_ai.user_prompt_template.replace('{user_description}', idea)
                    }
                ]
            };
            
        default:
            throw new Error('지원되지 않는 모델 제공자입니다.');
    }
}

// 기획안 생성
async function generatePlanningDoc() {
    const idea = domElements.ideaInput.value.trim();
    if (!idea) {
        alertDialog('아이디어를 입력해주세요.');
        return;
    }

    try {
        // 로딩 인디케이터 표시
        showLoading();
        domElements.generateBtn.disabled = true;

        // 선택된 모델 정보 가져오기
        const selectedModel = getSelectedModel('idea-model');
        if (!selectedModel) {
            throw new Error('모델을 선택해주세요.');
        }
        
        // 제공자에 따른 API 엔드포인트 선택
        let endpoint;
        switch (selectedModel.provider) {
            case 'openai':
                endpoint = apiEndpoints.backend.openai;
                break;
            case 'google':
                endpoint = apiEndpoints.backend.google;
                break;
            case 'anthropic':
                endpoint = apiEndpoints.backend.anthropic;
                break;
            default:
                throw new Error('지원되지 않는 모델 제공자입니다.');
        }
        
        // 요청 데이터 구성
        const requestData = buildApiRequestData(selectedModel, idea);
        console.log(`API 호출: ${endpoint} 모델: ${selectedModel.provider} - ${selectedModel.name}`);
        
        // 보안 API 호출 함수 사용 (자동으로 로그인 페이지 리다이렉트 처리)
        const data = await callSecureApi(endpoint, 'POST', requestData);
        
        if (!data.success) throw new Error(data.message || '기획안 생성 실패');

        // 결과 파싱 및 표시
        const content = data.data.content;
        const sections = content.split('## ');
        
        // 기획서와 디자인 요구사항 분리
        const planningSection = sections.find(s => s.startsWith('웹사이트 기획서'));
        const designSection = sections.find(s => s.startsWith('디자인 요구사항'));

        // Markdown 형식 그대로 textarea에 표시
        if (planningSection) {
            // '웹사이트 기획서' 헤더를 포함하여 표시 (마크다운 형식 유지)
            domElements.planningDoc.value = `## 웹사이트 기획서\n${planningSection.replace('웹사이트 기획서', '').trim()}`;
        }
        if (designSection) {
            // '디자인 요구사항' 헤더를 포함하여 표시 (마크다운 형식 유지)
            domElements.designRequirements.value = `## 디자인 요구사항\n${designSection.replace('디자인 요구사항', '').trim()}`;
        }

        // AI로 생성된 결과를 바로 저장
        saveToLocalStorage();
        
        // 결과 섹션 표시
        domElements.resultSection.classList.remove('hidden');
        domElements.emptyState.classList.add('hidden');

    } catch (error) {
        console.error('기획안 생성 오류:', error);
        alertDialog(error.message || '기획안 생성 중 오류가 발생했습니다.');
    } finally {
        // 로딩 인디케이터 숨기기
        hideLoading();
        domElements.generateBtn.disabled = false;
    }
}

// 결과 저장 (수정된 내용 포함)
function savePlanningDoc() {
    try {
        if (saveToLocalStorage()) {
            // 성공 메시지 표시 - 저장 시간 표시 추가
            const now = new Date().toLocaleTimeString('ko-KR');
            alertDialog(`기획안이 저장되었습니다. (${now})`);
            console.log(`기획안 수동 저장 완료 (${now})`);
            
            // 다음 단계 안내 표시
            showNextStepGuide();
        } else {
            // 저장 실패 메시지
            alertDialog('저장 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('저장 오류:', error);
        alertDialog('저장 중 오류가 발생했습니다: ' + error.message);
    }
}

// 로컬 스토리지에 저장하는 함수
function saveToLocalStorage() {
    try {
        const planningContent = domElements.planningDoc.value;
        const designContent = domElements.designRequirements.value;
        
        // 기획안에 아이디어를 더 이상 포함하지 않음
        const dataToSave = {
            planning: planningContent,
            design: designContent,
            updatedAt: new Date().toISOString()
        };
        
        // 로컬 스토리지에 저장
        localStorage.setItem(LOCAL_STORAGE_KEYS.planning, JSON.stringify(dataToSave));
        
        console.log('기획안이 로컬 스토리지에 저장되었습니다 (아이디어 제외).');
        // 변경 내용이 저장되었음을 UI에 표시할 수 있는 코드 추가 가능
        
        // 다음 단계 안내 표시
        showNextStepGuide();
        
        return true;
    } catch (error) {
        console.error('로컬 스토리지 저장 오류:', error);
        return false;
    }
}

// 다음 단계 안내 표시 함수
function showNextStepGuide() {
    // 기획서와 디자인 요구사항이 모두 있을 때만 표시
    if (domElements.planningDoc.value.trim() && domElements.designRequirements.value.trim()) {
        domElements.nextStepGuide.classList.remove('hidden');
    }
}

// 저장된 값으로 초기화 (새로운 함수)
async function resetToSaved() {
    const confirmed = await confirmDialog('현재 수정 중인 내용이 저장된 값으로 되돌려집니다. 계속하시겠습니까?');
    if (confirmed) {
        // 저장된 값을 다시 불러와서 표시
        loadSavedData();
        console.log('저장된 값으로 되돌렸습니다.');
    }
}

// 저장된 데이터 불러오기
function loadSavedData() {
    try {
        // 아이디어 데이터 불러오기 (별도 처리)
        const savedIdeaData = localStorage.getItem(LOCAL_STORAGE_KEYS.idea);
        if (savedIdeaData) {
            try {
                const parsedIdea = JSON.parse(savedIdeaData);
                if (parsedIdea.content) {
                    domElements.ideaInput.value = parsedIdea.content;
                    console.log('저장된 아이디어를 불러왔습니다.');
                }
            } catch (parseError) {
                console.error('저장된 아이디어 데이터 형식이 유효하지 않습니다:', parseError);
            }
        }
        
        // 기획안 데이터 불러오기
        const savedPlanningData = localStorage.getItem(LOCAL_STORAGE_KEYS.planning);
        if (!savedPlanningData) {
            console.log('저장된 기획안 데이터가 없습니다.');
            return;
        }
        
        let parsed;
        try {
            parsed = JSON.parse(savedPlanningData);
        } catch (parseError) {
            console.error('저장된 기획안 데이터 형식이 유효하지 않습니다:', parseError);
            return;
        }
        
        // 기획안 내용 설정
        let hasContent = false;
        
        // 웹사이트 기획서 설정
        if (parsed.planning) {
            // 기존 데이터가 헤더를 포함하고 있지 않다면 추가
            domElements.planningDoc.value = parsed.planning.startsWith('## 웹사이트 기획서') 
                ? parsed.planning 
                : `## 웹사이트 기획서\n${parsed.planning}`;
            hasContent = true;
        }
        
        // 디자인 요구사항 설정
        if (parsed.design) {
            // 기존 데이터가 헤더를 포함하고 있지 않다면 추가
            domElements.designRequirements.value = parsed.design.startsWith('## 디자인 요구사항') 
                ? parsed.design 
                : `## 디자인 요구사항\n${parsed.design}`;
            hasContent = true;
        }
        
        // 결과 섹션 표시
        if (hasContent) {
            domElements.resultSection.classList.remove('hidden');
            domElements.emptyState.classList.add('hidden');
            console.log('저장된 기획안을 불러왔습니다.');
            
            // 다음 단계 안내 표시 여부 확인
            showNextStepGuide();
        }
        
        // 마지막 수정 시간 표시
        if (parsed.updatedAt) {
            const lastUpdated = new Date(parsed.updatedAt);
            const formattedDate = lastUpdated.toLocaleString();
            console.log('마지막 수정 시간:', formattedDate);
        }
    } catch (error) {
        console.error('저장된 데이터 로드 오류:', error);
    }
} 