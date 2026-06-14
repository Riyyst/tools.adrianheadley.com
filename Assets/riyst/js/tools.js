/* Tools page interactions (Riyst layout, Mk3 palette)
   - Reveal-on-scroll
   - Back-to-top button
   - Live search filter
*/

(function(){
  const ready = (fn) => {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  };

  /* Reveal-on-scroll */
  function initReveal(){
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced){
      reveals.forEach(el => el.classList.add('reveal-in'));
      return;
    }

    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries){
          if (entry.isIntersecting){
            entry.target.classList.add('reveal-in');
            io.unobserve(entry.target);
          }
        }
      }, { rootMargin: '0px 0px -20% 0px' });
      reveals.forEach(el => io.observe(el));
    } else {
      reveals.forEach(el => el.classList.add('reveal-in'));
    }
  }

  /* Back-to-top */
  function initBackToTop(){
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    const firstHeading = document.querySelector('section.stack h3[id]') || document.querySelector('h3[id]');

    const show = () => btn.classList.add('show');
    const hide = () => btn.classList.remove('show');

    if ('IntersectionObserver' in window && firstHeading){
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) hide();
        else show();
      }, { rootMargin: '-96px 0px 0px 0px', threshold: 0 });
      io.observe(firstHeading);
    } else {
      const onScroll = () => {
        if (window.scrollY > 360) show();
        else hide();
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Live search */
  function initSearch(){
    const input = document.getElementById('toolSearch');
    if (!input) return;
    const hint = document.getElementById('searchHint');
    const tiles = Array.from(document.querySelectorAll('a.tile'));
    const total = tiles.length;

    const getText = (tile) => {
      const title = tile.querySelector('.tile__title')?.textContent || '';
      const desc  = tile.querySelector('.tile__desc')?.textContent || '';
      return (title + ' ' + desc).toLowerCase();
    };
    const index = tiles.map(getText);

    function updateHint(q, shown){
      if (!hint) return;
      if (!q){ hint.textContent = `Showing all ${total} tools.`; return; }
      if (shown === 0){ hint.textContent = `No matches for "${q}".`; return; }
      hint.textContent = `Showing ${shown} of ${total} for "${q}".`;
    }

    function filter(){
      const q = input.value.toLowerCase().trim();
      let shown = 0;
      for (let i = 0; i < tiles.length; i++){
        const match = !q || index[i].includes(q);
        tiles[i].setAttribute('data-search-hide', match ? '0' : '1');
        if (match) shown++;
      }
      // Hide empty category sections when searching
      const catHeads = document.querySelectorAll('h3[id^="cat-"]');
      catHeads.forEach((h) => {
        const grid = h.nextElementSibling;
        if (!grid || !grid.classList || !grid.classList.contains('tiles')) return;
        const visibleCount = Array.from(grid.querySelectorAll('.tile')).filter(t => t.getAttribute('data-search-hide') !== '1').length;
        const hide = !!q && visibleCount === 0;
        h.style.display = hide ? 'none' : '';
        grid.style.display = hide ? 'none' : '';
      });

      updateHint(q, shown);
    }

    input.addEventListener('input', filter, { passive: true });
    updateHint('', total);
  }

  ready(() => {
    initReveal();
    initBackToTop();
    initSearch();
  });
})();
