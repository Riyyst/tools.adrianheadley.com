}
  


    (function(){const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();})();

    const mount = document.getElementById('mount');
    const fmt = document.getElementById('fmt');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnDownload = document.getElementById('btnDownload');
    const hint = document.getElementById('hint');
    const previewWrapper = document.getElementById('previewWrapper');
    const downloads = document.getElementById('downloads');
    const nameField = document.getElementById('nameField');
    const locField = document.getElementById('locField');
    const itemField = document.getElementById('itemField');

    let lastSVG = null;
    let lastCanvas = null;
    let lastValue = "";
    let lastWidth = 0, lastHeight = 0;

    function showError(msg){
      hint.textContent = msg || "";
      hint.style.display = msg ? "block" : "none";
    }
    function clearPreview(){
      mount.innerHTML = "";
      lastSVG = null;
      lastCanvas = null;
      lastWidth = 0; lastHeight = 0;
    }

    function buildDescriptor(){
      const parts = [nameField.value.trim(), locField.value.trim(), itemField.value.trim()].filter(Boolean);
      return parts.join(" • ");
    }

    // Code 39 map
    const CODE39 = {
      "0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw","5":"wnnwwnnnn","6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn",
      "A":"wnnnnwnnw","B":"nnwnnwnnw","C":"wnwnnwnnn","D":"nnnnwwnnw","E":"wnnnwwnnn","F":"nnwnwwnnn","G":"nnnnnwwnw","H":"wnnnnwwnn","I":"nnwnnwwnn","J":"nnnnwwwnn",
      "K":"wnnnnnnww","L":"nnwnnnnww","M":"wnwnnnnwn","N":"nnnnwnnww","O":"wnnnwnnwn","P":"nnwnwnnwn","Q":"nnnnnnwww","R":"wnnnnnwwn","S":"nnwnnnwwn","T":"nnnnwnwwn",
      "U":"wwnnnnnnw","V":"nwwnnnnnw","W":"wwwnnnnnn","X":"nwnnwnnnw","Y":"wwnnwnnnn","Z":"nwwnwnnnn","-":"nwnnnnwnw",".":"wwnnnnwnn"," ":"nwwnnnwnn","$":"nwnwnwnnn","/":"nwnwnnnwn","+":"nwnnnwnwn","%":"nnnwnwnwn",
      "*":"nwnnwnwnn"
    };

    function generateValue(len=12){
      let s=""; for(let i=0;i<len;i++){ s += Math.floor(Math.random()*10); }
      return s;
    }

    function renderCode39(value){
      clearPreview();
      showError("");

      const text = "*" + value + "*";

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      const narrow = 2;
      const wide   = narrow * 3;
      const quiet  = 10;
      const barTop = 24;
      const barH   = 180;

      let x = quiet;
      const g = document.createElementNS(svgNS, "g");

      function drawPattern(pattern){
        for(let i=0;i<pattern.length;i++){
          const isBar = (i % 2 === 0);
          const w = pattern[i] === "n" ? narrow : wide;
          if(isBar){
            const rect = document.createElementNS(svgNS, "rect");
            rect.setAttribute("x", x);
            rect.setAttribute("y", barTop);
            rect.setAttribute("width", w);
            rect.setAttribute("height", barH);
            rect.setAttribute("fill", "#000");
            g.appendChild(rect);
          }
          x += w;
        }
        x += narrow;
      }

      for(const ch of text){
        const pat = CODE39[ch];
        if(!pat){ showError("Unsupported character: " + ch); return; }
        drawPattern(pat);
      }

      // Human readable number
      const t = document.createElementNS(svgNS, "text");
      const numY = barTop + barH + 28;
      t.setAttribute("x", 0);
      t.setAttribute("y", numY);
      t.setAttribute("font-size", "20");
      t.setAttribute("font-weight", "800");
      t.setAttribute("fill", "#111");
      t.textContent = value;
      g.appendChild(t);

      // Optional descriptor line
      const desc = buildDescriptor();
      let descHeight = 0;
      if(desc){
        const d = document.createElementNS(svgNS, "text");
        d.setAttribute("x", 0);
        d.setAttribute("y", numY + 22);
        d.setAttribute("font-size", "14");
        d.setAttribute("font-weight", "700");
        d.setAttribute("fill", "#333");
        d.textContent = desc;
        g.appendChild(d);
        descHeight = 22;
      }

      const contentW = x + quiet;
      const width = contentW;
      const height = barTop + barH + 48 + descHeight;
      // center text
      t.setAttribute("x", width/2);
      t.setAttribute("text-anchor", "middle");
      if(desc){
        const d = g.lastChild; // descriptor text
        d.setAttribute("x", width/2);
        d.setAttribute("text-anchor", "middle");
      }

      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.style.background = "#ffffff";
      svg.appendChild(g);

      mount.appendChild(svg);
      lastSVG = svg;
      lastValue = value;
      lastWidth = width;
      lastHeight = height;

      // Reveal preview + downloads and center them
      previewWrapper.style.display = "block";
      previewWrapper.style.minHeight = (height + 16) + "px";
      previewWrapper.style.width = (width + 16) + "px";
      previewWrapper.style.maxWidth = "100%";
      previewWrapper.style.margin = "var(--stack-gap) auto 0 auto";
      previewWrapper.setAttribute("aria-hidden","false");
      downloads.style.display = "flex";
      downloads.style.marginTop = "var(--stack-gap)";
    }

    function svgToPngBlob(svgEl, outW, outH){
      outW = outW || parseInt(svgEl.getAttribute("width"),10) || 800;
      outH = outH || parseInt(svgEl.getAttribute("height"),10) || 260;
      return new Promise((resolve, reject) => {
        const xml = new XMLSerializer().serializeToString(svgEl);
        const svg64 = btoa(unescape(encodeURIComponent(xml)));
        const image64 = 'data:image/svg+xml;base64,' + svg64;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = outW;
          canvas.height = outH;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0,0,canvas.width,canvas.height);
          ctx.drawImage(img,0,0,outW,outH);
          canvas.toBlob(b => resolve(b), 'image/png');
          lastCanvas = canvas;
        };
        img.onerror = reject;
        img.src = image64;
      });
    }

    async function canvasToPdfBlob(canvas){
      const dataURL = canvas.toDataURL('image/jpeg', 0.95);
      const b64 = dataURL.split(',')[1];
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const w = canvas.width, h = canvas.height;
      const pdfW = w, pdfH = h;

      function str2buf(s){ return Uint8Array.from(s, c=>c.charCodeAt(0)); }
      function concat(...arrays){
        let len = arrays.reduce((a,b)=>a+b.length,0);
        let out = new Uint8Array(len);
        let off = 0;
        for(const arr of arrays){ out.set(arr, off); off += arr.length; }
        return out;
      }

      const header = str2buf('%PDF-1.4\n');
      const objs = [];
      const xref = [];
      let offset = header.length;

      function addObject(s, bin){
        const head = str2buf(s);
        const body = bin ? bin : new Uint8Array();
        const end = str2buf('\nendobj\n');
        const chunk = concat(head, body, end);
        const start = offset;
        offset += chunk.length;
        objs.push(chunk);
        xref.push(start);
      }

      addObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
      addObject(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
      addObject(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfW} ${pdfH}] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>\nendobj\n`);
      const imgDict = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`;
      addObject(imgDict, concat(bytes, str2buf('\nendstream')));
      const content = `q\n${pdfW} 0 0 ${pdfH} 0 0 cm\n/Im0 Do\nQ\n`;
      const contentBytes = str2buf(content);
      addObject(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`, concat(contentBytes, str2buf('\nendstream')));

      let xrefStr = 'xref\n0 ' + (xref.length + 1) + '\n';
      xrefStr += '0000000000 65535 f \n';
      for(const off of xref){
        xrefStr += off.toString().padStart(10,'0') + ' 00000 n \n';
      }
      const xrefBuf = str2buf(xrefStr);
      const trailer = str2buf(`trailer\n<< /Size ${xref.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`);
      const full = concat(header, ...objs, xrefBuf, trailer);
      return new Blob([full], {type:'application/pdf'});
    }

    function download(name, blob){
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 250);
    }

    btnGenerate.addEventListener('click', ()=>{
      const v = generateValue(12);
      renderCode39(v);
    });

    btnDownload.addEventListener('click', async ()=>{
      if(!lastSVG){ return; }
      const ext = fmt.value;
      if(ext === "svg"){
        const xml = new XMLSerializer().serializeToString(lastSVG);
        const blob = new Blob([xml], {type:'image/svg+xml'});
        download('barcode.svg', blob);
      }else if(ext === "png"){
        const pngBlob = await svgToPngBlob(lastSVG, lastWidth, lastHeight);
        download('barcode.png', pngBlob);
      }else if(ext === "pdf"){
        const pngBlob = await svgToPngBlob(lastSVG, lastWidth, lastHeight);
        const canvas = document.createElement('canvas');
        canvas.width = lastWidth;
        canvas.height = lastHeight;
        const ctx = canvas.getContext('2d');
        const url = URL.createObjectURL(pngBlob);
        const i = new Image();
        await new Promise((res, rej)=>{
          i.onload = ()=>{ ctx.drawImage(i,0,0); URL.revokeObjectURL(url); res(); };
          i.onerror = rej;
          i.src = url;
        });
        const pdfBlob = await canvasToPdfBlob(canvas);
        download('barcode.pdf', pdfBlob);
      }
    });
