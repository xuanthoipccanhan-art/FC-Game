/* Các màn hình quản lý */
(function () {
  const FC = window.FC;
  const U = FC.util;
  const PL = FC.players;
  const G = FC.Game;
  const CP = FC.comp;
  const EV = FC.events;
  const App = FC.App;
  const esc = U.esc;
  const h = App.h;

  function tabs(view, list) {
    const cur = App.tabs[view] || list[0][0];
    return `<div class="tabs">${list.map(([k, l]) => `<button class="tab ${cur === k ? "on" : ""}" data-act="tab" data-id="${k}">${l}</button>`).join("")}</div>`;
  }
  const curTab = (view, def) => App.tabs[view] || def;

  function leagueSelect(act, cur) {
    return `<select data-change="${act}">${FC.COUNTRY_ORDER.map((ct) => Object.entries(FC.LEAGUES).filter(([, L]) => L.country === ct).map(([lid, L]) => `<option value="${lid}" ${cur === lid ? "selected" : ""}>${FC.flag(ct)} ${esc(L.name)}</option>`).join("")).join("")}</select>`;
  }

  function zoneOf(lid, i, n) {
    const L = FC.LEAGUES[lid];
    const cont = FC.CONTINENTAL.ucl.slots[lid] || FC.CONTINENTAL.lib.slots[lid] || 0;
    if (L.tier === 1) {
      if (i < cont) return "zone-ucl";
      if (L.relegate && i >= n - L.relegate) return "zone-rel";
      if (L.barrage && i === n - L.relegate - 1) return "zone-eur";
    } else {
      if (i < L.promote) return "zone-ucl";
      if (L.playoff && i < 6) return "zone-eur";
    }
    return "";
  }
  function legend(lid) {
    const L = FC.LEAGUES[lid];
    const cont = FC.CONTINENTAL.ucl.slots[lid] ? "Cúp C1" : FC.CONTINENTAL.lib.slots[lid] ? "Copa Libertadores" : null;
    if (L.tier === 2) return `<span style="color:var(--accent2)">▌</span> Lên hạng trực tiếp &nbsp; ${L.playoff ? '<span style="color:var(--orange)">▌</span> Play-off lên hạng' : ""}`;
    return `${cont ? `<span style="color:var(--accent2)">▌</span> Dự ${cont} &nbsp; ` : ""}${L.relegate ? `<span style="color:var(--red)">▌</span> Xuống hạng &nbsp; ` : ""}${L.barrage ? '<span style="color:var(--orange)">▌</span> Play-off trụ hạng' : ""}${L.closed ? esc(L.closed) : ""}`;
  }

  function leagueTableHtml(lid, compact) {
    const t = CP.leagueTable(G.s, lid);
    const u = G.s.userClub;
    let rows = t.map((r, i) => ({ r, i }));
    if (compact) {
      const me = Math.max(0, t.findIndex((r) => r.id === u));
      const lo = U.clamp(me - 3, 0, Math.max(0, t.length - 7));
      rows = rows.slice(lo, lo + 7);
    }
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>CLB</th><th class="num">Tr</th>${compact ? "" : '<th class="num">T</th><th class="num">H</th><th class="num">B</th><th class="num">BT</th><th class="num">BB</th>'}<th class="num">HS</th><th class="num">Đ</th>${compact ? "" : "<th>Phong độ</th>"}</tr></thead><tbody>
      ${rows.map(({ r, i }) => `<tr class="${r.id === u ? "me" : ""}"><td class="${zoneOf(lid, i, t.length)}">${i + 1}</td><td>${h.club(r.id, 20, compact)}</td><td class="num">${r.p}</td>
        ${compact ? "" : `<td class="num">${r.w}</td><td class="num">${r.d}</td><td class="num">${r.l}</td><td class="num">${r.gf}</td><td class="num">${r.ga}</td>`}
        <td class="num">${r.gf - r.ga > 0 ? "+" : ""}${r.gf - r.ga}</td><td class="num b">${r.pts}</td>${compact ? "" : `<td>${h.form(r.form)}</td>`}</tr>`).join("")}</tbody></table></div>
      ${compact ? "" : `<div class="tiny muted" style="margin-top:8px">${legend(lid)}</div>`}`;
  }

  function fixtureRow(f, forClub) {
    const opp = f.home === forClub ? f.away : f.home;
    const ha = f.neutral ? "TL" : f.home === forClub ? "N" : "K";
    return `<tr class="${f.result ? "click" : ""}" ${f.result ? `data-act="fixture" data-id="${f.id}"` : ""}>
      <td class="nowrap">${U.fmtDate(f.date)}</td><td>${h.compTag(f)} <span class="small muted">${CP.roundLabel(G.s, f)}</span></td>
      <td><span class="tag">${ha}</span></td><td>${h.club(opp, 20)}</td><td class="num">${h.score(f, forClub)}</td></tr>`;
  }

  const NEWS_ICON = { rumour: "🗞️", transfer: "✍️", drama: "🔥", manager: "👔", award: "🏆", intl: "🌍", youth: "🌱", staff: "🧑‍💼" };
  function newsList(items, max = 50) {
    return items.slice(0, max).map((n) => `<div class="list-item" ${n.pid && G.s.players[n.pid] ? `data-act="player" data-id="${n.pid}" style="cursor:pointer"` : ""}><span>${NEWS_ICON[n.cat] || "📰"}</span><div class="grow"><div class="${n.big ? "b" : ""}">${esc(n.text)}</div><div class="tiny muted">${U.fmtDate(n.date, false)}</div></div></div>`).join("") || '<div class="empty">Chưa có tin.</div>';
  }

  // ========== TỔNG QUAN ==========
  App.screens.home = function () {
    const s = G.s, u = G.user;
    const nf = G.nextUserFixture();
    const recent = G.userFixtures().filter((f) => f.result).slice(-5).reverse();
    const squad = G.squad(u.id);
    const inj = squad.filter((p) => p.injury > 0 || p.suspended > 0);
    const pos = CP.position(s, u.id);
    let next = `<div class="empty">Không còn trận đấu nào trong mùa giải.</div>`;
    if (nf) {
      const home = s.clubs[nf.home], away = s.clubs[nf.away];
      next = `<div class="vs"><div class="t">${FC.crest(home, 64)}<span>${esc(home.name)}</span></div><div class="mid">VS</div><div class="t">${FC.crest(away, 64)}<span>${esc(away.name)}</span></div></div>
        <div class="center" style="margin-top:10px">${h.compTag(nf)} ${CP.roundLabel(s, nf)} · ${U.fmtDate(nf.date)}<br><span class="small muted">${nf.neutral ? "Sân trung lập" : esc(home.stadium)}</span></div>`;
    }
    const conf = s.board.confidence;
    const um = G.userMgr;
    return `<h2 class="title">Tổng quan <span class="tag">${h.league(u.league)}</span></h2>
      ${s.pendingEvents.length ? `<div class="card" style="margin-bottom:14px;border-color:var(--gold)"><div class="row between"><b>⚠️ Có ${s.pendingEvents.length} sự kiện cần bạn quyết định</b><button class="btn gold" data-act="openEvents">Xử lý ngay</button></div></div>` : ""}
      <div class="grid g3">
        <div class="card nextmatch"><h3>⚽ Trận đấu tiếp theo</h3>${next}</div>
        <div class="card"><h3>🏆 ${esc(FC.LEAGUES[u.league].short)} <span class="sp tag blue">Hạng ${pos}</span></h3>${leagueTableHtml(u.league, true)}
          <button class="btn sm ghost" style="margin-top:8px" data-act="nav" data-id="tables">Xem bảng đầy đủ →</button></div>
        <div class="card"><h3>🏛️ Ban lãnh đạo & CĐV</h3>
          <div class="small muted">Mục tiêu mùa giải</div><div class="b" style="margin-bottom:10px">${esc(s.board.targetText)}</div>
          <div class="small muted">Độ tín nhiệm: <b style="color:var(--text)">${Math.round(conf)}%</b></div>
          <div class="conf" style="margin:8px 0 10px"><i style="left:${conf}%"></i></div>
          <div class="small muted">Tâm trạng CĐV: <b style="color:var(--text)">${Math.round(s.fans)}%</b></div>${h.bar(s.fans)}
          <div class="kv small" style="margin-top:10px"><span class="k">Ngân sách chuyển nhượng</span><span class="v">${U.money(u.transferBudget)}</span>
          <span class="k">Quỹ lương</span><span class="v">${U.wage(G.wageBill(u.id))} / ${U.wage(u.wageBudget)}</span>
          <span class="k">Triết lý (thấm nhuần)</span><span class="v">${esc(FC.PHILOSOPHIES[um.phil].short)} · ${Math.round(um.fam * 100)}%</span></div></div>
      </div>
      <div class="grid g3" style="margin-top:14px">
        <div class="card"><h3>📅 Kết quả gần đây</h3>${recent.length ? `<table class="tbl"><tbody>${recent.map((f) => fixtureRow(f, u.id)).join("")}</tbody></table>` : '<div class="empty">Chưa có trận nào.</div>'}</div>
        <div class="card"><h3>🩹 Tình trạng đội</h3>${inj.length ? inj.map((p) => `<div class="list-item">${h.pos(p.pos)}<div class="grow">${h.pname(p)}<div class="tiny muted">${p.injury > 0 ? esc(p.injuryName) + ` · ~${Math.ceil(p.injury / 7)} tuần` : `Treo giò ${p.suspended} trận`}</div></div></div>`).join("") : '<div class="empty">Toàn đội khoẻ mạnh, sẵn sàng thi đấu.</div>'}
          <div class="small muted" style="margin-top:8px">Thể lực TB: <b>${Math.round(squad.reduce((a, p) => a + p.fitness, 0) / squad.length)}%</b> · Tinh thần TB: <b>${Math.round(squad.reduce((a, p) => a + p.morale, 0) / squad.length)}</b></div></div>
        <div class="card"><h3>📰 Tin nóng <button class="btn sm ghost sp" data-act="nav" data-id="news">Tất cả</button></h3>${newsList(s.news, 6)}</div>
      </div>`;
  };
  App.on("openEvents", function () { this.checkEvents(); });

  // ========== ĐỘI HÌNH ==========
  App.screens.squad = function () {
    const u = G.user;
    const tab = curTab("squad", "first");
    const st = App.st.squad || (App.st.squad = { sort: "pos", dir: 1 });
    const t = u.tactics;
    const starters = new Set(t.lineup || []);
    const bench = new Set(t.bench || []);
    let squad = tab === "first" ? G.squad(u.id) : tab === "res" ? G.reserves(u.id) : G.loanedOut(u.id);
    const keyFn = {
      pos: (p) => PL.POS_ORDER[p.pos] * 100 - p.ovr, name: (p) => p.name, age: (p) => p.age, ovr: (p) => -p.ovr, pot: (p) => -p.pot,
      value: (p) => -p.value, wage: (p) => -p.wage, fit: (p) => -p.fitness, morale: (p) => -p.morale, apps: (p) => -p.stats.apps,
      goals: (p) => -p.stats.goals, rating: (p) => -PL.avgRating(p), contract: (p) => p.contract,
    }[st.sort];
    squad.sort((a, b) => { const x = keyFn(a), y = keyFn(b); return (x < y ? -1 : x > y ? 1 : 0) * st.dir; });
    const th = (k, l, num) => `<th class="sort ${num ? "num" : ""}" data-act="sortSquad" data-id="${k}">${l}${st.sort === k ? (st.dir === 1 ? " ▾" : " ▴") : ""}</th>`;
    const nF = G.squad(u.id).length, nR = G.reserves(u.id).length, nL = G.loanedOut(u.id).length;
    const note = tab === "res" ? "Đội trẻ/dự bị (U21): cầu thủ tập luyện & thi đấu giải trẻ, không được xếp đá chính. Cầu thủ trẻ phát triển tốt hơn nhờ HLV đội trẻ; cầu thủ lớn tuổi sẽ mất tinh thần." :
      tab === "loan" ? "Cầu thủ đang được CLB khác mượn. Họ sẽ trở về cuối mùa (trừ khi bị mua đứt)." : "XP = Xuất phát, DB = Dự bị.";
    return `<h2 class="title">Đội hình</h2>${tabs("squad", [["first", `Đội một (${nF})`], ["res", `Đội trẻ U21 (${nR})`], ["loan", `Đang cho mượn (${nL})`]])}
      <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th></th>${th("pos", "VT")}${th("name", "Cầu thủ")}${th("age", "Tuổi", 1)}${th("ovr", "OVR", 1)}${th("pot", "TN", 1)}${th("fit", "Thể lực")}${th("morale", "Tinh thần")}${th("apps", "Trận", 1)}${th("goals", "BT", 1)}<th class="num">KT</th>${th("rating", "Điểm", 1)}${th("value", "Giá trị", 1)}${th("wage", "Lương", 1)}${th("contract", "HĐ", 1)}<th></th></tr></thead><tbody>
      ${squad.map((p) => `<tr class="click" data-act="player" data-id="${p.id}">
        <td>${tab === "loan" ? h.clubStatic(G.s.clubs[p.clubId], 18, true) : starters.has(p.id) ? '<span class="tag green">XP</span>' : bench.has(p.id) ? '<span class="tag">DB</span>' : ""}</td>
        <td>${h.pos(p.pos)}</td><td>${h.flag(p.nat)} <b>${esc(p.name)}</b> <span class="tiny muted">#${p.num}</span></td><td class="num">${p.age}</td>
        <td class="num">${h.ovr(p.ovr)}</td><td class="num muted">${p.pot}</td><td style="min-width:80px">${h.bar(p.fitness)}</td><td>${h.morale(p.morale)}</td>
        <td class="num">${p.stats.apps}</td><td class="num">${p.stats.goals}</td><td class="num">${p.stats.assists}</td><td class="num">${PL.avgRating(p) ? PL.avgRating(p).toFixed(2) : "—"}</td>
        <td class="num">${U.money(p.value)}</td><td class="num small">${U.wage(p.wage)}</td><td class="num">${p.contract}n</td><td>${h.status(p)}</td></tr>`).join("") || '<tr><td colspan="16" class="empty">Không có cầu thủ.</td></tr>'}
      </tbody></table></div>
      <div class="small muted" style="margin-top:10px">${note} Tổng lương phải trả: <b>${U.wage(G.wageBill(u.id))}</b> / quỹ ${U.wage(u.wageBudget)}.</div></div>`;
  };
  App.on("sortSquad", function (d) {
    const st = App.st.squad;
    if (st.sort === d.id) st.dir *= -1; else { st.sort = d.id; st.dir = 1; }
    this.render();
  });
  App.on("toggleRes", function (d) {
    const p = G.s.players[d.id];
    if (!p.res && G.squad(G.s.userClub).length <= 16) return this.toast("Đội một cần tối thiểu 16 cầu thủ.", true);
    G.setReserve(d.id, !p.res);
    this.closeAllModals();
    this.toast(p.res ? `${esc(p.name)} xuống tập luyện cùng đội trẻ.` : `${esc(p.name)} được đôn lên đội một.`);
    this.render();
  });

  // ========== CHIẾN THUẬT ==========
  const MENT = ["Rất phòng ngự", "Phòng ngự", "Cân bằng", "Tấn công", "Tấn công tổng lực"];
  const PRESS = ["Thấp", "Vừa", "Cao"];
  const TEMPO = ["Chậm", "Vừa", "Nhanh"];
  function shirtStyle(club) {
    const c1 = club.colors[0];
    const x = c1.replace("#", "");
    const l = (0.299 * parseInt(x.substr(0, 2), 16) + 0.587 * parseInt(x.substr(2, 2), 16) + 0.114 * parseInt(x.substr(4, 2), 16)) / 255;
    return `--shirt:${c1};--shirt-text:${l > 0.6 ? "#111" : "#fff"}`;
  }
  App.shirtStyle = shirtStyle;

  App.screens.tactics = function () {
    const u = G.user;
    const t = u.tactics;
    if (!t.lineup || t.lineup.length !== PL.FORMATIONS[t.formation].length) G.autoPick(u);
    const st = App.st.tac || (App.st.tac = { sel: null });
    const slots = PL.FORMATIONS[t.formation];
    const used = new Set(t.lineup.filter(Boolean));
    const benchIds = (t.bench || []).filter((id) => !used.has(id) && u.players.includes(id) && !G.s.players[id].res);
    const reserves = G.squad(u.id).filter((p) => !used.has(p.id) && !benchIds.includes(p.id)).sort((a, b) => PL.POS_ORDER[a.pos] - PL.POS_ORDER[b.pos] || b.ovr - a.ovr);
    const issues = G.lineupIssues(u);
    const um = G.userMgr;
    const phil = FC.PHILOSOPHIES[um.phil];
    let att = 0, aw = 0, mid = 0, mw = 0, def = 0, dw = 0;
    t.lineup.forEach((id, i) => {
      if (!id) return;
      const sp = slots[i][0];
      if (sp === "GK") return;
      const e = PL.effective(G.s.players[id], sp);
      const w = PL.LINE_W[sp];
      def += e * w[0]; dw += w[0]; mid += e * w[1]; mw += w[1]; att += e * w[2]; aw += w[2];
    });
    const pitch = `<div class="pitch" style="${shirtStyle(u)}"><div class="ln half"></div><div class="ln circle"></div><div class="ln box1"></div><div class="ln box2"></div>
      ${slots.map((sl, i) => {
        const p = t.lineup[i] ? G.s.players[t.lineup[i]] : null;
        const fam = p ? PL.familiarity(p.pos, sl[0]) : 1;
        const selected = st.sel && st.sel.type === "slot" && st.sel.i === i;
        return `<div class="slot ${p ? "" : "empty"} ${selected ? "sel" : ""}" style="left:${sl[1]}%;top:${sl[2]}%" data-act="tacSlot" data-id="${i}">
          <div class="dot">${p ? p.ovr : "+"}</div>
          <div class="nm">${p ? esc(p.name.split(" ").slice(-1)[0]) : "Trống"}</div>
          ${p ? `<div class="fitbar"><i style="width:${p.fitness}%;${p.fitness < 70 ? "background:#ffb347" : ""}"></i></div>` : ""}
          <div class="sp ${fam < 0.93 ? "warn" : ""}">${sl[0]}${p && fam < 0.93 ? " ⚠" : ""}${p && (p.injury > 0 || p.suspended > 0) ? " ⛔" : ""}</div></div>`;
      }).join("")}</div>`;
    const plist = (arr, kind) => arr.map((p) => {
      const selected = st.sel && st.sel.type === kind && st.sel.id === p.id;
      return `<div class="list-item ${selected ? "sel" : ""}" data-act="tacPick" data-kind="${kind}" data-id="${p.id}">${h.pos(p.pos)}<div class="grow"><div class="b small">${esc(p.name)} ${h.status(p)}</div><div style="width:90px">${h.bar(p.fitness)}</div></div>${h.ovr(p.ovr)}</div>`;
    }).join("");
    const slider = (key, labels, val) => `<div><div class="row between small"><span class="muted">${{ mentality: "Tâm lý", pressing: "Pressing", tempo: "Nhịp độ" }[key]}</span><b>${labels[key === "mentality" ? val + 2 : val]}</b></div>
      <input type="range" min="${key === "mentality" ? -2 : 0}" max="2" step="1" value="${val}" data-change="tacSet" data-id="${key}"></div>`;
    return `<h2 class="title">Chiến thuật</h2>
      <div class="grid" style="grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)">
        <div class="card">
          <div class="row wrap" style="margin-bottom:12px">
            <select data-change="formation">${Object.keys(PL.FORMATIONS).map((f) => `<option ${f === t.formation ? "selected" : ""}>${f}</option>`).join("")}</select>
            <button class="btn sm" data-act="autoPick">🤖 Tự chọn đội hình</button>
            <button class="btn sm" data-act="autoPickRotate">🔄 Xoay tua (ưu tiên thể lực)</button>
          </div>
          <div style="max-width:480px;margin:0 auto">${pitch}</div>
          <p class="tiny muted center">Bấm vào một cầu thủ trên sân rồi chọn cầu thủ khác (trên sân, dự bị hoặc dự trữ) để hoán đổi. ⚠ = sai vị trí sở trường.</p>
        </div>
        <div class="col">
          <div class="card"><h3>🧠 Triết lý bóng đá</h3>
            <select data-change="setPhil" style="width:100%">${Object.entries(FC.PHILOSOPHIES).map(([k, ph]) => `<option value="${k}" ${um.phil === k ? "selected" : ""}>${esc(ph.name)}</option>`).join("")}</select>
            <p class="small muted" style="margin:8px 0">${esc(phil.desc)}</p>
            <div class="small">Mức độ thấm nhuần: <b>${Math.round(um.fam * 100)}%</b></div>${h.bar(um.fam * 100)}
            <p class="tiny muted">Đổi triết lý sẽ đưa mức thấm nhuần về 30%. Trợ lý giỏi & trọng tâm tập "Chiến thuật" giúp tăng nhanh hơn. Hiệu quả triết lý tỉ lệ với mức thấm nhuần.</p>
          </div>
          <div class="card"><h3>⚙️ Chỉ đạo</h3><div class="col">
            ${slider("mentality", MENT, t.mentality)}${slider("pressing", PRESS, t.pressing)}${slider("tempo", TEMPO, t.tempo)}
            <div class="grid g3 center small" style="margin-top:6px">
              <div><div class="muted tiny">Tấn công</div><div class="stat-big">${aw ? Math.round(att / aw) : 0}</div></div>
              <div><div class="muted tiny">Tuyến giữa</div><div class="stat-big">${mw ? Math.round(mid / mw) : 0}</div></div>
              <div><div class="muted tiny">Phòng ngự</div><div class="stat-big">${dw ? Math.round(def / dw) : 0}</div></div>
            </div>
            <label class="row small"><input type="checkbox" ${G.s.settings.autoSub ? "checked" : ""} data-change="autoSub"> Trợ lý tự thay người trong trận</label>
            ${issues.length ? `<div class="small" style="color:var(--orange)">⚠ ${issues.map(esc).join("<br>⚠ ")}</div>` : '<div class="small" style="color:var(--accent)">✔ Đội hình hợp lệ</div>'}
          </div></div>
          <div class="card benchlist"><h3>🪑 Dự bị (${benchIds.length}/9)</h3>${plist(benchIds.map((id) => G.s.players[id]), "bench") || '<div class="empty">Trống</div>'}</div>
          <div class="card benchlist"><h3>📦 Dự trữ</h3>${plist(reserves, "res") || '<div class="empty">Trống</div>'}</div>
        </div>
      </div>`;
  };
  App.on("setPhil", function (d, el) {
    const old = G.userMgr.phil;
    if (old === el.value) return;
    this.confirm("Đổi triết lý", `Chuyển sang <b>${esc(FC.PHILOSOPHIES[el.value].name)}</b>? Mức thấm nhuần sẽ giảm về 30%.`, "Đổi", () => { G.setPhilosophy(el.value); this.render(); });
    this.render();
  });
  App.on("formation", function (d, el) {
    const u = G.user;
    const old = u.tactics.lineup || [];
    u.tactics.formation = el.value;
    const slots = PL.FORMATIONS[el.value];
    const pool = old.filter(Boolean).map((id) => G.s.players[id]).filter(Boolean);
    const lineup = new Array(slots.length).fill(null);
    const used = new Set();
    slots.forEach((sl, i) => {
      let best = null, bv = -1;
      for (const p of pool) { if (used.has(p.id)) continue; const v = PL.familiarity(p.pos, sl[0]) * 100 + p.ovr / 100; if (v > bv) { bv = v; best = p; } }
      if (best) { lineup[i] = best.id; used.add(best.id); }
    });
    u.tactics.lineup = lineup;
    const v = G.validateLineup(u);
    u.tactics.lineup = v.lineup; u.tactics.bench = v.bench;
    App.st.tac.sel = null;
    this.render();
  });
  App.on("tacSet", function (d, el) { G.user.tactics[d.id] = +el.value; this.render(); });
  App.on("autoSub", function (d, el) { G.s.settings.autoSub = el.checked; });
  App.on("autoPick", function () { G.autoPick(G.user); App.st.tac.sel = null; this.render(); this.toast("Trợ lý đã chọn đội hình mạnh nhất."); });
  App.on("autoPickRotate", function () {
    const u = G.user;
    const r = PL.autoLineup(G.squad(u.id), u.tactics.formation, { rotate: true });
    u.tactics.lineup = r.lineup; u.tactics.bench = r.bench;
    App.st.tac.sel = null;
    this.render();
    this.toast("Đã xoay tua, ưu tiên cầu thủ sung sức.");
  });
  function tacSwap(a, b) {
    const t = G.user.tactics;
    const get = (x) => (x.type === "slot" ? t.lineup[x.i] : x.id);
    const set = (x, id) => {
      if (x.type === "slot") t.lineup[x.i] = id;
      else if (x.type === "bench") { const k = t.bench.indexOf(x.id); if (k >= 0) { if (id) t.bench[k] = id; else t.bench.splice(k, 1); } }
    };
    const ia = get(a), ib = get(b);
    if (a.type === "res" && b.type === "res") return;
    if (b.type === "res") { set(a, ib); return; }
    if (a.type === "res") { set(b, ia); return; }
    set(a, ib); set(b, ia);
  }
  App.on("tacSlot", function (d) {
    const st = App.st.tac;
    const cur = { type: "slot", i: +d.id };
    if (!st.sel) st.sel = cur;
    else { if (!(st.sel.type === "slot" && st.sel.i === cur.i)) tacSwap(st.sel, cur); st.sel = null; }
    this.render();
  });
  App.on("tacPick", function (d) {
    const st = App.st.tac;
    const cur = { type: d.kind, id: d.id };
    const t = G.user.tactics;
    if (!st.sel) st.sel = cur;
    else {
      if (st.sel.id !== cur.id) {
        if (cur.type === "res" && st.sel.type === "bench") { const k = t.bench.indexOf(st.sel.id); if (k >= 0) t.bench[k] = cur.id; }
        else if (st.sel.type === "res" && cur.type === "bench") { const k = t.bench.indexOf(cur.id); if (k >= 0) t.bench[k] = st.sel.id; }
        else if (st.sel.type === "res" && cur.type === "res") { if (t.bench.length < 9) t.bench.push(cur.id); }
        else tacSwap(st.sel, cur);
      }
      st.sel = null;
    }
    this.render();
  });

  // ========== LỊCH ĐẤU ==========
  App.screens.fixtures = function () {
    const tab = curTab("fixtures", "mine");
    const u = G.user;
    let body;
    if (tab === "mine") {
      const fx = G.userFixtures();
      body = `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ngày</th><th>Giải</th><th></th><th>Đối thủ</th><th class="num">Kết quả</th></tr></thead><tbody>${fx.map((f) => fixtureRow(f, u.id)).join("")}</tbody></table></div></div>`;
    } else {
      const st = App.st.fxr || (App.st.fxr = { round: null, league: u.league });
      const evs = G.s.calendar.filter((c) => c.comp === "league" && c.key === st.league);
      const doneR = evs.filter((e) => e.done).length;
      const r = U.clamp(st.round || Math.max(1, doneR), 1, evs.length);
      const ev = evs[r - 1];
      body = `<div class="card"><div class="row wrap" style="margin-bottom:10px">${leagueSelect("fxLeague", st.league)}<button class="btn sm" data-act="fxRound" data-id="${Math.max(1, r - 1)}">◀</button><b>Vòng ${r}/${evs.length}</b> <span class="muted small">${U.fmtDate(ev.date)}</span><button class="btn sm" data-act="fxRound" data-id="${Math.min(evs.length, r + 1)}">▶</button></div>
        <table class="tbl"><tbody>${ev.fixtures.map((id) => { const f = G.s.fixtures[id]; return `<tr class="${f.result ? "click" : ""} ${f.home === u.id || f.away === u.id ? "me" : ""}" ${f.result ? `data-act="fixture" data-id="${f.id}"` : ""}><td class="right">${h.club(f.home, 20)}</td><td class="center b" style="width:90px">${f.result ? `${f.result.hg} - ${f.result.ag}` : '<span class="muted">vs</span>'}</td><td>${h.club(f.away, 20)}</td></tr>`; }).join("")}</tbody></table></div>`;
    }
    return `<h2 class="title">Lịch thi đấu</h2>${tabs("fixtures", [["mine", "Đội của tôi"], ["league", "Theo vòng đấu (mọi giải)"]])}${body}`;
  };
  App.on("fxRound", function (d) { App.st.fxr.round = +d.id; this.render(); });
  App.on("fxLeague", function (d, el) { App.st.fxr = { league: el.value, round: null }; this.render(); });
  App.on("fixture", function (d) { App.showFixture(d.id); });

  App.showFixture = function (fid) {
    const f = G.s.fixtures[fid];
    if (!f || !f.result) return;
    const r = f.result, s = G.s;
    const goals = (side) => r.goals[side].map((g) => `<div>⚽ ${esc(s.players[g.pid] ? s.players[g.pid].name : "?")} ${g.min}'${g.pen ? " (pen)" : ""}${g.a && s.players[g.a] ? ` <span class="tiny muted">(${esc(s.players[g.a].name)})</span>` : ""}</div>`).join("");
    const st = r.stats;
    const row = (lbl, a, b, fmt = (x) => x) => {
      const tot = a + b || 1;
      return `<div class="statrow"><b>${fmt(a)}</b><div><div class="lbl">${lbl}</div><div class="b2"><i style="width:${(a / tot) * 100}%"></i><i style="width:${(b / tot) * 100}%"></i></div></div><b class="right">${fmt(b)}</b></div>`;
    };
    let ratings = "";
    if (r.ratings) {
      const u = s.userClub;
      const list = Object.entries(r.ratings).filter(([pid]) => s.players[pid] && s.players[pid].clubId === u).sort((a, b) => b[1] - a[1]);
      ratings = `<div class="card" style="box-shadow:none;margin-top:12px"><h3>Điểm cầu thủ (${esc(s.clubs[u].short)})</h3>${list.map(([pid, v]) => `<div class="row between small" style="padding:3px 0"><span>${h.pname(s.players[pid])}${pid === r.motm ? " ⭐" : ""}</span><b>${v.toFixed(1)}</b></div>`).join("")}</div>`;
    }
    const body = `<div class="vs"><div class="t">${FC.crest(s.clubs[f.home], 56)}${esc(s.clubs[f.home].name)}</div><div class="mid" style="color:var(--text);font-size:34px">${r.hg} - ${r.ag}</div><div class="t">${FC.crest(s.clubs[f.away], 56)}${esc(s.clubs[f.away].name)}</div></div>
      ${r.pens ? `<div class="center muted">Luân lưu: ${r.pens[0]} - ${r.pens[1]}</div>` : ""}
      <div class="center small muted" style="margin:6px 0 12px">${h.compTag(f)} ${CP.roundLabel(s, f)} · ${U.fmtDate(f.date)}${r.attendance ? ` · Khán giả: ${r.attendance.toLocaleString("vi-VN")}` : ""}</div>
      <div class="grid g2 small" style="margin-bottom:12px"><div>${goals(0)}</div><div class="right">${goals(1)}</div></div>
      ${st ? row("Kiểm soát bóng", st.poss[0], st.poss[1], (x) => x + "%") + row("Dứt điểm", st.shots[0], st.shots[1]) + row("Trúng đích", st.sot[0], st.sot[1]) + row("xG", st.xg[0], st.xg[1], (x) => x.toFixed(2)) + row("Phạt góc", st.corners[0], st.corners[1]) + row("Phạm lỗi", st.fouls[0], st.fouls[1]) + row("Thẻ vàng", st.yc[0], st.yc[1]) + row("Thẻ đỏ", st.rc[0], st.rc[1]) : ""}
      ${r.motm && s.players[r.motm] ? `<div class="center" style="margin-top:8px">⭐ Cầu thủ xuất sắc nhất: <b>${esc(s.players[r.motm].name)}</b></div>` : ""}
      ${ratings}`;
    App.modal("Chi tiết trận đấu", body, {});
  };

  // ========== BẢNG XẾP HẠNG ==========
  function miniFx(f) {
    const r = f.result;
    const w = r ? r.winner : -1;
    return `<div class="mini-fx" ${r ? `data-act="fixture" data-id="${f.id}" style="cursor:pointer"` : ""}>
      <div class="r ${w === 0 ? "w" : ""}">${h.club(f.home, 16)}<span>${r ? r.hg : ""}${r && r.pens ? ` (${r.pens[0]})` : ""}</span></div>
      <div class="r ${w === 1 ? "w" : ""}">${h.club(f.away, 16)}<span>${r ? r.ag : ""}${r && r.pens ? ` (${r.pens[1]})` : ""}</span></div></div>`;
  }
  function bracket(evs) {
    return `<div class="bracket">${evs.map((ev) => `<div class="rnd"><h4>${esc(ev.label)} · ${U.fmtDate(ev.date, false).slice(0, 5)}</h4>${ev.fixtures.length ? ev.fixtures.map((id) => miniFx(G.s.fixtures[id])).join("") : '<div class="tiny muted">Chưa xác định</div>'}</div>`).join("")}</div>`;
  }

  App.screens.tables = function () {
    const tab = curTab("tables", "league");
    const s = G.s, u = G.user;
    const st = App.st.tbl || (App.st.tbl = { league: u.league, cup: u.country });
    let body;
    if (tab === "league") {
      const L = FC.LEAGUES[st.league];
      const po = s.calendar.filter((x) => (x.comp === "po" && x.key === st.league) || (x.comp === "bar" && (x.key === st.league || FC.LEAGUES[x.key].down === st.league)));
      body = `<div class="card"><div class="row" style="margin-bottom:10px">${leagueSelect("tblLeague", st.league)}<span class="small muted">${L.tier === 2 ? "Hạng 2" : "Hạng 1"} · ${CP.clubsOf(s, st.league).length} đội</span></div>${leagueTableHtml(st.league, false)}
        ${po.length ? `<h3 style="margin:14px 0 8px">Play-off</h3>${bracket(po)}` : ""}</div>`;
    } else if (tab === "cup") {
      const cup = s.cups[st.cup];
      const evs = s.calendar.filter((c) => c.comp === "cup" && c.key === st.cup);
      body = `<div class="card"><div class="row" style="margin-bottom:10px"><select data-change="tblCup">${Object.keys(s.cups).map((c) => `<option value="${c}" ${c === st.cup ? "selected" : ""}>${FC.flag(c)} ${esc(CP.cupName(c))}</option>`).join("")}</select></div>
        ${bracket(evs)}${cup && cup.winner ? `<div class="center" style="margin-top:12px">🏆 Nhà vô địch: ${h.club(cup.winner, 28)}</div>` : ""}
        <p class="tiny muted">Các đội hạng 1 & hạng 2 tham dự; đội uy tín cao được miễn vòng đầu. Bán kết & chung kết đá sân trung lập. Hoà sau 90' sẽ đá hiệp phụ và luân lưu.</p></div>`;
    } else {
      const C = s.cont[tab];
      const groups = Object.keys(C.groups);
      const ko = s.calendar.filter((x) => x.comp === tab && x.round[0] !== "g");
      body = `<div class="grid g2">${groups.map((g) => {
        const t = CP.groupTable(s, tab, g);
        return `<div class="card"><h3>Bảng ${g}</h3><table class="tbl"><thead><tr><th>#</th><th>CLB</th><th class="num">Tr</th><th class="num">HS</th><th class="num">Đ</th></tr></thead><tbody>${t.map((r, i) => `<tr class="${r.id === u.id ? "me" : ""}"><td class="${i < 2 ? "zone-ucl" : ""}">${i + 1}</td><td>${h.club(r.id, 20)}</td><td class="num">${r.p}</td><td class="num">${r.gf - r.ga}</td><td class="num b">${r.pts}</td></tr>`).join("")}</tbody></table></div>`;
      }).join("")}</div>
      <div class="card" style="margin-top:14px"><h3>Vòng loại trực tiếp</h3>${bracket(ko)}${C.winner ? `<div class="center" style="margin-top:12px">🏆 Nhà vô địch: ${h.club(C.winner, 28)}</div>` : ""}</div>`;
    }
    return `<h2 class="title">Bảng xếp hạng</h2>${tabs("tables", [["league", "Giải VĐQG"], ["cup", "Cúp quốc gia"], ["ucl", "Cúp C1 châu Âu"], ["lib", "Copa Libertadores"]])}${body}`;
  };
  App.on("tblLeague", function (d, el) { App.st.tbl.league = el.value; this.render(); });
  App.on("tblCup", function (d, el) { App.st.tbl.cup = el.value; this.render(); });

  // ========== TẬP LUYỆN ==========
  App.screens.training = function () {
    const s = G.s, u = G.user;
    const tr = s.training;
    const squad = G.squad(u.id).concat(G.reserves(u.id)).sort((a, b) => a.age - b.age);
    return `<h2 class="title">Tập luyện</h2>
      <div class="grid g2">
        <div class="card"><h3>🎯 Trọng tâm tập luyện</h3><div class="col">
          ${Object.entries(G.TRAINING_FOCUS).map(([k, f]) => `<label class="list-item" style="cursor:pointer"><input type="radio" name="focus" value="${k}" ${tr.focus === k ? "checked" : ""} data-change="trFocus"><div class="grow"><div class="b">${f.name}</div><div class="tiny muted">${f.desc}</div></div></label>`).join("")}
        </div></div>
        <div class="card"><h3>🔥 Cường độ</h3>
          <div class="sel-pill">${G.INTENSITY.map((it, i) => `<button class="${tr.intensity === i ? "on" : ""}" data-act="trInt" data-id="${i}">${it.name}</button>`).join("")}</div>
          <div class="kv small" style="margin-top:12px">
            <span class="k">Tốc độ phát triển</span><span class="v">×${G.INTENSITY[tr.intensity].grow}</span>
            <span class="k">Hồi phục thể lực</span><span class="v">×${G.INTENSITY[tr.intensity].rec}</span>
            <span class="k">Nguy cơ chấn thương khi tập</span><span class="v">${["Không", "Thấp", "Cao"][tr.intensity]}</span>
            <span class="k">Cơ sở tập luyện</span><span class="v">Cấp ${u.facilities.training}/5</span>
            <span class="k">HLV thể lực</span><span class="v">${s.staff.fitness ? `${esc(s.staff.fitness.name)} (${s.staff.fitness.rating}/20)` : "Chưa có"}</span>
          </div>
          <p class="tiny muted">Cầu thủ trẻ phát triển nhanh nhất khi được ra sân thường xuyên (hoặc đi mượn). Cầu thủ trên 30 tuổi bắt đầu sa sút.</p>
        </div>
      </div>
      <div class="card" style="margin-top:14px"><h3>📈 Tiến độ phát triển</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cầu thủ</th><th>VT</th><th class="num">Tuổi</th><th class="num">OVR</th><th class="num">Tiềm năng</th><th style="min-width:140px">Tiến độ lên điểm</th><th>Xu hướng</th></tr></thead><tbody>
        ${squad.map((p) => {
          const trend = p.age <= 23 && p.ovr < p.pot ? '<span class="tag green">▲ Đang lên</span>' : p.age >= 30 ? '<span class="tag red">▼ Sa sút</span>' : '<span class="tag">● Ổn định</span>';
          return `<tr class="click" data-act="player" data-id="${p.id}"><td>${h.flag(p.nat)} <b>${esc(p.name)}</b> ${p.res ? '<span class="tag">U21</span>' : ""}</td><td>${h.pos(p.pos)}</td><td class="num">${p.age}</td><td class="num">${h.ovr(p.ovr)}</td><td class="num">${p.pot}</td><td>${h.bar(Math.max(0, p.prog) * 100)}</td><td>${trend}</td></tr>`;
        }).join("")}</tbody></table></div></div>`;
  };
  App.on("trFocus", function (d, el) { G.s.training.focus = el.value; this.toast(`Trọng tâm: ${G.TRAINING_FOCUS[el.value].name}`); });
  App.on("trInt", function (d) { G.s.training.intensity = +d.id; this.render(); });

  // ========== HỌC VIỆN ==========
  App.screens.youth = function () {
    const s = G.s, u = G.user;
    const ys = s.youth.map((id) => s.players[id]).filter(Boolean);
    const res = G.reserves(u.id).sort((a, b) => b.pot - a.pot);
    const young = G.squad(u.id).filter((p) => p.age <= 21).sort((a, b) => b.pot - a.pot);
    const yc = s.staff.youth;
    return `<h2 class="title">Học viện & Đội trẻ</h2>
      <div class="grid g2">
        <div class="card"><h3>🌱 Lứa trẻ chờ ký hợp đồng</h3>${ys.length ? `<table class="tbl"><tbody>${ys.map((p) => `<tr><td>${h.pos(p.pos)}</td><td>${h.pname(p)} <span class="tiny muted">${p.age}t · ${FC.flag(p.nat)}</span></td><td class="num">${h.ovr(p.ovr)}</td><td class="num small">TN <b>${p.pot}</b></td>
          <td class="right nowrap"><button class="btn sm primary" data-act="promoteYouth" data-id="${p.id}">Ký HĐ</button> <button class="btn sm danger" data-act="releaseYouth" data-id="${p.id}">Loại</button></td></tr>`).join("")}</tbody></table>` : '<div class="empty">Chưa có lứa trẻ mới. Học viện đôn cầu thủ lên vào tháng 3 hằng năm.</div>'}
          <p class="tiny muted">Cầu thủ ký hợp đồng chuyên nghiệp sẽ vào đội một; bạn có thể đẩy họ xuống đội trẻ U21 để tập luyện.</p></div>
        <div class="card"><h3>🏫 Lò đào tạo</h3>
          <div class="stat-big">Cấp ${u.facilities.youth}/5</div>
          <div class="small">HLV đội trẻ / GĐ học viện: <b>${yc ? `${esc(yc.name)} (${yc.rating}/20)${yc.formerPlayer ? " · cựu cầu thủ" : ""}` : "Chưa có"}</b></div>
          <p class="small muted">Lò đào tạo nổi tiếng (La Masia, Ajax, Benfica, Sporting, River, Santos...) có cấp 5. Cấp càng cao & HLV đội trẻ càng giỏi thì lứa trẻ càng chất lượng, càng dễ xuất hiện "thần đồng".</p>
          ${u.facilities.youth < 5 ? `<button class="btn primary" data-act="upgrade" data-id="youth">Nâng cấp (${U.money(G.facilityCost("youth"))})</button>` : '<span class="tag green">Đã tối đa</span>'}
        </div>
      </div>
      <div class="card" style="margin-top:14px"><h3>🎽 Đội trẻ U21 (${res.length})</h3>${res.length ? `<table class="tbl"><tbody>${res.map((p) => `<tr><td>${h.pos(p.pos)}</td><td>${h.pname(p)}</td><td class="num">${p.age}t</td><td class="num">${h.ovr(p.ovr)}</td><td class="num">TN ${p.pot}</td><td>${h.morale(p.morale)}</td><td class="right"><button class="btn sm" data-act="toggleRes" data-id="${p.id}">⬆️ Lên đội một</button></td></tr>`).join("")}</tbody></table>` : '<div class="empty">Đội trẻ đang trống. Mở hồ sơ cầu thủ đội một và chọn "Xuống đội trẻ".</div>'}</div>
      <div class="card" style="margin-top:14px"><h3>⭐ Cầu thủ trẻ ở đội một (≤ 21 tuổi)</h3>${young.length ? `<table class="tbl"><tbody>${young.map((p) => `<tr class="click" data-act="player" data-id="${p.id}"><td>${h.pos(p.pos)}</td><td>${esc(p.name)}</td><td class="num">${p.age}</td><td class="num">${h.ovr(p.ovr)}</td><td class="num">TN ${p.pot}</td><td class="num">${p.stats.apps} trận</td></tr>`).join("")}</tbody></table>` : '<div class="empty">Không có.</div>'}</div>`;
  };
  App.on("promoteYouth", function (d) {
    if (G.user.players.length >= 35) return this.toast("CLB đã có 35 cầu thủ.", true);
    const p = G.s.players[d.id];
    G.promoteYouth(d.id);
    this.closeAllModals();
    this.toast(`${esc(p.name)} đã ký hợp đồng chuyên nghiệp!`);
    this.render();
  });
  App.on("releaseYouth", function (d) {
    const p = G.s.players[d.id];
    this.confirm("Giải phóng cầu thủ trẻ", `Giải phóng ${esc(p.name)} khỏi học viện?`, "Giải phóng", () => { G.releaseYouth(d.id); this.closeAllModals(); this.render(); }, true);
  });
  App.on("upgrade", function (d) { const r = G.upgradeFacility(d.id); this.toast(r.msg, !r.ok); this.render(); });

  // ========== TIN TỨC ==========
  App.screens.news = function () {
    const s = G.s;
    const tab = curTab("news", "all");
    let items = s.news;
    if (tab !== "all" && tab !== "rumours") items = items.filter((n) => n.cat === tab || (tab === "manager" && n.cat === "staff"));
    let body;
    if (tab === "rumours") {
      body = `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ngày</th><th>Nguồn</th><th>Tin đồn</th><th>Trạng thái</th></tr></thead><tbody>${s.rumours.slice(0, 80).map((r) => `<tr ${s.players[r.pid] ? `class="click" data-act="player" data-id="${r.pid}"` : ""}><td class="small nowrap">${U.fmtDate(r.date, false)}</td>
        <td><span class="tag ${r.rel >= 0.7 ? "green" : r.rel >= 0.45 ? "blue" : r.rel >= 0.25 ? "" : "orange"}" title="${esc(r.src)}">${esc(r.tag)}</span></td><td style="white-space:normal">${esc(r.text)}</td>
        <td>${r.status === "true" ? '<span class="tag green">Thành sự thật</span>' : r.status === "false" ? '<span class="tag red">Sai</span>' : '<span class="tag">Đang chờ</span>'}</td></tr>`).join("") || '<tr><td colspan="4" class="empty">Chưa có tin đồn.</td></tr>'}</tbody></table></div>
        <p class="tiny muted">Độ tin cậy: Tier 1 (rất cao) › Tier 2 › Tier 3 › Lá cải › MXH. Tin đồn đáng tin thường thành sự thật trong kỳ chuyển nhượng.</p></div>`;
    } else body = `<div class="card">${newsList(items, 120)}</div>`;
    const aw = s.awards.slice().reverse();
    return `<h2 class="title">Tin tức bóng đá</h2>${tabs("news", [["all", "Tất cả"], ["rumours", "🗞️ Tin đồn chuyển nhượng"], ["transfer", "✍️ Chuyển nhượng"], ["drama", "🔥 Drama"], ["manager", "👔 HLV & ghế nóng"], ["award", "🏆 Danh hiệu"]])}
      ${body}
      ${aw.length ? `<div class="card" style="margin-top:14px"><h3>🏆 Quả bóng vàng & Golden Boy</h3><table class="tbl"><tbody>${aw.map((a) => `<tr><td>${a.season}</td><td>🥇 ${esc(a.ballon[0] ? a.ballon[0].name : "—")} ${a.ballon[0] ? h.club(a.ballon[0].club, 16, true) : ""}</td><td class="small muted">🥈 ${esc(a.ballon[1] ? a.ballon[1].name : "—")} · 🥉 ${esc(a.ballon[2] ? a.ballon[2].name : "—")}</td><td>🌟 ${esc(a.golden ? a.golden.name : "—")}</td></tr>`).join("")}</tbody></table></div>` : ""}`;
  };

  // ========== NHÂN SỰ ==========
  App.screens.staff = function () {
    const s = G.s;
    const roles = ["assistant", "youth", "fitness", "scout"];
    const market = G.staffMarket();
    const card = (r) => {
      const x = s.staff[r];
      const R = EV.STAFF_ROLES[r];
      return `<div class="card"><h3>${esc(R.name)}</h3>${x ? `<div class="b">${esc(x.name)} ${x.formerPlayer ? `<span class="tag ${x.legend ? "gold" : "blue"}">${x.legend ? "Huyền thoại" : "Cựu cầu thủ"}</span>` : ""}</div>
        <div class="small muted">Năng lực ${x.rating}/20 · Lương ${U.wage(x.wage)} · Từ ${x.since}</div>${h.bar(x.rating, 20)}
        <button class="btn sm danger" style="margin-top:8px" data-act="fireStaff" data-id="${r}">Sa thải</button>` : '<div class="empty">Vị trí trống</div>'}
        <p class="tiny muted">${esc(R.desc)}</p></div>`;
    };
    return `<h2 class="title">Nhân sự & Ban lãnh đạo</h2>
      <div class="grid g4">${roles.map(card).join("")}</div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h3>🏛️ Thành viên ban lãnh đạo (cựu cầu thủ)</h3>${s.boardMembers.length ? s.boardMembers.map((b) => `<div class="list-item">👔 <b>${esc(b.name)}</b> ${b.legend ? '<span class="tag gold">Huyền thoại</span>' : ""}</div>`).join("") : '<div class="empty">Chưa có. Cựu cầu thủ giải nghệ có thể xin gia nhập ban lãnh đạo — giúp ban lãnh đạo kiên nhẫn hơn và CĐV ủng hộ hơn.</div>'}</div>
        <div class="card"><h3>📋 Thị trường nhân sự</h3><div class="tbl-wrap"><table class="tbl"><tbody>${market.map((c) => `<tr><td class="small">${esc(EV.STAFF_ROLES[c.role].name)}</td><td><b>${esc(c.name)}</b></td><td class="num">${c.rating}/20</td><td class="num small">${U.wage(c.wage)}</td><td><button class="btn sm" data-act="hireStaff" data-id="${c.id}">Thuê</button></td></tr>`).join("")}</tbody></table></div>
        <p class="tiny muted">Phí thuê: năng lực × 0,15 tr €. Danh sách làm mới mỗi mùa.</p></div>
      </div>`;
  };
  App.on("hireStaff", function (d) { const r = G.hireStaff(d.id); this.toast(esc(r.msg), !r.ok); this.render(); });
  App.on("fireStaff", function (d) {
    this.confirm("Sa thải nhân sự", "Chấm dứt hợp đồng (đền bù nửa năm lương)?", "Sa thải", () => { G.fireStaff(d.id); this.render(); }, true);
  });

  // ========== TÀI CHÍNH ==========
  App.screens.finance = function () {
    const s = G.s, u = G.user;
    const fin = s.finance.season;
    const inc = fin.income, exp = fin.expense;
    const totI = Object.values(inc).reduce((a, b) => a + b, 0), totE = Object.values(exp).reduce((a, b) => a + b, 0);
    const maxV = Math.max(1, ...Object.values(inc), ...Object.values(exp));
    const hb = (lbl, v, color) => `<div class="hbar"><span class="small">${lbl}</span><div class="bar"><i style="width:${(v / maxV) * 100}%;background:${color}"></i></div><span class="small right b">${U.money(v)}</span></div>`;
    const wk = s.finance.weekly;
    let spark = '<div class="empty small">Chưa có dữ liệu tuần.</div>';
    if (wk.length > 1) {
      const vals = wk.map((x) => x.bal);
      const mn = Math.min(...vals), mx = Math.max(...vals);
      const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${100 - ((v - mn) / (mx - mn || 1)) * 90 - 5}`).join(" ");
      spark = `<svg class="spark" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg><div class="row between tiny muted"><span>${U.money(mn)}</span><span>${U.money(mx)}</span></div>`;
    }
    const att = G.attendance();
    return `<h2 class="title">Tài chính</h2>
      <div class="grid g4">
        <div class="card"><div class="small muted">Số dư tài khoản</div><div class="stat-big" style="${u.money < 0 ? "color:var(--red)" : ""}">${U.money(u.money)}</div></div>
        <div class="card"><div class="small muted">Ngân sách chuyển nhượng</div><div class="stat-big">${U.money(u.transferBudget)}</div></div>
        <div class="card"><div class="small muted">Quỹ lương (đã dùng / tối đa)</div><div class="stat-big" style="font-size:20px">${U.wage(G.wageBill(u.id))}</div><div class="small muted">/ ${U.wage(u.wageBudget)}</div>${h.bar(G.wageBill(u.id), u.wageBudget)}</div>
        <div class="card"><div class="small muted">Nhà tài trợ áo đấu</div><div class="b">${s.sponsor ? `${esc(s.sponsor.name)}` : "Chưa có"}</div><div class="small muted">${s.sponsor ? `${U.money(s.sponsor.perWeek)}/tuần · đến mùa ${s.sponsor.until}` : ""}</div></div>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h3>📥 Thu nhập mùa ${G.seasonLabel()} <span class="sp b">${U.money(totI)}</span></h3>
          ${hb("Bán vé", inc.tickets, "var(--accent)")}${hb("Bản quyền TV", inc.tv, "var(--accent2)")}${hb("Tài trợ & thương mại", inc.commercial, "#9b7bff")}${hb("Tiền thưởng", inc.prize, "var(--gold)")}${hb("Bán cầu thủ", inc.transfers, "#4dd4ac")}</div>
        <div class="card"><h3>📤 Chi phí mùa ${G.seasonLabel()} <span class="sp b">${U.money(totE)}</span></h3>
          ${hb("Lương cầu thủ", exp.wages, "var(--red)")}${hb("Mua cầu thủ", exp.transfers, "var(--orange)")}${hb("Nhân sự", exp.staff, "#ff7ab6")}${hb("Cơ sở vật chất", exp.facilities, "#c08cff")}${hb("Khác", exp.other, "#8f9bc8")}</div>
      </div>
      <div class="grid g3" style="margin-top:14px">
        <div class="card"><h3>📈 Số dư theo tuần</h3>${spark}</div>
        <div class="card"><h3>🎟️ Giá vé</h3>
          <div class="row"><input type="range" min="20" max="120" step="5" value="${s.ticketPrice}" data-change="ticket" style="flex:1"><b>€${s.ticketPrice}</b></div>
          <div class="kv small" style="margin-top:8px"><span class="k">Khán giả dự kiến</span><span class="v">${att.toLocaleString("vi-VN")} / ${u.cap.toLocaleString("vi-VN")}</span>
          <span class="k">Doanh thu/trận</span><span class="v">${U.money((att * s.ticketPrice) / 1e6)}</span><span class="k">Tâm trạng CĐV</span><span class="v">${Math.round(s.fans)}%</span></div>
          <p class="tiny muted">Giá vé cao tăng doanh thu nhưng giảm khán giả. CĐV vui vẻ giúp lấp đầy sân.</p></div>
        <div class="card"><h3>🏗️ Cơ sở vật chất</h3>
          <div class="list-item"><div class="grow"><b>Trung tâm tập luyện</b><div class="tiny muted">Cấp ${u.facilities.training}/5</div></div>${u.facilities.training < 5 ? `<button class="btn sm" data-act="upgrade" data-id="training">${U.money(G.facilityCost("training"))}</button>` : '<span class="tag green">Tối đa</span>'}</div>
          <div class="list-item"><div class="grow"><b>Học viện trẻ</b><div class="tiny muted">Cấp ${u.facilities.youth}/5</div></div>${u.facilities.youth < 5 ? `<button class="btn sm" data-act="upgrade" data-id="youth">${U.money(G.facilityCost("youth"))}</button>` : '<span class="tag green">Tối đa</span>'}</div>
          <div class="list-item"><div class="grow"><b>Mở rộng sân ${esc(u.stadium)}</b><div class="tiny muted">+3.000 chỗ (hiện ${u.cap.toLocaleString("vi-VN")})</div></div><button class="btn sm" data-act="expand">${U.money(45)}</button></div>
        </div>
      </div>
      ${s.finance.history.length ? `<div class="card" style="margin-top:14px"><h3>📚 Lịch sử tài chính</h3><table class="tbl"><thead><tr><th>Mùa</th><th class="num">Thu</th><th class="num">Chi</th><th class="num">Lãi/Lỗ</th></tr></thead><tbody>${s.finance.history.map((x) => `<tr><td>${x.season}</td><td class="num">${U.money(x.income)}</td><td class="num">${U.money(x.expense)}</td><td class="num b">${U.money(x.income - x.expense)}</td></tr>`).join("")}</tbody></table></div>` : ""}`;
  };
  App.on("ticket", function (d, el) { G.s.ticketPrice = +el.value; this.render(); });
  App.on("expand", function () {
    this.confirm("Mở rộng sân vận động", `Chi ${U.money(45)} để thêm 3.000 chỗ ngồi?`, "Đồng ý", () => { const r = G.expandStadium(); this.toast(r.msg, !r.ok); this.render(); });
  });

  // ========== THỐNG KÊ ==========
  App.screens.stats = function () {
    const tab = curTab("stats", "league");
    const s = G.s;
    const st = App.st.stats || (App.st.stats = { league: G.user.league });
    let pool = Object.values(s.players).filter((p) => p.clubId && (tab === "club" ? p.clubId === s.userClub : tab === "world" ? true : s.clubs[p.clubId].league === st.league));
    const list = (title, arr, val, fmt = (x) => x) => `<div class="card"><h3>${title}</h3><table class="tbl"><tbody>${arr.slice(0, 10).map((p, i) => `<tr class="click" data-act="player" data-id="${p.id}"><td class="muted">${i + 1}</td><td><b>${esc(p.name)}</b><div class="tiny muted">${esc(s.clubs[p.clubId].name)}</div></td><td class="num b">${fmt(val(p))}</td></tr>`).join("") || '<tr><td class="empty">Chưa có dữ liệu</td></tr>'}</tbody></table></div>`;
    const by = (fn) => pool.filter((p) => fn(p) > 0).sort((a, b) => fn(b) - fn(a));
    const minApps = tab === "club" ? 1 : 5;
    const ratingList = pool.filter((p) => p.stats.apps >= minApps).sort((a, b) => PL.avgRating(b) - PL.avgRating(a));
    return `<h2 class="title">Thống kê mùa ${G.seasonLabel()}</h2>${tabs("stats", [["league", "Theo giải"], ["world", "Toàn thế giới"], ["club", "CLB của tôi"]])}
      ${tab === "league" ? `<div style="margin-bottom:12px">${leagueSelect("statLeague", st.league)}</div>` : ""}
      <div class="grid g3">${list("⚽ Vua phá lưới (mọi đấu trường)", by((p) => p.stats.goals), (p) => p.stats.goals)}${list("🎯 Kiến tạo", by((p) => p.stats.assists), (p) => p.stats.assists)}
      ${list("⭐ Điểm trung bình", ratingList, (p) => PL.avgRating(p), (x) => x.toFixed(2))}${list("🧤 Giữ sạch lưới (GK)", by((p) => (p.pos === "GK" ? p.stats.cs : 0)), (p) => p.stats.cs)}
      ${list("🏅 Cầu thủ hay nhất trận", by((p) => p.stats.motm), (p) => p.stats.motm)}${list("🟨 Thẻ phạt", by((p) => p.stats.yc + p.stats.rc * 3), (p) => p.stats.yc + p.stats.rc * 3)}</div>`;
  };
  App.on("statLeague", function (d, el) { App.st.stats.league = el.value; this.render(); });

  // ========== HỘP THƯ ==========
  App.screens.inbox = function () {
    const s = G.s;
    const st = App.st.inbox || (App.st.inbox = { sel: null });
    const sel = s.inbox.find((m) => m.id === st.sel) || s.inbox[0];
    if (sel && !sel.read) sel.read = true;
    const icon = { board: "🏛️", staff: "🧑‍💼", medical: "🩺", offer: "💶", transfer: "✍️", news: "📰", youth: "🌱", trophy: "🏆", info: "ℹ️" };
    return `<h2 class="title">Hộp thư <button class="btn sm" data-act="readAll">Đánh dấu đã đọc tất cả</button></h2>
      <div class="mail"><div class="card" style="max-height:70vh;overflow-y:auto;padding:8px">${s.inbox.map((m) => `<div class="mail-item ${m.read ? "" : "unread"} ${sel && m.id === sel.id ? "on" : ""}" data-act="selMail" data-id="${m.id}">
        <span class="s">${icon[m.type] || "✉️"} ${esc(m.subject)}</span><div class="tiny muted">${esc(m.from)} · ${U.fmtDate(m.date, false)}</div></div>`).join("") || '<div class="empty">Trống</div>'}</div>
        <div class="card">${sel ? `<div class="tiny muted">${esc(sel.from)} · ${U.fmtDate(sel.date)}</div><h3 style="margin:6px 0 12px;font-size:18px">${esc(sel.subject)}</h3><div class="mail-body">${sel.body}</div>
          ${sel.actions ? `<div class="row" style="margin-top:14px">${sel.actions.map((a) => `<button class="btn ${a.act === "acceptOffer" ? "primary" : "danger"}" data-act="${a.act}" data-id="${a.id}">${esc(a.label)}</button>`).join("")}</div>` : ""}` : '<div class="empty">Chọn một thư.</div>'}</div></div>`;
  };
  App.on("selMail", function (d) { App.st.inbox = { sel: d.id }; this.render(); });
  App.on("openMail", function (d) { App.st.inbox = { sel: d.id }; this.go("inbox"); });
  App.on("readAll", function () { G.s.inbox.forEach((m) => (m.read = true)); this.render(); });
  App.on("acceptOffer", function (d) { const r = G.acceptOffer(d.id); this.toast(esc(r.msg), !r.ok); G.save(this.slot); this.render(); });
  App.on("rejectOffer", function (d) { const r = G.rejectOffer(d.id); this.toast(esc(r.msg), !r.ok); this.render(); });

  // ========== CLB & SỰ NGHIỆP ==========
  App.screens.club = function () {
    const s = G.s, u = G.user, m = s.manager;
    const winPct = m.games ? Math.round((m.w / m.games) * 100) : 0;
    const theme = document.documentElement.dataset.theme || "auto";
    const lg = G.legacy();
    const um = G.userMgr;
    return `<h2 class="title">CLB & Sự nghiệp</h2>
      <div class="grid g3">
        <div class="card"><div class="row" style="gap:14px">${FC.crest(u, 64)}<div><div style="font-size:18px;font-weight:800">${esc(u.name)}</div><div class="small muted">${esc(u.stadium)} · ${u.cap.toLocaleString("vi-VN")} chỗ</div>${h.stars(u.rep)}<div>${h.league(u.league)}</div></div></div>
          <div class="kv small" style="margin-top:12px"><span class="k">Thành phố</span><span class="v">${esc(u.city)}</span><span class="k">Thành lập</span><span class="v">${u.founded}</span><span class="k">Uy tín</span><span class="v">${Math.round(u.rep)}/100</span>
          <span class="k">Cơ sở tập luyện</span><span class="v">Cấp ${u.facilities.training}</span><span class="k">Học viện</span><span class="v">Cấp ${u.facilities.youth}</span></div></div>
        <div class="card"><h3>👔 HLV ${esc(m.name)} ${FC.flag(m.nat)}</h3><div class="kv small"><span class="k">Mùa giải</span><span class="v">${G.seasonNo()}/${G.MAX_SEASONS}</span><span class="k">Triết lý</span><span class="v">${esc(FC.PHILOSOPHIES[um.phil].short)}</span><span class="k">Số trận</span><span class="v">${m.games}</span><span class="k">Thắng / Hoà / Thua</span><span class="v">${m.w} / ${m.d} / ${m.l}</span><span class="k">Tỉ lệ thắng</span><span class="v">${winPct}%</span>
          <span class="k">CLB đã dẫn dắt</span><span class="v">${m.clubs.map((c) => esc(s.clubs[c].short)).join(", ")}</span><span class="k">Điểm di sản</span><span class="v">${lg.pts} · ${esc(lg.rank)}</span></div>
          <h3 style="margin:14px 0 8px">🏆 Danh hiệu</h3>${m.trophies.length ? m.trophies.map((t) => `<div class="list-item">🏆 <div class="grow"><b>${esc(t.name)}</b><div class="tiny muted">${esc(t.club)} · ${t.season}</div></div></div>`).join("") : '<div class="muted small">Chưa có danh hiệu nào.</div>'}</div>
        <div class="card"><h3>💾 Hệ thống</h3><div class="col">
          <button class="btn primary" data-act="saveGame">Lưu game (khe ${App.slot})</button>
          <div class="row"><span class="small muted">Giao diện:</span><div class="sel-pill">${[["auto", "Tự động"], ["dark", "Tối"], ["light", "Sáng"]].map(([k, l]) => `<button class="${theme === k ? "on" : ""}" data-act="theme" data-id="${k}">${l}</button>`).join("")}</div></div>
          <button class="btn" data-act="quitMenu">Về menu chính</button>
          <p class="tiny muted">Logo thật đang dùng: ${Object.keys(FC.realLogos).length} CLB. Thả file vào thư mục <code>logos/</code> (vd. <code>logos/${u.id}.png</code>) để thay huy hiệu tự vẽ.</p>
        </div></div>
      </div>
      <div class="card" style="margin-top:14px"><h3>📜 Lịch sử các mùa giải</h3>${s.history.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mùa</th><th>CLB</th><th>Giải</th><th class="num">Hạng</th><th>Mục tiêu</th><th>Cúp QG</th><th>Châu lục</th><th>Vô địch giải</th><th>Quả bóng vàng</th></tr></thead><tbody>
        ${s.history.slice().reverse().map((x) => `<tr><td>${x.season}</td><td>${h.club(x.club, 18, true)}</td><td class="small">${esc(FC.LEAGUES[x.league].short)}${x.move ? (x.move === "up" ? " ⬆️" : " ⬇️") : ""}</td><td class="num b">${x.pos}</td><td>${x.met ? '<span class="tag green">Đạt</span>' : '<span class="tag red">Không đạt</span>'}</td><td>${esc(x.cupRun)}</td><td class="small">${esc(x.contRun)}</td><td>${h.club(x.champion, 18, true)}</td><td class="small">${x.ballon ? esc(x.ballon.name) : "—"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">Chưa hoàn thành mùa giải nào.</div>'}</div>`;
  };
  App.on("saveGame", async function () { const ok = await G.save(this.slot); this.toast(ok ? "Đã lưu game." : "Lưu thất bại.", !ok); });
  App.on("theme", function (d) {
    if (d.id === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = d.id;
    try { localStorage.setItem("pitchboss27_theme", d.id); } catch (e) { /* bỏ qua */ }
    this.render();
  });
  App.on("quitMenu", function () {
    this.confirm("Về menu chính", "Tiến trình sẽ được lưu trước khi thoát.", "Thoát", async () => { await G.save(this.slot); G.s = null; this.st.start = null; this.render(); });
  });
})();
