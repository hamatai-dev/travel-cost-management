-- ユーザーごとの初期残高(記録を始める前から手元にあった残高)を保存する。
-- ダッシュボードの「現在の総残高」は、この初期残高 + 全期間の収支(収入-支出)
-- として計算する。ユーザーごとに1行だけ持つ設定なので user_id を主キーにする。
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  initial_balance_jpy numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "user_settings_insert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id);
create policy "user_settings_delete_own" on public.user_settings
  for delete using (auth.uid() = user_id);
