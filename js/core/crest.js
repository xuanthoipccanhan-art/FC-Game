/*
 * Huy hiệu CLB.
 * - Mặc định: tự vẽ huy hiệu SVG theo màu áo của CLB (không sao chép logo chính thức).
 * - Nếu bạn đặt file logo thật vào thư mục logos/ (vd: logos/ars.png hoặc logos/ars.svg),
 *   trò chơi sẽ tự động phát hiện và dùng logo đó.
 */
(function () {
  const FC = (window.FC = window.FC || {});
  const cache = {};
  const realLogos = {}; // id -> url

  function lum(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function svgCrest(club) {
    if (cache[club.id]) return cache[club.id];
    const [c1, c2, c3] = club.colors;
    const txt = lum(c1) > 0.6 ? (lum(c3) < 0.6 ? c3 : "#111") : "#fff";
    const stroke = lum(c3) > 0.85 && lum(c1) > 0.85 ? "#222" : c3;
    const label = club.short;
    const year = club.founded ? String(club.founded) : "";
    const gid = "g" + club.id;
    let shape, inner = "";
    const style = club.crest || "shield";
    if (style === "round") {
      shape = `<circle cx="50" cy="50" r="46" fill="${c1}" stroke="${stroke}" stroke-width="5"/>`;
      inner = `<circle cx="50" cy="50" r="36" fill="none" stroke="${c2}" stroke-width="2.5" opacity=".85"/>`;
      inner += `<path d="M14 62 H86" stroke="${c2}" stroke-width="2" opacity=".5"/>`;
    } else if (style === "stripes") {
      shape = `<path d="M50 4 L90 16 V50 C90 74 72 88 50 96 C28 88 10 74 10 50 V16 Z" fill="${c1}" stroke="${stroke}" stroke-width="5"/>`;
      inner = `<clipPath id="${gid}"><path d="M50 4 L90 16 V50 C90 74 72 88 50 96 C28 88 10 74 10 50 V16 Z"/></clipPath>
        <g clip-path="url(#${gid})" opacity=".9">${[18, 38, 58, 78].map((x) => `<rect x="${x}" y="0" width="10" height="100" fill="${c2}"/>`).join("")}</g>`;
    } else {
      shape = `<path d="M50 4 L90 14 V48 C90 72 74 88 50 96 C26 88 10 72 10 48 V14 Z" fill="${c1}" stroke="${stroke}" stroke-width="5"/>`;
      inner = `<path d="M10 30 H90" stroke="${c2}" stroke-width="7" opacity=".9"/>`;
    }
    const labelBg = style === "stripes" ? `<rect x="16" y="40" width="68" height="22" rx="4" fill="${c3 === c2 ? "#111" : c3}" opacity=".92"/>` : "";
    const labelColor = style === "stripes" ? "#fff" : txt;
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${shape}${inner}${labelBg}
      <text x="50" y="${style === "stripes" ? 57 : 58}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${label.length > 3 ? 18 : 22}" fill="${labelColor}">${label}</text>
      ${year && style !== "stripes" ? `<text x="50" y="76" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="9" fill="${labelColor}" opacity=".8">${year}</text>` : ""}
    </svg>`;
    cache[club.id] = svg;
    return svg;
  }

  function crest(club, size = 28) {
    if (!club) return `<span class="crest" style="width:${size}px;height:${size}px"></span>`;
    if (realLogos[club.id]) {
      return `<span class="crest" style="width:${size}px;height:${size}px"><img src="${realLogos[club.id]}" alt="${club.short}"></span>`;
    }
    return `<span class="crest" style="width:${size}px;height:${size}px">${svgCrest(club)}</span>`;
  }

  // Dò logo thật trong thư mục logos/
  function probeLogos(clubs, done) {
    const exts = ["png", "svg", "webp", "jpg"];
    let pending = 0;
    let found = 0;
    for (const c of clubs) {
      for (const ext of exts) {
        pending++;
        const url = `logos/${c.id}.${ext}`;
        const img = new Image();
        img.onload = () => {
          if (!realLogos[c.id]) { realLogos[c.id] = url; found++; }
          if (--pending === 0 && done) done(found);
        };
        img.onerror = () => {
          if (--pending === 0 && done) done(found);
        };
        img.src = url;
      }
    }
    if (pending === 0 && done) done(0);
  }

  FC.crest = crest;
  FC.crestSvg = svgCrest;
  FC.probeLogos = probeLogos;
  FC.realLogos = realLogos;
})();
