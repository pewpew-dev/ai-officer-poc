const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const port = 3000;

// CORS 설정
app.use(cors());

app.use(express.static('fe'));

console.log('프록시 서버 시작 - 포트:', port);

// Firebase Functions 에뮬레이터로 프록시
app.use('/api', createProxyMiddleware({ 
  target: 'http://127.0.0.1:5001/pewpew-453314/us-central1/api',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' 
  },
  onProxyReq: (proxyReq, req, res) => {
    // 디버그 로깅
    console.log('프록시 요청:', req.method, req.path);
    console.log('타겟 URL:', proxyReq.path);
  }
}));

app.listen(port, () => {
  console.log(`프록시 서버가 http://localhost:${port} 에서 실행 중입니다`);
});
