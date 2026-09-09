// 無料・APIキー不要の日次為替レートAPI(fawazahmed0/currency-api)。
// npmパッケージのバージョンとして日付を指定することで過去日のレートを取得できる。
// jsdelivr(主)がダウンしている場合に備え、同プロジェクトが提供する
// Cloudflare Pages版(副)にフォールバックする。
function ratesUrl(host: "primary" | "fallback", date: string, currency: string) {
  return host === "primary"
    ? `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${currency}.json`
    : `https://${date}.currency-api.pages.dev/v1/currencies/${currency}.json`;
}

async function fetchFromHost(
  host: "primary" | "fallback",
  date: string,
  currency: string,
): Promise<number | null> {
  const res = await fetch(ratesUrl(host, date, currency));
  if (!res.ok) return null;

  const data = await res.json();
  const rate = data?.[currency]?.jpy;
  return typeof rate === "number" ? rate : null;
}

/**
 * 指定日における「1 fromCurrency あたり何円か」を取得する。
 * fromCurrency が JPY の場合はAPIを呼ばずレート1を返す。
 * 主系・副系ともに失敗した場合は null を返す(呼び出し側は未確定のまま扱う)。
 */
export async function fetchJpyRate(
  date: string,
  fromCurrency: string,
): Promise<number | null> {
  const currency = fromCurrency.toLowerCase();
  if (currency === "jpy") return 1;

  for (const host of ["primary", "fallback"] as const) {
    try {
      const rate = await fetchFromHost(host, date, currency);
      if (rate != null) return rate;
    } catch {
      // 次のホストを試す
    }
  }

  return null;
}
