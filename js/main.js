/* Khởi động trò chơi */
(function () {
  const FC = window.FC;
  try {
    const th = localStorage.getItem("pitchboss27_theme");
    if (th && th !== "auto") document.documentElement.dataset.theme = th;
  } catch (e) { /* bỏ qua */ }
  FC.App.render();
  // Tự động dò logo thật trong thư mục logos/
  const clubs = FC.WORLD.clubs;
  FC.probeLogos(clubs, (found) => {
    if (found) FC.App.render();
  });
  // Lưu trước khi đóng trang
  window.addEventListener("beforeunload", () => {
    if (FC.Game.s && !document.querySelector(".match-screen")) FC.Game.save(FC.App.slot);
  });
})();
