(function () {
  const ticker = document.getElementById("ticker");

  function line(chkEl, checked) {
    chkEl.closest(".row-chk")?.classList.toggle("on", checked);
  }

  function allReady() {
    const mim = document.getElementById("inMim")?.checked;
    const scopes = [...document.querySelectorAll(".scope-in")];
    return mim && scopes.length === 4 && scopes.every((c) => c.checked);
  }

  function sync() {
    document.getElementById("btnExec").disabled = !allReady();
    line(document.getElementById("inMim"), document.getElementById("inMim").checked);
    document.querySelectorAll(".scope-in").forEach((c) => line(c, c.checked));
  }

  document.addEventListener("DOMContentLoaded", () => {
    ticker.textContent =
      "Allerta su account SQL‑RFC da postazione non autorizzata — correlata agli indizi Mimikatz su LSASS già osservati nelle analisi.";

    const inMim = document.getElementById("inMim");
    inMim?.addEventListener("change", (e) => {
      line(e.target, e.target.checked);
      sync();
    });
    document.querySelectorAll(".scope-in").forEach((inp) =>
      inp.addEventListener("change", sync)
    );

    document.getElementById("btnExec")?.addEventListener("click", () => {
      const prog = document.getElementById("progDc");
      const btn = document.getElementById("btnExec");
      btn.disabled = true;
      const steps = [
        "DC01 · Chiusura backlog richieste Kerberos…",
        "DC01 · Applicazione PSO «IR-ROTATE-ALL»…",
        "DC02 · Replica oggetti passwordSettings…",
        "Azure AD Connect · requisito MFA impostato…",
        "NetLogon · notifica sessioni (picco richieste atteso)",
      ];
      prog.classList.add("show");
      prog.innerHTML = "";
      steps.forEach((t, i) => {
        setTimeout(() => {
          const d = document.createElement("div");
          d.className = "p-line";
          d.textContent = `✓ ${t}`;
          prog.appendChild(d);
        }, 420 * i);
      });
      setTimeout(() => {
        document.getElementById("doneLayer").classList.add("visible");
        document.getElementById("doneLayer").setAttribute("aria-hidden", "false");
      }, 420 * steps.length + 700);
    });

    document.getElementById("btnBack")?.addEventListener("click", () => {
      const p = window.opener || window.parent;
      try {
        p?.postMessage({ type: "cyberdrill-sc10-complete", ok: true }, "*");
      } catch (_) {}
    });
    sync();
  });
})();
