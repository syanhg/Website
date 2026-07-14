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

  function tick(time) {
    if (lastTime === null) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, dt * 1.6);
    angle = (angle + currentSpeed * dt) % 360;

    const motionBlur = Math.min(3.5, currentSpeed / 45);

    for (let i = 0; i < count; i++) {
      const baseAngle = (360 / count) * i;
      const rad = ((baseAngle + angle) * Math.PI) / 180;
      const x = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);

      slots[i].style.transform = `translate(${x}px, ${y}px)`;
      avatars[i].style.transform = `rotate(${-angle}deg)`;
      avatars[i].style.filter = `drop-shadow(0 8px 18px rgba(0,0,0,0.12)) blur(${motionBlur}px)`;
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
  if (!glow) return;

  const RISE_HEIGHT = 220;
  const RISE_DURATION = 800;
  const HOLD_DURATION = 450;
  const FLATTEN_DURATION = 650;
  const RISE_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  const FLATTEN_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
  const BOTTOM_SLACK = 24;

  let playing = false;
  let armed = true;
  let atBottom = false;

  function isAtBottom() {
    const doc = document.documentElement;
    return (
      Math.ceil(window.scrollY + window.innerHeight) >=
      doc.scrollHeight - BOTTOM_SLACK
    );
  }

  function playSequence() {
    if (playing || !armed) return;
    playing = true;
    armed = false;

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

  // 'scroll' fires AFTER the browser applies the new position, so it's the
  // reliable source of truth for "am I at the bottom right now." 'wheel'
  // fires BEFORE the scroll it causes is applied, so reading scroll position
  // live inside the wheel handler can catch a stale, not-yet-at-bottom value
  // on the very event that lands you there — and once truly pinned at max
  // scroll, the browser may not fire another wheel event to catch it on.
  // Caching the state from 'scroll' and reading the cache in 'wheel' avoids
  // that race.
  function onScroll() {
    atBottom = isAtBottom();
    if (!atBottom) armed = true;
  }

  function onWheel(e) {
    if (e.deltaY > 0 && atBottom) playSequence();
  }

  let touchStartY = null;
  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (touchStartY === null) return;
    const movedUp = touchStartY - e.touches[0].clientY;
    if (movedUp > 12 && atBottom) playSequence();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  onScroll();
})();
