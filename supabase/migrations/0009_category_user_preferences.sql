-- カテゴリに対するユーザーごとの「見た目」の好み(非表示・並び順)を保存する。
-- デフォルトカテゴリ(user_id is null)は全ユーザー共通の共有マスタなので直接
-- 削除・並び替えできない。その代わり、ユーザーごとに「自分の一覧からは隠す」
-- 「自分の一覧ではこの順番で表示する」を上書きできるようにする。
-- 自作のカテゴリ(user_id = 自分)にも同じ仕組みをそのまま使える。

create table public.category_hidden_for_user (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

alter table public.category_hidden_for_user enable row level security;

create policy "category_hidden_for_user_select_own" on public.category_hidden_for_user
  for select using (auth.uid() = user_id);
create policy "category_hidden_for_user_insert_own" on public.category_hidden_for_user
  for insert with check (auth.uid() = user_id);
create policy "category_hidden_for_user_delete_own" on public.category_hidden_for_user
  for delete using (auth.uid() = user_id);

create table public.category_sort_order_for_user (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  sort_order integer not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

alter table public.category_sort_order_for_user enable row level security;

create policy "category_sort_order_for_user_select_own" on public.category_sort_order_for_user
  for select using (auth.uid() = user_id);
create policy "category_sort_order_for_user_insert_own" on public.category_sort_order_for_user
  for insert with check (auth.uid() = user_id);
create policy "category_sort_order_for_user_update_own" on public.category_sort_order_for_user
  for update using (auth.uid() = user_id);
create policy "category_sort_order_for_user_delete_own" on public.category_sort_order_for_user
  for delete using (auth.uid() = user_id);
