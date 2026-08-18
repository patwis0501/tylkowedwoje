
const D=window.KUPONY_DATA, X=window.KUPONY_EXTRA, INITIAL=window.KUPONY_INITIAL_STATE;
const KEY='kupony-seria1-state-v5';
const GM_HASH='7d2439f2f022d9f1178192655dbf6eeab0d2f34a2d9aafd63e562e3fa6b879de';
const clone=x=>JSON.parse(JSON.stringify(x));
const roll=n=>1+Math.floor(Math.random()*n);
const fmt=t=>t?new Date(t).toLocaleString('pl-PL'):'—';
const nowISO=()=>new Date().toISOString();
const init=()=>clone(INITIAL);
let S;
try{S=JSON.parse(localStorage.getItem(KEY))||null}catch(e){S=null}
if(!S)S=init();
function migrate(){
  S.version=5;
  S.cards=S.cards||{};
  for(const c of D.cards)if(!S.cards[c.id])S.cards[c.id]={status:'available',usedAt:null};
  S.typeCooldowns=S.typeCooldowns||{};S.effects=S.effects||[];S.history=S.history||[];S.chaosUsed=S.chaosUsed||[];
  S.sacrificeHistory=S.sacrificeHistory||[];S.usageHistory=S.usageHistory||[];S.sealedContracts=S.sealedContracts||[];S.charonSnapshot=S.charonSnapshot||[];
  S.demonic=S.demonic||{};S.demonic.applied=S.demonic.applied||{};S.demonic.mournerResolved=S.demonic.mournerResolved||0;
  S.demonic.mournerAnchor=S.demonic.mournerAnchor??null;S.demonic.runOrDieForced=!!S.demonic.runOrDieForced;S.demonic.mirrorLogs=S.demonic.mirrorLogs||{};
  S.demonic.archive=S.demonic.archive||[];S.demonic.interventionUsed=!!S.demonic.interventionUsed;S.demonic.revealedPool=S.demonic.revealedPool||[];
  S.demonic.stolen=S.demonic.stolen||[];S.demonic.humiliated=S.demonic.humiliated||[];S.demonic.d100History=S.demonic.d100History||[];
}
migrate();
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const log=t=>{S.history.unshift({at:nowISO(),text:t});save();renderAll()};
function statusOf(c){
  const s=S.cards[c.id]||{status:'available'};
  const cd=S.typeCooldowns[c.type];
  if(cd&&new Date(cd)>new Date()&&['available','restored'].includes(s.status||'available'))return'cooldown';
  return s.status||'available';
}
const sl=s=>({available:'Dostępna',used:'Zużyta',sacrificed:'Poświęcona',cooldown:'Cooldown',restored:'Odzyskana',frozen:'Zamrożona',stolen:'Ukradziona',revealed:'Odkryta',burned:'Spalona'})[s]||s;
const isGM=()=>document.body.classList.contains('gm-mode');

function renderStats(){
  const a=D.cards.map(statusOf);
  stats.innerHTML=[
    ['Dostępne',a.filter(x=>x==='available'||x==='restored').length],
    ['Zużyte',a.filter(x=>x==='used').length],
    ['Poświęcone',a.filter(x=>x==='sacrificed').length],
    ['Na CD',a.filter(x=>x==='cooldown').length]
  ].map(x=>`<div class=stat><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
  const used=S.usageHistory.length, sacrificed=S.sacrificeHistory.length;
  playerSummary.innerHTML=`<div><b>Wykorzystane fizycznie:</b> ${used}</div><div><b>Poświęcone:</b> ${sacrificed}</div><div class=hint>Seria I trwa do 13.01.2027 23:59.</div>`;
}
function renderCD(){
  const seen={};
  for(const c of D.cards){const u=S.typeCooldowns[c.type];if(u&&new Date(u)>new Date())seen[c.type]={c,u}}
  const a=Object.values(seen).sort((x,y)=>new Date(x.u)-new Date(y.u));
  cooldownList.innerHTML=a.length?a.map(x=>`<div><b>${esc(x.c.name)}</b> <span class=meta>${x.c.type}</span><div class=hint>do ${fmt(x.u)}</div></div>`).join(''):'<div class=hint>Brak aktywnych cooldownów.</div>';
}
function renderCards(){
  const q=search.value.toLowerCase(),rf=rarityFilter.value,sf=statusFilter.value;
  const a=D.cards.filter(c=>(!q||c.name.toLowerCase().includes(q)||c.id.toLowerCase().includes(q))&&(!rf||c.rarity===rf)&&(!sf||statusOf(c)===sf));
  cardList.innerHTML=a.map(c=>`<article class="card ${c.rarity}"><div class=card-head><div><div class=card-title>${esc(c.name)}</div><div class=meta>${c.id} · ${c.rarity}</div></div><div class=status-${statusOf(c)}>${sl(statusOf(c))}</div></div><div class=effect>${esc(c.effect)}</div><div>${c.cooldownHours?`<span class=badge>CD ${c.cooldownHours>=24?(c.cooldownHours/24)+' dni':c.cooldownHours+'h'}</span>`:''}</div><div class=row style="margin-top:.7rem"><button onclick="openCard('${c.id}')">Otwórz</button></div></article>`).join('');
}
window.openCard=id=>{
  const c=D.cards.find(x=>x.id===id),cd=S.typeCooldowns[c.type], gmButtons=isGM()?`<button onclick="sacrificeCard('${id}')" class=secondary>Poświęć</button><button onclick="setStatus('${id}','frozen')" class=secondary>Zamroź</button><button onclick="setStatus('${id}','stolen')" class=secondary>Ukradnij</button><button onclick="setStatus('${id}','revealed')" class=secondary>Odkryj</button>`:'';
  modalBody.innerHTML=`<h2>${esc(c.name)}</h2><p class=meta>${c.id} · ${c.rarity}</p><p>${esc(c.effect)}</p><p><b>Status:</b> ${sl(statusOf(c))}</p>${cd&&new Date(cd)>new Date()?`<p><b>CD ${c.type} do:</b> ${fmt(cd)}</p>`:''}<div class=row><button onclick="activateCard('${id}')">Aktywuj / zużyj</button>${gmButtons}<button class=secondary onclick="restoreCard('${id}')">Przywróć</button></div>${isGM()?`<div style="margin-top:.8rem"><label>Ręczny CD ${c.type} (h)<input id="cdh-${id}" type=number min=0></label><button class=secondary onclick="manualCD('${id}')">Ustaw</button></div>`:''}`;
  modal.classList.remove('hidden')
};
const closeM=()=>modal.classList.add('hidden');closeModal.onclick=closeM;
window.activateCard=id=>{
  const c=D.cards.find(x=>x.id===id),st=statusOf(c);
  if(['sacrificed','frozen','stolen','burned'].includes(st))return alert(`Karta ma status: ${sl(st)}.`);
  if(S.typeCooldowns[c.type]&&new Date(S.typeCooldowns[c.type])>new Date())return alert(`Typ ${c.type} jest na cooldownie.`);
  S.cards[id].status='used';S.cards[id].usedAt=nowISO();
  S.usageHistory.push({id,type:c.type,name:c.name,at:S.cards[id].usedAt,source:'aktywacja'});
  if(c.cooldownHours)S.typeCooldowns[c.type]=new Date(Date.now()+c.cooldownHours*3600000).toISOString();
  log(`Aktywowano ${c.id} — ${c.name}.`);closeM()
};
window.sacrificeCard=id=>{
  if(!isGM())return;
  const c=D.cards.find(x=>x.id===id);
  S.cards[id].status='sacrificed';
  S.sacrificeHistory.push({id,type:c.type,name:c.name,at:nowISO(),source:'ręczne MG'});
  log(`Poświęcono ${c.id} — ${c.name}.`);closeM()
};
window.restoreCard=id=>{const c=D.cards.find(x=>x.id===id);S.cards[id].status='restored';log(`Przywrócono ${c.id} — ${c.name}.`);closeM()};
window.setStatus=(id,status)=>{if(!isGM())return;const c=D.cards.find(x=>x.id===id);S.cards[id].status=status;log(`Status ${c.id} — ${c.name}: ${sl(status)}.`);closeM()};
window.manualCD=id=>{if(!isGM())return;const c=D.cards.find(x=>x.id===id),h=Number(document.querySelector('#cdh-'+id).value||0);S.typeCooldowns[c.type]=h?new Date(Date.now()+h*3600000).toISOString():null;log(`Ustawiono CD ${c.type}: ${h}h.`);closeM()};

function renderEffects(){
  const a=S.effects.filter(e=>!e.until||new Date(e.until)>new Date());
  const h=a.length?a.map(e=>`<div><b>${esc(e.name)}</b><div class=hint>${e.until?'do '+fmt(e.until):'bez terminu'}${e.note?' · '+esc(e.note):''}</div>${isGM()?`<button class=secondary onclick="endEffect('${e.id}')">Zakończ</button>`:''}</div>`).join(''):'<div class=hint>Brak aktywnych efektów.</div>';
  activeEffects.innerHTML=h;activeEffectsShort.innerHTML=h
}
window.endEffect=id=>{if(!isGM())return;const e=S.effects.find(x=>x.id===id);if(e)e.until=nowISO();log(`Zakończono efekt: ${e?.name||id}.`)};
addEffect.onclick=()=>{if(!isGM())return;const n=effectName.value.trim();if(!n)return;const h=Number(effectHours.value||0);S.effects.push({id:'e'+Date.now(),name:n,note:effectNote.value.trim(),until:h?new Date(Date.now()+h*3600000).toISOString():null});effectName.value='';effectHours.value='';effectNote.value='';log(`Dodano efekt: ${n}.`)};

document.querySelectorAll('[data-roll]').forEach(b=>b.onclick=()=>{const k=b.dataset.roll,v=k==='coin'?(Math.random()<.5?'Orzeł':'Reszka'):roll(Number(k));document.querySelector('#'+(k==='coin'?'coin':'d'+k)+'Result').textContent=v});
let canR=false;
wheelRoll.onclick=()=>{const n=roll(20);wheelResult.innerHTML=`<b>${n}</b><br>${esc(D.wheel[n])}`;canR=true};
wheelReroll.onclick=()=>{if(!canR)return alert('Najpierw wykonaj rzut.');const n=roll(20);wheelResult.innerHTML=`<b>${n}</b><br>${esc(D.wheel[n])}<br><span class=hint>Monkey's Paw: ${esc(D.monkeysPaw[pawSelect.value])}</span>`;canR=false};
pawSelect.onchange=()=>pawText.textContent=D.monkeysPaw[pawSelect.value];pawText.textContent=D.monkeysPaw[pawSelect.value];
goliathRoll.onclick=()=>{const a=roll(10),b=roll(10),dbl=a===b;goliathResult.innerHTML=`d10: <b>${a}</b> i <b>${b}</b>${dbl?' — DUBLET: obie Klątwy anulowane.':`<br>${esc(D.goliath[a])}<br>${esc(D.goliath[b])}`}`};

function renderChaos(){
  chaosNumbers.innerHTML=Array.from({length:20},(_,i)=>i+1).map(n=>`<button class="${S.chaosUsed.includes(n)?'used':''}" onclick="chaos(${n})" ${S.chaosUsed.includes(n)?'disabled':''}>${n}</button>`).join('')
}
window.chaos=n=>{if(S.chaosUsed.includes(n))return;const d=roll(4);S.chaosUsed.push(n);chaosReveal.textContent=`Numer ${n}, d4 = ${d}`;log(`Chaotyczne D4: numer ${n}, d4=${d}.`)};

function renderGloss(){glossary.innerHTML=D.glossary.map(([a,b])=>`<div class=gloss-row><b>${esc(a)}</b>${esc(b)}</div>`).join('')}
function renderHistory(){historyList.innerHTML=S.history.length?S.history.map(h=>`<div class=hist><time>${fmt(h.at)}</time>${esc(h.text)}</div>`).join(''):'<div class=hint>Brak wpisów.</div>'}

function renderGM(){
  if(!isGM())return;
  const statuses=D.cards.map(c=>statusOf(c)), c07=D.cards.filter(c=>c.type==='C-07');
  const c07Pool=c07.filter(c=>['available','restored','cooldown','frozen','revealed'].includes(statusOf(c))).length;
  gmStats.innerHTML=[['Ofiary historyczne',S.sacrificeHistory.length],['Cmentarz',D.cards.filter(c=>statusOf(c)==='sacrificed').length],['C-07 w puli',c07Pool],['DEMONIC aktywne',Object.values(S.demonic.applied).filter(Boolean).length]].map(x=>`<div class=stat><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
  const graves=D.cards.filter(c=>statusOf(c)==='sacrificed');
  cemetery.innerHTML=graves.length?graves.map(c=>`<div class=cemetery-item><b>${c.id} — ${esc(c.name)}</b><div class=hint>${c.rarity}</div><button class=secondary onclick="restoreCard('${c.id}')">Przywróć</button></div>`).join(''):'<div class=hint>Cmentarz jest pusty.</div>';
  const q=(demonicSearch.value||'').toLowerCase(), kind=demonicKind.value;
  demonicList.innerHTML=X.demonic.filter(d=>(!q||d.id.toLowerCase().includes(q)||d.name.toLowerCase().includes(q))&&(!kind||d.kind===kind)).map(d=>`<div class="demonic-card ${S.demonic.applied[d.id]?'applied':''}"><div class=card-head><div><h3>${d.id} — ${esc(d.name)}</h3><div class=window>${esc(d.window)} · ${d.kind}</div></div><b>${S.demonic.applied[d.id]?'AKTYWNY':'—'}</b></div><p>${esc(d.effect)}</p><div class=demonic-actions><button onclick="toggleDemonic('${d.id}')">${S.demonic.applied[d.id]?'Zakończ / wyłącz':'Aktywuj / oznacz'}</button></div></div>`).join('');
  const base=Math.floor(S.sacrificeHistory.length/5), anchor=S.demonic.mournerAnchor??S.sacrificeHistory.length, after=Math.max(0,S.sacrificeHistory.length-anchor), slow=Math.floor(after/25);
  mournerBox.innerHTML=`<div><b>Historia ofiar:</b> ${S.sacrificeHistory.length}</div><div><b>Próg 1/5:</b> ${base} możliwych Klątw</div><div><b>Anchor I-08:</b> ${S.demonic.mournerAnchor==null?'nie ustawiony':S.demonic.mournerAnchor}</div><div><b>Nowe progi 1/25:</b> ${slow}</div>`;
  const ending=X.endings.find(e=>c07Pool>=e.min&&c07Pool<=e.max);
  endingBox.innerHTML=`<div><b>C-07 w puli:</b> ${c07Pool}/45</div><p>${esc(ending?.reward||'—')}</p><div class=hint>Powrót karty nie usuwa jej wcześniejszego wpisu z historii poświęceń.</div>`;
  renderD100Table();
  contracts.innerHTML=S.sealedContracts.length?S.sealedContracts.map((x,i)=>`<div class=contract-item><b>${esc(x.tier||'Kontrakt')}</b><div>Nagroda: ${esc(x.reward||'—')}</div><details><summary>Ujawnij treść</summary><p>${esc(x.task||'')}</p><div class=hint>Zapisano: ${fmt(x.at)}</div></details></div>`).join(''):'<div class=hint>Brak zapieczętowanych kontraktów.</div>';
}
window.toggleDemonic=id=>{if(!isGM())return;S.demonic.applied[id]=!S.demonic.applied[id];log(`${S.demonic.applied[id]?'Aktywowano':'Wyłączono'} DEMONIC ${id}.`)};
function renderD100Table(){
  if(!isGM())return;
  const q=(d100Search.value||'').toLowerCase();
  d100Table.innerHTML=X.d100.filter(x=>!q||String(x.n).includes(q)||x.name.toLowerCase().includes(q)||x.side.toLowerCase().includes(q)).map(x=>`<div class="d100-row ${x.side}"><b>${String(x.n).padStart(2,'0')}</b><span>${x.side}</span><span>${x.power}</span><div><b>${esc(x.name)}</b><div class=hint>${esc(x.effect)}</div></div></div>`).join('')
}
d100Roll.onclick=()=>{if(!isGM())return;const n=roll(100),x=X.d100.find(r=>r.n===n);d100Result.innerHTML=`<b>${n}</b> — ${esc(x.name)}<br><span class=hint>${esc(x.effect)}</span>`;S.demonic.d100History.unshift({at:nowISO(),n,name:x.name,side:x.side});log(`DEMONIC d100: ${n} — ${x.name}.`)};

addContract.onclick=()=>{if(!isGM())return;const tier=contractTier.value.trim(),reward=contractReward.value.trim(),task=contractTask.value.trim();if(!tier||!reward||!task)return alert('Uzupełnij stopień, nagrodę i treść zadania.');S.sealedContracts.unshift({id:'k'+Date.now(),tier,reward,task,at:nowISO(),status:'sealed'});contractTier.value=contractReward.value=contractTask.value='';log(`Zapieczętowano kontrakt ${tier}.`)};

function renderAll(){renderStats();renderCD();renderCards();renderEffects();renderChaos();renderGloss();renderHistory();renderGM()}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{if(b.classList.contains('gm-only')&&!isGM())return;document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelector('#'+b.dataset.tab).classList.add('active')});
[search,rarityFilter,statusFilter].forEach(x=>x.addEventListener(x===search?'input':'change',renderCards));
[demonicSearch,d100Search].forEach(x=>x.addEventListener('input',renderGM));demonicKind.addEventListener('change',renderGM);

exportBtn.onclick=()=>{const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kupony-seria1-backup-v5-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href)};
importInput.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());S=x;migrate();save();renderAll();alert('Stan zaimportowany.')}catch(_){alert('Nieprawidłowy plik.')}};
resetInitial.onclick=()=>{if(!isGM())return;if(confirm('Wczytać stan z załączonego backupu 18.08? Aktualny lokalny stan zostanie zastąpiony.')){S=init();migrate();save();renderAll()}};

async function hashText(s){const data=new TextEncoder().encode(s),buf=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
gmToggle.onclick=()=>{if(isGM()){document.body.classList.remove('gm-mode');modeLabel.textContent='Widok Zuzi • v5';renderAll();return}gmLogin.classList.remove('hidden');gmPinInput.focus()};
closeGm.onclick=()=>gmLogin.classList.add('hidden');
gmLoginBtn.onclick=async()=>{const h=await hashText(gmPinInput.value);if(h!==GM_HASH)return alert('Nieprawidłowy PIN.');gmPinInput.value='';gmLogin.classList.add('hidden');document.body.classList.add('gm-mode');modeLabel.textContent='Tryb MG • v5';renderAll()};
gmPinInput.addEventListener('keydown',e=>{if(e.key==='Enter')gmLoginBtn.click()});

renderAll();
setInterval(()=>{renderStats();renderCD();renderEffects();if(isGM())renderGM()},30000);
