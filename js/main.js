/* Atlas Peak — shared interactions: smooth scroll, reveals, cursor, magnetic buttons */
(function () {
  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ----- Lenis smooth inertia scrolling ----- */
  if (!reduceMotion && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Keep anchor links working with Lenis
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80 });
        }
      });
    });
  }

  /* ----- Scroll reveals ----- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = entry.target.getAttribute('data-reveal-delay') || 0;
          entry.target.style.transitionDelay = delay + 'ms';
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ----- Custom cursor (desktop, non-reduced-motion) ----- */
  if (finePointer && !reduceMotion) {
    document.documentElement.classList.add('has-cursor');
    var dot = document.createElement('div');
    var ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    }, { passive: true });

    (function ringLoop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(ringLoop);
    })();

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a, button, summary')) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a, button, summary')) ring.classList.remove('is-hover');
    });
  }

  /* ----- Magnetic buttons ----- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.btn, .store-btn').forEach(function (el) {
      var strength = 18;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.transform = 'translate(' + x * strength + 'px, ' + y * strength * 0.6 + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 350);
      });
    });
  }

  /* ----- App card hover spotlight ----- */
  document.querySelectorAll('.app-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  });
})();
