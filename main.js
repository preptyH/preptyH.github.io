(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- 1. Imlece tepki veren dev isim (Archivo'nun genişlik ve kalınlık eksenleri) ---------- */
  var isim = document.querySelector(".isim");
  if (isim) {
    var metin = isim.textContent;
    isim.textContent = "";
    var harfler = metin.split("").map(function (h) {
      var s = document.createElement("span");
      s.textContent = h;
      isim.appendChild(s);
      return s;
    });
    if (!reduce && hasGsap) {
      gsap.from(harfler, { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.07, delay: 0.1 });
    }
    if (!reduce) {
      var hedef = harfler.map(function () { return 0; });
      var simdi = harfler.map(function () { return 0; });
      var calisiyor = false;
      var yaricap = 260;
      var giris = document.querySelector(".giris");
      function uygula() {
        var devam = false;
        harfler.forEach(function (h, i) {
          simdi[i] += (hedef[i] - simdi[i]) * 0.14;
          if (Math.abs(hedef[i] - simdi[i]) > 0.002) devam = true; else simdi[i] = hedef[i];
          h.style.fontStretch = (70 + 55 * simdi[i]).toFixed(1) + "%";
          h.style.fontWeight = Math.round(700 + 100 * simdi[i]);
        });
        if (devam) requestAnimationFrame(uygula); else calisiyor = false;
      }
      function basla() { if (!calisiyor) { calisiyor = true; requestAnimationFrame(uygula); } }
      giris.addEventListener("pointermove", function (e) {
        harfler.forEach(function (h, i) {
          var r = h.getBoundingClientRect();
          var d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          hedef[i] = Math.max(0, 1 - d / yaricap);
        });
        basla();
      });
      giris.addEventListener("pointerleave", function () {
        hedef = hedef.map(function () { return 0; });
        basla();
      });
    }
  }

  /* ---------- 2. Kaydırdıkça netleşen vakalar ---------- */
  if (hasGsap && window.ScrollTrigger && !reduce) {
    var mm = gsap.matchMedia();
    mm.add("(min-width: 880px)", function () { netles(10); });
    mm.add("(max-width: 879px)", function () { netles(0); });
  }
  function netles(blur) {
    document.querySelectorAll(".vaka").forEach(function (v) {
      var hedefler = [v.querySelector(".vaka-baslik"), v.querySelector(".vaka-icerik")];
      // Metin saydamlaşmaz (kontrast hep AA); yalnızca kayma ve bulanıklık
      gsap.fromTo(hedefler,
        { y: 48, filter: "blur(" + blur + "px)" },
        { y: 0, filter: "blur(0px)", ease: "none",
          scrollTrigger: { trigger: v, start: "top 90%", end: "top 45%", scrub: 0.6 } });
      // Görseller soluktan netleşir (metin içermez)
      v.querySelectorAll(".gorsel a").forEach(function (a) {
        gsap.fromTo(a, { opacity: 0.2 }, { opacity: 1, ease: "none",
          scrollTrigger: { trigger: a, start: "top 95%", end: "top 60%", scrub: 0.6 } });
      });
    });
  }

  /* ---------- 3. Ajan sisteminin canlı akış diyagramı ---------- */
  var sema = document.getElementById("ajan-sema");
  if (sema && hasGsap) {
    var nokta = document.getElementById("nokta");
    var dugumler = {};
    sema.querySelectorAll(".dugum").forEach(function (g) { dugumler[g.dataset.id] = g; });
    var gonder = document.getElementById("gonder");
    var limit = document.getElementById("limit");
    var gunluk = document.getElementById("gunluk");
    var yer = { telegram: [24, 121], orkestrator: [184, 121], claude: [364, 56], gemini: [364, 191], mcp: [559, 56] };

    function isaretle(id) {
      Object.keys(dugumler).forEach(function (k) {
        var acik = k === id;
        dugumler[k].classList.toggle("aktif", acik);
      });
    }
    function satir(metin) {
      var li = document.createElement("li");
      li.textContent = metin;
      gunluk.appendChild(li);
    }
    function git(id) {
      var d = reduce ? 0 : 0.7;
      return gsap.to(nokta, { attr: { cx: yer[id][0], cy: yer[id][1] }, duration: d, ease: "power2.inOut" });
    }
    function bekle(sn) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : sn * 1000); }); }

    var calisiyorAkis = false;
    gonder.addEventListener("click", async function () {
      if (calisiyorAkis) return;
      calisiyorAkis = true; gonder.disabled = true; gunluk.textContent = "";
      var yedek = limit.checked;
      gsap.set(nokta, { attr: { cx: yer.telegram[0], cy: yer.telegram[1] }, opacity: 1 });
      isaretle("telegram"); satir("Telegram: “ekran görüntüsü at”"); await bekle(0.7);
      await git("orkestrator"); isaretle("orkestrator");
      satir(yedek ? "Orkestratör: Claude'un limiti dolu, Gemini yedek beyne geçiliyor" : "Orkestratör: kısa istek, basit sınıf, ucuz model seçildi");
      await bekle(0.7);
      if (yedek) {
        await git("gemini"); isaretle("gemini");
        satir("Gemini: yedek beyin, kendi araç listesinden take_screenshot_for_user çağırıyor");
        await bekle(0.8);
      } else {
        await git("claude"); isaretle("claude");
        satir("Claude Code: isteği MCP aracına çeviriyor"); await bekle(0.7);
        await git("mcp"); isaretle("mcp");
        satir("MCP: take_screenshot çalıştı"); await bekle(0.8);
      }
      gsap.to(nokta, { opacity: 0, duration: reduce ? 0 : 0.3 });
      isaretle("telegram"); satir("Telegram: ekran görüntüsü kullanıcıya gönderildi");
      calisiyorAkis = false; gonder.disabled = false;
    });
  }

  /* ---------- 4. Tarayıcıda çalışan fatura denetimi (panelin basitleştirilmiş kuralları) ---------- */
  var govde = document.getElementById("fatura-govde");
  if (govde) {
    var GECERLI = [0, 1, 10, 20], TOL = 0.05;
    var ornek = [
      ["SHT-1001", "Örnek Lojistik A.Ş.", 10000, 20, 2000, 12000],
      ["SHT-1002", "Örnek Gıda A.Ş.", 5000, 20, 1100, 6100],
      ["SHT-1003", "Örnek Tekstil A.Ş.", 2500, 18, 450, 2950],
      ["SHT-1001", "Örnek Lojistik A.Ş.", 10000, 20, 2000, 12000]
    ];
    var sonuc = document.getElementById("fatura-sonuc");
    var alanlar = ["no", "firma", "matrah", "oran", "kdv", "toplam"];
    var etiket = ["Fatura no", "Firma", "Matrah", "KDV oranı", "KDV tutarı", "Toplam"];
    function para(n) { return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function kur() {
      govde.textContent = "";
      ornek.forEach(function (r, i) {
        var tr = document.createElement("tr");
        r.forEach(function (v, j) {
          var td = document.createElement("td");
          var inp = document.createElement("input");
          inp.type = j < 2 ? "text" : "number";
          if (j >= 2) { inp.step = "any"; inp.inputMode = "decimal"; }
          inp.value = v;
          inp.setAttribute("aria-label", etiket[j] + ", satır " + (i + 1));
          inp.dataset.s = alanlar[j];
          inp.addEventListener("input", denetle);
          td.appendChild(inp); tr.appendChild(td);
        });
        govde.appendChild(tr);
      });
      denetle();
    }
    function denetle() {
      var satirlar = Array.prototype.map.call(govde.rows, function (tr) {
        var o = {};
        Array.prototype.forEach.call(tr.querySelectorAll("input"), function (i) {
          o[i.dataset.s] = i.type === "number" ? parseFloat(i.value) : i.value.trim();
        });
        return o;
      });
      sonuc.textContent = "";
      var toplamBulgu = 0;
      satirlar.forEach(function (r, i) {
        var b = [];
        var gecerliSayi = ["matrah", "oran", "kdv", "toplam"].every(function (k) { return isFinite(r[k]); });
        if (!gecerliSayi) { b.push("Sayı eksik ya da geçersiz"); }
        else {
          if (GECERLI.indexOf(r.oran) === -1) b.push("Geçersiz KDV oranı: %" + r.oran);
          var beklenen = Math.round(r.matrah * r.oran) / 100;
          if (Math.abs(beklenen - r.kdv) > TOL) b.push("KDV hesabı: girilen " + para(r.kdv) + ", beklenen " + para(beklenen));
          var t = Math.round((r.matrah + r.kdv) * 100) / 100;
          if (Math.abs(t - r.toplam) > TOL) b.push("Genel toplam: girilen " + para(r.toplam) + ", matrah + KDV " + para(t));
        }
        var ayni = satirlar.filter(function (x) { return x.no === r.no && x.firma === r.firma; }).length;
        if (r.no && ayni > 1) b.push("Mükerrer: aynı firmada aynı fatura no birden fazla");
        govde.rows[i].classList.toggle("hata", b.length > 0);
        if (b.length) {
          toplamBulgu += b.length;
          var li = document.createElement("li");
          var s = document.createElement("strong");
          s.textContent = "Satır " + (i + 1) + " (" + (r.no || "numarasız") + "): ";
          li.appendChild(s);
          li.appendChild(document.createTextNode(b.join("; ")));
          sonuc.appendChild(li);
        }
      });
      if (!toplamBulgu) { var l = document.createElement("li"); l.textContent = "Bulgu yok."; sonuc.appendChild(l); }
    }
    document.getElementById("fatura-sifirla").addEventListener("click", kur);
    kur();
  }
})();
