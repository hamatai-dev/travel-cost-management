import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// E2Eテスト専用のログインAPI。UIのメール+パスワードログインをPlaywrightの
// UI操作で毎回通すこともできるが、Google OAuthを含む画面遷移を避けて
// あらかじめ用意したテスト用アカウント(email/password)でセッションCookieを
// 直接発行するための抜け道として残している。
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
