}
  


  /* ===== Wiring mirrors the Merger page (colors, pulsing, actions) ===== */
  const $ = s => document.querySelector(s);

  const fileInput   = $("#file");
  const dropZone    = $("#dropZone");
  const fileNameEl  = $("#fileName");
  const pdfInfoEl   = $("#pdfInfo");
  const pagesInput  = $("#pages");
  const namingInput = $("#naming");
  const statusEl    = $("#status");
  const runBtn      = $("#run");
  const runAllBtn   = $("#runAll");
  const dlAllBtn    = $("#downloadAll");
  const clearBtn    = $("#clear");
  const errEl       = $("#err");
  const dlList      = $("#downloads");

  let file = null;          // File
  let fileStem = "";
  let totalPages = 0;
  let outLinks = [];        // [{page, url, name}]

  function show(el){ el && el.classList.remove("hidden"); }
  function hide(el){ el && el.classList.add("hidden"); }
  function setStatus(m){ statusEl.textContent = m || ""; }
  function stem(name){ const i = name.toLowerCase().lastIndexOf(".pdf"); return i>-1 ? name.slice(0,i) : name; }
  function fmtName(stem, page){ 
    const tpl = namingInput.value || "{name} page {page}";
    return (tpl.replaceAll("{name}", stem).replaceAll("{page}", String(page))) + ".pdf";
  }

  function resetUI(full=true){
    setStatus(""); errEl.textContent="";
    hide(runBtn); hide(runAllBtn); hide(dlAllBtn); dlAllBtn.setAttribute("disabled",""); dlAllBtn.removeAttribute("href");
    hide(clearBtn); hide(dlList); dlList.innerHTML=""; outLinks=[];
    if(full){ file = null; fileInput.value=""; fileNameEl.textContent = "No file selected"; pdfInfoEl.innerHTML=""; hide(pdfInfoEl); totalPages = 0; pagesInput.value=""; }
  }

  function updateButtons(){
    if(file){
      show(runAllBtn); runAllBtn.removeAttribute("disabled");
      show(runBtn);    runBtn.removeAttribute("disabled");
      show(clearBtn);
    }else{
      hide(runBtn); hide(runAllBtn); hide(clearBtn);
    }
  }

  function parsePagesSpec(spec, max){
    if(!spec || !spec.trim()){ // all
      return Array.from({length:max}, (_,i)=>i+1);
    }
    const pages = new Set();
    const parts = spec.split(/[, ]+/).filter(Boolean);
    for(const part of parts){
      if(/^\d+$/.test(part)){
        const p = parseInt(part,10);
        if(p>=1 && p<=max) pages.add(p);
      }else if(/^\d+-\d+$/.test(part)){
        const [a,b] = part.split("-").map(n=>parseInt(n,10));
        if(a>=1 && b>=1 && a<=max && b<=max){
          const start = Math.min(a,b), end = Math.max(a,b);
          for(let i=start;i<=end;i++) pages.add(i);
        }
      }else{
        throw new Error("Invalid pages format. Use commas and ranges like 1,3,5-7.");
      }
    }
    if(pages.size===0) throw new Error("No valid pages selected.");
    return Array.from(pages).sort((x,y)=>x-y);
  }

  dropZone.addEventListener("dragover", e=>{ e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", ()=> dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", e=>{
    e.preventDefault(); dropZone.classList.remove("dragover"); setStatus("");
    const f = (e.dataTransfer.files && e.dataTransfer.files[0]) || null;
    if(f && (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name))){ pickFile(f); }
    else{ errEl.textContent = "Please drop a PDF file."; }
  });
  dropZone.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener("change", e=>{
    setStatus("");
    const f = (e.target.files && e.target.files[0]) || null;
    if(f && (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name))){ pickFile(f); }
    else{ errEl.textContent = "Please select a PDF."; }
  });

  async function pickFile(f){
    resetUI(false);
    file = f; fileStem = stem(f.name); fileNameEl.textContent = f.name;
    try{
      setStatus("Reading PDF…");
      const ab = await f.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(ab);
      totalPages = pdf.getPageCount();
      pdfInfoEl.innerHTML = "<strong>Pages:</strong> " + totalPages + (totalPages===1 ? "" : " pages");
      show(pdfInfoEl);
      updateButtons();
      setStatus("");
    }catch(err){
      console.error(err);
      errEl.textContent = "Failed to read PDF.";
      resetUI(false);
    }
  }

  async function splitPages(pages){
    const { PDFDocument } = PDFLib;
    setStatus("Splitting pages…");
    for(const p of pages){
      const srcBytes = await file.arrayBuffer();
      const src = await PDFDocument.load(srcBytes);
      const out = await PDFDocument.create();
      const [copied] = await out.copyPages(src, [p-1]);
      out.addPage(copied);
      const bytes = await out.save({ useObjectStreams:false });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const name = fmtName(fileStem, p);
      outLinks.push({ page: p, url, name });
      addDownloadLink(p, url, name);
    }
    makeMultiDownload();
    setStatus("All done — pages ready below");
  }

  function addDownloadLink(page, url, name){
    const a = document.createElement("a");
    a.href = url; a.download = name;
    const left = document.createElement("span");
    left.className = "name";
    // Display text: "<original stem> - Page N"
    left.textContent = (fileStem || "page") + " — Page " + page;
    const right = document.createElement("span");
    right.className = "right";
    right.textContent = "Download";
    a.appendChild(left);
    a.appendChild(right);
    dlList.appendChild(a);
    show(dlList);
    const zipBtn = document.getElementById("downloadAllZip");
    if(zipBtn){ show(zipBtn); zipBtn.removeAttribute("disabled"); }
  }

  function makeMultiDownload(){
    // Build a data URL 'bundle' page that instructs the browser to download all links.
    const html = `<!doctype html><meta charset="utf-8"><title>Downloads</title>
      <p>Starting downloads… If some are blocked, click each link below.</p>
      ${outLinks.map(l=>`<a href="${l.url}" download="${l.name}">${l.name}</a>`).join("<br>")}
      <script>setTimeout(()=>{ const as=[...document.querySelectorAll('a')]; let i=0; (function go(){ if(i>=as.length) return; as[i++].click(); setTimeout(go, 200); })(); }, 300);<\/script>`;
    const blob = new Blob([html], {type:"text/html"});
    const url = URL.createObjectURL(blob);
    dlAllBtn.href = url;
    dlAllBtn.download = (fileStem || "pages") + " — all pages.html";
  }

  runBtn.addEventListener("click", async ()=>{
    errEl.textContent = "";
    if(!file){ errEl.textContent = "Please select a PDF first."; return; }
    try{
      const pages = parsePagesSpec(pagesInput.value, totalPages);
      dlList.innerHTML=""; outLinks=[];
      hide(dlAllBtn); dlAllBtn.removeAttribute("href"); dlAllBtn.setAttribute("disabled","");
      hide(clearBtn); // shown again after op
      runBtn.setAttribute("disabled",""); runAllBtn.setAttribute("disabled","");
      await splitPages(pages);
    }catch(err){
      console.error(err);
      errEl.textContent = (err && err.message) ? err.message : "Split failed.";
    }finally{
      runBtn.removeAttribute("disabled"); runAllBtn.removeAttribute("disabled"); show(clearBtn);
    }
  });

  runAllBtn.addEventListener("click", async ()=>{
    errEl.textContent = "";
    if(!file){ errEl.textContent = "Please select a PDF first."; return; }
    dlList.innerHTML=""; outLinks=[];
    hide(dlAllBtn); dlAllBtn.removeAttribute("href"); dlAllBtn.setAttribute("disabled","");
    hide(clearBtn);
    runBtn.setAttribute("disabled",""); runAllBtn.setAttribute("disabled","");
    try{
      const all = Array.from({length: totalPages}, (_,i)=>i+1);
      await splitPages(all);
    }catch(err){
      console.error(err);
      errEl.textContent = (err && err.message) ? err.message : "Split failed.";
    }finally{
      runBtn.removeAttribute("disabled"); runAllBtn.removeAttribute("disabled"); show(clearBtn);
    }
  });

  clearBtn.addEventListener("click", ()=>{
    resetUI(true);
    // Additionally ensure any optional UI is hidden until the next upload
    const pagesBlockEl = document.getElementById("pagesBlock"); if(pagesBlockEl){ pagesBlockEl.classList.add("hidden"); }
    const runUnifiedEl = document.getElementById("runUnified"); if(runUnifiedEl){ runUnifiedEl.classList.add("hidden"); runUnifiedEl.setAttribute("disabled",""); }
    const zipEl = document.getElementById("downloadAllZip"); if(zipEl){ zipEl.classList.add("hidden"); zipEl.setAttribute("disabled",""); }
  });
async function downloadAllAsZip(){
    if(!outLinks || outLinks.length===0) return;
    const zip = new JSZip();
    // Fetch each blob URL and add to zip with its final name
    for(const item of outLinks){
      try{
        const resp = await fetch(item.url);
        const blob = await resp.blob();
        const arr = await blob.arrayBuffer();
        zip.file(item.name, arr);
      }catch(e){
        console.error("Failed to add to zip:", item.name, e);
      }
    }
    const content = await zip.generateAsync({type:"blob"});
    const zname = (fileStem || "pages") + " — All Pages.zip";
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url; a.download = zname;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 2000);
  }
  const zipBtn = document.getElementById("downloadAllZip");
  if(zipBtn){ zipBtn.addEventListener("click", downloadAllAsZip); }


  // Init
  resetUI(true);
  


// --- Non-destructive shim: preserves original behavior ---
(function(){
  const $ = s => document.querySelector(s);
  const fileInput  = $("#file");
  const dropZone   = $("#dropZone");
  const pagesInput = $("#pages");
  const pagesBlock = $("#pagesBlock");
  const runBtn     = $("#run");       // original specific-pages
  const runAllBtn  = $("#runAll");    // original all-pages
  const runUnified = $("#runUnified");
  const fileNameEl = $("#fileName");
  const pdfInfoEl  = $("#pdfInfo");

  // Robustly hide the entire "filename format" container at runtime (kept for safety)
  const naming = $("#naming");
  if(naming){
    const container = naming.closest("div");
    if(container){ container.classList.add("hide-naming-container"); }
  }

  // Sync helper: show unified when originals are enabled
  const sync = ()=>{
    const originalsEnabled = (runBtn && !runBtn.disabled) || (runAllBtn && !runAllBtn.disabled);
    if(originalsEnabled && runUnified){
      runUnified.classList.remove("hidden");
      runUnified.removeAttribute("disabled");
    }
  };

  // Reveal filename/details and pages input when a file is actually selected
  function onPicked(){
    const hasFile = fileInput && fileInput.files && fileInput.files[0];
    if(!hasFile) return;
    if(fileNameEl) fileNameEl.style.display = "";
    if(pdfInfoEl)  pdfInfoEl.style.display  = "";
    if(pagesBlock) pagesBlock.style.display = "";
    // originals should be enabled by original code; give it a tick then sync
    setTimeout(sync, 50);
  }

  if(fileInput){
    fileInput.addEventListener("change", onPicked);
  }
  if(dropZone){
    dropZone.addEventListener("drop", ()=> setTimeout(onPicked, 0));
  }

  // Unified action: delegate to originals
  if(runUnified){
    runUnified.addEventListener("click", ()=>{
      const spec = (pagesInput && pagesInput.value || "").trim();
      const target = spec ? runBtn : runAllBtn;
      if(target){ target.click(); }
    });
  }

  // Initial small delay to cover cases where browser pre-fills file input after refresh
  setTimeout(sync, 250);
})();
