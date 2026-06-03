// src/lib/auth/auth-errors.ts
export enum AuthErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INVALID_TENANT = "INVALID_TENANT",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  TENANT_INACTIVE = "TENANT_INACTIVE",
}

export interface AuthError {
  code: AuthErrorCode;
  message: string; // User-friendly message
  details?: string; // Internal details for logging
}

export const getAuthErrorMessage = (code: AuthErrorCode): string => {
  const messages: Record<AuthErrorCode, string> = {
    [AuthErrorCode.INVALID_CREDENTIALS]: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    [AuthErrorCode.ACCOUNT_LOCKED]: "الحساب مقفل مؤقتاً. حاول مرة أخرى خلال 30 دقيقة",
    [AuthErrorCode.EMAIL_NOT_VERIFIED]: "يرجى تأكيد بريدك الإلكتروني أولاً",
    [AuthErrorCode.ACCOUNT_INACTIVE]: "الحساب غير مفعّل",
    [AuthErrorCode.RATE_LIMIT_EXCEEDED]: "عدد محاولات الدخول كثير جداً. حاول لاحقاً",
    [AuthErrorCode.INVALID_TENANT]: "المستأجر غير صالح",
    [AuthErrorCode.ACCOUNT_SUSPENDED]: "الحساب مُعلّق",
    [AuthErrorCode.EMAIL_ALREADY_EXISTS]: "البريد الإلكتروني مستخدم بالفعل",
    [AuthErrorCode.WEAK_PASSWORD]: "كلمة المرور ضعيفة جداً",
    [AuthErrorCode.TENANT_INACTIVE]: "حساب المستأجر غير مفعّل",
  };

  return messages[code] || "حدث خطأ. حاول مرة أخرى";
};

// Generic message for user (security best practice)
export const GENERIC_AUTH_ERROR = "بيانات اعتماد غير صحيحة أو حساب غير متاح";
