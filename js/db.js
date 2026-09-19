// ============================================================
// MOETNU — data-laag (repository)
// Uniforme async API. Gebruikt Supabase als die geconfigureerd is,
// anders een DEMO-store (localStorage + seed) zodat de app lokaal draait.
// ============================================================

(function () {
  const C = window.MOETNU_CONFIG;
  const DEMO = !C.SUPABASE_URL;

  let sb = null;
  let sbLoaded = false;

  // ---------------- DEMO STORE ----------------
  const DEMO_KEY = "moetnu_demo_v2";

  function demoLoad() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || null; } catch (e) { return null; }
  }
  function demoSave(data) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  }
  function uid() {
    return "demo-" + Math.random().toString(36).slice(2, 10);
  }

  const DEMO_CATEGORIES = [
    { id: 1, slug: "loodgieter", naam: "Loodgieter", icon: "🔧", certificering_verplicht: true },
    { id: 2, slug: "elektricien", naam: "Elektricien", icon: "⚡", certificering_verplicht: true },
    { id: 3, slug: "klussen", naam: "Klussen", icon: "🔨" },
    { id: 4, slug: "schoonmaak", naam: "Schoonmaak", icon: "🧹" },
    { id: 5, slug: "tuin", naam: "Tuin & buiten", icon: "🌿" },
    { id: 6, slug: "schilderen", naam: "Schilder", icon: "🖌️" },
    { id: 7, slug: "verhuizen", naam: "Verhuizen", icon: "📦" },
    { id: 8, slug: "ict", naam: "ICT & tech", icon: "💻" },
    { id: 9, slug: "zorg", naam: "Zorg & hulp", icon: "🤝" },
    { id: 10, slug: "overig", naam: "Overig", icon: "➕" },
    { id: 11, slug: "slotensmid", naam: "Slotensmid", icon: "🔑" },
    { id: 12, slug: "cv-monteur", naam: "CV & verwarming", icon: "🔥", certificering_verplicht: true },
    { id: 13, slug: "dakdekker", naam: "Dakdekker", icon: "🏠" },
    { id: 14, slug: "ongedierte", naam: "Ongediertebestrijding", icon: "🐜" },
  ];

  function demoSeed() {
    const s = {
      categories: DEMO_CATEGORIES,
      users: {
        demo_provider_1: { id: "demo_provider_1", email: "jan@voorbeeld.nl", voornaam: "Jan", achternaam: "Visser", rol: "aanbieder", regio: "Amsterdam", geverifieerd: true, toestemming_avg: true },
        demo_provider_2: { id: "demo_provider_2", email: "petra@voorbeeld.nl", voornaam: "Petra", achternaam: "Bakker", rol: "aanbieder", regio: "Utrecht", geverifieerd: false, toestemming_avg: true },
        demo_provider_3: { id: "demo_provider_3", email: "ali@voorbeeld.nl", voornaam: "Ali", achternaam: "Yilmaz", rol: "aanbieder", regio: "Rotterdam", geverifieerd: false, toestemming_avg: true },
        demo_provider_4: { id: "demo_provider_4", email: "erik@voorbeeld.nl", voornaam: "Erik", achternaam: "de Boer", rol: "aanbieder", regio: "Amstelveen", geverifieerd: false, toestemming_avg: true },
        demo_provider_5: { id: "demo_provider_5", email: "sanne@voorbeeld.nl", voornaam: "Sanne", achternaam: "Jansen", rol: "aanbieder", regio: "Hoofddorp", geverifieerd: false, toestemming_avg: true },
        demo_provider_6: { id: "demo_provider_6", email: "tom@voorbeeld.nl", voornaam: "Tom", achternaam: "Vermeulen", rol: "aanbieder", regio: "Utrecht", geverifieerd: false, toestemming_avg: true },
        demo_provider_7: { id: "demo_provider_7", email: "lisa@voorbeeld.nl", voornaam: "Lisa", achternaam: "Koning", rol: "aanbieder", regio: "Amsterdam", geverifieerd: false, toestemming_avg: true },
        demo_customer_1: { id: "demo_customer_1", email: "klant1@voorbeeld.nl", voornaam: "Mark", achternaam: "de Groot", rol: "klant", regio: "Amsterdam" },
        demo_customer_2: { id: "demo_customer_2", email: "klant2@voorbeeld.nl", voornaam: "Fleur", achternaam: "Smit", rol: "klant", regio: "Utrecht" },
      },
      certifications: [
        { id: "demo_cert_1", user_id: "demo_provider_1", type: "VCA", nummer: "VCA-1234567", status: "geverifieerd", created_at: new Date().toISOString() },
        { id: "demo_cert_2", user_id: "demo_provider_1", type: "Gasketelwet/CO", nummer: "NL-2023-08912", status: "geverifieerd", created_at: new Date().toISOString() },
        { id: "demo_cert_3", user_id: "demo_provider_1", type: "KVK", nummer: "12345678", status: "geverifieerd", created_at: new Date().toISOString() },
      ],
      services: [
        { id: "demo_svc_1", provider_id: "demo_provider_1", category_id: 1, titel: "Lekkage verhelpen", omschrijving: "Snel een lekkende kraan, afvoer of leiding gefixt. Binnen 24u ter plaatse.", prijs: 89, prijs_type: "vanaf", regio: "Amsterdam", status: "actief", created_at: new Date().toISOString() },
        { id: "demo_svc_2", provider_id: "demo_provider_2", category_id: 2, titel: "Groepenkast vervangen", omschrijving: "Veilige, gecertificeerde vervanging van je groepenkast. Incl. keuring.", prijs: 550, prijs_type: "vast", regio: "Utrecht", status: "actief", created_at: new Date().toISOString() },
        { id: "demo_svc_3", provider_id: "demo_provider_3", category_id: 4, titel: "Woning dieptereiniging", omschrijving: "Grondige schoonmaak van je hele woning, per uur of vast pakket.", prijs: 25, prijs_type: "per_uur", regio: "Rotterdam", status: "actief", created_at: new Date().toISOString() },
        { id: "demo_svc_4", provider_id: "demo_provider_1", category_id: 6, titel: "Wanden sauzen (spuiten)", omschrijving: "Strakm resultaat met airless spuiten, inclusief afplakken en materiaal.", prijs: 35, prijs_type: "per_uur", regio: "Amsterdam", status: "actief", created_at: new Date().toISOString() },
        { id: "demo_svc_5", provider_id: "demo_provider_4", category_id: 3, titel: "Klussen & montage", omschrijving: "Meubels in elkaar zetten, ophangen, kleine reparaties.", prijs: 45, prijs_type: "vanaf", regio: "Amstelveen", status: "actief", created_at: new Date().toISOString() },
        { id: "demo_svc_6", provider_id: "demo_provider_5", category_id: 4, titel: "Woning schoonmaak", omschrijving: "Grondige schoonmaak van woning of kantoor.", prijs: 22, prijs_type: "per_uur", regio: "Hoofddorp", status: "actief", created_at: new Date().toISOString() },
        { id: "demo_svc_7", provider_id: "demo_provider_6", category_id: 7, titel: "Verhuizing & transport", omschrijving: "Verhuizingen en transport met bus.", prijs: 90, prijs_type: "vanaf", regio: "Utrecht", status: "actief", created_at: new Date().toISOString() },
        { id: "demo_svc_8", provider_id: "demo_provider_7", category_id: 5, titel: "Tuinonderhoud", omschrijving: "Maaien, snoeien en tuinonderhoud.", prijs: 35, prijs_type: "per_uur", regio: "Amsterdam", status: "actief", created_at: new Date().toISOString() },
      ],
      jobs: [
        { id: "demo_job_1", poster_id: "demo_customer_1", category_id: 3, titel: "IKEA-kast in elkaar zetten", omschrijving: "PAX kledingkast van 2m, moet zaterdag klaar.", budget_min: 40, budget_max: 80, regio: "Amsterdam", status: "open", created_at: new Date().toISOString() },
        { id: "demo_job_2", poster_id: "demo_customer_2", category_id: 7, titel: "Verhuizing studio naar 2-kamer", omschrijving: "Kleine verhuizing met lift, ±30 dozen en wat meubels.", budget_min: 150, budget_max: 300, regio: "Utrecht", status: "open", created_at: new Date().toISOString() },
      ],
      bids: [],
      bookings: [],
      reviews: [],
      data_verzoeken: [],
      messages: [],
      provider_categories: [],
      availability: [],
    };
    demoSave(s);
    return s;
  }
  function demoGet() {
    return demoLoad() || demoSeed();
  }

  // ---------------- SUPABASE (lazy load) ----------------
  async function getSB() {
    if (DEMO) return null;
    if (!sbLoaded) {
      await new Promise((res, rej) => {
        if (window.supabase) return res();
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        s.onload = res;
        s.onerror = () => rej(new Error("Supabase SDK niet geladen"));
        document.head.appendChild(s);
      });
      sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {
        auth: { detectSessionInUrl: true, flowType: 'pkce' },
      });
      sbLoaded = true;
    }
    return sb;
  }

  // ---------------- AUTH ----------------
  async function signUp(email, password, voornaam, rol, toestemming, meerderjarig) {
    if (DEMO) {
      const d = demoGet();
      const u = { id: uid(), email, voornaam, achternaam: "", rol: rol || "klant", regio: "", geverifieerd: false, toestemming_avg: !!toestemming, toestemming_avg_op: toestemming ? new Date().toISOString() : null, meerderjarig: !!meerderjarig };
      d.users[u.id] = u;
      d.session = u.id;
      demoSave(d);
      return { user: u, error: null };
    }
    const s = await getSB();
    const { data, error } = await s.auth.signUp({
      email, password,
      options: {
        data: { voornaam, rol, toestemming: !!toestemming, meerderjarig: !!meerderjarig },
        emailRedirectTo: C.SITE_URL + "/login.html?bevestigd=1",
      },
    });
    return { user: data.user, error };
  }

  async function signIn(email, password) {
    if (DEMO) {
      const d = demoGet();
      const u = Object.values(d.users).find((x) => x.email === email);
      if (!u) return { user: null, error: { message: "Geen account met dit e-mailadres (demo)." } };
      d.session = u.id;
      demoSave(d);
      return { user: u, error: null };
    }
    const s = await getSB();
    const { data, error } = await s.auth.signInWithPassword({ email, password });
    return { user: data.user, error };
  }

  async function signOut() {
    if (DEMO) {
      const d = demoGet(); d.session = null; demoSave(d);
      return;
    }
    const s = await getSB();
    await s.auth.signOut();
  }

  // ---- E-mail bevestiging: ?code= uitwisselen voor sessie ----
  async function exchangeCode(code) {
    if (DEMO) return { user: null, error: null };
    const s = await getSB();
    const { data, error } = await s.auth.exchangeCodeForSession(code);
    return { user: (data && data.user) || null, error };
  }

  // ---- Wachtwoord reset ----
  async function resetPassword(email) {
    const s = await getSB();
    const { error } = await s.auth.resetPasswordForEmail(email, {
      redirectTo: C.SITE_URL + "/login.html?reset=1",
    });
    return { error };
  }

  async function updatePassword(newPassword) {
    const s = await getSB();
    const { error } = await s.auth.updateUser({ password: newPassword });
    return { error };
  }

  async function currentUser() {
    if (DEMO) {
      const d = demoGet();
      return d.session ? d.users[d.session] : null;
    }
    const s = await getSB();
    const { data } = await s.auth.getSession();
    return data.session ? data.session.user : null;
  }

  async function getProfile(userId) {
    if (DEMO) {
      const d = demoGet();
      return d.users[userId] || null;
    }
    const s = await getSB();
    const { data } = await s.from("profiles").select("*").eq("id", userId).single();
    return data;
  }

  async function updateProfile(userId, patch) {
    if (DEMO) {
      const d = demoGet();
      d.users[userId] = { ...d.users[userId], ...patch };
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error } = await s.from("profiles").update(patch).eq("id", userId);
    return { error };
  }

  // ---------------- CATEGORIES ----------------
  async function getCategories() {
    if (DEMO) return demoGet().categories;
    const s = await getSB();
    const { data } = await s.from("categories").select("*").order("volgorde");
    return data || [];
  }

  // ---------------- SERVICES ----------------
  async function getServices(filter = {}) {
    if (DEMO) {
      let list = demoGet().services.filter((x) => x.status === "actief");
      if (filter.category_id) list = list.filter((x) => x.category_id === Number(filter.category_id));
      if (filter.regio) list = list.filter((x) => x.regio.toLowerCase().includes(filter.regio.toLowerCase()));
      if (filter.q) {
        const q = filter.q.toLowerCase();
        list = list.filter((x) => (x.titel + " " + x.omschrijving).toLowerCase().includes(q));
      }
      return list;
    }
    const s = await getSB();
    let q = s.from("services").select("*").eq("status", "actief").order("created_at", { ascending: false });
    if (filter.category_id) q = q.eq("category_id", filter.category_id);
    if (filter.regio) q = q.ilike("regio", "%" + filter.regio + "%");
    if (filter.q) q = q.or(`titel.ilike.%${filter.q}%,omschrijving.ilike.%${filter.q}%`);
    const { data } = await q;
    return data || [];
  }

  async function getService(id) {
    if (DEMO) return demoGet().services.find((x) => x.id === id) || null;
    const s = await getSB();
    const { data } = await s.from("services").select("*, profiles(voornaam, achternaam, regio, avatar_url), categories(naam, icon)").eq("id", id).single();
    return data;
  }

  async function createService(payload) {
    if (DEMO) {
      const d = demoGet();
      const svc = { id: uid(), provider_id: payload.provider_id, category_id: Number(payload.category_id), titel: payload.titel, omschrijving: payload.omschrijving, prijs: Number(payload.prijs), prijs_type: payload.prijs_type || "vast", regio: payload.regio, status: "actief", created_at: new Date().toISOString() };
      d.services.push(svc);
      demoSave(d);
      return { data: svc, error: null };
    }
    const s = await getSB();
    const { data, error } = await s.from("services").insert(payload).select().single();
    return { data, error };
  }

  async function myServices(providerId) {
    if (DEMO) return demoGet().services.filter((x) => x.provider_id === providerId);
    const s = await getSB();
    const { data } = await s.from("services").select("*").eq("provider_id", providerId).order("created_at", { ascending: false });
    return data || [];
  }

  async function updateServiceStatus(id, status) {
    if (DEMO) {
      const d = demoGet();
      const svc = d.services.find((x) => x.id === id);
      if (svc) svc.status = status;
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error } = await s.from("services").update({ status }).eq("id", id);
    return { error };
  }

  async function deleteService(id) {
    if (DEMO) {
      const d = demoGet();
      d.services = d.services.filter((x) => x.id !== id);
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error } = await s.from("services").delete().eq("id", id);
    return { error };
  }

  // ---------------- JOBS ----------------
  async function getJobs(filter = {}) {
    if (DEMO) {
      let list = demoGet().jobs.filter((x) => x.status === "open");
      if (filter.category_id) list = list.filter((x) => x.category_id === Number(filter.category_id));
      if (filter.regio) list = list.filter((x) => x.regio.toLowerCase().includes(filter.regio.toLowerCase()));
      if (filter.q) {
        const q = filter.q.toLowerCase();
        list = list.filter((x) => (x.titel + " " + x.omschrijving).toLowerCase().includes(q));
      }
      return list;
    }
    const s = await getSB();
    let q = s.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false });
    if (filter.category_id) q = q.eq("category_id", filter.category_id);
    if (filter.regio) q = q.ilike("regio", "%" + filter.regio + "%");
    if (filter.q) q = q.or(`titel.ilike.%${filter.q}%,omschrijving.ilike.%${filter.q}%`);
    const { data } = await q;
    return data || [];
  }

  async function getJob(id) {
    if (DEMO) return demoGet().jobs.find((x) => x.id === id) || null;
    const s = await getSB();
    const { data } = await s.from("jobs").select("*").eq("id", id).single();
    return data;
  }

  async function createJob(payload) {
    if (DEMO) {
      const d = demoGet();
      const job = { id: uid(), poster_id: payload.poster_id, category_id: Number(payload.category_id), titel: payload.titel, omschrijving: payload.omschrijving, budget_min: payload.budget_min ? Number(payload.budget_min) : null, budget_max: payload.budget_max ? Number(payload.budget_max) : null, regio: payload.regio, status: "open", created_at: new Date().toISOString() };
      d.jobs.push(job);
      demoSave(d);
      return { data: job, error: null };
    }
    const s = await getSB();
    const { data, error } = await s.from("jobs").insert(payload).select().single();
    return { data, error };
  }

  async function myJobs(posterId) {
    if (DEMO) return demoGet().jobs.filter((x) => x.poster_id === posterId);
    const s = await getSB();
    const { data } = await s.from("jobs").select("*").eq("poster_id", posterId).order("created_at", { ascending: false });
    return data || [];
  }

  async function deleteJob(id) {
    if (DEMO) {
      const d = demoGet();
      d.jobs = d.jobs.filter((x) => x.id !== id);
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error } = await s.from("jobs").delete().eq("id", id);
    return { error };
  }

  async function updateJobStatus(id, status) {
    if (DEMO) {
      const d = demoGet();
      const j = d.jobs.find((x) => x.id === id);
      if (j) j.status = status;
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error } = await s.from("jobs").update({ status }).eq("id", id);
    return { error };
  }

  // ---------------- BIDS ----------------
  async function getBids(jobId) {
    if (DEMO) return demoGet().bids.filter((x) => x.job_id === jobId);
    const s = await getSB();
    const { data } = await s.from("bids").select("*").eq("job_id", jobId).order("created_at", { ascending: true });
    return data || [];
  }

  async function bidOnJob(jobId, providerId, bedrag, bericht) {
    if (DEMO) {
      const d = demoGet();
      const existing = d.bids.find((x) => x.job_id === jobId && x.provider_id === providerId);
      if (existing) { existing.bedrag = Number(bedrag); existing.bericht = bericht; }
      else d.bids.push({ id: uid(), job_id: jobId, provider_id: providerId, bedrag: Number(bedrag), bericht, status: "open", created_at: new Date().toISOString() });
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error } = await s.from("bids").upsert({ job_id: jobId, provider_id: providerId, bedrag, bericht }, { onConflict: "job_id,provider_id" });
    if (!error) {
      const { data: j } = await s.from("jobs").select("poster_id, titel").eq("id", jobId).single();
      if (j) notifyUser(j.poster_id, "Nieuwe offerte op je klus", `<p>Er is een nieuwe offerte van <strong>€${bedrag}</strong> op je klus "${j.titel}".</p><p><a href="https://moetnu.nl/klus.html?id=${jobId}">Bekijk je klus</a></p>`);
    }
    return { error };
  }

  async function myBids(providerId) {
    if (DEMO) return demoGet().bids.filter((x) => x.provider_id === providerId);
    const s = await getSB();
    const { data } = await s.from("bids").select("*").eq("provider_id", providerId);
    return data || [];
  }

  async function chooseBid(jobId, providerId) {
    if (DEMO) {
      const d = demoGet();
      d.bids.forEach(b => { if (b.job_id === jobId) b.status = (b.provider_id === providerId ? "gekozen" : "afgewezen"); });
      const j = d.jobs.find(x => x.id === jobId);
      if (j) j.status = "toegewezen";
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error: e1 } = await s.from("bids").update({ status: "gekozen" }).eq("job_id", jobId).eq("provider_id", providerId);
    if (e1) return { error: e1 };
    await s.from("bids").update({ status: "afgewezen" }).eq("job_id", jobId).neq("provider_id", providerId);
    const { error: e2 } = await s.from("jobs").update({ status: "toegewezen" }).eq("id", jobId);
    return { error: e2 };
  }

  // ---------------- BOOKINGS ----------------
  async function createBooking(payload) {
    const booking = {
      service_id: payload.service_id,
      customer_id: payload.customer_id,
      provider_id: payload.provider_id,
      bedrag: Number(payload.bedrag),
      snelheid: payload.snelheid || "plannen",
      spoed_toeslag: Number(payload.spoed_toeslag) || 0,
      servicekosten: Number(payload.servicekosten) || 0,
      totaal: Number(payload.totaal) || Number(payload.bedrag),
      gewenste_datum: payload.gewenste_datum || null,
      bericht: payload.bericht || "",
    };
    if (DEMO) {
      const d = demoGet();
      const b = { id: uid(), ...booking, status: "aangevraagd", created_at: new Date().toISOString() };
      d.bookings.push(b);
      demoSave(d);
      return { data: b, error: null };
    }
    const s = await getSB();
    const { data, error } = await s.from("bookings").insert(booking).select().single();
    if (!error) notifyUser(payload.provider_id, "Nieuwe boeking op Moetnu", `<p>Je hebt een nieuwe boeking van <strong>€${booking.totaal}</strong> ontvangen.</p><p><a href="https://moetnu.nl/dashboard.html">Bekijk je dashboard</a></p>`);
    return { data, error };
  }

  async function myBookings(userId) {
    if (DEMO) return demoGet().bookings.filter((x) => x.customer_id === userId || x.provider_id === userId);
    const s = await getSB();
    const { data } = await s.from("bookings").select("*").or(`customer_id.eq.${userId},provider_id.eq.${userId}`).order("created_at", { ascending: false });
    return data || [];
  }

  async function updateBookingStatus(bookingId, status) {
    if (DEMO) {
      const d = demoGet();
      const b = d.bookings.find((x) => x.id === bookingId);
      if (b) b.status = status;
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error } = await s.from("bookings").update({ status }).eq("id", bookingId);
    return { error };
  }

  // ---------------- REVIEWS ----------------
  async function getReviewsForUser(userId) {
    if (DEMO) return demoGet().reviews.filter((x) => x.reviewee_id === userId);
    const s = await getSB();
    const { data } = await s.from("reviews")
      .select("*, profiles!reviews_reviewer_id_fkey(voornaam)")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });
    // map voornaam naar reviewer_voornaam voor de UI
    return (data || []).map(r => ({
      ...r,
      reviewer_voornaam: r.profiles?.voornaam || "Klant",
    }));
  }

  async function addReview(payload) {
    if (DEMO) {
      const d = demoGet();
      d.reviews.push({ id: uid(), ...payload, created_at: new Date().toISOString() });
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error } = await s.from("reviews").insert(payload);
    return { error };
  }

  // ---------------- VERIFICATIE & CERTIFICERING ----------------
  async function myCertifications(userId) {
    if (DEMO) return demoGet().certifications.filter((x) => x.user_id === userId);
    const s = await getSB();
    const { data } = await s.from("certifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return data || [];
  }

  async function addCertification(payload) {
    if (DEMO) {
      const d = demoGet();
      const c = { id: uid(), user_id: payload.user_id, type: payload.type, nummer: payload.nummer || "", status: "in_behandeling", created_at: new Date().toISOString() };
      d.certifications.push(c);
      demoSave(d);
      return { data: c, error: null };
    }
    const s = await getSB();
    const { data, error } = await s.from("certifications").insert(payload).select().single();
    return { data, error };
  }

  async function getVerifiedCertifications(userId) {
    if (DEMO) return demoGet().certifications.filter((x) => x.user_id === userId && x.status === "geverifieerd");
    const s = await getSB();
    const { data } = await s.from("certifications").select("*").eq("user_id", userId).eq("status", "geverifieerd");
    return data || [];
  }

  async function isVerified(userId) {
    const prof = await getProfile(userId);
    if (prof?.geverifieerd) return true;
    const certs = await getVerifiedCertifications(userId);
    return certs.length > 0;
  }

  // ---------------- AVG / DATA ----------------
  async function requestData(userId, type) {
    if (DEMO) {
      const d = demoGet();
      d.data_verzoeken.push({ id: uid(), user_id: userId, type, status: "open", created_at: new Date().toISOString() });
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    const { error } = await s.from("data_verzoeken").insert({ user_id: userId, type });
    return { error };
  }

  async function exportMyData(userId) {
    // Verzamelt alle data van de gebruiker (recht op inzage/overdraagbaarheid, AVG art. 15+20)
    if (DEMO) {
      const d = demoGet();
      return {
        profiel: d.users[userId] || null,
        diensten: d.services.filter((x) => x.provider_id === userId),
        klussen: d.jobs.filter((x) => x.poster_id === userId),
        offertes: d.bids.filter((x) => x.provider_id === userId),
        boekingen: d.bookings.filter((x) => x.customer_id === userId || x.provider_id === userId),
      };
    }
    const s = await getSB();
    const [p, svc, jobs, bids, bookings] = await Promise.all([
      s.from("profiles").select("*").eq("id", userId).single(),
      s.from("services").select("*").eq("provider_id", userId),
      s.from("jobs").select("*").eq("poster_id", userId),
      s.from("bids").select("*").eq("provider_id", userId),
      s.from("bookings").select("*").or(`customer_id.eq.${userId},provider_id.eq.${userId}`),
    ]);
    return {
      profiel: p.data,
      diensten: svc.data || [],
      klussen: jobs.data || [],
      offertes: bids.data || [],
      boekingen: bookings.data || [],
    };
  }

  async function deleteAccount(userId) {
    // Recht op vergetelheid (AVG art. 17). Demo: direct wissen.
    // Supabase: verzoek wordt gelogd; admin/service-role wist de auth.user (cascade).
    if (DEMO) {
      const d = demoGet();
      delete d.users[userId];
      d.services = d.services.filter((x) => x.provider_id !== userId);
      d.jobs = d.jobs.filter((x) => x.poster_id !== userId);
      d.bids = d.bids.filter((x) => x.provider_id !== userId);
      d.bookings = d.bookings.filter((x) => x.customer_id !== userId && x.provider_id !== userId);
      d.certifications = d.certifications.filter((x) => x.user_id !== userId);
      d.session = null;
      demoSave(d);
      return { error: null };
    }
    // Recht op vergetelheid (AVG art. 17).
    // Live: verwijder de gebruiker écht via de delete-account Edge Function
    // (service_role). Zolang die niet is gedeployed, valt dit terug op het
    // loggen van een verzoek + uitloggen (niet volledig AVG-conform).
    await requestData(userId, "wissen");
    if (C.DELETE_ACCOUNT_URL) {
      try {
        const s = await getSB();
        const { data: { session } } = await s.auth.getSession();
        if (session) {
          const res = await fetch(C.DELETE_ACCOUNT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + session.access_token,
            },
          });
          const j = await res.json().catch(() => ({}));
          if (j.ok) return { error: null, verwijderd: true };
        }
      } catch (e) { /* fallback hieronder */ }
    }
    const s = await getSB();
    await s.auth.signOut();
    return { error: null, verwijderd: false };
  }

  // ---------------- PRIJS / VERDIENMODEL ----------------
  function serviceKosten(bedrag) {
    const tiers = (C.SERVICEKOSTEN || []).slice().sort((a, b) => a.tot - b.tot);
    for (const t of tiers) {
      if (Number(bedrag) < t.tot) return t.bedrag;
    }
    return 14.95;
  }

  function spoedToeslag(bedrag, tier) {
    // Geen opgelegde spoedtoeslag meer: de aanbieder bepaalt zelf zijn tarief.
    // De snelheidstier is een wens van de klant, geen prijsbepaling door het platform.
    return 0;
  }

  function prijsOpbouw(bedrag, tier) {
    const basis = Number(bedrag) || 0;
    const toeslag = 0;
    const kosten = serviceKosten(basis);
    const totaal = Math.round((basis + toeslag + kosten) * 100) / 100;
    const commissie = Math.round(basis * C.COMMISSIE_PERCENT) / 100;
    return { basis, toeslag, servicekosten: kosten, totaal, commissie, commissie_pct: C.COMMISSIE_PERCENT };
  }

  // ---------------- AI / CATEGORISATIE ----------------
  async function categoriseerTekst(tekst) {
    const cats = await getCategories();
    window.MOETNU_CATEGORIES = cats;

    // AI edge function (DeepSeek) indien geconfigureerd
    if (C.CATEGORISEER_URL) {
      try {
        const res = await fetch(C.CATEGORISEER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tekst }),
        });
        const j = await res.json();
        if (j && j.category_id) return j;
      } catch (e) { /* fallthrough naar regelgebaseerd */ }
    }

    // regel-gebaseerde fallback (werkt altijd)
    return window.MoetnuCategoriseer.categoriseer(tekst);
  }

  // ---------------- MATCHING (fase 3) ----------------
  async function getProviders() {
    if (DEMO) {
      const d = demoGet();
      return Object.values(d.users).filter(u => u.rol === "aanbieder" || u.rol === "beide");
    }
    const s = await getSB();
    const { data } = await s.from("profiles").select("*").neq("rol", "klant");
    return data || [];
  }

  async function matchProviders(job, radiusKm) {
    const providers = await getProviders();
    let liveCats = null;
    if (!DEMO) {
      const s = await getSB();
      const { data } = await s.from("provider_categories").select("provider_id, category_id");
      liveCats = data || [];
    }
    const out = [];
    for (const p of providers) {
      const afst = window.MoetnuGeo ? window.MoetnuGeo.afstand(job.regio, p.regio) : null;
      if (afst === null || afst === undefined || afst > radiusKm) continue;
      let categorie_match = false;
      if (DEMO) {
        const d = demoGet();
        categorie_match = d.services.some(s => s.provider_id === p.id && s.category_id === Number(job.category_id));
      } else {
        categorie_match = (liveCats || []).some(c => c.provider_id === p.id && Number(c.category_id) === Number(job.category_id));
      }
      out.push({ ...p, afstand_km: afst, categorie_match });
    }
    return out.sort((a, b) => a.afstand_km - b.afstand_km);
  }

  function radiusNu(job) {
    const min = (Date.now() - new Date(job.created_at).getTime()) / 60000;
    if (min < 5) return 5;
    if (min < 10) return 10;
    return 20;
  }

  // Geen automatische prijsverhoging meer: de aanbieder bepaalt zelf zijn
  // offerte. Deze functie blijft alleen voor de radius-expansie (zichtbaarheid),
  // niet voor een opgelegde vergoeding.
  function vergoedingNu(job) {
    const base = Number(job.budget_min) || Number(job.budget_max) || 0;
    const min = (Date.now() - new Date(job.created_at).getTime()) / 60000;
    return { bedrag: base, minuten: Math.floor(min) };
  }

  async function matchingStatus(job) {
    const radius = radiusNu(job);
    const vergoeding = vergoedingNu(job);
    const providers = await matchProviders(job, radius);
    const bids = await getBids(job.id);
    return { radius, vergoeding, providers, biedingen: bids.length };
  }

  // ---------------- CHAT / BERICHTEN ----------------
  async function sendMessage(payload) {
    const msg = {
      job_id: payload.job_id || null,
      booking_id: payload.booking_id || null,
      sender_id: payload.sender_id,
      recipient_id: payload.recipient_id,
      tekst: payload.tekst,
    };
    if (DEMO) {
      const d = demoGet();
      const m = { id: uid(), ...msg, gelezen: false, created_at: new Date().toISOString() };
      (d.messages = d.messages || []).push(m);
      demoSave(d);
      return { data: m, error: null };
    }
    const s = await getSB();
    const { data, error } = await s.from("messages").insert(msg).select().single();
    if (!error) notifyUser(msg.recipient_id, "Nieuw bericht op Moetnu", `<p>Je hebt een nieuw bericht ontvangen.</p><p><a href="https://moetnu.nl/dashboard.html">Bekijk het op Moetnu</a></p>`);
    return { data, error };
  }

  // ---------------- NOTIFICATIES (e-mail via Resend) ----------------
  async function notify(to, subject, html) {
    if (DEMO) return;
    const s = await getSB();
    try {
      await s.functions.invoke("notify", { body: { to, subject, html } });
    } catch (e) { /* notificatie mag de actie niet blokkeren */ }
  }

  async function notifyUser(userId, subject, html) {
    if (DEMO || !userId) return;
    const s = await getSB();
    const { data } = await s.from("profiles").select("email").eq("id", userId).single();
    if (data && data.email) await notify(data.email, subject, html);
  }

  async function getMessages(scope) {
    if (DEMO) {
      const d = demoGet();
      return (d.messages || [])
        .filter((m) => (!scope.job_id || m.job_id === scope.job_id) && (!scope.booking_id || m.booking_id === scope.booking_id))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    const s = await getSB();
    let q = s.from("messages").select("*").order("created_at", { ascending: true });
    if (scope.job_id) q = q.eq("job_id", scope.job_id);
    if (scope.booking_id) q = q.eq("booking_id", scope.booking_id);
    const { data } = await q;
    return data || [];
  }

  // ---------------- FOTO'S ----------------
  async function uploadJobFoto(file) {
    if (DEMO) {
      return { url: URL.createObjectURL(file), error: null };
    }
    const s = await getSB();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = "klus-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    const { error } = await s.storage.from("klus-fotos").upload(path, file, { contentType: file.type || "image/jpeg" });
    if (error) return { error };
    const { data } = s.storage.from("klus-fotos").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  }

  // ---------------- PORTFOLIO (werkfoto's aanbieder) ----------------
  async function uploadPortfolioFoto(file) {
    if (DEMO) return { url: URL.createObjectURL(file), error: null };
    const s = await getSB();
    const u = await s.auth.getUser();
    const uid = u.data && u.data.user ? u.data.user.id : null;
    if (!uid) return { error: { message: "Niet ingelogd" } };
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = uid + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    const { error } = await s.storage.from("portfolio-fotos").upload(path, file, { contentType: file.type || "image/jpeg" });
    if (error) return { error };
    const { data } = s.storage.from("portfolio-fotos").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  }

  async function addPortfolio(providerId, fotoUrl, titel) {
    if (DEMO) return { data: null, error: null };
    const s = await getSB();
    const { data, error } = await s.from("portfolio").insert({ provider_id: providerId, foto_url: fotoUrl, titel: titel || null }).select().single();
    return { data, error };
  }

  async function getPortfolio(providerId) {
    if (DEMO) return [];
    const s = await getSB();
    const { data } = await s.from("portfolio").select("*").eq("provider_id", providerId).order("created_at", { ascending: false });
    return data || [];
  }

  async function deletePortfolioFoto(id) {
    if (DEMO) return { error: null };
    const s = await getSB();
    const { data: row } = await s.from("portfolio").select("foto_url").eq("id", id).single();
    const { error } = await s.from("portfolio").delete().eq("id", id);
    if (row && row.foto_url) {
      const m = String(row.foto_url).match(/portfolio-fotos\/(.+)$/);
      if (m) await s.storage.from("portfolio-fotos").remove([m[1]]);
    }
    return { error };
  }

  // ---------------- VAKGEBIEDEN (aanbieder) ----------------
  async function getProviderCategories(providerId) {
    if (DEMO) return (demoGet().provider_categories || []).filter(x => x.provider_id === providerId).map(x => x.category_id);
    const s = await getSB();
    const { data } = await s.from("provider_categories").select("category_id").eq("provider_id", providerId);
    return (data || []).map(r => r.category_id);
  }

  async function setProviderCategories(providerId, categoryIds) {
    if (DEMO) {
      const d = demoGet();
      d.provider_categories = (d.provider_categories || []).filter(x => x.provider_id !== providerId);
      categoryIds.forEach(cid => d.provider_categories.push({ provider_id: providerId, category_id: Number(cid) }));
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    await s.from("provider_categories").delete().eq("provider_id", providerId);
    if (categoryIds.length) {
      const rows = categoryIds.map(cid => ({ provider_id: providerId, category_id: Number(cid) }));
      const { error } = await s.from("provider_categories").insert(rows);
      return { error };
    }
    return { error: null };
  }

  // ---------------- BESCHIKBAARHEID (aanbieder) ----------------
  async function getAvailability(providerId) {
    if (DEMO) return (demoGet().availability || []).filter(x => x.provider_id === providerId);
    const s = await getSB();
    const { data } = await s.from("availability").select("*").eq("provider_id", providerId).order("dag");
    return data || [];
  }

  async function setAvailability(providerId, entries) {
    if (DEMO) {
      const d = demoGet();
      d.availability = (d.availability || []).filter(x => x.provider_id !== providerId);
      entries.forEach(en => d.availability.push({ id: uid(), provider_id: providerId, ...en }));
      demoSave(d);
      return { error: null };
    }
    const s = await getSB();
    await s.from("availability").delete().eq("provider_id", providerId);
    if (entries.length) {
      const rows = entries.map(en => ({ provider_id: providerId, dag: en.dag, start_tijd: en.start_tijd, eind_tijd: en.eind_tijd }));
      const { error } = await s.from("availability").insert(rows);
      return { error };
    }
    return { error: null };
  }

  // ---------------- EXPORT ----------------
  window.SF = {
    DEMO,
    // auth
    signUp, signIn, signOut, currentUser, getProfile, updateProfile,
    resetPassword, updatePassword, exchangeCode,
    // data
    getCategories,
    getServices, getService, createService, myServices, updateServiceStatus, deleteService,
    getJobs, getJob, createJob, myJobs, deleteJob, updateJobStatus,
    getBids, bidOnJob, myBids, chooseBid,
    createBooking, myBookings, updateBookingStatus,
    getReviewsForUser, addReview,
    // verificatie & certificering
    myCertifications, addCertification, getVerifiedCertifications, isVerified,
    // AVG / data
    requestData, exportMyData, deleteAccount,
    // helpers
    commisssie: C.COMMISSIE_PERCENT,
    naam: C.PLATFORM_NAAM,
    // prijs / verdienmodel
    serviceKosten, spoedToeslag, prijsOpbouw,
    spoedTiers: C.SPOED_TIERS,
    // AI / categorisatie
    categoriseerTekst,
    // matching
    getProviders, matchProviders, radiusNu, vergoedingNu, matchingStatus,
    // chat
    sendMessage, getMessages,
    // foto's
    uploadJobFoto,
    // portfolio (werkfoto's aanbieder)
    uploadPortfolioFoto, addPortfolio, getPortfolio, deletePortfolioFoto,
    // vakgebieden + beschikbaarheid
    getProviderCategories, setProviderCategories, getAvailability, setAvailability,
  };
})();
