create or replace function public.delete_own_account(confirmation_email text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  account_user_id uuid := auth.uid();
  account_email text;
  client_ids uuid[];
begin
  if account_user_id is null then
    raise exception 'You must be signed in to delete your account.';
  end if;

  select lower(trim(email)) into account_email from auth.users where id = account_user_id;
  if account_email is null or account_email <> lower(trim(confirmation_email)) then
    raise exception 'That email address does not match your account.';
  end if;

  select coalesce(array_agg(id), '{}'::uuid[]) into client_ids
  from public.portal_clients where auth_user_id = account_user_id;

  delete from public.portal_invoices
  where portal_client_id = any(client_ids) or lower(trim(client_email)) = account_email;
  delete from public.portal_outlook_imports where client_id = any(client_ids);
  delete from public.portal_clients where id = any(client_ids);
  delete from public.portal_push_tokens where auth_user_id = account_user_id;
  delete from public.portal_profiles where auth_user_id = account_user_id;
  delete from auth.users where id = account_user_id;

  return true;
end;
$$;

revoke all on function public.delete_own_account(text) from public;
grant execute on function public.delete_own_account(text) to authenticated;
