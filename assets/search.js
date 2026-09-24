(() => {
  const input = document.getElementById('manual-search');
  if (!input) return;
  const status = document.getElementById('search-status');
  const results = document.getElementById('catalog-results');
  const browse = document.getElementById('manual-results');
  const type = document.getElementById('catalog-type');
  const normalize = value => value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const labels = {form:'Form', guide:'Guide', trial:'Clinical trials', pdf:'PDF manual', external:'External manual'};
  const entries = (window.CATALOG_INDEX || []).map(entry => ({...entry, searchable: normalize([entry.title, entry.tags, ...entry.sections.map(s => s.text)].join(' '))}));
  if (!entries.length) {
    document.querySelector('.manual-search').hidden = false;
    input.disabled = true;
    type.disabled = true;
    status.textContent = 'Search is unavailable. Browse the resources below.';
    return;
  }
  function snippet(text, terms) {
    const lower = text.toLocaleLowerCase();
    const positions = terms.map(t => lower.indexOf(t)).filter(i => i >= 0);
    const first = positions.length ? Math.min(...positions) : 0;
    const start = Math.max(0, first - 65);
    return (start ? '…' : '') + text.slice(start, start + 260).trim() + (text.length > start + 260 ? '…' : '');
  }
  function highlight(element, text, terms) {
    if (!terms.length) { element.textContent = text; return; }
    const escaped = [...new Set(terms)].sort((a,b) => b.length-a.length).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escaped.join('|')})`, 'giu');
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
      element.append(document.createTextNode(text.slice(cursor, match.index)));
      const mark = document.createElement('mark'); mark.textContent = match[0]; element.append(mark);
      cursor = match.index + match[0].length;
    }
    element.append(document.createTextNode(text.slice(cursor)));
  }
  function filter(updateUrl = true) {
    const query = input.value.trim();
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const active = !!terms.length || type.value !== 'all';
    results.replaceChildren(); results.hidden = !active; browse.hidden = active;
    document.querySelectorAll('[data-browse-only]').forEach(el => { el.hidden = active; });
    if (updateUrl) {
      const url = new URL(location.href);
      query ? url.searchParams.set('q', query) : url.searchParams.delete('q');
      type.value !== 'all' ? url.searchParams.set('type', type.value) : url.searchParams.delete('type');
      history.replaceState(null, '', url);
    }
    if (!active) { status.textContent = `Search within ${entries.length} resources, or browse below.`; return; }
    const matches = entries.filter(e => (type.value === 'all' || e.kind === type.value) && terms.every(t => e.searchable.includes(t))).map(entry => {
      const scoreSection = section => terms.reduce((score,t) => score + (normalize(section.heading).includes(t) ? 6 : 0) + (normalize(section.text).includes(t) ? 2 : 0),0);
      const section = [...entry.sections].sort((a,b) => scoreSection(b)-scoreSection(a))[0];
      const score = scoreSection(section) + terms.reduce((s,t) => s + (normalize(entry.title).includes(t) ? 20 : 0),0);
      return {entry, section, score};
    }).sort((a,b) => b.score-a.score || a.entry.title.localeCompare(b.entry.title));
    status.textContent = matches.length ? `${matches.length} resource${matches.length === 1 ? '' : 's'} found` : 'No resources found. Try another phrase or choose All resources.';
    if (!matches.length) {
      const empty = document.createElement('p'); empty.textContent = 'No matches. Try “Synergy”, “Doximity”, “impedance”, or “PNEStherapy”.'; results.append(empty);
    }
    for (const {entry, section} of matches) {
      const article = document.createElement('article'); article.className = 'search-result';
      const meta = document.createElement('p'); meta.className = 'kicker'; meta.textContent = labels[entry.kind];
      const heading = document.createElement('h2'); const link = document.createElement('a');
      link.href = entry.url + (section.anchor ? '#' + section.anchor : '');
      highlight(link, entry.title, terms); heading.append(link);
      const context = document.createElement('p'); context.className = 'result-section'; context.textContent = section.heading;
      const excerpt = document.createElement('p'); highlight(excerpt, snippet(section.text,terms), terms);
      article.append(meta,heading,context,excerpt); results.append(article);
    }
  }
  const restore = () => {
    const params = new URLSearchParams(location.search); input.value = params.get('q') || '';
    type.value = [...type.options].some(o => o.value === params.get('type')) ? params.get('type') : 'all';
    filter(false);
  };
  document.querySelectorAll('.manual-tag').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.tag; type.value = 'all'; filter(); input.focus(); }));
  input.addEventListener('input', () => filter());
  type.addEventListener('change', () => filter());
  input.addEventListener('keydown', event => { if (event.key === 'Escape') { input.value = ''; type.value = 'all'; filter(); } });
  document.querySelector('a[href="#manual-results"]')?.addEventListener('click', () => { input.value = ''; type.value = 'all'; filter(); });
  window.addEventListener('popstate', restore);
  restore(); document.querySelector('.manual-search').hidden = false;
})();
