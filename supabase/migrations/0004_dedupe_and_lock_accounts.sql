-- 既にPhase 0〜7のschema.sqlを実行済みの環境向けの差分マイグレーション。
-- Supabase の SQL Editor でこのファイルの内容だけを実行すればよい
-- (schema.sql全体には既にこの内容が統合済みなので、新規セットアップ時は
-- schema.sql を実行するだけでこのファイルを別途実行する必要はない)。
--
-- 背景: 「存在確認→作成」の間に別のリクエストが同じ名前+種別の口座を
-- 先に作ってしまう競合状態(例: ページ読み込み時と復帰時の自動同期がほぼ同時に
-- 走り、どちらも「現金口座がない」と判定して2件作ってしまう)により、
-- 同じユーザーに同名・同種別の口座が複数できてしまうことがあった。
-- 既存の重複を1つにまとめたうえで、以後同じ問題が起きないよう
-- unique制約を追加する(アプリ側は既に対応済み: 制約違反時は既存の口座を
-- 再取得するようになっている)。

begin;

-- 重複している口座ごとに、最も古い1件を「正」として残すマッピングを作る
create temporary table account_dedup_map as
with ranked as (
  select id, user_id, name, type,
         row_number() over (
           partition by user_id, name, type
           order by created_at asc, id asc
         ) as rn
  from public.accounts
)
select dup.id as duplicate_id, canon.id as canonical_id
from ranked dup
join ranked canon
  on dup.user_id = canon.user_id
  and dup.name = canon.name
  and dup.type = canon.type
  and canon.rn = 1
where dup.rn > 1;

-- 重複していた口座を参照していた取引・インポート履歴を「正」の口座に付け替える
update public.transactions t
set account_id = m.canonical_id
from account_dedup_map m
where t.account_id = m.duplicate_id;

update public.import_batches b
set account_id = m.canonical_id
from account_dedup_map m
where b.account_id = m.duplicate_id;

-- 参照がなくなった重複口座を削除する
delete from public.accounts a
using account_dedup_map m
where a.id = m.duplicate_id;

-- 今後同じ名前+種別の口座が二重に作られないようにする
alter table public.accounts
  add constraint accounts_user_name_type_unique unique (user_id, name, type);

commit;
