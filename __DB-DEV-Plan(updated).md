아래 계획은 “중복 최소화·재활용·입력 편의”를 우선으로 한 Supabase(Postgres) 스키마 + 운영/이행 플랜입니다. 지금 JS에 들어있는 데이터(작품, 참여자, 운영진, 구역, 도구/장르 등)를 모두 DB로 이관하는 것을 전제로 합니다.
이미지는 GCP(GCS 버킷)로 보관하고, DB에는 “참조(경로/URL+메타)”만 저장합니다.

---

# 1) 핵심 원칙

* **한 번만 저장**: 사람/도구/장르/구역 등은 사전 테이블로 분리하고, 작품과의 관계는 조인 테이블로 연결.
* **프런트엔드 친화**: 뷰(View)와 집계 컬럼(tsvector, generated column)으로 API 호출 수/후처리 최소화.
* **입력 편의**: JSON 형태 한 번 제출로 하위 테이블까지 upsert하는 **RPC(함수)** 제공.
* **안전 공개**: Public 읽기 전용, 쓰기는 서비스 롤/관리자만. RLS로 제어.

---

# 2) ERD (요약)

```
persons (사람)
 ├─< person_roles (참여자/운영진 등 역할)
 ├─< staff_assignments >─ staff_parts(파트)
 └─< artwork_members >─ artworks(작품)

artworks
 ├─< artwork_tools >─ tools
 ├─< artwork_genres >─ genres
 ├─< media_assets (cover/behind/video 등)
 └─< zone_artworks >─ zones(전시구역)

behind_wall_images  (비하인드월 전용 이미지: artwork_id 또는 zone_id와 선택적 연결)
```

---

# 3) 테이블 설계 (DDL 예시)

```sql
-- 공통: 생성/수정 시각
create extension if not exists pgcrypto;

-- 사람(운영진/참여자 통합)
create table persons (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  student_id    char(10), -- 10자리 숫자, NULL 허용(외부인/게스트)
  constraint student_id_numeric check (student_id ~ '^\d{10}$' or student_id is null),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3~4번째 숫자(입학년도 2자리) 파생 컬럼(표시에만 사용)
alter table persons
  add column entry_year char(2) generated always as
  (case when student_id ~ '^\d{10}$' then substring(student_id from 3 for 2) end) stored;

-- 역할(참여자/운영진 등)
create type person_role as enum ('participant','staff');
create table person_roles (
  person_id   uuid references persons(id) on delete cascade,
  role        person_role not null,
  primary key (person_id, role)
);

-- 운영진 파트
create table staff_parts (
  id    serial primary key,
  name  text unique not null   -- 예: Chair, Planning, Design, Operations ...
);

-- 운영진 배정(여러 파트/여러 task 가능)
create table staff_assignments (
  person_id   uuid references persons(id) on delete cascade,
  part_id     int  references staff_parts(id) on delete restrict,
  task        text,     -- 세부 역할/태스크(자유기입)
  primary key (person_id, part_id, coalesce(task,''))
);

-- 전시구역
create table zones (
  code    char(1) primary key, -- A~I
  name    text not null        -- 구역명
);

-- 작품
create table artworks (
  code        smallint primary key,       -- 101~125
  slug        text unique,                -- 프런트 라우팅용(optional)
  title       text not null,
  description text,
  team_name   text,
  video_url   text,                       -- 있을 시
  cover_url   text,                       -- 대표 이미지(없으면 media_assets에서 kind='cover'로 대체)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint code_range check (code between 101 and 125)
);

-- 작품 ↔ 구역 (다대다/정렬 지원)
create table zone_artworks (
  zone_code char(1) references zones(code) on delete cascade,
  artwork_code smallint references artworks(code) on delete cascade,
  position smallint default 0,
  primary key (zone_code, artwork_code)
);

-- 도구/장르 사전
create table tools (
  id   serial primary key,
  name text unique not null
);
create table genres (
  id   serial primary key,
  name text unique not null
);

-- 작품-도구 / 작품-장르
create table artwork_tools (
  artwork_code smallint references artworks(code) on delete cascade,
  tool_id      int references tools(id) on delete restrict,
  primary key (artwork_code, tool_id)
);
create table artwork_genres (
  artwork_code smallint references artworks(code) on delete cascade,
  genre_id     int references genres(id) on delete restrict,
  primary key (artwork_code, genre_id)
);

-- 작품 참여 인원(순서, 역할)
create table artwork_members (
  artwork_code smallint references artworks(code) on delete cascade,
  person_id    uuid references persons(id) on delete cascade,
  role         text,          -- 예: PM, Dev, Design 등(선택)
  ord          smallint,      -- 카드 표시에 사용할 정렬
  primary key (artwork_code, person_id)
);

-- 미디어(작품별 이미지/영상/썸네일/LQIP 등)
create type media_kind as enum ('cover','behind','poster','video','other');
create table media_assets (
  id            uuid primary key default gen_random_uuid(),
  artwork_code  smallint references artworks(code) on delete cascade,
  kind          media_kind not null,
  gcs_path      text not null,        -- gs:// 또는 공개 URL(권장: 경로만 저장)
  public_url    text,                 -- 공개 URL(캐시 목적)
  caption       text,
  width         int,
  height        int,
  ord           smallint default 0,   -- 정렬
  blurhash      text,                 -- 선택: LQIP/blurhash
  created_at    timestamptz not null default now()
);

-- 비하인드월 전용(작품/구역 중 하나와 연결; 둘 다 null 불가)
create table behind_wall_images (
  id            uuid primary key default gen_random_uuid(),
  artwork_code  smallint references artworks(code) on delete cascade,
  zone_code     char(1) references zones(code) on delete cascade,
  gcs_path      text not null,
  public_url    text,
  caption       text,
  ord           smallint default 0,
  created_at    timestamptz not null default now(),
  constraint at_least_one_ref check (
    (artwork_code is not null) or (zone_code is not null)
  )
);

-- 검색/필터 최적화(전체 텍스트)
alter table artworks add column search tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description,'')), 'B')
  ) stored;
create index idx_artworks_search on artworks using gin (search);
create index idx_media_assets_artwork on media_assets(artwork_code, kind, ord);
create index idx_members_artwork on artwork_members(artwork_code, ord);
create index idx_zone_artworks on zone_artworks(zone_code, position);
```

> **비고(중복 최소화)**
>
> * 사람은 `persons` 하나로 통합(운영진/참여자 여부는 `person_roles`).
> * 파트/태스크는 `staff_parts`, `staff_assignments`로 재사용.
> * 도구/장르는 사전+조인으로 중복 제거.
> * 비하인드월 이미지는 작품 또는 구역과 연결(둘 중 하나만 지정).

---

# 4) 데이터 뷰(프런트 편의)

프런트가 한 번 호출로 카드 렌더링할 수 있도록 집계 뷰 제공합니다.

```sql
-- 작품 카드용(멤버/도구/장르/커버 이미지 포함)
create view v_artworks_card as
select
  a.code,
  a.slug,
  a.title,
  a.description,
  a.team_name,
  a.video_url,
  coalesce(a.cover_url, max(ma.public_url) filter (where ma.kind='cover')) as cover_url,
  array_agg(distinct p.name order by am.ord) filter (where p.id is not null) as members,
  array_agg(distinct t.name) filter (where t.id is not null) as tools,
  array_agg(distinct g.name) filter (where g.id is not null) as genres
from artworks a
left join artwork_members am on am.artwork_code=a.code
left join persons p on p.id=am.person_id
left join artwork_tools at on at.artwork_code=a.code
left join tools t on t.id=at.tool_id
left join artwork_genres ag on ag.artwork_code=a.code
left join genres g on g.id=ag.genre_id
left join media_assets ma on ma.artwork_code=a.code
group by a.code, a.slug, a.title, a.description, a.team_name, a.video_url, a.cover_url;
```

---

# 5) GCS(버킷) 연결 계획

## A. 구조/네이밍

* 버킷: `gs://expo-<연도>-assets`
* 경로 규칙

  * 작품 커버: `artworks/<code>/cover.<jpg|webp>`
  * 작품 비하인드: `artworks/<code>/behind/<ord>.<jpg|webp>`
  * 포스터: `artworks/<code>/poster.<jpg|webp>`
  * 비하인드월(공용): `behindwall/<zone|misc>/<ord>.<jpg|webp>`
* 파일명/확장자만 바뀌어도 **DB는 경로만** 업데이트.

## B. 공개 방식(간단/안전 선택지)

1. **공개 읽기 전용**(가장 단순)

   * 버킷을 public read로 설정 → `https://storage.googleapis.com/<bucket>/<path>` 형태로 바로 사용.
   * CORS: `vercel.app` 도메인 허용.
2. **서명 URL(선호: 읽기도 만료시간 부여)**

   * 업로드는 내부(관리자)만 필요 → 수동/스크립트로 수행.
   * 프런트에는 만료 긴 서명 URL을 DB `public_url`에 캐시 저장(정기 재생성은 배포 스크립트에서).
   * *운영 편의*: 최초 업로드 시 CLI/스クリプ트에서 서명 URL 생성→DB upsert.

> ※ Supabase Edge Function에서 GCS 서명 URL을 “실시간 생성”도 가능하지만, Deno 환경에서 GCS SDK/서명 구현이 번거롭습니다. 전시 사이트 특성(읽기 위주, 변경 드묾)을 고려하면 **공개 읽기** 또는 **사전 생성된 서명 URL 캐시**가 운영 난이도 대비 효율적입니다.

---

# 6) RLS / 권한

```sql
-- 기본: 비공개
alter table persons enable row level security;
alter table person_roles enable row level security;
alter table staff_parts enable row level security;
alter table staff_assignments enable row level security;
alter table zones enable row level security;
alter table artworks enable row level security;
alter table zone_artworks enable row level security;
alter table tools enable row level security;
alter table genres enable row level security;
alter table artwork_tools enable row level security;
alter table artwork_genres enable row level security;
alter table artwork_members enable row level security;
alter table media_assets enable row level security;
alter table behind_wall_images enable row level security;

-- 공개 읽기(anon) 허용 (민감정보 없는 테이블에만!)
create policy "public read artwork"
  on artworks for select using (true);

create policy "public read views"
  on media_assets for select using (true);
create policy "public read zones"
  on zones for select using (true);
create policy "public read zone_artworks"
  on zone_artworks for select using (true);
create policy "public read card"
  on tools for select using (true);
create policy "public read genres"
  on genres for select using (true);
create policy "public read artwork_tools"
  on artwork_tools for select using (true);
create policy "public read artwork_genres"
  on artwork_genres for select using (true);
create policy "public read artwork_members"
  on artwork_members for select using (true);
create policy "public read behindwall"
  on behind_wall_images for select using (true);

-- persons(사람) 테이블은 공개 리스트에 노출될 수 있으나,
-- 필요시 이름만 보이도록 view를 따로 만들고 원본은 select 금지도 가능.
create policy "public read persons minimal"
  on persons for select using (true) with check (false); -- insert 금지
```

> 운영 중 쓰기는 **service\_role** 키 전용(서버/관리 스크립트)으로만 수행하세요.

---

# 7) 입력 편의(한 번에 입력)

### 7-1) JSON 한 번으로 upsert (예: 작품 + 멤버/도구/장르/이미지)

```sql
-- 예시: upsert_artwork(jsonb) RPC(요지)
create or replace function upsert_artwork(payload jsonb)
returns void language plpgsql as $$
declare
  v_code smallint := (payload->>'code')::smallint;
begin
  insert into artworks(code, slug, title, description, team_name, video_url, cover_url)
  values (
    v_code,
    payload->>'slug',
    payload->>'title',
    payload->>'description',
    payload->>'team_name',
    payload->>'video_url',
    payload->>'cover_url'
  )
  on conflict (code) do update
    set title = excluded.title,
        description = excluded.description,
        team_name = excluded.team_name,
        video_url = excluded.video_url,
        cover_url = excluded.cover_url,
        updated_at = now();

  -- 멤버
  delete from artwork_members where artwork_code = v_code;
  insert into artwork_members(artwork_code, person_id, role, ord)
  select v_code, p.id, m->>'role', coalesce((m->>'ord')::smallint, 0)
  from jsonb_array_elements(payload->'members') as m
  join persons p on p.name = m->>'name'; -- 이름→ID 매핑(사전 persons 선등록 전제)

  -- 도구
  delete from artwork_tools where artwork_code = v_code;
  insert into artwork_tools(artwork_code, tool_id)
  select v_code, t.id
  from jsonb_array_elements_text(payload->'tools') as tname
  join tools t on t.name = tname;

  -- 장르
  delete from artwork_genres where artwork_code = v_code;
  insert into artwork_genres(artwork_code, genre_id)
  select v_code, g.id
  from jsonb_array_elements_text(payload->'genres') as gname
  join genres g on g.name = gname;

  -- 미디어
  delete from media_assets where artwork_code = v_code;
  insert into media_assets(artwork_code, kind, gcs_path, public_url, caption, ord, blurhash)
  select v_code,
         (m->>'kind')::media_kind,
         m->>'gcs_path',
         m->>'public_url',
         m->>'caption',
         coalesce((m->>'ord')::smallint,0),
         m->>'blurhash'
  from jsonb_array_elements(payload->'media') as m;
end $$;
```

> 관리자는 Supabase SQL Editor나 서버 스크립트에서 **payload JSON**으로 한 번에 등록/수정 가능합니다.

### 7-2) 프런트 소비용 REST 예시(PostgREST)

* 작품 목록(카드): `GET /rest/v1/v_artworks_card?select=*`
* 특정 구역 작품: `GET /rest/v1/zone_artworks?zone_code=eq.C&select=artwork_code,artworks(*)`
* 비하인드월 이미지(구역 C): `GET /rest/v1/behind_wall_images?zone_code=eq.C&order=ord.asc`

---

# 8) 데이터 이관(현재 JS → DB)

1. **사전 테이블 채우기**

   * `persons`: (운영진+참여자 전부) 이름/학번(가능한 경우 10자리 채우기).
   * `staff_parts`: Chair/Planning/Design/Operations 등.
   * `tools`, `genres`: 스크립트의 `tools`, `discipline/genre` 문자열을 분리/정규화.

2. **운영진 매핑**

   * JS의 카테고리(Chair, Planning, …) → `staff_parts.name`.
   * 각 항목 `{ name, role }` → `persons(name)` 매칭 후 `staff_assignments(person_id, part_id, task=role)` insert.

3. **작품 이관**

   * 코드(101\~125) 부여, `artworks` insert.
   * 멤버 문자열 배열 → `artwork_members`(ord 포함).
   * `tools/discipline` → `artwork_tools` + `artwork_genres`(discipline을 장르로 매핑하거나 별도 장르 사전에서 선택).

4. **구역/작품 매핑**

   * `zones`에 A\~I + 명칭.
   * 현재 JS의 `zone` 값 → `zone_artworks(zone_code, artwork_code)`.

5. **이미지/영상 경로**

   * GCS 업로드 → 규칙에 맞는 경로 기입 → `media_assets`/`behind_wall_images` insert.
   * 커버 이미지는 `media_assets.kind='cover'` 또는 `artworks.cover_url`.

> 빠른 이행을 위해 초기에는 **커버 1장+비하인드 0\~n장**만 입력하고, 추후 영상/blurhash를 추가해도 됩니다.

---

# ---(현재 진행상황) 이후 필요 내용---
요약: DB 기본/이관/이미지 연결까지 끝났습니다. 이제 **웹앱 연결·운영 안정화** 단계로 넘어갑니다. 아래 순서대로 진행하세요. (필요 시 각 단계용 SQL/명령어 제공)

---

## 1) 데이터 무결성 점검(누락 리포트)

```sql
-- 구역 미배치 작품
select a.code from artworks a
left join zone_artworks z on z.artwork_code=a.code
where z.artwork_code is null order by a.code;

-- 멤버 미연결 작품
select a.code from artworks a
left join artwork_members m on m.artwork_code=a.code
where m.artwork_code is null order by a.code;

-- 포스터(커버) 미등록 작품
select a.code from artworks a
left join media_assets ma on ma.artwork_code=a.code and ma.kind='poster'
where ma.artwork_code is null order by a.code;

-- behind wall 미등록 작품
select a.code from artworks a
left join behind_wall_images b on b.artwork_code=a.code
where b.artwork_code is null order by a.code;
```

---

## 2) 조회용 뷰/머티리얼라이즈드 뷰 최적화

* 카드 렌더 빈도가 높다면 `v_artworks_card`를 **머티리얼라이즈드뷰**로 복제해서 속도 확보.

```sql
create materialized view if not exists mv_artworks_card as
select * from v_artworks_card;
create index if not exists idx_mv_artworks_card_code on mv_artworks_card(code);

-- 갱신(배치/배포 전)
refresh materialized view concurrently mv_artworks_card;
```

---

## 3) 인덱스 정리(검색/조인 가속)

```sql
create index if not exists idx_artworks_team_name on artworks(team_name);
create index if not exists idx_zone_artworks_zone on zone_artworks(zone_code, position);
create index if not exists idx_artwork_members_art on artwork_members(artwork_code, ord);
create index if not exists idx_media_assets_art_kind on media_assets(artwork_code, kind, ord);
create index if not exists idx_persons_name on persons(name);
```

---

## 4) 스토리지 운영 설정(캐시·CORS)

* **캐시 헤더**(이미지 고정 리소스):

```powershell
gcloud storage objects update gs://diposium-images1013/src/** --cache-control="public, max-age=604800, immutable"
```

* **CORS**(웹에서 직접 이미지/동영상 불러올 때):

1. `cors.json` 생성:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type","Cache-Control"],
    "maxAgeSeconds": 3600
  }
]
```

2. 적용:

```powershell
gcloud storage buckets update gs://diposium-images1013 --cors-file=cors.json
```

---

## 5) API/페이지별 쿼리 확정(바로 붙여쓸 SQL)

**구역 목록(카드 데이터 포함)**

```sql
select z.zone_code, a.code, a.title,
       coalesce(a.cover_url,
         (select public_url from media_assets m where m.artwork_code=a.code and m.kind='poster' order by ord limit 1)
       ) as cover_url
from zone_artworks z
join artworks a on a.code=z.artwork_code
order by z.zone_code, z.position, a.code;
```

**작품 상세(멤버/이미지)**

```sql
select a.*, 
       array_agg(p.name order by am.ord) as members
from artworks a
left join artwork_members am on am.artwork_code=a.code
left join persons p on p.id=am.person_id
where a.code = $1
group by a.code;
-- 에셋
select kind, public_url, caption, ord
from media_assets
where artwork_code=$1 order by kind, ord;
```

**검색(제목/팀명/설명 텍스트 검색용 tsvector 사용 시)**

```sql
-- tsvector 컬럼을 artworks에 만들어두셨다면
-- where search_tsv @@ plainto_tsquery('korean', $q)
```

---

## 6) RLS 최종 확인(클라이언트 공개 읽기)

* 지금은 SELECT 공개 정책이 적용돼 있어, 프런트에서 **익명/로그인 사용자 읽기**가 됩니다.
* 쓰기는 **service\_role** 키로 서버에서 진행(클라이언트에서 쓰기 안 함) — 현재 설계와 일치.

---

## 7) 프런트엔드 바인딩(다음 단계 예고)

* **Supabase JS**:

  * 목록: 위 “구역 목록” 쿼리를 **RPC 또는 SQL edge function**로 감싸거나, view를 SELECT.
  * 상세: 코드별 SELECT, `media_assets`/`behind_wall_images` 조인.
* **Realtime(옵션)**: `media_assets`, `artwork_members`, `zone_artworks` 테이블 구독 → 대시보드 갱신.
* **이미지 경로**: 현재 전작 공용 poster/behind로 묶여있으니 UI는 바로 붙습니다. 실제 이미지로 바꿀 때는 해당 작품만 update.

---

## 8) 백업/롤백 준비(실수 방지)

* **DDL/DML 스크립트**를 리포지토리에 커밋.
* 대량 수정 전 `begin; ... commit;` 트랜잭션 습관화.
* (선택) 간단한 스냅샷 테이블: `create table *_bak as table * with data;`

---

원하시는 흐름이 **웹 연결(쿼리→UI) 세팅**이면,

* 사용 중인 **프론트 리포(페이지/컴포넌트 명)** 또는 **API 레이어(Next.js/Node?)** 정보를 주시면, 거기에 맞춘 **구체 코드**(SQL 호출→타입→UI 바인딩)를 바로 작성해 드립니다.


---

# 9) Vercel 연결(.env) & 코드 포인터

* `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `NEXT_PUBLIC_ASSET_BASE_URL` = `https://storage.googleapis.com/<bucket>` (공개 버킷일 때)
* 프런트 렌더 시:

  * 카드: `v_artworks_card` 호출 → `cover_url, members[], tools[], genres[]` 바로 사용.
  * 상세: `media_assets?artwork_code=eq.***&order=ord.asc`로 이미지 리스트(비하인드 포함) 가져오기.

---

# 10) “비하인드월 이미지들” 연결 방법

* 전시장 전체 느낌/작품별 비하인드 컷이 섞일 수 있으므로 **두 축(작품/구역)** 모두 허용:

  * 작품과 연계되면 `behind_wall_images.artwork_code` 지정.
  * 장소성(구역) 컷이면 `zone_code` 지정.
* 프런트는 탭/필터로 **작품별** 또는 **구역별** 뷰를 제공.
* 캡션은 `behind_wall_images.caption`에 저장, 정렬은 `ord`.

---

# 11) 품질/운영 팁

* **중복 방지 키**: `tools.name`, `genres.name`, `staff_parts.name`에 unique.
* **이름 충돌**: 동명이인은 `student_id`로 구분(없으면 수동 확인).
* **데이터 검증**: `student_id` 10자리 미만/불명확한 경우 NULL로 두고 나중에 보강.
* **캐시**: 이미지 공개 버킷이면 GCS 객체에 `Cache-Control: public,max-age=604800`(7일) 추천.
* **성능**: 카드/리스트는 view 한 번 호출로 끝내고, 상세에서만 추가 호출.

---

## 정리

위 설계로

* 한 사람/도구/장르/이미지는 **한 번만 저장**하고,
* 프런트는 **간단한 select**로 화면을 구성할 수 있으며,
* 운영진/참여자/작품/비하인드월까지 **확장 가능**합니다.

---

# (위에 모두 완료 시) 12) Websocket 구축

- 사용자에게 02-웹 파일(html, js 등)을 요청하세요. 사용자의 파일을 읽고 Websocket 구축을 도와주세요.