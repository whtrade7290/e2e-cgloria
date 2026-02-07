import type { Page, Route } from 'playwright/test';

export type SignUpPayload = {
  account: string;
  password: string;
  email: string;
  name: string;
};

type FakeUser = {
  id: number;
  username: string;
  password: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isApproved: boolean;
};

type FakeBoardEntry = {
  id: number;
  title: string;
  writer_name: string;
  writer?: string;
  content?: string;
  files?: string;
  create_at: string;
};

type FakeApiServer = {
  setup(page: Page): Promise<void>;
  queueSignUp(payload: SignUpPayload): void;
  addBoardEntry: (
    board: string,
    entry: Omit<FakeBoardEntry, 'id' | 'create_at'> & Partial<FakeBoardEntry>,
  ) => number;
  updateBoardEntry: (board: string, id: number, updates: Partial<FakeBoardEntry>) => void;
  removeBoardEntry: (board: string, id: number) => void;
};

const boardFixtures: Record<string, FakeBoardEntry[]> = {};
const boardCounters: Record<string, number> = {};

const boardKeys = [
  { key: 'notice', title: '공지사항' },
  { key: 'sermon', title: '설교' },
  { key: 'column', title: '칼럼' },
  { key: 'weekly_bible_verse', title: '금주의 성경 말씀' },
  { key: 'class_meeting', title: '속회 교재실' },
  { key: 'sunday_school_resource', title: '주일학교 자료실' },
  { key: 'general_forum', title: '자유게시판' },
  { key: 'testimony', title: '간증 게시판' },
  { key: 'photo_board', title: '사진갤러리' },
  { key: 'school_photo_board', title: '주일학교 사진갤러리' },
];

for (const { key, title } of boardKeys) {
  boardFixtures[key] = Array.from({ length: 25 }).map((_, index) => {
    const entry: FakeBoardEntry = {
      id: index + 1,
      title: `${title} 샘플 게시글 ${index + 1}`,
      writer_name: `작성자${index + 1}`,
      writer: `writer${index + 1}`,
      content: `<p>${title} 샘플 게시글 ${index + 1} 내용입니다.</p>`,
      create_at: `2024-01-${(index + 10).toString().padStart(2, '0')}T00:00:00.000Z`,
    };
    if (key.includes('photo')) {
      entry.files = JSON.stringify([
        { filename: `photo_${index + 1}.jpg`, originalname: `photo_${index + 1}.jpg` },
      ]);
    }
    return entry;
  });
  boardCounters[key] = boardFixtures[key].length;
}

const jsonResponse = (data: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(data),
});

const parseMultipartFormData = (body: string, boundary: string) => {
  const result: Record<string, string> = {};
  const parts = body.split(`--${boundary}`).filter((part) => part.trim() && part.includes('\r\n\r\n'));
  for (const part of parts) {
    const [rawHeaders, rawValue] = part.split('\r\n\r\n');
    if (!rawHeaders || rawValue === undefined) continue;
    const nameMatch = rawHeaders.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const value = rawValue.replace(/\r\n--$/, '').replace(/\r\n$/, '');
    result[name] = value;
  }
  return result;
};

export function createFakeApiServer(): FakeApiServer {
  let nextUserId = 1000;
  let pendingSignUp: SignUpPayload | null = null;
  const users = new Map<string, FakeUser>([
    [
      'admin',
      {
        id: 1,
        username: 'admin',
        password: '0000',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
        isApproved: true,
      },
    ],
    [
      'member',
      {
        id: 2,
        username: 'member',
        password: 'password1!',
        email: 'member@example.com',
        name: '일반 유저',
        role: 'USER',
        isApproved: true,
      },
    ],
  ]);

  const findUserById = (id: number | string | undefined) => {
    if (id === undefined) return undefined;
    const numericId = typeof id === 'number' ? id : Number(id);
    return Array.from(users.values()).find((user) => user.id === numericId);
  };

  const parseJsonBody = (postData?: string | null) => {
    if (!postData) return {};
    try {
      return JSON.parse(postData);
    } catch {
      return {};
    }
  };

  const fulfill = (route: Route, data: unknown, status = 200) =>
    route.fulfill(jsonResponse(data, status));

  const handleRequest = async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith('/check_Token')) {
      const { accessToken } = parseJsonBody(request.postData());
      await fulfill(route, { success: accessToken ? 2 : 1, accessToken: accessToken || '' });
      return;
    }

    if (path.endsWith('/find_user')) {
      const { username } = parseJsonBody(request.postData());
      const user = username ? users.get(username) : undefined;
      await fulfill(route, user ? { ...user } : null);
      return;
    }

    if (path.endsWith('/signUp')) {
      if (!pendingSignUp) {
        await fulfill(route, { error: 'Missing sign-up payload' }, 400);
        return;
      }

      const newUser: FakeUser = {
        id: nextUserId++,
        username: pendingSignUp.account,
        password: pendingSignUp.password,
        email: pendingSignUp.email,
        name: pendingSignUp.name,
        role: 'USER',
        isApproved: false,
      };
      users.set(newUser.username, newUser);
      pendingSignUp = null;
      await fulfill(route, { id: newUser.id, isApproved: newUser.isApproved });
      return;
    }

    if (path.endsWith('/signIn')) {
      const { username, password } = parseJsonBody(request.postData());
      const user = username ? users.get(username) : undefined;
      if (!user || user.password !== password || !user.isApproved) {
        await fulfill(route, { success: 0 });
        return;
      }

      await fulfill(route, {
        success: 2,
        user: {
          id: String(user.id),
          username: user.username,
          name: user.name,
          role: user.role,
          profileImageUrl: '',
        },
        token: `${user.username}-token`,
        refreshToken: `${user.username}-refresh`,
      });
      return;
    }

    const writeMatch = path.match(/^\/([^/]+)\/\1_write$/);
    if (writeMatch) {
      const boardName = writeMatch[1];
      const fixtures = boardFixtures[boardName];
      if (!fixtures) {
        await fulfill(route, { success: false }, 404);
        return;
      }
      const contentType = request.headers()['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      const body = request.postData() || '';
      let fields: Record<string, string> = {};
      if (boundaryMatch && body) {
        fields = parseMultipartFormData(body, boundaryMatch[1]);
      }
      const title = fields['title'] ?? '새 게시글';
      const content = fields['content'] ?? '';
      const writer = fields['writer'] ?? '';
      const writerName = (fields['writer_name'] ?? writer) || '작성자';
      const id = addBoardEntry(boardName, {
        title,
        writer_name: writerName,
        writer,
        content,
      });
      await fulfill(route, { success: true, id });
      return;
    }

    const boardMatch = path.match(/^\/([^/]+)\/\1(_count)?$/);
    if (boardMatch) {
      const boardName = boardMatch[1];
      const fixtures = boardFixtures[boardName];
      if (fixtures) {
        const payload = parseJsonBody(request.postData());
        const searchWord = (payload.searchWord ?? '').toString();
        const startRow = Number(payload.startRow ?? 0);
        const pageSize = Number(payload.pageSize ?? fixtures.length);
        const filtered = fixtures.filter((entry) =>
          searchWord ? entry.title.includes(searchWord) : true,
        );
        if (boardMatch[2]) {
          await fulfill(route, filtered.length);
        } else {
          const paged = filtered.slice(startRow, startRow + pageSize);
          await fulfill(route, paged);
        }
        return;
      }
    }

    const detailMatch = path.match(/^\/([^/]+)\/\1_detail$/);
    if (detailMatch) {
      const boardName = detailMatch[1];
      const fixtures = boardFixtures[boardName];
      const { id } = parseJsonBody(request.postData());
      if (!fixtures || !id) {
        await fulfill(route, {}, 404);
        return;
      }
      const entry = fixtures.find((item) => item.id === Number(id)) ?? fixtures[0];
      await fulfill(route, {
        id: entry?.id ?? 0,
        title: entry?.title ?? `${boardName} 상세`,
        content: entry?.content ?? `<p>${entry?.title ?? ''} 내용입니다.</p>`,
        writer: entry?.writer ?? entry?.writer_name ?? '작성자',
        writer_name: entry?.writer_name ?? '작성자',
        writerProfileImageUrl: '',
        files: '[]',
        mainContent: false,
        language: 'ko',
        bible_id: null,
        create_at: entry?.create_at ?? new Date().toISOString(),
        update_at: entry?.create_at ?? new Date().toISOString(),
        deleted: false,
      });
      return;
    }

    const editMatch = path.match(/^\/([^/]+)\/\1_edit$/);
    if (editMatch) {
      const boardName = editMatch[1];
      const fixtures = boardFixtures[boardName];
      if (!fixtures) {
        await fulfill(route, { success: false }, 404);
        return;
      }
      const contentType = request.headers()['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      const body = request.postData() || '';
      if (!boundaryMatch || !body) {
        await fulfill(route, { success: false }, 400);
        return;
      }
      const fields = parseMultipartFormData(body, boundaryMatch[1]);
      const id = Number(fields['id']);
      if (!id) {
        await fulfill(route, { success: false }, 400);
        return;
      }
      updateBoardEntry(boardName, id, {
        title: fields['title'],
        content: fields['content'],
      });
      await fulfill(route, { success: true, id });
      return;
    }

    const deleteMatch = path.match(/^\/([^/]+)\/\1_delete$/);
    if (deleteMatch) {
      const boardName = deleteMatch[1];
      const fixtures = boardFixtures[boardName];
      if (!fixtures) {
        await fulfill(route, { success: false }, 404);
        return;
      }
      const payload = parseJsonBody(request.postData());
      const id = Number(payload.id);
      if (!id) {
        await fulfill(route, { success: false }, 400);
        return;
      }
      removeBoardEntry(boardName, id);
      await fulfill(route, { success: true });
      return;
    }

    if (path.endsWith('/disapproveUsers')) {
      const pendingUsers = Array.from(users.values())
        .filter((user) => user.role === 'USER' && !user.isApproved)
        .map(({ id, username, name, role }) => ({ id, username, name, role }));
      await fulfill(route, pendingUsers);
      return;
    }

    if (path.endsWith('/approveUser')) {
      const { id } = parseJsonBody(request.postData());
      const user = findUserById(id);
      if (!user) {
        await fulfill(route, { success: false }, 404);
        return;
      }
      user.isApproved = true;
      await fulfill(route, {
        success: true,
        user: { id: user.id, username: user.username, name: user.name },
      });
      return;
    }

    await fulfill(route, {});
  };

  const addBoardEntry = (
    board: string,
    entry: Omit<FakeBoardEntry, 'id' | 'create_at'> & Partial<FakeBoardEntry>,
  ) => {
    const fixtures = boardFixtures[board];
    if (!fixtures) return 0;
    const id = ++boardCounters[board];
    const newEntry: FakeBoardEntry = {
      id,
      title: entry.title ?? `자동 생성 ${id}`,
      writer_name: entry.writer_name ?? entry.writer ?? '작성자',
      writer: entry.writer ?? entry.writer_name ?? '작성자',
      content: entry.content ?? '<p></p>',
      create_at: entry.create_at ?? new Date().toISOString(),
    };
    if (board.includes('photo')) {
      newEntry.files =
        entry.files ??
        JSON.stringify([{ filename: entry.writer ? `${entry.writer}_${id}.jpg` : `photo_${id}.jpg` }]);
    }
    boardFixtures[board] = [newEntry, ...fixtures];
    return id;
  };

  const updateBoardEntry = (board: string, id: number, updates: Partial<FakeBoardEntry>) => {
    const fixtures = boardFixtures[board];
    if (!fixtures) return;
    const entry = fixtures.find((item) => item.id === id);
    if (!entry) return;
    Object.assign(entry, updates, { id });
  };

  const removeBoardEntry = (board: string, id: number) => {
    const fixtures = boardFixtures[board];
    if (!fixtures) return;
    boardFixtures[board] = fixtures.filter((item) => item.id !== id);
  };

  return {
    async setup(page: Page) {
      await page.route('**/localhost:3000/**', async (route) => {
        try {
          await handleRequest(route);
        } catch (error) {
          await fulfill(route, { error: String(error) }, 500);
        }
      });
    },
    queueSignUp(payload: SignUpPayload) {
      pendingSignUp = payload;
    },
    addBoardEntry,
    updateBoardEntry,
    removeBoardEntry,
  };
}
