// src/lib/email/email.service.ts
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import VerificationToken from "@/models/VerificationToken";
import { connectToDatabase } from "@/lib/db/mongodb";

export interface SendVerificationResult {
  code: string;
  sent: boolean;
  previewUrl?: string;
  warning?: string;
}

let cachedTransporter: { transporter: Transporter; isTest: boolean } | null = null;

function isGmailAddress(email: string): boolean {
  return email.toLowerCase().includes("@gmail.com");
}

function createSmtpTransport(user: string, pass: string, host: string, port: number): Transporter {
  if (isGmailAddress(user) || host.includes("gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function getTransporter(): Promise<{ transporter: Transporter; isTest: boolean }> {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    const transporter = createSmtpTransport(user, pass, host, port);

    try {
      await transporter.verify();
      cachedTransporter = { transporter, isTest: host.includes("ethereal") };
      return cachedTransporter;
    } catch (err) {
      const message = err instanceof Error ? err.message : "SMTP verification failed";
      console.warn("SMTP credentials rejected:", message);

      if (process.env.NODE_ENV === "production") {
        throw err;
      }
    }
  }

  const testAccount = await nodemailer.createTestAccount();
  console.log("[email] Using auto-generated Ethereal account:", testAccount.user);

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  cachedTransporter = { transporter, isTest: true };
  return cachedTransporter;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildVerificationHtml(code: string): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4F46E5;">مرحباً بك في منصة MEMO DEV</h2>
      <p>استخدم الرمز التالي للتحقق من بريدك الإلكتروني:</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #6b7280; font-size: 14px;">هذا الرمز صالح لمدة 10 دقائق فقط.</p>
      <p style="color: #6b7280; font-size: 14px;">إذا لم تطلب هذا التحقق، يرجى تجاهل هذا البريد.</p>
      <hr style="margin: 20px 0; border-color: #e0e0e0;" />
      <p style="color: #9ca3af; font-size: 12px;">© 2024 MEMO DEV - منصة إنشاء المتاجر الإلكترونية</p>
    </div>
  `;
}

export async function sendVerificationCode(email: string): Promise<SendVerificationResult> {
  await connectToDatabase();

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await VerificationToken.findOneAndUpdate(
    { email, type: "email_verification" },
    { code, expiresAt, type: "email_verification" },
    { upsert: true, new: true }
  );

  if (process.env.EMAIL_DEV_MODE === "console") {
    console.log(`[email] Verification code for ${email}: ${code}`);
    return {
      code,
      sent: false,
      warning: "تم حفظ الرمز — وضع التطوير (console) بدون إرسال بريد",
    };
  }

  try {
    const { transporter, isTest } = await getTransporter();
    const from = process.env.SMTP_FROM || "noreply@localhost";

    const info = await transporter.sendMail({
      from: `"MEMO DEV" <${from}>`,
      to: email,
      subject: "رمز التحقق - منصة MEMO DEV",
      html: buildVerificationHtml(code),
    });

    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : undefined;
    if (previewUrl) {
      console.log("[email] Preview URL:", previewUrl);
    } else {
      console.log("[email] Sent:", info.messageId);
    }

    return { code, sent: true, previewUrl: previewUrl ?? undefined };
  } catch (error) {
    console.error("Email send failed:", error);

    if (process.env.NODE_ENV === "development") {
      console.log(`[email] Verification code for ${email}: ${code}`);
      return {
        code,
        sent: false,
        warning: "تعذّر إرسال البريد — الرمز متاح في سجل الخادم (development)",
      };
    }

    return {
      code,
      sent: false,
      warning: "تم إنشاء الحساب لكن تعذّر إرسال البريد. استخدم «إعادة إرسال الرمز».",
    };
  }
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  await connectToDatabase();

  const record = await VerificationToken.findOne({
    email,
    code,
    type: "email_verification",
    expiresAt: { $gt: new Date() },
  });

  if (!record) return false;

  await VerificationToken.deleteOne({ _id: record._id });

  return true;
}

function buildPasswordResetHtml(code: string): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #ea580c;">إعادة تعيين كلمة المرور</h2>
      <p>تلقينا طلباً لإعادة تعيين كلمة مرور حسابك على منصة MEMO DEV.</p>
      <p>استخدم الرمز التالي في صفحة استعادة كلمة المرور:</p>
      <div style="background-color: #fff7ed; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; color: #c2410c;">
        ${code}
      </div>
      <p style="color: #6b7280; font-size: 14px;">هذا الرمز صالح لمدة 15 دقيقة فقط.</p>
      <p style="color: #6b7280; font-size: 14px;">إذا لم تطلب إعادة التعيين، تجاهل هذا البريد ولن يتغير حسابك.</p>
      <hr style="margin: 20px 0; border-color: #e0e0e0;" />
      <p style="color: #9ca3af; font-size: 12px;">© MEMO DEV</p>
    </div>
  `;
}

export async function sendPasswordResetCode(email: string): Promise<SendVerificationResult> {
  await connectToDatabase();

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await VerificationToken.findOneAndUpdate(
    { email, type: "password_reset" },
    { code, expiresAt, type: "password_reset" },
    { upsert: true, new: true }
  );

  if (process.env.EMAIL_DEV_MODE === "console") {
    console.log(`[email] Password reset code for ${email}: ${code}`);
    return {
      code,
      sent: false,
      warning: "وضع التطوير — الرمز في سجل الخادم",
    };
  }

  try {
    const { transporter, isTest } = await getTransporter();
    const from = process.env.SMTP_FROM || "noreply@localhost";

    const info = await transporter.sendMail({
      from: `"MEMO DEV" <${from}>`,
      to: email,
      subject: "إعادة تعيين كلمة المرور - MEMO DEV",
      html: buildPasswordResetHtml(code),
    });

    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : undefined;
    if (previewUrl) {
      console.log("[email] Password reset preview:", previewUrl);
    }

    return { code, sent: true, previewUrl: previewUrl ?? undefined };
  } catch (error) {
    console.error("Password reset email failed:", error);

    if (process.env.NODE_ENV === "development") {
      console.log(`[email] Password reset code for ${email}: ${code}`);
      return {
        code,
        sent: false,
        warning: "تعذّر إرسال البريد — الرمز في سجل الخادم (development)",
      };
    }

    throw error;
  }
}

export async function verifyPasswordResetCode(
  email: string,
  code: string
): Promise<boolean> {
  await connectToDatabase();

  const record = await VerificationToken.findOne({
    email,
    code,
    type: "password_reset",
    expiresAt: { $gt: new Date() },
  });

  if (!record) return false;

  await VerificationToken.deleteOne({ _id: record._id });
  return true;
}
