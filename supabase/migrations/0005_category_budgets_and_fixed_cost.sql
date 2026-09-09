-- 既にPhase 0〜7 + 使いやすさ改善分のschema.sqlを実行済みの環境向けの差分マイグレーション。
-- Supabase の SQL Editor でこのファイルの内容だけを実行すればよい
-- (schema.sql全体には既にこの内容が統合済みなので、新規セットアップ時は
-- schema.sql を実行するだけでこのファイルを別途実行する必要はない)。

-- 「AWS」「Netflix」のような毎月固定でかかる費用かどうか。旅の変動費と
-- 分けて見たいときに使う。共有のデフォルトカテゴリに影響させないため、
-- UI上は自分のカスタムカテゴリにだけ設定できるようにする。
alter table public.categories
  add column is_fixed_cost boolean not null default false;

create table public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount_jpy numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id)
);

alter table public.category_budgets enable row level security;

create policy "category_budgets_select_own" on public.category_budgets
  for select using (auth.uid() = user_id);
create policy "category_budgets_insert_own" on public.category_budgets
  for insert with check (auth.uid() = user_id);
create policy "category_budgets_update_own" on public.category_budgets
  for update using (auth.uid() = user_id);
create policy "category_budgets_delete_own" on public.category_budgets
  for delete using (auth.uid() = user_id);
