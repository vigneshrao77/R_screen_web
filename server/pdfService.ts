import { createRequire } from 'module';
import { ai } from './gemini.js';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  // Method 1: Try pdf-parse v2 PDFParse class or legacy function
  try {
    let text = '';
    if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: pdfBuffer });
      const res = await parser.getText();
      text = res?.text || '';
      try {
        await parser.destroy();
      } catch (_) {}
    } else if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(pdfBuffer);
      text = data?.text || '';
    }

    const cleanedText = text.trim();
    if (cleanedText.length > 30) {
      return cleanedText;
    }
  } catch (err: any) {
    console.warn('pdf-parse extraction notice:', err.message);
  }

  // Method 2: Direct stream extraction fallback (for plain text PDF streams)
  try {
    const rawString = pdfBuffer.toString('utf-8');
    const textMatches: string[] = [];
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(rawString)) !== null) {
      textMatches.push(match[1]);
    }
    if (textMatches.length > 0) {
      const extracted = textMatches.join(' ').trim();
      if (extracted.length > 50) {
        return extracted;
      }
    }
  } catch (rawErr) {
    // Continue to Gemini fallback
  }

  // Method 3: Fallback to Gemini multimodal PDF extraction with retry
  const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash'];
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBuffer.toString('base64'),
            },
          },
          {
            text: 'Please extract all text, sections, dates, qualifications, and work history from this resume PDF verbatim. Output pure extracted text without any commentary.',
          },
        ],
      });

      const fallbackText = response.text?.trim() || '';
      if (fallbackText) {
        return fallbackText;
      }
    } catch (geminiErr: any) {
      console.warn(`Gemini PDF extraction on ${model} notice:`, geminiErr.message);
    }
  }

  throw new Error('Could not extract legible text from this PDF file.');
}
