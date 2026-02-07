## 현재 상태
- `src/tests/board.spec.ts`: CSV 케이스 5~14 자동화 완료 (일반 게시판, 사진 게시판 모두 Page Object 사용)
- `src/pages/board.page.ts`, `src/pages/photoBoard.page.ts`, `src/pages/write.page.ts`, `src/pages/edit.page.ts`: 페이지 오브젝트(defence)
- `src/utils/fakeApiServer.ts`: 게시판 CRUD와 사진 게시판 데이터까지 커버하는 MCP 목업 서버
- `playwright.config.ts`: 기본 headless=false, 테스트 실행 시 `PWTEST_HEADLESS=true npx ...` 형태로 override 사용 중

## 다음 작업 아이디어
- CSV 15번 이후 케이스 분석 및 자동화
- 사진 게시판에서 이미지 업로드 검증을 좀 더 세분화 (여러 이미지, PDF 첨부 등)
- 에디터/상세 페이지에 대한 접근성/번역 확인
- 실제 백엔드 연동 버전에 대비해 `createFakeApiServer`를 Feature Flag로 전환할지 검토

## 최근 실행한 테스트 명령
- `PWTEST_HEADLESS=true npx playwright test src/tests/board.spec.ts --grep '사진 게시판 글 작성'`
- `PWTEST_HEADLESS=true npx playwright test src/tests/board.spec.ts --grep '본인이 쓴 게시물을 수정할 수 있다'`
- `PWTEST_HEADLESS=true npx playwright test src/tests/board.spec.ts --grep '삭제할 수 있다'`
