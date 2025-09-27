# Behind Wall 프로젝트 구조

```
Behind Wall/
|- 01-wall.html
|- 02-comment.html
|- 03-contributors.html
|- 04-artworks.html
|- index.html
|- script.js
|- styles.css
|- package.json
|- package-lock.json
|- .gitignore
|- cors.json
|- lifecycle.json
|-.database_downloaded/ <!-- supabase에 있는 DB 테이블을 다운로드한 파일 (DB 파악/참고용) -->
|- node_modules/
|- lib/
  └ - supabase.ts
|- (old)DB-DEV-Plan.md <!-- DB 구축 계획 파일 (완료) -->
|- (old)instruction.md <!-- 지시용 파일 (완료) -->
|- .archive elements examples/ <!-- 외부 코드를 copy 하기 위한 폴더 -->
|- .test/ <!-- 테스트용 개인 폴더 -->
\- src/ <!-- (비공개) GCS 버킷 연결용 -->
```

---

# 전시 기획 노트

Diposium이라는 전시회에서 빔프로젝트로 한쪽 벽면을 가로로 길게 채울 웹을 제작하고 있어. 아직 가로 길이가 확정이 나질 않았어. 따라서 모든 요소의 크기를 반응형(가로기준)으로 만들어줘.

## 전시 정보

- 전시구역: A ~ J
- 참여자 작품코드: 101 ~ 125
- 각 Exhibition 구역(C,E,F) 전시코드 매칭
  - C:101~111
  - E:112~116
  - F:117~125

### 팀 정보 (개인 참가 제외)
```
[
  {
    "팀장": "진서연",
    "팀원": ["황은빈"]
  },
  {
    "팀장": "조수빈",
    "팀원": ["김영우", "김성은"]
  },
  {
    "팀장": "김효준",
    "팀원": ["오주희", "이주빈", "한서은"]
  },
  {
    "팀장": "권준서",
    "팀원": ["안현영", "장서영", "정재희"]
  },
  {
    "팀장": "이서진",
    "팀원": ["조은서", "Ar Raudhah"]
  },
  {
    "팀장": "박재은",
    "팀원": ["신민주", "장서영", "이아림", "정지원"]
  },
  {
    "팀장": "지서현",
    "팀원": ["이지인"]
  }
]

```

---

### 전시작품 정보: 각 작품 코드와 각 전시자 이름(팀일 경우, 대표이름)
```
[
  { "이름": "조수빈", "작품코드": 101 },
  { "이름": "이서진", "작품코드": 102 },
  { "이름": "진가언", "작품코드": 103 },
  { "이름": "이현지", "작품코드": 104 },
  { "이름": "최수현", "작품코드": 105 },
  { "이름": "전인서", "작품코드": 106 },
  { "이름": "박지영", "작품코드": 107 },
  { "이름": "권준서", "작품코드": 108 },
  { "이름": "노서진", "작품코드": 109 },
  { "이름": "박재은", "작품코드": 110 },
  { "이름": "진서연", "작품코드": 111 },
  { "이름": "김지원", "작품코드": 112 },
  { "이름": "이채빈", "작품코드": 113 },
  { "이름": "김효준", "작품코드": 114 },
  { "이름": "권민주", "작품코드": 115 },
  { "이름": "권미진", "작품코드": 116 },
  { "이름": "이시현", "작품코드": 117 },
  { "이름": "최수연", "작품코드": 118 },
  { "이름": "김가영", "작품코드": 119 },
  { "이름": "윤샘", "작품코드": 120 },
  { "이름": "이수인", "작품코드": 121 },
  { "이름": "서혜린", "작품코드": 122 },
  { "이름": "안현영", "작품코드": 123 },
  { "이름": "이유경", "작품코드": 124 },
  { "이름": "지서현", "작품코드": 125 }
]
```

## 공통 내용

- !important! 인코딩 방식: UTF-8 (UTF-8 with BOM 아님!!)
- spacebar로 홈으로 이동
- 모든 요소의 크기는 반응형(가로기준)
- 동의어: 각 작품 커버이미지 = 최종이미지 = 작품이미지 = 포스터 = 최종 포스터
- 스크롤이 가능하던지 불가능하던지 간에, 모든 페이지에서 스크롤바는 표시하지 않음 (모든 스크롤바 hide)
- 마우스 커서의 모양은 임의로 부여 (기본 마우스모양 x) -> hover 경우에도 따로 부여
- js에 적혀진 데이터를 제외한 모든 데이터는 supabase의 DB에서 가져옵니다.

## index.html
전시 오프닝(시작) 화면, 메뉴 선택

## 01-wall.html
비하인드 월. 참여자의 제작 과정(기획, 스토리보드, 스케치, 작업 사진, 스샷 등)을 담은 페이지.
- 1F ~ 7F 까지 전시 과정을 순차적으로 보여줌. (사진과 캡션(간단 텍스트))
  - 1F이 시작, 7F이 최종 poster (artwork 커버 이미지. 04-artworks.html의 각 카드 이미지와 동일)
  - 1F ~ 7F은 같은 UI를 공유. 다음 층으로 넘어갈 때 내부 이미지와 텍스트만 바뀜. 각 요소 위치 변동 없음!
  - 스크롤 방식으로 다음 층 전환 가능
  - 우측 sidebar에 버튼을 만들어 1F~7F 전환 가능
- 배경은 전시장의 실제 도면(SVG로 넣을 예정)
- 배경 위에 각 artwork의 사진 카드가 위치 (사진카드는 각 #id 기반 absolute로 위치 예정)
  - 각 사진은 DB에서 가져와 로드할 예정
  - 모든 층에서 사진카드 hover 시, 7F(최종 포스터)
- 해당 페이지에서 click이 일어나지 않으면 자동으로 1F ~ 7F까지 특정 주기로 다음층으로 넘어감
  - spacebar로 홈으로 이동가능
  - 홈으로 이동하도록 하단에 문구 유도

## 02-comment.html
관람객이 실시간으로 각 전시작품에 남긴 익명 코멘트를 볼 수 있는 페이지.
- 전시장에서 각 전시작품 옆에 QR 코드를 배치 -> 연결된 웹페이지에서 각 전시작품을 지정하여 코멘트를 바로 남길 수 있도록 할 예정. (연결된 웹페이지에서 코멘트를 남기면, 해당 작품코드 바로 지정되게끔)
- 02-comment.html에서도 .open-composer를 통해 웹에서 바로 코멘트를 남길 수 있음
- 그렇게 전송된 코멘트를 전부 이 페이지에서 실시간 표시.
- 각 코멘트에 실시간 좋아요 상호 작용 가능 -> 실시간 표시 (좋아요 수는 실시간 카운트)
- 코멘트 포함 내용: {(선택)전시구역(기본값: All), (선택)작품코드, 작성 시간, 텍스트(코멘트) 내용, 이모지, 좋아요 버튼/좋아요 개수}
- 입력 창에서 미리 리스트업 되어있는 이모지 or 고정문구 를 선택할 수 있음. (고정문구는 자동입력)
- websocket 통신. 코멘트 추가와 좋아요 수 수집은 실시간 반영.
- 코멘트를 남길 때 전시구역 또는 작품코드 지정 가능.
- 코멘트 표시화면에서 전시구역 또는 작품코드로 필터링 가능
- 코멘트 표시화면에서 {최신순(기본값), 좋아요순, 오래된순, 긴 글순}으로 정렬 선택 가능
- 코멘트가 표시되는 박스만 스크롤 가능(전체 스크롤x)

## 03-contributors.html
전시회 참여자와 전시 운영진(스태프)의 이름을 모두 볼 수 있는 페이지
- 참여자 표시: 분야별로 한 카드로 묶어 표시 (2D,3D,UX/UI,Game,Film..)
- 운영진 표시(staff): 파트별로 한 카드로 묶어 표시 (운영/기획/디자인...)
- 모든 카드는 #id 기반 absolute로 직접 배치
- 스크롤 불가

## 04-artworks.html
모든 전시작품(artowrk)의 정보(작품이름, 작품 설명, 포스터, 제작 인원, 툴(사용 프로그램), 분야)를 카드 UI로 한눈에 볼 수 있는 페이지.
- 그리드 형태로 배치
- 스크롤 가능
- 작품

---

## supabase DB schema (SQL)
```
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.artwork_genres (
  artwork_code smallint NOT NULL,
  genre_id integer NOT NULL,
  CONSTRAINT artwork_genres_pkey PRIMARY KEY (genre_id, artwork_code),
  CONSTRAINT artwork_genres_artwork_code_fkey FOREIGN KEY (artwork_code) REFERENCES public.artworks(code),
  CONSTRAINT artwork_genres_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.genres(id)
);
CREATE TABLE public.artwork_members (
  artwork_code smallint NOT NULL,
  person_id uuid NOT NULL,
  role text,
  ord smallint,
  CONSTRAINT artwork_members_pkey PRIMARY KEY (artwork_code, person_id),
  CONSTRAINT artwork_members_artwork_code_fkey FOREIGN KEY (artwork_code) REFERENCES public.artworks(code),
  CONSTRAINT artwork_members_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.artwork_tools (
  artwork_code smallint NOT NULL,
  tool_id integer NOT NULL,
  CONSTRAINT artwork_tools_pkey PRIMARY KEY (tool_id, artwork_code),
  CONSTRAINT artwork_tools_artwork_code_fkey FOREIGN KEY (artwork_code) REFERENCES public.artworks(code),
  CONSTRAINT artwork_tools_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id)
);
CREATE TABLE public.artworks (
  code smallint NOT NULL CHECK (code >= 101 AND code <= 125),
  slug text UNIQUE,
  title text NOT NULL,
  description text,
  team_name text,
  video_url text,
  cover_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  search tsvector DEFAULT (setweight(to_tsvector('simple'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('simple'::regconfig, COALESCE(description, ''::text)), 'B'::"char")),
  search_tsv tsvector,
  CONSTRAINT artworks_pkey PRIMARY KEY (code)
);
CREATE TABLE public.behind_wall_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  artwork_code smallint,
  zone_code character,
  gcs_path text NOT NULL,
  public_url text,
  caption text,
  ord smallint DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT behind_wall_images_pkey PRIMARY KEY (id),
  CONSTRAINT behind_wall_images_artwork_code_fkey FOREIGN KEY (artwork_code) REFERENCES public.artworks(code),
  CONSTRAINT behind_wall_images_zone_code_fkey FOREIGN KEY (zone_code) REFERENCES public.zones(code)
);
CREATE TABLE public.comment_reactions (
  comment_id uuid NOT NULL,
  emoji text NOT NULL,
  count integer NOT NULL DEFAULT 1 CHECK (count >= 0),
  CONSTRAINT comment_reactions_pkey PRIMARY KEY (comment_id, emoji),
  CONSTRAINT comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.comment_zones (
  comment_id uuid NOT NULL,
  zone_code character NOT NULL DEFAULT 'ALL'::bpchar CHECK (zone_code ~ '^[A-J]$'::text),
  artwork_code smallint,
  CONSTRAINT comment_zones_pkey PRIMARY KEY (comment_id, zone_code),
  CONSTRAINT comment_zones_zone_code_fkey FOREIGN KEY (zone_code) REFERENCES public.zones(code),
  CONSTRAINT comment_zones_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  text text NOT NULL CHECK (length(text) >= 1 AND length(text) <= 500),
  author_name text,
  author_dept text,
  author_sid text CHECK (author_sid ~ '^\d{10}$'::text OR author_sid IS NULL),
  artwork_code integer,
  artwork_title text,
  artwork_poster text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  source_ip_hash text,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_artwork_code_fkey FOREIGN KEY (artwork_code) REFERENCES public.artworks(code)
);
CREATE TABLE public.genres (
  id integer NOT NULL DEFAULT nextval('genres_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT genres_pkey PRIMARY KEY (id)
);
CREATE TABLE public.media_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  artwork_code smallint,
  kind USER-DEFINED NOT NULL,
  gcs_path text NOT NULL,
  public_url text,
  caption text,
  width integer,
  height integer,
  ord smallint DEFAULT 0,
  blurhash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_pkey PRIMARY KEY (id),
  CONSTRAINT media_assets_artwork_code_fkey FOREIGN KEY (artwork_code) REFERENCES public.artworks(code)
);
CREATE TABLE public.person_roles (
  person_id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  CONSTRAINT person_roles_pkey PRIMARY KEY (role, person_id),
  CONSTRAINT person_roles_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.persons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  student_id character varying CHECK (student_id::text ~ '^\d{2}$'::text OR student_id IS NULL),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT persons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.staff_assignments (
  person_id uuid NOT NULL,
  part_id integer NOT NULL,
  task text NOT NULL DEFAULT ''::text,
  CONSTRAINT staff_assignments_pkey PRIMARY KEY (task, person_id, part_id),
  CONSTRAINT staff_assignments_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id),
  CONSTRAINT staff_assignments_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.staff_parts(id)
);
CREATE TABLE public.staff_parts (
  id integer NOT NULL DEFAULT nextval('staff_parts_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT staff_parts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.team_members (
  team_id integer NOT NULL,
  person_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['leader'::text, 'member'::text])),
  CONSTRAINT team_members_pkey PRIMARY KEY (team_id, person_id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_members_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.teams (
  id integer NOT NULL DEFAULT nextval('teams_id_seq'::regclass),
  leader_id uuid UNIQUE,
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.persons(id)
);
CREATE TABLE public.tools (
  id integer NOT NULL DEFAULT nextval('tools_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT tools_pkey PRIMARY KEY (id)
);
CREATE TABLE public.zone_artworks (
  zone_code character NOT NULL,
  artwork_code smallint NOT NULL,
  position smallint DEFAULT 0,
  CONSTRAINT zone_artworks_pkey PRIMARY KEY (artwork_code, zone_code),
  CONSTRAINT zone_artworks_zone_code_fkey FOREIGN KEY (zone_code) REFERENCES public.zones(code),
  CONSTRAINT zone_artworks_artwork_code_fkey FOREIGN KEY (artwork_code) REFERENCES public.artworks(code)
);
CREATE TABLE public.zones (
  code character NOT NULL,
  name text NOT NULL,
  CONSTRAINT zones_pkey PRIMARY KEY (code)
);
```

---

# to - do (개발 사항)

## 01-wall.html에서 .plan-card 추가 
아래 지침을 참고하여 추가 예정
```
01-wall.html 페이지에서 plan-card를 원하는 대로 추가해서, 각각 다른 사진과 다른 제목(title)을 넣으려고 합니다. 어떤 방식으로 추가하면 되나요?:

추가해야 할 것

각 층의 .plan-map 안에 새로운 button.plan-card를 추가합니다:
- data-artwork: 이 작품을 구분할 고유 slug/key
- data-floor: 층 번호 (1–7)
- style="--x:NN; --y:NN;" → 지도 이미지 영역에서 퍼센트 좌표로 카드 위치 지정
- 내부에 사람이 읽을 수 있는 data-label을 가진 .plan-card__photo
- 보이는 제목을 넣는 .plan-card__name

기본 패턴

해당 층 섹션 안에 배치하세요 (예: #floor-2 .plan-map):
카드마다 다른 --x/--y 값을 넣어 위치를 조정합니다.
예시:

01-wall.html
<button type="button" class="plan-card" data-artwork="my-art-unique" data-floor="2" style="--x:42; --y:58;">
  <div class="plan-card__photo" data-label="초기 스케치"></div>
  <div class="plan-card__name">My Custom Title</div>
</button>

위치 설정 팁:
--x, --y 값은 도면 이미지 영역의 퍼센트 단위입니다. 대략 10–90 사이 값으로 시작해서 조정하세요.

다른 사진을 넣는 방법
두 가지 방법이 있습니다. 하나를 선택하세요:

① Supabase/DB 기반 (DB에 데이터가 있다면 권장)
- v_artworks_card 테이블에 data-artwork 값과 일치하는 slug/code 행이 있어야 하고, cover_url이 포스터 이미지 URL을 가리켜야 합니다.
- script.js가 로드 시 자동으로 background 이미지와 title을 세팅합니다.
- .plan-card__name은 fallback으로 남겨두세요. DB의 title이 자동으로 덮어씁니다.

② 수동/로컬 이미지 (DB 사용 안 할 경우)
- 사진 박스에 직접 background 설정:
  <div class="plan-card__photo" data-label="초기 스케치" style="background-image:url('./images/my-photo.jpg'); background-size:cover; background-position:center;"></div>
- 또는 CSS custom property 활용(현재 CSS에 대응):
  <div class="plan-card__photo" data-label="초기 스케치" style="--plan-card-photo-bg:url('./images/my-photo.jpg');"></div>
- 두 방식 다 가능합니다. 단, DB가 있으면 data-artwork가 매칭될 때 DB 값이 수동 지정한 title/사진을 덮어씁니다.

최종 미리보기(hover 시)

hover 상태에서 보이는 “최종 미리보기”는 7층(7F) 카드의 정보를 기준으로 합니다.
낮은 층에서 hover할 때 올바른 미리보기 풍선과 label을 보려면:
- 동일한 data-artwork 값을 가진 카드를 7F에도 추가하세요.
- 그 카드의 .plan-card__photo data-label을 원하는 문구로 넣으세요.

7F 예시:
<button type="button" class="plan-card" data-artwork="my-art-unique" data-floor="7" style="--x:50; --y:40;">
  <div class="plan-card__photo" data-label="최종 포스터"></div>
  <div class="plan-card__name">My Final Title</div>
</button>

제목(title)

- DB를 쓰지 않는다면, 보이는 제목을 .plan-card__name 안에 직접 넣으세요.
- DB hydration을 사용하는 경우(동일한 data-artwork 매칭 시), DB의 title이 자동으로 .plan-card__name 텍스트를 대체합니다.

요약 단계

1. 원하는 층 섹션을 선택하고 → button.plan-card 추가
2. data-artwork(고유 키), data-floor, --x/--y 설정
3. .plan-card__photo에 data-label 설정, 필요시 inline background 또는 DB cover 사용
4. .plan-card__name에 보이는 제목 텍스트 넣기 (DB가 있으면 자동 덮어씀)
5. 동일한 data-artwork를 가진 7F 카드를 추가해 hover 미리보기 동작 연결

만약 예시(층 번호, 원하는 위치, title, 사진 URL)를 알려주시면, 제가 정확한 코드 스니펫을 작성해드릴 수 있습니다.
```