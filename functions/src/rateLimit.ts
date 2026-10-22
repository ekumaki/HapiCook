// 1日あたりの呼び出し回数制限（Firestore カウンタ。クライアントからは rules で読めない）
import { FieldValue, Firestore } from 'firebase-admin/firestore';

const COLLECTION = 'aiUsage';

/** JST の日付キー (YYYY-MM-DD) */
export function dayKeyJst(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/**
 * カウンタを +1 して、上限内なら true を返す。
 * 上限を超えている場合はカウントせず false。
 */
export async function consumeDailyQuota(db: Firestore, uid: string, dailyLimit: number): Promise<boolean> {
  const ref = db.collection(COLLECTION).doc(`${uid}_${dayKeyJst()}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = (snap.data()?.count as number | undefined) ?? 0;
    if (count >= dailyLimit) return false;
    tx.set(
      ref,
      { uid, count: count + 1, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return true;
  });
}
