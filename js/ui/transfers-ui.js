/* Chuyển nhượng: tìm kiếm, theo dõi, đàm phán */
(function () {
  const FC = window.FC;
  const U = FC.util;
  const PL = FC.players;
  const G = FC.Game;
  const TR = FC.transfers;
  const App = FC.App;
  const esc = U.esc;
  const h = App.h;

  function playerTable(list, opts = {}) {
    if (!list.length) return `<div class="empty">${opts.empty || "Không có cầu thủ phù hợp."}</div>`;
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>VT</th><th>Cầu thủ</th><th class="num">Tuổi</th><th class="num">OVR</th><th class="num">TN*</th><th>CLB</th><th class="num">Giá trị</th><th class="num">Lương</th><th class="num">HĐ</th><th></th></tr></thead><tbody>
      ${list.map((p) => `<tr class="click" data-act="player" data-id="${p.id}"><td>${h.pos(p.pos)}</td><td>${h.flag(p.nat)} <b>${esc(p.name)}</b></td><td class="num">${p.age}</td><td class="num">${h.ovr(p.ovr)}</td>
        <td class="num muted">~${Math.round(p.pot / 3) * 3}</td><td>${p.clubId ? h.clubStatic(G.s.clubs[p.clubId], 18, true) : '<span class="tag green">Tự do</span>'}</td>
        <td class="num">${U.money(p.value)}</td><td class="num small">${U.wage(p.wage)}</td><td class="num">${p.clubId ? p.contract + "n" : "—"}</td><td>${h.status(p)}${G.s.shortlist.includes(p.id) ? " ★" : ""}</td></tr>`).join("")}
    </tbody></table></div>${opts.note ? `<div class="tiny muted" style="margin-top:6px">${opts.note}</div>` : ""}`;
  }

  App.screens.transfers = function () {
    const s = G.s, u = G.user;
    const tab = App.tabs.transfers || "search";
    const open = TR.isWindowOpen(s.date);
    const head = `<div class="grid g4" style="margin-bottom:14px">
      <div class="card"><div class="small muted">Kỳ chuyển nhượng</div><div class="b" style="color:${open ? "var(--accent)" : "var(--red)"}">${open ? "ĐANG MỞ" : "ĐÃ ĐÓNG"}</div><div class="tiny muted">Hè: 15/06–01/09 · Đông: 01/01–02/02</div></div>
      <div class="card"><div class="small muted">Ngân sách chuyển nhượng</div><div class="stat-big">${U.money(u.transferBudget)}</div></div>
      <div class="card"><div class="small muted">Quỹ lương còn trống</div><div class="stat-big" style="font-size:20px">${U.wage(Math.max(0, u.wageBudget - G.wageBill(u.id)))}</div></div>
      <div class="card"><div class="small muted">Số cầu thủ</div><div class="stat-big">${u.players.length}<span class="small muted">/32</span></div></div></div>`;
    const tabsHtml = `<div class="tabs">${[["search", "🔎 Tìm kiếm"], ["shortlist", `★ Theo dõi (${s.shortlist.length})`], ["free", "🆓 Cầu thủ tự do"], ["selling", `🏷️ Rao bán & đề nghị (${s.pendingOffers.length})`], ["log", "📰 Tin chuyển nhượng"]]
      .map(([k, l]) => `<button class="tab ${tab === k ? "on" : ""}" data-act="tab" data-id="${k}">${l}</button>`).join("")}</div>`;
    let body = "";
    if (tab === "search") {
      const f = App.st.tsearch || (App.st.tsearch = { q: "", pos: "", maxAge: 40, maxPrice: 0, minOvr: 70, league: "", sort: "ovr" });
      let list = Object.values(s.players).filter((p) => p.clubId && p.clubId !== u.id && !p.academy);
      if (f.q) { const q = f.q.toLowerCase(); list = list.filter((p) => p.name.toLowerCase().includes(q) || s.clubs[p.clubId].name.toLowerCase().includes(q)); }
      if (f.pos) list = list.filter((p) => (f.pos.length > 3 ? PL.GROUP[p.pos] === f.pos.slice(1) : p.pos === f.pos));
      if (f.league) list = list.filter((p) => s.clubs[p.clubId].league === f.league);
      list = list.filter((p) => p.age <= f.maxAge && p.ovr >= f.minOvr && (!f.maxPrice || p.value <= f.maxPrice));
      const sorters = { ovr: (a, b) => b.ovr - a.ovr, value: (a, b) => a.value - b.value, age: (a, b) => a.age - b.age, pot: (a, b) => b.pot - a.pot };
      list.sort(sorters[f.sort]);
      const total = list.length;
      list = list.slice(0, 80);
      body = `<div class="card"><div class="row wrap" style="margin-bottom:12px">
        <input type="text" placeholder="Tên cầu thủ / CLB" value="${esc(f.q)}" data-change="tsf" data-id="q" style="flex:1;min-width:160px">
        <select data-change="tsf" data-id="pos"><option value="">Mọi vị trí</option>${["_GK", "_DEF", "_MID", "_ATT"].map((g) => `<option value="${g}" ${f.pos === g ? "selected" : ""}>Nhóm ${{ _GK: "Thủ môn", _DEF: "Hậu vệ", _MID: "Tiền vệ", _ATT: "Tiền đạo" }[g]}</option>`).join("")}${PL.POS.map((p) => `<option ${f.pos === p ? "selected" : ""}>${p}</option>`).join("")}</select>
        <select data-change="tsf" data-id="league"><option value="">Mọi giải</option><option value="ENG" ${f.league === "ENG" ? "selected" : ""}>Ngoại hạng Anh</option><option value="EUR" ${f.league === "EUR" ? "selected" : ""}>CLB châu Âu</option></select>
        <label class="small muted">OVR ≥ <input type="number" min="40" max="99" value="${f.minOvr}" data-change="tsf" data-id="minOvr" style="width:64px"></label>
        <label class="small muted">Tuổi ≤ <input type="number" min="16" max="40" value="${f.maxAge}" data-change="tsf" data-id="maxAge" style="width:64px"></label>
        <label class="small muted">Giá ≤ <input type="number" min="0" step="5" value="${f.maxPrice || ""}" placeholder="tr €" data-change="tsf" data-id="maxPrice" style="width:80px"></label>
        <select data-change="tsf" data-id="sort">${[["ovr", "Sắp: OVR"], ["pot", "Sắp: Tiềm năng"], ["value", "Sắp: Giá rẻ"], ["age", "Sắp: Trẻ nhất"]].map(([k, l]) => `<option value="${k}" ${f.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select>
      </div>${playerTable(list, { note: `Hiển thị ${list.length}/${total} kết quả. *TN = tiềm năng do tuyển trạch viên ước lượng.` })}</div>`;
    } else if (tab === "shortlist") {
      body = `<div class="card">${playerTable(s.shortlist.map((id) => s.players[id]).filter(Boolean), { empty: "Chưa theo dõi cầu thủ nào. Mở hồ sơ cầu thủ và bấm ☆ Theo dõi." })}</div>`;
    } else if (tab === "free") {
      const list = s.freeAgents.map((id) => s.players[id]).filter(Boolean).sort((a, b) => b.ovr - a.ovr);
      body = `<div class="card">${playerTable(list, { empty: "Hiện không có cầu thủ tự do. Cầu thủ hết hợp đồng cuối mùa sẽ xuất hiện ở đây.", note: "Cầu thủ tự do có thể ký bất kỳ lúc nào, không mất phí chuyển nhượng." })}</div>`;
    } else if (tab === "selling") {
      const listed = G.squad(u.id).filter((p) => p.listed);
      body = `<div class="grid g2"><div class="card"><h3>🏷️ Cầu thủ đang rao bán</h3>${playerTable(listed, { empty: "Chưa rao bán ai. Mở hồ sơ cầu thủ và bấm “Rao bán”." })}</div>
        <div class="card"><h3>💶 Đề nghị đang chờ</h3>${s.pendingOffers.length ? s.pendingOffers.map((o) => {
          const p = s.players[o.pid];
          return `<div class="list-item">${FC.crest(s.clubs[o.clubId], 26)}<div class="grow"><b>${esc(s.clubs[o.clubId].name)}</b> hỏi mua ${h.pname(p)}<div class="tiny muted">Giá trị ${U.money(p.value)}</div></div><b>${U.money(o.fee)}</b>
            <button class="btn sm primary" data-act="acceptOffer" data-id="${o.id}">Bán</button><button class="btn sm danger" data-act="rejectOffer" data-id="${o.id}">✕</button></div>`;
        }).join("") : '<div class="empty">Chưa có đề nghị nào. Các CLB khác gửi đề nghị hằng tuần trong kỳ chuyển nhượng.</div>'}</div></div>`;
    } else {
      body = `<div class="card"><table class="tbl"><thead><tr><th>Ngày</th><th>Cầu thủ</th><th>Từ</th><th>Đến</th><th class="num">Phí</th></tr></thead><tbody>${s.transferLog.slice(0, 80).map((t) => {
        const p = s.players[t.pid];
        return `<tr class="${p ? "click" : ""}" ${p ? `data-act="player" data-id="${t.pid}"` : ""}><td class="small">${U.fmtDate(t.date, false)}</td><td><b>${esc(t.name)}</b></td><td>${t.from ? h.clubStatic(s.clubs[t.from], 18, true) : '<span class="tag green">Tự do</span>'}</td><td>${h.clubStatic(s.clubs[t.to], 18, true)}</td><td class="num b">${t.fee ? U.money(t.fee) : "Miễn phí"}</td></tr>`;
      }).join("") || '<tr><td colspan="5" class="empty">Chưa có giao dịch nào.</td></tr>'}</tbody></table></div>`;
    }
    return `<h2 class="title">Chuyển nhượng</h2>${head}${tabsHtml}${body}`;
  };

  App.on("tsf", function (d, el) {
    const f = App.st.tsearch;
    const v = el.type === "number" ? +el.value || 0 : el.value;
    f[d.id] = v;
    if (d.id === "maxAge" && !v) f.maxAge = 40;
    this.render();
  });

  App.on("shortlist", function (d) {
    const s = G.s;
    if (s.shortlist.includes(d.id)) s.shortlist = s.shortlist.filter((x) => x !== d.id);
    else s.shortlist.push(d.id);
    this.closeAllModals();
    this.playerModal(d.id);
    if (this.view === "transfers") this.render();
  });

  App.on("toggleList", function (d) {
    const p = G.s.players[d.id];
    p.listed = !p.listed;
    if (p.listed) p.morale = U.clamp(p.morale - 6, 0, 100);
    this.toast(p.listed ? `${esc(p.name)} được đưa vào danh sách chuyển nhượng.` : `Đã gỡ ${esc(p.name)} khỏi danh sách bán.`);
    this.closeAllModals();
    this.render();
  });

  App.on("releasePlayer", function (d) {
    const p = G.s.players[d.id];
    const cost = Math.round(((p.wage * 52 * p.contract) / 1000) * 0.5 * 10) / 10;
    if (G.user.players.length <= 16) return this.toast("Đội hình quá mỏng để giải phóng thêm.", true);
    this.confirm("Giải phóng hợp đồng", `Giải phóng ${esc(p.name)}? CLB phải đền bù 50% lương còn lại: <b>${U.money(cost)}</b>.`, "Giải phóng", () => {
      FC.transfers.release(G.s, d.id);
      this.closeAllModals();
      this.toast(`${esc(p.name)} đã trở thành cầu thủ tự do.`);
      this.render();
    }, true);
  });

  // ===== Gia hạn hợp đồng =====
  App.on("renew", function (d) {
    const p = G.s.players[d.id];
    const demand = TR.wageDemand(G.s, p, G.s.userClub);
    const maxY = p.age >= 32 ? 2 : 5;
    const m = this.modal(`Gia hạn hợp đồng: ${esc(p.name)}`, `<div class="kv small" style="margin-bottom:12px"><span class="k">Lương hiện tại</span><span class="v">${U.wage(p.wage)}</span><span class="k">Yêu cầu của người đại diện</span><span class="v" style="color:var(--gold)">${U.wage(demand)}</span><span class="k">Hợp đồng còn</span><span class="v">${p.contract} năm</span></div>
      <div class="row wrap"><label>Lương (nghìn €/tuần) <input type="number" id="rn-w" value="${demand}" min="1" style="width:110px"></label>
      <label>Thời hạn <select id="rn-y">${[1, 2, 3, 4, 5].filter((y) => y <= maxY).map((y) => `<option ${y === Math.min(maxY, 3) ? "selected" : ""}>${y}</option>`).join("")}</select> năm</label></div><div id="rn-msg" class="small" style="margin-top:10px"></div>`,
      { size: "narrow", footer: `<button class="btn" data-close>Đóng</button><button class="btn primary" id="rn-go">Đề nghị</button>` });
    m.querySelector("#rn-go").onclick = () => {
      const r = G.renewContract(p.id, +m.querySelector("#rn-w").value, +m.querySelector("#rn-y").value);
      m.querySelector("#rn-msg").innerHTML = `<span style="color:${r.ok ? "var(--accent)" : "var(--red)"}">${esc(r.msg)}</span>`;
      if (r.ok) { this.toast(esc(r.msg)); setTimeout(() => { this.closeAllModals(); this.render(); }, 700); }
    };
  });

  // ===== Hỏi mua / ký hợp đồng =====
  App.on("bid", function (d) {
    const s = G.s;
    const p = s.players[d.id];
    const free = !p.clubId;
    const st = { fee: free ? 0 : null, step: free ? "contract" : "fee" };
    const u = G.user;
    const est = TR.askingPrice(s, p);
    const scoutLo = Math.round(est * 0.9 * 10) / 10, scoutHi = Math.round(est * 1.15 * 10) / 10;
    this.closeAllModals();
    const m = this.modal(`${free ? "Ký hợp đồng" : "Hỏi mua"}: ${esc(p.name)}`, `<div id="ng"></div>`, { size: "narrow" });
    const box = m.querySelector("#ng");
    const draw = (msg, ok) => {
      const msgHtml = msg ? `<div class="small" style="margin:10px 0;color:${ok ? "var(--accent)" : ok === false ? "var(--red)" : "var(--gold)"}">${msg}</div>` : "";
      if (st.step === "fee") {
        box.innerHTML = `<div class="row" style="margin-bottom:12px">${FC.crest(s.clubs[p.clubId], 36)}<div><b>${esc(p.name)}</b> · ${p.pos} · ${p.ovr}<div class="tiny muted">${esc(s.clubs[p.clubId].name)} · HĐ còn ${p.contract} năm</div></div></div>
          <div class="kv small"><span class="k">Giá trị thị trường</span><span class="v">${U.money(p.value)}</span><span class="k">Tuyển trạch viên ước tính</span><span class="v">${U.money(scoutLo)} – ${U.money(scoutHi)}</span><span class="k">Ngân sách của bạn</span><span class="v">${U.money(u.transferBudget)}</span></div>
          <div class="row" style="margin-top:12px"><label class="grow">Mức phí đề nghị (triệu €)<input type="number" id="ng-fee" step="0.5" min="0" value="${st.counter || Math.round(p.value * 10) / 10}" style="width:100%"></label></div>
          ${msgHtml}<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Huỷ</button>${st.counter ? `<button class="btn gold" id="ng-acc">Chấp nhận ${U.money(st.counter)}</button>` : ""}<button class="btn primary" id="ng-go">Gửi đề nghị</button></div>`;
        box.querySelector("#ng-go").onclick = () => submitFee(+box.querySelector("#ng-fee").value);
        if (st.counter) box.querySelector("#ng-acc").onclick = () => submitFee(st.counter);
      } else if (st.step === "contract") {
        const demand = st.demand || TR.wageDemand(s, p, u.id);
        st.demand = demand;
        const maxY = p.age >= 32 ? 2 : 5;
        const room = u.wageBudget - G.wageBill(u.id);
        box.innerHTML = `<div class="small muted" style="margin-bottom:8px">${free ? "Cầu thủ tự do — không mất phí chuyển nhượng." : `Đã thống nhất phí chuyển nhượng <b style="color:var(--text)">${U.money(st.fee)}</b> với ${esc(s.clubs[p.clubId].name)}.`}</div>
          <div class="kv small"><span class="k">Lương hiện tại</span><span class="v">${U.wage(p.wage)}</span><span class="k">Yêu cầu lương</span><span class="v" style="color:var(--gold)">${U.wage(demand)}</span><span class="k">Quỹ lương còn trống</span><span class="v" style="${room < demand ? "color:var(--red)" : ""}">${U.wage(Math.max(0, room))}</span></div>
          <div class="row wrap" style="margin-top:12px"><label>Lương (nghìn €/tuần) <input type="number" id="ng-w" value="${demand}" min="1" style="width:110px"></label>
          <label>Thời hạn <select id="ng-y">${[1, 2, 3, 4, 5].filter((y) => y <= maxY).map((y) => `<option ${y === Math.min(maxY, st.years || 4) ? "selected" : ""}>${y}</option>`).join("")}</select> năm</label></div>
          ${msgHtml}<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Huỷ</button><button class="btn primary" id="ng-go">Đề nghị hợp đồng</button></div>`;
        box.querySelector("#ng-go").onclick = () => submitContract(+box.querySelector("#ng-w").value, +box.querySelector("#ng-y").value);
      } else {
        box.innerHTML = `${msgHtml}<div class="row" style="justify-content:flex-end"><button class="btn primary" data-close>Đóng</button></div>`;
      }
    };
    const submitFee = (fee) => {
      const r = TR.bid(s, p.id, fee);
      if (r.status === "accept") { st.fee = r.price; st.step = "contract"; st.counter = null; draw(esc(r.msg), true); }
      else if (r.status === "counter") { st.counter = r.price; draw(esc(r.msg)); }
      else { st.counter = null; draw(esc(r.msg), false); }
    };
    const submitContract = (wage, years) => {
      const r = TR.offerContract(s, p.id, wage, years);
      if (r.status === "accept") {
        const done = G.signPlayer(p.id, st.fee, wage, years);
        if (done.ok) {
          st.step = "done";
          draw("✅ " + esc(done.msg), true);
          G.save(App.slot);
          App.render();
        } else draw(esc(done.msg), false);
      } else if (r.status === "counter") { st.demand = r.demand; st.years = r.years; draw(esc(r.msg)); }
      else { st.step = "done"; draw(esc(r.msg), false); }
    };
    draw();
  });
})();
