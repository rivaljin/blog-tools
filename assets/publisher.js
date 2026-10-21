
// === 데이터 ===
let postData = { title: '', tags: '', bodyTistory: '', bodyNaver: '', images: [] };
let originalData = null;
let mode = 'publisher', platform = 'tistory';
let editingTitle = false, editingBody = false;


function titleKey(which=platform){return which==='tistory'?'title_tistory':'title_naver';}
function getTitle(which=platform,data=postData){return data[titleKey(which)] || data.title || '';}
function getLink(which=platform){
  const key=which==='tistory'?'link_tistory':'link_naver';
  if(typeof postData[key]==='string')return postData[key].trim();
  if(postData.link)return postData.link;
  return (postData[which==='tistory'?'bodyTistory':'bodyNaver']||'').match(/https:\/\/s\.click\.aliexpress\.com\/e\/[^\s)]+/)?.[0]||'';
}
function bodyFor(which){return (postData[which==='tistory'?'bodyTistory':'bodyNaver']||'').replaceAll('{{affiliate_link}}',getLink(which));}
async function copyAffiliateLink(){const ok=await doCopy(getLink());alert(ok?'📋 제휴 링크 복사됨!':'복사할 링크가 없습니다.');}

// URL 해시에서 로드
function loadFromHash() {
  try {
    const h = location.hash.slice(1);
    if (!h) return false;
    const data = JSON.parse(decodeURIComponent(escape(atob(h))));
    postData = data;
    originalData = JSON.parse(JSON.stringify(data));
    return true;
  } catch(e) { return false; }
}

// === 파싱 (제작 모드용) ===
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function isValidUrl(u){return /^https?:\/\//i.test(u);}

function parse(md) {
  const lines = md.split('\n'), blocks = [];
  let para = [], list = [];
  const flushP = () => { if(para.length){blocks.push({type:'p',text:para.join(' ')});para=[];} };
  const flushL = () => { if(list.length){blocks.push({type:'ul',items:list});list=[];} };

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) { flushP(); flushL(); continue; }
    if (line==='---'){flushP();flushL();blocks.push({type:'hr'});continue;}
    if (line.startsWith('### ')){flushP();flushL();blocks.push({type:'h3',text:line.slice(4)});continue;}
    if (line.startsWith('## ')){flushP();flushL();blocks.push({type:'h2',text:line.slice(3)});continue;}
    if (line.startsWith('# ')){flushP();flushL();blocks.push({type:'h1',text:line.slice(2)});continue;}
    if (line.startsWith('> ')){flushP();flushL();blocks.push({type:'quote',text:line.slice(2)});continue;}
    if (/^[-*] /.test(line)){flushP();list.push(line.slice(2));continue;}
    const imgM = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgM) {
      flushP();flushL();
      const src=imgM[2].trim();
      if(!isValidUrl(src)){blocks.push({type:'warn',text:`이미지 URL 오류: ${src}`});continue;}
      blocks.push({type:'img',alt:imgM[1],src});continue;
    }
    // 깨진 이미지/링크 문법: 원문 유지 + 경고
    if (/!\[.*?\]/.test(line) && !imgM) {
      flushP();flushL();
      blocks.push({type:'warn',text:`이미지 문법 오류 (원문 유지): ${line.slice(0,50)}`});
      blocks.push({type:'p',text:line});
      continue;
    }
    flushL(); para.push(line);
  }
  flushP();flushL();
  return blocks;
}

function inlineFmt(t){
  t=esc(t);
  // URL 경계 명확히: ) 뒤에 바로 한글이 오지 않도록
  t=t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,'<a href="$2">$1</a>');
  t=t.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');
  return t;
}
function inlineNaver(t){
  t=t.replace(/\*\*([^*]+)\*\*/g,'$1');
  // 링크: URL 뒤에 문구가 붙지 않도록 괄호 처리
  t=t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,'$1 ($2)');
  return t;
}

const P="font-family:'맑은 고딕',sans-serif;font-size:11pt;line-height:1.7;";
const H1="font-family:'맑은 고딕',sans-serif;font-size:14pt;font-weight:bold;line-height:1.55;";
const H2="font-family:'맑은 고딕',sans-serif;font-size:13pt;font-weight:bold;line-height:1.55;";
const H3="font-family:'맑은 고딕',sans-serif;font-size:12pt;font-weight:bold;line-height:1.55;";
const CAP="font-family:'맑은 고딕',sans-serif;font-size:10pt;line-height:1.7;text-align:center;";
const QUOTE="font-family:'맑은 고딕',sans-serif;font-size:11pt;line-height:1.7;border-left:3px solid #3498db;padding-left:12px;color:#555;";
const LI="font-family:'맑은 고딕',sans-serif;font-size:11pt;line-height:1.7;";
const sp=px=>`<div style="height:${px}px;line-height:${px}px;">&nbsp;</div>`;

function genTistory(blocks){
  let html='<div>\n', prevSpace=true;
  const need=px=>{if(!prevSpace)html+=sp(px)+'\n';prevSpace=true;};
  blocks.forEach(b=>{
    if(b.type==='p'){need(10);html+=`<p style="${P}">${inlineFmt(b.text)}</p>\n`;prevSpace=false;}
    else if(b.type==='h1'){need(24);html+=`<div style="${H1}">${inlineFmt(b.text)}</div>\n`;prevSpace=false;}
    else if(b.type==='h2'){need(26);html+=`<div style="${H2}">${inlineFmt(b.text)}</div>\n`;prevSpace=false;}
    else if(b.type==='h3'){need(20);html+=`<div style="${H3}">${inlineFmt(b.text)}</div>\n`;prevSpace=false;}
    else if(b.type==='ul'){need(10);html+=`<ul style="margin:0;padding-left:20px;">\n`;b.items.forEach(it=>html+=`<li style="${LI}">${inlineFmt(it)}</li>\n`);html+=`</ul>\n`;prevSpace=false;}
    else if(b.type==='quote'){need(16);html+=`<div style="${QUOTE}">${inlineFmt(b.text)}</div>\n`;prevSpace=false;}
    else if(b.type==='img'){need(22);html+=`<div style="text-align:center;">\n<img src="${esc(b.src)}" alt="${esc(b.alt)}" style="display:block;max-width:100%;height:auto;margin:0 auto;">\n</div>\n<p style="${CAP}">▲ ${esc(b.alt)}</p>\n`;prevSpace=true;html+=sp(22)+'\n';}
    else if(b.type==='hr'){need(24);}
  });
  return html+'</div>';
}

// 네이버 본문: 번호가 맞는 사진 자리 표시 포함
function genNaverBody(blocks){
  let txt='', imgPositions=[];
  let lastText='';
  blocks.forEach(b=>{
    if(b.type==='p'){lastText=b.text.slice(0,30);txt+=inlineNaver(b.text)+'\n\n';}
    else if(b.type==='h1'){lastText=b.text.slice(0,30);txt+='\n■ '+inlineNaver(b.text)+'\n\n';}
    else if(b.type==='h2'){lastText=b.text.slice(0,30);txt+='\n■ '+inlineNaver(b.text)+'\n\n';}
    else if(b.type==='h3'){lastText=b.text.slice(0,30);txt+='\n▸ '+inlineNaver(b.text)+'\n\n';}
    else if(b.type==='ul'){b.items.forEach(it=>txt+='• '+inlineNaver(it)+'\n');txt+='\n';lastText=b.items[b.items.length-1]?.slice(0,30)||'';}
    else if(b.type==='quote'){lastText=b.text.slice(0,30);txt+='❝ '+inlineNaver(b.text)+' ❞\n\n';}
    else if(b.type==='img'){
      imgPositions.push({afterText: lastText||'(문서 시작)', alt: b.alt, src: b.src, index: imgPositions.length});
      txt+='[사진 '+String(imgPositions.length).padStart(2,'0')+' — '+b.alt+']\n\n';
    }
    else if(b.type==='hr'){txt+='\n───\n\n';}
  });
  return {body: txt.trim(), imgPositions};
}

// === 렌더링 ===
function render(){
  const warns = [];
  // 경고 수집
  const blocks = parse(postData.bodyTistory || postData.bodyNaver || '');
  blocks.filter(b=>b.type==='warn').forEach(b=>warns.push(b.text));

  const wEl = document.getElementById('warnings');
  wEl.innerHTML = warns.length
    ? warns.map(w=>`<div class="warn-box">⚠️ ${esc(w)}</div>`).join('')
    : '';

  const affiliate=getLink();
  document.getElementById('affiliate-display').textContent=affiliate||'등록된 링크 없음';
  document.getElementById('affiliate-card').classList.toggle('hidden',!affiliate);
  // 제목
  document.getElementById('title-display').textContent = getTitle() || '(제목 없음)';
  // 태그
  document.getElementById('tags-display').textContent = postData.tags || '(태그 없음)';

  // 플랫폼별
  const isT = platform==='tistory';
  document.querySelectorAll('.ptab').forEach(t=>t.classList.toggle('active',t.dataset.p===platform));
  document.getElementById('tistory-actions').classList.toggle('hidden',!isT);
  document.getElementById('naver-actions').classList.toggle('hidden',isT);
  document.getElementById('btn-zip').classList.toggle('hidden',isT);

  if(isT){
    const b = parse(bodyFor('tistory'));
    document.getElementById('preview').innerHTML = genTistory(b);
  } else {
    const b = parse(bodyFor('naver'));
    const {body, imgPositions} = genNaverBody(b);
    // 네이버 미리보기: 텍스트 + 이미지 위치 표시
    let pv = esc(body).replace(/\n/g,'<br>');
    document.getElementById('preview').innerHTML = `<div style="${P}">${pv}</div>`;
    // 이미지 안내
    renderImgGuide(imgPositions);
  }

  // 티스토리 이미지 안내
  if(isT){
    const b = parse(bodyFor('tistory'));
    const imgs = b.filter(x=>x.type==='img');
    renderImgGuideTistory(imgs);
  }
}

function renderImgGuide(positions){
  const el = document.getElementById('img-guide-list');
  if(!positions.length){el.innerHTML='<p style="color:#999;font-size:13px;">이미지가 없습니다.</p>';return;}
  el.innerHTML = positions.map((p,i)=>
    `<div class="img-guide-item">
      <img src="${esc(p.src)}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none'">
      <div class="info" style="flex:1;"><span class="pos">${i+1}.</span> ${esc(p.alt)}<br>
      <span style="color:#888;font-size:11px;">→ "${esc(p.afterText)}..." 뒤에 삽입</span></div>
      <button class="btn btn-orange" style="margin:0;flex-shrink:0;" onclick="downloadImgByIndex(${i},'naver')">⬇️</button>
    </div>`).join('');
}
function renderImgGuideTistory(imgs){
  const el = document.getElementById('img-guide-list');
  if(!imgs.length){el.innerHTML='<p style="color:#999;font-size:13px;">이미지가 없습니다.</p>';return;}
  el.innerHTML = imgs.map((im,i)=>
    `<div class="img-guide-item">
      <img src="${esc(im.src)}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none'">
      <div class="info" style="flex:1;"><span class="pos">${i+1}.</span> ${esc(im.alt)}</div>
      <button class="btn btn-orange" style="margin:0;flex-shrink:0;" onclick="downloadImgByIndex(${i},'tistory')">⬇️</button>
    </div>`).join('');
}

// === 복사 ===
function doCopy(text){
  return new Promise(res=>{
    const ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    let ok=false;
    try{ok=document.execCommand('copy');}catch(e){}
    document.body.removeChild(ta);
    if(ok){res(true);return;}
    if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>res(true)).catch(()=>res(false));}
    else res(false);
  });
}
async function copyTitle(){
  const ok=await doCopy(getTitle());
  alert(ok?'📋 제목 복사됨!':'⚠️ 복사 실패. 수동으로 복사해주세요.');
}
async function copyTags(){
  const ok=await doCopy(postData.tags||'');
  alert(ok?'📋 태그 복사됨!':'⚠️ 복사 실패. 수동으로 복사해주세요.');
}
async function copyTistoryHTML(){
  const html=genTistory(parse(bodyFor('tistory')));
  const ok=await doCopy(html);
  alert(ok?'📋 HTML 복사됨!':'⚠️ 복사 실패. 수동으로 복사해주세요.');
}
async function copyNaverBody(){
  const {body}=genNaverBody(parse(bodyFor('naver')));
  const ok=await doCopy(body);
  alert(ok?'📋 본문 복사됨!':'⚠️ 복사 실패. 수동으로 복사해주세요.');
}

// === 문구 수정 (마크다운 직접 편집 - 서식 손실 없음) ===
function toggleTitleEdit(){
  if(editingTitle){
    // 완료: 저장
    postData[titleKey()]=document.getElementById('title-edit').value;
    editingTitle=false;
  } else {
    editingTitle=true;
    document.getElementById('title-edit').value=getTitle();
  }
  document.getElementById('title-display').classList.toggle('hidden',editingTitle);
  document.getElementById('title-edit-wrap').classList.toggle('hidden',!editingTitle);
  document.getElementById('btn-title-restore').classList.toggle('hidden',!editingTitle);
  document.getElementById('btn-edit-title').textContent=editingTitle?'✅ 완료':'✏️ 문구 수정';
  if(!editingTitle){saveEdits();render();}
}
function restoreTitle(){
  postData[titleKey()]=getTitle(platform,originalData);
  editingTitle=false;
  document.getElementById('title-display').classList.toggle('hidden',false);
  document.getElementById('title-edit-wrap').classList.toggle('hidden',true);
  document.getElementById('btn-title-restore').classList.toggle('hidden',true);
  document.getElementById('btn-edit-title').textContent='✏️ 문구 수정';
  saveEdits();render();
}
function toggleBodyEdit(){
  const key=platform==='tistory'?'bodyTistory':'bodyNaver';
  if(editingBody){
    // 완료: 블록 에디터에서 마크다운 재구성
    postData[key]=blocksToMd(collectBlocks());
    editingBody=false;
    editPlatform=null;
    document.getElementById('body-edit-wrap').classList.add('hidden');
  } else {
    editingBody=true;
    editPlatform=platform;
    // 먼저 표시한 뒤 렌더링 (높이 계산을 위해)
    document.getElementById('body-edit-wrap').classList.remove('hidden');
    renderBlockEditor(postData[key]);
  }
  document.getElementById('btn-body-restore').classList.toggle('hidden',!editingBody);
  document.getElementById('btn-edit-body').textContent=editingBody?'✅ 완료':'✏️ 문구 수정';
  if(!editingBody){saveEdits();render();}
}
// 블록 에디터 렌더링: 문구만 편집, 서식은 유지
let editBlocks=[];
function renderBlockEditor(md){
  editBlocks=parse(md);
  const wrap=document.getElementById('block-editor');
  wrap.innerHTML='';
  editBlocks.forEach((b,i)=>{
    if(b.type==='img'){
      const d=document.createElement('div');
      d.style.cssText='padding:8px;background:#f0f0f0;border-radius:6px;font-size:12px;color:#888;';
      d.innerHTML=`🖼️ 이미지: ${esc(b.alt)} <span style="color:#aaa;">(수정 불가)</span>`;
      wrap.appendChild(d);
    } else if(b.type==='hr'){
      const d=document.createElement('div');
      d.style.cssText='padding:4px;color:#aaa;font-size:12px;';
      d.textContent='─── 구분선 ───';
      wrap.appendChild(d);
    } else if(b.type==='warn'){
      return; // 경고 블록은 편집에서 제외
    } else {
      const label={p:'문단',h1:'소제목',h2:'참고제목',h3:'작은제목',quote:'인용',ul:'목록'}[b.type]||'텍스트';
      const d=document.createElement('div');
      d.style.cssText='border:1px solid #ddd;border-radius:6px;padding:6px;';
      const lab=document.createElement('div');
      lab.style.cssText='font-size:11px;color:#999;margin-bottom:4px;';
      lab.textContent=label;
      d.appendChild(lab);
      if(b.type==='ul'){
        b.items.forEach((it,ji)=>{
          const ta=document.createElement('textarea');
          ta.rows=1;ta.dataset.block=i;ta.dataset.item=ji;
          ta.style.cssText='width:100%;padding:6px;border:1px solid #eee;border-radius:4px;font-size:13px;font-family:inherit;margin-bottom:4px;';
          ta.value=it;
          ta.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';});
          d.appendChild(ta);
        });
      } else {
        const ta=document.createElement('textarea');
        ta.rows=2;ta.dataset.block=i;
        ta.style.cssText='width:100%;padding:6px;border:1px solid #eee;border-radius:4px;font-size:13px;font-family:inherit;';
        ta.value=b.text;
        ta.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';});
        d.appendChild(ta);
      }
      wrap.appendChild(d);
    }
  });
  // 높이 자동 조절
  wrap.querySelectorAll('textarea').forEach(ta=>{ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';});
}
function collectBlocks(){
  const wrap=document.getElementById('block-editor');
  const tas=wrap.querySelectorAll('textarea');
  // editBlocks 복사 후 텍스트만 교체
  const out=JSON.parse(JSON.stringify(editBlocks));
  tas.forEach(ta=>{
    const bi=+ta.dataset.block, ji=ta.dataset.item;
    if(ji!==undefined&&ji!==''){out[bi].items[+ji]=ta.value;}
    else if(out[bi]){out[bi].text=ta.value;}
  });
  return out;
}
function blocksToMd(blocks){
  let md='';
  blocks.forEach(b=>{
    if(b.type==='p')md+=b.text+'\n\n';
    else if(b.type==='h1')md+='# '+b.text+'\n\n';
    else if(b.type==='h2')md+='## '+b.text+'\n\n';
    else if(b.type==='h3')md+='### '+b.text+'\n\n';
    else if(b.type==='quote')md+='> '+b.text+'\n\n';
    else if(b.type==='ul')b.items.forEach(it=>md+='- '+it+'\n'),md+='\n';
    else if(b.type==='img')md+=`![${b.alt}](${b.src})\n\n`;
    else if(b.type==='hr')md+='---\n\n';
  });
  return md.trim();
}
function restoreBody(){
  const key=platform==='tistory'?'bodyTistory':'bodyNaver';
  postData[key]=originalData[key];
  editingBody=false;
  editPlatform=null;
  document.getElementById('body-edit-wrap').classList.toggle('hidden',true);
  document.getElementById('btn-body-restore').classList.toggle('hidden',true);
  document.getElementById('btn-edit-body').textContent='✏️ 문구 수정';
  saveEdits();render();
}
// 글별 고유 키: 전체 데이터 해시 (충돌 방지)
function postKey(){
  const h = location.hash.slice(1) || location.pathname;
  let hash = 5381;
  for(let i=0;i<h.length;i++){ hash = ((hash<<5)+hash+h.charCodeAt(i))|0; }
  return 'blog_edit_'+(hash>>>0).toString(36)+'_'+h.length;
}
// 수정 내용 저장 (글별)
function saveEdits(){
  try{
    localStorage.setItem(postKey(), JSON.stringify({
      title:postData.title, tags:postData.tags, featuredImage:postData.featuredImage, title_tistory:postData.title_tistory, title_naver:postData.title_naver, link_tistory:postData.link_tistory, link_naver:postData.link_naver, bodyTistory:postData.bodyTistory, bodyNaver:postData.bodyNaver
    }));
  }catch(e){}
}
function loadEdits(){
  try{
    const s=JSON.parse(localStorage.getItem(postKey()));
    if(s){for(const k of ['title_tistory','title_naver','link_tistory','link_naver','tags','featuredImage'])if(typeof s[k]==='string')postData[k]=s[k];postData.title=s.title??postData.title;postData.bodyTistory=s.bodyTistory??postData.bodyTistory;postData.bodyNaver=s.bodyNaver??postData.bodyNaver;}
  }catch(e){}
}

// === 이미지 다운로드 ===
function getImages(which){
  const key=which==='tistory'?'bodyTistory':'bodyNaver';
  return parse(postData[key]).filter(b=>b.type==='img');
}
async function fetchImg(url){
  const r=await fetch(url);
  if(!r.ok)throw new Error('HTTP '+r.status);
  const b=await r.blob();
  if(!b.type.startsWith('image/'))throw new Error('이미지 아님: '+b.type);
  return b;
}
function ext(b){return b.type.includes('png')?'png':b.type.includes('webp')?'webp':b.type.includes('gif')?'gif':'jpg';}
async function downloadImgByIndex(i,which){
  const imgs=getImages(which), im=imgs[i];
  if(!im)return;
  try{
    const blob=await fetchImg(im.src);
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${String(i+1).padStart(2,'0')}_${im.alt.slice(0,20).replace(/[\\/:*?"<>|]/g,'')}.${ext(blob)}`;
    a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  }catch(e){alert('다운로드 실패: '+e.message);}
}
async function downloadFeatured(){
  // 대표이미지가 별도 지정되어 있으면 우선 사용
  let src = postData.featuredImage;
  let label = '대표이미지';
  if(!src){
    const imgs=getImages(platform);
    if(!imgs.length){alert('이미지가 없습니다.');return;}
    src=imgs[0].src; label=imgs[0].alt;
  }
  try{
    const blob=await fetchImg(src);
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`featured.${ext(blob)}`;
    a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  }catch(e){alert('다운로드 실패: '+e.message);}
}
async function downloadAllZip(){
  const imgs=getImages('naver');
  if(!imgs.length){alert('이미지가 없습니다.');return;}
  if(typeof JSZip==='undefined'){alert('ZIP 로드 중. 잠시 후 다시 시도.');return;}
  const zip=new JSZip();let ok=0,fail=[];
  for(let i=0;i<imgs.length;i++){
    try{
      const blob=await fetchImg(imgs[i].src);
      zip.file(`${String(i+1).padStart(2,'0')}_${imgs[i].alt.slice(0,20).replace(/[\\/:*?"<>|]/g,'')}.${ext(blob)}`,blob);
      ok++;
    }catch(e){fail.push(imgs[i].alt);}
  }
  let guide='이미지 삽입 안내\n================\n\n';
  imgs.forEach((im,i)=>guide+=`${i+1}. ${im.alt}\n   ${im.src}\n\n`);
  zip.file('_삽입안내.txt',guide);
  const c=await zip.generateAsync({type:'blob'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(c);a.download='blog-images.zip';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
  alert(`✅ ${ok}개 완료`+(fail.length?`\n⚠️ 실패: ${fail.join(', ')}`:''));
}

// === 모드/플랫폼 ===
function setMode(m){
  mode=m;
  document.getElementById('btn-publisher').classList.toggle('active',m==='publisher');
  document.getElementById('btn-creator').classList.toggle('active',m==='creator');
  document.getElementById('creator-area').classList.toggle('hidden',m!=='creator');
  if(m==='creator'){
    document.getElementById('creator-title').value=getTitle('tistory');
    document.getElementById('creator-title-naver').value=getTitle('naver');
    document.getElementById('creator-link-tistory').value=getLink('tistory');
    document.getElementById('creator-link-naver').value=getLink('naver');
    document.getElementById('creator-tags').value=postData.tags||'';
    document.getElementById('creator-featured').value=postData.featuredImage||'';
    document.getElementById('md-input').value=postData.bodyTistory||'';
    document.getElementById('md-input-naver').value=postData.bodyNaver||'';
  }
}
let editPlatform=null;
function setPlatform(p){
  if(editingBody && editPlatform!==p){
    if(!confirm('수정 중인 내용이 있습니다. 저장하지 않고 플랫폼을 바꾸시겠습니까?')){
      // 탭 UI 되돌리기
      document.querySelectorAll('.ptab').forEach(t=>t.classList.toggle('active',t.dataset.p===platform));
      return;
    }
    // 취소하고 전환
    editingBody=false;editPlatform=null;
    document.getElementById('body-edit-wrap').classList.toggle('hidden',true);
    document.getElementById('btn-body-restore').classList.toggle('hidden',true);
    document.getElementById('btn-edit-body').textContent='✏️ 문구 수정';
  }
  if(editingTitle){
    alert('제목 수정 중입니다. 먼저 완료 또는 원본으로 되돌리기를 해주세요.');
    document.querySelectorAll('.ptab').forEach(t=>t.classList.toggle('active',t.dataset.p===platform));
    return;
  }
  platform=p;render();
}

// === 제작 모드 ===
function applyCreator(){
  postData={
    title:postData.title||document.getElementById('creator-title').value,
    title_tistory:document.getElementById('creator-title').value,
    title_naver:document.getElementById('creator-title-naver').value,
    link_tistory:document.getElementById('creator-link-tistory').value.trim(),
    link_naver:document.getElementById('creator-link-naver').value.trim(),
    tags:document.getElementById('creator-tags').value,
    featuredImage:document.getElementById('creator-featured').value.trim(),
    bodyTistory:document.getElementById('md-input').value,
    bodyNaver:document.getElementById('md-input-naver').value,
    images:[]
  };
  originalData=JSON.parse(JSON.stringify(postData));
  saveEdits();render();
  alert('✅ 적용됨! 발행 모드에서 확인하세요.');
}
function genShareLink(){
  applyCreator();
  const json=JSON.stringify(postData);
  const b64=btoa(unescape(encodeURIComponent(json)));
  const url=location.origin+location.pathname+'#'+b64;
  document.getElementById('share-link').value=url;
}
async function copyShareLink(){
  const v=document.getElementById('share-link').value;
  if(!v){alert('먼저 발행 링크를 생성하세요.');return;}
  const ok=await doCopy(v);
  alert(ok?'📋 링크 복사됨!':'⚠️ 복사 실패.');
}


// Legacy hash links keep working; new post pages carry JSON data only.
if(!loadFromHash()){
  const data=document.getElementById('post-data');
  postData=data?JSON.parse(data.textContent):{title:'(제목이 여기에 표시됩니다)',tags:'태그1, 태그2',bodyTistory:'# 소제목\n\n본문이 여기에 표시됩니다.',bodyNaver:'# 소제목\n\n본문이 여기에 표시됩니다.',images:[]};
  originalData=JSON.parse(JSON.stringify(postData));
}
loadEdits();
render();
