/* Lịch thi đấu đa giải, bảng xếp hạng, cúp quốc gia, cúp châu lục, play-off lên hạng */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;

  const COMP = {
    league: { name: "VĐQG", short: "LG", color: "#7b2ff7" },
    cup: { name: "Cúp Quốc gia", short: "CUP", color: "#e0a800" },
    ucl: { name: "Cúp C1 châu Âu", short: "C1", color: "#1e88e5" },
    lib: { name: "Copa Libertadores", short: "LIB", color: "#c9a227" },
    po: { name: "Play-off lên hạng", short: "PO", color: "#00b894" },
    bar: { name: "Play-off trụ hạng", short: "BAR", color: "#ff7675" },
  };

  // Tên hiển thị của một trận/giải
  function compName(f) {
    if (f.comp === "league") return FC.LEAGUES[f.key].name;
    if (f.comp === "cup") return cupName(f.key);
    if (f.comp === "po") return "Play-off " + FC.LEAGUES[f.key].name;
    if (f.comp === "bar") return "Play-off trụ hạng " + FC.LEAGUES[f.key].name;
    return COMP[f.comp].name;
  }
  function compShort(f) {
    if (f.comp === "league") return FC.LEAGUES[f.key].short;
    return COMP[f.comp].short;
  }
  function compColor(f) {
    if (f.comp === "league") return FC.LEAGUES[f.key].color;
    return COMP[f.comp].color;
  }
  function cupName(country) {
    const l = Object.values(FC.LEAGUES).find((x) => x.country === country && x.tier === 1);
    return (l && l.cup) || "Cúp Quốc gia";
  }

  // Lịch vòng tròn 2 lượt
  function roundRobin(teams) {
    const t = U.shuffle(teams);
    if (t.length % 2) t.push(null);
    const n = t.length;
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) {
        const a = t[i], b = t[n - 1 - i];
        if (a && b) pairs.push([a, b]);
      }
      rounds.push(pairs);
      t.splice(1, 0, t.pop());
    }
    const first = rounds.map((rd, ri) => rd.map(([a, b], pi) => ((ri + pi) % 2 ? [b, a] : [a, b])));
    const second = first.map((rd) => rd.map(([a, b]) => [b, a]));
    return first.concat(second);
  }

  function firstSaturdayNear(y) {
    let d = `${y}-08-20`;
    while (U.toDate(d).getUTCDay() !== 6) d = U.addDays(d, 1);
    return d;
  }

  const BREAKS = [2, 7, 12, 30]; // tuần FIFA Days (đội tuyển)
  const MIDWEEK = [15, 19, 23, 5, 9, 26, 28, 33, 35, 17];
  const CUP_WEEKS = [3, 8, 13, 20, 24, 29, 34];
  const CONT_WEEKS = { g1: 4, g2: 6, g3: 10, g4: 11, g5: 14, g6: 16, r16: 22, qf: 27, sf: 32, f: 41 };

  function nextPow2(n) { let p = 1; while (p < n) p *= 2; return p; }

  function clubsOf(s, leagueId) {
    return Object.values(s.clubs).filter((c) => c.league === leagueId).map((c) => c.id);
  }

  function buildSeason(s, year) {
    const start = firstSaturdayNear(year);
    s.seasonStart = start;
    s.breakDates = BREAKS.map((w) => U.addDays(start, w * 7));
    const fixtures = {};
    const calendar = [];
    const leagueFx = {};
    const mk = (comp, key, round, home, away, date, extra = {}) => {
      const id = U.uid("f");
      fixtures[id] = { id, comp, key, round, home, away, date, result: null, ...extra };
      return id;
    };
    const ev = (comp, key, round, date, label, fx = []) => {
      const e = { id: U.uid("c"), date, comp, key, round, label, fixtures: fx, done: false };
      calendar.push(e);
      return e;
    };
    const sat = (w) => U.addDays(start, w * 7);

    // VĐQG
    for (const lid of Object.keys(FC.LEAGUES)) {
      const teams = clubsOf(s, lid);
      if (teams.length < 2) continue;
      const rr = roundRobin(teams);
      const slots = [];
      for (let w = 0; w < 40; w++) if (!BREAKS.includes(w)) slots.push(sat(w));
      const extra = Math.max(0, rr.length - slots.length);
      for (let i = 0; i < extra; i++) slots.push(U.addDays(sat(MIDWEEK[i]), 4));
      slots.sort();
      leagueFx[lid] = [];
      rr.forEach((pairs, r) => {
        const ids = pairs.map(([h, a]) => mk("league", lid, r + 1, h, a, slots[r]));
        leagueFx[lid].push(...ids);
        ev("league", lid, r + 1, slots[r], `Vòng ${r + 1}`, ids);
      });
      // Play-off lên hạng (hạng 3-6) / trận barrage
      const L = FC.LEAGUES[lid];
      if (L.playoff === "semis") {
        ev("po", lid, "sf", U.addDays(sat(40), 4), "Bán kết play-off");
        ev("po", lid, "f", sat(41), "Chung kết play-off");
      }
      if (L.barrage) ev("bar", lid, "f", U.addDays(sat(41), 1), "Play-off trụ hạng");
    }

    // Cúp quốc gia (gồm hạng 1 + hạng 2)
    s.cups = {};
    const countries = [...new Set(Object.values(FC.LEAGUES).map((l) => l.country))];
    for (const c of countries) {
      const teams = Object.values(s.clubs).filter((x) => x.country === c && FC.LEAGUES[x.league]).sort((a, b) => b.rep - a.rep).map((x) => x.id);
      if (teams.length < 4) continue;
      const size = nextPow2(teams.length);
      const R = Math.log2(size);
      const byes = size - teams.length;
      const weeks = CUP_WEEKS.slice(-(R - 1));
      const rounds = [];
      for (let r = 0; r < R; r++) {
        const left = size >> r;
        const label = left === 2 ? "Chung kết" : left === 4 ? "Bán kết" : left === 8 ? "Tứ kết" : `Vòng 1/${left / 2}`;
        const date = r === R - 1 ? sat(40) : U.addDays(sat(weeks[r]), 3);
        rounds.push(ev("cup", c, r, date, label));
      }
      const playing = U.shuffle(teams.slice(byes));
      for (let i = 0; i < playing.length; i += 2) rounds[0].fixtures.push(mk("cup", c, 0, playing[i], playing[i + 1], rounds[0].date, { ko: true }));
      s.cups[c] = { byes: teams.slice(0, byes), alive: teams.slice(), winner: null, out: {}, rounds: R };
    }

    // Cúp châu lục
    s.cont = {};
    for (const [cid, C] of Object.entries(FC.CONTINENTAL)) {
      let teams = [];
      for (const [lid, n] of Object.entries(C.slots)) {
        const q = s.qualified && s.qualified[lid];
        const pool = q && q.length ? q.slice(0, n) : clubsOf(s, lid).sort((a, b) => s.clubs[b].rep - s.clubs[a].rep).slice(0, n);
        teams.push(...pool);
      }
      teams = teams.filter((id) => s.clubs[id]);
      const G = C.groups;
      teams.sort((a, b) => s.clubs[b].rep - s.clubs[a].rep);
      const groups = {};
      const gk = "ABCDEFGH".slice(0, G).split("");
      gk.forEach((g) => (groups[g] = []));
      for (let pot = 0; pot < 4; pot++) {
        const potTeams = U.shuffle(teams.slice(pot * G, pot * G + G));
        potTeams.forEach((t, i) => groups[gk[i]].push(t));
      }
      s.cont[cid] = { groups, teams, winner: null, out: {} };
      const pattern = [[[0, 1], [2, 3]], [[3, 0], [1, 2]], [[0, 2], [3, 1]]];
      const md = [pattern[0], pattern[1], pattern[2], pattern[0].map(([a, b]) => [b, a]), pattern[1].map(([a, b]) => [b, a]), pattern[2].map(([a, b]) => [b, a])];
      const off = cid === "ucl" ? 3 : 4;
      md.forEach((pairs, mi) => {
        const key = "g" + (mi + 1);
        const date = U.addDays(sat(CONT_WEEKS[key]), off);
        const ids = [];
        for (const g of gk) for (const [a, b] of pairs) if (groups[g][a] && groups[g][b]) ids.push(mk(cid, cid, key, groups[g][a], groups[g][b], date, { group: g }));
        ev(cid, cid, key, date, `Vòng bảng - Lượt ${mi + 1}`, ids);
      });
      const ko = G >= 8 ? ["r16", "qf", "sf", "f"] : ["qf", "sf", "f"];
      const lbl = { r16: "Vòng 1/8", qf: "Tứ kết", sf: "Bán kết", f: "Chung kết" };
      for (const k of ko) ev(cid, cid, k, k === "f" ? (cid === "ucl" ? sat(41) : U.addDays(sat(41), 1)) : U.addDays(sat(CONT_WEEKS[k]), off), lbl[k]);
    }

    calendar.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    s.fixtures = fixtures;
    s.calendar = calendar;
    s.calIdx = 0;
    s.leagueFx = leagueFx;
    s._ver = (s._ver || 0) + 1;
  }

  // ===== Bảng xếp hạng (có bộ nhớ đệm) =====
  const cache = {};
  function computeTable(s, teamIds, fxIds) {
    const rows = {};
    for (const id of teamIds) rows[id] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] };
    for (const fid of fxIds) {
      const f = s.fixtures[fid];
      if (!f || !f.result) continue;
      const h = rows[f.home], a = rows[f.away];
      if (!h || !a) continue;
      const { hg, ag } = f.result;
      h.p++; a.p++; h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
      if (hg > ag) { h.w++; a.l++; h.pts += 3; h.form.push("W"); a.form.push("L"); }
      else if (hg < ag) { a.w++; h.l++; a.pts += 3; h.form.push("L"); a.form.push("W"); }
      else { h.d++; a.d++; h.pts++; a.pts++; h.form.push("D"); a.form.push("D"); }
    }
    const list = Object.values(rows);
    list.forEach((r) => (r.form = r.form.slice(-5)));
    list.sort((x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || s.clubs[x.id].name.localeCompare(s.clubs[y.id].name));
    return list;
  }
  function leagueTable(s, lid) {
    const k = "L" + lid;
    if (cache[k] && cache[k].v === s._ver && cache[k].s === s) return cache[k].t;
    const t = computeTable(s, clubsOf(s, lid), s.leagueFx[lid] || []);
    cache[k] = { v: s._ver, s, t };
    return t;
  }
  function groupTable(s, cid, g) {
    const fx = s.calendar.filter((e) => e.comp === cid && e.round[0] === "g").flatMap((e) => e.fixtures).filter((id) => s.fixtures[id].group === g);
    return computeTable(s, s.cont[cid].groups[g], fx);
  }
  function position(s, clubId) {
    const c = s.clubs[clubId];
    return leagueTable(s, c.league).findIndex((r) => r.id === clubId) + 1;
  }

  // ===== Xử lý sau mỗi vòng =====
  function winnerOf(f) { return f.result.winner === 0 ? f.home : f.away; }
  function loserOf(f) { return f.result.winner === 0 ? f.away : f.home; }
  function addFx(s, e, home, away, extra) {
    const id = U.uid("f");
    s.fixtures[id] = { id, comp: e.comp, key: e.key, round: e.round, home, away, date: e.date, result: null, ko: true, ...extra };
    e.fixtures.push(id);
  }

  function afterRound(s, e) {
    const out = { winners: [], champion: null, comp: e.comp, key: e.key };
    if (e.comp === "league") {
      const last = !s.calendar.some((x) => x.comp === "league" && x.key === e.key && !x.done && x !== e);
      if (last) {
        out.leagueDone = true;
        const L = FC.LEAGUES[e.key];
        const t = leagueTable(s, e.key);
        out.champion = t[0].id;
        if (L.playoff === "semis") {
          const sf = s.calendar.find((x) => x.comp === "po" && x.key === e.key && x.round === "sf");
          addFx(s, sf, t[2].id, t[5].id, {});
          addFx(s, sf, t[3].id, t[4].id, {});
        }
        if (L.barrage) {
          // Trận barrage cần cả 2 giải đã kết thúc
          tryBarrage(s, e.key);
        }
        if (L.up && FC.LEAGUES[L.up].barrage) tryBarrage(s, L.up);
      }
      return out;
    }
    if (e.comp === "po") {
      if (e.round === "sf") {
        const f = s.calendar.find((x) => x.comp === "po" && x.key === e.key && x.round === "f");
        const w = e.fixtures.map((id) => winnerOf(s.fixtures[id]));
        if (w.length === 2) addFx(s, f, w[0], w[1], { neutral: true });
      } else if (e.fixtures.length) {
        out.poWinner = winnerOf(s.fixtures[e.fixtures[0]]);
      }
      return out;
    }
    if (e.comp === "bar") {
      if (e.fixtures.length) out.barWinner = winnerOf(s.fixtures[e.fixtures[0]]);
      return out;
    }
    if (e.comp === "cup") {
      const cup = s.cups[e.key];
      const winners = e.fixtures.map((id) => { const f = s.fixtures[id]; cup.out[loserOf(f)] = e.label; return winnerOf(f); });
      const alive = e.round === 0 ? cup.byes.concat(winners) : winners;
      cup.alive = alive;
      if (e.round === cup.rounds - 1) { cup.winner = winners[0]; out.champion = winners[0]; out.cupWinner = true; return out; }
      const next = s.calendar.find((x) => x.comp === "cup" && x.key === e.key && x.round === e.round + 1);
      const draw = U.shuffle(alive);
      const neutral = next.round >= cup.rounds - 2;
      for (let i = 0; i + 1 < draw.length; i += 2) addFx(s, next, draw[i], draw[i + 1], { neutral });
      out.drawn = next;
      return out;
    }
    // Cúp châu lục
    const C = s.cont[e.key];
    if (e.round[0] === "g") {
      if (e.round !== "g6") return out;
      const q = {};
      for (const g of Object.keys(C.groups)) {
        const t = groupTable(s, e.key, g);
        q[g] = [t[0].id, t[1].id];
        t.slice(2).forEach((r) => (C.out[r.id] = "Vòng bảng"));
      }
      const gk = Object.keys(C.groups);
      const pairs = [];
      for (let i = 0; i < gk.length; i += 2) { pairs.push([q[gk[i]][0], q[gk[i + 1]][1]]); pairs.push([q[gk[i + 1]][0], q[gk[i]][1]]); }
      const nk = gk.length >= 8 ? "r16" : "qf";
      const next = s.calendar.find((x) => x.comp === e.key && x.round === nk);
      for (const [h, a] of pairs) addFx(s, next, h, a, {});
      out.drawn = next;
      return out;
    }
    const winners = e.fixtures.map((id) => { const f = s.fixtures[id]; C.out[loserOf(f)] = e.label; return winnerOf(f); });
    if (e.round === "f") { C.winner = winners[0]; out.champion = winners[0]; out.contWinner = true; return out; }
    const nk = { r16: "qf", qf: "sf", sf: "f" }[e.round];
    const next = s.calendar.find((x) => x.comp === e.key && x.round === nk);
    const draw = U.shuffle(winners);
    for (let i = 0; i + 1 < draw.length; i += 2) addFx(s, next, draw[i], draw[i + 1], { neutral: nk === "f" });
    out.drawn = next;
    return out;
  }

  function tryBarrage(s, tier1) {
    const L = FC.LEAGUES[tier1];
    const t2 = L.down;
    const done1 = !s.calendar.some((x) => x.comp === "league" && x.key === tier1 && !x.done);
    const done2 = !s.calendar.some((x) => x.comp === "league" && x.key === t2 && !x.done);
    const bar = s.calendar.find((x) => x.comp === "bar" && x.key === tier1);
    if (!bar || bar.fixtures.length || !done1 || !done2) return;
    const a = leagueTable(s, tier1);
    const b = leagueTable(s, t2);
    addFx(s, bar, a[a.length - L.relegate - 1].id, b[2].id, {});
  }

  function roundLabel(s, f) {
    if (f.comp === "league") return "Vòng " + f.round;
    const e = s.calendar.find((x) => x.comp === f.comp && x.key === f.key && x.round === f.round);
    if (f.group) return `Bảng ${f.group} - Lượt ${String(f.round).slice(1)}`;
    return e ? e.label : String(f.round);
  }

  FC.comp = { COMP, compName, compShort, compColor, cupName, buildSeason, leagueTable, groupTable, position, afterRound, roundLabel, roundRobin, clubsOf };
})();
