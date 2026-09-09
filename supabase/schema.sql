-- 支出管理アプリ スキーマ定義
-- Supabase の SQL Editor でそのまま実行する想定。
-- 個人利用(1ユーザー)から複数ユーザーSaaS化まで、テーブル構造を変えずに
-- 対応できるよう、全テーブルに user_id を持たせ RLS で分離する。

create extension if not exists "pgcrypto";

-- ==========================================
-- accounts: 支払い手段マスタ(楽天カード/三井住友カード/エポスカード/Wise/現金)
-- ==========================================
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('credit_card', 'debit_card', 'cash')),
  created_at timestamptz not null default now(),
  -- 「存在確認→作成」の間の競合(自動同期が同時に走る等)で同じ口座が
  -- 二重に作られないようにする。アプリ側は制約違反時に既存の口座を再取得する。
  unique (user_id, name, type)
);

alter table public.accounts enable row level security;

create policy "accounts_select_own" on public.accounts
  for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts
  for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts
  for update using (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts
  for delete using (auth.uid() = user_id);

-- ==========================================
-- categories: カテゴリマスタ(user_id が null のものは全ユーザー共通のデフォルト)
-- ==========================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  -- 「AWS」「Netflix」のような毎月固定でかかる費用かどうか。旅の変動費と
  -- 分けて見たいときに使う。共有のデフォルトカテゴリに影響させないため、
  -- UI上は自分のカスタムカテゴリにだけ設定できるようにする。
  is_fixed_cost boolean not null default false,
  -- 支出用/収入用/両方どちらでも使えるか。入力フォームやカテゴリ別集計で
  -- 支出と収入のカテゴリを混同しないためのフィルタに使う。
  kind text not null default 'expense' check (kind in ('expense', 'income', 'both')),
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_select_own_or_default" on public.categories
  for select using (auth.uid() = user_id or user_id is null);
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- ==========================================
-- transactions: 支出の共通スキーマ(手入力・CSVインポート・現金入力すべてここに正規化)
-- ==========================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,

  date date not null,
  merchant text,
  memo text,

  amount_original numeric(12, 2) not null,
  currency_original text not null default 'JPY',
  -- 円建てで確定済みのカード(三井住友/エポス/楽天)は取込時に確定値が入るが、
  -- Wise・現金など現地通貨で記録するものは null のままにし、分析時に為替レートで
  -- 都度換算する(換算結果はここにキャッシュしてよい)。
  amount_jpy numeric(12, 2),
  fx_rate numeric(12, 6),

  country text,
  city text,

  source text not null check (source in ('csv_import', 'manual', 'cash')),
  -- 支出か収入か。ノマド収入(給与・事業収入など)も同じテーブルで扱い、
  -- ダッシュボードで収支(収入-支出)として一元管理する。
  transaction_type text not null default 'expense' check (transaction_type in ('expense', 'income')),

  -- CSV再インポート時の重複防止用ハッシュ: account_id+date+amount+merchant から生成
  dedupe_hash text not null,

  -- オフライン入力時にクライアント側で採番する一意キー(重複同期防止)
  client_uuid uuid,

  created_at timestamptz not null default now(),
  synced_at timestamptz,

  unique (user_id, dedupe_hash)
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_user_account_idx on public.transactions (user_id, account_id);

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- ==========================================
-- import_batches: CSV取込履歴(重複取込の把握・取消用)
-- ==========================================
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  file_name text,
  row_count integer not null default 0,
  imported_at timestamptz not null default now()
);

alter table public.import_batches enable row level security;

create policy "import_batches_select_own" on public.import_batches
  for select using (auth.uid() = user_id);
create policy "import_batches_insert_own" on public.import_batches
  for insert with check (auth.uid() = user_id);
create policy "import_batches_delete_own" on public.import_batches
  for delete using (auth.uid() = user_id);

-- transactions -> import_batches の紐付け。import_batches は transactions より
-- 後で定義されるため、ここでまとめて追加する。バッチを削除すると、そのバッチで
-- 取り込んだ取引もまとめて削除される(「このインポートを取り消す」機能のため)。
alter table public.transactions
  add column import_batch_id uuid references public.import_batches(id) on delete cascade;

create index transactions_import_batch_idx on public.transactions (import_batch_id);

-- ==========================================
-- デフォルトカテゴリ(全ユーザー共通、user_id は null)
-- ==========================================
insert into public.categories (user_id, name, is_default, kind) values
  (null, '食費', true, 'expense'),
  (null, '外食', true, 'expense'),
  (null, '交通', true, 'expense'),
  (null, '宿泊', true, 'expense'),
  (null, '娯楽', true, 'expense'),
  (null, '通信', true, 'expense'),
  (null, '日用品', true, 'expense'),
  (null, 'その他', true, 'expense'),
  (null, '給与', true, 'income'),
  (null, '事業収入', true, 'income'),
  (null, '利子・配当', true, 'income'),
  (null, '還付・キャッシュバック', true, 'income'),
  (null, 'その他収入', true, 'income');
