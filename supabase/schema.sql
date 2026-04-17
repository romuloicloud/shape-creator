-- ============================================================
-- Shape Criator — Schema de usuários
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- ------------------------------------------------------------
-- 1. Perfis de usuário (dados físicos do aluno)
-- ------------------------------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  age          int not null,
  height_cm    numeric(5,1) not null,
  weight_kg    numeric(5,1) not null,
  goal_weight  numeric(5,1) not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. Fotos do aluno (caminhos no Storage)
-- ------------------------------------------------------------
create table if not exists user_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  frente     text not null,
  costas     text not null,
  lado_esq   text not null,
  lado_dir   text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Análise biomecânica (saída do Agente Biomecânico)
-- ------------------------------------------------------------
create table if not exists ai_analysis (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  posture_feedback jsonb not null default '{}',
  imbalances       text[],
  priority_focus   text,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. Macros diários (saída do Agente Nutricional)
-- ------------------------------------------------------------
create table if not exists daily_macros (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  calories   int not null,
  protein_g  int not null,
  carbs_g    int not null,
  fat_g      int not null,
  date       date not null default current_date,
  unique (user_id, date)
);

-- ------------------------------------------------------------
-- 5. Prescrição de treino (saída do Agente Coach)
-- ------------------------------------------------------------
create table if not exists workouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  protocol   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. Row Level Security — cada aluno vê só os seus dados
-- ------------------------------------------------------------
alter table profiles     enable row level security;
alter table user_photos  enable row level security;
alter table ai_analysis  enable row level security;
alter table daily_macros enable row level security;
alter table workouts     enable row level security;

create policy "User owns profile"
  on profiles for all using (auth.uid() = id);

create policy "User owns photos"
  on user_photos for all using (auth.uid() = user_id);

create policy "User owns analysis"
  on ai_analysis for all using (auth.uid() = user_id);

create policy "User owns macros"
  on daily_macros for all using (auth.uid() = user_id);

create policy "User owns workouts"
  on workouts for all using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. Storage bucket para fotos (privado)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('user-photos', 'user-photos', false)
on conflict (id) do nothing;

create policy "User uploads own photos"
  on storage.objects for insert
  with check (bucket_id = 'user-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "User reads own photos"
  on storage.objects for select
  using (bucket_id = 'user-photos' and auth.uid()::text = (storage.foldername(name))[1]);
