/**
 * Cronometro incidente CyberDrill: riceve dai parent gli aggiornamenti e replica il TEMPO in alto a destra.
 * Accoppiamento: postMessage type "cyberdrill-sim-clock" { remainingSec: number }
 */
(function () {
  var WRAP_ID = "cyberdrillIncidentClockWrap";
  var VAL_ID = "cyberdrillIncidentClockVal";

  function fmt(sec) {
    sec = Math.max(0, sec | 0);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function ensureChrome() {
    if (document.getElementById(WRAP_ID)) return;
    var st = document.createElement("style");
    st.textContent =
      "#" +
      WRAP_ID +
      "{position:fixed;top:11px;right:12px;z-index:99999;display:flex;align-items:center;gap:8px;" +
      "background:rgba(19,22,27,.94);backdrop-filter:saturate(1.2) blur(8px);" +
      "border:1px solid #252b35;border-radius:8px;padding:7px 12px;font-family:IBM Plex Mono,monospace;" +
      "font-size:.58rem;letter-spacing:.07em;color:#6b7385;box-shadow:0 8px 24px rgba(0,0,0,.35)}#" +
      WRAP_ID +
      " .cd-lbl{color:#6b7385;text-transform:uppercase}#" +
      WRAP_ID +
      " #cyberdrillIncidentClockVal{font-size:.95rem;font-weight:600;color:#f0c040;min-width:44px;text-align:right}" +
      "#" +
      WRAP_ID +
      " #cyberdrillIncidentClockVal.crit{color:#e84040;animation:cdb .85s step-end infinite}@keyframes cdb{50%{opacity:.35}}";
    document.head.appendChild(st);
    var w = document.createElement("div");
    w.id = WRAP_ID;
    w.setAttribute("aria-live", "off");
    w.innerHTML =
      '<span class="cd-lbl">TEMPO</span><span id="' +
      VAL_ID +
      '" class="">' +
      fmt(2400) +
      "</span>";
    document.body.appendChild(w);
  }

  function applyRemaining(rem) {
    ensureChrome();
    var v = document.getElementById(VAL_ID);
    if (!v) return;
    v.textContent = fmt(rem | 0);
    v.className = rem <= 300 ? "crit" : "";
  }

  window.addEventListener(
    "message",
    function (e) {
      try {
        if (!e.data || e.data.type !== "cyberdrill-sim-clock") return;
        applyRemaining(e.data.remainingSec);
      } catch (_) {}
    },
    false
  );

  ensureChrome();
})();
