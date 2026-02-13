import type { Page, Route } from 'playwright/test';
import { Buffer } from 'node:buffer';

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

type FakeScheduleEntry = {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
  userId: number | null;
};

type FakeBiblePlan = {
  days: number;
  filename: string;
  content: string;
};

type FakeCommentEntry = {
  id: number;
  boardId: number;
  boardName: string;
  content: string;
  writer: string;
  writer_name: string;
  create_at: string;
};

type WithDiaryRoom = {
  id: number;
  roomName: string;
  creator: number;
  creator_name: string;
  memberIds: number[];
  update_at: string;
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
  addScheduleEntry: (
    entry: Omit<FakeScheduleEntry, 'id'> & Partial<FakeScheduleEntry>,
  ) => number;
  updateScheduleEntry: (id: number, updates: Partial<FakeScheduleEntry>) => void;
  removeScheduleEntry: (id: number) => void;
  addWithDiaryRoom: (options: { roomName: string; members?: string[]; creator?: string }) => number;
  addWithDiaryEntry: (
    roomId: number,
    entry: Omit<FakeBoardEntry, 'id' | 'create_at'> & Partial<FakeBoardEntry>,
  ) => number;
  addCommentEntry: (
    boardName: string,
    boardId: number,
    entry: Omit<FakeCommentEntry, 'id' | 'create_at' | 'boardId' | 'boardName'> &
      Partial<FakeCommentEntry>,
  ) => number;
  resetComments: (boardName: string, boardId: number) => void;
};

const boardFixtures: Record<string, FakeBoardEntry[]> = {};
const boardCounters: Record<string, number> = {};
const scheduleFixtures: FakeScheduleEntry[] = [];
let scheduleCounter = 0;
const withDiaryRooms: WithDiaryRoom[] = [];
let withDiaryRoomCounter = 0;
const withDiaryEntries = new Map<number, FakeBoardEntry[]>();
const withDiaryEntryMap = new Map<number, { roomId: number; entry: FakeBoardEntry }>();
let withDiaryEntryCounter = 0;
const biblePlans: FakeBiblePlan[] = [];
const commentFixtures = new Map<string, FakeCommentEntry[]>();
let commentCounter = 0;
const PLACEHOLDER_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lPqzWQAAAABJRU5ErkJggg==',
  'base64',
);
const SCHEDULE_SAMPLE_CSV =
  'title,start,end,color\n새달새벽예배,2024-01-05,2024-01-05,#0F2854\n가족속회,2024-01-12,2024-01-12,#1C4D8D\n';

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

const formatDateOnly = (date: Date) => date.toISOString().split('T')[0];
const addInitialSchedules = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const clampDay = (day: number) => Math.min(Math.max(day, 1), daysInMonth);
  const buildDate = (day: number) => formatDateOnly(new Date(year, month, clampDay(day)));
  const initial: Array<Omit<FakeScheduleEntry, 'id'>> = [
    {
      title: '새달새벽예배',
      start: buildDate(5),
      end: buildDate(5),
      color: '#0F2854',
      userId: 1,
    },
    {
      title: '가족속회',
      start: buildDate(12),
      end: buildDate(12),
      color: '#1C4D8D',
      userId: 1,
    },
    {
      title: '주일학교 발표',
      start: buildDate(20),
      end: buildDate(21),
      color: '#FD8A6B',
      userId: 1,
    },
  ];
  for (const entry of initial) {
    scheduleFixtures.push({ id: ++scheduleCounter, ...entry });
  }
};
addInitialSchedules();

const addScheduleEntry = (
  entry: Omit<FakeScheduleEntry, 'id'> & Partial<FakeScheduleEntry>,
) => {
  const startDate = entry.start ?? formatDateOnly(new Date());
  const newEntry: FakeScheduleEntry = {
    id: ++scheduleCounter,
    title: entry.title ?? `일정 ${scheduleCounter}`,
    start: startDate,
    end: entry.end ?? startDate,
    color: entry.color ?? '#0F2854',
    userId: entry.userId ?? null,
  };
  scheduleFixtures.push(newEntry);
  return newEntry.id;
};

const updateScheduleEntry = (id: number, updates: Partial<FakeScheduleEntry>) => {
  const target = scheduleFixtures.find((item) => item.id === id);
  if (!target) return;
  Object.assign(target, updates, {
    id,
    end: updates.end ?? target.end ?? target.start,
  });
};

const removeScheduleEntry = (id: number) => {
  const index = scheduleFixtures.findIndex((item) => item.id === id);
  if (index >= 0) {
    scheduleFixtures.splice(index, 1);
  }
};

const getRoomsForUser = (userId: number) =>
  withDiaryRooms.filter((room) => room.memberIds.includes(userId));

const ensureWithDiaryEntryBucket = (roomId: number) => {
  if (!withDiaryEntries.has(roomId)) {
    withDiaryEntries.set(roomId, []);
  }
  return withDiaryEntries.get(roomId)!;
};

const addWithDiaryRoomInternal = (options: {
  roomName: string;
  memberIds: number[];
  creatorId: number;
  creatorName: string;
}) => {
  const room: WithDiaryRoom = {
    id: ++withDiaryRoomCounter,
    roomName: options.roomName,
    creator: options.creatorId,
    creator_name: options.creatorName,
    memberIds: Array.from(new Set(options.memberIds.filter((id) => Number.isFinite(id)))),
    update_at: new Date().toISOString(),
  };
  withDiaryRooms.push(room);
  ensureWithDiaryEntryBucket(room.id);
  return room;
};

const addWithDiaryEntryInternal = (
  roomId: number,
  entry: Omit<FakeBoardEntry, 'id' | 'create_at'> & Partial<FakeBoardEntry>,
) => {
  if (!withDiaryEntries.has(roomId)) return 0;
  const newEntry: FakeBoardEntry = {
    id: ++withDiaryEntryCounter,
    title: entry.title ?? `동행일기 ${withDiaryEntryCounter}`,
    writer_name: entry.writer_name ?? entry.writer ?? '작성자',
    writer: entry.writer ?? `writer${withDiaryEntryCounter}`,
    content: entry.content ?? '<p></p>',
    files: entry.files,
    create_at: entry.create_at ?? new Date().toISOString(),
  };
  const bucket = ensureWithDiaryEntryBucket(roomId);
  bucket.unshift(newEntry);
  withDiaryEntryMap.set(newEntry.id, { roomId, entry: newEntry });
  return newEntry.id;
};

const updateWithDiaryEntry = (id: number, updates: Partial<FakeBoardEntry>) => {
  const record = withDiaryEntryMap.get(id);
  if (!record) return;
  Object.assign(record.entry, updates, { id });
};

const removeWithDiaryEntry = (id: number) => {
  const record = withDiaryEntryMap.get(id);
  if (!record) return;
  const entries = withDiaryEntries.get(record.roomId);
  if (entries) {
    withDiaryEntries.set(
      record.roomId,
      entries.filter((item) => item.id !== id),
    );
  }
  withDiaryEntryMap.delete(id);
};

const getCommentKey = (boardName: string, boardId: number) => `${boardName}:${boardId}`;

const getComments = (boardName: string, boardId: number) =>
  commentFixtures.get(getCommentKey(boardName, boardId)) ?? [];

const setComments = (boardName: string, boardId: number, comments: FakeCommentEntry[]) => {
  commentFixtures.set(getCommentKey(boardName, boardId), comments);
};

const addCommentEntryInternal = (
  boardName: string,
  boardId: number,
  entry: Omit<FakeCommentEntry, 'id' | 'create_at' | 'boardId' | 'boardName'> &
    Partial<FakeCommentEntry>,
) => {
  const comments = getComments(boardName, boardId);
  const newComment: FakeCommentEntry = {
    id: ++commentCounter,
    boardId,
    boardName,
    content: entry.content ?? '댓글 내용',
    writer: entry.writer ?? 'member',
    writer_name: entry.writer_name ?? entry.writer ?? '작성자',
    create_at: entry.create_at ?? new Date().toISOString(),
  };
  setComments(boardName, boardId, [newComment, ...comments]);
  return newComment.id;
};

const updateCommentEntry = (
  boardName: string,
  boardId: number,
  commentId: number,
  updates: Partial<FakeCommentEntry>,
) => {
  const comments = getComments(boardName, boardId);
  const target = comments.find((comment) => comment.id === commentId);
  if (!target) return;
  Object.assign(target, updates);
};

const removeCommentEntry = (boardName: string, boardId: number, commentId: number) => {
  const comments = getComments(boardName, boardId);
  setComments(
    boardName,
    boardId,
    comments.filter((comment) => comment.id !== commentId),
  );
};

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
    [
      'diaryless',
      {
        id: 3,
        username: 'diaryless',
        password: 'password2!',
        email: 'diaryless@example.com',
        name: '동행일기 미지정 유저',
        role: 'USER',
        isApproved: true,
      },
    ],
    [
      'withdiarytest',
      {
        id: 4,
        username: 'withdiarytest',
        password: '0000',
        email: 'withdiarytest@example.com',
        name: '동행일기 테스트 유저',
        role: 'USER',
        isApproved: true,
      },
    ],
    [
      'pending_user',
      {
        id: 5,
        username: 'pending_user',
        password: 'password3!',
        email: 'pending@example.com',
        name: '미승인 사용자',
        role: 'USER',
        isApproved: false,
      },
    ],
  ]);

  for (let index = 1; index <= 30; index++) {
    const username = `user${index}`;
    if (!users.has(username)) {
      users.set(username, {
        id: nextUserId++,
        username,
        password: 'password!',
        email: `${username}@example.com`,
        name: `승인 유저 ${index}`,
        role: 'USER',
        isApproved: true,
      });
    }
  }

  const getUserByUsername = (username?: string | null) =>
    username ? users.get(username) : undefined;

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
    const method = request.method().toUpperCase();
    if (path.startsWith('/uploads/')) {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: PLACEHOLDER_IMAGE,
      });
      return;
    }

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

      const userRooms = getRoomsForUser(user.id);
      const defaultRoomId = userRooms[0]?.id ?? null;

      await fulfill(route, {
        success: 2,
        user: {
          id: String(user.id),
          username: user.username,
          name: user.name,
          role: user.role,
          profileImageUrl: '',
          withDiary: defaultRoomId,
        },
        token: `${user.username}-token`,
        refreshToken: `${user.username}-refresh`,
      });
      return;
    }

    const writeMatch = path.match(/^\/([^/]+)\/\1_write$/);
    if (writeMatch && writeMatch[1] !== 'comment') {
      const boardName = writeMatch[1];
      if (boardName === 'withDiary') {
        const contentType = request.headers()['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        const body = request.postData() || '';
        if (!boundaryMatch || !body) {
          await fulfill(route, { success: false }, 400);
          return;
        }
        const fields = parseMultipartFormData(body, boundaryMatch[1]);
        const roomId = Number(fields['diaryRoomId'] ?? fields['withDiaryNum']);
        if (!roomId || !withDiaryEntries.has(roomId)) {
          await fulfill(route, { success: false }, 400);
          return;
        }
        const id = addWithDiaryEntryInternal(roomId, {
          title: fields['title'],
          content: fields['content'],
          writer: fields['writer'],
          writer_name: fields['writer_name'],
        });
        await fulfill(route, { success: true, id });
        return;
      }
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
      if (boardName === 'withDiary') {
        return;
      }
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
    if (detailMatch && detailMatch[1] !== 'comment') {
      const boardName = detailMatch[1];
      if (boardName === 'withDiary') {
        const { id } = parseJsonBody(request.postData());
        const numericId = Number(id);
        const record = withDiaryEntryMap.get(numericId);
        if (!record) {
          await fulfill(route, {}, 404);
          return;
        }
        await fulfill(route, {
          id: record.entry.id,
          title: record.entry.title,
          content: record.entry.content ?? `<p>${record.entry.title}</p>`,
          writer: record.entry.writer ?? record.entry.writer_name ?? '작성자',
          writer_name: record.entry.writer_name ?? '작성자',
          writerProfileImageUrl: '',
          files: record.entry.files ?? '[]',
          mainContent: false,
          language: 'ko',
          bible_id: null,
          create_at: record.entry.create_at ?? new Date().toISOString(),
          update_at: record.entry.create_at ?? new Date().toISOString(),
          deleted: false,
        });
        return;
      }
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
        files: entry?.files ?? '[]',
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
    if (editMatch && editMatch[1] !== 'comment') {
      const boardName = editMatch[1];
      if (boardName === 'withDiary') {
        const contentType = request.headers()['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        const body = request.postData() || '';
        if (!boundaryMatch || !body) {
          await fulfill(route, { success: false }, 400);
          return;
        }
        const fields = parseMultipartFormData(body, boundaryMatch[1]);
        const id = Number(fields['id']);
        if (!Number.isFinite(id)) {
          await fulfill(route, { success: false }, 400);
          return;
        }
        updateWithDiaryEntry(id, { title: fields['title'], content: fields['content'] });
        await fulfill(route, { success: true, id });
        return;
      }
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
    if (deleteMatch && deleteMatch[1] !== 'comment') {
      const boardName = deleteMatch[1];
      if (boardName === 'withDiary') {
        const payload = parseJsonBody(request.postData());
        const id = Number(payload.id);
        if (!Number.isFinite(id)) {
          await fulfill(route, { success: false }, 400);
          return;
        }
        removeWithDiaryEntry(id);
        await fulfill(route, { success: true });
        return;
      }
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

    if (path === '/schedule' && method === 'GET') {
      const start = url.searchParams.get('start');
      const end = url.searchParams.get('end');
      const startTime = start ? new Date(start).getTime() : Number.NEGATIVE_INFINITY;
      const endTime = end ? new Date(end).getTime() : Number.POSITIVE_INFINITY;
      const events = scheduleFixtures
        .filter((entry) => {
          const eventStart = new Date(entry.start).getTime();
          const eventEnd = new Date(entry.end || entry.start).getTime();
          return eventEnd >= startTime && eventStart <= endTime;
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          start: entry.start,
          end: entry.end,
          color: entry.color,
          extendedProps: { color: entry.color },
        }));
      await fulfill(route, events);
      return;
    }

    if (path === '/schedule/single' && method === 'POST') {
      const payload = parseJsonBody(request.postData());
      if (!payload.title || !payload.start) {
        await fulfill(route, { success: false, message: 'Missing fields' }, 400);
        return;
      }
      const id = addScheduleEntry({
        title: payload.title,
        start: payload.start,
        end: payload.end || payload.start,
        color: payload.color || '#0F2854',
        userId: Number(payload.userId) || null,
      });
      await fulfill(route, { success: true, id });
      return;
    }

    if (path === '/schedule/csv_sample' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv;charset=utf-8',
        body: SCHEDULE_SAMPLE_CSV,
      });
      return;
    }

    if (path === '/schedule/csv_upload' && method === 'POST') {
      const contentType = request.headers()['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      const body = request.postData() || '';
      if (!boundaryMatch || !body) {
        await fulfill(route, { success: false }, 400);
        return;
      }
      const fields = parseMultipartFormData(body, boundaryMatch[1]);
      const csvContent = fields['file'] ?? '';
      if (!csvContent) {
        await fulfill(route, { success: false, message: 'Missing file' }, 400);
        return;
      }
      const lines = csvContent
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const [, ...rows] = lines;
      let successCount = 0;
      const errors: Array<{ row: number; reason: string }> = [];
      rows.forEach((line, index) => {
        const [title, start, end, color] = line.split(',').map((item) => item?.trim() ?? '');
        if (!title || !start) {
          errors.push({ row: index + 2, reason: '필수 값 누락' });
          return;
        }
        addScheduleEntry({
          title,
          start,
          end: end || start,
          color: color || '#0F2854',
          userId: Number(fields['userId']) || null,
        });
        successCount += 1;
      });
      await fulfill(route, {
        success: true,
        successCount,
        failCount: errors.length,
        errors,
      });
      return;
    }

    if (path.endsWith('/bible') && method === 'POST') {
      const payload = parseJsonBody(request.postData());
      const days = Number(payload.days);
      if (!Number.isFinite(days) || days <= 0) {
        await fulfill(route, { success: false, error: 'invalid days' }, 400);
        return;
      }
      const csvContent = ['day,reading']
        .concat(Array.from({ length: days }, (_, index) => `${index + 1},Bible passage ${index + 1}`))
        .join('\n');
      const filename = `bible_plan_${days}.csv`;
      biblePlans.push({ days, filename, content: csvContent });
      await route.fulfill({
        status: 200,
        contentType: 'text/csv;charset=utf-8',
        headers: {
          'content-disposition': `attachment; filename=${encodeURIComponent(filename)}`,
        },
        body: csvContent,
      });
      return;
    }

    if (path.endsWith('/biblePlan/download') || path.endsWith('/bible/download')) {
      const days = Number(url.searchParams.get('days') ?? url.searchParams.get('count'));
      const plan =
        biblePlans.find((item) => item.days === days) ??
        biblePlans[biblePlans.length - 1] ??
        (days
          ? {
              days,
              filename: `bible_plan_${days}.csv`,
              content: `day,reading\n1,Bible passage 1\n2,Bible passage 2`,
            }
          : null);
      if (!plan) {
        await fulfill(route, { success: false }, 404);
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'text/csv;charset=utf-8',
        headers: {
          'Content-Disposition': `attachment; filename=${encodeURIComponent(plan.filename)}`,
        },
        body: plan.content,
      });
      return;
    }

    if (path === '/comment/comment') {
      const payload = parseJsonBody(request.postData());
      const boardName = (payload.boardName ?? '').toString();
      const boardId = Number(payload.boardId);
      if (!boardName || !Number.isFinite(boardId)) {
        await fulfill(route, []);
        return;
      }
      const comments = getComments(boardName, boardId);
      console.log('[comment:list]', boardName, boardId, comments.length);
      await fulfill(route, comments);
      return;
    }

    if (path.endsWith('/comment_write')) {
      const payload = parseJsonBody(request.postData());
      const boardName = (payload.boardName ?? '').toString();
      const boardId = Number(payload.boardId);
      if (!boardName || !Number.isFinite(boardId)) {
        console.log('[comment:write:invalid]', payload);
        await fulfill(route, { success: false }, 400);
        return;
      }
      const id = addCommentEntryInternal(boardName, boardId, {
        content: payload.comment,
        writer: payload.writer ?? payload.writerName,
        writer_name: payload.writerName ?? payload.writer,
      });
      console.log('[comment:write]', boardName, boardId, id);
      await fulfill(route, { success: true, id });
      return;
    }

    if (path.endsWith('/comment_edit')) {
      const payload = parseJsonBody(request.postData());
      const boardName = (payload.boardName ?? '').toString();
      const boardId = Number(payload.boardId);
      const commentId = Number(payload.commentId);
      if (!boardName || !Number.isFinite(boardId) || !Number.isFinite(commentId)) {
        await fulfill(route, { success: false }, 400);
        return;
      }
      updateCommentEntry(boardName, boardId, commentId, { content: payload.comment });
      await fulfill(route, { success: true });
      return;
    }

    if (path.endsWith('/comment_delete')) {
      const payload = parseJsonBody(request.postData());
      const boardName = (payload.boardName ?? '').toString();
      const boardId = Number(payload.boardId);
      const commentId = Number(payload.commentId);
      if (!boardName || !Number.isFinite(boardId) || !Number.isFinite(commentId)) {
        await fulfill(route, { success: false }, 400);
        return;
      }
      removeCommentEntry(boardName, boardId, commentId);
      await fulfill(route, { success: true });
      return;
    }

    if (path === '/withDiary/withDiary' && method === 'POST') {
      const payload = parseJsonBody(request.postData());
      const roomId = Number(payload.roomId ?? payload.diaryRoomId);
      const searchWord = (payload.searchWord ?? '').toString();
      const startRow = Number(payload.startRow ?? 0);
      const pageSize = Number(payload.pageSize ?? 20);
      const entries = roomId ? withDiaryEntries.get(roomId) ?? [] : [];
      const filtered = entries.filter((entry) =>
        searchWord ? entry.title.includes(searchWord) : true,
      );
      const paged = filtered.slice(startRow, startRow + pageSize);
      await fulfill(route, paged);
      return;
    }

    if (path === '/withDiary/withDiary_count' && method === 'POST') {
      const payload = parseJsonBody(request.postData());
      const roomId = Number(payload.id ?? payload.roomId);
      const entries = roomId ? withDiaryEntries.get(roomId) ?? [] : [];
      await fulfill(route, entries.length);
      return;
    }

    if (path === '/withDiary/withDiary_all' && method === 'GET') {
      await fulfill(route, withDiaryRooms);
      return;
    }

    if (path.endsWith('/withDiary/make_withDiary')) {
      const { teamName, userIdList, creator, creator_name } = parseJsonBody(request.postData());
      const memberIds = Array.isArray(userIdList)
        ? userIdList.map((id: unknown) => Number(id)).filter((value) => Number.isFinite(value))
        : [];
      if (creator) {
        const creatorId = Number(creator);
        if (Number.isFinite(creatorId)) {
          memberIds.push(creatorId);
        }
      }
      const creatorUser = creator ? findUserById(creator) : users.get('admin');
      const room = addWithDiaryRoomInternal({
        roomName: teamName || `동행일기 ${withDiaryRoomCounter + 1}`,
        memberIds,
        creatorId: creatorUser?.id ?? 1,
        creatorName: creator_name || creatorUser?.name || '관리자',
      });
      await fulfill(route, { success: true, diaryRoom: room });
      return;
    }

    if (path.endsWith('/withDiary/fetch_withDiaryList')) {
      const { userId } = parseJsonBody(request.postData());
      const numericId = Number(userId);
      if (!Number.isFinite(numericId)) {
        await fulfill(route, []);
        return;
      }
      const rooms = getRoomsForUser(numericId).map((room) => ({
        diaryRoomId: room.id,
        diaryRoom: {
          id: room.id,
          roomName: room.roomName,
          creator_name: room.creator_name,
          update_at: room.update_at,
        },
      }));
      await fulfill(route, rooms);
      return;
    }

    if (path.endsWith('/withDiary/fetch_withDiary')) {
      const { roomId } = parseJsonBody(request.postData());
      const numericId = Number(roomId);
      const room = withDiaryRooms.find((item) => item.id === numericId);
      if (!room) {
        await fulfill(route, {}, 404);
        return;
      }
      await fulfill(route, {
        ...room,
        diaryRoomId: room.id,
        diaryRoom: {
          id: room.id,
          roomName: room.roomName,
          creator_name: room.creator_name,
          update_at: room.update_at,
        },
      });
      return;
    }

    if (path.endsWith('/withDiary/fetch_withDiary_room_users')) {
      const { diaryRoomId } = parseJsonBody(request.postData());
      const numericId = Number(diaryRoomId);
      const room = withDiaryRooms.find((item) => item.id === numericId);
      if (!room) {
        await fulfill(route, []);
        return;
      }
      const members = room.memberIds
        .map((id) => findUserById(id))
        .filter((user): user is FakeUser => Boolean(user))
        .map((user) => ({
          id: user.id,
          userId: user.id,
          username: user.username,
          name: user.name,
        }));
      await fulfill(route, members);
      return;
    }

    if (path.endsWith('/withDiary/remove_withDiary_room_user')) {
      const { diaryRoomId, userId } = parseJsonBody(request.postData());
      const room = withDiaryRooms.find((item) => item.id === Number(diaryRoomId));
      if (room) {
        room.memberIds = room.memberIds.filter((id) => id !== Number(userId));
      }
      await fulfill(route, { success: true });
      return;
    }

    if (path.endsWith('/withDiary/remove_withDiary_room')) {
      const { diaryRoomId } = parseJsonBody(request.postData());
      const roomIndex = withDiaryRooms.findIndex((item) => item.id === Number(diaryRoomId));
      if (roomIndex >= 0) {
        withDiaryRooms.splice(roomIndex, 1);
        withDiaryEntries.delete(Number(diaryRoomId));
      }
      await fulfill(route, { success: true });
      return;
    }

    const scheduleIdMatch = path.match(/^\/schedule\/(\d+)$/);
    if (scheduleIdMatch) {
      const scheduleId = Number(scheduleIdMatch[1]);
      if (!scheduleId) {
        await fulfill(route, { success: false }, 400);
        return;
      }
      if (method === 'PUT') {
        const payload = parseJsonBody(request.postData());
        updateScheduleEntry(scheduleId, {
          title: payload.title,
          start: payload.start,
          end: payload.end || payload.start,
          color: payload.color,
        });
        await fulfill(route, { success: true });
        return;
      }
      if (method === 'DELETE') {
        removeScheduleEntry(scheduleId);
        await fulfill(route, { success: true });
        return;
      }
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
        user: { id: user.id, username: user.username, name: user.name, role: user.role },
      });
      return;
    }

    if (path.endsWith('/approvedUsers')) {
      const payload = parseJsonBody(request.postData());
      const startRow = Number(payload.startRow ?? 0);
      const pageSize = Number(payload.pageSize ?? 20);
      const searchWord = (payload.searchWord ?? '').toString();
      const approvedUsers = Array.from(users.values())
        .filter((user) => user.role === 'USER' && user.isApproved)
        .map(({ id: userId, username, name, role }) => ({ id: userId, username, name, role }));
      const filtered = approvedUsers.filter((user) =>
        searchWord ? user.username.includes(searchWord) : true,
      );
      const paged = filtered.slice(startRow, startRow + pageSize);
      await fulfill(route, { list: paged, total: filtered.length });
      return;
    }

    if (path.endsWith('/approvedUsersCount')) {
      const approvedUsers = Array.from(users.values()).filter(
        (user) => user.role === 'USER' && user.isApproved,
      );
      await fulfill(route, { count: approvedUsers.length });
      return;
    }

    if (path.endsWith('/updateUserRole')) {
      const { id, role } = parseJsonBody(request.postData());
      const user = findUserById(id);
      if (!user) {
        await fulfill(route, { success: false }, 404);
        return;
      }
      user.role = role === 'ADMIN' ? 'ADMIN' : 'USER';
      await fulfill(route, { success: true });
      return;
    }

    if (path.endsWith('/revokeApproveStatus')) {
      const { id } = parseJsonBody(request.postData());
      const user = findUserById(id);
      if (!user) {
        await fulfill(route, { success: false }, 404);
        return;
      }
      user.isApproved = false;
      await fulfill(route, { success: true });
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
    addScheduleEntry,
    updateScheduleEntry,
    removeScheduleEntry,
    addWithDiaryRoom(options) {
      const memberIds =
        options.members?.map((username) => getUserByUsername(username)?.id ?? 0) ?? [];
      const creatorUser = options.creator ? getUserByUsername(options.creator) : users.get('admin');
      return addWithDiaryRoomInternal({
        roomName: options.roomName,
        memberIds,
        creatorId: creatorUser?.id ?? 1,
        creatorName: creatorUser?.name ?? '관리자',
      }).id;
    },
    addWithDiaryEntry(roomId, entry) {
      return addWithDiaryEntryInternal(roomId, entry);
    },
    addCommentEntry(boardName, boardId, entry) {
      return addCommentEntryInternal(boardName, boardId, entry);
    },
    resetComments(boardName, boardId) {
      setComments(boardName, boardId, []);
    },
  };
}
