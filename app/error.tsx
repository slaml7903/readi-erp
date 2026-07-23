"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button, Card } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[portal-page-error]", error.digest ?? "unknown"); }, [error.digest]);
  return <Card className="mx-auto max-w-xl p-8 text-center"><CircleAlert aria-hidden="true" size={36} className="mx-auto text-red-500" /><h1 className="mt-4 text-lg font-bold">화면을 불러오지 못했습니다.</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.</p><Button type="button" onClick={reset} className="mt-5"><RefreshCw aria-hidden="true" size={16} />다시 시도</Button></Card>;
}
