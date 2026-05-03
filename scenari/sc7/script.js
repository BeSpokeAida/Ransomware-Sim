/** CyberDrill SC7 — esfiltrazione attiva: conservazione forense, poi blocco WAN sul perimetro. */
(function () {
  let forensicOn = false;
  let internetOn = false;
  let rafPkt = 0;
  let rafSpark = 0;
  let t0 = performance.now();

  function setTicker(html) {
    const el = document.getElementById("ticker");
    if (el) el.innerHTML = html;
  }

  function animatePacket() {
    if (internetOn) return;
    const t = (performance.now() - t0) / 2400;
    const p = t % 1;
    const eased = p * p * (3 - 2 * p);
    const x = 136 + (264 - 136) * eased;
    const dot = document.getElementById("pktDot");
    if (dot) dot.setAttribute("cx", x.toFixed(1));
    rafPkt = requestAnimationFrame(animatePacket);
  }

  function sparkPathForExfil(phase) {
    const n = 28;
    let d = "M 0 " + (34 - Math.sin(0) * 4);
    for (let i = 1; i <= n; i++) {
      const x = (i / n) * 200;
      const wave =
        Math.sin(i * 0.45 + phase * 3.2) * (7 + phase * 1.8) +
        Math.sin(i * 0.2 + phase) * 3;
      const y = Math.min(32, Math.max(4, 20 - wave * 0.35));
      d += " L " + x.toFixed(1) + " " + y.toFixed(1);
    }
    return d;
  }

  function sparkLoop() {
    if (internetOn) return;
    const phase = (performance.now() - t0) / 950;
    const sp = document.getElementById("sparkPath");
    if (sp) sp.setAttribute("d", sparkPathForExfil(phase));
    rafSpark = requestAnimationFrame(sparkLoop);
  }

  function startLoops() {
    t0 = performance.now();
    rafPkt = requestAnimationFrame(animatePacket);
    rafSpark = requestAnimationFrame(sparkLoop);
  }

  function stopLoops() {
    cancelAnimationFrame(rafPkt);
    cancelAnimationFrame(rafSpark);
    const dot = document.getElementById("pktDot");
    if (dot) {
      dot.setAttribute("opacity", "0.25");
      dot.classList.remove("on");
    }
  }

  function applyInternetCut() {
    internetOn = true;
    stopLoops();

    const path = document.getElementById("pathFlow");
    path?.classList.remove("active");
    path?.classList.add("idle");

    const led = document.getElementById("edgeLed");
    if (led) led.setAttribute("fill", "#2d5a41");

    const kpiVol = document.getElementById("kpiVol");
    const kpiVal = document.getElementById("kpiVal");
    const kpiStrip = document.getElementById("kpiStrip");
    const sparkBox = document.getElementById("sparkBox");
    const sp = document.getElementById("sparkPath");

    kpiVol?.classList.add("safe-z");
    document.getElementById("kpiDst")?.classList.add("safe-z");
    if (kpiVal) {
      kpiVal.textContent = "≈0";
      kpiVal.style.fontSize = "1.25rem";
    }
    sparkBox?.classList.add("cold");
    if (sp) sp.setAttribute("d", "M 0 28 Q 50 29 100 26 T 200 28");

    document.getElementById("swInternet")?.classList.add("on");
    document.getElementById("swInternet").setAttribute("aria-pressed", "true");

    setTicker(
      '<span class="hi">Traffico in uscita</span> fermato su EDGE‑INET — i netflow preservati sono disponibili sul livello di correlazione · '
      + '<span style="color:var(--mu)">I movimenti laterali sulla LAN possono essere indipendenti da questo pannello.</span>'
    );

    document.getElementById("bannerOrder").style.display = "none";
    const hint = document.getElementById("hintDone");
    if (hint) {
      hint.textContent =
        "✓ Log e buffer circolari allineati allo snapshot forense · ✓ Rotta predefinita WAN non più instradata verso gli ISP di confine.";
      hint.classList.add("show");
    }

    setTimeout(() => {
      document.getElementById("doneLayer")?.classList.add("visible");
      document.getElementById("doneLayer")?.setAttribute("aria-hidden", "false");
    }, 3200);
  }

  function toggleForensic(btn) {
    if (internetOn) return;
    forensicOn = !forensicOn;
    btn.classList.toggle("on", forensicOn);
    btn.setAttribute("aria-pressed", forensicOn ? "true" : "false");
    if (forensicOn) btn.classList.add("forensic-theme");
    else btn.classList.remove("forensic-theme");

    const logStack = document.getElementById("logStack");
    logStack?.classList.toggle("locked", forensicOn);

    const wanSw = document.getElementById("swInternet");
    wanSw?.classList.toggle("dim", !forensicOn);

    setTicker(
      forensicOn
        ? '<span style="color:var(--bl)">Snapshot forense</span> impegnato sul livello di correlazione — ora si può interrompere la WAN senza compromettere la catena probatoria.'
        : '<span class="hi">Allerta</span> esfiltrazione osservata verso 185.220.101.0/24 — predisporre la preservazione prima di modifiche drastiche sulla rotta predefinita.'
    );
  }

  function tryInternet(btn) {
    if (!forensicOn) {
      const b = document.getElementById("bannerOrder");
      b?.classList.add("shake");
      setTimeout(() => b?.classList.remove("shake"), 600);
      return;
    }
    if (internetOn) return;
    applyInternetCut();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("edgeLed")?.setAttribute("fill", "#c84838");

    setTicker(
      'Individuata <strong>esfiltrazione attiva</strong> oltre il perimetro logico · '
      + '<span class="hi">priorità alla catena forense prima dell’interruzione della WAN</span> (policy IR Meridian).'
    );
    startLoops();

    const sf = document.getElementById("swForensic");
    const si = document.getElementById("swInternet");

    sf?.addEventListener("click", () => toggleForensic(sf));
    si?.addEventListener("click", () => tryInternet(si));

    document.getElementById("btnBack")?.addEventListener("click", () => {
      const p = window.opener || window.parent;
      if (p && p !== window) {
        try {
          p.postMessage({ type: "cyberdrill-sc7-complete", ok: true }, "*");
        } catch (_) {}
      }
    });
  });
})();
