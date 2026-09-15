(() => {
  const input = document.getElementById('manual-search');
  if (!input) return;
  const cards = [...document.querySelectorAll('.manual-card')];
  const status = document.getElementById('search-status');
  const normalize = value => value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const entries = cards.map(card => ({ card, text: normalize([...card.querySelectorAll('h3, p')].map(el => el.textContent).join(' ')) }));
  function filter() {
    const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    let matches = 0;
    entries.forEach(({card, text}) => {
      card.hidden = !terms.every(term => text.includes(term));
      if (!card.hidden) matches++;
    });
    status.textContent = matches === 0 ? 'No manuals found. Try a different title or keyword.' : `${matches} of ${cards.length} manuals shown`;
  }
  input.addEventListener('input', filter);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { input.value = ''; filter(); }
  });
  filter();
  document.querySelector('.manual-search').hidden = false;
})();
