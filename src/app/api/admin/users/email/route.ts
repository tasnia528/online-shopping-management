import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { auth } from '@/auth';
import { transporter, FROM_EMAIL } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const admin = await User.findById((session.user as any).id);
    if (!admin || admin.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { userIds, subject, body } = await req.json();

    if (!userIds || userIds.length === 0 || !subject || !body) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const users = await User.find({ _id: { $in: userIds } }).select('email name');

    if (users.length === 0) {
      return NextResponse.json({ message: 'No users found' }, { status: 404 });
    }

    const emails = users.map(u => u.email);

    const mailOptions = {
      from: `"Store Admin" <${FROM_EMAIL}>`,
      bcc: emails.join(','), // Send as BCC for privacy in bulk email
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          ${body}
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Create notifications for all these users
    try {
      const notifs = users.map(u => ({
        user: u._id,
        type: 'email_received',
        message: `Admin sent an email: ${subject}`,
      }));
      await Notification.insertMany(notifs);
    } catch (e) {
      console.error('Failed to create notifs for email', e);
    }

    return NextResponse.json({ message: `Emails sent to ${users.length} users successfully` }, { status: 200 });
  } catch (error) {
    console.error('Bulk email sending error:', error);
    return NextResponse.json({ message: 'Failed to send bulk emails' }, { status: 500 });
  }
}
