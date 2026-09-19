// ============================================================
// MOETNU — chat (klant ↔ klusser)
// Deelbaar tussen klus.html en dienst.html.
// ============================================================
(function () {
  let scope = null;
  let timer = null;
  let me = null;

  async function mount(container, opts) {
    scope = opts;
    const user = await window.SF.currentUser();
    if (!user) {
      container.innerHTML = '<div class="text-muted side-note">Log in om te chatten.</div>';
      return;
    }
    me = user.id;

    container.innerHTML = `
      <div class="panel mt-3 chat-panel">
        <h2>💬 Chat met ${esc(opts.recipient_naam || "de andere partij")}</h2>
        <div class="chat-msgs" id="chat-msgs"><div class="text-muted">Berichten laden…</div></div>
        <form class="chat-form" onsubmit="return window.MoetnuChat.send(event)">
          <input type="text" id="chat-input" placeholder="${esc(opts.placeholder || "Typ je bericht…")}" autocomplete="off" maxlength="2000">
          <button class="btn btn-primary btn-sm" type="submit">Verstuur</button>
        </form>
      </div>`;

    await refresh();
    if (timer) clearInterval(timer);
    timer = setInterval(refresh, 5000);
  }

  async function refresh() {
    if (!scope) return;
    const box = document.getElementById("chat-msgs");
    if (!box) return;
    const msgs = await window.SF.getMessages({ job_id: scope.job_id, booking_id: scope.booking_id });
    if (!msgs.length) {
      box.innerHTML = '<div class="text-muted">Nog geen berichten. Stuur het eerste bericht.</div>';
      return;
    }
    box.innerHTML = msgs.map((m) => {
      const mine = m.sender_id === me;
      const tijd = new Date(m.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
      return `<div class="chat-msg ${mine ? "mine" : "theirs"}">
        <div class="chat-bubble">${esc(m.tekst)}</div>
        <div class="chat-time">${tijd}</div>
      </div>`;
    }).join("");
    box.scrollTop = box.scrollHeight;
  }

  async function send(e) {
    e.preventDefault();
    if (!scope) return false;
    const input = document.getElementById("chat-input");
    const tekst = (input.value || "").trim();
    if (!tekst) return false;
    const user = await window.SF.currentUser();
    if (!user) return false;
    const { error } = await window.SF.sendMessage({
      job_id: scope.job_id || null,
      booking_id: scope.booking_id || null,
      sender_id: user.id,
      recipient_id: scope.recipient_id,
      tekst,
    });
    if (error) { toast(error.message || "Fout bij verzenden", "error"); return false; }
    input.value = "";
    await refresh();
    return false;
  }

  window.MoetnuChat = { mount, refresh, send };
})();
