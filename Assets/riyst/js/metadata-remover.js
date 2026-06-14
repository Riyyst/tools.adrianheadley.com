}
  


    function $(s,root){return (root||document).querySelector(s);}
    function $all(s,root){return Array.prototype.slice.call((root||document).querySelectorAll(s));}
    (function(){var y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();})();

    var drop = $('#dropMerge');
    // Click fallback to open file dialog reliably
    drop.addEventListener('click', function(e){ if(e.target && e.target.tagName !== 'INPUT'){ var fi=$('#file'); if(fi) fi.click(); } });
    var fileInput = $('#file');
    var fileNameEl = $('#filename');
    var errorEl = $('#error');
    var results = $('#results');
    var resultsRow = $('#resultsRow');
    var btnRemove = $('#btnRemove');
    var currentFile = null;

    function setFilesLabel(file){
      if(!file){ fileNameEl.textContent = 'No file selected'; return; }
      fileNameEl.textContent = file.name || '1 file selected';
    }
    function setError(msg){ errorEl.textContent = msg||''; }

    function setFile(file){
      currentFile = file;
      setFilesLabel(file);
      btnRemove.disabled = !file;
    }

    ['dragenter','dragover'].forEach(function(evt){
      drop.addEventListener(evt, function(e){ e.preventDefault(); drop.classList.add('dragover'); });
    });
    ['dragleave','drop'].forEach(function(evt){
      drop.addEventListener(evt, function(e){ e.preventDefault(); drop.classList.remove('dragover'); });
    });
    drop.addEventListener('drop', function(e){
      var files = (e.dataTransfer && e.dataTransfer.files) ? Array.prototype.slice.call(e.dataTransfer.files) : [];
      if(!files.length){ setError('No files dropped.'); return; }
      setError('');
      setFile(files[0]);
    });

    fileInput.addEventListener('change', function(){
      var f = fileInput.files && fileInput.files[0];
      if(!f) return;
      setError('');
      setFile(f);
      fileInput.value=''; // allow same file again
    });

    function prependSafe(parent, el){
      if(parent.prepend) parent.prepend(el);
      else parent.insertBefore(el, parent.firstChild);
    }

    btnRemove.addEventListener('click', function(){ if(currentFile) scrubAndShow(currentFile); });

    async function scrubAndShow(file){
      btnRemove.disabled = true;
      btnRemove.textContent = 'Processing…';
      try{
        // Clean via canvas re-encode (drops metadata)
        var clean = await cleanImage(file);

        // Build UI (now visible)
        resultsRow.style.display = '';
        results.innerHTML = '';

        var id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ('id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
        var row = document.createElement('div');
        row.className = 'row result';
        row.innerHTML = ''
          + '<div class="full" style="flex-basis:100%"><div class="box">'
          +   '<div class="head" data-head>New Metadata for ' + (file.name||'file')
          +     '<button class="close" title="Close" aria-label="Close">×</button>'
          +   '</div>'
          +   '<div class="panel">'
          +     '<div class="sub" data-summary>'
          +       '<h4>Summary</h4>'
          +       '<div class="quick" data-quick></div>'
          +     '</div>'
          +     '<div class="grid" style="margin-top:12px">'
          +       '<div class="sub" data-img></div>'
          +       '<div class="sub" data-map></div>'
          +     '</div>'
          +     '<div class="sub" style="margin-top:12px" data-raw>'
          +       '<h4>Full metadata (JSON)</h4>'
          +       '<pre class="json" aria-label="Metadata JSON"></pre>'
          +       '<div class="actions">'
          +         '<a class="btn small accent dl-clean" download target="_blank" rel="noopener">Download Clean File</a>'
          +       '</div>'
          +     '</div>'
          +   '</div>'
          + '</div></div>';
        prependSafe(results, row);

        // Close handler
        row.querySelector('.close').addEventListener('click', function(){ row.remove(); });

        // Preview
        var imgBox = row.querySelector('[data-img]');
        imgBox.innerHTML = '<h4>Preview</h4><div class="imgwrap"><img alt="Preview"></div>';
        var imgEl = imgBox.querySelector('img');
        var cleanUrl = URL.createObjectURL(clean);
        imgEl.src = cleanUrl;

        // Download link
        var origName = (file && file.name) ? file.name : 'image';
        var dlClean = row.querySelector('a.dl-clean');
        dlClean.href = cleanUrl;
        dlClean.download = origName;

        // Parse the cleaned file to prove it's scrubbed
        var cleanFile;
        try{ cleanFile = new File([clean], (file && file.name) ? file.name : 'image', {type: clean.type || 'image/png'}); }
        catch(_ ){ clean.name = (file && file.name) ? file.name : 'image'; cleanFile = clean; }
        var data = await extractAll(cleanFile);

        // Fill JSON
        var pre = row.querySelector('pre.json');
        pre.textContent = JSON.stringify(data, null, 2);

        // Summary + map
        var quickEl = row.querySelector('[data-quick]');
        quickEl.innerHTML = '';
        var frag = buildSummaryNode(data);
        if(frag) quickEl.appendChild(frag);
        var mapBox = row.querySelector('[data-map]');
        buildMap(mapBox, data.summary && data.summary.gps, id);

        // Re-enable button
        btnRemove.textContent = 'Remove metadata';
        btnRemove.disabled = false;
      }catch(e){
        console.error(e);
        var err=$('#error'); if(err){ err.textContent='Could not process that file. Try JPG, PNG, or WEBP.'; }
        btnRemove.textContent = 'Failed — retry';
        btnRemove.disabled = false;
      }
    }

        
    // --- Prefer lossless stripping where possible ---
    async function cleanImage(file){
      // Inspect header
      const buf = await file.arrayBuffer();
      const u8 = new Uint8Array(buf);
      try{
        if(isJPEG(u8)) {
          const stripped = stripJPEG(u8);
          return new Blob([stripped], {type: 'image/jpeg'});
        }
        if(isPNG(u8)) {
          const stripped = stripPNG(u8);
          return new Blob([stripped], {type: 'image/png'});
        }
        if(isWEBP(u8)) {
          const stripped = stripWEBP(u8);
          return new Blob([stripped], {type: 'image/webp'});
        }
      }catch(e){
        console.warn('Lossless strip failed, falling back to canvas', e);
      }
      // Fallback: draw to canvas (removes metadata too)
      return await reencodeNoMetadata(file);
    }

    function stripJPEG(u8){
      const out = [];
      function write(arr){ for(let i=0;i<arr.length;i++) out.push(arr[i]); }
      if(!(u8[0]===0xFF && u8[1]===0xD8)) throw new Error('Not a JPEG');
      // SOI
      write([0xFF,0xD8]);
      let off = 2;
      while(off + 1 < u8.length){
        if(u8[off] !== 0xFF){
          while(off < u8.length && u8[off] !== 0xFF){ off++; }
          if(off + 1 >= u8.length) break;
        }
        while(off + 1 < u8.length && u8[off] === 0xFF && u8[off+1] === 0xFF){ off++; }
        if(off + 1 >= u8.length) break;
        const marker = u8[off+1];

        if(marker === 0xDA){ // SOS
          write(u8.slice(off));
          break;
        }
        if(marker === 0xD9){ // EOI before SOS (rare)
          write([0xFF,0xD9]);
          off += 2;
          break;
        }
        if((marker >= 0xD0 && marker <= 0xD7) || marker === 0x01){ // RSTn/TEM
          write([0xFF, marker]);
          off += 2;
          continue;
        }
        if(off + 4 > u8.length){ write(u8.slice(off)); break; }
        const len = (u8[off+2] << 8) | u8[off+3];
        const end = off + 2 + len;
        if(end > u8.length){ write(u8.slice(off)); break; }

        const skip = (marker === 0xE1) /*APP1 Exif/XMP*/
                  || (marker === 0xED) /*APP13 IPTC*/
                  || (marker === 0xFE); /*COM*/
        if(!skip){
          write(u8.slice(off, end));
        }
        off = end;
      }
      return new Uint8Array(out);
    }

    function stripPNG(u8){
      const sig = [0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A];
      for(let i=0;i<8;i++){ if(u8[i]!==sig[i]) throw new Error('Not a PNG'); }
      const out = [];
      function push(arr){ for(let i=0;i<arr.length;i++) out.push(arr[i]); }
      push(u8.slice(0,8));
      let off = 8;
      while(off + 8 <= u8.length){
        const len = (u8[off]<<24)|(u8[off+1]<<16)|(u8[off+2]<<8)|(u8[off+3]);
        const type = String.fromCharCode(u8[off+4],u8[off+5],u8[off+6],u8[off+7]);
        const dataStart = off+8;
        const dataEnd = dataStart + len;
        const crcEnd = dataEnd + 4;
        const drop = (type==='eXIf' || type==='iTXt' || type==='tEXt' || type==='zTXt');
        if(!drop){
          push(u8.slice(off, crcEnd));
        }
        off = crcEnd;
        if(type==='IEND') break;
      }
      return new Uint8Array(out);
    }

    function stripWEBP(u8){
      function read32le(p){ return (u8[p]) | (u8[p+1]<<8) | (u8[p+2]<<16) | (u8[p+3]<<24); }
      function write32le(n){ return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]; }
      const out = [];
      function push(arr){ for(let i=0;i<arr.length;i++) out.push(arr[i]); }
      const riff = String.fromCharCode(u8[0],u8[1],u8[2],u8[3]);
      const webp = String.fromCharCode(u8[8],u8[9],u8[10],u8[11]);
      if(riff!=='RIFF' || webp!=='WEBP') throw new Error('Not a WEBP');
      push([0x52,0x49,0x46,0x46, 0,0,0,0, 0x57,0x45,0x42,0x50]); // RIFF .... WEBP
      let outSizePos = 4;
      let off = 12;
      let dataBytes = 4;
      while(off + 8 <= u8.length){
        const id = String.fromCharCode(u8[off],u8[off+1],u8[off+2],u8[off+3]);
        const size = read32le(off+4);
        const dataStart = off+8;
        const dataEnd = dataStart + size;
        const pad = size % 2;
        const drop = (id==='EXIF' || id==='XMP ');
        if(!drop){
          push([u8[off],u8[off+1],u8[off+2],u8[off+3]]);
          push(write32le(size));
          push(u8.slice(dataStart, dataEnd));
          if(pad){ push([0]); }
          dataBytes += 8 + size + pad;
        }
        off = dataEnd + pad;
      }
      const riffSize = dataBytes;
      const sz = write32le(riffSize);
      out[outSizePos+0]=sz[0]; out[outSizePos+1]=sz[1]; out[outSizePos+2]=sz[2]; out[outSizePos+3]=sz[3];
      return new Uint8Array(out);
    }
    
async function reencodeNoMetadata(file){
      var bmp = null;
      try{ bmp = await createImageBitmap(file); }catch(_ ){ bmp = null; }

      var w,h, drawImg;
      if(bmp){ w=bmp.width; h=bmp.height; drawImg=bmp; }
      else {
        drawImg = await loadImage(URL.createObjectURL(file));
        w = drawImg.naturalWidth || drawImg.width;
        h = drawImg.naturalHeight || drawImg.height;
      }

      var cnv = document.createElement('canvas');
      cnv.width = w; cnv.height = h;
      var ctx = cnv.getContext('2d', {alpha:true});
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(drawImg, 0, 0);

      // Preserve transparency; avoid JPEG if alpha is present
      var desiredType = (file && typeof file.type==='string' && /image\/(png|jpeg|webp)/.test(file.type)) ? file.type : 'image/png';
      var hasAlpha = false;
      try{
        var sample = ctx.getImageData(0,0,Math.min(64,w),Math.min(64,h)).data;
        for(var i=3;i<sample.length;i+=4){ if(sample[i]<255){ hasAlpha = true; break; } }
      }catch(_ ){}
      var outType = (hasAlpha && desiredType==='image/jpeg') ? 'image/png' : desiredType;
      var quality = (outType==='image/jpeg') ? 0.92 : undefined;
      var blob = await new Promise(function(res){ cnv.toBlob(res, outType, quality); });
      if(!blob) throw new Error('Encoding failed');
      return blob;
    }

    function loadImage(src){
      return new Promise(function(resolve,reject){
        var img = new Image();
        img.onload=function(){ resolve(img); URL.revokeObjectURL(src); };
        img.onerror=function(e){ reject(e); URL.revokeObjectURL(src); };
        img.src = src;
      });
    }

    /* ----- Map builder (Leaflet) ----- */
    function buildMap(container, gps, uniqueId){
      container.innerHTML = '<h4>Location</h4>';
      var wrap = document.createElement('div');
      wrap.className = 'mapwrap';
      container.appendChild(wrap);
      if(!gps || !isFinite(gps.lat) || !isFinite(gps.lon)){
        wrap.style.display='flex'; wrap.style.alignItems='center'; wrap.style.justifyContent='center';
        wrap.textContent = 'No GPS data found';
        return;
      }
      var id = 'map-' + (uniqueId || (Math.random().toString(36).slice(2)));
      wrap.id = id;
      var map = L.map(id, { zoomControl: true }).setView([gps.lat, gps.lon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      var marker = L.marker([gps.lat, gps.lon]).addTo(map);
      marker.bindPopup('GPS: ' + gps.lat.toFixed(5) + ', ' + gps.lon.toFixed(5));
      setTimeout(function(){ map.invalidateSize(); }, 50);
    }

    /* ------------ Parsers (same as reader) ------------- */
    function isJPEG(u8){ return u8 && u8.length>2 && u8[0]===0xFF && u8[1]===0xD8; }
    function isPNG(u8){ return u8 && u8.length>4 && u8[0]===0x89 && u8[1]===0x50 && u8[2]===0x4E && u8[3]===0x47; }
    function isWEBP(u8){ return u8 && u8.length>12 && u8[0]===0x52 && u8[1]===0x49 && u8[2]===0x46 && u8[3]===0x46 && u8[8]===0x57 && u8[9]===0x45 && u8[10]===0x42 && u8[11]===0x50; }

    function extractAll(file){
      var base = { file:{ name:file.name || 'clean', type:file.type, size:file.size }, summary:{}, exif:null, iptc:null, xmp:null };
      return file.arrayBuffer().then(function(buf){
        var u8 = new Uint8Array(buf);
        if('createImageBitmap' in window){
          return Promise.resolve(createImageBitmap(file)).catch(function(){ return null; }).then(function(bmp){
            if(bmp){ base.summary.width=bmp.width; base.summary.height=bmp.height; }
            return {u8:u8};
          });
        }
        return {u8:u8};
      }).then(function(ctx){
        var u8 = ctx.u8;
        if(isJPEG(u8)){
          var segs = scanJPEG(u8);
          var exifSeg = segs.find(function(s){return s.type==='APP1' && s.kind==='exif';});
          if(exifSeg){
            var exif = parseEXIF(exifSeg.data);
            if(exif) { base.exif = exif; fillSummaryFromEXIF(base.summary, exif); }
          }
          var xmpSeg = segs.find(function(s){return s.type==='APP1' && s.kind==='xmp';});
          if(xmpSeg){ base.xmp = parseXMP(xmpSeg.data); if(base.xmp && base.xmp['xmp:CreateDate'] && !base.summary.date) base.summary.date = base.xmp['xmp:CreateDate']; }
          var iptcSeg = segs.find(function(s){return s.type==='APP13' && s.kind==='iptc';});
          if(iptcSeg){ base.iptc = parseIPTC(iptcSeg.data); }
        } else if(isPNG(u8)){
          var png = parsePNG(u8);
          if(png.exif){ var exifP = parseEXIF(png.exif); if(exifP){ base.exif = exifP; fillSummaryFromEXIF(base.summary, exifP); } }
          if(png.xmp){ base.xmp = parseXMP(png.xmp); }
          if(png.text){ base.iptc = Object.assign({'PNGText': png.text}, base.iptc||{}); }
        } else if(isWEBP(u8)){
          var webp = parseWEBP(u8);
          if(webp.exif){ var exifW = parseEXIF(webp.exif); if(exifW){ base.exif = exifW; fillSummaryFromEXIF(base.summary, exifW); } }
          if(webp.xmp){ base.xmp = parseXMP(webp.xmp); }
        } else {
          base.summary.note = 'File format not currently supported for deep parsing. Try JPEG/PNG/WEBP.';
        }
        return base;
      }).catch(function(err){ console.error(err); return base; });
    }

    function scanJPEG(u8){
      var segs = [];
      var off = 2;
      while(off + 4 < u8.length && u8[off]===0xFF){
        var marker = u8[off+1];
        if(marker===0xDA) break; // SOS
        var len = (u8[off+2]<<8) | u8[off+3];
        var start = off+4, end = start + len - 2;
        var view = u8.slice(start, end);
        if(marker===0xE1){
          var isExif = (view[0]===0x45 && view[1]===0x78 && view[2]===0x69 && view[3]===0x66 && view[4]===0 && view[5]===0);
          if(isExif){ segs.push({type:'APP1', kind:'exif', data:view.slice(6)}); }
          else {
            var id = 'http://ns.adobe.com/xap/1.0/';
            var head=''; try{ head=new TextDecoder().decode(view.slice(0,id.length)); }catch(_){}
            if(head===id){ segs.push({type:'APP1', kind:'xmp', data:view.slice(id.length)}); }
          }
        } else if(marker===0xED){
          var txt=''; try{ txt=new TextDecoder().decode(view.slice(0,13)); }catch(_){}
          if(txt.indexOf('Photoshop 3.')===0){ segs.push({type:'APP13', kind:'iptc', data:view.slice(14)}); }
        }
        off = end;
      }
      return segs;
    }

    function parseEXIF(u8){
      try{
        var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
        var order = (dv.getUint16(0,false)===0x4949) ? 'LE' : 'BE';
        var get16 = function(o){ return order==='LE'? dv.getUint16(o,true):dv.getUint16(o,false); };
        var get32 = function(o){ return order==='LE'? dv.getUint32(o,true):dv.getUint32(o,false); };
        if(get16(2)!==42) return null;
        var ifd0 = get32(4);
        var out = {}; var seen = {};
        function readIFD(off, path){
          if(!off || seen[off]) return; seen[off]=true;
          var cnt = get16(off);
          for(var i=0;i<cnt;i++){
            var base = off + 2 + i*12;
            var tag = get16(base);
            var type = get16(base+2);
            var count = get32(base+4);
            var valField = base+8;
            var need = count*typeSize(type);
            var valPtr = (need > 4) ? get32(valField) : valField;
            var value = readValue(type, count, valPtr);
            assignTag(out, path, tag, value);
            if(tag===0x8769){ readIFD(get32(valField), 'ExifIFD'); }
            else if(tag===0x8825){ readIFD(get32(valField), 'GPS'); }
          }
          var next = get32(off + 2 + cnt*12);
          if(next) readIFD(next, path);
        }
        function typeSize(t){ return (t===1||t===2||t===7)?1 : (t===3)?2 : (t===4||t===9)?4 : (t===5||t===10)?8 : 0; }
        function readValue(type, count, ptr){
          if(type===2){ var bytes=new Uint8Array(dv.buffer, dv.byteOffset+ptr, count); var s=''; try{ s=new TextDecoder().decode(bytes);}catch(_){s='';} return s.replace(/ +$/,''); }
          if(type===3){ var a=[]; for(var i=0;i<count;i++) a.push(get16(ptr+i*2)); return count===1?a[0]:a; }
          if(type===4){ var a=[]; for(var i=0;i<count;i++) a.push(get32(ptr+i*4)); return count===1?a[0]:a; }
          if(type===5){ var a=[]; for(var i=0;i<count;i++){ var n=get32(ptr+i*8), d=get32(ptr+i*8+4); a.push(d? (n/d):0); } return count===1?a[0]:a; }
          if(type===10){ var a=[]; for(var i=0;i<count;i++){ var n=dv.getInt32(ptr+i*8, order==='LE'); var d=dv.getInt32(ptr+i*8+4, order==='LE'); a.push(d? (n/d):0);} return count===1?a[0]:a; }
          if(type===1||type===7){ var b=new Uint8Array(dv.buffer, dv.byteOffset+ptr, count); var arr=[]; for(var i=0;i<b.length;i++) arr.push(b[i]); return arr; }
          if(type===9){ var a=[]; for(var i=0;i<count;i++) a.push(dv.getInt32(ptr+i*4, order==='LE')); return count===1?a[0]:a; }
          return null;
        }
        function assignTag(outObj, path, tag, value){
          var tags = {
            0x010F:'Make', 0x0110:'Model', 0x0132:'DateTime',
            0x829A:'ExposureTime', 0x829D:'FNumber', 0x8827:'ISO',
            0x9003:'DateTimeOriginal', 0x9004:'CreateDate', 0x920A:'FocalLength',
            0xA434:'LensModel', 0x0112:'Orientation',
            0x0000:'GPSVersionID', 0x0001:'GPSLatitudeRef', 0x0002:'GPSLatitude',
            0x0003:'GPSLongitudeRef', 0x0004:'GPSLongitude', 0x0005:'GPSAltitudeRef',
            0x0006:'GPSAltitude'
          };
          var name = tags[tag] || ('Tag_' + tag.toString(16));
          if(path==='GPS' && name.indexOf('GPS')!==0) name = 'GPS'+name;
          if(path){ outObj[path] = outObj[path] || {}; outObj[path][name] = value; }
          else { outObj[name] = value; }
        }
        readIFD(ifd0, '');
        var simplified = {
          Make: out['Make'], Model: out['Model'],
          LensModel: out['LensModel'],
          DateTimeOriginal: out['ExifIFD'] ? out['ExifIFD']['DateTimeOriginal'] : out['DateTimeOriginal'],
          CreateDate: out['ExifIFD'] ? out['ExifIFD']['CreateDate'] : out['CreateDate'],
          FNumber: out['ExifIFD'] ? out['ExifIFD']['FNumber'] : out['FNumber'],
          ExposureTime: out['ExifIFD'] ? out['ExifIFD']['ExposureTime'] : out['ExposureTime'],
          ISO: out['ExifIFD'] ? out['ExifIFD']['ISO'] : out['ISO'],
          FocalLength: out['ExifIFD'] ? out['ExifIFD']['FocalLength'] : out['FocalLength'],
          GPS: out['GPS'] || null,
          _raw: out
        };
        return simplified;
      }catch(e){ console.error('EXIF parse failed', e); return null; }
    }

    function fillSummaryFromEXIF(summary, exif){
      if(!exif) return;
      if(exif.Make) summary.make = exif.Make;
      if(exif.Model) summary.model = exif.Model;
      if(exif.LensModel) summary.lens = exif.LensModel;
      summary.date = exif.DateTimeOriginal || exif.CreateDate || summary.date || '';
      if(exif.ExposureTime) summary.exposure = exif.ExposureTime + 's';
      if(exif.FNumber) summary.fnumber = (typeof exif.FNumber === 'number') ? exif.FNumber.toFixed(1) : exif.FNumber;
      if(exif.ISO) summary.iso = exif.ISO;
      if(exif.FocalLength) summary.focalLength = Math.round(exif.FocalLength);
      if(exif.GPS){
        var lat = dmsToDec(exif.GPS.GPSLatitude, exif.GPS.GPSLatitudeRef);
        var lon = dmsToDec(exif.GPS.GPSLongitude, exif.GPS.GPSLongitudeRef);
        if(isFinite(lat) && isFinite(lon)) summary.gps = {lat:lat, lon:lon};
      }
    }
    function dmsToDec(arr, ref){
      if(!arr || !arr.length) return NaN;
      var d=(arr[0]||0), m=(arr[1]||0), s=(arr[2]||0);
      var val = d + (m/60) + (s/3600);
      if(ref==='S' || ref==='W') val = -val;
      return val;
    }

    function parseXMP(u8){
      var s = ''; try{ s = new TextDecoder().decode(u8); }catch(_){ s=''; }
      var start = s.indexOf('<x:xmpmeta'); var end = s.lastIndexOf('</x:xmpmeta>');
      var xml = (start>=0 && end>start) ? s.slice(start, end+12) : s;
      var out = { raw: xml };
      try{
        var doc = new DOMParser().parseFromString(xml, 'application/xml');
        function get(q){ var n=doc.querySelector(q); return n? n.textContent: undefined; }
        out['dc:title'] = get('dc\:title rdf\:Alt > rdf\:li') || get('dc\:title');
        var subjects = doc.querySelectorAll('dc\:subject rdf\:Bag > rdf\:li');
        out['dc:subject'] = Array.prototype.map.call(subjects, function(n){ return n.textContent; });
        out['xmp:CreateDate'] = get('xmp\:CreateDate') || get('photoshop\:DateCreated');
      }catch(_){}
      return out;
    }

    function parseIPTC(u8){
      var off = 0;
      var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      var iptc = {};
      while(off + 10 <= u8.length){
        if(u8[off]!==0x38 || u8[off+1]!==0x42 || u8[off+2]!==0x49 || u8[off+3]!==0x4D) break;
        var id = (u8[off+4]<<8) | u8[off+5];
        off+=6;
        var nameLen = u8[off]; off+=1;
        off += nameLen;
        if((1+nameLen)%2===1) off++;
        var size = dv.getUint32(off); off+=4;
        if(id===0x0404){
          var data = u8.slice(off, off+size);
          Object.assign(iptc, parseIPTCDatasets(data));
        }
        off += size;
        if(size%2===1) off++;
      }
      return iptc;
    }
    function parseIPTCDatasets(u8){
      var out = {};
      var textDecoder = new TextDecoder();
      var off = 0;
      while(off + 5 <= u8.length){
        if(u8[off]!==0x1C){ off++; continue; }
        var rec = u8[off+1];
        var ds = u8[off+2];
        var size = (u8[off+3]<<8)|u8[off+4];
        off+=5;
        if(size===0x7FFF){ size = (u8[off]<<24)|(u8[off+1]<<16)|(u8[off+2]<<8)|u8[off+3]; off+=4; }
        var val = u8.slice(off, off+size); off+=size;
        var key = (rec===2? '2:' : rec+':') + ds;
        var map = {
          '2:5':'ObjectName', '2:120':'Caption', '2:25':'Keywords',
          '2:55':'DateCreated', '2:80':'Byline', '2:85':'BylineTitle',
          '2:90':'City', '2:95':'ProvinceState', '2:101':'CountryCode',
          '2:116':'CopyrightNotice'
        };
        var name = map[key] || ('IPTC_'+key);
        if(name==='Keywords'){
          var s = textDecoder.decode(val);
          out[name] = out[name] || [];
          out[name].push(s);
        } else {
          var s2 = textDecoder.decode(val);
          out[name] = s2;
        }
      }
      return out;
    }

    function parsePNG(u8){
      var off = 8;
      var text = {};
      var exif = null, xmp = null;
      while(off + 8 <= u8.length){
        var len = (u8[off]<<24)|(u8[off+1]<<16)|(u8[off+2]<<8)|(u8[off+3]);
        var type = String.fromCharCode(u8[off+4],u8[off+5],u8[off+6],u8[off+7]);
        var data = u8.slice(off+8, off+8+len);
        if(type==='tEXt' || type==='iTXt'){
          var txt = new TextDecoder().decode(data);
          var idx = txt.indexOf('\0');
          if(idx>0){ var k=txt.slice(0,idx); var v=txt.slice(idx+1); text[k]=v; }
        } else if(type==='eXIf'){
          exif = data;
        } else {
          var s = ''; try{ s = new TextDecoder().decode(data); }catch(_){}
          if(s.indexOf('<x:xmpmeta')>=0) xmp = data;
        }
        off += 12 + len;
      }
      return { text:text, exif:exif, xmp:xmp };
    }

    function parseWEBP(u8){
      var off = 12;
      var exif=null, xmp=null;
      while(off + 8 <= u8.length){
        var id = String.fromCharCode(u8[off],u8[off+1],u8[off+2],u8[off+3]);
        var size = u8[off+4] | (u8[off+5]<<8) | (u8[off+6]<<16) | (u8[off+7]<<24);
        var data = u8.slice(off+8, off+8+size);
        if(id==='EXIF') exif = data;
        if(id==='XMP ') xmp = data;
        off += 8 + size + (size%2);
      }
      return { exif:exif, xmp:xmp };
    }

    function normalizeDateTime(input){
      if(!input) return {date:'', time:''};
      var str = String(input).trim();
      str = str.replace('T',' ').replace(/Z$/,'');
      str = str.replace(/([0-9]{2}:[0-9]{2}:[0-9]{2})\.[0-9]+.*/, '$1');
      str = str.replace(/([0-9]{2}:[0-9]{2}:[0-9]{2})([\+\-].*)$/, '$1');
      var parts = str.split(/[\s]+/);
      var date = parts[0] || '';
      var time = parts[1] || '';
      if(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)){ date = date.replace(/-/g, ':'); }
      return {date:date, time:time};
    }

    function buildSummaryNode(data){
      var s = data.summary||{};
      var device = [s.make||'', s.model||''].join(' ').trim();
      var dt = normalizeDateTime(s.date);
      var gps = (s.gps && isFinite(s.gps.lat) && isFinite(s.gps.lon)) ? (s.gps.lat.toFixed(5)+', '+s.gps.lon.toFixed(5)) : '';
      var haveAny = device || dt.date || dt.time || gps;
      var frag = document.createDocumentFragment();
      if(!haveAny){ frag.appendChild(document.createTextNode('—')); return frag; }
      function line(label, value){
        if(!value) return;
        var div = document.createElement('div');
        div.className = 'quick-item';
        var lab = document.createElement('span'); lab.className = 'quick-label'; lab.textContent = label + ': ';
        var val = document.createElement('span'); val.className = 'quick-value'; val.textContent = value;
        div.appendChild(lab); div.appendChild(val);
        frag.appendChild(div);
      }
      line('Device', device);
      line('Date', dt.date);
      line('Time', dt.time);
      line('GPS', gps);
      return frag;
    }
