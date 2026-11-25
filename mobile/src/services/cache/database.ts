import * as SQLite from 'expo-sqlite';

// SQLite trên thiết bị (expo-sqlite), tách biệt hoàn toàn với MySQL của server.
// Mục đích duy nhất: xem lại công thức đã yêu thích khi mất mạng (Mục 7.12).

export const CACHE_DATABASE_NAME = 'recipe_cache.db';
export const CACHED_RECIPES_TABLE = 'cached_recipes';

// Tăng số này mỗi khi đổi schema và thêm một bước migrate tương ứng.
const SCHEMA_VERSION = 1;

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

  // Các câu lệnh dưới đây đều idempotent nên chạy lại cũng an toàn.
  // Khoá chính (user_id, recipe_id, source): cache tách theo tài khoản và theo
  // nguồn, nhờ đó tài khoản khác không đọc được dữ liệu cache của nhau.
  // favorite_id: id dòng favorites, để màn ngoại tuyến biết dòng yêu thích nào
  // tương ứng (gọi DELETE /favorites/:id khi có mạng lại).
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
      PRIMARY KEY (user_id, recipe_id, source)
    );
    CREATE INDEX IF NOT EXISTS idx_cached_recipes_user_cached_at
      ON ${CACHED_RECIPES_TABLE} (user_id, cached_at DESC);
    PRAGMA user_version = ${SCHEMA_VERSION};
  `);

  return db;
}
