'use server';

import { resend } from '@/lib/resend';
import type { Language } from '@/lib/translations';

function enterpriseTemplate({
  title,
  intro,
  highlight,
  footer,
}: { title: string; intro: string; highlight: string; footer: string }) {
  return `
  <div style="background:#f5f7fb;padding:24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial;">
    <table style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(16,24,40,0.08);" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#0a4a7a;color:#fff;padding:20px 24px;">
          <div style="font-weight:700;font-size:18px;letter-spacing:0.2px;">Trust Funding Microfinance</div>
          <div style="opacity:0.9;font-size:12px;margin-top:4px;">Application Confirmation</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <h1 style="font-size:18px;margin:0 0 12px 0;color:#0f172a;">${title}</h1>
          <p style="margin:0 0 16px 0;color:#334155;line-height:1.6;">${intro}</p>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;color:#0c4a6e;padding:12px 16px;border-radius:8px;font-weight:600;text-align:center;">
            ${highlight}
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

function appNumberCopy(number: string, lang: Language) {
  if (lang === 'en') {
    return {
      subject: 'Your Application Number',
      title: 'Application Submitted',
      intro: 'Thank you for applying. Use the application number below to track your status.',
      highlight: `Application Number: <strong>${number}</strong>`,
      footer: 'Keep this number safe. You may need it for support and tracking.',
    };
  }
  return {
    subject: 'Nambari ya Maombi Yako',
    title: 'Maombi Yametumwa',
    intro: 'Asante kwa kuomba. Tumia nambari ya maombi hapa chini kufuatilia hali yako.',
    highlight: `Nambari ya Maombi: <strong>${number}</strong>`,
    footer: 'Hifadhi nambari hii. Utahitaji kwa usaidizi na ufuatiliaji.',
  };
}

export async function sendApplicationNumberEmail(email: string, applicationNumber: string, lang: Language = 'sw') {
  try {
    const copy = appNumberCopy(applicationNumber, lang);
    const html = enterpriseTemplate({
      title: copy.title,
      intro: copy.intro,
      highlight: copy.highlight,
      footer: copy.footer,
    });
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
