import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Anda telah berhasil keluar dari akun.",
  });
  clearSessionCookie(response);
  return response;
}
