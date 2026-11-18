(function () {
  "use strict";
  var kok = document.documentElement;
  kok.classList.add("js");

  // Tema geçişi
  var btn = document.querySelector(".tema-btn");
  function etiketle() {
    var koyu = kok.dataset.tema === "koyu";
    btn.setAttribute("aria-label", koyu ? "Aydınlık temaya geç" : "Karanlık temaya geç");
    btn.setAttribute("aria-pressed", String(koyu));
  }
  btn.addEventListener("click", function () {
    kok.dataset.tema = kok.dataset.tema === "koyu" ? "acik" : "koyu";
    localStorage.setItem("tema", kok.dataset.tema);
    etiketle();
  });
  etiketle();

  // Proje filtresi
  var kartlar = Array.prototype.slice.call(document.querySelectorAll(".kart"));
  var dugmeler = document.querySelectorAll(".filtre button");
  dugmeler.forEach(function (d) {
    d.addEventListener("click", function () {
      var f = d.dataset.filtre;
      dugmeler.forEach(function (x) {
        var aktif = x === d;
        x.classList.toggle("aktif", aktif);
        x.setAttribute("aria-pressed", String(aktif));
      });
      kartlar.forEach(function (k) {
        k.hidden = f !== "hepsi" && k.dataset.kat.split(" ").indexOf(f) === -1;
      });
    });
  });

  // Görünme animasyonu (hareket azaltma tercihine saygı)
  var hedefler = document.querySelectorAll(".bolum h2, .bolum .etiket, .metin, .kart");
  var azalt = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (azalt || !("IntersectionObserver" in window)) return;
  hedefler.forEach(function (el) { el.classList.add("gorun"); });
  kartlar.forEach(function (k, i) { k.style.setProperty("--gecikme", (i % 3) * 70 + "ms"); });
  var gozlemci = new IntersectionObserver(function (girdiler) {
    girdiler.forEach(function (g) {
      if (g.isIntersecting) { g.target.classList.add("gorundu"); gozlemci.unobserve(g.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  hedefler.forEach(function (el) { gozlemci.observe(el); });

  var yil = document.getElementById("yil");
  if (yil) yil.textContent = new Date().getFullYear();
})();
