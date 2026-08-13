import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@shoppy.com';

export const sendVerificationEmail = async (email: string, code: string) => {
  const mailOptions = {
    from: `"Shoppy" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Verify your Shoppy Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 style="color: #0F172A; text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Welcome to Shoppy!</h2>
        <p style="color: #475569; font-size: 16px; margin-bottom: 24px; text-align: center;">Please use the verification code below to activate your account. This code expires in 1 hour.</p>
        <div style="background-color: #F8FAFC; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4F46E5;">${code}</span>
        </div>
        <p style="color: #94A3B8; font-size: 14px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Shoppy" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Reset your Shoppy Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 style="color: #0F172A; text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 16px; margin-bottom: 24px; text-align: center;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${resetLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #94A3B8; font-size: 14px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
