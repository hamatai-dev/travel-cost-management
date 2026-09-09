"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAuthError } from "@/lib/auth/formatAuthError";
import { updatePasswordSchema } from "@/lib/auth/resetPasswordSchema";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "submitting" | "error";

// パスワードリセットメールのリンク経由(/auth/callback?next=/reset-password)で
// 到達する前提のページ。この時点で既にリカバリー用のセッションが確立されている
// ので、ここでは新しいパスワードを受け取ってupdateUserするだけでよい。
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const parsed = updatePasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setStatus("error");
      setErrorMessage(parsed.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }

    setStatus("submitting");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      setStatus("error");
      setErrorMessage(
        `${formatAuthError(error)}(リンクの有効期限が切れている場合は、もう一度パスワードリセットをお試しください)`,
      );
      return;
    }

    toast.success("パスワードを更新しました");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>新しいパスワードを設定</CardTitle>
          <p className="text-sm text-muted-foreground">
            ログインに使う新しいパスワードを入力してください。
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="password" className="mb-1.5">
                新しいパスワード
              </Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="mb-1.5">
                新しいパスワード(確認)
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={status === "submitting"} className="w-full">
              {status === "submitting" ? "更新中..." : "パスワードを更新する"}
            </Button>
            {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
