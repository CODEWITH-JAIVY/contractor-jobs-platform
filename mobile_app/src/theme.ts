import { tr } from './i18n';

/** Design tokens: "hi-vis site signage" - ink + safety yellow on concrete. */
export const C = {
  ink: '#1C2127',
  yellow: '#FFC20E',
  paleYellow: '#FFF6D6',
  concrete: '#F3F4F2',
  steel: '#5B6670',
  line: '#DDE0DC',
  green: '#1E8E4E',
  red: '#C62F2F',
  amber: '#D9A400',
  lightGreen: '#DFF3E7',
  lightRed: '#FBE3E3',
} as const;

export function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  // server Instant me nanoseconds ho sakte hain; Date ko sirf milliseconds chahiye
  const t = new Date(iso.replace(/(\.\d{3})\d+/, '$1')).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return tr('time.now');
  if (mins < 60) return tr('time.min', { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return tr('time.hour', { n: hrs });
  return tr('time.day', { n: Math.floor(hrs / 24) });
}

/** Indian grouping: 1234567 -> ₹12,34,567 */
export function inr(v: number | null | undefined): string {
  const n = Math.round(v ?? 0);
  let s = Math.abs(n).toString();
  if (s.length > 3) {
    const last = s.slice(-3);
    let rest = s.slice(0, -3);
    const parts: string[] = [];
    while (rest.length > 2) {
      parts.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) parts.unshift(rest);
    s = `${parts.join(',')},${last}`;
  }
  return `${n < 0 ? '-' : ''}₹${s}`;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const ymKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const fmtHours = (h: number) => (Number.isInteger(h) ? String(h) : h.toFixed(1));
