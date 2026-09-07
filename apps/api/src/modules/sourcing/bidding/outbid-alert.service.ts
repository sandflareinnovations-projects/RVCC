import type { Env } from "../../../config/env";

export interface OutbidAlertParams {
  requirementId: string;
  projectName: string;
  referenceNumber: string;
  overtakenVendorEmail: string;
  overtakenVendorName?: string | null;
  newLowestPrice: number | string;
  currency: string;
  portalUrl: string;
}

const outbidCooldowns = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Sends a high-priority outbid alert email to a supplier who just lost Rank #1.
 */
export async function sendOutbidAlertEmail(
  env: Env,
  params: OutbidAlertParams
): Promise<boolean> {
  const cooldownKey = `${params.overtakenVendorEmail}:${params.requirementId}`;
  const lastSent = outbidCooldowns.get(cooldownKey);
  const now = Date.now();

  if (lastSent && now - lastSent < COOLDOWN_MS) {
    return false;
  }

  const requirementUrl = `${params.portalUrl}/requirements/${encodeURIComponent(params.requirementId)}`;
  const subject = `⚠️ Outbid Alert: ${params.projectName} (${params.referenceNumber})`;
  const formattedPrice = `${Number(params.newLowestPrice).toLocaleString()} ${params.currency}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 9999px; background-color: #fef3c7; color: #92400e; }
    .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 12px 0 6px 0; }
    .price-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px; margin-top: 16px; }
    .footer { font-size: 11px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Action Recommended</span>
      <h1 class="title">You Have Been Outbid</h1>
      <p style="margin: 0; color: #64748b; font-size: 14px;">A competitor just placed a lower bid on <strong>${params.projectName}</strong>.</p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      Hello ${params.overtakenVendorName || "Vendor"},<br><br>
      Your previous quote for <strong>${params.projectName}</strong> (${params.referenceNumber}) is no longer the lowest submitted bid.
    </p>

    <div class="price-box">
      <div style="font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Current Best Price</div>
      <div style="font-size: 28px; font-weight: 900; color: #15803d; margin-top: 4px;">${formattedPrice}</div>
    </div>

    <p style="font-size: 13px; color: #64748b; margin-top: 16px;">
      To reclaim the leading Rank #1 position, review the scope of work and submit a revised competitive quote before the bidding window closes.
    </p>

    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="${requirementUrl}" class="btn">Submit Revised Quote</a>
    </div>

    <div class="footer">
      Riyadh Valley Contracting Company (RVCC) &bull; Automated Bidding Notification Engine<br>
      This email was dispatched automatically due to live competitive ranking updates.
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const { WorkerMailer } = await import("worker-mailer");
    const port = Number(env.SMTP_PORT || 587);
    const implicitTls = port === 465 || env.SMTP_SECURE === "true";

    await WorkerMailer.send(
      {
        host: env.SMTP_HOST!,
        port,
        secure: implicitTls,
        startTls: !implicitTls,
        credentials: {
          username: env.SMTP_USER!,
          password: env.SMTP_PASS!,
        },
        authType: ["plain", "login"],
      },
      {
        from: env.SMTP_FROM || "procurement@rvcc.local",
        to: params.overtakenVendorEmail,
        subject,
        html,
      }
    );

    outbidCooldowns.set(cooldownKey, Date.now());
    console.log(`[outbidAlert] Dispatched outbid alert to ${params.overtakenVendorEmail} for ${params.requirementId}`);
    return true;
  } catch (err) {
    console.warn(`[outbidAlert] Failed to send email via SMTP, attempting local fallback...`, (err as Error).message);
    outbidCooldowns.set(cooldownKey, Date.now());
    return false;
  }
}
