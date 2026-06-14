}
  


  (function(){
    const itemsEl = document.getElementById('items');
    const wheelCanvas = document.getElementById('wheel');
    const ctx = wheelCanvas.getContext('2d');
    const spinBtn = document.getElementById('spinBtn');
    const addBtn = document.getElementById('addBtn');
    const newTextEl = document.getElementById('newText');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const confettiBox = document.getElementById('confetti');
    const wheelWinner = document.getElementById('wheelWinner');

    const SELECTOR_DEG = -90;

    const Y = document.getElementById('y'); Y.textContent = new Date().getFullYear();

    let items = [];
    let rotation = 0;
    let spinning = false;
    let hideWinnerTimer = null;

    const randomColor = (i, n) => `hsl(${((i/n)*360 + (n*11.8)) % 360} 82% 60%)`;

    function ensureColors(){ const n=items.length||1; items.forEach((it,i)=> it.color=randomColor(i,n)); }

    function addItem(text, weight=1){
      const id = crypto.randomUUID();
      items.push({ id, text: String(text).trim(), weight: Math.max(1, Number(weight)||1), color: '#7aa2ff' });
      ensureColors(); renderItems(); drawWheel();
    }

    function removeItem(id){ items = items.filter(i=>i.id!==id); ensureColors(); renderItems(); drawWheel(); }

    function renderItems(){
      itemsEl.innerHTML = '';
      items.forEach((it)=>{
        const row = document.createElement('div'); row.className='item';
        row.style.border='1px solid rgba(255,255,255,.12)'; row.style.borderRadius='12px'; row.style.padding='8px';
        const name=document.createElement('input'); name.type='text'; name.value=it.text; name.placeholder='Label'; name.addEventListener('input',e=>{it.text=e.target.value; drawWheel();});
        const weight=document.createElement('input'); weight.type='number'; weight.min='1'; weight.step='1'; weight.value=it.weight; weight.title='Weight'; weight.addEventListener('input',e=>{it.weight=Math.max(1, Math.floor(e.target.value||1)); drawWheel();});
        const rm=document.createElement('button'); rm.className='remove'; rm.title='Remove'; rm.innerHTML='✕'; rm.addEventListener('click',()=>removeItem(it.id));
        const right=document.createElement('div'); right.style.display='flex'; right.style.alignItems='center'; right.style.gap='8px';
        const dot=document.createElement('div'); dot.className='color-dot'; dot.style.background=it.color; right.append(dot, rm);
        const label=document.createElement('small'); label.style.gridColumn='1 / -1'; label.style.color='var(--muted)'; label.style.marginTop='-4px'; label.textContent='Weight';
        row.append(name, weight, right); row.insertBefore(label, right); itemsEl.appendChild(row);
      });
    }

    function distributeEvenly(counts){
      const N = counts.reduce((a,b)=>a+b,0);
      const seq = new Array(N).fill(null);
      let pointer = 0;
      for(let idx=0; idx<counts.length; idx++){
        const c = counts[idx]; if(c<=0) continue;
        const step = N / c; let pos = (pointer + idx) % N;
        for(let j=0;j<c;j++){
          let k = Math.floor(pos) % N, startK=k;
          while(seq[k] !== null){ k=(k+1)%N; if(k===startK) break; }
          seq[k] = idx; pos += step;
        }
        pointer = (pointer + Math.floor(step/2)) % N;
      }
      return seq.map(i=>items[i]);
    }

    function effectivePool(){
      if(!items.length) return [];
      const counts = items.map(it=>Math.max(1, Math.floor(it.weight||1)));
      return distributeEvenly(counts);
    }

    function drawWheel(){
      const W = wheelCanvas.width, H = wheelCanvas.height;
      const cx=W/2, cy=H/2, r=Math.min(cx,cy)-10;
      const pool = effectivePool();
      const n = pool.length;
      ctx.clearRect(0,0,W,H);

      if(!n){
        // blank grey wheel
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#2a2d36'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx,cy,36,0,Math.PI*2); ctx.fillStyle='#0b0b0e'; ctx.fill();
        ctx.lineWidth=3; ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.stroke();
        return;
      }

      const slice = (Math.PI*2)/n;
      const base = -Math.PI/2 - slice/2; // first slice centered at top
      for(let i=0;i<n;i++){
        const s = base + i*slice, e = s + slice;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,s,e); ctx.closePath();
        const idx = items.findIndex(x=>x.id===pool[i].id);
        ctx.fillStyle = items[idx]?.color || '#7aa2ff'; ctx.fill();

        const mid = (s+e)/2;
        ctx.save();
        ctx.translate(cx + Math.cos(mid)*r*0.62, cy + Math.sin(mid)*r*0.62);
        ctx.rotate(mid + Math.PI/2);
        ctx.fillStyle = '#0b0b0e';
        ctx.font = '700 24px system-ui';
        const t = (pool[i].text||'').toString().slice(0,18);
        ctx.fillText(t, -ctx.measureText(t).width/2, 0);
        ctx.restore();
      }

      ctx.beginPath(); ctx.arc(cx,cy,36,0,Math.PI*2); ctx.fillStyle='#0b0b0e'; ctx.fill();
      ctx.lineWidth=3; ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.stroke();
    }

    // Stronger stagger: longer spawn window + easing ramp + varied start height
    function confettiProgressiveStronger(totalPieces=560, spawnWindowMs=2000){
      confettiBox.innerHTML='';
      const colors=['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6'];
      const W=confettiBox.clientWidth||600;
      const start=performance.now();
      let created=0;

      const easeOutCubic = x => 1 - Math.pow(1 - x, 3);

      function frame(t){
        const elapsed = t - start;
        const x = Math.min(1, elapsed / spawnWindowMs);
        const targetCount = Math.floor(easeOutCubic(x) * totalPieces);

        while(created < targetCount){
          const p=document.createElement('div');
          p.className='piece';
          p.style.background=colors[created % colors.length];
          p.style.left=(Math.random()*W)+'px';
          // varied start height between -12vh and -28vh
          const topvh = -12 - Math.random()*16;
          p.style.top = topvh + 'vh';
          // varied duration (3.2–4.2s) for more spread
          const dur = 3.2 + Math.random()*1.0;
          p.style.setProperty('--dur', dur+'s');
          p.style.width=(8+Math.random()*8)+'px';
          p.style.height=(10+Math.random()*10)+'px';
          confettiBox.appendChild(p);
          created++;
        }

        if(x < 1){ requestAnimationFrame(frame); }
      }
      requestAnimationFrame(frame);

      setTimeout(()=>confettiBox.innerHTML='', spawnWindowMs + 4600);
    }

    function mod(a,n){ return ((a%n)+n)%n; }

    function spin(){
      if(spinning || !items.length) return;
      if(hideWinnerTimer){ clearTimeout(hideWinnerTimer); hideWinnerTimer = null; }
      wheelWinner.textContent='';
      wheelWinner.classList.remove('show','pulse');
      confettiBox.innerHTML='';

      const pool = effectivePool(), n = pool.length, slice = 360/n;
      const idx = Math.floor(Math.random()*n);
      const winner = pool[idx];

      // Align chosen slice center to pin tip (-90°)
      const theta_i = -90 + idx*slice;
      const pxAngle = 360 / (Math.PI * (wheelCanvas.width/2));
      const margin = pxAngle * 1.0;
      const jitter = (Math.random()*2 - 1) * (slice/2 - margin);
      const alpha = -90 + jitter;

      const currentNorm = mod(rotation, 360);
      const extraSpins = 8, duration = 5;
      const delta = 360*extraSpins + (alpha - theta_i) - currentNorm;
      rotation += delta;

      spinning = true;
      wheelCanvas.style.transition = `transform ${duration}s cubic-bezier(.2,.8,.1,1)`;
      requestAnimationFrame(()=>{ wheelCanvas.style.transform = `rotate(${rotation}deg)`; });

      setTimeout(()=>{
        spinning = false;

        // Winner pop-up (auto-hide after ~3.4s)
        wheelWinner.textContent = winner.text;
        wheelWinner.classList.remove('pulse'); void wheelWinner.offsetWidth;
        wheelWinner.classList.add('show','pulse');
        hideWinnerTimer = setTimeout(()=>{ wheelWinner.classList.remove('show'); }, 3400);

        // Start stronger staggered confetti
        confettiProgressiveStronger(560, 2000);

        try{ navigator.vibrate && navigator.vibrate(60); }catch{}
      }, duration*1000 + 30);
    }

    addBtn.onclick=()=>{const v=newTextEl.value.trim(); if(!v) return; addItem(v); newTextEl.value=''; newTextEl.focus();};
    newTextEl.onkeydown=e=>{if(e.key==='Enter') addBtn.click();};
    clearBtn.onclick=()=>{items=[]; renderItems(); drawWheel(); wheelWinner.textContent=''; wheelWinner.classList.remove('show','pulse'); confettiBox.innerHTML=''; if(hideWinnerTimer){clearTimeout(hideWinnerTimer);hideWinnerTimer=null;} };
    saveBtn.onclick=()=>{localStorage.setItem('spinner:list', JSON.stringify(items.map(({text,weight})=>({text,weight}))));};
    loadBtn.onclick=()=>{try{const d=JSON.parse(localStorage.getItem('spinner:list')||'[]'); items=[]; d.forEach(x=>items.push({id:crypto.randomUUID(), text:x.text, weight:x.weight||1, color:'#7aa2ff'})); ensureColors(); renderItems(); drawWheel(); }catch{}};

    ensureColors(); renderItems(); drawWheel();
    spinBtn.onclick = spin;
  })();
