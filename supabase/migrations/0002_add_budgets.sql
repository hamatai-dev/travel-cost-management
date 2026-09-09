-- 既にPhase 0〜3のschema.sqlを実行済みの環境向けの差分マイグレーション。
-- Supabase の SQL Editor でこのファイルの内容だけを実行すればよい
-- (schema.sql全体には既にこの内容が統合済みなので、新規セットアップ時は
-- schema.sql を実行するだけでこのファイルを別途実行する必要はない)。

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_jpy numeric(12, 2) not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.budgets enable row level security;

create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on public.budgets
  for update using (auth.uid() = user_id);
create policy "budgets_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);
