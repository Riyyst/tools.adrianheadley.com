}
  


    const $ = sel => document.querySelector(sel);
    const source = $('#source');
    const findInput = $('#find');
    const replaceInput = $('#replace');
    const optCase = $('#optCase');
    const optWord = $('#optWord');
    const optHighlight = $('#optHighlight');
    const rendered = $('#rendered');
    const stats = $('#stats');

    const btnFindPrev = $('#btnFindPrev');
    const btnFindNext = $('#btnFindNext');
    const btnReplace = $('#btnReplace');
    const btnReplaceAll = $('#btnReplaceAll');
    const btnCopy = $('#btnCopy');
    const btnDownload = $('#btnDownload');
    const btnClear = $('#btnClear');
    const fileInput = $('#fileInput');
    const dropMerge = $('#dropMerge');
    const dlType = $('#dlType');

    let matches = [];
    let idx = -1;

    function buildRegex(){
      const query = findInput.value || '';
      if(!query) return null;
      let pattern = query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
      if(optWord.checked) pattern = '\\\\b' + pattern + '\\\\b';
      const flags = (optCase.checked ? '' : 'i') + 'g';
      try { return new RegExp(pattern, flags); } catch(e) { return null; }
    }

    function findAll(){
      matches = [];
      idx = -1;
      const text = source.value ?? '';
      const re = buildRegex();
      if(!re) { render(); stats.textContent = '0 matches'; return; }
      let m;
      while((m = re.exec(text)) !== null){
        matches.push({ start: m.index, end: m.index + m[0].length });
        if(m[0].length === 0) re.lastIndex++;
      }
      render();
      stats.textContent = `${matches.length} match${matches.length===1?'':'es'}` + (idx>=0?` — at ${idx+1}/${matches.length}`:'');
    }

    function render(){
      const text = source.value ?? '';
      if(!text){
        rendered.textContent = '';
        updateDisabled();
        return;
      }
      if(!optHighlight.checked || !findInput.value || matches.length === 0){
        rendered.textContent = text;
      } else {
        let out = '';
        let last = 0;
        for(const m of matches){
          out += safe(text.slice(last, m.start));
          out += `<span class="hl">${safe(text.slice(m.start, m.end))}</span>`;
          last = m.end;
        }
        out += safe(text.slice(last));
        rendered.innerHTML = out;
      }
      updateDisabled();
    }

    function safe(s){
      return s.replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));
    }

    function selectCurrent(){
      if(idx < 0 || idx >= matches.length) return;
      const m = matches[idx];
      source.focus();
      source.setSelectionRange(m.start, m.end);
      const lineCountBefore = (source.value.slice(0, m.start).match(/\\n/g) || []).length;
      const approxLineHeight = 20;
      source.scrollTop = Math.max(0, lineCountBefore * approxLineHeight - source.clientHeight/2);
      stats.textContent = `${matches.length} match${matches.length===1?'':'es'} — at ${idx+1}/${matches.length}`;
    }

    function findStep(dir){
      if(matches.length === 0) return;
      if(idx === -1) idx = (dir > 0 ? 0 : matches.length - 1);
      else idx = (idx + dir + matches.length) % matches.length;
      selectCurrent();
    }

    function doReplace(){
      if(matches.length === 0) return;
      if(idx < 0) idx = 0;
      const m = matches[idx];
      const before = source.value.slice(0, m.start);
      const after  = source.value.slice(m.end);
      source.value = before + replaceInput.value + after;
      const newPos = before.length + replaceInput.value.length;
      source.setSelectionRange(newPos, newPos);
      findAll();
      if(matches.length){
        let nextIndex = matches.findIndex(mm => mm.start >= newPos);
        if(nextIndex === -1) nextIndex = 0;
        idx = nextIndex;
        selectCurrent();
      }
    }

    function doReplaceAll(){
      const re = buildRegex();
      if(!re) return;
      let text = source.value ?? '';
      text = text.replace(re, replaceInput.value);
      source.value = text;
      findAll();
    }

    function doCopy(){
      navigator.clipboard.writeText(source.value ?? '').then(()=>flash(btnCopy));
    }

    function onDlTypeChange(){
      btnDownload.style.display = dlType.value ? '' : 'none';
    }

    function doDownload(){
      const text = source.value ?? '';
      const type = dlType.value;
      if(!type) return;
      if(type === 'txt'){
        downloadBlob(new Blob([text], {type:'text/plain'}), 'text.txt');
      } else if(type === 'doc'){
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre style="font-family:Consolas,Monaco,monospace;white-space:pre-wrap">${escapeHtml(text)}</pre></body></html>`;
        downloadBlob(new Blob([html], {type:'application/msword'}), 'text.doc');
      } else if(type === 'pdf'){
        const pdfBytes = generateSimplePDF(text);
        downloadBlob(new Blob([pdfBytes], {type:'application/pdf'}), 'text.pdf');
      }
    }

    function escapeHtml(s){
      return s.replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));
    }

    function downloadBlob(blob, filename){
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }

    function doClear(){
      source.value = '';
      findInput.value = '';
      replaceInput.value = '';
      matches = []; idx = -1;
      render(); stats.textContent = '0 matches';
      if(!dlType.dataset.fromUpload) dlType.value = '';
      onDlTypeChange();
    }

    function flash(el){
      el.style.transform = 'translateY(-1px) scale(1.01)';
      setTimeout(()=>{ el.style.transform=''; }, 120);
    }

    function updateDisabled(){
      const hasText = (source.value ?? '').length > 0;
      btnCopy.disabled = !hasText;
      btnDownload.disabled = !hasText;
    }

    // Upload (merged control) — rely on label->input default click only to avoid double dialogs
    const fileInputEl = $('#fileInput');
    dropMerge.addEventListener('dragover', (e)=>{ e.preventDefault(); dropMerge.style.background='rgba(255,255,255,.08)'; });
    dropMerge.addEventListener('dragleave', ()=>{ dropMerge.style.background='rgba(255,255,255,.05)'; });
    dropMerge.addEventListener('drop', async (e)=>{
      e.preventDefault(); dropMerge.style.background='rgba(255,255,255,.05)';
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if(f) await handleFile(f);
    });
    fileInputEl.addEventListener('change', async (e)=>{
      if(e.target.files && e.target.files[0]){ await handleFile(e.target.files[0]); e.target.value=''; }
    });

    async function handleFile(file){
      const name = file.name.toLowerCase();
      let inferred = '';
      if(name.endsWith('.txt')){ inferred = 'txt'; source.value = await file.text(); }
      else if(name.endsWith('.doc') && !name.endsWith('.docx')){ inferred = 'doc'; source.value = await file.text().catch(()=> ''); }
      else if(name.endsWith('.docx')){ inferred = 'doc'; source.value = await extractDocxText(file).catch(()=> ''); }
      else if(name.endsWith('.pdf')){ inferred = 'pdf'; source.value = await extractPdfText(file).catch(()=> ''); }
      else { alert('Unsupported document. Please choose a .txt, .docx, or .pdf file.'); return; }
      dlType.value = inferred || '';
      dlType.dataset.fromUpload = inferred ? '1' : '';
      onDlTypeChange();
      findAll();
    }

    // Minimal DOCX extractor
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
          const nameBytes = buf.slice(i+30, i+30+nameLen);
          const name = new TextDecoder('utf-8').decode(nameBytes);
          const dataStart = i + 30 + nameLen + extraLen;
          const dataEnd = dataStart + compSize;
          if(name === 'word/document.xml'){
            let xmlText = '';
            if(compression === 0){
              xmlText = new TextDecoder('utf-8').decode(buf.slice(dataStart, dataEnd));
            } else if(compression === 8){
              const ds = new DecompressionStream('deflate-raw');
              const decompressed = await new Response(new Blob([buf.slice(dataStart, dataEnd)]).stream().pipeThrough(ds)).arrayBuffer();
              xmlText = new TextDecoder('utf-8').decode(new Uint8Array(decompressed));
            } else { throw new Error('Unsupported ZIP compression'); }
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');
            const wNs = xml.documentElement.lookupNamespaceURI('w') || 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
            const paras = Array.from(xml.getElementsByTagNameNS(wNs, 'p'));
            const parts = [];
            for(const p of paras){
              const texts = Array.from(p.getElementsByTagNameNS(wNs, 't')).map(t => t.textContent || '');
              parts.push(texts.join(''));
            }
            return parts.join('\n');
          }
          i = dataEnd;
        } else { i++; }
      }
      throw new Error('word/document.xml not found in DOCX');
    }

    // PDF extractor (naive)
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
              const content = part.slice(1,-1);
              strings.push(pdfUnescape(content));
            }
          }
        }
        if(strings.length) out.push(strings.join(''));
      }
      return out.join('\n');
    }
    function pdfUnescape(s){
      return s.replace(/\\\\(\\d{1,3}|n|r|t|b|f|\\\\|\\(|\\))/g, (m, g1)=>{
        if(g1==='n') return '\n';
        if(g1==='r') return '\r';
        if(g1==='t') return '\t';
        if(g1==='b') return '\b';
        if(g1==='f') return '\f';
        if(g1==='\\\\') return '\\\\';
        if(g1==='(') return '(';
        if(g1===')') return ')';
        const code = parseInt(g1, 8); return String.fromCharCode(code);
      });
    }

    // Simple PDF generator
    function generateSimplePDF(text){
      const encoder = new TextEncoder();
      const pages = paginateText(text);
      const objects = [];
      let pdf = '%PDF-1.4\n';
      const fontObjNum = 1;
      const fontObj = fontObjNum + ' 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
      objects.push(fontObj);
      const pagesObjNum = 2;
      const kids = [];
      let objNum = 3;
      for(const pageLines of pages){
        const content = buildContentStream(pageLines);
        const contentObjNum = objNum++;
        const contentObj = contentObjNum + ' 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream\nendobj\n';
        objects.push(contentObj);
        const pageObjNum = objNum++;
        const pageObj = pageObjNum + ' 0 obj\n<< /Type /Page /Parent ' + pagesObjNum + ' 0 R /MediaBox [0 0 595 842] /Contents ' + contentObjNum + ' 0 R /Resources << /Font << /F1 ' + fontObjNum + ' 0 R >> >> >>\nendobj\n';
        objects.push(pageObj);
        kids.push(pageObjNum + ' 0 R');
      }
      const pagesObj = pagesObjNum + ' 0 obj\n<< /Type /Pages /Count ' + kids.length + ' /Kids [ ' + kids.join(' ') + ' ] >>\nendobj\n';
      objects.splice(1, 0, pagesObj);
      const catalogObjNum = objNum++;
      const catalogObj = catalogObjNum + ' 0 obj\n<< /Type /Catalog /Pages ' + pagesObjNum + ' 0 R >>\nendobj\n';
      objects.push(catalogObj);
      const xref = [];
      let offset = pdf.length;
      for(const obj of objects){
        xref.push(strPad(offset,10) + ' 00000 n ');
        pdf += obj;
        offset = pdf.length;
      }
      const xrefStart = pdf.length;
      pdf += 'xref\n';
      pdf += '0 ' + (objects.length+1) + '\n';
      pdf += '0000000000 65535 f \n';
      for(const line of xref) pdf += line + '\n';
      pdf += 'trailer\n';
      pdf += '<< /Size ' + (objects.length+1) + ' /Root ' + catalogObjNum + ' 0 R >>\n';
      pdf += 'startxref\n' + xrefStart + '\n%%EOF';
      return new TextEncoder().encode(pdf);
    }
    function strPad(num, size){ const s = String(num); return '0'.repeat(Math.max(0,size-s.length)) + s; }
    function buildContentStream(lines){
      let yStart = 812, lineH = 16;
      let out = 'BT\n/F1 12 Tf\n1 0 0 1 30 ' + yStart + ' Tm\n14 TL\n';
      for(const line of lines){ out += '(' + pdfEscape(line) + ') Tj\nT*\n'; }
      out += 'ET\n'; return out;
    }
    function pdfEscape(s){ return s.replace(/([\\()])/g, '\\$1').replace(/\\r?\\n/g, '\\n'); }
    function paginateText(text){
      const maxWidthChars = 85;
      const words = text.replace(/\\r\\n/g,'\\n').split(/(\\s+)/);
      const lines = []; let line = '';
      for(let token of words){
        if(token === '\\n'){ lines.push(line); line=''; }
        else if(/\\s+/.test(token)){
          if(line.length + token.length <= maxWidthChars) line += token;
          else { lines.push(line); line=''; }
        } else {
          if((line + token).length <= maxWidthChars) line += token;
          else { if(line) lines.push(line); while(token.length > maxWidthChars){ lines.push(token.slice(0, maxWidthChars)); token = token.slice(maxWidthChars); } line = token; }
        }
      }
      if(line) lines.push(line);
      const linesPerPage = 46, pages = [];
      for(let i=0;i<lines.length;i+=linesPerPage) pages.push(lines.slice(i,i+linesPerPage));
      return pages.length ? pages : [[]];
    }

    // Events
    [source, findInput, replaceInput, optCase, optWord].forEach(el=>{ el.addEventListener('input', findAll); el.addEventListener('change', findAll); });
    optHighlight.addEventListener('change', render);
    dlType.addEventListener('change', onDlTypeChange);

    btnFindNext.addEventListener('click', ()=> findStep(1));
    btnFindPrev.addEventListener('click', ()=> findStep(-1));
    btnReplace.addEventListener('click', doReplace);
    btnReplaceAll.addEventListener('click', doReplaceAll);
    btnCopy.addEventListener('click', doCopy);
    btnDownload.addEventListener('click', doDownload);
    btnClear.addEventListener('click', doClear);

    findAll(); updateDisabled(); onDlTypeChange();
