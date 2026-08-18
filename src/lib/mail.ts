import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  senderName?: string;
  senderEmail?: string;
  secure?: boolean;
}

export const sendEmail = async (
  to: string, 
  subject: string, 
  text: string, 
  html: string,
  configOverride?: Partial<SmtpConfig>
) => {
  try {
    let rawHost = (configOverride?.host || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    
    // Auto-correct common typos like "stmp.gmail.com" -> "smtp.gmail.com"
    if (/^stmp\./i.test(rawHost)) {
      rawHost = rawHost.replace(/^stmp\./i, 'smtp.');
    } else if (/stmp/i.test(rawHost)) {
      rawHost = rawHost.replace(/stmp/gi, 'smtp');
    }

    const host = rawHost;
    const port = configOverride?.port ? Number(configOverride.port) : parseInt(process.env.SMTP_PORT || '587');
    const user = (configOverride?.user || process.env.SMTP_USER || '').trim();
    const pass = configOverride?.pass || process.env.SMTP_PASS || '';
    const senderName = (configOverride?.senderName || process.env.SMTP_SENDER_NAME || 'Smartphone POS').trim();
    const senderEmail = (configOverride?.senderEmail || user || process.env.SMTP_SENDER_EMAIL || 'noreply@pos.com').trim();
    const secure = configOverride?.secure !== undefined ? configOverride.secure : port === 465;

    // Check if configuration is present and valid
    if (!host || !user || !pass) {
      console.warn(`[SMTP] Configuration incomplete (host: "${host}", user: "${user}"). Email to ${to} skipped.`);
      return { 
        success: false, 
        message: 'Konfigurasi SMTP belum lengkap. Silakan atur Host, User, dan Password di Pengaturan SMTP.' 
      };
    }

    // Basic recipient check
    if (!to || !to.includes('@')) {
      return {
        success: false,
        message: `Format alamat email penerima (${to}) tidak valid.`
      };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: to.trim(),
      subject: subject.trim(),
      text,
      html,
    });

    console.log(`[SMTP] Email successfully sent to ${to}: messageId ${info.messageId}`);
    return { success: true, info, message: `Email berhasil dikirim ke ${to}` };
  } catch (err: any) {
    console.warn(`[SMTP Warning] Failed to send email to ${to}:`, err?.message || err);
    return { 
      success: false, 
      error: err?.message || 'SMTP Connection Error',
      message: `Gagal mengirim email: ${err?.message || 'Terjadi kesalahan pada koneksi server SMTP.'}`
    };
  }
};

