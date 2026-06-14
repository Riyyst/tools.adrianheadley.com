}
  


    // Footer year
    (function(){const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();})();

    // Elements
    const fileEl = document.getElementById('file');
    const fileBtn = document.getElementById('fileBtn');
    const filenameEl = document.getElementById('filename');
    const wEl = document.getElementById('w');
    const hEl = document.getElementById('h');

    const rowFit = document.getElementById('rowFit');
    const rowFill = document.getElementById('rowFill');
    const fitRadio = document.getElementById('m-fit');
    const fillRadio = document.getElementById('m-fill');
    const fitRadio2 = document.getElementById('m-fit2');
    const fillRadio2 = document.getElementById('m-fill2');

    const bgEl = document.getElementById('bg');
    const bgHexEl = document.getElementById('bgHex');
    const formatEl = document.getElementById('format');
    const formatEl2 = document.getElementById('format2');
    const alignEl = document.getElementById('align');

    const downloadBtn = document.getElementById('download');
    const previewCanvas = document.getElementById('canvas');
    const exportCanvas = document.getElementById('exportCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    const exportCtx = exportCanvas.getContext('2d');
    const canvasWrap = document.getElementById('canvasWrap');

    let img = null;
    let originalBase = 'image';
    let mode = 'fit';

    // File
    fileBtn.addEventListener('click', ()=> fileEl.click());
    fileEl.addEventListener('change', async ()=>{
      const f = fileEl.files?.[0];
      if(!f) return;
      filenameEl.textContent = f.name;
      originalBase = f.name.replace(/\.[^.]+$/,'') || 'image';
      img = await readImage(f);
      render();
    });

    function readImage(f){
      return new Promise((resolve,reject)=>{
        const r = new FileReader();
        r.onload = e => { const im = new Image(); im.onload = ()=>resolve(im); im.onerror = ()=>reject(new Error('Load error')); im.src = e.target.result; };
        r.onerror = ()=>reject(new Error('Read error'));
        r.readAsDataURL(f);
      });
    }

    function dimsOK(){
      const tw = parseInt(wEl.value,10);
      const th = parseInt(hEl.value,10);
      return Number.isFinite(tw)&&tw>0 && Number.isFinite(th)&&th>0 ? [tw,th] : null;
    }

    function setMode(m){
      mode = m;
      fitRadio.checked = m==='fit'; fillRadio.checked = m==='fill';
      fitRadio2.checked = m==='fit'; fillRadio2.checked = m==='fill';
      rowFit.style.display = m==='fit' ? '' : 'none';
      rowFill.style.display = m==='fill' ? '' : 'none';
      render();
    }
    fitRadio.addEventListener('change', ()=>setMode('fit'));
    fillRadio.addEventListener('change', ()=>setMode('fill'));
    fitRadio2.addEventListener('change', ()=>setMode('fit'));
    fillRadio2.addEventListener('change', ()=>setMode('fill'));

    const normHex = v => { v=(v||'').trim(); if(!v.startsWith('#')) v='#'+v; return /^#([0-9a-fA-F]{6})$/.test(v)?v.toUpperCase():null; };
    bgEl.addEventListener('input', ()=>{ bgHexEl.value = bgEl.value.toUpperCase(); render(); });
    bgHexEl.addEventListener('input', ()=>{ const v=normHex(bgHexEl.value); if(v) bgEl.value=v; render(); });

    [wEl,hEl,alignEl,formatEl,formatEl2].forEach(el=>{
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });

    
    // Detect if current image contains any transparent pixels (sampling for performance)
    function __hasAlpha(im){
      try{
        const sw = im.naturalWidth || im.width;
        const sh = im.naturalHeight || im.height;
        if(!sw || !sh) return false;
        const maxSamples = 64000;
        const scale = Math.min(1, Math.sqrt(maxSamples / (sw*sh)));
        const cw = Math.max(1, Math.floor(sw * scale));
        const ch = Math.max(1, Math.floor(sh * scale));
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        const cctx = c.getContext('2d');
        cctx.clearRect(0,0,cw,ch); // preserve alpha
        cctx.drawImage(im, 0,0, sw,sh, 0,0, cw,ch);
        const data = cctx.getImageData(0,0,cw,ch).data;
        for(let i=3;i<data.length;i+=4){ if(data[i] < 255){ return true; } }
      }catch(e){ /* cross-origin or other error; assume no alpha to avoid surprise */ }
      return false;
    }

    function render(){
      const d = dimsOK();
      if(!img || !d){
        previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
        downloadBtn.disabled = true;
        return;
      }

      const [tw,th] = d;

      // Draw exact output
      exportCanvas.width = tw; exportCanvas.height = th;
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;

      exportCtx.save();
      exportCtx.imageSmoothingEnabled = true;
      exportCtx.imageSmoothingQuality = 'high';

      if(mode==='fit'){
        const scale = Math.min(tw/sw, th/sh);
        const dw = Math.round(sw*scale), dh = Math.round(sh*scale);
        const dx = Math.floor((tw-dw)/2), dy = Math.floor((th-dh)/2);
        const fmt = (mode==='fit'?formatEl.value:formatEl2.value);
        const __imgHasAlpha = __hasAlpha(img);
        if(!(fmt==='png' && __imgHasAlpha)){
          exportCtx.fillStyle = bgEl.value;
          exportCtx.fillRect(0,0,tw,th);
        }else{
          exportCtx.clearRect(0,0,tw,th); // keep full transparency when exporting transparent PNGs
        }
        exportCtx.drawImage(img,0,0,sw,sh,dx,dy,dw,dh);
      }else{
        const scale = Math.max(tw/sw, th/sh);
        const dw = Math.round(sw*scale), dh = Math.round(sh*scale);
        let dx = Math.floor((tw-dw)/2), dy = Math.floor((th-dh)/2);
        const a = alignEl.value;
        if(a?.includes('left')) dx = 0;
        if(a?.includes('right')) dx = tw - dw;
        if(a?.includes('top')) dy = 0;
        if(a?.includes('bottom')) dy = th - dh;
        exportCtx.clearRect(0,0,tw,th);
        exportCtx.drawImage(img,dx,dy,dw,dh);
      }
      exportCtx.restore();

      // HiDPI preview
      const available = canvasWrap.clientWidth;
      const cssW = Math.min(available, tw);
      const scale = cssW / tw;
      const dpr = window.devicePixelRatio || 1;

      previewCanvas.style.width = cssW + 'px';
      previewCanvas.style.height = Math.round(th * scale) + 'px';
      previewCanvas.width = Math.round(cssW * dpr);
      previewCanvas.height = Math.round(th * scale * dpr);

      previewCtx.save();
      previewCtx.imageSmoothingEnabled = true;
      previewCtx.imageSmoothingQuality = 'high';
      previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
      previewCtx.drawImage(exportCanvas, 0,0, tw,th, 0,0, previewCanvas.width, previewCanvas.height);
      previewCtx.restore();

      downloadBtn.disabled = false;
    }

    // Download
    downloadBtn.addEventListener('click', ()=>{
      const d = dimsOK(); if(!d) return;
      const [tw,th] = d;
      const fmt = (mode==='fit'?formatEl.value:formatEl2.value);
      const name = `${originalBase}_resized_${tw}x${th}.${fmt}`;
      const mime = (fmt==='png') ? 'image/png' : 'image/jpeg';
      const quality = (fmt==='png') ? undefined : 0.92;

      exportCanvas.toBlob(blob=>{
        if(!blob){
          const dataURL = exportCanvas.toDataURL(mime, quality);
          triggerDownload(name, dataURL);
          return;
        }
        const url = URL.createObjectURL(blob);
        triggerDownload(name, url, true);
      }, mime, quality);

      function triggerDownload(filename, href, revoke=false){
        const a = document.createElement('a');
        a.download = filename; a.href = href; document.body.appendChild(a); a.click(); a.remove();
        if(revoke) setTimeout(()=>URL.revokeObjectURL(href), 1000);
      }
    });

    // Keep preview crisp on resize
    window.addEventListener('resize', ()=>{ clearTimeout(window.__rt); window.__rt = setTimeout(render, 120); });

    // Init
    setMode('fit');
