import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings();
  return res.json(settings);
});

router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { n8nWebhookUrl, n8nEnabled, defaultJobId, companyName } = req.body;
  const updated = db.updateSettings({
    n8nWebhookUrl: typeof n8nWebhookUrl === 'string' ? n8nWebhookUrl.trim() : undefined,
    n8nEnabled: typeof n8nEnabled === 'boolean' ? n8nEnabled : undefined,
    defaultJobId: typeof defaultJobId === 'string' ? defaultJobId : undefined,
    companyName: typeof companyName === 'string' ? companyName : undefined
  });

  db.addAuditLog({
    recruiterEmail: req.user!.email,
    action: 'SETTINGS_UPDATED',
    entityType: 'settings',
    entityId: 'system',
    details: `Updated settings: n8nEnabled=${updated.n8nEnabled}, webhookUrl=${updated.n8nWebhookUrl ? 'configured' : 'empty'}`
  });

  return res.json(updated);
});

// Test connection to n8n webhook URL
router.post('/test-n8n', async (req: AuthenticatedRequest, res: Response) => {
  const { url } = req.body;
  const targetUrl = url || db.getSettings().n8nWebhookUrl;

  if (!targetUrl) {
    return res.status(400).json({ success: false, message: 'No n8n Webhook URL provided.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const ping = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ping-Source': 'resume-screening-agent-test'
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Ping test from Resume Screening Agent'
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    return res.json({
      success: true,
      status: ping.status,
      message: `Successfully connected to n8n endpoint (HTTP ${ping.status}).`
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      message: `Failed to reach n8n webhook: ${err.message}`
    });
  }
});

export default router;
