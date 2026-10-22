/**
 * reCAPTCHA Enterprise check shared by the proposal endpoints
 * (api/proposal.ts on edge, api/proposal-submit.ts on node). Uses only
 * fetch, so it runs on both runtimes. api/contact.ts keeps its own copy.
 *
 * Env: RECAPTCHA_SECRET_KEY (a Cloud API key — see api/contact.ts),
 * RECAPTCHA_PROJECT_ID, RECAPTCHA_SITE_KEY. When any is unset (dev,
 * forked deploys) the check is skipped and every request passes.
 */

const MIN_SCORE = 0.3;

interface EnterpriseAssessment {
  tokenProperties?: { valid: boolean; invalidReason?: string; action?: string };
  riskAnalysis?: { score?: number; reasons?: string[] };
  error?: { code: number; message: string; status: string };
}

export type RecaptchaResult = "ok" | "rejected" | "unavailable";

export async function verifyRecaptcha(
  token: string | undefined,
  action: string,
  logTag: string,
): Promise<RecaptchaResult> {
  const apiKey = process.env.RECAPTCHA_SECRET_KEY;
  const projectId = process.env.RECAPTCHA_PROJECT_ID;
  const siteKey = process.env.RECAPTCHA_SITE_KEY;
  if (!apiKey || !projectId || !siteKey) return "ok";
  if (!token) return "rejected";
  try {
    const res = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/assessments?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: { token, siteKey, expectedAction: action } }),
      },
    );
    const a = (await res.json()) as EnterpriseAssessment;
    const score = a.riskAnalysis?.score ?? 0;
    if (
      a.tokenProperties?.valid !== true ||
      a.tokenProperties.action !== action ||
      score < MIN_SCORE ||
      a.error
    ) {
      console.warn(`[${logTag}] reCAPTCHA rejected:`, {
        score,
        action: a.tokenProperties?.action,
        invalidReason: a.tokenProperties?.invalidReason,
        reasons: a.riskAnalysis?.reasons,
        error: a.error,
      });
      return "rejected";
    }
    return "ok";
  } catch (err) {
    console.error(`[${logTag}] reCAPTCHA verify error:`, err);
    // Fail closed, same as the contact form.
    return "unavailable";
  }
}
