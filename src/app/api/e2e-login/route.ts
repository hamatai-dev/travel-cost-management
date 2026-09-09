import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// E2Eテスト専用のログインAPI。UIはメールのマジックリンクのみ提供しているため、
// Playwrightから毎回メール受信を待つのは非現実的。あらかじめ用意したテスト用
// アカウント(email/password)でセッションCookieを発行するための抜け道。
// 本番ビルド(NODE_ENV=production)では常に404を返し、機能しない。
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { email, password } = await request.json();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
