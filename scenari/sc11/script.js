(function () {
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("ticker").textContent =
      "Piano restore in air gap: job ripetibile · 847 GB nominali · finestra dati a −8 giorni rispetto al punto zero dell’incidente.";
    document.getElementById("hashBox").textContent =
      "sha256:B4E7────────────────────9C2 · bucket meridian‑rs3 · copia WORM immutabile attestata dall’analista esterno.";

    const stepEls = [...document.querySelectorAll(".steps span")];
    let phase = 1;

    function setPhase(n) {
      phase = n;
      stepEls.forEach((s) => {
        const i = +s.dataset.i;
        s.classList.remove("live", "done");
        if (i < phase) s.classList.add("done");
        else if (i === phase) s.classList.add("live");
      });
      ["st1", "st2", "st3", "st4"].forEach((id, idx) => {
        document.getElementById(id).classList.toggle("visible", idx + 1 === phase);
      });
    }

    document.getElementById("btnVerify").addEventListener("click", (e) => {
      const b = e.currentTarget;
      b.disabled = true;
      document.getElementById("hint1").textContent =
        "Coincidenza verificata · catena di custodia firmata dall’analista forense esterno — procedere con il mount su LAB‑RESTORE.";
      setTimeout(() => {
        phase = 2;
        setPhase(2);
      }, 950);
    });

    document.getElementById("btnMount").addEventListener("click", (e) => {
      e.currentTarget.disabled = true;
      setPhase(3);
    });

    document.getElementById("chkCred").addEventListener("change", (ev) => {
      document.getElementById("btnCred").disabled = !ev.target.checked;
    });

    document.getElementById("btnCred").addEventListener("click", (e) => {
      e.currentTarget.disabled = true;
      setPhase(4);
    });

    const ringFg = document.getElementById("ringFg");
    const circumference = 2 * Math.PI * 45;

    document.getElementById("btnScan").addEventListener("click", (ev) => {
      ev.currentTarget.disabled = true;
      ringFg.style.strokeDasharray = circumference;
      ringFg.style.strokeDashoffset = circumference;
      let pct = 0;
      const iv = setInterval(() => {
        pct = Math.min(100, pct + 6 + Math.random() * 7);
        if (pct >= 94) pct = 100;
        const off = circumference * (1 - pct / 100);
        ringFg.style.strokeDashoffset = off;
        document.getElementById("ringPct").textContent = Math.floor(pct) + "%";
        if (pct >= 100) {
          clearInterval(iv);
          ringFg.classList.add("ready");
          document.getElementById("btnGo").disabled = false;
        }
      }, 140);
    });

    document.getElementById("btnGo").addEventListener("click", () => {
      document.getElementById("doneLayer").classList.add("visible");
    });

    document.getElementById("btnBack")?.addEventListener("click", () => {
      try {
        window.opener?.postMessage?.({ type: "cyberdrill-sc11-complete", ok: true }, "*");
        window.parent?.postMessage?.({ type: "cyberdrill-sc11-complete", ok: true }, "*");
      } catch (_) {}
    });
    setPhase(1);
  });
})();
