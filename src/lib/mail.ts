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

export const sendInvoiceEmail = async (email: string, order: any, user: any) => {
  const isPaid = order.paymentStatus === 'completed';
  const paidAmount = isPaid ? order.totalAmount : 0;
  const dueAmount = isPaid ? 0 : order.totalAmount;
  
  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #F1F5F9; width: 80px;">
        <img src="${item.product.image}" alt="${item.product.name}" style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid #E2E8F0;" />
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #F1F5F9;">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0F172A;">${item.product.name}</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748B;">Qty: ${item.quantity}</p>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #F1F5F9; text-align: right; font-size: 16px; font-weight: 600; color: #0F172A;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Shoppy" <${FROM_EMAIL}>`,
    to: email,
    subject: `Order Invoice - ${order._id}`,
    html: `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8FAFC; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
          
          <!-- Header -->
          <div style="background-color: #4F46E5; padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px;">Shoppy</h1>
            <p style="color: #C7D2FE; font-size: 16px; margin: 8px 0 0 0;">Thank you for your purchase!</p>
          </div>

          <div style="padding: 40px;">
            <!-- Order Summary -->
            <table style="width: 100%; border-bottom: 2px solid #F1F5F9; padding-bottom: 24px; margin-bottom: 24px;">
              <tr>
                <td style="text-align: left;">
                  <p style="font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Order Number</p>
                  <p style="font-size: 16px; font-weight: 600; color: #0F172A; margin: 0;">#${order._id}</p>
                </td>
                <td style="text-align: right;">
                  <p style="font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Order Date</p>
                  <p style="font-size: 16px; font-weight: 600; color: #0F172A; margin: 0;">${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </td>
              </tr>
            </table>
            
            <!-- Address -->
            <div style="background-color: #F8FAFC; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
              <h3 style="font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">Shipping To</h3>
              <p style="font-size: 15px; color: #475569; margin: 0 0 4px 0; font-weight: 500;">${user.name}</p>
              <p style="font-size: 15px; color: #475569; margin: 0 0 4px 0;">${order.shippingAddress.street}</p>
              <p style="font-size: 15px; color: #475569; margin: 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
            </div>

            <!-- Items -->
            <h3 style="font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 16px 0;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Totals -->
            <div style="background-color: #F8FAFC; border-radius: 12px; padding: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding-bottom: 12px; font-size: 15px; color: #475569;">Subtotal</td>
                  <td style="padding-bottom: 12px; font-size: 15px; font-weight: 500; color: #0F172A; text-align: right;">$${order.totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px; font-size: 15px; color: #475569;">Shipping</td>
                  <td style="padding-bottom: 16px; font-size: 15px; font-weight: 500; color: #10B981; text-align: right;">Free</td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top: 1px solid #E2E8F0; padding-top: 16px;"></td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px; font-size: 18px; font-weight: 700; color: #0F172A;">Total</td>
                  <td style="padding-bottom: 16px; font-size: 24px; font-weight: 800; color: #4F46E5; text-align: right;">$${order.totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px; font-size: 14px; color: #64748B;">Amount Paid</td>
                  <td style="padding-bottom: 8px; font-size: 14px; font-weight: 600; color: #10B981; text-align: right;">$${paidAmount.toFixed(2)}</td>
                </tr>
                ${dueAmount > 0 ? `
                <tr>
                  <td style="font-size: 14px; color: #64748B;">Amount Due (COD)</td>
                  <td style="font-size: 14px; font-weight: 600; color: #EF4444; text-align: right;">$${dueAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${order.transactionId ? `
            <p style="text-align: center; font-size: 12px; color: #94A3B8; margin: 24px 0 0 0;">
              Transaction ID: ${order.transactionId}
            </p>
            ` : ''}
          </div>
        </div>
        <p style="text-align: center; font-size: 13px; color: #94A3B8; margin-top: 24px;">
          If you have any questions, reply to this email or contact us at support@shoppy.com
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
