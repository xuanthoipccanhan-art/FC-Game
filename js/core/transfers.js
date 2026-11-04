/* Thị trường chuyển nhượng: định giá, đàm phán, cho mượn, điều khoản giải phóng, AI */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;
  const PL = FC.players;

  // Kỳ chuyển nhượng hè & đông (hè đóng 01/09 như các giải lớn châu Âu)
  function isWindowOpen(date) {
    const md = date.slice(5);
    return (md >= "06-15" && md <= "09-01") || (md >= "01-01" && md <= "02-02");
  }
  function isDeadlineDay(date) {
    const md = date.slice(5);
    return md === "09-01" || md === "02-02" || md === "08-31" || md === "02-01";
  }

  function squadRank(s, p) {
    const club = s.clubs[p.clubId];
    if (!club) return 99;
    const sorted = club.players.map((id) => s.players[id]).filter((x) => x && !x.res).sort((a, b) => b.ovr - a.ovr);
    const i = sorted.findIndex((x) => x.id === p.id);
    return i < 0 ? 99 : i + 1;
  }

  function askingPrice(s, p) {
    if (!p.clubId) return 0;
    const club = s.clubs[p.clubId];
    let m = 1.22;
    const rank = squadRank(s, p);
    if (rank <= 3) m += 0.35;
    else if (rank <= 11) m += 0.15;
    if (p.contract >= 4) m += 0.2;
    if (p.contract <= 1) m -= 0.3;
    if (p.listed) m *= 0.85;
    if (club.rep >= 90) m += 0.15;
    if (p.age <= 21 && p.pot >= 85) m += 0.25;
    let price = Math.max(0.1, Math.round(p.value * m * 10) / 10);
    if (p.clause) price = Math.min(price, p.clause);
    return price;
  }

  function untouchable(s, p, buyerRep) {
    const club = s.clubs[p.clubId];
    if (!club) return false;
    return squadRank(s, p) <= 2 && club.rep >= buyerRep + 5 && p.contract >= 2;
  }

  function wageDemand(s, p, buyerClubId) {
    const buyer = s.clubs[buyerClubId];
    const cur = p.clubId ? s.clubs[p.clubId] : null;
    let w = PL.baseWage(p.ovr, p.age) * (0.85 + buyer.rep / 280);
    if (FC.LEAGUES[buyer.league] && buyer.league === "KSA1") w *= 1.6; // Ả Rập trả lương cao
    if (cur && cur.rep > buyer.rep) w *= 1 + (cur.rep - buyer.rep) / 40;
    w = Math.max(w, p.wage * (p.clubId === buyerClubId ? 1.05 : 1.1));
    if (!p.clubId) w *= 0.95;
    if (p.pers === "amb") w *= 1.08;
    if (p.pers === "loyal" && p.clubId === buyerClubId) w *= 0.92;
    return Math.round(w);
  }

  function willingToJoin(s, p, buyerClubId) {
    const buyer = s.clubs[buyerClubId];
    const cur = p.clubId ? s.clubs[p.clubId] : null;
    if (!cur) return { ok: true };
    const gap = cur.rep - buyer.rep;
    const tierGap = (FC.LEAGUES[buyer.league] || {}).tier === 2 ? 6 : 0;
    if (p.pers === "loyal" && p.age >= 26 && squadRank(s, p) <= 5) return { ok: false, why: `${p.name} trung thành với ${cur.name} và không muốn ra đi.` };
    if (p.ovr >= 85 && gap + tierGap > 6) return { ok: false, why: `${p.name} không muốn chuyển tới một CLB kém danh tiếng hơn ${cur.name}.` };
    if (p.ovr >= 80 && gap + tierGap > 12) return { ok: false, why: `${p.name} cho rằng ${buyer.name} chưa đủ tầm với tham vọng của anh ấy.` };
    return { ok: true };
  }

  function bid(s, pid, fee) {
    const p = s.players[pid];
    const user = s.clubs[s.userClub];
    if (p.loan) return { status: "reject", msg: `${p.name} đang được cho mượn, không thể hỏi mua lúc này.` };
    if (!isWindowOpen(s.date) && p.clubId) return { status: "closed", msg: "Kỳ chuyển nhượng đang đóng. Chỉ có thể ký cầu thủ tự do." };
    if (fee > user.transferBudget + 0.001) return { status: "nobudget", msg: `Ngân sách chuyển nhượng không đủ (${U.money(user.transferBudget)}).` };
    if (user.players.length >= 35) return { status: "full", msg: "Đội hình (kể cả đội trẻ) đã đủ 35 cầu thủ. Hãy bán bớt trước." };
    const seller = s.clubs[p.clubId];
    if (p.clause && fee >= p.clause) return { status: "accept", price: fee, msg: `Kích hoạt điều khoản giải phóng ${U.money(p.clause)}! ${seller.name} buộc phải để ${p.name} ra đi.` };
    if (untouchable(s, p, user.rep) && fee < askingPrice(s, p) * 1.6) {
      return { status: "reject", msg: `${seller.name}: "${p.name} là trụ cột, không phải để bán."${p.clause ? ` (Điều khoản giải phóng: ${U.money(p.clause)})` : ""}` };
    }
    const ask = askingPrice(s, p);
    if (fee >= ask) return { status: "accept", price: fee, msg: `${seller.name} chấp nhận lời đề nghị ${U.money(fee)}.` };
    if (fee >= ask * 0.72) return { status: "counter", price: ask, msg: `${seller.name} muốn ${U.money(ask)} cho ${p.name}.` };
    return { status: "reject", msg: `${seller.name} từ chối thẳng thừng lời đề nghị ${U.money(fee)}.` };
  }

  function offerContract(s, pid, wage, years) {
    const p = s.players[pid];
    const demand = wageDemand(s, p, s.userClub);
    const will = willingToJoin(s, p, s.userClub);
    if (!will.ok && wage < demand * 1.5) return { status: "reject", msg: will.why, demand };
    if (p.age >= 32 && years > 2) return { status: "counter", msg: `${p.name} muốn hợp đồng ngắn hơn (tối đa 2 năm) với lương ${U.wage(demand)}.`, demand, years: 2 };
    if (wage >= demand * 0.97) return { status: "accept", msg: `${p.name} đồng ý các điều khoản cá nhân!`, demand };
    if (wage >= demand * 0.8) return { status: "counter", msg: `${p.name} yêu cầu mức lương ${U.wage(demand)}.`, demand, years };
    return { status: "reject", msg: `Người đại diện của ${p.name} cảm thấy bị xúc phạm với mức lương này.`, demand };
  }

  function detach(s, p) {
    const from = p.clubId ? s.clubs[p.clubId] : null;
    if (from) {
      from.players = from.players.filter((x) => x !== p.id);
      if (from.tactics.lineup) from.tactics.lineup = from.tactics.lineup.map((x) => (x === p.id ? null : x));
      if (from.tactics.bench) from.tactics.bench = from.tactics.bench.filter((x) => x !== p.id);
    }
    return from;
  }
  function attach(s, p, to) {
    to.players.push(p.id);
    p.clubId = to.id;
    p.res = false;
    const nums = new Set(to.players.filter((id) => id !== p.id).map((id) => s.players[id] && s.players[id].num));
    if (nums.has(p.num) || !p.num) { let n = 2; while (nums.has(n)) n++; p.num = n; }
    if (!p.career.clubs) p.career.clubs = [];
    if (p.career.clubs[p.career.clubs.length - 1] !== to.id) p.career.clubs.push(to.id);
  }

  function moveTo(s, p, toId, fee, wage, years) {
    const from = detach(s, p);
    if (from) {
      from.money += fee;
      from.transferBudget = (from.transferBudget || 0) + fee * 0.8;
    } else {
      s.freeAgents = s.freeAgents.filter((x) => x !== p.id);
    }
    const to = s.clubs[toId];
    to.money -= fee;
    to.transferBudget = (to.transferBudget || 0) - fee;
    attach(s, p, to);
    p.wage = wage;
    p.contract = years;
    p.listed = false;
    p.loan = null;
    p.morale = U.clamp(p.morale + 10, 0, 100);
    p.joined = s.date;
    p.clause = to.country === "ESP" ? Math.round(Math.max(p.value * U.rand(2.5, 4), 10)) : 0;
    s.transferLog.unshift({ date: s.date, pid: p.id, name: p.name, from: from ? from.id : null, to: toId, fee });
    if (s.transferLog.length > 300) s.transferLog.length = 300;
    if (toId === s.userClub || (from && from.id === s.userClub)) {
      const fin = s.finance.season;
      if (toId === s.userClub) fin.expense.transfers += fee;
      else fin.income.transfers += fee;
    }
  }

  // ===== Cho mượn =====
  function startLoan(s, p, toId, wagePct, buyFee) {
    const from = s.clubs[p.clubId];
    detach(s, p);
    const to = s.clubs[toId];
    attach(s, p, to);
    p.loan = { from: from.id, wagePct, buyFee: buyFee || 0, season: s.season };
    p.listed = false;
    p.joined = s.date;
    s.transferLog.unshift({ date: s.date, pid: p.id, name: p.name, from: from.id, to: toId, fee: 0, loan: true });
  }
  function endLoan(s, p) {
    const back = s.clubs[p.loan.from];
    detach(s, p);
    p.loan = null;
    if (back) attach(s, p, back);
    else { p.clubId = null; s.freeAgents.push(p.id); }
  }
  function buyLoanee(s, p) {
    const fee = p.loan.buyFee;
    const parent = s.clubs[p.loan.from];
    const buyer = s.clubs[p.clubId];
    parent.money += fee; parent.transferBudget += fee * 0.8;
    buyer.money -= fee; buyer.transferBudget -= fee;
    if (buyer.id === s.userClub) s.finance.season.expense.transfers += fee;
    if (parent.id === s.userClub) s.finance.season.income.transfers += fee;
    p.loan = null;
    p.contract = U.randInt(3, 4);
    s.transferLog.unshift({ date: s.date, pid: p.id, name: p.name, from: parent.id, to: buyer.id, fee });
  }

  // Tiền lương thực trả của một CLB (tính tỉ lệ cho mượn)
  function loanOutMap(s) {
    const m = {};
    for (const p of Object.values(s.players)) if (p.loan) (m[p.loan.from] = m[p.loan.from] || []).push(p.id);
    return m;
  }
  function wagePaid(s, clubId, loanOut) {
    let w = 0;
    for (const id of s.clubs[clubId].players) {
      const p = s.players[id];
      if (!p) continue;
      w += p.loan ? (p.wage * p.loan.wagePct) / 100 : p.wage;
    }
    // Cầu thủ mình cho mượn: vẫn trả phần còn lại
    const lo = loanOut || loanOutMap(s);
    if (lo[clubId]) for (const id of lo[clubId]) { const p = s.players[id]; if (p && p.loan) w += (p.wage * (100 - p.loan.wagePct)) / 100; }
    return w;
  }

  // CLB khác có muốn mượn cầu thủ của người chơi?
  function loanOptions(s, pid) {
    const p = s.players[pid];
    const own = s.clubs[p.clubId];
    const out = [];
    const clubs = U.shuffle(Object.values(s.clubs).filter((c) => c.id !== own.id && FC.LEAGUES[c.league] && c.players.length < 30));
    for (const c of clubs) {
      const lvl = avgTop(s, c, 14);
      if (p.ovr < lvl - 5 || p.ovr > lvl + 8) continue;
      if (c.rep > own.rep + 8) continue;
      const pct = U.clamp(Math.round((50 + (p.ovr - lvl) * 6 + U.rand(-10, 15)) / 5) * 5, 25, 100);
      const buy = p.age <= 27 && U.chance(0.35) ? Math.round(p.value * U.rand(1.1, 1.5) * 10) / 10 : 0;
      out.push({ clubId: c.id, wagePct: pct, buyFee: buy, minutes: p.ovr >= lvl ? "Đá chính" : "Xoay tua" });
      if (out.length >= 4) break;
    }
    return out;
  }

  // Người chơi hỏi mượn
  function loanBid(s, pid, wagePct, wantBuy) {
    const p = s.players[pid];
    const owner = s.clubs[p.clubId];
    const user = s.clubs[s.userClub];
    if (!isWindowOpen(s.date)) return { ok: false, msg: "Kỳ chuyển nhượng đang đóng." };
    if (p.loan) return { ok: false, msg: `${p.name} đã đang được cho mượn.` };
    const rank = squadRank(s, p);
    if (rank <= 6 && !(p.age <= 21 && rank > 3)) return { ok: false, msg: `${owner.name} không cho mượn cầu thủ quan trọng như ${p.name}.` };
    if (owner.rep > user.rep + 15 && p.ovr >= avgTop(s, user, 11) + 3) return { ok: false, msg: `${owner.name} lo ngại ${p.name} sẽ không có đủ thời gian thi đấu phù hợp tại ${user.name}.` };
    const need = rank <= 11 ? 90 : p.age <= 21 ? 50 : 70;
    if (wagePct < need) return { ok: false, counter: need, msg: `${owner.name} yêu cầu bạn trả ít nhất ${need}% lương.` };
    const buyFee = wantBuy ? Math.round(p.value * 1.35 * 10) / 10 : 0;
    const will = willingToJoin(s, p, user.id);
    if (!will.ok && p.age > 23) return { ok: false, msg: will.why };
    startLoan(s, p, user.id, wagePct, buyFee);
    return { ok: true, msg: `${p.name} gia nhập theo dạng cho mượn đến hết mùa (${wagePct}% lương)${buyFee ? `, kèm điều khoản mua đứt ${U.money(buyFee)}` : ""}.` };
  }

  function release(s, pid) {
    const p = s.players[pid];
    const club = s.clubs[p.clubId];
    const cost = Math.round(((p.wage * 52 * p.contract) / 1000) * 0.5 * 10) / 10;
    detach(s, p);
    club.money -= cost;
    if (club.id === s.userClub) s.finance.season.expense.other += cost;
    p.clubId = null;
    p.listed = false;
    p.res = false;
    s.freeAgents.push(pid);
    return cost;
  }

  function clubNeeds(s, club) {
    const ps = club.players.map((id) => s.players[id]).filter((p) => p && !p.res);
    const count = (g) => ps.filter((p) => PL.GROUP[p.pos] === g).length;
    const needs = [];
    if (count("GK") < 2) needs.push("GK");
    if (count("DEF") < 7) needs.push("DEF");
    if (count("MID") < 7) needs.push("MID");
    if (count("ATT") < 5) needs.push("ATT");
    return needs;
  }

  function avgTop(s, club, n = 14) {
    const v = club.players.map((id) => s.players[id]).filter((p) => p && !p.res).map((p) => p.ovr).sort((a, b) => b - a).slice(0, n);
    return v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
  }

  function aiOffersForUser(s) {
    if (!isWindowOpen(s.date)) return [];
    const user = s.clubs[s.userClub];
    const offers = [];
    const all = Object.values(s.clubs);
    for (const pid of user.players) {
      const p = s.players[pid];
      if (p.loan) continue;
      const prob = p.listed ? 0.35 : p.ovr >= 80 ? 0.035 : 0.01;
      if (!U.chance(prob)) continue;
      const buyers = all.filter((c) => c.id !== user.id && c.transferBudget > p.value * 0.8 && avgTop(s, c) - 4 <= p.ovr && c.players.length < 30);
      if (!buyers.length) continue;
      const b = U.pick(buyers);
      let fee = p.value * U.rand(p.listed ? 0.8 : 1.0, p.listed ? 1.15 : 1.5);
      fee = Math.round(Math.min(fee, b.transferBudget) * 10) / 10;
      if (fee < 0.1) continue;
      offers.push({ pid, clubId: b.id, fee });
    }
    return offers;
  }

  // Chọn mục tiêu chuyển nhượng hợp lý cho một CLB AI
  function aiTarget(s, buyer, pool) {
    const needs = clubNeeds(s, buyer);
    const lvl = avgTop(s, buyer);
    const cands = [];
    for (const p of pool) {
      if (p.academy || p.loan || p.clubId === buyer.id || p.clubId === s.userClub) continue;
      if (needs.length && !needs.includes(PL.GROUP[p.pos])) continue;
      if (p.ovr < lvl - 1 || p.ovr > lvl + 6 || p.age > 30) continue;
      const seller = p.clubId ? s.clubs[p.clubId] : null;
      if (seller && (seller.players.length <= 18 || squadRank(s, p) <= 3)) continue;
      const price = seller ? askingPrice(s, p) : 0;
      if (price > buyer.transferBudget) continue;
      if (seller && seller.rep > buyer.rep + 3) continue;
      cands.push(p);
      if (cands.length > 40) break;
    }
    return cands.length ? U.pick(cands) : null;
  }

  function aiTransfers(s, maxDeals = 6) {
    if (!isWindowOpen(s.date)) return [];
    const deals = [];
    const pool = U.shuffle(Object.values(s.players).filter((p) => !p.academy && !p.res && p.age <= 30 && p.ovr >= 60));
    const clubs = U.shuffle(Object.values(s.clubs).filter((c) => c.id !== s.userClub));
    const mult = isDeadlineDay(s.date) ? 3 : 1;
    for (const buyer of clubs) {
      if (deals.length >= maxDeals * mult) break;
      if (!U.chance(0.06 * mult)) continue;
      const p = aiTarget(s, buyer, pool);
      if (!p) continue;
      const fee = p.clubId ? askingPrice(s, p) : 0;
      const from = p.clubId;
      if (!willingToJoin(s, p, buyer.id).ok) continue;
      moveTo(s, p, buyer.id, fee, wageDemand(s, p, buyer.id), U.randInt(2, 5));
      deals.push({ pid: p.id, from, to: buyer.id, fee });
    }
    return deals;
  }

  // AI cho mượn cầu thủ trẻ dư thừa
  function aiLoans(s, max = 4) {
    if (!isWindowOpen(s.date)) return [];
    const loans = [];
    const big = U.shuffle(Object.values(s.clubs).filter((c) => c.id !== s.userClub && c.rep >= 74));
    for (const c of big) {
      if (loans.length >= max) break;
      if (!U.chance(0.08)) continue;
      const cand = c.players.map((id) => s.players[id]).filter((p) => p && !p.loan && !p.res && p.age <= 22 && squadRank(s, p) > 16);
      if (!cand.length || c.players.length <= 20) continue;
      const p = U.pick(cand);
      const opts = Object.values(s.clubs).filter((x) => x.id !== c.id && x.id !== s.userClub && x.rep < c.rep - 4 && Math.abs(avgTop(s, x, 14) - p.ovr) <= 5 && x.players.length < 28);
      if (!opts.length) continue;
      const to = U.pick(opts);
      startLoan(s, p, to.id, U.pick([50, 75, 100]), 0);
      loans.push({ pid: p.id, from: c.id, to: to.id });
    }
    return loans;
  }

  FC.transfers = {
    isWindowOpen, isDeadlineDay, askingPrice, wageDemand, willingToJoin, bid, offerContract, moveTo, release, aiOffersForUser, aiTransfers, aiLoans,
    avgTop, squadRank, clubNeeds, loanOutMap, startLoan, endLoan, buyLoanee, loanOptions, loanBid, wagePaid, aiTarget,
  };
})();
