/* Sự kiện đời thực: drama, họp báo, CĐV, tin đồn, thay HLV, đội tuyển, giải thưởng, nhân sự */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;
  const PL = FC.players;
  const TR = FC.transfers;

  const SOURCES = [
    { name: "Nguồn tin thân cận (độ tin cậy rất cao)", rel: 0.75, tag: "Tier 1" },
    { name: "Báo thể thao uy tín", rel: 0.5, tag: "Tier 2" },
    { name: "Báo địa phương", rel: 0.3, tag: "Tier 3" },
    { name: "Báo lá cải", rel: 0.12, tag: "Lá cải" },
    { name: "Mạng xã hội", rel: 0.05, tag: "MXH" },
  ];

  const STAFF_ROLES = {
    assistant: { name: "Trợ lý HLV", desc: "Giúp đội thấm nhuần triết lý nhanh hơn, góp ý chiến thuật." },
    youth: { name: "HLV đội trẻ / Giám đốc học viện", desc: "Nâng chất lượng lứa trẻ & tốc độ phát triển đội trẻ." },
    fitness: { name: "HLV thể lực", desc: "Hồi phục nhanh hơn, giảm chấn thương." },
    scout: { name: "Trưởng bộ phận tuyển trạch", desc: "Đánh giá tiềm năng & giá cầu thủ chính xác hơn." },
    director: { name: "Thành viên ban lãnh đạo", desc: "Ban lãnh đạo kiên nhẫn hơn, CĐV ủng hộ hơn." },
  };

  const E = {
    SOURCES, STAFF_ROLES,

    news(G, cat, text, extra = {}) {
      const s = G.s;
      s.news.unshift({ id: U.uid("n"), date: s.date, cat, text, ...extra });
      if (s.news.length > 350) s.news.length = 350;
    },

    // ===== Tin đồn chuyển nhượng =====
    weeklyRumours(G) {
      const s = G.s;
      const open = TR.isWindowOpen(s.date);
      const n = open ? U.randInt(3, 6) : U.randInt(0, 2);
      const pool = Object.values(s.players).filter((p) => p.clubId && !p.academy && !p.loan && p.ovr >= 76 && p.age <= 31);
      const clubs = Object.values(s.clubs);
      for (let i = 0; i < n && pool.length; i++) {
        const p = U.weightedPick(pool, (x) => Math.pow(x.ovr - 70, 2) * (x.form > 7 ? 1.6 : 1) * (x.age <= 23 ? 1.4 : 1));
        const from = s.clubs[p.clubId];
        const suitors = clubs.filter((c) => c.id !== from.id && c.rep >= from.rep - 3 && c.transferBudget >= p.value * 0.7 && c.id !== s.userClub);
        if (!suitors.length) continue;
        const to = U.pick(suitors);
        const src = U.weightedPick(SOURCES, (x) => (x.rel > 0.6 ? 1 : x.rel > 0.4 ? 2 : 2.5));
        const fee = Math.round(p.value * U.rand(1, 1.6));
        const tpl = [
          `${to.name} đang theo dõi sát sao ${p.name} (${from.short}).`,
          `${to.name} chuẩn bị gửi đề nghị khoảng ${U.money(fee)} cho ${p.name}.`,
          `${p.name} được cho là muốn thử thách mới tại ${to.name}.`,
          `Người đại diện của ${p.name} đã có cuộc gặp với ban lãnh đạo ${to.name}.`,
          `${to.name} đưa ${p.name} vào danh sách mục tiêu hàng đầu.`,
        ];
        const r = { id: U.uid("r"), date: s.date, pid: p.id, name: p.name, from: from.id, to: to.id, fee, src: src.name, tag: src.tag, rel: src.rel, status: "open", text: U.pick(tpl) };
        if (open && U.chance(src.rel * 0.7)) { r.planned = true; r.resolve = U.addDays(s.date, U.randInt(5, 20)); }
        else r.resolve = U.addDays(s.date, U.randInt(14, 45));
        s.rumours.unshift(r);
        E.news(G, "rumour", `[${src.tag}] ${r.text}`, { pid: p.id, clubs: [from.id, to.id] });
        // Ảnh hưởng tới cầu thủ của người chơi
        if (from.id === s.userClub) {
          if (p.pers === "amb" && to.rep > from.rep) p.morale = U.clamp(p.morale - 4, 0, 100);
        }
      }
      if (s.rumours.length > 120) s.rumours.length = 120;
      // Tin đồn liên quan CLB người chơi (nhắm cầu thủ)
      if (U.chance(open ? 0.35 : 0.1)) {
        const u = G.user;
        const tgt = pool.filter((p) => p.clubId !== u.id && Math.abs(p.ovr - TR.avgTop(s, u, 11)) <= 4);
        if (tgt.length) {
          const p = U.pick(tgt);
          E.news(G, "rumour", `[Báo lá cải] ${u.name} được cho là đã liên hệ với ${p.name} (${s.clubs[p.clubId].short}).`, { pid: p.id, clubs: [u.id] });
        }
      }
    },

    resolveRumours(G) {
      const s = G.s;
      for (const r of s.rumours) {
        if (r.status !== "open" || r.resolve > s.date) continue;
        const p = s.players[r.pid];
        const to = s.clubs[r.to];
        if (!p || !to || p.clubId !== r.from) { r.status = "false"; continue; }
        if (r.planned && TR.isWindowOpen(s.date)) {
          if (p.clubId === s.userClub) {
            // CLB khác gửi đề nghị thật cho người chơi
            const fee = Math.round(Math.max(p.value * 1.1, r.fee) * 10) / 10;
            if (!s.pendingOffers.some((o) => o.pid === p.id)) {
              const o = { id: U.uid("o"), pid: p.id, clubId: to.id, fee };
              s.pendingOffers.push(o);
              G.mail(to.name, `Đề nghị chính thức cho ${p.name}`, `Đúng như tin đồn, ${to.name} gửi đề nghị <b>${U.money(fee)}</b> cho ${p.name}.`, "offer",
                [{ label: "Chấp nhận", act: "acceptOffer", id: o.id }, { label: "Từ chối", act: "rejectOffer", id: o.id }]);
            }
            r.status = "true";
            continue;
          }
          const price = TR.askingPrice(s, p);
          if (to.transferBudget >= price && TR.willingToJoin(s, p, to.id).ok && to.players.length < 32) {
            const from = s.clubs[p.clubId];
            TR.moveTo(s, p, to.id, price, TR.wageDemand(s, p, to.id), U.randInt(3, 5));
            r.status = "true";
            E.news(G, "transfer", `✅ HERE WE GO! ${p.name} chính thức gia nhập ${to.name} từ ${from.name} (${U.money(price)}).`, { pid: p.id, clubs: [from.id, to.id], big: p.ovr >= 82 });
            continue;
          }
        }
        r.status = "false";
        if (r.rel >= 0.5 && U.chance(0.4)) E.news(G, "rumour", `❌ Thương vụ ${p.name} → ${to.name} đổ vỡ.`, { pid: p.id });
      }
    },

    // ===== Drama & sự kiện có lựa chọn cho CLB người chơi =====
    weeklyDrama(G) {
      const s = G.s;
      if (s.pendingEvents.length >= 2) return;
      if (!U.chance(0.2)) return;
      const u = G.user;
      const squad = G.squad(u.id);
      if (squad.length < 12) return;
      const pick = (fn) => { const c = squad.filter(fn); return c.length ? U.pick(c) : null; };
      const types = U.shuffle(["unhappy", "fight", "party", "agent", "social", "family", "tapping", "meddle", "fans"]);
      for (const t of types) {
        let ev = null;
        if (t === "unhappy") {
          const p = pick((p) => TR.squadRank(s, p) <= 6 && (p.pers === "amb" || p.morale < 45));
          if (p) ev = { kind: "unhappy", pid: p.id, title: `${p.name} muốn ra đi`, body: `${p.name} gõ cửa phòng làm việc của bạn: anh ấy cảm thấy ${u.name} không đáp ứng được tham vọng và muốn được ra đi trong kỳ chuyển nhượng tới.`,
            options: ["Hứa sẽ bán nếu có đề nghị tốt", "Thuyết phục anh ấy ở lại", "Phạt & đẩy xuống đội trẻ"] };
        } else if (t === "fight") {
          const a = pick((p) => p.pers === "hot");
          const b = a && pick((p) => p.id !== a.id);
          if (a && b) ev = { kind: "fight", pid: a.id, pid2: b.id, title: "Ẩu đả trên sân tập", body: `${a.name} và ${b.name} xảy ra xô xát nghiêm trọng trong buổi tập sáng nay. Báo chí đã biết chuyện.`,
            options: ["Phạt nặng cả hai (2 tuần lương)", "Hoà giải, bỏ qua", `Đẩy ${a.name} xuống đội trẻ`] };
        } else if (t === "party") {
          const p = pick((p) => p.pers === "party" || p.pers === "moody");
          if (p) ev = { kind: "party", pid: p.id, title: "Bê bối hộp đêm", body: `Báo lá cải đăng ảnh ${p.name} tiệc tùng đến 4 giờ sáng ở hộp đêm, chỉ 2 ngày trước trận đấu.`,
            options: ["Phạt tiền", "Bỏ qua chuyện riêng tư", "Treo giò nội bộ 1 trận"] };
        } else if (t === "agent") {
          const p = pick((p) => p.form >= 7.1 && p.stats.apps >= 5 && p.contract >= 2);
          if (p) ev = { kind: "agent", pid: p.id, title: `Người đại diện của ${p.name} đòi tăng lương`, body: `Sau chuỗi phong độ ấn tượng (điểm TB ${p.form.toFixed(1)}), người đại diện của ${p.name} yêu cầu tăng lương 25% (lên ${U.wage(Math.round(p.wage * 1.25))}).`,
            options: ["Đồng ý tăng lương", "Từ chối thẳng", "Hứa đàm phán cuối mùa"] };
        } else if (t === "social") {
          const p = pick((p) => p.pers === "moody" || p.pers === "hot" || p.morale < 40);
          if (p) ev = { kind: "social", pid: p.id, title: "Dòng trạng thái gây bão", body: `${p.name} đăng bài ẩn ý chỉ trích chiến thuật của HLV trên mạng xã hội. Bài viết thu hút hàng triệu lượt tương tác.`,
            options: ["Phạt và yêu cầu xin lỗi công khai", "Gặp riêng để nói chuyện", "Phớt lờ"] };
        } else if (t === "family") {
          const p = pick((p) => p.injury <= 0);
          if (p) ev = { kind: "family", pid: p.id, title: `${p.name} xin nghỉ phép`, body: `${p.name} xin về quê khoảng 10 ngày vì việc gia đình quan trọng.`,
            options: ["Đồng ý cho nghỉ", "Từ chối, đội đang cần anh ấy"] };
        } else if (t === "tapping") {
          const p = pick((p) => TR.squadRank(s, p) <= 4);
          const rival = Object.values(s.clubs).filter((c) => c.rep > u.rep && c.id !== u.id);
          if (p && rival.length) {
            const r = U.pick(rival);
            ev = { kind: "tapping", pid: p.id, club: r.id, title: "Bị \"câu kéo\" cầu thủ", body: `Có bằng chứng ${r.name} liên hệ bất hợp pháp với ${p.name} sau lưng CLB.`,
              options: ["Khiếu nại lên liên đoàn", "Đề nghị hợp đồng mới (+15% lương)", "Im lặng"] };
          }
        } else if (t === "meddle") {
          if (TR.isWindowOpen(s.date) && U.chance(0.5)) {
            ev = { kind: "meddle", title: "Ban lãnh đạo can thiệp", body: `Chủ tịch muốn chiêu mộ một ngôi sao để tăng doanh thu thương mại và sẵn sàng bơm thêm ngân sách — đổi lại bạn phải chấp nhận kỳ vọng cao hơn.`,
              options: ["Đồng ý (+25% ngân sách, mục tiêu cao hơn)", "Từ chối, giữ kế hoạch hiện tại"] };
          }
        } else if (t === "fans") {
          if (s.fans < 35) ev = { kind: "fans", title: "CĐV biểu tình", body: `Hàng nghìn CĐV ${u.name} giăng biểu ngữ phản đối trước sân ${u.stadium} vì kết quả tệ hại.`,
            options: ["Gặp gỡ và đối thoại với CĐV", "Giảm giá vé trận tới", "Phớt lờ"] };
        }
        if (ev) { E.push(G, ev); return; }
      }
    },

    push(G, ev) {
      ev.id = U.uid("e");
      ev.date = G.s.date;
      G.s.pendingEvents.push(ev);
    },

    // Họp báo trước trận
    pressConference(G, f) {
      const s = G.s;
      const u = G.user;
      const opp = s.clubs[f.home === u.id ? f.away : f.home];
      const big = opp.rep >= u.rep + 2 || f.ko;
      const conf = s.board.confidence;
      let q, opts;
      if (conf < 35) {
        q = `"Có tin đồn ban lãnh đạo đã liên hệ HLV thay thế. Ông có lo lắng cho chiếc ghế của mình?"`;
        opts = ["Tôi tập trung vào công việc, kết quả sẽ trả lời", "Tôi cần thêm thời gian và sự ủng hộ", "Câu hỏi thật vô duyên!"];
      } else if (big) {
        q = `"${opp.name} được đánh giá cao hơn. Ông đặt mục tiêu gì cho trận đấu?"`;
        opts = ["Chúng tôi đến để thắng", "Một trận hoà cũng là kết quả tốt", "Áp lực thuộc về họ"];
      } else {
        q = `"${u.name} là ứng viên số một cho chiến thắng trước ${opp.name}. Ông có sợ chủ quan?"`;
        opts = ["Không có trận nào dễ dàng", "Chúng tôi sẽ thắng đậm", "Tôi tin vào các học trò"];
      }
      E.push(G, { kind: "press", fid: f.id, big, title: "🎙️ Họp báo trước trận", body: `Phóng viên hỏi: ${q}`, options: opts });
    },

    resolve(G, evId, idx) {
      const s = G.s;
      const ev = s.pendingEvents.find((e) => e.id === evId);
      if (!ev) return "";
      s.pendingEvents = s.pendingEvents.filter((e) => e.id !== evId);
      const p = ev.pid ? s.players[ev.pid] : null;
      const p2 = ev.pid2 ? s.players[ev.pid2] : null;
      const mor = (pl, d) => { if (pl) pl.morale = U.clamp(pl.morale + d, 0, 100); };
      const team = (d) => G.squad(s.userClub).forEach((x) => mor(x, d));
      let msg = "";
      switch (ev.kind) {
        case "unhappy":
          if (idx === 0) { p.listed = true; mor(p, 12); msg = `${p.name} hài lòng. Anh ấy đã được đưa vào danh sách chuyển nhượng.`; }
          else if (idx === 1) {
            const ok = U.chance(0.35 + p.morale / 250 + (p.pers === "loyal" ? 0.3 : 0));
            if (ok) { mor(p, 15); msg = `Bạn đã thuyết phục thành công ${p.name} ở lại!`; }
            else { mor(p, -15); msg = `${p.name} không bị thuyết phục và tỏ ra rất bất mãn.`; E.news(G, "drama", `${p.name} công khai bày tỏ mong muốn rời ${G.user.name}.`, { pid: p.id }); }
          } else { p.res = true; mor(p, -30); team(-2); s.fans = U.clamp(s.fans - 4, 0, 100); msg = `${p.name} bị đẩy xuống đội trẻ. Phòng thay đồ xôn xao.`; E.news(G, "drama", `Sốc: ${G.user.name} gạch tên ${p.name} khỏi đội một!`, { pid: p.id }); }
          break;
        case "fight":
          if (idx === 0) { mor(p, -10); mor(p2, -10); team(1); G.changeConfidence(1); msg = "Kỷ luật được thiết lập. Cả đội hiểu rằng không ai đứng trên CLB."; }
          else if (idx === 1) { mor(p, 3); mor(p2, 3); if (U.chance(0.4)) { team(-2); msg = "Mâu thuẫn chưa được giải quyết triệt để, bầu không khí vẫn căng thẳng."; } else msg = "Hai cầu thủ bắt tay làm hoà."; }
          else { p.res = true; mor(p, -20); msg = `${p.name} phải xuống tập với đội trẻ.`; }
          E.news(G, "drama", `Ẩu đả trên sân tập ${G.user.name}: ${p.name} và ${p2.name}.`, { pid: p.id });
          break;
        case "party":
          if (idx === 0) { mor(p, -8); s.fans = U.clamp(s.fans + 2, 0, 100); msg = `${p.name} bị phạt một tuần lương.`; }
          else if (idx === 1) { mor(p, 3); G.changeConfidence(-2); G.squad(s.userClub).filter((x) => x.pers === "pro").forEach((x) => mor(x, -2)); msg = "Một số cầu thủ chuyên nghiệp không hài lòng với sự dễ dãi."; }
          else { p.suspended += 1; mor(p, -12); G.changeConfidence(2); msg = `${p.name} bị treo giò nội bộ 1 trận.`; }
          E.news(G, "drama", `${p.name} (${G.user.short}) bị bắt gặp tiệc tùng thâu đêm trước trận.`, { pid: p.id });
          break;
        case "agent":
          if (idx === 0) {
            const nw = Math.round(p.wage * 1.25);
            if (G.wageBill(s.userClub) - p.wage + nw > G.user.wageBudget) { mor(p, -10); msg = "Quỹ lương không cho phép — cầu thủ thất vọng."; }
            else { p.wage = nw; mor(p, 12); msg = `${p.name} nhận mức lương mới ${U.wage(nw)}.`; }
          } else if (idx === 1) { mor(p, -15); if (p.pers === "amb") p.listed = true; msg = p.pers === "amb" ? `${p.name} giận dữ và yêu cầu được bán!` : `${p.name} thất vọng.`; }
          else { mor(p, -3); msg = "Người đại diện miễn cưỡng chờ đến cuối mùa."; }
          break;
        case "social":
          if (idx === 0) { mor(p, -10); G.changeConfidence(1); msg = `${p.name} xoá bài và xin lỗi công khai.`; }
          else if (idx === 1) { mor(p, 8); msg = "Cuộc nói chuyện thẳng thắn giúp cải thiện quan hệ."; }
          else { team(-2); G.changeConfidence(-2); msg = "Sự im lặng của bạn bị xem là yếu đuối."; }
          E.news(G, "drama", `${p.name} gây bão mạng xã hội với bài đăng ẩn ý chỉ trích HLV.`, { pid: p.id });
          break;
        case "family":
          if (idx === 0) { mor(p, 10); p.injury = Math.max(p.injury, 10); p.injuryName = "Nghỉ phép (việc gia đình)"; msg = `${p.name} rất biết ơn sự cảm thông của bạn.`; }
          else { mor(p, -15); msg = `${p.name} buồn bã ở lại tập luyện.`; }
          break;
        case "tapping": {
          const r = s.clubs[ev.club];
          if (idx === 0) { r.money -= 2; mor(p, -3); msg = `${r.name} bị liên đoàn phạt 2 triệu €.`; E.news(G, "drama", `${r.name} bị phạt vì liên hệ trái phép với ${p.name}.`, { pid: p.id }); }
          else if (idx === 1) { p.wage = Math.round(p.wage * 1.15); p.contract = Math.max(p.contract, 4); mor(p, 10); msg = `${p.name} ký hợp đồng mới tới năm ${s.season + p.contract}.`; }
          else { mor(p, p.pers === "amb" ? -8 : -2); msg = "Bạn chọn im lặng."; }
          break;
        }
        case "meddle":
          if (idx === 0) { G.user.transferBudget = Math.round(G.user.transferBudget * 1.25 + 5); s.board.target = Math.max(1, s.board.target - 2); s.board.targetText += " (nâng cao)"; msg = "Ngân sách tăng, nhưng kỳ vọng cũng vậy."; }
          else { G.changeConfidence(-3); msg = "Chủ tịch không vui nhưng tôn trọng quyết định."; }
          break;
        case "fans":
          if (idx === 0) { s.fans = U.clamp(s.fans + 10, 0, 100); G.changeConfidence(-1); msg = "Buổi đối thoại giúp xoa dịu CĐV."; }
          else if (idx === 1) { s.ticketPrice = Math.max(30, s.ticketPrice - 15); s.fans = U.clamp(s.fans + 8, 0, 100); msg = "Giá vé giảm, CĐV đón nhận tích cực."; }
          else { s.fans = U.clamp(s.fans - 6, 0, 100); msg = "CĐV càng thêm phẫn nộ."; }
          break;
        case "press": {
          const conf = idx === 0 ? 1 : idx === 1 ? 0 : -1;
          if (ev.title.includes("Họp báo")) {
            const opt = ev.options[idx];
            if (opt.includes("vô duyên")) { G.changeConfidence(-3); s.fans = U.clamp(s.fans + 2, 0, 100); msg = "Câu trả lời gay gắt lên trang nhất các báo."; }
            else if (opt.includes("thắng") || opt.includes("Áp lực thuộc") || opt.includes("thắng đậm")) { team(3); s.pressBoost = 0.015; msg = "Các cầu thủ hưng phấn với sự tự tin của HLV."; }
            else if (opt.includes("hoà")) { team(-1); s.pressBoost = -0.005; msg = "Một số cầu thủ cho rằng HLV quá thận trọng."; }
            else { team(1); msg = "Câu trả lời điềm đạm được đánh giá cao."; }
          }
          void conf;
          break;
        }
        case "staffOffer": {
          const roles = ["youth", "assistant", "director"];
          if (idx < 3) {
            const role = roles[idx];
            const old = s.staff[role];
            s.staff[role] = { name: ev.name, rating: ev.rating, formerPlayer: true, wage: ev.wage, since: s.season, legend: ev.legend };
            if (role === "director") { s.boardMembers.push({ name: ev.name, legend: ev.legend }); s.fans = U.clamp(s.fans + (ev.legend ? 8 : 3), 0, 100); delete s.staff.director; }
            msg = `${ev.name} chính thức trở thành ${STAFF_ROLES[role].name}${old && role !== "director" ? ` (thay ${old.name})` : ""}.`;
            E.news(G, "staff", `Cựu cầu thủ ${ev.name} gia nhập bộ máy ${G.user.name} với vai trò ${STAFF_ROLES[role].name}.`);
          } else msg = `Bạn đã từ chối ${ev.name}.`;
          break;
        }
        case "sponsor": {
          const o = ev.offers[idx];
          s.sponsor = { name: o.name, perWeek: o.perWeek, until: s.season + o.years - 1, bonus: o.bonus };
          G.user.money += o.signing;
          s.finance.season.income.commercial += o.signing;
          msg = `Ký hợp đồng tài trợ với ${o.name}: ${U.money(o.signing)} tiền ký + ${U.money(o.perWeek)}/tuần.`;
          break;
        }
        case "youthStar": {
          if (idx === 0) { G.promoteYouth(ev.pid); msg = `${p.name} được đôn thẳng lên đội một!`; }
          else msg = `${p.name} tiếp tục rèn luyện ở học viện.`;
          break;
        }
        default:
          msg = "Đã ghi nhận.";
      }
      return msg;
    },

    // ===== Thị trường HLV (AI) =====
    monthlyManagers(G) {
      const s = G.s;
      if (s.date.slice(5, 7) < "10" && s.date.slice(5, 7) > "06") return;
      for (const lid of Object.keys(FC.LEAGUES)) {
        const t = FC.comp.leagueTable(s, lid);
        if (!t.length || t[0].p < 6) continue;
        const exp = G.strengthRank(lid);
        t.forEach((row, i) => {
          const c = s.clubs[row.id];
          if (c.id === s.userClub) return;
          const e = exp.indexOf(c.id);
          if (i - e >= 6 && U.chance(0.22)) E.sackManager(G, c, `thành tích tệ hại (hạng ${i + 1})`);
        });
      }
    },
    sackManager(G, c, why) {
      const s = G.s;
      const old = s.managers[c.mgr];
      const pool = s.freeManagers.map((id) => s.managers[id]).filter(Boolean).sort((a, b) => b.rating - a.rating);
      const fit = pool.filter((m) => m.rating <= c.rep + 6);
      const nm = fit.length ? fit[Math.min(fit.length - 1, U.randInt(0, 2))] : G.genManager(c);
      if (old) { old.club = null; old.history.push({ club: c.id, until: s.date }); s.freeManagers.push(old.id); }
      s.freeManagers = s.freeManagers.filter((id) => id !== nm.id);
      nm.club = c.id;
      nm.fam = 0.5;
      c.mgr = nm.id;
      E.news(G, "manager", `🔄 ${c.name} sa thải HLV ${old ? old.name : ""} vì ${why}. ${nm.name}${nm.formerPlayer ? " (cựu cầu thủ)" : ""} lên thay.`, { clubs: [c.id] });
    },

    // ===== Đội tuyển quốc gia =====
    internationalBreak(G) {
      const s = G.s;
      const called = [];
      for (const p of Object.values(s.players)) {
        if (!p.clubId || p.ovr < 77 || p.injury > 0) continue;
        p.fitness = Math.max(55, p.fitness - 10);
        if (U.chance(0.025)) {
          p.injury = U.randInt(7, 28);
          p.injuryName = "Chấn thương khi lên tuyển";
          if (p.clubId === s.userClub) G.mail("Bác sĩ đội", `${p.name} chấn thương khi lên tuyển`, `${p.name} dính chấn thương trong màu áo ĐTQG ${FC.natName(p.nat)}, nghỉ khoảng ${Math.ceil(p.injury / 7)} tuần.`, "medical");
        }
        if (p.clubId === s.userClub) called.push(p.name);
      }
      if (called.length) G.mail("Trợ lý HLV", "Đợt tập trung đội tuyển", `${called.length} cầu thủ được gọi lên ĐTQG: ${called.join(", ")}. Họ sẽ trở về với thể lực giảm.`, "staff");
      E.news(G, "intl", "⚽ Các đội tuyển quốc gia bước vào đợt tập trung (FIFA Days).");
    },

    // ===== Giải thưởng cuối mùa =====
    seasonAwards(G) {
      const s = G.s;
      const trophies = {};
      const add = (cid, n) => { if (cid) trophies[cid] = (trophies[cid] || 0) + n; };
      for (const lid of Object.keys(FC.LEAGUES)) { const t = FC.comp.leagueTable(s, lid); if (t.length) add(t[0].id, FC.LEAGUES[lid].tier === 1 ? 3 : 1); }
      for (const c of Object.values(s.cups || {})) add(c.winner, 1.5);
      for (const c of Object.values(s.cont || {})) add(c.winner, 4);
      const pool = Object.values(s.players).filter((p) => p.clubId && p.stats.apps >= 20);
      const score = (p) => PL.avgRating(p) * 10 + p.stats.goals * 0.55 + p.stats.assists * 0.35 + (trophies[p.clubId] || 0) * 3 + p.ovr * 0.35 + (['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1'].includes(s.clubs[p.clubId].league) ? 8 : FC.LEAGUES[s.clubs[p.clubId].league].tier === 1 ? 0 : -12) + (p.pos === "GK" ? -6 : 0);
      const ranked = pool.slice().sort((a, b) => score(b) - score(a));
      const bdo = ranked.slice(0, 3);
      const gb = ranked.filter((p) => p.age <= 21)[0];
      const award = { season: G.seasonLabel(), ballon: bdo.map((p) => ({ id: p.id, name: p.name, club: p.clubId })), golden: gb ? { id: gb.id, name: gb.name, club: gb.clubId } : null };
      s.awards.push(award);
      if (bdo[0]) {
        bdo[0].career.ballon = (bdo[0].career.ballon || 0) + 1;
        E.news(G, "award", `🏆 QUẢ BÓNG VÀNG ${award.season}: ${bdo[0].name} (${s.clubs[bdo[0].clubId].name})! Á quân: ${bdo[1] ? bdo[1].name : "—"}, hạng ba: ${bdo[2] ? bdo[2].name : "—"}.`, { pid: bdo[0].id });
      }
      if (gb) E.news(G, "award", `🌟 Golden Boy ${award.season}: ${gb.name} (${s.clubs[gb.clubId].name}).`, { pid: gb.id });
      return award;
    },

    // Cựu cầu thủ giải nghệ xin việc
    retirementOffers(G, retired) {
      const s = G.s;
      for (const p of retired) {
        const wasMine = p.career.clubs && p.career.clubs.includes(s.userClub);
        const legend = p.peak >= 85;
        if (!(wasMine && p.peak >= 70) && !(legend && U.chance(0.15))) continue;
        const rating = U.clamp(Math.round((p.peak - 55) / 2.2 + (p.pers === "leader" ? 3 : p.pers === "pro" ? 2 : 0) + U.rand(-2, 2)), 5, 20);
        E.push(G, {
          kind: "staffOffer", name: p.name, rating, legend, wage: Math.round(10 + rating * 2),
          title: `${p.name} muốn gắn bó sau giải nghệ`,
          body: `${legend ? "Huyền thoại" : "Cựu cầu thủ"} ${p.name} (${p.age} tuổi, đỉnh cao OVR ${p.peak}) vừa treo giày và muốn làm việc tại ${G.user.name}. Năng lực huấn luyện/quản lý ước tính: ${rating}/20.`,
          options: ["Làm HLV đội trẻ / GĐ học viện", "Làm trợ lý HLV", "Mời vào ban lãnh đạo", "Từ chối"],
        });
      }
      // Huyền thoại khác trở thành HLV ở các CLB
      for (const p of retired) {
        if (p.peak >= 82 && U.chance(0.25)) {
          const m = G.addManager({ name: p.name, nat: p.nat, age: p.age, phil: U.pick(Object.keys(FC.PHILOSOPHIES)), rating: U.clamp(p.peak - 18 + U.randInt(-4, 4), 55, 80), formerPlayer: true });
          s.freeManagers.push(m.id);
          E.news(G, "manager", `🎓 Huyền thoại ${p.name} lấy bằng HLV và sẵn sàng dẫn dắt CLB.`);
        }
      }
    },

    sponsorOffers(G) {
      const u = G.user;
      const base = 0.00005 * Math.pow(u.rep, 2.2) * 0.4;
      const brands = U.shuffle(["Vinasport", "Aurora Air", "Nova Bank", "Crown Telecom", "Polar Energy", "Atlas Motors", "Lotus Beer", "Zenith Tech", "Orion Bet"]);
      const offers = [
        { name: brands[0], signing: Math.round(base * 18 * 10) / 10, perWeek: Math.round(base * 0.9 * 100) / 100, years: 1, desc: "1 mùa, tiền ký lớn" },
        { name: brands[1], signing: Math.round(base * 6 * 10) / 10, perWeek: Math.round(base * 1.25 * 100) / 100, years: 3, desc: "3 mùa, ổn định" },
        { name: brands[2], signing: Math.round(base * 2 * 10) / 10, perWeek: Math.round(base * 1.1 * 100) / 100, years: 2, bonus: true, desc: "2 mùa, thưởng lớn nếu đạt mục tiêu" },
      ];
      E.push(G, {
        kind: "sponsor", offers, title: "💼 Đề nghị tài trợ áo đấu",
        body: "Bộ phận thương mại nhận được 3 đề nghị tài trợ cho mùa giải mới:\n" + offers.map((o, i) => `${i + 1}. <b>${o.name}</b> — ${o.desc}: ký ${U.money(o.signing)}, ${U.money(o.perWeek)}/tuần`).join("\n"),
        options: offers.map((o) => o.name),
      });
    },
  };

  FC.events = E;
})();
