(function () {
  'use strict';

  const SUBSCRIBE_URL = '#'; // Q4=B: toast fallback

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function isHome() {
    const p = location.pathname.replace(/\/index\.html$/i, '/');
    return p === '/' || p === '';
  }

  async function safeFetch(url, fallback) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return fallback;
      return await r.json();
    } catch (e) {
      return fallback;
    }
  }

  function ensureSection(parent, key, html) {
    let el = parent.querySelector(`[data-au-section="${key}"]`);
    if (!el) {
      el = document.createElement('section');
      el.dataset.auSection = key;
      el.className = `au-${key}`;
      parent.appendChild(el);
    }
    el.innerHTML = html;
    return el;
  }

  const HERO_HTML = (p) => `
    <div class="au-hero-text">
      <p class="au-hero-kicker">${esc(p.kicker || 'Aurora Notebook')}</p>
      <h1 class="au-hero-title">${esc(p.title || '记录思考，分享生活，探索无限可能。')}</h1>
      <p class="au-hero-intro">${esc(p.intro || '一个偏技术与设计的独立写作空间。')}</p>
      <div class="au-hero-actions">
        <a class="au-btn-primary" href="/archives/">浏览文章</a>
        <a class="au-btn-ghost" href="/about/">关于我</a>
      </div>
    </div>
    <div class="au-hero-orb" aria-hidden="true"></div>
    <div class="au-hero-floats" aria-hidden="true">
      <span style="left:18%; top:24%;"></span>
      <span style="left:8%; bottom:18%;"></span>
      <span style="right:30%; top:18%;"></span>
    </div>
  `;

  const STATS_HTML = (s) => `
    <div class="au-stat">
      <div class="au-stat-icon"></div>
      <div class="au-stat-num">${s.posts || 0}</div>
      <div class="au-stat-label">文章总数</div>
    </div>
    <div class="au-stat">
      <div class="au-stat-icon"></div>
      <div class="au-stat-num">${s.weekViews || 0}</div>
      <div class="au-stat-label">周已展示</div>
    </div>
    <div class="au-stat">
      <div class="au-stat-icon"></div>
      <div class="au-stat-num">${s.cats || 0}</div>
      <div class="au-stat-label">分类</div>
    </div>
    <div class="au-stat">
      <div class="au-stat-icon"></div>
      <div class="au-stat-num">${s.since || 2021}</div>
      <div class="au-stat-label">加入时间</div>
    </div>
  `;

  const CARD_HTML = (a) => `
    <a class="au-article-card" href="${esc(a.path || a.url || '#')}">
      <img class="au-thumb" src="${esc(a.cover || '/img/default.png')}" alt="${esc(a.title)}" loading="lazy">
      <div class="au-card-body">
        <span class="au-tag">${esc(a.categories?.[0] || a.category || '未分类')}</span>
        <h3 class="au-card-title">${esc(a.title)}</h3>
        <div class="au-card-meta">
          <img class="au-card-avatar" src="/img/avatar.png" alt="" width="20" height="20">
          <span>Aurora · ${esc(a.date || '')}</span>
          <span class="au-card-arrow">→</span>
        </div>
      </div>
    </a>
  `;

  const LATEST_HTML = (list) => `
    <header class="au-section-head">
      <h2>最新文章</h2>
      <a href="/archives/">查看全部 →</a>
    </header>
    <div class="au-article-grid">
      ${list.slice(0, 3).map(CARD_HTML).join('')}
    </div>
  `;

  const NEWSLETTER_HTML = `
    <h2>邂蛋的私藏内容</h2>
    <p>不定期把笔记里值得看的整理成简报，0 广告 0 弹窗。</p>
    <form id="aurora-newsletter-form" action="${SUBSCRIBE_URL}" method="post" target="_blank" novalidate>
      <input type="email" name="email" placeholder="email@example.com" required>
      <button type="submit">订阅</button>
    </form>
  `;

  function decorateGlobal() {
    document.body.classList.add('aurora-ui');
    const brand = document.querySelector('.navbar-brand strong');
    if (brand && !document.querySelector('.au-wordmark')) {
      const w = document.createElement('span');
      w.className = 'au-wordmark';
      w.textContent = ' · Aurora';
      brand.parentNode.insertBefore(w, brand.nextSibling);
    }
  }

  function observeIn() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-au-section]').forEach(el => io.observe(el));
  }

  async function decorateHome() {
    if (!isHome()) return;
    const shell = document.querySelector('.home-premium-shell');
    if (!shell) return;

    const [profile, stats, recent] = await Promise.all([
      safeFetch('/home-profile.json', {
        kicker: 'Aurora Notebook',
        title: '记录思考，分享生活，探索无限可能。',
        intro: '一个偏技术与设计的独立写作空间。'
      }),
      safeFetch('/api/stats.json', {
        posts: 32,
        weekViews: 12,
        cats: 8,
        since: 2021
      }),
      safeFetch('/api/recent.json', [])
    ]);

    ensureSection(shell, 'hero', HERO_HTML(profile));
    ensureSection(shell, 'stats', STATS_HTML(stats));
    if (recent && recent.length > 0) {
      ensureSection(shell, 'latest', LATEST_HTML(recent));
    }
    ensureSection(shell, 'newsletter', NEWSLETTER_HTML);

    bindNewsletter();
    observeIn();
  }

  function bindNewsletter() {
    const form = document.querySelector('#aurora-newsletter-form');
    if (!form) return;
    if (SUBSCRIBE_URL === '#') {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        toast('订阅功能正在筹备中');
      });
    }
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'au-toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:12px 24px;background:#1c1f26;color:#f0eee8;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:9999;font-size:14px;';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }

  ready(() => {
    decorateGlobal();
    decorateHome();
  });
})();
