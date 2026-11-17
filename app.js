
const D=window.LOS.data;
const $=i=>document.getElementById(i),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const AR=id=>D.areas.find(a=>a.id==id)||D.areas[0];
const pad=n=>String(n).padStart(2,'0'),iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const TODAY=new Date();TODAY.setHours(0,0,0,0);const T0=iso(TODAY);
const P=s=>{const[a,b,c]=s.split('-');return new Date(+a,b-1,+c)};
const days=s=>Math.round((P(s)-TODAY)/864e5);
const WD=['So','Mo','Di','Mi','Do','Fr','Sa'],MO=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const WDL=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],MOL=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const fd=s=>{const d=P(s);return WD[d.getDay()]+' '+pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'};
const monday=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
const WK=iso(monday(TODAY));
function shift(s){const ex=D.shifts.exc[s];const d=P(s),wd=d.getDay();if(ex)return ex;if(wd==0||wd==6)return 'frei';
 const w=Math.round((monday(d)-P(D.shifts.base))/(7*864e5));return(Math.abs(w)%2==0)?D.shifts.baseType:(D.shifts.baseType=='früh'?'spät':'früh')}
const SH={früh:['Frühschicht','fr','6:00–14:30'],spät:['Spätschicht','sp','ab 13 Uhr, ~23 Uhr zu Hause'],urlaub:['Urlaub','ur','frei'],frei:['Wochenende','ur','frei'],tag:['Tagschicht','fr','9–17 Uhr']};
const PG={läuft:['▶ Läuft','LÄUFT',['läuft']],queue:['⏳ Warteschlange','WARTESCHLANGE',['bald','idee']],steht:['⏸ Steht gerade','STEHT GERADE',['pause']],fertig:['✓ Fertig','FERTIG',['fertig']]};
const SEC2A={musik:'musik',studio:'lernen',social:'musik',karriere:'musik',ki:'projekte',leben:'ich',labor:'labor'};
const PA=p=>p.a||SEC2A[p.sec]||'projekte';
const RATE=[[1,'😞','Gar nicht'],[2,'😕','Eher nicht'],[3,'😐','Geht so'],[4,'🙂','Zufrieden'],[5,'🤩','Richtig gut']];
const remo=n=>(RATE.find(r=>r[0]==n)||[0,'·'])[1];
const rated=aid=>(D.projects||[]).filter(p=>p.st=='fertig'&&p.rate&&PA(p)==aid);
function areaRecalc(aid){const R=rated(aid),a=D.areas.find(x=>x.id==aid);if(a&&R.length)a.s=Math.round(R.reduce((s,p)=>s+p.rate,0)/R.length*2)}
const PGC=(k,t)=>({läuft:t.ok,steht:t.mu,queue:t.amb,fertig:t.cy})[k];
const PJ=k=>{const O={bald:0,idee:1};return (D.projects||[]).filter(p=>PG[k][2].includes(p.st)).sort((a,b)=>k=='fertig'?(b.done||'').localeCompare(a.done||''):(O[a.st]??0)-(O[b.st]??0))};
const REP={monat:['monatlich',1],woche:['wöchentlich',0]};
const nextDate=r=>{const d=new Date(TODAY);if(r=='woche')d.setDate(d.getDate()+7);else d.setMonth(d.getMonth()+1);return iso(d)};
const sleeping=t=>t.rep&&t.d&&days(t.d)>3;
function tick(t){if(t.rep&&!t.done){t.d=nextDate(t.rep);t.last=T0;return true}t.done=!t.done;if(t.done)t.at=T0;return false}
const open=()=>D.todos.filter(t=>!t.done&&!sleeping(t));
const score=()=>Math.round(D.areas.reduce((s,a)=>s+a.s,0)/D.areas.length*10);
let view=(location.hash||'#start').slice(1);

/* ---------- Finanzen ---------- */
const CATS={"Wohnen":"#7aa7ff","Musik":"#b98cff","Mobilität":"#5ef2c9","Abos":"#ffb36b","Handy & Internet":"#4fd1e8","Lebensmittel":"#ffe36b","Versicherungen":"#ff8fb0","Sonstiges":"#a59cc4"};
const eur=n=>(n||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const curM=new Date().getFullYear()*12+new Date().getMonth();
const mIdx=b=>{const[y,m]=b.split('-').map(Number);return y*12+m-1};
const left=x=>x.bis?mIdx(x.bis)-curM+1:null,ended=x=>x.bis&&left(x)<=0,active=x=>x.on&&!ended(x);
const fmtBis=b=>{const[y,m]=b.split('-');return MO[+m-1]+' '+y};
const plusM=n=>{const t=curM+n-1;return Math.floor(t/12)+'-'+pad(t%12+1)};
const fsum=l=>l.filter(active).reduce((a,x)=>a+(+x.b||0),0);
function ftot(){const F=D.fin,e=fsum(F.einnahmen),a=fsum(F.monat),j=fsum(F.jaehrlich)/12;return{e,a,j,r:e-a-j}}
let ftab='monat';

function render(){
 const h=new Date().getHours(),gr=h<5?'Gute Nacht':h<11?'Guten Morgen':h<17?'Hallo':h<22?'Guten Abend':'Gute Nacht';
 const S=SH[shift(T0)]||SH.frei;
 const nx=D.events.filter(e=>days(e.d)>=0&&e.gig).sort((a,b)=>a.d.localeCompare(b.d))[0];
 const views=[['start','Home'],['todos','To-dos'],['kalender','Kalender'],['finanzen','Finanzen'],['musik','Musik'],['projekte','Projekte']];
 if(!views.some(v=>v[0]==view))view='start';
 const st=shift(T0);
 $('root').innerHTML=`<div class="topbar"><div class="brand"><i></i>LIFE OS <span>// DASHBOARD</span></div>
 <nav>${views.map(v=>`<a href="#${v[0]}" class="${view==v[0]?'on':''}">${v[1]}</a>`).join('')}</nav>
 <div class="status"><span class="${S[1]}">● ${S[0]}</span>${nx?`<span>GIG <b>${esc(nx.t.split(/[,–]/)[0].trim())}</b> · ${days(nx.d)}T</span>`:''}<button class="pill cld" id="cld">${LOS.badge()}</button><button class="pill" id="dsg"><i></i>Design</button></div></div>
 <div class="panel sess"><h2><span><i class="ico">◉</i>// Session</span><span>${WDL[TODAY.getDay()]} · ${pad(TODAY.getDate())}.${pad(TODAY.getMonth()+1)}.${TODAY.getFullYear()}</span></h2>
 <div class="greet">${gr}, <em>Kevin.</em></div>
 ${(view=='projekte'||view=='ideen')?`<div class="quick psrch"><input id="pq" placeholder="🔍 Projekte durchsuchen: Stichwort eintippen, z. B. Ableton …" value="${esc(pq)}" autocomplete="off"><div id="psug" class="psug"></div></div><div class="hint">Sucht live in Namen und Beschreibungen aller Projekte – Vorschlag antippen öffnet das Projekt.</div>`:`<div class="quick"><input id="qi" placeholder="Smart Capture: Termin, To-do, Ziel oder Idee eintippen & Enter …"><button class="btn" id="qb">Capture</button></div><div class="hint" id="qh">Erkennt automatisch, ob es ein Termin, To-do oder eine Idee ist – und legt es im richtigen Bereich ab.</div>`}</div>
 <div id="v" class="mt"></div>`;
 $('dsg').onclick=designSheet;$('cld').onclick=()=>LOS.panel();
 if($('qi')){$('qb').onclick=quick;$('qi').onkeydown=e=>{if(e.key=='Enter')quick()}}
 if($('pq')){$('pq').oninput=e=>{pq=e.target.value;projSug()};$('pq').onfocus=projSug;$('pq').onblur=()=>setTimeout(()=>{const bx=$('psug');if(bx)bx.style.display='none'},150);$('pq').onkeydown=e=>{if(e.key=='Escape'){pq='';e.target.value='';projSug();e.target.blur()}}}
 ({start:vStart,todos:vTodos,kalender:vCal,finanzen:vFin,musik:vMusik,projekte:vProj,ideen:vProj})[view]();
}
window.onhashchange=()=>{view=(location.hash||'#start').slice(1);render();window.scrollTo(0,0)};


/* ---------- Farben (Farbwähler) ---------- */
const DEF={bg:'#040a0e',panel:'#0e161b',item:'#121c22',line:'#1c2a30',br:'#3b4b53',tx:'#e8f1f4',mu:'#5d7178',cy:'#4db7df',cy2:'#87b8a8',amb:'#e6c273',ok:'#4fae6e',p1:'#d97a7a',p2:'#8fd1b4',p3:'#7fb8e6',
 hub:{musik:'#e05a5a',projekte:'#7fd3c4',finanzen:'#4fc28a',todos:'#e8a04a',kalender:'#a98bea',leben:'#4db7df',warten:'#e39ab8'}};
const PRESETS={
 'Dominik':{},
 'Gold Night':{cy:'#e6c273',cy2:'#e6c273',amb:'#4db7df',br:'#4a4636',line:'#2a2a24',panel:'#12120f',bg:'#080806',item:'#191813'},
 'Matrix':{cy:'#4fd18b',cy2:'#9fe0b5',amb:'#c8f06a',br:'#2f4a3a',line:'#173022',panel:'#0b1510',bg:'#030805',item:'#0f1d15',ok:'#4fd18b'},
 'Sunset':{cy:'#ff8a5c',cy2:'#f3b27a',amb:'#ffd36b',br:'#4d3a36',line:'#2b201e',panel:'#161012',bg:'#0a0607',item:'#1d1517'},
 'Ice':{cy:'#9fd8ff',cy2:'#c7e6f5',amb:'#ffffff',br:'#41505c',line:'#1f2a33',panel:'#0d141a',bg:'#05090d',item:'#131c24'}};
const TH=()=>{const t=D.theme||{};return Object.assign({},DEF,t,{hub:Object.assign({},DEF.hub,t.hub||{})})};
function rgb(c){const n=parseInt(c.slice(1),16);return `${n>>16},${n>>8&255},${n&255}`}
function applyTheme(){const t=TH(),s=document.documentElement.style;['bg','panel','item','line','br','tx','mu','cy','cy2','amb','ok','p1','p2','p3'].forEach(k=>s.setProperty('--'+k,t[k]));s.setProperty('--cyRGB',rgb(t.cy));s.setProperty('--red',t.p1);s.setProperty('--ac2',t.p2)}
const PC=p=>TH()['p'+p]||TH().p2;
function hexA(c,a){const n=parseInt(c.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`}
const ACOL={musik:'#b3a1f0',lernen:'#7fb8e6',projekte:'#7fd3c4',labor:'#8fd1b4',finanzen:'#e6c273',gesundheit:'#e0a372',ich:'#e39ab8',liebe:'#d97a7a',familie:'#e8b48a',zukunft:'#93a8e8'};
let capArea=null;

/* ---------- Neural Nexus (Netz wie bei Dominik) ---------- */
const NX={sel:null,k:0,hits:[],last:0,hover:null,dust:Array.from({length:70},()=>[Math.random(),Math.random(),Math.random()*6,Math.random()*.6+.2])};
const ease=v=>v<.5?2*v*v:1-Math.pow(-2*v+2,2)/2;
const short=(s,n)=>{s=String(s).replace(/^[^\wÄÖÜäöü]+/u,'').trim();return s.length>n?s.slice(0,n-1)+'…':s};
const todayIdx=(TODAY.getDay()+6)%7;
const habDone=h=>!!((D.hlog[WK]||{})[h.id]||[])[todayIdx];
function MODS(){const t=TH(),H=t.hub,o=open(),ev=D.events.filter(e=>days(e.e||e.d)>=0).sort((a,b)=>a.d.localeCompare(b.d)),f=ftot(),
 gig=ev.find(e=>e.gig),hd=D.habits.filter(habDone).length,gAvg=Math.round(D.goals.reduce((s,g)=>s+g.p,0)/(D.goals.length||1)),low=[...D.areas].sort((a,b)=>a.s-b.s);
 const K=id=>(D.kpis.find(k=>k.id==id)||{}).v||'–';
 return [
 {id:'musik',n:'MUSIK',c:H.musik,pos:[-.36,-.68],sub:gig?`Gig in ${days(gig.d)} T.`:'Studio',kids:[{n:'TRACKS',s:(D.tracks||[]).length+' in Arbeit'},{n:'INSTAGRAM',s:K('ig')},{n:'BEATPORT',s:K('bp')},{n:'NÄCHSTER GIG',s:gig?short(gig.t.split(/[,–]/)[0],14)+' · '+days(gig.d)+' T.':'–'}],
  items:()=>[...(D.tracks||[]).map(x=>({t:'♫ '+x.t+(x.with?' · '+x.with:''),s:x.next||'',c:H.musik,go:()=>trackSheet(x.id)})),...D.events.filter(e=>(e.gig||e.dl)&&days(e.d)>=0).map(e=>({t:e.t,s:fd(e.d),c:e.gig?H.musik:t.p1,go:()=>evSheet(e.id)})),...D.kpis.map(k=>({t:k.l+': '+k.v,s:k.s,c:H.musik,go:()=>kpiSheet(k.id)}))]},
 {id:'projekte',n:'PROJEKTE',c:H.projekte,pos:[.36,-.68],sub:PJ('läuft').length+' laufen',kids:Object.keys(PG).map(k=>({n:PG[k][1],s:PJ(k).length+' Projekte',c:PGC(k,t),f:k})),
  items:()=>{const G=Object.keys(PG);if(!PG[NX.sub])return G.map(k=>({t:PG[k][0],s:PJ(k).length+' Projekte',c:PGC(k,t),go:()=>{NX.sub=k}}));
   const L=PJ(NX.sub).map(p=>({t:p.t,s:NX.sub=='fertig'?(p.rate?remo(p.rate)+' ':'☆ ')+short(p.rate?(p.lesson||'fertig'+(p.done?' · '+fd(p.done):'')):'Noch nicht bewertet – antippen',30):short((NX.sub=='queue'?PST[p.st][0]+(p.next?' · ':''):'')+(p.next||''),($('nexus')?.clientWidth||900)<560?30:34),c:p.st=='läuft'?t.ok:p.st=='bald'?t.cy:p.st=='idee'?t.amb:t.mu,go:()=>projSheet(p.id)}));
   const out=L.length?L.slice(0,14):[{t:'Gerade nichts hier',s:'',c:t.mu,go:()=>{NX.sub=null}}];if(L.length>14)out.push({t:'+ '+(L.length-14)+' weitere',s:'alle anzeigen',c:H.projekte,go:()=>{location.hash='#projekte'}});
   return out}},
 {id:'finanzen',n:'FINANZEN',c:H.finanzen,pos:[.84,-.1],sub:Math.round(f.r)+' € frei',kids:[{n:'BLEIBT',s:Math.round(f.r)+' €'},{n:'FIXKOSTEN',s:Math.round(f.a)+' €'},{n:'RATEN',s:D.fin.monat.filter(x=>x.bis&&active(x)).length+' laufend'},{n:'EINNAHMEN',s:Math.round(f.e)+' €'}],
  items:()=>D.fin.monat.filter(active).sort((a,b)=>b.b-a.b).slice(0,9).map(x=>({t:x.name,s:eur(x.b),c:H.finanzen,go:()=>{location.hash='#finanzen'}}))},
 {id:'todos',n:'TO-DOS',c:H.todos,pos:[.56,.58],sub:o.length+' offen',kids:[1,2,3].map(p=>({n:['','HOCH','MITTEL','NIEDRIG'][p],s:o.filter(x=>x.p==p).length+' offen',c:PC(p),f:p})).concat([{n:'FÄLLIG',s:o.filter(x=>x.d&&days(x.d)<=2).length+' in 2 Tagen',c:t.p1,f:'due'}]),
  items:()=>{const L=[...D.todos.filter(x=>(!x.done||x._just)&&!sleeping(x)&&(!NX.sub||(NX.sub=='due'?(x.d&&days(x.d)<=2):x.p==NX.sub)))].sort((a,b)=>a.p-b.p||(a.d||'9').localeCompare(b.d||'9')).map(x=>({t:x.t,s:x.d?fd(x.d):'',c:PC(x.p),done:x.done,todo:x.id}));const out=L.slice(0,15);if(L.length>15)out.push({t:'+ '+(L.length-15)+' weitere',s:'alle anzeigen',c:H.todos,go:()=>{location.hash='#todos'}});return out.concat([{add:1}])}},
 {id:'kalender',n:'KALENDER',c:H.kalender,pos:[-.6,.52],sub:ev.filter(e=>days(e.d)==0||(e.e&&days(e.d)<=0)).length+' heute',kids:[{n:'HEUTE',s:ev.filter(e=>days(e.d)<=0).length+' Termine'},{n:'7 TAGE',s:ev.filter(e=>days(e.d)<=7).length+' Events'},{n:'SCHICHT',s:(SH[shift(T0)]||SH.frei)[0]}],
  items:()=>ev.slice(0,10).map(e=>({t:e.t,s:fd(e.d),c:e.gig?H.musik:e.dl?t.p1:H.kalender,go:()=>evSheet(e.id)}))},
 {id:'warten',n:'WARTE AUF',c:H.warten,pos:[0,.74],sub:(D.waits||[]).length+' offen',kids:[...(D.waits||[])].sort((a,b)=>(a.since||'9').localeCompare(b.since||'9')).slice(0,3).map(w=>({n:short(w.who,12).toUpperCase(),s:w.since?'seit '+since(w.since)+' T.':'seit ?'})),
  items:()=>(D.waits||[]).map(w=>({t:w.who+': '+w.what,s:w.since?'seit '+since(w.since)+' T.':'',c:H.warten,go:()=>waitSheet(w.id)}))},
 {id:'leben',n:'LEBEN',c:H.leben,pos:[-.86,-.1],sub:`Score ${score()}`,kids:low.slice(0,4).map(a=>({n:a.n.toUpperCase().slice(0,12),s:a.s+'/10',c:a.c})),
  items:()=>D.areas.map(a=>({t:a.n,s:a.s+'/10'+(rated(a.id).length?' · aus '+rated(a.id).length+' Projekt'+(rated(a.id).length>1?'en':''):'')+' · '+open().filter(x=>x.a==a.id).length+' offen',c:a.c,area:a.id}))}]}
function hexPath(x,cx,cy,r){x.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;const px=cx+r*Math.cos(a),py=cy+r*Math.sin(a);i?x.lineTo(px,py):x.moveTo(px,py)}x.closePath()}
function hexNode(x,X,Y,r,c,al,t,seed,big){const pul=.85+.15*Math.sin(t/900+seed);
 const g=x.createRadialGradient(X,Y,0,X,Y,r*2.6);g.addColorStop(0,hexA(c,.22*al*pul));g.addColorStop(1,hexA(c,0));x.fillStyle=g;x.beginPath();x.arc(X,Y,r*2.6,0,7);x.fill();
 hexPath(x,X,Y,r);x.fillStyle=`rgba(8,13,17,${.92*al})`;x.fill();x.strokeStyle=`rgba(200,215,220,${(big?.38:.28)*al})`;x.lineWidth=1;x.stroke();
 const cg=x.createRadialGradient(X,Y,0,X,Y,r*.62);cg.addColorStop(0,`rgba(255,255,255,${.95*al})`);cg.addColorStop(.35,hexA(c,al));cg.addColorStop(1,hexA(c,0));x.fillStyle=cg;x.beginPath();x.arc(X,Y,r*.62,0,7);x.fill()}
function curve(x0,y0,x1,y1,b){const mx=(x0+x1)/2,my=(y0+y1)/2,dx=x1-x0,dy=y1-y0;return[mx-dy*b,my+dx*b]}
function qpt(x0,y0,cx,cy,x1,y1,f){const u=1-f;return[u*u*x0+2*u*f*cx+f*f*x1,u*u*y0+2*u*f*cy+f*f*y1]}
function nxFrame(t){requestAnimationFrame(nxFrame);const cv=$('nexus');if(!cv)return;
 const W=cv.clientWidth;if(!W)return;const SM=W<560,H=Math.round(SM?W*1.4:Math.min(660,W*.7)),dpr=Math.min(devicePixelRatio||1,2);
 if(cv.width!=W*dpr||cv.height!=H*dpr){cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+'px'}
 const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);const T=TH();
 const dt=Math.min(50,t-(NX.last||t));NX.last=t;NX.k+=((NX.sel?1:0)-NX.k)*Math.min(1,dt*.008);const kk=ease(Math.max(0,Math.min(1,NX.k)));
 const K=Math.max(.74,Math.min(1,W/760)),FK=SM?1:Math.max(1,Math.min(1.15,W/850)),cx=W/2,cy=H/2,RY=H*(SM?.42:.38),RX=SM?W*.37:Math.min(W*.38,RY*1.55),F='JetBrains Mono,ui-monospace,monospace';NX.hits=[];
 NX.dust.forEach(d=>{x.fillStyle=`rgba(170,195,205,${d[3]*(.3+.2*Math.sin(t/1200+d[2]))})`;x.fillRect(d[0]*W,d[1]*H,1,1)});
 // Kompass-Ring
 const CR=SM?Math.min(W*.49,H*.47):Math.min(W*.48,H*.49);x.strokeStyle=hexA(T.br,.35);x.lineWidth=1;x.beginPath();x.arc(cx,cy,CR,0,7);x.stroke();
 x.setLineDash([2,7]);x.strokeStyle=hexA(T.br,.3);x.beginPath();x.arc(cx,cy,CR*.62,0,7);x.stroke();x.setLineDash([]);
 const rot=t/240000;for(let a=0;a<72;a++){const an=a/72*6.283+rot,r1=CR,r2=CR-(a%9?3:7);x.strokeStyle=hexA(T.br,a%9?.25:.6);x.beginPath();x.moveTo(cx+r1*Math.cos(an),cy+r1*Math.sin(an));x.lineTo(cx+r2*Math.cos(an),cy+r2*Math.sin(an));x.stroke();
  if(a%9==0&&!SM){x.fillStyle=hexA(T.mu,.6);x.font=`10px ${F}`;x.textAlign='center';x.textBaseline='middle';x.fillText(String(Math.round(a*5)).padStart(3,'0'),cx+(CR-16)*Math.cos(an),cy+(CR-16)*Math.sin(an))}}
 const M=MODS(),S=NX.sel?M.find(m=>m.id==NX.sel):null;
 const MP={musik:[-.34,-.84],projekte:[.34,-.84],finanzen:[.62,-.18],todos:[.52,.5],kalender:[-.52,.5],leben:[-.62,-.18],warten:[0,.86]};M.forEach((m,i)=>{if(SM&&MP[m.id])m.pos=MP[m.id];const dx=Math.sin(t/2600+i*1.3)*3,dy=Math.cos(t/2900+i*.9)*3;m.x=cx+m.pos[0]*RX+dx;m.y=cy+m.pos[1]*RY+dy;
  const dir=Math.atan2(m.pos[1],m.pos[0]*1.2),n=m.kids.length,sp=SM?(n==2?1.1:.8):(n==2?1.3:m.id=='projekte'?(n==4?.82:1.05):n>3?.78:.66),dist=(SM?26:(n>3||m.id=='projekte'?95:80))*K;
  m.kids.forEach((k,j)=>{const an=dir+(j-(n-1)/2)*sp;k.x=m.x+Math.cos(an)*dist*(1+.08*Math.sin(t/3100+j))*(SM?1:1.25);k.y=m.y+Math.sin(an)*dist;k.c=k.c||m.c})});
 if(S){S.x+=(cx-S.x)*kk;S.y+=(cy-S.y)*kk}
 const dim=m=>S&&m!==S?1-.86*kk:1;
 // Linien
 M.forEach((m,i)=>{const al=dim(m);if(m!==S){const[qx,qy]=curve(cx,cy,m.x,m.y,.08);x.strokeStyle=hexA(T.br,.45*al);x.lineWidth=1;x.beginPath();x.moveTo(cx,cy);x.quadraticCurveTo(qx,qy,m.x,m.y);x.stroke();
   for(let p=0;p<2;p++){const f=((t/4200)+i*.13+p*.5)%1,[px,py]=qpt(cx,cy,qx,qy,m.x,m.y,f);x.fillStyle=hexA(m.c,.8*al);x.beginPath();x.arc(px,py,1.6,0,7);x.fill()}}
  if(!(m===S&&kk>.3))m.kids.forEach((k,j)=>{const[qx,qy]=curve(m.x,m.y,k.x,k.y,.12);x.strokeStyle=hexA(T.br,.4*al);x.beginPath();x.moveTo(m.x,m.y);x.quadraticCurveTo(qx,qy,k.x,k.y);x.stroke();
   const f=((t/3000)+j*.31+i*.07)%1,[px,py]=qpt(m.x,m.y,qx,qy,k.x,k.y,f);x.fillStyle=hexA(k.c,.7*al);x.beginPath();x.arc(px,py,1.2,0,7);x.fill()})});
 // Kern
 const sc=score(),cr=(SM?30:40)*K;if(kk<.98){x.globalAlpha=1-kk;
  const cg=x.createRadialGradient(cx,cy,0,cx,cy,cr*2.2);cg.addColorStop(0,hexA(T.amb,.14));cg.addColorStop(1,hexA(T.amb,0));x.fillStyle=cg;x.beginPath();x.arc(cx,cy,cr*2.2,0,7);x.fill();
  x.fillStyle='rgba(6,10,13,.95)';x.beginPath();x.arc(cx,cy,cr,0,7);x.fill();
  [cr*.72,cr*.55].forEach((r,i)=>{x.strokeStyle=hexA(T.amb,.18);x.lineWidth=1;x.setLineDash(i?[2,4]:[]);x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();x.setLineDash([])});
  x.strokeStyle=hexA(T.amb,.15);x.lineWidth=4;x.beginPath();x.arc(cx,cy,cr+4,0,7);x.stroke();
  x.strokeStyle=T.amb;x.shadowColor=T.amb;x.shadowBlur=12;x.lineWidth=4;x.beginPath();x.arc(cx,cy,cr+4,-Math.PI/2,-Math.PI/2+Math.max(.02,sc/100)*6.283);x.stroke();x.shadowBlur=0;
  x.fillStyle=T.amb;x.textAlign='center';x.textBaseline='middle';x.font=`500 ${Math.round(cr*.8)}px ${F}`;x.fillText(sc,cx,cy-cr*.08);
  x.fillStyle=hexA(T.mu,.9);x.font=`${Math.max(9,Math.round(cr*.2))}px ${F}`;x.fillText('LIFE SCORE',cx,cy+cr*.45);x.globalAlpha=1}
 // Knoten
 const lab=(X,Y,a,b,col,al,big)=>{x.globalAlpha=al;x.textAlign='center';x.textBaseline='top';x.font=`${big?600:500} ${Math.round((big?(SM?11.5:13.5):(SM?9.5:11))*FK)}px ${F}`;x.fillStyle=big?T.tx:hexA(T.tx,.78);x.fillText(a,X,Y);
  if(b&&!(SM&&!big)){x.font=`${Math.round((big?(SM?10.5:12):10.5)*FK)}px ${F}`;x.fillStyle=big?col:hexA(T.mu2||'#8a9ca2',1);x.fillText(b,X,Y+(big?(SM?14:17):14)*FK)}x.globalAlpha=1};
 M.forEach((m,i)=>{const al=dim(m),r=(m===S?15+5*kk:14)*K;
  if(!(m===S&&kk>.3))m.kids.forEach((k,j)=>{hexNode(x,k.x,k.y,(SM?6:8.5)*K,k.c,al,t,i*3+j,false);if(!SM)lab(k.x,k.y+11*K,k.n,k.s,k.c,al,false);if(!S)NX.hits.push({type:'hub',id:m.id,sub:k.f||null,x:k.x,y:k.y,r:14*K})});
  hexNode(x,m.x,m.y,r,m.c,al,t,i,true);if(!(S&&m!==S&&kk>.5))lab(m.x,m.y+r+6*K,m.n,m.sub,m.c,al,true);
  if(!S||m===S)NX.hits.push({type:'hub',id:m.id,x:m.x,y:m.y,r:Math.max(r+12,22)})});
 // Aufgeklappt: Einträge im Kreis
 if(S&&kk>.15){const L=S.items(),n=L.length,RRy=SM?RY*1.05:RY*.88,RRx=SM?W*.2:Math.min(RX*.62,W/2-190),al=Math.min(1,(kk-.15)/.6),mx=SM?19:30;
  const half=Math.ceil(n/2);L.forEach((o,k)=>{const an=-Math.PI/2+(k+.5)*6.283/n,rgt=k<half,row=rgt?k:k-half,rows=rgt?half:n-half,px=SM?cx+(rgt?1:-1)*W*.07*kk:cx+Math.cos(an)*RRx*kk,py=SM?cy+((rows>1?row/(rows-1):.5)-.5)*(H-90)*kk:cy+Math.sin(an)*RRy*kk*.95,ca=SM?(rgt?1:-1):Math.cos(an),
   align=ca>=0?'left':'right',tx=px+(align=='left'?13:-13)*K,ty=py-6*K;
   x.globalAlpha=al;const[qx,qy]=curve(S.x,S.y,px,py,.06);x.strokeStyle=hexA(T.br,.4);x.lineWidth=1;x.beginPath();x.moveTo(S.x,S.y);x.quadraticCurveTo(qx,qy,px,py);x.stroke();
   if(o.add){hexPath(x,px,py,8*K);x.strokeStyle=S.c;x.setLineDash([2,3]);x.stroke();x.setLineDash([]);x.fillStyle=S.c;x.font=`500 ${Math.round(11*K)}px ${F}`;x.textAlign='center';x.textBaseline='middle';x.fillText('+',px,py+1);
    x.textAlign=align;x.textBaseline='top';x.font=`${SM?11:13}px ${F}`;x.fillText('NEU',tx,ty)}
   else{hexNode(x,px,py,8*K,o.c,al*(o.done?.5:1),t,k,false);if(o.done){x.fillStyle=T.ok;x.font=`700 ${Math.round(10*K)}px ${F}`;x.textAlign='center';x.textBaseline='middle';x.fillText('✓',px,py+.5)}
    x.textAlign=align;x.textBaseline='top';x.font=`${SM?11:13}px ${F}`;x.fillStyle=o.done?hexA(T.mu,1):hexA(T.tx,.92);let tt=o.t;if(tt.length>mx)tt=tt.slice(0,mx-1)+'…';x.fillText(tt,tx,ty);
    if(o.s){x.font=`${SM?10:11.5}px ${F}`;x.fillStyle=hexA(o.c,.95);x.fillText(o.s,tx,ty+(SM?13:16))}}
   x.globalAlpha=1;const tw=SM?140:250;NX.hits.push({type:'item',o,x:px,y:py,r:14*K,lx:align=='left'?tx:align=='right'?tx-tw:tx-tw/2,ly:ty-2,lw:tw,lh:SM?28:32})})}
 // HUD
 x.font=`${SM?9.5:11}px ${F}`;x.textBaseline='top';x.textAlign='left';x.fillStyle=hexA(T.mu,1);const nodes=M.length+M.reduce((s,m)=>s+m.kids.length,0);x.fillText(`NODES ${nodes} · LINKS ${nodes}`,6,4);
 x.textAlign='right';x.fillStyle=T.cy;x.fillText('● LIVE',W-6,4);x.fillStyle=hexA(T.mu,1);if(!SM)x.fillText(S?S.n+' · OFFEN':'LIFE · NEXUS',W-6,19);
 if(!S&&!SM){const hl=D.hlog[WK]||{},hd=D.habits.reduce((s,h)=>s+Math.min((hl[h.id]||[]).filter(Boolean).length,h.goal),0),hg=D.habits.reduce((s,h)=>s+h.goal,0),td=D.todos.filter(o=>o.done).length;
  const bars=[['TO-DOS',td,D.todos.length||1],['SCORE',sc,100]];x.textAlign='left';x.textBaseline='middle';
  bars.forEach(([l,v,m],i)=>{const y=H-10-(bars.length-1-i)*(SM?13:15);x.fillStyle=hexA(T.mu,1);x.fillText(l,6,y);x.fillStyle=hexA(T.br,.4);const bx=SM?66:82;x.fillRect(bx,y-1,58,2.5);x.fillStyle=T.ok;x.fillRect(bx,y-1,58*Math.min(1,v/m),2.5);x.fillStyle=hexA(T.mu,1);x.fillText(`${v}/${m}`,bx+64,y)})}
 x.textAlign='right';x.textBaseline='bottom';x.fillStyle=hexA(T.mu,1);x.fillText(S?'MITTE = ZURÜCK':'ANTIPPEN = ÖFFNEN',W-6,H-4);
}
requestAnimationFrame(nxFrame);
function bindNexus(){const cv=$('nexus');
 const find=e=>{const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;return NX.hits.slice().reverse().find(h=>Math.hypot(h.x-mx,h.y-my)<h.r||(h.lw&&mx>=h.lx&&mx<=h.lx+h.lw&&my>=h.ly&&my<=h.ly+h.lh))};
 cv.onpointermove=e=>{cv.style.cursor=find(e)?'pointer':'default'};
 cv.onclick=e=>{const h=find(e);
  const stepBack=()=>{if(NX.sel=='projekte'&&NX.sub){NX.sub=null;return true}return false};
  if(!h){if(stepBack())return;if(NX.sel){NX.sel=null;NX.sub=null;clearJust()}return}
  if(h.type=='hub'){if(NX.sel==h.id&&stepBack())return;if(NX.sel==h.id){NX.sel=null;NX.sub=null;clearJust()}else{clearJust();NX.sel=h.id;NX.sub=h.sub||null}return}
  const o=h.o;
  if(o.add){capArea=null;const q=$('qi');q.placeholder='Neues To-do … & Enter';q.focus();q.scrollIntoView({block:'center',behavior:'smooth'})}
  else if(o.todo){const td=D.todos.find(x=>x.id==o.todo);if(!tick(td))td._just=true;save();refreshSide()}
  else if(o.hab){const L=D.hlog[WK]=D.hlog[WK]||{};const r=L[o.hab]=L[o.hab]||[0,0,0,0,0,0,0];r[todayIdx]=r[todayIdx]?0:1;save();refreshSide()}
  else if(o.area){rateSheet(o.area)}
  else if(o.go)o.go()};
}
function clearJust(){D.todos.forEach(o=>delete o._just);refreshSide()}
function refreshSide(){if(view!='start')return;const el=$('tdbox');if(el)el.innerHTML=todoPanel();bindStart()}
function rateSheet(id){const a=AR(id);sheet(`<div class="row"><b style="font-size:17px">${a.i} ${esc(a.n)}</b><button class="x" id="cl">✕</button></div>${rated(id).length?`<div style="font-size:12.5px;color:var(--mu);margin:6px 0">Berechnet aus ${rated(id).length} fertigen Projekt${rated(id).length>1?'en':''}: ${rated(id).map(p=>remo(p.rate)+' '+esc(p.t)).join(' · ')}. Der nächste Projektabschluss rechnet neu.</div>`:`<div style="font-size:12.5px;color:var(--mu);margin:6px 0">Noch kein fertiges Projekt hier bewertet. Sobald du eins abschließt, berechnet sich der Wert automatisch.</div>`}<label>Wie zufrieden bist du gerade? (1–10)</label><div class="seg">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button data-sc="${n}" style="${n==a.s?`background:${a.c};color:#05080a;font-weight:600`:''}">${n}</button>`).join('')}</div>`);
 $('cl').onclick=close;document.querySelectorAll('[data-sc]').forEach(b=>b.onclick=()=>{a.s=+b.dataset.sc;save();close();refreshSide()})}
function designSheet(){const t=TH();
 const cp=(k,l,v,dat)=>`<label class="cp"><input type="color" value="${v}" ${dat}><span>${l}</span><code>${v.toUpperCase()}</code></label>`;
 const base=[['bg','Hintergrund'],['panel','Panels'],['item','Einträge'],['line','Linien'],['br','Ecken'],['tx','Text'],['mu','Text grau'],['cy','Akzent'],['cy2','Begrüßung'],['amb','Score / Gold'],['ok','Erledigt / Fortschritt']];
 sheet(`<div class="row"><b style="font-size:17px">◐ Design & Farben</b><button class="x" id="cl">✕</button></div>
 <div class="sec">Vorlagen</div><div class="presets">${Object.entries(PRESETS).map(([n,p])=>{const m=Object.assign({},DEF,p);return `<button data-pre="${n}"><i>${[m.bg,m.cy,m.amb,m.cy2].map(c=>`<b style="background:${c}"></b>`).join('')}</i>${n}</button>`}).join('')}</div>
 <div class="sec">Grundfarben</div><div class="cpick">${base.map(([k,l])=>cp(k,l,t[k],`data-k="${k}"`)).join('')}</div>
 <div class="sec">Prioritäten</div><div class="cpick">${[['p1','Hoch'],['p2','Mittel'],['p3','Niedrig']].map(([k,l])=>cp(k,l,t[k],`data-k="${k}"`)).join('')}</div>
 <div class="sec">Neural Nexus – Module</div><div class="cpick">${Object.keys(DEF.hub).map(k=>cp(k,k.toUpperCase().replace('TODOS','TO-DOS').replace('WARTEN','WARTE AUF'),t.hub[k],`data-hub="${k}"`)).join('')}</div>
 <div class="sec">Lebensbereiche</div><div class="cpick">${D.areas.map(a=>cp(a.id,a.i+' '+a.n,a.c,`data-area="${a.id}"`)).join('')}</div>
 <button class="btn g" id="rst" style="width:100%;margin-top:16px">Alles auf Dominik-Original zurücksetzen</button>`);
 const set=()=>{applyTheme()};
 document.querySelectorAll('#sh input[type=color]').forEach(inp=>{inp.oninput=()=>{D.theme=D.theme||{};const v=inp.value;
  if(inp.dataset.k)D.theme[inp.dataset.k]=v;else if(inp.dataset.hub){D.theme.hub=D.theme.hub||{};D.theme.hub[inp.dataset.hub]=v}else if(inp.dataset.area)AR(inp.dataset.area).c=v;
  inp.parentNode.querySelector('code').textContent=v.toUpperCase();set()};inp.onchange=()=>save()});
 document.querySelectorAll('[data-pre]').forEach(b=>b.onclick=()=>{D.theme=JSON.parse(JSON.stringify(PRESETS[b.dataset.pre]));applyTheme();save();designSheet()});
 $('rst').onclick=()=>{D.theme={};D.areas.forEach(a=>{if(ACOL[a.id])a.c=ACOL[a.id]});applyTheme();save();designSheet()};
 $('cl').onclick=()=>{close();render()};
}

/* ---------- Heute-Plan, Tracks, Warte auf, Check-in ---------- */
const PLAN={früh:[['Labor','6:00–14:30'],['Runterkommen','15–16 Uhr'],['Studio','16–18 Uhr'],['Freundin','ab 18 Uhr'],['PC / Claude','21:30–0 Uhr']],
 spät:[['Studio / PC','10–13 Uhr'],['Labor','13–23 Uhr'],['Studio','23–3 Uhr']],
 tag:[['Labor','9–17 Uhr'],['Studio','ab 18 Uhr']],
 urlaub:[['Studio','vormittags'],['Erledigungen','nachmittags'],['Freundin & Freizeit','abends']],
 frei:[['Gig / Studio','spontan'],['Freundin & Freizeit','']]};
const since=d=>d?days(d)*-1:null;
function heutePanel(){const st=shift(T0),S=SH[st]||SH.frei,P=PLAN[st]||PLAN.frei,f=focusList().slice(0,3),tm=new Date(TODAY);tm.setDate(tm.getDate()+1);const ST=SH[shift(iso(tm))]||SH.frei,
 evs=D.events.filter(e=>days(e.d)==0||(e.e&&days(e.d)<0&&days(e.e)>=0)&&!/urlaub/i.test(e.t)).filter(e=>!/urlaub/i.test(e.t));
 return `<div class="card mt"><h2><span><i class="ico">☀</i>// Heute · ${S[0]}</span><span class="r">Morgen: ${ST[0]}</span></h2>
 <div class="hgrid"><div><div class="sec" style="margin-top:0">Top 3 für heute</div>${f.map((t,i)=>`<div class="top3"><b>${i+1}</b><span>${esc(t.t)}</span><button class="ck" data-done="${t.id}"></button></div>`).join('')||'<div class="empty">Nichts Dringendes – Zeit fürs Studio 🎛</div>'}
 ${evs.length?`<div class="sec">Termine heute</div>${evs.map(e=>`<div class="top3"><b>●</b><span>${esc(e.t)}</span></div>`).join('')}`:''}</div>
 <div><div class="sec" style="margin-top:0">Dein Tag</div>${P.map(([a,b])=>`<div class="slot"><span>${a}</span><code>${b}</code></div>`).join('')}</div></div></div>`}
function tracksPanel(){const L=[...(D.tracks||[])].sort((a,b)=>(a.prio||9)-(b.prio||9));return `<div class="card"><h2><span><i class="ico">♫</i>// Tracks in Arbeit</span><button data-trk="0">+ Track</button></h2>${L.map(t=>{const dd=t.dl?days(t.dl):null;return `<div class="trk" data-trk="${t.id}"><div class="t"><b>${esc(t.t)}</b><small>${esc(t.with||'')}${t.stage?' · '+esc(t.stage):''}</small><small class="nx">→ ${esc(t.next||'')}</small></div>${t.dl?`<span class="chip" style="${dd<=7?'color:var(--p1);border-color:var(--p1)':''}">${dd<0?'überfällig':dd==0?'heute':dd+' T.'}</span>`:''}</div>`}).join('')||'<div class="empty">Keine Tracks eingetragen.</div>'}</div>`}
function waitPanel(){const L=[...(D.waits||[])].sort((a,b)=>(a.since||'9').localeCompare(b.since||'9'));return `<div class="card"><h2><span><i class="ico">⏳</i>// Warte auf …</span><button data-wt="0">+ Neu</button></h2>${L.map(w=>{const s=since(w.since);return `<div class="trk" data-wt="${w.id}"><div class="t"><b>${esc(w.who)}</b><small>${esc(w.what)}</small>${w.next?`<small class="nx">→ ${esc(w.next)}</small>`:''}</div><span class="chip" style="${s>=10?'color:var(--p1);border-color:var(--p1)':''}">${s==null?'seit ?':s==0?'seit heute':'seit '+s+' T.'}</span></div>`}).join('')||'<div class="empty">Du wartest gerade auf niemanden.</div>'}</div>`}
function logPanel(){const L=D.log||[];return `<div class="card mt"><h2><span><i class="ico">⌁</i>// Check-in mit Claude</span><span class="r">${L[0]?'Zuletzt '+fdt(L[0].at):'noch keiner'}</span></h2>
 <div class="hgrid"><div><div class="sec" style="margin-top:0">Was sich geändert hat</div>${L.slice(0,3).map(c=>`<div class="logc"><code>${fdt(c.at)}</code>${c.items.map(i=>`<div class="li">${esc(i)}</div>`).join('')}</div>`).join('')||'<div class="empty">Schreib Claude kurz, was offen ist – das Update erscheint hier.</div>'}</div>
 <div id="mailbox">${mailList()}</div></div></div>`}
function mailList(){const M=D.mails||[],O=M.filter(m=>!m.done),dn=M.length-O.length;
 return `<div class="sec" style="margin-top:0;display:flex;justify-content:space-between"><span>Wichtige Mails (Tingeltangel-Gmail)</span><span>${M.length?dn+' / '+M.length+' durch':''}</span></div>
 ${O.slice(0,5).map(m=>`<div class="mail ${m.hot?'hot':''}" data-mid="${m.id}"><div class="mt2"><div class="row"><b>${esc(m.from)}</b><code>${esc(m.d?fd(m.d):'')}</code></div><span>${esc(m.t)}</span>${m.note?`<small>→ ${esc(m.note)}</small>`:''}</div><button class="ck mck" data-mck="${m.id}" title="Durchgegangen – in Gmail als gelesen markieren"></button></div>`).join('')||'<div class="empty">Alles durchgegangen ✓</div>'}
 ${O.length>5?`<div class="more" style="cursor:default">+ ${O.length-5} weitere rutschen nach</div>`:''}<div class="hint" id="mailmsg"></div>`}
async function markRead(m){const msg=t=>{const e=$('mailmsg');if(e)e.textContent=t};if(!(m.th&&m.th.length))return;
 try{await LOS.gmailMarkRead(m.th);msg('✓ In Gmail als gelesen markiert')}catch(e){msg(e&&e.auth?'Abgehakt – in Gmail markiere ich es, sobald du oben bei ☁ verbunden bist':'In Gmail nicht markiert ('+(e.message||'Fehler')+') – abgehakt ist es trotzdem');LOS.queueRead(m.th)}}
function bindMails(){document.querySelectorAll('[data-mck]').forEach(b=>b.onclick=()=>{const m=(D.mails||[]).find(x=>x.id==+b.dataset.mck);if(!m||m.done)return;b.classList.add('on');b.textContent='✓';
 const el=b.closest('.mail');el.style.maxHeight=el.offsetHeight+'px';el.offsetHeight;el.classList.add('gone');m.done=true;m.at=T0;save();markRead(m);
 setTimeout(()=>{const box=$('mailbox');if(box){const keep=($('mailmsg')||{}).textContent||'';box.innerHTML=mailList();if(keep&&$('mailmsg'))$('mailmsg').textContent=keep;bindMails()}},700)})}
const fdt=s=>{if(!s)return '';const[d,t]=s.split('T');return fd(d)+(t?' '+t.slice(0,5):'')};
function bindExt(){bindMails();document.querySelectorAll('[data-trk]').forEach(b=>b.onclick=()=>trackSheet(+b.dataset.trk));document.querySelectorAll('[data-wt]').forEach(b=>b.onclick=()=>waitSheet(+b.dataset.wt))}
function trackSheet(id){D.tracks=D.tracks||[];const t=id?D.tracks.find(x=>x.id==id):{id:D.next,t:'',with:'',stage:'',next:'',dl:'',prio:2,_n:1};
 sheet(`<div class="row"><b style="font-size:18px">${id?'Track bearbeiten':'Neuer Track'}</b><button class="x" id="cl">✕</button></div>
 <label>Track</label><input id="k1" value="${esc(t.t)}"><label>Mit / Label</label><input id="k2" value="${esc(t.with)}">
 <div class="g2"><div><label>Stand</label><input id="k3" value="${esc(t.stage)}" placeholder="z. B. Arrangement"></div><div><label>Deadline</label><input type="date" id="k5" value="${t.dl}"></div></div>
 <label>Nächster Schritt</label><input id="k4" value="${esc(t.next)}"><label>Priorität</label><select id="k6">${[[1,'Hoch'],[2,'Mittel'],[3,'Niedrig']].map(([v,l])=>`<option value="${v}" ${t.prio==v?'selected':''}>${l}</option>`).join('')}</select>
 <div class="row" style="margin-top:16px">${id?'<button class="btn g" id="del" style="color:var(--p1)">Fertig / entfernen</button>':'<span></span>'}<button class="btn" id="ok">Speichern</button></div>`);
 $('cl').onclick=close;$('ok').onclick=()=>{t.t=$('k1').value.trim();if(!t.t)return;t.with=$('k2').value.trim();t.stage=$('k3').value.trim();t.next=$('k4').value.trim();t.dl=$('k5').value;t.prio=+$('k6').value;if(t._n){delete t._n;D.next++;D.tracks.push(t)}close();render();save()};
 if(id)$('del').onclick=()=>{D.tracks=D.tracks.filter(x=>x.id!=id);close();render();save()}}
function waitSheet(id){D.waits=D.waits||[];const w=id?D.waits.find(x=>x.id==id):{id:D.next,who:'',what:'',since:T0,next:'',a:'musik',_n:1};
 sheet(`<div class="row"><b style="font-size:18px">${id?'Warte auf …':'Neu: Warte auf …'}</b><button class="x" id="cl">✕</button></div>
 <label>Auf wen?</label><input id="w1" value="${esc(w.who)}"><label>Worauf?</label><input id="w2" value="${esc(w.what)}">
 <div class="g2"><div><label>Seit</label><input type="date" id="w3" value="${w.since}"></div><div><label>Bereich</label><select id="w5">${areaOpts(w.a)}</select></div></div>
 <label>Nächster Schritt (optional)</label><input id="w4" value="${esc(w.next)}" placeholder="z. B. Ab 25.11. nachhaken">
 <div class="row" style="margin-top:16px">${id?'<button class="btn g" id="del" style="color:var(--ok)">✓ Ist angekommen</button>':'<span></span>'}<button class="btn" id="ok">Speichern</button></div>`);
 $('cl').onclick=close;$('ok').onclick=()=>{w.who=$('w1').value.trim();if(!w.who)return;w.what=$('w2').value.trim();w.since=$('w3').value;w.a=$('w5').value;w.next=$('w4').value.trim();if(w._n){delete w._n;D.next++;D.waits.push(w)}close();render();save()};
 if(id)$('del').onclick=()=>{D.waits=D.waits.filter(x=>x.id!=id);close();render();save()}}

/* ---------- Projekte & Ideen ---------- */
const PST={läuft:['Läuft','var(--ok)'],bald:['Als Nächstes','var(--cy)'],idee:['Idee','var(--amb)'],pause:['Pausiert','var(--mu)'],fertig:['Fertig','var(--mu2)']};
let pflt='aktiv';
const PSEC=[['musik','🎛','Musik & Releases','Songs, Releases, alles rund um Tingeltangel-Veröffentlichungen'],['studio','🔊','Sounddesign & Studio','Lernen, Workflow, Ableton & Plugins'],['social','📸','Social & Reichweite','Instagram, Content, Fans gewinnen'],['karriere','🚀','Karriere & Business','Gigs, Bookings, Einnahmen neben dem Labor'],['ki','🤖','Apps & KI','Tools und Automatisierungen, die wir bauen'],['leben','🧭','Lebensoptimierung','Alltag, Ordnung, Zeit für dich'],['labor','🧪','Labor','AMG Lithium & Methoden']];
const psec=id=>PSEC.find(x=>x[0]==id)||PSEC[4];
const DEV={ueberall:['📱','Überall','#4fae6e'],pc:['🖥','Studio-PC','#4db7df'],mac:['💻','MacBook','#b3a1f0'],arbeit:['🏭','Auf Arbeit','#e0a372']};
const SWC={'Claude':'#d9a26a','Claude Code':'#e6c273','Ableton':'#9fd8ff','Serum':'#7fd3c4','Blender':'#ff9a4d','OBS':'#c79bff','ComfyUI':'#ff7aa8','Abacus AI':'#8fd1b4','Obsidian':'#a78bfa','Word':'#7fb8e6','Instagram':'#e39ab8','Metricool':'#7fb3ff','Viberate':'#f2c14e','Gmail':'#d97a7a','YouTube':'#ff6b6b','CapCut':'#e8e8e8','Scanner':'#b0b8bc'};
const swCol=n=>{if(SWC[n])return SWC[n];let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))%360;return `hsl(${h},55%,70%)`};
let pdev='alle';
function tagBar(p){const d=(p.dev||[]).map(k=>DEV[k]?`<span class="tg" style="--c:${DEV[k][2]}">${DEV[k][0]} ${DEV[k][1]}</span>`:'').join(''),w=(p.sw||[]).map(n=>`<span class="tg sw" style="--c:${swCol(n)}">${esc(n)}</span>`).join('');return d||w?`<div class="tags">${d}${w}</div>`:''}
function pCard(p){return `<div class="proj"><div class="row" style="align-items:flex-start"><div><b>${esc(p.t)}</b><div style="margin-top:5px"><span class="chip" style="color:${PST[p.st][1]};border-color:${PST[p.st][1]}">${PST[p.st][0]}</span></div></div><button class="x" data-pe="${p.id}">✎</button></div>
  ${p.desc?`<p>${esc(p.desc)}</p>`:''}${p.next?`<p class="nx">→ ${esc(p.next)}</p>`:''}${p.where?`<code>${esc(p.where)}</code>`:''}
  ${p.st!='fertig'?`<div class="pbtns"><button class="btn s pst" data-ps="${p.id}">▶ Mit Claude starten</button><button class="btn g s" data-pd="${p.id}">✓ Fertig</button></div>`:`<div class="fdone">${p.rate?remo(p.rate)+' '+RATE[p.rate-1][2]:'☆ Noch nicht bewertet'}${p.done?' · '+fd(p.done):''}${p.lesson?'<br><small>'+esc(p.lesson)+'</small>':''}${p.rate?'':`<button class="btn g s" data-pd="${p.id}">Bewerten</button>`}</div>`}${tagBar(p)}</div>`}
function startText(p){return `Lass uns mit dem Projekt „${p.t}“ weitermachen.\nStand: ${p.desc||'–'}\nNächster Schritt: ${p.next||'–'}${p.where?'\nWo es liegt: '+p.where:''}`}
const popen=new Set();let pq='';
function projSug(){const P=D.projects||[],q=pq.trim().toLowerCase(),bx=$('psug');if(!bx)return;if(!q){bx.innerHTML='';bx.style.display='none';return}
 const hl=s=>{s=String(s||'');const i=s.toLowerCase().indexOf(q);return i<0?esc(s):esc(s.slice(0,i))+'<mark>'+esc(s.slice(i,i+q.length))+'</mark>'+esc(s.slice(i+q.length))};
 const sn=p=>{const s=String(p.desc||'');const i=s.toLowerCase().indexOf(q);if(i<0)return esc(s.length>80?s.slice(0,80)+'…':s);const a=Math.max(0,i-30);return(a?'…':'')+hl(s.slice(a,a+100))+(a+100<s.length?'…':'')};
 const R=P.filter(p=>((p.t||'')+' '+(p.desc||'')+' '+(p.next||'')).toLowerCase().includes(q)).sort((a,b)=>(String(b.t).toLowerCase().includes(q))-(String(a.t).toLowerCase().includes(q)));
 bx.innerHTML=R.length?R.slice(0,8).map(p=>`<button data-sg="${p.id}"><b>${hl(p.t)}</b><small>${psec(p.sec||'ki')[1]} ${PST[p.st]?PST[p.st][0]:''}${p.desc?' · '+sn(p):''}</small></button>`).join(''):'<div class="empty" style="padding:10px 12px">Nichts gefunden.</div>';bx.style.display='block';
 bx.querySelectorAll('[data-sg]').forEach(x=>x.onmousedown=e=>{e.preventDefault();bx.style.display='none';projSheet(+x.dataset.sg)})}
function vProj(){const P=D.projects||[],cnt=k=>P.filter(p=>p.st==k).length;
 const F=[['aktiv','Läuft & Als Nächstes'],['idee','Ideen'],['fertig','Fertig'],['alle','Alle']];
 const L=P.filter(p=>pdev=='alle'||(p.dev||[]).includes(pdev)||(p.dev||[]).includes('ueberall')).filter(p=>pflt=='alle'||(pflt=='aktiv'?(p.st=='läuft'||p.st=='bald'):pflt=='idee'?(p.st=='idee'||p.st=='pause'):p.st==pflt)).sort((a,b)=>['läuft','bald','idee','pause','fertig'].indexOf(a.st)-['läuft','bald','idee','pause','fertig'].indexOf(b.st));
 $('v').innerHTML=`<div class="card"><h2><span><i class="ico">✦</i>// Projekte & Ideen</span><button id="padd">+ Projekt</button></h2>
 <p class="sub" style="margin:-4px 0 12px">Alles, was wir bauen wollen oder schon bauen. <b style="color:var(--tx)">▶ Starten</b> kopiert dir einen Satz – in einen neuen Chat mit Claude einfügen, und es geht los.</p>
 <div class="devf"><span>Wo bin ich gerade?</span>${[['alle','Alle'],...Object.entries(DEV).map(([k,v])=>[k,v[0]+' '+v[1]])].map(([k,l])=>`<button data-dv="${k}" class="${pdev==k?'on':''}" style="${k!='alle'?'--c:'+DEV[k][2]:''}">${l}</button>`).join('')}</div>
 <div class="ftabs">${F.map(([k,l])=>`<button data-pf="${k}" class="${pflt==k?'on':''}">${l} <span style="opacity:.6">${k=='aktiv'?cnt('läuft')+cnt('bald'):k=='idee'?cnt('idee')+cnt('pause'):k=='alle'?P.length:cnt(k)}</span></button>`).join('')}</div>
 ${PSEC.map(sc=>{const G=L.filter(p=>(p.sec||'ki')==sc[0]);return G.length?`<div class="psec ${popen.has(sc[0])?'open':''}"><div class="psh" data-sx="${sc[0]}"><span class="pi">${sc[1]}</span><div><b>${sc[2]}</b><small>${sc[3]}</small></div><span class="chip">${G.length}</span><span class="chev">▸</span></div><div class="pgrid">${G.map(pCard).join('')}</div></div>`:''}).join('')||'<div class="empty">Hier ist noch nichts.</div>'}</div></div>
 <div class="card mt"><h2><span><i class="ico">💡</i>// Schnelle Ideen</span><span class="r">aus dem Capture-Feld</span></h2>${D.ideas.map((x,i)=>`<div class="idea"><span>${AR(x.a).i}</span><div class="t">${esc(x.t)}<br><small class="sub">${fd(x.d)}</small></div><button class="btn g s" data-ip="${i}">→ Projekt</button><button class="btn g s" data-it="${i}">→ To-do</button><button class="x" data-id="${i}">✕</button></div>`).join('')||'<div class="empty">Schreib oben z. B. „Idee: Presetpack aus dem Alien Sound Lab verkaufen“ – landet hier.</div>'}</div>`;
 document.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>{pflt=b.dataset.pf;uiSave();render()});document.querySelectorAll('[data-dv]').forEach(b=>b.onclick=()=>{pdev=b.dataset.dv;uiSave();render()});
 document.querySelectorAll('[data-sx]').forEach(h=>h.onclick=()=>{const k=h.dataset.sx;popen.has(k)?popen.delete(k):popen.add(k);h.parentNode.classList.toggle('open',popen.has(k))});
 document.querySelectorAll('[data-pe]').forEach(b=>b.onclick=()=>projSheet(+b.dataset.pe));document.querySelectorAll('[data-pd]').forEach(b=>b.onclick=()=>finishSheet(+b.dataset.pd));$('padd').onclick=()=>projSheet(0);
 document.querySelectorAll('[data-ps]').forEach(b=>b.onclick=async()=>{const p=P.find(x=>x.id==+b.dataset.ps);try{await navigator.clipboard.writeText(startText(p));b.textContent='✓ Kopiert – in neuen Chat einfügen'}catch(e){projSheet(p.id,true)}});
 document.querySelectorAll('[data-ip]').forEach(b=>b.onclick=()=>{const x=D.ideas.splice(+b.dataset.ip,1)[0];D.projects=D.projects||[];D.projects.push({id:D.next++,t:x.t,sec:({musik:'musik',lernen:'studio',labor:'labor',finanzen:'karriere'})[x.a]||'leben',st:'idee',desc:'',next:'',where:'',since:x.d});render();save()});
 document.querySelectorAll('[data-it]').forEach(b=>b.onclick=()=>{const x=D.ideas.splice(+b.dataset.it,1)[0];D.todos.push({id:D.next++,t:x.t,a:x.a,p:3,d:'',done:false});render();save()});
 document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{D.ideas.splice(+b.dataset.id,1);render();save()});
}
function finishSheet(id){const p=D.projects.find(x=>x.id==id),a=AR(PA(p));let pick=p.rate||0;
 sheet(`<div class="row"><b style="font-size:18px">✓ Projekt abschließen</b><button class="x" id="cl">✕</button></div>
 <div style="font-size:15px;margin:4px 0 2px"><b>${esc(p.t)}</b></div>
 <label>Wie zufrieden bist du mit dem Projekt?</label><div class="rate">${RATE.map(([n,e,l])=>`<button data-rt="${n}" class="${pick==n?'on':''}"><span>${e}</span><small>${l}</small></button>`).join('')}</div>
 <label>Was nimmst du mit? (optional)</label><input id="fl" value="${esc(p.lesson||'')}" placeholder="z. B. lief super · nächstes Mal früher anfangen">
 <div style="margin-top:10px;font-size:12px;color:var(--mu)">Zählt für ${a.i} ${esc(a.n)}: Der Zufriedenheitsbalken dort berechnet sich aus allen fertigen Projekten.</div>
 <div class="row" style="margin-top:14px"><span></span><button class="btn" id="fok" ${pick?'':'disabled style="opacity:.4"'}>✓ Abschließen</button></div>`);
 $('cl').onclick=close;document.querySelectorAll('[data-rt]').forEach(b=>b.onclick=()=>{pick=+b.dataset.rt;document.querySelectorAll('[data-rt]').forEach(x=>x.classList.toggle('on',x==b));$('fok').disabled=false;$('fok').style.opacity=1});
 $('fok').onclick=()=>{if(!pick)return;p.rate=pick;p.lesson=$('fl').value.trim();if(p.st!='fertig'){p.st='fertig';p.done=T0}areaRecalc(PA(p));close();render();save()}}
function projSheet(id,showStart){D.projects=D.projects||[];const p=id?D.projects.find(x=>x.id==id):{id:D.next,t:'',sec:'ki',st:'idee',desc:'',next:'',where:'',since:T0,_n:1};
 sheet(`<div class="row"><b style="font-size:18px">${id?'Projekt':'Neues Projekt'}</b><button class="x" id="cl">✕</button></div>
 ${id?(p.st!='fertig'?`<button class="btn fin" id="pfin">✓ Projekt ist fertig</button>`:`<div class="fdone">${p.rate?remo(p.rate)+' '+RATE[p.rate-1][2]:'☆ Noch nicht bewertet'}${p.done?' · fertig seit '+fd(p.done):''}${p.lesson?'<br><small>'+esc(p.lesson)+'</small>':''}<button class="btn g s" id="pfin">${p.rate?'Bewertung ändern':'Jetzt bewerten'}</button></div>`):''}
 ${showStart?`<label>Diesen Text in einen neuen Chat mit Claude einfügen</label><textarea readonly>${esc(startText(p))}</textarea>`:''}
 <label>Name</label><input id="p1" value="${esc(p.t)}"><div class="g2"><div><label>Status</label><select id="p2">${Object.entries(PST).map(([k,v])=>`<option value="${k}" ${p.st==k?'selected':''}>${v[0]}</option>`).join('')}</select></div><div><label>Sektion</label><select id="p3">${PSEC.map(x=>`<option value="${x[0]}" ${(p.sec||'ki')==x[0]?'selected':''}>${x[1]} ${x[2]}</option>`).join('')}</select></div></div>
 <label>Zählt für Lebensbereich</label><select id="p8">${D.areas.map(a=>`<option value="${a.id}" ${PA(p)==a.id?'selected':''}>${a.i} ${esc(a.n)}</option>`).join('')}</select>
 <label>Wo kann ich daran arbeiten?</label><div class="devpick">${Object.entries(DEV).map(([k,v])=>`<label class="dvp"><input type="checkbox" data-dk="${k}" ${(p.dev||[]).includes(k)?'checked':''}> ${v[0]} ${v[1]}</label>`).join('')}</div>
 <label>Software (mit Komma trennen)</label><input id="p7" value="${esc((p.sw||[]).join(', '))}" placeholder="z. B. Ableton, Claude Code">
 <label>Worum geht's / Stand</label><textarea id="p4">${esc(p.desc)}</textarea><label>Nächster Schritt</label><input id="p5" value="${esc(p.next)}"><label>Wo es liegt (Ordner, Chat, Tool)</label><input id="p6" value="${esc(p.where)}">
 <div class="row" style="margin-top:16px">${id?'<button class="btn g" id="del" style="color:var(--p1)">Löschen</button>':'<span></span>'}<button class="btn" id="ok">Speichern</button></div>`);
 $('cl').onclick=close;$('ok').onclick=()=>{p.t=$('p1').value.trim();if(!p.t)return;p.st=$('p2').value;p.sec=$('p3').value;p.desc=$('p4').value.trim();p.next=$('p5').value.trim();p.where=$('p6').value.trim();p.dev=[...document.querySelectorAll('[data-dk]')].filter(c=>c.checked).map(c=>c.dataset.dk);p.sw=$('p7').value.split(',').map(x=>x.trim()).filter(Boolean);const oa=PA(p);p.a=$('p8').value;if(p._n){delete p._n;D.next++;D.projects.push(p)}if(p.st=='fertig'&&!p.done)p.done=T0;areaRecalc(oa);areaRecalc(p.a);close();render();save();if(p.st=='fertig'&&!p.rate)finishSheet(p.id)};
 if($('pfin'))$('pfin').onclick=()=>finishSheet(p.id);
 if(id)$('del').onclick=()=>{if($('del').dataset.c){D.projects=D.projects.filter(x=>x.id!=id);close();render();save()}else{$('del').dataset.c=1;$('del').textContent='Wirklich löschen?'}}}

/* ---------- Views ---------- */
function todoRow(t,showArea=true){const a=AR(t.a),dd=t.d?days(t.d):null;
 return `<div class="item ${t.done?'done':''}"><button class="ck ${t.done?'on':''}" data-done="${t.id}">${t.done?'✓':''}</button><div class="t">${esc(t.t)}<small>${showArea?`<span class="chip" style="color:${a.c}">${a.i} ${esc(a.n)}</span>`:''}${t.rep?`<span class="chip" style="color:var(--amb)">↻ ${REP[t.rep][0]}</span>`:''}${t.d?`<span class="chip" style="${dd<0&&!t.done?'color:var(--red)':dd<=1?'color:var(--cy)':''}">${dd==0?'heute':dd==1?'morgen':dd<0?'überfällig · '+fd(t.d):fd(t.d)}</span>`:''}</small></div><button class="x" data-ed="${t.id}">✎</button></div>`}
function bindTodos(){document.querySelectorAll('#v [data-done]').forEach(b=>b.onclick=()=>{const t=D.todos.find(x=>x.id==+b.dataset.done);tick(t);render();save()});
 document.querySelectorAll('#v [data-ed]').forEach(b=>b.onclick=()=>todoSheet(+b.dataset.ed))}
function focusList(){const o=open();const due=o.filter(t=>t.d&&days(t.d)<=2).sort((a,b)=>a.d.localeCompare(b.d));const hi=o.filter(t=>t.p==1&&!due.includes(t));return[...due,...hi].slice(0,6)}
function evRow(e){const d=P(e.d),dd=days(e.d),a=AR(e.a);return `<div class="ev"><div class="date"><small>${WD[d.getDay()]}</small><b>${d.getDate()}</b><small>${MO[d.getMonth()]}</small></div><div style="flex:1;min-width:0;font-size:14px">${e.gig?'🎤 ':e.dl?'⏰ ':''}${esc(e.t)}<div style="margin-top:3px"><span class="chip" style="color:${a.c}">${a.i} ${esc(a.n)}</span>${e.ca?'<span class="chip">Datum ca.</span>':''}</div></div><div class="cd">${dd==0?'heute':dd==1?'morgen':'in '+dd+' T.'}</div><button class="x" data-eve="${e.id}">✎</button></div>`}
function upcoming(n){return D.events.filter(e=>days(e.e||e.d)>=0).sort((a,b)=>a.d.localeCompare(b.d)).slice(0,n)}
function bindEv(root=document){root.querySelectorAll('[data-eve]').forEach(b=>b.onclick=()=>evSheet(+b.dataset.eve))}

function todoPanel(){const o=open(),T=TH();return `<div class="cols">${[1,2,3].map(p=>{const L=o.filter(t=>t.p==p).sort((a,b)=>(a.d||'9').localeCompare(b.d||'9'));return `<div class="col"><h3><span class="dot" style="background:${PC(p)};color:${PC(p)}"></span>${['','Hoch','Mittel','Niedrig'][p]} <span class="chip">${L.length}</span></h3>${L.slice(0,5).map(t=>todoRow(t).replace('class="item','class="tc item')).join('')||'<div class="empty">Leer 🎉</div>'}${L.length>5?`<a class="more" href="#todos">+ ${L.length-5} weitere →</a>`:''}</div>`}).join('')}</div>`}
function habToday(){return D.habits.map(h=>{const d=habDone(h),ic=(h.t.match(/^\S+/)||[''])[0],nm=h.t.replace(/^\S+\s*/,''),c=((D.hlog[WK]||{})[h.id]||[]).filter(Boolean).length;return `<div class="hrow"><div class="ib">${esc(ic)}</div><div class="t">${esc(nm)}<small>${c}/${h.goal} DIESE WOCHE</small></div><button class="ck ${d?'on':''}" data-ht="${h.id}">${d?'✓':''}</button></div>`}).join('')}
function bindStart(){bindTodos();document.querySelectorAll('[data-ht]').forEach(b=>b.onclick=()=>{const L=D.hlog[WK]=D.hlog[WK]||{};const r=L[b.dataset.ht]=L[b.dataset.ht]||[0,0,0,0,0,0,0];r[todayIdx]=r[todayIdx]?0:1;save();refreshSide()})}
function vStart(){
 const t=ftot(),o=open();
 $('v').innerHTML=`${heutePanel()}<div class="card nx mt"><h2 style="padding:2px 4px 0"><span><i class="ico">◈</i>// Neural Nexus</span><button id="rev">Wochen-Check-in ↻</button></h2><canvas id="nexus"></canvas></div>
 <div class="card mt"><h2><span><i class="ico">✓</i>// To-dos</span><span class="r">${o.length} offen · <span style="color:var(--p1)">${o.filter(x=>x.p==1).length} mit hoher Priorität</span></span></h2><div id="tdbox">${todoPanel()}</div></div>
 <div class="grid mt">${tracksPanel()}${waitPanel()}</div>
 <div class="grid mt"><div class="card"><h2><span><i class="ico">▦</i>// Als Nächstes</span><a href="#kalender">Kalender →</a></h2>${upcoming(5).map(evRow).join('')}</div>
 <div class="card"><h2><span><i class="ico">◆</i>// Cockpit</span><a href="#musik">Musik →</a></h2><div class="kpis k2">${D.kpis.slice(0,3).map(k=>`<div class="kpi ed" data-k="${k.id}"><small>${esc(k.l)}</small><b>${esc(k.v)}</b><i>${esc(k.s)}</i></div>`).join('')}<a class="kpi" href="#finanzen"><small>Bleibt im Monat</small><b style="${t.r<0?'color:var(--p1)':''}">${eur(t.r).replace(',00','')}</b><i>nach Fixkosten & Abos</i></a></div></div></div>
 ${logPanel()}`;
 bindNexus();bindStart();bindEv($('v'));bindKpi();bindExt();$('rev').onclick=reviewSheet;
}
function vTodos(){
 const o=D.todos,pr=[[1,'Hohe Priorität',PC(1)],[2,'Mittel',PC(2)],[3,'Niedrig',PC(3)]];
 const done=o.filter(t=>t.done).sort((a,b)=>(b.at||'').localeCompare(a.at||''));
 $('v').innerHTML=`<div class="cols">${pr.map(([p,l,c])=>{const L=o.filter(t=>!t.done&&!sleeping(t)&&t.p==p).sort((a,b)=>(a.d||'9').localeCompare(b.d||'9'));return `<div class="card col t3"><h3><span class="dot" style="background:${c};color:${c}"></span>${l} <span class="chip">${L.length}</span></h3>${L.map(t=>todoRow(t).replace('class="item','class="tc item')).join('')||'<div class="empty">Leer 🎉</div>'}</div>`}).join('')}</div>
 ${(()=>{const W=o.filter(t=>sleeping(t)&&!t.done).sort((a,b)=>a.d.localeCompare(b.d));return W.length?`<div class="card" style="margin-top:12px"><h2><span><i class="ico">↻</i>// Kommt wieder (${W.length})</span></h2>${W.map(t=>todoRow(t)).join('')}</div>`:''})()}
 <div class="card" style="margin-top:12px"><h2><span><i class="ico">◈</i>// Erledigt (${done.length})</span> <button id="clr">Erledigte löschen</button></h2>${done.slice(0,15).map(t=>todoRow(t)).join('')||'<div class="empty">Noch nichts abgehakt.</div>'}</div>`;
 bindTodos();$('clr').onclick=()=>{D.todos=D.todos.filter(t=>!t.done);render();save()};
}
function vCal(){
 const m0=new Date(TODAY.getFullYear(),TODAY.getMonth(),1);let h='';
 for(let k=0;k<2;k++){const m=new Date(m0.getFullYear(),m0.getMonth()+k,1),first=(m.getDay()+6)%7,n=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
  h+=`<div class="card"><h2><span><i class="ico">◈</i>// ${MOL[m.getMonth()]} ${m.getFullYear()}</span></h2><div class="mini">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(x=>`<div class="h">${x}</div>`).join('')}${'<div></div>'.repeat(first)}`;
  for(let d=1;d<=n;d++){const s=iso(new Date(m.getFullYear(),m.getMonth(),d)),ev=D.events.find(e=>e.d==s||(e.e&&s>e.d&&s<=e.e)),sh=SH[shift(s)];
   h+=`<div class="d ${s==T0?'today':''} ${sh[1]}" title="${sh[0]}${ev?' · '+esc(ev.t):''}">${d}${ev?`<i style="background:${ev.gig?TH().hub.musik:ev.dl?TH().p1:TH().cy}"></i>`:''}</div>`}
  h+=`</div><div class="row" style="font-size:11px;color:var(--mu);justify-content:flex-start;gap:12px;flex-wrap:wrap"><span><span class="dot" style="background:#ffd36b55"></span> Früh</span><span><span class="dot" style="background:#3ee8ff55"></span> Spät</span><span><span class="dot" style="background:#5ef2c955"></span> frei/Urlaub</span><span><span class="dot" style="background:#ff7aa8"></span> Gig</span><span><span class="dot" style="background:#ff6b8a"></span> Deadline</span></div></div>`}
 $('v').innerHTML=`<div class="grid"><div class="stack">${h}<div class="card"><h2><span><i class="ico">◈</i>// Schicht-Rhythmus</span></h2><p class="sub" style="margin:0 0 10px">Ab ${fd(D.shifts.base)} beginnt eine <b>${D.shifts.baseType}</b>-Woche, danach im Wechsel. Urlaub oder Tagschicht trägst du als Ausnahme ein.</p><button class="btn g s" id="exc">+ Ausnahme / Urlaub</button></div></div>
 <div class="card"><h2><span><i class="ico">◈</i>// Termine & Deadlines</span> <button id="ne">+ Termin</button></h2>${upcoming(30).map(evRow).join('')||'<div class="empty">Keine Termine.</div>'}</div></div>`;
 bindEv($('v'));$('ne').onclick=()=>evSheet(0);$('exc').onclick=excSheet;
}
function habitWeek(){
 const mon=monday(TODAY),L=D.hlog[WK]||{};let h=`<table class="hab"><tr><th></th>${[0,1,2,3,4,5,6].map(i=>{const d=new Date(mon);d.setDate(d.getDate()+i);return `<th class="${iso(d)==T0?'today':''}">${['Mo','Di','Mi','Do','Fr','Sa','So'][i]}</th>`}).join('')}<th></th></tr>`;
 D.habits.forEach(x=>{const r=L[x.id]||[];const c=r.filter(Boolean).length;h+=`<tr><td>${esc(x.t)}</td>${[0,1,2,3,4,5,6].map(i=>`<td><button class="hc ${r[i]?'on':''}" data-h="${x.id}" data-i="${i}">${r[i]?'✓':''}</button></td>`).join('')}<td class="sum" style="${c>=x.goal?'color:var(--ac2)':''}">${c}/${x.goal}</td></tr>`});
 return h+'</table>';
}
function bindHab(){document.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{const L=D.hlog[WK]=D.hlog[WK]||{};const r=L[b.dataset.h]=L[b.dataset.h]||[0,0,0,0,0,0,0];r[+b.dataset.i]=r[+b.dataset.i]?0:1;render();save()})}
function vHabits(){
 const weeks=Object.keys(D.hlog).sort().slice(-8);
 $('v').innerHTML=`<div class="card"><h2><span><i class="ico">◈</i>// Diese Woche</span> <button id="hed">Routinen bearbeiten</button></h2>${habitWeek()}</div>
 <div class="card" style="margin-top:12px"><h2><span><i class="ico">◈</i>// Verlauf (Wochenziel erreicht)</span></h2>${weeks.length?D.habits.map(x=>`<div class="goal"><div class="row"><span style="font-size:14px">${esc(x.t)}</span><span class="sub" style="margin:0">${weeks.map(w=>{const c=((D.hlog[w]||{})[x.id]||[]).filter(Boolean).length;return c>=x.goal?'🟣':c?'⚪':'·'}).join(' ')}</span></div></div>`).join(''):'<div class="empty">Ab nächster Woche siehst du hier deinen Verlauf.</div>'}</div>`;
 bindHab();$('hed').onclick=habitSheet;
}
function bindKpi(){document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>kpiSheet(b.dataset.k))}

function vFin(){
 const t=ftot(),F=D.fin,bycat={};F.monat.filter(active).forEach(x=>bycat[x.cat]=(bycat[x.cat]||0)+(+x.b||0));
 const base=Math.max(t.e,t.a+t.j)||1,raten=F.monat.filter(x=>x.bis&&active(x));
 const list=(arr,meta,col)=>arr.length?arr.map(x=>`<div class="fi ${active(x)?'':'off'}" data-fid="${x.id}"><span class="dot" style="background:${col(x)};color:${col(x)}"></span><div class="n"><b>${esc(x.name)}</b><small>${meta(x)}</small></div><div class="v">${eur(+x.b)}</div>${ftab=='monat'?(x.bis?(ended(x)?'<div class="rm"><b>✅</b>fertig</div>':`<div class="rm has"><b>${left(x)}</b>Mon.</div>`):'<div class="rm"><b>–</b>läuft</div>'):''}<button class="tog ${x.on?'on':''}" data-tg="${x.id}"></button></div>`).join(''):'<div class="empty">Noch nichts drin.</div>';
 let body='';
 if(ftab=='monat')body=list(F.monat,x=>(x.bis&&!ended(x)?`bis ${fmtBis(x.bis)} · Rest ${eur(left(x)*x.b)} · `:'')+`${esc(x.cat)} · am ${esc(x.tag||'–')}${x.zahl?' · '+esc(x.zahl):''}`,x=>CATS[x.cat]||'#888');
 else if(ftab=='einnahmen')body=list(F.einnahmen,()=>'pro Monat',()=>'#5ef2c9');
 else body=list(F.jaehrlich,x=>`fällig ${esc(x.tag||'–')} · ${eur(x.b/12)} pro Monat`,()=>'#ffffff99');
 $('v').innerHTML=`<div class="grid"><div class="stack"><div class="fhero t3"><div class="l">Bleibt dir im Monat</div><div class="big" style="${t.r<0?'color:var(--red)':''}">${eur(t.r)}</div>
 <div class="bar" style="height:10px">${Object.entries(bycat).map(([c,v])=>`<span style="width:${v/base*100}%;background:${CATS[c]||'#888'}"></span>`).join('')}<span style="width:${t.j/base*100}%;background:#fff8"></span></div>
 <div class="row3"><div>Einnahmen<b>${eur(t.e)}</b></div><div>Fixkosten<b>${eur(t.a)}</b></div><div>Jahres-Abos/Mon.<b>${eur(t.j)}</b></div></div></div>
 <div class="card"><h2><span><i class="ico">◈</i>// Nach Kategorie</span></h2>${Object.entries(bycat).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="cat"><span class="t"><span class="dot" style="background:${CATS[c]||'#888'};color:${CATS[c]||'#888'}"></span>${esc(c)}</span><b>${eur(v)}</b></div>`).join('')}</div>
 ${raten.length?`<div class="card"><h2><span><i class="ico">◈</i>// Laufende Raten</span></h2>${raten.map(x=>`<div class="goal"><div class="row"><span style="font-size:14px">${esc(x.name)}</span><span class="sub" style="margin:0">noch ${left(x)} Mon. · ${eur(left(x)*x.b)}</span></div></div>`).join('')}</div>`:''}</div>
 <div class="card"><h2><span><i class="ico">◈</i>// Einträge</span> <button id="fadd">+ Neu</button></h2><div class="ftabs" style="margin-top:0">${[['monat','Monatlich'],['einnahmen','Einnahmen'],['jaehrlich','Jährlich']].map(([k,l])=>`<button data-ft="${k}" class="${ftab==k?'on':''}">${l}</button>`).join('')}</div>${body}
 <p class="sub" style="margin-top:10px">Tippe auf einen Eintrag zum Bearbeiten · Schalter = zählt mit / pausiert</p></div></div>`;
 document.querySelectorAll('[data-ft]').forEach(b=>b.onclick=()=>{ftab=b.dataset.ft;render()});
 document.querySelectorAll('[data-tg]').forEach(b=>b.onclick=e=>{e.stopPropagation();const x=D.fin[ftab].find(i=>i.id==b.dataset.tg);x.on=!x.on;render();save()});
 document.querySelectorAll('[data-fid]').forEach(b=>b.onclick=()=>finSheet(+b.dataset.fid));$('fadd').onclick=()=>finSheet(0);
}
function finSheet(id){const x=id?D.fin[ftab].find(i=>i.id==id):null;
 const f=(k,l,type='text')=>`<label>${l}</label><input id="f_${k}" type="${type}" ${type=='number'?'step="0.01" inputmode="decimal"':''} value="${esc(x?x[k]??'':'')}">`;
 let h=`<div class="row"><b style="font-size:18px">${x?'Bearbeiten':'Neu'} – ${ftab=='monat'?'Fixkosten':ftab=='einnahmen'?'Einnahme':'Jahres-Abo'}</b><button class="x" id="cl">✕</button></div>`+f('name','Name')+f('b',ftab=='jaehrlich'?'Betrag pro Jahr (€)':'Betrag pro Monat (€)','number');
 if(ftab=='monat')h+=`<div class="g2"><div><label>Kategorie</label><select id="f_cat">${Object.keys(CATS).map(c=>`<option ${x&&x.cat==c?'selected':''}>${c}</option>`).join('')}</select></div><div>${f('tag','Abbuchung am')}</div></div>`+f('zahl','Zahlart / Anbieter')+`<label>Raten: noch wie viele Monate? (leer = läuft unbegrenzt)</label><div class="g2"><input id="f_rm" type="number" inputmode="numeric" placeholder="z. B. 24" value="${x&&x.bis&&left(x)>0?left(x):''}"><input id="f_bis" type="month" value="${x&&x.bis?x.bis:''}"></div>`;
 if(ftab=='jaehrlich')h+=`<div class="g2"><div>${f('tag','Fällig am')}</div><div>${f('zahl','Zahlart')}</div></div>`;
 h+=`<div class="row" style="margin-top:12px">${x?'<button class="btn g" id="del" style="color:var(--red)">Löschen</button>':'<span></span>'}<button class="btn" id="ok">Speichern</button></div>`;
 sheet(h);$('cl').onclick=close;
 const rm=$('f_rm'),bi=$('f_bis');if(rm){rm.oninput=()=>{const n=parseInt(rm.value);bi.value=n>0?plusM(n):''};bi.oninput=()=>{rm.value=bi.value&&left({bis:bi.value})>0?left({bis:bi.value}):''}}
 if(x)$('del').onclick=()=>{if($('del').dataset.c){D.fin[ftab]=D.fin[ftab].filter(i=>i!==x);close();render();save()}else{$('del').dataset.c=1;$('del').textContent='Wirklich löschen?'}};
 $('ok').onclick=()=>{const g=k=>{const e=$('f_'+k);return e?e.value.trim():undefined};const o=x||{id:Date.now(),on:true};
  o.name=g('name')||'Ohne Namen';o.b=parseFloat((g('b')||'0').replace(',','.'))||0;
  if(ftab=='monat'){o.cat=g('cat');o.tag=g('tag');o.zahl=g('zahl');o.bis=g('bis')||null}if(ftab=='jaehrlich'){o.tag=g('tag');o.zahl=g('zahl')}
  if(!x)D.fin[ftab].push(o);close();render();save()};
}

function vMusik(){
 const gigs=D.events.filter(e=>e.gig).sort((a,b)=>a.d.localeCompare(b.d)),dl=D.events.filter(e=>e.dl&&days(e.d)>=0);
 const cols=[['sp','Spotify'],['bp','Beatport'],['sc','SoundCloud'],['yt','YouTube'],['am','Apple']];
 $('v').innerHTML=`<div class="grid" style="margin-bottom:12px">${tracksPanel()}${waitPanel()}</div><div class="card"><h2><span><i class="ico">◈</i>// Zahlen</span> <span class="sub" style="margin:0;text-transform:none;letter-spacing:0">Tippen zum Ändern</span></h2><div class="kpis">${D.kpis.map(k=>`<div class="kpi ed" data-k="${k.id}"><small>${esc(k.l)}</small><b>${esc(k.v)}</b><i>${esc(k.s)}</i></div>`).join('')}</div></div>
 <div class="grid" style="margin-top:12px"><div class="card"><h2><span><i class="ico">◈</i>// Gigs</span></h2>${gigs.map(evRow).join('')}</div><div class="card"><h2><span><i class="ico">◈</i>// Deadlines</span></h2>${dl.map(evRow).join('')||'<div class="empty">Keine Deadlines.</div>'}</div></div>
 <div class="card" style="margin-top:16px;overflow-x:auto"><h2><span><i class="ico">◈</i>// Song-Tracker (releaste Songs)</span> <button id="addrel">+ Song</button></h2>
 <p class="sub" style="margin:0 0 8px">Streams/Plays pro Plattform – erstmal von Hand oder von Claude im Morgen-Briefing, später automatisch.</p>
 <table class="rel"><tr><th>Song</th>${cols.map(c=>`<th>${c[1]}</th>`).join('')}<th>Σ</th></tr>${D.releases.map((r,i)=>{const sum=cols.reduce((s,c)=>s+(+String(r[c[0]]).replace(/\D/g,'')||0),0);return `<tr><td style="min-width:170px"><b style="font-weight:500">${esc(r.t)}</b><br><small class="sub">${esc(r.lab)} · ${fd(r.d)}</small></td>${cols.map(c=>`<td><input inputmode="numeric" data-r="${i}" data-c="${c[0]}" value="${esc(r[c[0]])}" placeholder="–"></td>`).join('')}<td><b>${sum?sum.toLocaleString('de-DE'):'–'}</b></td></tr>`}).join('')}</table></div>
 <div class="card" style="margin-top:12px"><h2><span><i class="ico">◈</i>// Tingeltangel</span></h2><div class="links">${[['https://open.spotify.com/intl-de/artist/2YXrzWLczeCOkk1CsUQzEx','🟢','Spotify'],['https://www.beatport.com/artist/tingeltangel/2499191','🎚','Beatport'],['https://soundcloud.com/tingeltangel_music','☁️','SoundCloud'],['https://www.instagram.com/tingeltangel_music/','📸','Instagram'],['https://www.youtube.com/@tingeltangel_music','▶️','YouTube'],['https://linktr.ee/tingeltangel_music','🌳','Linktree']].map(a=>`<a class="lk" href="${a[0]}" target="_blank"><span>${a[1]}</span>${a[2]}</a>`).join('')}</div></div>`;
 bindEv($('v'));bindKpi();bindExt();
 document.querySelectorAll('[data-r]').forEach(e=>e.onchange=()=>{D.releases[+e.dataset.r][e.dataset.c]=e.value.trim();render();save()});
 $('addrel').onclick=()=>{D.releases.unshift({t:'Neuer Song',lab:'',d:T0,sp:'',bp:'',sc:'',yt:'',am:''});render();save()};
}
function vZiele(){
 $('v').innerHTML=`<div class="card"><h2><span><i class="ico">◈</i>// 5-Jahres-Ziel (≈ 2031)</span></h2>${D.goals.map((g,i)=>`<div class="goal"><div class="row"><span style="font-size:14px">${esc(g.t)}</span><b style="color:var(--cy)">${g.p}%</b></div><input type="range" min="0" max="100" step="5" value="${g.p}" data-g="${i}"></div>`).join('')}</div>
 <div class="card" style="margin-top:12px"><h2><span><i class="ico">◈</i>// Lebensbereiche – Verlauf</span> <button id="rev2">Wochen-Check-in</button></h2>${D.reviews.length?`<p class="sub" style="margin:0 0 8px">Life Score pro Woche</p><div style="display:flex;align-items:flex-end;gap:6px;height:110px">${D.reviews.slice(-12).map(r=>`<div style="flex:1;text-align:center"><div style="height:${r.sc}px;background:linear-gradient(0deg,rgba(77,183,223,.2),var(--cy));border-radius:2px;box-shadow:0 0 12px rgba(77,183,223,.4)"></div><small class="sub" style="font-size:10px">${r.d.slice(8,10)}.${r.d.slice(5,7)}.</small></div>`).join('')}</div>`:'<div class="empty">Mach sonntags den Wochen-Check-in: jeden Bereich 1–10 bewerten, dann siehst du hier, wie sich dein Leben entwickelt.</div>'}</div>`;
 document.querySelectorAll('[data-g]').forEach(r=>r.onchange=()=>{D.goals[+r.dataset.g].p=+r.value;render();save()});$('rev2').onclick=reviewSheet;
}
function vIdeen(){
 $('v').innerHTML=`<div class="card"><h2><span><i class="ico">◈</i>// Ideen-Parkplatz</span></h2><p class="sub" style="margin:0 0 10px">Alles, was im Eingabefeld als Idee erkannt wird, landet hier. Nichts geht verloren, nichts drängelt.</p>${D.ideas.map((x,i)=>`<div class="idea"><span>${AR(x.a).i}</span><div class="t">${esc(x.t)}<br><small class="sub">${fd(x.d)}</small></div><button class="btn g s" data-it="${i}">→ To-do</button><button class="x" data-id="${i}">✕</button></div>`).join('')||'<div class="empty">Noch keine Ideen. Schreib oben z. B. „Idee: Live-Stream aus dem Studio“.</div>'}</div>`;
 document.querySelectorAll('[data-it]').forEach(b=>b.onclick=()=>{const x=D.ideas.splice(+b.dataset.it,1)[0];D.todos.push({id:D.next++,t:x.t,a:x.a,p:3,d:'',done:false});render();save()});
 document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{D.ideas.splice(+b.dataset.id,1);render();save()});
}

/* ---------- Fenster ---------- */
const sheet=h=>{$('sh').innerHTML=h;$('ov').classList.add('on')},close=()=>$('ov').classList.remove('on');
$('ov').onclick=e=>{if(e.target.id=='ov'){close();render()}};
const areaOpts=sel=>D.areas.map(a=>`<option value="${a.id}" ${a.id==sel?'selected':''}>${a.i} ${esc(a.n)}</option>`).join('');
function areaSheet(id){const a=AR(id),L=D.todos.filter(t=>t.a==id&&!t.done&&!sleeping(t)),E=D.events.filter(e=>e.a==id&&days(e.d)>=0);
 const PR=[[1,'Hoch',PC(1)],[2,'Mittel',PC(2)],[3,'Niedrig',PC(3)]];
 const row=t=>{const dd=t.d?days(t.d):null,c=PR[t.p-1][2];return `<div class="atd" style="border-left-color:${c}"><button class="ck" data-done="${t.id}"></button><div class="t">${esc(t.t)}${t.d?`<small><span class="chip" style="${dd<0?'color:var(--red)':dd<=1?'color:var(--cy)':''}">${dd==0?'heute':dd==1?'morgen':dd<0?'überfällig · '+fd(t.d):fd(t.d)}</span></small>`:''}</div><button class="x" data-ed="${t.id}">✎</button></div>`};
 sheet(`<div class="row"><div class="ahead"><div class="ic" style="background:${a.c}26;filter:drop-shadow(0 0 10px ${a.c}66)">${a.i}</div><div><b>${esc(a.n)}</b><small>${L.length} offen${E.length?' · '+E.length+' Termin'+(E.length>1?'e':''):''}</small></div></div><button class="x" id="cl" style="font-size:20px">✕</button></div>
 <label style="margin-top:14px">Wie zufrieden bist du gerade mit diesem Bereich?</label>
 <div class="seg">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button data-sc="${n}" style="${n==a.s?`background:${a.c};color:#03080c;font-weight:600;box-shadow:0 0 12px ${a.c}`:''}">${n}</button>`).join('')}</div>
 ${PR.map(([p,l,c])=>{const G=L.filter(t=>t.p==p).sort((x,y)=>(x.d||'9').localeCompare(y.d||'9'));return G.length?`<div class="agrp"><h4><span class="dot" style="background:${c};color:${c}"></span>${l} · ${G.length}</h4>${G.map(row).join('')}</div>`:''}).join('')||'<div class="empty" style="margin-top:14px">Keine offenen To-dos – läuft. ✨</div>'}
 <div class="addrow"><input id="nt" placeholder="Neues To-do für ${esc(a.n)}…"><select id="np"><option value="1">Hoch</option><option value="2" selected>Mittel</option><option value="3">Niedrig</option></select><button class="btn" id="ntb">+</button></div>
 ${E.length?`<div class="agrp"><h4>📅 Termine</h4>${E.map(evRow).join('')}</div>`:''}`);
 $('cl').onclick=()=>{close();render()};
 document.querySelectorAll('[data-sc]').forEach(b=>b.onclick=()=>{a.s=+b.dataset.sc;save();areaSheet(id)});
 const add=()=>{const v=$('nt').value.trim();if(!v)return;D.todos.push({id:D.next++,t:v,a:id,p:+$('np').value,d:'',done:false});save();areaSheet(id);$('nt').focus()};
 $('ntb').onclick=add;$('nt').onkeydown=e=>{if(e.key=='Enter')add()};
 document.querySelectorAll('#sh [data-done]').forEach(b=>b.onclick=()=>{const t=D.todos.find(x=>x.id==+b.dataset.done);tick(t);save();areaSheet(id)});
 document.querySelectorAll('#sh [data-ed]').forEach(b=>b.onclick=()=>todoSheet(+b.dataset.ed));bindEv($('sh'));
}
function todoSheet(id){const t=id?D.todos.find(x=>x.id==id):{id:D.next,t:'',a:'musik',p:2,d:'',done:false,_n:1};
 sheet(`<div class="row"><b style="font-size:18px">${id?'To-do bearbeiten':'Neues To-do'}</b><button class="x" id="cl">✕</button></div>
 <label>Was?</label><input id="tt" value="${esc(t.t)}"><div class="g2"><div><label>Bereich</label><select id="ta">${areaOpts(t.a)}</select></div><div><label>Priorität</label><select id="tp">${[[1,'Hoch'],[2,'Mittel'],[3,'Niedrig']].map(([v,l])=>`<option value="${v}" ${t.p==v?'selected':''}>${l}</option>`).join('')}</select></div></div>
 <div class="g2"><div><label>Fällig am (optional)</label><input type="date" id="td" value="${t.d}"></div><div><label>Wiederholen</label><select id="tr"><option value="">Nie</option>${Object.entries(REP).map(([k,v])=>`<option value="${k}" ${t.rep==k?'selected':''}>${v[0]}</option>`).join('')}</select></div></div>
 <div style="margin-top:8px;font-size:12px;color:var(--mu)">↻ Wiederkehrende To-dos springen beim Abhaken automatisch weiter und tauchen 3 Tage vor dem Termin wieder auf.</div>
 <div class="row" style="margin-top:12px">${id?'<button class="btn g" id="del" style="color:var(--red)">Löschen</button>':'<span></span>'}<button class="btn" id="ok">Speichern</button></div>`);
 $('cl').onclick=()=>{close();render()};$('ok').onclick=()=>{t.t=$('tt').value.trim();if(!t.t)return;t.a=$('ta').value;t.p=+$('tp').value;t.d=$('td').value;t.rep=$('tr').value||undefined;if(t.rep&&!t.d)t.d=T0;if(t._n){delete t._n;D.next++;D.todos.push(t)}close();render();save()};
 if(id)$('del').onclick=()=>{D.todos=D.todos.filter(x=>x.id!=id);close();render();save()};
}
function evSheet(id){const e=id?D.events.find(x=>x.id==id):{id:D.next,t:'',d:T0,a:'musik',_n:1};
 sheet(`<div class="row"><b style="font-size:18px">${id?'Termin bearbeiten':'Neuer Termin'}</b><button class="x" id="cl">✕</button></div>
 <label>Was?</label><input id="et" value="${esc(e.t)}"><div class="g2"><div><label>Datum</label><input type="date" id="ed" value="${e.d}"></div><div><label>Bereich</label><select id="ea">${areaOpts(e.a)}</select></div></div>
 <label>Art</label><select id="ek"><option value="">Termin</option><option value="gig" ${e.gig?'selected':''}>🎤 Gig</option><option value="dl" ${e.dl?'selected':''}>⏰ Deadline</option></select>
 <div class="row" style="margin-top:12px">${id?'<button class="btn g" id="del" style="color:var(--red)">Löschen</button>':'<span></span>'}<button class="btn" id="ok">Speichern</button></div>`);
 $('cl').onclick=close;$('ok').onclick=()=>{e.t=$('et').value.trim();if(!e.t)return;e.d=$('ed').value||T0;e.a=$('ea').value;const k=$('ek').value;e.gig=k=='gig';e.dl=k=='dl';if(e._n){delete e._n;D.next++;D.events.push(e)}close();render();save()};
 if(id)$('del').onclick=()=>{D.events=D.events.filter(x=>x.id!=id);close();render();save()};
}
function excSheet(){sheet(`<div class="row"><b style="font-size:18px">Schicht-Ausnahme</b><button class="x" id="cl">✕</button></div>
 <div class="g2"><div><label>Von</label><input type="date" id="x1" value="${T0}"></div><div><label>Bis</label><input type="date" id="x2" value="${T0}"></div></div>
 <label>Was?</label><select id="xt"><option value="urlaub">Urlaub / frei</option><option value="früh">Frühschicht</option><option value="spät">Spätschicht</option><option value="tag">Tagschicht 9–17</option></select>
 <label>Oder: Rhythmus neu setzen – diese Woche ist eine …</label><select id="xb"><option value="">(nicht ändern)</option><option value="früh">Frühschicht-Woche</option><option value="spät">Spätschicht-Woche</option></select>
 <button class="btn" id="ok" style="width:100%;margin-top:16px">Speichern</button>`);
 $('cl').onclick=close;$('ok').onclick=()=>{const a=P($('x1').value||T0),b=P($('x2').value||T0);for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1))D.shifts.exc[iso(d)]=$('xt').value;
  if($('xb').value){D.shifts.base=WK;D.shifts.baseType=$('xb').value}close();render();save()}}
function habitSheet(){sheet(`<div class="row"><b style="font-size:18px">Routinen bearbeiten</b><button class="x" id="cl">✕</button></div><p class="sub">Name und Wochenziel (wie oft pro Woche).</p>
 ${D.habits.map((x,i)=>`<div class="row" style="margin-top:8px"><input data-hn="${i}" value="${esc(x.t)}"><input data-hg="${i}" type="number" min="1" max="7" value="${x.goal}" style="width:70px"><button class="x" data-hr="${i}">✕</button></div>`).join('')}
 <div class="row" style="margin-top:8px"><input id="nh" placeholder="Neue Routine, z. B. 🎧 Referenztrack analysieren"><button class="btn g" id="nhb">+</button></div><button class="btn" id="ok" style="width:100%;margin-top:16px">Fertig</button>`);
 const g=()=>document.querySelectorAll('[data-hn]').forEach(e=>{const i=+e.dataset.hn;D.habits[i].t=e.value;D.habits[i].goal=+document.querySelector(`[data-hg="${i}"]`).value||1});
 document.querySelectorAll('[data-hr]').forEach(b=>b.onclick=()=>{g();D.habits.splice(+b.dataset.hr,1);habitSheet()});
 $('nhb').onclick=()=>{g();const v=$('nh').value.trim();if(v){D.habits.push({id:'h'+D.next++,t:v,goal:3});habitSheet()}};
 $('cl').onclick=$('ok').onclick=()=>{g();close();render();save()}}
function kpiSheet(id){const k=D.kpis.find(x=>x.id==id);sheet(`<div class="row"><b style="font-size:18px">${esc(k.l)}</b><button class="x" id="cl">✕</button></div>
 <label>Wert</label><input id="kv" value="${esc(k.v)}"><label>Stand / Info</label><input id="ks" value="Stand ${fd(T0)}"><button class="btn" id="ok" style="width:100%;margin-top:16px">Speichern</button>`);
 $('cl').onclick=close;$('ok').onclick=()=>{k.v=$('kv').value;k.s=$('ks').value;close();render();save()}}
function reviewSheet(){sheet(`<div class="row"><b style="font-size:18px">Wochen-Check-in</b><button class="x" id="cl">✕</button></div><p class="sub">Wie zufrieden bist du gerade mit jedem Bereich? 1 = gar nicht, 10 = perfekt. Ehrlich, nicht schön.</p>
 ${D.areas.map((a,i)=>`<label>${a.i} ${esc(a.n)} <b id="rv${i}" style="color:${a.c}">${a.s}</b></label><input type="range" min="1" max="10" value="${a.s}" data-rv="${i}">`).join('')}
 <label>Was lief diese Woche gut, was nicht? (optional)</label><textarea id="rn"></textarea>
 <button class="btn" id="ok" style="width:100%;margin-top:16px">Check-in speichern</button>`);
 document.querySelectorAll('[data-rv]').forEach(r=>r.oninput=()=>$('rv'+r.dataset.rv).textContent=r.value);
 $('cl').onclick=close;$('ok').onclick=()=>{document.querySelectorAll('[data-rv]').forEach(r=>D.areas[+r.dataset.rv].s=+r.value);
  D.reviews=D.reviews.filter(r=>r.d!=T0);D.reviews.push({d:T0,sc:score(),s:Object.fromEntries(D.areas.map(a=>[a.id,a.s])),n:$('rn').value.trim()});close();render();save()}}

/* ---------- Eingabefeld: Claude sortiert ein ---------- */
function guessArea(t){t=t.toLowerCase();const k=[['musik',/gig|studio|session|song|track|label|release|insta|story|reel|collab|kollab|beatport|spotify|set\b|booking|mix|master|ep\b/],['lernen',/serum|sound|ableton|template|plugin|tutorial|masterclass|lernen/],['projekte',/alien|canvas|claude|vault|macbook|ki\b|app|multiplayer/],['labor',/labor|amg|arbeit|lpv|jomesa|chef/],['finanzen',/rechnung|geld|versicher|elster|steuer|bank|abo|zahlen|konto|rate/],['gesundheit',/arzt|sport|rad|schlaf|gesund|training/],['liebe',/freundin|marie|date/],['familie',/oma|eltern|mama|papa|geburtstag|freund/],['zukunft',/haus|brasilien|kind|zukunft/]];for(const[a,r]of k)if(r.test(t))return a;return 'ich'}
function guessDate(t){const m=t.match(/(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?/);if(m){let y=m[3]?(+m[3]<100?2000+ +m[3]:+m[3]):TODAY.getFullYear();let d=new Date(y,m[2]-1,+m[1]);if(!m[3]&&d<TODAY)d.setFullYear(y+1);return iso(d)}
 if(/übermorgen/i.test(t)){const d=new Date(TODAY);d.setDate(d.getDate()+2);return iso(d)}if(/morgen/i.test(t)){const d=new Date(TODAY);d.setDate(d.getDate()+1);return iso(d)}if(/heute/i.test(t))return T0;return ''}
function fallback(t){const idea=/^idee[:\s]/i.test(t),d=guessDate(t),termin=!idea&&d&&/\b(gig|auftritt|termin|treffen|session|call|party|festival|um \d)/i.test(t);
 return{typ:idea?'idee':termin?'termin':'todo',text:t.replace(/^idee[:\s]*/i,''),bereich:guessArea(t),prio:/dringend|wichtig|asap|sofort/i.test(t)?1:2,datum:d}}
function capture(t,area){const r=fallback(t);const a=area||(D.areas.some(x=>x.id==r.bereich)?r.bereich:guessArea(t)),txt=r.text||t,dt=r.datum||'';let where;
 if(r.typ=='termin'&&dt){D.events.push({id:D.next++,t:txt,d:dt,a,gig:!!r.gig,dl:!!r.deadline});where='📅 Kalender'}
 else if(r.typ=='idee'){D.ideas.unshift({t:txt,a,d:T0});where='💡 Ideen'}
 else{D.todos.push({id:D.next++,t:txt,a,p:+r.prio||2,d:dt,done:false});where='✅ To-dos'}
 return{where,a,dt}}
async function quick(){const t=$('qi').value.trim();if(!t)return;$('qb').disabled=true;
 const {where,a,dt}=capture(t,capArea);
 capArea=null;render();$('qh').textContent=`Eingetragen in ${where} · ${AR(a).i} ${AR(a).n}${dt?' · '+fd(dt):''}`;save()}

/* ---------- Speichern ---------- */
let timer;function msg(t){$('sv').textContent=t;$('sv').style.display=t?'block':'none'}
const UIK='lifeos-ui';
function uiSave(){try{localStorage.setItem(UIK,JSON.stringify({pflt,pdev,view,y:scrollY,nx:[NX.sel,NX.sub],t:Date.now()}))}catch(e){}}
function uiLoad(){try{return JSON.parse(localStorage.getItem(UIK)||'null')}catch(e){return null}}
function save(){uiSave();LOS.changed()}
const BODY=`
<canvas id="stars"></canvas><div class="floor"></div>
<div class="wrap" id="root"></div>
<div class="ov" id="ov"><div class="sheet" id="sh"></div></div><div class="save" id="sv"></div>
`;

/* ---------- Sternenhimmel ---------- */
(function(){const c=$('stars'),x=c.getContext('2d');let S=[];function rs(){c.width=innerWidth;c.height=innerHeight;S=Array.from({length:90},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.3+.2,p:Math.random()*6,v:Math.random()*.08+.02}))}rs();addEventListener('resize',rs);
 (function f(t){x.clearRect(0,0,c.width,c.height);S.forEach(s=>{s.y-=s.v;if(s.y<0)s.y=c.height;x.globalAlpha=.25+.4*Math.sin(t/1400+s.p);x.fillStyle='#a9c7cf';x.globalAlpha*=.6;x.beginPath();x.arc(s.x,s.y,s.r,0,7);x.fill()});requestAnimationFrame(f)})(0)})();
{const u=uiLoad();if(u){if(u.pflt)pflt=u.pflt;if(u.pdev)pdev=u.pdev;const fresh=Date.now()-u.t<120000;
 if(fresh){if(!location.hash&&u.view&&u.view!='start'){view=u.view;history.replaceState(null,'','#'+view)}if(u.nx&&u.nx[0]){NX.sel=u.nx[0];NX.sub=u.nx[1];NX.k=1}}
 applyTheme();render();if(fresh&&u.y)requestAnimationFrame(()=>scrollTo(0,u.y))}else{applyTheme();render()}}



/* ---------- Lesbare Notizen für Obsidian ---------- */
function lifeMarkdown(){
 const now=new Date(),stamp=pad(now.getDate())+'.'+pad(now.getMonth()+1)+'.'+now.getFullYear()+', '+pad(now.getHours())+':'+pad(now.getMinutes())+' Uhr';
 const head=(title,icon)=>`---\ntags: [life-os]\n---\n# ${icon} ${title}\n\n> ⚙ Wird automatisch von der **Life-OS-App** geschrieben (Stand ${stamp}). Änderungen hier werden überschrieben – neue Sachen bitte in der App oder in [[Eingang]] eintragen.\n\n`;
 const ar=id=>{const a=AR(id);return a?a.i+' '+a.n:''};
 const dd=s=>s?fd(s):'';
 const PR={1:'🔴 Hoch',2:'🟢 Mittel',3:'🔵 Niedrig'};
 const o=open(),F=ftot();
 const tdLine=t=>`- [${t.done?'x':' '}] ${t.t}${t.d?' · 📅 '+dd(t.d):''}${t.rep?' · ↻ '+(REP[t.rep]||[t.rep])[0]:''} · ${ar(t.a)}`;
 // Übersicht
 const st=shift(T0),S=SH[st]||SH.frei;
 let u=head('Life OS – Übersicht','🌌');
 u+=`**Heute:** ${WDL[TODAY.getDay()]}, ${pad(TODAY.getDate())}.${pad(TODAY.getMonth()+1)}. · ${S[0]} (${S[2]}) · Life Score **${score()}**\n\n`;
 u+=`## Fokus (hohe Priorität)\n`+(o.filter(t=>t.p==1).map(tdLine).join('\n')||'_nichts Dringendes_')+'\n\n';
 u+=`## Als Nächstes im Kalender\n`+(upcoming(6).map(e=>`- ${dd(e.d)}${e.e?' – '+dd(e.e):''}: ${e.t}${e.gig?' 🎧':''}`).join('\n')||'_keine Termine_')+'\n\n';
 u+=`## Tracks in Arbeit\n`+((D.tracks||[]).map(t=>`- **${t.t}**${t.with?' ('+t.with+')':''} – ${t.stage||''}${t.next?' → '+t.next:''}${t.dl?' · bis '+dd(t.dl):''}`).join('\n')||'_keine_')+'\n\n';
 u+=`## Warte auf …\n`+((D.waits||[]).map(w=>`- **${w.who}**: ${w.what}${w.since?' (seit '+dd(w.since)+')':''}${w.next?' → '+w.next:''}`).join('\n')||'_nichts_')+'\n\n';
 u+=`## Projekte, die laufen\n`+PJ('läuft').map(p=>`- **${p.t}**${p.next?' → '+p.next:''}`).join('\n')+'\n\n';
 u+=`## Lebensbereiche\n`+D.areas.map(a=>`- ${a.i} ${a.n}: **${a.s}/10**`).join('\n')+'\n\n';
 u+=`## Finanzen\n- Einnahmen ${eur(F.e)} · Fixkosten ${eur(F.a)} · Abos/Jahr anteilig ${eur(F.j)}\n- **Bleibt im Monat: ${eur(F.r)}**\n\n`;
 u+=`## Cockpit\n`+(D.kpis||[]).map(k=>`- ${k.l}: **${k.v}** (${k.s})`).join('\n')+'\n\n';
 u+=`Siehe auch: [[To-dos]] · [[Projekte]] · [[Kalender]] · [[Check-in-Protokoll]] · [[Eingang]]\n`;
 // To-dos
 let t=head('To-dos','✅');
 for(const p of [1,2,3]){const L=o.filter(x=>x.p==p);t+=`## ${PR[p]} (${L.length})\n`+(L.map(tdLine).join('\n')||'_leer_')+'\n\n'}
 const W=D.todos.filter(x=>!x.done&&sleeping(x));if(W.length)t+=`## ↻ Kommt wieder\n`+W.map(tdLine).join('\n')+'\n\n';
 const Dn=D.todos.filter(x=>x.done&&x.at&&days(x.at)>=-14).sort((a,b)=>b.at.localeCompare(a.at));t+=`## Erledigt (letzte 14 Tage)\n`+(Dn.map(x=>`- [x] ${x.t} · ${dd(x.at)}`).join('\n')||'_noch nichts_')+'\n';
 // Projekte
 let p=head('Projekte','✦');
 const SECN=Object.fromEntries(PSEC.map(s=>[s[0],s[1]+' '+s[2]]));
 const DEVN={ueberall:'📱 Überall',pc:'🖥 Studio-PC',mac:'💻 MacBook',arbeit:'🏭 Auf Arbeit'};
 for(const k of Object.keys(PG)){const L=PJ(k);p+=`## ${PG[k][0]} (${L.length})\n`;
  if(!L.length){p+='_Gerade nichts._\n\n';continue}
  for(const x of L){p+=`- **${x.t}** (${SECN[x.sec]||''}${k=='queue'?' · '+PST[x.st][0]:''})${x.desc?' – '+x.desc:''}\n`;
   if(x.st=='fertig')p+=`  - Zufriedenheit: ${x.rate?remo(x.rate)+' '+RATE[x.rate-1][2]:'☆ noch nicht bewertet'}${x.done?' · fertig seit '+dd(x.done):''}${x.lesson?' · „'+x.lesson+'“':''}\n`;
   else if(x.next)p+=`  - → ${x.next}\n`;
   const dv=(x.dev||[]).map(d=>DEVN[d]||d).join(' · '),sw=(x.sw||[]).join(', ');
   if(dv||sw)p+=`  - ${dv||'–'}${sw?' · Software: '+sw:''}\n`;
   p+=`  - Zählt für: ${ar(PA(x))}${x.where?' · Liegt: '+x.where:''}\n`}
  p+='\n'}
 if((D.ideas||[]).length)p+=`## 💭 Schnelle Ideen\n`+D.ideas.map(i=>`- ${i.t}${i.d?' ('+dd(i.d)+')':''}`).join('\n')+'\n';
 // Kalender
 let k=head('Kalender','📅');
 const E=D.events.filter(e=>days(e.e||e.d)>=0&&days(e.d)<=90).sort((a,b)=>a.d.localeCompare(b.d));
 k+=`## Nächste 90 Tage\n`+(E.map(e=>`- ${dd(e.d)}${e.e?' – '+dd(e.e):''}: ${e.t}${e.gig?' 🎧 Gig':''}${e.dl?' ⏰ Deadline':''} · ${ar(e.a)}`).join('\n')||'_keine_')+'\n\n';
 k+=`## Schichten (nächste 14 Tage)\n`;for(let i=0;i<14;i++){const d=new Date(TODAY);d.setDate(d.getDate()+i);const s=SH[shift(iso(d))]||SH.frei;k+=`- ${fd(iso(d))}: ${s[0]}\n`}
 // Protokoll
 let l=head('Check-in-Protokoll','🗒');
 l+=(D.log||[]).map(x=>`## ${x.at.replace('T',' · ')}\n`+(x.items||[]).map(i=>'- '+i).join('\n')).join('\n\n')+'\n';
 return {'Life OS – Übersicht.md':u,'To-dos.md':t,'Projekte.md':p,'Kalender.md':k,'Check-in-Protokoll.md':l};
}
/* ---------- Anbindung an Sync-Modul ---------- */
LOS.hooks={render:()=>{render()},sheet,close,capture:(t)=>capture(t),busy:()=>$('ov').classList.contains('on'),markdown:()=>lifeMarkdown()};
