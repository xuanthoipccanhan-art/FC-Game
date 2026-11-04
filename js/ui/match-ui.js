/* Trận đấu: trước trận, trực tiếp, sau trận; tổng kết mùa */
(function () {
  const FC = window.FC;
  const U = FC.util;
  const PL = FC.players;
  const G = FC.Game;
  const CP = FC.comp;
  const App = FC.App;
  const esc = U.esc;
  const h = App.h;

  const SPEEDS = [
    { label: "1×", ms: 650 }, { label: "2×", ms: 280 }, { label: "4×", ms: 110 }, { label: "8×", ms: 35 },
  ];

  App.on("advance", function () {
    const s = G.s;
    if (s.sacked) return this.showSacked();
    if (s.seasonEnded) return this.showSeasonEnd();
    const btn = document.getElementById("btn-advance");
    if (btn) btn.disabled = true;
    const r = G.advance();
    if (r.type === "match") {
      this.render();
      return this.preMatch(r.fixture);
    }
    G.save(this.slot);
    this.render();
    if (r.type === "sacked") return this.showSacked();
    if (r.type === "seasonEnd") return this.showSeasonEnd();
    if (r.ev) {
      const uf = G.userFixtureIn(r.ev);
      if (!uf) this.toast(`${CP.COMP[r.ev.comp].name} – ${esc(r.ev.label)} đã diễn ra. <a href="#" data-act="evResults" data-id="${r.ev.id}">Xem kết quả</a>`);
    }
    const unread = s.inbox.filter((m) => !m.read && (m.type === "offer" || m.type === "board" || m.type === "medical")).slice(0, 2);
    unread.forEach((m) => this.toast(`✉️ ${esc(m.subject)}`));
  });

  App.on("evResults", function (d) {
    const ev = G.s.calendar.find((c) => c.id === d.id);
    if (!ev) return;
    const body = `<table class="tbl"><tbody>${ev.fixtures.map((id) => {
      const f = G.s.fixtures[id];
      return `<tr class="click" data-act="fixture" data-id="${f.id}"><td class="right">${h.club(f.home, 20)}</td><td class="center b" style="width:110px">${f.result ? `${f.result.hg} - ${f.result.ag}${f.result.pens ? ` <span class="tiny muted">(${f.result.pens[0]}-${f.result.pens[1]})</span>` : ""}` : "vs"}</td><td>${h.club(f.away, 20)}</td></tr>`;
    }).join("")}</tbody></table>`;
    this.modal(`${CP.COMP[ev.comp].name} – ${esc(ev.label)}`, body, {});
  });

  // ===== Trước trận =====
  App.preMatch = function (f) {
    const s = G.s, u = G.user;
    const side = f.home === u.id ? 0 : 1;
    const opp = s.clubs[side === 0 ? f.away : f.home];
    const v = G.validateLineup(u);
    u.tactics.lineup = v.lineup;
    u.tactics.bench = v.bench;
    const slots = PL.FORMATIONS[u.tactics.formation];
    const oppXI = PL.autoLineup(G.squad(opp.id), opp.tactics.formation, { rotate: true });
    const oslots = PL.FORMATIONS[opp.tactics.formation];
    const t = CP.leagueTable(s);
    const formOf = (id) => (t.find((r) => r.id === id) || { form: [] }).form;
    const posOf = (id) => t.findIndex((r) => r.id === id) + 1;
    const strength = (ids, sl) => Math.round(ids.reduce((a, id, i) => a + (id ? PL.effective(s.players[id], sl[i][0]) : 0), 0) / 11);
    const xiList = (ids, sl, mine) => ids.map((id, i) => {
      const p = id ? s.players[id] : null;
      if (!p) return `<div class="list-item small">${h.pos(sl[i][0])} <span class="muted">Trống</span></div>`;
      const fam = PL.familiarity(p.pos, sl[i][0]);
      return `<div class="list-item small">${h.pos(sl[i][0])}<div class="grow">${mine ? h.pname(p) : esc(p.name)}${fam < 0.93 ? ' <span style="color:var(--gold)">⚠</span>' : ""}${mine ? `<div style="width:100px">${h.bar(p.fitness)}</div>` : ""}</div>${h.ovr(p.ovr)}</div>`;
    }).join("");
    const issues = G.lineupIssues(u);
    const home = s.clubs[f.home], away = s.clubs[f.away];
    const body = `<div class="vs"><div class="t">${FC.crest(home, 60)}${esc(home.name)}${home.league === "ENG" ? `<span class="tiny muted">Hạng ${posOf(home.id)}</span>${h.form(formOf(home.id))}` : ""}</div>
      <div class="mid">VS</div><div class="t">${FC.crest(away, 60)}${esc(away.name)}${away.league === "ENG" ? `<span class="tiny muted">Hạng ${posOf(away.id)}</span>${h.form(formOf(away.id))}` : ""}</div></div>
      <div class="center small muted" style="margin:8px 0 14px">${h.compTag(f.comp)} ${CP.roundLabel(f)} · ${U.fmtDate(f.date)} · ${f.neutral ? "Sân trung lập" : esc(home.stadium)}</div>
      <div class="grid g2">
        <div class="card" style="box-shadow:none"><h3>${FC.crest(u, 20)} Đội hình của bạn <span class="sp tag blue">${u.tactics.formation} · ${strength(v.lineup, slots)}</span></h3>${xiList(v.lineup, slots, true)}</div>
        <div class="card" style="box-shadow:none"><h3>${FC.crest(opp, 20)} Dự đoán đội hình <span class="sp tag orange">${opp.tactics.formation} · ${strength(oppXI.lineup, oslots)}</span></h3>${xiList(oppXI.lineup, oslots, false)}</div>
      </div>
      ${issues.length ? `<div class="small" style="color:var(--orange);margin-top:10px">⚠ ${issues.map(esc).join(" · ")}</div>` : ""}
      <div class="row wrap" style="margin-top:14px"><span class="b small">🗣️ Nói chuyện trước trận:</span>
        <div class="sel-pill" id="talk">${[["none", "Không"], ["calm", "Bình tĩnh"], ["motivate", "Tạo động lực"], ["demand", "Đòi hỏi cao"]].map(([k, l], i) => `<button data-k="${k}" class="${i === 0 ? "on" : ""}">${l}</button>`).join("")}</div></div>`;
    const m = this.modal("Trước trận đấu", body, {
      size: "wide", noClose: true,
      footer: `<button class="btn" id="pm-tac">📋 Chỉnh chiến thuật</button><button class="btn" id="pm-quick">⏩ Mô phỏng nhanh</button><button class="btn primary" id="pm-go">Vào trận ▶</button>`,
    });
    let talk = "none";
    m.querySelectorAll("#talk button").forEach((b) => (b.onclick = () => {
      m.querySelectorAll("#talk button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      talk = b.dataset.k;
    }));
    m.querySelector("#pm-tac").onclick = () => { this.closeModal(m); this.go("tactics"); this.toast("Chỉnh xong, bấm nút “Thi đấu” ở góc trên để vào trận."); };
    m.querySelector("#pm-quick").onclick = () => {
      this.closeModal(m);
      const sim = G.createUserSim(f);
      if (talk !== "none") sim.teamTalk(sim.userSide, talk);
      sim.runToEnd();
      this.postMatch(f, sim);
    };
    m.querySelector("#pm-go").onclick = () => {
      this.closeModal(m);
      const sim = G.createUserSim(f);
      if (talk !== "none") sim.teamTalk(sim.userSide, talk);
      this.liveMatch(f, sim);
    };
  };

  // ===== Trận đấu trực tiếp =====
  App.liveMatch = function (f, sim) {
    const s = G.s;
    const me = sim.userSide;
    const wrap = document.createElement("div");
    wrap.className = "match-screen";
    document.body.appendChild(wrap);
    document.body.style.overflow = "hidden";
    const ui = { speed: s.settings.speed != null ? s.settings.speed : 1, paused: false, timer: null, shown: 0, subSel: null, finished: false };
    const home = s.clubs[f.home], away = s.clubs[f.away];

    wrap.innerHTML = `<div class="scoreboard"><div class="sb">
        <div class="tm">${FC.crest(home, 40)}<span class="n">${esc(home.name)}</span></div>
        <div><div class="sc" id="m-sc">0 - 0</div><div class="clock" id="m-clock">0'</div></div>
        <div class="tm away"><span class="n">${esc(away.name)}</span>${FC.crest(away, 40)}</div></div>
        <div class="scorers"><div id="m-g0"></div><div id="m-g1"></div></div>
        <div class="center tiny muted" style="margin-top:4px">${h.compTag(f.comp)} ${CP.roundLabel(f)} · ${f.neutral ? "Sân trung lập" : esc(home.stadium)}</div></div>
      <div class="match-body">
        <div class="col">
          <div class="card"><div class="row wrap between">
            <div class="row speed">${SPEEDS.map((sp, i) => `<button class="btn sm ${ui.speed === i ? "on" : ""}" data-sp="${i}">${sp.label}</button>`).join("")}</div>
            <div class="row"><button class="btn sm" id="m-pause">⏸ Tạm dừng</button><button class="btn sm" id="m-subs">🔁 Thay người</button><button class="btn sm" id="m-tac">⚙️ Chỉ đạo</button><button class="btn sm" id="m-skip">⏭ Tới cuối</button></div>
          </div>
          <div class="momentum" style="margin-top:12px" title="Thế trận"><i id="m-mom" style="left:0;width:50%"></i></div>
          <div class="row between tiny muted"><span>${esc(home.short)}</span><span>Thế trận</span><span>${esc(away.short)}</span></div></div>
          <div class="card"><h3>🎙️ Diễn biến</h3><div class="feed" id="m-feed"></div></div>
        </div>
        <div class="col">
          <div class="card"><h3>📊 Thống kê</h3><div id="m-stats"></div></div>
          <div class="card"><h3>${FC.crest(G.user, 20)} Đội của bạn <span class="sp tiny muted" id="m-subcount"></span></h3><div style="max-width:340px;margin:0 auto"><div class="pitch" id="m-pitch" style="${App.shirtStyle(G.user)}"></div></div></div>
          <div class="card"><h3>Đang trên sân</h3><div id="m-players" class="small"></div></div>
        </div>
      </div>
      <div id="m-overlay"></div>`;

    const $ = (id) => wrap.querySelector("#" + id);
    const statRow = (lbl, a, b, fmt = (x) => x) => {
      const tot = a + b || 1;
      return `<div class="statrow"><b>${fmt(a)}</b><div><div class="lbl">${lbl}</div><div class="b2"><i style="width:${(a / tot) * 100}%"></i><i style="width:${(b / tot) * 100}%"></i></div></div><b class="right">${fmt(b)}</b></div>`;
    };

    const update = () => {
      $("m-sc").textContent = `${sim.score[0]} - ${sim.score[1]}`;
      const ph = sim.phase;
      $("m-clock").textContent = ph === "ht" ? "Nghỉ giữa hiệp" : ph === "ft" ? (sim.pens ? `Hết giờ · Luân lưu ${sim.pens[0]}-${sim.pens[1]}` : "Hết giờ") : ph === "pre" ? "Sắp bắt đầu" : sim.half === 3 ? `Hiệp phụ ${sim.minute}'` : sim.minLabel() + "'";
      [0, 1].forEach((i) => {
        $("m-g" + i).innerHTML = sim.sides[i].goals.map((g) => `⚽ ${esc(s.players[g.pid].name.split(" ").slice(-1)[0])} ${g.min}'${g.pen ? " (P)" : ""}`).join("<br>") +
          sim.sides[i].sentOff.map((pid) => `<br>🟥 ${esc(s.players[pid].name.split(" ").slice(-1)[0])}`).join("");
      });
      const evs = sim.events;
      const feed = $("m-feed");
      for (; ui.shown < evs.length; ui.shown++) {
        const e = evs[ui.shown];
        if (!e.text) continue;
        const ic = { goal: "⚽", yellow: "🟨", red: "🟥", injury: "🩹", sub: "🔁", save: "🧤", miss: "❌", penmiss: "❌", chance: "❗", half: "⏸", ft: "🏁" }[e.type] || "";
        const el = document.createElement("div");
        el.className = "ev " + e.type;
        el.innerHTML = `<span class="m">${e.minLabel}'</span><span>${ic} ${e.side != null ? `<b>${esc(sim.sides[e.side].club.short)}</b> · ` : ""}${esc(e.text)}</span>`;
        feed.prepend(el);
      }
      const st = sim.stats;
      const tot = st.poss[0] + st.poss[1] || 1;
      const p0 = Math.round((st.poss[0] / tot) * 100);
      $("m-stats").innerHTML = statRow("Kiểm soát bóng", p0, 100 - p0, (x) => x + "%") + statRow("Dứt điểm", st.shots[0], st.shots[1]) + statRow("Trúng đích", st.sot[0], st.sot[1]) +
        statRow("xG", st.xg[0], st.xg[1], (x) => x.toFixed(2)) + statRow("Phạt góc", st.corners[0], st.corners[1]) + statRow("Phạm lỗi", st.fouls[0], st.fouls[1]) + statRow("Thẻ vàng", st.yc[0], st.yc[1]);
      const mom = U.clamp(0.5 + (sim.momentum[0] - sim.momentum[1]) * 0.15 + (p0 - 50) / 200, 0.1, 0.9);
      $("m-mom").style.width = mom * 100 + "%";
      const my = sim.sides[me];
      $("m-subcount").textContent = `Thay người: ${my.subsUsed}/${my.maxSubs}`;
      $("m-pitch").innerHTML = `<div class="ln half"></div><div class="ln circle"></div><div class="ln box1"></div><div class="ln box2"></div>` + my.onPitch.map((sl) => {
        const p = s.players[sl.pid];
        const r = my.rating[sl.pid];
        return `<div class="slot" style="left:${sl.x}%;top:${sl.y}%"><div class="dot">${r.toFixed(1)}</div><div class="nm">${esc(p.name.split(" ").slice(-1)[0])}${sl.injured ? " 🩹" : ""}${my.yellowed[sl.pid] ? " 🟨" : ""}</div><div class="fitbar"><i style="width:${my.fit[sl.pid]}%;${my.fit[sl.pid] < 60 ? "background:#ffb347" : ""}"></i></div></div>`;
      }).join("");
      $("m-players").innerHTML = my.onPitch.map((sl) => {
        const p = s.players[sl.pid];
        return `<div class="row between" style="padding:2px 0">${h.pos(sl.pos)}<span class="grow">${esc(p.name)}${sl.injured ? ' <span class="tag red">Chấn thương</span>' : ""}</span><span class="muted">${Math.round(my.fit[sl.pid])}%</span><b style="width:34px;text-align:right">${my.rating[sl.pid].toFixed(1)}</b></div>`;
      }).join("");
      $("m-pause").textContent = ui.finished ? "🏁 Kết thúc" : ui.paused ? "▶ Tiếp tục" : "⏸ Tạm dừng";
    };

    const stop = () => { clearInterval(ui.timer); ui.timer = null; };
    const start = () => {
      stop();
      if (ui.finished) return;
      ui.timer = setInterval(tick, SPEEDS[ui.speed].ms);
    };
    const tick = () => {
      if (ui.paused) return;
      const r = sim.step();
      update();
      // Tự dừng khi cầu thủ của ta chấn thương mà không tự thay
      const hurt = sim.sides[me].onPitch.find((x) => x.injured && !x.notified);
      if (hurt) { hurt.notified = true; ui.paused = true; update(); App.toast(`🩹 ${esc(s.players[hurt.pid].name)} chấn thương – hãy thay người!`, true); openSubs(); }
      if (r === "ht") { ui.paused = true; update(); halfTime(); }
      if (r === "ft") { finish(); }
    };
    const finish = () => {
      stop();
      ui.finished = true;
      update();
      $("m-pause").onclick = () => { closeLive(); App.postMatch(f, sim); };
      $("m-pause").className = "btn sm primary";
      $("m-skip").disabled = true;
      $("m-subs").disabled = true;
      $("m-tac").disabled = true;
    };
    const closeLive = () => {
      stop();
      wrap.remove();
      document.body.style.overflow = "";
    };

    const overlay = (title, html, onClose) => {
      const m = App.modal(title, html, { size: "", onClose });
      return m;
    };

    const halfTime = () => {
      const m = overlay("Giờ nghỉ giữa hiệp", `<p class="center" style="font-size:26px;font-weight:900">${esc(home.short)} ${sim.score[0]} - ${sim.score[1]} ${esc(away.short)}</p>
        <p class="small muted center">Bạn muốn nói gì với các cầu thủ trong phòng thay đồ?</p>
        <div class="grid g3"><button class="btn" data-k="calm">😌 Bình tĩnh<br><span class="tiny muted">Giữ vững kế hoạch</span></button><button class="btn" data-k="motivate">🔥 Tạo động lực<br><span class="tiny muted">Khích lệ tinh thần</span></button><button class="btn" data-k="demand">😠 Đòi hỏi cao<br><span class="tiny muted">Rủi ro nhưng có thể hiệu quả</span></button></div>
        <div id="ht-msg" class="center small" style="margin-top:12px"></div>
        <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" id="ht-subs">🔁 Thay người</button><button class="btn" id="ht-tac">⚙️ Chỉ đạo</button><button class="btn primary" id="ht-go">Bắt đầu hiệp 2 ▶</button></div>`);
      let said = false;
      m.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => {
        if (said) return;
        said = true;
        m.querySelector("#ht-msg").textContent = sim.teamTalk(me, b.dataset.k);
        m.querySelectorAll("[data-k]").forEach((x) => (x.disabled = true));
      }));
      m.querySelector("#ht-subs").onclick = () => openSubs();
      m.querySelector("#ht-tac").onclick = () => openTac();
      m.querySelector("#ht-go").onclick = () => { App.closeModal(m); ui.paused = false; update(); };
    };

    const openSubs = () => {
      const wasPaused = ui.paused;
      ui.paused = true;
      update();
      const my = sim.sides[me];
      let outSel = null;
      const m = overlay(`Thay người (${my.subsUsed}/${my.maxSubs})`, `<div id="sb"></div>`, () => { ui.paused = wasPaused; update(); });
      const draw = () => {
        const on = my.onPitch.map((sl) => {
          const p = s.players[sl.pid];
          return `<div class="list-item ${outSel === sl.pid ? "sel" : ""}" data-out="${sl.pid}" style="cursor:pointer;padding:6px 8px;border-radius:8px">${h.pos(sl.pos)}<div class="grow"><b>${esc(p.name)}</b>${sl.injured ? ' <span class="tag red">Chấn thương</span>' : ""}${my.yellowed[sl.pid] ? " 🟨" : ""}<div style="width:90px">${h.bar(my.fit[sl.pid])}</div></div><b>${my.rating[sl.pid].toFixed(1)}</b></div>`;
        }).join("");
        const bench = my.bench.map((id) => {
          const p = s.players[id];
          return `<div class="list-item" data-in="${id}" style="cursor:pointer;padding:6px 8px;border-radius:8px">${h.pos(p.pos)}<div class="grow"><b>${esc(p.name)}</b><div class="tiny muted">Thể lực ${Math.round(p.fitness)}%</div></div>${h.ovr(p.ovr)}</div>`;
        }).join("");
        m.querySelector("#sb").innerHTML = my.subsUsed >= my.maxSubs ? `<div class="empty">Đã dùng hết lượt thay người.</div>` :
          `<p class="small muted">1) Chọn cầu thủ rời sân · 2) Chọn cầu thủ vào sân (vào đúng vị trí của người ra).</p><div class="grid g2 benchlist"><div><h4 style="margin:0 0 6px">Trên sân</h4>${on}</div><div><h4 style="margin:0 0 6px">Dự bị</h4>${bench || '<div class="muted small">Hết cầu thủ dự bị</div>'}</div></div>`;
        m.querySelectorAll("[data-out]").forEach((el) => (el.onclick = () => { outSel = el.dataset.out; draw(); }));
        m.querySelectorAll("[data-in]").forEach((el) => (el.onclick = () => {
          if (!outSel) return App.toast("Hãy chọn cầu thủ rời sân trước.", true);
          sim.doSub(my, outSel, el.dataset.in);
          outSel = null;
          update();
          m.querySelector(".modal-h h3").textContent = `Thay người (${my.subsUsed}/${my.maxSubs})`;
          draw();
        }));
      };
      draw();
    };

    const openTac = () => {
      const wasPaused = ui.paused;
      ui.paused = true;
      const t = sim.sides[me].tactics;
      const MENT = ["Rất phòng ngự", "Phòng ngự", "Cân bằng", "Tấn công", "Tấn công tổng lực"];
      const m = overlay("Chỉ đạo từ đường biên", `<div class="col">
        <div><div class="small muted">Tâm lý thi đấu</div><div class="sel-pill">${MENT.map((l, i) => `<button data-t="mentality" data-v="${i - 2}" class="${t.mentality === i - 2 ? "on" : ""}">${l}</button>`).join("")}</div></div>
        <div><div class="small muted">Pressing</div><div class="sel-pill">${["Thấp", "Vừa", "Cao"].map((l, i) => `<button data-t="pressing" data-v="${i}" class="${t.pressing === i ? "on" : ""}">${l}</button>`).join("")}</div></div>
        <div><div class="small muted">Nhịp độ</div><div class="sel-pill">${["Chậm", "Vừa", "Nhanh"].map((l, i) => `<button data-t="tempo" data-v="${i}" class="${t.tempo === i ? "on" : ""}">${l}</button>`).join("")}</div></div>
        <p class="tiny muted">Pressing & nhịp độ cao giúp chiếm thế trận nhưng làm cầu thủ mệt nhanh hơn. Tấn công tổng lực tăng sức tấn công nhưng hở sườn phòng ngự.</p></div>`, () => { ui.paused = wasPaused; update(); });
      m.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => {
        sim.setTactics(me, { [b.dataset.t]: +b.dataset.v });
        m.querySelectorAll(`[data-t="${b.dataset.t}"]`).forEach((x) => x.classList.toggle("on", x === b));
      }));
    };

    wrap.querySelectorAll("[data-sp]").forEach((b) => (b.onclick = () => {
      ui.speed = +b.dataset.sp;
      s.settings.speed = ui.speed;
      wrap.querySelectorAll("[data-sp]").forEach((x) => x.classList.toggle("on", x === b));
      start();
    }));
    $("m-pause").onclick = () => { ui.paused = !ui.paused; update(); };
    $("m-subs").onclick = () => openSubs();
    $("m-tac").onclick = () => openTac();
    $("m-skip").onclick = () => {
      App.closeAllModals();
      ui.paused = false;
      stop();
      let r;
      do { r = sim.step(); } while (r !== "ft");
      update();
      finish();
    };
    update();
    start();
  };

  // ===== Sau trận =====
  App.postMatch = function (f, sim) {
    const res = G.finishUserMatch(f, sim);
    G.save(this.slot);
    const s = G.s;
    const r = f.result;
    const me = f.home === s.userClub ? 0 : 1;
    const outcome = r.winner === me ? ["CHIẾN THẮNG!", "var(--win)"] : r.winner === 1 - me ? ["THẤT BẠI", "var(--loss)"] : ["HOÀ", "var(--muted)"];
    const ratings = Object.entries(r.ratings).filter(([pid]) => s.players[pid] && s.players[pid].clubId === s.userClub).sort((a, b) => b[1] - a[1]);
    const goals = (side) => r.goals[side].map((g) => `⚽ ${esc(s.players[g.pid].name)} ${g.min}'${g.pen ? " (P)" : ""}`).join("<br>");
    // Kết quả các trận khác cùng ngày
    const ev = res.ev;
    const others = ev ? ev.fixtures.filter((id) => id !== f.id).map((id) => s.fixtures[id]) : [];
    const body = `<div class="center" style="font-size:22px;font-weight:900;color:${outcome[1]};margin-bottom:8px">${outcome[0]}</div>
      <div class="vs"><div class="t">${FC.crest(s.clubs[f.home], 56)}${esc(s.clubs[f.home].name)}</div><div class="mid" style="color:var(--text);font-size:36px">${r.hg} - ${r.ag}</div><div class="t">${FC.crest(s.clubs[f.away], 56)}${esc(s.clubs[f.away].name)}</div></div>
      ${r.pens ? `<div class="center muted">Luân lưu: ${r.pens[0]} - ${r.pens[1]}</div>` : ""}
      <div class="grid g2 small" style="margin:10px 0"><div>${goals(0)}</div><div class="right">${goals(1)}</div></div>
      <div class="grid g2">
        <div class="card" style="box-shadow:none"><h3>⭐ Điểm cầu thủ</h3>${ratings.map(([pid, v]) => `<div class="row between small" style="padding:2px 0"><span>${esc(s.players[pid].name)}${pid === r.motm ? " ⭐" : ""}</span><b style="color:${v >= 7.5 ? "var(--accent)" : v < 6 ? "var(--red)" : "inherit"}">${v.toFixed(1)}</b></div>`).join("")}</div>
        <div class="card" style="box-shadow:none"><h3>📋 Kết quả khác</h3>${others.length ? others.map((o) => `<div class="row between small" style="padding:3px 0"><span>${esc(s.clubs[o.home].short)}</span><b>${o.result ? `${o.result.hg} - ${o.result.ag}` : "-"}</b><span>${esc(s.clubs[o.away].short)}</span></div>`).join("") : '<div class="muted small">Không có.</div>'}
          ${r.motm && s.players[r.motm] ? `<div class="small" style="margin-top:10px">Cầu thủ xuất sắc nhất: <b>${esc(s.players[r.motm].name)}</b></div>` : ""}
          <div class="small" style="margin-top:6px">Độ tín nhiệm ban lãnh đạo: <b>${Math.round(s.board.confidence)}%</b></div></div>
      </div>`;
    const m = this.modal("Sau trận đấu", body, { size: "wide", footer: `<button class="btn" id="pmx-det">Chi tiết thống kê</button><button class="btn primary" data-close>Tiếp tục</button>`, onClose: () => {
      this.render();
      if (res.type === "seasonEnd") this.showSeasonEnd();
      else if (s.sacked) this.showSacked();
    } });
    m.querySelector("#pmx-det").onclick = () => this.showFixture(f.id);
  };

  // ===== Tổng kết mùa =====
  App.showSeasonEnd = function () {
    const s = G.s;
    const x = s.lastSummary;
    if (!x) return;
    if (s.sacked) return this.showSacked();
    const c = (id) => (id ? h.clubStatic(s.clubs[id], 22) : "—");
    const body = `<div class="center"><div class="tiny muted">MÙA GIẢI ${x.season}</div><div style="font-size:42px;font-weight:900">Hạng ${x.pos}</div>
        <div>${x.met ? '<span class="tag green">Đạt mục tiêu</span>' : '<span class="tag red">Không đạt mục tiêu</span>'} <span class="small muted">(${esc(x.targetText)})</span></div></div>
      <div class="grid g3" style="margin-top:16px">
        <div class="card" style="box-shadow:none"><h3>🏆 Nhà vô địch</h3><div class="col small"><div>Ngoại hạng Anh: ${c(x.champion)}</div><div>Cúp Quốc gia: ${c(x.cupWinner)}</div><div>Cúp C1: ${c(x.uclWinner)}</div></div></div>
        <div class="card" style="box-shadow:none"><h3>🎖️ Giải thưởng cá nhân</h3><div class="col small">
          <div>Vua phá lưới: ${x.topScorer ? `<b>${esc(x.topScorer.name)}</b> (${x.topScorer.goals} bàn)` : "—"}</div>
          <div>Cầu thủ hay nhất: ${x.potm ? `<b>${esc(x.potm.name)}</b> (${x.potm.r})` : "—"}</div>
          <div>Cầu thủ trẻ hay nhất: ${x.ypotm ? `<b>${esc(x.ypotm.name)}</b> (${x.ypotm.r})` : "—"}</div></div></div>
        <div class="card" style="box-shadow:none"><h3>📋 Thành tích của bạn</h3><div class="kv small"><span class="k">Cúp Quốc gia</span><span class="v">${esc(x.cupRun)}</span><span class="k">Cúp C1</span><span class="v">${esc(x.uclRun)}</span>
          <span class="k">Thu / Chi</span><span class="v">${U.money(x.income)} / ${U.money(x.expense)}</span><span class="k">Tín nhiệm</span><span class="v">${Math.round(s.board.confidence)}%</span></div></div>
      </div>
      <p class="small muted center" style="margin-top:12px">Khi bắt đầu mùa mới: cầu thủ thêm 1 tuổi, một số giải nghệ, hợp đồng hết hạn sẽ rời CLB, top 4 giành vé dự Cúp C1, ban lãnh đạo cấp ngân sách mới.</p>`;
    const m = this.modal("Tổng kết mùa giải", body, { size: "wide", noClose: true, footer: `<button class="btn primary" id="ns-go">Bắt đầu mùa ${G.seasonLabel(s.season + 1)} ▶</button>` });
    m.querySelector("#ns-go").onclick = () => {
      this.closeModal(m);
      G.startNewSeason();
      G.save(this.slot);
      this.go("home");
      this.toast(`Chào mừng mùa giải ${G.seasonLabel()}!`);
    };
  };

  App.showSacked = function () {
    const s = G.s;
    const offers = G.jobOffers();
    const body = `<p>Ban lãnh đạo <b>${esc(G.user.name)}</b> đã quyết định sa thải bạn vì thành tích không đạt kỳ vọng.</p>
      <p class="small muted">Một số CLB đang quan tâm tới bạn:</p>
      <div class="col">${offers.map((c) => `<button class="club-pick" data-job="${c.id}">${FC.crest(c, 40)}<div class="grow"><div class="b">${esc(c.name)}</div>${h.stars(c.rep)}</div></button>`).join("")}</div>`;
    const m = this.modal("Bạn đã bị sa thải", body, { noClose: true, footer: `<button class="btn" id="sk-quit">Về menu chính</button>` });
    m.querySelectorAll("[data-job]").forEach((b) => (b.onclick = () => {
      G.takeJob(b.dataset.job);
      if (s.seasonEnded) G.startNewSeason();
      G.save(this.slot);
      this.closeModal(m);
      this.go("home");
      this.toast(`Bạn là HLV mới của ${esc(G.user.name)}!`);
    }));
    m.querySelector("#sk-quit").onclick = () => { this.closeModal(m); G.s = null; this.st.start = null; this.render(); };
  };
})();
