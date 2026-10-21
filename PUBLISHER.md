# 공통 블로그 작성기 계약 v4

리뷰 / Bits with Nampy / Cook with Nampy / 에세이가 같은 `index.html`과
`assets/publisher.js`를 사용합니다. 공개 파일에는 실제 원고를 내장하지 않습니다.

## 사용

비공개 `rivaljin/nampy-assets/blog`에서 JSON의 Download raw file로 내려받고,
https://rivaljin.github.io/blog-tools/ 의 **비공개 원고 JSON 열기**로 엽니다.
네 카테고리 모두 같은 버튼을 사용합니다. 파일은 브라우저에서만 처리합니다.
티스토리는 HTML 본문 복사로 사진 주소·여백을 한 번에 붙여넣고, 네이버는
별도 제목·본문·제휴 링크·번호 사진 안내와 다운로드를 사용합니다.

수정은 이 기기에 저장합니다. 원고 JSON 내보내기로 파일을 보관하고 필요할 때
비공개 저장소 기준본을 갱신합니다. GitHub 자동 동기화·Drive 연결·서버는 없습니다.
파일에는 원고가 포함되므로 비공개로 보관합니다.

## 형식

version 1 JSON: id, category(reviews/bits/cook/essays), title, title_tistory,
title_naver, tags, link_tistory, link_naver, featuredImage, bodyTistory,
bodyNaver, images. 본문은 기존 Markdown을 유지합니다. 제휴 링크 자리는
`{{affiliate_link}}`입니다. 기존 HTML 자료는 bodyHtmlTistory로 보존하며
티스토리 복사에 이 원문을 우선합니다. HTML은 비실행 태그·속성만 허용하고
사진·링크는 HTTP(S)만 허용합니다. 임의 실행 스크립트는 가져오지 않습니다.

과거 해시 링크는 읽기 호환만 유지하며 새 링크를 만들지 않습니다. URL 해시와
noindex는 접근 제한이 아닙니다. 기기·방문 기록·공유 링크의 사본은 회수할 수 없습니다.

## 기존 주소와 저장 데이터

글별 8개 페이지는 원고 없는 같은 작성기를 표시합니다. 기존 경로의 blog_edit_*
저장 키를 유지·복원하고 기기에 저장된 원고 선택 메뉴로 과거 수정본을 열어
JSON으로 내보낼 수 있습니다. JSON 파일의 id별 blog_draft_* 키와 현재 선택을
저장하며 기존 키는 삭제하지 않습니다. 브라우저 로컬 내용은 저장소 기준본과
다를 수 있습니다. 저장 공간 부족은 알리고 덮어쓰기를 중단합니다.

## 검증과 사진

`node tests/publisher.test.cjs` 및 서버 제공 후 `node tests/draft-files.test.cjs`.
공개 테스트에는 합성 예시만 사용합니다. 한글 왕복·플랫폼 분리·HTML/여백·사진
번호·새로고침·잘못된 입력 보존·과거 주소 복원을 검사합니다.
사진 개인정보 육안 검수와 메타데이터 검사는 별도이며 기존 사진은 경로·바이트를
유지합니다. 이미 발행한 블로그 본문은 바꾸지 않습니다.
