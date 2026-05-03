/** CyberDrill SC2 — contenimento fisico + taglio VLAN sul segmento SERVER01‑SHARE. */
(function () {
  const THRESH_RATIO = 0.72;

  function setTicker(text) {
    const el = document.getElementById("ticker");
    if (el) el.innerHTML = text;
  }

  function updatePaths(jackEl, dy) {
    const track = jackEl.querySelector(".cable-track");
    const path = jackEl.querySelector(".cable-path");
    const hi = jackEl.querySelector(".cable-highlight");
    if (!track || !path) return;

    const w = track.offsetWidth || 200;
    const svg = jackEl.querySelector(".cable-svg");
    if (svg) {
      svg.setAttribute("viewBox", `0 0 ${Math.max(w, 200)} 72`);
    }

    const x0 = 28;
    const y0 = 8;
    const x1 = 28;
    const y1 = 8 + dy;
    const cx = Math.max(w * 0.45, x0 + 40);
    const d = `M ${x0} ${y0} Q ${cx} ${(y0 + y1) / 2 + 14} ${x1} ${y1}`;
    path.setAttribute("d", d);
    if (hi) hi.setAttribute("d", d);
  }

  function bindJack(jackEl) {
    const track = jackEl.querySelector(".cable-track");
    const plug = jackEl.querySelector(".plug");
    if (!track || !plug) return;

    const maxY = parseInt(track.dataset.maxY || "90", 10);
    let y = 0;
    let dragging = false;

    function apply(forceUnplugged) {
      updatePaths(jackEl, y);
      plug.style.transform = `translate(${8}px, ${4 + y}px)`;
      const unplugged =
        forceUnplugged ||
        jackEl.classList.contains("unplugged") ||
        y >= maxY * THRESH_RATIO;

      if (unplugged && !jackEl.classList.contains("unplugged")) {
        jackEl.classList.add("unplugged");
        y = maxY * 1.05;
        plug.style.transform = `translate(${8}px, ${4 + y}px)`;
        updatePaths(jackEl, y);
        plug.setAttribute("aria-valuenow", String(Math.round(maxY)));
        checkBothUnplugged();
      } else {
        plug.setAttribute("aria-valuenow", String(Math.round(y)));
      }
    }

    function pointerDown(ev) {
      if (jackEl.classList.contains("unplugged")) return;
      ev.preventDefault();
      dragging = true;
      jackEl.classList.add("is-dragging");
      plug.setPointerCapture(ev.pointerId);
    }

    function pointerMove(ev) {
      if (!dragging || jackEl.classList.contains("unplugged")) return;
      const rect = track.getBoundingClientRect();
      const localY = Math.max(
        0,
        Math.min(maxY + 14, ev.clientY - rect.top - 22)
      );
      y = localY;
      apply(false);
      if (y >= maxY * THRESH_RATIO) {
        dragging = false;
        jackEl.classList.remove("is-dragging");
        jackEl.querySelector(".plug")?.releasePointerCapture?.(ev.pointerId);
      }
    }

    function pointerUp(ev) {
      dragging = false;
      jackEl.classList.remove("is-dragging");
      try {
        plug.releasePointerCapture(ev.pointerId);
      } catch (_) {}
      apply(false);
    }

    plug.addEventListener("pointerdown", pointerDown);
    plug.addEventListener("pointermove", pointerMove);
    plug.addEventListener("pointerup", pointerUp);
    plug.addEventListener("pointercancel", pointerUp);

    plug.addEventListener("keydown", (ev) => {
      if (jackEl.classList.contains("unplugged")) return;
      const step = 12;
      if (ev.key === "ArrowDown" || ev.key === "PageDown") {
        ev.preventDefault();
        y = Math.min(maxY, y + step);
        apply(false);
      } else if (ev.key === "ArrowUp" || ev.key === "PageUp") {
        ev.preventDefault();
        y = Math.max(0, y - step);
        apply(false);
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        apply(true);
      }
    });

    window.addEventListener("resize", () => apply(false));
    apply(false);
  }

  let bothDone = false;
  function checkBothUnplugged() {
    const j1 = document.getElementById("jack1");
    const j2 = document.getElementById("jack2");
    const panelSw = document.getElementById("panelSw");
    const rackPanel = document.getElementById("panelRack");
    const btnIso = document.getElementById("btnIsolate");
    if (j1?.classList.contains("unplugged") && j2?.classList.contains("unplugged")) {
      panelSw?.classList.add("unlocked");
      rackPanel?.classList.add("jack-complete");
      document.getElementById("segLocal")?.classList.add("contained");
      bothDone = true;
      if (btnIso) btnIso.disabled = false;
      setTicker(
        '<span>Locale:</span> segmento storage fermato fisicamente · <span>Resto LAN:</span> postazioni ancora esposte — la minaccia ransomware può proseguire fuori da questo hop.'
      );
    }
  }

  function buildPorts() {
    const row = document.getElementById("portRow");
    if (!row) return;
    const nums = ["09", "10", "11", "12", "13", "14", "15", "16"];
    nums.forEach((num) => {
      const p = document.createElement("div");
      p.className = "port live";
      p.setAttribute("role", "img");
      p.setAttribute(
        "aria-label",
        num === "12" || num === "13"
          ? `Porta ${num} trunk SERVER01‑SHARE · VLAN‑12`
          : `Porta ${num} altro traffico`
      );
      const isTarget = num === "12" || num === "13";
      const label = isTarget ? `<strong>${num}</strong>` : num;
      p.innerHTML = `<span class="p-num">${label}</span>`;
      if (isTarget) p.classList.add("target");
      row.appendChild(p);
    });
  }

  function runIsolateAnimation() {
    const targets = document.querySelectorAll(".port.target:not(.blocked)");
    targets.forEach((p, i) => {
      setTimeout(() => {
        p.classList.remove("live");
        p.classList.add("blocked");
      }, i * 220);
    });
  }

  function showDone() {
    const layer = document.getElementById("doneLayer");
    layer?.classList.add("visible");
    layer?.setAttribute("aria-hidden", "false");
    setTicker(
      '<span>VLAN‑12 / SERVER01‑SHARE</span>: STP BLK + scollegamento fisico confermati · <span>ambito solo questo hop</span> · altrove rete ancora coordinata dall’IR.'
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTicker(
      '<span>Contesto:</span> indicatori LockBit sulla condivisione SMB <code>\\\\SERVER01-SHARE\\Acquisti</code> '
      + '(il nome dell’host è <strong>SERVER01‑SHARE</strong>; <em>Acquisti</em> è solo il nome della share reparto). '
      + 'Questa console interviene solo sul segmento della share; altre parti della LAN restano sotto monitoraggio del team IR.'
    );
    buildPorts();
    document.querySelectorAll(".jack-unit").forEach(bindJack);

    document.getElementById("btnIsolate")?.addEventListener("click", () => {
      const panel = document.getElementById("panelSw");
      if (!panel?.classList.contains("unlocked")) return;
      const btn = document.getElementById("btnIsolate");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Isolamento in corso…";
      }
      runIsolateAnimation();
      setTimeout(() => {
        if (btn) {
          btn.textContent = "VLAN-12 · BLK confermato";
          btn.style.background = "var(--gr)";
          btn.style.color = "#081210";
        }
        showDone();
      }, 900);
    });

    document.getElementById("btnBack")?.addEventListener("click", () => {
      const parent = window.opener || window.parent;
      if (parent && parent !== window) {
        try {
          parent.postMessage({ type: "cyberdrill-sc2-complete", ok: true }, "*");
        } catch (_) {}
      }
    });
  });
})();
