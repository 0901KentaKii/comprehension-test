import { useSyncExternalStore } from "react";
import type { TestResult, TestSession } from "../types/test";

const SESSION_KEY = "online-test:session:v1";
const RESULT_KEY = "online-test:result:v1";

/**
 * localStorage の1キーを扱う小さなストア。
 * set() のたびに即座に localStorage へ書き込むため、回答変更は都度保存される。
 * localStorage が使えない環境 (プライベートモード等) でもメモリ上で動作を続ける。
 */
function createStore<T>(key: string, persist = true) {
  const read = (): T | null => {
    try {
      if (!persist) {
        // 保存しないストア。以前のバージョンで保存されたものが残っていれば消す
        localStorage.removeItem(key);
        return null;
      }
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };

  let cache = read();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  // 別タブでの変更を反映する
  window.addEventListener("storage", (e) => {
    if (persist && (e.key === key || e.key === null)) {
      cache = read();
      notify();
    }
  });

  return {
    get: () => cache,
    set: (value: T | null) => {
      cache = value;
      if (persist) {
        try {
          if (value === null) localStorage.removeItem(key);
          else localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // 保存できなくても画面上の操作は継続する
        }
      }
      notify();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** 受験中データ (送信成功時のみ削除する) */
export const sessionStore = createStore<TestSession>(SESSION_KEY);
/**
 * 提出完了画面用の記録。端末には保存せず、メモリ上にだけ持つ。
 * 提出後にページを開き直すと氏名入力の画面に戻るので、同じ端末で次の人が受験できる。
 */
export const resultStore = createStore<TestResult>(RESULT_KEY, false);

export function useTestStorage() {
  const session = useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
  const result = useSyncExternalStore(resultStore.subscribe, resultStore.get);
  return { session, result };
}
