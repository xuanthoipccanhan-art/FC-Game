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
    ["news", "📰", "Tin tức"], ["staff", "🧑‍💼", "Nhân sự"], ["finance", "💰", "Tài chính"], ["stats", "📊", "Thống kê"], ["inbox", "✉️", "Hộp thư"], ["club", "🏟️", "CLB & Sự nghiệp"],
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
        if (p.loan) t.push(`<span class="tag blue" title="Cho mượn từ ${esc((G.s.clubs[p.loan.from] || {}).name || "")}">Mượn</span>`);
        if (p.res) t.push(`<span class="tag">U21</span>`);
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
      compTag(f) {
        const col = FC.comp.compColor(f);
        return `<span class="tag" title="${esc(FC.comp.compName(f))}" style="background:${col}22;color:${col}">${FC.comp.compShort(f)}</span>`;
      },
      league(lid) {
        const L = FC.LEAGUES[lid];
        return L ? `<span class="tag" style="background:${L.color}22;color:${L.color}">${FC.flag(L.country)} ${esc(L.name)}</span>` : "";
      },
      pot(p) {
        const sc = G.s && G.s.staff && G.s.staff.scout ? G.s.staff.scout.rating : 8;
        if (p.clubId === (G.s && G.s.userClub) || p.academy || sc >= 15) return String(p.pot);
        const step = sc >= 11 ? 2 : 4;
        return "~" + Math.round(p.pot / step) * step;
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
      if (G.s.careerOver) nextLabel = "Kết thúc sự nghiệp";
      else if (G.s.seasonEnded) nextLabel = "Tổng kết mùa";
      else if (G.s.pendingEvents.length) nextLabel = `Sự kiện (${G.s.pendingEvents.length})`;
      else if (next) nextLabel = `Tới trận: ${G.s.clubs[next.home === u.id ? next.away : next.home].short}`;
      else if (ev) nextLabel = "Tiếp tục mùa giải";
      const screen = (this.screens[this.view] || this.screens.home).call(this);
      app.innerHTML = `<div class="layout">
        <aside class="sidebar">
          <div class="brand"><div class="logo">PB</div><div>Pitch Boss 27<small>Quản lý bóng đá</small></div></div>
          ${nav}
          <div style="margin-top:auto;padding:10px 6px" class="tiny muted">Mùa ${G.seasonLabel()} · ${esc(G.s.manager.name)}</div>
        </aside>
        <div class="main">
          <header class="topbar">
            <div class="club">${FC.crest(u, 34)}<div style="min-width:0"><div class="nm">${esc(u.name)}</div><div class="tiny muted">${U.fmtDate(G.s.date)} · ${esc(FC.LEAGUES[u.league].short)} · Mùa ${G.seasonNo()}/${G.MAX_SEASONS}${FC.transfers.isWindowOpen(G.s.date) ? ' · <span style="color:var(--accent)">TTCN mở</span>' : ""}</div></div></div>
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
      const st = this.st.start || (this.st.start = { step: "menu", club: null, name: "", league: "ENG1", phil: "pragmatic", nat: "VIE" });
      const slots = [1, 2, 3].map((i) => ({ i, meta: G.saveMeta(i) }));
      if (st.step === "menu") {
        const hasSave = slots.some((s) => s.meta);
        return `<div class="start"><div class="start-box">
          <div class="hero"><div class="tiny muted" style="letter-spacing:3px">MÙA GIẢI ${G.START_YEAR}/${String((G.START_YEAR + 1) % 100)} · TỐI ĐA ${G.MAX_SEASONS} MÙA</div>
            <h1>Pitch Boss <em>27</em></h1>
            <p>312 CLB thật · 16 giải · Lên/xuống hạng · Cúp C1 & Libertadores · Tin đồn chuyển nhượng · Drama trong & ngoài sân cỏ</p></div>
          <div class="grid g2" style="max-width:820px;margin:0 auto">
            <div class="card col"><h3>⚽ Sự nghiệp mới</h3><p class="muted small" style="margin:0">Chọn CLB ở Anh, Tây Ban Nha, Ý, Đức, Pháp, Bồ Đào Nha, Hà Lan, Ả Rập, Mỹ, Brazil hoặc Argentina.</p>
              <button class="btn primary" data-act="startNew">Bắt đầu sự nghiệp mới</button></div>
            <div class="card col"><h3>💾 Tải sự nghiệp</h3>
              ${hasSave ? slots.filter((s) => s.meta).map((s) => `<div class="list-item"><div class="grow"><div class="b">${esc(s.meta.name)}</div><div class="tiny muted">HLV ${esc(s.meta.manager)} · ${s.meta.season} · ${U.fmtDate(s.meta.date, false)}</div></div>
                <button class="btn sm primary" data-act="loadSlot" data-id="${s.i}">Tải</button><button class="btn sm danger" data-act="delSlot" data-id="${s.i}">Xoá</button></div>`).join("") : `<div class="empty">Chưa có bản lưu nào.</div>`}
            </div>
          </div>
          <p class="center tiny muted" style="margin-top:24px">Game của người hâm mộ, không liên kết với bất kỳ giải đấu, CLB hay nhà phát hành nào. Tên cầu thủ, HLV & CLB chỉ dùng để mô tả; chỉ số là ước lượng của trò chơi.<br>Muốn dùng logo chính thức? Thả file <code>logos/&lt;mã-clb&gt;.png</code> vào thư mục game (xem README).</p>
        </div></div>`;
      }
      const clubs = FC.WORLD.byLeague[st.league].slice().sort((a, b) => b.rep - a.rep);
      const sel = st.club ? FC.WORLD.clubs.find((c) => c.id === st.club) : null;
      const leagueTabs = FC.COUNTRY_ORDER.map((ct) => Object.entries(FC.LEAGUES).filter(([, L]) => L.country === ct).map(([lid, L]) =>
        `<button class="tab ${st.league === lid ? "on" : ""}" data-act="pickLeague" data-id="${lid}">${FC.flag(ct)} ${esc(L.name)}</button>`).join("")).join("");
      const philOpts = Object.entries(FC.PHILOSOPHIES).map(([k, ph]) => `<option value="${k}" ${st.phil === k ? "selected" : ""}>${esc(ph.name)}</option>`).join("");
      return `<div class="start"><div class="start-box">
        <div class="row between" style="margin-bottom:14px"><button class="btn ghost" data-act="startBack">← Quay lại</button><h2>Chọn CLB của bạn</h2><span></span></div>
        <div class="card" style="margin-bottom:14px"><div class="row wrap">
          <label class="b">Tên HLV:</label><input type="text" id="mgr-name" maxlength="30" placeholder="Nhập tên của bạn" value="${esc(st.name)}" style="flex:1;min-width:160px">
          <select id="mgr-nat">${Object.entries(FC.NATIONS).sort((a, b) => a[1][0].localeCompare(b[1][0])).map(([k, v]) => `<option value="${k}" ${st.nat === k ? "selected" : ""}>${FC.flag(k)} ${esc(v[0])}</option>`).join("")}</select>
          <select id="mgr-phil" title="Triết lý bóng đá">${philOpts}</select>
          <select id="save-slot">${[1, 2, 3].map((i) => `<option value="${i}" ${i === this.slot ? "selected" : ""}>Khe lưu ${i}${G.saveMeta(i) ? " (ghi đè)" : ""}</option>`).join("")}</select>
          <button class="btn primary" data-act="startGo" ${sel ? "" : "disabled"}>Bắt đầu với ${sel ? esc(sel.name) : "..."} ▶</button>
        </div><div class="tiny muted" style="margin-top:6px">${esc(FC.PHILOSOPHIES[st.phil].desc)}</div></div>
        <div class="tabs">${leagueTabs}</div>
        ${FC.LEAGUES[st.league].closed ? `<p class="small muted">${esc(FC.LEAGUES[st.league].closed)}</p>` : ""}
        <div class="club-grid">${clubs.map((c) => `<button class="club-pick ${st.club === c.id ? "on" : ""}" data-act="pickClub" data-id="${c.id}">
          ${FC.crest(c, 42)}<div class="grow"><div class="b">${esc(c.name)}</div>${this.h.stars(c.rep)}<div class="tiny muted">Ngân sách ${U.money(c.money)}${c.manager ? ` · HLV hiện tại: ${esc(c.manager.name)}` : ""}</div></div></button>`).join("")}</div>
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
      const ownedByMe = mine && !p.loan;
      const loanedFromMe = p.loan && p.loan.from === s.userClub;
      const academy = p.academy;
      const club = p.clubId ? s.clubs[p.clubId] : null;
      const st = p.stats;
      const avg = PL.avgRating(p);
      const ask = club && !mine && !p.loan ? FC.transfers.askingPrice(s, p) : null;
      const shortlisted = s.shortlist.includes(pid);
      const body = `<div class="row wrap" style="align-items:flex-start;gap:18px">
        ${this.playerCard(p)}
        <div class="grow col" style="min-width:240px">
          <div><div style="font-size:20px;font-weight:800">${esc(p.name)} ${p.num ? `<span class="muted">#${p.num}</span>` : ""}</div>
          <div class="muted">${PL.POS_VI[p.pos]} · ${p.age} tuổi · ${FC.flag(p.nat)} ${esc(FC.natName(p.nat))}</div>
          <div style="margin-top:6px">${club ? this.h.club(club.id, 20) : academy ? '<span class="tag green">Học viện</span>' : '<span class="tag">Cầu thủ tự do</span>'} ${this.h.status(p)}</div></div>
          <div class="kv">
            <span class="k">Chỉ số / Tiềm năng</span><span class="v">${p.ovr} / ${this.h.pot(p)}</span>
            <span class="k">Tính cách</span><span class="v">${PL.PERSONALITIES[p.pers] || "—"}</span>
            <span class="k">Giá trị</span><span class="v">${U.money(p.value)}</span>
            ${ask != null ? `<span class="k">Giá CLB muốn bán</span><span class="v" style="color:var(--gold)">${U.money(ask)}</span>` : ""}
            ${p.clause ? `<span class="k">Điều khoản giải phóng</span><span class="v">${U.money(p.clause)}</span>` : ""}
            <span class="k">Lương</span><span class="v">${academy ? "—" : U.wage(p.wage)}</span>
            <span class="k">Hợp đồng</span><span class="v">${academy ? "Chưa ký" : club ? `${p.contract} năm (đến 06/${s.season + p.contract})` : "—"}</span>
            ${p.loan ? `<span class="k">Cho mượn</span><span class="v">từ ${esc(s.clubs[p.loan.from].name)} · ${p.loan.wagePct}% lương${p.loan.buyFee ? ` · mua đứt ${U.money(p.loan.buyFee)}` : ""}</span>` : ""}
            <span class="k">Thể lực</span><span class="v">${Math.round(p.fitness)}%</span>
            <span class="k">Tinh thần</span><span class="v">${this.h.morale(p.morale)}</span>
            <span class="k">Phong độ</span><span class="v">${p.form.toFixed(1)}</span>
            ${p.injury > 0 ? `<span class="k">Vắng mặt</span><span class="v" style="color:var(--red)">${esc(p.injuryName)} (~${Math.ceil(p.injury / 7)} tuần)</span>` : ""}
          </div>
          ${p.gen ? `<div class="tiny muted">ⓖ Cầu thủ do trò chơi tạo để đủ đội hình${p.academyOf ? ` (lò đào tạo ${esc((s.clubs[p.academyOf] || {}).name || "")})` : ""}.</div>` : ""}
        </div>
      </div>
      <div class="card" style="margin-top:14px;box-shadow:none"><h3>Mùa ${G.seasonLabel()}</h3>
        <div class="grid g4 center">
          <div><div class="stat-big">${st.apps}</div><div class="tiny muted">Trận (${st.sub} dự bị)</div></div>
          <div><div class="stat-big">${st.goals}</div><div class="tiny muted">Bàn thắng</div></div>
          <div><div class="stat-big">${st.assists}</div><div class="tiny muted">Kiến tạo</div></div>
          <div><div class="stat-big">${avg ? avg.toFixed(2) : "—"}</div><div class="tiny muted">Điểm TB</div></div>
        </div>
        <div class="tiny muted center" style="margin-top:8px">Sạch lưới: ${st.cs} · Thẻ vàng: ${st.yc} · Thẻ đỏ: ${st.rc} · Hay nhất trận: ${st.motm} · Sự nghiệp (trong game): ${p.career.apps} trận, ${p.career.goals} bàn${p.career.ballon ? ` · 🏆 ${p.career.ballon} Quả bóng vàng` : ""}</div>
        ${p.career.clubs && p.career.clubs.length > 1 ? `<div class="tiny muted center">Các CLB: ${p.career.clubs.map((c) => esc((s.clubs[c] || {}).short || c)).join(" → ")}</div>` : ""}
      </div>`;
      let footer = "";
      if (ownedByMe) {
        footer = `<button class="btn" data-act="toggleRes" data-id="${pid}">${p.res ? "⬆️ Đôn lên đội một" : "⬇️ Xuống đội trẻ"}</button>
          <button class="btn" data-act="loanOut" data-id="${pid}">Cho mượn</button>
          <button class="btn" data-act="toggleList" data-id="${pid}">${p.listed ? "Huỷ rao bán" : "Rao bán"}</button>
          <button class="btn" data-act="renew" data-id="${pid}">Gia hạn HĐ</button>
          <button class="btn danger" data-act="releasePlayer" data-id="${pid}">Giải phóng</button>`;
      } else if (mine && p.loan) {
        footer = p.loan.buyFee ? `<button class="btn ${s.buyLoan && s.buyLoan[pid] ? "active" : ""}" data-act="toggleBuyLoan" data-id="${pid}">${s.buyLoan && s.buyLoan[pid] ? "✔ Sẽ mua đứt cuối mùa" : `Mua đứt cuối mùa (${U.money(p.loan.buyFee)})`}</button>` : `<span class="small muted">Cầu thủ đang mượn, sẽ trở về ${esc(s.clubs[p.loan.from].name)} cuối mùa.</span>`;
      } else if (loanedFromMe) {
        footer = `<span class="small muted">Đang cho ${esc(club.name)} mượn đến hết mùa.</span>`;
      } else if (academy) {
        footer = `<button class="btn primary" data-act="promoteYouth" data-id="${pid}">Ký HĐ chuyên nghiệp</button><button class="btn danger" data-act="releaseYouth" data-id="${pid}">Giải phóng</button>`;
      } else {
        footer = `<button class="btn" data-act="shortlist" data-id="${pid}">${shortlisted ? "★ Bỏ theo dõi" : "☆ Theo dõi"}</button>
          ${club && !p.loan ? `<button class="btn" data-act="loanIn" data-id="${pid}">Hỏi mượn</button>` : ""}
          <button class="btn primary" data-act="bid" data-id="${pid}">${club ? "Hỏi mua" : "Ký hợp đồng (tự do)"}</button>`;
      }
      this.modal(esc(p.name), body, { footer, size: "" });
    },

    clubModal(cid) {
      const c = G.s.clubs[cid];
      const squad = G.squad(cid).sort((a, b) => PL.POS_ORDER[a.pos] - PL.POS_ORDER[b.pos] || b.ovr - a.ovr);
      const avg = FC.transfers.avgTop(G.s, c, 11).toFixed(1);
      const m = G.s.managers[c.mgr];
      const body = `<div class="row" style="gap:16px;margin-bottom:14px">${FC.crest(c, 72)}<div>
        <div style="font-size:20px;font-weight:800">${esc(c.name)}</div>
        <div class="muted small">${esc(c.city)} · Thành lập ${c.founded} · ${esc(c.stadium)} (${c.cap.toLocaleString("vi-VN")} chỗ)</div>
        <div>${this.h.league(c.league)} ${this.h.stars(c.rep)} <span class="tiny muted">Sơ đồ ${c.tactics.formation} · Sức mạnh TB ${avg} · Học viện cấp ${c.facilities.youth}</span></div>
        ${m ? `<div class="small" style="margin-top:4px">HLV: <b>${esc(m.name)}</b> ${FC.flag(m.nat)} · Triết lý: ${esc(FC.PHILOSOPHIES[m.phil].name)}</div>` : ""}</div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>VT</th><th>Cầu thủ</th><th class="num">Tuổi</th><th class="num">OVR</th><th class="num">Giá trị</th><th></th></tr></thead><tbody>
        ${squad.map((p) => `<tr class="click" data-act="player" data-id="${p.id}"><td class="muted">${p.num || ""}</td><td>${this.h.pos(p.pos)}</td><td>${this.h.flag(p.nat)} ${esc(p.name)}${p.gen ? ' <span class="tiny muted">ⓖ</span>' : ""}</td><td class="num">${p.age}</td><td class="num">${this.h.ovr(p.ovr)}</td><td class="num">${U.money(p.value)}</td><td>${this.h.status(p)}</td></tr>`).join("")}
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
  function keepStartInputs() {
    const st = App.st.start;
    const nm = document.getElementById("mgr-name"); if (nm) st.name = nm.value;
    const ph = document.getElementById("mgr-phil"); if (ph) st.phil = ph.value;
    const na = document.getElementById("mgr-nat"); if (na) st.nat = na.value;
    const sl = document.getElementById("save-slot"); if (sl) App.slot = +sl.value;
  }
  App.on("pickLeague", function (d) { keepStartInputs(); this.st.start.league = d.id; this.render(); });
  App.on("pickClub", function (d) { keepStartInputs(); this.st.start.club = d.id; this.render(); });
  document.addEventListener("change", (e) => { if (e.target.id === "mgr-phil") { keepStartInputs(); App.render(); } });
  App.on("startGo", function () {
    keepStartInputs();
    const st = this.st.start;
    const name = (st.name || "").trim() || "HLV";
    const btn = document.querySelector("[data-act=startGo]");
    if (btn) { btn.disabled = true; btn.textContent = "Đang tạo thế giới bóng đá..."; }
    setTimeout(() => {
      G.newGame(name, st.club, st.phil, st.nat);
      G.save(this.slot);
      this.view = "home";
      this.render();
      this.toast(`Chào mừng HLV ${esc(name)} tới ${esc(G.user.name)}!`);
      this.checkEvents();
    }, 30);
  });
  App.on("loadSlot", async function (d) {
    if (await G.load(+d.id)) {
      this.slot = +d.id;
      this.view = "home";
      this.render();
      this.toast("Đã tải sự nghiệp.");
      if (G.s.sacked) this.showSacked();
      else this.checkEvents();
    } else this.toast("Không tải được bản lưu (có thể từ phiên bản cũ).", true);
  });
  App.on("delSlot", function (d) {
    this.confirm("Xoá bản lưu", `Xoá vĩnh viễn khe lưu ${d.id}?`, "Xoá", async () => { await G.deleteSave(+d.id); this.render(); }, true);
  });

  FC.App = App;
})();
