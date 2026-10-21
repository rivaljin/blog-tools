# 유튜브 콘티 도구 분리 — 새 주소 배포 대기

도구 원본 코드는 공개 `rivaljin/youtube-tools`에 업로드했습니다. GitHub Pages
설정 권한이 없어 새 주소의 실제 배포는 확인하지 못했으며, 이전 완료로 간주하지
않습니다. 현재 https://rivaljin.github.io/blog-tools/cook-conti.html 을 계속 사용하세요.
이 주소의 v3 기능과 기존 저장 키를 유지합니다. 예시는 가상 기능 예시만 포함합니다.

## 관리자가 해야 할 한 번의 설정

https://github.com/rivaljin/youtube-tools/settings/pages 에서 Build and deployment →
Source: Deploy from a branch → Branch: main → /(root) → Save.
배포 완료 후 https://rivaljin.github.io/youtube-tools/cook-conti.html 에서 화면과
오프라인 기능을 확인한 다음 기존 페이지의 이전 안내를 활성화합니다.

## 배포 확인 후 이동 방법

기존 도구에서 JSON 백업을 내려받습니다. 편집 내용·촬영 체크·장면 순서가 포함됩니다.
새 도구의 GPT 콘티 가져오기 → 파일 선택 → 내용 확인 → 교체로 복원합니다.
같은 출처/브라우저에서는 저장 키가 공유될 수 있지만 기기·홈 화면 앱·브라우저가
다르면 다를 수 있어 자동 이전을 보장하지 않습니다. 기존 저장 키는 삭제하지 않습니다.
새 캐시는 youtube-tools-conti-*이며 블로그의 cook-conti-offline-*와 분리합니다.

기존 도구는 최신 화면을 받으려면 온라인으로 연 뒤 콘티 창을 모두 닫고 다시 엽니다.
Safari 데이터 삭제는 원고를 잃을 수 있어 권하지 않습니다. 기기별 실제 원고는
비공개 nampy-assets에 보관하고 새 원고를 공개 코드나 URL 해시에 넣지 않습니다.

기존 도구와 새 도구를 동시에 열어 편집하면 같은 출처의 저장 키가 충돌할 수 있습니다. JSON 백업 후 기존 창을 닫고 새 도구에서 확인하세요.
