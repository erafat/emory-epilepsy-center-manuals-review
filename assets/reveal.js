// Open the enclosing disclosure when search links directly to hidden content.
(() => {
  function reveal() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      if (parent.tagName === 'DIALOG' && !parent.open && typeof parent.showModal === 'function') parent.showModal();
    }
    target.scrollIntoView();
  }
  window.addEventListener('hashchange', reveal); reveal();
})();
