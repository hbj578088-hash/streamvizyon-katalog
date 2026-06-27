
const $=(q,r=document)=>r.querySelector(q);
const $$=(q,r=document)=>[...r.querySelectorAll(q)];
const state={query:"",genre:"Tümü",type:"Tümü",sort:"Önerilen",item:null,episode:null,localUrl:null};

function sourceKey(itemId, epId){return itemId+"__"+epId}
function getLegalSources(){try{return JSON.parse(localStorage.getItem("sv5_legal_sources")||"{}")}catch{return {}}}
function setLegalSources(map){localStorage.setItem("sv5_legal_sources", JSON.stringify(map))}
function getSourceOverride(itemId, epId){
  const map=getLegalSources();
  const key=sourceKey(itemId, epId);
  const val=(map[key]||"").trim();
  return val;
}
function isEmbedUrl(url){
  return /\/embed\/|videoembed|video_ext\.php|player|iframe|youtube\.com\/embed|youtu\.be|vimeo\.com/i.test(url);
}
function isDirectVideo(url){
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
}

function page(){return document.body.dataset.page||"home"}
function param(k){return new URL(location.href).searchParams.get(k)}
function itemById(id){return CATALOG.find(x=>x.id===id)||CATALOG[0]}
function allEpisodes(item){return (item.seasons||[]).flatMap(s=>s.episodes.map(e=>({...e,season:s.name})))}
function firstEp(item){return allEpisodes(item)[0]||{id:"film",no:"Film",title:item.title,duration:item.duration,videoUrl:""}}
function episodeSources(item, ep){
  const arr = [];
  if(ep.sources && Array.isArray(ep.sources)) arr.push(...ep.sources.filter(s=>s && s.url));
  if(ep.videoUrl && !arr.some(s=>s.url===ep.videoUrl)) arr.unshift({label:"Kaynak 1", url:ep.videoUrl});
  if(item.videoUrl && !arr.some(s=>s.url===item.videoUrl)) arr.push({label:"Ana Kaynak", url:item.videoUrl});
  return arr;
}
function isDirectVideo(url){return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url)}
function isEmbedUrl(url){return !isDirectVideo(url)}

function glyph(t){return String(t).split(/\s+/).map(x=>x[0]).join("").slice(0,2).toLocaleUpperCase("tr-TR")}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function cssUrl(u){return u ? `url("${String(u).replaceAll('"','%22')}")` : ""}
function posterBg(item){return item.poster ? `background-image:linear-gradient(180deg,transparent 0 48%,#000 100%),${cssUrl(item.poster)}` : `background-image:radial-gradient(circle at 25% 18%,#fff6 0 4%,transparent 14%),radial-gradient(circle at 70% 28%,${item.colors[1]} 0 17%,transparent 48%),linear-gradient(135deg,${item.colors[0]},${item.colors[2]})`}
function backBg(item){return (item.backdrop||item.poster) ? `background-image:linear-gradient(90deg,#05050688,#05050622),${cssUrl(item.backdrop||item.poster)}` : posterBg(item)}
function favs(){try{return JSON.parse(localStorage.getItem("sv4_favs")||"[]")}catch{return[]}}
function setFavs(v){localStorage.setItem("sv4_favs",JSON.stringify(v))}
function isFav(id){return favs().includes(id)}
function toggleFav(id){const f=favs();setFavs(f.includes(id)?f.filter(x=>x!==id):[...f,id]);toast(f.includes(id)?"Favoriden kaldırıldı":"Favoriye eklendi");render()}
function pkey(id,ep="main"){return id+"__"+ep}
function getProg(id,ep="main"){try{const s=JSON.parse(localStorage.getItem("sv4_prog")||"{}");return s[pkey(id,ep)]??s[id]??0}catch{return 0}}
function setProg(id,val,ep="main"){try{const s=JSON.parse(localStorage.getItem("sv4_prog")||"{}");const v=Math.max(0,Math.min(100,Math.round(val)));s[pkey(id,ep)]=v;s[id]=Math.max(s[id]||0,v);localStorage.setItem("sv4_prog",JSON.stringify(s))}catch{}}

function progressStore(){try{return JSON.parse(localStorage.getItem("sv4_prog")||"{}")}catch{return {}}}
function itemProgress(item){
 const s=progressStore();
 let best=Number(s[item.id]||0);
 allEpisodes(item).forEach(e=>{best=Math.max(best,Number(s[pkey(item.id,e.id)]||0))});
 return Math.max(0,Math.min(100,Math.round(best||0)));
}
function continueRows(){
 const s=progressStore(), rows=[];
 CATALOG.forEach(item=>{
   const eps=allEpisodes(item), first=eps[0];
   eps.forEach(ep=>{
     const v=Number(s[pkey(item.id,ep.id)] ?? (ep.id===first?.id ? s[item.id] : 0) ?? 0);
     if(v>0) rows.push({item,ep,val:Math.max(0,Math.min(100,Math.round(v)))});
   });
 });
 return rows.sort((a,b)=>b.val-a.val || a.item.title.localeCompare(b.item.title,"tr"));
}
function continueItems(){
 const map=new Map();
 continueRows().forEach(r=>{if(!map.has(r.item.id))map.set(r.item.id,r)});
 return [...map.values()];
}
function searchText(item){
 return [item.title,item.type,item.year,item.desc,item.long,item.director,item.country,item.studio,item.alt,...(item.genres||[]),...(item.cast||[])].join(" ").toLocaleLowerCase("tr-TR");
}
function goSearch(q){
 q=String(q||"").trim();
 if(q) location.href="katalog.html?q="+encodeURIComponent(q);
 else location.href="katalog.html";
}
function progressCard(r,i=0){
 return `<a class="continue-card" href="izle.html?id=${encodeURIComponent(r.item.id)}&ep=${encodeURIComponent(r.ep.id)}" style="animation-delay:${Math.min(i*25,250)}ms">
  <div class="continue-poster" style='${posterBg(r.item)}' data-glyph="${glyph(r.item.title)}"></div>
  <div class="continue-info">
    <b>${esc(r.item.title)}</b>
    <small>${esc(r.ep.season||"Sezon")} • ${esc(r.ep.no)} • ${esc(r.ep.title)}</small>
    <div class="line-progress"><span style="width:${r.val}%"></span></div>
  </div>
  <span class="continue-rate">%${r.val}</span>
 </a>`;
}

function toast(m){const t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(window.tst);window.tst=setTimeout(()=>t.classList.remove("show"),1700)}
function initShell(){
 $$(".menu a").forEach(a=>{if(a.dataset.page===page())a.classList.add("active")});
 const s=$("#topSearch");
 const navBtn=$(".nav-right .icon-btn");
 if(s){
   if(page()==="catalog" && param("q")) s.value=param("q");
   let box=document.createElement("div");
   box.className="search-suggest";
   s.closest(".top-search")?.appendChild(box);
   function closeSuggest(){box.innerHTML="";box.classList.remove("show")}
   function showSuggest(q){
     q=String(q||"").trim().toLocaleLowerCase("tr-TR");
     if(!q){closeSuggest();return}
     const hits=CATALOG.filter(x=>searchText(x).includes(q)).slice(0,7);
     box.innerHTML=hits.length ? hits.map(x=>`<a href="detay.html?id=${encodeURIComponent(x.id)}"><b>${esc(x.title)}</b><small>${x.year} • ${x.type} • ${x.genres.slice(0,2).map(esc).join(", ")}</small></a>`).join("") + `<button data-search-all>“${esc(s.value)}” ara</button>` : `<button data-search-all>“${esc(s.value)}” için katalogda ara</button>`;
     box.classList.add("show");
     const all=box.querySelector("[data-search-all]");
     if(all) all.onclick=()=>goSearch(s.value);
   }
   s.addEventListener("input",e=>{
     showSuggest(e.target.value);
     if(page()==="catalog"){
       state.query=e.target.value;
       const q=$("#q"); if(q && q!==s) q.value=e.target.value;
       if(typeof updateCatalog==="function") updateCatalog();
     }
   });
   s.addEventListener("keydown",e=>{if(e.key==="Enter")goSearch(s.value); if(e.key==="Escape")closeSuggest()});
   s.addEventListener("blur",()=>setTimeout(closeSuggest,180));
   if(navBtn) navBtn.onclick=()=>goSearch(s.value);
 }
}
function card(item,i=0,opt={}){
 const ep=firstEp(item), prog=itemProgress(item), fav=isFav(item.id)?"active":"";
 return `<article class="card" style="animation-delay:${Math.min(i*32,320)}ms" data-detail="detay.html?id=${encodeURIComponent(item.id)}">
  ${opt.rank?`<span class="rank-num">${opt.rank}</span>`:`<span class="badge">${esc(item.badge||item.type)}</span>`}
  <button class="fav ${fav}" data-fav="${esc(item.id)}" title="Favori">${fav?"♥":"♡"}</button>
  <div class="poster" style='${posterBg(item)}' data-glyph="${glyph(item.title)}">
    <a class="play" data-watch href="izle.html?id=${encodeURIComponent(item.id)}&ep=${encodeURIComponent(ep.id)}">▶</a>
    ${(opt.continue || prog>0)?`<div class="progress"><span style="--p:${prog}%"></span></div>`:""}
  </div>
  <div class="card-body"><div class="card-title"><b>${esc(item.title)}</b><span class="rate">★ ${esc(item.score)}</span></div><div class="card-meta">${item.year} • ${item.type} ${prog>0?`• %${prog}`:""}</div>${opt.desc?`<p class="card-desc">${esc(item.desc)}</p>`:""}</div>
 </article>`
}
function attach(root=document){ $$("[data-watch]",root).forEach(a=>a.onclick=e=>e.stopPropagation()); $$("[data-fav]",root).forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFav(b.dataset.fav)}); $$("[data-detail]",root).forEach(c=>c.onclick=()=>location.href=c.dataset.detail)}
function genreButtons(){return GENRES.map(g=>`<button class="side-btn ${state.genre===g?"active":""}" data-genre="${esc(g)}"><span>${esc(g)}</span><small>${g==="Tümü"?CATALOG.length:CATALOG.filter(x=>x.genres.includes(g)||x.type===g).length}</small></button>`).join("")}
function renderHome(){
 const hero=CATALOG[0], cont=continueItems().slice(0,6);
 $("#app").innerHTML=`<section class="hero"><div class="hero-art" style='${backBg(hero)}' data-glyph="${glyph(hero.title)}"></div><div class="shell hero-content"><div><div class="eyebrow">Öne çıkan yapım</div><h1 class="hero-title">${esc(hero.title)}</h1><p class="hero-desc">${esc(hero.long)}</p><div class="pills"><span class="pill">${hero.type}</span><span class="pill">${hero.year}</span><span class="pill">${hero.duration}</span><span class="pill">★ ${hero.score}</span>${hero.genres.slice(0,5).map(g=>`<span class="pill">${esc(g)}</span>`).join("")}</div><div class="actions"><a class="btn btn-primary" href="izle.html?id=${hero.id}">▶ Şimdi İzle</a><a class="btn btn-ghost" href="detay.html?id=${hero.id}">Tanıtım Sayfası</a><button class="btn btn-ghost" data-fav="${hero.id}">${isFav(hero.id)?"♥ Favoride":"♡ Favoriye Ekle"}</button></div></div></div></section><div class="shell page"><div class="layout"><aside class="panel side"><h3>Türlere Göre Keşfet</h3><div class="side-list">${genreButtons()}</div></aside><div><div class="section-head"><div><h2 class="section-title">Eklenen Tüm İçerikler</h2><p class="section-sub">${CATALOG.length} film/dizi/anime kataloğa eklendi. Kart = tanıtım, play = izlemeye gider.</p></div><a class="red-link" href="katalog.html">Tümünü Gör ›</a></div><div class="card-grid">${CATALOG.slice(0,15).map((x,i)=>card(x,i)).join("")}</div><section class="section"><div class="section-head"><div><h2 class="section-title">İzlemeye Devam Et</h2><p class="section-sub">Hangi bölümde kaldıysan burada görünür.</p></div><a class="red-link" href="favoriler.html">Listeme Git ›</a></div><div class="continue-list home-continue">${cont.length?cont.map((r,i)=>progressCard(r,i)).join(""):'<div class="empty">Henüz izleme ilerlemesi yok.</div>'}</div></section></div></div></div>`;
 attach();
 $$(".side-btn").forEach(b=>b.onclick=()=>location.href="katalog.html?genre="+encodeURIComponent(b.dataset.genre));
}
function filtered(){let list=CATALOG.filter(x=>{const q=state.query.toLocaleLowerCase("tr-TR").trim();return(!q||searchText(x).includes(q))&&(state.genre==="Tümü"||x.genres.includes(state.genre)||x.type===state.genre)&&(state.type==="Tümü"||x.type===state.type)}); if(state.sort==="Puan")list.sort((a,b)=>Number(b.score)-Number(a.score));else if(state.sort==="Yıl")list.sort((a,b)=>b.year-a.year);else if(state.sort==="A-Z")list.sort((a,b)=>a.title.localeCompare(b.title,"tr"));else list.sort((a,b)=>b.trend-a.trend);return list}
function renderCatalog(){
 state.query=param("q")||state.query||"";
 state.genre=param("genre")||state.genre||"Tümü";
 $("#app").innerHTML=`<div class="shell page"><h1 class="page-title">Katalog</h1><p class="section-sub">İçerik arama, filtre ve sıralama çalışır. Kart tanıtıma, play izlemeye gider.</p><label class="big-search">⌕ <input id="q" value="${esc(state.query)}" placeholder="Film, dizi, anime, oyuncu veya tür ara..."></label><div class="panel filterbar"><button class="btn btn-ghost btn-small" id="clear">✕ Temizle</button><select id="type">${TYPES.map(x=>`<option ${state.type===x?"selected":""}>${x}</option>`).join("")}</select><select id="sort">${["Önerilen","Puan","Yıl","A-Z"].map(x=>`<option ${state.sort===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="layout section"><aside class="panel side"><h3>Tür</h3><div class="side-list">${genreButtons()}</div></aside><div><div class="section-head"><div><h2 class="section-title" id="count">Sonuçlar</h2><p class="section-sub">Detay, favori ve izleme sayfaları bağlı.</p></div></div><div class="card-grid catalog" id="grid"></div></div></div></div>`;
 const top=$("#topSearch"); if(top) top.value=state.query;
 $("#q").oninput=e=>{state.query=e.target.value; if(top) top.value=state.query; updateCatalog()};
 $("#type").onchange=e=>{state.type=e.target.value;updateCatalog()};
 $("#sort").onchange=e=>{state.sort=e.target.value;updateCatalog()};
 $("#clear").onclick=()=>{state.query="";state.genre="Tümü";state.type="Tümü";state.sort="Önerilen";const top=$("#topSearch");if(top)top.value="";renderCatalog()};
 $$(".side-btn").forEach(b=>b.onclick=()=>{state.genre=b.dataset.genre;$$(".side-btn").forEach(x=>x.classList.toggle("active",x===b));updateCatalog()});
 updateCatalog();
}
function updateCatalog(){const list=filtered();$("#count").textContent=list.length+" içerik bulundu";$("#grid").innerHTML=list.length?list.map((x,i)=>card(x,i,{desc:true})).join(""):'<div class="empty"><b>Sonuç yok.</b><span>Aramayı temizleyip tekrar dene.</span></div>';attach($("#grid"))}
function renderTrend(){const top=[...CATALOG].sort((a,b)=>b.trend-a.trend);$("#app").innerHTML=`<div class="shell page"><h1 class="page-title">Trend</h1><p class="section-sub">Yükselen yapımlar ve popüler listeler.</p><section class="section panel" style="padding:16px"><div class="section-head"><div><h2 class="section-title">🔥 Bugün Trend</h2><p class="section-sub">En çok izlenen ilk 5.</p></div></div><div class="rank-grid">${top.slice(0,5).map((x,i)=>card(x,i,{rank:i+1})).join("")}</div></section><section class="section panel" style="padding:16px"><div class="section-head"><div><h2 class="section-title">📈 Tüm Popülerler</h2></div></div><div class="card-grid">${top.slice(5,20).map((x,i)=>card(x,i)).join("")}</div></section><section class="section panel" style="padding:16px"><h2 class="section-title">🏆 Top 10</h2><ol class="top10">${top.slice(0,10).map((x,i)=>`<li><a href="detay.html?id=${x.id}">${i+1}. ${esc(x.title)}</a><em>%${x.trend}</em></li>`).join("")}</ol></section></div>`;attach()}
function renderFav(){
 state.favTab = state.favTab || "favs";
 state.favQ = state.favQ || "";
 state.favType = state.favType || "Tümü";
 state.favSort = state.favSort || "Son Eklenen";

 const favIds=favs(), favSet=new Set(favIds);
 const allFavs=CATALOG.filter(x=>favSet.has(x.id));
 const allCont=continueRows();
 const q=state.favQ.toLocaleLowerCase("tr-TR").trim();
 const typeOk=item=>state.favType==="Tümü"||item.type===state.favType;
 const textOk=(item,ep=null)=>!q||[searchText(item),ep?.title,ep?.no,ep?.season].join(" ").toLocaleLowerCase("tr-TR").includes(q);
 const sortItems=list=>{
   const arr=[...list];
   if(state.favSort==="Trend")arr.sort((a,b)=>b.trend-a.trend);
   else if(state.favSort==="Puan")arr.sort((a,b)=>b.score-a.score);
   else if(state.favSort==="Yıl")arr.sort((a,b)=>b.year-a.year);
   else if(state.favSort==="A-Z")arr.sort((a,b)=>a.title.localeCompare(b.title,"tr"));
   else arr.sort((a,b)=>favIds.indexOf(a.id)-favIds.indexOf(b.id));
   return arr;
 };
 const favList=sortItems(allFavs.filter(x=>typeOk(x)&&textOk(x)));
 const contRows=allCont.filter(r=>typeOk(r.item)&&textOk(r.item,r.ep));
 const contUnique=continueItems();
 const completed=allCont.filter(r=>r.val>=95).length;

 const favGrid=favList.length?`<div class="card-grid">${favList.map((x,i)=>card(x,i,{desc:true})).join("")}</div>`:`<div class="empty fav-empty"><b>Henüz favori yok.</b><span>Katalogdan kalbe basınca burada görünür.</span><a class="btn btn-primary btn-small" href="katalog.html">Kataloğa Git</a></div>`;
 const contGrid=contRows.length?`<div class="continue-list">${contRows.map((r,i)=>progressCard(r,i)).join("")}</div>`:`<div class="empty fav-empty"><b>İzleme ilerlemesi yok.</b><span>Bir video açınca burada otomatik görünecek.</span><a class="btn btn-primary btn-small" href="katalog.html">İzlemeye Başla</a></div>`;
 const allGrid=`<div class="fav-block"><div class="fav-block-title"><h2>♡ Favoriler</h2><small>${favList.length} içerik</small></div>${favGrid}</div><div class="fav-block"><div class="fav-block-title"><h2>◷ İzlemeye Devam Et</h2><small>${contRows.length} kayıt</small></div>${contGrid}</div>`;

 const mainTitle=state.favTab==="continue"?"İzlemeye Devam Et":state.favTab==="all"?"Hepsi":"İzleme Listem";
 const mainBody=state.favTab==="continue"?contGrid:state.favTab==="all"?allGrid:favGrid;

 $("#app").innerHTML=`<div class="shell page fav-page">
  <div class="eyebrow">Favorilerim</div>
  <h1 class="page-title">Favoriler</h1>
  <p class="section-sub">Favoriler, arama ve devam et sistemi tamamen çalışır.</p>

  <div class="fav-stats">
    <div class="fav-stat"><b>${allFavs.length}</b><span>Favori</span></div>
    <div class="fav-stat"><b>${contUnique.length}</b><span>Devam Edilen</span></div>
    <div class="fav-stat"><b>${allCont.length}</b><span>Kayıtlı Bölüm</span></div>
    <div class="fav-stat"><b>${completed}</b><span>Tamamlanan</span></div>
  </div>

  <div class="layout section fav-layout">
    <aside class="panel side fav-side">
      <h3>Listeler</h3>
      <div class="side-list">
        <button class="side-item ${state.favTab==="favs"?"active":""}" data-fav-tab="favs"><span>♡ İzleme Listem</span><small>${allFavs.length}</small></button>
        <button class="side-item ${state.favTab==="continue"?"active":""}" data-fav-tab="continue"><span>◷ Devam Et</span><small>${allCont.length}</small></button>
        <button class="side-item ${state.favTab==="all"?"active":""}" data-fav-tab="all"><span>▦ Hepsi</span><small>${allFavs.length+allCont.length}</small></button>
      </div>
      <div class="actions fav-side-actions">
        <button class="btn btn-danger btn-small" id="clrFav">Favorileri Temizle</button>
        <button class="btn btn-ghost btn-small" id="clrProg">İlerlemeyi Temizle</button>
      </div>
    </aside>

    <div class="fav-main">
      <div class="fav-toolbar panel">
        <label class="fav-search">⌕ <input id="favSearch" value="${esc(state.favQ)}" placeholder="Favorilerde ara..."></label>
        <select id="favType">${["Tümü","Film","Dizi","Anime"].map(t=>`<option value="${t}" ${state.favType===t?"selected":""}>${t}</option>`).join("")}</select>
        <select id="favSort">${["Son Eklenen","Trend","Puan","Yıl","A-Z"].map(t=>`<option value="${t}" ${state.favSort===t?"selected":""}>${t}</option>`).join("")}</select>
        <button class="btn btn-ghost btn-small" id="favReset">Sıfırla</button>
      </div>
      <div class="section-head fav-panel-head"><div><h2 class="section-title">${mainTitle}</h2><p class="section-sub">${state.favTab==="continue"?contRows.length+" kayıt":state.favTab==="all"?"Favoriler ve devam et listesi":favList.length+" içerik"}</p></div><a class="red-link" href="katalog.html">Kataloğa Git ›</a></div>
      ${mainBody}
    </div>
  </div>
 </div>`;

 $("#clrFav").onclick=()=>{setFavs([]);toast("Favoriler temizlendi");renderFav()};
 $("#clrProg").onclick=()=>{localStorage.removeItem("sv4_prog");toast("İlerleme temizlendi");renderFav()};
 $("#favReset").onclick=()=>{state.favQ="";state.favType="Tümü";state.favSort="Son Eklenen";state.favTab="favs";renderFav()};
 $$("[data-fav-tab]").forEach(b=>b.onclick=()=>{state.favTab=b.dataset.favTab;renderFav()});
 $("#favType").onchange=e=>{state.favType=e.target.value;renderFav()};
 $("#favSort").onchange=e=>{state.favSort=e.target.value;renderFav()};
 $("#favSearch").oninput=e=>{state.favQ=e.target.value;clearTimeout(window.favSearchTimer);window.favSearchTimer=setTimeout(()=>{renderFav();const n=$("#favSearch");if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}},100)};
 attach();
}
function epLink(item,e,active=false){const p=getProg(item.id,e.id);return `<a class="episode ${active?"active":""}" href="izle.html?id=${item.id}&ep=${e.id}"><div class="ep-thumb" style='${posterBg(item)}'></div><div><b>${esc(e.no)} • ${esc(e.title)}</b><small>${esc(e.duration)} • ${esc(e.desc)}</small><div class="line-progress"><span style="width:${p}%"></span></div></div><span class="rate">%${p}</span></a>`}
function renderDetail(){const item=itemById(param("id"));document.title=item.title+" - Tanıtım | StreamVizyon";const eps=allEpisodes(item), related=CATALOG.filter(x=>x.id!==item.id&&x.genres.some(g=>item.genres.includes(g))).slice(0,5);$("#app").innerHTML=`<section class="detail-hero"><div class="detail-bg" style='${backBg(item)}'></div><div class="shell detail-content"><div><div class="breadcrumb"><a href="index.html">Ana Sayfa</a> / <a href="katalog.html">Katalog</a> / <span>${esc(item.title)}</span></div><div class="eyebrow">${item.type} Tanıtım</div><h1 class="detail-title">${esc(item.title)}</h1><p class="detail-desc">${esc(item.long)}</p><div class="pills"><span class="pill">${item.year}</span><span class="pill">${esc(item.age||"")}</span><span class="pill">${esc(item.duration)}</span><span class="pill">★ ${item.score}</span>${item.genres.slice(0,6).map(g=>`<span class="pill">${esc(g)}</span>`).join("")}</div><div class="actions"><a class="btn btn-primary" href="izle.html?id=${item.id}">▶ İzleme Sayfasına Git</a><a class="btn btn-ghost" href="kaynak-panel.html?focus=${item.id}">Yasal Kaynak Ekle</a><button class="btn btn-ghost" data-fav="${item.id}">${isFav(item.id)?"♥ Favoride":"♡ Favoriye Ekle"}</button></div></div><div class="detail-poster" style='${posterBg(item)}' data-glyph="${glyph(item.title)}"></div></div></section><div class="shell page"><div class="detail-grid"><div><div class="section-head"><div><h2 class="section-title">${item.type==="Film"?"Film İzleme":"Sezon / Bölümler"}</h2><p class="section-sub">Bölüme basınca ayrı izleme sistemi açılır.</p></div></div><div class="episode-list">${eps.map(e=>epLink(item,e)).join("")}</div><section class="section"><div class="section-head"><div><h2 class="section-title">Benzer İçerikler</h2></div></div><div class="card-grid">${related.map((x,i)=>card(x,i)).join("")}</div></section></div><aside class="panel side" style="position:relative;top:auto"><h3>Yapım Bilgileri</h3><div class="info-grid" style="grid-template-columns:1fr"><div class="info"><small>Yönetmen</small><b>${esc(item.director)}</b></div><div class="info"><small>Senaryo</small><b>${esc(item.writers||"Bilinmiyor")}</b></div><div class="info"><small>Ülke</small><b>${esc(item.country||"Bilinmiyor")}</b></div><div class="info"><small>Bütçe / Hasılat</small><b>${esc(item.budget||"-")} / ${esc(item.gross||"-")}</b></div><div class="info"><small>Ödül</small><b>${esc(item.award||"-")}</b></div><div class="info"><small>Kaynak Durumu</small><b>${esc(item.sourceStatus)}</b></div></div></aside></div></div>`;attach()}
function renderWatch(){const item=itemById(param("id")), eps=allEpisodes(item), ep=eps.find(x=>x.id===(param("ep")||""))||eps[0]||firstEp(item);state.item=item;state.episode=ep;document.title=item.title+" İzle | StreamVizyon";$("#app").innerHTML=`<div class="shell watch-page"><div class="breadcrumb"><a href="index.html">Ana Sayfa</a> / <a href="detay.html?id=${item.id}">${esc(item.title)}</a> / <span>İzle</span></div><section class="watch-layout" id="layout"><div class="panel watch-player"><div class="source-warning" id="warning">Bu bölüm için otomatik video bağlantısı eklenmedi. Telif/lisans riski olmaması için sadece demo oynatıcı açılıyor. Kendi yasal video URL'ini <b>js/data.js</b> içindeki ilgili bölümün <b>videoUrl</b> alanına koyabilirsin.</div><video class="watch-video" id="video" controls playsinline></video><iframe class="watch-frame" id="embedFrame" allowfullscreen allow="autoplay; fullscreen" style="display:none"></iframe><div class="source-buttons" id="sourceButtons"></div><div class="watch-controls"><button class="btn btn-primary btn-small" id="pp">▶ / ❚❚</button><button class="btn btn-ghost btn-small" id="b10">↶ 10 sn</button><button class="btn btn-ghost btn-small" id="f10">10 sn ↷</button><button class="btn btn-ghost btn-small" id="intro">İntroyu Geç</button><button class="btn btn-ghost btn-small" id="theater">Sinema Modu</button><label class="btn btn-ghost btn-small local-watch">Yerel Video Aç<input id="localWatch" type="file" accept="video/*"></label><select id="sourceSelect"><option>Kaynak</option></select><select id="speed"><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option></select><select id="quality"><option>Otomatik</option><option>1080p</option><option>720p</option><option>480p</option></select></div><div class="watch-info"><h1>${esc(item.title)}</h1><p><b>${esc(ep.no)}</b> • ${esc(ep.title)} • ${esc(ep.duration)}</p><p>${esc(ep.desc)}</p><div class="line-progress"><span id="bar"></span></div><div class="actions"><a class="btn btn-ghost btn-small" href="detay.html?id=${item.id}">Tanıtıma Dön</a><button class="btn btn-ghost btn-small" data-fav="${item.id}">${isFav(item.id)?"♥ Favoride":"♡ Favoriye Ekle"}</button></div></div></div><aside class="panel watch-side"><h3>${item.type==="Film"?"Film":"Bölümler"}</h3><div class="episode-list">${eps.map(e=>epLink(item,e,e.id===ep.id)).join("")}</div></aside></section></div>`;initPlayer(item,ep);attach()}
function initPlayer(item,ep){
 const v=$("#video"), frame=$("#embedFrame"), bar=$("#bar"), warning=$("#warning");
 const sourceList = episodeSources(item, ep);
 let currentIndex = 0;

 function setActiveSourceUi(){
   const sel = $("#sourceSelect");
   if(sel && sourceList.length) sel.value = String(currentIndex);
   const box = $("#sourceButtons");
   if(box){
     $$("[data-source-index]", box).forEach(btn=>{
       btn.classList.toggle("active", Number(btn.dataset.sourceIndex) === currentIndex);
     });
   }
 }

 function renderSourceUi(){
   const sel = $("#sourceSelect");
   if(sel){
     if(sourceList.length){
       sel.innerHTML = sourceList.map((s,i)=>`<option value="${i}">${s.label || ("Kaynak " + (i+1))}</option>`).join("");
       sel.onchange = e => {
         currentIndex = Number(e.target.value);
         loadSource(sourceList[currentIndex] || sourceList[0]);
       };
     }else{
       sel.innerHTML = `<option>Kaynak yok</option>`;
     }
   }

   const box = $("#sourceButtons");
   if(box){
     if(sourceList.length){
       box.innerHTML = sourceList.map((s,i)=>`<button class="source-button ${i===currentIndex?"active":""}" data-source-index="${i}">${s.label || ("Kaynak " + (i+1))}</button>`).join("");
       $$("[data-source-index]", box).forEach(btn=>{
         btn.onclick = () => {
           currentIndex = Number(btn.dataset.sourceIndex);
           loadSource(sourceList[currentIndex] || sourceList[0]);
         };
       });
     }else{
       box.innerHTML = `<span class="source-mini-note">Bu içerik için video kaynağı yok. Diğer filmlerde Türkçe Dublaj / Türkçe Altyazı kaynak butonları burada görünür.</span>`;
     }
   }
 }

 function loadSource(srcObj){
   srcObj = srcObj || {label:"Demo", url:DEMO_VIDEO, demo:true};
   const src = srcObj.url || DEMO_VIDEO;

   if(frame){
     frame.style.display="none";
     frame.removeAttribute("src");
   }
   v.style.display="block";

   if(srcObj.demo || !srcObj.url){
     warning.style.display="block";
     warning.innerHTML="Bu bölüm için kaynak yok; demo video açılıyor.";
   }else{
     warning.style.display="none";
   }

   if(isEmbedUrl(src)){
     v.pause();
     v.removeAttribute("src");
     v.style.display="none";
     if(frame){
       frame.style.display="block";
       frame.src=src;
     }else{
       window.open(src, "_blank");
     }
   }else{
     v.src=src;
     v.play().catch(()=>toast("Oynatmak için player üzerindeki play tuşuna bas."));
   }
   setActiveSourceUi();
 }

 renderSourceUi();
 loadSource(sourceList[currentIndex] || {label:"Demo", url:DEMO_VIDEO, demo:true});

 v.onloadedmetadata=()=>{const p=getProg(item.id,ep.id);if(v.duration&&p>2&&p<96)v.currentTime=v.duration*p/100};
 v.ontimeupdate=()=>{if(v.duration){const p=v.currentTime/v.duration*100;bar.style.width=p+"%";setProg(item.id,p,ep.id)}};
 $("#pp").onclick=()=>{if(frame && frame.style.display==="block"){toast("Embed kaynak kendi player kontrolünü kullanır.");return;} v.paused?v.play():v.pause()};
 $("#b10").onclick=()=>v.currentTime=Math.max(0,v.currentTime-10);
 $("#f10").onclick=()=>v.currentTime=Math.min(v.duration||99999,v.currentTime+10);
 $("#intro").onclick=()=>v.currentTime=Math.min(v.duration||99999,v.currentTime+85);
 $("#theater").onclick=()=>$("#layout").classList.toggle("theater");
 $("#speed").onchange=e=>v.playbackRate=Number(e.target.value);
 $("#quality").onchange=e=>toast(e.target.value+" seçildi.");
 $("#localWatch").onchange=e=>{const f=e.target.files[0];if(!f)return;if(state.localUrl)URL.revokeObjectURL(state.localUrl);state.localUrl=URL.createObjectURL(f);if(frame){frame.style.display="none";frame.removeAttribute("src")}v.style.display="block";v.src=state.localUrl;warning.style.display="none";v.play().catch(()=>{})};
}
function render(){const p=page();if(p==="home")renderHome();if(p==="catalog")renderCatalog();if(p==="trend")renderTrend();if(p==="favorites")renderFav();if(p==="detail")renderDetail();if(p==="watch")renderWatch()}
document.addEventListener("DOMContentLoaded",()=>{initShell();render();toast("StreamVizyon V14 hazır")});
