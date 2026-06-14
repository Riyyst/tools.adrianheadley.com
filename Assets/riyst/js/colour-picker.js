}
  


    const canvas=document.getElementById("canvas"), ctx=canvas.getContext("2d",{willReadFrequently:true});
    const chip=document.getElementById("chip"), hexEl=document.getElementById("hex"), rgbEl=document.getElementById("rgb"), stage=document.getElementById("stage");
    const readout=document.getElementById("readout"), copyBtns=document.getElementById("copyBtns");
    const fileInput=document.getElementById("file"), btnEyedrop=document.getElementById("btnEyedrop"), edHint=document.getElementById("edHint");
    const magnifier=document.getElementById("magnifier"), magCanvas=document.getElementById("magCanvas"), magCtx=magCanvas.getContext("2d",{willReadFrequently:true});
    magCanvas.width=180; magCanvas.height=180;
    let img=new Image(); img.crossOrigin="anonymous"; let hasImage=false;

    function resetOutputs(){ readout.classList.remove("show"); copyBtns.classList.remove("show"); hexEl.textContent=""; rgbEl.textContent=""; }
    resetOutputs();

    
    document.querySelectorAll('input[name="mode"]').forEach(r=>r.addEventListener("change",e=>{
      const isUpload = e.target.value === "upload";
      document.getElementById("section-upload").classList.toggle("hidden", !isUpload);
      document.getElementById("section-screen").classList.toggle("hidden", isUpload);

      if (!isUpload) {
        // Switching to screen picker: wipe uploaded image and reset UI
        hasImage = false;
        if (fileInput) fileInput.value = "";
        stage.classList.remove("show");
        magnifier.style.display = "none";
        // Clear canvas to 1x1 transparent pixel so it doesn't capture clicks
        canvas.width = 1; canvas.height = 1;
        const c2 = canvas.getContext("2d", { willReadFrequently: true });
        c2.clearRect(0,0,1,1);
        resetOutputs();
      }
    }));
    

    if(!("EyeDropper" in window)){ btnEyedrop.disabled=true; if(edHint) edHint.textContent="Your browser does not support on-screen colour picking."; }

    fileInput.addEventListener("change",async e=>{ const f=e.target.files[0]; if(!f)return; const url=URL.createObjectURL(f); await loadImage(url); URL.revokeObjectURL(url); resetOutputs(); });

    btnEyedrop?.addEventListener("click",async()=>{ if(!("EyeDropper" in window))return; try{ const ed=new EyeDropper(); const res=await ed.open(); const {r,g,b}=hexToRgb(res.sRGBHex); setCurrent(r,g,b);}catch{} });

    canvas.addEventListener("mouseenter",()=>{ if(hasImage) magnifier.style.display="block"; });
    canvas.addEventListener("mouseleave",()=>{ magnifier.style.display="none"; });

    canvas.addEventListener("mousemove",e=>{
      if(!hasImage)return;
      const rect=canvas.getBoundingClientRect();
      const cx=Math.floor(e.clientX-rect.left);
      const cy=Math.floor(e.clientY-rect.top);
      if(cx<0||cy<0||cx>=canvas.width||cy>=canvas.height){ magnifier.style.display="none"; return; }

      // Zoomed crop around the cursor from the canvas
      const srcSize=21; // odd so we have a center pixel
      const half=(srcSize-1)/2;
      magCtx.imageSmoothingEnabled=false;
      magCtx.clearRect(0,0,magCanvas.width,magCanvas.height);
      magCtx.drawImage(canvas, cx-half, cy-half, srcSize, srcSize, 0, 0, magCanvas.width, magCanvas.height);

      // Draw grid to mimic system loupe
      const step = magCanvas.width / srcSize;
      magCtx.beginPath();
      for(let i=0;i<=srcSize;i++){
        const pos=Math.round(i*step)+0.5;
        magCtx.moveTo(pos,0); magCtx.lineTo(pos,magCanvas.height);
        magCtx.moveTo(0,pos); magCtx.lineTo(magCanvas.width,pos);
      }
      magCtx.strokeStyle="rgba(255,255,255,.6)";
      magCtx.lineWidth=1;
      magCtx.stroke();

      // Highlight center pixel
      const c0 = Math.floor(half)*step;
      magCtx.strokeStyle="#000";
      magCtx.lineWidth=2;
      magCtx.strokeRect(c0, c0, step, step);
      magCtx.strokeStyle="#fff";
      magCtx.lineWidth=1;
      magCtx.strokeRect(c0, c0, step, step);

      // Position magnifier around cursor
      const mSize=magCanvas.width;
      magnifier.style.left=(e.clientX - mSize/2) + "px";
      magnifier.style.top=(e.clientY - mSize/2 + window.scrollY) + "px";
      magnifier.style.display="block";
    });

    canvas.addEventListener("click",e=>{
      if(!hasImage)return;
      const rect=canvas.getBoundingClientRect();
      const cx=Math.floor(e.clientX-rect.left);
      const cy=Math.floor(e.clientY-rect.top);
      const d=ctx.getImageData(cx,cy,1,1).data;
      setCurrent(d[0],d[1],d[2]);
    });

    async function loadImage(src){
      return new Promise((res,rej)=>{
        img=new Image(); img.crossOrigin="anonymous";
        img.onload=()=>{hasImage=true;draw();res();};
        img.onerror=rej; img.src=src;
      });
    }
    function draw(){
      stage.classList.add("show");
      const maxW=stage.clientWidth-16, maxH=Math.min(580, window.innerHeight*0.7);
      const w=img.width, h=img.height;
      const s=Math.min(maxW/w, maxH/h, 1);
      const dw=Math.floor(w*s), dh=Math.floor(h*s);
      canvas.width=dw; canvas.height=dh;
      const dx=0, dy=0;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function setCurrent(r,g,b){
      const hex=rgbToHex(r,g,b);
      chip.style.background=hex;
      hexEl.textContent=hex;
      rgbEl.textContent=`(${r}, ${g}, ${b})`;
      readout.classList.add("show");
      copyBtns.classList.add("show");
    }
    document.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",async()=>{
      const sel=b.getAttribute("data-copy"); const el=document.querySelector(sel);
      try{ await navigator.clipboard.writeText(el.textContent.trim()); const orig=b.textContent; b.textContent="Copied!"; setTimeout(()=>b.textContent=orig,900);}catch{}
    }));

    function rgbToHex(r,g,b){return"#"+[r,g,b].map(x=>x.toString(16).padStart(2,"0")).join("").toUpperCase();}
    function hexToRgb(h){h=h.replace("#","");if(h.length===3)h=h.split("").map(c=>c+c).join("");return{r:parseInt(h.substr(0,2),16),g:parseInt(h.substr(2,2),16),b:parseInt(h.substr(4,2),16)};}
