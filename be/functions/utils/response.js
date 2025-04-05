// API 응답 생성 헬퍼 함수
const createResponse = (res, status, success, data, errorCode, errorMessage) => {
  const response = { success };
  
  if (success) {
    response.data = data;
  } else {
    response.error = {
      code: errorCode,
      message: errorMessage
    };
  }
  
  return res.status(status).json(response);
};

module.exports = {
  createResponse
};
