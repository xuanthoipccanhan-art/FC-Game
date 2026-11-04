/*
 * Cấu hình thế giới bóng đá: các giải, hệ thống lên/xuống hạng, suất dự cúp châu lục.
 *
 * Mỗi CLB được khai báo dạng mảng gọn:
 *  [id, tên, tên ngắn, thành phố, năm thành lập, sân, sức chứa, "màu1 màu2 màu3", kiểu huy hiệu (s|r|t),
 *   uy tín (0-100), ngân sách chuyển nhượng (triệu €), sơ đồ, cấp học viện (1-5),
 *   "HLV|quốc tịch|tuổi(2025)|triết lý|năng lực(1-100)",
 *   "Cầu thủ,VT,tuổi(2025),OVR,QT[,tiềm năng];..." ]
 * Cầu thủ được liệt kê là cầu thủ thật; trò chơi sẽ tự bổ sung cầu thủ để đủ đội hình.
 */
(function () {
  const FC = (window.FC = window.FC || {});

  FC.LEAGUES = {
    ENG1: { floor: 72, country: "ENG", name: "Ngoại hạng Anh", short: "NHA", tier: 1, down: "ENG2", relegate: 3, color: "#7b2ff7", tv: 2.2, prize: 60, cup: "Cúp FA" },
    ENG2: { floor: 64, country: "ENG", name: "Hạng Nhất Anh (Championship)", short: "CHA", tier: 2, up: "ENG1", promote: 2, playoff: "semis", color: "#2f6fed", tv: 0.35, prize: 8 },
    ESP1: { floor: 70, country: "ESP", name: "La Liga", short: "LIGA", tier: 1, down: "ESP2", relegate: 3, color: "#ee3a43", tv: 1.3, prize: 35, cup: "Cúp Nhà vua" },
    ESP2: { floor: 61, country: "ESP", name: "Segunda División", short: "SEG", tier: 2, up: "ESP1", promote: 2, playoff: "semis", color: "#c43b6b", tv: 0.15, prize: 4 },
    ITA1: { floor: 70, country: "ITA", name: "Serie A", short: "SA", tier: 1, down: "ITA2", relegate: 3, color: "#0a5bd3", tv: 1.1, prize: 32, cup: "Coppa Italia" },
    ITA2: { floor: 60, country: "ITA", name: "Serie B", short: "SB", tier: 2, up: "ITA1", promote: 2, playoff: "semis", color: "#2c8b4a", tv: 0.12, prize: 3 },
    GER1: { floor: 69, country: "GER", name: "Bundesliga", short: "BL", tier: 1, down: "GER2", relegate: 2, barrage: true, color: "#d20515", tv: 1.2, prize: 33, cup: "DFB-Pokal" },
    GER2: { floor: 61, country: "GER", name: "2. Bundesliga", short: "BL2", tier: 2, up: "GER1", promote: 2, color: "#8a1c1c", tv: 0.2, prize: 4 },
    FRA1: { floor: 67, country: "FRA", name: "Ligue 1", short: "L1", tier: 1, down: "FRA2", relegate: 2, barrage: true, color: "#0b2a5b", tv: 0.6, prize: 22, cup: "Coupe de France" },
    FRA2: { floor: 59, country: "FRA", name: "Ligue 2", short: "L2", tier: 2, up: "FRA1", promote: 2, color: "#5b6b8b", tv: 0.08, prize: 2 },
    NED1: { floor: 63, country: "NED", name: "Eredivisie", short: "ERE", tier: 1, color: "#e8641b", tv: 0.25, prize: 10, cup: "KNVB Beker" },
    POR1: { floor: 62, country: "POR", name: "Liga Portugal", short: "LPO", tier: 1, color: "#0c6b3a", tv: 0.25, prize: 10, cup: "Taça de Portugal" },
    KSA1: { floor: 64, country: "KSA", name: "Saudi Pro League", short: "SPL", tier: 1, color: "#0f7a3e", tv: 0.5, prize: 15, cup: "King's Cup" },
    USA1: { floor: 63, country: "USA", name: "Major League Soccer", short: "MLS", tier: 1, color: "#1d3c78", tv: 0.3, prize: 8, cup: "US Open Cup", closed: "MLS không có xuống hạng (giống thực tế)." },
    ARG1: { floor: 63, country: "ARG", name: "Liga Profesional Argentina", short: "LPF", tier: 1, color: "#5aa9e6", tv: 0.15, prize: 6, cup: "Copa Argentina" },
    BRA1: { floor: 65, country: "BRA", name: "Brasileirão Série A", short: "BRA", tier: 1, color: "#f2c200", tv: 0.3, prize: 10, cup: "Copa do Brasil" },
  };

  // Thứ tự hiển thị nhóm giải theo quốc gia
  FC.COUNTRY_ORDER = ["ENG", "ESP", "ITA", "GER", "FRA", "POR", "NED", "KSA", "USA", "BRA", "ARG"];

  // Cúp châu lục: số suất theo giải (lấy theo thứ hạng mùa trước, mùa đầu theo uy tín)
  FC.CONTINENTAL = {
    ucl: { name: "Cúp C1 châu Âu", short: "C1", color: "#1e88e5", slots: { ENG1: 5, ESP1: 5, ITA1: 5, GER1: 5, FRA1: 4, POR1: 4, NED1: 4 }, groups: 8 },
    lib: { name: "Copa Libertadores", short: "LIB", color: "#c9a227", slots: { BRA1: 8, ARG1: 8 }, groups: 4 },
  };

  // Triết lý bóng đá
  FC.PHILOSOPHIES = {
    control: { name: "Kiểm soát bóng (Juego de Posición)", short: "Kiểm soát", mid: 0.02, att: 0.006, def: 0, poss: 0.05, press: 2, tempo: 0, men: 1, desc: "Kiểm soát bóng, chuyền ngắn, chiếm ưu thế khu trung tuyến. Cần cầu thủ chuyền bóng tốt." },
    gegen: { name: "Gegenpressing", short: "Gegenpress", mid: 0.015, att: 0.015, def: -0.004, poss: 0.025, press: 2, tempo: 2, men: 1, fatigue: 0.15, desc: "Đoạt bóng ngay sau khi mất, pressing tầm cao, chuyển trạng thái cực nhanh. Cầu thủ mệt nhanh hơn." },
    counter: { name: "Phản công tốc độ", short: "Phản công", mid: -0.006, att: 0.018, def: 0.012, poss: -0.05, press: 0, tempo: 2, men: -1, bigChance: 0.04, desc: "Lùi sâu chờ thời, khai thác khoảng trống sau lưng hàng thủ bằng tốc độ." },
    park: { name: "Phòng ngự số đông (Catenaccio)", short: "Phòng ngự", mid: -0.006, att: -0.018, def: 0.035, poss: -0.045, press: 0, tempo: 0, men: -2, desc: "Kỷ luật, chặt chẽ, ưu tiên giữ sạch lưới. Khó bị đánh bại nhưng ít bàn thắng." },
    direct: { name: "Bóng dài trực diện", short: "Trực diện", mid: -0.012, att: 0.012, def: 0.01, poss: -0.03, press: 1, tempo: 2, men: 0, desc: "Đưa bóng nhanh lên phía trên, tranh chấp bóng hai, tận dụng tiền đạo cao to." },
    wing: { name: "Tấn công biên", short: "Đánh biên", mid: 0, att: 0.015, def: -0.003, poss: 0.01, press: 1, tempo: 1, men: 1, desc: "Khai thác hai hành lang cánh, tạt bóng và xâm nhập từ biên." },
    pragmatic: { name: "Thực dụng", short: "Thực dụng", mid: 0.008, att: 0.008, def: 0.008, poss: 0, press: 1, tempo: 1, men: 0, desc: "Linh hoạt theo đối thủ, cân bằng giữa công và thủ, ưu tiên kết quả." },
  };

  FC.WORLD = { clubs: [], byLeague: {} };

  function parsePlayers(str) {
    if (!str) return [];
    return str.split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
      const a = s.split(",").map((x) => x.trim());
      return [a[0], a[1], +a[2], +a[3], a[4], a[5] ? +a[5] : undefined];
    });
  }

  FC.addClubs = function (leagueId, rows) {
    const L = FC.LEAGUES[leagueId];
    for (const r of rows) {
      const [id, name, short, city, founded, stadium, cap, colors, crest, rep, money, formation, academy, mgr, players] = r;
      const m = (mgr || "").split("|");
      const club = {
        id, name, short, city, founded, stadium, cap, colors: colors.split(" ").map((c) => "#" + c),
        crest: { s: "shield", r: "round", t: "stripes" }[crest] || "shield", rep, money, formation, academy: academy || 2,
        league: leagueId, country: L.country,
        manager: m[0] ? { name: m[0], nat: m[1], age: +m[2], phil: m[3] || "pragmatic", rating: +m[4] || 70 } : null,
        players: parsePlayers(players),
      };
      FC.WORLD.clubs.push(club);
      (FC.WORLD.byLeague[leagueId] = FC.WORLD.byLeague[leagueId] || []).push(club);
    }
  };

  // Cầu thủ tự do đầu game (hết hợp đồng hè 2026)
  FC.FREE_AGENTS = [];
  FC.addFreeAgents = function (str) { FC.FREE_AGENTS.push(...parsePlayers(str)); };
})();
