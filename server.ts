import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './server/routes/authRoutes.js';
import screeningRoutes from './server/routes/screeningRoutes.js';
import jobRoutes from './server/routes/jobRoutes.js';
import statsRoutes from './server/routes/statsRoutes.js';
import settingsRoutes from './server/routes/settingsRoutes.js';
import auditRoutes from './server/routes/auditRoutes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/screenings', screeningRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditRoutes);

// Setup frontend serving
async function setupFrontend() {
  const { default: next } = await import('next');
  const nextApp = next({ dev: !isProd, hostname: 'localhost', port: PORT });
  const handle = nextApp.getRequestHandler();
  
  await nextApp.prepare();

  app.all('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Resume Screening Agent] Server listening on http://localhost:${PORT}`);
  });
}

setupFrontend().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
