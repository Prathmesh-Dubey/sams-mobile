/* SAMS cookie consent + Google Consent Mode v2 + conversion tracking.
   Consent is stored in the first-party cookie "sams_consent" (necessary category, 12 months). */
(function () {
  var CFG = window.SAMS_TRACKING || {};
  var COOKIE = "sams_consent", VERSION = 1, MAX_AGE = 365 * 24 * 3600;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  /* Consent Mode v2: everything except strictly necessary storage is denied until the visitor chooses. */
  gtag("consent", "default", {
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    analytics_storage: "denied", functionality_storage: "denied", personalization_storage: "denied",
    security_storage: "granted", wait_for_update: 500
  });
  gtag("set", "ads_data_redaction", true);
  gtag("set", "url_passthrough", true);

  function readChoice() {
    var m = document.cookie.match(/(?:^|; )sams_consent=([^;]*)/);
    if (!m) return null;
    try { var c = JSON.parse(decodeURIComponent(m[1])); return c && c.v === VERSION ? c : null; } catch (e) { return null; }
  }
  function writeChoice(c) {
    c.v = VERSION; c.ts = new Date().toISOString();
    document.cookie = COOKIE + "=" + encodeURIComponent(JSON.stringify(c)) + "; Max-Age=" + MAX_AGE + "; Path=/; SameSite=Lax; Secure";
  }
  function applyChoice(c) {
    gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: c.advertisement ? "granted" : "denied",
      ad_user_data: c.advertisement ? "granted" : "denied",
      ad_personalization: c.advertisement ? "granted" : "denied",
      functionality_storage: c.functional ? "granted" : "denied",
      personalization_storage: c.functional ? "granted" : "denied"
    });
    window.dataLayer.push({ event: "sams_consent_update", consent: { analytics: !!c.analytics, advertisement: !!c.advertisement, functional: !!c.functional } });
  }

  /* With advertising consent, keep the ad click ID / campaign tags for the enquiry email (this tab only). */
  function captureAttribution() {
    try {
      var q = new URLSearchParams(location.search), utm = [];
      var click = q.get("gclid") || q.get("gbraid") || q.get("wbraid");
      if (click) sessionStorage.setItem("sams_gclid", click);
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(function (k) {
        if (q.get(k)) utm.push(k.replace("utm_", "") + "=" + q.get(k));
      });
      if (utm.length) sessionStorage.setItem("sams_utm", utm.join("; "));
    } catch (e) {}
  }

  /* Our own visit log (SAMS Desk > SAMS Visitors), only with Analytics consent. One report per page
     view plus engagement (seconds visible, scroll depth) when the page is hidden or left.
     Nothing is stored in the browser; the server identifies the visitor from IP + browser. */
  var visitHit = null;
  function visitPost(data, leaving) {
    var body = JSON.stringify(data);
    try {
      if (leaving && navigator.sendBeacon) { navigator.sendBeacon(CFG.visitLog, new Blob([body], { type: "text/plain" })); return; }
      fetch(CFG.visitLog, { method: "POST", mode: "cors", credentials: "omit", keepalive: true,
        headers: { "Content-Type": "text/plain" }, body: body }).catch(function () {});
    } catch (e) {}
  }
  function visitStart() {
    if (!CFG.visitLog || visitHit || !window.fetch || !window.JSON) return;
    var r = "";
    try { var a = new Uint8Array(16); crypto.getRandomValues(a); for (var i = 0; i < a.length; i++) r += ("0" + a[i].toString(16)).slice(-2); }
    catch (e) { r = (Date.now().toString(16) + Math.random().toString(16).slice(2)).slice(0, 32); }
    visitHit = r;
    visitPost({ hit_id: r, page_url: location.href, page_path: location.pathname, page_title: document.title,
      referrer: document.referrer, language: navigator.language || "", screen: screen.width + "x" + screen.height, consent: 1, source: "website" });

    var shownFrom = document.hidden ? 0 : Date.now(), shown = 0, depth = 0;
    function measureDepth() {
      var h = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0) - window.innerHeight;
      var d = h > 0 ? Math.round(Math.min(1, (window.pageYOffset || 0) / h) * 100) : 100;
      if (d > depth) depth = d;
    }
    function report() {
      if (shownFrom) { shown += Date.now() - shownFrom; shownFrom = 0; }
      if (!choice || !choice.analytics) return;   /* consent withdrawn on this page */
      measureDepth();
      visitPost({ event: "leave", hit_id: r, engaged_seconds: Math.round(shown / 1000), scroll_depth: depth }, true);
    }
    window.addEventListener("scroll", measureDepth, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) report(); else shownFrom = Date.now();
    });
    window.addEventListener("pagehide", report);
  }

  var choice = readChoice();
  if (choice) applyChoice(choice);
  if (choice && choice.advertisement) captureAttribution();
  if (choice && choice.analytics) visitStart();

  /* Load Google tags only when an ID is configured. */
  var firstId = CFG.ga4 || CFG.ads;
  if (firstId) {
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(firstId);
    document.head.appendChild(s);
    gtag("js", new Date());
    if (CFG.ga4) gtag("config", CFG.ga4);
    if (CFG.ads) gtag("config", CFG.ads);
  }
  if (CFG.gtm) {
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var g = document.createElement("script");
    g.async = true; g.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(CFG.gtm);
    document.head.appendChild(g);
  }

  /* Conversions. Each lead carries a transaction_id so Google Ads counts it once. */
  window.samsTrack = {
    conversion: function (kind, id) {
      var label = CFG.adsLabels && CFG.adsLabels[kind];
      var value = (CFG.adsValues && CFG.adsValues[kind]) || 0;
      window.dataLayer.push({ event: "sams_" + kind, sams_lead_id: id || "" });
      if (kind === "form" && CFG.ga4) gtag("event", "generate_lead", { value: value, currency: CFG.adsValues.currency, lead_id: id || "" });
      if (CFG.ads && label) {
        var p = { send_to: CFG.ads + "/" + label, value: value, currency: CFG.adsValues.currency };
        if (id) p.transaction_id = id;
        gtag("event", "conversion", p);
      }
    }
  };

  /* ---------- banner UI ---------- */
  var T = {
    title: "We value your privacy",
    text: "We use necessary cookies to run this site and, with your consent, cookies that measure visits and the performance of our advertising. You can accept all, reject non-essential cookies, or choose by category.",
    policy: "Cookie Policy", customise: "Customise", reject: "Reject all", accept: "Accept all", save: "Save my preferences",
    prefsTitle: "Cookie preferences",
    cats: [
      ["necessary", "Necessary", "Required for the site to work, including remembering this choice. Always on."],
      ["functional", "Functional", "Remember preferences and enable features such as embedded content."],
      ["analytics", "Analytics", "Google Analytics and our own visit log: which pages are visited and how the site is used, so we can improve it."],
      ["advertisement", "Advertising", "Google Ads: measure which adverts lead to enquiries. Not used to sell your data."]
    ]
  };

  /* ---------- translations (banner + preferences dialog); English is the default above ---------- */
  var samsCkLang = (document.documentElement.getAttribute("lang") || "en").slice(0, 2);
  var TR = {
    ar: { title: "نحن نقدّر خصوصيتك", text: "نستخدم ملفات تعريف الارتباط الضرورية لتشغيل هذا الموقع، وبموافقتك نستخدم ملفات لقياس الزيارات وأداء إعلاناتنا. يمكنك قبول الكل أو رفض الملفات غير الضرورية أو الاختيار حسب الفئة.",
      policy: "سياسة ملفات تعريف الارتباط", customise: "تخصيص", reject: "رفض الكل", accept: "قبول الكل", save: "حفظ تفضيلاتي", prefsTitle: "تفضيلات ملفات تعريف الارتباط",
      aria: "موافقة ملفات تعريف الارتباط", ariaPrefs: "تفضيلات ملفات تعريف الارتباط", close: "إغلاق",
      cats: [["necessary", "ضرورية", "مطلوبة لعمل الموقع، بما في ذلك تذكّر هذا الاختيار. مفعّلة دائمًا."], ["functional", "وظيفية", "تتذكّر التفضيلات وتتيح ميزات مثل المحتوى المضمّن."], ["analytics", "التحليلات", "Google Analytics وسجل الزيارات الخاص بنا: الصفحات التي تتم زيارتها وكيفية استخدام الموقع، لنتمكن من تحسينه."], ["advertisement", "الإعلانات", "Google Ads: قياس الإعلانات التي تؤدي إلى استفسارات. لا تُستخدم لبيع بياناتك."]] },
    de: { title: "Wir respektieren Ihre Privatsphäre", text: "Wir verwenden notwendige Cookies für den Betrieb dieser Website und – mit Ihrer Einwilligung – Cookies, die Besuche und die Leistung unserer Werbung messen. Sie können alle akzeptieren, nicht notwendige Cookies ablehnen oder nach Kategorie wählen.",
      policy: "Cookie-Richtlinie", customise: "Anpassen", reject: "Alle ablehnen", accept: "Alle akzeptieren", save: "Meine Auswahl speichern", prefsTitle: "Cookie-Einstellungen",
      aria: "Cookie-Einwilligung", ariaPrefs: "Cookie-Einstellungen", close: "Schließen",
      cats: [["necessary", "Notwendig", "Erforderlich für den Betrieb der Website, einschließlich der Speicherung dieser Auswahl. Immer aktiv."], ["functional", "Funktional", "Speichern Einstellungen und ermöglichen Funktionen wie eingebettete Inhalte."], ["analytics", "Analyse", "Google Analytics und unser eigenes Besuchsprotokoll: welche Seiten besucht werden und wie die Website genutzt wird, damit wir sie verbessern können."], ["advertisement", "Werbung", "Google Ads: Messung, welche Anzeigen zu Anfragen führen. Wird nicht zum Verkauf Ihrer Daten verwendet."]] },
    fr: { title: "Nous respectons votre vie privée", text: "Nous utilisons des cookies nécessaires au fonctionnement de ce site et, avec votre consentement, des cookies qui mesurent les visites et la performance de notre publicité. Vous pouvez tout accepter, refuser les cookies non essentiels ou choisir par catégorie.",
      policy: "Politique relative aux cookies", customise: "Personnaliser", reject: "Tout refuser", accept: "Tout accepter", save: "Enregistrer mes préférences", prefsTitle: "Préférences en matière de cookies",
      aria: "Consentement aux cookies", ariaPrefs: "Préférences en matière de cookies", close: "Fermer",
      cats: [["necessary", "Nécessaires", "Indispensables au fonctionnement du site, y compris pour mémoriser ce choix. Toujours actifs."], ["functional", "Fonctionnels", "Mémorisent vos préférences et activent des fonctions telles que les contenus intégrés."], ["analytics", "Analytiques", "Google Analytics et notre propre journal des visites : pages consultées et usage du site, afin de l'améliorer."], ["advertisement", "Publicité", "Google Ads : mesure des annonces qui mènent à des demandes. Non utilisés pour vendre vos données."]] },
    es: { title: "Valoramos su privacidad", text: "Utilizamos cookies necesarias para el funcionamiento de este sitio y, con su consentimiento, cookies que miden las visitas y el rendimiento de nuestra publicidad. Puede aceptarlas todas, rechazar las no esenciales o elegir por categoría.",
      policy: "Política de cookies", customise: "Personalizar", reject: "Rechazar todas", accept: "Aceptar todas", save: "Guardar mis preferencias", prefsTitle: "Preferencias de cookies",
      aria: "Consentimiento de cookies", ariaPrefs: "Preferencias de cookies", close: "Cerrar",
      cats: [["necessary", "Necesarias", "Imprescindibles para que el sitio funcione, incluido recordar esta elección. Siempre activas."], ["functional", "Funcionales", "Recuerdan sus preferencias y habilitan funciones como el contenido incrustado."], ["analytics", "Analíticas", "Google Analytics y nuestro propio registro de visitas: qué páginas se visitan y cómo se usa el sitio, para poder mejorarlo."], ["advertisement", "Publicidad", "Google Ads: medir qué anuncios generan consultas. No se utilizan para vender sus datos."]] },
    pt: { title: "Valorizamos a sua privacidade", text: "Usamos cookies necessários para o funcionamento deste site e, com o seu consentimento, cookies que medem as visitas e o desempenho da nossa publicidade. Você pode aceitar todos, recusar os não essenciais ou escolher por categoria.",
      policy: "Política de cookies", customise: "Personalizar", reject: "Recusar todos", accept: "Aceitar todos", save: "Salvar minhas preferências", prefsTitle: "Preferências de cookies",
      aria: "Consentimento de cookies", ariaPrefs: "Preferências de cookies", close: "Fechar",
      cats: [["necessary", "Necessários", "Obrigatórios para o funcionamento do site, incluindo lembrar esta escolha. Sempre ativos."], ["functional", "Funcionais", "Lembram preferências e habilitam recursos como conteúdo incorporado."], ["analytics", "Análise", "Google Analytics e o nosso próprio registro de visitas: quais páginas são visitadas e como o site é usado, para podermos melhorá-lo."], ["advertisement", "Publicidade", "Google Ads: medir quais anúncios geram consultas. Não são usados para vender seus dados."]] },
    ru: { title: "Мы ценим вашу конфиденциальность", text: "Мы используем необходимые файлы cookie для работы сайта и, с вашего согласия, файлы cookie для измерения посещений и эффективности нашей рекламы. Вы можете принять все, отклонить необязательные или выбрать по категориям.",
      policy: "Политика в отношении файлов cookie", customise: "Настроить", reject: "Отклонить все", accept: "Принять все", save: "Сохранить мои настройки", prefsTitle: "Настройки файлов cookie",
      aria: "Согласие на использование cookie", ariaPrefs: "Настройки файлов cookie", close: "Закрыть",
      cats: [["necessary", "Необходимые", "Нужны для работы сайта, в том числе для запоминания этого выбора. Всегда включены."], ["functional", "Функциональные", "Запоминают настройки и включают такие функции, как встроенный контент."], ["analytics", "Аналитические", "Google Analytics и наш собственный журнал посещений: какие страницы посещают и как используется сайт, чтобы мы могли его улучшать."], ["advertisement", "Рекламные", "Google Ads: измерение того, какие объявления приводят к запросам. Не используются для продажи ваших данных."]] },
    th: { title: "เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ", text: "เราใช้คุกกี้ที่จำเป็นเพื่อให้เว็บไซต์ทำงานได้ และเมื่อได้รับความยินยอมจากคุณ เราจะใช้คุกกี้ที่วัดจำนวนผู้เข้าชมและประสิทธิภาพของโฆษณา คุณสามารถยอมรับทั้งหมด ปฏิเสธคุกกี้ที่ไม่จำเป็น หรือเลือกตามหมวดหมู่ได้",
      policy: "นโยบายคุกกี้", customise: "ปรับแต่ง", reject: "ปฏิเสธทั้งหมด", accept: "ยอมรับทั้งหมด", save: "บันทึกการตั้งค่าของฉัน", prefsTitle: "การตั้งค่าคุกกี้",
      aria: "ความยินยอมเกี่ยวกับคุกกี้", ariaPrefs: "การตั้งค่าคุกกี้", close: "ปิด",
      cats: [["necessary", "จำเป็น", "จำเป็นต่อการทำงานของเว็บไซต์ รวมถึงการจดจำตัวเลือกนี้ เปิดใช้งานเสมอ"], ["functional", "การทำงาน", "จดจำการตั้งค่าและเปิดใช้ฟีเจอร์ เช่น เนื้อหาที่ฝังไว้"], ["analytics", "การวิเคราะห์", "Google Analytics และบันทึกการเข้าชมของเราเอง: หน้าที่ถูกเข้าชมและวิธีการใช้งานเว็บไซต์ เพื่อให้เราปรับปรุงได้"], ["advertisement", "โฆษณา", "Google Ads: วัดว่าโฆษณาใดนำไปสู่การสอบถาม ไม่ได้ใช้เพื่อขายข้อมูลของคุณ"]] }
  };
  T.aria = "Cookie consent"; T.ariaPrefs = "Cookie preferences"; T.close = "Close";
  if (TR[samsCkLang]) T = TR[samsCkLang];
  var samsCkPrefix = TR[samsCkLang] ? "/" + samsCkLang : "";
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function closeAll() {
    var b = document.getElementById("samsCkBanner"); if (b) b.remove();
    var m = document.getElementById("samsCkModal"); if (m) m.remove();
    showRevisit();
  }
  function decide(c) { writeChoice(c); applyChoice(c); choice = c; if (c.advertisement) captureAttribution(); if (c.analytics) visitStart(); closeAll(); }
  function showRevisit() {
    if (document.getElementById("samsCkRevisit")) return;
    var r = el("button", { id: "samsCkRevisit", type: "button", "aria-label": T.ariaPrefs, title: T.ariaPrefs },
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8.5" cy="11" r="1.2" fill="currentColor"/><circle cx="12" cy="16" r="1.2" fill="currentColor"/><circle cx="15.5" cy="13" r="1" fill="currentColor"/></svg>');
    r.addEventListener("click", openPrefs);
    document.body.appendChild(r);
  }
  function showBanner() {
    var b = el("div", { id: "samsCkBanner", role: "region", "aria-label": T.aria });
    b.innerHTML = '<div class="sams-ck__inner"><div class="sams-ck__text"><strong>' + T.title + '</strong><p>' + T.text +
      ' <a href="' + samsCkPrefix + '/cookie-policy/">' + T.policy + '</a></p></div><div class="sams-ck__btns">' +
      '<button type="button" class="sams-ck__btn sams-ck__btn--ghost" data-ck="prefs">' + T.customise + '</button>' +
      '<button type="button" class="sams-ck__btn sams-ck__btn--ghost" data-ck="reject">' + T.reject + '</button>' +
      '<button type="button" class="sams-ck__btn sams-ck__btn--primary" data-ck="accept">' + T.accept + '</button></div></div>';
    b.addEventListener("click", function (e) {
      var a = e.target.closest("[data-ck]"); if (!a) return;
      var k = a.getAttribute("data-ck");
      if (k === "accept") decide({ functional: true, analytics: true, advertisement: true });
      if (k === "reject") decide({ functional: false, analytics: false, advertisement: false });
      if (k === "prefs") openPrefs();
    });
    document.body.appendChild(b);
  }
  function openPrefs() {
    if (document.getElementById("samsCkModal")) return;
    var cur = choice || { functional: false, analytics: false, advertisement: false };
    var rows = T.cats.map(function (c) {
      var nec = c[0] === "necessary";
      return '<label class="sams-ck__cat"><span><strong>' + c[1] + '</strong><small>' + c[2] + '</small></span>' +
        '<input type="checkbox" name="' + c[0] + '"' + (nec || cur[c[0]] ? " checked" : "") + (nec ? " disabled" : "") + '><i aria-hidden="true"></i></label>';
    }).join("");
    var m = el("div", { id: "samsCkModal", role: "dialog", "aria-modal": "true", "aria-labelledby": "samsCkTitle" });
    m.innerHTML = '<div class="sams-ck__backdrop" data-ck="close"></div><div class="sams-ck__panel"><h2 id="samsCkTitle">' + T.prefsTitle +
      '</h2><button type="button" class="sams-ck__x" data-ck="close" aria-label="' + T.close + '">&times;</button>' + rows +
      '<div class="sams-ck__btns"><button type="button" class="sams-ck__btn sams-ck__btn--ghost" data-ck="reject">' + T.reject +
      '</button><button type="button" class="sams-ck__btn sams-ck__btn--ghost" data-ck="save">' + T.save +
      '</button><button type="button" class="sams-ck__btn sams-ck__btn--primary" data-ck="accept">' + T.accept + '</button></div></div>';
    m.addEventListener("click", function (e) {
      var a = e.target.closest("[data-ck]"); if (!a) return;
      var k = a.getAttribute("data-ck"), q = function (n) { return m.querySelector('input[name="' + n + '"]').checked; };
      if (k === "close") { m.remove(); return; }
      if (k === "accept") decide({ functional: true, analytics: true, advertisement: true });
      if (k === "reject") decide({ functional: false, analytics: false, advertisement: false });
      if (k === "save") decide({ functional: q("functional"), analytics: q("analytics"), advertisement: q("advertisement") });
    });
    m.addEventListener("keydown", function (e) { if (e.key === "Escape") m.remove(); });
    document.body.appendChild(m);
    m.querySelector(".sams-ck__x").focus();
  }
  window.samsCookiePreferences = openPrefs;

  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  ready(function () {
    if (choice) showRevisit(); else showBanner();
    document.querySelectorAll('a[href="#cookie-preferences"]').forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); openPrefs(); });
    });
    /* deep link: /privacy-policy/#cookie-preferences opens the dialog straight away */
    if (location.hash === "#cookie-preferences") openPrefs();
    window.addEventListener("hashchange", function () { if (location.hash === "#cookie-preferences") openPrefs(); });
    /* phone and WhatsApp click conversions (for when those links are added) */
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
      var h = (a.getAttribute("href") || "").toLowerCase();
      if (h.indexOf("tel:") === 0) window.samsTrack.conversion("phone");
      else if (/wa\.me|api\.whatsapp\.com|whatsapp:\/\//.test(h)) window.samsTrack.conversion("whatsapp");
    }, true);
    /* thank-you page: count the lead once, only after a real submission */
    if (/^(\/[a-z]{2})?\/thank-you\/?$/.test(location.pathname)) {
      var id = null;
      try { id = sessionStorage.getItem("sams_lead_id"); sessionStorage.removeItem("sams_lead_id"); } catch (e) {}
      if (id) window.samsTrack.conversion("form", id);
    }
  });
})();

/* "Talk to SAMS" chat (js/sams-chat.js): added to every page that loads this file. The private deck and the evaluation form do not load it. */
(function () {
  try {
    if (/^\/presentation\/?/.test(location.pathname)) return;
    var s = document.createElement("script");
    s.src = "/js/sams-chat.js?v=20261013d";
    s.defer = true;
    document.head.appendChild(s);
  } catch (e) { /* the chat must never break a page */ }
})();
