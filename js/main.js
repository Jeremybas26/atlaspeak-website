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
