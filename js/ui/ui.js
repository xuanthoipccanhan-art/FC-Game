/* Khung giao diện: bố cục, điều hướng, modal, helpers */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;
  const PL = FC.players;
  const G = FC.Game;
  const esc = U.esc;

  const NAV = [
    ["home", "🏠", "Tổng quan"], ["squad", "👥", "Đội hình"], ["tactics", "📋", "Chiến thuật"], ["fixtures", "📅", "Lịch đấu"],
    ["tables", "🏆", "Bảng xếp hạng"], ["transfers", "💱", "Chuyển nhượng"], ["training", "🏋️", "Tập luyện"], ["youth", "🌱", "Học viện"],
    ["finance", "💰", "Tài chính"], ["stats", "📊", "Thống kê"], ["inbox", "✉️", "Hộp thư"], ["club", "🏟️", "CLB & Sự nghiệp"],
  ];

  const App = {
    view: "home",
    tabs: {},
    st: {}, // trạng thái tạm cho từng màn hình
    screens: {},
    actions: {},
    slot: 1,

    on(name, fn) { this.actions[name] = fn; },

    // ===== Helpers render =====
    h: {
      club(id, size = 22, short = false) {
        const c = G.s.clubs[id];
        if (!c) return `<span class="muted">Tự do</span>`;
        return `<span class="cname" data-act="clubInfo" data-id="${c.id}" style="cursor:pointer">${FC.crest(c, size)}<span class="n">${esc(short ? c.short : c.name)}</span></span>`;
      },
      clubStatic(c, size = 22, short = false) {
        return `<span class="cname">${FC.crest(c, size)}<span class="n">${esc(short ? c.short : c.name)}</span></span>`;
      },
      ovr(v) {
        const cls = v >= 88 ? "o90" : v >= 84 ? "o85" : v >= 78 ? "o80" : v >= 72 ? "o75" : v >= 65 ? "o70" : "o0";
        return `<span class="ovr ${cls}">${v}</span>`;
      },
      pos(p) { return `<span class="pos ${PL.GROUP[p]}">${p}</span>`; },
      flag(n) { return `<span title="${esc(FC.natName(n))}">${FC.flag(n)}</span>`; },
      pname(p, extra = "") {
        return `<a href="javascript:void 0" data-act="player" data-id="${p.id}" class="b" style="color:inherit;text-decoration:none">${esc(p.name)}</a>${extra}`;
      },
      form(arr) { return `<span class="form">${arr.map((x) => `<i class="${x}">${x === "W" ? "T" : x === "D" ? "H" : "B"}</i>`).join("")}</span>`; },
      bar(v, max = 100) {
        const pct = U.clamp((v / max) * 100, 0, 100);
        const cls = pct < 50 ? "bad" : pct < 75 ? "warn" : "";
        return `<div class="bar ${cls}"><i style="width:${pct}%"></i></div>`;
      },
      status(p) {
        const t = [];
        if (p.injury > 0) t.push(`<span class="tag red" title="${esc(p.injuryName)}">🩹 ${Math.ceil(p.injury / 7)}t</span>`);
        if (p.suspended > 0) t.push(`<span class="tag red">🟥 ${p.suspended}</span>`);
        if (p.listed) t.push(`<span class="tag orange">Rao bán</span>`);
        if (p.contract <= 1) t.push(`<span class="tag gold">HĐ ${p.contract}n</span>`);
        if (p.joined && p.joined.slice(0, 4) >= String(G.s.season)) t.push(`<span class="tag blue">Mới</span>`);
        return t.join(" ");
      },
      morale(m) {
        const t = m >= 85 ? ["Rất tốt", "green"] : m >= 65 ? ["Tốt", "green"] : m >= 45 ? ["Bình thường", ""] : m >= 25 ? ["Kém", "orange"] : ["Rất kém", "red"];
        return `<span class="tag ${t[1]}">${t[0]}</span>`;
      },
      stars(rep) {
        const n = Math.round(U.clamp((rep - 60) / 7.5, 0.5, 5) * 2) / 2;
        return `<span class="stars">${"★".repeat(Math.floor(n))}${n % 1 ? "⯪" : ""}<span style="opacity:.25">${"★".repeat(5 - Math.ceil(n))}</span></span>`;
      },
      score(f, forClub) {
        if (!f.result) return `<span class="muted">vs</span>`;
        const r = f.result;
        let cls = "";
        if (forClub) {
          const side = f.home === forClub ? 0 : 1;
          cls = r.winner === side ? "W" : r.winner === 1 - side ? "L" : "D";
        }
        const pens = r.pens ? ` <span class="tiny muted">(pen ${r.pens[0]}-${r.pens[1]})</span>` : "";
        return `<span class="b ${cls ? "res-" + cls : ""}" style="${cls === "W" ? "color:var(--win)" : cls === "L" ? "color:var(--loss)" : ""}">${r.hg} - ${r.ag}</span>${pens}`;
      },
      compTag(comp) {
        const c = FC.comp.COMP[comp];
        return `<span class="tag" style="background:${c.color}22;color:${c.color}">${c.short}</span>`;
      },
    },

    // ===== Modal & toast =====
    modal(title, body, opts = {}) {
      const root = document.getElementById("modals");
      const wrap = document.createElement("div");
      wrap.className = "modal-bg";
      wrap.innerHTML = `<div class="modal ${opts.size || ""}" role="dialog" aria-modal="true">
        <div class="modal-h">${opts.icon || ""}<h3>${title}</h3>${opts.noClose ? "" : `<button class="btn sm ghost x" data-close>✕</button>`}</div>
        <div class="modal-b">${body}</div>
        ${opts.footer ? `<div class="modal-f">${opts.footer}</div>` : ""}
      </div>`;
      wrap.addEventListener("click", (e) => {
        if ((e.target === wrap && !opts.noClose) || e.target.closest("[data-close]")) this.closeModal(wrap);
      });
      root.appendChild(wrap);
      wrap._onClose = opts.onClose;
      return wrap;
    },
    closeModal(el) {
      const root = document.getElementById("modals");
      const m = el || root.lastElementChild;
      if (m) {
        m.remove();
        if (m._onClose) m._onClose();
      }
    },
    closeAllModals() { document.getElementById("modals").innerHTML = ""; },
    toast(msg, err) {
      const t = document.createElement("div");
      t.className = "toast" + (err ? " err" : "");
      t.innerHTML = msg;
      document.getElementById("toasts").appendChild(t);
      setTimeout(() => t.remove(), 3800);
    },
    confirm(title, msg, okLabel, fn, danger) {
      const m = this.modal(title, `<p>${msg}</p>`, {
        size: "narrow",
        footer: `<button class="btn" data-close>Huỷ</button><button class="btn ${danger ? "danger" : "primary"}" id="cfm-ok">${okLabel}</button>`,
      });
      m.querySelector("#cfm-ok").onclick = () => { this.closeModal(m); fn(); };
    },

    // ===== Điều hướng =====
    go(view, tab) {
      this.view = view;
      if (tab) this.tabs[view] = tab;
      this.render();
      window.scrollTo(0, 0);
    },

    render() {
      const app = document.getElementById("app");
      if (!G.s) { app.innerHTML = this.startScreen(); return; }
      const u = G.user;
      const unread = G.unread();
      const nav = NAV.map(([k, ic, label]) => `<button class="nav-btn ${this.view === k ? "on" : ""}" data-act="nav" data-id="${k}"><span class="ic">${ic}</span><span>${label}</span>${k === "inbox" && unread ? `<span class="badge">${unread}</span>` : ""}</button>`).join("");
      const next = G.nextUserFixture();
      const ev = G.currentEvent();
      let nextLabel = "Tiếp tục";
      if (G.s.seasonEnded) nextLabel = "Tổng kết mùa";
      else if (ev) {
        const uf = G.userFixtureIn(ev);
        nextLabel = uf ? `Thi đấu: ${G.s.clubs[uf.home === u.id ? uf.away : uf.home].short}` : `Tiếp tục → ${U.fmtDate(ev.date, false).slice(0, 5)}`;
      }
      const screen = (this.screens[this.view] || this.screens.home).call(this);
      app.innerHTML = `<div class="layout">
        <aside class="sidebar">
          <div class="brand"><div class="logo">PB</div><div>Pitch Boss 27<small>Quản lý bóng đá</small></div></div>
          ${nav}
          <div style="margin-top:auto;padding:10px 6px" class="tiny muted">Mùa ${G.seasonLabel()} · ${esc(G.s.manager.name)}</div>
        </aside>
        <div class="main">
          <header class="topbar">
            <div class="club">${FC.crest(u, 34)}<div style="min-width:0"><div class="nm">${esc(u.name)}</div><div class="tiny muted">${U.fmtDate(G.s.date)}${FC.transfers.isWindowOpen(G.s.date) ? ' · <span style="color:var(--accent)">TTCN mở</span>' : ""}</div></div></div>
            <div class="meta">
              <div class="hide-m"><div class="k">Ngân sách CN</div><div class="v">${U.money(u.transferBudget)}</div></div>
              <div class="hide-m"><div class="k">Số dư</div><div class="v" style="${u.money < 0 ? "color:var(--red)" : ""}">${U.money(u.money)}</div></div>
              <div class="hide-m"><div class="k">Trận tới</div><div class="v">${next ? `${G.s.clubs[next.home === u.id ? next.away : next.home].short} (${next.home === u.id ? "N" : "K"})` : "—"}</div></div>
              <button class="btn primary" data-act="advance" id="btn-advance">${esc(nextLabel)} ▶</button>
            </div>
          </header>
          <main class="content">${screen}</main>
        </div>
        <nav class="mobile-nav">${nav}</nav>
      </div>`;
      if (this.afterRender) { const f = this.afterRender; this.afterRender = null; f(); }
    },

    // ===== Màn hình bắt đầu =====
    startScreen() {
      const st = this.st.start || (this.st.start = { step: "menu", club: null, name: "" });
      const slots = [1, 2, 3].map((i) => ({ i, meta: G.saveMeta(i) }));
      const allClubs = G.allClubData().filter((c) => c.league === "ENG").sort((a, b) => b.rep - a.rep);
      if (st.step === "menu") {
        const hasSave = slots.some((s) => s.meta);
        return `<div class="start"><div class="start-box">
          <div class="hero"><div class="tiny muted" style="letter-spacing:3px">MÙA GIẢI ${G.START_YEAR}/${String((G.START_YEAR + 1) % 100)}</div>
            <h1>Pitch Boss <em>27</em></h1>
            <p>Dẫn dắt CLB Ngoại hạng Anh · Cầu thủ thật · Chuyển nhượng · Chiến thuật · Cúp C1</p></div>
          <div class="grid g2" style="max-width:820px;margin:0 auto">
            <div class="card col"><h3>⚽ Sự nghiệp mới</h3><p class="muted small" style="margin:0">Chọn một trong 20 CLB Ngoại hạng Anh và chinh phục các danh hiệu.</p>
              <button class="btn primary" data-act="startNew">Bắt đầu sự nghiệp mới</button></div>
            <div class="card col"><h3>💾 Tải sự nghiệp</h3>
              ${hasSave ? slots.filter((s) => s.meta).map((s) => `<div class="list-item"><div class="grow"><div class="b">${esc(s.meta.name)}</div><div class="tiny muted">HLV ${esc(s.meta.manager)} · ${s.meta.season} · ${U.fmtDate(s.meta.date, false)}</div></div>
                <button class="btn sm primary" data-act="loadSlot" data-id="${s.i}">Tải</button><button class="btn sm danger" data-act="delSlot" data-id="${s.i}">Xoá</button></div>`).join("") : `<div class="empty">Chưa có bản lưu nào.</div>`}
            </div>
          </div>
          <p class="center tiny muted" style="margin-top:24px">Đây là game của người hâm mộ, không liên kết với bất kỳ giải đấu, CLB hay nhà phát hành nào. Tên cầu thủ & CLB chỉ dùng để mô tả; chỉ số là ước lượng của trò chơi.<br>Muốn dùng logo chính thức? Thả file <code>logos/&lt;mã-clb&gt;.png</code> vào thư mục game (xem README).</p>
        </div></div>`;
      }
      const sel = st.club ? allClubs.find((c) => c.id === st.club) : null;
      return `<div class="start"><div class="start-box">
        <div class="row between" style="margin-bottom:14px"><button class="btn ghost" data-act="startBack">← Quay lại</button><h2>Chọn CLB của bạn</h2><span></span></div>
        <div class="card" style="margin-bottom:14px"><div class="row wrap">
          <label class="b">Tên HLV:</label><input type="text" id="mgr-name" maxlength="30" placeholder="Nhập tên của bạn" value="${esc(st.name)}" style="flex:1;min-width:180px">
          <select id="save-slot">${[1, 2, 3].map((i) => `<option value="${i}" ${i === this.slot ? "selected" : ""}>Khe lưu ${i}${G.saveMeta(i) ? " (sẽ ghi đè)" : ""}</option>`).join("")}</select>
          <button class="btn primary" data-act="startGo" ${sel ? "" : "disabled"}>Bắt đầu với ${sel ? esc(sel.name) : "..."} ▶</button>
        </div></div>
        <div class="club-grid">${allClubs.map((c) => `<button class="club-pick ${st.club === c.id ? "on" : ""}" data-act="pickClub" data-id="${c.id}">
          ${FC.crest(c, 42)}<div class="grow"><div class="b">${esc(c.name)}</div>${this.h.stars(c.rep)}<div class="tiny muted">Ngân sách ${U.money(c.money)}</div></div></button>`).join("")}</div>
      </div></div>`;
    },

    // ===== Thẻ cầu thủ =====
    playerCard(p) {
      const cls = p.ovr >= 86 ? "c90" : p.ovr >= 75 ? "" : p.ovr >= 65 ? "c75" : "c0";
      const names = p.pos === "GK" ? PL.GK_ATTR_NAMES : PL.ATTR_NAMES;
      const club = p.clubId ? G.s.clubs[p.clubId] : null;
      return `<div class="pcard ${cls}">
        <div class="top"><div><div class="ov">${p.ovr}</div><div class="ps">${p.pos}</div><div class="fl">${FC.flag(p.nat)}</div></div>
        <div style="margin-left:auto">${club ? FC.crest(club, 34) : ""}</div></div>
        <div class="nm">${esc(p.name.split(" ").slice(-1)[0].toUpperCase())}</div>
        <div class="at">${p.attrs.map((a, i) => `<div><b>${a}</b>${names[i]}</div>`).join("")}</div>
      </div>`;
    },

    playerModal(pid) {
      const p = G.s.players[pid];
      if (!p) return;
      const s = G.s;
      const mine = p.clubId === s.userClub;
      const academy = p.academy;
      const club = p.clubId ? s.clubs[p.clubId] : null;
      const st = p.stats;
      const avg = PL.avgRating(p);
      const ask = club && !mine ? FC.transfers.askingPrice(s, p) : null;
      const shortlisted = s.shortlist.includes(pid);
      const body = `<div class="row wrap" style="align-items:flex-start;gap:18px">
        ${this.playerCard(p)}
        <div class="grow col" style="min-width:240px">
          <div><div style="font-size:20px;font-weight:800">${esc(p.name)} ${p.num ? `<span class="muted">#${p.num}</span>` : ""}</div>
          <div class="muted">${PL.POS_VI[p.pos]} · ${p.age} tuổi · ${FC.flag(p.nat)} ${esc(FC.natName(p.nat))}</div>
          <div style="margin-top:6px">${club ? this.h.club(club.id, 20) : academy ? '<span class="tag green">Học viện</span>' : '<span class="tag">Cầu thủ tự do</span>'} ${this.h.status(p)}</div></div>
          <div class="kv">
            <span class="k">Chỉ số / Tiềm năng</span><span class="v">${p.ovr} / ${mine || academy ? p.pot : `~${Math.round(p.pot / 3) * 3}`}</span>
            <span class="k">Giá trị</span><span class="v">${U.money(p.value)}</span>
            ${ask != null ? `<span class="k">Giá CLB muốn bán</span><span class="v" style="color:var(--gold)">${U.money(ask)}</span>` : ""}
            <span class="k">Lương</span><span class="v">${academy ? "—" : U.wage(p.wage)}</span>
            <span class="k">Hợp đồng</span><span class="v">${academy ? "Chưa ký" : club ? `${p.contract} năm (đến 06/${s.season + p.contract})` : "—"}</span>
            <span class="k">Thể lực</span><span class="v">${Math.round(p.fitness)}%</span>
            <span class="k">Tinh thần</span><span class="v">${this.h.morale(p.morale)}</span>
            <span class="k">Phong độ</span><span class="v">${p.form.toFixed(1)}</span>
            ${p.injury > 0 ? `<span class="k">Chấn thương</span><span class="v" style="color:var(--red)">${esc(p.injuryName)} (~${Math.ceil(p.injury / 7)} tuần)</span>` : ""}
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:14px;box-shadow:none"><h3>Mùa ${G.seasonLabel()}</h3>
        <div class="grid g4 center">
          <div><div class="stat-big">${st.apps}</div><div class="tiny muted">Trận (${st.sub} dự bị)</div></div>
          <div><div class="stat-big">${st.goals}</div><div class="tiny muted">Bàn thắng</div></div>
          <div><div class="stat-big">${st.assists}</div><div class="tiny muted">Kiến tạo</div></div>
          <div><div class="stat-big">${avg ? avg.toFixed(2) : "—"}</div><div class="tiny muted">Điểm TB</div></div>
        </div>
        <div class="tiny muted center" style="margin-top:8px">Sạch lưới: ${st.cs} · Thẻ vàng: ${st.yc} · Thẻ đỏ: ${st.rc} · Cầu thủ hay nhất trận: ${st.motm} · Sự nghiệp (trong game): ${p.career.apps} trận, ${p.career.goals} bàn, ${p.career.assists} kiến tạo</div>
      </div>`;
      let footer = "";
      if (mine) {
        footer = `<button class="btn" data-act="toggleList" data-id="${pid}">${p.listed ? "Huỷ rao bán" : "Rao bán"}</button>
          <button class="btn" data-act="renew" data-id="${pid}">Gia hạn hợp đồng</button>
          <button class="btn danger" data-act="releasePlayer" data-id="${pid}">Giải phóng</button>`;
      } else if (academy) {
        footer = `<button class="btn primary" data-act="promoteYouth" data-id="${pid}">Ký HĐ chuyên nghiệp</button><button class="btn danger" data-act="releaseYouth" data-id="${pid}">Giải phóng</button>`;
      } else {
        footer = `<button class="btn" data-act="shortlist" data-id="${pid}">${shortlisted ? "★ Bỏ theo dõi" : "☆ Theo dõi"}</button>
          <button class="btn primary" data-act="bid" data-id="${pid}">${club ? "Hỏi mua" : "Ký hợp đồng (tự do)"}</button>`;
      }
      this.modal(esc(p.name), body, { footer, size: "" });
    },

    clubModal(cid) {
      const c = G.s.clubs[cid];
      const squad = G.squad(cid).sort((a, b) => PL.POS_ORDER[a.pos] - PL.POS_ORDER[b.pos] || b.ovr - a.ovr);
      const avg = FC.transfers.avgTop(G.s, c, 11).toFixed(1);
      const body = `<div class="row" style="gap:16px;margin-bottom:14px">${FC.crest(c, 72)}<div>
        <div style="font-size:20px;font-weight:800">${esc(c.name)}</div>
        <div class="muted small">${esc(c.city)} · Thành lập ${c.founded} · ${esc(c.stadium)} (${c.cap.toLocaleString("vi-VN")} chỗ)</div>
        <div>${this.h.stars(c.rep)} <span class="tiny muted">Sơ đồ ${c.tactics.formation} · Sức mạnh TB ${avg}</span></div></div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>VT</th><th>Cầu thủ</th><th class="num">Tuổi</th><th class="num">OVR</th><th class="num">Giá trị</th><th></th></tr></thead><tbody>
        ${squad.map((p) => `<tr class="click" data-act="player" data-id="${p.id}"><td class="muted">${p.num || ""}</td><td>${this.h.pos(p.pos)}</td><td>${this.h.flag(p.nat)} ${esc(p.name)}</td><td class="num">${p.age}</td><td class="num">${this.h.ovr(p.ovr)}</td><td class="num">${U.money(p.value)}</td><td>${this.h.status(p)}</td></tr>`).join("")}
        </tbody></table></div>`;
      this.modal(esc(c.name), body, { size: "wide" });
    },
  };

  // Điều hướng & sự kiện chung
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    const fn = App.actions[act];
    if (fn) {
      e.preventDefault();
      fn.call(App, el.dataset, el, e);
    }
  });
  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-change]");
    if (!el) return;
    const fn = App.actions[el.dataset.change];
    if (fn) fn.call(App, el.dataset, el, e);
  });
  document.addEventListener("input", (e) => {
    const el = e.target.closest("[data-input]");
    if (!el) return;
    const fn = App.actions[el.dataset.input];
    if (fn) fn.call(App, el.dataset, el, e);
  });

  App.on("nav", function (d) { this.go(d.id); });
  App.on("player", function (d) { this.playerModal(d.id); });
  App.on("clubInfo", function (d) { this.clubModal(d.id); });
  App.on("tab", function (d) { this.tabs[this.view] = d.id; this.render(); });

  App.on("startNew", function () { this.st.start.step = "pick"; this.render(); });
  App.on("startBack", function () { this.st.start.step = "menu"; this.render(); });
  App.on("pickClub", function (d) {
    const nm = document.getElementById("mgr-name");
    if (nm) this.st.start.name = nm.value;
    const sl = document.getElementById("save-slot");
    if (sl) this.slot = +sl.value;
    this.st.start.club = d.id;
    this.render();
  });
  App.on("startGo", function () {
    const name = (document.getElementById("mgr-name").value || "").trim() || "HLV";
    this.slot = +document.getElementById("save-slot").value;
    G.newGame(name, this.st.start.club);
    G.save(this.slot);
    this.view = "home";
    this.render();
    this.toast(`Chào mừng HLV ${esc(name)} tới ${esc(G.user.name)}!`);
  });
  App.on("loadSlot", function (d) {
    if (G.load(+d.id)) {
      this.slot = +d.id;
      this.view = "home";
      this.render();
      this.toast("Đã tải sự nghiệp.");
      if (G.s.sacked) this.showSacked();
    } else this.toast("Không tải được bản lưu.", true);
  });
  App.on("delSlot", function (d) {
    this.confirm("Xoá bản lưu", `Xoá vĩnh viễn khe lưu ${d.id}?`, "Xoá", () => { G.deleteSave(+d.id); this.render(); }, true);
  });

  FC.App = App;
})();
