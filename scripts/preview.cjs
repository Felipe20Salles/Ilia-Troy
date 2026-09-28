// Static preview only. Online competitive rooms still require Netlify Functions.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
http.createServer((req,res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(pathname.endsWith('/')) pathname += 'index.html';
    if(pathname.startsWith('/.netlify/')) {res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'O competitivo online precisa do servidor Netlify. Esta prévia executa o cooperativo local.'}));}
    const file = path.resolve(root, '.' + pathname);
    if(!file.startsWith(root + path.sep) || pathname.split('/').some(p=>p.startsWith('.')) || pathname.startsWith('/node_modules/')) {
      res.writeHead(403); return res.end('Forbidden');
    }
    fs.readFile(file, (err, bytes) => {
      if(err){res.writeHead(404);return res.end('Not found');}
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
    });
  } catch {res.writeHead(400);res.end('Bad request');}
}).listen(4173,'127.0.0.1',()=>console.log('Ilia: http://127.0.0.1:4173 — cooperativo local; competitivo online requer Netlify.'));
