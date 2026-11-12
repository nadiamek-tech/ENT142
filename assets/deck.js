/* ENT 142 · slide-deck guide engine with write-on templates (Project 2, Activity 2).
   Deck.mount({slides:[{nav, one, html, after(el)}], key:'storage key'})
   Deck.field(id, {ph, rows, ex})   a write-on box saved in this browser; ex = example text shown in Example mode
   Deck.doc(title, parts)           downloads a Word-compatible .doc file */
(function(){
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let KEY='ent142-deck', DATA={};
const load=()=>{ try{ DATA=JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ DATA={}; } };
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(DATA)); }catch(e){} };
const get=id=>DATA[id]||'';
function field(id,{ph='',rows=2,ex='',big=false}={}){
  return `<div class="wf${big?' big':''}"><textarea class="wf-in" data-f="${id}" rows="${rows}" placeholder="${esc(ph)}" aria-label="${esc(ph)}">${esc(get(id))}</textarea><div class="wf-ex">${esc(ex)}</div></div>`;
}
function words(t){ return (String(t).trim().match(/\S+/g)||[]).length; }
function doc(title,parts){
  const body=parts.map(([h,t])=>`<h2>${esc(h)}</h2>${String(t||'').split(/\n+/).map(p=>`<p>${esc(p)}</p>`).join('')}`).join('');
  const html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.5}h1{font-size:20pt}h2{font-size:14pt;margin-top:18pt}</style></head><body><h1>${esc(title)}</h1>${body}</body></html>`;
  const blob=new Blob(['﻿',html],{type:'application/msword'}), name=title.replace(/[^\w\- ]+/g,'').replace(/\s+/g,'_')+'.doc';
  if(matchMedia('(pointer:coarse)').matches&&navigator.canShare){ try{ const f=new File([blob],name,{type:blob.type}); if(navigator.canShare({files:[f]})){ navigator.share({files:[f],title:name}).catch(()=>{}); return; } }catch(e){} }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },60000);
}
function mount({slides,key,onInput,all}){
  KEY=key; load();
  const deck=document.getElementById('deck'), dots=document.getElementById('dots');
  deck.innerHTML=slides.map((s,i)=>`<section class="sl-f${s.one?' one':''}" id="s${i}" aria-label="Slide ${i+1} of ${slides.length}">${s.html()}</section>`).join('');
  dots.innerHTML=slides.map((s,i)=>`<button type="button" class="${s.part?'part':''}" data-i="${i}" title="${esc(s.nav)}" aria-label="Slide ${i+1}: ${esc(s.nav)}">${s.part||'•'}</button>`).join('');
  const secs=[...deck.children]; let cur=0;
  if(all){ deck.classList.add('all'); const nv=document.querySelector('.dnav'); if(nv) nv.remove();
    const bar=document.createElement('nav'); bar.className='allnav'; bar.setAttribute('aria-label','Parts');
    bar.innerHTML=slides.map((s,i)=>`<a href="#s${i}">${esc(s.part?'Part '+s.part:s.nav)}</a>`).join(''); deck.before(bar);
    secs.forEach((sec,i)=>{ sec.classList.add('on'); if(slides[i].after) slides[i].after(sec); });
    const jump=i=>{ const t=secs[i]; if(t) t.scrollIntoView({behavior:'smooth',block:'start'}); };
    deck.addEventListener('click',e=>{ const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); jump(+g.dataset.go); }
      const x=e.target.closest('[data-mode]'); if(x){ const sec=x.closest('.sl-f'); const ex=x.dataset.mode==='ex'; sec.classList.toggle('show-ex',ex); sec.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.mode==='ex')===ex)); }
      const a=e.target.closest('[data-ask]'); if(a&&window.ENT142Assistant) ENT142Assistant.open(a.dataset.ask); });
    deck.addEventListener('input',e=>{ const t=e.target.closest('[data-f]'); if(!t) return; DATA[t.dataset.f]=t.value; save(); if(onInput) onInput(DATA,t); });
    const m=location.hash.match(/^#s(\d+)$/); if(m) setTimeout(()=>jump(+m[1]),120);
    if(onInput) onInput(DATA,null);
    return {go:jump,data:()=>DATA}; }
  function go(i,push){ if(i<0||i>=slides.length) return; cur=i; secs.forEach((s,k)=>s.classList.toggle('on',k===i));
    if(slides[i].after) slides[i].after(secs[i]);
    dots.querySelectorAll('button').forEach((b,k)=>b.classList.toggle('on',k===i));
    document.getElementById('pos').textContent=(i+1)+' / '+slides.length;
    document.querySelector('.dnav .prev').disabled=i===0; document.querySelector('.dnav .next').disabled=i===slides.length-1;
    if(push!==false) try{ history.replaceState(null,'','#s'+i); }catch(e){} window.scrollTo({top:0}); }
  document.querySelector('.dnav .prev').addEventListener('click',()=>go(cur-1));
  document.querySelector('.dnav .next').addEventListener('click',()=>go(cur+1));
  dots.addEventListener('click',e=>{ const b=e.target.closest('button'); if(b) go(+b.dataset.i); });
  deck.addEventListener('click',e=>{ const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); go(+g.dataset.go); }
    const x=e.target.closest('[data-mode]'); if(x){ const sec=x.closest('.sl-f'); const ex=x.dataset.mode==='ex'; sec.classList.toggle('show-ex',ex);
      sec.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.mode==='ex')===ex)); }
    const a=e.target.closest('[data-ask]'); if(a&&window.ENT142Assistant) ENT142Assistant.open(a.dataset.ask); });
  deck.addEventListener('input',e=>{ const t=e.target.closest('[data-f]'); if(!t) return; DATA[t.dataset.f]=t.value; save();
    deck.querySelectorAll(`[data-f="${t.dataset.f}"]`).forEach(o=>{ if(o!==t) o.value=t.value; }); if(onInput) onInput(DATA,t); });
  document.addEventListener('keydown',e=>{ if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return; if(e.key==='ArrowRight') go(cur+1); if(e.key==='ArrowLeft') go(cur-1); });
  let tx=null; deck.addEventListener('touchstart',e=>{ if(e.target.closest('textarea')) return; tx=e.touches[0].clientX; },{passive:true});
  deck.addEventListener('touchend',e=>{ if(tx==null) return; const d=e.changedTouches[0].clientX-tx; if(Math.abs(d)>70) go(cur+(d<0?1:-1)); tx=null; });
  const fromHash=()=>{ const m=location.hash.match(/^#s(\d+)$/); go(m?Math.min(+m[1],slides.length-1):0,false); };
  window.addEventListener('hashchange',fromHash); fromHash();
  if(onInput) onInput(DATA,null);
  return {go,data:()=>DATA};
}
window.Deck={mount,field,doc,words,esc,data:()=>DATA,get};
})();
