}
  


    // ---- Shorthands ----
    const $ = sel => document.querySelector(sel);
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // ---- Elements ----
    const modeEncrypt = $('#modeEncrypt');
    const modeDecrypt = $('#modeDecrypt');
    const rowUpload = $('#rowUpload');
    const dropMerge = $('#dropMerge');
    const fileInput = $('#fileInput');
    const fileMeta = $('#fileMeta');
    const rowText = $('#rowText');
    const ioText = $('#ioText');
    const actionsEncrypt = $('#actionsEncrypt');
    const btnClear = $('#btnClear');
    const rowPassword = $('#rowPassword');
    const pwd = $('#password');
    const togglePwd = $('#togglePwd');
    const eyeIcon = $('#eyeIcon');
    const btnGen = $('#btnGen');
    const rowRun = $('#rowRun');
    const btnEncrypt = $('#btnEncrypt');
    const hint = $('#hint');

    // ---- Config ----
    const DEFAULT_ITERS = 350000; // fixed
    let decryptEnvelope = null; // holds uploaded JSON for decrypt

    // ---- Base64 helpers ----
    function toB64(bytes){
      let bin = ''; const arr = new Uint8Array(bytes);
      for(let i=0;i<arr.length;i++) bin += String.fromCharCode(arr[i]);
      return btoa(bin);
    }
    function fromB64(b64){
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
      return arr.buffer;
    }
    function randBytes(len){ const b = new Uint8Array(len); crypto.getRandomValues(b); return b; }

    // ---- Crypto (Web Crypto) ----
    async function deriveKey(password, salt, iterations){
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), {name:'PBKDF2'}, false, ['deriveKey']);
      return crypto.subtle.deriveKey(
        {name:'PBKDF2', hash:'SHA-256', salt, iterations},
        keyMaterial,
        {name:'AES-GCM', length:256},
        false,
        ['encrypt','decrypt']
      );
    }
    async function encryptText(plaintext, password){
      if(!password) throw new Error('Password required');
      const salt = randBytes(16); // 128-bit
      const iv = randBytes(12);   // 96-bit
      const key = await deriveKey(password, salt, DEFAULT_ITERS);
      const alg = {name:'AES-GCM', iv};
      const ct = await crypto.subtle.encrypt(alg, key, enc.encode(plaintext || ''));
      const envelope = {
        v: 1,
        scheme: 'AES-GCM',
        kdf: { name:'PBKDF2', hash:'SHA-256', iterations: DEFAULT_ITERS },
        salt: toB64(salt),
        iv: toB64(iv),
        ct: toB64(ct)
      };
      return JSON.stringify(envelope, null, 2);
    }
    async function decryptText(envelopeJSON, password){
      if(!password) throw new Error('Password required');
      const env = JSON.parse(envelopeJSON);
      if(env.v !== 1) throw new Error('Unsupported version');
      if(!env.kdf || env.kdf.name !== 'PBKDF2' || env.kdf.hash !== 'SHA-256') throw new Error('Unsupported KDF');
      const salt = new Uint8Array(fromB64(env.salt));
      const iv = new Uint8Array(fromB64(env.iv));
      const key = await deriveKey(password, salt, Number(env.kdf.iterations));
      const alg = {name:'AES-GCM', iv};
      const ptBuf = await crypto.subtle.decrypt(alg, key, fromB64(env.ct));
      return dec.decode(ptBuf);
    }

    // ---- Password show/hide ----
    togglePwd.addEventListener('click', ()=>{
      const show = pwd.type === 'password';
      pwd.type = show ? 'text' : 'password';
      togglePwd.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      // toggle eye icon
      eyeIcon.innerHTML = show
        ? '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.23 4.31M1 1l22 22" />'
        : '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle>';
    });

    // ---- Password generator + copy (Encrypt mode only) ----
    btnGen.addEventListener('click', async ()=>{
      const strong = generatePassword(20);
      pwd.value = strong;
      try {
        await navigator.clipboard.writeText(strong);
        flashHint('Strong password generated & copied', true);
      } catch {
        flashHint('Strong password generated (copy failed)', false);
      }
      pwd.focus(); pwd.select(); // allow manual copy if needed
    });
    function generatePassword(length=20){
      const upper='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lower='abcdefghijklmnopqrstuvwxyz';
      const nums='0123456789';
      const syms='!@#$%^&*()-_=+[]{};:,.<>?';
      const all = upper+lower+nums+syms;
      const req = [upper, lower, nums, syms];
      let res = [];
      req.forEach(set => res.push(set[rand(set.length)]));
      for(let i=res.length;i<length;i++){ res.push(all[rand(all.length)]); }
      for(let i=res.length-1;i>0;i--){ const j = rand(i+1); [res[i],res[j]]=[res[j],res[i]]; }
      return res.join('');
    }
    function rand(n){ return crypto.getRandomValues(new Uint32Array(1))[0] % n; }
    function flashHint(msg, ok){
      hint.textContent = msg; hint.className = 'msg ' + (ok?'ok':'err');
      setTimeout(()=>{ hint.textContent=''; hint.className='msg'; }, 1800);
    }

    // ---- Encrypt flow ----
    btnClear.addEventListener('click', ()=>{ ioText.value=''; });
    btnEncrypt.addEventListener('click', async ()=>{
      try{
        const out = await encryptText(ioText.value || '', pwd.value || '');
        ioText.value = out;
        const blob = new Blob([out], {type:'application/json'});
        const ts = new Date().toISOString().replace(/[:.]/g,'-');
        downloadBlob(blob, `encrypted-${ts}.json`);
      }catch(e){
        alert(e.message || 'Encryption failed');
      }
    });
    function downloadBlob(blob, filename){
      if (window.navigator && window.navigator.msSaveOrOpenBlob) { window.navigator.msSaveOrOpenBlob(blob, filename); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display='none';
      document.body.appendChild(a);
      requestAnimationFrame(()=>{ try{ a.click(); }catch(_){}
        setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 1500);
      });
    }

    // ---- Mode management & Decrypt flow ----
    function clearPassword(){
      pwd.value = '';
      pwd.type = 'password';
      togglePwd.setAttribute('aria-label','Show password');
      eyeIcon.innerHTML = '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle>';
    }

    
    function setMode(mode){
      const isEncrypt = mode === 'encrypt';
      modeEncrypt.setAttribute('aria-selected', String(isEncrypt));
      modeDecrypt.setAttribute('aria-selected', String(!isEncrypt));
      rowUpload.style.display = isEncrypt ? 'none' : '';
      if (dropMerge) dropMerge.style.display = isEncrypt ? 'none' : 'flex';
      rowPassword.style.display = isEncrypt ? '' : (decryptEnvelope ? '' : 'none');
      pwd.placeholder = isEncrypt ? 'Enter a strong password…' : 'Enter the password';
      if (btnGen) btnGen.style.display = isEncrypt ? '' : 'none';
      rowPassword.classList.toggle('with-gen', isEncrypt);
      rowText.style.display = isEncrypt ? '' : (ioText.dataset.unlocked === 'true' ? '' : 'none');
      actionsEncrypt.style.display = isEncrypt ? '' : 'none';
      rowRun.style.display = isEncrypt ? '' : 'none';
      ioText.readOnly = !isEncrypt;
      ioText.placeholder = isEncrypt ? 'Type text to encrypt…' : '';
      ioText.value = ''; // always clear text area on mode switch
      ioText.dataset.unlocked = isEncrypt ? 'false' : 'false';
      hint.textContent = '';
      clearPassword();
    }

    modeEncrypt.addEventListener('click', ()=> setMode('encrypt'));
    modeDecrypt.addEventListener('click', ()=> setMode('decrypt'));
    setMode('encrypt'); // default

    // Upload handlers (Decrypt mode)
    if(dropMerge){
      dropMerge.addEventListener('click', ()=>{ if(fileInput) fileInput.click(); });
      dropMerge.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); if(fileInput) fileInput.click(); }});
      dropMerge.addEventListener('dragover', (e)=>{ e.preventDefault(); dropMerge.style.background='rgba(255,255,255,.08)'; });
      dropMerge.addEventListener('dragleave', ()=>{ dropMerge.style.background='rgba(255,255,255,.05)'; });
      dropMerge.addEventListener('drop', async (e)=>{
        e.preventDefault(); dropMerge.style.background='rgba(255,255,255,.05)';
        const f = e.dataTransfer.files && e.dataTransfer.files[0]; if(f) await handleFile(f);
      });
    }
    if(fileInput){
      fileInput.addEventListener('change', async (e)=>{
        if(e.target.files && e.target.files[0]){ await handleFile(e.target.files[0]); e.target.value=''; }
      });
    }
    async function handleFile(file){
      const name = (file.name||'').toLowerCase();
      if(!name.match(/\.(json|enc|cipher)$/)){ alert('Please choose an encrypted JSON (.json/.enc/.cipher)'); return; }
      try{
        decryptEnvelope = await file.text();
        fileMeta.textContent = 'Loaded: ' + (file.name || 'file');
        rowPassword.style.display = '';
        pwd.placeholder = 'Enter the password';
        clearPassword(); // ensure no remembered password
        pwd.focus();
      }catch(_){ alert('Unable to read file'); }
    }

    // Only decrypt on Enter key
    pwd.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' && decryptEnvelope){
        e.preventDefault();
        triggerDecrypt();
      }
    });
    async function triggerDecrypt(){
      try{
        const out = await decryptText(decryptEnvelope, pwd.value || '');
        ioText.value = out;
        ioText.readOnly = true;
        ioText.dataset.unlocked = 'true';
        rowText.style.display = '';     // reveal preview
        rowPassword.style.display = 'none'; // hide password box after success
        clearPassword(); // wipe password after use
        flashHint('Decrypted', true);
      }catch(e){
        hint.textContent = 'Wrong password or corrupted file';
        hint.className = 'msg err';
      }
    }
