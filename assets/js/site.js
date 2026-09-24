/* ============================================================
   AYIO — efeitos de interface
   Sem dependências externas.
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const lerp    = (a, b, t) => a + (b - a) * t;

  /* ---------------------------------------------------------
     1. Scroll suave (inércia) — só desktop, sem reduced-motion
     --------------------------------------------------------- */
  function smoothScroll() {
    if (reduced || !fine) return;
    let target = window.scrollY, current = target, raf = null, active = false;
    const max = () => document.documentElement.scrollHeight - window.innerHeight;

    document.documentElement.classList.add('has-smooth');

    const loop = () => {
      current = lerp(current, target, 0.11);
      if (Math.abs(target - current) < 0.4) { current = target; active = false; }
      window.scrollTo(0, current);
      raf = active ? requestAnimationFrame(loop) : null;
    };
    const kick = () => { if (!active) { active = true; raf = requestAnimationFrame(loop); } };

    window.addEventListener('wheel', e => {
      if (e.ctrlKey) return;
      if (e.target.closest('[data-native-scroll]')) return;
      e.preventDefault();
      target = Math.max(0, Math.min(max(), target + e.deltaY));
      kick();
    }, { passive: false });

    // teclado e âncoras continuam nativos: ressincroniza
    window.addEventListener('scroll', () => { if (!active) { target = window.scrollY; current = target; } }, { passive: true });
    window.addEventListener('resize', () => { target = window.scrollY; current = target; });

    window.__ayioScrollTo = y => { target = Math.max(0, Math.min(max(), y)); kick(); };
  }

  /* ---------------------------------------------------------
     3. Cursor
     --------------------------------------------------------- */
  function cursor() {
    if (!fine || reduced) return;
    const dot  = document.createElement('div'); dot.className  = 'cursor';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
    }, { passive: true });

    (function loop() {
      rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();

    const hot = 'a,button,.card,.acc__btn,.feats li,input,textarea';
    document.addEventListener('mouseover', e => { if (e.target.closest(hot)) ring.classList.add('grow'); });
    document.addEventListener('mouseout',  e => { if (e.target.closest(hot)) ring.classList.remove('grow'); });
  }

  /* ---------------------------------------------------------
     4. Reveal on scroll + split de palavras
     --------------------------------------------------------- */
  function splitWords() {
    const wrapTextNode = (node, counter) => {
      const words = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach(chunk => {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) { frag.append(document.createTextNode(' ')); return; }
        const outer = document.createElement('span');
        outer.className = 'word';
        outer.style.setProperty('--i', counter.i++);
        const inner = document.createElement('span');
        inner.textContent = chunk;
        outer.append(inner);
        frag.append(outer);
      });
      node.replaceWith(frag);
    };

    const walk = (el, counter) => {
      [...el.childNodes].forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) {
          if (n.textContent.trim()) wrapTextNode(n, counter);
        } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'BR') {
          walk(n, counter);
        }
      });
    };

    $$('[data-split]').forEach(el => {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = '1';
      el.classList.add('reveal-lines');
      walk(el, { i: 0 });
    });
  }

  function reveals() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    $$('[data-rise],[data-clip],[data-grow],.media,.reveal-lines,[data-count],[data-chat]')
      .forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     5. Contadores
     --------------------------------------------------------- */
  function counters() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        const to = parseFloat(el.dataset.count);
        const suf = el.dataset.suffix || '';
        const dur = 1400, t0 = performance.now();
        const run = t => {
          const k = Math.min(1, (t - t0) / dur);
          const e2 = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(to * e2) + suf;
          if (k < 1) requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
      });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     6. Nav: sticky, hide-on-scroll, link ativo
     --------------------------------------------------------- */
  function nav() {
    const bar = $('.nav');
    if (!bar) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      bar.classList.toggle('stuck', y > 40);
      bar.classList.toggle('hide', y > 560 && y > last && !$('.drawer.open'));
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // âncoras
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const t = $(id);
        if (!t) return;
        e.preventDefault();
        closeDrawer();
        const y = t.getBoundingClientRect().top + window.scrollY - 70;
        if (window.__ayioScrollTo) window.__ayioScrollTo(y);
        else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      });
    });

    // seção ativa
    const links = $$('.nav__links a[href^="#"]');
    if (links.length) {
      const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
      const io = new IntersectionObserver(es => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      secs.forEach(s => io.observe(s));
    }
  }

  function closeDrawer() {
    $('.drawer')?.classList.remove('open');
    $('.burger')?.classList.remove('open');
    document.body.style.overflow = '';
  }
  function drawer() {
    const b = $('.burger'), d = $('.drawer');
    if (!b || !d) return;
    b.addEventListener('click', () => {
      const open = d.classList.toggle('open');
      b.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      $$('a', d).forEach((a, i) => a.style.transitionDelay = open ? `${0.18 + i * 0.06}s` : '0s');
    });
  }

  /* ---------------------------------------------------------
     7. Barra de progresso
     --------------------------------------------------------- */
  function progress() {
    const el = $('.progress');
    if (!el) return;
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      el.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  }

  /* ---------------------------------------------------------
     8. Troca de accent por seção (data-accent / data-accent-2)
     --------------------------------------------------------- */
  function accentShift() {
    const zones = $$('[data-accent]');
    if (!zones.length) return;
    const root = document.documentElement;
    const base = { a: '#7D9BF0', b: '#3F57B8', ink: '#05070F', glow: 'rgba(62,87,184,.34)' };
    const apply = z => {
      root.style.setProperty('--accent',   z ? z.dataset.accent   : base.a);
      root.style.setProperty('--accent-2', z ? (z.dataset.accent2 || z.dataset.accent) : base.b);
      root.style.setProperty('--accent-ink', z ? (z.dataset.accentInk || '#05070F') : base.ink);
      root.style.setProperty('--glow',     z ? (z.dataset.glow || 'rgba(255,255,255,.16)') : base.glow);
    };
    root.style.setProperty('transition', 'none');
    const io = new IntersectionObserver(es => {
      es.forEach(e => apply(e.isIntersecting ? e.target : null));
    }, { rootMargin: '-42% 0px -42% 0px' });
    zones.forEach(z => io.observe(z));
  }

  /* ---------------------------------------------------------
     9. Parallax por data-speed
     --------------------------------------------------------- */
  function parallax() {
    if (reduced) return;
    const els = $$('[data-speed]');
    if (!els.length) return;
    let ticking = false;
    const upd = () => {
      const vh = innerHeight;
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const prog = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0,${(-prog * parseFloat(el.dataset.speed) * 100).toFixed(2)}px,0)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd);
    upd();
  }

  /* ---------------------------------------------------------
     10. Produtos: narrativa na rolagem
     A rolagem dentro da trilha vira uma etapa de 0 a 8; o CSS faz o resto.
     --------------------------------------------------------- */
  function story() {
    const el = $('.story');
    if (!el) return;
    const stepPx = () => (el.offsetHeight - innerHeight) / 8;
    let cur = -1;
    const set = i => {
      if (i === cur) return;
      cur = i;
      el.dataset.p = Math.floor(i / 3);
      el.dataset.s = i % 3;
    };
    const upd = () => {
      const st = stepPx();
      if (st > 0) set(Math.max(0, Math.min(8, Math.round(-el.getBoundingClientRect().top / st))));
    };
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();

    // Etapas e trilho levam a rolagem até a etapa clicada.
    $$('[data-go]', el).forEach(b => b.addEventListener('click', () => {
      const y = el.getBoundingClientRect().top + scrollY + +b.dataset.go * stepPx();
      window.__ayioScrollTo ? window.__ayioScrollTo(y) : scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }));

    // LicenSys: clicar numa barra mostra o detalhe do título.
    const info = $('.sd__info', el);
    $$('.sd__bars button', el).forEach(b => b.addEventListener('click', () => {
      $$('.sd__bars button', el).forEach(x => x.classList.toggle('is-on', x === b));
      info.innerHTML = `<b>${$('b', b).textContent}</b> · ${b.dataset.info}`;
    }));

    // AdaptAI: cada chip liga ou desliga uma adaptação do material.
    const adapt = $('.sd__adapt', el);
    $$('[data-ad]', el).forEach(b => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on);
      adapt.classList.toggle('is-' + b.dataset.ad, on);
    }));
  }

  /* ---------------------------------------------------------
     11. Botões magnéticos + brilho que segue o mouse nos cards
     --------------------------------------------------------- */
  function magnetic() {
    if (!fine || reduced) return;
    $$('[data-magnet]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.4;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    $$('.card').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', `${e.clientX - r.left}px`);
        c.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------------------------------------------------------
     12. Acordeão
     --------------------------------------------------------- */
  function accordion() {
    $$('.acc').forEach(acc => {
      $$('.acc__btn', acc).forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.acc__item');
          const open = item.classList.contains('open');
          $$('.acc__item', acc).forEach(i => i.classList.remove('open'));
          item.classList.toggle('open', !open);
        });
      });
    });
  }

  /* ---------------------------------------------------------
     13. Demo de chat (Seu Cartório)
     --------------------------------------------------------- */
  function chatDemo() {
    const box = $('[data-chat]');
    if (!box) return;
    const bubbles = $$('.bubble', box);
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        bubbles.forEach((b, i) => setTimeout(() => b.classList.add('show'), reduced ? 0 : 420 * i + 200));
      });
    }, { threshold: 0.35 });
    io.observe(box);
  }

  /* ---------------------------------------------------------
     14. Waveform (ata notarial)
     --------------------------------------------------------- */
  function waveform() {
    $$('.wave').forEach(w => {
      if (w.children.length) return;
      const n = 46;
      for (let i = 0; i < n; i++) {
        const bar = document.createElement('i');
        bar.style.animationDelay = `${(i % 11) * 0.09}s`;
        bar.style.animationDuration = `${1.05 + (i % 5) * 0.16}s`;
        w.append(bar);
      }
    });
  }

  /* ---------------------------------------------------------
     15. Canvas de rede neural (identidade do banner AYIO)
     --------------------------------------------------------- */
  // Intensidade da constelação. 1 = base; 1.2 = +20%.
  // Um número só, porque densidade e alcance se multiplicam: subir os dois
  // na mesma proporção renderiza ~44% mais linhas, não 20%. O alcance entra
  // amortecido para que o resultado percebido acompanhe o fator.
  const NET = 1.2;

  function network(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, nodes = [], raf, mouse = { x: -999, y: -999 };
    const conf = () => {
      const a = (canvas.width * canvas.height) / (dpr * dpr);
      return Math.round(Math.min(78 * NET, Math.max(26 * NET, a / (24000 / NET))));
    };
    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = conf();
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.6,
        p: Math.random() * Math.PI * 2
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const link = Math.min(165, w * 0.12) * (1 + (NET - 1) * 0.4);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx; a.y += a.vy; a.p += 0.02;
        if (a.x < -30) a.x = w + 30; if (a.x > w + 30) a.x = -30;
        if (a.y < -30) a.y = h + 30; if (a.y > h + 30) a.y = -30;

        const dmx = a.x - mouse.x, dmy = a.y - mouse.y;
        const dm = Math.hypot(dmx, dmy);
        if (dm < 150) { a.x += (dmx / dm) * 0.9; a.y += (dmy / dm) * 0.9; }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > link) continue;
          const o = (1 - d / link) * 0.26 * NET;
          ctx.strokeStyle = `rgba(120,190,235,${o})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        const glow = Math.min(1, (0.45 + Math.sin(a.p) * 0.3) * NET);
        ctx.fillStyle = `rgba(150,215,240,${glow})`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    resize();
    addEventListener('resize', resize);
    addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    addEventListener('mouseout', () => { mouse.x = mouse.y = -999; });

    if (reduced) { draw(); cancelAnimationFrame(raf); return; }
    // pausa fora da viewport
    new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(draw); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0 }).observe(canvas);
    raf = requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------
     16. Ano no rodapé
     --------------------------------------------------------- */
  function year() { $$('[data-year]').forEach(e => e.textContent = new Date().getFullYear()); }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function start() {
    // hero: entrada encadeada
    const mark = $('.hero__mark');
    if (mark) mark.animate(
      [{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }],
      { duration: reduced ? 1 : 900, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards', delay: 120 }
    );
    requestAnimationFrame(() => $$('.hero .reveal-lines,.hero [data-rise]').forEach(el => el.classList.add('in')));
  }

  document.addEventListener('DOMContentLoaded', () => {
    splitWords();
    smoothScroll();
    cursor();
    nav();
    drawer();
    progress();
    reveals();
    counters();
    accentShift();
    parallax();
    story();
    magnetic();
    accordion();
    chatDemo();
    waveform();
    network($('.hero__canvas'));
    network($('.p-hero__canvas'));
    year();
    start();
  });
})();
