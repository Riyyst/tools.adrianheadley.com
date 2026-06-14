}
  


    const NOMINATIM = "https://nominatim.openstreetmap.org";
    const OSRM = "https://router.project-osrm.org";
    const LANG_HEADER = { "Accept-Language": "en-GB" };
    const RATE_DELAY_MS = 200, DEDUP_METRES = 10;

    // World default (don’t start in the UK)
    const WORLD_CENTER = [20, 0], WORLD_ZOOM = 2;

    const UK_POSTCODE_REGEX = new RegExp("^((GIR\\x20?0AA)|(((([A-PR-UWYZ][0-9]{1,2})|(([A-PR-UWYZ][A-HK-Y][0-9]{1,2})|(([A-PR-UWYZ][0-9][A-HJKPSTUW])|([A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY]))))\\x20?[0-9][ABD-HJLNP-UW-Z]{2})))$","i");
    const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
    const km = (m)=>(m/1000).toFixed(1);
    const hhmm = (s)=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.round((s%3600)/60);return h>0?`${h}h ${m}m`:`${m}m`};
    const toRad = (d)=>d*Math.PI/180;
    function distanceMetres(a,b){const R=6371000,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon),lat1=toRad(a.lat),lat2=toRad(b.lat);const x=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)**2*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
    function normalisePostcode(pc){return pc.trim().toUpperCase().replace(/\\s+/g,'').replace(/^UK,?/i,'')}
    function parseLatLon(t){if(!t)return null;const m=t.trim().match(/^\\s*(-?\\d+(?:\\.\\d+)?)\\s*,\\s*(-?\\d+(?:\\.\\d+)?)\\s*$/);if(!m)return null;const lat=+m[1],lon=+m[2];if(isNaN(lat)||isNaN(lon))return null; if(lat<-90||lat>90||lon<-180||lon>180)return null;return {lat,lon}}

    let map, routeLayer, markersLayer, previewLayer; const previewMarkers=new WeakMap();
    function initMap(){map=L.map('map',{zoomControl:true}).setView(WORLD_CENTER,WORLD_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
      routeLayer=L.geoJSON(null,{style:{weight:5,opacity:.88}}).addTo(map);
      markersLayer=L.layerGroup().addTo(map); previewLayer=L.layerGroup().addTo(map);
    }
    function iconNum(t,c=""){return L.divIcon({html:`<div class="l-num ${c}">${t}</div>`,className:'',iconSize:[28,28],iconAnchor:[14,14]})}
    function iconPill(t,cls){return L.divIcon({html:`<div class="${cls}">${t}</div>`,className:'',iconSize:null,iconAnchor:[32,18]})}
    function clearMap(){routeLayer.clearLayers();markersLayer.clearLayers();map.setView(WORLD_CENTER,WORLD_ZOOM)}
    function clearPreview(){previewLayer.clearLayers();previewMarkers.clear?.()}
    function placePreview(el,role,lat,lon,disp){const prev=previewMarkers.get(el);if(prev){previewLayer.removeLayer(prev)};const ic=role==='start'?iconPill('Start','l-start-pill'):role==='final'?iconPill('Finish','l-finish-pill'):iconNum('•','l-preview-stop');const m=L.marker([lat,lon],{icon:ic}).bindPopup(`<strong>${role==='start'?'Start (preview)':role==='final'?'Finish (preview)':'Stop (preview)'}</strong><br>${disp}`);previewLayer.addLayer(m);previewMarkers.set(el,m);map.setView([lat,lon],Math.max(map.getZoom(),12),{animate:true});m.openPopup()}

    async function geocodeOne(raw,mode){
      const coord=parseLatLon(raw);
      if(coord){
        try{
          const u=`${NOMINATIM}/reverse?format=jsonv2&lat=${coord.lat}&lon=${coord.lon}&zoom=18&addressdetails=1`;
          const res=await fetch(u,{headers:LANG_HEADER}); const d=res.ok?await res.json():{};
          return {ok:true,lat:coord.lat,lon:coord.lon,display:d.display_name||`${coord.lat}, ${coord.lon}`,raw:d}
        }catch{
          return {ok:true,lat:coord.lat,lon:coord.lon,display:`${coord.lat.toFixed(6)}, ${coord.lon.toFixed(6)}`,raw:null}
        }
      }

      const q = raw.trim();
      if(!q) return {ok:false,error:"Please enter a value."};

      let url;
      if(mode==='postcode'){
        const pc = normalisePostcode(q);
        if(UK_POSTCODE_REGEX.test(pc)){
          url = `${NOMINATIM}/search?postalcode=${encodeURIComponent(pc)}&country=uk&format=jsonv2&limit=1&addressdetails=1`;
        }else{
          url = `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&addressdetails=1`;
        }
      }else{
        url = `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&addressdetails=1`;
      }

      try{
        const res=await fetch(url,{headers:LANG_HEADER});
        if(!res.ok) throw 0;
        const data=await res.json();
        if(!Array.isArray(data)||data.length===0) return {ok:false,error:"No results found."};
        const hit=data[0];
        return {ok:true,lat:+hit.lat,lon:+hit.lon,display:hit.display_name||q,raw:hit}
      }catch{
        return {ok:false,error:"Network issue while geocoding. Please try again."}
      }
    }

    async function optimiseTrip(points,{finalFixed=false,roundtrip=true}){
      const coords=points.map(p=>`${p.lon},${p.lat}`).join(';');
      const p=new URLSearchParams({overview:'full',geometries:'geojson',source:'first'});
      if(finalFixed){p.set('destination','last');p.set('roundtrip','false')} else{p.set('roundtrip',roundtrip?'true':'false')}
      const url=`${OSRM}/trip/v1/driving/${coords}?${p.toString()}`;
      try{
        const res=await fetch(url); if(!res.ok) throw 0;
        const data=await res.json();
        if(data.code!=="Ok"||!data.trips||!data.trips.length){return {ok:false,error:data.message||"OSRM could not compute a trip. Try adjusting points.",raw:data}}
        return {ok:true,data}
      }catch{
        return {ok:false,error:"Network issue while optimising route. Please try again."}
      }
    }

    function renderRoute(osrm,points,{finalFixed=false}){
      routeLayer.clearLayers(); markersLayer.clearLayers();
      const trip=osrm.trips[0];
      routeLayer.addData({type:'Feature',geometry:trip.geometry,properties:{}});
      const order=osrm.waypoints.map((wp,i)=>({i,ord:wp.waypoint_index})).sort((a,b)=>a.ord-b.ord).map(x=>points[x.i]);
      let n=0;
      order.forEach((p,i)=>{
        const isStart=i===0,isEnd=i===order.length-1;
        if(isStart){
          L.marker([p.lat,p.lon],{icon:iconPill('Start','l-start-pill')}).bindPopup(`<strong>Start</strong><br>${p.display}`).addTo(markersLayer)
        }else if(finalFixed&&isEnd&&p.role==='final'){
          L.marker([p.lat,p.lon],{icon:iconPill('Finish','l-finish-pill')}).bindPopup(`<strong>Finish</strong><br>${p.display}`).addTo(markersLayer)
        }else{
          n+=1; L.marker([p.lat,p.lon],{icon:iconNum(String(n))}).bindPopup(`<strong>Stop ${n}</strong><br>${p.display}`).addTo(markersLayer)
        }
      });
      try{
        const coords=trip.geometry.coordinates.map(([lon,lat])=>[lat,lon]);
        map.fitBounds(L.latLngBounds(coords),{padding:[30,30]})
      }catch{
        if(markersLayer.getLayers().length>0) map.fitBounds(markersLayer.getBounds(),{padding:[30,30]})
      }
      document.getElementById('sum-distance').textContent=`${km(trip.distance)} km`;
      document.getElementById('sum-duration').textContent=hhmm(trip.duration);
      const list=document.getElementById('itinerary'); list.innerHTML="";
      n=0; order.forEach((p,i)=>{
        const li=document.createElement('li');
        let label; if(i===0)label="Start"; else if(finalFixed&&i===order.length-1&&p.role==='final')label="Finish"; else{n+=1;label=`Stop ${n}`}
        li.textContent=`${label}: ${p.display}`; list.appendChild(li)
      });
      document.getElementById('summary').style.display="";
      const clip=`Total distance: ${km(trip.distance)} km\nEstimated duration: ${hhmm(trip.duration)}\n`+Array.from(list.children).map(li=>li.textContent).join("\\n");
      const copyBtn=document.getElementById('btn-copy'); copyBtn.disabled=false; copyBtn.dataset.clipText=clip;
      syncMapHeight(); setTimeout(()=>map.invalidateSize(), 50);
    }

    const modeButtons = { postcode: document.getElementById('mode-postcode'), address: document.getElementById('mode-address') };
    let currentMode = 'postcode';

    function setMode(mode){
      currentMode = mode;
      modeButtons.postcode.setAttribute('aria-pressed', mode==='postcode');
      modeButtons.address.setAttribute('aria-pressed', mode==='address');
      buildAll();
      clearPreview();
      clearMap();
      document.getElementById('summary').style.display = "none";
      document.getElementById('itinerary').innerHTML = "";
      document.getElementById('btn-copy').disabled = true;
      document.getElementById('errors').style.display="none";
      document.getElementById('feedback').style.display="none";
      document.getElementById('dedup').style.display="none";
      syncMapHeight(); setTimeout(()=>map.invalidateSize(), 50);
    }

    function buildStart(){
      const host=document.getElementById('start-group'); host.innerHTML="";
      host.appendChild(currentMode==='postcode'?makePostcodeRow({role:'start',placeholder:'e.g. SW1A 1AA / 90210',myLoc:true})
                                              :makeAddressGroup({role:'start',myLoc:true}));
    }
    function buildFinal(){
      const host=document.getElementById('final-group'); host.innerHTML="";
      host.appendChild(currentMode==='postcode'?makePostcodeRow({role:'final',placeholder:'e.g. SW1A 1AA / 90210'})
                                              :makeAddressGroup({role:'final'}));
    }

    function addStopRow(){
      const host=document.getElementById('stops');
      const row=document.createElement('div');
      row.className='section stop-row-wrap';

      // (2) Stop header with inline cross button
      const header=document.createElement('div'); header.className='stop-header';
      const title=document.createElement('span'); title.className='stop-title'; header.appendChild(title);
      const x=document.createElement('button'); x.type='button'; x.className='icon-btn'; x.title='Remove this stop';
      x.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
      x.addEventListener('click',()=>{const prev=previewMarkers.get(inner); if(prev){previewLayer.removeLayer(prev); previewMarkers.delete(inner)}; row.remove(); renumberStops(); evaluateOptimise(); syncMapHeight(); setTimeout(()=>map.invalidateSize(),50)});
      header.appendChild(x); row.appendChild(header);

      const inner=currentMode==='postcode'?makePostcodeRow({role:'stop',placeholder:'e.g. SW1A 1AA / 90210'}):makeAddressGroup({role:'stop'});
      row.appendChild(inner);

      host.appendChild(row); renumberStops(); evaluateOptimise(); syncMapHeight(); setTimeout(()=>map.invalidateSize(),50);
    }
    function renumberStops(){[...document.querySelectorAll('#stops .stop-row-wrap')].forEach((w,i)=>{const t=w.querySelector('.stop-title'); if(t) t.textContent=`Stop number ${i+1}`})}

    /* Start: postcode mode with inset location button (4) pin icon */
    function makePostcodeRow({role,placeholder,myLoc}){
      const wrap=document.createElement('div'); wrap.className='loc-postcode'; wrap.dataset.role=role;
      const row=document.createElement('div'); row.className='row inset-wrap';
      const input=document.createElement('input'); input.type='text'; input.placeholder=placeholder||'Postal/ZIP code'; input.autocomplete='postal-code'; input.setAttribute('aria-label',`${role} postal or ZIP code`);
      if(role==='start' && myLoc){ input.classList.add('with-inset'); const btn=document.createElement('button'); btn.type='button'; btn.className='inset-btn'; btn.title='Use my location'; btn.setAttribute('aria-label','Use my location');
        btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-4.5-6-10a6 6 0 1 1 12 0c0 5.5-6 10-6 10z"></path><circle cx="12" cy="11" r="2.5"></circle></svg>';
        btn.addEventListener('click',()=>useMyLocation(wrap,'start')); row.appendChild(btn); }
      row.appendChild(input); wrap.appendChild(row);
      const status=document.createElement('div'); status.className='status'; wrap.appendChild(status);
      attachPostcodeHandlers({container:wrap,input,status,role});
      return wrap;
    }

    /* Start: full address mode with corner location button (4) pin icon */
    function makeAddressGroup({role,myLoc}){
      const wrap=document.createElement('div'); wrap.className='loc-address'; wrap.dataset.role=role;
      const gridWrap=document.createElement('div'); gridWrap.className='addr-grid-wrap';
      const grid=document.createElement('div'); grid.className='addr-grid';
      const no=document.createElement('input'); no.type='text'; no.placeholder='House number or name'; no.autocomplete='address-line1'; no.setAttribute('aria-label',`${role} house number or name`);
      const street=document.createElement('input'); street.type='text'; street.placeholder='Street address'; street.autocomplete='street-address'; street.setAttribute('aria-label',`${role} street address`);
      const town=document.createElement('input'); town.type='text'; town.placeholder='Town or city'; town.autocomplete='address-level2'; town.setAttribute('aria-label',`${role} town or city`);
      const pc=document.createElement('input'); pc.type='text'; pc.placeholder='Postcode / ZIP'; pc.autocomplete='postal-code'; pc.setAttribute('aria-label',`${role} postcode or ZIP`);
      grid.append(no,street,town,pc);
      gridWrap.appendChild(grid);
      if(role==='start' && myLoc){
        const btn=document.createElement('button'); btn.type='button'; btn.className='inset-btn'; btn.title='Use my location'; btn.setAttribute('aria-label','Use my location');
        btn.style.top='6px'; btn.style.transform='none'; btn.style.right='6px';
        btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-4.5-6-10a6 6 0 1 1 12 0c0 5.5-6 10-6 10z"></path><circle cx="12" cy="11" r="2.5"></circle></svg>';
        btn.addEventListener('click',()=>useMyLocation(wrap,'start'));
        gridWrap.appendChild(btn);
      }
      wrap.appendChild(gridWrap);
      const status=document.createElement('div'); status.className='status'; wrap.appendChild(status);
      attachAddressHandlers({container:wrap,fields:{no,street,town,pc},status,role});
      return wrap;
    }

    function attachPostcodeHandlers({container,input,status,role}){
      input.addEventListener('keydown',async(e)=>{
        if(e.key!=='Enter')return;
        e.preventDefault(); status.textContent="";
        const v=input.value.trim();
        if(!v){ input.classList.add('invalid'); status.className='status err'; status.textContent='Enter a postal or ZIP code.'; return }
        input.classList.remove('invalid'); status.innerHTML='<span class="spinner" aria-hidden="true"></span> Geocoding…';
        const r=await geocodeOne(v,'postcode');
        if(r.ok){ status.className='status ok'; status.textContent='Found and pinned.'; container.dataset.lat=r.lat; container.dataset.lon=r.lon; container.dataset.display=r.display; placePreview(container,role,r.lat,r.lon,r.display)}
        else{ status.className='status err'; status.textContent=r.error||'No results found.'; delete container.dataset.lat; delete container.dataset.lon; delete container.dataset.display}
        evaluateOptimise(); syncMapHeight(); setTimeout(()=>map.invalidateSize(),50);
      });
      input.addEventListener('input', evaluateOptimise);
    }

    function composeAddressText({no,street,town,pc}){
      const a=[]; if(no.value.trim())a.push(no.value.trim()); if(street.value.trim())a.push(street.value.trim());
      const b=[]; if(town.value.trim())b.push(town.value.trim()); if(pc.value.trim())b.push(pc.value.trim());
      return [a.join(' '), b.join(', ')].filter(Boolean).join(', ');
    }
    function attachAddressHandlers({container,fields,status,role}){
      const onEnter=async(e)=>{
        if(e.key!=='Enter')return;
        e.preventDefault(); status.textContent="";
        const query=composeAddressText(fields);
        if(!query){ status.className='status err'; status.textContent='Please fill the address fields (street/town) and press Enter.'; return }
        status.innerHTML='<span class="spinner" aria-hidden="true"></span> Geocoding…';
        const r=await geocodeOne(query,'address');
        if(r.ok){ status.className='status ok'; status.textContent='Found and pinned.'; container.dataset.lat=r.lat; container.dataset.lon=r.lon; container.dataset.display=r.display; placePreview(container,role,r.lat,r.lon,r.display) }
        else{ status.className='status err'; status.textContent=r.error||'No results found.'; delete container.dataset.lat; delete container.dataset.lon; delete container.dataset.display }
        evaluateOptimise(); syncMapHeight(); setTimeout(()=>map.invalidateSize(),50);
      };
      Object.values(fields).forEach(inp=>{inp.addEventListener('keydown',onEnter); inp.addEventListener('input',evaluateOptimise)});
    }

    function useMyLocation(container,role){
      const status=container.querySelector('.status');
      if(!navigator.geolocation){ status.className='status err'; status.textContent='Geolocation not supported.'; return }
      status.innerHTML='<span class="spinner"></span> Locating…';
      navigator.geolocation.getCurrentPosition(async pos=>{
        const {latitude:lat,longitude:lon}=pos.coords;
        try{
          const u=`${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
          const res=await fetch(u,{headers:LANG_HEADER}); const d=res.ok?await res.json():{};
          const lbl=d.display_name||`${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          container.dataset.lat=lat; container.dataset.lon=lon; container.dataset.display=lbl;
          status.className='status ok'; status.textContent='Found and pinned.'; placePreview(container,role,lat,lon,lbl); evaluateOptimise();
        }catch{
          container.dataset.lat=lat; container.dataset.lon=lon; container.dataset.display=`${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          status.className='status ok'; status.textContent='Found and pinned.'; placePreview(container,role,lat,lon,container.dataset.display); evaluateOptimise();
        }
        syncMapHeight(); setTimeout(()=>map.invalidateSize(),50);
      },()=>{ status.className='status err'; status.textContent='Permission denied or unavailable.' },{enableHighAccuracy:true,timeout:10000});
    }

    function getStartEl(){return document.querySelector('#start-group > .loc-postcode, #start-group > .loc-address')}
    function getFinalEl(){return document.querySelector('#final-group > .loc-postcode, #final-group > .loc-address')}
    function isContainerFilled(c){if(!c)return false; if(c.classList.contains('loc-postcode')){const i=c.querySelector('input[type="text"]');return i&&i.value.trim().length>0}else{const f=c.querySelectorAll('input[type="text"]');return [...f].some(i=>i.value.trim().length>0)}}
    function evaluateOptimise(){const start=getStartEl(),final=getFinalEl(),stops=[...document.querySelectorAll('#stops .loc-postcode, #stops .loc-address')];const startFilled=isContainerFilled(start);const stopsFilled=stops.filter(isContainerFilled).length;const finalFilled=isContainerFilled(final);const count=(startFilled?1:0)+stopsFilled+(finalFilled?1:0);document.getElementById('btn-optimise').disabled=!(startFilled&&count>=2)}

    function dedupe(points){const u=[],rem=[];for(const p of points){const f=u.find(x=>distanceMetres(x,p)<DEDUP_METRES);if(f)rem.push({duplicate:p,kept:f});else u.push(p)}return {u,rem}}
    function show(el,msg){el.textContent=msg;el.style.display=""} function hide(el){el.style.display="none"}

    async function geocodeContainer(container){
      if(container.dataset.lat&&container.dataset.lon&&container.dataset.display){
        return {lat:+container.dataset.lat,lon:+container.dataset.lon,display:container.dataset.display}
      }
      const role=container.dataset.role||'stop',status=container.querySelector('.status');
      status.innerHTML='<span class="spinner"></span> Geocoding…';
      let r;
      if(container.classList.contains('loc-postcode')){
        const v=container.querySelector('input[type="text"]').value.trim();
        if(!v){status.className='status err';status.textContent='Enter a postal or ZIP code.';return null}
        r=await geocodeOne(v,'postcode')
      }else{
        const [no,street,town,pc]=container.querySelectorAll('input[type="text"]');
        const q=(()=>{const a=[];if(no.value.trim())a.push(no.value.trim());if(street.value.trim())a.push(street.value.trim());const b=[];if(town.value.trim())b.push(town.value.trim());if(pc.value.trim())b.push(pc.value.trim());return [a.join(' '),b.join(', ')].filter(Boolean).join(', ')})();
        if(!q){status.className='status err';status.textContent='Please complete the address (street/town).';return null}
        r=await geocodeOne(q,'address')
      }
      if(r.ok){status.className='status ok';status.textContent='Found and pinned.';container.dataset.lat=r.lat;container.dataset.lon=r.lon;container.dataset.display=r.display;placePreview(container,role,r.lat,r.lon,r.display);return {lat:r.lat,lon:r.lon,display:r.display}}
      else{status.className='status err';status.textContent=r.error||'No results found.';return null}
    }

    async function doOptimise(){
      hide(document.getElementById('errors')); hide(document.getElementById('feedback')); hide(document.getElementById('dedup'));
      const btn=document.getElementById('btn-optimise'); btn.disabled=true; const old=btn.textContent; btn.textContent="Planning…";
      const startC=getStartEl(), finalC=getFinalEl(), stopCs=[...document.querySelectorAll('#stops .loc-postcode, #stops .loc-address')];
      const points=[];
      const s=await geocodeContainer(startC); if(!s){show(document.getElementById('errors'),"Please provide a valid starting point, then press Enter to pin it."); btn.disabled=false; btn.textContent=old; return}
      points.push({lat:s.lat,lon:s.lon,display:s.display,role:'start'}); await sleep(RATE_DELAY_MS);
      for(const c of stopCs){if(!isContainerFilled(c))continue; const r=await geocodeContainer(c); if(r){points.push({lat:r.lat,lon:r.lon,display:r.display,role:'stop'})} await sleep(RATE_DELAY_MS)}
      let finalProvided=false, finalPoint=null;
      if(isContainerFilled(finalC)){const f=await geocodeContainer(finalC); if(!f){show(document.getElementById('errors'),"Please fix the final stop (invalid or not found)."); btn.disabled=false; btn.textContent=old; return} finalProvided=true; finalPoint={lat:f.lat,lon:f.lon,display:f.display,role:'final'}}
      const inOrder=finalProvided?[...points,finalPoint]:points;
      const {u,rem}=dedupe(inOrder); if(rem.length){show(document.getElementById('dedup'),`Duplicate locations detected (within ~${DEDUP_METRES} m). Some entries were ignored.`)}
      if(u.length<2){show(document.getElementById('errors'),"Not enough valid points. Enter at least a start and one more stop/final."); btn.disabled=false; btn.textContent=old; return}
      const finalFixed=finalProvided; const roundtrip=!finalProvided?document.getElementById('roundtrip').checked:false;
      show(document.getElementById('feedback'),"Computing the best order with OSRM…");
      const osrm=await optimiseTrip(u,{finalFixed,roundtrip});
      if(!osrm.ok){show(document.getElementById('errors'),osrm.error+" (Try toggling round trip or removing very distant points.)"); btn.disabled=false; btn.textContent=old; return}
      clearPreview(); renderRoute(osrm.data,u,{finalFixed}); hide(document.getElementById('feedback')); btn.disabled=false; btn.textContent=old;
    }

    function clearAll(){buildAll(); clearMap(); clearPreview(); hide(document.getElementById('summary')); document.getElementById('itinerary').innerHTML=""; document.getElementById('btn-copy').disabled=true; hide(document.getElementById('errors')); hide(document.getElementById('feedback')); hide(document.getElementById('dedup')); document.getElementById('roundtrip').checked=true; document.getElementById('roundtrip-wrap').style.display=""; syncMapHeight(); setTimeout(()=>map.invalidateSize(),50)}

    function buildAll(){buildStart(); buildFinal(); document.getElementById('stops').innerHTML=""; evaluateOptimise(); syncMapHeight(); setTimeout(()=>map.invalidateSize(),50)}

    function setupUI(){
      initMap(); buildAll();
      modeButtons.postcode.addEventListener('click',()=>setMode('postcode'));
      modeButtons.address.addEventListener('click',()=>setMode('address'));
      document.getElementById('btn-add-stop').addEventListener('click',addStopRow);
      document.getElementById('btn-optimise').addEventListener('click',doOptimise);
      document.getElementById('btn-clear').addEventListener('click',clearAll);
      document.getElementById('btn-copy').addEventListener('click',async()=>{const t=document.getElementById('btn-copy').dataset.clipText||'';try{await navigator.clipboard.writeText(t);const b=document.getElementById('btn-copy');const old=b.textContent; b.textContent="Copied!"; setTimeout(()=>b.textContent=old,1200)}catch{show(document.getElementById('errors'),"Could not copy to clipboard. Please copy manually.")}});
      const obs=new MutationObserver(()=>{const any=isContainerFilled(getFinalEl());document.getElementById('roundtrip-wrap').style.display=any?"none":""}); obs.observe(document.getElementById('final-group'),{childList:true,subtree:true});
      window.addEventListener('resize',()=>{syncMapHeight(); setTimeout(()=>map.invalidateSize(),50)});
    }

    function syncMapHeight(){
      const panel = document.getElementById('left-panel');
      const mapEl = document.getElementById('map');
      const isNarrow = window.matchMedia('(max-width: 960px)').matches;
      if(isNarrow){
        mapEl.style.height = '420px';
      }else{
        const h = Math.max(420, panel.offsetHeight);
        mapEl.style.height = h + 'px';
      }
    }

    setupUI();
    document.getElementById('year').textContent=new Date().getFullYear();
