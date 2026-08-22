import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/signin?callbackUrl=/admin');
  }

  await connectToDatabase();
  const user = await User.findById((session.user as any).id);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-4">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          You do not have the required permissions to access the Admin Panel. If you believe this is a mistake, please contact support.
        </p>
        <Link 
          href="/"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 flex justify-between items-center shadow-sm border-b border-gray-200 dark:border-gray-800">
          {/* <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent md:hidden">Admin Panel</h2> */}
          <div className="hidden md:block"></div> {/* Spacer for desktop */}
          <div className="flex items-center gap-4">
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
