import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const root = resolve('dist');
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : 4173);
const types = {'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.css':'text/css','.js':'text/javascript','.pdf':'application/pdf'};
const server = http.createServer(async (req,res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (target !== root && !target.startsWith(root + sep)) {res.writeHead(403).end();return;}
    if (!(await stat(target)).isFile()) {res.writeHead(404).end();return;}
    const data = await readFile(target);
    res.writeHead(200, {'Content-Type':types[extname(target)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {res.writeHead(404).end('Not found');}
});
server.listen(port,'0.0.0.0',()=>console.log('Static portfolio ready on port '+port));
