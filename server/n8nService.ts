import { N8nExecutionRecord } from '../src/types/index.js';
import { db } from './db.js';

export interface TriggerN8nParams {
  fullName: string;
  email: string;
  phone: string;
  resumeBuffer: Buffer;
  resumeFilename: string;
}

export async function triggerN8nWorkflow(params: TriggerN8nParams): Promise<N8nExecutionRecord> {
  const settings = db.getSettings();
  const webhookUrl = settings.n8nWebhookUrl?.trim();

  if (!webhookUrl || !settings.n8nEnabled) {
    return {
      triggeredAt: new Date().toISOString(),
      status: 'bypassed',
      details: 'n8n webhook URL not configured or integration disabled. Direct AI screening active.'
    };
  }

  try {
    const formData = new FormData();
    formData.append('Fullname', params.fullName);
    formData.append('Email-id', params.email);
    formData.append('Ph.no', params.phone);

    const blob = new Blob([new Uint8Array(params.resumeBuffer)], { type: 'application/pdf' });
    formData.append('Resume', blob, params.resumeFilename);

    console.log(`[n8n] Triggering workflow at ${webhookUrl} for ${params.fullName}...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeout);

    const responseBodyText = await response.text().catch(() => '');

    if (response.ok) {
      return {
        triggeredAt: new Date().toISOString(),
        webhookUrl,
        status: 'delivered',
        responseStatus: response.status,
        details: `Successfully triggered n8n workflow (HTTP ${response.status}). Gmail confirmation and Notion database sync initiated.`
      };
    } else {
      return {
        triggeredAt: new Date().toISOString(),
        webhookUrl,
        status: 'failed',
        responseStatus: response.status,
        details: `n8n webhook responded with HTTP ${response.status}: ${responseBodyText.slice(0, 200)}`
      };
    }
  } catch (err: any) {
    console.error('[n8n] Error triggering webhook:', err);
    return {
      triggeredAt: new Date().toISOString(),
      webhookUrl,
      status: 'failed',
      details: `Failed to reach n8n webhook: ${err.message}`
    };
  }
}
