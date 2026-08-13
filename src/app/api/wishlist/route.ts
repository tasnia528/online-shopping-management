import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product"; // Ensure Product model is registered

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    // Populate the wishlist products
    const user = await User.findOne({ email: session.user.email }).populate("wishlist");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ wishlist: user.wishlist || [] });
  } catch (error) {
    console.error("Fetch wishlist error:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Validate if product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Use $addToSet to avoid duplicates
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $addToSet: { wishlist: productId } },
      { new: true }
    ).populate("wishlist");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ wishlist: user.wishlist, message: "Added to wishlist" });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $pull: { wishlist: productId } },
      { new: true }
    ).populate("wishlist");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ wishlist: user.wishlist, message: "Removed from wishlist" });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}
