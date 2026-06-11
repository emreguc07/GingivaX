// test-fetch.js
const http = require('http');

const testUrl = 'http://10.192.168.68:3000/hekimler/elif-nur-guc.jpg';

console.log('Fetching:', testUrl);
http.get(testUrl, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let dataLength = 0;
  res.on('data', (chunk) => {
    dataLength += chunk.length;
  });
  
  res.on('end', () => {
    console.log('Completed. Data length:', dataLength, 'bytes');
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
