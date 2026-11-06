const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const filename='family-melkov-20261106.html';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  await context.setOffline(true);
  const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const html=fs.readFileSync(path.join(root,filename),'utf8').replace(/<script[^>]+src="family.js"[^>]*><\/script>/,'');
  const dataset=JSON.parse(html.match(/<script id="family-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(dataset.people.length,64);
  const vera=dataset.people.filter(person=>person.name.includes('Вера'));
  assert.equal(vera.length,1);assert.equal(vera[0].birth,1919);
  const lyudmila=dataset.people.find(person=>person.id==='P-0006');
  assert(lyudmila.parentIds.includes(vera[0].id));
  assert(dataset.relations.some(r=>r.from===vera[0].id&&r.to===lyudmila.id&&r.status==='family'));
  assert(dataset.people.some(p=>p.birth===null));
  assert(!dataset.events.some(e=>e.type==='move'),'Unverified migrations are not invented');
  await p.setContent(html);await p.addStyleTag({content:fs.readFileSync(path.join(root,'family.css'),'utf8')});await p.addScriptTag({content:fs.readFileSync(path.join(root,'family.js'),'utf8')});
  assert.deepEqual(errors,[]);
  assert.equal(await p.locator('.person-card').count(),64);
  assert.equal(await p.locator('#year-range').inputValue(),'2026');
  assert.equal(await p.locator('.person-marker').count(),1);
  assert.equal(await p.locator('.reference-place').count(),2);
  assert.equal(await p.locator('.route').count(),0);
  assert.equal(await p.locator('#land-layer path').count(),177);
  for(const bot of ['robots','googlebot','yandex'])assert.match(await p.locator(`meta[name=${bot}]`).getAttribute('content'),/noindex/);
  await p.locator('#tab-story').click();
  assert.equal(await p.locator('.chapter').count(),73);
  assert.equal(await p.locator('.relation-card').count(),59);
  assert(await p.locator('.tree-edges .relation-family').count()>0);
  await p.locator('#branch-filter').selectOption('Кандидатная линия Викторенко');
  assert(await p.locator('.tree-edges .relation-hypothesis').count()>0);
  await p.locator('#branch-filter').selectOption('all');
  assert.equal(await p.locator('.tree-person').count(),64);
  await p.locator('#person-filter').selectOption(vera[0].id);
  assert(await p.locator('#chronicle').textContent().then(t=>t.includes('1919')&&t.includes('1920')));
  await p.locator('#tab-map').click();assert(await p.locator('#selected-record').textContent().then(t=>t.includes('1919')));
  for(const width of [375,390,768,1440]){await p.setViewportSize({width,height:900});for(const tab of ['map','story']){await p.locator(`#tab-${tab}`).click();assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),`${tab} overflow at ${width}`);}}
  assert.deepEqual(errors,[]);
  const landing=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert(!landing.includes(filename));assert(!fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').includes(filename));
  assert(!html.includes('mc.yandex'),'No analytics on the report page');
  // A separately namespaced report must not change the public Sokolov demo.
  const demo=await context.newPage();await demo.setContent(fs.readFileSync(path.join(root,'family.html'),'utf8').replace(/<script[^>]+src="family.js"[^>]*><\/script>/,''));await demo.addScriptTag({content:fs.readFileSync(path.join(root,'family.js'),'utf8')});
  assert.equal(await demo.locator('.person-card').count(),6);assert.match(await demo.locator('#family-title').textContent(),/Соколовых/);
  console.log('PASS: report data, one Vera 1919 and Lyudmila motherhood, unknown dates, hypothesis/family edges, source notes, map references without fabricated routes, noindex, no landing/sitemap links, no analytics, isolated demo, four widths');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
