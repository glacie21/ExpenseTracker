import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";


export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada sesi aktif",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Auth Me API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data profil pengguna",
      },
      { status: 500 }
    );
  }
}
