import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const subscriptionEnds = new Date();
    subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);

    const subscription = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        subscriptionEnds,
        isSubscribed: true,
      },
    });

    return NextResponse.json({
      message: "Subscription created",
      subscriptionEnds: subscription.subscriptionEnds,
    });
  } catch (error) {
    console.error("Subscription error", error);
    return NextResponse.json({ error: "Subscription error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        subscriptionEnds: true,
        isSubscribed: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    const now = new Date();
    if (user.subscriptionEnds && user.subscriptionEnds < now) {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isSubscribed: false,
          subscriptionEnds: null,
        },
      });
      return NextResponse.json({
        message: "Subscription expired",
        subscriptionEnds: null,
        isSubscribed: false,
      });
    }
    return NextResponse.json({
      message: "Subscription active",
      subscriptionEnds: user.subscriptionEnds,
      isSubscribed: user.isSubscribed,
    });
  } catch (error) {
    console.error("Subscription error", error);
    return NextResponse.json({ error: "Subscription error" }, { status: 500 });
  }
}
