const CACHE='cook-conti-offline-v1';
const FILES=['./cook-conti.html','./assets/conti.js','./assets/conti.css'];
const URLS=new Set(FILES.map(p=>new URL(p,self.location).href));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('cook-conti-offline-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);u.search='';u.hash='';if(e.request.method==='GET'&&URLS.has(u.href))e.respondWith(caches.open(CACHE).then(async c=>(await c.match(u.href))||fetch(e.request)))});
