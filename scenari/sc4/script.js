/** CyberDrill SC4 — monitoraggio SERVER‑ERP fino all’isolamento logico (air‑gap). */
(function () {
  const W = 120;
  const H = 44;
  const BASE_Y = 38;

  let rafId = 0;
  let isolated = false;
  let t0 = performance.now();

  function setTicker(html) {
    const el = document.getElementById("ticker");
    if (el) el.innerHTML = html;
  }

  /** Genera punti stabili sul verde */
  function pointsSapHealthy(tick) {
    const n = 14;
    const arr = [];
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * W;
      const jitter = Math.sin(i * 0.7 + tick * 2.8) * 1.8;
      arr.push({
        x,
        y: 12 + jitter + (i % 3) * 0.35,
      });
    }
    return arr;
  }

  function pointsSessHealthy(tick) {
    const n = 14;
    const arr = [];
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * W;
      arr.push({
        x,
        y:
          Math.min(
            BASE_Y - 4,
            28 - i * 0.55 + Math.sin(i * 0.5 + tick * 4) * 2.8
          ),
      });
    }
    return arr;
  }

  function pointsDbHealthy(tick) {
    const n = 14;
    const arr = [];
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * W;
      arr.push({
        x,
        y: 26 + Math.sin(i * 0.4 + tick * 3) * 2.2 + (Math.sin(i) * 1.5) % 2,
      });
    }
    return arr;
  }

  /** Post-isolamento: serie «spentate» sulla LAN pubblicata prima */
  function pointsSapOffline() {
    return [
      { x: 0, y: 10 },
      { x: W * 0.35, y: 9 },
      { x: W * 0.72, y: BASE_Y },
      { x: W, y: BASE_Y },
    ];
  }

  function pointsSessCliff() {
    return [
      { x: 0, y: 12 },
      { x: W * 0.45, y: 10 },
      { x: W * 0.48, y: BASE_Y },
      { x: W * 0.52, y: BASE_Y },
      { x: W * 0.55, y: BASE_Y },
      { x: W, y: BASE_Y },
    ];
  }

  function pointsDbProtected() {
    return [
      { x: 0, y: 30 },
      { x: W * 0.25, y: 32 },
      { x: W * 0.55, y: 18 },
      { x: W * 0.78, y: 20 },
      { x: W, y: 22 },
    ];
  }

  function lineD(pts) {
    if (!pts.length) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    }
    return d;
  }

  function areaD(pts) {
    if (!pts.length) return "";
    const top = lineD(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${top} L ${last.x.toFixed(1)} ${BASE_Y + 8} L ${first.x.toFixed(1)} ${BASE_Y + 8} Z`;
  }

  function drawPair(prefix, pts) {
    const lineEl = document.getElementById("line-" + prefix);
    const fillEl = document.getElementById("fill-" + prefix);
    if (!lineEl) return;
    const d = lineD(pts);
    const f = areaD(pts);
    lineEl.setAttribute("d", d);
    if (fillEl) fillEl.setAttribute("d", f);
  }

  function tickCharts() {
    if (isolated) return;
    const now = performance.now();
    const tick = (now - t0) / 1200;

    drawPair("sap", pointsSapHealthy(tick));
    drawPair("sess", pointsSessHealthy(tick));
    drawPair("db", pointsDbHealthy(tick));

    rafId = requestAnimationFrame(tickCharts);
  }

  function startAnimations() {
    t0 = performance.now();
    rafId = requestAnimationFrame(tickCharts);
  }

  function stopAnimations() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function runIsolate() {
    if (isolated) return;
    isolated = true;
    stopAnimations();

    const btn = document.getElementById("btnIsolate");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Isolamento in corso…";
    }

    setTicker(
      '<span class="hi">AZIONE</span> VLAN ERP‑CORE: bridge verso client interrotto — <span>SAP non raggiungibile dalla LAN (comportamento atteso).</span>'
    );

    ["pathLan", "pathSrv", "pathWan"].forEach((id, i) => {
      const p = document.getElementById(id);
      setTimeout(() => {
        if (!p) return;
        p.classList.remove("live");
        p.classList.add("cut");
      }, i * 420);
    });

    setTimeout(() => {
      const log = document.getElementById("isoLog");
      if (log) {
        log.innerHTML =
          '<span class="ok">✓</span> BGP interno ERP — sessione peer in stato hold<br>' +
          '<span class="ok">✓</span> VLAN client → SERVER‑ERP — bloccati nuovi flussi entranti<br>' +
          '<span class="ok">✓</span> ACL traffico nord/sud ERP — stato obsoleto (host non pubblicato)';
      }
      applyIsolatedDashboard();
      if (btn) {
        btn.textContent = "SERVER‑ERP in isolamento logico (air‑gap)";
        btn.style.opacity = "0.65";
      }
    }, 1500);

    setTimeout(showDoneModal, 4500);
  }

  function applyIsolatedDashboard() {
    const grid = document.getElementById("dashGrid");

    grid?.classList.add("iso-phase");

    document.querySelectorAll(".mirror-card.alive-pulse").forEach((el) =>
      el.classList.remove("alive-pulse")
    );

    document.getElementById("mirror-sap")?.classList.add("iso-off");
    const vs = document.getElementById("val-sap");
    const ss = document.getElementById("sub-sap");
    if (vs) {
      vs.textContent = "LAN —";
      vs.style.fontSize = "1.15rem";
    }
    if (ss) {
      ss.textContent =
        "Host non pubblicato sul segmento aziendale. Gli utenti ricevono errore di connessione (voluto).";
    }

    drawPair("sap", pointsSapOffline());

    document.getElementById("mirror-sessioni")?.classList.add("iso-off");
    const vse = document.getElementById("val-sess");
    const su = document.getElementById("sub-sess");
    if (vse) vse.textContent = "0";
    if (su)
      su.textContent =
        "Sessioni GUI/RFC chiuse in forzatura: nessuna sessione sulla rotta verso questo host.";
    drawPair("sess", pointsSessCliff());

    document.getElementById("mirror-ordini")?.classList.add("iso-off");
    const vt = document.getElementById("val-tp");
    const st = document.getElementById("sub-tp");
    if (vt) vt.textContent = "~0";
    if (st)
      st.textContent =
        "Flusso ordini digitale azzerato: logistica su procedure concordate d’emergenza (anche cartacee).";

    document.getElementById("mirror-db")?.classList.add("iso-security");
    const vd = document.getElementById("val-db");
    const sd = document.getElementById("sub-db");
    if (vd) vd.textContent = "ISOL.";
    if (vd) vd.style.letterSpacing = "0.04em";
    if (sd) {
      sd.textContent =
        "Superficie d’attacco laterale molto ridotta sullo stack OS/DB rispetto al segmento precedentemente esposto.";
    }
    drawPair("db", pointsDbProtected());
  }

  function showDoneModal() {
    document.getElementById("doneLayer")?.classList.add("visible");
    document.getElementById("doneLayer")?.setAttribute("aria-hidden", "false");
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTicker(
      'Indicatori operativi in <strong style="color:var(--gr)">stato buono</strong>: non è solo “affidabilità classica”; il punto critico è il '
        + '<span class="hi">percorso verso SERVER‑ERP</span> mentre la compromissione ransomware si muove in orizzontale.'
    );

    drawPair("sap", pointsSapHealthy(0));
    drawPair("sess", pointsSessHealthy(0));
    drawPair("db", pointsDbHealthy(0));
    startAnimations();

    const ack = document.getElementById("ackTradeoff");
    const btn = document.getElementById("btnIsolate");
    ack?.addEventListener("change", () => {
      if (btn) btn.disabled = !ack.checked;
    });

    btn?.addEventListener("click", runIsolate);

    document.getElementById("btnBack")?.addEventListener("click", () => {
      const p = window.opener || window.parent;
      if (p && p !== window) {
        try {
          p.postMessage({ type: "cyberdrill-sc4-complete", ok: true }, "*");
        } catch (_) {}
      }
    });
  });
})();
