'use strict';

const CACHE_NAME='browser-code-studio-enhanced-mk123';

const LOCAL_CORE=[
  '/pages/toolpages/coding-studio.html',
  '/Assets/site-shell.css?v=mk123',
  '/Assets/site-shell.js?v=mk123',
  '/Assets/ah-icon.png'
];

const ENHANCED_CORE=[
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/editor/editor.main.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/editor/editor.main.css',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/editor/editor.main.nls.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/base/worker/workerMain.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/json/jsonWorker.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/css/cssWorker.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/html/htmlWorker.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/typescript/tsWorker.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/base/browser/ui/codicons/codicon/codicon.ttf',
  'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js',
  'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.asm.wasm',
  'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/python_stdlib.zip',
  'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide-lock.json'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    for(const url of LOCAL_CORE){
      try{
        const response=await fetch(url,{cache:'reload'});
        if(response.ok)await cache.put(url,response.clone());
      }catch(_){}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(
      names
        .filter(name=>name.startsWith('browser-code-studio-enhanced-')&&name!==CACHE_NAME)
        .map(name=>caches.delete(name))
    );
    await self.clients.claim();
  })());
});

function shouldCache(request){
  if(request.method!=='GET')return false;
  const url=new URL(request.url);

  if(url.origin===self.location.origin){
    return url.pathname==='/pages/toolpages/coding-studio.html' ||
      url.pathname==='/Assets/site-shell.css' ||
      url.pathname==='/Assets/site-shell.js' ||
      url.pathname==='/Assets/ah-icon.png';
  }

  if(url.hostname!=='cdn.jsdelivr.net')return false;

  return url.pathname.includes('/monaco-editor@0.52.2/') ||
    url.pathname.includes('/pyodide/v0.28.3/');
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  if(cached)return cached;

  const response=await fetch(request);
  if(response&&response.status!==206){
    try{await cache.put(request,response.clone())}catch(_){}
  }
  return response;
}

self.addEventListener('fetch',event=>{
  if(!shouldCache(event.request))return;
  event.respondWith(cacheFirst(event.request));
});

async function prepareOffline(port){
  const cache=await caches.open(CACHE_NAME);
  const resources=[...LOCAL_CORE,...ENHANCED_CORE];
  let cached=0;

  for(let index=0;index<resources.length;index++){
    const url=resources[index];

    try{
      const request=new Request(url,{method:'GET',credentials:'omit',cache:'reload'});
      const response=await fetch(request);

      if(response.ok||response.type==='opaque'){
        await cache.put(request,response.clone());
        cached++;
      }

      port?.postMessage({
        type:'progress',
        done:index+1,
        total:resources.length,
        label:url.split('/').pop()||url
      });
    }catch(_){
      port?.postMessage({
        type:'progress',
        done:index+1,
        total:resources.length,
        label:(url.split('/').pop()||url)+' (unavailable)'
      });
    }
  }

  port?.postMessage({type:'complete',cached,total:resources.length});
}

self.addEventListener('message',event=>{
  if(event.data?.type!=='PREPARE_OFFLINE')return;
  const port=event.ports?.[0];
  event.waitUntil(
    prepareOffline(port).catch(error=>{
      port?.postMessage({type:'error',message:error.message||String(error)});
    })
  );
});
