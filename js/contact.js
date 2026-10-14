document.addEventListener("DOMContentLoaded", function () {
  function validateField(field) {
    const input = field.querySelector("input, select, textarea");
    const valid = input.checkValidity();
    field.classList.toggle("is-invalid", !valid);
    field.classList.toggle("is-valid", valid);
    return valid;
  }

  // Without a backend endpoint in the form's action attribute, the enquiry is handed to the visitor's mail app.
  // `labels` lists the fields that go into the email body; `title` builds its subject line.
  const loadedAt = performance.now();

  /* Cloudflare Turnstile (bot check). Loaded lazily the first time a visitor touches the form, so
     visitors who never use it make no request to Cloudflare. The server verifies the token. */
  const TS_SITEKEY = "0x4AAAAAAFN6i-o9IrG7js5L";
  let tsLoading = null;
  function loadTurnstile() {
    if (!tsLoading) {
      tsLoading = new Promise((resolve) => {
        if (window.turnstile) return resolve(window.turnstile);
        window.__samsTsLoaded = () => resolve(window.turnstile);
        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__samsTsLoaded";
        s.async = true;
        s.onerror = () => resolve(null);
        document.head.appendChild(s);
      });
    }
    return tsLoading;
  }

  function setupForm(form, note, labels, title) {
    const fields = Array.from(form.querySelectorAll(".s2-field")).filter((f) => f.querySelector("[required]"));

    fields.forEach((field) => {
      const input = field.querySelector("input, select, textarea");
      input.addEventListener("blur", () => validateField(field));
      input.addEventListener("input", () => {
        if (field.classList.contains("is-invalid")) validateField(field);
      });
    });
    form.querySelectorAll("select").forEach((select) =>
      select.addEventListener("change", () => select.closest(".s2-field").classList.add("has-value"))
    );

    const M = (key, fallback) => (form.dataset[key] || fallback).replace("{mail}", form.dataset.mailto);
    const prefix = (document.documentElement.getAttribute("lang") || "en") === "en" ? "" : "/" + document.documentElement.getAttribute("lang");
    function showNote(text, ok) {
      note.textContent = text;
      note.classList.toggle("is-success", ok);
      note.classList.toggle("is-error", !ok);
    }

    function sendByEmail(data) {
      const body = Object.keys(labels)
        .filter((key) => data.get(key))
        .map((key) => labels[key] + ": " + data.get(key))
        .join("\n");
      window.location.href = "mailto:" + form.dataset.mailto + "?subject=" + encodeURIComponent(title(data)) + "&body=" + encodeURIComponent(body);
    }

    let tsApi = null, tsId = null;
    if (form.getAttribute("action")) {
      const submitBtn = form.querySelector("button[type=submit]");
      const box = document.createElement("div");
      box.className = "s2-turnstile";
      box.style.cssText = "margin:14px 0;min-height:0";
      submitBtn.parentNode.insertBefore(box, submitBtn);
      form.addEventListener("focusin", () => {
        loadTurnstile().then((ts) => {
          if (ts && tsId === null) { tsApi = ts; tsId = ts.render(box, { sitekey: TS_SITEKEY, theme: "auto" }); }
        });
      }, { once: true });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!fields.map(validateField).every(Boolean)) {
        showNote(M("msgInvalid", "Please complete the highlighted fields before submitting."), false);
        return;
      }
      const tsToken = tsApi && tsId !== null ? tsApi.getResponse(tsId) : "";
      if (tsApi && tsId !== null && !tsToken) {
        showNote(M("msgCaptcha", "Please wait a moment for the security check to finish, then press send again."), false);
        return;
      }

      const data = new FormData(form);
      if (tsToken) data.set("cf-turnstile-response", tsToken);
      const endpoint = form.getAttribute("action");
      data.set("form_type", form.dataset.form || "contact");
      data.set("page", location.pathname);
      data.set("elapsed", String(Math.round(performance.now() - loadedAt)));
      const subj = new URLSearchParams(location.search).get("subject");
      if (subj) data.set("subject", subj);
      try {
        data.set("gclid", sessionStorage.getItem("sams_gclid") || "");
        data.set("utm", sessionStorage.getItem("sams_utm") || "");
      } catch (err) {}

      if (!endpoint) {
        sendByEmail(data);
        showNote(M("msgMail", "Your email app should open with your enquiry filled in — just press send. Or email us at {mail}."), true);
        return;
      }

      const btn = form.querySelector("button[type=submit]");
      btn.classList.add("is-loading");
      btn.disabled = true;
      note.textContent = "";

      try {
        const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (res.status === 429) {
          showNote(M("msgRate", "You have sent several enquiries in a short time. Please wait a few minutes or email us at {mail}."), false);
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (json && json.error === "captcha") {
          showNote(M("msgFail", "Sorry, your enquiry couldn't be sent. Please email us at {mail}."), false);
          return;
        }
        if (!res.ok || !json.ok) throw new Error("HTTP " + res.status);
        showNote(M("msgOk", "Thanks — your enquiry has been sent. Our team will be in touch shortly."), true);
        try { if (json.lead_id) sessionStorage.setItem("sams_lead_id", json.lead_id); } catch (err) {}
        window.location.href = prefix + "/thank-you/?form=" + encodeURIComponent(form.dataset.form || "contact");
        return;
      } catch (err) {
        showNote(M("msgFail", "Sorry, your enquiry couldn't be sent. Please email us at {mail}."), false);
      } finally {
        btn.classList.remove("is-loading");
        btn.disabled = false;
        if (tsApi && tsId !== null) { try { tsApi.reset(tsId); } catch (err) {} }
      }
    });
  }

  /* Links such as contact.html?subject=Datasheet%20Request: carry the subject into the email link,
     or jump straight to the distributor form for distributor enquiries. */
  const requested = new URLSearchParams(window.location.search).get("subject");
  const hqEmail = document.getElementById("s2HqEmail");
  if (requested && hqEmail) {
    hqEmail.href = "mailto:info@sams-mobile.com?subject=" + encodeURIComponent(requested);
    hqEmail.closest(".s2-ct-hqs__card")?.classList.add("has-subject");
  }
  if (requested === "Distributor Enquiry") {
    const dist = document.getElementById("distributors");
    if (dist) window.scrollTo({ top: dist.getBoundingClientRect().top + window.scrollY - 80, behavior: "instant" });
  }

  /* Distributor enquiry form */
  const distForm = document.getElementById("s2DistForm");
  const distNote = document.getElementById("s2DistNote");
  if (distForm && distNote) {
    setupForm(
      distForm,
      distNote,
      { name: "Name", company: "Company", email: "Email", phone: "Phone", market: "Country / territory", businessType: "Business type", message: "Message" },
      (data) => (distForm.dataset.subject || "Distributor Enquiry") + " — " + data.get("company") + " (" + data.get("market") + ")"
    );
  }
});
