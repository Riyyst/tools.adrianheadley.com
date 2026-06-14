}
  


    (function(){const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();})();

    const btnText = document.getElementById('btnText');
    const btnImage = document.getElementById('btnImage');
    const panelText = document.getElementById('panel-text');
    const panelImage = document.getElementById('panel-image');
    function activate(which){
      const isText = which==='text';
      btnText.classList.toggle('ghost', !isText);
      btnImage.classList.toggle('ghost', isText);
      btnText.setAttribute('aria-selected', String(isText));
      btnImage.setAttribute('aria-selected', String(!isText));
      panelText.classList.toggle('open', isText);
      panelImage.classList.toggle('open', !isText);
      if(isText){
        if(!textInput.value) renderText('Type here'); else renderText();
        updateTextButtons();
      } else {
        if(currentImg){ updateSliderBounds(); drawASCIIFromImage(); }
        updateImageButtons();
      }
    }
    btnText.addEventListener('click', ()=>activate('text'));
    btnImage.addEventListener('click', ()=>activate('image'));

    /* ===== TEXT ===== */
    const textInput = document.getElementById('textInput');
    const fontSelect = document.getElementById('fontSelect');
    const fontSize = document.getElementById('fontSize');
    const textOut = document.getElementById('textOut');
    const copyTextBtn = document.getElementById('copyTextBtn');
    const downloadTextBtn = document.getElementById('downloadTextBtn');

    let FULL_FONTS = null;
    async function fetchFullFonts(){
      if (FULL_FONTS) return FULL_FONTS;
      const POPULAR_FONTS = ['Standard','Slant','Big','Small','Banner','Bloody','Block','Bubble','Digital','Doom','Ghost','Graffiti','Ivrit','Lean','Mini','Ogre','Puffy','Rectangles','Roman','Script','Shadow','Small Slant','Soft','Speed','Star Wars','Stop','Univers','ANSI Shadow'];
      try{
        const res = await fetch('https://cdn.jsdelivr.net/gh/patorjk/figlet.js@1.8.2/fonts/');
        const html = await res.text();
        const names = [...html.matchAll(/>([^<]+\.flf)</g)].map(m=>m[1].replace(/\.flf$/,''));
        FULL_FONTS = Array.from(new Set(names)).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      }catch(e){
        console.warn('Font list fetch failed; using fallback popular list.', e);
        FULL_FONTS = POPULAR_FONTS.slice().sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      }
      return FULL_FONTS;
    }
    function setFontOptions(list){
      fontSelect.innerHTML = list.map(n=>`<option value="${n}">${n}</option>`).join('');
      if(list.includes('Standard')) fontSelect.value='Standard';
    }
    (async ()=>{ setFontOptions(await fetchFullFonts()); })();

    const loadedFonts = new Set();
    async function ensureFontLoaded(name){
      if (loadedFonts.has(name)) return;
      const url = 'https://cdn.jsdelivr.net/gh/patorjk/figlet.js@1.8.2/fonts/' + encodeURIComponent(name) + '.flf';
      const res = await fetch(url);
      const data = await res.text();
      figlet.parseFont(name, data);
      loadedFonts.add(name);
    }
    function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

    function innerWidthPx(el){ const cs=getComputedStyle(el); return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); }
    function measureCharWidth(pre, px){ const s=document.createElement('span'); s.textContent='M'.repeat(100); s.style.visibility='hidden'; s.style.fontSize=px+'px'; pre.appendChild(s); const w=s.getBoundingClientRect().width; pre.removeChild(s); return w/100; }

    async function renderText(forceSample){
      const font = fontSelect.value || 'Standard';
      await ensureFontLoaded(font);
      const requestedPx = parseInt(fontSize.value||'12',10);
      let px = requestedPx;
      const usable = Math.max(10, innerWidthPx(textOut));
      let attempts=0, data='';
      const inputText = (forceSample || textInput.value || '').trim();
      while(attempts<6){
        let chW = measureCharWidth(textOut, px);
        let colsCap = Math.max(20, Math.floor(usable / chW) - 2);
        const opts = { font, horizontalLayout:'default', verticalLayout:'default', width:colsCap, whitespaceBreak:true };
        data = await new Promise(r=>figlet.text(inputText || 'Type here', opts, (e,d)=>r(d||'')));
        const cols = Math.max(1, ...data.split('\n').map(l=>l.length));
        chW = measureCharWidth(textOut, px);
        if(cols*chW <= usable) break;
        px = Math.max(8, px-1); attempts++;
      }
      textOut.style.fontSize = px+'px';
      textOut.textContent = data;
    }

    function updateTextButtons(){
      const enabled = (textInput.value || '').trim().length > 0;
      copyTextBtn.disabled = !enabled;
      downloadTextBtn.disabled = !enabled;
    }

    document.addEventListener('DOMContentLoaded', ()=>{ renderText('Type here'); updateTextButtons(); });
    textInput.addEventListener('focus', ()=>{ if(!textInput.value){ textOut.textContent=''; } updateTextButtons(); });
    const live = debounce(()=>{ renderText(); updateTextButtons(); }, 90);
    textInput.addEventListener('input', live);
    fontSelect.addEventListener('change', ()=>{ renderText(); updateTextButtons(); });
    fontSize.addEventListener('change', ()=>{ renderText(); updateTextButtons(); });
    window.addEventListener('resize', ()=>{ renderText(); updateTextButtons(); });

    function escapeHTML(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    async function copyWithHTML(text){
      const html = `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; white-space: pre; line-height: 1.15; font-size: 12pt;">${escapeHTML(text)}</pre>`;
      if (navigator.clipboard && window.ClipboardItem){
        const item = new ClipboardItem({
          'text/plain': new Blob([text.replace(/\n/g,'\r\n')], {type:'text/plain'}),
          'text/html':  new Blob([html], {type:'text/html'})
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(text);
      }
    }
    async function renderForExportAuto(){
      const font = fontSelect.value || 'Standard';
      await ensureFontLoaded(font);
      const px = parseInt(getComputedStyle(textOut).fontSize,10);
      const usable = Math.max(10, innerWidthPx(textOut));
      const chW = measureCharWidth(textOut, px);
      const widthCols = Math.max(20, Math.floor(usable / chW) - 2);
      const opts = { font, horizontalLayout:'default', verticalLayout:'default', width:widthCols, whitespaceBreak:true };
      const inputText = (textInput.value || '').trim() || 'Type here';
      return await new Promise(r=>figlet.text(inputText, opts, (e,d)=>r(d||'')));
    }
    copyTextBtn.addEventListener('click', async ()=>{ if(copyTextBtn.disabled) return; const data=await renderForExportAuto(); await copyWithHTML(data); const prev=copyTextBtn.textContent; copyTextBtn.textContent='Copied!'; setTimeout(()=>copyTextBtn.textContent=prev,1100); });
    downloadTextBtn.addEventListener('click', async ()=>{ if(downloadTextBtn.disabled) return; const data=await renderForExportAuto(); const blob=new Blob([data], {type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='ascii-text.txt'; a.click(); URL.revokeObjectURL(url); });

    /* ===== IMAGE (Slider-based detail) ===== */
    const imageInput=document.getElementById('imageInput');
    const fileBtn=document.getElementById('fileBtn');
    const filenameEl=document.getElementById('filename');
    const workCanvas=document.getElementById('workCanvas');
    const imagePreview=document.getElementById('imagePreview');
    const imageOut=document.getElementById('imageOut');
    const copyImageBtn=document.getElementById('copyImageBtn');
    const downloadImageBtn=document.getElementById('downloadImageBtn');
    const detailRange=document.getElementById('detailRange');
    let currentImg=null;

    const CHARSET = " .:-=+*#%@";

    fileBtn.addEventListener('click', ()=> imageInput.click());
    imageInput.addEventListener('change', ()=>{
      const f=imageInput.files?.[0]; if(!f) return;
      if(!/image\/(png|jpeg)/.test(f.type)){ filenameEl.textContent='Please choose a PNG or JPG image.'; return; }
      filenameEl.textContent=f.name;
      const img=new Image();
      img.onload=()=>{ currentImg=img; updateSliderBounds(); drawASCIIFromImage(); updateImageButtons(); };
      img.onerror=()=>{ imageOut.textContent='Could not load image.'; updateImageButtons(); };
      img.src=URL.createObjectURL(f);
    });

    function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
    function measureChar(preEl){
      const s=document.createElement('span'); s.textContent='M'.repeat(100); s.style.visibility='hidden';
      preEl.appendChild(s); const w=s.getBoundingClientRect().width; const charW=w/100;
      const s2=document.createElement('span'); s2.textContent='M'; s2.style.visibility='hidden'; preEl.appendChild(s2);
      const lh=s2.getBoundingClientRect().height; preEl.removeChild(s); preEl.removeChild(s2);
      return {charW:charW,lineH:lh};
    }

    function updateSliderBounds(){
      if(!currentImg) return;
      const maxW = imagePreview.parentElement.clientWidth;
      const {charW} = measureChar(imageOut);
      const maxCols = Math.max(60, Math.floor(maxW / charW) - 2);
      const minCols = Math.max(40, Math.floor(maxCols/3));
      detailRange.min = String(minCols);
      detailRange.max = String(maxCols);
      const centered = Math.round((minCols + maxCols) / 2);
      detailRange.value = String(centered);
    }

    function drawASCIIFromImage(){
      if(!currentImg) return;
      const minC=parseInt(detailRange.min,10)||60, maxC=parseInt(detailRange.max,10)||240;
      const cols = clamp(parseInt(detailRange.value,10)||Math.round((minC+maxC)/2), minC, maxC);
      const {charW,lineH} = measureChar(imageOut);
      const aspect = currentImg.naturalHeight/currentImg.naturalWidth;
      const rows = Math.max(2, Math.round(cols*aspect*(charW/lineH)));
      imageOut.style.lineHeight = lineH + 'px';
      imageOut.style.width = Math.round(cols*charW) + 'px';
      imageOut.style.height = Math.round(rows*lineH) + 'px';

      const ctx=workCanvas.getContext('2d', { willReadFrequently:true });
      workCanvas.width=cols; workCanvas.height=rows;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(currentImg,0,0,cols,rows);
      const data=ctx.getImageData(0,0,cols,rows).data;
      const ramp=CHARSET.split('');
      let out='';
      for(let y=0;y<rows;y++){
        let line='';
        for(let x=0;x<cols;x++){
          const idx=(y*cols+x)*4; const r=data[idx], g=data[idx+1], b=data[idx+2];
          let lum=0.2126*r+0.7152*g+0.0722*b, t=lum/255;
          const i=clamp(Math.floor((1-t)*(ramp.length-1)),0,ramp.length-1); line+=ramp[i];
        }
        out+= (y<rows-1 ? line+'\n' : line);
      }
      imageOut.textContent=out;
      imageOut.style.height = imageOut.scrollHeight + 'px';
      imagePreview.style.width='auto';
      imagePreview.style.height='auto';
      updateImageButtons();
    }

    function updateImageButtons(){
      const enabled = !!currentImg && (imageOut.textContent || '').length > 0;
      copyImageBtn.disabled = !enabled;
      downloadImageBtn.disabled = !enabled;
    }

    detailRange.addEventListener('input', ()=>{ drawASCIIFromImage(); updateImageButtons(); });
    window.addEventListener('resize', ()=>{ if(currentImg){ updateSliderBounds(); drawASCIIFromImage(); updateImageButtons(); } });
