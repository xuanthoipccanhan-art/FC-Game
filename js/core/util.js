/* Tiện ích chung */
(function () {
  const FC = (window.FC = window.FC || {});

  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const chance = (p) => Math.random() < p;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round1 = (v) => Math.round(v * 10) / 10;

  function weightedPick(items, weightFn) {
    let total = 0;
    const ws = items.map((it) => {
      const w = Math.max(0, weightFn(it));
      total += w;
      return w;
    });
    if (total <= 0) return pick(items);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Tiền: đơn vị gốc là triệu Euro (M€)
  function money(m) {
    const neg = m < 0;
    const v = Math.abs(m);
    let s;
    if (v >= 1000) s = (v / 1000).toFixed(2) + " tỷ €";
    else if (v >= 1) s = (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + " tr €";
    else s = Math.round(v * 1000) + " ng €";
    return (neg ? "-" : "") + "€" + s.replace(" €", "");
  }
  // Lương: đơn vị nghìn Euro / tuần
  function wage(k) {
    if (k >= 1000) return "€" + (k / 1000).toFixed(2) + "tr/tuần";
    return "€" + Math.round(k) + "ng/tuần";
  }

  // Ngày tháng (chuỗi YYYY-MM-DD, UTC)
  function toDate(s) {
    return new Date(s + "T12:00:00Z");
  }
  function fmtISO(d) {
    return d.toISOString().slice(0, 10);
  }
  function addDays(s, n) {
    const d = toDate(s);
    d.setUTCDate(d.getUTCDate() + n);
    return fmtISO(d);
  }
  function daysBetween(a, b) {
    return Math.round((toDate(b) - toDate(a)) / 86400000);
  }
  const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  function fmtDate(s, withWeekday = true) {
    const d = toDate(s);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    return (withWeekday ? WD[d.getUTCDay()] + ", " : "") + dd + "/" + mm + "/" + d.getUTCFullYear();
  }

  let uidCounter = 0;
  function uid(prefix = "x") {
    uidCounter++;
    return prefix + Date.now().toString(36).slice(-5) + uidCounter.toString(36) + Math.floor(Math.random() * 1296).toString(36);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ordinal(n) {
    return "#" + n;
  }

  FC.util = {
    hashStr, seeded, rand, randInt, chance, pick, clamp, round1, weightedPick, shuffle,
    money, wage, toDate, fmtISO, addDays, daysBetween, fmtDate, uid, esc, ordinal,
  };
})();
