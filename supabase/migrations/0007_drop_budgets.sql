-- 「予算」機能をアプリから撤去する(支出・収入の管理に専念するため)。
-- budgets / category_budgets テーブルとそのデータを完全に削除する。

drop table if exists public.category_budgets;
drop table if exists public.budgets;
