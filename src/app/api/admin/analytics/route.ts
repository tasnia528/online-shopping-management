import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Check if user is admin
    const currentUser = await User.findById((session.user as any).id);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'monthly'; // 'monthly', 'quarterly', 'yearly'

    // Real analytics logic
    // We'll calculate total revenue, total orders, total users, and profit
    const totalUsers = await User.countDocuments();
    const orders = await Order.find({ status: { $ne: 'Cancelled' } }).populate('items.product');

    let totalRevenue = 0;
    let totalProfit = 0;
    
    orders.forEach(order => {
      totalRevenue += order.totalAmount;
      order.items.forEach((item: any) => {
        if (item.product) {
          const cost = item.product.costPrice || (item.product.price * 0.7); // Mock cost if not set (70% of price)
          totalProfit += (item.price - cost) * item.quantity;
        }
      });
    });

    // Generate chart data based on filter
    const chartData = generateChartData(orders, filter);

    return NextResponse.json({
      totalRevenue,
      totalProfit,
      totalOrders: orders.length,
      totalUsers,
      chartData
    }, { status: 200 });

  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

function generateChartData(orders: any[], filter: string) {
  const dataMap = new Map();
  const now = new Date();

  // Initialize data map based on filter
  if (filter === 'monthly') {
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      dataMap.set(label, { revenue: 0, profit: 0, orders: 0, month: d.getMonth(), year: d.getFullYear() });
    }
  } else if (filter === 'quarterly') {
    // Last 4 quarters
    for (let i = 3; i >= 0; i--) {
      let q = Math.floor(now.getMonth() / 3) - i;
      let y = now.getFullYear();
      if (q < 0) {
        q += 4;
        y -= 1;
      }
      const label = `Q${q + 1} ${y}`;
      dataMap.set(label, { revenue: 0, profit: 0, orders: 0, quarter: q, year: y });
    }
  } else if (filter === 'yearly') {
    // Last 5 years
    for (let i = 4; i >= 0; i--) {
      const y = now.getFullYear() - i;
      dataMap.set(y.toString(), { revenue: 0, profit: 0, orders: 0, year: y });
    }
  }

  // Populate data
  orders.forEach(order => {
    const d = new Date(order.createdAt);
    let label = '';
    
    if (filter === 'monthly') {
      label = d.toLocaleString('default', { month: 'short' });
    } else if (filter === 'quarterly') {
      const q = Math.floor(d.getMonth() / 3);
      label = `Q${q + 1} ${d.getFullYear()}`;
    } else if (filter === 'yearly') {
      label = d.getFullYear().toString();
    }

    if (dataMap.has(label)) {
      const entry = dataMap.get(label);
      entry.revenue += order.totalAmount;
      entry.orders += 1;
      
      let profit = 0;
      order.items.forEach((item: any) => {
        if (item.product) {
          const cost = item.product.costPrice || (item.product.price * 0.7);
          profit += (item.price - cost) * item.quantity;
        }
      });
      entry.profit += profit;
    }
  });

  return Array.from(dataMap.entries()).map(([label, val]) => ({
    label,
    revenue: val.revenue,
    profit: val.profit,
    orders: val.orders,
  }));
}
