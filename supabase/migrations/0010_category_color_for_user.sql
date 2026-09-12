-- カテゴリごとにユーザーが指定したバッジ色を保存する。デフォルトカテゴリ
-- (user_id is null)は全ユーザー共通の共有マスタなので直接色を持たせられない。
-- category_hidden_for_user / category_sort_order_for_user と同じく、ユーザーごとの
-- 上書き設定として持たせることで、自作カテゴリ・デフォルトカテゴリの両方に
-- 同じ仕組みで対応する。

create table public.category_color_for_user (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  color text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

alter table public.category_color_for_user enable row level security;

create policy "category_color_for_user_select_own" on public.category_color_for_user
  for select using (auth.uid() = user_id);
create policy "category_color_for_user_insert_own" on public.category_color_for_user
  for insert with check (auth.uid() = user_id);
create policy "category_color_for_user_update_own" on public.category_color_for_user
  for update using (auth.uid() = user_id);
create policy "category_color_for_user_delete_own" on public.category_color_for_user
  for delete using (auth.uid() = user_id);
