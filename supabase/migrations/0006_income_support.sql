-- 収入(給与・事業収入など)を支出と同じ取引ベースで扱えるようにする。
-- transactions に種別(支出/収入)を、categories にどちらの種別で使えるかを持たせる。

alter table public.transactions
  add column transaction_type text not null default 'expense'
    check (transaction_type in ('expense', 'income'));

alter table public.categories
  add column kind text not null default 'expense'
    check (kind in ('expense', 'income', 'both'));

-- 既存のデフォルトカテゴリは全て支出用(列のdefaultで既にexpenseだが明示しておく)
update public.categories set kind = 'expense' where is_default = true;

-- 収入用のデフォルトカテゴリを追加
insert into public.categories (user_id, name, is_default, kind) values
  (null, '給与', true, 'income'),
  (null, '事業収入', true, 'income'),
  (null, '利子・配当', true, 'income'),
  (null, '還付・キャッシュバック', true, 'income'),
  (null, 'その他収入', true, 'income');
