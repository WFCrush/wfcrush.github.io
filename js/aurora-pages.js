(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function p() {
    return location.pathname.replace(/\/index\.html$/i, '/');
  }

  ready(async () => {
    document.body.classList.add('aurora-ui');

    const path = p();
    if (path.startsWith('/archives')) decorateArchives();
    if (path.startsWith('/about')) await decorateAbout();
    if (path.startsWith('/projects')) decorateProjects();
  });

  function decorateArchives() {
    const board = document.querySelector('#board');
    if (!board || board.querySelector('.au-list-shell')) return;

    const wrap = document.createElement('div');
    wrap.className = 'au-list-shell';
    board.parentNode.insertBefore(wrap, board);

    const aside = document.createElement('aside');
    aside.className = 'au-list-side';
    aside.innerHTML = `
      <div class="au-list-years">
        <h4>归档年份</h4>
        <div class="au-years-list"></div>
      </div>
      <div class="au-list-tags">
        <h4>标签</h4>
        <div class="au-tags-list"></div>
      </div>
    `;

    wrap.appendChild(aside);
    board.classList.add('au-list-main');
    wrap.appendChild(board);

    const years = new Set();
    board.querySelectorAll('time, .list-group-item-date').forEach(t => {
      const m = t.textContent.match(/(\d{4})/);
      if (m) years.add(m[1]);
    });

    const yearsList = aside.querySelector('.au-years-list');
    [...years].sort().reverse().forEach(y => {
      const a = document.createElement('a');
      a.href = `#${y}`;
      a.textContent = y;
      yearsList.appendChild(a);
    });

    const tags = new Set();
    board.querySelectorAll('.list-group-item').forEach(item => {
      const cat = item.querySelector('.badge, .tag, [class*="category"]');
      if (cat) tags.add(cat.textContent.trim());
    });

    const tagsList = aside.querySelector('.au-tags-list');
    [...tags].slice(0, 12).forEach(tag => {
      const a = document.createElement('a');
      a.href = `/tags/${encodeURIComponent(tag)}/`;
      a.textContent = tag;
      tagsList.appendChild(a);
    });
  }

  async function decorateAbout() {
    const md = document.querySelector('.markdown-body');
    if (!md || md.querySelector('.au-about-skills')) return;

    let skills = [];
    try {
      const res = await fetch('/about/skills.json', { cache: 'no-store' });
      if (res.ok) skills = await res.json();
    } catch (e) {
      console.warn('Failed to load skills.json', e);
    }

    if (!skills || !skills.length) {
      skills = [
        { name: 'React', pct: 75 },
        { name: 'TypeScript', pct: 80 },
        { name: 'Node.js', pct: 65 },
        { name: 'UI/UX', pct: 70 },
        { name: 'Next.js', pct: 60 }
      ];
    }

    const sec = document.createElement('section');
    sec.className = 'au-about-skills';
    skills.forEach(s => {
      const name = document.createElement('div');
      name.className = 'au-skill-name';
      name.textContent = s.name;
      sec.appendChild(name);

      const bar = document.createElement('div');
      bar.className = 'au-skill-bar';
      bar.style.setProperty('--pct', `${s.pct || 0}%`);
      sec.appendChild(bar);
    });
    md.appendChild(sec);

    setTimeout(() => {
      sec.querySelectorAll('.au-skill-bar').forEach(bar => {
        bar.style.setProperty('--pct', bar.style.getPropertyValue('--pct'));
      });
    }, 100);
  }

  function decorateProjects() {
    document.querySelectorAll('.aurora-project-card img').forEach(img => {
      if (!img.loading) img.loading = 'lazy';
    });
  }
})();
