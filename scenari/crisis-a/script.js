/** CyberDrill Crisis A — segmentazione ADMIN‑01; chiusura con postMessage verso il parent della simulazione. */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("ticker").textContent =
      "Allerta correlata: secondo beacon · PC‑ADMIN‑01 · pattern tipo replication driver · picco delle sessioni amministrative mentre la bonifica sulla share principale è in corso.";
    document.getElementById("btnIso").addEventListener("click", () => {
      const box = document.getElementById("admBox");
      box.classList.remove("host-danger");
      box.classList.add("host-muted");
      const f2 = document.getElementById("f2");
      f2.style.opacity = "1";
      f2.classList.remove("active");
      f2.classList.add("kill");

      document.getElementById("f1").classList.remove("active");
      document.getElementById("f1").classList.add("kill");

      document.getElementById("btnIso").disabled = true;
      document.getElementById("btnRev").disabled = false;
      document.getElementById("note").innerHTML =
        "Host segnato come non conforme (stale) sulle policy NAC.<br>I token amministrativi attivi non dovrebbero più avere percorso SMB verso SERVER01‑SHARE finché l’isolamento resta attivo.";
    });

    document.getElementById("btnRev").addEventListener("click", () => {
      document.getElementById("btnRev").disabled = true;
      document.getElementById("done").classList.add("visible");
    });

    document.getElementById("btnBack")?.addEventListener("click", () => {
      try {
        window.opener?.postMessage?.({ type: "cyberdrill-crisis-a-complete", ok: true }, "*");
        window.parent?.postMessage?.({ type: "cyberdrill-crisis-a-complete", ok: true }, "*");
      } catch (_) {}
    });
  });
})();
