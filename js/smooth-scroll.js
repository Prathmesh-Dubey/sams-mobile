/* SAMS smooth (inertial) scrolling — mouse wheel eases to a stop instead of halting instantly.
   Trial: loaded on the home page only. Remove the <script> tag from index.html to switch off.
   No dependencies. Touch, keyboard, scrollbar drag and #anchor jumps stay native. */
(function () {
  "use strict";
  var mq = window.matchMedia;
  if (mq && mq("(prefers-reduced-motion: reduce)").matches) return;
  if (mq && mq("(pointer: coarse)").matches) return; // phones/tablets keep native momentum scrolling

  var root = document.documentElement;
  var EASE = 0.1;            // share of the remaining distance covered per 60fps frame (lower = longer glide)
  var current = window.scrollY, target = current, lastSet = current, raf = 0, last = 0;

  function maxScroll() { return Math.max(0, root.scrollHeight - window.innerHeight); }
  function clamp(v) { return Math.min(Math.max(v, 0), maxScroll()); }

  function pageLocked() {
    var b = document.body;
    return getComputedStyle(root).overflowY === "hidden" ||
      (!!b && (getComputedStyle(b).overflowY === "hidden" || getComputedStyle(b).position === "fixed"));
  }

  // True if the wheel is over something that should scroll itself (inner scroller, 3D viewer, cookie panel).
  function ownsWheel(el, dy) {
    while (el && el !== document.body && el !== root) {
      if (el.nodeType === 1) {
        var tag = el.tagName;
        if (tag === "MODEL-VIEWER" || tag === "TEXTAREA" || tag === "SELECT") return true;
        var cs = getComputedStyle(el);
        var oy = cs.overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
          if ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true;
        }
      }
      el = el.parentNode;
    }
    return false;
  }

  function frame(now) {
    var dt = Math.min(now - last, 64);
    last = now;
    var k = 1 - Math.pow(1 - EASE, dt / 16.667);   // frame-rate independent easing
    var next = current + (target - current) * k;
    if (Math.abs(target - next) < 0.4) next = target;
    current = next;
    lastSet = current;
    window.scrollTo({ top: current, left: 0, behavior: "instant" }); // "instant" beats CSS scroll-behavior:smooth
    if (current !== target) raf = requestAnimationFrame(frame); else raf = 0;
  }

  function onWheel(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;        // pinch/ctrl-zoom untouched
    if (pageLocked()) return;                                        // modal/menu has locked the page: don't scroll behind it
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;            // horizontal gestures untouched
    var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (ownsWheel(e.target, dy)) return;
    e.preventDefault();
    if (!raf) { current = window.scrollY; target = current; }         // start from where the page really is
    target = clamp(target + dy);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  // Anything that moves the page other than us (scrollbar drag, keyboard, #anchor, back-to-top) wins.
  window.addEventListener("scroll", function () {
    if (Math.abs(window.scrollY - lastSet) > 2) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      current = target = lastSet = window.scrollY;
    }
  }, { passive: true });

  window.addEventListener("resize", function () { target = clamp(target); }, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: false });
})();
