'use server';

import { resend } from '@/lib/resend';
import type { Language } from '@/lib/translations';

function enterpriseTemplate({
  title,
  intro,
  cta,
  footer,
}: { title: string; intro: string; cta: string; footer: string }) {
  return `
  <div style="background:#f5f7fb;padding:24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial;">
    <table style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(16,24,40,0.08);" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#0a4a7a;color:#fff;padding:20px 24px;">
          <div style="font-weight:700;font-size:18px;letter-spacing:0.2px;">Trust Funding Microfinance</div>
          <div style="opacity:0.9;font-size:12px;margin-top:4px;">Guarantor Confirmation</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <h1 style="font-size:18px;margin:0 0 12px 0;color:#0f172a;">${title}</h1>
          <p style="margin:0 0 16px 0;color:#334155;line-height:1.6;">${intro}</p>
          <div style="text-align:center;margin:16px 0;">
            <a href="{{URL}}" style="background:#0a4a7a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600;">
              ${cta}
            </a>
          </div>
          <p style="margin:24px 0 0 0;color:#64748b;font-size:12px;">${footer}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
          © ${new Date().getFullYear()} Trust Funding Microfinance. All rights reserved.
        </td>
      </tr>
    </table>
  </div>
  `;
}

function inviteCopy(lang: Language) {
  if (lang === 'en') {
    return {
      subject: 'Action Required: Confirm Guarantor Invitation',
      title: 'Confirm Guarantor Request',
      intro: 'You have been listed as a guarantor for a loan application. Please confirm your participation.',
      cta: 'Confirm Invitation',
      footer: 'If you believe this was sent to you in error, you can ignore this email.',
    };
  }
  return {
    subject: 'Hatua Inahitajika: Thibitisha Ualiko wa Udhamini',
    title: 'Thibitisha Ombi la Udhamini',
    intro: 'Umeorodheshwa kama mdhamini wa maombi ya mkopo. Tafadhali thibitisha ushiriki wako.',
    cta: 'Thibitisha Udhamini',
    footer: 'Ikiwa umepewa barua pepe hii kimakosa, unaweza kupuuza barua pepe hii.',
  };
}

export async function sendGuarantorInviteEmail(email: string, url: string, lang: Language = 'sw') {
  try {
    const copy = inviteCopy(lang);
    const html = enterpriseTemplate({
      title: copy.title,
      intro: copy.intro,
      cta: copy.cta,
      footer: copy.footer,
    }).replace('{{URL}}', url);
    const { data, error } = await resend.emails.send({
      from: 'tms@hushtek.co.tz',
      to: email,
      subject: copy.subject,
      html,
    });
    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Server error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
