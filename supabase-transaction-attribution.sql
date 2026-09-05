-- Lock the recorded-by name and account to the signed-in user.
-- This also fixes existing records whose visible staff name was typed manually.

create or replace function public.wbc_lock_transaction_attribution()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_name text;
begin
  if tg_op = 'INSERT' then
    -- During the temporary anonymous-policy testing period, leave anonymous
    -- legacy writes untouched. Every signed-in app user is locked here.
    if auth.uid() is not null then
      new.user_id := auth.uid();

      select nullif(trim(full_name), '')
      into account_name
      from public.profiles
      where id = auth.uid();

      new.staff := coalesce(account_name, 'Staff');
    end if;
  else
    -- An edit may change transaction details, but never its true author.
    new.user_id := old.user_id;
    new.staff := old.staff;
  end if;

  return new;
end;
$$;

drop trigger if exists wbc_lock_transaction_attribution on public.transactions;
create trigger wbc_lock_transaction_attribution
before insert or update on public.transactions
for each row
execute function public.wbc_lock_transaction_attribution();

-- Correct prior transactions using their true logged-in account ID.
update public.transactions as t
set staff = p.full_name
from public.profiles as p
where t.user_id = p.id
  and p.full_name is not null
  and p.full_name <> ''
  and t.staff is distinct from p.full_name;
