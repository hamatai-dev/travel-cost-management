export interface AuthErrorLike {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Supabase Authのエラーを、可能な範囲でユーザーに分かる日本語メッセージに変換する。
 * 「失敗しました」とだけ表示すると原因(レート制限なのか、単純な間違いなのか)が
 * 分からず対処のしようがないため、既知のエラーは具体的に言い換え、それ以外は
 * Supabaseが返した元のメッセージをそのまま出す。
 */
export function formatAuthError(error: AuthErrorLike): string {
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return "メール送信の回数制限に達しました。しばらく時間を置いてから再度お試しください。";
  }

  return error.message;
}
