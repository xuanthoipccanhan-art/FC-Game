/* Cầu thủ: vị trí, chỉ số, giá trị, lương, sơ đồ chiến thuật */
(function () {
  const FC = (window.FC = window.FC || {});
  const U = FC.util;

  const POS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"];
  const POS_VI = {
    GK: "Thủ môn", CB: "Trung vệ", LB: "Hậu vệ trái", RB: "Hậu vệ phải", CDM: "Tiền vệ phòng ngự", CM: "Tiền vệ trung tâm",
    CAM: "Tiền vệ tấn công", LM: "Tiền vệ trái", RM: "Tiền vệ phải", LW: "Tiền đạo cánh trái", RW: "Tiền đạo cánh phải", ST: "Tiền đạo cắm",
  };
  const GROUP = { GK: "GK", CB: "DEF", LB: "DEF", RB: "DEF", CDM: "MID", CM: "MID", CAM: "MID", LM: "MID", RM: "MID", LW: "ATT", RW: "ATT", ST: "ATT" };
  const GROUP_ORDER = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
  const POS_ORDER = Object.fromEntries(POS.map((p, i) => [p, i]));

  // Độ quen thuộc vị trí (vị trí sở trường -> vị trí ô chiến thuật)
  const NEAR = {
    CB: { CDM: 0.88, LB: 0.86, RB: 0.86 },
    LB: { RB: 0.9, LM: 0.9, CB: 0.86, LW: 0.82 },
    RB: { LB: 0.9, RM: 0.9, CB: 0.86, RW: 0.82 },
    CDM: { CM: 0.95, CB: 0.87, CAM: 0.82 },
    CM: { CDM: 0.94, CAM: 0.93, LM: 0.86, RM: 0.86 },
    CAM: { CM: 0.92, ST: 0.86, LW: 0.88, RW: 0.88, LM: 0.86, RM: 0.86 },
    LM: { LW: 0.97, RM: 0.9, LB: 0.84, CM: 0.86, RW: 0.86 },
    RM: { RW: 0.97, LM: 0.9, RB: 0.84, CM: 0.86, LW: 0.86 },
    LW: { LM: 0.97, RW: 0.93, ST: 0.87, CAM: 0.87, RM: 0.86 },
    RW: { RM: 0.97, LW: 0.93, ST: 0.87, CAM: 0.87, LM: 0.86 },
    ST: { CAM: 0.86, LW: 0.86, RW: 0.86 },
  };
  function familiarity(pPos, slotPos) {
    if (pPos === slotPos) return 1;
    if (pPos === "GK" || slotPos === "GK") return 0.25;
    if (NEAR[pPos] && NEAR[pPos][slotPos]) return NEAR[pPos][slotPos];
    const g1 = GROUP_ORDER[GROUP[pPos]], g2 = GROUP_ORDER[GROUP[slotPos]];
    if (g1 === g2) return 0.8;
    if (Math.abs(g1 - g2) === 1) return 0.66;
    return 0.48;
  }

  // Sơ đồ: [vị trí, x%, y%] (y=0 là khung thành đối phương)
  const FORMATIONS = {
    "4-3-3": [["GK", 50, 92], ["LB", 14, 72], ["CB", 37, 77], ["CB", 63, 77], ["RB", 86, 72], ["CM", 28, 52], ["CDM", 50, 60], ["CM", 72, 52], ["LW", 18, 24], ["ST", 50, 16], ["RW", 82, 24]],
    "4-2-3-1": [["GK", 50, 92], ["LB", 14, 72], ["CB", 37, 77], ["CB", 63, 77], ["RB", 86, 72], ["CDM", 37, 58], ["CDM", 63, 58], ["LW", 16, 34], ["CAM", 50, 37], ["RW", 84, 34], ["ST", 50, 14]],
    "4-4-2": [["GK", 50, 92], ["LB", 14, 72], ["CB", 37, 77], ["CB", 63, 77], ["RB", 86, 72], ["LM", 14, 46], ["CM", 38, 52], ["CM", 62, 52], ["RM", 86, 46], ["ST", 38, 17], ["ST", 62, 17]],
    "4-1-2-1-2": [["GK", 50, 92], ["LB", 14, 72], ["CB", 37, 77], ["CB", 63, 77], ["RB", 86, 72], ["CDM", 50, 62], ["CM", 30, 50], ["CM", 70, 50], ["CAM", 50, 36], ["ST", 38, 16], ["ST", 62, 16]],
    "4-5-1": [["GK", 50, 92], ["LB", 14, 72], ["CB", 37, 77], ["CB", 63, 77], ["RB", 86, 72], ["LM", 13, 44], ["CM", 33, 50], ["CDM", 50, 60], ["CM", 67, 50], ["RM", 87, 44], ["ST", 50, 15]],
    "3-4-3": [["GK", 50, 92], ["CB", 27, 76], ["CB", 50, 79], ["CB", 73, 76], ["LM", 12, 50], ["CM", 38, 55], ["CM", 62, 55], ["RM", 88, 50], ["LW", 20, 24], ["ST", 50, 15], ["RW", 80, 24]],
    "3-5-2": [["GK", 50, 92], ["CB", 27, 76], ["CB", 50, 79], ["CB", 73, 76], ["LM", 11, 48], ["CM", 32, 48], ["CDM", 50, 60], ["CM", 68, 48], ["RM", 89, 48], ["ST", 38, 17], ["ST", 62, 17]],
    "5-3-2": [["GK", 50, 92], ["LB", 10, 64], ["CB", 30, 76], ["CB", 50, 79], ["CB", 70, 76], ["RB", 90, 64], ["CM", 30, 50], ["CDM", 50, 56], ["CM", 70, 50], ["ST", 38, 18], ["ST", 62, 18]],
  };

  // Trọng số đóng góp [phòng ngự, tuyến giữa, tấn công] của từng ô
  const LINE_W = {
    CB: [1, 0.12, 0], LB: [0.8, 0.3, 0.18], RB: [0.8, 0.3, 0.18], CDM: [0.55, 0.85, 0.1], CM: [0.2, 1, 0.3], CAM: [0, 0.7, 0.75],
    LM: [0.15, 0.7, 0.5], RM: [0.15, 0.7, 0.5], LW: [0, 0.3, 1], RW: [0, 0.3, 1], ST: [0, 0.12, 1.1],
  };

  // Mẫu chỉ số theo vị trí: độ lệch so với OVR cho [PAC, SHO, PAS, DRI, DEF, PHY]
  const ATTR_T = {
    CB: [-8, -30, -12, -15, 3, 2], LB: [4, -22, -4, -2, -2, -6], RB: [4, -22, -4, -2, -2, -6],
    CDM: [-12, -15, -1, -5, 0, 2], CM: [-8, -6, 2, 0, -12, -4], CAM: [-3, -1, 1, 3, -35, -14],
    LM: [4, -6, -2, 2, -30, -12], RM: [4, -6, -2, 2, -30, -12], LW: [6, -3, -4, 3, -45, -14], RW: [6, -3, -4, 3, -45, -14],
    ST: [2, 3, -12, -2, -48, -2],
  };
  const ATTR_NAMES = ["TĐ", "SÚT", "CHUYỀN", "RÊ", "THỦ", "THỂ"];
  const GK_ATTR_NAMES = ["BAY", "BẮT", "PHÁT", "PXẠ", "TĐ", "CHỌN"];

  function genAttrs(name, pos, ovr) {
    const r = U.seeded(U.hashStr(name + pos));
    if (pos === "GK") {
      return [0, 0, 0, 0, 0, 0].map((_, i) => U.clamp(Math.round(ovr + [1, -1, -10, 2, -35, 0][i] + (r() - 0.5) * 8), 20, 99));
    }
    const t = ATTR_T[pos];
    return t.map((d) => U.clamp(Math.round(ovr + d + (r() - 0.5) * 9), 20, 99));
  }

  function potentialFor(age, ovr) {
    const bonus = age <= 18 ? 12 : age <= 20 ? 9 : age <= 22 ? 6 : age <= 24 ? 3 : age <= 26 ? 1 : 0;
    return Math.min(95, ovr + bonus);
  }

  // Giá trị chuyển nhượng (M€)
  function calcValue(p) {
    let v = 0.2 * Math.pow(1.18, p.ovr - 50);
    const a = p.age;
    let af = 1;
    if (a <= 20) af = 1.25;
    else if (a <= 23) af = 1.15;
    else if (a <= 27) af = 1.0;
    else if (a <= 29) af = 0.85;
    else af = Math.max(0.12, 0.85 - (a - 29) * 0.16);
    v *= af;
    if (a <= 24 && p.pot > p.ovr) v *= 1 + (p.pot - p.ovr) * 0.045;
    if (p.contract <= 1) v *= 0.75;
    if (p.injury > 60) v *= 0.85;
    if (v < 0.05) v = 0.05;
    return Math.round(v * 10) / 10;
  }

  // Lương cơ bản (nghìn € / tuần)
  function baseWage(ovr, age) {
    let w = 1.8 * Math.pow(1.14, ovr - 50);
    if (age >= 31) w *= 1.05;
    return Math.max(2, Math.round(w));
  }

  function shirtNumbers(players) {
    const pref = { GK: [1, 13, 31], CB: [4, 5, 6, 15, 3, 2], LB: [3, 12, 21], RB: [2, 12, 22], CDM: [6, 16, 18], CM: [8, 14, 16, 18], CAM: [10, 20, 7], LM: [11, 17, 23], RM: [7, 17, 24], LW: [11, 7, 19], RW: [7, 11, 19], ST: [9, 19, 18, 14] };
    const used = new Set();
    const sorted = players.slice().sort((a, b) => b.ovr - a.ovr);
    for (const p of sorted) {
      let n = (pref[p.pos] || []).find((x) => !used.has(x));
      if (!n) { n = 2; while (used.has(n)) n++; }
      used.add(n);
      p.num = n;
    }
  }

  function makePlayer(raw, clubId, ageOffset, rep) {
    const [name, pos, age0, ovr, nat, pot0] = raw;
    const age = age0 + ageOffset;
    const p = {
      id: U.uid("p"), name, pos, age, ovr, nat, clubId,
      pot: Math.max(ovr, pot0 || potentialFor(age, ovr)),
      attrs: genAttrs(name, pos, ovr),
      contract: U.randInt(1, 5),
      fitness: 100, morale: 72, form: 6.6, injury: 0, injuryName: "", suspended: 0, yellows: 0, prog: 0,
      listed: false, youth: false, num: 0, joined: null,
      stats: newStats(), career: { apps: 0, goals: 0, assists: 0 },
    };
    if (age <= 21) p.contract = Math.max(p.contract, 3);
    if (age >= 33) p.contract = Math.min(p.contract, 2);
    p.wage = Math.round(baseWage(ovr, age) * U.rand(0.85, 1.2) * (0.75 + (rep || 75) / 300));
    p.value = calcValue(p);
    return p;
  }

  function newStats() {
    return { apps: 0, sub: 0, goals: 0, assists: 0, ratingSum: 0, rated: 0, cs: 0, yc: 0, rc: 0, motm: 0, mins: 0 };
  }

  function avgRating(p) {
    return p.stats.rated ? p.stats.ratingSum / p.stats.rated : 0;
  }

  // Cập nhật chỉ số con khi OVR thay đổi
  function applyOvrDelta(p, d) {
    p.ovr = U.clamp(p.ovr + d, 30, 99);
    p.attrs = p.attrs.map((a, i) => U.clamp(a + d + (p.pos !== "GK" && i === 0 && p.age > 30 && d < 0 ? -1 : 0), 15, 99));
  }

  function available(p) {
    return p.injury <= 0 && p.suspended <= 0;
  }

  // Sức mạnh hiệu quả của cầu thủ ở một ô vị trí
  function effective(p, slotPos, fitnessOverride) {
    const fit = fitnessOverride != null ? fitnessOverride : p.fitness;
    const fam = familiarity(p.pos, slotPos);
    const fitF = 0.72 + 0.28 * U.clamp(fit, 0, 100) / 100;
    const morF = 0.97 + 0.06 * (p.morale / 100);
    const formF = 0.97 + (U.clamp(p.form, 5, 9) - 6.5) * 0.02;
    return p.ovr * fam * fitF * morF * formF;
  }

  // Tự chọn đội hình tốt nhất cho một sơ đồ (phân bổ tham lam toàn cục theo giá trị hiệu quả)
  function autoLineup(players, formation, opts = {}) {
    const slots = FORMATIONS[formation];
    const pool = players.filter((p) => available(p) && !(opts.exclude && opts.exclude.has(p.id)));
    const lineup = new Array(slots.length).fill(null);
    const used = new Set();
    const pairs = [];
    slots.forEach((sl, i) => {
      for (const p of pool) {
        const rest = opts.rotate && p.fitness < 82 ? 0.88 : 1;
        pairs.push([effective(p, sl[0]) * rest, i, p]);
      }
    });
    pairs.sort((a, b) => b[0] - a[0]);
    for (const [, i, p] of pairs) {
      if (lineup[i] || used.has(p.id)) continue;
      lineup[i] = p.id;
      used.add(p.id);
    }
    const bench = pool
      .filter((p) => !used.has(p.id))
      .sort((a, b) => b.ovr - a.ovr);
    const benchIds = [];
    const gk = bench.find((p) => p.pos === "GK");
    if (gk) benchIds.push(gk.id);
    for (const p of bench) {
      if (benchIds.length >= 9) break;
      if (!benchIds.includes(p.id)) benchIds.push(p.id);
    }
    return { lineup, bench: benchIds };
  }

  FC.players = {
    POS, POS_VI, GROUP, POS_ORDER, FORMATIONS, LINE_W, ATTR_NAMES, GK_ATTR_NAMES,
    familiarity, genAttrs, potentialFor, calcValue, baseWage, makePlayer, newStats, avgRating, applyOvrDelta,
    available, effective, autoLineup, shirtNumbers,
  };
})();
