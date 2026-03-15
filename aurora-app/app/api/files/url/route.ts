import { NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { readSession } from "@/lib/server-session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await readSession(cookieStore);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storageId = searchParams.get('storageId');

    if (!storageId) {
      return NextResponse.json(
        { error: 'Storage ID is required' },
        { status: 400 }
      );
    }

    // Get file URL from Convex
    const url = await convex.mutation(api.files.getUrl, {
      storageId: storageId as Id<"_storage">,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error getting file URL:', error);
    return NextResponse.json(
      { error: 'Failed to get file URL' },
      { status: 500 }
    );
  }
}
