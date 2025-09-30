// 간단한 파비콘 생성 스크립트
// og-image.png를 기반으로 다양한 크기의 파비콘 생성

const fs = require('fs');
const path = require('path');

// SVG 파비콘을 다양한 크기로 생성
const sizes = [16, 32, 180, 192, 512];

const svgTemplate = (size, emoji = '💚') => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.floor(size/5)}" fill="url(#gradient)"/>
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <text x="${size/2}" y="${size * 0.72}" text-anchor="middle" font-size="${size * 0.56}" fill="white">${emoji}</text>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');

// favicon.ico용 SVG (간단한 버전)
fs.writeFileSync(
  path.join(publicDir, 'favicon.svg'),
  svgTemplate(32)
);

console.log('✅ Favicon SVG 생성 완료!');
console.log('');
console.log('📝 다음 단계:');
console.log('1. https://realfavicongenerator.net/ 방문');
console.log('2. public/favicon.svg 파일 업로드');
console.log('3. 생성된 파비콘들을 public/ 폴더에 저장');
console.log('');
console.log('또는 og-image.png를 https://favicon.io/favicon-converter/ 에서 변환하세요!');