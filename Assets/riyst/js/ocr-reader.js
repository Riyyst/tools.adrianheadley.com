}
  

 if (window.pdfjsLib) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js"; } 


  // ===== Stable wiring: keep Generate, hide progress until start, show Download/Clear on complete =====
  const $ = s => document.querySelector(s);

  // Elements (declare all up front!)
  const fileInput  = $("#file");
  const dropZone   = $("#dropZone");
  const fileName   = $("#fileName");
  const statusEl   = $("#status");
  const meterWrap  = document.querySelector(".meter");
  const bar        = $("#bar");
  const runBtn     = $("#run");
  const dlBtn      = $("#download");
  const clearBtn   = $("#clear");
  const errEl      = $("#err");

  // Utils
  const TESS_WORKER = "https://unpkg.com/tesseract.js@5.1.0/dist/worker.min.js";
  const TESS_CORE   = "https://unpkg.com/tesseract.js-core@5.0.0/wasm/tesseract-core.wasm.js";
  const TESS_LANGS  = "https://tessdata.projectnaptha.com/4.0.0";

  function show(el){ el && el.classList.remove("hidden"); }
  function hide(el){ el && el.classList.add("hidden"); }
  function setProgress(p,m){ bar.style.width=Math.max(0,Math.min(100,p))+"%"; statusEl.textContent=m||""; }
  function getPDFOutputName(name){ const dot = name.toLowerCase().endsWith(".pdf") ? name.lastIndexOf(".") : -1; const base = dot === -1 ? name : name.slice(0, dot); return base + " OCR.pdf"; }
  function fileToURL(file){ return URL.createObjectURL(file); }
  function withTimeout(promise, ms, label=""){ return new Promise((resolve,reject)=>{ const t=setTimeout(()=>reject(new Error(label||"timeout")), ms); promise.then(v=>{clearTimeout(t); resolve(v);},e=>{clearTimeout(t); reject(e);}); }); }

  let srcFile=null, outBlob=null, outName="";
  function resetUI(full=true){
    statusEl.textContent=""; bar.style.width="0%"; errEl.textContent="";
    hide(dlBtn); hide(clearBtn);
    dlBtn.setAttribute("disabled",""); dlBtn.removeAttribute("href"); if(full){ fileInput.value=""; srcFile=null; fileName.textContent="No file selected"; runBtn.setAttribute("disabled",""); }
  }

  // Turbo pipeline (ENG only, skip if already searchable)
  async function pdfHasSearchableText(pdf){
    const samplePages = Math.min(pdf.numPages, 3);
    for(let i=1;i<=samplePages;i++){
      const page = await pdf.getPage(i);
      const text = await page.getTextContent({normalizeWhitespace:true});
      const items = text.items || [];
      const letters = items.reduce((n,it)=> n + (it.str ? it.str.length : 0), 0);
      if(letters > 30) return true;
    }
    return false;
  }

  async function renderPDFPageToCanvas(pdfPage){
    const viewport1 = pdfPage.getViewport({ scale: 1 });
    const longEdge = Math.max(viewport1.width, viewport1.height);
    const scale = Math.max(0.5, Math.min(2.0, 1200 / longEdge));
    const viewport = pdfPage.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently:true });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;
    const img = ctx.getImageData(0,0,canvas.width,canvas.height);
    const d = img.data; for(let i=0;i<d.length;i+=4){ const g = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; d[i]=d[i+1]=d[i+2]=g; }
    ctx.putImageData(img,0,0);
    return canvas;
  }

  async function canvasToSearchablePDF(pages){
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    for(const { canvas, ocr } of pages){
      const page = pdf.addPage([canvas.width, canvas.height]);
      const pngBytes = canvas.toDataURL("image/png");
      const img = await pdf.embedPng(pngBytes);
      page.drawImage(img, { x:0, y:0, width:canvas.width, height:canvas.height });
      const words = ocr?.data?.words || [];
      for(const w of words){
        if(!w.text || !w.bbox) continue;
        const { x0, y0, x1, y1 } = w.bbox;
        const x = x0, y = canvas.height - y1, height = (y1 - y0);
        page.drawText(w.text, { x, y, size: Math.max(6, height*0.9), color: rgb(0,0,0), opacity: 0.01 });
      }
    }
    return await pdf.save({ useObjectStreams:false });
  }

  async function createEngWorker(){
    const worker = await Tesseract.createWorker({
      workerPath: TESS_WORKER,
      corePath: TESS_CORE,
      langPath: TESS_LANGS,
      cacheMethod: "none"
    });
    await withTimeout(worker.load(), 10000, "worker.load timeout");
    await withTimeout(worker.loadLanguage("eng"), 15000, "loadLanguage timeout");
    await withTimeout(worker.initialize("eng"), 10000, "initialize timeout");
    await worker.setParameters({
      tessedit_pageseg_mode: 6,
      preserve_interword_spaces: "0",
      user_defined_dpi: "150"
    });
    return worker;
  }

  async function processFile(file){
    errEl.textContent = ""; outBlob = null; outName = getPDFOutputName(file.name);
    setProgress(5, "Preparing…");

    if(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")){
      const data = await file.arrayBuffer();
      const pdfjs = window['pdfjsLib'];
      const pdf = await pdfjs.getDocument({ data }).promise;

      setProgress(10, "Checking for existing text…");
      if (await pdfHasSearchableText(pdf)){
        setProgress(95, "Already searchable — finalizing…");
        outBlob = new Blob([data], { type:"application/pdf" });
        const url = URL.createObjectURL(outBlob);
        dlBtn.href = url; dlBtn.download = outName; dlBtn.removeAttribute("disabled");
        show(dlBtn); show(clearBtn);
        setProgress(100, "Ready to download.");
        return;
      }

      const pageCount = pdf.numPages;
      const pages = [];
      setProgress(20, `Rendering ${pageCount} page(s)…`);
      for(let i=1;i<=pageCount;i++){
        const page = await pdf.getPage(i);
        const canvas = await renderPDFPageToCanvas(page);
        pages.push(canvas);
        setProgress(20 + (i/pageCount)*20, `Rendered ${i}/${pageCount}…`);
      }

      setProgress(42, "Starting OCR (ENG)…");
      const worker = await createEngWorker();

      const results = [];
      for(let i=0;i<pages.length;i++){
        const res = await worker.recognize(pages[i]);
        results.push({ canvas: pages[i], ocr: res });
        setProgress(42 + ((i+1)/pages.length)*45, `OCR ${i+1}/${pages.length}…`);
      }
      await worker.terminate();

      setProgress(92, "Building searchable PDF…");
      const pdfBytes = await canvasToSearchablePDF(results);
      outBlob = new Blob([pdfBytes], { type:"application/pdf" });

    }else{
      const imgURL = fileToURL(file);
      const img = new Image(); img.src = imgURL; await img.decode();
      const canvas = document.createElement('canvas');
      const maxEdge = 1200, w = img.naturalWidth, h = img.naturalHeight;
      const scale = Math.min(1, maxEdge / Math.max(w,h));
      canvas.width = Math.round(w*scale); canvas.height = Math.round(h*scale);
      const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const imgd = ctx.getImageData(0,0,canvas.width,canvas.height);
      const d = imgd.data; for(let i=0;i<d.length;i+=4){ const g = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; d[i]=d[i+1]=d[i+2]=g; } ctx.putImageData(imgd,0,0);

      setProgress(40, "Starting OCR (ENG)…");
      const worker = await createEngWorker();
      const res = await worker.recognize(canvas);
      await worker.terminate();

      setProgress(92, "Building searchable PDF…");
      const pdfBytes = await canvasToSearchablePDF([{ canvas, ocr: res }]);
      outBlob = new Blob([pdfBytes], { type:"application/pdf" });
    }

    if(outBlob){
      const url = URL.createObjectURL(outBlob);
      dlBtn.href = url; dlBtn.download = outName; dlBtn.removeAttribute("disabled");
      setProgress(100, "All done — Ready for download"); show(dlBtn); show(clearBtn);
    }else{
      throw new Error("OCR failed to produce output.");
    }
  }

  // ========== Events ==========
  function enableGenerate(){ if(srcFile){ runBtn.removeAttribute("disabled"); } }
  fileInput.addEventListener("change", (e)=>{
    resetUI(false);
    srcFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    fileName.textContent = srcFile ? srcFile.name : "No file selected";
    enableGenerate();
  });
  dropZone.addEventListener("dragover", e=>{ e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", e=> dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", e=>{
    e.preventDefault(); dropZone.classList.remove("dragover"); resetUI(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if(f){ srcFile = f; fileName.textContent = f.name; enableGenerate(); }
  });

  runBtn.addEventListener("click", async ()=>{
    if(!srcFile) return;
    runBtn.setAttribute("disabled","");
    hide(dlBtn); hide(clearBtn); // ensure hidden at start
    show(statusEl); show(meterWrap); setProgress(1, "Starting…");
    try{ await processFile(srcFile); }
    catch(err){ console.error(err); errEl.textContent = err.message || "Something went wrong during OCR."; }
    finally{ runBtn.removeAttribute("disabled"); }
  });

  clearBtn.addEventListener("click", ()=> resetUI(true));
  dropZone.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); fileInput.click(); } });

  resetUI(true);
