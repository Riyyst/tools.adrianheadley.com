}



const MAILSLURP_KEY   = "bc5dd01a4faf0a1c291e844fedda4d881ab433fbeef0094a94773c20b205d411";
const MAILSLURP_BASES = ["https://api.mailslurp.com", "https://eu.api.mailslurp.com"];
const LIMITS = { inbound: 200, outbound: 200 };

const $ = (id) => document.getElementById(id);
const sleep = (ms)=> new Promise(r=>setTimeout(r, ms));
const rand = (n=12)=> Array.from(crypto.getRandomValues(new Uint8Array(n))).map(x=>('0'+(x%36).toString(36)).slice(-1)).join('');
const escapeHtml = (s) => (s ?? '').toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

/* simple sanitiser for incoming HTML */
function sanitizeIncomingHTML(html){
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '', 'text/html');
  doc.querySelectorAll('script,iframe,object,embed,form,link,style').forEach(el=>el.remove());
  return doc.body.innerHTML || '';
}

/* sanitiser for outgoing HTML */
function sanitizeOutgoingHTML(html){
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '', 'text/html');
  doc.querySelectorAll('script,iframe,link,object,embed,form,video,audio,source,style').forEach(el=>el.remove());
  doc.querySelectorAll('img').forEach(img=>{
    const src = (img.getAttribute('src')||'').trim();
    const w = parseInt(img.getAttribute('width')||img.width||0,10);
    const h = parseInt(img.getAttribute('height')||img.height||0,10);
    if(/^https?:\/\//i.test(src) || src.startsWith('//') || ((w && w<=1) && (h && h<=1))) img.remove();
  });
  doc.querySelectorAll('a[href]').forEach(a=>{
    let href = a.getAttribute('href') || '#';
    try{
      const u=new URL(href,location.href);
      ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'].forEach(k=>u.searchParams.delete(k));
      href=u.toString();
    }catch{}
    a.setAttribute('href', href);
    a.setAttribute('rel','noopener noreferrer nofollow');
    a.setAttribute('target','_blank');
  });
  const it = doc.createNodeIterator(doc, NodeFilter.SHOW_COMMENT); let n; const rm=[];
  while(n=it.nextNode()) rm.push(n); rm.forEach(n=>n.remove());
  return doc.body.innerHTML;
}

/* Strip EXIF / metadata from attachments */
function stripImageMetadata(file){
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith('image/')) return resolve(file);
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        try{
          const canvas=document.createElement('canvas');
          canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
          const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0);
          const isPNG=/png$/i.test(file.type), isWEBP=/webp$/i.test(file.type);
          const mime=isPNG?'image/png':(isWEBP?'image/webp':'image/jpeg');
          canvas.toBlob(b=>{
            if(!b) return reject(new Error('Encoding failed'));
            const ext=mime.split('/')[1];
            resolve(new File([b], `img_${rand(6)}.${ext}`, {type:mime}));
          }, mime, mime==='image/jpeg'?0.92:undefined);
        }catch(e){reject(e);}
      };
      img.onerror=()=>reject(new Error('Could not load image'));
      img.src=reader.result;
    };
    reader.onerror=()=>reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}
async function sanitizeAttachments(files){ const out=[]; for(const f of files){ out.push(await stripImageMetadata(f)); } return out; }

/* Monthly usage tracking for MailSlurp */
const MSL_USAGE_KEY='tm_msl_usage_v2';
let mslUsage = loadMSLUsage();
let mslSeen  = new Set(mslUsage.seenReceivedIds||[]);
function parsePeriodFromDateHeader(dh){
  try{
    const d=new Date(dh);
    if(!isNaN(d)) return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
  }catch{}
  return null;
}
function loadMSLUsage(){
  try{ return JSON.parse(localStorage.getItem(MSL_USAGE_KEY)||'null')||{period:null,inboundUsed:0,outboundUsed:0,seenReceivedIds:[]}; }
  catch{ return {period:null,inboundUsed:0,outboundUsed:0,seenReceivedIds:[]}; }
}
function saveMSLUsage(){ localStorage.setItem(MSL_USAGE_KEY, JSON.stringify(mslUsage)); }
function resetMSLUsage(p){ mslUsage={period:p,inboundUsed:0,outboundUsed:0,seenReceivedIds:[]}; mslSeen=new Set(); saveMSLUsage(); }
function ensureMSLPeriodFromRes(res){
  const dh=res.headers?.get?.('date'); if(!dh) return;
  const p=parsePeriodFromDateHeader(dh);
  if(p && mslUsage.period!==p){ resetMSLUsage(p); updateCountersUI(); }
}
const mslInboundLeft=()=> Math.max(0,200-(mslUsage.inboundUsed||0));
const mslOutboundLeft=()=> Math.max(0,200-(mslUsage.outboundUsed||0));
function registerMSLInbound(id){
  if(mslInboundLeft()<=0||mslSeen.has(id)) return false;
  mslSeen.add(id); mslUsage.seenReceivedIds=[...mslSeen];
  mslUsage.inboundUsed=(mslUsage.inboundUsed||0)+1;
  saveMSLUsage(); updateCountersUI(); return true;
}
function registerMSLOutbound(){
  if(mslOutboundLeft()<=0) return false;
  mslUsage.outboundUsed=(mslUsage.outboundUsed||0)+1;
  saveMSLUsage(); updateCountersUI(); return true;
}

/* App state */
const state={
  provider:'mailtm',
  pollTimer:null,
  pollMs:3000,
  selectedId:null,
  generated:false,
  editorTheme:'dark',
  previewTheme:'dark',
  lastPreview:null,
  mailtm:{token:null,address:null,messages:[]},
  mailslurp:{base:null,inboxId:null,email:null,messages:[]}
};

const setAddr=(t)=>{$('addr').textContent=t||'—';};
const setInboxControls=(on)=>{$('refreshBtn').disabled=!on;};
const setSendUIVisible=(show)=>{
  $('composerRow').classList.toggle('hide', !show);
  setSendingEnabled(show && mslOutboundLeft()>0);
};
const setSendingEnabled=(on)=>{
  ['to','cc','bcc','subject','sendBtn'].forEach(id=>{ const el=$(id); if(el) el.disabled=!on; });
  $('editor').contentEditable=on?'true':'false';
};
const setBusy=(btn,busy,label='Working…')=>{
  btn.dataset.originalText ||= btn.textContent;
  btn.textContent=busy?label:btn.dataset.originalText;
  btn.disabled=!!busy;
};

/* Built-in “Getting Started” email */
function buildIntroEmail(toAddr){
  return {
    id:'intro-'+Date.now(),
    __intro:true,
    type:'received',
    provider:'local',
    subject:'Getting Started',
    from:'Riyst.com',
    to:toAddr||'',
    date:new Date().toISOString(),
    html:`
      <p style="margin:0 0 10px;font-family:system-ui,Segoe UI,Roboto,Arial;line-height:1.5;">
        Welcome to your temporary email inbox. This message explains how the service works and how to use it safely.
      </p>
      <ol style="margin:0 0 10px 18px;font-family:system-ui,Segoe UI,Roboto,Arial;line-height:1.6;padding-left:18px;">
        <li><strong>Your address.</strong> The email address shown on the left belongs to this temporary inbox only. You can use it wherever you need to receive a message without sharing your main email account.</li>
        <li><strong>Receiving messages.</strong> When someone sends an email to this address, it will appear in the list on the left. Each row shows who the message is from, the subject line and the time it was received.</li>
        <li><strong>Reading messages.</strong> Click a message in the list to open it in the preview panel on the right. Click the same message again to close it. No message is opened automatically.</li>
        <li><strong>Refreshing the inbox.</strong> The inbox is checked regularly, but if you are waiting for a message you can press “Refresh inbox” to force a manual check.</li>
        <li><strong>Receive only vs Send &amp; Receive.</strong> In <em>Receive only</em> mode you can read messages that are sent to you. If you switch to <em>Send &amp; Receive</em> and generate an address, you will also see a “Send” section that lets you compose and send emails from that temporary inbox.</li>
        <li><strong>Attachments and links.</strong> Attachments are shown as part of the message where possible. For your security, always treat unknown links and files with caution, even in a temporary mailbox.</li>
        <li><strong>Temporary use.</strong> This inbox is intended for short-term, disposable email. It should not be used for important accounts, password recovery or anything that needs to be stored permanently.</li>
      </ol>
      <p style="margin:0;font-family:system-ui,Segoe UI,Roboto,Arial;line-height:1.5;">
        You can now start using this address. Send yourself a test message from another account and it will appear here once delivered.
      </p>
    `,
    text:'Welcome to your temporary email inbox. Use the address on the left wherever you need a disposable email. Incoming messages appear in the list on the left; click a row to preview the message and click it again to close it. Use “Refresh inbox” to manually check for new mail. Receive only mode is for reading messages; Send & Receive mode also enables a Send section so you can compose mail from this temporary address. This inbox is for short-term use only and should not be relied on for important or permanent emails.'
  };
}
function ensureIntroEmail(){
  const toAddr = state.provider==='mailtm' ? (state.mailtm.address||'') : (state.mailslurp.email||'');
  const list   = state.provider==='mailtm' ? state.mailtm.messages : state.mailslurp.messages;
  if(!toAddr) return;
  if(!list.some(m=>m.__intro)){
    list.unshift(buildIntroEmail(toAddr));
  }
  renderList(list);
}

/* Themes */
function applyEditorTheme(){
  const light=state.editorTheme==='light';
  $('editor').classList.toggle('light', light);
  $('iconSun1').classList.toggle('hide', !light);
  $('iconMoon1').classList.toggle('hide', light);
}
function blankPreviewShell(){
  const pv=$('preview');
  pv.innerHTML='';
  pv.classList.toggle('light-preview', state.previewTheme==='light');
}
function applyPreviewTheme(){
  const light=state.previewTheme==='light';
  $('iconSun2').classList.toggle('hide', !light);
  $('iconMoon2').classList.toggle('hide', light);
  blankPreviewShell();
  if(state.lastPreview){ renderPreview(state.lastPreview); }
}
$('editorThemeBtn').addEventListener('click', ()=>{
  state.editorTheme = state.editorTheme==='dark' ? 'light':'dark';
  applyEditorTheme();
});
$('previewThemeBtn').addEventListener('click', ()=>{
  state.previewTheme = state.previewTheme==='dark' ? 'light':'dark';
  applyPreviewTheme();
});

function setPreviewPlaceholder(text, show=true){
  const el=$('previewPlaceholder');
  el.textContent=text;
  el.classList.toggle('hide', !show);
}
function clearPreview(){
  state.lastPreview=null;
  blankPreviewShell();
  setPreviewPlaceholder('No message has been selected to view', true);
}

/* Counters */
function updateCountersUI(){
  if(!state.generated){
    $('inLeft').textContent='–';
    $('outLeft').textContent='–';
    return;
  }
  if(state.provider==='mailtm'){
    $('inLeft').textContent='∞';
    $('outLeft').textContent='0';
    return;
  }
  $('inLeft').textContent=`${mslInboundLeft()} left`;
  $('outLeft').textContent=`${mslOutboundLeft()} left`;
  if(mslOutboundLeft()<=0){
    $('sendBtn').disabled=true;
    $('sendNote').textContent='Outbound limit reached for this month.';
  }else{
    $('sendNote').textContent='Sending enabled (MailSlurp).';
  }
}

/* Inbox list */
function renderList(items){
  const list=$('list');
  list.innerHTML='';
  if(!items||!items.length){
    list.innerHTML='<div class="empty">No messages yet.</div>';
    state.selectedId=null;
    clearPreview();
    return;
  }
  if(!state.selectedId) setPreviewPlaceholder('No message has been selected to view', true);
  [...items].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).forEach(m=>{
    const isIntro = m.__intro || m.provider==='local';
    const badge = isIntro
      ? 'Received - Riyst.com'
      : `${m.type==='sent'?'Sent':'Received'} - ${m.to||''}`;
    const el=document.createElement('div');
    el.className='item';
    el.innerHTML=`
      <div class="from">${escapeHtml(badge)}</div>
      <div class="subject">${escapeHtml(m.subject||'(no subject)')}</div>
      <div class="date">${new Date(m.date||Date.now()).toLocaleString()}</div>`;
    el.addEventListener('click',()=>{
      if(state.selectedId === m.id){
        state.selectedId=null;
        clearPreview();
      }else{
        showMessage(m);
      }
    });
    list.appendChild(el);
  });
}

/* Mode reset when switching providers */
function resetForModeChange(){
  if(state.pollTimer){ clearInterval(state.pollTimer); state.pollTimer=null; }
  state.generated=false;
  state.selectedId=null;
  state.lastPreview=null;
  state.mailtm={token:null,address:null,messages:[]};
  state.mailslurp={base:null,inboxId:null,email:null,messages:[]};
  setAddr('—');
  setInboxControls(false);
  renderList([]);
  blankPreviewShell();
  setPreviewPlaceholder('There are no messages in your inbox yet', true);
  $('dashboard').classList.add('hide');
  setSendUIVisible(false);
}

/* Provider toggle */
function updateAliasVisibility(){
  const show = state.provider==='mailslurp';
  $('aliasLabel').classList.toggle('hide', !show);
  $('aliasBox').classList.toggle('hide', !show);
  $('alias').value='';
}
function onProviderChange(){
  resetForModeChange();
  state.provider=$('mode-send').checked?'mailslurp':'mailtm';
  updateAliasVisibility();
  updateCountersUI();
}
$('mode-recv').addEventListener('change', onProviderChange);
$('mode-send').addEventListener('change', onProviderChange);

/* Mail.tm client */
const MAILTM={
  base:'https://api.mail.tm',
  async chooseDomain(){
    const r=await fetch(`${this.base}/domains`);
    const d=await r.json();
    const arr=d['hydra:member']||[];
    if(!arr.length) throw new Error('No domains from mail.tm');
    return arr[Math.floor(Math.random()*arr.length)].domain;
  },
  async createAccount(){
    const domain=await this.chooseDomain();
    const u=`u${rand(9)}`;
    const address=`${u}@${domain}`;
    const password=rand(16);
    const reg=await fetch(`${this.base}/accounts`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({address,password})
    });
    if(!reg.ok && reg.status!==201) throw new Error(`Account creation failed (${reg.status})`);
    const tok=await fetch(`${this.base}/token`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({address,password})
    });
    const j=await tok.json();
    if(!tok.ok||!j.token) throw new Error('Could not obtain token');
    state.mailtm.token=j.token;
    state.mailtm.address=address;
    return address;
  },
  async listMessages(){
    if(!state.mailtm.token) return [];
    const r=await fetch(`${this.base}/messages`,{
      headers:{'Authorization':`Bearer ${state.mailtm.token}`,'Accept':'application/ld+json'}
    });
    if(!r.ok) throw new Error(`List failed: ${r.status}`);
    const d=await r.json();
    const arr=d['hydra:member']||[];
    return arr.map(m=>({
      id:m.id,
      type:'received',
      provider:'mailtm',
      subject:m.subject,
      from:m.from?.address||m.from?.name||'Unknown',
      to:state.mailtm.address||'',
      date:m.createdAt
    }));
  },
  async getMessage(id){
    const r=await fetch(`${this.base}/messages/${id}`,{
      headers:{'Authorization':`Bearer ${state.mailtm.token}`}
    });
    if(!r.ok) throw new Error(`Get failed: ${r.status}`);
    const m=await r.json();
    return {
      id:m.id,
      type:'received',
      provider:'mailtm',
      subject:m.subject,
      from:m.from?.address||'Unknown',
      to:state.mailtm.address||'',
      date:m.createdAt,
      html:(Array.isArray(m.html)?m.html.join('\n'):null),
      text:m.text||''
    };
  }
};

/* MailSlurp client */
const MSL={
  async mslFetch(path, options = {}) {
    const fetchWithTimeout = (url, opts, ms = 15000) => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), ms);
      return fetch(url, {
        ...opts,
        signal: ctl.signal,
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store'
      }).finally(() => clearTimeout(t));
    };
    let lastErr;
    for (const base of MAILSLURP_BASES) {
      try {
        const res = await fetchWithTimeout(base + path, {
          ...options,
          headers: {
            'x-api-key': MAILSLURP_KEY,
            'Accept': 'application/json',
            ...(options.headers || {})
          }
        }, 15000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        ensureMSLPeriodFromRes(res);
        state.mailslurp.base = base;
        return res;
      } catch (err) { lastErr = err; }
    }
    throw new Error("Failed to fetch. Open via http://localhost and ensure no blockers are stopping api.mailslurp.com.");
  },

  async createInbox(){
    const alias=($('alias').value||'').trim();
    const res=await this.mslFetch('/createInbox',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(alias?{name:alias}:{})
    });
    const j=await res.json();
    state.mailslurp.inboxId=j.id;
    state.mailslurp.email=j.emailAddress||j.address||j.email;
    return {id:j.id,emailAddress:state.mailslurp.email};
  },
  async ensureInbox(){
    if(!state.mailslurp.inboxId) await this.createInbox();
  },
  async uploadAttachments(files){
    if(!files||!files.length) return [];
    try{
      const items=[];
      for(const f of files){
        const buf=await f.arrayBuffer();
        let bin=''; const b=new Uint8Array(buf);
        for(let i=0;i<b.length;i++) bin+=String.fromCharCode(b[i]);
        items.push({
          contentType:f.type||'application/octet-stream',
          filename:f.name,
          base64Contents:btoa(bin)
        });
      }
      const r=await this.mslFetch('/attachments',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(items)
      });
      const j=await r.json();
      if(Array.isArray(j)) return j;
    }catch(e){}
    const fd=new FormData();
    for(const f of files) fd.append('files',f,f.name);
    const r=await this.mslFetch('/attachments/multipart',{method:'POST',body:fd});
    const j=await r.json();
    if(Array.isArray(j)) return j;
    throw new Error('Attachment upload failed.');
  },
  async send({to,cc,bcc,subject,htmlBody,files}){
    if(mslOutboundLeft()<=0) throw new Error('Outbound monthly limit reached.');
    await this.ensureInbox();
    let attachmentIds=[];
    if(files&&files.length) attachmentIds=await this.uploadAttachments(files);
    const payload={to:[to],subject:subject||'',body:htmlBody||'',isHTML:true};
    if(cc && cc.length) payload.cc = cc;
    if(bcc && bcc.length) payload.bcc = bcc;
    if(attachmentIds.length) payload.attachmentIds=attachmentIds;
    await this.mslFetch(`/inboxes/${state.mailslurp.inboxId}/emails`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(!registerMSLOutbound()) throw new Error('Outbound monthly limit reached (post-send).');
    const toField = [to].concat(cc||[]).concat(bcc||[]).join(', ');
    const sent={
      id:'sent-'+Date.now()+'-'+Math.random().toString(36).slice(2),
      type:'sent',
      provider:'mailslurp',
      subject:subject||'(no subject)',
      from:state.mailslurp.email||'',
      to:toField,
      date:new Date().toISOString(),
      html:htmlBody||'',
      text:htmlBody||''
    };
    state.mailslurp.messages.unshift(sent);
    renderList(state.mailslurp.messages);
    if(mslOutboundLeft()<=0){
      $('sendBtn').disabled=true;
      $('sendNote').textContent='Outbound limit reached for this month.';
    }
  },
  async pollLatest(timeoutMs=1100){
    if(mslInboundLeft()<=0) return [];
    await this.ensureInbox();
    try{
      const r=await this.mslFetch(`/waitForLatestEmail?inboxId=${encodeURIComponent(state.mailslurp.inboxId)}&timeout=${timeoutMs}&unreadOnly=true`);
      const e=await r.json();
      if(e && e.id){
        const ok=registerMSLInbound(e.id);
        if(!ok) return [];
        const obj={
          id:e.id,
          type:'received',
          provider:'mailslurp',
          subject:e.subject,
          from:e.from||(e.sender&&e.sender.emailAddress)||'Unknown',
          to:state.mailslurp.email||'',
          date:e.createdAt,
          __full:e
        };
        if(!state.mailslurp.messages.some(m=>m.id===obj.id)) state.mailslurp.messages.unshift(obj);
        return [obj];
      }
    }catch(_){}
    return [];
  },
  async getEmail(id){
    if(String(id).startsWith('sent-')){
      return state.mailslurp.messages.find(x=>x.id===id)||{
        id,
        type:'sent',
        subject:'(no subject)',
        from:state.mailslurp.email||'',
        to:'',
        date:new Date().toISOString(),
        html:'',
        text:''
      };
    }
    const r=await this.mslFetch(`/emails/${id}`);
    const e=await r.json();
    return {
      id:e.id,
      type:'received',
      provider:'mailslurp',
      subject:e.subject,
      from:e.from,
      to:state.mailslurp.email||'',
      date:e.createdAt,
      html:e.body||'',
      text:e.body||''
    };
  }
};

/* Generate mailbox */
$('genBtn').addEventListener('click', async ()=>{
  if(state.pollTimer){ clearInterval(state.pollTimer); state.pollTimer=null; }
  state.selectedId=null;
  state.generated=true;
  state.lastPreview=null;
  blankPreviewShell();
  setPreviewPlaceholder('There are no messages in your inbox yet', true);
  setInboxControls(false);
  setAddr('—');
  $('alias').value='';
  state.mailtm.messages=[];
  state.mailslurp.messages=[];
  renderList([]);

  // show dashboard once generated
  $('dashboard').classList.remove('hide');

  if(state.provider==='mailtm'){
    setSendUIVisible(false);
    setBusy($('genBtn'), true);
    try{
      const email=await MAILTM.createAccount();
      setAddr(email);
      setInboxControls(true);
      await refreshInbox();
      ensureIntroEmail();
      state.pollTimer=setInterval(refreshInbox,state.pollMs);
    }catch(e){
      alert('Mail.tm error: '+e.message);
    }finally{
      setBusy($('genBtn'), false);
    }
  }else{
    setSendUIVisible(true);
    setBusy($('genBtn'), true);
    try{
      const { emailAddress } = await MSL.createInbox();
      setAddr(emailAddress);
      setInboxControls(true);
      setSendingEnabled(mslOutboundLeft()>0);
      await refreshInbox();
      ensureIntroEmail();
      state.pollTimer=setInterval(refreshInbox,state.pollMs);
    }catch(e){
      alert('MailSlurp error: '+e.message);
    }finally{
      setBusy($('genBtn'), false);
    }
  }
  updateCountersUI();
});

/* Inbox refresh hook */
$('refreshBtn').addEventListener('click', refreshInbox);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) refreshInbox(); });
window.addEventListener('focus', ()=> refreshInbox());

/* Rich text editor controls */
function exec(cmd,val=null){ document.execCommand(cmd,false,val); $('editor').focus(); }
const sizeMap={12:2,14:3,16:3,18:4,24:5,32:6};
$('fontFamily').addEventListener('change', e=>exec('fontName',e.target.value));
$('fontSize').addEventListener('change', e=>exec('fontSize',sizeMap[e.target.value]||3));
$('btnBold').addEventListener('click', ()=>exec('bold'));
$('btnItalic').addEventListener('click', ()=>exec('italic'));
$('btnUnderline').addEventListener('click', ()=>exec('underline'));
$('btnStrike').addEventListener('click', ()=>exec('strikeThrough'));
$('fontColor').addEventListener('input', e=>exec('foreColor',e.target.value));
$('btnLink').addEventListener('click', ()=>{
  const url=prompt('Hyperlink URL (include https://):');
  if(!url) return;
  const sel=window.getSelection();
  const hasSel=sel && !sel.isCollapsed;
  if(hasSel) exec('createLink',url);
  else{
    const text=prompt('Text to display:','click here')||'link';
    document.execCommand('insertHTML',false,`<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`);
  }
});

const attachments=[];
function refreshChips(){
  const wrap=$('chips');
  wrap.innerHTML='';
  attachments.forEach((f,i)=>{
    const c=document.createElement('span');
    c.className='chip';
    c.innerHTML=`${escapeHtml(f.name)} <button title="Remove">✕</button>`;
    c.querySelector('button').addEventListener('click',()=>{
      attachments.splice(i,1);
      refreshChips();
    });
    wrap.appendChild(c);
  });
}
$('btnAttach').addEventListener('click',()=>$('attachInput').click());
$('attachInput').addEventListener('change',(e)=>{
  const files=Array.from(e.target.files||[]);
  attachments.push(...files);
  e.target.value='';
  refreshChips();
});

/* Send email */
$('sendBtn').addEventListener('click', async ()=>{
  if(state.provider!=='mailslurp') return;
  if(mslOutboundLeft()<=0) return alert('Outbound monthly limit reached.');
  const to=$('to').value.trim();
  if(!to) return alert('Enter a recipient');
  const ccRaw=$('cc').value.trim();
  const bccRaw=$('bcc').value.trim();
  const cc = ccRaw ? ccRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const bcc = bccRaw ? bccRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const subject=$('subject').value;
  const safeHtml=sanitizeOutgoingHTML($('editor').innerHTML);
  setBusy($('sendBtn'),true,'Sending…');
  try{
    const safeFiles=await sanitizeAttachments(attachments);
    await MSL.send({to,cc,bcc,subject,htmlBody:safeHtml,files:safeFiles});
    $('sendBtn').textContent='Sent!';
    await sleep(700);
    $('sendBtn').textContent='Send email';
    attachments.length=0;
    refreshChips();
  }catch(e){
    alert('Send failed: '+e.message);
  }finally{
    setBusy($('sendBtn'),false);
  }
});

/* Clear composer */
$('clearBtn').addEventListener('click',()=>{
  $('to').value='';
  $('cc').value='';
  $('bcc').value='';
  $('subject').value='';
  $('editor').innerHTML='';
  attachments.length=0;
  refreshChips();
});

/* Inbox refresh logic */
async function refreshInbox(){
  try{
    if(state.provider==='mailtm'){
      const rows=await MAILTM.listMessages();
      const have=new Set(state.mailtm.messages.map(m=>m.id));
      for(const r of rows){
        if(!have.has(r.id)) state.mailtm.messages.unshift(r);
      }
      ensureIntroEmail();
    }else{
      if(mslInboundLeft()<=0){
        if(state.pollTimer){ clearInterval(state.pollTimer); state.pollTimer=null; }
        setInboxControls(false);
        return;
      }
      await MSL.pollLatest(1100);
      ensureIntroEmail();
    }
  }catch(e){
    console.warn('Refresh failed',e);
  }
  const list = state.provider==='mailtm'?state.mailtm.messages:state.mailslurp.messages;
  renderList(list);
  updateCountersUI();
}

/* Preview rendering */
function renderPreview(full){
  const pv=$('preview');
  const light = state.previewTheme==='light';
  pv.classList.toggle('light-preview', light);
  const html = full.html && full.html.trim()
    ? sanitizeIncomingHTML(full.html)
    : `<pre style="white-space:pre-wrap">${escapeHtml(full.text||'(no content)')}</pre>`;
  pv.innerHTML = `
    <h3 style="margin-top:0">${escapeHtml(full.subject||'(no subject)')}</h3>
    <div><b>From:</b> ${escapeHtml(full.from||'')}</div>
    ${full.to?`<div><b>To:</b> ${escapeHtml(full.to||'')}</div>`:''}
    <div><b>Date:</b> ${new Date(full.date||Date.now()).toLocaleString()}</div>
    <hr style="border:none;border-top:1px solid ${light ? '#e5e7eb' : '#334155'};margin:12px 0"/>
    ${html}
  `;
  setPreviewPlaceholder('', false);
  state.lastPreview = full;
}

/* Open message */
async function showMessage(meta){
  try{
    state.selectedId=meta.id;
    if(meta.provider==='local' || meta.__intro){
      renderPreview(meta);
      return;
    }
    const full=state.provider==='mailtm'?await MAILTM.getMessage(meta.id):await MSL.getEmail(meta.id);
    renderPreview(full);
  }catch(e){
    alert('Open message failed: '+e.message);
  }
}

/* Init */
(function init(){
  const y=document.getElementById('year');
  if(y) y.textContent=new Date().getFullYear();
  onProviderChange();
  updateCountersUI();
  applyEditorTheme();
  applyPreviewTheme();
  blankPreviewShell();
  setPreviewPlaceholder('There are no messages in your inbox yet', true);
})();
