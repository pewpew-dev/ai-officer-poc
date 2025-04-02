/**
 * OpenAI 관련 설정
 */

// OpenAI 기본 설정
const openAIDefaults = {
  defaultModel: 'gpt-4o',
  imageSettings: {
    n: 1,
    size: '1024x1024'
  }
};

// 토큰 수 계산 함수 (대략적인 추정)
const estimateTokens = (text) => {
  if (!text) return 0;
  // 영문 기준 약 4자당 1토큰, 한글은 약 1.5자당 1토큰
  // 영문 기준 약 4자당 1토큰, 한글은 약 1.5자당 1토큰
  // 간단한 추정 공식: 영문자 길이 ÷ 4 + 한글 길이 ÷ 1.5
  
  const englishChars = text.replace(/[^a-zA-Z0-9]/g, '').length;
  const koreanChars = text.replace(/[a-zA-Z0-9]/g, '').length;
  
  return Math.ceil(englishChars / 4 + koreanChars / 1.5);
};

module.exports = {
  openAIDefaults,
  estimateTokens
};
