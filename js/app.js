// ============================================================
// MOETNU — gedeelde UI helpers
// Header/nav met auth-status, toasts, formatting.
// ============================================================

// Clickjacking-bescherming (frame-buster).
// GitHub Pages negeert custom headers (zoals de CSP in _headers),
// dus deze JS-check voorkomt dat de site in een iframe wordt gekaapt.
if (window.top !== window.self) {
  window.top.location = window.self.location;
}

// ---- Formatting ----
function euro(n) {
  if (n == null) return "";
  return "€" + Number(n).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function prijsLabel(service) {
  const t = service.prijs_type || "vast";
  if (t === "per_uur") return euro(service.prijs) + " /uur";
  if (t === "vanaf") return "vanaf " + euro(service.prijs);
  return euro(service.prijs);
}
function tijdAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  const s = Math.floor((now - d) / 1000);
  if (s < 60) return "nu";
  const m = Math.floor(s / 60); if (m < 60) return m + " min geleden";
  const h = Math.floor(m / 60); if (h < 24) return h + " uur geleden";
  const dag = Math.floor(h / 24); if (dag < 30) return dag + " dag(en) geleden";
  return d.toLocaleDateString("nl-NL");
}
const qs = (p) => new URLSearchParams(location.search).get(p);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function slugify(s) { return String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item"; }

// ---- Bevestiging (betrouwbaar in webviews, i.p.v. window.confirm) ----
// Eerste klik: knop verandert in "Zeker?" · tweede klik voert actie uit.
function bevestig(e, tekst, cb) {
  const btn = e.currentTarget;
  if (btn.dataset.bevestigd === "1") {
    btn.dataset.bevestigd = "";
    btn.classList.remove("btn-danger");
    cb();
    return;
  }
  btn.dataset.bevestigd = "1";
  const orig = btn.textContent;
  btn.textContent = tekst;
  btn.classList.add("btn-danger");
  setTimeout(() => {
    if (btn.dataset.bevestigd === "1") {
      btn.dataset.bevestigd = "";
      btn.textContent = orig;
      btn.classList.remove("btn-danger");
    }
  }, 3000);
}

// ---- Toast ----
function toast(msg, type) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = "show " + (type || "");
  clearTimeout(t._h);
  t._h = setTimeout(() => (t.className = ""), 2600);
}

// ---- Header / nav ----
async function renderHeader(active) {
  const el = document.getElementById("header");
  if (!el) return;
  let user = null;
  try { user = await window.SF.currentUser(); } catch (e) {}
  const naam = window.SF.naam;
  const demoBadge = window.SF.DEMO ? '<span class="demo-badge">DEMO</span>' : "";

  const authHtml = user
    ? `<div class="nav-user">
         <span class="nav-hi">Hoi, ${esc(user.voornaam || "gast")}</span>
         <a href="dashboard.html" class="btn btn-sm ${active === "dashboard" ? "active" : ""}">Dashboard</a>
         <a href="#" onclick="doLogout(event)" class="btn btn-sm btn-ghost">Uitloggen</a>
       </div>`
    : `<div class="nav-auth">
         <a href="login.html" class="btn btn-sm btn-ghost ${active === "login" ? "active" : ""}">Inloggen</a>
         <a href="login.html?mode=register" class="btn btn-sm btn-primary">Aanmelden</a>
       </div>`;

  el.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="logo"><img src="assets/logo-light.png" alt="Moetnu" class="logo-img">${demoBadge}</a>
      <nav class="nav">
        <a href="diensten.html" class="${active === "diensten" ? "active" : ""}">Diensten</a>
        <a href="klussen.html" class="${active === "klussen" ? "active" : ""}">Klussen</a>
        <a href="plaatsen.html" class="${active === "plaatsen" ? "active" : ""}">Plaatsen</a>
      </nav>
      ${authHtml}
    </div>`;
}

async function doLogout(e) {
  if (e) e.preventDefault();
  await window.SF.signOut();
  toast("Uitgelogd");
  setTimeout(() => (location.href = "index.html"), 500);
}

// ---- Require auth (redirect naar login) ----
async function requireAuth() {
  const u = await window.SF.currentUser();
  if (!u) {
    location.href = "login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search);
    return null;
  }
  return u;
}

// ---- Cookie consent (AVG) ----
function initCookieConsent() {
  const KEY = "moetnu_cookie_consent";
  if (localStorage.getItem(KEY)) return;
  const b = document.createElement("div");
  b.id = "cookie-bar";
  b.innerHTML = `
    <div class="cookie-inner">
      <p>We gebruiken alleen noodzakelijke cookies (login/sessie) en anonieme statistieken om Moetnu te verbeteren. <a href="privacy.html">Meer info</a>.</p>
      <div class="cookie-actions">
        <button class="btn btn-sm btn-ghost" onclick="cookieChoice('alleen-noodzakelijk')">Alleen noodzakelijk</button>
        <button class="btn btn-sm btn-primary" onclick="cookieChoice('akkoord')">Akkoord</button>
      </div>
    </div>`;
  document.body.appendChild(b);
}
function cookieChoice(v) {
  localStorage.setItem("moetnu_cookie_consent", v + "|" + new Date().toISOString());
  const b = document.getElementById("cookie-bar");
  if (b) b.remove();
}
window.cookieChoice = cookieChoice;

// ---- Init common ----
document.addEventListener("DOMContentLoaded", async () => {
  // E-mail bevestiging: ?code= uitwisselen voor een sessie
  const code = qs("code");
  if (code) {
    try {
      await window.SF.exchangeCode(code);
      const clean = location.pathname + location.search.replace(/[?&]code=[^&]*/, "").replace(/^[?&]$/, "");
      history.replaceState(null, "", clean);
      location.reload();
      return;
    } catch (e) {
      console.warn("Confirmatiecode ongeldig of verlopen", e);
    }
  }
  const active = document.body.dataset.page || "";
  await renderHeader(active);
  initCookieConsent();
});
