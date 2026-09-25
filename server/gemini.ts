import { GoogleGenAI, Type } from '@google/genai';
import { StructuredScreeningResult } from '../src/types/index.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const N8N_SYSTEM_MESSAGE = `You are an expert technical recruiter specializing in AI, automation, and software roles.

You have been given a job description and a candidate resume. Your task is to analyze the resume in relation to the job description and provide a detailed screening report.

Focus specifically on how well the candidate matches the core requirements and ideal profile outlined in the job description. Evaluate both technical skill alignment and business-context understanding. Use reasoning grounded in the actual content of the resume and job post — avoid making assumptions.

## Output

Your output should follow this exact format:

### Candidate Strengths:
List the top strengths or relevant qualifications the candidate brings to the table. Be specific.

### Candidate Weaknesses:
List areas where the candidate is lacking or mismatched based on the job description.

### Risk Factor:
- Assign a risk score (Low / Medium / High)
- Explain the worst-case scenario if this candidate is hired.

### Reward Factor:
- Assign a reward score (Low / Medium / High)
- Describe the best-case scenario — what value could this candidate unlock?
- Does the candidate appear to be a short-term or long-term fit?

### Overall Fit Rating (0–10):
Assign a number between 0 (terrible match) and 10 (perfect match). Do not give decimals.

### Justification for Rating:
Explain clearly why this candidate received that score. Reference specific resume content and how it aligns or doesn't with the job description.`;

export const STRUCTURED_OUTPUT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    candidate_name: {
      type: Type.STRING,
      description: 'Full name of the candidate extracted from the resume.'
    },
    job_title: {
      type: Type.STRING,
      description: 'Job title from the provided job description.'
    },
    candidate_summary: {
      type: Type.STRING,
      description: 'A concise 2-3 sentence summary of the candidate background, primary tech stack, and overall fit for this role.'
    },
    matched_skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Skills explicitly present in BOTH the resume and the job description requirements.'
    },
    missing_skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Skills or qualifications required or preferred by the job description that are NOT demonstrated in the resume.'
    },
    additional_skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Valuable skills, technologies, or domain expertise present in the resume that were not explicitly listed in the job description.'
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Candidate top strengths with concrete evidence from their experience.'
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Areas where the candidate is mismatched, lacks depth, or shows gaps relative to job expectations.'
    },
    experience_match: {
      type: Type.STRING,
      description: 'Detailed analysis of how years of experience, past titles, and demonstrated project scope align with the role requirements.'
    },
    education_match: {
      type: Type.STRING,
      description: 'Analysis of degrees, certifications, or educational pedigree in relation to role specifications.'
    },
    risk_assessment: {
      type: Type.OBJECT,
      properties: {
        risk_score: {
          type: Type.STRING,
          description: 'Hiring risk level: Low, Medium, or High.'
        },
        reason: {
          type: Type.STRING,
          description: 'Explanation of worst-case scenario and potential failure modes if hired.'
        }
      },
      required: ['risk_score', 'reason']
    },
    reward_assessment: {
      type: Type.OBJECT,
      properties: {
        reward_score: {
          type: Type.STRING,
          description: 'Upside reward potential: Low, Medium, or High.'
        },
        reason: {
          type: Type.STRING,
          description: 'Explanation of best-case business value unlocked, leverage, and short-term vs long-term trajectory.'
        }
      },
      required: ['reward_score', 'reason']
    },
    overall_fit_rating: {
      type: Type.INTEGER,
      description: 'Integer from 0 to 10 evaluating overall fit for the position.'
    },
    ats_score: {
      type: Type.INTEGER,
      description: 'Compatibility percentage (0-100) assessing keyword, skill, and qualification overlap.'
    },
    recommendation: {
      type: Type.STRING,
      description: 'Final screening decision: Reject, Consider, Shortlist, or Strong Hire.'
    },
    interview_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 5 targeted interview questions tailored to verify claims and probe gaps.'
    },
    justification: {
      type: Type.STRING,
      description: 'Detailed justification for the recommendation and overall fit rating referencing resume content.'
    }
  },
  required: [
    'candidate_name',
    'job_title',
    'candidate_summary',
    'matched_skills',
    'missing_skills',
    'additional_skills',
    'strengths',
    'weaknesses',
    'experience_match',
    'education_match',
    'risk_assessment',
    'reward_assessment',
    'overall_fit_rating',
    'ats_score',
    'recommendation',
    'interview_questions',
    'justification'
  ]
};

export async function evaluateResumeWithGemini(
  resumeText: string,
  jobDescriptionText: string
): Promise<StructuredScreeningResult> {
  const promptText = `Candidates resume :  ${resumeText}\n\nJob description requirements :${jobDescriptionText}`;

  const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            systemInstruction: N8N_SYSTEM_MESSAGE,
            responseMimeType: 'application/json',
            responseSchema: STRUCTURED_OUTPUT_SCHEMA
          }
        });

        const rawJson = response.text?.trim();
        if (!rawJson) {
          throw new Error('Gemini API returned an empty evaluation response');
        }

        const parsed = JSON.parse(rawJson) as StructuredScreeningResult;
        parsed.overall_fit_rating = Math.max(0, Math.min(10, Math.round(Number(parsed.overall_fit_rating) || 0)));
        parsed.ats_score = Math.max(0, Math.min(100, Math.round(Number(parsed.ats_score) || 0)));
        return parsed;
      } catch (err: any) {
        lastError = err;
        console.warn(`Evaluation attempt ${attempt} on model ${model} failed:`, err.message);
        // Small backoff before retry
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw new Error(`Failed to evaluate resume with Gemini AI: ${lastError?.message || 'Unknown error'}`);
}

export { ai };
