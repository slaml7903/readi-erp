import { NextResponse } from "next/server";

import { searchGlobalData } from "@/features/search/services/global-search.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const results = await searchGlobalData(query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "전역 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
