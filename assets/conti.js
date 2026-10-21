(() => {
 const KEY='cookContiShootV3';
 const toolbar=document.createElement('div');toolbar.className='conti-toolbar';
 toolbar.innerHTML='<button id="edit-mode" aria-pressed="true">콘티 편집</button><button id="shoot-mode" aria-pressed="false">촬영 보기</button><button id="import-mode">GPT 콘티 가져오기</button><button id="backup-conti">JSON 백업</button>';
 document.querySelector('.autosave').after(toolbar);
 const message=document.createElement('div');message.className='conti-save';message.setAttribute('role','status');toolbar.after(message);
 const importer=document.createElement('section');importer.className='conti-import';importer.hidden=true;
 importer.innerHTML='<h2>GPT 콘티 가져오기</h2><p class="conti-note">이 도구에서 내려받은 Markdown 또는 JSON을 붙여넣거나 파일로 선택하세요. GPT에는 아래 형식 안내를 전달하면 됩니다. 가져오기는 현재 콘티를 교체합니다.</p><textarea id="import-text" aria-label="콘티 Markdown 또는 JSON" placeholder="GPT가 보내준 콘티를 붙여넣으세요"></textarea><input id="import-file" type="file" accept=".md,.txt,.json,text/plain,text/markdown,application/json" aria-label="콘티 파일 선택"><p id="import-summary" role="status"></p><button id="import-preview">내용 확인</button> <button id="import-apply" disabled>현재 콘티 교체</button> <button id="gpt-format">GPT용 형식 안내 복사</button>';
 message.after(importer);
 let state;try{state=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{state={}}
 if(!state||typeof state!=='object'||Array.isArray(state))state={};
 if(!state.checks||typeof state.checks!=='object')state.checks={};
 if(!Array.isArray(state.order))state.order=[];
 let wake=null,pending=null;
 const shooting=document.getElementById('shooting');
 window.addEventListener('conti-replaced',()=>{state={checks:{},order:[]};persist();window._lastMd='';document.getElementById('output').style.display='none';document.getElementById('afterGen').style.display='none';document.getElementById('warnBox').dataset.confirmed='';});
 const getData=()=>Object.fromEntries(ALL_IDS.map(id=>[id,document.getElementById(id).value]));
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{message.textContent='촬영 체크 저장 실패 · JSON 백업을 다운로드하세요';}}
 function text(tag,value,parent){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
 function check(parent,label,key,initial=false){
  const row=document.createElement('label');row.className='shoot-check';const input=document.createElement('input');input.type='checkbox';input.checked=state.checks[key]??initial;
  input.onchange=()=>{state.checks[key]=input.checked;persist();progress()};row.append(input,document.createTextNode(label));parent.append(row);
 }
 function progress(){const boxes=[...shooting.querySelectorAll('input[type=checkbox]')];document.getElementById('shoot-progress').textContent=`촬영 체크 ${boxes.filter(b=>b.checked).length} / ${boxes.length} 완료 · 체크는 이 기기에 저장됩니다`;}
 function checklist(parent,title,value,kind){
  if(!value.trim())return;const card=document.createElement('section');card.className='shoot-card';text('h2',title,card);
  value.split('\n').filter(l=>l.trim()).forEach((line,i)=>check(card,line.replace(/^\s*(?:[-*]|\d+[.)])?\s*(?:\[[ xX]\])?\s*/,''),kind+':'+i+':'+line,/\[[xX]\]/.test(line)));parent.append(card);
 }
 function renderShoot(){
  shooting.replaceChildren();text('h1',val('dishName')||'촬영 콘티',shooting);const p=text('div','',shooting);p.id='shoot-progress';p.className='shoot-progress';
  text('p','영상의 편집 순서와 실제 촬영 순서는 다를 수 있습니다. 아래 장면은 ↑↓로 촬영할 순서에 맞춰 바꾸세요.',shooting).className='conti-note';
  checklist(shooting,'촬영 전 확인',val('checklist'),'before');checklist(shooting,'실제 촬영 순서',val('shootOrder'),'order');
  const available=SEGMENTS.filter(([,prefix])=>FIELDS.some(f=>val(prefix+'_'+f)));
  const order=[...new Set([...state.order,...available.map(([,p])=>p)])].filter(p=>available.some(([,x])=>x===p));state.order=order;
  order.forEach((prefix,index)=>{
   const [title]=SEGMENTS.find(([,p])=>p===prefix);const card=document.createElement('section');card.className='shoot-card'+(state.checks['scene:'+prefix]?' done':'');text('h2',title,card);
   for(const f of FIELDS){const v=val(prefix+'_'+f);if(v){text('h3',FIELD_LABELS[f],card);text('p',v,card)}}
   check(card,'이 장면 촬영 완료','scene:'+prefix);
   card.querySelector('input').addEventListener('change',e=>card.classList.toggle('done',e.target.checked));
   const controls=document.createElement('div');controls.className='shoot-controls';
   for(const [label,offset] of [['↑ 앞에 촬영',-1],['↓ 뒤에 촬영',1]]){const b=text('button',label,controls);b.disabled=index+offset<0||index+offset>=order.length;b.onclick=()=>{[state.order[index],state.order[index+offset]]=[state.order[index+offset],state.order[index]];persist();renderShoot()};}card.append(controls);shooting.append(card);
  });
  if(!order.length)text('p','아직 장면이 없습니다. 콘티를 가져오거나 편집 화면의 영상 콘티를 입력하세요.',shooting);
  checklist(shooting,'꼭 확보할 장면',val('mustShots'),'must');checklist(shooting,'완료 전 남은 확인',val('remaining'),'remaining');
  for(const [title,value] of [['조리 순서',val('cookSteps')],['실패 방지 포인트',val('failPoint')],['제목·썸네일',[val('titles'),val('thumbnail')].filter(Boolean).join('\n')]])if(value){const card=document.createElement('section');card.className='shoot-card';text('h2',title,card);text('p',value,card);shooting.append(card)}
  const reset=text('button','촬영 체크 초기화',shooting);reset.className='btn btn-gray';reset.onclick=()=>{if(confirm('현재 콘티의 촬영 체크만 초기화할까요?')){state.checks={};persist();renderShoot()}};progress();
 }
 async function holdScreen(){if(!shooting.hidden&&document.visibilityState==='visible'&&navigator.wakeLock){try{wake=await navigator.wakeLock.request('screen');message.textContent='촬영 보기 · 화면 켜짐 유지 중'}catch{message.textContent='화면 유지가 지원되지 않습니다. 아이폰 자동 잠금을 확인하세요.'}}}
 function mode(shoot){saveAll();document.getElementById('editor').hidden=shoot;shooting.hidden=!shoot;document.body.classList.toggle('shooting-mode',shoot);document.getElementById('shoot-mode').setAttribute('aria-pressed',shoot);document.getElementById('edit-mode').setAttribute('aria-pressed',!shoot);if(shoot){renderShoot();message.textContent='촬영 보기 · 화면 자동 잠금은 기기 설정에 따라 달라질 수 있습니다.';holdScreen()}else{wake?.release();message.textContent='편집 후 촬영 보기로 돌아가면 최신 내용이 표시됩니다.'}window.scrollTo(0,0)}
 document.getElementById('edit-mode').onclick=()=>mode(false);document.getElementById('shoot-mode').onclick=()=>mode(true);document.addEventListener('visibilitychange',holdScreen);
 function normalize(raw){
  const source=raw.replace(/^\s*```(?:json|markdown|md)?\s*\n/,'').replace(/\n```\s*$/,'').trim();
  if(source.startsWith('{')){const obj=JSON.parse(source),data=obj.fields||obj;const result={};for(const id of ALL_IDS){if(data[id]!==undefined&&typeof data[id]!=='string')throw Error(id+' 값은 텍스트여야 합니다.');result[id]=data[id]||''}if(!result.dishName.trim())throw Error('요리명이 없습니다.');return {fields:result,shooting:obj.version===1?obj.shooting:null};}
  const result=Object.fromEntries(ALL_IDS.map(id=>[id,'']));let section=null,seg=null,field=null;const lines={};
  const sections={1:'concept',2:'checklist',3:'ingredients',4:'cookSteps',5:'segments',6:'shootOrder',7:'mustShots',8:'titles',9:'remaining'};
  const add=(id,line)=>{(lines[id]??=[]).push(line)};
  for(const line of source.split('\n')){
   let m;if((m=line.match(/^#\s+(.+?)(?:\s+영상 콘티\s*&\s*스크립트)?\s*$/))){result.dishName=m[1];continue;}
   if((m=line.match(/^작성일:\s*(.*)$/))){result.writeDate=m[1];continue}if((m=line.match(/^예상 편집 길이:\s*(.*)$/))){result.editLength=m[1];continue}if((m=line.match(/^촬영 제약:\s*(.*)$/))){result.constraints=m[1];continue}
   if((m=line.match(/^##\s+(\d+)[.\s]/))){section=sections[m[1]];seg=null;field=null;continue}
   if(section==='segments'){
    if((m=line.match(/^###\s+5-(\d+)/))){seg='seg'+m[1];field=null;continue}
    if(seg&&(m=line.match(/^-\s*(시간|화면|멘트|자막):\s*(.*)$/))){field=Object.keys(FIELD_LABELS).find(k=>FIELD_LABELS[k]===m[1]);add(seg+'_'+field,m[2]);continue}
    if(seg&&field&&line.trim())add(seg+'_'+field,line);continue;
   }
   if(section==='concept'){
    if((m=line.match(/^한 문장:\s*(.*)$/))){result.concept1=m[1];field='concept1';continue}
    if(/^핵심 3가지:/.test(line)){field='concept3';continue}
    if((m=line.match(/^-\s*시청자가 얻는 것:\s*(.*)$/))){result.viewerGain=m[1];field=null;continue}
    if((m=line.match(/^-\s*이번에 확인할 점:\s*(.*)$/))){result.toVerify=m[1];field=null;continue}
    if(field==='concept3')add(field,line);continue;
   }
   if(section==='ingredients'&&/^###/.test(line)){if(/^###\s*도구/.test(line))field='tools';else if((m=line.match(/^###\s*응용형:\s*(.*)$/))){result.variation=m[1];field='variation'}else field='ingredients';continue}
   if(section==='cookSteps'&&(m=line.match(/^-\s*실패 방지 포인트:\s*(.*)$/))){result.failPoint=m[1];continue}
   if(section==='titles'&&/^###/.test(line))continue;
   if(section==='titles'&&(m=line.match(/^썸네일:\s*(.*)$/))){result.thumbnail=m[1];continue}
   if(section&&section!=='segments')add(section==='ingredients'?(field||'ingredients'):section,line);
  }
  for(const [key,value] of Object.entries(lines))if(ALL_IDS.includes(key))result[key]=value.join('\n').trim();
  if(!result.dishName||!source.match(/^##\s+5[.\s]/m)||!FIELDS.some(f=>SEGMENTS.some(([,p])=>result[p+'_'+f])))throw Error('콘티 형식을 인식하지 못했습니다. GPT용 형식 안내의 JSON 형식을 사용하세요.');
  return {fields:result,shooting:null};
 }
 const input=document.getElementById('import-text'),summary=document.getElementById('import-summary'),apply=document.getElementById('import-apply');
 const invalidate=()=>{pending=null;apply.disabled=true;summary.textContent='';};input.oninput=invalidate;
 document.getElementById('import-mode').onclick=()=>{importer.hidden=!importer.hidden};
 document.getElementById('import-file').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>2e6)throw Error('파일은 2MB 이하로 선택하세요.');input.value=await f.text();invalidate()}catch(err){summary.textContent=err.message}finally{e.target.value=''}};
 document.getElementById('import-preview').onclick=()=>{try{if(input.value.length>2e6)throw Error('콘티가 너무 큽니다.');pending=normalize(input.value);summary.textContent=`${pending.fields.dishName} · ${SEGMENTS.filter(([,p])=>FIELDS.some(f=>pending.fields[p+'_'+f])).length}개 영상 구간 · 조리 순서 ${pending.fields.cookSteps?'있음':'없음'} · 현재 입력을 교체합니다.`;apply.disabled=false}catch(e){pending=null;apply.disabled=true;summary.textContent=e.message}};
 apply.onclick=()=>{if(!pending||!confirm('현재 콘티와 촬영 체크를 가져온 내용으로 교체할까요? 먼저 JSON 백업을 권합니다.'))return;clearTimeout(window._st);for(const id of ALL_IDS)document.getElementById(id).value=pending.fields[id];state={checks:{},order:[]};if(pending.shooting&&typeof pending.shooting==='object'){
  if(Array.isArray(pending.shooting.order))state.order=pending.shooting.order.filter(p=>SEGMENTS.some(([,x])=>x===p));
  if(pending.shooting.checks&&typeof pending.shooting.checks==='object')for(const [k,v] of Object.entries(pending.shooting.checks))if(typeof v==='boolean')state.checks[k]=v;
 }persist();saveAll();window._lastMd='';document.getElementById('output').style.display='none';document.getElementById('afterGen').style.display='none';importer.hidden=true;mode(true);};
 document.getElementById('backup-conti').onclick=()=>{saveAll();const blob=new Blob([JSON.stringify({version:1,fields:getData(),shooting:state},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(val('dishName')||'conti').replace(/[^\w가-힣-]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000)};
 document.getElementById('gpt-format').onclick=async()=>{
  const template={version:1,fields:Object.fromEntries(ALL_IDS.map(id=>[id,'']))};
  const prompt='함께 논의한 요리 영상 콘티를 아래 JSON 구조로 작성해 주세요. 키는 그대로 유지하고 값은 모두 문자열로 작성하세요. seg1~seg8은 오프닝, 재료·분량, 준비·실패방지, 핵심 조리, 꺼내기·마무리, 응용형(선택), 완성량·플레이팅, 시식·마무리입니다. 각 구간 time/screen/script/subtitle은 시간/화면/멘트/자막입니다. shootOrder는 실제 촬영 순서, mustShots는 필수 장면을 한 줄에 하나씩 작성하세요. 기본 필드: dishName 요리명, writeDate 작성일, editLength 편집 길이, constraints 촬영 제약, concept1 한 문장 콘셉트, concept3 핵심 3가지, viewerGain 시청자가 얻는 것, toVerify 확인할 점, checklist 촬영 전 체크리스트, ingredients 재료, tools 도구, variation 응용형, cookSteps 조리 순서, failPoint 실패 방지, titles 제목 후보, thumbnail 썸네일, remaining 남은 확인입니다. 확인되지 않은 수치나 결과는 확인 필요로 남겨 주세요.\n'+JSON.stringify(template,null,2);
  try{await navigator.clipboard.writeText(prompt);summary.textContent='GPT용 형식 안내를 복사했습니다. GPT 대화에 붙여넣으세요.'}catch{input.value=prompt;summary.textContent='복사하지 못했습니다. 입력란의 형식 안내를 직접 복사하세요.'}
 };
 window.addEventListener('pagehide',()=>{clearTimeout(window._st);saveAll()});
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./cook-sw.js',{scope:'./cook-conti.html'}).then(()=>navigator.serviceWorker.ready).then(()=>{message.textContent='콘티 화면 오프라인 준비 완료 · 입력 내용은 이 기기에만 저장됩니다.'}).catch(()=>{message.textContent='오프라인 저장 실패 · 온라인으로 사용하거나 JSON 백업을 보관하세요.'});
})();
