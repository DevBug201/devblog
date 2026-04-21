(() => {
  'use strict';

  const root = document.getElementById('root');
  if (!root) return;

  const TAG_COLOR = {
    BREACH: '#ff0000',
    IA: '#0000ff',
    'TECNOLOGÍA': '#007700'
  };

  const state = {
    posts: [],
    filter: 'TODOS',
    activePostId: null,
    loading: true,
    error: ''
  };

  function fmtDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);

    Object.entries(props).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (k === 'className') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    });

    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c === null || c === undefined) return;
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });

    return node;
  }

  function buildTag(tag) {
    const color = TAG_COLOR[tag] || '#000';
    return el('span', {
      text: tag === 'BREACH' ? 'BRECHA' : tag,
      style: {
        background: color,
        color: '#fff',
        fontSize: '10px',
        fontWeight: '800',
        padding: '3px 10px',
        letterSpacing: '0.2em',
        display: 'inline-block'
      }
    });
  }

  function buildHeader() {
    const now = new Date();
    const p = (n) => String(n).padStart(2, '0');

    const wrap = el('header');

    const top = el('div', { className: 'masthead-grid', style: { borderBottom: 'var(--b)', padding: '22px 0 14px' } });
    const combo = el('div', { className: 'header-combo' });
    const inner = el('div', { className: 'combo-inner' });

    const left = el('div', { className: 'brand-panel combo-left', style: { padding: '14px 14px 10px', background: '#fff' } });
    left.appendChild(el('div', {
      className: 'masthead-meta',
      text: `EDICIÓN EN VIVO · ${p(now.getHours())}:${p(now.getMinutes())}`,
      style: { fontSize: '10px', letterSpacing: '0.24em', color: '#666', marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px solid #ddd' }
    }));
    const h1 = el('h1', { className: 'brand-title', style: { fontSize: 'clamp(56px,9vw,108px)', fontWeight: '800', lineHeight: '.86', letterSpacing: '-0.05em', color: '#000', marginBottom: '8px' } });
    h1.appendChild(document.createTextNode('DEV'));
    h1.appendChild(el('span', { text: 'BLOG', style: { color: '#ff0000' } }));
    left.appendChild(h1);
    left.appendChild(el('p', {
      className: 'brand-sub',
      text: 'SEGURIDAD · INTELIGENCIA ARTIFICIAL · TECNOLOGÍA CRÍTICA',
      style: { fontSize: '11px', letterSpacing: '0.2em', color: '#777', marginTop: '8px', marginBottom: '0', paddingTop: '10px', borderTop: '2px solid #000' }
    }));

    const right = el('div', { className: 'edition-panel combo-right', style: { padding: '14px 16px', background: '#fff' } });
    right.appendChild(el('div', {
      text: `EDICIÓN ${fmtDate(now.toISOString().slice(0, 10))}`,
      style: { fontSize: '10px', letterSpacing: '0.16em', color: '#555', fontWeight: '800', marginBottom: '8px' }
    }));

    const stats = el('div', { className: 'edition-stats' });
    const statData = [
      ['PUBLICADOS', state.posts.length],
      ['BRECHAS', state.posts.filter((x) => x.tag === 'BREACH').length],
      ['IA', state.posts.filter((x) => x.tag === 'IA').length]
    ];

    statData.forEach(([label, value]) => {
      const s = el('div', { className: 'edition-stat', style: { border: '2px solid #000', padding: '8px 8px 6px' } });
      s.appendChild(el('div', { text: label, style: { fontSize: '10px', letterSpacing: '0.12em', color: '#555' } }));
      s.appendChild(el('div', { text: String(value).padStart(2, '0'), style: { fontSize: '30px', fontWeight: '800', lineHeight: '1', color: '#000' } }));
      stats.appendChild(s);
    });

    right.appendChild(stats);

    inner.appendChild(left);
    inner.appendChild(right);
    combo.appendChild(inner);
    top.appendChild(combo);
    wrap.appendChild(top);

    const filters = ['TODOS', 'BREACH', 'IA', 'TECNOLOGÍA'];
    const filterRow = el('div', { className: 'filter-scroll' });
    filters.forEach((f, i) => {
      const active = state.filter === f;
      const color = TAG_COLOR[f] || '#000';
      filterRow.appendChild(el('button', {
        text: f === 'BREACH' ? 'BRECHAS' : f,
        onClick: () => {
          state.filter = f;
          state.activePostId = null;
          render();
        },
        style: {
          background: active ? (f === 'TODOS' ? '#000' : color) : 'transparent',
          color: active ? '#fff' : (f === 'TODOS' ? '#000' : color),
          border: '2px solid #000',
          borderRight: i < filters.length - 1 ? 'none' : '2px solid #000',
          fontFamily: 'var(--font)',
          fontSize: '11px',
          fontWeight: '800',
          padding: '12px 22px',
          cursor: 'pointer',
          letterSpacing: '0.16em'
        }
      }));
    });

    wrap.appendChild(filterRow);
    return wrap;
  }

  function buildStatRow(posts) {
    const row = el('div', { className: 'stat-grid' });
    const items = [
      ['PUBLICADOS', posts.length, '#000'],
      ['BRECHAS', posts.filter((p) => p.tag === 'BREACH').length, '#ff0000'],
      ['IA', posts.filter((p) => p.tag === 'IA').length, '#0000ff'],
      ['TECNOLOGÍA', posts.filter((p) => p.tag === 'TECNOLOGÍA').length, '#007700']
    ];

    items.forEach(([label, value, color]) => {
      const c = el('div', { className: 'stat-cell' });
      c.appendChild(el('div', { text: String(value).padStart(2, '0'), style: { fontSize: 'clamp(28px,4vw,48px)', fontWeight: '800', letterSpacing: '-0.04em', color, lineHeight: '1' } }));
      c.appendChild(el('div', { text: label, style: { fontSize: '10px', letterSpacing: '0.2em', color: '#888', marginTop: '6px' } }));
      row.appendChild(c);
    });

    return row;
  }

  function renderBodyText(container, text, color) {
    let secIdx = 0;
    text.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        container.appendChild(el('div', { style: { height: '14px' } }));
        return;
      }
      if (trimmed.startsWith('# ')) {
        const h2 = el('h2', {
          id: `section-${secIdx++}`,
          text: trimmed.slice(2),
          style: {
            fontSize: '14px',
            fontWeight: '800',
            letterSpacing: '0.16em',
            color,
            marginTop: '38px',
            marginBottom: '12px',
            textTransform: 'uppercase',
            borderBottom: `2px solid ${color}`,
            paddingBottom: '7px'
          }
        });
        container.appendChild(h2);
        return;
      }
      if (trimmed.startsWith('- ')) {
        const row = el('div', { style: { display: 'flex', gap: '14px', marginBottom: '10px', paddingLeft: '4px' } });
        row.appendChild(el('span', { text: '—', style: { color, flexShrink: '0', fontWeight: '800' } }));
        row.appendChild(el('span', { text: trimmed.slice(2), style: { fontSize: '15px', lineHeight: '1.9', color: '#222' } }));
        container.appendChild(row);
        return;
      }
      const numMatch = trimmed.match(/^(\d+)\.\s+/);
      if (numMatch) {
        const row = el('div', { style: { display: 'flex', gap: '12px', marginBottom: '10px', paddingLeft: '4px' } });
        row.appendChild(el('span', { text: `${numMatch[1]}.`, style: { color, flexShrink: '0', fontWeight: '800', minWidth: '20px' } }));
        row.appendChild(el('span', { text: trimmed.replace(/^(\d+)\.\s+/, ''), style: { fontSize: '15px', lineHeight: '1.9', color: '#222' } }));
        container.appendChild(row);
        return;
      }
      container.appendChild(el('p', { text: trimmed, style: { fontSize: '15px', lineHeight: '1.92', color: '#222', marginBottom: '6px' } }));
    });
  }

  function renderDetail(post) {
    const color = TAG_COLOR[post.tag] || '#000';
    const shell = el('div', { className: 'pIn detail-shell' });

    const top = el('div', { style: { margin: '24px 0 18px' } });
    top.appendChild(el('button', {
      text: '← ÍNDICE',
      onClick: () => {
        state.activePostId = null;
        render();
      },
      style: {
        background: 'var(--bg)', border: 'var(--b)', color: '#000', fontFamily: 'var(--font)',
        fontSize: '11px', fontWeight: '700', padding: '9px 16px', cursor: 'pointer', letterSpacing: '0.12em'
      }
    }));
    shell.appendChild(top);

    const wrap = el('div', { className: 'detail-article' });
    const tagRow = el('div', { style: { display: 'flex', gap: '9px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' } });
    tagRow.appendChild(buildTag(post.tag));
    tagRow.appendChild(el('span', { text: `${fmtDate(post.date)} · ${post.readTime || '1 min'} de lectura`, style: { marginLeft: 'auto', fontSize: '11px', color: '#aaa', letterSpacing: '0.08em' } }));
    wrap.appendChild(tagRow);

    wrap.appendChild(el('h1', {
      text: post.title,
      style: {
        fontSize: 'clamp(22px,3vw,52px)', fontWeight: '800', lineHeight: '1.14', letterSpacing: '-0.028em',
        marginBottom: '24px', paddingBottom: '22px', borderBottom: 'var(--b)', color: '#000'
      }
    }));

    const summary = el('div', { style: { borderLeft: `6px solid ${color}`, paddingLeft: '20px', marginBottom: '20px' } });
    summary.appendChild(el('p', { text: post.summary, style: { fontSize: '15px', lineHeight: '1.78', fontStyle: 'italic', color: '#333' } }));
    wrap.appendChild(summary);

    const bodyBox = el('div', { style: { border: 'var(--b)', padding: '24px 24px 14px', background: '#fff' } });
    renderBodyText(bodyBox, post.body || '', color);
    wrap.appendChild(bodyBox);

    shell.appendChild(wrap);
    return shell;
  }

  function renderIndex(posts) {
    const main = el('main');

    if (state.loading) {
      main.appendChild(el('div', {
        className: 'enter',
        text: 'CARGANDO PUBLICACIONES...',
        style: { border: 'var(--b)', borderTop: 'none', padding: '44px 32px', fontSize: '12px', color: '#777', letterSpacing: '0.1em' }
      }));
      return main;
    }

    if (state.error) {
      main.appendChild(el('div', {
        className: 'enter',
        text: state.error,
        style: { border: 'var(--b)', borderTop: 'none', padding: '16px 20px', fontSize: '11px', color: '#ff0000', fontWeight: '700', letterSpacing: '0.1em' }
      }));
    }

    if (!posts.length) {
      const empty = el('div', {
        className: 'enter',
        style: { border: 'var(--b)', borderTop: 'none', padding: '72px 40px', textAlign: 'center' }
      });
      empty.appendChild(el('div', { text: 'SIN ARTÍCULOS', style: { fontSize: 'clamp(40px,6vw,72px)', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1', marginBottom: '20px' } }));
      main.appendChild(empty);
      return main;
    }

    const [featured, ...rest] = posts;
    const fColor = TAG_COLOR[featured.tag] || '#000';
    const featuredCard = el('article', {
      className: 'card enter featured-card',
      onClick: () => {
        state.activePostId = featured.id;
        render();
      },
      style: { border: 'var(--b)', borderTop: 'none', padding: '36px 40px', background: '#fff' }
    });

    const fl = el('div', { className: 'featured-layout' });
    const left = el('div');
    left.appendChild(el('div', { text: '★ MÁS RECIENTE', style: { fontSize: '10px', letterSpacing: '0.28em', color: '#aaa', marginBottom: '16px', fontWeight: '700' } }));
    const tags = el('div', { style: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' } });
    tags.appendChild(buildTag(featured.tag));
    left.appendChild(tags);
    left.appendChild(el('h2', { text: featured.title, style: { fontSize: 'clamp(18px,2.4vw,28px)', fontWeight: '800', lineHeight: '1.18', letterSpacing: '-0.025em', color: '#000' } }));

    const right = el('div', { style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } });
    right.appendChild(el('p', { text: featured.summary, style: { fontSize: '14px', lineHeight: '1.85', color: '#333' } }));
    const meta = el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', letterSpacing: '0.08em', marginTop: '24px', flexWrap: 'wrap', gap: '8px' } });
    meta.appendChild(el('span', { text: 'Leer artículo →', style: { color: fColor, fontWeight: '700' } }));
    meta.appendChild(el('span', { text: `${fmtDate(featured.date)} · ${featured.readTime || '1 min'}` }));
    right.appendChild(meta);

    fl.appendChild(left);
    fl.appendChild(right);
    featuredCard.appendChild(fl);
    main.appendChild(featuredCard);

    if (rest.length) {
      const grid = el('div', { style: { display: 'flex', flexWrap: 'wrap', borderLeft: 'var(--b)', borderBottom: 'var(--b)' } });
      rest.forEach((post) => {
        const color = TAG_COLOR[post.tag] || '#000';
        const cell = el('div', { style: { flex: '1 1 300px', borderTop: 'var(--b)', borderRight: 'var(--b)' } });
        const card = el('article', {
          className: 'card enter news-card',
          onClick: () => {
            state.activePostId = post.id;
            render();
          },
          style: { padding: '28px', height: '100%', background: '#fff' }
        });

        const tr = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' } });
        tr.appendChild(buildTag(post.tag));
        tr.appendChild(el('span', { text: fmtDate(post.date), style: { fontSize: '11px', color: '#aaa' } }));
        card.appendChild(tr);
        card.appendChild(el('h2', { text: post.title, style: { fontSize: '15px', fontWeight: '700', lineHeight: '1.42', marginBottom: '14px', letterSpacing: '-0.01em', color: '#000' } }));
        card.appendChild(el('p', { text: post.summary, style: { fontSize: '13px', lineHeight: '1.8', color: '#444', marginBottom: '20px' } }));
        const m = el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', letterSpacing: '0.08em' } });
        m.appendChild(el('span', { text: 'Leer →', style: { color, fontWeight: '700' } }));
        m.appendChild(el('span', { text: post.readTime || '1 min' }));
        card.appendChild(m);

        cell.appendChild(card);
        grid.appendChild(cell);
      });
      main.appendChild(grid);
    }

    return main;
  }

  async function loadPosts() {
    state.loading = true;
    state.error = '';
    try {
      const res = await fetch(`./data/posts.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !Array.isArray(data.posts)) throw new Error('Formato inválido de posts.json');
      state.posts = data.posts;
    } catch (err) {
      state.posts = [];
      state.error = 'No se pudo cargar data/posts.json.';
    } finally {
      state.loading = false;
    }
  }

  function render() {
    root.replaceChildren();

    const shell = el('div', { className: 'page-shell' });
    shell.appendChild(buildHeader());

    const filtered = state.filter === 'TODOS' ? state.posts : state.posts.filter((p) => p.tag === state.filter);
    shell.appendChild(buildStatRow(filtered));

    const currentPost = state.activePostId !== null ? state.posts.find((p) => p.id === state.activePostId) : null;

    if (currentPost) shell.appendChild(renderDetail(currentPost));
    else shell.appendChild(renderIndex(filtered));

    shell.appendChild(el('footer', {
      style: {
        borderTop: 'var(--b)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '10px',
        color: '#bbb',
        letterSpacing: '0.12em',
        marginTop: '40px'
      }
    }, [
      el('span', { text: 'DEVBLOG © 2026' }),
      el('span', { text: 'SEGURIDAD · IA · TECNOLOGÍA CRÍTICA' })
    ]));

    root.appendChild(shell);
  }

  (async () => {
    await loadPosts();
    render();
  })();
})();
