// ai-service.js
// AI 서비스 호출 관련 함수

// 필요한 변수와 함수 import
import { apiEndpoints, promptTemplates, modelSettings } from '../config.js';
import * as core from './core.js';
import * as ui from './ui-handler.js';

// OpenAI API 호출 함수
export async function callOpenAI(model, systemPrompt, userPrompt) {
    try {
        console.log(`Calling OpenAI API (${model})...`);
        
        // API 요청
        const response = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.openai}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            },
            body: JSON.stringify({
                type: "text",
                model: model,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userPrompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(`OpenAI API Error: ${result.error?.message || 'Unknown error'}`);
        }

        return result.data.content;
    } catch (error) {
        console.error('OpenAI API 호출 오류:', error);
        ui.showErrorModal(`OpenAI API 호출 중 오류가 발생했습니다: ${error.message}`);
        return null;
    }
}

// Google Gemini API 호출 함수
export async function callGoogleGemini(model, prompt) {
    try {
        console.log(`Calling Google Gemini API (${model})...`);
        
        // API 요청
        const response = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.google}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            },
            body: JSON.stringify({
                type: "text",
                model: model,
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Google API Error: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(`Google API Error: ${result.error?.message || 'Unknown error'}`);
        }

        return result.data.content;
    } catch (error) {
        console.error('Google Gemini API 호출 오류:', error);
        ui.showErrorModal(`Google Gemini API 호출 중 오류가 발생했습니다: ${error.message}`);
        return null;
    }
}

// 이미지 생성 함수
export async function generateImage(prompt) {
    try {
        console.log('Generating image with DALL-E...');
        
        // API 요청
        const response = await fetch(`${apiEndpoints.backend.base}${apiEndpoints.backend.openai}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            },
            body: JSON.stringify({
                type: "image",
                model: modelSettings.openai.image,
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`DALL-E API Error: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(`DALL-E API Error: ${result.error?.message || 'Unknown error'}`);
        }

        return result.data;
    } catch (error) {
        console.error('이미지 생성 오류:', error);
        ui.showErrorModal(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
        return null;
    }
}

// 1단계: 아이디어에서 기획 및 디자인 생성
export async function generatePlanning() {
    const idea = core.ideaInput.value.trim();
    if (!idea) {
        ui.showErrorModal('웹사이트 아이디어를 입력해주세요.');
        return;
    }

    try {
        // 로딩 표시
        ui.showLoading(true);
        
        // 현재 단계(1단계) 데이터 저장
        core.saveStepToLocalStorage(1, idea);
        
        // OpenAI API를 사용하여 GPT-4o로 기획 및 디자인 요구사항 생성
        const systemPrompt = promptTemplates.planner_ai.system_prompt;
        const userPrompt = promptTemplates.planner_ai.user_prompt_template.replace('{user_description}', idea);
        
        const response = await callOpenAI('gpt-4o', systemPrompt, userPrompt);
        
        if (response) {
            // 로딩 끝
            ui.showLoading(false);
            
            // 응답 처리
            if (core.planningOutput) core.planningOutput.innerHTML = marked.parse(response);
            if (core.planningEditor) core.planningEditor.value = response; // 에디터에도 내용 설정
            
            // 응답 데이터로 2단계 데이터 저장 (planning과 designRequirements 구분)
            core.saveStepToLocalStorage(2, response);
            
            // 결과가 표시되도록 2단계로 이동
            ui.showStep(2);
        }
    } catch (error) {
        console.error('기획 및 디자인 생성 오류:', error);
        ui.showErrorModal(`기획 및 디자인 생성 중 오류가 발생했습니다: ${error.message}`);
        ui.showLoading(false);
    }
}

// 2단계: 프롬프트 생성
export async function generatePrompts() {
    // 2단계 데이터에서 기획서 가져오기
    const planning = core.stepsMemory.step2 || "";
    
    // 로딩 상태 표시
    ui.showLoading(true);
    
    try {
        // JSON 형식의 기획안에서 각 부분 추출 시도
        let planningPart = planning;
        let designRequirementsPart = planning;
        
        try {
            const planningJson = JSON.parse(planning);
            if (planningJson && planningJson.기획서 && planningJson.디자인_요구사항) {
                planningPart = JSON.stringify(planningJson.기획서, null, 2);
                designRequirementsPart = JSON.stringify(planningJson.디자인_요구사항, null, 2);
            }
        } catch (e) {
            // JSON 파싱 실패, 전체 텍스트를 사용
        }
        
        // JSON 형식으로 응답 요청을 명시
        const systemPrompt = promptTemplates.prompt_generator_ai.system_prompt + 
            "\n중요: 반드시 JSON 형식으로 응답해주세요. 다음 형식을 사용하세요: {\"dalle_prompt\": \"DALL-E 프롬프트 내용...\", \"gpt4o_prompt\": \"GPT-4o 프롬프트 내용...\"}";
            
        // 템플릿 변수 채우기
        const userPrompt = promptTemplates.prompt_generator_ai.user_prompt_template
            .replace('{planning_doc}', planningPart)
            .replace('{design_requirements}', designRequirementsPart) + 
            "\n\n반드시 JSON 형식으로 응답해주세요. 응답은 {\"dalle_prompt\": \"...\", \"gpt4o_prompt\": \"...\"}의 형식이어야 합니다.";

        // OpenAI GPT-4o 사용
        const response = await callOpenAI('gpt-4o', systemPrompt, userPrompt);
        
        if (response) {
            try {
                // JSON 응답 파싱 시도
                let promptData;
                let responseContent = response;
                
                // 응답이 객체 형태인지 확인하고 처리
                try {
                    const responseObj = JSON.parse(response);
                    if (responseObj.success && responseObj.data && responseObj.data.content) {
                        responseContent = responseObj.data.content;
                        console.log("Gemini API 응답에서 content를 추출했습니다:", responseContent);
                    }
                } catch (e) {
                    // 이미 문자열인 경우 그대로 사용
                    console.log("응답이 이미 문자열 형태입니다");
                }
                
                // JSON 형식 문자열을 찾기 위한 정규식
                const jsonRegex = /\{[\s\S]*\}/;
                const match = responseContent.match(jsonRegex);
                
                if (match) {
                    try {
                        promptData = JSON.parse(match[0]);
                    } catch (error) {
                        console.error("JSON 파싱 오류:", error);
                        // JSON 파싱 실패 시 수동으로 JSON 형식 추출 시도
                        try {
                            // dalle_prompt와 gpt4o_prompt 키 찾기
                            const dalleMatch = responseContent.match(/"dalle_prompt"\s*:\s*"([^"]*)"/);
                            const gpt4oMatch = responseContent.match(/"gpt4o_prompt"\s*:\s*"([^"]*)"/);
                            
                            if (dalleMatch && gpt4oMatch) {
                                promptData = {
                                    dalle_prompt: dalleMatch[1],
                                    gpt4o_prompt: gpt4oMatch[1]
                                };
                            }
                        } catch (e) {
                            console.error("수동 파싱 오류:", e);
                            throw new Error("응답을 JSON 형식으로 파싱할 수 없습니다.");
                        }
                    }
                } else {
                    throw new Error("응답에서 JSON 형식을 찾을 수 없습니다.");
                }
                
                // 로딩 상태 종료
                ui.showLoading(false);
                
                // 추출된 프롬프트 저장 및 표시
                if (promptData && promptData.dalle_prompt && promptData.gpt4o_prompt) {
                    core.prompts.dalle = promptData.dalle_prompt;
                    core.prompts.gpt4o = promptData.gpt4o_prompt;
                    
                    // 에디터에 프롬프트 설정
                    if (core.dallePromptEditor) core.dallePromptEditor.value = core.prompts.dalle;
                    if (core.gpt4oPromptEditor) core.gpt4oPromptEditor.value = core.prompts.gpt4o;
                    
                    // 출력 영역에 프롬프트 표시
                    if (core.dallePromptOutput) core.dallePromptOutput.innerHTML = marked.parse(core.prompts.dalle);
                    if (core.gpt4oPromptOutput) core.gpt4oPromptOutput.innerHTML = marked.parse(core.prompts.gpt4o);
                    
                    // DALL-E 프롬프트 문자 수 표시 업데이트
                    ui.updateDallePromptCharCount();
                    
                    // 프롬프트 데이터 저장
                    core.saveStepToLocalStorage(3, core.prompts);
                    
                    // 결과가 표시되도록 3단계로 이동
                    ui.showStep(3);
                } else {
                    throw new Error("추출된 프롬프트 데이터가 유효하지 않습니다.");
                }
            } catch (error) {
                throw new Error(`프롬프트 처리 오류: ${error.message}`);
            }
        }
    } catch (error) {
        console.error('프롬프트 생성 오류:', error);
        ui.showErrorModal(`프롬프트 생성 중 오류가 발생했습니다: ${error.message}`);
        ui.showLoading(false);
    }
}

// 3단계: 이미지 생성
export async function generateImages() {
    console.log("aiService.generateImages 함수 시작");
    
    const dallePrompt = core.prompts.dalle;
    console.log("DALL-E 프롬프트:", dallePrompt);
    
    if (!dallePrompt) {
        console.error("DALL-E 프롬프트가 비어 있습니다");
        ui.showErrorModal('DALL-E 프롬프트가 비어 있습니다.');
        return;
    }

    try {
        // 로딩 상태 표시
        ui.showLoading(true);
        
        // 이미지 URL을 저장할 객체 초기화
        const generatedImages = {};
        
        // 헤더 이미지 생성
        const headerPrompt = dallePrompt
            .replace('{image_type}', '헤더 이미지')
            .replace('{image_description}', '웹사이트 상단의 브랜드 이미지를 나타내는 헤더');
        console.log('헤더 이미지 프롬프트:', headerPrompt);
        
        const headerResponse = await generateImage(headerPrompt);
        
        console.log('헤더 이미지 응답:', headerResponse);
        
        if (headerResponse && headerResponse.images && headerResponse.images.length > 0) {
            const headerImg = document.getElementById('header-image');
            if (headerImg) {
                headerImg.src = headerResponse.images[0].url;
                headerImg.style.display = 'block';
                // 이미지 URL 저장
                generatedImages.header = { url: headerResponse.images[0].url };
            }
            console.log('헤더 이미지 생성 완료');
            
            // 히어로 이미지 생성
            const heroPrompt = dallePrompt
                .replace('{image_type}', '히어로 이미지')
                .replace('{image_description}', '웹사이트의 주요 내용을 시각적으로 강조하는 큰 배너');
            console.log('히어로 이미지 프롬프트:', heroPrompt);
            
            const heroResponse = await generateImage(heroPrompt);
            
            if (heroResponse && heroResponse.images && heroResponse.images.length > 0) {
                const heroImg = document.getElementById('hero-image');
                if (heroImg) {
                    heroImg.src = heroResponse.images[0].url;
                    heroImg.style.display = 'block';
                    // 이미지 URL 저장
                    generatedImages.hero = { url: heroResponse.images[0].url };
                }
                console.log('히어로 이미지 생성 완료');
                
                // 콘텐츠 이미지 1 생성
                const content1Prompt = dallePrompt
                    .replace('{image_type}', '콘텐츠 이미지 1')
                    .replace('{image_description}', '웹사이트 본문에 사용될 콘텐츠 관련 이미지');
                console.log('콘텐츠 이미지 1 프롬프트:', content1Prompt);
                
                const content1Response = await generateImage(content1Prompt);
                
                if (content1Response && content1Response.images && content1Response.images.length > 0) {
                    const content1Img = document.getElementById('content-image-1');
                    if (content1Img) {
                        content1Img.src = content1Response.images[0].url;
                        content1Img.style.display = 'block';
                        // 이미지 URL 저장
                        generatedImages.content1 = { url: content1Response.images[0].url };
                    }
                    console.log('콘텐츠 이미지 1 생성 완료');
                    
                    // 콘텐츠 이미지 2 생성
                    const content2Prompt = dallePrompt
                        .replace('{image_type}', '콘텐츠 이미지 2')
                        .replace('{image_description}', '웹사이트 본문에 사용될 콘텐츠 관련 이미지');
                    console.log('콘텐츠 이미지 2 프롬프트:', content2Prompt);
                    
                    const content2Response = await generateImage(content2Prompt);
                    
                    if (content2Response && content2Response.images && content2Response.images.length > 0) {
                        const content2Img = document.getElementById('content-image-2');
                        if (content2Img) {
                            content2Img.src = content2Response.images[0].url;
                            content2Img.style.display = 'block';
                            // 이미지 URL 저장
                            generatedImages.content2 = { url: content2Response.images[0].url };
                        }
                        console.log('콘텐츠 이미지 2 생성 완료');
                        
                        // 콘텐츠 이미지 3 생성
                        const content3Prompt = dallePrompt
                            .replace('{image_type}', '콘텐츠 이미지 3')
                            .replace('{image_description}', '웹사이트 본문에 사용될 콘텐츠 관련 이미지');
                        console.log('콘텐츠 이미지 3 프롬프트:', content3Prompt);
                        
                        const content3Response = await generateImage(content3Prompt);
                        
                        if (content3Response && content3Response.images && content3Response.images.length > 0) {
                            const content3Img = document.getElementById('content-image-3');
                            if (content3Img) {
                                content3Img.src = content3Response.images[0].url;
                                content3Img.style.display = 'block';
                                // 이미지 URL 저장
                                generatedImages.content3 = { url: content3Response.images[0].url };
                            }
                            console.log('콘텐츠 이미지 3 생성 완료');
                            
                            // 모든 이미지가 생성되었으므로 데이터 저장 및 다음 단계로 이동
                            core.saveStepToLocalStorage(4, generatedImages);
                            
                            // 이미지 요소 업데이트
                            ui.updateImageElements();
                            
                            // 로딩 끝
                            ui.showLoading(false);
                            
                            // 결과가 표시되도록 4단계로 이동
                            ui.showStep(4);
                        } else {
                            throw new Error('콘텐츠 이미지 3 생성 실패');
                        }
                    } else {
                        throw new Error('콘텐츠 이미지 2 생성 실패');
                    }
                } else {
                    throw new Error('콘텐츠 이미지 1 생성 실패');
                }
            } else {
                throw new Error('히어로 이미지 생성 실패');
            }
        } else {
            throw new Error('헤더 이미지 생성 실패');
        }
    } catch (error) {
        console.error('이미지 생성 오류:', error);
        ui.showErrorModal(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
        ui.showLoading(false);
    }
}

// 4단계: 최종 HTML 코드 생성
export async function generateFinalCode() {
    try {
        // 로딩 상태 표시
        ui.showLoading(true);
        
        // HTML 생성 프롬프트 설정 - GPT-4o 프롬프트 직접 사용
        const userPrompt = promptTemplates.gpt4o_template.user_prompt_template
            .replace('{gpt4o_content}', core.prompts.gpt4o);
            
        // 이미지 URL 정보 추가
        const imageContent = `
## 이미지 플레이스홀더 정보:
- 헤더 이미지: ${document.getElementById('header-image').src}
- 히어로 이미지: ${document.getElementById('hero-image').src}
- 콘텐츠 이미지 1: ${document.getElementById('content-image-1').src}
- 콘텐츠 이미지 2: ${document.getElementById('content-image-2').src}
- 콘텐츠 이미지 3: ${document.getElementById('content-image-3').src}

웹사이트 코드에서는 실제 이미지 URL을 직접 사용해주세요. 모든 HTML, CSS, JavaScript를 단일 파일로 통합하여 완전한 웹사이트를 생성해주세요.`;

        const finalPrompt = userPrompt + '\n\n' + imageContent;
        
        // Gemini API 호출하여 HTML 코드 생성
        const systemPrompt = promptTemplates.gpt4o_template.system_prompt;
        const response = await callGoogleGemini('gemini-1.5-pro', finalPrompt);
        
        if (response) {
            try {
                // 생성된 HTML 코드 추출
                const htmlCode = core.extractCode(response);
                
                // 코드 표시 및 저장
                if (core.generatedCode) core.generatedCode.textContent = htmlCode;
                core.saveStepToLocalStorage(5, htmlCode);
                
                // 미리보기 업데이트
                ui.updatePreview(htmlCode);
                
                // 로딩 상태 종료
                ui.showLoading(false);
                
                // 결과가 표시되도록 5단계로 이동
                ui.showStep(5);
            } catch (error) {
                throw new Error(`HTML 코드 추출 오류: ${error.message}`);
            }
        }
    } catch (error) {
        console.error('HTML 코드 생성 오류:', error);
        ui.showErrorModal(`HTML 코드 생성 중 오류가 발생했습니다: ${error.message}`);
        ui.showLoading(false);
    }
}