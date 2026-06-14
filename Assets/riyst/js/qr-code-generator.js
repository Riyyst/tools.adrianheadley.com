}
  


    (function(){const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();})();

    const qrText = document.getElementById('qrText');
    const format = document.getElementById('format');
    const dotColor = document.getElementById('dotColor');
    const bgColor = document.getElementById('bgColor');
    const bgTransparent = document.getElementById('bgTransparent');
    const logoFile = document.getElementById('logoFile');
    const logoDrop = document.getElementById('logoDrop');
    const logoPreview = document.getElementById('logoPreview');
    const logoThumb = document.getElementById('logoThumb');
    const logoName = document.getElementById('logoName');
    const mount = document.getElementById('qrMount');
    const btnDownload = document.getElementById('btnDownload');
    const btnCopy = document.getElementById('btnCopy');
    const btnClearLogo = document.getElementById('btnClearLogo');

    const dotsRadios = Array.from(document.querySelectorAll('input[name="dots"]'));
    const eyesRadios = Array.from(document.querySelectorAll('input[name="eyes"]'));
    const eyeDotsRadios = Array.from(document.querySelectorAll('input[name="eyeDots"]'));

    const FIXED_SIZE = 360;
    const FIXED_MARGIN = 10;
    const FIXED_ECC = 'H';
    const DEFAULT_LOGO_SIZE_PCT = 24;
    const DEFAULT_LOGO_MARGIN = 2;
    let logoDataUrl = null;
    const state = { dotsType:'square', cornersType:'square', cornersDotType:'square' };
    (function initStateFromRadios(){
      const d=document.querySelector('input[name="dots"]:checked'); if(d) state.dotsType=d.value;
      const e=document.querySelector('input[name="eyes"]:checked'); if(e) state.cornersType=(e.value==='square')?'square':'extra-rounded';
      const ed=document.querySelector('input[name="eyeDots"]:checked'); if(ed) state.cornersDotType=ed.value;
    })();

    // QR instance
    let qr = new QRCodeStyling({
      width: FIXED_SIZE,
      height: FIXED_SIZE,
      type: 'canvas',
      data: '',
      margin: FIXED_MARGIN,
      qrOptions: { errorCorrectionLevel: FIXED_ECC },
      backgroundOptions: { color: bgColor.value },
      dotsOptions: { color: dotColor.value, type: state.dotsType },
      cornersSquareOptions: { type: state.cornersType, color: dotColor.value },
      cornersDotOptions: { type: state.cornersDotType, color: dotColor.value },
      imageOptions: { imageSize: DEFAULT_LOGO_SIZE_PCT/100, margin: DEFAULT_LOGO_MARGIN, crossOrigin: 'anonymous' }
    });
    qr.append(mount);

    function mapDotsType(v){
      if(v==='rounded') return 'rounded';
      if(v==='dots') return 'dots';
      if(v==='classy') return 'classy';
      if(v==='classy-rounded') return 'classy-rounded';
      if(v==='extra-rounded') return 'extra-rounded';
      return 'square';
    }

    function refresh(){
      const bg = bgTransparent.checked ? 'transparent' : bgColor.value;
      qr.update({
        width: FIXED_SIZE, height: FIXED_SIZE, data: qrText.value || '', margin: FIXED_MARGIN,
        qrOptions: { errorCorrectionLevel: FIXED_ECC },
        backgroundOptions: { color: bg },
        dotsOptions: { color: dotColor.value, type: mapDotsType(state.dotsType) },
        cornersSquareOptions: { type: state.cornersType, color: dotColor.value },
        cornersDotOptions: { type: state.cornersDotType, color: dotColor.value },
        image: logoDataUrl || null,
        imageOptions: { imageSize: DEFAULT_LOGO_SIZE_PCT/100, margin: DEFAULT_LOGO_MARGIN, crossOrigin:'anonymous' }
      });
    }

    // Segments
    dotsRadios.forEach(r => r.addEventListener('change', ()=>{ state.dotsType = r.value; refresh(); }));
    eyesRadios.forEach(r => r.addEventListener('change', ()=>{
      if(r.value==='square'){ state.cornersType='square'; }
      else { state.cornersType='extra-rounded'; }
      refresh();
    }));

    eyeDotsRadios.forEach(r => r.addEventListener('change', ()=>{
      state.cornersDotType = r.value; // 'square' or 'dot'
      refresh();
    }));

    [qrText, dotColor, bgColor, bgTransparent].forEach(el => { el.addEventListener('input', refresh); el.addEventListener('change', refresh); });

    // Logo upload / preview / remove
    logoFile.addEventListener('change', handleLogoFile);
    ['dragenter','dragover'].forEach(ev => logoDrop.addEventListener(ev, e => { e.preventDefault(); logoDrop.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(ev => logoDrop.addEventListener(ev, e => { e.preventDefault(); logoDrop.classList.remove('dragover'); }));
    logoDrop.addEventListener('drop', e => { const file = e.dataTransfer.files && e.dataTransfer.files[0]; if(file) setLogoFile(file); });
    logoDrop.addEventListener('click', (e) => { if(e.target.closest('#btnClearLogo')) return; logoFile.click(); });

    function handleLogoFile(e){ const file = e.target.files && e.target.files[0]; if(file) setLogoFile(file); }
    function setLogoFile(file){
      if(!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => { logoDataUrl = reader.result; showLogoPreview(file); refresh(); };
      reader.readAsDataURL(file);
    }
    function showLogoPreview(file){
      const name = file.name || 'logo';
      logoThumb.src = logoDataUrl; logoThumb.alt = name; logoName.textContent = name;
      document.querySelector('.logo-cta').style.display='none';
      logoPreview.style.display='flex';
    }
    btnClearLogo.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); clearLogo(); });
    function clearLogo(){
      logoDataUrl=null; logoFile.value=''; logoThumb.src=''; logoName.textContent='';
      logoPreview.style.display='none'; document.querySelector('.logo-cta').style.display=''; refresh();
    }

    // Download & Copy (same behavior as before) 
    btnDownload.addEventListener('click', async () => {
      const ext = format.value||'png';
      if(ext==='svg'){ const t=qr._options.type; qr.update({type:'svg'}); await qr.download({name:'qr-code',extension:'svg'}); qr.update({type:t}); }
      else{ await qr.download({name:'qr-code',extension:ext}); }
    });
    btnCopy.addEventListener('click', async () => {
      try{
        const t=qr._options.type; qr.update({type:'canvas'});
        const dataUrl = await qr.getRawData('png');
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        qr.update({type:t});
        btnCopy.textContent = 'Copied!'; setTimeout(()=> btnCopy.textContent='Copy', 900);
      }catch(e){ btnCopy.textContent='Copy failed'; setTimeout(()=> btnCopy.textContent='Copy', 900); }
    });

    // Initial
    if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', refresh);} else { refresh(); }
