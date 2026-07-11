create view public.admin_booking_calendar as
select
  b.id,
  b.client_id,
  c.full_name as client_name,
  c.email as client_email,
  b.dog_id,
  COALESCE(booking_dogs.dog_names, d.name) as dog_name,
  b.service_name,
  b.starts_at,
  b.ends_at,
  b.timezone,
  b.location,
  b.status,
  b.source,
  b.sync_status,
  b.outlook_event_id,
  b.outlook_web_link,
  b.needs_review,
  COALESCE(
    b.cover_image_url,
    booking_dogs.cover_image_url,
    d.profile_photo_url
  ) as cover_image_url,
  b.notes
from
  portal_bookings b
  join portal_clients c on c.id = b.client_id
  join portal_dogs d on d.id = b.dog_id
  left join lateral (
    select
      string_agg(
        pd.name,
        ' & '::text
        order by
          (
            array_position(
              COALESCE(
                NULLIF(b.dog_ids, array[]::uuid[]),
                array[b.dog_id]
              ),
              pd.id
            )
          )
      ) as dog_names,
      (
        array_agg(
          pd.profile_photo_url
          order by
            (
              array_position(
                COALESCE(
                  NULLIF(b.dog_ids, array[]::uuid[]),
                  array[b.dog_id]
                ),
                pd.id
              )
            )
        ) filter (
          where
            pd.profile_photo_url is not null
        )
      ) [1] as cover_image_url
    from
      portal_dogs pd
    where
      pd.id = any (
        COALESCE(
          NULLIF(b.dog_ids, array[]::uuid[]),
          array[b.dog_id]
        )
      )
  ) booking_dogs on true
union all
select
  i.id,
  i.client_id,
  COALESCE(c.full_name, i.client_name) as client_name,
  c.email as client_email,
  i.dog_id,
  COALESCE(d.name, i.dog_name) as dog_name,
  i.service_name,
  i.starts_at,
  i.ends_at,
  i.timezone,
  i.location,
  i.status,
  'outlook'::text as source,
  'needs_review'::text as sync_status,
  i.outlook_event_id,
  i.outlook_web_link,
  i.needs_review,
  null::text as cover_image_url,
  i.notes
from
  portal_outlook_imports i
  left join portal_clients c on c.id = i.client_id
  left join portal_dogs d on d.id = i.dog_id
where
  i.linked_booking_id is null;

  ----

  create view public.portal_booking_list
with
  (security_invoker = true) as
select
  c.calendar_feed_token,
  b.id,
  b.client_id,
  c.full_name as client_name,
  c.email as client_email,
  b.dog_id,
  COALESCE(booking_dogs.dog_names, d.name) as dog_name,
  b.service_name,
  b.starts_at,
  b.ends_at,
  b.timezone,
  b.location,
  b.status,
  b.source,
  b.sync_status,
  b.outlook_event_id,
  b.outlook_web_link,
  b.needs_review,
  COALESCE(
    b.cover_image_url,
    booking_dogs.cover_image_url,
    d.profile_photo_url
  ) as cover_image_url,
  b.notes
from
  portal_bookings b
  join portal_clients c on c.id = b.client_id
  join portal_dogs d on d.id = b.dog_id
  left join lateral (
    select
      string_agg(
        pd.name,
        ' & '::text
        order by
          (
            array_position(
              COALESCE(
                NULLIF(b.dog_ids, array[]::uuid[]),
                array[b.dog_id]
              ),
              pd.id
            )
          )
      ) as dog_names,
      (
        array_agg(
          pd.profile_photo_url
          order by
            (
              array_position(
                COALESCE(
                  NULLIF(b.dog_ids, array[]::uuid[]),
                  array[b.dog_id]
                ),
                pd.id
              )
            )
        ) filter (
          where
            pd.profile_photo_url is not null
        )
      ) [1] as cover_image_url
    from
      portal_dogs pd
    where
      pd.id = any (
        COALESCE(
          NULLIF(b.dog_ids, array[]::uuid[]),
          array[b.dog_id]
        )
      )
  ) booking_dogs on true
where
  c.auth_user_id = auth.uid ();
  
-----

create view public.portal_booking_list
with
  (security_invoker = true) as
select
  c.calendar_feed_token,
  b.id,
  b.client_id,
  c.full_name as client_name,
  c.email as client_email,
  b.dog_id,
  COALESCE(booking_dogs.dog_names, d.name) as dog_name,
  b.service_name,
  b.starts_at,
  b.ends_at,
  b.timezone,
  b.location,
  b.status,
  b.source,
  b.sync_status,
  b.outlook_event_id,
  b.outlook_web_link,
  b.needs_review,
  COALESCE(
    b.cover_image_url,
    booking_dogs.cover_image_url,
    d.profile_photo_url
  ) as cover_image_url,
  b.notes
from
  portal_bookings b
  join portal_clients c on c.id = b.client_id
  join portal_dogs d on d.id = b.dog_id
  left join lateral (
    select
      string_agg(
        pd.name,
        ' & '::text
        order by
          (
            array_position(
              COALESCE(
                NULLIF(b.dog_ids, array[]::uuid[]),
                array[b.dog_id]
              ),
              pd.id
            )
          )
      ) as dog_names,
      (
        array_agg(
          pd.profile_photo_url
          order by
            (
              array_position(
                COALESCE(
                  NULLIF(b.dog_ids, array[]::uuid[]),
                  array[b.dog_id]
                ),
                pd.id
              )
            )
        ) filter (
          where
            pd.profile_photo_url is not null
        )
      ) [1] as cover_image_url
    from
      portal_dogs pd
    where
      pd.id = any (
        COALESCE(
          NULLIF(b.dog_ids, array[]::uuid[]),
          array[b.dog_id]
        )
      )
  ) booking_dogs on true
where
  c.auth_user_id = auth.uid ();

-----

create view public.portal_calendar_feed
with
  (security_invoker = true) as
select
  c.calendar_feed_token as feed_token,
  b.id,
  b.client_id,
  c.full_name as client_name,
  c.email as client_email,
  b.dog_id,
  COALESCE(booking_dogs.dog_names, d.name) as dog_name,
  b.service_name,
  b.starts_at,
  b.ends_at,
  b.timezone,
  b.location,
  b.status,
  b.source,
  b.sync_status,
  b.outlook_event_id,
  b.outlook_web_link,
  b.needs_review,
  COALESCE(
    b.cover_image_url,
    booking_dogs.cover_image_url,
    d.profile_photo_url
  ) as cover_image_url,
  b.notes
from
  portal_bookings b
  join portal_clients c on c.id = b.client_id
  join portal_dogs d on d.id = b.dog_id
  left join lateral (
    select
      string_agg(
        pd.name,
        ' & '::text
        order by
          (
            array_position(
              COALESCE(
                NULLIF(b.dog_ids, array[]::uuid[]),
                array[b.dog_id]
              ),
              pd.id
            )
          )
      ) as dog_names,
      (
        array_agg(
          pd.profile_photo_url
          order by
            (
              array_position(
                COALESCE(
                  NULLIF(b.dog_ids, array[]::uuid[]),
                  array[b.dog_id]
                ),
                pd.id
              )
            )
        ) filter (
          where
            pd.profile_photo_url is not null
        )
      ) [1] as cover_image_url
    from
      portal_dogs pd
    where
      pd.id = any (
        COALESCE(
          NULLIF(b.dog_ids, array[]::uuid[]),
          array[b.dog_id]
        )
      )
  ) booking_dogs on true
where
  b.status = any (
    array[
      'confirmed'::text,
      'reschedule_requested'::text,
      'completed'::text
    ]
  );

-----

create table public.portal_client_activity (
  id uuid not null default gen_random_uuid (),
  client_id uuid not null,
  activity_type text not null default 'update'::text,
  title text not null,
  body text null,
  created_at timestamp with time zone not null default now(),
  constraint portal_client_activity_pkey primary key (id),
  constraint portal_client_activity_client_id_fkey foreign KEY (client_id) references portal_clients (id) on delete CASCADE
) TABLESPACE pg_default;

-----

create table public.portal_clients (
  id uuid not null default gen_random_uuid (),
  auth_user_id uuid null,
  full_name text not null,
  email text not null,
  calendar_feed_token text null default encode(extensions.gen_random_bytes (24), 'hex'::text),
  created_at timestamp with time zone not null default now(),
  first_name text null,
  phone text null,
  address text null,
  avatar_url text null,
  updated_at timestamp with time zone not null default now(),
  status text not null default 'active'::text,
  constraint portal_clients_pkey primary key (id),
  constraint portal_clients_auth_user_id_key unique (auth_user_id),
  constraint portal_clients_calendar_feed_token_key unique (calendar_feed_token),
  constraint portal_clients_email_key unique (email),
  constraint portal_clients_auth_user_id_fkey foreign KEY (auth_user_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create trigger portal_clients_link_unmatched_invoices
after INSERT
or
update OF email,
full_name on portal_clients for EACH row
execute FUNCTION link_unmatched_portal_invoices ();

create trigger portal_clients_set_updated_at BEFORE
update on portal_clients for EACH row
execute FUNCTION set_updated_at ();

-----

create view public.portal_dashboard
with
  (security_invoker = true) as
select
  c.id as client_id,
  c.full_name as client_name,
  d.id as dog_id,
  d.name as dog_name,
  d.profile_photo_url as dog_photo_url,
  COALESCE(d.hero_photo_url, d.profile_photo_url) as hero_photo_url,
  b.id as upcoming_booking_id,
  b.service_name,
  b.starts_at,
  b.ends_at,
  b.location,
  b.status as booking_status,
  COALESCE(b.cover_image_url, d.profile_photo_url) as booking_image_url,
  u.title as latest_update_title,
  u.body as latest_update_body,
  COALESCE(
    u.image_url,
    b.cover_image_url,
    d.profile_photo_url
  ) as latest_update_image_url,
  u.shared_at as latest_update_shared_at
from
  portal_clients c
  join portal_dogs d on d.client_id = c.id
  left join lateral (
    select
      b_1.id,
      b_1.client_id,
      b_1.dog_id,
      b_1.service_name,
      b_1.starts_at,
      b_1.ends_at,
      b_1.timezone,
      b_1.location,
      b_1.status,
      b_1.source,
      b_1.sync_status,
      b_1.sync_error,
      b_1.outlook_event_id,
      b_1.outlook_calendar_id,
      b_1.outlook_ical_uid,
      b_1.outlook_change_key,
      b_1.outlook_web_link,
      b_1.outlook_last_synced_at,
      b_1.needs_review,
      b_1.cancelled_at,
      b_1.cover_image_url,
      b_1.notes,
      b_1.created_at,
      b_1.updated_at,
      b_1.dog_ids
    from
      portal_bookings b_1
    where
      b_1.client_id = c.id
      and b_1.dog_id = d.id
      and b_1.starts_at >= now()
    order by
      b_1.starts_at
    limit
      1
  ) b on true
  left join lateral (
    select
      u_1.id,
      u_1.booking_id,
      u_1.client_id,
      u_1.dog_id,
      u_1.title,
      u_1.body,
      u_1.image_url,
      u_1.status,
      u_1.shared_at
    from
      portal_session_updates u_1
    where
      u_1.client_id = c.id
      and u_1.dog_id = d.id
    order by
      u_1.shared_at desc
    limit
      1
  ) u on true
where
  c.auth_user_id = auth.uid ();

-----

create table public.portal_dogs (
  id uuid not null default gen_random_uuid (),
  client_id uuid not null,
  name text not null,
  profile_photo_url text null,
  hero_photo_url text null,
  created_at timestamp with time zone not null default now(),
  breed text null,
  age text null,
  status text not null default 'Active'::text,
  notes text null,
  constraint portal_dogs_pkey primary key (id),
  constraint portal_dogs_client_id_fkey foreign KEY (client_id) references portal_clients (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists portal_dogs_client_id_idx on public.portal_dogs using btree (client_id) TABLESPACE pg_default;

-----

create table public.portal_galleries (
  id uuid not null default gen_random_uuid (),
  client_id uuid not null,
  dog_id uuid not null,
  title text not null default 'New gallery'::text,
  status text not null default 'draft'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  published_at timestamp with time zone null,
  constraint portal_galleries_pkey primary key (id),
  constraint portal_galleries_client_id_fkey foreign KEY (client_id) references portal_clients (id) on delete CASCADE,
  constraint portal_galleries_dog_id_fkey foreign KEY (dog_id) references portal_dogs (id) on delete CASCADE,
  constraint portal_galleries_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'published'::text,
          'archived'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger set_portal_gallery_updated_at BEFORE
update on portal_galleries for EACH row
execute FUNCTION set_portal_gallery_updated_at ();

-----

create view public.portal_gallery
with
  (security_invoker = true) as
select
  gi.id,
  g.id as gallery_id,
  g.title,
  d.name as dog_name,
  gi.image_url,
  gi.alt_text,
  COALESCE(gi.delivered_at, g.published_at) as delivered_at,
  gi.created_at,
  COALESCE(b.starts_at, g.published_at, g.created_at) as session_date
from
  portal_gallery_items gi
  join portal_galleries g on g.id = gi.gallery_id
  join portal_clients c on c.id = g.client_id
  join portal_dogs d on d.id = g.dog_id
  left join portal_bookings b on b.id = gi.booking_id
where
  g.status = 'published'::text
  and c.auth_user_id = auth.uid ();

-----

create table public.portal_gallery_activity (
  id uuid not null default gen_random_uuid (),
  gallery_id uuid null,
  action text not null,
  body text null,
  created_at timestamp with time zone not null default now(),
  constraint portal_gallery_activity_pkey primary key (id),
  constraint portal_gallery_activity_gallery_id_fkey foreign KEY (gallery_id) references portal_galleries (id) on delete CASCADE
) TABLESPACE pg_default;

-----

create table public.portal_gallery_items (
  id uuid not null default gen_random_uuid (),
  booking_id uuid null,
  client_id uuid not null,
  dog_id uuid not null,
  image_url text not null,
  alt_text text null,
  delivered_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  gallery_id uuid null,
  constraint portal_gallery_items_pkey primary key (id),
  constraint portal_gallery_items_booking_id_fkey foreign KEY (booking_id) references portal_bookings (id) on delete CASCADE,
  constraint portal_gallery_items_client_id_fkey foreign KEY (client_id) references portal_clients (id) on delete CASCADE,
  constraint portal_gallery_items_dog_id_fkey foreign KEY (dog_id) references portal_dogs (id) on delete CASCADE,
  constraint portal_gallery_items_gallery_id_fkey foreign KEY (gallery_id) references portal_galleries (id) on delete CASCADE
) TABLESPACE pg_default;

-----

create table public.portal_invoices (
  id uuid not null default gen_random_uuid (),
  portal_client_id uuid null,
  invoice_number text not null,
  client_name text null,
  client_email text null,
  dog_names text[] not null default '{}'::text[],
  issued_on date not null default CURRENT_DATE,
  due_on date null,
  amount_cents integer not null,
  currency text not null default 'EUR'::text,
  status text not null default 'pending'::text,
  payment_reference text not null,
  revolut_transaction_id text null,
  paid_on timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  client_address text null,
  service_period_start date null,
  service_period_end date null,
  line_items jsonb not null default '[]'::jsonb,
  client_phone text null,
  payment_title text null,
  payment_url text null,
  revolut_order_id text null,
  service_name text null,
  duration_minutes integer null,
  billing_days integer null,
  constraint portal_invoices_pkey primary key (id),
  constraint portal_invoices_invoice_number_key unique (invoice_number),
  constraint portal_invoices_payment_reference_key unique (payment_reference),
  constraint portal_invoices_revolut_transaction_id_key unique (revolut_transaction_id),
  constraint portal_invoices_portal_client_id_fkey foreign KEY (portal_client_id) references portal_clients (id) on delete set null,
  constraint portal_invoices_amount_cents_check check ((amount_cents >= 0)),
  constraint portal_invoices_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'sent'::text,
          'pending'::text,
          'paid'::text,
          'overdue'::text,
          'refunded'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists portal_invoices_client_id_idx on public.portal_invoices using btree (portal_client_id) TABLESPACE pg_default;

create index IF not exists portal_invoices_status_idx on public.portal_invoices using btree (status) TABLESPACE pg_default;

create index IF not exists portal_invoices_due_on_idx on public.portal_invoices using btree (due_on) TABLESPACE pg_default;

create index IF not exists portal_invoices_payment_reference_idx on public.portal_invoices using btree (payment_reference) TABLESPACE pg_default;

create index IF not exists portal_invoices_client_email_idx on public.portal_invoices using btree (lower(client_email)) TABLESPACE pg_default;

create index IF not exists portal_invoices_revolut_order_id_idx on public.portal_invoices using btree (revolut_order_id) TABLESPACE pg_default;

create trigger portal_invoices_updated_at BEFORE
update on portal_invoices for EACH row
execute FUNCTION set_portal_invoices_updated_at ();

-----

create table public.portal_outlook_imports (
  id uuid not null default gen_random_uuid (),
  outlook_event_id text not null,
  outlook_ical_uid text null,
  outlook_change_key text null,
  outlook_web_link text null,
  subject text not null,
  service_name text not null default 'Outlook booking'::text,
  client_name text not null default 'Client to confirm'::text,
  dog_name text not null default 'Dog to confirm'::text,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  timezone text not null default 'Europe/Dublin'::text,
  location text null,
  notes text null,
  sensitivity text null,
  status text not null default 'needs_review'::text,
  needs_review boolean not null default true,
  linked_booking_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  client_id uuid null,
  dog_id uuid null,
  constraint portal_outlook_imports_pkey primary key (id),
  constraint portal_outlook_imports_outlook_event_id_key unique (outlook_event_id),
  constraint portal_outlook_imports_client_id_fkey foreign KEY (client_id) references portal_clients (id) on delete set null,
  constraint portal_outlook_imports_dog_id_fkey foreign KEY (dog_id) references portal_dogs (id) on delete set null,
  constraint portal_outlook_imports_linked_booking_id_fkey foreign KEY (linked_booking_id) references portal_bookings (id) on delete set null,
  constraint portal_outlook_imports_valid_time check ((ends_at > starts_at))
) TABLESPACE pg_default;

create index IF not exists portal_outlook_imports_client_id_idx on public.portal_outlook_imports using btree (client_id) TABLESPACE pg_default;

create index IF not exists portal_outlook_imports_dog_id_idx on public.portal_outlook_imports using btree (dog_id) TABLESPACE pg_default;

create index IF not exists portal_outlook_imports_starts_at_idx on public.portal_outlook_imports using btree (starts_at) TABLESPACE pg_default;

create index IF not exists portal_outlook_imports_linked_booking_id_idx on public.portal_outlook_imports using btree (linked_booking_id) TABLESPACE pg_default;

create trigger portal_outlook_imports_set_updated_at BEFORE
update on portal_outlook_imports for EACH row
execute FUNCTION set_updated_at ();

-----

create view public.portal_profile
with
  (security_invoker = true) as
select
  c.id as client_id,
  c.full_name,
  c.email,
  c.phone,
  c.address,
  c.avatar_url,
  c.created_at,
  dogs.dog_names,
  dogs.dog_photo_url,
  COALESCE(activity.items, '[]'::jsonb) as recent_activity
from
  portal_clients c
  left join lateral (
    select
      string_agg(
        d.name,
        ' and '::text
        order by
          d.created_at
      ) as dog_names,
      (
        array_agg(
          d.profile_photo_url
          order by
            d.created_at
        )
      ) [1] as dog_photo_url
    from
      portal_dogs d
    where
      d.client_id = c.id
  ) dogs on true
  left join lateral (
    select
      jsonb_agg(
        to_jsonb(a.*)
        order by
          a.created_at desc
      ) as items
    from
      (
        select
          a_1.id,
          a_1.client_id,
          a_1.activity_type,
          a_1.title,
          a_1.body,
          a_1.created_at
        from
          portal_client_activity a_1
        where
          a_1.client_id = c.id
        order by
          a_1.created_at desc
        limit
          10
      ) a
  ) activity on true
where
  c.auth_user_id = auth.uid ();

-----

create view public.portal_profile
with
  (security_invoker = true) as
select
  c.id as client_id,
  c.full_name,
  c.email,
  c.phone,
  c.address,
  c.avatar_url,
  c.created_at,
  dogs.dog_names,
  dogs.dog_photo_url,
  COALESCE(activity.items, '[]'::jsonb) as recent_activity
from
  portal_clients c
  left join lateral (
    select
      string_agg(
        d.name,
        ' and '::text
        order by
          d.created_at
      ) as dog_names,
      (
        array_agg(
          d.profile_photo_url
          order by
            d.created_at
        )
      ) [1] as dog_photo_url
    from
      portal_dogs d
    where
      d.client_id = c.id
  ) dogs on true
  left join lateral (
    select
      jsonb_agg(
        to_jsonb(a.*)
        order by
          a.created_at desc
      ) as items
    from
      (
        select
          a_1.id,
          a_1.client_id,
          a_1.activity_type,
          a_1.title,
          a_1.body,
          a_1.created_at
        from
          portal_client_activity a_1
        where
          a_1.client_id = c.id
        order by
          a_1.created_at desc
        limit
          10
      ) a
  ) activity on true
where
  c.auth_user_id = auth.uid ();

-----

create table public.site_page_visits (
  id uuid not null default gen_random_uuid (),
  visitor_id text not null,
  path text not null default '/'::text,
  title text null,
  referrer text null,
  user_agent text null,
  first_seen_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint site_page_visits_pkey primary key (id),
  constraint site_page_visits_visitor_id_path_key unique (visitor_id, path)
) TABLESPACE pg_default;

create index IF not exists site_page_visits_last_seen_at_idx on public.site_page_visits using btree (last_seen_at desc) TABLESPACE pg_default;

create index IF not exists site_page_visits_path_idx on public.site_page_visits using btree (path) TABLESPACE pg_default;

create trigger site_page_visits_updated_at BEFORE
update on site_page_visits for EACH row
execute FUNCTION set_site_page_visits_updated_at ();