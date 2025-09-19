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
|- .archive elements examples/ <!-- copy 하기 위한 코드를 모아놓은 폴더입니다 -->
|- .test/ <!-- 테스트용 폴더 입니다 -->
|- node_modules/
\- src/
```

# 전시 기획 노트

Diposium이라는 전시회에서 빔프로젝트로 한쪽 벽면을 가로로 길게 채울 웹을 제작하고 있어. 아직 가로 길이가 확정이 나질 않았어. 따라서 모든 요소의 크기를 반응형(가로기준)으로 만들어줘.

## index.html
전시 오프닝(시작) 화면, 메뉴 선택

## 01-wall.html
비하인드 월. 참여자의 제작 과정(기획, 스토리보드, 스케치, 작업 사진, 스샷 등)을 담은 페이지.

## 02-comment.html
관람객이 실시간으로 각 전시작품에 남긴 코멘트를 볼 수 있는 화면이야. 각 전시 작품 옆에 QR 코드를 배치해서 해당 작품에 코멘트를 바로 남길 수 있게 할꺼야. 그렇게 전송된 코멘트를 전부 이 페이지에서 볼 수 있게끔 할꺼야. 남기는 코멘트 종류는 텍스트 뿐만 아니라 이모지나 반응(좋아요)도 포함할 예정이야. 
websocket 통신이 필요해.

## 03-contributors.html
참여자(분야별로, 2D,3D,UX/UI,Game)와 전시 운영진(스텝)의 이름이 각각 모두 뜨도록 할 꺼야.

## 04-artworks.html
모든 전시 작품의 정보(작품이름, 포스터, 제작 인원, 작품 설명, 분야, 사용 프로그램)를 카드 UI로 한눈에 볼 수 있게 할꺼야. 그리드 형태로 배치해서 스크롤을 내려서 한눈에 볼 수 있게끔.


# 02~04.html 페이지별 Task & Instruction

---

## 02 — 02-comment.html

### Task
- Layout:  
  - Sidebar remains fixed on the left; allocate a **safe margin** so content never overlaps.  
  - Divide the main area into **4 vertical columns** (`Zone A`, `Zone B`, `Zone C`, `All`), always visible without vertical scrolling.  
  - Columns must resize responsively based on viewport width.  

- Interaction:  
  - Integrate **WebSocket** connection to receive comments, emoji reactions, and likes.  
  - Render incoming items **newest-first** in each column.  
  - Route messages by `zone` or global `All`.  
  - Show author identity (anonymous, or `name / department / studentId`).  
  - If a comment references a specific artwork, display its **poster thumbnail** on the right side of the message card.  

- Styling:  
  - Use `.page-comment` namespace.  
  - Place all CSS in `styles.css` and JS in `script.js`.  

### Functions
- `initCommentPage(container)` — bootstrap layout, calculate sidebar-safe gutters.  
- `connectCommentsWS(url)` — handle WebSocket connection, reconnection, heartbeats.  
- `mapIncomingToZone(event)` — resolve which zone column to use.  
- `upsertMessage(store, zone, item)` — de-duplicate and keep newest-first order.  
- `renderColumn(zone, items)` — render the column efficiently.  
- `renderCommentCard(item)` — build card with text, reactions, optional artwork image.  
- `updateConnectionBadge(state)` — toggle online/offline UI indicator.  
- `fitToWidth()` — resize typography/layout to keep all four columns visible.  

---

## 03 — 03-contributors.html

### Task
- Layout:  
  - Reserve safe margin so content does not overlap the sidebar.  
  - Two top-level sections: **Participants** and **Staff**.  
  - Participants (32 total) split into four **sub-columns**: 2D(8), 3D(16), UX/UI(4), Game(4).  
  - Staff (12 total) split into **four sub-columns**: Planning(5), Design(3), Operations(3), Chair(1).  

- Presentation:  
  - Participants: render as `Name(StudentID)`.  
  - Staff: render as `Name — Role`.  
  - No extra styling beyond consistent typography and spacing.  
  - Use `.page-contributors` namespace.  

### Functions
- `initContributorsPage(container)` — mount layout with sidebar gutter.  
- `renderParticipants(groups)` — print each discipline in its own column.  
- `renderStaff(groups)` — print each staff group in its own column.  
- `createListItem(person, type)` — generate DOM node in correct format.  
- `applyHorizontalLayout()` — enforce horizontal-first responsive grid.  

---

## 04 — 04-artworks.html

### Task
- Layout:  
  - Sidebar safe margin must be applied.  
  - Main content scrolls vertically (only this page allows vertical scroll).  
  - Display artworks as **cards** inside a **responsive grid**.  

- Card Content:  
  - Each card includes: { Title, Poster Image, Team Members, Description, Discipline, Tools }.  

- Features:  
  - Default view = **All artworks**.  
  - Add filter bar at the top to toggle by zone (All | Zone A | Zone B | Zone C).  
  - Use responsive grid: `repeat(auto-fit, minmax(clamp(260px, 22vw, 420px), 1fr))`.  
  - Poster images maintain 3:4 aspect ratio with proper object-fit.  

- Styling:  
  - Use `.page-artworks` namespace.  
  - Place all CSS in `styles.css` and JS in `script.js`.  

### Functions
- `initArtworksPage(container)` — initialize filters, grid, sidebar gutter.  
- `renderFilterBar(zones, onChange)` — create filter controls.  
- `applyZoneFilter(zone)` — filter dataset and update grid.  
- `renderArtworkCards(items)` — render responsive grid of cards.  
- `computeColumnsByWidth()` — calculate card width dynamically using `clamp()`.  
- `hydratePoster(img, lqipSrc)` — swap LQIP placeholder with final image smoothly.  
