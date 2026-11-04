/* Quốc tịch: mã FIFA -> [tên tiếng Việt, mã ISO2 cho cờ] */
(function () {
  const FC = (window.FC = window.FC || {});
  const N = {
    ENG: ["Anh", "gb-eng"], SCO: ["Scotland", "gb-sct"], WAL: ["Xứ Wales", "gb-wls"], NIR: ["Bắc Ireland", "GB"],
    IRL: ["Ireland", "IE"], ESP: ["Tây Ban Nha", "ES"], FRA: ["Pháp", "FR"], GER: ["Đức", "DE"], ITA: ["Ý", "IT"],
    POR: ["Bồ Đào Nha", "PT"], NED: ["Hà Lan", "NL"], BEL: ["Bỉ", "BE"], BRA: ["Brazil", "BR"], ARG: ["Argentina", "AR"],
    URU: ["Uruguay", "UY"], COL: ["Colombia", "CO"], ECU: ["Ecuador", "EC"], PAR: ["Paraguay", "PY"], MEX: ["Mexico", "MX"],
    USA: ["Mỹ", "US"], CAN: ["Canada", "CA"], JAM: ["Jamaica", "JM"], NOR: ["Na Uy", "NO"], SWE: ["Thụy Điển", "SE"],
    DEN: ["Đan Mạch", "DK"], ISL: ["Iceland", "IS"], SUI: ["Thụy Sĩ", "CH"], AUT: ["Áo", "AT"], CZE: ["Séc", "CZ"],
    SVK: ["Slovakia", "SK"], POL: ["Ba Lan", "PL"], HUN: ["Hungary", "HU"], CRO: ["Croatia", "HR"], SRB: ["Serbia", "RS"],
    SVN: ["Slovenia", "SI"], BIH: ["Bosnia", "BA"], ROU: ["Romania", "RO"], BUL: ["Bulgaria", "BG"], GRE: ["Hy Lạp", "GR"], ALB: ["Albania", "AL"],
    KOS: ["Kosovo", "XK"], TUR: ["Thổ Nhĩ Kỳ", "TR"], GEO: ["Georgia", "GE"], ARM: ["Armenia", "AM"], UKR: ["Ukraine", "UA"],
    RUS: ["Nga", "RU"], UZB: ["Uzbekistan", "UZ"], JPN: ["Nhật Bản", "JP"], KOR: ["Hàn Quốc", "KR"], VIE: ["Việt Nam", "VN"],
    EGY: ["Ai Cập", "EG"], MAR: ["Ma-rốc", "MA"], ALG: ["Algeria", "DZ"], TUN: ["Tunisia", "TN"], SEN: ["Senegal", "SN"],
    CIV: ["Bờ Biển Ngà", "CI"], GHA: ["Ghana", "GH"], NGA: ["Nigeria", "NG"], CMR: ["Cameroon", "CM"], MLI: ["Mali", "ML"],
    BFA: ["Burkina Faso", "BF"], GUI: ["Guinea", "GN"], GNB: ["Guinea-Bissau", "GW"], GAM: ["Gambia", "GM"],
    COD: ["CHDC Congo", "CD"], RSA: ["Nam Phi", "ZA"], MOZ: ["Mozambique", "MZ"], ZIM: ["Zimbabwe", "ZW"], NZL: ["New Zealand", "NZ"],
  };

  function flag(code) {
    const n = N[code];
    if (!n) return "🏳️";
    const iso = n[1];
    if (iso.startsWith("gb-")) {
      const tag = iso.replace("-", "");
      return "\u{1F3F4}" + [...tag].map((c) => String.fromCodePoint(0xe0000 + c.charCodeAt(0))).join("") + "\u{E007F}";
    }
    return [...iso.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("");
  }

  // Tên dùng để sinh cầu thủ trẻ học viện (tên ngẫu nhiên, không phải người thật)
  const NAMES = {
    ENG: {
      f: ["Jack", "Harry", "Oliver", "Charlie", "George", "Alfie", "Freddie", "Archie", "Leo", "Theo", "Oscar", "Max", "Finley", "Reggie", "Jayden", "Kai", "Tyler", "Ethan", "Callum", "Mason", "Louie", "Ronnie", "Jude", "Toby"],
      l: ["Smith", "Jones", "Taylor", "Brown", "Walker", "Wright", "Robinson", "Thompson", "Hughes", "Edwards", "Green", "Hall", "Wood", "Harris", "Clarke", "Bennett", "Cooper", "Ward", "Morris", "Turner", "Parker", "Shaw", "Mills", "Fletcher", "Barker", "Okafor", "Mensah", "Adeyemi"],
    },
    ESP: {
      f: ["Pablo", "Hugo", "Álvaro", "Mario", "Diego", "Javier", "Marcos", "Iker", "Unai", "Adrián", "Sergio", "Rubén", "Dani", "Aitor", "Nico"],
      l: ["García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Fernández", "Ruiz", "Díaz", "Moreno", "Navarro", "Romero", "Torres", "Ramos", "Gil"],
    },
    FRA: {
      f: ["Lucas", "Hugo", "Enzo", "Mathis", "Nathan", "Théo", "Rayan", "Kylian", "Noah", "Yanis", "Sacha", "Bilal", "Mamadou", "Ibrahim"],
      l: ["Martin", "Bernard", "Dubois", "Durand", "Lefebvre", "Moreau", "Laurent", "Diallo", "Traoré", "Camara", "Koné", "Mendy", "Fofana", "Girard"],
    },
    GER: {
      f: ["Lukas", "Leon", "Finn", "Jonas", "Luca", "Felix", "Paul", "Niklas", "Tim", "Moritz", "Jannik", "Elias"],
      l: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Wagner", "Becker", "Hoffmann", "Koch", "Richter", "Klein", "Wolf"],
    },
    ITA: {
      f: ["Lorenzo", "Matteo", "Alessandro", "Francesco", "Andrea", "Riccardo", "Tommaso", "Gabriele", "Federico", "Davide"],
      l: ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Conti", "De Luca"],
    },
    POR: {
      f: ["João", "Rodrigo", "Tiago", "Diogo", "Gonçalo", "Rafael", "Martim", "Afonso", "Duarte", "Tomás"],
      l: ["Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Sousa", "Fernandes", "Gomes"],
    },
    BRA: {
      f: ["Gabriel", "Lucas", "Matheus", "Pedro", "Vitor", "Gustavo", "Kauã", "Endrick", "Vinícius", "Rafael", "Thiago", "Breno"],
      l: ["Silva", "Souza", "Oliveira", "Lima", "Pereira", "Costa", "Ribeiro", "Almeida", "Carvalho", "Rocha", "Barbosa", "Nunes"],
    },
    NED: {
      f: ["Daan", "Sem", "Milan", "Luuk", "Thijs", "Bram", "Jesse", "Ruben", "Noah", "Xavi"],
      l: ["de Jong", "Jansen", "de Vries", "van den Berg", "Bakker", "Visser", "Smit", "Meijer", "Mulder", "de Boer"],
    },
  };

  FC.NATIONS = N;
  FC.NAMES = NAMES;
  FC.flag = flag;
  FC.natName = (c) => (N[c] ? N[c][0] : c);
})();
