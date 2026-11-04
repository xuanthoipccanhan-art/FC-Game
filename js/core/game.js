/* Trạng thái trò chơi & tiến trình sự nghiệp */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;
  const PL = FC.players;
  const TR = FC.transfers;
  const CP = FC.comp;

  const START_YEAR = 2026; // mùa 2026/27
  const DATA_YEAR = 2025; // tuổi trong dữ liệu tính tại năm này
  const SAVE_KEY = "pitchboss27_save_";

  const TRAINING_FOCUS = {
    balanced: { name: "Cân bằng", desc: "Phát triển đồng đều, không có điểm thưởng đặc biệt." },
    attack: { name: "Tấn công", desc: "+1% sức mạnh tấn công trong trận." },
    defense: { name: "Phòng ngự", desc: "+1% sức mạnh phòng ngự trong trận." },
    tactical: { name: "Chiến thuật", desc: "+1% kiểm soát tuyến giữa trong trận." },
    physical: { name: "Thể lực", desc: "Hồi phục thể lực nhanh hơn 12%." },
    youth: { name: "Phát triển trẻ", desc: "Cầu thủ ≤ 21 tuổi tiến bộ nhanh hơn 35%." },
  };
  const INTENSITY = [
    { name: "Nhẹ", grow: 0.75, rec: 1.15, inj: 0 },
    { name: "Vừa", grow: 1, rec: 1, inj: 0.0008 },
    { name: "Cao", grow: 1.3, rec: 0.85, inj: 0.0035 },
  ];

  const Game = {
    s: null, // trạng thái hiện tại

    seasonLabel(y) {
      y = y || this.s.season;
      return `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
    },

    allClubData() {
      return FC.DATA.ENG.map((c) => ({ ...c, league: "ENG", country: "ENG" })).concat(FC.DATA.EUR.map((c) => ({ ...c, league: "EUR" })));
    },

    newGame(managerName, clubId) {
      const s = {
        v: 1, manager: { name: managerName || "HLV", games: 0, w: 0, d: 0, l: 0, trophies: [], clubs: [clubId] },
        userClub: clubId, season: START_YEAR, date: `${START_YEAR}-07-01`,
        clubs: {}, players: {}, freeAgents: [], fixtures: {}, calendar: [], calIdx: 0,
        inbox: [], transferLog: [], shortlist: [], history: [], youth: [],
        training: { focus: "balanced", intensity: 1 },
        board: { confidence: 65, target: 10, targetText: "" },
        finance: null, ticketPrice: 60, pendingOffers: [], sacked: false, seasonEnded: false, lastWeek: null,
        settings: { speed: 2, autoSub: true },
      };
      this.s = s;
      for (const c of this.allClubData()) {
        const club = {
          id: c.id, name: c.name, short: c.short, city: c.city, founded: c.founded, stadium: c.stadium, cap: c.cap, colors: c.colors,
          crest: c.crest, rep: c.rep, league: c.league, country: c.country || "ENG",
          money: c.money * 2.2, transferBudget: c.money, players: [],
          tactics: { formation: c.formation, mentality: 0, pressing: 1, tempo: 1, lineup: null, bench: null },
          facilities: { training: c.rep >= 88 ? 5 : c.rep >= 80 ? 4 : c.rep >= 72 ? 3 : 2, youth: c.rep >= 88 ? 5 : c.rep >= 80 ? 4 : 3 },
        };
        s.clubs[c.id] = club;
        const ps = c.players.map((raw) => PL.makePlayer(raw, c.id, START_YEAR - DATA_YEAR, c.rep));
        PL.shirtNumbers(ps);
        for (const p of ps) { s.players[p.id] = p; club.players.push(p.id); }
      }
      // Thêm cầu thủ trẻ cho các CLB có đội hình mỏng, AI chọn sơ đồ hợp với đội hình
      for (const c of Object.values(s.clubs)) {
        this.fillSquad(c, 22);
        if (c.id !== clubId) c.tactics.formation = this.bestFormation(c);
      }
      const user = s.clubs[clubId];
      user.tactics.lineup = null;
      this.autoPick(user);
      CP.buildSeason(s, s.season);
      this.resetFinance();
      this.setBoardTargets(true);
      this.mail("Ban lãnh đạo", `Chào mừng HLV ${s.manager.name}!`,
        `Ban lãnh đạo ${user.name} chào mừng bạn đến với vai trò Huấn luyện viên trưởng mùa giải ${this.seasonLabel()}.\n\n` +
        `Mục tiêu mùa này: <b>${s.board.targetText}</b>.\nNgân sách chuyển nhượng: <b>${U.money(user.transferBudget)}</b>.\n` +
        `Quỹ lương tối đa: <b>${U.wage(user.wageBudget)}</b>.\n\nKỳ chuyển nhượng hè mở đến 01/09. Chúc bạn thành công!`, "board");
      this.mail("Trợ lý HLV", "Gợi ý bắt đầu",
        "• Vào <b>Chiến thuật</b> để chọn sơ đồ và đội hình xuất phát.\n• <b>Chuyển nhượng</b>: tìm kiếm, hỏi mua cầu thủ và rao bán.\n" +
        "• <b>Tập luyện</b>: đặt trọng tâm & cường độ — cường độ cao giúp tiến bộ nhanh nhưng dễ chấn thương.\n" +
        "• Nhấn <b>Tiếp tục</b> để tới sự kiện tiếp theo. Trò chơi tự lưu sau mỗi ngày thi đấu.", "staff");
      return s;
    },

    // Chọn sơ đồ phù hợp nhất với đội hình hiện có
    bestFormation(club, prefer) {
      const squad = this.squad(club.id);
      let best = prefer || club.tactics.formation, bv = -1;
      for (const f of Object.keys(PL.FORMATIONS)) {
        const r = PL.autoLineup(squad, f);
        const slots = PL.FORMATIONS[f];
        let v = 0;
        r.lineup.forEach((id, i) => { if (id) v += PL.effective(this.s.players[id], slots[i][0], 100); });
        if (f === club.tactics.formation) v *= 1.004;
        if (v > bv) { bv = v; best = f; }
      }
      return best;
    },

    fillSquad(club, min) {
      let guard = 0;
      while (club.players.length < min && guard++ < 20) {
        const need = TR.clubNeeds(this.s, club);
        const grp = need[0] || U.pick(["DEF", "MID", "ATT"]);
        const posMap = { GK: ["GK"], DEF: ["CB", "LB", "RB", "CB"], MID: ["CM", "CDM", "CAM", "LM", "RM"], ATT: ["ST", "LW", "RW"] };
        const p = this.genPlayer(club, U.pick(posMap[grp]), U.randInt(18, 23), Math.round(club.rep - 14 + U.rand(-4, 3)));
        club.players.push(p.id);
      }
    },

    genName(nat) {
      const L = FC.NAMES[nat] || FC.NAMES.ENG;
      return U.pick(L.f) + " " + U.pick(L.l);
    },

    genPlayer(club, pos, age, ovr, pot) {
      const nat = club.country && FC.NAMES[club.country] && Math.random() < 0.7 ? club.country : U.pick(Object.keys(FC.NAMES));
      let name = this.genName(nat);
      const raw = [name, pos, age, U.clamp(ovr, 40, 85), nat, pot];
      const p = PL.makePlayer(raw, club.id, 0, club.rep);
      p.contract = U.randInt(2, 4);
      const nums = new Set(club.players.map((id) => this.s.players[id] && this.s.players[id].num));
      let n = 30; while (nums.has(n)) n++;
      p.num = n;
      this.s.players[p.id] = p;
      return p;
    },

    get user() { return this.s.clubs[this.s.userClub]; },
    squad(clubId) { return this.s.clubs[clubId].players.map((id) => this.s.players[id]).filter(Boolean); },

    wageBill(clubId) {
      return this.squad(clubId).reduce((a, p) => a + p.wage, 0);
    },

    resetFinance() {
      const u = this.user;
      this.s.finance = {
        season: { income: { tickets: 0, tv: 0, commercial: 0, prize: 0, transfers: 0 }, expense: { wages: 0, transfers: 0, staff: 0, facilities: 0, other: 0 } },
        weekly: [], history: (this.s.finance && this.s.finance.history) || [],
      };
      u.wageBudget = Math.round(Math.max(this.wageBill(u.id) * 1.08, this.wageBill(u.id) + 60));
    },

    // ===== Ban lãnh đạo =====
    leagueRankByStrength() {
      const clubs = Object.values(this.s.clubs).filter((c) => c.league === "ENG");
      return clubs.map((c) => ({ id: c.id, v: TR.avgTop(this.s, c, 16) + c.rep * 0.08 })).sort((a, b) => b.v - a.v).map((x) => x.id);
    },
    setBoardTargets(initial) {
      const rank = this.leagueRankByStrength().indexOf(this.s.userClub) + 1;
      let target, text;
      if (rank <= 1) { target = 1; text = "Vô địch Ngoại hạng Anh"; }
      else if (rank <= 4) { target = 4; text = "Kết thúc trong Top 4 (dự Cúp C1)"; }
      else if (rank <= 7) { target = 7; text = "Cạnh tranh suất dự cúp châu Âu (Top 7)"; }
      else if (rank <= 12) { target = 10; text = "Kết thúc ở nửa trên bảng xếp hạng"; }
      else { target = 17; text = "Trụ hạng an toàn (ngoài nhóm 3 đội cuối)"; }
      Object.assign(this.s.board, { target, targetText: text, expectedRank: rank });
      if (initial) this.s.board.confidence = 65;
    },
    changeConfidence(d) {
      const b = this.s.board;
      b.confidence = U.clamp(b.confidence + d, 0, 100);
    },

    // ===== Hộp thư =====
    mail(from, subject, body, type = "info", actions = null) {
      const m = { id: U.uid("m"), date: this.s.date, from, subject, body, type, read: false, actions };
      this.s.inbox.unshift(m);
      if (this.s.inbox.length > 150) this.s.inbox.length = 150;
      return m;
    },
    unread() { return this.s.inbox.filter((m) => !m.read).length; },

    // ===== Đội hình =====
    autoPick(club) {
      const r = PL.autoLineup(this.squad(club.id), club.tactics.formation);
      club.tactics.lineup = r.lineup;
      club.tactics.bench = r.bench;
    },
    validateLineup(club) {
      const t = club.tactics;
      const slots = PL.FORMATIONS[t.formation];
      const squad = this.squad(club.id);
      const ok = (id) => id && club.players.includes(id) && PL.available(this.s.players[id]);
      let lineup = (t.lineup || []).slice(0, slots.length);
      while (lineup.length < slots.length) lineup.push(null);
      const used = new Set();
      lineup = lineup.map((id) => {
        if (ok(id) && !used.has(id)) { used.add(id); return id; }
        return null;
      });
      // Lấp chỗ trống
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
      if (!bench.some((id) => this.s.players[id].pos === "GK")) {
        const gk = rest.find((p) => p.pos === "GK");
        if (gk) bench.unshift(gk.id);
      }
      for (const p of rest) { if (bench.length >= 9) break; if (!bench.includes(p.id)) bench.push(p.id); }
      bench = bench.slice(0, 9);
      return { lineup, bench };
    },
    lineupIssues(club) {
      const t = club.tactics;
      const issues = [];
      (t.lineup || []).forEach((id) => {
        if (!id) return;
        const p = this.s.players[id];
        if (!p || p.clubId !== club.id) issues.push(`Cầu thủ không còn thuộc CLB`);
        else if (p.injury > 0) issues.push(`${p.name} đang chấn thương`);
        else if (p.suspended > 0) issues.push(`${p.name} bị treo giò`);
        else if (p.fitness < 60) issues.push(`${p.name} thể lực thấp (${Math.round(p.fitness)}%)`);
      });
      if (!t.lineup || t.lineup.filter(Boolean).length < 11) issues.push("Đội hình xuất phát chưa đủ 11 người");
      return issues;
    },

    // ===== Lịch & tiến trình =====
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

    // Bước "Tiếp tục": trả về {type:'match', fixture} | {type:'day', ev, summary} | {type:'seasonEnd'}
    advance() {
      const s = this.s;
      if (s.sacked) return { type: "sacked" };
      if (s.seasonEnded) return { type: "seasonEnd" };
      const ev = this.currentEvent();
      if (!ev) { this.endSeason(); return { type: "seasonEnd" }; }
      const uf = this.userFixtureIn(ev);
      if (s.date < ev.date) this.passDays(ev.date);
      if (s.sacked) return { type: "sacked" };
      // Mô phỏng các trận AI
      for (const id of ev.fixtures) {
        const f = s.fixtures[id];
        if (f.result || f === uf) continue;
        this.simFixture(f);
      }
      if (uf && !uf.result) return { type: "match", fixture: uf, ev };
      return this.completeEvent(ev);
    },

    simFixture(f) {
      const sim = new FC.MatchSim(this.s, f, { quick: true, knockout: !!f.ko, neutral: !!f.neutral });
      sim.runToEnd();
      this.applyResult(f, sim.result);
      return sim.result;
    },

    createUserSim(f) {
      const userSide = f.home === this.s.userClub ? 0 : 1;
      const tb = { att: 0, mid: 0, def: 0 };
      const fo = this.s.training.focus;
      if (fo === "attack") tb.att = 0.01;
      if (fo === "defense") tb.def = 0.01;
      if (fo === "tactical") tb.mid = 0.01;
      return new FC.MatchSim(this.s, f, { knockout: !!f.ko, neutral: !!f.neutral, userSide, autoSubUser: this.s.settings.autoSub, trainingBonus: tb });
    },

    finishUserMatch(f, sim) {
      this.applyResult(f, sim.result, sim);
      const ev = this.currentEvent();
      return this.completeEvent(ev);
    },

    completeEvent(ev) {
      const s = this.s;
      ev.done = true;
      let info = null;
      if (ev.comp === "cup") info = CP.afterCupRound(s, ev);
      if (ev.comp === "ucl") info = CP.afterUclRound(s, ev);
      if (info && info.winner) {
        const w = s.clubs[info.winner];
        const compName = CP.COMP[ev.comp].name;
        if (info.winner === s.userClub) {
          s.manager.trophies.push({ season: this.seasonLabel(), name: compName, club: w.name });
          this.mail("Ban lãnh đạo", `🏆 VÔ ĐỊCH ${compName.toUpperCase()}!`, `Chúc mừng! ${w.name} đã giành ${compName} mùa ${this.seasonLabel()}. Ban lãnh đạo vô cùng hài lòng.`, "trophy");
          this.changeConfidence(ev.comp === "ucl" ? 25 : 12);
          this.payPrize(ev.comp === "ucl" ? 25 : 4);
        } else {
          this.mail("Tin tức", `${w.name} vô địch ${compName}`, `${w.name} đã lên ngôi ${compName} mùa ${this.seasonLabel()}.`, "news");
        }
      }
      if (info && info.drawn) {
        const nf = this.nextUserFixture();
        const compEv = s.calendar.find((c) => c.comp === ev.comp && c.fixtures.some((id) => { const f = s.fixtures[id]; return !f.result && (f.home === s.userClub || f.away === s.userClub); }));
        if (compEv) {
          const f = s.fixtures[compEv.fixtures.find((id) => { const f = s.fixtures[id]; return f.home === s.userClub || f.away === s.userClub; })];
          const opp = s.clubs[f.home === s.userClub ? f.away : f.home];
          this.mail("Bốc thăm", `${CP.COMP[ev.comp].name}: ${info.drawn}`, `Kết quả bốc thăm ${info.drawn}: ${s.clubs[f.home].name} vs ${s.clubs[f.away].name} (${U.fmtDate(f.date)}). Đối thủ: <b>${opp.name}</b>.`, "news");
        }
        void nf;
      }
      s.calIdx++;
      if (s.calIdx >= s.calendar.length) {
        this.endSeason();
        return { type: "seasonEnd", ev };
      }
      return { type: "day", ev };
    },

    payPrize(m) {
      this.user.money += m;
      this.s.finance.season.income.prize += m;
    },

    // Áp dụng kết quả trận vào cầu thủ, tài chính...
    applyResult(f, res, sim) {
      const s = this.s;
      f.result = {
        hg: res.hg, ag: res.ag, pens: res.pens, winner: res.winner, stats: res.stats, motm: res.motm,
        goals: res.goals.map((g) => g.map((x) => ({ pid: x.pid, a: x.assist, min: x.minLabel || x.min, pen: x.pen }))),
        cards: res.cards,
      };
      const isUser = f.home === s.userClub || f.away === s.userClub;
      if (isUser) {
        f.result.ratings = Object.fromEntries(Object.entries(res.ratings).map(([k, v]) => [k, v.r]));
        if (sim) f.result.log = sim.events.filter((e) => ["goal", "red", "yellow", "sub", "injury", "penmiss"].includes(e.type)).map((e) => ({ m: e.minLabel, t: e.type, s: e.side, text: e.text }));
      }
      const sideClub = [f.home, f.away];
      // Thống kê cầu thủ
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
      // Treo giò: giảm cho cầu thủ không thi đấu
      for (const cid of sideClub) {
        for (const pid of s.clubs[cid].players) {
          const p = s.players[pid];
          if (p.suspended > 0 && !res.ratings[pid]) p.suspended--;
        }
      }
      res.cards.forEach((c) => {
        const p = s.players[c.pid];
        if (!p) return;
        if (c.type === "yellow") {
          p.stats.yc++;
          if (f.comp === "league") {
            p.yellows++;
            if (p.yellows >= 5) { p.suspended += 1; p.yellows = 0; if (p.clubId === s.userClub) this.mail("Trợ lý HLV", `${p.name} bị treo giò`, `${p.name} đã nhận 5 thẻ vàng và sẽ vắng mặt ở trận tiếp theo.`, "staff"); }
          }
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
      res.injuries.forEach((list) => list.forEach((inj) => {
        const p = s.players[inj.pid];
        if (!p) return;
        p.injury = Math.max(p.injury, inj.days);
        p.injuryName = inj.name;
        if (p.clubId === s.userClub) this.mail("Bác sĩ đội", `Chấn thương: ${p.name}`, `${p.name} gặp chấn thương <b>${inj.name}</b>, dự kiến nghỉ khoảng <b>${Math.ceil(inj.days / 7)} tuần</b>.`, "medical");
      }));

      // Tài chính & ban lãnh đạo cho đội người chơi
      if (isUser) {
        const side = f.home === s.userClub ? 0 : 1;
        const fin = s.finance.season;
        const u = this.user;
        if (side === 0 && !f.neutral) {
          const att = this.attendance();
          const t = (att * s.ticketPrice) / 1e6 * (f.comp === "league" ? 1 : 1.2);
          fin.income.tickets += t;
          u.money += t;
          f.result.attendance = att;
        }
        let tv = f.comp === "league" ? 2.2 : f.comp === "ucl" ? 3.5 : 0.4;
        if (f.comp === "ucl" && res.winner === side) tv += 2.1;
        fin.income.tv += tv;
        u.money += tv;
        const m = s.manager;
        m.games++;
        if (res.winner === side) m.w++;
        else if (res.winner === 1 - side) m.l++;
        else m.d++;
        if (f.comp === "league") {
          const exp = s.board.target;
          const oppRank = this.leagueRankByStrength().indexOf(side === 0 ? f.away : f.home) + 1;
          const myRank = s.board.expectedRank || 10;
          const fav = oppRank > myRank;
          if (res.hg === res.ag) this.changeConfidence(fav ? -1 : 1);
          else if (res.winner === side) this.changeConfidence(fav ? 2 : 4);
          else this.changeConfidence(fav ? (exp <= 4 ? -4 : -3) : -1.5);
        } else if (f.ko && res.winner !== side) {
          this.changeConfidence(f.comp === "ucl" ? -3 : -2);
        }
        // Tinh thần cầu thủ không được ra sân
        for (const pid of u.players) {
          const p = s.players[pid];
          if (!res.ratings[pid] && p.ovr >= TR.avgTop(s, u, 11) - 1 && PL.available(p)) p.morale = U.clamp(p.morale - 2, 5, 100);
        }
      }
    },

    attendance() {
      const u = this.user;
      const t = CP.leagueTable(this.s);
      const pos = t.findIndex((r) => r.id === u.id) + 1;
      const formBoost = (10 - pos) * 0.006;
      const demand = (0.58 + u.rep / 230 + formBoost) * Math.pow(60 / this.s.ticketPrice, 0.55);
      return Math.round(u.cap * U.clamp(demand, 0.35, 1));
    },

    // Trôi ngày: hồi phục, chấn thương, tác vụ hàng tuần
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
      const userRec = it.rec * (s.training.focus === "physical" ? 1.12 : 1) * (0.94 + 0.03 * this.user.facilities.training);
      for (const p of Object.values(s.players)) {
        if (!p.clubId) continue;
        const rec = p.clubId === s.userClub ? userRec : 1.05;
        p.fitness = Math.min(100, p.fitness + 5 * rec * (p.age >= 32 ? 0.88 : 1));
        if (p.injury > 0) {
          p.injury--;
          if (p.injury === 0) {
            p.injuryName = "";
            p.fitness = Math.min(p.fitness, 75);
            if (p.clubId === s.userClub) this.mail("Bác sĩ đội", `${p.name} đã bình phục`, `${p.name} đã khỏi chấn thương và sẵn sàng tập luyện trở lại.`, "medical");
          }
        }
      }
    },

    weeklyTick() {
      const s = this.s;
      const u = this.user;
      const fin = s.finance.season;
      // Lương & chi phí
      for (const c of Object.values(s.clubs)) {
        const wages = this.wageBill(c.id) / 1000;
        if (c.id === u.id) {
          const staff = wages * 0.18;
          const facilities = (u.facilities.training + u.facilities.youth) * 0.06;
          const commercial = 0.00005 * Math.pow(u.rep, 2.2);
          u.money += commercial - wages - staff - facilities;
          fin.income.commercial += commercial;
          fin.expense.wages += wages;
          fin.expense.staff += staff;
          fin.expense.facilities += facilities;
          s.finance.weekly.push({ date: s.date, bal: Math.round(u.money * 10) / 10 });
          if (s.finance.weekly.length > 60) s.finance.weekly.shift();
        } else {
          c.money += 0.00005 * Math.pow(c.rep, 2.2) + (c.league === "ENG" ? 2 : 2.4) - wages * 1.1;
        }
      }
      // Tập luyện & phát triển
      this.trainingWeek();
      // Tinh thần trôi về mức trung bình
      for (const p of Object.values(s.players)) {
        if (!p.clubId) continue;
        p.morale += (70 - p.morale) * 0.1;
      }
      // Chuyển nhượng
      if (TR.isWindowOpen(s.date)) {
        const offers = TR.aiOffersForUser(s);
        for (const o of offers) {
          const p = s.players[o.pid];
          const club = s.clubs[o.clubId];
          if (s.pendingOffers.some((x) => x.pid === o.pid && x.clubId === o.clubId)) continue;
          o.id = U.uid("o");
          s.pendingOffers.push(o);
          this.mail(club.name, `Đề nghị mua ${p.name}`,
            `${club.name} gửi lời đề nghị <b>${U.money(o.fee)}</b> cho ${p.name} (giá trị ${U.money(p.value)}).`, "offer",
            [{ label: "Chấp nhận", act: "acceptOffer", id: o.id }, { label: "Từ chối", act: "rejectOffer", id: o.id }]);
        }
        const deals = TR.aiTransfers(s, 2);
        for (const d of deals) {
          const p = s.players[d.pid];
          if (p.ovr >= 78) this.mail("Tin chuyển nhượng", `${p.name} gia nhập ${s.clubs[d.to].name}`,
            `${p.name} (${p.ovr}) chuyển từ ${d.from ? s.clubs[d.from].name : "tự do"} sang ${s.clubs[d.to].name} với giá ${d.fee ? U.money(d.fee) : "miễn phí"}.`, "news");
        }
      }
      // Hết kỳ chuyển nhượng: xoá các đề nghị cũ
      if (!TR.isWindowOpen(s.date) && s.pendingOffers.length) {
        s.pendingOffers = [];
        s.inbox.forEach((m) => { if (m.actions && m.type === "offer") { m.actions = null; m.body += "\n<i>(Đề nghị đã hết hạn)</i>"; } });
      }
      // CLB AI ký cầu thủ tự do nếu thiếu người
      for (const c of Object.values(s.clubs)) {
        if (c.id === u.id) continue;
        if (c.players.length < 20 && s.freeAgents.length) {
          const fa = s.freeAgents.map((id) => s.players[id]).filter((p) => p.ovr >= c.rep - 18 && p.ovr <= c.rep && p.age < 34).sort((a, b) => b.ovr - a.ovr)[0];
          if (fa) TR.moveTo(s, fa, c.id, 0, TR.wageDemand(s, fa, c.id), U.randInt(1, 3));
        }
      }
      // Đánh giá hàng tháng của ban lãnh đạo
      const day = U.toDate(s.date).getUTCDate();
      if (day <= 7) this.monthlyReview();
      // Ngân sách âm
      if (u.money < -30) this.changeConfidence(-2);
      if (s.board.confidence <= 0 && !s.sacked) this.sack();
      // Học viện: lứa trẻ mới vào tháng 3
      if (s.date.slice(5, 7) === "03" && day <= 7 && !s.youthIntakeDone) {
        this.youthIntake();
        s.youthIntakeDone = true;
      }
    },

    monthlyReview() {
      const s = this.s;
      const ev = this.currentEvent();
      const played = Object.values(s.fixtures).filter((f) => f.comp === "league" && f.result).length;
      if (played < 30) return;
      const t = CP.leagueTable(s);
      const pos = t.findIndex((r) => r.id === s.userClub) + 1;
      const diff = s.board.target - pos;
      const d = diff >= 0 ? Math.min(4, 1 + diff * 0.5) : Math.max(-8, diff * 1.2);
      this.changeConfidence(d);
      void ev;
      if (s.board.confidence < 25) {
        this.mail("Ban lãnh đạo", "⚠️ Cảnh báo từ ban lãnh đạo",
          `Ban lãnh đạo không hài lòng với thành tích hiện tại (hạng ${pos}, mục tiêu: ${s.board.targetText}). Độ tín nhiệm: ${Math.round(s.board.confidence)}%. Cần cải thiện ngay lập tức.`, "board");
      }
    },

    sack() {
      const s = this.s;
      s.sacked = true;
      this.mail("Ban lãnh đạo", "Bạn đã bị sa thải", `Ban lãnh đạo ${this.user.name} quyết định chấm dứt hợp đồng với bạn do thành tích không đạt kỳ vọng.`, "board");
    },

    jobOffers() {
      const s = this.s;
      const cur = this.user;
      const cands = Object.values(s.clubs).filter((c) => c.league === "ENG" && c.id !== cur.id && c.rep <= cur.rep + 1).sort((a, b) => b.rep - a.rep);
      return U.shuffle(cands.slice(Math.max(0, Math.floor(cands.length / 3) - 2))).slice(0, 3);
    },

    takeJob(clubId) {
      const s = this.s;
      s.userClub = clubId;
      s.sacked = false;
      s.manager.clubs.push(clubId);
      s.board.confidence = 55;
      this.setBoardTargets(false);
      s.pendingOffers = [];
      s.shortlist = [];
      s.youth = [];
      const u = this.user;
      this.autoPick(u);
      this.resetFinance();
      this.mail("Ban lãnh đạo", `Chào mừng tới ${u.name}`, `Bạn chính thức trở thành HLV trưởng của ${u.name}. Mục tiêu: <b>${s.board.targetText}</b>.`, "board");
    },

    trainingWeek() {
      const s = this.s;
      const tr = s.training;
      const it = INTENSITY[tr.intensity];
      for (const p of Object.values(s.players)) {
        if (!p.clubId && !p.academy) continue;
        const isUser = p.clubId === s.userClub;
        const club = s.clubs[p.clubId];
        const fac = club ? 0.88 + 0.05 * club.facilities.training : 1;
        let rate;
        const a = p.age;
        if (a <= 19) rate = 0.24;
        else if (a <= 21) rate = 0.2;
        else if (a <= 23) rate = 0.13;
        else if (a <= 26) rate = 0.06;
        else if (a <= 29) rate = 0.0;
        else if (a <= 31) rate = -0.035;
        else if (a <= 33) rate = -0.07;
        else rate = -0.11;
        if (rate > 0) {
          if (p.ovr >= p.pot) rate = 0;
          else rate *= Math.min(1.4, 0.5 + (p.pot - p.ovr) / 10);
          const playF = p.stats.apps > 0 ? Math.min(1.25, 0.8 + p.stats.mins / Math.max(1, p.stats.apps * 90) * 0.45) : 0.75;
          rate *= playF;
          if (isUser) {
            rate *= it.grow;
            if (tr.focus === "youth" && a <= 21) rate *= 1.35;
          }
          rate *= fac;
        } else if (rate < 0 && isUser && tr.focus === "physical") rate *= 0.85;
        p.prog += rate;
        while (p.prog >= 1) { p.prog -= 1; PL.applyOvrDelta(p, 1); if (isUser && p.ovr >= 70 && U.chance(0.4)) this.mail("Trợ lý HLV", `${p.name} tiến bộ`, `${p.name} đã cải thiện chỉ số lên <b>${p.ovr}</b>.`, "staff"); }
        while (p.prog <= -1) { p.prog += 1; PL.applyOvrDelta(p, -1); }
        // Chấn thương trên sân tập
        if (isUser && PL.available(p) && U.chance(it.inj)) {
          const inj = U.pick(FC.INJURIES.slice(0, 3));
          p.injury = U.randInt(inj[1], inj[2]);
          p.injuryName = inj[0] + " (tập luyện)";
          this.mail("Bác sĩ đội", `Chấn thương trên sân tập: ${p.name}`, `${p.name} dính <b>${inj[0]}</b> trong buổi tập, nghỉ khoảng ${Math.ceil(p.injury / 7)} tuần.`, "medical");
        }
        p.value = PL.calcValue(p);
      }
    },

    youthIntake() {
      const s = this.s;
      const u = this.user;
      const n = U.randInt(3, 5);
      const posList = ["GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CM", "CAM", "LW", "RW", "ST", "ST"];
      const names = [];
      for (let i = 0; i < n; i++) {
        const lvl = u.facilities.youth;
        const ovr = U.randInt(44, 54 + lvl * 2);
        const star = U.chance(0.04 + lvl * 0.03);
        const pot = U.clamp(Math.round(U.rand(62, 76 + lvl * 2.5) + (star ? U.rand(8, 14) : 0)), ovr + 8, 94);
        const p = this.genPlayer(u, U.pick(posList), U.randInt(15, 17), ovr, pot);
        p.academy = true;
        p.clubId = null;
        p.academyClub = u.id;
        p.wage = 1;
        p.contract = 0;
        p.value = PL.calcValue(p);
        s.youth.push(p.id);
        names.push(`${p.name} (${p.pos}, ${p.age} tuổi, tiềm năng ~${Math.round(p.pot / 5) * 5})`);
      }
      this.mail("Giám đốc học viện", "Lứa cầu thủ trẻ mới", `Học viện vừa đôn lên ${n} tài năng trẻ:\n• ${names.join("\n• ")}\n\nVào mục <b>Học viện</b> để ký hợp đồng chuyên nghiệp hoặc giải phóng.`, "youth");
    },

    promoteYouth(pid) {
      const s = this.s;
      const p = s.players[pid];
      const u = this.user;
      p.academy = false;
      p.clubId = u.id;
      p.contract = 3;
      p.wage = Math.max(3, Math.round(PL.baseWage(p.ovr, p.age) * 1.2));
      u.players.push(pid);
      s.youth = s.youth.filter((x) => x !== pid);
      p.joined = s.date;
    },
    releaseYouth(pid) {
      const s = this.s;
      s.youth = s.youth.filter((x) => x !== pid);
      delete s.players[pid];
    },

    upgradeFacility(kind) {
      const u = this.user;
      const lvl = u.facilities[kind];
      if (lvl >= 5) return { ok: false, msg: "Đã đạt cấp tối đa." };
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
      const cost = 45;
      if (u.money < cost) return { ok: false, msg: `Không đủ tiền (cần ${U.money(cost)}).` };
      u.money -= cost;
      u.cap += 3000;
      this.s.finance.season.expense.facilities += cost;
      return { ok: true, msg: `Sân ${u.stadium} được mở rộng lên ${u.cap.toLocaleString("vi-VN")} chỗ.` };
    },

    // ===== Chuyển nhượng phía người chơi =====
    acceptOffer(offerId) {
      const s = this.s;
      const o = s.pendingOffers.find((x) => x.id === offerId);
      if (!o) return { ok: false, msg: "Đề nghị không còn hiệu lực." };
      const p = s.players[o.pid];
      if (p.clubId !== s.userClub) return { ok: false, msg: "Cầu thủ không còn thuộc CLB." };
      if (this.user.players.length <= 16) return { ok: false, msg: "Đội hình quá mỏng để bán thêm (tối thiểu 16)." };
      TR.moveTo(s, p, o.clubId, o.fee, TR.wageDemand(s, p, o.clubId), U.randInt(2, 5));
      s.pendingOffers = s.pendingOffers.filter((x) => x.pid !== o.pid);
      this.clearOfferMails(o.pid);
      return { ok: true, msg: `Đã bán ${p.name} cho ${s.clubs[o.clubId].name} với giá ${U.money(o.fee)}.` };
    },
    rejectOffer(offerId) {
      const s = this.s;
      const o = s.pendingOffers.find((x) => x.id === offerId);
      s.pendingOffers = s.pendingOffers.filter((x) => x.id !== offerId);
      if (o) {
        const p = s.players[o.pid];
        if (p && !p.listed && o.fee > p.value * 1.3) p.morale = U.clamp(p.morale - 8, 0, 100);
      }
      s.inbox.forEach((m) => { if (m.actions && m.actions.some((a) => a.id === offerId)) m.actions = null; });
      return { ok: true, msg: "Đã từ chối đề nghị." };
    },
    clearOfferMails(pid) {
      const ids = new Set(this.s.pendingOffers.filter((o) => o.pid === pid).map((o) => o.id));
      this.s.inbox.forEach((m) => { if (m.actions && m.type === "offer") { if (!m.actions.some((a) => this.s.pendingOffers.find((o) => o.id === a.id))) m.actions = null; } });
      void ids;
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
      this.mail("Giám đốc thể thao", `Hoàn tất chiêu mộ ${p.name}`, `${p.name} (${p.pos}, ${p.ovr}) đã gia nhập từ ${from}. Phí: ${fee ? U.money(fee) : "miễn phí"}, lương ${U.wage(wage)}, hợp đồng ${years} năm.`, "transfer");
      return { ok: true, msg: `Chào mừng ${p.name} tới ${u.name}!` };
    },

    renewContract(pid, wage, years) {
      const s = this.s;
      const p = s.players[pid];
      const u = this.user;
      const demand = TR.wageDemand(s, p, u.id);
      const newBill = this.wageBill(u.id) - p.wage + wage;
      if (newBill > u.wageBudget * 1.0001) return { ok: false, msg: "Vượt quỹ lương cho phép." };
      if (p.age >= 32 && years > 2) return { ok: false, msg: `${p.name} chỉ được đề nghị tối đa 2 năm do tuổi tác.`, demand };
      if (p.morale < 30 && U.chance(0.5)) return { ok: false, msg: `${p.name} không vui và từ chối đàm phán lúc này.`, demand };
      if (wage < demand * 0.95) return { ok: false, msg: `${p.name} muốn mức lương ít nhất ${U.wage(demand)}.`, demand };
      p.wage = wage;
      p.contract = years;
      p.morale = U.clamp(p.morale + 8, 0, 100);
      return { ok: true, msg: `${p.name} gia hạn ${years} năm với lương ${U.wage(wage)}.` };
    },

    // ===== Kết thúc mùa giải =====
    endSeason() {
      const s = this.s;
      if (s.seasonEnded) return;
      s.seasonEnded = true;
      const table = CP.leagueTable(s);
      const pos = table.findIndex((r) => r.id === s.userClub) + 1;
      const champion = table[0].id;
      // Tiền thưởng
      table.forEach((r, i) => {
        const prize = Math.round((60 - i * 2.6) * 10) / 10;
        s.clubs[r.id].money += prize;
        s.clubs[r.id].transferBudget += prize * 0.4;
        if (r.id === s.userClub) s.finance.season.income.prize += prize;
      });
      if (champion === s.userClub) {
        s.manager.trophies.push({ season: this.seasonLabel(), name: CP.COMP.league.name, club: this.user.name });
      }
      // Danh hiệu cá nhân
      const engPlayers = Object.values(s.players).filter((p) => p.clubId && s.clubs[p.clubId].league === "ENG");
      const top = engPlayers.slice().sort((a, b) => b.stats.goals - a.stats.goals)[0];
      const rated = engPlayers.filter((p) => p.stats.apps >= 20);
      const potm = rated.slice().sort((a, b) => PL.avgRating(b) - PL.avgRating(a))[0];
      const ypotm = rated.filter((p) => p.age <= 21).sort((a, b) => PL.avgRating(b) - PL.avgRating(a))[0];
      const fin = s.finance.season;
      const income = Object.values(fin.income).reduce((a, b) => a + b, 0);
      const expense = Object.values(fin.expense).reduce((a, b) => a + b, 0);
      const met = pos <= s.board.target;
      const summary = {
        season: this.seasonLabel(), pos, champion, club: s.userClub, target: s.board.target, targetText: s.board.targetText, met,
        cupWinner: s.cup.winner, uclWinner: s.ucl.winner,
        cupRun: s.cup.winner === s.userClub ? "Vô địch" : s.cup.eliminated[s.userClub] || "—",
        uclRun: s.ucl.teams.includes(s.userClub) ? (s.ucl.winner === s.userClub ? "Vô địch" : s.ucl.eliminated[s.userClub] || "—") : "Không tham dự",
        topScorer: top ? { name: top.name, club: top.clubId, goals: top.stats.goals } : null,
        potm: potm ? { name: potm.name, club: potm.clubId, r: PL.avgRating(potm).toFixed(2) } : null,
        ypotm: ypotm ? { name: ypotm.name, club: ypotm.clubId, r: PL.avgRating(ypotm).toFixed(2) } : null,
        table: table.map((r) => ({ id: r.id, pts: r.pts, gd: r.gf - r.ga })),
        income, expense,
      };
      s.history.push(summary);
      s.finance.history.push({ season: this.seasonLabel(), income, expense, fin: JSON.parse(JSON.stringify(fin)) });
      this.changeConfidence(met ? 15 : -Math.min(40, (pos - s.board.target) * 6));
      s.lastSummary = summary;
      if (s.board.confidence <= 0) this.sack();
    },

    startNewSeason() {
      const s = this.s;
      const table = CP.leagueTable(s);
      s.uclQualified = table.slice(0, 4).map((r) => r.id);
      // Uy tín CLB thay đổi theo thứ hạng
      table.forEach((r, i) => {
        const c = s.clubs[r.id];
        const exp = this.leagueRankByStrength().indexOf(r.id);
        c.rep = U.clamp(c.rep + Math.sign(exp - i) * Math.min(2, Math.abs(exp - i) / 3), 55, 99);
      });
      if (s.ucl.winner) s.clubs[s.ucl.winner].rep = Math.min(99, s.clubs[s.ucl.winner].rep + 1);
      s.season++;
      const retired = [];
      const leftUser = [];
      for (const p of Object.values(s.players)) {
        if (p.academy) { p.age++; continue; }
        p.age++;
        // Tiềm năng biến động nhẹ
        if (p.age <= 23) p.pot = U.clamp(p.pot + U.randInt(-2, 2), p.ovr, 95);
        if (p.age >= 30) p.pot = p.ovr;
        p.career.seasons = (p.career.seasons || 0) + 1;
        p.stats = PL.newStats();
        p.yellows = 0;
        p.suspended = 0;
        p.fitness = 100;
        p.form = 6.6;
        // Giải nghệ
        const retireP = p.age >= 38 ? 0.85 : p.age >= 36 ? 0.45 : p.age >= 35 ? 0.25 : p.age >= 34 && p.ovr < 75 ? 0.2 : 0;
        if (U.chance(retireP)) {
          retired.push(p);
          continue;
        }
        if (p.clubId) {
          p.contract--;
          if (p.contract <= 0) {
            if (p.clubId === s.userClub) {
              leftUser.push(p.name);
              this.removeFromClub(p);
              s.freeAgents.push(p.id);
            } else if (U.chance(0.72)) {
              p.contract = U.randInt(1, 4);
              p.wage = Math.round(p.wage * U.rand(1, 1.2));
            } else {
              this.removeFromClub(p);
              s.freeAgents.push(p.id);
            }
          }
        }
        p.value = PL.calcValue(p);
      }
      for (const p of retired) {
        if (p.clubId === s.userClub) this.mail("Tin tức", `${p.name} giải nghệ`, `${p.name} (${p.age} tuổi) tuyên bố treo giày. Cảm ơn những cống hiến!`, "news");
        if (p.clubId) this.removeFromClub(p);
        s.freeAgents = s.freeAgents.filter((x) => x !== p.id);
        s.shortlist = s.shortlist.filter((x) => x !== p.id);
        delete s.players[p.id];
      }
      // Dọn cầu thủ tự do quá lâu
      s.freeAgents = s.freeAgents.filter((id) => {
        const p = s.players[id];
        if (!p) return false;
        if (p.age >= 33 || p.ovr < 60) { delete s.players[id]; return false; }
        return true;
      });
      if (leftUser.length) this.mail("Giám đốc thể thao", "Cầu thủ hết hợp đồng", `Các cầu thủ sau đã rời CLB theo dạng tự do: ${leftUser.join(", ")}.`, "transfer");
      // CLB AI bổ sung đội hình
      for (const c of Object.values(s.clubs)) {
        if (c.id !== s.userClub) {
          c.transferBudget = Math.max(c.transferBudget, 20 + (c.rep - 60) * 2.5);
          this.fillSquad(c, 21);
          c.tactics.formation = this.bestFormation(c);
        }
        c.tactics.lineup = c.id === s.userClub ? c.tactics.lineup : null;
      }
      const u = this.user;
      // Ngân sách mới từ ban lãnh đạo
      const last = s.lastSummary;
      const bonus = last && last.met ? 1.25 : 0.9;
      u.transferBudget = Math.max(15, Math.round((Math.max(0, u.transferBudget) * 0.5 + (20 + (u.rep - 60) * 3) * bonus) * 10) / 10);
      s.seasonEnded = false;
      s.youthIntakeDone = false;
      s.date = `${s.season}-07-01`;
      s.pendingOffers = [];
      CP.buildSeason(s, s.season);
      this.resetFinance();
      this.setBoardTargets(false);
      this.autoPickIfBroken(u);
      this.mail("Ban lãnh đạo", `Mùa giải ${this.seasonLabel()} bắt đầu`,
        `Mục tiêu mùa mới: <b>${s.board.targetText}</b>.\nNgân sách chuyển nhượng: <b>${U.money(u.transferBudget)}</b>.\nQuỹ lương: <b>${U.wage(u.wageBudget)}</b>.\nĐộ tín nhiệm hiện tại: ${Math.round(s.board.confidence)}%.`, "board");
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
    },

    // ===== Lưu / tải =====
    save(slot = 1) {
      try {
        const data = JSON.stringify(this.s);
        localStorage.setItem(SAVE_KEY + slot, data);
        localStorage.setItem(SAVE_KEY + slot + "_meta", JSON.stringify({
          club: this.s.userClub, name: this.user.name, manager: this.s.manager.name, date: this.s.date, season: this.seasonLabel(), saved: Date.now(),
        }));
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    load(slot = 1) {
      const raw = localStorage.getItem(SAVE_KEY + slot);
      if (!raw) return false;
      this.s = JSON.parse(raw);
      return true;
    },
    saveMeta(slot) {
      try { return JSON.parse(localStorage.getItem(SAVE_KEY + slot + "_meta")); } catch (e) { return null; }
    },
    deleteSave(slot) {
      localStorage.removeItem(SAVE_KEY + slot);
      localStorage.removeItem(SAVE_KEY + slot + "_meta");
    },

    TRAINING_FOCUS, INTENSITY, START_YEAR,
  };

  FC.Game = Game;
})();
