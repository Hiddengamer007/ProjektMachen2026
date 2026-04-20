/* ============================================
   ProjektMachen2026 — App Logic
   Data loading, filtering, animations, countdown
   ============================================ */

(function () {
  'use strict';

  // --- State ---
  let DATA = null;
  let currentWorkshopFilter = 'all';
  let currentStatusFilter = 'all';
  let currentSort = 'kriterien_desc';

  // --- Workshop color map ---
  const WS_COLORS = { wi: '#FF6B35', lp: '#7B2D8E', pf: '#2E86AB', bm: '#A23B72', as: '#F18F01' };
  const WS_NAMES = { wi: 'Wild Ideas', lp: 'Local Paradox', pf: 'Problem-First', bm: 'Blend Method', as: 'Audience Shift' };

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initNavbar();
    initParticles();
    initScrollReveal();
    initCountdown();
  });

  // --- Load Data ---
  async function loadData() {
    try {
      const resp = await fetch('data.json');
      DATA = await resp.json();
      renderWorkshops();
      renderIdeas();
      renderTop10();
      renderVerworfen();
      initCounters();
      initFilterBar();
    } catch (e) {
      console.error('Fehler beim Laden der Daten:', e);
    }
  }

  // --- Particles (CSS-driven, JS creates them) ---
  function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const count = 25;
    const colors = ['rgba(99,102,241,0.3)', 'rgba(139,92,246,0.25)', 'rgba(236,72,153,0.2)', 'rgba(245,158,11,0.2)', 'rgba(16,185,129,0.2)'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 4 + 2;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDuration = (Math.random() * 20 + 15) + 's';
      p.style.animationDelay = (Math.random() * 20) + 's';
      container.appendChild(p);
    }
  }

  // --- Scroll Reveal (IntersectionObserver) ---
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Also observe dynamically added cards
    window._revealObserver = observer;
  }

  // --- Navbar ---
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    // Scroll effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      // Active link
      const sections = ['prozess', 'workshops', 'ideen', 'top10', 'verworfen', 'naechste'];
      let active = '';
      sections.forEach(id => {
        const section = document.getElementById(id);
        if (section && window.scrollY >= section.offsetTop - 200) {
          active = id;
        }
      });
      navLinks.querySelectorAll('a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + active);
      });
    });

    // Hamburger toggle
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // --- Animated Counters ---
  function initCounters() {
    const counters = document.querySelectorAll('.counter-number[data-target]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // --- Progress Bars ---
  function animateProgressBars() {
    const bars = document.querySelectorAll('.progress-bar-fill[data-width]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.dataset.width + '%';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    bars.forEach(b => observer.observe(b));
  }

  // We call this after DOM sections are ready
  setTimeout(animateProgressBars, 100);

  // --- Render Workshops ---
  function renderWorkshops() {
    const grid = document.getElementById('workshopGrid');
    if (!grid || !DATA) return;

    DATA.workshops.forEach((ws, i) => {
      const ideaCount = DATA.ideas.filter(idea => idea.workshop === ws.id).length;
      const card = document.createElement('div');
      card.className = 'workshop-card reveal reveal-delay-' + Math.min(i + 1, 5);
      card.dataset.workshop = ws.id;
      card.innerHTML = `
        <span class="workshop-icon">${ws.icon}</span>
        <h3 class="workshop-name">${ws.name}</h3>
        <div class="workshop-method">${ws.method}</div>
        <p class="workshop-desc">${ws.description}</p>
        <div class="workshop-meta">
          <span class="workshop-count"><strong>${ideaCount}</strong> Ideen</span>
        </div>
        <div class="workshop-trigger">→ ${ws.method}</div>
      `;
      grid.appendChild(card);
      if (window._revealObserver) window._revealObserver.observe(card);
    });
  }

  // --- Render Ideas Grid ---
  function renderIdeas() {
    const grid = document.getElementById('ideasGrid');
    const countEl = document.getElementById('ideasCount');
    if (!grid || !DATA) return;

    let ideas = [...DATA.ideas];

    // Filter workshop
    if (currentWorkshopFilter !== 'all') {
      ideas = ideas.filter(i => i.workshop === currentWorkshopFilter);
    }

    // Filter status
    if (currentStatusFilter !== 'all') {
      switch (currentStatusFilter) {
        case 'top10': ideas = ideas.filter(i => i.is_top10); break;
        case 'top15': ideas = ideas.filter(i => i.is_top15); break;
        case 'unterschaetzt': ideas = ideas.filter(i => i.is_unterschaetzt); break;
        case 'papertiger': ideas = ideas.filter(i => i.is_papertiger); break;
        case 'verworfen': ideas = ideas.filter(i => i.is_verworfen); break;
      }
    }

    // Sort
    ideas = sortIdeas(ideas, currentSort);

    // Count
    if (countEl) countEl.innerHTML = `<strong>${ideas.length}</strong> Ideen angezeigt`;

    // Render
    grid.innerHTML = '';
    if (ideas.length === 0) {
      grid.innerHTML = '<div class="no-results">Keine Ideen gefunden — andere Filter kombinieren.</div>';
      return;
    }

    ideas.forEach((idea, idx) => {
      const card = createIdeaCard(idea, idx);
      grid.appendChild(card);
    });
  }

  function createIdeaCard(idea, idx) {
    const card = document.createElement('div');
    card.className = 'idea-card reveal' + (idea.is_verworfen && !idea.is_top15 ? ' discarded' : '');
    card.dataset.ws = idea.workshop;
    card.dataset.id = idea.id;
    card.style.transitionDelay = Math.min(idx * 0.03, 0.5) + 's';

    const scorePercent = (idea.kriterien_score / 21 * 100).toFixed(1);
    const stars = renderStars(idea.lokalbezug_score);

    const badges = [];
    badges.push(`<span class="idea-badge badge-workshop" data-ws="${idea.workshop}">${WS_NAMES[idea.workshop]}</span>`);
    if (idea.is_top10) badges.push('<span class="idea-badge badge-top10">🏆 Top 10</span>');
    if (idea.is_top15 && !idea.is_top10) badges.push('<span class="idea-badge badge-top15">✓ Top 15</span>');
    if (idea.is_papertiger) badges.push('<span class="idea-badge badge-papertiger">🐅 Papiertiger</span>');
    if (idea.is_unterschaetzt) badges.push('<span class="idea-badge badge-unterschaetzt">💎 Unterschätzt</span>');
    if (idea.is_verworfen && !idea.is_top15) badges.push('<span class="idea-badge badge-verworfen">✕ Verworfen</span>');

    // Handle both core_concept and core_conzept (typo in data)
    const coreConcept = idea.core_concept || idea.core_conzept || '';

    card.innerHTML = `
      <div class="idea-header">
        <span class="idea-name">${idea.name}</span>
        <span class="idea-id">#${idea.id}</span>
      </div>
      <div class="idea-badges">${badges.join('')}</div>
      <div class="idea-scores">
        <div class="idea-score-item">
          <span class="idea-score-label">Kriterien</span>
          <div class="idea-score-bar"><div class="idea-score-bar-fill" style="width:${scorePercent}%"></div></div>
          <span class="idea-score-value">${idea.kriterien_score}/21</span>
        </div>
        <div class="idea-score-item">
          <span class="idea-score-label">Lokalbezug</span>
          <div class="idea-stars">${stars}</div>
        </div>
      </div>
      <div class="idea-expand-hint">Klicken für Details ↓</div>
      <div class="idea-detail">
        <div class="idea-detail-inner">
          <div class="idea-detail-row"><strong>Kernkonzept</strong><p>${coreConcept}</p></div>
          <div class="idea-detail-row"><strong>Eisenach-Bezug</strong><p>${idea.eisenach_bezug}</p></div>
          <div class="idea-detail-row"><strong>Jugend-Rolle</strong><p>${idea.jugend_rolle}</p></div>
          <div class="idea-detail-row"><strong>machen!-Fit</strong><p>${idea.machen_fit}</p></div>
          <div class="idea-detail-row"><strong>Method-Trigger</strong><p>${idea.method_trigger}</p></div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
    });

    if (window._revealObserver) window._revealObserver.observe(card);
    return card;
  }

  function renderStars(count) {
    let html = '';
    for (let i = 1; i <= 3; i++) {
      html += i <= count
        ? '<span class="star-filled">⭐</span>'
        : '<span class="star-empty">☆</span>';
    }
    return html;
  }

  function sortIdeas(ideas, sortKey) {
    const sorted = [...ideas];
    switch (sortKey) {
      case 'kriterien_desc': sorted.sort((a, b) => b.kriterien_score - a.kriterien_score); break;
      case 'kriterien_asc': sorted.sort((a, b) => a.kriterien_score - b.kriterien_score); break;
      case 'lokalbezug_desc': sorted.sort((a, b) => b.lokalbezug_score - a.lokalbezug_score || b.kriterien_score - a.kriterien_score); break;
      case 'lokalbezug_asc': sorted.sort((a, b) => a.lokalbezug_score - b.lokalbezug_score || a.kriterien_score - b.kriterien_score); break;
      case 'id_asc': sorted.sort((a, b) => a.id - b.id); break;
      case 'id_desc': sorted.sort((a, b) => b.id - a.id); break;
    }
    return sorted;
  }

  // --- Filter Bar ---
  function initFilterBar() {
    // Workshop filter buttons
    document.querySelectorAll('[data-filter-workshop]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-workshop]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentWorkshopFilter = btn.dataset.filterWorkshop;
        renderIdeas();
      });
    });

    // Status filter buttons
    document.querySelectorAll('[data-filter-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-status]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStatusFilter = btn.dataset.filterStatus;
        renderIdeas();
      });
    });

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderIdeas();
      });
    }
  }

  // --- Render Top 10 ---
  function renderTop10() {
    const grid = document.getElementById('top10Grid');
    if (!grid || !DATA) return;

    const top10 = DATA.ideas
      .filter(i => i.is_top10)
      .sort((a, b) => b.kriterien_score - a.kriterien_score || b.lokalbezug_score - a.lokalbezug_score);

    top10.forEach((idea, idx) => {
      const card = document.createElement('div');
      card.className = 'top10-card reveal';
      card.style.transitionDelay = Math.min(idx * 0.08, 0.6) + 's';

      const coreConcept = idea.core_concept || idea.core_conzept || '';
      const stars = renderStars(idea.lokalbezug_score);

      card.innerHTML = `
        <div class="top10-rank">${idx + 1}</div>
        <h3 class="top10-name">${idea.name}</h3>
        <div class="idea-badges" style="margin-bottom:0.75rem;">
          <span class="idea-badge badge-workshop" data-ws="${idea.workshop}">${WS_NAMES[idea.workshop]}</span>
          ${idea.is_unterschaetzt ? '<span class="idea-badge badge-unterschaetzt">💎 Unterschätzt</span>' : ''}
        </div>
        <div class="top10-scores">
          <div>
            <span class="top10-score-big">${idea.kriterien_score}</span>
            <span class="top10-score-max">/21 Punkte</span>
          </div>
          <div class="top10-stars">${stars}</div>
        </div>
        <div class="top10-detail">
          <div class="top10-detail-row"><strong>Kernkonzept</strong><p>${coreConcept}</p></div>
          <div class="top10-detail-row"><strong>Eisenach-Bezug</strong><p>${idea.eisenach_bezug}</p></div>
          <div class="top10-detail-row"><strong>Jugend-Rolle</strong><p>${idea.jugend_rolle}</p></div>
          <div class="top10-detail-row"><strong>machen!-Fit</strong><p>${idea.machen_fit}</p></div>
          <div class="top10-detail-row"><strong>Method-Trigger</strong><p>${idea.method_trigger}</p></div>
        </div>
      `;

      grid.appendChild(card);
      if (window._revealObserver) window._revealObserver.observe(card);
    });
  }

  // --- Render Verworfen ---
  function renderVerworfen() {
    const grid = document.getElementById('verworfenGrid');
    if (!grid || !DATA) return;

    const verworfen = DATA.ideas.filter(i => i.is_verworfen && !i.is_top15);

    verworfen.forEach((idea, idx) => {
      const card = document.createElement('div');
      card.className = 'verworfen-card reveal';
      card.style.transitionDelay = Math.min(idx * 0.03, 0.4) + 's';

      // Determine reason
      let reason = '';
      if (idea.is_papertiger) {
        reason = 'Papiertiger — klingt gut, aber kaum umsetzbar oder zu generisch.';
      } else if (idea.lokalbezug_score <= 1) {
        reason = 'Zu geringer Lokalbezug — Idee ist auf andere Städte übertragbar.';
      } else if (idea.kriterien_score < 19) {
        reason = `Kriterien-Score (${idea.kriterien_score}/21) nicht ausreichend für Top 15.`;
      } else {
        reason = 'Im Vergleich zu anderen Ideen nicht genug Potenzial für den Antrag.';
      }

      card.innerHTML = `
        <div class="verworfen-name">${idea.name}</div>
        <div class="verworfen-reason">${reason}</div>
        <div class="verworfen-score">Score: ${idea.kriterien_score}/21 | Lokalbezug: ${'⭐'.repeat(idea.lokalbezug_score)}</div>
      `;

      grid.appendChild(card);
      if (window._revealObserver) window._revealObserver.observe(card);
    });
  }

  // --- Countdown Timer ---
  function initCountdown() {
    const deadline = new Date('2026-05-05T23:59:59+02:00').getTime();

    function update() {
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        document.getElementById('cdDays').textContent = '0';
        document.getElementById('cdHours').textContent = '0';
        document.getElementById('cdMinutes').textContent = '0';
        document.getElementById('cdSeconds').textContent = '0';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = document.getElementById('cdDays');
      const hEl = document.getElementById('cdHours');
      const mEl = document.getElementById('cdMinutes');
      const sEl = document.getElementById('cdSeconds');

      if (dEl) dEl.textContent = days;
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
      if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

})();
