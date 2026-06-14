import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import Notification from "@/models/Notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadPayload(userId: string) {
  await connectToDatabase();

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return { notifications, unreadCount };
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const userId = session.user.id;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = async () => {
        if (closed) return;
        try {
          const payload = await loadPayload(userId);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
        } catch (error) {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: "Failed to load notifications" })}\n\n`)
          );
        }
      };

      await send();
      const interval = setInterval(send, 5_000);
      const maxLifetime = setTimeout(() => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      }, 55_000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearTimeout(maxLifetime);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
