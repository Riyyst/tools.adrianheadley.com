}
  


  /* ===== Wiring matches OCR Reader page (colors, pulsing, actions) ===== */
  const $ = s => document.querySelector(s);

  const fileInput  = $("#files");
  const dropZone   = $("#dropZone");
  const fileSummary= $("#fileSummary");
  const fileListEl = $("#fileList");
  const statusEl   = $("#status");
  const runBtn     = $("#run");
  const dlBtn      = $("#download");
  const clearBtn   = $("#clear");
  const errEl      = $("#err");

  let files = [];         // Array<File>
  let outBlob = null;
  let outName = "";

  function show(el){ el && el.classList.remove("hidden"); }
  function hide(el){ el && el.classList.add("hidden"); }
  function setStatus(m){ statusEl.textContent = m || ""; }
  function stem(name){ const i = name.toLowerCase().lastIndexOf(".pdf"); return i>-1 ? name.slice(0,i) : name; }
  function makeOutputName(){ if(!files.length) return "merged.pdf"; return stem(files[0].name) + " Merged.pdf"; }

  function updateRunVisibility(){
    if(files.length >= 2){
      runBtn.classList.remove("hidden");
      runBtn.removeAttribute("disabled");
    }else{
      runBtn.classList.add("hidden");
      runBtn.setAttribute("disabled","");
    }
  }

  function resetUI(full=true){
    setStatus(""); errEl.textContent="";
    hide(dlBtn); hide(clearBtn); dlBtn.setAttribute("disabled",""); dlBtn.removeAttribute("href");
    if(full){ files = []; fileInput.value=""; fileSummary.textContent="No files selected"; fileListEl.innerHTML=""; hide(fileListEl); }
    updateRunVisibility();
  }

  function summarizeFiles(){
    if(!files.length){ fileSummary.textContent = "No files selected"; hide(fileListEl); updateRunVisibility(); return; }
    fileSummary.textContent = files.length + " file(s) selected";
    const ol = document.createElement("ol");
    files.forEach((f, idx)=>{
      const li = document.createElement("li");
      const nameSpan = document.createElement("span");
      nameSpan.className = "name";
      nameSpan.textContent = f.name;
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove";
      removeBtn.setAttribute("type","button");
      removeBtn.setAttribute("aria-label", "Remove " + f.name);
      removeBtn.dataset.index = idx;
      removeBtn.textContent = "×";
      li.appendChild(nameSpan);
      li.appendChild(removeBtn);
      ol.appendChild(li);
    });
    fileListEl.innerHTML = ""; fileListEl.appendChild(ol); show(fileListEl);
    updateRunVisibility();
  }

  // Remove handler (event delegation)
  fileListEl.addEventListener("click", (e)=>{
    const btn = e.target.closest("button.remove");
    if(!btn) return;
    const idx = parseInt(btn.dataset.index, 10);
    if(Number.isInteger(idx)){
      files.splice(idx, 1);
      summarizeFiles();
    }
  });

  dropZone.addEventListener("dragover", e=>{ e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", ()=> dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", e=>{
    e.preventDefault(); dropZone.classList.remove("dragover"); setStatus("");
    const picked = Array.from(e.dataTransfer.files || []).filter(f=>/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
    if(picked.length){ files = picked; summarizeFiles(); }
    else{ errEl.textContent = "Please drop PDF files."; }
  });

  fileInput.addEventListener("change", e=>{
    setStatus("");
    const picked = Array.from(e.target.files || []).filter(f=>/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
    if(picked.length){ files = picked; summarizeFiles(); }
    else{ errEl.textContent = "Please select at least 2 PDF files."; }
  });

  clearBtn.addEventListener("click", ()=> resetUI(true));
  dropZone.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); fileInput.click(); } });

  async function mergePDFs(files){
    const { PDFDocument } = PDFLib;
    const out = await PDFDocument.create();
    let totalPages = 0;

    setStatus("Reading files…");
    const buffers = [];
    for(let i=0;i<files.length;i++){
      const ab = await files[i].arrayBuffer();
      buffers.push(ab);
    }

    for(let i=0;i<buffers.length;i++){
      const src = await PDFDocument.load(buffers[i]);
      const pageIndices = src.getPageIndices();
      const copied = await out.copyPages(src, pageIndices);
      copied.forEach(p=> out.addPage(p));
      totalPages += copied.length;
      setStatus(`Merged ${i+1}/${buffers.length} (${totalPages} page${totalPages!==1?"s":""})…`);
    }

    setStatus("Finalizing…");
    const bytes = await out.save({ useObjectStreams:false });
    return new Blob([bytes], { type: "application/pdf" });
  }

  runBtn.addEventListener("click", async ()=>{
    errEl.textContent = "";
    if(files.length < 2){ errEl.textContent = "Please select at least 2 PDFs to merge."; return; }
    runBtn.setAttribute("disabled","");
    hide(dlBtn); hide(clearBtn); setStatus("Starting…");

    try{
      const outName = makeOutputName();
      const outBlob = await mergePDFs(files);
      const url = URL.createObjectURL(outBlob);
      dlBtn.href = url;
      dlBtn.download = outName;
      dlBtn.removeAttribute("disabled");
      show(dlBtn); show(clearBtn);
      setStatus("All done — Ready for download");
      // Hide the Merge button after success
      runBtn.classList.add("hidden");
    }catch(err){
      console.error(err);
      errEl.textContent = (err && err.message) ? err.message : "Something went wrong during merge.";
      setStatus("");
      updateRunVisibility();
    }finally{
      runBtn.removeAttribute("disabled");
    }
  });

  resetUI(true);
