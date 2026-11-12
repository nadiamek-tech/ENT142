/* ENT 141 · write-on document builder (Project 2 report, Activity 2 analysis).
   The student types directly on the document. It saves in this browser; Save file / Open file moves it between devices;
   Save as Word builds a .docx (assets/vendor/docx.umd.js); Print or PDF uses the print window.
   DocB.mount({key, docTitle, fileTag, root, sections:[{id,n,title,tag,howto,fmt,items:[...]}], ex:{...}, refsKey})
   item types:
     {t:'in', k, label, ph}                       short field on a label/value grid
     {t:'q', k, label, ph, rows}                  question + answer (Q&A: question kept; Paragraphs: answer only)
     {t:'pick', k, label, opts:[]}                choice
     {t:'boxes', cls, boxes:[{h,sub,cls,items:[[k,ph]]}]}   coloured boxes (output: one table, boxes side by side in pairs)
     {t:'table', k, cols:[], rows:n, ph:[]}       editable table, cells k_r_c
     {t:'matrix', k, crit:[[name,weight]], opts:[labelKeys]}  weighted scoring, 1–5
     {t:'img', slot, label, req, multi}           screenshots/photos (IndexedDB, this browser)
     {t:'html', html}                             static guide content (not in the file) */
(function(){
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const words=t=>(String(t||'').trim().match(/\S+/g)||[]).length;
let CFG, D={}, mode='edit', IMGS=[];
const store=()=>{ try{ localStorage.setItem(CFG.key,JSON.stringify(D)); }catch(e){} };
const src=()=>mode==='ex'?CFG.ex:D;
const V=k=>String(src()[k]==null?'':src()[k]).trim();
const fmt=id=>src()['fmt-'+id]||'qa';
/* images */
const IDB={db:null,name:()=>CFG.key+'-img',open(){ return this.db?Promise.resolve(this.db):new Promise((res,rej)=>{ try{ const r=indexedDB.open(this.name(),1); r.onupgradeneeded=()=>r.result.createObjectStore('img',{keyPath:'id'}); r.onsuccess=()=>{ this.db=r.result; res(r.result); }; r.onerror=()=>rej(r.error); }catch(e){ rej(e); } }); },
  all(){ return this.open().then(db=>new Promise(res=>{ const q=db.transaction('img').objectStore('img').getAll(); q.onsuccess=()=>res((q.result||[]).sort((a,b)=>a.t-b.t)); q.onerror=()=>res([]); })).catch(()=>[]); },
  put(o){ return this.open().then(db=>new Promise(res=>{ const tx=db.transaction('img','readwrite'); tx.objectStore('img').put(o); tx.oncomplete=()=>res(); tx.onerror=()=>res(); })).catch(()=>{}); },
  del(id){ return this.open().then(db=>new Promise(res=>{ const tx=db.transaction('img','readwrite'); tx.objectStore('img').delete(id); tx.oncomplete=()=>res(); })).catch(()=>{}); },
  clear(){ return this.open().then(db=>new Promise(res=>{ const tx=db.transaction('img','readwrite'); tx.objectStore('img').clear(); tx.oncomplete=()=>res(); })).catch(()=>{}); }};
const shrink=file=>new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>{ const im=new Image(); im.onload=()=>{ const m=1400,s=Math.min(1,m/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=Math.round(im.width*s); c.height=Math.round(im.height*s); c.getContext('2d').drawImage(im,0,0,c.width,c.height); res({src:c.toDataURL('image/jpeg',.85),w:c.width,h:c.height}); }; im.onerror=rej; im.src=fr.result; }; fr.onerror=rej; fr.readAsDataURL(file); });

/* ---------- edit view ---------- */
function F(k,ph,rows=2,tag='textarea'){ if(mode==='ex') return `<div class="view${V(k)?'':' empty'}">${esc(V(k))||'—'}</div>`;
  return tag==='input'?`<input class="fld" data-k="${k}" value="${esc(D[k]||'')}" placeholder="${esc(ph)}" aria-label="${esc(ph)}">`:`<textarea class="fld" data-k="${k}" id="f-${k}" rows="${rows}" placeholder="${esc(ph)}">${esc(D[k]||'')}</textarea>`; }
const score=(it,o)=>{ let t=0; it.crit.forEach(([c,w],ci)=>{ const v=parseFloat(V(`${it.k}_${ci}_${o}`))||0; const wt=parseFloat(V(`${it.k}_w${ci}`))||w; t+=v*wt/100; }); return t; };
function item(it,sec){
  if(it.t==='in') return `<dl class="meta"><dt>${esc(it.label)}</dt><dd>${F(it.k,it.ph||it.label,1,'input')}</dd></dl>`;
  if(it.t==='q') return `<div class="q"><label${mode==='edit'?` for="f-${it.k}"`:''}>${it.n?`<span>${it.n}</span>`:''}${esc(it.label)}</label>${F(it.k,it.ph||it.label,it.rows||3)}</div>`;
  if(it.t==='pick') return `<div class="q"><label>${esc(it.label)}</label>${mode==='ex'?`<div class="view">${esc(V(it.k))||'—'}</div>`:`<select class="fld" data-k="${it.k}" aria-label="${esc(it.label)}"><option value="">Choose…</option>${it.opts.map(o=>`<option${D[it.k]===o?' selected':''}>${esc(o)}</option>`).join('')}</select>`}</div>`;
  if(it.t==='boxes') return `<div class="boxes ${it.cls||''}">${it.boxes.map(b=>`<div class="${b.cls||''}"><h3>${esc(b.h)}${b.sub?`<small>${esc(b.sub)}</small>`:''}</h3>${b.items.map(([k,ph],i)=>`<div class="r"><span>${i+1}</span>${F(k,ph,2)}</div>`).join('')}</div>`).join('')}</div>`;
  if(it.t==='table') return `<div class="tw"><table class="et"><tr>${it.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr>${Array.from({length:it.rows},(_,r)=>`<tr>${it.cols.map((c,ci)=>`<td>${F(`${it.k}_${r}_${ci}`,(it.ph&&it.ph[ci])||c,1)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  if(it.t==='matrix'){ const opts=it.opts.map((k,i)=>V(k)||`Idea ${i+1}`); const tot=it.opts.map((_,o)=>score(it,o)); const best=tot.some(x=>x>0)?tot.indexOf(Math.max(...tot)):-1;
    return `<div class="tw"><table class="et mx"><tr><th>Criterion</th><th>Weight %</th>${opts.map(o=>`<th>${esc(o)}</th>`).join('')}</tr>${it.crit.map(([c,w],ci)=>`<tr><td><b>${esc(c)}</b></td><td>${mode==='ex'?esc(V(`${it.k}_w${ci}`)||w):`<input class="fld num" type="number" min="0" max="100" data-k="${it.k}_w${ci}" value="${esc(D[`${it.k}_w${ci}`]||w)}" aria-label="${esc(c)} weight">`}</td>${opts.map((_,o)=>`<td>${mode==='ex'?esc(V(`${it.k}_${ci}_${o}`)):`<input class="fld num" type="number" min="1" max="5" data-k="${it.k}_${ci}_${o}" value="${esc(D[`${it.k}_${ci}_${o}`]||'')}" placeholder="1–5" aria-label="${esc(c)} score">`}</td>`).join('')}</tr>`).join('')}
      <tr class="tot"><td><b>Weighted score</b></td><td></td>${tot.map((t,o)=>`<td class="${o===best?'best':''}" data-tot="${o}">${t?t.toFixed(2):'—'}${o===best?' ★':''}</td>`).join('')}</tr></table></div>`; }
  if(it.t==='img'){ if(mode==='ex') return `<div class="fig"><div class="ph">${esc(it.label)}</div><div class="cap">Evidence · ${esc(it.label)}</div></div>`;
    return `<label class="drop">${esc(it.label)} ${it.req?`<span class="req" data-req="${it.slot}">required</span>`:''}<small>Tap to add ${it.multi?'images':'an image'} (PNG or JPG)</small><input type="file" accept="image/*" data-slot="${it.slot}" ${it.multi?'multiple':''} hidden></label><div class="figs" data-figs="${it.slot}"></div>`; }
  if(it.t==='html') return `<div class="guide">${it.html}</div>`;
  return ''; }
const FMT=id=>`<div class="fmt" role="group" aria-label="How this part appears in your file"><button type="button" data-fmt="${id}" data-v="qa" aria-pressed="${fmt(id)==='qa'}">Question &amp; answer</button><button type="button" data-fmt="${id}" data-v="para" aria-pressed="${fmt(id)==='para'}">Paragraphs</button></div>`;
function draw(){
  const root=CFG.root; root.classList.toggle('exmode',mode==='ex');
  root.querySelector('#doc').innerHTML=`<div class="pf-doc">${CFG.sections.map(s=>`<section class="pg ${s.cover?'cover':''} ${s.fmt?fmt(s.id):''}" id="p-${s.id}">
    ${s.cover?`<div><span class="k">${esc(CFG.docTitle)}</span><h1>${F(s.titleKey,s.titlePh,1,'input')}</h1></div>`:`<div class="pg-h"><span class="n">${esc(s.n)}</span><h2>${esc(s.title)}</h2>${s.tag?`<span class="t">${esc(s.tag)}</span>`:''}${s.fmt?FMT(s.id):''}</div>`}
    ${s.howto?`<p class="howto">${s.howto}</p>`:''}${s.items.map(it=>item(it,s)).join('')}${s.wc?`<p class="wc" data-wc="${s.id}"></p>`:''}</section>`).join('')}</div>`;
  root.querySelectorAll('textarea.fld').forEach(grow); drawFigs(); counts(); }
const grow=t=>{ t.style.height='auto'; t.style.height=(t.scrollHeight+2)+'px'; };
function drawFigs(){ if(mode==='ex') return; CFG.root.querySelectorAll('[data-figs]').forEach(box=>{ const sl=box.dataset.figs; const L=IMGS.filter(m=>m.slot===sl);
  box.innerHTML=L.map(m=>`<figure class="fig"><img src="${m.src}" alt=""><div class="cap">Evidence ${IMGS.indexOf(m)+1} ·<input data-cap="${m.id}" value="${esc(m.cap||'')}" placeholder="What it shows, date" aria-label="Caption"></div><button type="button" class="x" data-del="${m.id}" aria-label="Remove">✕</button></figure>`).join(''); });
  CFG.root.querySelectorAll('[data-req]').forEach(r=>{ const ok=IMGS.some(m=>m.slot===r.dataset.req); r.textContent=ok?'added ✓':'required'; r.className='req'+(ok?' ok':''); }); }
function keysOf(s){ return s.items.flatMap(it=>it.t==='q'||it.t==='in'||it.t==='pick'?[it.k]:it.t==='boxes'?it.boxes.flatMap(b=>b.items.map(x=>x[0])):it.t==='table'?Array.from({length:it.rows},(_,r)=>it.cols.map((_,c)=>`${it.k}_${r}_${c}`)).flat():[]); }
function counts(){ let done=0, total=0;
  CFG.sections.forEach(s=>{ const ks=keysOf(s); const n=ks.reduce((a,k)=>a+words(V(k)),0); const w=CFG.root.querySelector(`[data-wc="${s.id}"]`); if(w) w.innerHTML=`<b>${n}</b> words${s.wc>1?` · target ≈ ${s.wc}`:''}`;
    if(s.items.some(it=>it.t!=='html')){ total++; const filled=ks.length?ks.filter(k=>V(k)).length/ks.length:0; const imgOk=s.items.filter(it=>it.t==='img'&&it.req).every(it=>IMGS.some(m=>m.slot===it.slot)); if(filled>=.6&&imgOk) done++; } });
  const p=document.getElementById('prog'); if(p) p.textContent=mode==='edit'?`${done} of ${total} parts complete`:''; }
function matrixRefresh(){ CFG.sections.forEach(s=>s.items.filter(it=>it.t==='matrix').forEach(it=>{ const tot=it.opts.map((_,o)=>score(it,o)); const best=tot.some(x=>x>0)?tot.indexOf(Math.max(...tot)):-1;
  tot.forEach((t,o)=>{ const c=CFG.root.querySelector(`[data-tot="${o}"]`); if(c){ c.textContent=(t?t.toFixed(2):'—')+(o===best?' ★':''); c.className=o===best?'best':''; } }); })); }

/* ---------- output blocks (same words; Q&A or paragraphs) ---------- */
function blocks(){ const o=[];
  CFG.sections.forEach(s=>{ if(s.cover) return; o.push({h:`${s.n} · ${s.title}`}); const f=s.fmt?fmt(s.id):'qa'; const para=[];
    const flush=()=>{ if(para.length){ o.push({p:para.join(' ')}); para.length=0; } };
    s.items.forEach(it=>{
      if(it.t==='q'||it.t==='in'||it.t==='pick'){ const v=V(it.k); if(!v) return; if(f==='para'&&it.t==='q'){ para.push(v); if(/\n/.test(v)||it.brk) flush(); } else { flush(); if(it.t==='q') { o.push({h3:it.label}); v.split(/\n+/).forEach(p=>o.push({p})); } else o.push({p:`${it.label}: ${v}`}); } }
      else if(it.t==='boxes'){ flush(); const B=it.boxes.map(b=>[b.h,b.items.map(([k],i)=>V(k)?`${i+1}. ${V(k)}`:'').filter(Boolean).join('\n')]);
        if(f==='para') B.forEach(([h,t])=>{ if(t) o.push({p:`${h}: `+t.replace(/^\d\. /gm,'').split('\n').join('; ')+'.'}); });
        else { const rows=[]; for(let i=0;i<B.length;i+=2){ rows.push([B[i][0],(B[i+1]||[''])[0]]); rows.push([B[i][1],(B[i+1]||['',''])[1]]); } o.push({table:rows,head:rows.map((_,i)=>i).filter(i=>i%2===0)}); } }
      else if(it.t==='table'){ flush(); const rows=[it.cols]; for(let r=0;r<it.rows;r++){ const row=it.cols.map((_,c)=>V(`${it.k}_${r}_${c}`)); if(row.some(Boolean)) rows.push(row); } if(rows.length>1) o.push({table:rows,head:[0]}); }
      else if(it.t==='matrix'){ flush(); const opts=it.opts.map((k,i)=>V(k)||`Idea ${i+1}`); const rows=[['Criterion','Weight %',...opts]]; it.crit.forEach(([c,w],ci)=>rows.push([c,V(`${it.k}_w${ci}`)||String(w),...opts.map((_,oo)=>V(`${it.k}_${ci}_${oo}`))])); rows.push(['Weighted score','',...opts.map((_,oo)=>{ const t=score(it,oo); return t?t.toFixed(2):''; })]); o.push({table:rows,head:[0]}); }
      else if(it.t==='img'){ flush(); IMGS.filter(m=>m.slot===it.slot).forEach(m=>{ o.push({img:m}); o.push({cap:`Evidence ${IMGS.indexOf(m)+1} · ${m.cap||it.label}`}); }); } });
    flush(); });
  return o; }
function loadDocx(){ return window.docx?Promise.resolve(window.docx):new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='assets/vendor/docx.umd.js'; s.onload=()=>res(window.docx); s.onerror=rej; document.head.appendChild(s); }); }
const coverLines=()=>CFG.coverOut().filter(([a,b])=>b);
async function makeDocx(){
  const d=await loadDocx(); const {Document,Packer,Paragraph,TextRun,HeadingLevel,Table,TableRow,TableCell,WidthType,ImageRun,PageBreak}=d;
  const cell=(t,b)=>new TableCell({children:String(t||'').split('\n').map(x=>new Paragraph({children:[new TextRun({text:x,bold:!!b})]}))});
  const k=[new Paragraph({children:[new TextRun({text:CFG.courseLine||'ENT 141 · Fundamentals of Innovation and Entrepreneurship 1',size:22})],spacing:{before:2000}}),
    new Paragraph({children:[new TextRun({text:CFG.docTitle,bold:true,size:44})],spacing:{after:200}}),
    new Paragraph({children:[new TextRun({text:V(CFG.titleKey)||'',size:30})],spacing:{after:400}})];
  coverLines().forEach(([a,b])=>String(b).split('\n').forEach((line,i)=>k.push(new Paragraph({children:[new TextRun({text:i?'':a+': ',bold:true}),new TextRun(line)],spacing:{after:60}}))));
  k.push(new Paragraph({children:[new PageBreak()]}));
  for(const b of blocks()){
    if(b.h) k.push(new Paragraph({text:b.h,heading:HeadingLevel.HEADING_1,spacing:{before:280,after:120}}));
    else if(b.h3) k.push(new Paragraph({text:b.h3,heading:HeadingLevel.HEADING_3,spacing:{before:160,after:60}}));
    else if(b.p) k.push(new Paragraph({children:[new TextRun(b.p)],spacing:{after:120}}));
    else if(b.cap) k.push(new Paragraph({children:[new TextRun({text:b.cap,italics:true,size:20})],spacing:{after:200}}));
    else if(b.table) k.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:b.table.map((r,i)=>new TableRow({children:r.map(c=>cell(c,b.head.includes(i)))}))}));
    else if(b.img){ const m=b.img, bin=atob(m.src.split(',')[1]), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); const w=Math.min(560,m.w);
      k.push(new Paragraph({children:[new ImageRun({data:u,type:'jpg',transformation:{width:w,height:Math.round(m.h*w/m.w)}})]})); } }
  const doc=new Document({creator:(CFG.course||'ENT 141')+' student',title:CFG.docTitle,styles:{default:{document:{run:{font:'Calibri',size:24}}}},sections:[{children:k}]});
  return dl(await Packer.toBlob(doc),`${CFG.fileName()}.docx`); }
async function dl(blob,name){ const touch=matchMedia('(pointer:coarse)').matches;
  if(touch&&navigator.canShare){ try{ const f=new File([blob],name,{type:blob.type||'application/octet-stream'}); if(navigator.canShare({files:[f]})){ await navigator.share({files:[f],title:name}); return 'shared'; } }catch(e){ if(e&&e.name==='AbortError') return 'cancel'; } }
  const a=document.createElement('a'); a.href=URL.createObjectURL(/\.json$/.test(name)?new Blob([blob],{type:'application/octet-stream'}):blob); a.download=name; a.rel='noopener'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },60000); return 'dl'; }
const INAPP=/MoodleMobile|FBAN|FBAV|Instagram|Line\/|; wv\)/i.test(navigator.userAgent);
function printPDF(){ const r=document.getElementById('print-root');
  const b=blocks().map(x=>x.h?`<h3>${esc(x.h)}</h3>`:x.h3?`<h4>${esc(x.h3)}</h4>`:x.p?`<p>${esc(x.p)}</p>`:x.cap?`<p><i>${esc(x.cap)}</i></p>`:x.img?`<img src="${x.img.src}" alt="">`:x.table?`<table>${x.table.map((row,i)=>`<tr>${row.map(c=>`<${x.head.includes(i)?'th':'td'}>${esc(c).replace(/\n/g,'<br>')}</${x.head.includes(i)?'th':'td'}>`).join('')}</tr>`).join('')}</table>`:'').join('');
  r.innerHTML=`<style>#print-root{font:11pt/1.5 Georgia,serif;color:#000}#print-root h1{font:700 22pt Arial}#print-root h3{font:700 13pt Arial;margin:16pt 0 6pt}#print-root h4{font:700 11pt Arial;margin:8pt 0 2pt}#print-root table{border-collapse:collapse;width:100%;margin:4pt 0 8pt}#print-root td,#print-root th{border:1px solid #888;padding:4pt;vertical-align:top;text-align:left}#print-root img{max-width:100%;max-height:120mm}#print-root .cv{min-height:240mm;display:flex;flex-direction:column;justify-content:center;break-after:page}</style>
  <div class="cv"><p>${esc(CFG.courseLine||'ENT 141 · Fundamentals of Innovation and Entrepreneurship 1')}</p><h1>${esc(CFG.docTitle)}</h1><p style="font-size:14pt">${esc(V(CFG.titleKey))}</p><p>${coverLines().map(([a,b])=>`<b>${esc(a)}:</b> ${esc(b).replace(/\n/g,'<br>')}`).join('<br>')}</p></div>${b}`;
  setTimeout(()=>window.print(),150); }
const done=r=>r==='cancel'?'Not saved.':r==='shared'?'Saved. Choose "Save to Files" (iPhone) or Downloads (Android).':INAPP?'If nothing downloaded, open this page in Safari or Chrome and save again.':'Saved. Check your Downloads folder.';
const msg=t=>{ const m=document.getElementById('msg'); if(!m) return; m.textContent=t; clearTimeout(msg.t); msg.t=setTimeout(()=>m.textContent='',9000); };

function mount(cfg){ CFG=cfg; try{ D=JSON.parse(localStorage.getItem(cfg.key)||'{}')||{}; }catch(e){ D={}; }
  const root=cfg.root;
  root.addEventListener('input',e=>{ const f=e.target.closest('[data-k]'); if(f){ D[f.dataset.k]=f.value; store(); if(f.tagName==='TEXTAREA') grow(f); counts(); matrixRefresh(); return; }
    const c=e.target.closest('[data-cap]'); if(c){ const m=IMGS.find(x=>x.id===c.dataset.cap); if(m){ m.cap=c.value; IDB.put(m); } } });
  root.addEventListener('change',async e=>{ const s=e.target.closest('select[data-k]'); if(s){ D[s.dataset.k]=s.value; store(); counts(); return; }
    const f=e.target.closest('input[type=file][data-slot]'); if(!f) return;
    for(const file of [...f.files]){ try{ const r=await shrink(file); const o={id:'i'+Date.now()+Math.random().toString(36).slice(2,6),slot:f.dataset.slot,src:r.src,w:r.w,h:r.h,cap:'',t:Date.now()}; IMGS.push(o); await IDB.put(o); }catch(x){ msg('That image could not be read. Try a PNG or JPG.'); } }
    f.value=''; drawFigs(); counts(); });
  root.addEventListener('click',e=>{ const b=e.target.closest('[data-fmt]'); if(b){ D['fmt-'+b.dataset.fmt]=b.dataset.v; store(); const sec=b.closest('.pg'); sec.classList.toggle('para',b.dataset.v==='para'); sec.classList.toggle('qa',b.dataset.v==='qa'); sec.querySelectorAll('[data-fmt]').forEach(x=>x.setAttribute('aria-pressed',x===b)); return; }
    const x=e.target.closest('[data-del]'); if(x){ IDB.del(x.dataset.del).then(()=>{ IMGS=IMGS.filter(m=>m.id!==x.dataset.del); drawFigs(); counts(); }); } });
  document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{ mode=b.dataset.m; document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b)); draw(); }));
  const doDocx=async()=>{ msg('Preparing your Word file…'); try{ const r=await makeDocx(); msg(done(r)); }catch(e){ msg('Word export did not work in this browser. Use Print or PDF.'); } };
  document.querySelectorAll('[data-act=docx]').forEach(b=>b.onclick=doDocx);
  document.querySelectorAll('[data-act=pdf]').forEach(b=>b.onclick=printPDF);
  document.querySelectorAll('[data-act=save]').forEach(b=>b.onclick=async()=>{ const r=await dl(new Blob([JSON.stringify({v:1,key:cfg.key,data:D,imgs:IMGS})],{type:'application/json'}),`${cfg.fileName()}.json`); msg(r==='dl'?done(r)+' Open it here later with Open file.':done(r)); });
  document.querySelectorAll('[data-act=open]').forEach(inp=>inp.addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(async t=>{ try{ const o=JSON.parse(t); if(!o||!o.data||(o.key&&o.key!==cfg.key)) throw 0; D=o.data; store(); await IDB.clear(); IMGS=o.imgs||[]; for(const m of IMGS) await IDB.put(m); mode='edit'; document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.m==='edit')); draw(); msg('Opened. Your work is back.'); }catch(x){ msg('This file is not for this page.'); } }); e.target.value=''; }));
  const fixBar=()=>{ const h=document.getElementById('hub'), b=document.getElementById('bar'); if(b) b.style.top=(h?h.offsetHeight:0)+'px'; }; fixBar(); addEventListener('resize',fixBar);
  draw(); IDB.all().then(a=>{ IMGS=a; drawFigs(); counts(); });
  const go=()=>{ const t=location.hash&&document.getElementById(location.hash.slice(1)); if(t) setTimeout(()=>t.scrollIntoView({block:'start'}),100); }; addEventListener('hashchange',go); go(); }
window.DocB={mount,V,esc,set:(k,v)=>{ D[k]=v; store(); draw(); },get:k=>D[k]};
})();
