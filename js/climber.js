/* Atlas Peak — scroll-driven climber character.
   A little white stick figure who rappels down the page as you scroll
   down, climbs back up as you scroll up, and interacts with content:
   hangs off the hero headline, sits on each app icon, hangs from the
   About heading, and waves from the CTA band. Anchor points are
   measured from the real DOM, so the journey adapts to any layout. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var CHAR_W = 48, CHAR_H = 64;

  var layer = document.createElement('div');
  layer.id = 'climber-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML =
    '<div id="climber-rope"></div>' +
    '<svg id="climber" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">' +
    // Rappelling: one hand up on the rope, legs braced against the wall
    '<g data-pose="rappel">' +
    '<circle class="noggin" cx="24" cy="11" r="6.5"/>' +
    '<path class="limb" d="M24 17 L24 36"/>' +
    '<path class="limb" d="M24 22 L31 8"/>' +
    '<path class="limb" d="M24 25 L15 31"/>' +
    '<path class="limb" d="M24 36 L12 41"/>' +
    '<path class="limb" d="M24 36 L14 50"/>' +
    '</g>' +
    // Climbing: both arms reaching up, one leg stepping high
    '<g data-pose="climb">' +
    '<circle class="noggin" cx="24" cy="11" r="6.5"/>' +
    '<path class="limb" d="M24 17 L24 36"/>' +
    '<path class="limb" d="M24 22 L31 6"/>' +
    '<path class="limb" d="M24 23 L16 11"/>' +
    '<path class="limb" d="M24 36 L14 46"/>' +
    '<path class="limb" d="M24 36 L32 44 L31 52"/>' +
    '</g>' +
    // Sitting: legs dangling off the edge, kicking happily
    '<g data-pose="sit">' +
    '<circle class="noggin" cx="24" cy="11" r="6.5"/>' +
    '<path class="limb" d="M24 17 L24 33"/>' +
    '<path class="limb" d="M24 23 L15 30"/>' +
    '<path class="limb" d="M24 23 L33 30"/>' +
    '<g class="sit-legs">' +
    '<path class="limb" d="M24 33 L31 38 L30 51"/>' +
    '<path class="limb" d="M24 33 L20 39 L21 52"/>' +
    '</g>' +
    '</g>' +
    // Hanging: both hands gripping above, legs dangling
    '<g data-pose="hang">' +
    '<circle class="noggin" cx="24" cy="14" r="6.5"/>' +
    '<path class="limb" d="M24 20 L24 38"/>' +
    '<path class="limb" d="M24 23 L20 6"/>' +
    '<path class="limb" d="M24 23 L28 6"/>' +
    '<g class="hang-legs">' +
    '<path class="limb" d="M24 38 L20 50"/>' +
    '<path class="limb" d="M24 38 L29 48"/>' +
    '</g>' +
    '</g>' +
    // Waving: standing, one arm swinging overhead
    '<g data-pose="wave">' +
    '<circle class="noggin" cx="24" cy="11" r="6.5"/>' +
    '<path class="limb" d="M24 17 L24 36"/>' +
    '<g class="wave-arm"><path class="limb" d="M24 22 L34 8"/></g>' +
    '<path class="limb" d="M24 25 L15 32"/>' +
    '<path class="limb" d="M24 36 L18 52"/>' +
    '<path class="limb" d="M24 36 L30 52"/>' +
    '</g>' +
    '</svg>';
  document.body.appendChild(layer);

  var char = document.getElementById('climber');
  var rope = document.getElementById('climber-rope');

  /* ----- Journey keypoints, measured from the real DOM ----- */
  var KP = [];

  function docRect(el) {
    var r = el.getBoundingClientRect();
    return {
      top: r.top + window.scrollY,
      bottom: r.bottom + window.scrollY,
      left: r.left + window.scrollX,
      right: r.right + window.scrollX,
      cx: r.left + window.scrollX + r.width / 2,
    };
  }

  function rebuild() {
    var vh = window.innerHeight;
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    layer.style.height = document.documentElement.scrollHeight + 'px';
    var scale = window.innerWidth <= 720 ? 0.75 : 1;
    var w = CHAR_W * scale, h = CHAR_H * scale;
    KP = [];

    function clampX(x) {
      return Math.min(Math.max(x, 8), window.innerWidth - w - 8);
    }
    // Park the character at (x, y) for the scroll range where the anchor
    // crosses the middle of the viewport, so he stays put while you read.
    function park(anchorTop, x, y, pose) {
      KP.push({ s: Math.max(0, anchorTop - vh * 0.72), x: clampX(x), y: y, pose: pose });
      KP.push({ s: Math.max(0, anchorTop - vh * 0.30), x: clampX(x), y: y, pose: pose });
    }

    // 1. Hero: hanging off the end of the headline text ("daily climb.")
    var h1 = document.querySelector('.hero h1 em') || document.querySelector('.hero h1');
    if (h1) {
      var hr = docRect(h1);
      var hx = clampX(hr.right - 18);
      KP.push({ s: 0, x: hx, y: hr.bottom - 14, pose: 'hang' });
      KP.push({ s: vh * 0.12, x: hx, y: hr.bottom - 14, pose: 'hang' });
    }

    // 2. Each app story: sitting on top of the icon
    document.querySelectorAll('.app-story .story-icon .icon').forEach(function (ic) {
      var r = docRect(ic);
      park(r.top, r.cx - w / 2, r.top - h * 0.55, 'sit');
    });

    // 3. About: hanging from the "Hi, I'm Jeremy." heading
    var ab = document.querySelector('.about-intro h2');
    if (ab) {
      var ar = docRect(ab);
      park(ar.top, ar.right - 70, ar.bottom - 12, 'hang');
    }

    // 4. CTA band: standing on its top edge, waving goodbye
    var cta = document.querySelector('.cta-band');
    if (cta) {
      var cr = docRect(cta);
      var cx = clampX(cr.cx - w / 2);
      var cy = cr.top - h * 0.82;
      KP.push({ s: Math.min(cr.top - vh * 0.55, maxScroll - 40), x: cx, y: cy, pose: 'wave' });
      KP.push({ s: maxScroll + 50, x: cx, y: cy, pose: 'wave' });
    }

    KP.sort(function (a, b) { return a.s - b.s; });
  }

  /* ----- Per-frame state ----- */
  var px = -100, py = -100;     // rendered position (smoothed)
  var lastS = window.scrollY;
  var dir = 1;                   // 1 = descending, -1 = climbing
  var currentPose = '';

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function targetAt(s) {
    if (!KP.length) return null;
    if (s <= KP[0].s) return { x: KP[0].x, y: KP[0].y, pose: KP[0].pose, travel: 0 };
    var last = KP[KP.length - 1];
    if (s >= last.s) return { x: last.x, y: last.y, pose: last.pose, travel: 0 };
    for (var i = 0; i < KP.length - 1; i++) {
      var a = KP[i], b = KP[i + 1];
      if (s >= a.s && s <= b.s) {
        var t = ease((s - a.s) / Math.max(1, b.s - a.s));
        var parked = a.pose === b.pose && Math.abs(a.y - b.y) < 2 && Math.abs(a.x - b.x) < 2;
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          pose: parked ? a.pose : (dir >= 0 ? 'rappel' : 'climb'),
          travel: parked ? 0 : Math.sin(Math.PI * t), // sway fades at endpoints
          fromY: a.y,
        };
      }
    }
    return null;
  }

  function setPose(p) {
    if (p === currentPose) return;
    char.classList.remove('pose-' + currentPose);
    char.classList.add('pose-' + p);
    currentPose = p;
  }

  function frame() {
    var s = window.scrollY;
    if (Math.abs(s - lastS) > 2) dir = s > lastS ? 1 : -1;
    lastS = s;

    var tgt = targetAt(s);
    if (tgt) {
      var sway = tgt.travel * Math.sin(s * 0.02) * 12;
      var tx = tgt.x + sway;
      px += (tx - px) * 0.14;
      py += (tgt.y - py) * 0.14;

      var scale = window.innerWidth <= 720 ? 0.75 : 1;
      var rot = tgt.travel * Math.sin(s * 0.02) * 8;
      char.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0) rotate(' + rot + 'deg) scale(' + scale + ')';
      char.style.transformOrigin = '24px 8px';
      setPose(tgt.pose);

      // Rope: visible while travelling, anchored at the departure point
      if (tgt.travel > 0.05) {
        var handX = px + 31 * scale - 1;
        var topY = Math.max((tgt.fromY || py - 300), py - 340);
        rope.style.display = 'block';
        rope.style.left = handX + 'px';
        rope.style.top = topY + 'px';
        rope.style.height = Math.max(0, (py + 10 * scale) - topY) + 'px';
        rope.style.opacity = Math.min(1, tgt.travel * 2);
      } else {
        rope.style.display = 'none';
      }
    }
    requestAnimationFrame(frame);
  }

  /* ----- Boot: measure once layout is stable, re-measure on changes ----- */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 200);
  });
  window.addEventListener('load', rebuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  rebuild();
  setTimeout(rebuild, 1200); // late layout shifts (images, fonts)

  // Start at the first keypoint so he doesn't fly in from a corner
  if (KP.length) { px = KP[0].x; py = KP[0].y; }
  setPose('hang');
  frame(); // renders immediately, then self-schedules via rAF
})();
