}
  


(function(){
  const $ = s => document.querySelector(s);
  const longUrl = $('#longUrl');
  const shortUrl = $('#shortUrl');
  const shortenBtn = $('#shorten');
  const copyBtn = $('#copyBtn');
  const labShort = $('#labShort');
  const actions2 = $('#actions2');

  function normalise(url){
    if(!url) return '';
    url = url.trim();
    if(!/^([a-z]+:)?\/\//i.test(url)){ url = 'https://' + url; }
    try { new URL(url); return url; } catch { return ''; }
  }

  async function tryCleanURI(u){
    const res = await fetch('https://cleanuri.com/api/v1/shorten', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body: 'url=' + encodeURIComponent(u)
    });
    const data = await res.json();
    if(data && data.result_url) return data.result_url;
    throw new Error(data && data.error ? data.error : 'cleanuri failed');
  }
  async function tryIsGd(u){
    const res = await fetch('https://is.gd/create.php?format=json&url=' + encodeURIComponent(u));
    const data = await res.json();
    if(data && data.shorturl) return data.shorturl;
    throw new Error('is.gd failed');
  }
  async function tryShrtco(u){
    const res = await fetch('https://api.shrtco.de/v2/shorten?url=' + encodeURIComponent(u));
    const data = await res.json();
    if(data && data.ok && data.result && (data.result.full_short_link || data.result.short_link)){
      return data.result.full_short_link || data.result.short_link;
    }
    throw new Error((data && data.error) || 'shrtco failed');
  }

  async function shorten(u){
    const providers = [tryCleanURI, tryIsGd, tryShrtco];
    let lastErr;
    for(const p of providers){
      try{ return await p(u); }catch(e){ lastErr=e; }
    }
    throw lastErr || new Error('All providers failed');
  }

  async function generate(){
    const url = normalise(longUrl.value);
    if(!url){ longUrl.focus(); return; }
    shortenBtn.disabled = true;

    labShort.style.display = '';
    shortUrl.style.display = '';
    actions2.style.display = '';
    shortUrl.value = 'Working…';
    copyBtn.disabled = true;

    try{
      const s = await shorten(url);
      shortUrl.value = s;
      copyBtn.disabled = false;
    }catch(e){
      shortUrl.value = '';
    }finally{
      shortenBtn.disabled = false;
    }
  }

  shortenBtn.addEventListener('click', generate);
  longUrl.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); generate(); } });

  copyBtn.addEventListener('click', async () => {
    try{ await navigator.clipboard.writeText(shortUrl.value); }
    catch{ shortUrl.select(); document.execCommand('copy'); }
    copyBtn.textContent = 'Copied';
    setTimeout(() => copyBtn.textContent = 'Copy', 1200);
  });
})();
