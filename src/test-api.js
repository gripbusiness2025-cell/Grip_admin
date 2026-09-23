const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/admin/onetoone/list',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data.slice(0, 500));
    }
  });
});

req.on('error', error => {
  console.error(error);
});
req.on('error', error => {
  console.error(error);
});
req.end();
