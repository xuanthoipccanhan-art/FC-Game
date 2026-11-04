/* Lịch thi đấu, giải VĐQG, Cúp Quốc gia, Cúp C1 châu Âu */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;

  const COMP = {
    league: { name: "Ngoại hạng Anh", short: "NHA", color: "#7b2ff7" },
    cup: { name: "Cúp Quốc gia Anh", short: "CUP", color: "#e0a800" },
    ucl: { name: "Cúp C1 châu Âu", short: "C1", color: "#1e88e5" },
  };
  const CUP_ROUNDS = [
    { key: "r1", label: "Vòng 1" }, { key: "r16", label: "Vòng 1/8" }, { key: "qf", label: "Tứ kết" }, { key: "sf", label: "Bán kết" }, { key: "f", label: "Chung kết" },
  ];
  const UCL_KO = [{ key: "qf", label: "Tứ kết" }, { key: "sf", label: "Bán kết" }, { key: "f", label: "Chung kết" }];

  // Lịch vòng tròn 2 lượt (thuật toán xoay vòng)
  function roundRobin(teams) {
    const t = U.shuffle(teams);
    if (t.length % 2) t.push(null);
    const n = t.length;
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) {
        const a = t[i], b = t[n - 1 - i];
        if (a && b) pairs.push(r % 2 === 0 ? (i === 0 ? [a, b] : [a, b]) : [b, a]);
      }
      rounds.push(pairs);
      t.splice(1, 0, t.pop());
    }
    // Đảo chiều sân để cân bằng
    const first = rounds.map((rd, ri) => rd.map(([a, b], pi) => ((ri + pi) % 2 ? [b, a] : [a, b])));
    const second = first.map((rd) => rd.map(([a, b]) => [b, a]));
    return first.concat(second);
  }

  function firstSaturdayNear(y) {
    // Thứ Bảy gần ngày 20/08 nhất
    let d = `${y}-08-20`;
    while (U.toDate(d).getUTCDay() !== 6) d = U.addDays(d, 1);
    return d;
  }

  function buildSeason(game, year) {
    const leagueTeams = Object.values(game.clubs).filter((c) => c.league === "ENG").map((c) => c.id);
    const fixtures = {};
    const calendar = [];
    const mk = (comp, round, home, away, date, extra = {}) => {
      const id = U.uid("f");
      fixtures[id] = { id, comp, round, home, away, date, result: null, ...extra };
      return id;
    };
    const start = firstSaturdayNear(year);
    const BREAKS = new Set([2, 7, 12, 30]);
    const CUP_FINAL_WEEK = 37;
    const LEAGUE_MIDWEEK = [15, 19, 23];
    const UCL_GROUP = [4, 6, 9, 11, 14, 16];
    const UCL_KO_W = { qf: 28, sf: 33 };
    const CUP_W = { r1: 5, r16: 10, qf: 21, sf: 25 };

    const leagueSlots = [];
    for (let w = 0; w < 40; w++) {
      const sat = U.addDays(start, w * 7);
      if (!BREAKS.has(w) && w !== CUP_FINAL_WEEK) leagueSlots.push(sat);
      if (LEAGUE_MIDWEEK.includes(w)) leagueSlots.push(U.addDays(sat, 4));
    }
    leagueSlots.sort();
    const rr = roundRobin(leagueTeams);
    rr.forEach((pairs, r) => {
      const date = leagueSlots[r];
      const ids = pairs.map(([h, a]) => mk("league", r + 1, h, a, date));
      calendar.push({ id: U.uid("c"), date, comp: "league", round: r + 1, label: `Vòng ${r + 1}`, fixtures: ids, done: false });
    });

    // Cúp quốc gia: tạo trước các mốc, bốc thăm sau
    for (const r of CUP_ROUNDS) {
      const date = r.key === "f" ? U.addDays(start, CUP_FINAL_WEEK * 7) : U.addDays(start, CUP_W[r.key] * 7 + 3);
      calendar.push({ id: U.uid("c"), date, comp: "cup", round: r.key, label: r.label, fixtures: [], done: false });
    }
    // Cúp C1
    UCL_GROUP.forEach((w, i) => {
      calendar.push({ id: U.uid("c"), date: U.addDays(start, w * 7 + 3), comp: "ucl", round: "g" + (i + 1), label: `Vòng bảng - Lượt ${i + 1}`, fixtures: [], done: false });
    });
    calendar.push({ id: U.uid("c"), date: U.addDays(start, UCL_KO_W.qf * 7 + 3), comp: "ucl", round: "qf", label: "Tứ kết", fixtures: [], done: false });
    calendar.push({ id: U.uid("c"), date: U.addDays(start, UCL_KO_W.sf * 7 + 3), comp: "ucl", round: "sf", label: "Bán kết", fixtures: [], done: false });
    calendar.push({ id: U.uid("c"), date: U.addDays(start, 40 * 7), comp: "ucl", round: "f", label: "Chung kết", fixtures: [], done: false });

    calendar.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    game.fixtures = fixtures;
    game.calendar = calendar;
    game.calIdx = 0;

    // Cúp quốc gia: vòng 1 cho 8 đội có uy tín thấp nhất
    const byRep = leagueTeams.slice().sort((a, b) => game.clubs[b].rep - game.clubs[a].rep);
    const low = U.shuffle(byRep.slice(12));
    game.cup = { alive: byRep.slice(0, 12), byes: byRep.slice(0, 12), winner: null, eliminated: {} };
    const r1 = calendar.find((c) => c.comp === "cup" && c.round === "r1");
    for (let i = 0; i < 8; i += 2) r1.fixtures.push(mk("cup", "r1", low[i], low[i + 1], r1.date, { ko: true }));

    // Cúp C1: 4 đội Anh + 12 đội châu Âu, chia 4 bảng
    let eng = game.uclQualified && game.uclQualified.length === 4 ? game.uclQualified : byRep.slice(0, 4);
    const eur = Object.values(game.clubs).filter((c) => c.league === "EUR").map((c) => c.id);
    const all = eng.concat(eur).sort((a, b) => game.clubs[b].rep - game.clubs[a].rep);
    const pots = [0, 1, 2, 3].map((k) => U.shuffle(all.slice(k * 4, k * 4 + 4)));
    const groups = { A: [], B: [], C: [], D: [] };
    const gk = Object.keys(groups);
    for (const pot of pots) pot.forEach((t, i) => groups[gk[i]].push(t));
    game.ucl = { groups, teams: all, winner: null, eliminated: {} };
    const pattern = [[[0, 1], [2, 3]], [[3, 0], [1, 2]], [[0, 2], [3, 1]]];
    const md = [pattern[0], pattern[1], pattern[2], pattern[0].map(([a, b]) => [b, a]), pattern[1].map(([a, b]) => [b, a]), pattern[2].map(([a, b]) => [b, a])];
    md.forEach((pairs, mi) => {
      const ev = calendar.find((c) => c.comp === "ucl" && c.round === "g" + (mi + 1));
      for (const g of gk) {
        for (const [a, b] of pairs) ev.fixtures.push(mk("ucl", "g" + (mi + 1), groups[g][a], groups[g][b], ev.date, { group: g }));
      }
    });
  }

  function table(game, teamIds, filterFn) {
    const rows = {};
    for (const id of teamIds) rows[id] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] };
    const fx = Object.values(game.fixtures).filter((f) => f.result && filterFn(f)).sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const f of fx) {
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
    list.sort((x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || game.clubs[x.id].name.localeCompare(game.clubs[y.id].name));
    return list;
  }

  function leagueTable(game) {
    const ids = Object.values(game.clubs).filter((c) => c.league === "ENG").map((c) => c.id);
    return table(game, ids, (f) => f.comp === "league");
  }
  function groupTable(game, g) {
    return table(game, game.ucl.groups[g], (f) => f.comp === "ucl" && f.group === g);
  }

  // Bốc thăm vòng tiếp theo sau khi một vòng cúp kết thúc
  function afterCupRound(game, ev) {
    const winners = ev.fixtures.map((id) => {
      const f = game.fixtures[id];
      const w = f.result.winner === 0 ? f.home : f.away;
      const l = f.result.winner === 0 ? f.away : f.home;
      game.cup.eliminated[l] = ev.label;
      return w;
    });
    const idx = CUP_ROUNDS.findIndex((r) => r.key === ev.round);
    let alive = ev.round === "r1" ? game.cup.byes.concat(winners) : winners;
    game.cup.alive = alive;
    if (ev.round === "f") {
      game.cup.winner = winners[0];
      return { winner: winners[0] };
    }
    const next = CUP_ROUNDS[idx + 1];
    const nev = game.calendar.find((c) => c.comp === "cup" && c.round === next.key);
    const draw = U.shuffle(alive);
    for (let i = 0; i < draw.length; i += 2) {
      const id = U.uid("f");
      game.fixtures[id] = { id, comp: "cup", round: next.key, home: draw[i], away: draw[i + 1], date: nev.date, result: null, ko: true, neutral: next.key === "f" || next.key === "sf" };
      nev.fixtures.push(id);
    }
    return { drawn: next.label };
  }

  function afterUclRound(game, ev) {
    if (ev.round.startsWith("g")) {
      if (ev.round !== "g6") return null;
      const q = {};
      for (const g of Object.keys(game.ucl.groups)) {
        const t = groupTable(game, g);
        q[g] = [t[0].id, t[1].id];
        game.ucl.eliminated[t[2].id] = "Vòng bảng";
        game.ucl.eliminated[t[3].id] = "Vòng bảng";
      }
      const pairs = [[q.A[0], q.B[1]], [q.B[0], q.A[1]], [q.C[0], q.D[1]], [q.D[0], q.C[1]]];
      const nev = game.calendar.find((c) => c.comp === "ucl" && c.round === "qf");
      for (const [h, a] of pairs) {
        const id = U.uid("f");
        game.fixtures[id] = { id, comp: "ucl", round: "qf", home: h, away: a, date: nev.date, result: null, ko: true };
        nev.fixtures.push(id);
      }
      return { drawn: "Tứ kết" };
    }
    const winners = ev.fixtures.map((id) => {
      const f = game.fixtures[id];
      const w = f.result.winner === 0 ? f.home : f.away;
      game.ucl.eliminated[f.result.winner === 0 ? f.away : f.home] = ev.label;
      return w;
    });
    if (ev.round === "f") {
      game.ucl.winner = winners[0];
      return { winner: winners[0] };
    }
    const nextKey = ev.round === "qf" ? "sf" : "f";
    const nev = game.calendar.find((c) => c.comp === "ucl" && c.round === nextKey);
    const draw = U.shuffle(winners);
    for (let i = 0; i < draw.length; i += 2) {
      const id = U.uid("f");
      game.fixtures[id] = { id, comp: "ucl", round: nextKey, home: draw[i], away: draw[i + 1], date: nev.date, result: null, ko: true, neutral: nextKey === "f" };
      nev.fixtures.push(id);
    }
    return { drawn: nextKey === "sf" ? "Bán kết" : "Chung kết" };
  }

  function roundLabel(f) {
    if (f.comp === "league") return "Vòng " + f.round;
    if (f.comp === "cup") return (CUP_ROUNDS.find((r) => r.key === f.round) || {}).label || f.round;
    if (f.round && f.round[0] === "g") return `Bảng ${f.group} - Lượt ${f.round.slice(1)}`;
    return (UCL_KO.find((r) => r.key === f.round) || {}).label || f.round;
  }

  FC.comp = { COMP, CUP_ROUNDS, buildSeason, leagueTable, groupTable, afterCupRound, afterUclRound, roundLabel, roundRobin };
})();
