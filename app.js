
const D=window.KUPONY_DATA, KEY='kupony-seria1-state-v1';
const init=()=>({cards:Object.fromEntries(D.cards.map(c=>[c.id,{status:'available',usedAt:null}])),typeCooldowns:{},effects:[],history:[],chaosUsed:[],gm:false,gmPin:null});
let S;try{S=JSON.parse(localStorage.getItem(KEY))||init()}catch(e){S=init()}
if(!S.typeCooldowns)S.typeCooldowns={};
for(const c of D.cards){
  if(!S.cards[c.id])S.cards[c.id]={status:'available',usedAt:null};
  if(S.cards[c.id].cooldownUntil){
    const old=S.cards[c.id].cooldownUntil;
    if(!S.typeCooldowns[c.type] || new Date(old)>new Date(S.typeCooldowns[c.type])) S.typeCooldowns[c.type]=old;
    delete S.cards[c.id].cooldownUntil;
  }
}
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const fmt=t=>t?new Date(t).toLocaleString('pl-PL'):'—';
const log=t=>{S.history.unshift({at:new Date().toISOString(),text:t});save();renderAll()};
const roll=n=>1+Math.floor(Math.random()*n);
function cstate(c){
 const s=S.cards[c.id];
 const cd=S.typeCooldowns[c.type];
 if(cd&&new Date(cd)>new Date()&&['available','restored'].includes(s.status||'available'))return'cooldown';
 return s.status||'available'
}
const sl=s=>({available:'Dostępna',used:'Zużyta',sacrificed:'Poświęcona',cooldown:'Cooldown',restored:'Odzyskana'})[s]||s;

function renderStats(){
 const st=D.cards.map(cstate), a=st.filter(x=>x==='available'||x==='restored').length,u=st.filter(x=>x==='used').length,p=st.filter(x=>x==='sacrificed').length,cd=st.filter(x=>x==='cooldown').length;
 stats.innerHTML=[['Dostępne',a],['Zużyte',u],['Poświęcone',p],['Na CD',cd]].map(x=>`<div class=stat><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
}
function renderCD(){
 const byType={};
 for(const c of D.cards){
   const until=S.typeCooldowns[c.type];
   if(until&&new Date(until)>new Date()) byType[c.type]={c,until};
 }
 const arr=Object.values(byType).sort((a,b)=>new Date(a.until)-new Date(b.until)).slice(0,10);
 cooldownList.innerHTML=arr.length?arr.map(x=>`<div><b>${x.c.name}</b> <span class=meta>${x.c.type}</span><div class=hint>blokuje wszystkie dostępne ${x.c.type} do ${fmt(x.until)}</div></div>`).join(''):'<div class=hint>Brak aktywnych cooldownów.</div>';
}
function renderCards(){
 const q=search.value.toLowerCase(),rf=rarityFilter.value,sf=statusFilter.value;
 const arr=D.cards.filter(c=>(!q||c.name.toLowerCase().includes(q)||c.id.toLowerCase().includes(q))&&(!rf||c.rarity===rf)&&(!sf||cstate(c)===sf));
 cardList.innerHTML=arr.map(c=>{const s=cstate(c),x=S.cards[c.id];return `<article class="card ${c.rarity}"><div class=card-head><div><div class=card-title>${c.name}</div><div class=meta>${c.id} · ${c.rarity}</div></div><div class=status-${s}>${sl(s)}</div></div><div class=effect>${c.effect}</div><div>${c.cooldownHours?`<span class=badge>CD ${c.cooldownHours>=24?(c.cooldownHours/24)+' dni':c.cooldownHours+'h'}</span>`:''}<span class=badge>Seria I</span></div>${S.typeCooldowns[c.type]&&new Date(S.typeCooldowns[c.type])>new Date()?`<div class=hint>Cooldown typu ${c.type} do ${fmt(S.typeCooldowns[c.type])}</div>`:''}<div class=row style="margin-top:.7rem"><button onclick="openCard('${c.id}')">Otwórz</button></div></article>`}).join('')||'<div class=hint>Brak kart.</div>';
}
window.openCard=id=>{const c=D.cards.find(x=>x.id===id),s=S.cards[id],typeCd=S.typeCooldowns[c.type];modalBody.innerHTML=`<h2>${c.name}</h2><p class=meta>${c.id} · ${c.rarity}</p><p>${c.effect}</p><p><b>Status:</b> ${sl(cstate(c))}</p>${typeCd&&new Date(typeCd)>new Date()?`<p><b>CD ${c.type} do:</b> ${fmt(typeCd)}</p>`:''}<div class=row><button onclick="activateCard('${id}')">Aktywuj / zużyj</button><button class=secondary onclick="sacrificeCard('${id}')">Poświęć</button><button class=secondary onclick="restoreCard('${id}')">Przywróć</button></div><div style="margin-top:.8rem"><label>Ręcznie ustaw cooldown dla całego typu ${c.type} od teraz (h)<input id="cdh-${id}" type=number min=0></label><button class=secondary onclick="manualCooldown('${id}')">Ustaw CD typu</button></div>`;modal.classList.remove('hidden')};
window.activateCard=id=>{
 const c=D.cards.find(x=>x.id===id),s=S.cards[id];
 if(S.typeCooldowns[c.type]&&new Date(S.typeCooldowns[c.type])>new Date()) return alert(`Typ ${c.type} jest na cooldownie do ${fmt(S.typeCooldowns[c.type])}.`);
 s.status='used';s.usedAt=new Date().toISOString();
 if(c.cooldownHours)S.typeCooldowns[c.type]=new Date(Date.now()+c.cooldownHours*3600000).toISOString();
 log(`Aktywowano ${c.id} — ${c.name}. Cooldown ustawiono dla całego typu ${c.type}.`);closeM()
};
window.sacrificeCard=id=>{const c=D.cards.find(x=>x.id===id);S.cards[id].status='sacrificed';log(`Poświęcono ${c.id} — ${c.name}.`);closeM()};
window.restoreCard=id=>{const c=D.cards.find(x=>x.id===id);S.cards[id].status='restored';log(`Przywrócono ${c.id} — ${c.name} do puli.`);closeM()};
window.manualCooldown=id=>{const c=D.cards.find(x=>x.id===id),h=Number(document.querySelector('#cdh-'+id).value||0);S.typeCooldowns[c.type]=h?new Date(Date.now()+h*3600000).toISOString():null;log(`Ustawiono CD typu ${c.type}: ${h}h.`);closeM()};
const closeM=()=>modal.classList.add('hidden');closeModal.onclick=closeM;

function renderEffects(){const a=S.effects.filter(e=>!e.until||new Date(e.until)>new Date());const h=a.length?a.map(e=>`<div><b>${e.name}</b><div class=hint>${e.until?'do '+fmt(e.until):'bez terminu'}${e.note?' · '+e.note:''}</div><button class=secondary onclick="endEffect('${e.id}')">Zakończ</button></div>`).join(''):'<div class=hint>Brak aktywnych efektów.</div>';activeEffects.innerHTML=h;activeEffectsShort.innerHTML=h}
window.endEffect=id=>{const e=S.effects.find(x=>x.id===id);if(e)e.until=new Date().toISOString();log(`Zakończono efekt: ${e?.name||id}.`)};
addEffect.onclick=()=>{const n=effectName.value.trim();if(!n)return;const h=Number(effectHours.value||0),note=effectNote.value.trim();S.effects.push({id:'e'+Date.now(),name:n,note,until:h?new Date(Date.now()+h*3600000).toISOString():null});effectName.value='';effectHours.value='';effectNote.value='';log(`Dodano efekt: ${n}${h?' na '+h+'h':''}.`)};

document.querySelectorAll('[data-roll]').forEach(b=>b.onclick=()=>{const k=b.dataset.roll,v=k==='coin'?(Math.random()<.5?'Orzeł':'Reszka'):roll(Number(k));document.querySelector('#'+(k==='coin'?'coin':'d'+k)+'Result').textContent=v});
let wheelCanReroll=false;
wheelRoll.onclick=()=>{const n=roll(20);wheelResult.innerHTML=`<b>${n}</b><br>${D.wheel[n]}`;wheelCanReroll=true;wheelReroll.disabled=false;log(`Wheel of Fortune: ${n} — ${D.wheel[n]}`)};
wheelReroll.onclick=()=>{if(!wheelCanReroll)return;const n=roll(20),p=pawSelect.value;wheelResult.innerHTML=`<b>${n}</b><br>${D.wheel[n]}<br><span class=hint>Monkey's Paw ${p}: ${D.monkeysPaw[p]}</span>`;wheelCanReroll=false;wheelReroll.disabled=true;log(`Wheel przerzut: ${n}; Monkey's Paw ${p}: ${D.monkeysPaw[p]}`)};
pawSelect.onchange=()=>pawText.textContent=D.monkeysPaw[pawSelect.value];pawText.textContent=D.monkeysPaw.I;wheelReroll.disabled=true;

goliathRoll.onclick=()=>{const a=roll(10),b=roll(10);if(a===b){goliathResult.innerHTML=`Dublet <b>${a}/${b}</b>. Obie Klątwy się anulują.<br><b>Kamienna Skorupa 72h.</b>`;log(`Goliat: dublet ${a}/${b}, brak Klątw; Skorupa 72h.`)}else{goliathResult.innerHTML=`<b>${a}</b>: ${D.goliath[a]}<br><b>${b}</b>: ${D.goliath[b]}<br><b>Potem Kamienna Skorupa 72h.</b>`;log(`Goliat: Klątwy ${a} i ${b}; Skorupa 72h.`)}};

function renderChaos(){chaosNumbers.innerHTML=Array.from({length:20},(_,i)=>i+1).map(n=>`<button class="secondary ${S.chaosUsed.includes(n)?'used':''}" ${S.chaosUsed.includes(n)?'disabled':''} onclick="chaosPick(${n})">${n}</button>`).join('')}
window.chaosPick=n=>{const c=D.chaos[n],d=roll(4);S.chaosUsed.push(n);chaosReveal.innerHTML=`Numer <b>${n}</b>: <b>${c.nature}</b><br>d4 = <b>${d}</b><br>${c.effects[d-1]}`;log(`Chaotic D4: ${n} (${c.nature}), d4=${d}: ${c.effects[d-1]}`);renderChaos()};

function renderGloss(){glossary.innerHTML=D.glossary.map(([a,b])=>`<div class=gloss-row><b>${a}</b>${b}</div>`).join('')}
function renderHistory(){historyList.innerHTML=S.history.length?S.history.map(h=>`<div class=hist><time>${fmt(h.at)}</time>${h.text}</div>`).join(''):'<div class=hint>Brak wpisów.</div>'}
function renderGM(){if(!S.gm)return;const ib=D.cards.filter(c=>c.type==='C-07'&&['available','restored'].includes(S.cards[c.id].status)).length;inBlancoSecret.innerHTML=`<p>Pozostałe: <b>${ib}/45</b></p>`+Object.entries(D.secretRules.inBlanco).map(([k,v])=>`<div class=gloss-row><b>${k}</b>${v}</div>`).join('');chaosSecret.innerHTML=Object.entries(D.chaos).map(([n,c])=>`<div class=gloss-row><b>${n} — ${c.nature}</b>${c.effects.map((e,i)=>`${i+1}: ${e}`).join(' · ')}</div>`).join('')}
function renderAll(){renderStats();renderCD();renderCards();renderEffects();renderChaos();renderGloss();renderHistory();renderGM()}

document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelector('#'+b.dataset.tab).classList.add('active')});
[search,rarityFilter,statusFilter].forEach(x=>x.addEventListener(x===search?'input':'change',renderCards));

modeBtn.onclick=()=>{if(S.gm){S.gm=false;document.querySelectorAll('.gm-only').forEach(x=>x.classList.add('hidden'));modeBtn.textContent='Tryb MG';save();return}if(!S.gmPin){const p=prompt('Ustaw PIN MG (minimum 4 znaki):');if(!p||p.length<4)return alert('PIN musi mieć minimum 4 znaki.');S.gmPin=p}else{const p=prompt('PIN MG:');if(p!==S.gmPin)return alert('Nieprawidłowy PIN.')}S.gm=true;save();document.querySelectorAll('.gm-only').forEach(x=>x.classList.remove('hidden'));modeBtn.textContent='Wyłącz MG';renderGM()};

exportBtn.onclick=()=>{const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kupony-seria1-backup.json';a.click();URL.revokeObjectURL(a.href)};
importInput.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{S=JSON.parse(await f.text());save();renderAll();alert('Stan zaimportowany.')}catch(_){alert('Nieprawidłowy plik.')}};
if(S.gm){document.querySelectorAll('.gm-only').forEach(x=>x.classList.remove('hidden'));modeBtn.textContent='Wyłącz MG'}
renderAll();setInterval(()=>{renderStats();renderCD();renderEffects()},30000);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
