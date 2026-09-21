import './load-env.mjs';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb } from './db.mjs';
import subscribeRouter from './routes/subscribe.mjs';

const app = express();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const port = Number(process.env.PORT || 5000);

app.use(express.json({ limit: '16kb' }));
app.use(express.static(distDir, { index: 'index.html', maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'aditya-portfolio' });
});

app.use('/api/subscribe', subscribeRouter);

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

async function start() {
  await initDb();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Portfolio ready on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
