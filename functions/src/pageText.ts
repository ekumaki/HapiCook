// URL取り込み用: Webページを取得して本文テキストに落とす（ブラウザのCORS制限をサーバー側で回避）

const MAX_HTML_BYTES = 2_000_000;
const MAX_TEXT_CHARS = 30_000;
const FETCH_TIMEOUT_MS = 15_000;

function isPublicHttpUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  // 内部ネットワークやメタデータエンドポイントへのSSRFを防ぐ
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.startsWith('[')
  ) {
    return false;
  }
  return true;
}

/** HTML からスクリプト・スタイル・タグを落として素のテキストにする */
export function htmlToText(html: string): string {
  const withoutBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const withBreaks = withoutBlocks.replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>|<br\s*\/?>/gi, '\n');
  const stripped = withBreaks.replace(/<[^>]+>/g, ' ');
  const decoded = stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
  return decoded
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .slice(0, MAX_TEXT_CHARS);
}

/** URL を取得して本文テキストを返す。失敗時は Error を投げる */
export async function fetchPageText(url: string): Promise<string> {
  if (!isPublicHttpUrl(url)) {
    throw new Error('このURLは取り込めません。公開されているWebページのURLを指定してください。');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HapiCookBot/1.0; +https://hapicook-14d13.web.app)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.5',
      },
    });
    if (!res.ok) {
      throw new Error(`ページの取得に失敗しました（HTTP ${res.status}）。`);
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      throw new Error('このURLはHTMLページではないため取り込めません。');
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_HTML_BYTES) {
      throw new Error('ページが大きすぎるため取り込めません。');
    }
    const text = htmlToText(new TextDecoder('utf-8').decode(buf));
    if (text.length < 50) {
      throw new Error('ページから本文テキストを取得できませんでした。');
    }
    return text;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('ページの取得がタイムアウトしました。');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
