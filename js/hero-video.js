/* Homepage hero background video. Poster shows instantly (CSS background);
   the video is attached afterwards and picks the lightest file that stays sharp. */
(function () {
  var photo = document.querySelector(".s2-hero__photo");
  if (!photo) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || {};
  if (reduce || conn.saveData) return;            /* poster only */

  var v = document.createElement("video");
  v.className = "s2-hero__video";
  v.muted = true; v.defaultMuted = true; v.loop = true; v.autoplay = true;
  v.playsInline = true; v.disablePictureInPicture = true;
  v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
  v.preload = "auto";
  v.poster = "/img/hero/hero-poster.webp";

  var small = window.innerWidth <= 900 && window.devicePixelRatio <= 2.5;
  var list = small
    ? [["/img/hero/hero-wave-720.mp4", "video/mp4"]]
    : [["/img/hero/hero-wave-1080.webm", 'video/webm; codecs="vp9"'], ["/img/hero/hero-wave-1080.mp4", "video/mp4"]];
  list.forEach(function (s) {
    var el = document.createElement("source");
    el.src = s[0]; el.type = s[1];
    v.appendChild(el);
  });

  v.addEventListener("playing", function () { v.classList.add("is-playing"); });
  photo.appendChild(v);
  var p = v.play();
  if (p && p.catch) p.catch(function () {});

  /* save battery/bandwidth when the hero is off-screen */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else { v.pause(); }
    }).observe(photo);
  }
})();
