# ⚽ Pitch Boss 27 — Game quản lý bóng đá

Game quản lý bóng đá chạy ngay trên trình duyệt (HTML/CSS/JavaScript thuần, không cần cài đặt hay build),
lấy cảm hứng từ thể loại FIFA/EA FC Career Mode và Football Manager. Bạn làm HLV một CLB Ngoại hạng Anh
với **cầu thủ thật**, chinh phục Ngoại hạng Anh, Cúp Quốc gia và Cúp C1 châu Âu.

## Cách chơi

- **Cách nhanh nhất:** mở file `index.html` bằng trình duyệt (Chrome, Edge, Firefox, Safari).
- Hoặc chạy một web server tĩnh rồi vào `http://localhost:8000`:

```bash
python3 -m http.server 8000
```

Game tự lưu vào bộ nhớ trình duyệt (3 khe lưu) sau mỗi ngày thi đấu.

## Tính năng

| Mảng | Chi tiết |
| --- | --- |
| **Dữ liệu thật** | 32 CLB: 20 đội Ngoại hạng Anh + 12 CLB lớn châu Âu (Real Madrid, Barcelona, Bayern, PSG, Inter, …) với ~670 cầu thủ thật, vị trí, tuổi, quốc tịch, chỉ số & tiềm năng |
| **Trận đấu trực tiếp** | Mô phỏng từng phút, bình luận tiếng Việt, xG, kiểm soát bóng, thẻ phạt, chấn thương, VAR/phạt đền, hiệp phụ & luân lưu; 4 tốc độ xem, tạm dừng, thay người (5 lượt), đổi chỉ đạo giữa trận, nói chuyện giờ nghỉ |
| **Chiến thuật** | 8 sơ đồ (4-3-3, 4-2-3-1, 4-4-2, 3-5-2, …), bấm để hoán đổi cầu thủ trên sân, tâm lý / pressing / nhịp độ, cảnh báo sai vị trí, tự chọn & xoay tua theo thể lực |
| **Giải đấu** | Ngoại hạng Anh 38 vòng (có các đợt nghỉ FIFA, vòng giữa tuần), Cúp Quốc gia loại trực tiếp, Cúp C1 (vòng bảng + knock-out); top 4 giành vé C1 mùa sau |
| **Chuyển nhượng** | 2 kỳ chuyển nhượng (hè & đông), tìm kiếm có bộ lọc, theo dõi, đàm phán phí với CLB (chấp nhận / trả giá / từ chối, cầu thủ “không bán”), đàm phán lương & thời hạn hợp đồng, cầu thủ từ chối CLB kém danh tiếng, cầu thủ tự do, rao bán, nhận đề nghị từ AI, AI mua bán lẫn nhau |
| **Hợp đồng** | Gia hạn, giải phóng (đền bù 50% lương còn lại), hết hạn ra đi tự do cuối mùa, quỹ lương |
| **Tập luyện & phát triển** | 6 trọng tâm, 3 cường độ (đánh đổi tiến bộ ↔ chấn thương), cầu thủ trẻ tiến bộ theo tiềm năng & thời gian ra sân, cầu thủ già sa sút, giải nghệ |
| **Học viện** | Lứa trẻ mới mỗi tháng 3, có thể xuất hiện “thần đồng”; ký HĐ chuyên nghiệp hoặc loại |
| **Thể lực & tinh thần** | Thể lực giảm sau trận, hồi phục theo ngày; tinh thần ảnh hưởng phong độ; cầu thủ ngồi dự bị lâu sẽ không vui |
| **Tài chính** | Doanh thu vé (tự đặt giá vé), bản quyền TV, tài trợ, tiền thưởng; chi lương, nhân sự; nâng cấp cơ sở tập luyện, học viện, mở rộng sân |
| **Ban lãnh đạo** | Mục tiêu theo sức mạnh đội, độ tín nhiệm thay đổi theo kết quả, cảnh báo, **bị sa thải** và nhận lời mời từ CLB khác |
| **Sự nghiệp** | Nhiều mùa giải liên tiếp, danh hiệu, lịch sử từng mùa, giải thưởng cá nhân (Vua phá lưới, Cầu thủ hay nhất, Cầu thủ trẻ hay nhất) |
| **Giao diện** | Tiếng Việt, chế độ sáng/tối, chạy tốt trên điện thoại |

## Logo câu lạc bộ

Logo chính thức của các CLB là nhãn hiệu đã đăng ký, nên repo **không kèm theo** logo thật. Mặc định game tự vẽ
huy hiệu theo màu áo của từng CLB.

Muốn dùng logo thật trên máy của bạn: lưu file logo (PNG trong suốt hoặc SVG) vào thư mục `logos/` với tên
`<mã-clb>.png` hoặc `<mã-clb>.svg`. Game sẽ tự phát hiện khi tải trang. Ví dụ: `logos/ars.png`, `logos/rma.svg`.

| Mã | CLB | Giải | Số cầu thủ |
| --- | --- | --- | --- |
| `ars` | Arsenal | Ngoại hạng Anh | 24 |
| `liv` | Liverpool | Ngoại hạng Anh | 22 |
| `mci` | Manchester City | Ngoại hạng Anh | 22 |
| `che` | Chelsea | Ngoại hạng Anh | 22 |
| `mun` | Manchester United | Ngoại hạng Anh | 21 |
| `tot` | Tottenham Hotspur | Ngoại hạng Anh | 24 |
| `new` | Newcastle United | Ngoại hạng Anh | 21 |
| `avl` | Aston Villa | Ngoại hạng Anh | 20 |
| `bha` | Brighton & Hove Albion | Ngoại hạng Anh | 20 |
| `bou` | AFC Bournemouth | Ngoại hạng Anh | 20 |
| `bre` | Brentford | Ngoại hạng Anh | 19 |
| `bur` | Burnley | Ngoại hạng Anh | 21 |
| `cry` | Crystal Palace | Ngoại hạng Anh | 19 |
| `eve` | Everton | Ngoại hạng Anh | 21 |
| `ful` | Fulham | Ngoại hạng Anh | 22 |
| `lee` | Leeds United | Ngoại hạng Anh | 22 |
| `nfo` | Nottingham Forest | Ngoại hạng Anh | 22 |
| `sun` | Sunderland | Ngoại hạng Anh | 22 |
| `whu` | West Ham United | Ngoại hạng Anh | 20 |
| `wol` | Wolverhampton Wanderers | Ngoại hạng Anh | 20 |
| `rma` | Real Madrid | Châu Âu | 23 |
| `fcb` | FC Barcelona | Châu Âu | 22 |
| `atm` | Atlético de Madrid | Châu Âu | 22 |
| `fcbay` | Bayern München | Châu Âu | 20 |
| `bvb` | Borussia Dortmund | Châu Âu | 20 |
| `b04` | Bayer 04 Leverkusen | Châu Âu | 18 |
| `psg` | Paris Saint-Germain | Châu Âu | 20 |
| `int` | Inter | Châu Âu | 20 |
| `acm` | AC Milan | Châu Âu | 19 |
| `juv` | Juventus | Châu Âu | 19 |
| `nap` | Napoli | Châu Âu | 20 |
| `scp` | Sporting CP | Châu Âu | 19 |

## Dữ liệu cầu thủ

- Đội hình dựa trên dữ liệu mùa **2025/26** (có thể chưa phản ánh các vụ chuyển nhượng mới nhất). Sự nghiệp bắt đầu từ mùa **2026/27** và tuổi cầu thủ đã được cộng thêm 1.
- Chỉ số (OVR) và tiềm năng là **ước lượng của trò chơi**, không phải số liệu chính thức của bất kỳ nhà phát hành nào.
- Bạn có thể sửa / thêm cầu thủ trong `js/data/clubs-eng.js` và `js/data/clubs-eur.js`. Mỗi cầu thủ có dạng:
  `["Tên", "Vị trí", tuổi năm 2025, OVR, "Mã quốc tịch", tiềm năng (tuỳ chọn)]`.

## Cấu trúc mã nguồn

```
index.html            Trang chính
css/style.css         Giao diện (sáng/tối, responsive)
js/data/              Dữ liệu CLB, cầu thủ, quốc tịch
js/core/util.js       Tiện ích (ngẫu nhiên, ngày tháng, tiền tệ)
js/core/players.js    Vị trí, chỉ số, giá trị, lương, sơ đồ, tự chọn đội hình
js/core/match.js      Engine mô phỏng trận đấu theo phút
js/core/competitions.js  Lịch thi đấu, bảng xếp hạng, bốc thăm cúp
js/core/transfers.js  Định giá, đàm phán, AI chuyển nhượng
js/core/game.js       Trạng thái sự nghiệp, tiến trình ngày/tuần/mùa, tài chính, ban lãnh đạo, lưu/tải
js/ui/                Các màn hình giao diện
logos/                (Tuỳ chọn) logo thật do bạn tự thêm
```

## Lưu ý

Đây là dự án phi thương mại của người hâm mộ, không liên kết hay được bảo trợ bởi EA, Sports Interactive, SEGA,
FIFA, UEFA, Premier League hay bất kỳ CLB nào. Tên CLB và cầu thủ chỉ được dùng để mô tả.
