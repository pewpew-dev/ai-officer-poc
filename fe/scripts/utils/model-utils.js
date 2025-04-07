/**
 * AI 모델 관련 유틸리티 함수
 * 모델 선택, 관리, 설정 기능 제공
 */

import { modelSettings } from '../../configs/config.js';

/**
 * 특정 제공자와 타입에 맞는 모델 목록 가져오기
 * @param {string} provider - 모델 제공자 ('openai', 'google', 'anthropic', 'all')
 * @param {string} type - 모델 타입 ('text', 'image', 'all')
 * @returns {Array} 조건에 맞는 모델 목록
 */
export function getModels(provider = 'all', type = 'all') {
    return modelSettings.filter(model => 
        (provider === 'all' || model.provider === provider) && 
        (type === 'all' || model.type === type)
    );
}

/**
 * 특정 제공자와 타입에 맞는 기본 모델 가져오기
 * @param {string} provider - 모델 제공자
 * @param {string} type - 모델 타입
 * @returns {Object|null} 기본 모델 또는 null (기본 모델이 없는 경우)
 */
export function getDefaultModel(provider = 'all', type = 'text') {
    // 특정 제공자의 기본 모델 찾기 (default 속성이 true인 모델)
    if (provider !== 'all') {
        const defaultModel = modelSettings.find(model => 
            model.provider === provider && 
            model.type === type && 
            model.default === true
        );
        if (defaultModel) return defaultModel;
    }
    
    // 모든 제공자 중 해당 타입의 기본 모델 찾기
    const defaultModel = modelSettings.find(model => 
        (provider === 'all' || model.provider === provider) && 
        model.type === type && 
        model.default === true
    );
    
    if (defaultModel) return defaultModel;
    
    // 기본 모델이 없으면 추천 모델 중에서 첫 번째 찾기
    const recommendedModel = modelSettings.find(model => 
        (provider === 'all' || model.provider === provider) && 
        model.type === type && 
        model.recommended === true
    );
    
    return recommendedModel || null;
}

/**
 * 모델 키 문자열 생성 (provider:name 형식)
 * @param {Object} model - 모델 객체
 * @returns {string} 모델 키 문자열
 */
export function getModelKey(model) {
    return `${model.provider}:${model.name}`;
}

/**
 * 모델 키 문자열에서 모델 객체 가져오기
 * @param {string} modelKey - 모델 키 문자열 (provider:name 형식)
 * @returns {Object|null} 모델 객체 또는 null (존재하지 않는 경우)
 */
export function getModelFromKey(modelKey) {
    if (!modelKey) return null;
    
    const [provider, name] = modelKey.split(':');
    return modelSettings.find(model => 
        model.provider === provider && 
        model.name === name
    ) || null;
}

/**
 * 저장된 모델 정보 가져오기
 * @param {string} name - 셀렉트 박스의 이름
 * @returns {Object|null} {provider, model} 형식의 객체 또는 null (저장된 값이 없는 경우)
 */
export function getSelectedModel(name = 'selected-model') {
    const storageKey = `flowbang-model-${name}`;
    const savedModelKey = localStorage.getItem(storageKey);
    
    if (savedModelKey) {
        return getModelFromKey(savedModelKey);
    }
    
    // 저장된 값이 없으면 기본 모델 반환
    return getDefaultModel('all', 'text');
}

/**
 * 모델 선택 셀렉트 박스를 생성하여 지정된 선택자 위치에 삽입
 * @param {string} selector - 셀렉트 박스를 삽입할 위치의 CSS 선택자
 * @param {string} provider - 모델 제공자 (openai, google, anthropic, all)
 * @param {string} type - 모델 타입 (text, image, all)
 * @param {string} name - 셀렉트 박스의 이름 (로컬 스토리지에 저장될 키로도 사용됨)
 * @param {string} defaultValue - 기본값 (provider:name 형식, 예: openai:gpt-4o)
 * @param {Function} onChange - 선택 변경 시 호출될 콜백 함수
 * @param {Object} customStyles - 커스텀 스타일 옵션 (containerClass, labelClass, selectClass, labelText)
 * @returns {HTMLSelectElement} 생성된 셀렉트 박스 요소
 */
export function createModelSelector(
    selector, 
    provider = 'all', 
    type = 'text', 
    name = 'selected-model', 
    defaultValue = '', 
    onChange = null,
    customStyles = null
) {
    console.log(`모델 선택기 생성: ${selector} (${provider}/${type})`);
    
    // 로컬 스토리지 키 생성
    const storageKey = `flowbang-model-${name}`;
    
    // 대상 요소 찾기
    const targetElement = document.querySelector(selector);
    if (!targetElement) {
        console.warn(`선택자 '${selector}'에 해당하는 요소를 찾을 수 없습니다.`);
        return null;
    }
    
    // 기본 스타일 정의
    const styles = {
        containerClass: 'model-selector-container flex items-center w-full',
        labelClass: 'mr-2 text-sm font-medium text-gray-700 whitespace-nowrap',
        selectClass: 'flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
        labelText: '모델:'
    };
    
    // 커스텀 스타일 적용 (제공된 경우)
    if (customStyles) {
        Object.assign(styles, customStyles);
    }
    
    // 컨테이너 생성
    const container = document.createElement('div');
    container.className = styles.containerClass;
    
    // 라벨 생성
    const label = document.createElement('label');
    label.setAttribute('for', name);
    label.className = styles.labelClass;
    label.textContent = styles.labelText;
    
    // 셀렉트 박스 생성
    const select = document.createElement('select');
    select.id = name;
    select.name = name;
    select.className = styles.selectClass;
    
    // 모델 목록 채우기
    let optionAdded = false;
    
    // 로컬 스토리지에서 이전 선택 가져오기
    const savedModel = localStorage.getItem(storageKey) || defaultValue;
    
    // 기본값이 없으면 해당 타입의 기본 모델 가져오기
    const defaultModel = defaultValue || (() => {
        const model = getDefaultModel(provider, type);
        return model ? getModelKey(model) : '';
    })();
    
    // 필터링된 모델 목록 가져오기
    const filteredModels = getModels(provider, type);
    
    // 제공자별로 그룹화
    const groupedModels = filteredModels.reduce((acc, model) => {
        if (!acc[model.provider]) {
            acc[model.provider] = [];
        }
        acc[model.provider].push(model);
        return acc;
    }, {});
    
    // 모델 그룹 생성
    Object.entries(groupedModels).forEach(([providerKey, models]) => {
        // 제공자별 모델 그룹 생성
        const optgroup = document.createElement('optgroup');
        optgroup.label = getProviderName(providerKey);
        
        // 해당 제공자의 모델 추가
        models.forEach(model => {
            const option = document.createElement('option');
            const optionValue = getModelKey(model);
            option.value = optionValue;
            option.textContent = `${getModelTypeName(model.type)}: ${model.name}`;
            
            // 추천 모델 표시
            if (model.recommended) {
                option.textContent += ' (추천)';
            }
            
            // 저장된 값이나 기본값과 일치하면 선택
            if (savedModel === optionValue || (!savedModel && model.default === true)) {
                option.selected = true;
            }
            
            optgroup.appendChild(option);
            optionAdded = true;
        });
        
        // 옵션이 추가된 경우에만 그룹 추가
        if (optgroup.children.length > 0) {
            select.appendChild(optgroup);
        }
    });
    
    // 옵션이 하나도 없으면 경고
    if (!optionAdded) {
        console.warn(`제공자 '${provider}'와 타입 '${type}'에 해당하는 모델이 없습니다.`);
        return null;
    }
    
    // 변경 이벤트 처리
    select.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        console.log(`모델 선택 변경: ${selectedValue}`);
        
        // 로컬 스토리지에 저장
        localStorage.setItem(storageKey, selectedValue);
        
        // 콜백 함수 호출 (있는 경우)
        if (typeof onChange === 'function') {
            const model = getModelFromKey(selectedValue);
            if (model) {
                onChange(model.provider, model.name, selectedValue);
            }
        }
    });
    
    // 요소 조립 및 삽입
    container.appendChild(label);
    container.appendChild(select);
    targetElement.appendChild(container);
    
    // 초기 값 설정 (이벤트 발생시키지 않음)
    if (savedModel && select.value !== savedModel) {
        select.value = savedModel;
    }
    
    console.log(`모델 선택기 생성 완료: ${name}`);
    return select;
}

/**
 * 제공자 이름을 사람이 읽기 쉬운 형태로 변환
 * @param {string} provider - 제공자 키
 * @returns {string} 사람이 읽기 쉬운 제공자 이름
 */
function getProviderName(provider) {
    const providerNames = {
        'openai': 'OpenAI',
        'google': 'Google',
        'anthropic': 'Anthropic'
    };
    return providerNames[provider] || provider;
}

/**
 * 모델 타입을 사람이 읽기 쉬운 형태로 변환
 * @param {string} type - 모델 타입
 * @returns {string} 사람이 읽기 쉬운 모델 타입
 */
function getModelTypeName(type) {
    const typeNames = {
        'text': '텍스트',
        'image': '이미지'
    };
    return typeNames[type] || type;
} 