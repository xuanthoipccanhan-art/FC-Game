# ⚽ Pitch Boss 27 — Game quản lý bóng đá

Game quản lý bóng đá chạy ngay trên trình duyệt (HTML/CSS/JavaScript thuần, không cần cài đặt hay build),
lấy cảm hứng từ thể loại EA FC Career Mode và Football Manager. Bạn làm HLV một trong **312 CLB thật thuộc 16 giải**
của 11 quốc gia, dẫn dắt tối đa **10 mùa giải** (2026/27 → 2035/36).

## Cách chơi

- **Cách nhanh nhất:** mở file `index.html` bằng trình duyệt (Chrome, Edge, Firefox, Safari).
- Hoặc chạy web server tĩnh rồi vào `http://localhost:8000`:

```bash
python3 -m http.server 8000
```

Game tự lưu (IndexedDB của trình duyệt, 3 khe lưu). Nút **Tiếp tục** mô phỏng toàn bộ thế giới tới trận đấu kế tiếp của bạn
hoặc tới sự kiện cần bạn quyết định.

## Thế giới bóng đá

| Quốc gia | Hạng 1 | Hạng 2 | Lên/xuống hạng |
| --- | --- | --- | --- |
| 🏴 Anh | Ngoại hạng Anh (20) | Championship (24) | 3 xuống · 2 lên thẳng + play-off hạng 3–6 |
| 🇪🇸 Tây Ban Nha | La Liga (20) | Segunda División (22) | 3 xuống · 2 lên thẳng + play-off (đội B không được lên hạng) |
| 🇮🇹 Ý | Serie A (20) | Serie B (20) | 3 xuống · 2 lên thẳng + play-off |
| 🇩🇪 Đức | Bundesliga (18) | 2. Bundesliga (18) | 2 xuống + trận play-off trụ hạng (hạng 16 gặp hạng 3 giải dưới) |
| 🇫🇷 Pháp | Ligue 1 (18) | Ligue 2 (18) | 2 xuống + trận play-off trụ hạng |
| 🇵🇹 🇳🇱 🇸🇦 🇺🇸 🇧🇷 🇦🇷 | Liga Portugal, Eredivisie, Saudi Pro League, MLS, Brasileirão, Liga Profesional | — | Giải đóng trong game (MLS không xuống hạng giống thực tế) |

- **Cúp quốc gia** cho mọi nước (Cúp FA, Cúp Nhà vua, Coppa Italia, DFB-Pokal, Coupe de France, Taça, KNVB Beker, King's Cup, US Open Cup, Copa do Brasil, Copa Argentina).
- **Cúp C1 châu Âu** 32 đội (8 bảng → vòng 1/8 → chung kết) và **Copa Libertadores** 16 đội; suất dự lấy theo thứ hạng mùa trước.
- Lịch thi đấu có các đợt FIFA Days (cầu thủ lên tuyển, mệt mỏi, có thể chấn thương), vòng đấu giữa tuần, ngày cuối kỳ chuyển nhượng.

## Tính năng

| Mảng | Chi tiết |
| --- | --- |
| **Dữ liệu 2026/27** | Đội tham dự các giải 2026/27, HLV và các vụ chuyển nhượng lớn hè 2026 (xem phần Dữ liệu). ~1.800 cầu thủ thật, phần còn lại của đội hình do game tạo (đánh dấu ⓖ) |
| **HLV & triết lý** | HLV thật của từng CLB với 7 triết lý: Kiểm soát bóng, Gegenpressing, Phản công, Phòng ngự số đông, Bóng dài trực diện, Đánh biên, Thực dụng. Triết lý ảnh hưởng mô phỏng và cần thời gian để đội "thấm nhuần" |
| **Ghế nóng** | HLV AI bị sa thải khi thành tích kém, HLV tự do (Guardiola, Klopp, Ancelotti…) và cựu cầu thủ lấy bằng HLV thay thế. Bản thân bạn cũng có thể bị sa thải và nhận lời mời từ CLB ở giải khác |
| **Trận đấu trực tiếp** | Bình luận tiếng Việt từng phút, xG, thẻ phạt, chấn thương, VAR/phạt đền, hiệp phụ & luân lưu; tốc độ xem, thay người, chỉ đạo, nói chuyện giờ nghỉ, họp báo trước trận |
| **Chuyển nhượng** | 2 kỳ chuyển nhượng, tìm kiếm trên mọi giải, đàm phán phí & lương, điều khoản giải phóng (Tây Ban Nha), cầu thủ "không bán", cầu thủ từ chối CLB kém danh tiếng, cầu thủ tự do, ngày cuối kỳ chuyển nhượng |
| **Cho mượn** | Cho mượn cầu thủ (CLB khác trả % lương, có thể kèm điều khoản mua đứt) và hỏi mượn cầu thủ; AI cũng cho mượn cầu thủ trẻ |
| **Tin đồn chuyển nhượng** | Tin đồn hằng tuần với độ tin cậy theo nguồn (Tier 1 → mạng xã hội). Tin đáng tin thường thành "HERE WE GO!" thật; CLB khác hỏi mua cầu thủ của bạn theo đúng tin đồn |
| **Đội một / Đội trẻ U21** | Đẩy cầu thủ xuống đội trẻ để tập luyện, đôn cầu thủ trẻ lên đội một; cầu thủ lớn tuổi ở đội trẻ sẽ mất tinh thần |
| **Lò đào tạo** | Cấp học viện theo thực tế (La Masia, Ajax, Benfica, Sporting, Porto, Athletic, River, Boca, Santos, Flamengo…). Lứa trẻ mới mỗi tháng 3 cho mọi CLB, có thể xuất hiện thần đồng |
| **Drama trong & ngoài sân cỏ** | Cầu thủ đòi ra đi, ẩu đả trên sân tập, bê bối hộp đêm, đòi tăng lương, bài đăng mạng xã hội, xin nghỉ phép, bị CLB khác "câu kéo", chủ tịch can thiệp, CĐV biểu tình — mỗi sự kiện có lựa chọn và hậu quả |
| **Tính cách cầu thủ** | Chuyên nghiệp, Tham vọng, Trung thành, Nóng nảy, Ham chơi, Thủ lĩnh, Điềm tĩnh, Thất thường — ảnh hưởng tới drama, lương, quyết định chuyển nhượng |
| **Nhân sự** | Trợ lý HLV, HLV đội trẻ/GĐ học viện, HLV thể lực, tuyển trạch viên — ảnh hưởng thật tới game. **Cựu cầu thủ giải nghệ có thể xin làm HLV đội trẻ, trợ lý hoặc vào ban lãnh đạo** |
| **Đời thực khác** | Tài trợ áo đấu, tâm trạng CĐV, giá vé, nâng cấp cơ sở vật chất, Quả bóng vàng & Golden Boy hằng năm, danh hiệu, lịch sử mùa giải, điểm di sản sự nghiệp sau 10 mùa |

## Logo câu lạc bộ

Logo chính thức của các CLB là nhãn hiệu đã đăng ký, nên repo **không kèm theo** logo thật. Mặc định game tự vẽ
huy hiệu theo màu áo của từng CLB.

Muốn dùng logo thật trên máy của bạn: lưu file logo (PNG trong suốt hoặc SVG) vào thư mục `logos/` với tên
`<mã-clb>.png` hoặc `<mã-clb>.svg`. Game tự phát hiện khi tải trang. Ví dụ: `logos/ars.png`, `logos/rma.svg`.

### Mã CLB

**Ngoại hạng Anh** (20 CLB): `ars` Arsenal · `liv` Liverpool · `mci` Manchester City · `che` Chelsea · `mun` Manchester United · `tot` Tottenham Hotspur · `new` Newcastle United · `avl` Aston Villa · `bha` Brighton & Hove Albion · `bou` AFC Bournemouth · `bre` Brentford · `cry` Crystal Palace · `eve` Everton · `ful` Fulham · `lee` Leeds United · `nfo` Nottingham Forest · `sun` Sunderland · `cov` Coventry City · `ips` Ipswich Town · `hul` Hull City

**Hạng Nhất Anh (Championship)** (24 CLB): `whu` West Ham United · `bur` Burnley · `wol` Wolverhampton Wanderers · `lei` Leicester City · `sou` Southampton · `shu` Sheffield United · `mid` Middlesbrough · `nor` Norwich City · `wat` Watford · `wba` West Bromwich Albion · `wre` Wrexham · `sto` Stoke City · `swa` Swansea City · `mil` Millwall · `bri` Bristol City · `bir` Birmingham City · `bla` Blackburn Rovers · `der` Derby County · `pne` Preston North End · `qpr` Queens Park Rangers · `ptm` Portsmouth · `chr` Charlton Athletic · `oxf` Oxford United · `cdf` Cardiff City

**La Liga** (20 CLB): `rma` Real Madrid · `fcb` FC Barcelona · `atm` Atlético de Madrid · `ath` Athletic Club · `rso` Real Sociedad · `vil` Villarreal · `bet` Real Betis · `val` Valencia CF · `sev` Sevilla FC · `cel` Celta de Vigo · `osa` CA Osasuna · `ray` Rayo Vallecano · `get` Getafe CF · `esp` RCD Espanyol · `ala` Deportivo Alavés · `elc` Elche CF · `lev` Levante UD · `rac` Racing Santander · `dep` Deportivo La Coruña · `mal` Málaga CF

**Segunda División** (22 CLB): `ovi` Real Oviedo · `gir` Girona FC · `mlr` RCD Mallorca · `alm` UD Almería · `lpa` UD Las Palmas · `cas` CD Castellón · `spo` Sporting de Gijón · `zar` Real Zaragoza · `gra` Granada CF · `vll` Real Valladolid · `leg` CD Leganés · `cad` Cádiz CF · `eib` SD Eibar · `hue` SD Huesca · `alb` Albacete · `bur2` Burgos CF · `cor` Córdoba CF · `mir` CD Mirandés · `and` FC Andorra · `ceu` AD Ceuta · `cul` Cultural Leonesa · `rsob` Real Sociedad B

**Serie A** (20 CLB): `int` Inter · `acm` AC Milan · `juv` Juventus · `nap` Napoli · `rom` AS Roma · `ata` Atalanta · `laz` Lazio · `fio` Fiorentina · `bol` Bologna · `com` Como 1907 · `tor` Torino · `udi` Udinese · `gen` Genoa · `cag` Cagliari · `sas` Sassuolo · `lec` Lecce · `par` Parma · `ven` Venezia · `fro` Frosinone · `mon` Monza

**Serie B** (20 CLB): `pis` Pisa · `hve` Hellas Verona · `cre` Cremonese · `pal` Palermo · `sam` Sampdoria · `bar2` Bari · `spe` Spezia · `emp` Empoli · `mod` Modena · `ces` Cesena · `ctz` Catanzaro · `juvs` Juve Stabia · `car2` Carrarese · `reg` Reggiana · `sud` Südtirol · `pad` Padova · `ave` Avellino · `man` Mantova · `ent` Virtus Entella · `pes` Pescara

**Bundesliga** (18 CLB): `fcbay` Bayern München · `bvb` Borussia Dortmund · `b04` Bayer 04 Leverkusen · `rbl` RB Leipzig · `sge` Eintracht Frankfurt · `vfb` VfB Stuttgart · `scf` SC Freiburg · `m05` 1. FSV Mainz 05 · `bmg` Borussia Mönchengladbach · `tsg` TSG Hoffenheim · `fca` FC Augsburg · `svw` Werder Bremen · `fcu` 1. FC Union Berlin · `koe` 1. FC Köln · `hsv` Hamburger SV · `elv` SV Elversberg · `s04` FC Schalke 04 · `scp07` SC Paderborn 07

**2. Bundesliga** (18 CLB): `fch` 1. FC Heidenheim · `stp` FC St. Pauli · `wob` VfL Wolfsburg · `bsc` Hertha BSC · `h96` Hannover 96 · `fck` 1. FC Kaiserslautern · `ksc` Karlsruher SC · `d98` Darmstadt 98 · `fcn` 1. FC Nürnberg · `f95` Fortuna Düsseldorf · `fcm` 1. FC Magdeburg · `sgf` Greuther Fürth · `boc` VfL Bochum · `ksv` Holstein Kiel · `scm` Preußen Münster · `dsc` Arminia Bielefeld · `sgd` Dynamo Dresden · `ebs` Eintracht Braunschweig

**Ligue 1** (18 CLB): `psg` Paris Saint-Germain · `om` Olympique de Marseille · `asm` AS Monaco · `losc` LOSC Lille · `ol` Olympique Lyonnais · `nic` OGC Nice · `rcl` RC Lens · `srfc` Stade Rennais · `rcsa` RC Strasbourg · `tfc` Toulouse FC · `sb29` Stade Brestois 29 · `aja` AJ Auxerre · `sco` Angers SCO · `hac` Le Havre AC · `fcl` FC Lorient · `pfc` Paris FC · `est` ESTAC Troyes · `lmfc` Le Mans FC

**Ligue 2** (18 CLB): `fcn2` FC Nantes · `fcm2` FC Metz · `asse` AS Saint-Étienne · `sdr` Stade de Reims · `mhsc` Montpellier HSC · `eag` En Avant Guingamp · `fca2` FC Annecy · `pau` Pau FC · `asc` Amiens SC · `gf38` Grenoble Foot 38 · `raf` Rodez AF · `red` Red Star FC · `cf63` Clermont Foot · `sml` Stade Lavallois · `usld` USL Dunkerque · `usbco` US Boulogne · `asnl` AS Nancy-Lorraine · `scb` SC Bastia

**Liga Portugal** (18 CLB): `scp` Sporting CP · `slb` SL Benfica · `fcp` FC Porto · `scb2` SC Braga · `vsc` Vitória SC · `fam` FC Famalicão · `gil` Gil Vicente · `mor` Moreirense · `est2` Estoril Praia · `rio` Rio Ave · `aro` FC Arouca · `cpi` Casa Pia AC · `scl` Santa Clara · `nac` CD Nacional · `ead` Estrela da Amadora · `avs` AVS Futebol SAD · `alv` FC Alverca · `ton` CD Tondela

**Eredivisie** (18 CLB): `ajx` AFC Ajax · `psv` PSV Eindhoven · `fey` Feyenoord · `az` AZ Alkmaar · `twe` FC Twente · `utr` FC Utrecht · `gae` Go Ahead Eagles · `nec` NEC Nijmegen · `hee` SC Heerenveen · `spa` Sparta Rotterdam · `gro` FC Groningen · `for` Fortuna Sittard · `pec` PEC Zwolle · `her` Heracles Almelo · `exc` Excelsior · `tel` Telstar · `nacb` NAC Breda · `vol` FC Volendam

**Saudi Pro League** (18 CLB): `hil` Al-Hilal · `nas` Al-Nassr · `itt` Al-Ittihad · `ahl` Al-Ahli · `qad` Al-Qadsiah · `ett` Al-Ettifaq · `sha` Al-Shabab · `taa` Al-Taawoun · `fat` Al-Fateh · `khl` Al-Khaleej · `riy` Al-Riyadh · `fay` Al-Fayha · `kho` Al-Kholood · `haz` Al-Hazem · `okh` Al-Okhdood · `dam` Damac · `naj` Al-Najma · `neo` NEOM SC

**Major League Soccer** (20 CLB): `mia` Inter Miami CF · `lag` LA Galaxy · `lafc` Los Angeles FC · `sea` Seattle Sounders · `clb` Columbus Crew · `cin` FC Cincinnati · `phi` Philadelphia Union · `nyc` New York City FC · `nyrb` New York Red Bulls · `atl` Atlanta United · `orl` Orlando City · `nsh` Nashville SC · `aus` Austin FC · `tor2` Toronto FC · `van` Vancouver Whitecaps · `por2` Portland Timbers · `rsl` Real Salt Lake · `min` Minnesota United · `cha2` Charlotte FC · `sd` San Diego FC

**Brasileirão Série A** (20 CLB): `fla` Flamengo · `pal2` Palmeiras · `spfc` São Paulo · `cor2` Corinthians · `san` Santos · `flu` Fluminense · `bot` Botafogo · `vas` Vasco da Gama · `gre` Grêmio · `int2` Internacional · `cam` Atlético Mineiro · `cru` Cruzeiro · `bah` Bahia · `rbb` Red Bull Bragantino · `vit` Vitória · `mir2` Mirassol · `cfc` Coritiba · `cap` Athletico Paranaense · `chp` Chapecoense · `rem` Remo

**Liga Profesional Argentina** (20 CLB): `riv` River Plate · `bjr` Boca Juniors · `rac2` Racing Club · `ind` Independiente · `sla` San Lorenzo · `edlp` Estudiantes de La Plata · `vel` Vélez Sarsfield · `tal` Talleres · `rcen` Rosario Central · `nob` Newell's Old Boys · `lan` Lanús · `arj` Argentinos Juniors · `hur` Huracán · `bel` Belgrano · `glp` Gimnasia La Plata · `dyj` Defensa y Justicia · `pla` Platense · `uni` Unión de Santa Fe · `ban` Banfield · `gcm` Godoy Cruz

## Dữ liệu

- **Đã đối chiếu với nguồn tin (tính tới tháng 11/2026):** đội lên/xuống hạng của 5 giải lớn (vd. NHA 2026/27 có Coventry, Ipswich, Hull; West Ham, Burnley, Wolves xuống hạng),
  HLV Ngoại hạng Anh 2026/27 (Xabi Alonso – Chelsea, Iraola – Liverpool, Maresca – Man City, Carrick – Man Utd, De Zerbi – Tottenham…), Mourinho – Real Madrid,
  các vụ lớn hè 2026 (Enzo Fernández & Elliot Anderson → Man City, Morgan Rogers → Chelsea, Barcola → Liverpool, Rodri & Anthony Gordon → Barcelona,
  Tonali, Mateus Fernandes & Savinho → Tottenham, Bruno Guimarães → Arsenal, Diomandé → Real Madrid, Watkins → Al-Hilal…).
- **Ước lượng theo hiểu biết của tác giả (có thể chưa chính xác):** đội hình chi tiết các CLB (dựa trên mùa 2025/26), danh sách CLB hạng 2,
  một số HLV ở các giải ngoài Anh, chỉ số OVR/tiềm năng. Đội hình các CLB nhỏ được game bổ sung cầu thủ (ⓖ) để đủ người.
- Mọi dữ liệu nằm trong `js/data/leagues/*.js` ở dạng dễ sửa. Mỗi cầu thủ: `Tên,Vị trí,tuổi năm 2025,OVR,Mã quốc tịch[,tiềm năng]`.

## Cấu trúc mã nguồn

```
index.html                Trang chính
css/style.css             Giao diện (sáng/tối, responsive)
js/data/world.js          Cấu hình giải đấu, lên/xuống hạng, suất châu lục, triết lý
js/data/leagues/*.js      CLB, HLV, cầu thủ theo từng nước
js/core/match.js          Engine mô phỏng trận đấu theo phút
js/core/competitions.js   Lịch đa giải, bảng xếp hạng, cúp, play-off
js/core/transfers.js      Định giá, đàm phán, cho mượn, AI chuyển nhượng
js/core/events.js         Tin đồn, drama, họp báo, thay HLV, đội tuyển, giải thưởng, nhân sự
js/core/game.js           Tiến trình sự nghiệp, tài chính, ban lãnh đạo, mùa giải
js/core/store.js          Lưu trữ IndexedDB
js/ui/                    Các màn hình giao diện
logos/                    (Tuỳ chọn) logo thật do bạn tự thêm
```

## Lưu ý

Đây là dự án phi thương mại của người hâm mộ, không liên kết hay được bảo trợ bởi EA, Sports Interactive, SEGA,
FIFA, UEFA, CONMEBOL, các giải đấu hay bất kỳ CLB nào. Tên CLB, HLV và cầu thủ chỉ được dùng để mô tả.
Tên nhà tài trợ trong game là hư cấu.
