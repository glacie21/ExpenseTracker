import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Anda telah berhasil keluar dari akun.",
    });

    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memproses logout.",
      },
      { status: 500 }
    );
  }
}
