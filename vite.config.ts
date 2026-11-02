import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function gameCoversPlugin(): Plugin {
  return {
    name: 'game-covers-api',
    configureServer(server) {
      server.middlewares.use('/api/covers', (req, res, next) => {
        const filePath = path.resolve(__dirname, 'src/data/gameCovers.json');

        if (req.method === 'GET') {
          try {
            const data = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '{}';
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Erro ao ler arquivo de capas' }));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const dir = path.dirname(filePath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              let existing: Record<string, string> = {};
              if (fs.existsSync(filePath)) {
                try {
                  existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                } catch {
                  existing = {};
                }
              }
              const updated = { ...existing, ...parsed };
              fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, covers: updated }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Erro ao gravar capa' }));
            }
          });
          return;
        }

        if (req.method === 'DELETE') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const id = parsed.id;
              if (id && fs.existsSync(filePath)) {
                let existing: Record<string, string> = {};
                try {
                  existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                } catch {
                  existing = {};
                }
                delete existing[id];
                fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, covers: existing }));
                return;
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Erro ao remover capa' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gameCoversPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
