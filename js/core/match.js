/* Mô phỏng trận đấu theo từng phút, có bình luận tiếng Việt */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;
  const PL = FC.players;

  const T = {
    kickoff: ["Trọng tài thổi còi khai cuộc! {h} gặp {a}.", "Trận đấu bắt đầu! Bóng đã lăn tại {s}."],
    goal: [
      "VÀO!!! {p} dứt điểm lạnh lùng đánh bại thủ thành!", "GOOOAL! {p} tung cú sút căng như kẻ chỉ vào góc lưới!",
      "BÀN THẮNG! {p} đánh đầu cực mạnh, thủ môn bất lực!", "VÀO! {p} băng xuống đệm bóng cận thành!",
      "Tuyệt phẩm! {p} vẩy má ngoài từ ngoài vòng cấm!", "Lưới rung! {p} không bỏ lỡ cơ hội ngon ăn!",
    ],
    assist: [" Kiến tạo tinh tế của {a}.", " Đường chuyền quyết định đến từ {a}.", " {a} là người đặt bóng thuận lợi.", " Pha căng ngang của {a}!"],
    pen_goal: ["PHẠT ĐỀN... VÀO! {p} sút chân trái thủ môn bay người sai hướng.", "{p} lạnh lùng thực hiện thành công quả 11m!"],
    pen_miss: ["{p} sút hỏng phạt đền! Thủ môn {k} đã đoán đúng hướng!", "Không thể tin được! {p} đưa bóng đập cột dọc từ chấm 11m!"],
    pen_award: ["PHẠT ĐỀN cho {t}! Cầu thủ bị phạm lỗi trong vòng cấm.", "Trọng tài chỉ tay vào chấm 11m sau khi kiểm tra VAR!"],
    save: ["{k} cứu thua xuất sắc trước cú sút của {p}!", "Cú dứt điểm của {p} bị {k} đẩy ra ngoài!", "{k} bay người cản phá cú sút xa của {p}."],
    big_miss: ["Không thể tin nổi! {p} bỏ lỡ cơ hội mười mươi!", "{p} đối mặt thủ môn nhưng dứt điểm vọt xà!", "Bóng tìm đến {p} trước khung thành trống... ra ngoài!"],
    miss: ["{p} sút xa nhưng bóng đi chệch cột dọc.", "Cú đánh đầu của {p} đi vọt xà.", "{p} dứt điểm vội vàng, bóng đi ra ngoài.", "Cú sút của {p} bị hậu vệ chặn lại."],
    woodwork: ["Ối! Cú sút của {p} dội xà ngang!", "{p} sút trúng cột dọc! Quá đen đủi!"],
    yellow: ["Thẻ vàng cho {p} sau pha vào bóng muộn.", "{p} nhận thẻ vàng vì phản ứng với trọng tài.", "{p} phạm lỗi chiến thuật và bị phạt thẻ vàng."],
    second_yellow: ["Thẻ vàng thứ hai! {p} bị đuổi khỏi sân!"],
    red: ["THẺ ĐỎ TRỰC TIẾP! {p} vào bóng nguy hiểm!", "{p} bị truất quyền thi đấu sau pha phạm lỗi thô bạo!"],
    injury: ["{p} nằm sân ôm chân, có vẻ chấn thương...", "Lo lắng cho {t}: {p} phải rời sân vì chấn thương."],
    sub: ["Thay người bên phía {t}: {i} vào sân thay {o}."],
    half: ["Hết hiệp một! Tỉ số {sc}.", "Trọng tài thổi còi kết thúc 45 phút đầu tiên. {sc}."],
    second: ["Hiệp hai bắt đầu!"],
    ft: ["HẾT GIỜ! Chung cuộc {sc}.", "Tiếng còi mãn cuộc vang lên! {sc}."],
    corner: ["Phạt góc cho {t}.", "{t} được hưởng quả phạt góc."],
    pressure: ["{t} đang dồn ép đối thủ.", "{t} kiểm soát bóng ở phần sân đối phương.", "Thế trận đang nghiêng về {t}."],
  };
  const fill = (s, o) => s.replace(/\{(\w)\}/g, (_, k) => (o[k] != null ? o[k] : ""));
  const say = (k, o) => fill(U.pick(T[k]), o);

  const INJURIES = [
    ["Căng cơ đùi sau", 7, 21], ["Bong gân cổ chân", 7, 28], ["Va chạm nhẹ", 2, 7], ["Chấn thương đầu gối", 21, 60],
    ["Rách cơ bắp chân", 14, 35], ["Chấn thương háng", 10, 28], ["Gãy xương bàn chân", 45, 90], ["Đứt dây chằng chéo", 150, 240],
  ];

  class MatchSim {
    constructor(game, fixture, opts = {}) {
      this.g = game;
      this.P = game.players;
      this.fx = fixture;
      this.quick = !!opts.quick;
      this.knockout = !!opts.knockout;
      this.neutral = !!opts.neutral;
      this.userSide = opts.userSide != null ? opts.userSide : -1;
      this.autoSubUser = opts.autoSubUser !== false;
      this.minute = 0;
      this.added = [U.randInt(1, 4), U.randInt(2, 6)];
      this.half = 1;
      this.phase = "pre"; // pre, first, ht, second, ft
      this.score = [0, 0];
      this.events = [];
      this.stats = { poss: [0, 0], shots: [0, 0], sot: [0, 0], xg: [0, 0], corners: [0, 0], fouls: [0, 0], yc: [0, 0], rc: [0, 0], saves: [0, 0] };
      this.sides = [0, 1].map((i) => this.buildSide(i === 0 ? fixture.home : fixture.away, i, opts));
      this.strCache = [null, null];
      this.momentum = [0, 0];
    }

    buildSide(clubId, idx, opts) {
      const club = this.g.clubs[clubId];
      const squad = club.players.map((id) => this.P[id]).filter(Boolean);
      let t = club.tactics;
      let lineup, bench;
      const isUser = idx === this.userSide;
      if (isUser && t.lineup && t.lineup.length === 11) {
        const fixed = FC.Game.validateLineup(club);
        lineup = fixed.lineup;
        bench = fixed.bench;
      } else {
        const r = PL.autoLineup(squad, t.formation, { rotate: !isUser });
        lineup = r.lineup;
        bench = r.bench;
      }
      const slots = PL.FORMATIONS[t.formation];
      const onPitch = [];
      lineup.forEach((pid, i) => {
        if (pid) onPitch.push({ pid, pos: slots[i][0], x: slots[i][1], y: slots[i][2] });
      });
      const fit = {}, rating = {}, played = {};
      for (const p of squad) fit[p.id] = p.fitness;
      for (const s of onPitch) { rating[s.pid] = 6.3; played[s.pid] = { start: 0, end: null, starter: true }; }
      return {
        idx, clubId, club, onPitch, bench: bench.slice(), subsUsed: 0, maxSubs: 5, fit, rating, played,
        tactics: { mentality: t.mentality || 0, pressing: t.pressing != null ? t.pressing : 1, tempo: t.tempo != null ? t.tempo : 1, formation: t.formation },
        dayForm: U.clamp(1 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.045, 0.94, 1.06), boost: 0, bonus: (isUser && opts.trainingBonus) || { att: 0, mid: 0, def: 0 }, sentOff: [], yellowed: {}, goals: [], injured: [],
      };
    }

    clubName(i) { return this.sides[i].club.name; }
    pname(pid) { const p = this.P[pid]; return p ? p.name : "?"; }

    strength(i) {
      if (this.strCache[i]) return this.strCache[i];
      const s = this.sides[i];
      let d = 0, dw = 0, m = 0, mw = 0, a = 0, aw = 0, gk = 40;
      for (const sl of s.onPitch) {
        const p = this.P[sl.pid];
        const e = PL.effective(p, sl.pos, s.fit[sl.pid]);
        if (sl.pos === "GK") { gk = e; continue; }
        const w = PL.LINE_W[sl.pos];
        d += e * w[0]; dw += w[0]; m += e * w[1]; mw += w[1]; a += e * w[2]; aw += w[2];
      }
      let def = dw ? d / dw : 40, mid = mw ? m / mw : 40, att = aw ? a / aw : 40;
      const men = s.tactics.mentality;
      att *= 1 + 0.035 * men + s.bonus.att;
      def *= 1 - 0.028 * men + s.bonus.def;
      mid *= 1 + (s.tactics.pressing - 1) * 0.02 + s.bonus.mid;
      const missing = 11 - s.onPitch.length;
      const f = (1 - missing * 0.075) * (1 + s.boost) * s.dayForm * (this.neutral ? 1 : i === 0 ? 1.02 : 1);
      const r = { def: def * f, mid: mid * f, att: att * f, gk: gk * (1 + s.boost) };
      this.strCache[i] = r;
      return r;
    }

    log(ev) {
      ev.min = this.minute;
      ev.minLabel = this.minLabel();
      this.events.push(ev);
      return ev;
    }
    minLabel() {
      if (this.half === 1 && this.minute > 45) return "45+" + (this.minute - 45);
      if (this.half === 2 && this.minute > 90) return "90+" + (this.minute - 90);
      return String(this.minute);
    }
    scoreText() { return `${this.sides[0].club.short} ${this.score[0]}-${this.score[1]} ${this.sides[1].club.short}`; }

    start() {
      this.phase = "first";
      if (!this.quick) this.log({ type: "info", text: say("kickoff", { h: this.clubName(0), a: this.clubName(1), s: this.sides[0].club.stadium }) });
    }

    // Tiến 1 phút. Trả về true nếu có sự kiện dừng (hết hiệp/hết trận)
    step() {
      if (this.phase === "pre") this.start();
      if (this.phase === "ht") { this.phase = "second"; this.half = 2; this.minute = 45; if (!this.quick) this.log({ type: "info", text: say("second", {}) }); }
      if (this.phase === "ft") return "ft";
      this.minute++;
      this.strCache = [null, null];
      this.tick();
      if (this.half === 1 && this.minute >= 45 + this.added[0]) {
        this.phase = "ht";
        if (!this.quick) this.log({ type: "half", text: say("half", { sc: this.scoreText() }) });
        return "ht";
      }
      if (this.half === 2 && this.minute >= 90 + this.added[1]) {
        this.finish();
        return "ft";
      }
      return null;
    }

    runToEnd() {
      let r;
      do { r = this.step(); } while (r !== "ft");
      return this.result;
    }

    tick() {
      const A = this.strength(0), B = this.strength(1);
      let pH = 1 / (1 + Math.exp(-(A.mid - B.mid) / 17));
      pH += (this.sides[0].tactics.pressing - this.sides[1].tactics.pressing) * 0.02;
      pH += (this.momentum[0] - this.momentum[1]) * 0.03;
      pH = U.clamp(pH, 0.22, 0.78);
      this.stats.poss[0] += pH;
      this.stats.poss[1] += 1 - pH;
      this.momentum = this.momentum.map((m) => m * 0.9);

      const tempo = (this.sides[0].tactics.tempo + this.sides[1].tactics.tempo) / 2;
      const chanceP = 0.255 * (0.88 + 0.12 * tempo);
      if (Math.random() < chanceP) {
        const wH = Math.pow(pH, 0.8) * Math.pow(A.att / B.def, 1.0) * (1 + this.sides[0].tactics.mentality * 0.04);
        const wA = Math.pow(1 - pH, 0.8) * Math.pow(B.att / A.def, 1.0) * (1 + this.sides[1].tactics.mentality * 0.04);
        this.attack(Math.random() < wH / (wH + wA) ? 0 : 1);
      } else if (!this.quick && Math.random() < 0.035) {
        const i = Math.random() < pH ? 0 : 1;
        this.log({ type: "flavor", side: i, text: say("pressure", { t: this.clubName(i) }) });
      }

      // Phạm lỗi & thẻ
      if (Math.random() < 0.23) this.foul(Math.random() < 0.5 + (this.sides[0].tactics.pressing - this.sides[1].tactics.pressing) * 0.06 ? 0 : 1);
      // Chấn thương
      if (Math.random() < 0.0027) this.injury(Math.random() < 0.5 ? 0 : 1);
      // Thể lực
      for (const s of this.sides) {
        const drain = 0.2 * (1 + (s.tactics.pressing - 1) * 0.18) * (1 + (s.tactics.tempo - 1) * 0.08);
        for (const sl of s.onPitch) {
          const p = this.P[sl.pid];
          const ageF = p.age >= 32 ? 1.15 : p.age >= 29 ? 1.05 : p.age <= 20 ? 1.05 : 1;
          s.fit[sl.pid] = Math.max(0, s.fit[sl.pid] - drain * ageF * (sl.pos === "GK" ? 0.3 : 1));
        }
      }
      // Thay người tự động
      for (const s of this.sides) {
        if (s.idx === this.userSide && !this.autoSubUser) continue;
        if (this.minute >= 56 && s.subsUsed < s.maxSubs && Math.random() < 0.09) this.aiSub(s);
      }
    }

    pickShooter(s, exclude) {
      const W = { ST: 3.0, LW: 2.6, RW: 2.6, CAM: 2.2, LM: 1.6, RM: 1.6, CM: 1.2, CDM: 0.55, CB: 0.55, LB: 0.4, RB: 0.4, GK: 0 };
      const c = s.onPitch.filter((sl) => sl.pid !== exclude);
      if (!c.length) return null;
      return U.weightedPick(c, (sl) => W[sl.pos] * Math.pow((this.P[sl.pid].attrs[1] || 50) / 70, 1.6) * (this.P[sl.pid].pos === "GK" ? 0.01 : 1)).pid;
    }
    pickAssister(s, exclude) {
      const W = { CAM: 3, LW: 2.6, RW: 2.6, LM: 2.4, RM: 2.4, CM: 2, ST: 1.4, LB: 1.3, RB: 1.3, CDM: 0.8, CB: 0.3, GK: 0.05 };
      const c = s.onPitch.filter((sl) => sl.pid !== exclude);
      if (!c.length) return null;
      return U.weightedPick(c, (sl) => W[sl.pos] * Math.pow((this.P[sl.pid].attrs[2] || 50) / 70, 1.6)).pid;
    }
    gkOf(s) {
      const g = s.onPitch.find((sl) => sl.pos === "GK");
      return g ? g.pid : null;
    }
    addRating(s, pid, v) {
      if (pid && s.rating[pid] != null) s.rating[pid] += v;
    }

    attack(i) {
      const s = this.sides[i], o = this.sides[1 - i];
      const atk = this.strength(i), dfn = this.strength(1 - i);
      const ratio = atk.att / dfn.def;
      const r = Math.random();
      let kind = "normal", xg;
      if (r < 0.009) { kind = "pen"; xg = 0.78; }
      else if (r < 0.12) { kind = "big"; xg = U.rand(0.25, 0.5); }
      else xg = U.rand(0.02, 0.125);
      if (kind !== "pen") xg = U.clamp(xg * Math.pow(ratio, 1.15), 0.01, 0.85);
      const shooter = this.pickShooter(s);
      if (!shooter) return;
      const sp = this.P[shooter];
      const gkId = this.gkOf(o);
      const gkF = U.clamp(1.12 - (dfn.gk - 70) / 110, 0.82, 1.35);
      const fin = 0.88 + ((sp.attrs[1] || 50) - 70) / 180;
      const pGoal = U.clamp(xg * gkF * fin, 0.005, 0.95);
      this.stats.shots[i]++;
      this.stats.xg[i] += xg;
      const goal = Math.random() < pGoal;
      const kName = gkId ? this.pname(gkId) : "thủ môn";
      if (kind === "pen" && !this.quick) this.log({ type: "chance", side: i, text: say("pen_award", { t: s.club.name }) });
      if (goal) {
        this.stats.sot[i]++;
        this.score[i]++;
        this.momentum[i] += 1;
        let assist = null;
        if (kind !== "pen" && Math.random() < 0.72) assist = this.pickAssister(s, shooter);
        this.addRating(s, shooter, 1.05);
        if (assist) this.addRating(s, assist, 0.6);
        this.addRating(o, gkId, -0.3);
        for (const sl of o.onPitch) if (["CB", "LB", "RB", "CDM"].includes(sl.pos)) this.addRating(o, sl.pid, -0.12);
        s.goals.push({ pid: shooter, assist, min: this.minLabel(), pen: kind === "pen" });
        let text = "";
        if (!this.quick) {
          text = kind === "pen" ? say("pen_goal", { p: sp.name }) : say("goal", { p: sp.name });
          if (assist) text += say("assist", { a: this.pname(assist) });
          text += ` (${this.scoreText()})`;
        }
        this.log({ type: "goal", side: i, pid: shooter, pid2: assist, pen: kind === "pen", text });
      } else {
        const onTarget = Math.random() < (kind === "pen" ? 0.7 : 0.38);
        if (onTarget) {
          this.stats.sot[i]++;
          this.stats.saves[1 - i]++;
          this.addRating(o, gkId, kind === "big" || kind === "pen" ? 0.35 : 0.14);
          if (!this.quick) this.log({ type: kind === "pen" ? "penmiss" : "save", side: i, pid: shooter, text: kind === "pen" ? say("pen_miss", { p: sp.name, k: kName }) : say("save", { p: sp.name, k: kName }) });
        } else if (!this.quick) {
          const wood = Math.random() < 0.06;
          this.log({ type: "miss", side: i, pid: shooter, text: wood ? say("woodwork", { p: sp.name }) : kind === "big" ? say("big_miss", { p: sp.name }) : say("miss", { p: sp.name }) });
        }
        if (kind === "big") this.addRating(s, shooter, -0.15);
        else this.addRating(s, shooter, 0.03);
        if (Math.random() < 0.3) {
          this.stats.corners[i]++;
          if (!this.quick && Math.random() < 0.4) this.log({ type: "flavor", side: i, text: say("corner", { t: s.club.name }) });
        }
      }
    }

    foul(i) {
      const s = this.sides[i];
      if (!s.onPitch.length) return;
      this.stats.fouls[i]++;
      const W = { CB: 2, CDM: 2.4, CM: 1.6, LB: 1.6, RB: 1.6, ST: 1, LW: 0.8, RW: 0.8, CAM: 1, LM: 1, RM: 1, GK: 0.1 };
      const sl = U.weightedPick(s.onPitch, (x) => W[x.pos]);
      const r = Math.random();
      if (r < 0.0045) return this.sendOff(s, sl.pid, "red");
      if (r < 0.155) {
        this.stats.yc[i]++;
        if (s.yellowed[sl.pid]) return this.sendOff(s, sl.pid, "second");
        s.yellowed[sl.pid] = true;
        this.addRating(s, sl.pid, -0.3);
        this.log({ type: "yellow", side: i, pid: sl.pid, text: this.quick ? "" : say("yellow", { p: this.pname(sl.pid) }) });
      }
    }

    sendOff(s, pid, kind) {
      this.stats.rc[s.idx]++;
      this.addRating(s, pid, -1.2);
      s.sentOff.push(pid);
      const wasGK = s.onPitch.find((x) => x.pid === pid).pos === "GK";
      s.onPitch = s.onPitch.filter((x) => x.pid !== pid);
      s.played[pid].end = this.minute;
      this.log({ type: "red", side: s.idx, pid, second: kind === "second", text: this.quick ? "" : say(kind === "second" ? "second_yellow" : "red", { p: this.pname(pid) }) });
      this.strCache = [null, null];
      if (wasGK) {
        const gk = s.bench.map((id) => this.P[id]).find((p) => p.pos === "GK");
        if (gk && s.subsUsed < s.maxSubs && s.onPitch.length) {
          const out = s.onPitch.filter((x) => x.pos !== "GK").sort((a, b) => PL.effective(this.P[a.pid], a.pos) - PL.effective(this.P[b.pid], b.pos))[0];
          this.doSub(s, out.pid, gk.id, "GK");
        } else if (s.onPitch.length) {
          s.onPitch[s.onPitch.length - 1].pos = "GK";
        }
      }
    }

    injury(i) {
      const s = this.sides[i];
      if (!s.onPitch.length) return;
      const sl = U.weightedPick(s.onPitch, (x) => (x.pos === "GK" ? 0.2 : 1) * (1.4 - s.fit[x.pid] / 100));
      const inj = U.weightedPick(INJURIES, (x) => 1 / Math.sqrt(x[1]));
      const days = U.randInt(inj[1], inj[2]);
      s.injured.push({ pid: sl.pid, name: inj[0], days });
      this.log({ type: "injury", side: i, pid: sl.pid, text: this.quick ? "" : say("injury", { p: this.pname(sl.pid), t: s.club.name }) + ` (${inj[0]})` });
      const auto = s.idx !== this.userSide || this.autoSubUser;
      if (s.subsUsed < s.maxSubs) {
        const rep = this.bestBenchFor(s, sl.pos);
        if (rep && auto) this.doSub(s, sl.pid, rep.id);
        else if (!auto) { sl.injured = true; s.fit[sl.pid] = Math.min(s.fit[sl.pid], 15); }
        else this.removeFromPitch(s, sl.pid);
      } else this.removeFromPitch(s, sl.pid);
    }

    removeFromPitch(s, pid) {
      s.onPitch = s.onPitch.filter((x) => x.pid !== pid);
      if (s.played[pid]) s.played[pid].end = this.minute;
      this.strCache = [null, null];
    }

    bestBenchFor(s, pos) {
      let best = null, bv = -1;
      for (const id of s.bench) {
        const p = this.P[id];
        if (!p) continue;
        if (pos !== "GK" && p.pos === "GK") continue;
        const v = PL.effective(p, pos, s.fit[id]);
        if (v > bv) { bv = v; best = p; }
      }
      return best;
    }

    aiSub(s) {
      const cand = s.onPitch.filter((sl) => sl.pos !== "GK").map((sl) => {
        const p = this.P[sl.pid];
        return { sl, v: PL.effective(p, sl.pos, s.fit[sl.pid]), fit: s.fit[sl.pid], r: s.rating[sl.pid] };
      });
      if (!cand.length) return;
      cand.sort((a, b) => a.fit + a.r * 4 - (b.fit + b.r * 4));
      const out = cand[0];
      if (out.fit > 74 && out.r > 6.2 && this.minute < 75) return;
      const rep = this.bestBenchFor(s, out.sl.pos);
      if (!rep) return;
      if (PL.effective(rep, out.sl.pos, s.fit[rep.id]) < out.v * 0.97 && out.fit > 60) return;
      this.doSub(s, out.sl.pid, rep.id);
    }

    // Thay người (dùng cho cả người chơi)
    doSub(s, outPid, inPid, forcePos) {
      if (s.subsUsed >= s.maxSubs) return false;
      const sl = s.onPitch.find((x) => x.pid === outPid);
      if (!sl || !s.bench.includes(inPid)) return false;
      s.subsUsed++;
      s.bench = s.bench.filter((x) => x !== inPid);
      s.played[outPid].end = this.minute;
      sl.pid = inPid;
      sl.injured = false;
      if (forcePos) sl.pos = forcePos;
      s.rating[inPid] = 6.2;
      s.played[inPid] = { start: this.minute, end: null, starter: false };
      this.strCache = [null, null];
      this.log({ type: "sub", side: s.idx, pid: inPid, pid2: outPid, text: this.quick ? "" : say("sub", { t: s.club.name, i: this.pname(inPid), o: this.pname(outPid) }) });
      return true;
    }

    swapPositions(sideIdx, pidA, pidB) {
      const s = this.sides[sideIdx];
      const a = s.onPitch.find((x) => x.pid === pidA), b = s.onPitch.find((x) => x.pid === pidB);
      if (!a || !b) return;
      [a.pid, b.pid] = [b.pid, a.pid];
      this.strCache = [null, null];
    }

    setTactics(sideIdx, t) {
      Object.assign(this.sides[sideIdx].tactics, t);
      this.strCache = [null, null];
    }

    teamTalk(sideIdx, kind) {
      // kind: calm | motivate | demand
      const s = this.sides[sideIdx];
      const diff = this.score[sideIdx] - this.score[1 - sideIdx];
      let b = 0, msg;
      if (kind === "motivate") { b = diff < 0 ? 0.03 : diff === 0 ? 0.02 : 0.005; msg = "Các cầu thủ hừng hực khí thế!"; }
      else if (kind === "demand") { b = diff < 0 ? (Math.random() < 0.6 ? 0.035 : -0.02) : -0.01; msg = b > 0 ? "Các cầu thủ phản ứng tích cực với sự nghiêm khắc." : "Một số cầu thủ tỏ ra khó chịu với lời phê bình."; }
      else { b = diff > 0 ? 0.02 : 0.005; msg = "Các cầu thủ bình tĩnh, tập trung vào kế hoạch."; }
      s.boost = U.clamp(s.boost + b, -0.04, 0.05);
      this.strCache = [null, null];
      return msg;
    }

    penalties() {
      const res = [0, 0];
      const takers = this.sides.map((s) => s.onPitch.map((x) => this.P[x.pid]).sort((a, b) => b.attrs[1] - a.attrs[1]));
      const shoot = (i, k) => {
        const t = takers[i][k % Math.max(1, takers[i].length)];
        const gk = this.strength(1 - i).gk;
        const p = U.clamp(0.77 + ((t ? t.attrs[1] : 60) - 75) / 250 - (gk - 80) / 300, 0.55, 0.92);
        const ok = Math.random() < p;
        if (ok) res[i]++;
        return { t, ok };
      };
      const seq = [];
      for (let k = 0; k < 5; k++) {
        for (const i of [0, 1]) {
          const r = shoot(i, k);
          seq.push({ i, ...r });
          // kết thúc sớm khi một đội không thể bắt kịp
          const remA = 4 - k, remB = i === 0 ? 5 - k : 4 - k;
          if (res[0] > res[1] + remB || res[1] > res[0] + remA) { k = 99; break; }
        }
      }
      let k = 5;
      while (res[0] === res[1] && k < 30) {
        shoot(0, k); shoot(1, k); k++;
      }
      this.pens = res;
      if (!this.quick) {
        this.log({ type: "info", text: `Loạt sút luân lưu: ${this.sides[0].club.short} ${res[0]} - ${res[1]} ${this.sides[1].club.short}` });
      }
    }

    finish() {
      this.phase = "ft";
      if (this.knockout && this.score[0] === this.score[1]) {
        // Hiệp phụ rút gọn: mô phỏng thêm 30 phút
        this.half = 3;
        if (!this.quick) this.log({ type: "info", text: "Hai đội bước vào hiệp phụ!" });
        for (let m = 0; m < 30; m++) { this.minute++; this.strCache = [null, null]; this.tick(); }
        if (this.score[0] === this.score[1]) this.penalties();
      }
      if (!this.quick) this.log({ type: "ft", text: say("ft", { sc: this.scoreText() }) });
      this.buildResult();
    }

    winner() {
      if (this.score[0] !== this.score[1]) return this.score[0] > this.score[1] ? 0 : 1;
      if (this.pens) return this.pens[0] > this.pens[1] ? 0 : 1;
      return -1;
    }

    buildResult() {
      const end = this.minute;
      const ratings = {};
      let motm = null, best = -1;
      this.sides.forEach((s, i) => {
        const gf = this.score[i], ga = this.score[1 - i];
        const res = gf > ga ? 0.35 : gf < ga ? -0.3 : 0.05;
        for (const pid in s.rating) {
          const p = this.P[pid];
          const pl = s.played[pid];
          const mins = (pl.end != null ? pl.end : end) - pl.start;
          let r = s.rating[pid] + res + U.rand(-0.45, 0.45);
          if (["GK", "CB", "LB", "RB"].includes(p.pos)) {
            if (ga === 0 && mins >= 60) r += 0.55;
            r -= Math.max(0, ga - 1) * 0.12;
          }
          if (mins < 20) r = 6 + (r - 6) * 0.5;
          r = U.clamp(Math.round(r * 10) / 10, 3.5, 10);
          ratings[pid] = { r, mins, side: i, starter: pl.starter };
          if (r > best) { best = r; motm = pid; }
        }
      });
      const tot = this.stats.poss[0] + this.stats.poss[1] || 1;
      const st = this.stats;
      this.result = {
        hg: this.score[0], ag: this.score[1], pens: this.pens || null, winner: this.winner(),
        goals: this.sides.map((s) => s.goals),
        cards: this.events.filter((e) => e.type === "yellow" || e.type === "red").map((e) => ({ side: e.side, pid: e.pid, type: e.type, min: e.minLabel })),
        stats: {
          poss: [Math.round((st.poss[0] / tot) * 100), 100 - Math.round((st.poss[0] / tot) * 100)],
          shots: st.shots, sot: st.sot, xg: st.xg.map((x) => Math.round(x * 100) / 100), corners: st.corners, fouls: st.fouls, yc: st.yc, rc: st.rc,
        },
        ratings, motm,
        injuries: this.sides.map((s) => s.injured),
        fit: this.sides.map((s) => s.fit),
        sentOff: this.sides.map((s) => s.sentOff),
        yellowed: this.sides.map((s) => Object.keys(s.yellowed).filter((k) => !s.sentOff.includes(k))),
      };
    }
  }

  FC.MatchSim = MatchSim;
  FC.INJURIES = INJURIES;
})();
