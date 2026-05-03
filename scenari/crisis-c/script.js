/** CyberDrill Crisis C — tre onde di reset dominio · timer accelerato sulla console lab. */
(function () {
  const TOTAL_SEC = 30 * 60;
  let simSec = TOTAL_SEC;
  let timerId = 0;

  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }

  function tickClock() {
    const el = document.getElementById("clock");
    if (!el) return;
    el.textContent = fmt(simSec);
    if (simSec <= 0) {
      clearInterval(timerId);
      timerId = 0;
      return;
    }
    simSec = Math.max(0, simSec - 18);
  }

  function startFastClock() {
    if (timerId) return;
    timerId = setInterval(tickClock, 400);
  }

  function runWave(btn, bar, nextBtn, pct, delayNext) {
    btn.disabled = true;
    requestAnimationFrame(() => {
      bar.style.width = pct + "%";
    });
    setTimeout(() => {
      if (nextBtn) nextBtn.disabled = false;
      if (delayNext) delayNext();
    }, 950);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("ack").addEventListener("change", (e) => {
      document.getElementById("bw1").disabled = !e.target.checked;
    });

    document.getElementById("bw1").addEventListener("click", () => {
      startFastClock();
      runWave(
        document.getElementById("bw1"),
        document.getElementById("pf1"),
        document.getElementById("bw2"),
        100
      );
    });

    document.getElementById("bw2").addEventListener("click", () =>
      runWave(
        document.getElementById("bw2"),
        document.getElementById("pf2"),
        document.getElementById("bw3"),
        100
      )
    );

    document.getElementById("bw3").addEventListener("click", () =>
      runWave(
        document.getElementById("bw3"),
        document.getElementById("pf3"),
        null,
        100,
        () => {
          setTimeout(() => {
            clearInterval(timerId);
            document.getElementById("clock").textContent = "00:00";
            document.getElementById("clock").style.color = "var(--gr)";
            document.getElementById("done").classList.add("vis");
          }, 650);
        }
      )
    );

    document.getElementById("btnBack").addEventListener("click", () => {
      try {
        window.opener?.postMessage?.({ type: "cyberdrill-crisis-c-complete", ok: true }, "*");
        window.parent?.postMessage?.({ type: "cyberdrill-crisis-c-complete", ok: true }, "*");
      } catch (_) {}
    });
  });
})();
