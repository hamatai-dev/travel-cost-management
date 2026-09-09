"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAuthError } from "@/lib/auth/formatAuthError";
import { updatePasswordSchema } from "@/lib/auth/resetPasswordSchema";
import { createClient } from "@/lib/supabase/client";
import { createNameSchema } from "@/lib/validation/nameSchema";

const displayNameSchema = createNameSchema("表示名", 50);

export default function MyPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const user = data.user;
      if (user) {
        setEmail(user.email ?? "");
        setDisplayName(
          typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
        );
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();

    const parsed = displayNameSchema.safeParse(displayName);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }

    setSavingName(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data } });
      if (error) throw new Error(formatAuthError(error));
      toast.success("表示名を更新しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePassword(e: FormEvent) {
    e.preventDefault();

    const parsed = updatePasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw new Error(formatAuthError(error));
      toast.success("パスワードを更新しました");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">マイページ</h1>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">アカウント情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="email" className="mb-1.5">
                  メールアドレス
                </Label>
                <Input id="email" value={email} disabled readOnly />
              </div>

              <form onSubmit={handleSaveName} className="space-y-2">
                <div>
                  <Label htmlFor="displayName" className="mb-1.5">
                    表示名
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="未設定の場合はメールアドレスが表示されます"
                  />
                </div>
                <Button type="submit" disabled={savingName} className="w-full">
                  {savingName ? "保存中..." : "表示名を保存する"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">パスワードを変更</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-3">
                <div>
                  <Label htmlFor="newPassword" className="mb-1.5">
                    新しいパスワード
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="newPasswordConfirm" className="mb-1.5">
                    新しいパスワード(確認)
                  </Label>
                  <Input
                    id="newPasswordConfirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={savingPassword} className="w-full">
                  {savingPassword ? "更新中..." : "パスワードを更新する"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
