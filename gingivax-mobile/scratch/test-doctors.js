// test-doctors.js
const http = require('http');

const testUrl = 'http://172.20.10.2:3000/api/mobile/doctors';

console.log('Fetching doctors from:', testUrl);
http.get(testUrl, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log('Success:', parsed.success);
      if (parsed.success) {
        console.log('Doctors count:', parsed.doctors.length);
        parsed.doctors.forEach(doc => {
          console.log(`- Name: ${doc.name}, Image field: "${doc.image}"`);
        });
      } else {
        console.log('Error in response:', parsed);
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
    }
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
