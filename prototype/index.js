const { createServer } = require('node:http');
var fs = require('fs');

const hostname = '127.0.0.1';
const port = 8888;

const mdFile = './test_text.md';

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  fs.readFile("./index.html", 'utf-8', (err, data) => {
      if (err) throw err;
      res.end(data);
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
