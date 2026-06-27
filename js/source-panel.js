
const $=(q,r=document)=>r.querySelector(q);
const $$=(q,r=document)=>[...r.querySelectorAll(q)];
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function sourceKey(itemId, epId){return itemId+"__"+epId}
function getLegalSources(){try{return JSON.parse(localStorage.getItem("sv5_legal_sources")||"{}")}catch{return {}}}
function setLegalSources(map){localStorage.setItem("sv5_legal_sources", JSON.stringify(map))}
function allEpisodes(item){return (item.seasons||[]).flatMap(s=>s.episodes.map(e=>({...e,season:s.name})))}
let currentId = new URL(location.href).searchParams.get("focus") || CATALOG[0].id;

function renderList(){
  $("#contentList").innerHTML = CATALOG.map(x=>`
    <button class="side-btn ${x.id===currentId?"active":""}" data-id="${x.id}">
      <span>${esc(x.title)}</span><small>${esc(x.type)}</small>
    </button>
  `).join("");
  $$("[data-id]").forEach(b=>b.onclick=()=>{currentId=b.dataset.id;render()});
}

function renderTable(){
  const item = CATALOG.find(x=>x.id===currentId) || CATALOG[0];
  const saved = getLegalSources();
  $("#panelTitle").textContent = item.title + " kaynakları";
  $("#panelSub").textContent = item.type + " • " + item.year + " • " + allEpisodes(item).length + " bölüm/satır";
  const rows = allEpisodes(item).map(ep=>{
    const key = sourceKey(item.id, ep.id);
    return `<tr>
      <td><span class="source-badge">${esc(ep.season)}</span></td>
      <td><b>${esc(ep.no)}</b><br><small>${esc(ep.title)}</small></td>
      <td><input class="source-input" data-source-key="${esc(key)}" value="${esc(saved[key]||"")}" placeholder="Yasal video / embed URL"></td>
      <td><a class="btn btn-ghost btn-small" href="izle.html?id=${encodeURIComponent(item.id)}&ep=${encodeURIComponent(ep.id)}">Test Et</a></td>
    </tr>`
  }).join("");
  $("#sourceRows").innerHTML = rows;
}

function saveSources(){
  const saved = getLegalSources();
  $$("[data-source-key]").forEach(inp=>{
    const val = inp.value.trim();
    if(val) saved[inp.dataset.sourceKey] = val;
    else delete saved[inp.dataset.sourceKey];
  });
  setLegalSources(saved);
  showToast("Yasal kaynaklar kaydedildi.");
}

function exportSources(){
  const blob = new Blob([JSON.stringify(getLegalSources(), null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "streamvizyon-yasal-video-kaynaklari.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importSources(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      setLegalSources(data);
      showToast("Kaynak JSON içe aktarıldı.");
      render();
    }catch(e){showToast("JSON okunamadı.");}
  };
  reader.readAsText(file);
}

function clearSources(){
  if(confirm("Kaydedilen tüm yasal video kaynakları silinsin mi?")){
    localStorage.removeItem("sv5_legal_sources");
    showToast("Kaynaklar temizlendi.");
    render();
  }
}

function showToast(m){
  const t=$("#toast");
  t.textContent=m;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1600);
}

function render(){renderList();renderTable();}
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".menu a").forEach(a=>{});
  $("#saveBtn").onclick=saveSources;
  $("#exportBtn").onclick=exportSources;
  $("#clearBtn").onclick=clearSources;
  $("#importFile").onchange=e=>{if(e.target.files[0]) importSources(e.target.files[0])};
  render();
});
