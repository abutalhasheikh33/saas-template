import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const pageNo = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || ITEMS_PER_PAGE;

    const skip = (pageNo - 1) * pageSize;

    const search = searchParams.get("search") || "";

    const where: any = {
      userId: userId,
    };
    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [todos, total] = await prisma.$transaction([
      prisma.todo.findMany({
        where,
        take: pageSize,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.todo.count({ where }),
    ]);
    const totalPages = Math.ceil(total / pageSize);
    return NextResponse.json({
      todos,
      total,
      pageNo,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { title } = body;
    if (!title) {
      return NextResponse.json(
        { error: "Missing required field" },
        { status: 400 },
      );
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        todos: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isSubscribed && user.todos.length >= 3) {
      return NextResponse.json(
        { error: "Free users can only have 3 todos. Upgrade to premium." },
        { status: 403 },
      );
    }
    const todo = await prisma.todo.create({
      data: {
        title,
        userId,
      },
    });
    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
