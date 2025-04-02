const fs = require('fs');
const { exec } = require('child_process');

// firebase-config.json 파일 읽기
const config = JSON.parse(fs.readFileSync('./firebase-config.json', 'utf8'));

// 명령어 생성
let command = 'firebase functions:config:set';

// 각 설정 항목에 대해 명령어 구성
Object.keys(config).forEach(section => {
  Object.keys(config[section]).forEach(key => {
    // 값을 적절히 이스케이프
    let value = config[section][key];
    value = value.replace(/"/g, '\\"'); // 큰따옴표 이스케이프
    command += ` ${section}.${key}="${value}"`;
  });
});

// 명령어 출력
console.log('실행할 명령어:');
console.log(command);

// 사용자 확인 후 실행
console.log('\n이 명령어를 직접 복사해서 실행하거나, 엔터를 눌러 스크립트에서 실행하세요.');
process.stdin.once('data', () => {
  console.log('명령어 실행 중...');
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('오류 발생:', error);
      if (stderr) console.error('STDERR:', stderr);
      if (stdout) console.log('STDOUT:', stdout);
      return;
    }
    console.log('환경 설정이 완료되었습니다.');
    console.log(stdout);
  });
});