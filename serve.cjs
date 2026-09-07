const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  if (!['index.html','theme.css'].includes(name)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', name.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  fs.createReadStream(path.join(__dirname,name)).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('ONU preview: http://127.0.0.1:4173'));
