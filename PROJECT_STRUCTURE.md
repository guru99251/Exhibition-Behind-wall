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

# 페이지별 웹 instruction

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