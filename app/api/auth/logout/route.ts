import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth/jwt";

export async function POST() {
  try {
    await removeAuthCookie();
    return NextResponse.json({ message: "Logout successful" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
