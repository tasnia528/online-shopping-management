import Pusher from 'pusher';

// Avoid instantiating multiple Pusher instances in development during hot-reloading
const globalForPusher = global as unknown as { pusher: Pusher };

export const pusherServer =
  globalForPusher.pusher ||
  new Pusher({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    useTLS: true,
  });

if (process.env.NODE_ENV !== 'production') globalForPusher.pusher = pusherServer;
