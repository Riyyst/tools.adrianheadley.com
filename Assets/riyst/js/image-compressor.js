}
  


  const $ = s => document.querySelector(s);

  // Elements
  const fileInput  = $("#file");
  const dropZone   = $("#dropZone");
  const fileNameEl = $("#fileName");
  const runBtn     = $("#run");
  const dlBtn      = $("#download");
  const clearBtn   = $("#clear");
  const statusEl   = $("#status");
  const bar        = $("#bar");
  const errEl      = $("#err");
  const meterWrap  = document.querySelector(".meter");
  const targetEl   = $("#target");
  const unitEl     = $("#unit");

  function show(el){ el && el.classList.remove("hidden"); }
  function hide(el){ el && el.classList.add("hidden"); }
  function setProgress(p,m){ bar.style.width=Math.max(0,Math.min(100,p))+"%"; statusEl.textContent=m||""; }

  let srcFile=null, outBlob=null;

  function resetUI(full=true){
    statusEl.textContent=""; bar.style.width="0%"; errEl.textContent="";
    hide(statusEl); hide(meterWrap);
    hide(dlBtn); hide(clearBtn);
    dlBtn.setAttribute("disabled",""); dlBtn.removeAttribute("href"); dlBtn.removeAttribute("download");
    if(full){
      fileInput.value=""; srcFile=null; fileNameEl.textContent="No file selected"; runBtn.setAttribute("disabled","");
      targetEl.value=""; unitEl.value="KB";
    }
  }

  function bytesFromInput(){
    const v = parseFloat(targetEl.value);
    if(!isFinite(v) || v <= 0) return null;
    if(unitEl.value === "GB") return Math.round(v * 1024 * 1024 * 1024);
    if(unitEl.value === "MB") return Math.round(v * 1024 * 1024);
    return Math.round(v * 1024); // KB
  }

  function getDownloadName(file, extOverride){
    const n = file.name;
    const dot = n.lastIndexOf(".");
    const base = dot === -1 ? n : n.slice(0,dot);
    const ext = extOverride || (dot === -1 ? "" : n.slice(dot));
    return base + " - compressed" + (ext || "");
  }

  // Load an image into a canvas at original size (no rescaling)
  async function fileToCanvas(file){
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    return canvas;
  }

  // toBlob promisified
  function canvasToBlob(canvas, type, quality){
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
  }

  // Try a lossless re-encode where possible (Auto mode includes a lossless attempt for PNG)
  async function tryLosslessForPNG(canvas){
    const png = await canvasToBlob(canvas, "image/png");
    return png;
  }

  // Binary search JPEG/WebP quality to meet target bytes, preserving dimensions
  async function searchQuality(canvas, mime, targetBytes, qMin=0.6, qMax=0.95, steps=6){
    let best = { blob: null, q: qMin };
    for(let i=0;i<steps;i++){
      const q = (qMin + qMax) / 2;
      const blob = await canvasToBlob(canvas, mime, q);
      if(!blob) break;
      if(blob.size <= targetBytes){
        best = { blob, q };
        qMin = q; // try higher quality while staying under target
      }else{
        qMax = q;
      }
      setProgress(50 + (i+1)*(40/steps), `Optimising quality… (${Math.round(q*100)}%)`);
    }
    return best.blob;
  }

  async function compress(file){
    const targetBytes = bytesFromInput();
    if(!targetBytes) throw new Error("Please enter a valid target size.");
    setProgress(5,"Preparing…");

    const canvas = await fileToCanvas(file);
    setProgress(20,"Loaded image…");

    const type = (file.type || "").toLowerCase();

    // Auto mode: preserve dimensions, aim for target, prefer visually similar result.
    if(type.includes("jpeg") || type.includes("jpg")){
      let blob = await searchQuality(canvas, "image/jpeg", targetBytes, 0.6, 0.95, 7);
      if(!blob){ throw new Error("Compression failed. Try a slightly larger target."); }
      return { blob, downloadName: getDownloadName(file, ".jpg") };
    }

    if(type.includes("png") || type.includes("tif")){
      setProgress(35,"Trying lossless PNG…");
      const png = await tryLosslessForPNG(canvas);
      if(png && png.size <= targetBytes){
        return { blob: png, downloadName: getDownloadName(file, ".png") };
      }
      setProgress(45,"Lossless couldn't reach target — using high-quality JPEG…");
      const jpg = await searchQuality(canvas, "image/jpeg", targetBytes, 0.6, 0.95, 7);
      if(!jpg){ throw new Error("Compression failed. Try a slightly larger target."); }
      return { blob: jpg, downloadName: getDownloadName(file, ".jpg") };
    }

    if(type.includes("webp")){
      // Try WebP quality search if supported; fallback to JPEG
      let webp = await searchQuality(canvas, "image/webp", targetBytes, 0.6, 0.95, 7);
      if(webp && webp.size <= targetBytes){
        return { blob: webp, downloadName: getDownloadName(file, ".webp") };
      }
      setProgress(45,"Using high-quality JPEG…");
      const jpg = await searchQuality(canvas, "image/jpeg", targetBytes, 0.6, 0.95, 7);
      if(!jpg){ throw new Error("Compression failed. Try a slightly larger target."); }
      return { blob: jpg, downloadName: getDownloadName(file, ".jpg") };
    }

    // Default: attempt JPEG
    const jpg = await searchQuality(canvas, "image/jpeg", targetBytes, 0.6, 0.95, 7);
    if(!jpg){ throw new Error("Compression failed. Try a slightly larger target."); }
    return { blob: jpg, downloadName: getDownloadName(file, ".jpg") };
  }

  // ===== Events & wiring (OCR tool-alike) =====
  function enableCompress(){ if(srcFile){ runBtn.removeAttribute("disabled"); } }

  fileInput.addEventListener("change", (e)=>{
    resetUI(false);
    srcFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    fileNameEl.textContent = srcFile ? srcFile.name : "No file selected";
    enableCompress();
  });

  dropZone.addEventListener("dragover", e=>{ e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", e=> dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", e=>{
    e.preventDefault(); dropZone.classList.remove("dragover"); resetUI(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if(f){ srcFile = f; fileNameEl.textContent = f.name; enableCompress(); }
  });

  runBtn.addEventListener("click", async ()=>{
    errEl.textContent = "";
    if(!srcFile){ return; }
    show(statusEl); show(meterWrap); setProgress(1,"Starting…");
    hide(dlBtn); hide(clearBtn); dlBtn.setAttribute("disabled","");
    runBtn.setAttribute("disabled","");

    try{
      const { blob, downloadName } = await compress(srcFile);
      outBlob = blob;
      const url = URL.createObjectURL(outBlob);
      dlBtn.href = url;
      dlBtn.download = downloadName;
      dlBtn.removeAttribute("disabled");
      show(dlBtn); show(clearBtn);
      setProgress(100,"Ready to download. (Dimensions preserved)");
    }catch(err){
      console.error(err);
      errEl.textContent = err.message || "Something went wrong during compression.";
      setProgress(0,"");
      hide(statusEl); hide(meterWrap);
    }finally{
      runBtn.removeAttribute("disabled");
    }
  });

  clearBtn.addEventListener("click", ()=> resetUI(true));
  dropZone.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); fileInput.click(); } });

  resetUI(true);
