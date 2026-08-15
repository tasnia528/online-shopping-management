import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Find order and populate products
    const order = await Order.findOne({ 
      _id: params.id,
      user: (session.user as any).id
    }).populate("items.product", "name price image");

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
