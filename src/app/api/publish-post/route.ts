import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Received post:", body);

    return NextResponse.json({
      success: true,
      message: "Post received",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process post" },
      { status: 500 }
    );
  }
}