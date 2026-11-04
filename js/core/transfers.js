/* Thị trường chuyển nhượng: định giá, đàm phán, AI mua bán */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;
  const PL = FC.players;

  function isWindowOpen(date) {
    const md = date.slice(5);
    return (md >= "06-15" && md <= "09-01") || (md >= "01-01" && md <= "02-02");
  }

  function squadRank(game, p) {
    const club = game.clubs[p.clubId];
    if (!club) return 99;
    const sorted = club.players.map((id) => game.players[id]).sort((a, b) => b.ovr - a.ovr);
    return sorted.findIndex((x) => x.id === p.id) + 1;
  }

  function askingPrice(game, p) {
    if (!p.clubId) return 0;
    const club = game.clubs[p.clubId];
    let m = 1.22;
    const rank = squadRank(game, p);
    if (rank <= 3) m += 0.35;
    else if (rank <= 11) m += 0.15;
    if (p.contract >= 4) m += 0.2;
    if (p.contract <= 1) m -= 0.3;
    if (p.listed) m *= 0.85;
    if (club.rep >= 90) m += 0.15;
    if (p.age <= 21 && p.pot >= 85) m += 0.25;
    return Math.max(0.1, Math.round(p.value * m * 10) / 10);
  }

  // CLB chủ quản có chịu bán không?
  function untouchable(game, p, buyerRep) {
    const club = game.clubs[p.clubId];
    if (!club) return false;
    return squadRank(game, p) <= 2 && club.rep >= buyerRep + 5 && p.contract >= 2;
  }

  function wageDemand(game, p, buyerClubId) {
    const buyer = game.clubs[buyerClubId];
    const cur = p.clubId ? game.clubs[p.clubId] : null;
    let w = PL.baseWage(p.ovr, p.age) * (0.85 + buyer.rep / 280);
    if (cur && cur.rep > buyer.rep) w *= 1 + (cur.rep - buyer.rep) / 40;
    w = Math.max(w, p.wage * (p.clubId === buyerClubId ? 1.05 : 1.1));
    if (!p.clubId) w *= 0.95;
    return Math.round(w);
  }

  // Cầu thủ có muốn tới CLB này không?
  function willingToJoin(game, p, buyerClubId) {
    const buyer = game.clubs[buyerClubId];
    const cur = p.clubId ? game.clubs[p.clubId] : null;
    if (!cur) return { ok: true };
    const gap = cur.rep - buyer.rep;
    if (p.ovr >= 85 && gap > 6) return { ok: false, why: `${p.name} không muốn chuyển tới một CLB kém danh tiếng hơn ${cur.name}.` };
    if (p.ovr >= 80 && gap > 12) return { ok: false, why: `${p.name} cho rằng ${buyer.name} chưa đủ tầm với tham vọng của anh ấy.` };
    return { ok: true };
  }

  function bid(game, pid, fee) {
    const p = game.players[pid];
    const user = game.clubs[game.userClub];
    if (!isWindowOpen(game.date) && p.clubId) return { status: "closed", msg: "Kỳ chuyển nhượng đang đóng. Chỉ có thể ký cầu thủ tự do." };
    if (fee > user.transferBudget + 0.001) return { status: "nobudget", msg: `Ngân sách chuyển nhượng không đủ (${U.money(user.transferBudget)}).` };
    if (user.players.length >= 32) return { status: "full", msg: "Đội hình đã đủ 32 cầu thủ. Hãy bán bớt trước." };
    if (untouchable(game, p, user.rep) && fee < askingPrice(game, p) * 1.6) {
      return { status: "reject", msg: `${game.clubs[p.clubId].name}: "${p.name} là trụ cột, không phải để bán."` };
    }
    const ask = askingPrice(game, p);
    if (fee >= ask) return { status: "accept", price: fee, msg: `${game.clubs[p.clubId].name} chấp nhận lời đề nghị ${U.money(fee)}.` };
    if (fee >= ask * 0.72) return { status: "counter", price: ask, msg: `${game.clubs[p.clubId].name} muốn ${U.money(ask)} cho ${p.name}.` };
    return { status: "reject", msg: `${game.clubs[p.clubId].name} từ chối thẳng thừng lời đề nghị ${U.money(fee)}.` };
  }

  function offerContract(game, pid, wage, years) {
    const p = game.players[pid];
    const demand = wageDemand(game, p, game.userClub);
    const will = willingToJoin(game, p, game.userClub);
    if (!will.ok && wage < demand * 1.5) return { status: "reject", msg: will.why, demand };
    if (p.age >= 32 && years > 2) return { status: "counter", msg: `${p.name} muốn hợp đồng ngắn hơn (tối đa 2 năm) với lương ${U.wage(demand)}.`, demand, years: 2 };
    if (wage >= demand * 0.97) return { status: "accept", msg: `${p.name} đồng ý các điều khoản cá nhân!`, demand };
    if (wage >= demand * 0.8) return { status: "counter", msg: `${p.name} yêu cầu mức lương ${U.wage(demand)}.`, demand, years };
    return { status: "reject", msg: `Người đại diện của ${p.name} cảm thấy bị xúc phạm với mức lương này.`, demand };
  }

  function moveTo(game, p, toId, fee, wage, years) {
    const from = p.clubId ? game.clubs[p.clubId] : null;
    const to = game.clubs[toId];
    if (from) {
      from.players = from.players.filter((x) => x !== p.id);
      from.money += fee;
      from.transferBudget = (from.transferBudget || 0) + fee * 0.8;
      if (from.tactics.lineup) from.tactics.lineup = from.tactics.lineup.map((x) => (x === p.id ? null : x));
      if (from.tactics.bench) from.tactics.bench = from.tactics.bench.filter((x) => x !== p.id);
    } else {
      game.freeAgents = game.freeAgents.filter((x) => x !== p.id);
    }
    to.players.push(p.id);
    to.money -= fee;
    to.transferBudget = (to.transferBudget || 0) - fee;
    p.clubId = toId;
    p.wage = wage;
    p.contract = years;
    p.listed = false;
    p.morale = U.clamp(p.morale + 10, 0, 100);
    p.joined = game.date;
    const nums = new Set(to.players.map((id) => game.players[id].num));
    if (nums.has(p.num) || !p.num) { let n = 2; while (nums.has(n)) n++; p.num = n; }
    game.transferLog.unshift({ date: game.date, pid: p.id, name: p.name, from: from ? from.id : null, to: toId, fee });
    if (game.transferLog.length > 200) game.transferLog.length = 200;
    if (toId === game.userClub || (from && from.id === game.userClub)) {
      const fin = game.finance.season;
      if (toId === game.userClub) fin.expense.transfers += fee;
      else fin.income.transfers += fee;
    }
  }

  function release(game, pid) {
    const p = game.players[pid];
    const club = game.clubs[p.clubId];
    const cost = Math.round(((p.wage * 52 * p.contract) / 1000) * 0.5 * 10) / 10;
    club.players = club.players.filter((x) => x !== pid);
    club.money -= cost;
    if (club.tactics.lineup) club.tactics.lineup = club.tactics.lineup.map((x) => (x === pid ? null : x));
    if (club.tactics.bench) club.tactics.bench = club.tactics.bench.filter((x) => x !== pid);
    if (club.id === game.userClub) game.finance.season.expense.other += cost;
    p.clubId = null;
    p.listed = false;
    game.freeAgents.push(pid);
    return cost;
  }

  function clubNeeds(game, club) {
    const ps = club.players.map((id) => game.players[id]);
    const count = (g) => ps.filter((p) => PL.GROUP[p.pos] === g).length;
    const needs = [];
    if (count("GK") < 2) needs.push("GK");
    if (count("DEF") < 7) needs.push("DEF");
    if (count("MID") < 7) needs.push("MID");
    if (count("ATT") < 5) needs.push("ATT");
    return needs;
  }

  function avgTop(game, club, n = 14) {
    const s = club.players.map((id) => game.players[id].ovr).sort((a, b) => b - a).slice(0, n);
    return s.reduce((a, b) => a + b, 0) / Math.max(1, s.length);
  }

  // AI hỏi mua cầu thủ của người chơi
  function aiOffersForUser(game) {
    if (!isWindowOpen(game.date)) return [];
    const user = game.clubs[game.userClub];
    const offers = [];
    for (const pid of user.players) {
      const p = game.players[pid];
      const prob = p.listed ? 0.35 : p.ovr >= 80 ? 0.03 : 0.01;
      if (!U.chance(prob)) continue;
      const buyers = Object.values(game.clubs).filter(
        (c) => c.id !== user.id && c.transferBudget > p.value * 0.8 && avgTop(game, c) - 4 <= p.ovr && c.players.length < 30
      );
      if (!buyers.length) continue;
      const b = U.pick(buyers);
      let fee = p.value * U.rand(p.listed ? 0.8 : 1.0, p.listed ? 1.15 : 1.5);
      fee = Math.min(fee, b.transferBudget);
      fee = Math.round(fee * 10) / 10;
      if (fee < 0.1) continue;
      offers.push({ pid, clubId: b.id, fee });
    }
    return offers;
  }

  // AI - AI chuyển nhượng
  function aiTransfers(game, maxDeals = 2) {
    if (!isWindowOpen(game.date)) return [];
    const deals = [];
    const clubs = U.shuffle(Object.values(game.clubs).filter((c) => c.id !== game.userClub));
    for (const buyer of clubs) {
      if (deals.length >= maxDeals) break;
      if (!U.chance(0.12)) continue;
      const needs = clubNeeds(game, buyer);
      const lvl = avgTop(game, buyer);
      const targets = Object.values(game.players).filter((p) => {
        if (p.academy || p.clubId === buyer.id || p.clubId === game.userClub) return false;
        if (needs.length && !needs.includes(PL.GROUP[p.pos])) return false;
        if (p.ovr < lvl - 1 || p.ovr > lvl + 6) return false;
        if (p.age > 30) return false;
        const seller = p.clubId ? game.clubs[p.clubId] : null;
        if (seller && (seller.players.length <= 18 || squadRank(game, p) <= 3)) return false;
        const price = seller ? askingPrice(game, p) : 0;
        return price <= buyer.transferBudget && (!seller || seller.rep <= buyer.rep + 3);
      });
      if (!targets.length) continue;
      const p = U.pick(targets);
      const fee = p.clubId ? askingPrice(game, p) : 0;
      const from = p.clubId;
      moveTo(game, p, buyer.id, fee, wageDemand(game, p, buyer.id), U.randInt(2, 5));
      deals.push({ pid: p.id, from, to: buyer.id, fee });
    }
    return deals;
  }

  FC.transfers = {
    isWindowOpen, askingPrice, wageDemand, willingToJoin, bid, offerContract, moveTo, release, aiOffersForUser, aiTransfers, avgTop, squadRank, clubNeeds,
  };
})();
