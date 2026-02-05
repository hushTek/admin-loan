'use server';

import { resend } from '@/lib/resend';
import { sendSMS } from '@/lib/sms';
import type { Language } from '@/lib/translations';

function enterpriseTemplate({
  title,
  intro,
  highlight,
  actionText,
  footer,
}: { title: string; intro: string; highlight: string; actionText: string; footer: string }) {
  return `
  <div style="background:#f5f7fb;padding:24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial;">
    <table style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(16,24,40,0.08);" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#0a4a7a;color:#fff;padding:20px 24px;">
          <div style="font-weight:700;font-size:18px;letter-spacing:0.2px;">Trust Funding Microfinance</div>
          <div style="opacity:0.9;font-size:12px;margin-top:4px;">Secure Verification</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <h1 style="font-size:18px;margin:0 0 12px 0;color:#0f172a;">${title}</h1>
          <p style="margin:0 0 16px 0;color:#334155;line-height:1.6;">${intro}</p>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;color:#0c4a6e;padding:12px 16px;border-radius:8px;font-weight:600;text-align:center;letter-spacing:1px;">
            ${highlight}
          </div>
          <p style="margin:16px 0 0 0;color:#334155;">${actionText}</p>
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

function otpCopy(otp: string, lang: Language) {
  if (lang === 'en') {
    return {
      subject: 'Your Verification OTP',
      title: 'Verification Code',
      intro: 'Use the one-time code below to complete your verification.',
      highlight: otp,
      actionText: 'Enter this code in the application to confirm your action.',
      footer: 'If you did not request this verification, please ignore this email.',
    };
  }
  return {
    subject: 'OTP ya Uthibitisho',
    title: 'Nambari ya Uhakiki',
    intro: 'Tumia nambari ya muda hapa chini kukamilisha uthibitisho wako.',
    highlight: otp,
    actionText: 'Ingiza nambari hii kwenye programu ili kuthibitisha hatua yako.',
    footer: 'Ikiwa hukumwomba uthibitisho huu, tafadhali puuza barua pepe hii.',
  };
}

export async function sendOtp({ 
  email, 
  phone, 
  otp, 
  lang = 'sw' 
}: { 
  email?: string; 
  phone?: string; 
  otp: string; 
  lang?: Language; 
}) {
  const results: any = { email: null, sms: null };
  const copy = otpCopy(otp, lang);

  // Send Email
  if (email) {
    try {
      const html = enterpriseTemplate({
        title: copy.title,
        intro: copy.intro,
        highlight: copy.highlight,
        actionText: copy.actionText,
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
        results.email = { success: false, error: error.message };
      } else {
        results.email = { success: true, data };
      }
    } catch (error) {
      console.error('Email Server error:', error);
      results.email = { success: false, error: 'Failed to send email' };
    }
  }

  // Send SMS
  // if (phone) {
  //   try {
  //     const message = `${copy.title}: ${otp}. ${copy.intro}`; // Simple message
  //     const res = await sendSMS({ to: phone, message });
  //     results.sms = res;
  //   } catch (error) {
  //     console.error('SMS Server error:', error);
  //     results.sms = { success: false, error: 'Failed to send SMS' };
  //   }
  // }

  // Return success if at least one method worked
  const success = (results.email?.success) || (results.sms?.success);
  return { success, results };
}

// Backward compatibility or refactor helper
export async function sendOtpEmail(email: string, otp: string, lang: Language = 'sw') {
    return sendOtp({ email, otp, lang });
}
