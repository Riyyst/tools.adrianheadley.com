}
  


  (function(){
    const $ = s => document.querySelector(s);
    const taA = $('#taA'), taB = $('#taB');
    const outA = $('#outA'), outB = $('#outB');
    const fileA = $('#fileA'), fileB = $('#fileB');
    const fileLabelA = $('#fileLabelA'), fileLabelB = $('#fileLabelB');
    const countsA = $('#countsA'), countsB = $('#countsB');
    const btnToggle = $('#toggleHighlight');
    const btnClearA = $('#clearA'), btnClearB = $('#clearB');
    const wrapA = $('#wrapA'), wrapB = $('#wrapB');

    let highlighted = false;

    function computeCounts(prefix, text){
      const words = (text.match(/\b[0-9A-Za-zÀ-ÖØ-öø-ÿ’'-]+\b/g) || []).length;
      return prefix + ': ' + text.length + ' chars • ' + words + ' words';
    }
    function refreshCounts(){
      countsA.textContent = computeCounts('A', taA.value||'');
      countsB.textContent = computeCounts('B', taB.value||'');
      btnToggle.disabled = !((taA.value||'').length || (taB.value||'').length);
    }
    ['input','change','keyup','paste','cut'].forEach(ev=>{
      taA.addEventListener(ev, refreshCounts);
      taB.addEventListener(ev, refreshCounts);
    });

    async function readTextLike(file){
      const name = file.name.toLowerCase();
      if(name.endsWith('.rtf')){
        const raw = await file.text();
        return raw
          .replace(/\{\\[\s\S]*?\}/g,'')
          .replace(/\\'[0-9a-fA-F]{2}/g,'')
          .replace(/\\[a-zA-Z]+-?\d* ?/g,'')
          .replace(/[{}]/g,'')
          .replace(/\r?\n/g,'\n')
          .trim();
      } else if(name.endsWith('.docx')){
        const ab = await file.arrayBuffer();
        const text = await extractDocxText(new Uint8Array(ab));
        return text || '';
      } else {
        return await file.text();
      }
    }
    function decodeUTF8(u8){ try{ return new TextDecoder('utf-8').decode(u8); } catch{ return String.fromCharCode.apply(null, Array.from(u8)); } }
    function findHeaders(bytes){
      const list=[]; let i=0;
      while(i+30<=bytes.length){
        if(bytes[i]==0x50&&bytes[i+1]==0x4B&&bytes[i+2]==0x03&&bytes[i+3]==0x04){
          const method = bytes[i+8]|(bytes[i+9]<<8);
          const compSize = bytes[i+18]|(bytes[i+19]<<8)|(bytes[i+20]<<16)|(bytes[i+21]<<24);
          const nameLen = bytes[i+26]|(bytes[i+27]<<8);
          const extraLen = bytes[i+28]|(bytes[i+29]<<8);
          const nameStart = i+30;
          const name = decodeUTF8(bytes.subarray(nameStart,nameStart+nameLen));
          const dataStart = nameStart+nameLen+extraLen;
          list.push({method, compSize, name, dataStart});
          i = dataStart + compSize;
        } else i++;
      }
      return list;
    }
    async function inflateRaw(data){
      if('DecompressionStream' in window){
        const ds = new DecompressionStream('deflate-raw');
        const out = await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer();
        return new Uint8Array(out);
      }
      return null;
    }
    async function extractDocxText(u8){
      try{
        const entries = findHeaders(u8);
        let docXML = null;
        for(const e of entries){
          if(e.name === 'word/document.xml'){
            if(e.method===0){ docXML = u8.subarray(e.dataStart, e.dataStart+e.compSize); }
            else if(e.method===8){
              const inf = await inflateRaw(u8.subarray(e.dataStart, e.dataStart+e.compSize));
              if(inf) docXML = inf;
            }
            break;
          }
        }
        if(!docXML) return '';
        const xmlStr = decodeUTF8(docXML);
        const withParas = xmlStr.replace(/<w:p\b[^>]*>/g,'\n').replace(/<\/w:p>/g,'');
        const text = withParas.replace(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g,(_,p1)=>p1).replace(/<[^>]+>/g,'');
        return text.replace(/\r?\n\s*\n+/g,'\n\n').trim();
      } catch(e){ return ''; }
    }
    function handleFile(inputEl, ta, labelEl, which){
      const f = inputEl.files && inputEl.files[0];
      if(!f) return;
      labelEl.textContent = f.name + ' (' + which + ')';
      readTextLike(f).then(text=>{ ta.value = text; refreshCounts(); }).catch(()=>{});
      inputEl.value = '';
    }
    fileA.addEventListener('change', ()=>handleFile(fileA, taA, fileLabelA, 'A'));
    fileB.addEventListener('change', ()=>handleFile(fileB, taB, fileLabelB, 'B'));

    function setupDrop(wrap, ta, label, which){
      ['dragenter','dragover'].forEach(ev=>wrap.addEventListener(ev, e=>{e.preventDefault(); wrap.classList.add('drop');}));
      ['dragleave','drop'].forEach(ev=>wrap.addEventListener(ev, e=>{e.preventDefault(); wrap.classList.remove('drop');}));
      wrap.addEventListener('drop', e=>{
        const f = e.dataTransfer.files && e.dataTransfer.files[0];
        if(f){ handleFile({files:[f]}, ta, label, which); }
      });
    }
    setupDrop(wrapA, taA, fileLabelA, 'A');
    setupDrop(wrapB, taB, fileLabelB, 'B');

    // Diff
    function tokenise(text){ return (text || '').match(/\w+|[^\w\s]|\s+/g) || []; }
    function lcs(a, b){
      const n = a.length, m = b.length;
      const dp = Array(n+1); for(let i=0;i<=n;i++){ dp[i] = new Array(m+1).fill(0); }
      for(let i=n-1;i>=0;i--){
        for(let j=m-1;j>=0;j--){
          dp[i][j] = a[i] === b[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);
        }
      }
      const ops = []; let i=0,j=0;
      while(i<n && j<m){
        if(a[i] === b[j]){ ops.push({t:'eq', v:a[i]}); i++; j++; }
        else if(dp[i+1][j] >= dp[i][j+1]){ ops.push({t:'del', v:a[i++]}); }
        else { ops.push({t:'add', v:b[j++]}); }
      }
      while(i<n) ops.push({t:'del', v:a[i++]});
      while(j<m) ops.push({t:'add', v:b[j++]});
      return ops;
    }
    function escapeHtml(s){
      const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#039;'};
      return s.replace(/[&<>"']/g, ch => map[ch]);
    }
    function groupOps(ops){
      const grouped = []; let i=0, gid=0;
      while(i<ops.length){
        const op = ops[i];
        if(op.t === 'del'){
          let delTxt = op.v, di=i+1;
          while(di<ops.length && ops[di].t==='del'){ delTxt += ops[di].v; di++; }
          let addTxt = '', ai=di;
          while(ai<ops.length && ops[ai].t==='add'){ addTxt += ops[ai].v; ai++; }
          if(addTxt){
            const aNoWS = delTxt.replace(/[\t \r\n]+/g,' ');
            const bNoWS = addTxt.replace(/[\t \r\n]+/g,' ');
            if(aNoWS === bNoWS){ grouped.push({type:'ws', a:delTxt, b:addTxt, gid:gid++}); }
            else if(delTxt.toLowerCase() === addTxt.toLowerCase()){ grouped.push({type:'case', a:delTxt, b:addTxt, gid:gid++}); }
            else { grouped.push({type:'rep', a:delTxt, b:addTxt, gid:gid++}); }
            i = ai; continue;
          } else {
            grouped.push({type:'del', a:delTxt, gid:gid++}); i = di; continue;
          }
        } else if(op.t === 'add'){
          let addTxt = op.v, ai=i+1;
          while(ai<ops.length && ops[ai].t==='add'){ addTxt += ops[ai].v; ai++; }
          grouped.push({type:'add', b:addTxt, gid:gid++}); i = ai; continue;
        } else { // eq
          let eqTxt = op.v, ei=i+1;
          while(ei<ops.length && ops[ei].t==='eq'){ eqTxt += ops[ei].v; ei++; }
          grouped.push({type:'eq', v:eqTxt}); i = ei; continue;
        }
      }
      return grouped;
    }
    function renderHighlight(){
      const ops = groupOps(lcs(tokenise(taA.value), tokenise(taB.value)));
      let htmlA='', htmlB='';
      for(const g of ops){
        if(g.type==='eq'){
          const t = escapeHtml(g.v); htmlA += t; htmlB += t;
        } else if(g.type==='del'){
          htmlA += '<span class="diff del" data-g="'+g.gid+'">'+escapeHtml(g.a)+'</span>';
        } else if(g.type==='add'){
          htmlB += '<span class="diff add" data-g="'+g.gid+'">'+escapeHtml(g.b)+'</span>';
        } else if(g.type==='rep'){
          htmlA += '<span class="diff rep" data-g="'+g.gid+'">'+escapeHtml(g.a)+'</span>';
          htmlB += '<span class="diff rep" data-g="'+g.gid+'">'+escapeHtml(g.b)+'</span>';
        } else if(g.type==='case'){
          htmlA += '<span class="diff case" data-g="'+g.gid+'">'+escapeHtml(g.a)+'</span>';
          htmlB += '<span class="diff case" data-g="'+g.gid+'">'+escapeHtml(g.b)+'</span>';
        } else if(g.type==='ws'){
          htmlA += '<span class="diff ws" data-g="'+g.gid+'">'+escapeHtml(g.a)+'</span>';
          htmlB += '<span class="diff ws" data-g="'+g.gid+'">'+escapeHtml(g.b)+'</span>';
        }
      }
      outA.innerHTML = htmlA;
      outB.innerHTML = htmlB;

      function attachSync(elSrc, elDst){
        elSrc.querySelectorAll('[data-g]').forEach(span=>{
          span.addEventListener('click', (e)=>{
            const g = e.currentTarget.getAttribute('data-g');
            const match = elDst.querySelector('[data-g="'+g+'"]');
            if(match){
              match.scrollIntoView({behavior:'smooth', block:'center'});
            }
            e.currentTarget.scrollIntoView({behavior:'smooth', block:'center'});
          });
        });
      }
      attachSync(outA, outB);
      attachSync(outB, outA);
    }

    function syncScroll(from, to){
      const ratio = from.scrollTop / (from.scrollHeight - from.clientHeight || 1);
      to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
    }

    function doHighlight(){
      renderHighlight();
      // mirror scroll position so switch feels seamless
      outA.scrollTop = taA.scrollTop; outB.scrollTop = taB.scrollTop;
      taA.classList.add('hidden'); taB.classList.add('hidden');
      outA.classList.remove('hidden'); outB.classList.remove('hidden');
      highlighted = true;
      btnToggle.textContent = 'Return to edit';

      // keep scrolls in sync while highlighted
      outA.addEventListener('scroll', ()=>syncScroll(outA, outB));
      outB.addEventListener('scroll', ()=>syncScroll(outB, outA));
    }
    function clearHighlight(){
      // mirror scroll back
      taA.scrollTop = outA.scrollTop; taB.scrollTop = outB.scrollTop;
      taA.classList.remove('hidden'); taB.classList.remove('hidden');
      outA.classList.add('hidden'); outB.classList.add('hidden');
      highlighted = false;
      btnToggle.textContent = 'Highlight differences';
    }
    function toggleHighlight(){ highlighted ? clearHighlight() : doHighlight(); }
    btnToggle.addEventListener('click', toggleHighlight);

    // Clear
    btnClearA.addEventListener('click', ()=>{ clearHighlight(); taA.value=''; fileLabelA.textContent='(A)'; refreshCounts(); });
    btnClearB.addEventListener('click', ()=>{ clearHighlight(); taB.value=''; fileLabelB.textContent='(B)'; refreshCounts(); });

    // Init
    refreshCounts();
  })();
