"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loginSchema } from "@/lib/auth/loginSchema";
import { requestPasswordResetSchema } from "@/lib/auth/resetPasswordSchema";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "submitting" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setStatus("error");
      setErrorMessage(parsed.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }

    setStatus("submitting");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      setStatus("error");
      setErrorMessage("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setStatus("idle");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setGoogleLoading(false);
      setStatus("error");
      setErrorMessage("Googleログインの開始に失敗しました");
      return;
    }
    // 成功時はブラウザがGoogleの認証画面へ遷移するため、ここでのstate更新は不要
  }

  async function handleForgotPassword() {
    const parsed = requestPasswordResetSchema.safeParse({ email });
    if (!parsed.success) {
      setStatus("error");
      setErrorMessage(parsed.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }

    setStatus("idle");
    setResetLoading(true);
    const supabase = createClient();
    // リンクを踏んだ後、Supabaseのverify処理を経て/auth/callbackに戻ってくる。
    // next=/reset-passwordを付けておくことで、ログインさせるだけでなく
    // 新しいパスワードの入力画面まで案内する。
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setResetLoading(false);

    if (error) {
      toast.error("パスワードリセットメールの送信に失敗しました");
      return;
    }
    toast.success("パスワードリセット用のメールを送信しました。メールをご確認ください。");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>支出管理アプリ ログイン</CardTitle>
          <p className="text-sm text-muted-foreground">
            メールアドレスとパスワード、またはGoogleアカウントでログインします。
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="email" className="mb-1.5">
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password" className="mb-1.5">
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={status === "submitting"} className="w-full">
              {status === "submitting" ? "ログイン中..." : "ログイン"}
            </Button>
            {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
            <button
              type="button"
              disabled={resetLoading}
              onClick={handleForgotPassword}
              className="text-sm text-muted-foreground underline disabled:opacity-50"
            >
              {resetLoading ? "送信中..." : "パスワードをお忘れですか?"}
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">または</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={googleLoading}
            onClick={handleGoogleLogin}
          >
            {googleLoading ? "リダイレクト中..." : "Googleでログイン"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
