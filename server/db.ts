import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, searchHistory, InsertSearchHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== 搜尋歷史記錄 =====

export async function addSearchHistory(entry: InsertSearchHistory): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    // 避免重複：如果同 sessionId 已有相同 appId，先刪除舊的
    if (entry.sessionId) {
      await db.delete(searchHistory)
        .where(eq(searchHistory.appId, entry.appId));
    }
    await db.insert(searchHistory).values(entry);
  } catch (error) {
    console.error("[Database] Failed to add search history:", error);
  }
}

export async function getSearchHistory(sessionId?: string, userId?: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db
      .select()
      .from(searchHistory)
      .orderBy(desc(searchHistory.createdAt))
      .limit(limit);
    return rows;
  } catch (error) {
    console.error("[Database] Failed to get search history:", error);
    return [];
  }
}

export async function deleteSearchHistory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.delete(searchHistory).where(eq(searchHistory.id, id));
  } catch (error) {
    console.error("[Database] Failed to delete search history:", error);
  }
}

export async function clearSearchHistory(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.delete(searchHistory);
  } catch (error) {
    console.error("[Database] Failed to clear search history:", error);
  }
}
