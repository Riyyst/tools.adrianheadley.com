}
  


(function(){
  const ready = (fn) => (document.readyState !== 'loading') ? fn() : document.addEventListener('DOMContentLoaded', fn);
  ready(() => {
    const btn = document.getElementById('backToTop');
    const firstHeading = document.querySelector('section.stack h3[id]');

    if ('IntersectionObserver' in window && firstHeading && btn) {
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) btn.classList.remove('show');
        else btn.classList.add('show');
      }, {rootMargin: "-96px 0px 0px 0px", threshold: 0});
      io.observe(firstHeading);
    } else if (btn) {
      const threshold = (firstHeading?.getBoundingClientRect().top || 600);
      const onScroll = () => {
        if (window.scrollY > threshold) btn.classList.add('show'); else btn.classList.remove('show');
      };
      window.addEventListener('scroll', onScroll, {passive:true});
      onScroll();
    }

    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({top: 0, behavior: 'smooth'});
    });
  });
})();



(function(){
  function ready(fn){ if(document.readyState!=='loading'){fn();} else {document.addEventListener('DOMContentLoaded', fn);} }
  ready(function(){
    var input = document.getElementById('newsSearch');
    var hint  = document.getElementById('searchHint');
    var containers = Array.prototype.slice.call(document.querySelectorAll('.news-grid'));
    if(!input || !hint || containers.length === 0) return;

    var tiles = [];
    containers.forEach(function(c){ tiles = tiles.concat(Array.prototype.slice.call(c.querySelectorAll('.tile'))); });
    var total = tiles.length;

    function visibleCount(){
      var n = 0;
      tiles.forEach(function(tile){
        var hidden = tile.getAttribute('data-search-hide') === '1';
        if(!hidden) n++;
      });
      return n;
    }

    function updateHint(){
      hint.textContent = 'Showing ' + visibleCount() + ' posts';
    }

    function filter(){
      var q = input.value.toLowerCase().trim();
      tiles.forEach(function(tile){
        var titleEl = tile.querySelector('.tile__title');
        var bodyTxt = tile.textContent || '';
        var txt = (titleEl ? titleEl.textContent : bodyTxt).toLowerCase();
        // match contains typed sequence (word fragment)
        var match = q === '' || txt.indexOf(q) !== -1;
        if(match){ tile.removeAttribute('data-search-hide'); }
        else { tile.setAttribute('data-search-hide','1'); }
      });
      updateHint();
    }

    input.addEventListener('input', filter, {passive:true});
    updateHint();
  });
})();
