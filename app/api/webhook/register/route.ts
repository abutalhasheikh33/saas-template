import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error("Please add webhook secret to your .env file");
    }
    const headersList = await headers();
    const svixId = headersList.get("svix-id");
    const svixTimestamp = headersList.get("svix-timestamp");
    const svixSignature = headersList.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing Svix headers" },
        { status: 400 },
      );
    }
    const payload = await req.json();
    const body = JSON.stringify(payload);
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;
    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch (error) {
      console.error("Error verifying webhook:", error);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 },
      );
    }
    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType == "user.created") {
      const { email_addresses, primary_email_address_id } = evt.data;
      const primaryEmail = email_addresses.find(
        (email) => email.id === primary_email_address_id,
      );
      if (!primaryEmail) {
        return NextResponse.json(
          { error: "Primary email not found" },
          { status: 400 },
        );
      }
      const newUser = await prisma.user.create({
        data: {
          id,
          email: primaryEmail.email_address,
        },
      });
      console.log("New user created:", newUser);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating user in database" },
      { status: 500 },
    );
  }
}
