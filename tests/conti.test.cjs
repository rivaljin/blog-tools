// Serve repository on port 8766 before running. Requires Playwright and Chromium.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Seoul'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let accept=true;page.on('dialog',d=>accept?d.accept():d.dismiss());
 const url=process.env.CONTI_TEST_URL||'http://127.0.0.1:8766/cook-conti.html';await page.goto(url);
 await page.evaluate(()=>loadExample());
 await page.getByRole('button',{name:'촬영 보기',exact:true}).click();
 assert.equal(await page.locator('#editor').isVisible(),false);assert.equal(await page.locator('#shooting .shoot-card h2').filter({hasText:'5-'}).count(),8);
 const scene=page.locator('#shooting .shoot-card').filter({hasText:'5-1. 오프닝'});await scene.getByRole('checkbox').check();await scene.getByRole('button',{name:'↓ 뒤에 촬영'}).click();
 const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'JSON 백업',exact:true}).click();const download=await downloadEvent;const stream=await download.createReadStream();let raw='';for await(const chunk of stream)raw+=chunk;const backup=JSON.parse(raw);assert.equal(backup.shooting.checks['scene:seg1'],true);assert.equal(backup.shooting.order[0],'seg2');
 await page.reload();await page.getByRole('button',{name:'촬영 보기',exact:true}).click();assert.equal(await page.locator('#shooting .shoot-card').filter({hasText:'5-1. 오프닝'}).getByRole('checkbox').isChecked(),true);
 await page.getByRole('button',{name:'콘티 편집',exact:true}).click();await page.locator('#dishName').fill('내 콘티');accept=false;await page.evaluate(()=>loadExample());assert.equal(await page.locator('#dishName').inputValue(),'내 콘티');accept=true;
 await page.evaluate(()=>generate());const md=await page.locator('#output').innerText();await page.locator('#dishName').fill('새 제목');assert.equal(await page.locator('#afterGen').isVisible(),false);
 await page.getByRole('button',{name:'GPT 콘티 가져오기'}).click();await page.locator('#import-text').fill(md);await page.getByRole('button',{name:'내용 확인',exact:true}).click();assert.equal(await page.locator('#import-apply').isEnabled(),true);await page.locator('#import-apply').click();
 assert.equal(await page.locator('#dishName').inputValue(),'내 콘티');assert.equal(await page.locator('#seg4_screen').inputValue(),backup.fields.seg4_screen);assert.equal(await page.locator('#tools').inputValue(),backup.fields.tools);
 await page.getByRole('button',{name:'GPT 콘티 가져오기'}).click();await page.locator('#import-text').fill('인식할 수 없는 자유 형식');await page.getByRole('button',{name:'내용 확인',exact:true}).click();assert.equal(await page.locator('#import-apply').isDisabled(),true);
 backup.fields.dishName='<img src=x onerror=alert(1)>';await page.locator('#import-text').fill(JSON.stringify(backup));await page.getByRole('button',{name:'내용 확인',exact:true}).click();await page.locator('#import-apply').click();assert.equal(await page.locator('#shooting img').count(),0);assert.equal(await page.locator('#shooting .shoot-card').filter({hasText:'5-1. 오프닝'}).getByRole('checkbox').isChecked(),true);
 await page.waitForFunction(()=>navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'촬영 보기',exact:true}).click();assert.equal(await page.locator('#shooting .shoot-card').filter({hasText:'5-1. 오프닝'}).getByRole('checkbox').isChecked(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS: mobile filming view, checks/reordering persistence, JSON backup/restore, Markdown roundtrip, invalid input, safe rendering, overwrite cancellation, stale output protection, offline reload');
 await context.close();}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
