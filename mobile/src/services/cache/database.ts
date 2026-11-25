import * as SQLite from 'expo-sqlite';

// SQLite trên thiết bị (expo-sqlite), tách biệt hoàn toàn với MySQL của server.
// Mục đích duy nhất: xem lại công thức đã yêu thích khi mất mạng (Mục 7.12).

export const CACHE_DATABASE_NAME = 'recipe_cache.db';
export const CACHED_RECIPES_TABLE = 'cached_recipes';

// Tăng số này mỗi khi đổi schema và thêm một bước migrate tương ứng.
// v1: bảng cached_recipes ban đầu.
// v2: thêm servings, ready_in_minutes, nutrition_coverage (đều cho phép NULL).
const SCHEMA_VERSION = 2;

// Các cột thêm từ v2 trở đi, migrate bằng ALTER TABLE ... ADD COLUMN cho máy
// đã có bảng cũ. Định nghĩa phải khớp với CREATE TABLE bên dưới.
const ADDED_COLUMNS_V2: readonly { name: string; definition: string }[] = [
  { name: 'servings', definition: 'INTEGER' },
  { name: 'ready_in_minutes', definition: 'INTEGER' },
  { name: 'nutrition_coverage', definition: 'TEXT' },
];

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Mở một lần rồi dùng lại cho cả app. Nếu lần mở đầu hỏng thì xoá promise để
// lần gọi sau còn thử lại được, thay vì kẹt mãi với lỗi cũ.
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndMigrate().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(CACHE_DATABASE_NAME);

  // WAL: khuyến nghị của Expo cho database mới, đọc và ghi không chặn nhau.
  await db.execAsync('PRAGMA journal_mode = WAL');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= SCHEMA_VERSION) {
    return db;
  }

  // Các câu lệnh dưới đây đều idempotent nên chạy lại cũng an toàn; user_version
  // chỉ được nâng ở cuối, nên nếu migrate hỏng giữa chừng thì lần mở sau làm lại.
  // Khoá chính (user_id, recipe_id, source): cache tách theo tài khoản và theo
  // nguồn, nhờ đó tài khoản khác không đọc được dữ liệu cache của nhau.
  // favorite_id: id dòng favorites, để màn ngoại tuyến biết dòng yêu thích nào
  // tương ứng (gọi DELETE /favorites/:id khi có mạng lại).
  // Máy mới: CREATE TABLE đã có đủ cột v2. Máy đang ở v1: CREATE TABLE bị bỏ qua
  // vì bảng đã tồn tại, các cột v2 được thêm ở bước ALTER TABLE phía dưới.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${CACHED_RECIPES_TABLE} (
      user_id INTEGER NOT NULL,
      recipe_id TEXT NOT NULL,
      source TEXT NOT NULL,
      title TEXT,
      image_url TEXT,
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      video_url TEXT,
      nutrition TEXT,
      favorite_id INTEGER,
      cached_at TEXT NOT NULL,
      servings INTEGER,
      ready_in_minutes INTEGER,
      nutrition_coverage TEXT,
      PRIMARY KEY (user_id, recipe_id, source)
    );
    CREATE INDEX IF NOT EXISTS idx_cached_recipes_user_cached_at
      ON ${CACHED_RECIPES_TABLE} (user_id, cached_at DESC);
  `);

  if (currentVersion < 2) {
    await addMissingColumns(db, ADDED_COLUMNS_V2);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);

  return db;
}

// SQLite không có ADD COLUMN IF NOT EXISTS, nên đọc danh sách cột hiện có trước
// rồi chỉ thêm cột còn thiếu. Nhờ vậy chạy lại sau một lần migrate dở dang vẫn an toàn.
async function addMissingColumns(
  db: SQLite.SQLiteDatabase,
  columns: readonly { name: string; definition: string }[],
): Promise<void> {
  const existing = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${CACHED_RECIPES_TABLE})`,
  );
  const existingNames = new Set(existing.map((column) => column.name));

  for (const column of columns) {
    if (existingNames.has(column.name)) continue;
    await db.execAsync(
      `ALTER TABLE ${CACHED_RECIPES_TABLE} ADD COLUMN ${column.name} ${column.definition}`,
    );
  }
}
