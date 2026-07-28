insert into public.profiles (user_id, email, full_name, referral_code)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email,'@',1)),
       upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.id is null;

insert into public.wallets (user_id, available_balance, welcome_bonus)
select u.id, 0, 1000
from auth.users u
left join public.wallets w on w.user_id = u.id
where w.id is null;

insert into public.transactions (user_id, type, direction, amount, status, description)
select u.id, 'Welcome Bonus', 'in', 1000, 'completed', 'Promotional welcome bonus (non-withdrawable)'
from auth.users u
where not exists (
  select 1 from public.transactions t where t.user_id = u.id and t.type = 'Welcome Bonus'
);

insert into public.notifications (user_id, title, body, kind)
select u.id, 'Welcome to TrueNorth Financial',
  'Your $1,000 Welcome Bonus has been credited. It is promotional and cannot be withdrawn or invested. Make a deposit of at least $1,000 to unlock investment plans.', 'success'
from auth.users u
where not exists (
  select 1 from public.notifications n where n.user_id = u.id and n.title = 'Welcome to TrueNorth Financial'
);

insert into public.user_roles (user_id, role)
select u.id, 'user' from auth.users u
where not exists (select 1 from public.user_roles r where r.user_id = u.id and r.role = 'user')
on conflict do nothing;