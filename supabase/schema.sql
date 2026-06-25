-- access_codes table
create table if not exists access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  used_by uuid references auth.users(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- voice_profiles table
create table if not exists voice_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  transcription text not null,
  profile_text text not null,
  created_at timestamptz default now()
);

-- scripts table
create table if not exists scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  platform text not null,
  theme text not null,
  duration text not null,
  objective text not null,
  content text not null,
  created_at timestamptz default now()
);

-- RLS policies
alter table access_codes enable row level security;
alter table voice_profiles enable row level security;
alter table scripts enable row level security;

-- access_codes: only service role can read/write (validated via API routes)
create policy "Service role full access on access_codes"
  on access_codes for all using (true);

-- voice_profiles: user can read/write their own
create policy "Users can manage their own voice profile"
  on voice_profiles for all
  using (auth.uid() = user_id);

-- scripts: user can manage their own
create policy "Users can manage their own scripts"
  on scripts for all
  using (auth.uid() = user_id);
