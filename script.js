(function () {
  const stage = document.getElementById("orbitStage");
  if (!stage) return;

  const slots = Array.from(stage.querySelectorAll(".orbit-slot"));
  const avatars = slots.map((slot) => slot.querySelector(".orbit-avatar"));
  const trails = slots.map((slot) => slot.querySelector(".orbit-trail"));
  const count = slots.length;

  const speedLevels = [22, 38, 60, 95, 150];
  let levelIndex = 0;
  let targetSpeed = speedLevels[0];
  let currentSpeed = speedLevels[0];
  let angle = 0;
  let radius = 0;
  let lastTime = null;

  const TRAIL_STAGGER = 140;
  const TRAIL_VANISH_DURATION = 380;
  const TRAIL_HOLD_DURATION = 220;
  const TRAIL_REAPPEAR_DURATION = 1100;
  const VANISH_EASE = "cubic-bezier(0.6, 0, 0.9, 0.4)";
  const REAPPEAR_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  function computeRadius() {
    const size = stage.clientWidth;
    radius = size / 2 - 48;
  }

  let lastMotionBlur = -1;

  function tick(time) {
    if (lastTime === null) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, dt * 1.6);
    angle = (angle + currentSpeed * dt) % 360;

    // blur() forces a repaint (not just a cheap compositor transform), so
    // only touch the filter string when the value has actually moved —
    // reassigning an unchanged filter every frame was repainting all 8
    // avatars 60x/sec even while speed was steady between level changes.
    const motionBlurRaw = Math.min(3.5, currentSpeed / 45);
    const motionBlur = Math.round(motionBlurRaw * 20) / 20;
    const blurChanged = motionBlur !== lastMotionBlur;
    if (blurChanged) lastMotionBlur = motionBlur;

    for (let i = 0; i < count; i++) {
      const baseAngle = (360 / count) * i;
      const rad = ((baseAngle + angle) * Math.PI) / 180;
      const x = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);

      slots[i].style.transform = `translate(${x}px, ${y}px)`;
      avatars[i].style.transform = `rotate(${-angle}deg)`;
      if (blurChanged) {
        avatars[i].style.filter = `drop-shadow(0 8px 18px rgba(0,0,0,0.12)) blur(${motionBlur}px)`;
      }
    }

    requestAnimationFrame(tick);
  }

  function triggerTrailWave() {
    trails.forEach((trail, i) => {
      setTimeout(() => {
        trail.style.transition = `opacity ${TRAIL_VANISH_DURATION}ms ${VANISH_EASE}, filter ${TRAIL_VANISH_DURATION}ms ${VANISH_EASE}`;
        trail.style.opacity = "0.06";
        trail.style.filter = "blur(24px)";

        setTimeout(() => {
          trail.style.transition = `opacity ${TRAIL_REAPPEAR_DURATION}ms ${REAPPEAR_EASE}, filter ${TRAIL_REAPPEAR_DURATION}ms ${REAPPEAR_EASE}`;
          trail.style.opacity = "1";
          trail.style.filter = "blur(0px)";
        }, TRAIL_VANISH_DURATION + TRAIL_HOLD_DURATION);
      }, i * TRAIL_STAGGER);
    });
  }

  function triggerInitialReveal() {
    const reverseOrder = [...trails].reverse();
    reverseOrder.forEach((trail, i) => {
      setTimeout(() => {
        trail.style.transition = `opacity ${TRAIL_REAPPEAR_DURATION}ms ${REAPPEAR_EASE}, filter ${TRAIL_REAPPEAR_DURATION}ms ${REAPPEAR_EASE}`;
        trail.style.opacity = "1";
        trail.style.filter = "blur(0px)";
      }, i * TRAIL_STAGGER);
    });
  }

  setInterval(() => {
    levelIndex = (levelIndex + 1) % speedLevels.length;
    targetSpeed = speedLevels[levelIndex];
    triggerTrailWave();
  }, 3000);

  computeRadius();
  window.addEventListener("resize", computeRadius);
  triggerInitialReveal();
  requestAnimationFrame(tick);
})();

(function () {
  const slogan = document.querySelector(".hero-slogan");
  if (!slogan) return;

  const text = slogan.textContent;
  slogan.textContent = "";
  slogan.setAttribute("aria-label", text);

  const letterEls = [];
  const words = text.split(" ");

  words.forEach((word, wordIndex) => {
    const wordEl = document.createElement("span");
    wordEl.className = "tw-word";

    Array.from(word).forEach((char) => {
      const letterEl = document.createElement("span");
      letterEl.className = "tw-letter";
      letterEl.textContent = char;
      wordEl.appendChild(letterEl);
      letterEls.push(letterEl);
    });

    slogan.appendChild(wordEl);
    if (wordIndex < words.length - 1) {
      slogan.appendChild(document.createTextNode(" "));
    }
  });

  const LETTER_DELAY = 38;
  const START_DELAY = 200;

  letterEls.forEach((letterEl, i) => {
    setTimeout(() => {
      letterEl.classList.add("is-visible");
    }, START_DELAY + i * LETTER_DELAY);
  });
})();

(function () {
  const glow = document.getElementById("footerGlow");
  const sentinel = document.getElementById("footerGlowSentinel");
  if (!glow || !sentinel) return;

  const RISE_HEIGHT = 220;
  const RISE_DURATION = 800;
  const HOLD_DURATION = 450;
  const FLATTEN_DURATION = 650;
  const RISE_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  const FLATTEN_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

  let playing = false;

  function playSequence() {
    if (playing) return;
    playing = true;

    glow.style.transition = `height ${RISE_DURATION}ms ${RISE_EASE}`;
    glow.style.height = `${RISE_HEIGHT}px`;

    setTimeout(() => {
      glow.style.transition = `height ${FLATTEN_DURATION}ms ${FLATTEN_EASE}`;
      glow.style.height = "0px";

      setTimeout(() => {
        playing = false;
      }, FLATTEN_DURATION);
    }, RISE_DURATION + HOLD_DURATION);
  }

  // IntersectionObserver uses the browser's own accurate visibility
  // hit-testing instead of manual scrollY math, which sidesteps rubber-band
  // overscroll, fractional-pixel, and cross-input-method precision issues
  // that made scrollY-based detection unreliable. The sentinel is a stable
  // 1px marker placed right after the footer content (before the glow), so
  // its own size never changes — avoiding the earlier feedback-loop bug
  // from observing the glow (whose height animation was itself changing).
  let isFirstCallback = true;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (isFirstCallback) return;
        if (entry.isIntersecting) playSequence();
      });
      isFirstCallback = false;
    },
    { threshold: 0 }
  );

  observer.observe(sentinel);
})();

function initLeadDemo(rootId, chatScreenId, leadsScreenId, ctaId) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const chatScreen = document.getElementById(chatScreenId);
  const leadsScreen = document.getElementById(leadsScreenId);
  const chatScroll = root.querySelector(".lead-demo-chat");
  const userMsg = root.querySelector(".lead-demo-user-msg");
  const stepsLine = root.querySelector(".lead-demo-steps-line");
  const steps = Array.from(root.querySelectorAll(".lead-demo-steps-content > .lead-demo-step, .lead-demo-steps-content > .lead-demo-sources"));
  const aiLines = Array.from(root.querySelectorAll(".lead-demo-ai-line"));
  const tableMini = root.querySelector(".lead-demo-table-mini");
  const cta = document.getElementById(ctaId);
  const rows = Array.from(root.querySelectorAll(".lead-demo-row[data-status]"));

  // Wrap text in per-word spans (keeping inline tags like <strong> intact)
  // so content can stream in word by word instead of appearing all at once.
  function wrapWords(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (part === "") return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement("span");
            span.className = "lead-demo-word";
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrapWords(child);
      }
    });
  }
  aiLines.forEach(wrapWords);
  const paragraphWords = Array.from(root.querySelectorAll(".lead-demo-ai-line .lead-demo-word"));

  if (tableMini) {
    tableMini.querySelectorAll("th, td").forEach(wrapWords);
  }
  const tableWords = tableMini ? Array.from(tableMini.querySelectorAll(".lead-demo-word")) : [];

  const STEPS_START_DELAY = 250;
  const STEP_STAGGER = 380;
  const WORD_STAGGER = 55;
  const TABLE_POP_DELAY = 300;
  const TABLE_POP_DURATION = 400;
  const TABLE_WORD_STAGGER = 45;
  const CTA_READ_DELAY = 1400;
  const SCREEN_TRANSITION = 350;
  const ROW_START_GAP = 400;
  const ROW_STAGGER = 650;
  const HOLD_DURATION = 3200;
  const LOOP_GAP = 1400;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let playing = false;
  let autoplayTimer = null;
  let advanceTimer = null;

  function scrollChatToBottom() {
    if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
  }

  function showScreen(screen) {
    screen.classList.add("is-shown");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => screen.classList.add("is-active"));
    });
  }

  function hideScreen(screen) {
    screen.classList.remove("is-active");
    setTimeout(() => screen.classList.remove("is-shown"), SCREEN_TRANSITION);
  }

  function reset() {
    clearTimeout(advanceTimer);
    if (userMsg) userMsg.classList.remove("is-visible");
    if (stepsLine) {
      stepsLine.style.transition = "none";
      stepsLine.style.height = "0%";
    }
    steps.forEach((step) => step.classList.remove("is-visible"));
    paragraphWords.forEach((word) => word.classList.remove("is-visible"));
    if (tableMini) tableMini.classList.remove("is-visible");
    tableWords.forEach((word) => word.classList.remove("is-visible"));
    if (cta) cta.classList.remove("is-pressed");
    rows.forEach((row) => row.classList.remove("is-visible"));
    if (chatScroll) chatScroll.scrollTop = 0;
    leadsScreen.classList.remove("is-active", "is-shown");
    chatScreen.classList.remove("is-active");
    chatScreen.classList.add("is-shown");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => chatScreen.classList.add("is-active"));
    });
  }

  function scheduleAutoplay() {
    if (reduceMotion) return;
    clearTimeout(autoplayTimer);
    autoplayTimer = setTimeout(playSequence, LOOP_GAP);
  }

  function goToLeadsScreen() {
    if (!playing) return;
    clearTimeout(advanceTimer);

    hideScreen(chatScreen);
    showScreen(leadsScreen);

    const rowsStart = SCREEN_TRANSITION + ROW_START_GAP;

    rows.forEach((row, i) => {
      setTimeout(() => row.classList.add("is-visible"), rowsStart + i * ROW_STAGGER);
    });

    setTimeout(() => {
      playing = false;
      reset();
      scheduleAutoplay();
    }, rowsStart + rows.length * ROW_STAGGER + HOLD_DURATION);
  }

  function playSequence() {
    if (playing) return;
    playing = true;
    clearTimeout(autoplayTimer);
    reset();

    let t = 0;
    if (userMsg) userMsg.classList.add("is-visible");
    t += STEPS_START_DELAY;

    const stepsDuration = steps.length * STEP_STAGGER;
    if (stepsLine) {
      setTimeout(() => {
        void stepsLine.offsetWidth;
        stepsLine.style.transition = `height ${stepsDuration}ms linear`;
        stepsLine.style.height = "100%";
      }, t);
    }
    steps.forEach((step) => {
      setTimeout(() => step.classList.add("is-visible"), t);
      t += STEP_STAGGER;
    });

    paragraphWords.forEach((word) => {
      setTimeout(() => word.classList.add("is-visible"), t);
      t += WORD_STAGGER;
    });

    if (tableMini) {
      t += TABLE_POP_DELAY;
      setTimeout(() => {
        tableMini.classList.add("is-visible");
        scrollChatToBottom();
      }, t);
      t += TABLE_POP_DURATION;

      tableWords.forEach((word) => {
        setTimeout(() => word.classList.add("is-visible"), t);
        t += TABLE_WORD_STAGGER;
      });
    }

    advanceTimer = setTimeout(goToLeadsScreen, t + CTA_READ_DELAY);
  }

  root.addEventListener("click", () => {
    if (!playing) playSequence();
  });

  if (!reduceMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playSequence();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(root);
  }
}

initLeadDemo("leadDemo", "leadScreenChat", "leadScreenLeads", "leadDemoCta");

(function () {
  const root = document.getElementById("caseDash");
  if (!root) return;

  const cards = Array.from(root.querySelectorAll(".case-approval"));

  const CARD_ACTIVE_DELAY = 400;
  const REVIEW_HOLD = 1300;
  const PRESS_DURATION = 160;
  const AFTER_APPROVE_GAP = 500;
  const HOLD_DURATION = 2000;
  const LOOP_GAP = 1400;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let playing = false;
  let autoplayTimer = null;

  function reset() {
    cards.forEach((card) => {
      card.removeAttribute("data-state");
      card.dataset.status = "pending";
      card.querySelector(".case-approval-badge").textContent = "검토 필요";
    });
  }

  function scheduleAutoplay() {
    if (reduceMotion) return;
    clearTimeout(autoplayTimer);
    autoplayTimer = setTimeout(playSequence, LOOP_GAP);
  }

  function approveCard(card, done) {
    const approveBtn = card.querySelector(".case-approval-btn--approve");
    approveBtn.classList.add("is-pressed");

    setTimeout(() => {
      approveBtn.classList.remove("is-pressed");
      card.dataset.status = "approved";
      card.querySelector(".case-approval-badge").textContent = "승인됨";

      setTimeout(() => {
        card.removeAttribute("data-state");
        done();
      }, AFTER_APPROVE_GAP);
    }, PRESS_DURATION);
  }

  function playSequence() {
    if (playing) return;
    playing = true;
    clearTimeout(autoplayTimer);
    reset();

    function step(i) {
      if (i >= cards.length) {
        setTimeout(() => {
          playing = false;
          reset();
          scheduleAutoplay();
        }, HOLD_DURATION);
        return;
      }

      const card = cards[i];
      setTimeout(() => {
        card.dataset.state = "active";
        setTimeout(() => approveCard(card, () => step(i + 1)), REVIEW_HOLD);
      }, CARD_ACTIVE_DELAY);
    }

    step(0);
  }

  root.addEventListener("click", () => {
    if (!playing) playSequence();
  });

  if (!reduceMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playSequence();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(root);
  }
})();

(function () {
  const shortcutEls = Array.from(document.querySelectorAll("[data-shortcut]"));
  if (!shortcutEls.length) return;

  const byKey = new Map();
  shortcutEls.forEach((el) => {
    byKey.set(el.dataset.shortcut.toLowerCase(), el);
  });

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable
    );
  }

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTypingTarget(document.activeElement)) return;

    const el = byKey.get(e.key.toLowerCase());
    if (el) {
      e.preventDefault();
      el.click();
    }
  });
})();
