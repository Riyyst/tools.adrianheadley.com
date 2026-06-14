}
  


    const $ = sel => document.querySelector(sel);
    const input = $('#input');
    const output = $('#output');
    const counts = $('#counts');
    const dlType = $('#dlType');
    const btnDownload = $('#btnDownload');
    const fileMeta = $('#fileMeta');
    const btnCopy = $('#copy');

    let currentMode = null; // selected conversion mode

    const SMALL_WORDS = new Set([
      'a','an','and','as','at','but','by','for','in','nor','of','on','or','per','so','the','to','up','via','vs','v',
      'aboard','about','above','across','after','against','along','amid','among','around','before','behind','below','beneath','beside','besides','between','beyond','concerning','despite','down','during','except','inside','into','like','near','off','onto','over','past','since','through','throughout','toward','under','underneath','until','upon','with','within','without','yet'
    ]);

    const converters = {
      upper: t => t.toUpperCase(),
      lower: t => t.toLowerCase(),
      sentence: t => sentenceCase(t),
      title: t => titleCase(t),
      toggle: t => t.replace(/[A-Za-z]/g, ch => ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()),
      alternating: t => {
        let makeUpper = false;
        return t.replace(/[A-Za-z]/g, ch => (makeUpper = !makeUpper) ? ch.toUpperCase() : ch.toLowerCase());
      }
    };

    function sentenceCase(text){
      if(!text) return '';
      const lower = text.toLowerCase();
      let out = '';
      let capNext = true;
      for(let i=0;i<lower.length;i++){
        const ch = lower[i];
        if(capNext && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(ch)){
          out += ch.toUpperCase();
          capNext = false;
        }else{
          out += ch;
        }
        if(/[.!?]/.test(ch) || ch === '\n' || ch === '\r'){
          capNext = true;
        } else if(/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(ch)){
          capNext = false;
        }
      }
      return out;
    }

    function titleCase(text){
      if(!text) return '';
      const lower = text.toLowerCase();
      const tokens = lower.split(/(\s+)/); // keep whitespace
      const wordIdxs = tokens.map((t,i)=>i).filter(i => tokens[i] && !/^\s+$/.test(tokens[i]));
      const firstIdx = wordIdxs.length ? wordIdxs[0] : -1;
      const lastIdx  = wordIdxs.length ? wordIdxs[wordIdxs.length-1] : -1;
      const capWord = w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w;

      for(let i=0;i<tokens.length;i++){
        const tok = tokens[i];
        if(!tok || /^\s+$/.test(tok)) continue;

        const parts = tok.split(/(-)/); // preserve hyphens
        for(let p=0;p<parts.length;p++){
          const part = parts[p];
          if(part === '-') continue;
          const m = part.match(/^([^A-Za-zÀ-ÖØ-öø-ÿ]*)([A-Za-z0-9À-ÖØ-öø-ÿ'’]+)([^A-Za-zÀ-ÖØ-öø-ÿ]*)$/);
          if(!m) continue;
          let [, lead, word, trail] = m;

          if(word.length >= 2 && word === word.toUpperCase()){
            // keep acronyms like NASA
          } else {
            const lw = word.toLowerCase();
            const isFirstToken = (i === firstIdx) && (p === 0);
            const isLastToken  = (i === lastIdx)  && (p === parts.length-1);
            if(!isFirstToken && !isLastToken && SMALL_WORDS.has(lw)){
              word = lw;
            } else {
              word = capWord(lw);
            }
          }
          parts[p] = lead + word + trail;
        }
        tokens[i] = parts.join('');
      }
      let result = tokens.join('');
      result = result.replace(/^(\s*['"([{]*)([A-Za-zÀ-ÖØ-öø-ÿ])/,
                              (m, pre, ch)=> pre + ch.toUpperCase());
      return result;
    }

    function applyMode(text){
      if(!currentMode) return text;
      const fn = converters[currentMode];
      return fn ? fn(text) : text;
    }

    function setActive(btn){
      document.querySelectorAll('.case-btn').forEach(b => b.classList.remove('active'));
      if(btn) btn.classList.add('active');
    }

    function convert(kind, btn){
      currentMode = kind;
      setActive(btn);
      output.value = applyMode(input.value || '');
      updateCounts(output.value);
      updateCTAState();
    }

    function updateCounts(text){
      const chars = text.length;
      const words = (text.match(/\\b[0-9A-Za-zÀ-ÖØ-öø-ÿ’'-]+\\b/g) || []).length;
      const lines = text === '' ? 0 : text.split('\\n').length;
      counts.textContent = `${chars} chars • ${words} words • ${lines} lines`;
    }

    function updateCTAState(){
      const hasOut = (output.value || '').length > 0;
      btnCopy.disabled = !hasOut;
      btnDownload.disabled = !(dlType.value && hasOut);
    }

    // Live typing -> Output
    input.addEventListener('input', ()=>{
      output.value = applyMode(input.value || '');
      updateCounts(output.value);
      updateCTAState();
    });

    // Upload (drag/drop + click)
    const dropMerge = $('#dropMerge');
    const fileInput = $('#fileInput');
    dropMerge.addEventListener('dragover', (e)=>{ e.preventDefault(); dropMerge.style.background='rgba(255,255,255,.08)'; });
    dropMerge.addEventListener('dragleave', ()=>{ dropMerge.style.background='rgba(255,255,255,.05)'; });
    dropMerge.addEventListener('drop', async (e)=>{
      e.preventDefault(); dropMerge.style.background='rgba(255,255,255,.05)';
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if(f) await handleFile(f);
    });
    fileInput.addEventListener('change', async (e)=>{
      if(e.target.files && e.target.files[0]){ await handleFile(e.target.files[0]); e.target.value=''; }
    });

    async function handleFile(file){
      const name = file.name.toLowerCase();
      let inferred = '';
      try{
        if(name.endsWith('.txt')){
          inferred = 'txt';
          input.value = await file.text();
        } else if(name.endsWith('.docx')){
          inferred = 'doc';
          input.value = await extractDocxText(file);
        } else if(name.endsWith('.pdf')){
          inferred = 'pdf';
          input.value = await extractPdfText(file);
        } else if(name.endsWith('.doc')){
          inferred = 'doc';
          input.value = '';
          fileMeta.textContent = 'Legacy .doc detected — please save as .docx and upload again.';
        } else {
          alert('Unsupported document. Please choose a .txt, .docx, or .pdf file.');
          return;
        }
      }catch(e){
        console.error(e);
        alert('Could not read this file. Try .txt or .docx.');
        return;
      }

      fileMeta.textContent = `Loaded: ${file.name} • ${(file.size/1024).toFixed(1)} KB`;
      output.value = applyMode(input.value || '');
      dlType.value = inferred || '';
      btnDownload.style.display = dlType.value ? '' : 'none';
      updateCounts(output.value);
      updateCTAState();
    }

    // DOCX extractor (ZIP -> word/document.xml) using DecompressionStream when available
    async function extractDocxText(file){
      const buf = new Uint8Array(await file.arrayBuffer());
      let i = 0;
      while(i + 30 < buf.length){
        if(buf[i]===0x50&&buf[i+1]===0x4b&&buf[i+2]===0x03&&buf[i+3]===0x04){
          const view = new DataView(buf.buffer, i);
          const compression = view.getUint16(8, true);
          const compSize = view.getUint32(18, true);
          const nameLen = view.getUint16(26, true);
          const extraLen = view.getUint16(28, true);
          const name = new TextDecoder('utf-8').decode(buf.slice(i+30, i+30+nameLen));
          const dataStart = i + 30 + nameLen + extraLen;
          const dataEnd = dataStart + compSize;
          if(name === 'word/document.xml'){
            let xmlText = '';
            if(compression === 0){
              xmlText = new TextDecoder('utf-8').decode(buf.slice(dataStart, dataEnd));
            } else if(compression === 8 && 'DecompressionStream' in window){
              const ds = new DecompressionStream('deflate-raw');
              const decompressed = await new Response(new Blob([buf.slice(dataStart, dataEnd)]).stream().pipeThrough(ds)).arrayBuffer();
              xmlText = new TextDecoder('utf-8').decode(new Uint8Array(decompressed));
            } else {
              throw new Error('Your browser cannot unzip .docx (no DecompressionStream).');
            }
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');
            const wNs = xml.documentElement.lookupNamespaceURI('w') || 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
            const paras = Array.from(xml.getElementsByTagNameNS(wNs, 'p'));
            const parts = [];
            for(const p of paras){
              const texts = Array.from(p.getElementsByTagNameNS(wNs, 't')).map(t => t.textContent || '');
              parts.push(texts.join(''));
            }
            return parts.join('\\n');
          }
          i = dataEnd;
        } else {
          i++;
        }
      }
      return '';
    }

    // Minimal PDF text extractor (best-effort)
    async function extractPdfText(file){
      const ab = await file.arrayBuffer();
      const bytes = new Uint8Array(ab);
      const text = new TextDecoder('iso-8859-1').decode(bytes);
      const blocks = text.match(/BT[\\s\\S]*?ET/g) || [];
      const out = [];
      for(const b of blocks){
        const strings = [];
        const tj = b.match(/\\((?:\\\\.|[^\\\\\\)])*\\)\\s*Tj/g) || [];
        for(const s of tj){
          const m = s.match(/\\(((?:\\\\.|[^\\\\\\)])*)\\)\\s*Tj/);
          if(m) strings.push(pdfUnescape(m[1]));
        }
        const tJ = b.match(/\\[(.*?)\\]\\s*TJ/g) || [];
        for(const s of tJ){
          const inner = s.match(/\\[(.*?)\\]\\s*TJ/)[1];
          const parts = inner.match(/\\(((?:\\\\.|[^\\\\\\)])*)\\)|-?\\d+(?:\\.\\d+)?/g) || [];
          for(const part of parts){
            if(part.startsWith('(')){
              strings.push(pdfUnescape(part.slice(1,-1)));
            }
          }
        }
        if(strings.length) out.push(strings.join(''));
      }
      return out.join('\\n');
    }
    function pdfUnescape(s){
      return s.replace(/\\\\(\\d{1,3}|n|r|t|b|f|\\\\|\\(|\\))/g, function(m, g1){
        if(g1==='n') return '\\n';
        if(g1==='r') return '\\r';
        if(g1==='t') return '\\t';
        if(g1==='b') return '\\b';
        if(g1==='f') return '\\f';
        if(g1==='\\\\') return '\\\\';
        if(g1==='(') return '(';
        if(g1===')') return ')';
        const code = parseInt(g1, 8); return String.fromCharCode(code);
      });
    }

    // Download helpers
    dlType.addEventListener('change', ()=>{
      btnDownload.style.display = dlType.value ? '' : 'none';
      updateCTAState();
    });
    btnDownload.addEventListener('click', ()=>{
      const text = output.value || '';
      const type = dlType.value;
      if(!type || !text) return;
      if(type === 'txt'){
        downloadBlob(new Blob([text], {type:'text/plain'}), 'text.txt');
      } else if(type === 'doc'){
        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre style="font-family:Segoe UI,Roboto,Arial,sans-serif;white-space:pre-wrap">' + escapeHtml(text) + '</pre></body></html>';
        downloadBlob(new Blob([html], {type:'application/msword'}), 'text.doc');
      } else if(type === 'pdf'){
        const pdfBytes = generateSimplePDF(text);
        downloadBlob(new Blob([pdfBytes], {type:'application/pdf'}), 'text.pdf');
      }
    });
    function downloadBlob(blob, filename){
      if (window.navigator && window.navigator.msSaveOrOpenBlob) { window.navigator.msSaveOrOpenBlob(blob, filename); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display = 'none';
      document.body.appendChild(a);
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          try { a.click(); } catch(_) {}
          setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 5000);
        });
      });
    }
    function escapeHtml(s){
      const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#039;'};
      return s.replace(/[&<>"']/g, ch => map[ch]);
    }

    // Simple PDF generator
    function generateSimplePDF(text){
      const pages = paginateText(text);
      let pdf = '%PDF-1.4\\n';
      const objects = [];
      const fontObjNum = 1;
      const pagesObjNum = 2;
      const kids = [];
      let objNum = 3;

      const fontObj = fontObjNum + ' 0 obj\\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\\nendobj\\n';
      objects.push(fontObj);

      for(const lines of pages){
        const content = buildContentStream(lines);
        const contentObjNum = objNum++;
        objects.push(contentObjNum + ' 0 obj\\n<< /Length ' + content.length + ' >>\\nstream\\n' + content + 'endstream\\nendobj\\n');
        const pageObjNum = objNum++;
        objects.push(pageObjNum + ' 0 obj\\n<< /Type /Page /Parent ' + pagesObjNum + ' 0 R /MediaBox [0 0 595 842] /Contents ' + contentObjNum + ' 0 R /Resources << /Font << /F1 ' + fontObjNum + ' 0 R >> >> >>\\nendobj\\n');
        kids.push(pageObjNum + ' 0 R');
      }
      const pagesObj = pagesObjNum + ' 0 obj\\n<< /Type /Pages /Count ' + kids.length + ' /Kids [ ' + kids.join(' ') + ' ] >>\\nendobj\\n';
      objects.splice(1, 0, pagesObj);
      const catalogObjNum = objNum++;
      const catalogObj = catalogObjNum + ' 0 obj\\n<< /Type /Catalog /Pages ' + pagesObjNum + ' 0 R >>\\nendobj\\n';
      objects.push(catalogObj);

      const xref = [];
      let offset = pdf.length;
      for(const obj of objects){
        xref.push(strPad(offset,10) + ' 00000 n ');
        pdf += obj;
        offset = pdf.length;
      }
      const xrefStart = pdf.length;
      pdf += 'xref\\n';
      pdf += '0 ' + (objects.length+1) + '\\n';
      pdf += '0000000000 65535 f \\n';
      for(const line of xref) pdf += line + '\\n';
      pdf += 'trailer\\n<< /Size ' + (objects.length+1) + ' /Root ' + catalogObjNum + ' 0 R >>\\nstartxref\\n' + xrefStart + '\\n%%EOF';
      return new TextEncoder().encode(pdf);
    }
    function strPad(num, size){ const s = String(num); return '0'.repeat(Math.max(0,size-s.length)) + s; }
    function buildContentStream(lines){
      let yStart = 812;
      let out = 'BT\\n/F1 12 Tf\\n1 0 0 1 30 ' + yStart + ' Tm\\n14 TL\\n';
      for(const line of lines){ out += '(' + pdfEscape(line) + ') Tj\\nT*\\n'; }
      out += 'ET\\n'; return out;
    }
    function pdfEscape(s){ return s.replace(/([\\()])/g, '\\\\$1').replace(/\\r?\\n/g, '\\\\n'); }
    function paginateText(text){
      const maxWidthChars = 85;
      const words = (text || '').replace(/\\r\\n/g,'\\n').split(/(\\s+)/);
      const lines = []; let line = '';
      for(const token of words){
        if(token === '\\n'){ lines.push(line); line=''; }
        else if(/\\s+/.test(token)){
          if(line.length + token.length <= maxWidthChars) line += token;
          else { lines.push(line); line=''; }
        } else {
          if((line + token).length <= maxWidthChars) line += token;
          else {
            if(line) lines.push(line);
            while(token.length > maxWidthChars){ lines.push(token.slice(0, maxWidthChars)); token = token.slice(maxWidthChars); }
            line = token;
          }
        }
      }
      if(line) lines.push(line);
      const linesPerPage = 46, pages = [];
      for(let i=0;i<lines.length;i+=linesPerPage) pages.push(lines.slice(i,i+linesPerPage));
      return pages.length ? pages : [[]];
    }

    // Case button activation
    document.querySelectorAll('.case-btn').forEach(btn => {
      btn.addEventListener('click', () => convert(btn.dataset.action, btn));
    });

    // Utilities
    document.getElementById('clearInput').addEventListener('click', ()=>{
      input.value=''; output.value=''; updateCounts(''); updateCTAState();
    });
    document.getElementById('selectInput').addEventListener('click', ()=>{ input.focus(); input.select(); });
    document.getElementById('swap').addEventListener('click', ()=>{
      const t=input.value; input.value=output.value; output.value=t; updateCounts(output.value || ''); updateCTAState();
    });

    // Copy
    document.getElementById('copy').addEventListener('click', async () => {
  if(!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    const prev = btnCopy.textContent;
    btnCopy.textContent = 'Copied';
    setTimeout(() => { btnCopy.textContent = 'Copy'; }, 1200);
  } catch(_) { /* ignore */ }
});

    // Init
    updateCounts(''); updateCTAState();
