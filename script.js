'use strict';

(function init() {
  if (typeof gsap === 'undefined') {
    return setTimeout(init, 50);
  }
  bootstrap();
})();

function bootstrap() {
  /* ── Loader ─────────────────────────────────── */
  const revealPage = () => setTimeout(() => {
    document.getElementById('loader').classList.add('gone');
    heroEntrance();
  }, 600);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealPage, { once: true });
  } else {
    revealPage();
  }

  /* ── Scroll setup ────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  /* ── Progress bar ────────────────────────────── */
  const bar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    bar.style.width = (pct * 100) + '%';
  }, { passive: true });

  /* ── Custom cursor ───────────────────────────── */
  const cursor    = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');
  if (cursor && window.matchMedia('(hover:hover)').matches) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    gsap.ticker.add(() => {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      gsap.set(cursor,    { x: cx, y: cy });
      gsap.set(cursorDot, { x: mx, y: my });
    });
    document.querySelectorAll('a, button, [role=button], .wcard, .type-card, .team-card').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-link'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-link'));
    });
  }


  /* ── Navbar ──────────────────────────────────── */
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');

  ScrollTrigger.create({
    start: 80,
    onEnter:     () => nav.classList.add('solid'),
    onLeaveBack: () => nav.classList.remove('solid')
  });

  burger.addEventListener('click', () => {
    const open = !drawer.classList.contains('show');
    drawer.classList.toggle('show', open);
    burger.classList.toggle('x', open);
    burger.setAttribute('aria-expanded', open);
    drawer.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      drawer.classList.remove('show');
      burger.classList.remove('x');
      burger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  /* ── Hero slideshow ──────────────────────────── */
  const slides = document.querySelectorAll('.slide:not(.slide-mask)');
  const dots   = document.querySelectorAll('.hero-nav-dot');
  let cur = 0, timer;

  function goSlide(n) {
    slides[cur].classList.remove('on');
    dots[cur].classList.remove('on');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('on');
    dots[cur].classList.add('on');
  }
  function startAuto() {
    clearInterval(timer);
    timer = setInterval(() => goSlide(cur + 1), 5000);
  }
  dots.forEach((d, i) => d.addEventListener('click', () => { goSlide(i); startAuto(); }));
  startAuto();

  /* ── Hero entrance ───────────────────────────── */
  function heroEntrance() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.ti', { y: '110%', duration: 1.1, stagger: 0.12 })
      .from('#hero-sub',   { opacity: 0, y: 20, duration: .7 }, '-=.4')
      .from('#hero-ctabox .btn', { opacity: 0, y: 20, stagger: .08, duration: .6 }, '-=.3')
      .from('#hero-trust .trust-pill', { opacity: 0, y: 12, stagger: .06, duration: .5 }, '-=.2');
  }

  /* ── Stat counters ───────────────────────────── */
  ScrollTrigger.create({
    trigger: '#mission-band',
    start: 'top 75%',
    once: true,
    onEnter: () => {
      document.querySelectorAll('[data-target]').forEach(el => {
        const target = parseFloat(el.dataset.target);
        gsap.fromTo(el,
          { innerText: 0 },
          {
            innerText: target,
            duration: 2.2,
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate() {
              el.innerText = Math.round(parseFloat(this.targets()[0].innerText));
            }
          }
        );
      });
    }
  });

  /* ── Payment counter ─────────────────────────── */
  ScrollTrigger.create({
    trigger: '#payments',
    start: 'top 75%',
    once: true,
    onEnter: () => {
      document.querySelectorAll('.pc-price [data-target]').forEach(el => {
        const target = parseFloat(el.dataset.target);
        gsap.fromTo(el,
          { innerText: 0 },
          {
            innerText: target,
            duration: 1.8,
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate() {
              el.innerText = Math.round(parseFloat(this.targets()[0].innerText));
            }
          }
        );
      });
    }
  });

  /* ── Scroll-reveal ───────────────────────────── */
  gsap.utils.toArray('.r, .rl, .rr').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => el.classList.add('show'),
      once: true
    });
  });

  /* ── 3D card tilt ────────────────────────────── */
  document.querySelectorAll('.wcard, .type-card, .team-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width  - .5;
      const dy = (e.clientY - r.top)  / r.height - .5;
      gsap.to(card, {
        rotateY: dx * 10, rotateX: -dy * 10,
        transformPerspective: 900,
        duration: .3, ease: 'power2.out'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: .6, ease: 'elastic.out(1,0.5)' });
    });
  });

  /* ── Testimonials ────────────────────────────── */
  const testCards = document.querySelectorAll('.test-card');
  let tIdx = 0;
  function showTestimonial(n) {
    testCards[tIdx].classList.remove('on');
    tIdx = (n + testCards.length) % testCards.length;
    testCards[tIdx].classList.add('on');
  }
  document.querySelectorAll('.t-next-btn').forEach(b => b.addEventListener('click', () => showTestimonial(tIdx + 1)));
  document.querySelectorAll('.t-prev-btn').forEach(b => b.addEventListener('click', () => showTestimonial(tIdx - 1)));

  /* ── Accordion ───────────────────────────────── */
  document.querySelectorAll('.acc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item  = btn.closest('.acc-item');
      const panel = item.querySelector('.acc-panel');
      const open  = item.classList.contains('open');
      document.querySelectorAll('.acc-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.acc-panel').classList.remove('open');
      });
      if (!open) { item.classList.add('open'); panel.classList.add('open'); }
    });
  });

  /* ── Interest tabs ───────────────────────────── */
  const tabs        = document.querySelectorAll('.i-tab');
  const interestVal = document.getElementById('interest-val');
  const referFields = document.getElementById('refer-fields');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('on'));
      tab.classList.add('on');
      const interest = tab.dataset.interest;
      if (interestVal) interestVal.value = interest;
      if (referFields) referFields.classList.toggle('show', interest === 'refer');
    });
  });

  /* ── CTA links pre-select tab ────────────────── */
  document.querySelectorAll('a[data-interest]').forEach(link => {
    link.addEventListener('click', () => {
      const interest = link.dataset.interest;
      setTimeout(() => {
        const target = document.querySelector(`.i-tab[data-interest="${interest}"]`);
        if (target) target.click();
      }, 400);
    });
  });

  /* ── Contact form ────────────────────────────── */
  const form      = document.getElementById('enquiry-form');
  const formInner = document.getElementById('form-inner');
  const formOk    = document.getElementById('form-success');
  const submitBtn = document.getElementById('submit-btn');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validate()) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="display:inline-block;animation:spin .8s linear infinite">⟳</span> Sending…';

      const body = {
        first:    form.first.value.trim(),
        last:     form.last.value.trim(),
        email:    form.email.value.trim(),
        phone:    form.phone.value.trim(),
        interest: interestVal ? interestVal.value : 'info',
        message:  form.message ? form.message.value.trim() : ''
      };
      if (form.org       && form.org.value)       body.org       = form.org.value.trim();
      if (form.child_age && form.child_age.value) body.child_age = form.child_age.value.trim();
      if (form.urgency   && form.urgency.value)   body.urgency   = form.urgency.value;

      // Build enquiry object
      const enquiry = {
        id: 'enq_' + Date.now(),
        timestamp: new Date().toISOString(),
        first: body.first,
        last: body.last,
        email: body.email,
        phone: body.phone,
        interest: body.interest,
        message: body.message || '',
        org: body.org || '',
        child_age: body.child_age || '',
        urgency: body.urgency || '',
        status: 'new',
        notes: [],
        assignedTo: null
      };

      // Save to localStorage
      const saved = JSON.parse(localStorage.getItem('efc_enquiries') || '[]');
      saved.unshift(enquiry);
      localStorage.setItem('efc_enquiries', JSON.stringify(saved));

      // Send via EmailJS — replace the three YOUR_* values after EmailJS setup
      // See: https://www.emailjs.com/docs/sdk/send/
      if (typeof emailjs !== 'undefined') {
        emailjs.send(
          'YOUR_EMAILJS_SERVICE_ID',   // e.g. 'service_abc123'
          'YOUR_EMAILJS_TEMPLATE_ID',  // e.g. 'template_xyz789'
          {
            from_name:    body.first + ' ' + body.last,
            reply_to:     body.email,
            phone:        body.phone,
            enquiry_type: body.interest,
            message:      body.message || '(no message)',
            org:          body.org || 'N/A',
            child_info:   body.child_age || 'N/A',
            urgency:      body.urgency || 'N/A'
          },
          'YOUR_EMAILJS_PUBLIC_KEY'    // e.g. 'abc_XYZabcXYZ'
        ).catch(err => console.warn('[EmailJS]', err));
      }

      gsap.to(formInner, {
        opacity: 0, y: -16, duration: .3,
        onComplete: () => {
          formInner.style.display = 'none';
          formOk.classList.add('show');
          gsap.from(formOk, { opacity: 0, y: 20, duration: .5, ease: 'power2.out' });
        }
      });
    });
  }

  function validate() {
    let ok = true;
    ['first','last','email','phone'].forEach(name => {
      const el = form[name];
      if (!el) return;
      el.classList.remove('bad');
      if (!el.value.trim()) { el.classList.add('bad'); ok = false; }
      else if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) {
        el.classList.add('bad'); ok = false;
      }
    });
    return ok;
  }

  /* ── Hero parallax ───────────────────────────── */
  gsap.to('.slides', {
    yPercent: 15,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
}