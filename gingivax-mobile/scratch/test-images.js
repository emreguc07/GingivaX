const http = require('http');

const urls = [
  'http://10.192.168.68:3000/dr-perio.png',
  'http://10.192.168.68:3000/hekimler/elif-nur-guc.jpg'
];

urls.forEach(url => {
  http.get(url, (res) => {
    console.log(`${url} -> Status Code: ${res.statusCode}, Content-Type: ${res.headers['content-type']}`);
  }).on('error', (err) => {
    console.error(`Error requesting ${url}:`, err.message);
  });
});
