-- デフォルトカテゴリに「観光・ツアー」(支出)を追加する。
insert into public.categories (user_id, name, is_default, kind)
select null, '観光・ツアー', true, 'expense'
where not exists (
  select 1 from public.categories where user_id is null and name = '観光・ツアー'
);
