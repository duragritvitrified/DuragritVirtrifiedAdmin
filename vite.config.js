import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { testSmtpHandshake, sendSmtpMail } from './smtpClient.js';

const SYNC_STORE_PATH = path.resolve(__dirname, 'supabase', '.dev-sync-cache.json');

const EMPTY_SYNC_STATE = {
  skus: [],
  users: [],
  vendors: [],
  batches: [],
  claims: [],
  appInstalls: [],
  updatedAt: 0,
};

function readSyncStore() {
  try {
    if (!fs.existsSync(SYNC_STORE_PATH)) {
      fs.mkdirSync(path.dirname(SYNC_STORE_PATH), { recursive: true });
      fs.writeFileSync(SYNC_STORE_PATH, JSON.stringify(EMPTY_SYNC_STATE, null, 2), 'utf8');
      return { ...EMPTY_SYNC_STATE };
    }
    const raw = fs.readFileSync(SYNC_STORE_PATH, 'utf8');
    return { ...EMPTY_SYNC_STATE, ...JSON.parse(raw) };
  } catch (_) {
    return { ...EMPTY_SYNC_STATE };
  }
}

function writeSyncStore(nextState) {
  try {
    fs.mkdirSync(path.dirname(SYNC_STORE_PATH), { recursive: true });
    const payload = {
      ...EMPTY_SYNC_STATE,
      ...nextState,
      updatedAt: Date.now(),
    };
    fs.writeFileSync(SYNC_STORE_PATH, JSON.stringify(payload, null, 2), 'utf8');
    return payload;
  } catch (_) {
    return nextState;
  }
}

function crossPortSyncPlugin() {
  return {
    name: 'duragrit-cross-port-sync',
    configureServer(server) {
      server.middlewares.use('/api/dev-sync', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          res.statusCode = 200;
          res.end(JSON.stringify(readSyncStore()));
          return;
        }

        if (req.method === 'DELETE') {
          const reset = writeSyncStore({ ...EMPTY_SYNC_STATE, resetToken: Date.now() });
          res.statusCode = 200;
          res.end(JSON.stringify(reset));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body || '{}');
              const current = readSyncStore();
              const merged = writeSyncStore({
                ...current,
                ...incoming,
              });
              res.statusCode = 200;
              res.end(JSON.stringify(merged));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), crossPortSyncPlugin()],
  envDir: '.',
  server: {
    port: 3000,
    host: true,
  },
});

