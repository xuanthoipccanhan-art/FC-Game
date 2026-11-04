/* Trạng thái trò chơi & tiến trình sự nghiệp */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;
  const PL = FC.players;
  const TR = FC.transfers;
  const CP = FC.comp;
  const EV = FC.events;

  const START_YEAR = 2026; // mùa 2026/27
  const DATA_YEAR = 2025; // tuổi trong dữ liệu tính tại năm này
  const MAX_SEASONS = 10;

  const TRAINING_FOCUS = {
    balanced: { name: "Cân bằng", desc: "Phát triển đồng đều, không có điểm thưởng đặc biệt." },
    attack: { name: "Tấn công", desc: "+1% sức mạnh tấn công trong trận." },
    defense: { name: "Phòng ngự", desc: "+1% sức mạnh phòng ngự trong trận." },
    tactical: { name: "Chiến thuật", desc: "+1% tuyến giữa trong trận, đội thấm nhuần triết lý nhanh hơn." },
    physical: { name: "Thể lực", desc: "Hồi phục thể lực nhanh hơn 12%." },
    youth: { name: "Phát triển trẻ", desc: "Cầu thủ ≤ 21 tuổi tiến bộ nhanh hơn 35%." },
  };
  const INTENSITY = [
    { name: "Nhẹ", grow: 0.75, rec: 1.15, inj: 0 },
    { name: "Vừa", grow: 1, rec: 1, inj: 0.0008 },
    { name: "Cao", grow: 1.3, rec: 0.85, inj: 0.0035 },
  ];
  const SQUAD_TEMPLATE = { GK: 3, CB: 4, LB: 2, RB: 2, CDM: 2, CM: 3, CAM: 2, LW: 2, RW: 2, ST: 3 };

  const Game = {
    s: null,

    seasonLabel(y) {
      y = y || this.s.season;
      return `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
    },
    seasonNo() { return this.s.season - START_YEAR + 1; },

    // ================= KHỞI TẠO THẾ GIỚI =================
    newGame(managerName, clubId, phil, managerNat) {
      const s = {
        v: 2, manager: { name: managerName || "HLV", nat: managerNat || "VIE", games: 0, w: 0, d: 0, l: 0, trophies: [], clubs: [clubId], promotions: 0 },
        userClub: clubId, season: START_YEAR, date: `${START_YEAR}-07-01`,
        clubs: {}, players: {}, managers: {}, freeManagers: [], freeAgents: [], fixtures: {}, calendar: [], calIdx: 0,
        inbox: [], news: [], rumours: [], transferLog: [], shortlist: [], history: [], youth: [], awards: [], pendingEvents: [],
        training: { focus: "balanced", intensity: 1 },
        board: { confidence: 65, target: 10, targetText: "" }, boardMembers: [], staff: {}, fans: 62, sponsor: null,
        finance: null, ticketPrice: 60, pendingOffers: [], sacked: false, seasonEnded: false, careerOver: false,
        settings: { speed: 2, autoSub: true }, qualified: null, buyLoan: {},
      };
      this.s = s;
      for (const c of FC.WORLD.clubs) {
        const club = {
          id: c.id, name: c.name, short: c.short, city: c.city, founded: c.founded, stadium: c.stadium, cap: c.cap, colors: c.colors,
          crest: c.crest, rep: c.rep, league: c.league, country: c.country,
          money: c.money * 2.2 + 10, transferBudget: c.money, players: [],
          tactics: { formation: c.formation, mentality: 0, pressing: 1, tempo: 1, lineup: null, bench: null },
          facilities: { training: c.rep >= 86 ? 5 : c.rep >= 78 ? 4 : c.rep >= 68 ? 3 : 2, youth: c.academy || 2 },
          mgr: null,
        };
        s.clubs[c.id] = club;
        const ps = c.players.map((raw) => PL.makePlayer(raw, c.id, START_YEAR - DATA_YEAR, c.rep));
        PL.shirtNumbers(ps);
        for (const p of ps) { p.peak = p.ovr; p.career.clubs = [c.id]; s.players[p.id] = p; club.players.push(p.id); }
        if (c.manager) {
          const m = this.addManager({ ...c.manager, age: c.manager.age + (START_YEAR - DATA_YEAR) });
          m.club = c.id;
          club.mgr = m.id;
        }
      }
      for (const raw of FC.FREE_AGENTS) {
        const p = PL.makePlayer(raw, null, START_YEAR - DATA_YEAR, 80);
        p.peak = p.ovr;
        s.players[p.id] = p;
        s.freeAgents.push(p.id);
      }
      for (const c of Object.values(s.clubs)) {
        if (!c.mgr) { const m = this.genManager(c); m.club = c.id; c.mgr = m.id; }
        this.fillSquad(c, 24);
        this.setClause(c);
        if (c.id !== clubId) c.tactics.formation = this.bestFormation(c);
      }
      for (const x of [["Pep Guardiola", "ESP", 55, "control", 94], ["Jürgen Klopp", "GER", 59, "gegen", 92], ["Carlo Ancelotti", "ITA", 67, "pragmatic", 92], ["Arne Slot", "NED", 48, "control", 84], ["Thomas Tuchel", "GER", 53, "pragmatic", 86], ["Xavi Hernández", "ESP", 46, "control", 78], ["Eddie Howe", "ENG", 48, "gegen", 78], ["Ange Postecoglou", "AUS", 61, "wing", 76], ["Thiago Motta", "ITA", 44, "control", 74], ["Erik ten Hag", "NED", 56, "control", 76], ["Ruud van Nistelrooy", "NED", 50, "pragmatic", 70], ["Graham Potter", "ENG", 51, "control", 74]]) {
        const m = this.addManager({ name: x[0], nat: x[1], age: x[2], phil: x[3], rating: x[4] });
        s.freeManagers.push(m.id);
      }
      const um = this.addManager({ name: s.manager.name, nat: s.manager.nat, age: 40, phil: phil || "pragmatic", rating: 70 }, "user");
      const user = s.clubs[clubId];
      const prev = s.managers[user.mgr];
      if (prev) { prev.club = null; s.freeManagers.push(prev.id); }
      user.mgr = um.id;
      um.club = clubId;
      um.fam = 0.45;
      this.initStaff();
      this.autoPick(user);
      CP.buildSeason(s, s.season);
      this.resetFinance();
      this.setBoardTargets(true);
      const L = FC.LEAGUES[user.league];
      this.mail("Ban lãnh đạo", `Chào mừng HLV ${s.manager.name}!`,
        `Ban lãnh đạo ${user.name} chào mừng bạn đến với vai trò Huấn luyện viên trưởng mùa giải ${this.seasonLabel()} tại ${L.name}.\n\n` +
        `Mục tiêu mùa này: <b>${s.board.targetText}</b>.\nNgân sách chuyển nhượng: <b>${U.money(user.transferBudget)}</b>.\n` +
        `Quỹ lương tối đa: <b>${U.wage(user.wageBudget)}</b>.\nTriết lý của bạn: <b>${FC.PHILOSOPHIES[um.phil].name}</b> — đội cần thời gian để thấm nhuần.\n\n` +
        `Sự nghiệp kéo dài tối đa ${MAX_SEASONS} mùa giải. Kỳ chuyển nhượng hè mở đến 01/09. Chúc bạn thành công!`, "board");
      this.mail("Trợ lý HLV", "Gợi ý bắt đầu",
        "• <b>Chiến thuật</b>: chọn sơ đồ, đội hình và triết lý bóng đá.\n• <b>Đội hình</b>: có tab Đội một / Đội trẻ / Cho mượn. Có thể đẩy cầu thủ xuống đội trẻ hoặc đôn lên.\n" +
        "• <b>Chuyển nhượng</b>: mua, hỏi mượn, theo dõi <b>tin đồn</b> và các vụ “Here we go”.\n• <b>Tin tức</b>: drama, thay HLV, giải thưởng trên toàn thế giới.\n" +
        "• <b>Nhân sự</b>: trợ lý, HLV đội trẻ, HLV thể lực, tuyển trạch viên — cựu cầu thủ giải nghệ có thể xin vào làm.\n• Nhấn <b>Tiếp tục</b> để tới trận đấu tiếp theo.", "staff");
      EV.sponsorOffers(this);
      return s;
    },

    addManager(o, forceId) {
      const id = forceId || U.uid("m");
      const m = { id, name: o.name, nat: o.nat || "ENG", age: o.age || 50, phil: FC.PHILOSOPHIES[o.phil] ? o.phil : "pragmatic", rating: o.rating || 68, club: null, fam: 1, history: [], formerPlayer: !!o.formerPlayer };
      this.s.managers[id] = m;
      return m;
    },
    genManager(club) {
      const nat = FC.NAME_POOL[club.country] || "ENG";
      return this.addManager({ name: this.genName(nat), nat, age: U.randInt(38, 62), phil: U.pick(Object.keys(FC.PHILOSOPHIES)), rating: U.clamp(Math.round(club.rep - 6 + U.rand(-5, 5)), 50, 85) });
    },

    initStaff() {
      const s = this.s, u = this.user;
      const lvl = U.clamp(Math.round((u.rep - 50) / 3.5), 6, 16);
      const nat = FC.NAME_POOL[u.country] || "ENG";
      s.staff = {};
      for (const r of ["assistant", "youth", "fitness", "scout"]) s.staff[r] = { name: this.genName(nat), rating: U.clamp(lvl + U.randInt(-2, 2), 4, 18), formerPlayer: false, wage: 8 + lvl, since: s.season };
      s.boardMembers = [];
    },
    staffRating(role) { const x = this.s.staff[role]; return x ? x.rating : 6; },

    // Bổ sung cầu thủ (do game tạo) để đủ đội hình theo vị trí
    fillSquad(club, min) {
      const s = this.s;
      const ps = club.players.map((id) => s.players[id]).filter(Boolean);
      const count = {};
      for (const p of ps) count[p.pos] = (count[p.pos] || 0) + 1;
      count.LW = (count.LW || 0) + (count.LM || 0);
      count.RW = (count.RW || 0) + (count.RM || 0);
      const real = ps.filter((p) => !p.gen).sort((a, b) => b.ovr - a.ovr);
      const target = 22 + club.rep * 0.68;
      const base = real.length >= 11 ? Math.min(target, real.slice(0, 14).reduce((a, p) => a + p.ovr, 0) / Math.min(14, real.length) - 7) : target - 2;
      const floor = (FC.LEAGUES[club.league] || {}).floor || 55;
      const baseF = Math.max(base, floor);
      const needs = [];
      for (const [pos, n] of Object.entries(SQUAD_TEMPLATE)) for (let i = count[pos] || 0; i < n; i++) needs.push(pos);
      let guard = 0;
      while ((needs.length || club.players.length < min) && guard++ < 40) {
        const pos = needs.length ? needs.shift() : U.pick(["CB", "CM", "ST", "LB", "RB", "CAM"]);
        const age = U.randInt(18, 31);
        const ovr = Math.round(baseF + U.rand(-4, 2) - (age <= 20 ? 4 : 0));
        const p = this.genPlayer(club, pos, age, ovr);
        club.players.push(p.id);
      }
    },

    setClause(club) {
      if (club.country !== "ESP") return;
      for (const id of club.players) {
        const p = this.s.players[id];
        const mult = club.rep >= 92 ? 6 : club.rep >= 85 ? 4 : 3;
        p.clause = Math.round(Math.max(p.value * mult, 10));
        if (club.rep >= 92 && p.ovr >= 85) p.clause = 1000;
      }
    },

    bestFormation(club) {
      const squad = this.squad(club.id);
      let best = club.tactics.formation, bv = -1;
      for (const f of Object.keys(PL.FORMATIONS)) {
        const r = PL.autoLineup(squad, f);
        const slots = PL.FORMATIONS[f];
        let v = 0;
        r.lineup.forEach((id, i) => { if (id) v += PL.effective(this.s.players[id], slots[i][0], 100); });
        if (f === club.tactics.formation) v *= 1.006;
        if (v > bv) { bv = v; best = f; }
      }
      return best;
    },

    genName(nat) {
      const L = FC.NAMES[nat] || FC.NAMES.ENG;
      return U.pick(L.f) + " " + U.pick(L.l);
    },

    genPlayer(club, pos, age, ovr, pot) {
      const home = FC.NAME_POOL[club.country] || "ENG";
      const nat = Math.random() < 0.72 ? home : U.pick(Object.keys(FC.NAMES));
      const raw = [this.genName(nat), pos, age, U.clamp(ovr, 40, 86), nat, pot];
      const p = PL.makePlayer(raw, club.id, 0, club.rep);
      p.gen = true;
      p.peak = p.ovr;
      p.contract = U.randInt(1, 4);
      p.career.clubs = [club.id];
      const nums = new Set(club.players.map((id) => this.s.players[id] && this.s.players[id].num));
      let n = 30; while (nums.has(n)) n++;
      p.num = n;
      this.s.players[p.id] = p;
      return p;
    },

    get user() { return this.s.clubs[this.s.userClub]; },
    get userMgr() { return this.s.managers.user; },
    squad(clubId) { return this.s.clubs[clubId].players.map((id) => this.s.players[id]).filter((p) => p && !p.res); },
    reserves(clubId) { return this.s.clubs[clubId].players.map((id) => this.s.players[id]).filter((p) => p && p.res); },
    loanedOut(clubId) { return Object.values(this.s.players).filter((p) => p.loan && p.loan.from === clubId); },
    wageBill(clubId) { return TR.wagePaid(this.s, clubId); },

    resetFinance() {
      const u = this.user;
      this.s.finance = {
        season: { income: { tickets: 0, tv: 0, commercial: 0, prize: 0, transfers: 0 }, expense: { wages: 0, transfers: 0, staff: 0, facilities: 0, other: 0 } },
        weekly: [], history: (this.s.finance && this.s.finance.history) || [],
      };
      const bill = this.wageBill(u.id);
      u.wageBudget = Math.round(Math.max(bill * 1.08, bill + 40));
    },

    // ================= BAN LÃNH ĐẠO =================
    strengthRank(lid) {
      const clubs = Object.values(this.s.clubs).filter((c) => c.league === lid);
      return clubs.map((c) => ({ id: c.id, v: TR.avgTop(this.s, c, 16) + c.rep * 0.08 })).sort((a, b) => b.v - a.v).map((x) => x.id);
    },
    setBoardTargets(initial) {
      const s = this.s, u = this.user;
      const L = FC.LEAGUES[u.league];
      const ranks = this.strengthRank(u.league);
      const n = ranks.length;
      const rank = ranks.indexOf(u.id) + 1;
      let target, text;
      if (L.tier === 2) {
        if (rank <= 3) { target = 2; text = `Giành vé lên hạng trực tiếp (Top 2 ${L.name})`; }
        else if (rank <= 8) { target = 6; text = "Lọt vào nhóm đá play-off (Top 6)"; }
        else { target = Math.round(n * 0.6); text = "Trụ vững ở nửa trên/giữa bảng"; }
      } else {
        const rel = L.relegate || 0;
        const cont = FC.CONTINENTAL.ucl.slots[u.league] || FC.CONTINENTAL.lib.slots[u.league] || 0;
        if (rank <= 1) { target = 1; text = `Vô địch ${L.name}`; }
        else if (rank <= 3 && u.rep >= 88) { target = 2; text = `Cạnh tranh chức vô địch ${L.name} (Top 2)`; }
        else if (cont && rank <= cont) { target = cont; text = `Giành vé dự cúp châu lục (Top ${cont})`; }
        else if (rank <= Math.ceil(n * 0.35)) { target = Math.ceil(n * 0.35); text = `Cạnh tranh nhóm đầu (Top ${Math.ceil(n * 0.35)})`; }
        else if (rank <= Math.ceil(n * 0.6)) { target = Math.ceil(n / 2); text = "Kết thúc ở nửa trên bảng xếp hạng"; }
        else if (rel) { target = n - rel - (L.barrage ? 1 : 0); text = "Trụ hạng an toàn"; }
        else { target = n - 2; text = "Tránh nhóm cuối bảng"; }
      }
      Object.assign(s.board, { target, targetText: text, expectedRank: rank });
      if (initial) s.board.confidence = 65;
    },
    changeConfidence(d) {
      const b = this.s.board;
      if (d < 0) d *= Math.pow(0.85, Math.min(2, this.s.boardMembers.length));
      b.confidence = U.clamp(b.confidence + d, 0, 100);
    },

    mail(from, subject, body, type = "info", actions = null) {
      const m = { id: U.uid("m"), date: this.s.date, from, subject, body, type, read: false, actions };
      this.s.inbox.unshift(m);
      if (this.s.inbox.length > 150) this.s.inbox.length = 150;
      return m;
    },
    unread() { return this.s.inbox.filter((m) => !m.read).length; },

    // ================= ĐỘI HÌNH =================
    autoPick(club) {
      const r = PL.autoLineup(this.squad(club.id), club.tactics.formation);
      club.tactics.lineup = r.lineup;
      club.tactics.bench = r.bench;
    },
    validateLineup(club) {
      const t = club.tactics;
      const slots = PL.FORMATIONS[t.formation];
      const squad = this.squad(club.id);
      const ok = (id) => id && club.players.includes(id) && this.s.players[id] && !this.s.players[id].res && PL.available(this.s.players[id]);
      let lineup = (t.lineup || []).slice(0, slots.length);
      while (lineup.length < slots.length) lineup.push(null);
      const used = new Set();
      lineup = lineup.map((id) => { if (ok(id) && !used.has(id)) { used.add(id); return id; } return null; });
      lineup = lineup.map((id, i) => {
        if (id) return id;
        let best = null, bv = -1;
        for (const p of squad) {
          if (used.has(p.id) || !PL.available(p)) continue;
          const v = PL.effective(p, slots[i][0]);
          if (v > bv) { bv = v; best = p; }
        }
        if (best) used.add(best.id);
        return best ? best.id : null;
      });
      let bench = (t.bench || []).filter((id) => ok(id) && !used.has(id));
      const rest = squad.filter((p) => !used.has(p.id) && !bench.includes(p.id) && PL.available(p)).sort((a, b) => b.ovr - a.ovr);
      if (!bench.some((id) => this.s.players[id].pos === "GK")) { const gk = rest.find((p) => p.pos === "GK"); if (gk) bench.unshift(gk.id); }
      for (const p of rest) { if (bench.length >= 9) break; if (!bench.includes(p.id)) bench.push(p.id); }
      return { lineup, bench: bench.slice(0, 9) };
    },
    lineupIssues(club) {
      const issues = [];
      (club.tactics.lineup || []).forEach((id) => {
        if (!id) return;
        const p = this.s.players[id];
        if (!p || p.clubId !== club.id) issues.push("Cầu thủ không còn thuộc CLB");
        else if (p.res) issues.push(`${p.name} đang ở đội trẻ`);
        else if (p.injury > 0) issues.push(`${p.name} vắng mặt (${p.injuryName || "chấn thương"})`);
        else if (p.suspended > 0) issues.push(`${p.name} bị treo giò`);
        else if (p.fitness < 60) issues.push(`${p.name} thể lực thấp (${Math.round(p.fitness)}%)`);
      });
      if (!club.tactics.lineup || club.tactics.lineup.filter(Boolean).length < 11) issues.push("Đội hình xuất phát chưa đủ 11 người");
      return issues;
    },
    setReserve(pid, res) {
      const p = this.s.players[pid];
      p.res = res;
      const t = this.user.tactics;
      if (res) {
        if (t.lineup) t.lineup = t.lineup.map((x) => (x === pid ? null : x));
        if (t.bench) t.bench = t.bench.filter((x) => x !== pid);
        if (p.age >= 24 && p.pers !== "pro") p.morale = U.clamp(p.morale - 12, 0, 100);
      } else p.morale = U.clamp(p.morale + 6, 0, 100);
    },
    setPhilosophy(key) {
      const m = this.userMgr;
      if (m.phil === key) return;
      m.phil = key;
      m.fam = 0.3;
    },

    // ================= TIẾN TRÌNH =================
    currentEvent() { return this.s.calendar[this.s.calIdx] || null; },
    userFixtureIn(ev) {
      if (!ev) return null;
      for (const id of ev.fixtures) {
        const f = this.s.fixtures[id];
        if (f.home === this.s.userClub || f.away === this.s.userClub) return f;
      }
      return null;
    },
    nextUserFixture() {
      for (let i = this.s.calIdx; i < this.s.calendar.length; i++) {
        const f = this.userFixtureIn(this.s.calendar[i]);
        if (f && !f.result) return f;
      }
      return null;
    },
    userFixtures() {
      return Object.values(this.s.fixtures).filter((f) => f.home === this.s.userClub || f.away === this.s.userClub).sort((a, b) => (a.date < b.date ? -1 : 1));
    },

    // "Tiếp tục": chạy tới trận đấu kế tiếp của người chơi (hoặc sự kiện cần quyết định)
    advance() {
      const s = this.s;
      let processed = 0;
      for (let guard = 0; guard < 600; guard++) {
        if (s.careerOver) return { type: "careerOver" };
        if (s.sacked) return { type: "sacked" };
        if (s.seasonEnded) return { type: "seasonEnd" };
        if (s.pendingEvents.length) return { type: "event" };
        const ev = this.currentEvent();
        if (!ev) { this.endSeason(); return { type: "seasonEnd" }; }
        if (s.date < ev.date) {
          this.passDays(ev.date);
          if (s.sacked) return { type: "sacked" };
          if (s.pendingEvents.length) return { type: "event" };
        }
        const uf = this.userFixtureIn(ev);
        for (const id of ev.fixtures) {
          const f = s.fixtures[id];
          if (f.result || f === uf) continue;
          this.simFixture(f);
        }
        if (uf && !uf.result) {
          if (s.pressDone !== uf.id) {
            s.pressDone = uf.id;
            if (U.chance(0.3)) { EV.pressConference(this, uf); return { type: "event" }; }
          }
          return { type: "match", fixture: uf, ev, processed };
        }
        const r = this.completeEvent(ev);
        processed++;
        if (r.type === "seasonEnd") return r;
      }
      return { type: "day", processed };
    },

    simFixture(f) {
      const sim = new FC.MatchSim(this.s, f, { quick: true, knockout: !!f.ko, neutral: !!f.neutral });
      sim.runToEnd();
      this.applyResult(f, sim.result);
      return sim.result;
    },

    createUserSim(f) {
      const s = this.s;
      const userSide = f.home === s.userClub ? 0 : 1;
      const tb = { att: 0, mid: 0, def: 0 };
      const fo = s.training.focus;
      if (fo === "attack") tb.att = 0.01;
      if (fo === "defense") tb.def = 0.01;
      if (fo === "tactical") tb.mid = 0.01;
      tb.mid += (this.staffRating("assistant") - 10) * 0.0008;
      const sim = new FC.MatchSim(s, f, { knockout: !!f.ko, neutral: !!f.neutral, userSide, autoSubUser: s.settings.autoSub, trainingBonus: tb });
      if (s.pressBoost) { sim.sides[userSide].boost += s.pressBoost; s.pressBoost = 0; }
      return sim;
    },

    finishUserMatch(f, sim) {
      this.applyResult(f, sim.result, sim);
      return this.completeEvent(this.currentEvent());
    },

    completeEvent(ev) {
      const s = this.s;
      ev.done = true;
      const info = CP.afterRound(s, ev);
      if (info.champion) {
        const w = s.clubs[info.champion];
        const compName = ev.comp === "league" ? FC.LEAGUES[ev.key].name : ev.comp === "cup" ? CP.cupName(ev.key) : FC.CONTINENTAL[ev.comp].name;
        if (info.champion === s.userClub) {
          s.manager.trophies.push({ season: this.seasonLabel(), name: compName, club: w.name });
          this.mail("Ban lãnh đạo", `🏆 VÔ ĐỊCH ${compName.toUpperCase()}!`, `Chúc mừng! ${w.name} đã giành ${compName} mùa ${this.seasonLabel()}. Ban lãnh đạo và CĐV vô cùng hạnh phúc.`, "trophy");
          this.changeConfidence(ev.comp === "ucl" || ev.comp === "lib" ? 25 : ev.comp === "league" ? 20 : 10);
          s.fans = U.clamp(s.fans + 15, 0, 100);
          this.payPrize(ev.comp === "ucl" ? 25 : ev.comp === "lib" ? 8 : ev.comp === "cup" ? 4 : 0);
        }
        const L = FC.LEAGUES[ev.key];
        if (ev.comp !== "league" || (L && L.tier === 1)) EV.news(this, "award", `🏆 ${w.name} vô địch ${compName} ${this.seasonLabel()}!`, { clubs: [w.id] });
      }
      if (info.poWinner) EV.news(this, "award", `⬆️ ${s.clubs[info.poWinner].name} thắng play-off và giành vé lên ${FC.LEAGUES[FC.LEAGUES[ev.key].up].name}!`);
      if (info.barWinner) EV.news(this, "award", `${s.clubs[info.barWinner].name} thắng trận play-off trụ hạng ${FC.LEAGUES[ev.key].name}.`);
      if (info.drawn) {
        const nf = info.drawn.fixtures.map((id) => s.fixtures[id]).find((f) => f.home === s.userClub || f.away === s.userClub);
        if (nf) {
          const opp = s.clubs[nf.home === s.userClub ? nf.away : nf.home];
          this.mail("Bốc thăm", `${CP.compName(nf)}: ${info.drawn.label}`, `Kết quả bốc thăm ${info.drawn.label}: ${s.clubs[nf.home].name} vs ${s.clubs[nf.away].name} (${U.fmtDate(nf.date)}). Đối thủ: <b>${opp.name}</b>.`, "news");
        }
      }
      s.calIdx++;
      if (s.calIdx >= s.calendar.length) { this.endSeason(); return { type: "seasonEnd", ev }; }
      return { type: "day", ev };
    },

    payPrize(m) {
      this.user.money += m;
      this.s.finance.season.income.prize += m;
    },

    applyResult(f, res, sim) {
      const s = this.s;
      s._ver = (s._ver || 0) + 1;
      const isUser = f.home === s.userClub || f.away === s.userClub;
      f.result = {
        hg: res.hg, ag: res.ag, pens: res.pens, winner: res.winner, motm: res.motm,
        goals: res.goals.map((g) => g.map((x) => ({ pid: x.pid, a: x.assist, min: x.min, pen: x.pen }))),
      };
      if (isUser || f.comp !== "league" || FC.LEAGUES[f.key].tier === 1) f.result.stats = res.stats;
      if (isUser) {
        f.result.cards = res.cards;
        f.result.ratings = Object.fromEntries(Object.entries(res.ratings).map(([k, v]) => [k, v.r]));
        if (sim) f.result.log = sim.events.filter((e) => ["goal", "red", "yellow", "sub", "injury", "penmiss"].includes(e.type)).map((e) => ({ m: e.minLabel, t: e.type, s: e.side, text: e.text }));
      }
      for (const [pid, r] of Object.entries(res.ratings)) {
        const p = s.players[pid];
        if (!p) continue;
        const st = p.stats;
        st.apps++;
        if (!r.starter) st.sub++;
        st.mins += r.mins;
        st.ratingSum += r.r;
        st.rated++;
        p.career.apps++;
        p.form = Math.round((p.form * 0.7 + r.r * 0.3) * 100) / 100;
        const ga = r.side === 0 ? res.ag : res.hg;
        if (ga === 0 && r.mins >= 60 && ["GK", "CB", "LB", "RB"].includes(p.pos)) st.cs++;
        const fit = res.fit[r.side][pid];
        p.fitness = U.clamp((fit != null ? fit : p.fitness) - 4, 20, 100);
        const won = res.winner === r.side, lost = res.winner === 1 - r.side;
        p.morale = U.clamp(p.morale + (won ? 2 : lost ? -2.5 : 0) + (r.r >= 7.5 ? 1.5 : r.r < 5.8 ? -1.5 : 0), 5, 100);
        if (pid === res.motm) st.motm++;
      }
      res.goals.forEach((gs) => gs.forEach((g) => {
        const p = s.players[g.pid];
        if (p) { p.stats.goals++; p.career.goals++; }
        if (g.assist && s.players[g.assist]) { s.players[g.assist].stats.assists++; s.players[g.assist].career.assists++; }
      }));
      for (const cid of [f.home, f.away]) for (const pid of s.clubs[cid].players) { const p = s.players[pid]; if (p.suspended > 0 && !res.ratings[pid]) p.suspended--; }
      res.cards.forEach((c) => {
        const p = s.players[c.pid];
        if (!p || c.type !== "yellow") return;
        p.stats.yc++;
        if (f.comp === "league") {
          p.yellows++;
          if (p.yellows >= 5) { p.suspended += 1; p.yellows = 0; if (p.clubId === s.userClub) this.mail("Trợ lý HLV", `${p.name} bị treo giò`, `${p.name} đã nhận 5 thẻ vàng và sẽ vắng mặt ở trận tiếp theo.`, "staff"); }
        }
      });
      res.sentOff.forEach((list) => list.forEach((pid) => {
        const p = s.players[pid];
        if (!p) return;
        p.stats.rc++;
        const second = res.cards.some((c) => c.pid === pid && c.type === "yellow");
        p.suspended += second ? 1 : U.randInt(2, 3);
        if (p.clubId === s.userClub) this.mail("Trợ lý HLV", `${p.name} bị treo giò`, `Sau chiếc thẻ đỏ, ${p.name} bị cấm thi đấu ${p.suspended} trận.`, "staff");
      }));
      const fitCoach = this.staffRating("fitness");
      res.injuries.forEach((list) => list.forEach((inj) => {
        const p = s.players[inj.pid];
        if (!p) return;
        let days = inj.days;
        if (p.clubId === s.userClub) days = Math.max(1, Math.round(days * (1.1 - fitCoach / 50)));
        p.injury = Math.max(p.injury, days);
        p.injuryName = inj.name;
        if (p.clubId === s.userClub) this.mail("Bác sĩ đội", `Chấn thương: ${p.name}`, `${p.name} gặp chấn thương <b>${inj.name}</b>, dự kiến nghỉ khoảng <b>${Math.ceil(days / 7)} tuần</b>.`, "medical");
      }));

      if (isUser) {
        const side = f.home === s.userClub ? 0 : 1;
        const fin = s.finance.season;
        const u = this.user;
        const L = FC.LEAGUES[u.league];
        if (side === 0 && !f.neutral) {
          const att = this.attendance();
          const t = ((att * s.ticketPrice) / 1e6) * (f.comp === "league" ? 1 : 1.2) * (L.tier === 2 ? 0.7 : 1);
          fin.income.tickets += t;
          u.money += t;
          f.result.attendance = att;
        }
        let tv = f.comp === "league" ? L.tv : f.comp === "ucl" ? 3.5 : f.comp === "lib" ? 0.8 : 0.3;
        if ((f.comp === "ucl" || f.comp === "lib") && res.winner === side) tv += f.comp === "ucl" ? 2.1 : 0.5;
        fin.income.tv += tv;
        u.money += tv;
        const m = s.manager;
        m.games++;
        const won = res.winner === side, lost = res.winner === 1 - side;
        if (won) m.w++; else if (lost) m.l++; else m.d++;
        s.fans = U.clamp(s.fans + (won ? 1.5 : lost ? -2 : 0), 0, 100);
        if (f.comp === "league") {
          const ranks = this.strengthRank(u.league);
          const oppRank = ranks.indexOf(side === 0 ? f.away : f.home) + 1;
          const fav = oppRank > (s.board.expectedRank || 10);
          if (!won && !lost) this.changeConfidence(fav ? -1 : 1);
          else if (won) this.changeConfidence(fav ? 2 : 4);
          else this.changeConfidence(fav ? (s.board.target <= 4 ? -4 : -3) : -1.5);
        } else if (f.ko && lost) this.changeConfidence(f.comp === "ucl" ? -3 : -2);
        const avg11 = TR.avgTop(s, u, 11);
        for (const pid of u.players) {
          const p = s.players[pid];
          if (!res.ratings[pid] && !p.res && p.ovr >= avg11 - 1 && PL.available(p)) p.morale = U.clamp(p.morale - (p.pers === "amb" ? 3 : 2), 5, 100);
        }
      }
    },

    attendance() {
      const u = this.user, s = this.s;
      const pos = CP.position(s, u.id);
      const n = CP.clubsOf(s, u.league).length;
      const formBoost = (n / 2 - pos) * 0.006;
      const fanF = (s.fans - 60) / 400;
      const tierF = FC.LEAGUES[u.league].tier === 2 ? -0.08 : 0;
      const demand = (0.55 + u.rep / 230 + formBoost + fanF + tierF) * Math.pow(60 / s.ticketPrice, 0.55);
      return Math.round(u.cap * U.clamp(demand, 0.3, 1));
    },

    passDays(toDate) {
      const s = this.s;
      const days = U.daysBetween(s.date, toDate);
      for (let d = 0; d < days; d++) {
        s.date = U.addDays(s.date, 1);
        this.dailyTick();
        if (U.toDate(s.date).getUTCDay() === 1) this.weeklyTick();
        if (s.sacked) return;
      }
    },

    dailyTick() {
      const s = this.s;
      const it = INTENSITY[s.training.intensity];
      const userRec = it.rec * (s.training.focus === "physical" ? 1.12 : 1) * (0.94 + 0.03 * this.user.facilities.training) * (0.92 + this.staffRating("fitness") / 125);
      for (const p of Object.values(s.players)) {
        if (!p.clubId) continue;
        const rec = p.clubId === s.userClub ? userRec : 1.05;
        if (p.fitness < 100) p.fitness = Math.min(100, p.fitness + 5 * rec * (p.age >= 32 ? 0.88 : 1));
        if (p.injury > 0) {
          p.injury--;
          if (p.injury === 0) {
            const nm = p.injuryName;
            p.injuryName = "";
            p.fitness = Math.min(p.fitness, 75);
            if (p.clubId === s.userClub && !/phép/.test(nm)) this.mail("Bác sĩ đội", `${p.name} đã bình phục`, `${p.name} đã khỏi chấn thương và sẵn sàng tập luyện trở lại.`, "medical");
          }
        }
      }
      if (s.breakDates && s.breakDates.includes(s.date)) EV.internationalBreak(this);
      const md = s.date.slice(5);
      if (md === "09-01" || md === "02-02") {
        EV.news(this, "transfer", "⏰ NGÀY CUỐI KỲ CHUYỂN NHƯỢNG! Các CLB chạy đua hoàn tất thương vụ trước khi cửa sổ đóng lại.");
        TR.aiTransfers(s, 6).forEach((d) => this.reportDeal(d));
      }
    },

    reportDeal(d) {
      const s = this.s;
      const p = s.players[d.pid];
      if (!p) return;
      if (p.ovr >= 76 || d.fee >= 20) EV.news(this, "transfer", `✍️ ${p.name} (${p.ovr}) chuyển từ ${d.from ? s.clubs[d.from].name : "tự do"} sang ${s.clubs[d.to].name} – ${d.fee ? U.money(d.fee) : "miễn phí"}.`, { pid: p.id, clubs: [d.from, d.to], big: p.ovr >= 82 });
    },

    weeklyTick() {
      const s = this.s;
      const u = this.user;
      const fin = s.finance.season;
      const loanOut = TR.loanOutMap(s);
      for (const c of Object.values(s.clubs)) {
        const wages = TR.wagePaid(s, c.id, loanOut) / 1000;
        if (c.id === u.id) {
          const staffW = Object.values(s.staff).reduce((a, x) => a + (x ? x.wage : 0), 0) / 1000;
          const staff = wages * 0.15 + staffW;
          const facilities = (u.facilities.training + u.facilities.youth) * 0.06;
          let commercial = 0.00005 * Math.pow(u.rep, 2.2) * (FC.LEAGUES[u.league].tier === 2 ? 0.6 : 1);
          if (s.sponsor) commercial += s.sponsor.perWeek;
          u.money += commercial - wages - staff - facilities;
          fin.income.commercial += commercial;
          fin.expense.wages += wages;
          fin.expense.staff += staff;
          fin.expense.facilities += facilities;
          s.finance.weekly.push({ date: s.date, bal: Math.round(u.money * 10) / 10 });
          if (s.finance.weekly.length > 60) s.finance.weekly.shift();
        } else {
          c.money += wages * 0.04 + 0.00002 * Math.pow(c.rep, 2.2);
        }
      }
      this.trainingWeek();
      for (const m of Object.values(s.managers)) {
        if (!m.club || m.fam >= 1) continue;
        const g = m.id === "user" ? 0.022 * (0.7 + this.staffRating("assistant") / 30) * (s.training.focus === "tactical" ? 1.3 : 1) : 0.03;
        m.fam = Math.min(1, m.fam + g);
      }
      for (const p of Object.values(s.players)) {
        if (!p.clubId) continue;
        p.morale += (70 - p.morale) * 0.1;
        if (p.res && p.clubId === s.userClub && p.age >= 23 && p.pers !== "pro") p.morale = Math.max(5, p.morale - 2.5);
      }
      if (TR.isWindowOpen(s.date)) {
        for (const o of TR.aiOffersForUser(s)) {
          const p = s.players[o.pid];
          const club = s.clubs[o.clubId];
          if (s.pendingOffers.some((x) => x.pid === o.pid && x.clubId === o.clubId)) continue;
          o.id = U.uid("o");
          s.pendingOffers.push(o);
          this.mail(club.name, `Đề nghị mua ${p.name}`, `${club.name} gửi lời đề nghị <b>${U.money(o.fee)}</b> cho ${p.name} (giá trị ${U.money(p.value)}).`, "offer",
            [{ label: "Chấp nhận", act: "acceptOffer", id: o.id }, { label: "Từ chối", act: "rejectOffer", id: o.id }]);
        }
        TR.aiTransfers(s, 6).forEach((d) => this.reportDeal(d));
        TR.aiLoans(s, 4);
      }
      if (!TR.isWindowOpen(s.date) && s.pendingOffers.length) {
        s.pendingOffers = [];
        s.inbox.forEach((m) => { if (m.actions && m.type === "offer") { m.actions = null; m.body += "\n<i>(Đề nghị đã hết hạn)</i>"; } });
      }
      EV.weeklyRumours(this);
      EV.resolveRumours(this);
      for (const c of Object.values(s.clubs)) {
        if (c.id === u.id || c.players.length >= 20 || !s.freeAgents.length) continue;
        const fa = s.freeAgents.map((id) => s.players[id]).filter((p) => p && p.ovr >= c.rep - 20 && p.ovr <= c.rep + 4 && p.age < 35).sort((a, b) => b.ovr - a.ovr)[0];
        if (fa) { TR.moveTo(s, fa, c.id, 0, TR.wageDemand(s, fa, c.id), U.randInt(1, 3)); this.reportDeal({ pid: fa.id, from: null, to: c.id, fee: 0 }); }
      }
      const day = U.toDate(s.date).getUTCDate();
      if (day <= 7) { this.monthlyReview(); EV.monthlyManagers(this); }
      if (u.money < -30) this.changeConfidence(-2);
      if (s.fans < 20) this.changeConfidence(-1);
      if (s.board.confidence <= 0 && !s.sacked) this.sack();
      if (s.date.slice(5, 7) === "03" && day <= 7 && !s.youthIntakeDone) { this.youthIntake(); s.youthIntakeDone = true; }
      if (s.date > `${s.season}-08-10`) EV.weeklyDrama(this);
    },

    monthlyReview() {
      const s = this.s;
      const u = this.user;
      const t = CP.leagueTable(s, u.league);
      const me = t.find((r) => r.id === u.id);
      if (!me || me.p < 6) return;
      const pos = t.indexOf(me) + 1;
      const diff = s.board.target - pos;
      this.changeConfidence(diff >= 0 ? Math.min(4, 1 + diff * 0.5) : Math.max(-8, diff * 1.2));
      if (s.board.confidence < 25) {
        this.mail("Ban lãnh đạo", "⚠️ Cảnh báo từ ban lãnh đạo", `Ban lãnh đạo không hài lòng với thành tích hiện tại (hạng ${pos}, mục tiêu: ${s.board.targetText}). Độ tín nhiệm: ${Math.round(s.board.confidence)}%. Cần cải thiện ngay lập tức.`, "board");
        EV.news(this, "manager", `Ghế nóng: tương lai của HLV ${s.manager.name} tại ${u.name} bị đặt dấu hỏi.`);
      }
    },

    sack() {
      const s = this.s;
      s.sacked = true;
      this.mail("Ban lãnh đạo", "Bạn đã bị sa thải", `Ban lãnh đạo ${this.user.name} quyết định chấm dứt hợp đồng với bạn do thành tích không đạt kỳ vọng.`, "board");
      EV.news(this, "manager", `🔥 ${this.user.name} sa thải HLV ${s.manager.name}.`);
    },

    jobOffers() {
      const s = this.s;
      const cur = this.user;
      const others = Object.values(s.clubs).filter((c) => c.id !== cur.id && FC.LEAGUES[c.league]);
      let cands = U.shuffle(others.filter((c) => c.rep <= cur.rep + 1 && c.rep >= cur.rep - 18));
      const low = others.slice().sort((a, b) => a.rep - b.rep);
      for (const c of low) { if (cands.length >= 3) break; if (!cands.includes(c)) cands.push(c); }
      return cands.slice(0, 3);
    },

    takeJob(clubId) {
      const s = this.s;
      const old = this.user;
      const um = this.userMgr;
      const replId = s.freeManagers.shift();
      const repl = replId ? s.managers[replId] : this.genManager(old);
      repl.club = old.id; repl.fam = 0.5; old.mgr = repl.id;
      const nc = s.clubs[clubId];
      const prev = s.managers[nc.mgr];
      if (prev) { prev.club = null; prev.history.push({ club: nc.id, until: s.date }); s.freeManagers.push(prev.id); }
      nc.mgr = "user"; um.club = clubId; um.fam = 0.4;
      s.userClub = clubId;
      s.sacked = false;
      s.manager.clubs.push(clubId);
      s.board.confidence = 55;
      this.setBoardTargets(false);
      s.pendingOffers = [];
      s.shortlist = [];
      s.youth = [];
      s.fans = 60;
      this.initStaff();
      this.autoPick(nc);
      this.resetFinance();
      this.mail("Ban lãnh đạo", `Chào mừng tới ${nc.name}`, `Bạn chính thức trở thành HLV trưởng của ${nc.name}. Mục tiêu: <b>${s.board.targetText}</b>.`, "board");
      EV.news(this, "manager", `🤝 ${nc.name} bổ nhiệm ${s.manager.name} làm HLV trưởng.`);
    },

    trainingWeek() {
      const s = this.s;
      const tr = s.training;
      const it = INTENSITY[tr.intensity];
      const ycoach = this.staffRating("youth");
      for (const p of Object.values(s.players)) {
        if (!p.clubId && !p.academy) continue;
        const isUser = p.clubId === s.userClub;
        const club = s.clubs[p.clubId];
        const fac = club ? 0.88 + 0.05 * club.facilities.training : 1;
        const a = p.age;
        let rate;
        if (a <= 19) rate = 0.13;
        else if (a <= 21) rate = 0.11;
        else if (a <= 23) rate = 0.075;
        else if (a <= 26) rate = 0.035;
        else if (a <= 29) rate = 0;
        else if (a <= 31) rate = -0.035;
        else if (a <= 33) rate = -0.07;
        else rate = -0.11;
        if (rate > 0) {
          if (p.ovr >= p.pot) rate = 0;
          else rate *= Math.min(1.3, 0.4 + (p.pot - p.ovr) / 12);
          let playF = p.stats.apps > 0 ? Math.min(1.25, 0.8 + (p.stats.mins / Math.max(1, p.stats.apps * 90)) * 0.45) : 0.75;
          if (p.res || p.academy) playF = a <= 21 ? 0.95 : 0.65;
          if (p.loan && p.stats.apps >= 3) playF *= 1.1;
          rate *= playF;
          if (isUser) {
            rate *= it.grow;
            if (tr.focus === "youth" && a <= 21) rate *= 1.35;
            if (p.res) rate *= 0.85 + ycoach / 40;
          }
          if (p.academy) rate *= 0.8 + ycoach / 40;
          rate *= fac;
        } else if (rate < 0 && isUser && tr.focus === "physical") rate *= 0.85;
        p.prog += rate;
        while (p.prog >= 1) {
          p.prog -= 1;
          PL.applyOvrDelta(p, 1);
          if (p.ovr > (p.peak || 0)) p.peak = p.ovr;
          if (isUser && p.ovr >= 70 && U.chance(0.35)) this.mail("Trợ lý HLV", `${p.name} tiến bộ`, `${p.name} đã cải thiện chỉ số lên <b>${p.ovr}</b>.`, "staff");
        }
        while (p.prog <= -1) { p.prog += 1; PL.applyOvrDelta(p, -1); }
        if (isUser && !p.res && PL.available(p) && U.chance(it.inj * (1.15 - this.staffRating("fitness") / 60))) {
          const inj = U.pick(FC.INJURIES.slice(0, 3));
          p.injury = U.randInt(inj[1], inj[2]);
          p.injuryName = inj[0] + " (tập luyện)";
          this.mail("Bác sĩ đội", `Chấn thương trên sân tập: ${p.name}`, `${p.name} dính <b>${inj[0]}</b> trong buổi tập, nghỉ khoảng ${Math.ceil(p.injury / 7)} tuần.`, "medical");
        }
        p.value = PL.calcValue(p);
      }
    },

    // Lứa trẻ hằng năm cho mọi CLB (lò đào tạo nổi tiếng cho chất lượng cao hơn)
    youthIntake() {
      const s = this.s;
      const posList = ["GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CM", "CAM", "LW", "RW", "ST", "ST"];
      for (const c of Object.values(s.clubs)) {
        const lvl = c.facilities.youth;
        const isUser = c.id === s.userClub;
        const coach = isUser ? this.staffRating("youth") : 10;
        const n = isUser ? U.randInt(3, 5) : U.randInt(1, 3);
        const names = [];
        for (let i = 0; i < n; i++) {
          const ovr = U.randInt(44, 52 + lvl * 2) + Math.round((coach - 10) / 4);
          const star = U.chance(isUser ? 0.015 + lvl * 0.012 + (coach - 10) * 0.003 : 0.003 + lvl * 0.004);
          const pot = U.clamp(Math.round(U.rand(56, 68 + lvl * 3) + (coach - 10) * 0.5 + (star ? U.rand(9, 15) : 0)), ovr + 8, 94);
          const p = this.genPlayer(c, U.pick(posList), U.randInt(15, 17), ovr, pot);
          p.academyOf = c.id;
          if (isUser) {
            p.academy = true; p.clubId = null; p.wage = 1; p.contract = 0; p.value = PL.calcValue(p);
            s.youth.push(p.id);
            names.push(`${p.name} (${p.pos}, ${p.age} tuổi, tiềm năng ~${Math.round(p.pot / 5) * 5})`);
            if (star) EV.push(this, { kind: "youthStar", pid: p.id, title: "🌟 Phát hiện thần đồng!", body: `${s.staff.youth ? s.staff.youth.name : "HLV đội trẻ"} báo cáo: ${p.name} (${p.age} tuổi, ${p.pos}) là tài năng hiếm có với tiềm năng khoảng ${Math.round(p.pot / 5) * 5}. Đôn thẳng lên đội một?`, options: ["Đôn lên đội một ngay", "Để tiếp tục ở học viện"] });
          } else if (pot >= 78 || c.players.length < 24) {
            c.players.push(p.id);
            if (pot >= 86) EV.news(this, "youth", `🌱 Lò ${c.name} sản sinh tài năng ${p.name} (${p.age} tuổi) được đánh giá rất cao.`, { pid: p.id });
          } else delete s.players[p.id];
        }
        if (isUser) this.mail("Giám đốc học viện", "Lứa cầu thủ trẻ mới", `Học viện vừa đôn lên ${n} tài năng trẻ:\n• ${names.join("\n• ")}\n\nVào mục <b>Học viện</b> để ký hợp đồng chuyên nghiệp hoặc giải phóng.`, "youth");
      }
    },

    promoteYouth(pid) {
      const s = this.s;
      const p = s.players[pid];
      const u = this.user;
      p.academy = false; p.clubId = u.id; p.contract = 3; p.res = false;
      p.wage = Math.max(3, Math.round(PL.baseWage(p.ovr, p.age) * 1.2));
      u.players.push(pid);
      s.youth = s.youth.filter((x) => x !== pid);
      p.joined = s.date;
    },
    releaseYouth(pid) {
      this.s.youth = this.s.youth.filter((x) => x !== pid);
      delete this.s.players[pid];
    },

    upgradeFacility(kind) {
      const u = this.user;
      if (u.facilities[kind] >= 5) return { ok: false, msg: "Đã đạt cấp tối đa." };
      const cost = this.facilityCost(kind);
      if (u.money < cost) return { ok: false, msg: `Không đủ tiền (cần ${U.money(cost)}).` };
      u.money -= cost;
      u.facilities[kind]++;
      this.s.finance.season.expense.facilities += cost;
      return { ok: true, msg: "Nâng cấp thành công!" };
    },
    facilityCost(kind) { return (this.user.facilities[kind] + 1) * 12; },
    expandStadium() {
      const u = this.user;
      if (u.money < 45) return { ok: false, msg: `Không đủ tiền (cần ${U.money(45)}).` };
      u.money -= 45; u.cap += 3000;
      this.s.finance.season.expense.facilities += 45;
      return { ok: true, msg: `Sân ${u.stadium} được mở rộng lên ${u.cap.toLocaleString("vi-VN")} chỗ.` };
    },

    // Nhân sự
    staffMarket() {
      const s = this.s;
      if (!s.staffMarket || s.staffMarket.season !== s.season) {
        const list = [];
        for (const role of ["assistant", "youth", "fitness", "scout"]) {
          for (let i = 0; i < 3; i++) {
            const r = U.randInt(6, 18);
            list.push({ id: U.uid("st"), role, name: this.genName(U.pick(Object.keys(FC.NAMES))), rating: r, wage: Math.round(6 + r * 1.8), formerPlayer: false });
          }
        }
        s.staffMarket = { season: s.season, list };
      }
      return s.staffMarket.list;
    },
    hireStaff(id) {
      const s = this.s;
      const c = s.staffMarket.list.find((x) => x.id === id);
      if (!c) return { ok: false, msg: "Ứng viên không còn." };
      const fee = c.rating * 0.15;
      if (this.user.money < fee) return { ok: false, msg: "Không đủ tiền." };
      this.user.money -= fee;
      const old = s.staff[c.role];
      s.staff[c.role] = { name: c.name, rating: c.rating, formerPlayer: c.formerPlayer, wage: c.wage, since: s.season };
      s.staffMarket.list = s.staffMarket.list.filter((x) => x.id !== id);
      return { ok: true, msg: `${c.name} trở thành ${EV.STAFF_ROLES[c.role].name}${old ? ` thay ${old.name}` : ""}.` };
    },
    fireStaff(role) {
      const s = this.s;
      const x = s.staff[role];
      if (!x) return;
      this.user.money -= (x.wage * 26) / 1000;
      s.staff[role] = null;
    },

    acceptOffer(offerId) {
      const s = this.s;
      const o = s.pendingOffers.find((x) => x.id === offerId);
      if (!o) return { ok: false, msg: "Đề nghị không còn hiệu lực." };
      const p = s.players[o.pid];
      if (p.clubId !== s.userClub) return { ok: false, msg: "Cầu thủ không còn thuộc CLB." };
      if (this.squad(s.userClub).length <= 16) return { ok: false, msg: "Đội hình quá mỏng để bán thêm (tối thiểu 16)." };
      TR.moveTo(s, p, o.clubId, o.fee, TR.wageDemand(s, p, o.clubId), U.randInt(2, 5));
      s.pendingOffers = s.pendingOffers.filter((x) => x.pid !== o.pid);
      this.clearOfferMails();
      if (p.ovr >= 80) s.fans = U.clamp(s.fans - 4, 0, 100);
      EV.news(this, "transfer", `✍️ ${this.user.name} bán ${p.name} cho ${s.clubs[o.clubId].name} với giá ${U.money(o.fee)}.`, { pid: p.id });
      return { ok: true, msg: `Đã bán ${p.name} cho ${s.clubs[o.clubId].name} với giá ${U.money(o.fee)}.` };
    },
    rejectOffer(offerId) {
      const s = this.s;
      const o = s.pendingOffers.find((x) => x.id === offerId);
      s.pendingOffers = s.pendingOffers.filter((x) => x.id !== offerId);
      if (o) { const p = s.players[o.pid]; if (p && !p.listed && o.fee > p.value * 1.3) p.morale = U.clamp(p.morale - (p.pers === "amb" ? 12 : 6), 0, 100); }
      this.clearOfferMails();
      return { ok: true, msg: "Đã từ chối đề nghị." };
    },
    clearOfferMails() {
      const live = new Set(this.s.pendingOffers.map((o) => o.id));
      this.s.inbox.forEach((m) => { if (m.actions && m.type === "offer" && !m.actions.some((a) => live.has(a.id))) m.actions = null; });
    },

    signPlayer(pid, fee, wage, years) {
      const s = this.s;
      const p = s.players[pid];
      const u = this.user;
      const newBill = this.wageBill(u.id) + wage;
      if (newBill > u.wageBudget * 1.0001) return { ok: false, msg: `Vượt quỹ lương (${U.wage(newBill)} / ${U.wage(u.wageBudget)}). Hãy bán bớt hoặc giảm lương đề nghị.` };
      if (fee > u.transferBudget + 0.001) return { ok: false, msg: "Không đủ ngân sách chuyển nhượng." };
      const from = p.clubId ? s.clubs[p.clubId].name : "tự do";
      TR.moveTo(s, p, u.id, fee, wage, years);
      s.shortlist = s.shortlist.filter((x) => x !== pid);
      if (p.ovr >= 80) s.fans = U.clamp(s.fans + 5, 0, 100);
      this.mail("Giám đốc thể thao", `Hoàn tất chiêu mộ ${p.name}`, `${p.name} (${p.pos}, ${p.ovr}) đã gia nhập từ ${from}. Phí: ${fee ? U.money(fee) : "miễn phí"}, lương ${U.wage(wage)}, hợp đồng ${years} năm.`, "transfer");
      EV.news(this, "transfer", `✅ HERE WE GO! ${p.name} gia nhập ${u.name} từ ${from} (${fee ? U.money(fee) : "miễn phí"}).`, { pid: p.id, big: true });
      return { ok: true, msg: `Chào mừng ${p.name} tới ${u.name}!` };
    },

    loanOut(pid, opt) {
      const s = this.s;
      const p = s.players[pid];
      TR.startLoan(s, p, opt.clubId, opt.wagePct, opt.buyFee);
      this.mail("Giám đốc thể thao", `${p.name} được cho mượn`, `${p.name} gia nhập ${s.clubs[opt.clubId].name} theo dạng cho mượn đến hết mùa. ${s.clubs[opt.clubId].name} trả ${opt.wagePct}% lương${opt.buyFee ? `, kèm điều khoản mua đứt ${U.money(opt.buyFee)}` : ""}.`, "transfer");
    },

    renewContract(pid, wage, years) {
      const s = this.s;
      const p = s.players[pid];
      const u = this.user;
      const demand = TR.wageDemand(s, p, u.id);
      if (this.wageBill(u.id) - p.wage + wage > u.wageBudget * 1.0001) return { ok: false, msg: "Vượt quỹ lương cho phép." };
      if (p.age >= 32 && years > 2) return { ok: false, msg: `${p.name} chỉ được đề nghị tối đa 2 năm do tuổi tác.`, demand };
      if (p.morale < 30 && U.chance(0.5)) return { ok: false, msg: `${p.name} không vui và từ chối đàm phán lúc này.`, demand };
      if (wage < demand * 0.95) return { ok: false, msg: `${p.name} muốn mức lương ít nhất ${U.wage(demand)}.`, demand };
      p.wage = wage; p.contract = years;
      p.morale = U.clamp(p.morale + 8, 0, 100);
      if (u.country === "ESP") p.clause = Math.round(Math.max(p.value * 4, 10));
      return { ok: true, msg: `${p.name} gia hạn ${years} năm với lương ${U.wage(wage)}.` };
    },

    // ================= KẾT THÚC MÙA =================
    endSeason() {
      const s = this.s;
      if (s.seasonEnded) return;
      s.seasonEnded = true;
      const u = this.user;
      const L = FC.LEAGUES[u.league];
      const table = CP.leagueTable(s, u.league);
      const pos = table.findIndex((r) => r.id === u.id) + 1;
      for (const lid of Object.keys(FC.LEAGUES)) {
        const t = CP.leagueTable(s, lid);
        const P = FC.LEAGUES[lid].prize;
        t.forEach((r, i) => {
          const prize = Math.round(P * (1 - (i / t.length) * 0.8) * 10) / 10;
          s.clubs[r.id].money += prize;
          s.clubs[r.id].transferBudget += prize * 0.4;
          if (r.id === u.id) s.finance.season.income.prize += prize;
        });
      }
      if (table[0].id === u.id && !s.manager.trophies.some((t) => t.season === this.seasonLabel() && t.name === L.name)) s.manager.trophies.push({ season: this.seasonLabel(), name: L.name, club: u.name });
      const moves = this.computeMoves();
      s.pendingMoves = moves;
      s.qualified = {};
      for (const C of Object.values(FC.CONTINENTAL)) for (const lid of Object.keys(C.slots)) s.qualified[lid] = CP.leagueTable(s, lid).map((r) => r.id);
      const award = EV.seasonAwards(this);
      const fin = s.finance.season;
      const income = Object.values(fin.income).reduce((a, b) => a + b, 0);
      const expense = Object.values(fin.expense).reduce((a, b) => a + b, 0);
      const met = pos <= s.board.target;
      const myMove = moves.find((m) => m.club === u.id);
      if (myMove && myMove.dir === "up") { s.manager.promotions++; s.manager.trophies.push({ season: this.seasonLabel(), name: `Lên hạng ${FC.LEAGUES[myMove.to].name}`, club: u.name }); }
      const pl = Object.values(s.players).filter((p) => p.clubId && s.clubs[p.clubId].league === u.league);
      const top = pl.slice().sort((a, b) => b.stats.goals - a.stats.goals)[0];
      const potm = pl.filter((p) => p.stats.apps >= 15).sort((a, b) => PL.avgRating(b) - PL.avgRating(a))[0];
      const summary = {
        season: this.seasonLabel(), league: u.league, pos, champion: table[0].id, club: u.id, target: s.board.target, targetText: s.board.targetText, met,
        move: myMove ? myMove.dir : null,
        cupRun: s.cups[u.country] ? (s.cups[u.country].winner === u.id ? "Vô địch" : s.cups[u.country].out[u.id] || "—") : "—",
        contRun: Object.entries(s.cont).map(([k, c]) => (c.teams.includes(u.id) ? `${FC.CONTINENTAL[k].short}: ${c.winner === u.id ? "Vô địch" : c.out[u.id] || "—"}` : null)).filter(Boolean).join(", ") || "Không tham dự",
        cupWinner: s.cups[u.country] ? s.cups[u.country].winner : null, uclWinner: s.cont.ucl ? s.cont.ucl.winner : null, libWinner: s.cont.lib ? s.cont.lib.winner : null,
        topScorer: top ? { name: top.name, club: top.clubId, goals: top.stats.goals } : null,
        potm: potm ? { name: potm.name, club: potm.clubId, r: PL.avgRating(potm).toFixed(2) } : null,
        ballon: award.ballon[0] || null, golden: award.golden,
        moves, income, expense,
      };
      s.history.push(summary);
      s.finance.history.push({ season: this.seasonLabel(), income, expense });
      let d = met ? 15 : -Math.min(40, (pos - s.board.target) * 6);
      if (myMove && myMove.dir === "down") d -= 25;
      if (myMove && myMove.dir === "up") d += 20;
      this.changeConfidence(d);
      s.lastSummary = summary;
      if (this.seasonNo() >= MAX_SEASONS) { s.careerOver = true; return; }
      if (s.board.confidence <= 0) this.sack();
    },

    computeMoves() {
      const s = this.s;
      const moves = [];
      for (const [lid, L] of Object.entries(FC.LEAGUES)) {
        if (L.tier !== 1 || !L.down) continue;
        const t1 = CP.leagueTable(s, lid), t2 = CP.leagueTable(s, L.down);
        const T2 = FC.LEAGUES[L.down];
        const down = t1.slice(t1.length - L.relegate).map((r) => r.id);
        const eligible = t2.filter((r) => !/ B$/.test(s.clubs[r.id].name));
        const up = eligible.slice(0, T2.promote).map((r) => r.id);
        const po = s.calendar.find((x) => x.comp === "po" && x.key === L.down && x.round === "f");
        if (po && po.fixtures.length && s.fixtures[po.fixtures[0]].result) { const f = s.fixtures[po.fixtures[0]]; const w = f.result.winner === 0 ? f.home : f.away; if (!up.includes(w)) up.push(w); }
        const bar = s.calendar.find((x) => x.comp === "bar" && x.key === lid);
        if (bar && bar.fixtures.length && s.fixtures[bar.fixtures[0]].result) {
          const f = s.fixtures[bar.fixtures[0]];
          const w = f.result.winner === 0 ? f.home : f.away;
          const l = f.result.winner === 0 ? f.away : f.home;
          if (s.clubs[w].league === L.down) { up.push(w); down.push(l); }
        }
        // Cân bằng số đội (phòng khi đội B không được lên hạng)
        while (up.length < down.length) down.pop();
        while (down.length < up.length) up.pop();
        for (const id of down) moves.push({ club: id, from: lid, to: L.down, dir: "down" });
        for (const id of up) moves.push({ club: id, from: L.down, to: lid, dir: "up" });
      }
      return moves;
    },

    startNewSeason() {
      const s = this.s;
      for (const m of s.pendingMoves || []) {
        const c = s.clubs[m.club];
        c.league = m.to;
        c.rep = U.clamp(c.rep + (m.dir === "up" ? 3 : -3), 45, 99);
        c.transferBudget += m.dir === "up" ? 25 : -5;
        EV.news(this, m.dir === "up" ? "award" : "drama", `${m.dir === "up" ? "⬆️" : "⬇️"} ${c.name} ${m.dir === "up" ? "lên" : "xuống"} ${FC.LEAGUES[m.to].name}.`);
      }
      s.pendingMoves = null;
      for (const lid of Object.keys(FC.LEAGUES)) {
        const exp = this.strengthRank(lid);
        CP.leagueTable(s, lid).forEach((r, i) => {
          const c = s.clubs[r.id];
          if (c.league !== lid) return;
          const e = exp.indexOf(r.id);
          if (e < 0) return;
          c.rep = U.clamp(c.rep + Math.sign(e - i) * Math.min(2, Math.abs(e - i) / 3), 45, 99);
        });
      }
      for (const C of Object.values(s.cont)) if (C.winner) s.clubs[C.winner].rep = Math.min(99, s.clubs[C.winner].rep + 1);
      s.season++;
      // Kết thúc cho mượn
      for (const p of Object.values(s.players)) {
        if (!p.loan) continue;
        const buyer = s.clubs[p.clubId];
        if (p.loan.buyFee && buyer && buyer.id !== s.userClub && PL.avgRating(p) >= 6.9 && buyer.transferBudget >= p.loan.buyFee) {
          EV.news(this, "transfer", `${buyer.name} kích hoạt điều khoản mua đứt ${p.name} (${U.money(p.loan.buyFee)}).`, { pid: p.id });
          TR.buyLoanee(s, p);
        } else if (p.loan.buyFee && buyer && buyer.id === s.userClub && s.buyLoan && s.buyLoan[p.id] && buyer.transferBudget >= p.loan.buyFee) {
          TR.buyLoanee(s, p);
          this.mail("Giám đốc thể thao", `Mua đứt ${p.name}`, `CLB đã kích hoạt điều khoản mua đứt ${p.name}.`, "transfer");
        } else TR.endLoan(s, p);
      }
      s.buyLoan = {};
      const retired = [], leftUser = [];
      for (const p of Object.values(s.players)) {
        p.age++;
        if (p.academy) continue;
        if (p.age <= 23) p.pot = U.clamp(p.pot + U.randInt(-2, 1), p.ovr, 95);
        if (p.age >= 30) p.pot = p.ovr;
        p.career.seasons = (p.career.seasons || 0) + 1;
        p.stats = PL.newStats();
        p.yellows = 0; p.suspended = 0; p.fitness = 100; p.form = 6.6;
        const retireP = p.age >= 39 ? 0.9 : p.age >= 37 ? 0.55 : p.age >= 35 ? 0.3 : p.age >= 34 && p.ovr < 74 ? 0.2 : 0;
        if (U.chance(retireP)) { retired.push(p); continue; }
        if (p.clubId) {
          p.contract--;
          if (p.contract <= 0) {
            if (p.clubId === s.userClub) { leftUser.push(p.name); this.removeFromClub(p); s.freeAgents.push(p.id); }
            else if (U.chance(0.72)) { p.contract = U.randInt(1, 4); p.wage = Math.round(p.wage * U.rand(1, 1.2)); }
            else { this.removeFromClub(p); s.freeAgents.push(p.id); }
          }
        }
        p.value = PL.calcValue(p);
      }
      for (const p of retired) {
        if (p.peak >= 84 || (p.career.clubs || []).includes(s.userClub)) EV.news(this, "drama", `👋 ${p.name} (${p.age} tuổi) tuyên bố giải nghệ.`, { pid: p.id });
        if (p.clubId) this.removeFromClub(p);
        s.freeAgents = s.freeAgents.filter((x) => x !== p.id);
        s.shortlist = s.shortlist.filter((x) => x !== p.id);
      }
      EV.retirementOffers(this, retired);
      for (const p of retired) delete s.players[p.id];
      s.freeAgents = s.freeAgents.filter((id) => {
        const p = s.players[id];
        if (!p) return false;
        if (p.age >= 34 || p.ovr < 58) { delete s.players[id]; return false; }
        return true;
      });
      if (leftUser.length) this.mail("Giám đốc thể thao", "Cầu thủ hết hợp đồng", `Các cầu thủ sau đã rời CLB theo dạng tự do: ${leftUser.join(", ")}.`, "transfer");
      for (const m of Object.values(s.managers)) { if (m.id !== "user") m.age++; if (!m.club && m.age >= 72) s.freeManagers = s.freeManagers.filter((x) => x !== m.id); }
      for (const c of Object.values(s.clubs)) {
        if (c.id === s.userClub) continue;
        c.transferBudget = Math.max(c.transferBudget, 5 + (c.rep - 50) * 2.5);
        this.fillSquad(c, 22);
        c.tactics.formation = this.bestFormation(c);
        c.tactics.lineup = null;
      }
      const u = this.user;
      if (this.squad(u.id).length < 16) {
        const before = this.squad(u.id).length;
        this.fillSquad(u, u.players.length + (16 - before));
        this.mail("Giám đốc thể thao", "Bổ sung nhân sự khẩn cấp", `Đội một chỉ còn ${before} cầu thủ nên CLB đã bổ sung cầu thủ trẻ. Hãy tăng cường lực lượng trên thị trường chuyển nhượng!`, "transfer");
      }
      const last = s.lastSummary;
      const bonus = last && last.met ? 1.25 : 0.9;
      const tierF = FC.LEAGUES[u.league].tier === 2 ? 0.4 : 1;
      u.transferBudget = Math.max(5, Math.round((Math.max(0, u.transferBudget) * 0.5 + (10 + (u.rep - 55) * 3) * bonus * tierF) * 10) / 10);
      s.seasonEnded = false;
      s.youthIntakeDone = false;
      s.date = `${s.season}-07-01`;
      s.pendingOffers = [];
      s.staffMarket = null;
      CP.buildSeason(s, s.season);
      this.resetFinance();
      this.setBoardTargets(false);
      this.autoPickIfBroken(u);
      if (!s.sponsor || s.sponsor.until < s.season) { s.sponsor = null; EV.sponsorOffers(this); }
      this.mail("Ban lãnh đạo", `Mùa giải ${this.seasonLabel()} bắt đầu (mùa ${this.seasonNo()}/${MAX_SEASONS})`,
        `Giải đấu: <b>${FC.LEAGUES[u.league].name}</b>.\nMục tiêu mùa mới: <b>${s.board.targetText}</b>.\nNgân sách chuyển nhượng: <b>${U.money(u.transferBudget)}</b>.\nQuỹ lương: <b>${U.wage(u.wageBudget)}</b>.\nĐộ tín nhiệm hiện tại: ${Math.round(s.board.confidence)}%.`, "board");
    },

    autoPickIfBroken(club) {
      const v = this.validateLineup(club);
      club.tactics.lineup = v.lineup;
      club.tactics.bench = v.bench;
    },

    removeFromClub(p) {
      const c = this.s.clubs[p.clubId];
      if (c) {
        c.players = c.players.filter((x) => x !== p.id);
        if (c.tactics.lineup) c.tactics.lineup = c.tactics.lineup.map((x) => (x === p.id ? null : x));
        if (c.tactics.bench) c.tactics.bench = c.tactics.bench.filter((x) => x !== p.id);
      }
      p.clubId = null;
      p.listed = false;
      p.res = false;
      p.loan = null;
    },

    legacy() {
      const m = this.s.manager;
      const pts = m.trophies.reduce((a, t) => a + (/C1|Libertadores/.test(t.name) ? 30 : /Lên hạng/.test(t.name) ? 6 : /Cúp|Coupe|Copa|Pokal|Taça|Beker|King|Coppa/.test(t.name) ? 8 : 18), 0) + m.w * 0.5 - m.l * 0.2;
      const rank = pts >= 150 ? "Huyền thoại bất tử" : pts >= 90 ? "Huyền thoại" : pts >= 50 ? "HLV đẳng cấp thế giới" : pts >= 25 ? "HLV thành công" : pts >= 10 ? "HLV có tiếng" : "HLV vô danh";
      return { pts: Math.round(pts), rank };
    },

    // ================= LƯU / TẢI =================
    async save(slot = 1) {
      try {
        const meta = { club: this.s.userClub, name: this.user.name, manager: this.s.manager.name, date: this.s.date, season: this.seasonLabel(), saved: Date.now() };
        await FC.store.set("save_" + slot, JSON.stringify(this.s));
        localStorage.setItem("pitchboss27_meta_" + slot, JSON.stringify(meta));
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    async load(slot = 1) {
      const raw = await FC.store.get("save_" + slot);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (s.v !== 2) return false;
      this.s = s;
      return true;
    },
    saveMeta(slot) { try { return JSON.parse(localStorage.getItem("pitchboss27_meta_" + slot)); } catch (e) { return null; } },
    async deleteSave(slot) {
      await FC.store.del("save_" + slot);
      localStorage.removeItem("pitchboss27_meta_" + slot);
    },

    TRAINING_FOCUS, INTENSITY, START_YEAR, MAX_SEASONS,
  };

  FC.Game = Game;
})();
