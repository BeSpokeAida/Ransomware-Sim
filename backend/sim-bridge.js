/**
 * CyberDrill · bridge iframe laboratori esterni.
 * Dipende da: `backend/routes.json` (URL relativo alla pagina sim) + overlay #labOverlay in pagina madre.
 */
(function () {
  const FALLBACK = {
    version: 1,
    returnDelayMs: 2000,
    labs: {
      sc2: { path: "scenari/sc2/index.html", event: "cyberdrill-sc2-complete" },
      sc4: { path: "scenari/sc4/index.html", event: "cyberdrill-sc4-complete" },
      sc7: { path: "scenari/sc7/index.html", event: "cyberdrill-sc7-complete" },
      "sc7.netChaos": { path: "scenari/sc7/index.html", event: "cyberdrill-sc7-complete" },
      sc10: { path: "scenari/sc10/index.html", event: "cyberdrill-sc10-complete" },
      sc11: { path: "scenari/sc11/index.html", event: "cyberdrill-sc11-complete" },
      crisisA: { path: "scenari/crisis-a/index.html", event: "cyberdrill-crisis-a-complete" },
      crisisC: { path: "scenari/crisis-c/index.html", event: "cyberdrill-crisis-c-complete" },
    },
  };

  let config = FALLBACK;

  /** Invia ai lab aperti lo stesso countdown della sim (sync con `__cyberdrillRemainSec`). */
  function isLabOpen() {
    var o = document.getElementById("labOverlay");
    return !!(o && o.classList.contains("show"));
  }

  function postClockToLabFrame() {
    var overlay = document.getElementById("labOverlay");
    var frame = document.getElementById("labFrame");
    if (!overlay || !frame || !overlay.classList.contains("show")) return;
    var rem = 2400;
    try {
      if (typeof window.__cyberdrillRemainSec === "function") rem = window.__cyberdrillRemainSec();
    } catch (_) {}
    try {
      var w = frame.contentWindow;
      if (w)
        w.postMessage(
          { type: "cyberdrill-sim-clock", remainingSec: Math.max(0, rem | 0) },
          "*"
        );
    } catch (_) {}
  }

  function mergeLabConfig(json) {
    if (!json || typeof json !== "object") return;
    config = {
      returnDelayMs: typeof json.returnDelayMs === "number" ? json.returnDelayMs : FALLBACK.returnDelayMs,
      labs: Object.assign({}, FALLBACK.labs, json.labs || {}),
    };
  }

  function resolveLabEvent(evSnap) {
    const id = evSnap && evSnap.id;
    const variant = evSnap && evSnap.variant;
    if (!id) return null;
    const keyVar = variant ? id + "." + variant : null;
    if (keyVar && config.labs[keyVar]) return { key: keyVar, cfg: config.labs[keyVar] };
    if (config.labs[id]) return { key: id, cfg: config.labs[id] };
    return null;
  }

  function resolveFrameUrl(relPath) {
    try {
      return new URL(relPath, window.location.href).href;
    } catch (_) {
      return relPath;
    }
  }

  /**
   * @param {{id:string,variant?:string}} evSnap
   * @param {{q:string}} ch - scelta
   * @param {Function} finalize - sempre chiamata dopo lab (ritardo incluso) o subito senza lab
   */
  function openLabGate(evSnap, ch, finalize) {
    if (typeof finalize !== "function") return;

    const pair = resolveLabEvent(evSnap);
    if (!pair || !ch || ch.q !== "good") {
      finalize();
      return;
    }

    const overlay = document.getElementById("labOverlay");
    const frame = document.getElementById("labFrame");
    const subtitle = document.getElementById("labSubtitle");

    if (!overlay || !frame) {
      console.warn("[CyberDrillLabs] overlay mancante, salto iframe");
      finalize();
      return;
    }

    const { cfg } = pair;
    if (subtitle) {
      subtitle.textContent =
        "Completa il laboratorio tecnico — al termine tornerà la chat dopo " +
        (config.returnDelayMs / 1000).toFixed(1).replace(/\.0$/, "") +
        " s per leggere l’istantanea sulla sim principale.";
    }

    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("show");

    function onFrameLoad() {
      frame.removeEventListener("load", onFrameLoad);
      postClockToLabFrame();
    }
    frame.addEventListener("load", onFrameLoad);

    const onMsg = function (e) {
      try {
        if (!e || !e.data || e.data.type !== cfg.event || e.data.ok === false) return;
      } catch (_) {
        return;
      }
      window.removeEventListener("message", onMsg);
      frame.removeAttribute("src");
      try {
        frame.src = "about:blank";
      } catch (_) {}
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");

      window.setTimeout(function () {
        finalize();
      }, config.returnDelayMs);
    };

    window.addEventListener("message", onMsg, false);
    frame.src = resolveFrameUrl(cfg.path);
  }

  window.CyberDrillLabs = {
    reloadRoutes: function () {
      return fetch("./backend/routes.json", { cache: "no-store" })
        .then(function (r) {
          return r.ok ? r.json() : FALLBACK;
        })
        .then(mergeLabConfig)
        .catch(function () {
          mergeLabConfig(FALLBACK);
        });
    },

    resolveLabEvent,

    /** Usato dai pick `good`: dopo messaggio Luca, apre eventualmente iframe e poi invoca finalize (→ prossimo scenario). */
    openLabGate,

    getDelayMs: function () {
      return config.returnDelayMs;
    },

    postClockToLabFrame,

    /** True solo con overlay lab visibile: la sim madre può usare per non avanzare spread. */
    isLabOpen,

    /** @deprecated Usa isLabOpen. */
    isSuspended: function () {
      return false;
    },
  };

  mergeLabConfig(FALLBACK);
  if (typeof window.fetch === "function") {
    window.CyberDrillLabs.reloadRoutes().catch(function () {});
  }
})();
