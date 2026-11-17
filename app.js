(function(){
"use strict";
// WORLDTIDE — Supabase-connected V1
// Publishable browser key is safe to use here. Never put a service_role key in frontend code.
const SUPABASE_URL = "https://tpwyjbpgllyajqlabeff.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_l-1e6u8waQR3sv4yqdr3Vw_fmKWM50I";
const STORE="worldtide.v1.state";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let state={seeds:[],activity:[]}, currentSeed=null, activeFilter="All", activeView="discover", currentUser=null;
const $=id=>document.getElementById(id);
function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function glyph(type){return {Mystery:"◉",Nature:"✧",Artifact:"⌘",Dream:"☾"}[type]||"◉"}
function ago(t){const n=Math.max(0,Date.now()-new Date(t).getTime()),m=Math.floor(n/60000);if(m<1)return"just now";if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2800)}
function requireLogin(){if(!currentUser){toast("Log in or create an account first.");$("authEmail").focus();return false}return true}
function card(seed){return `<article class="seed-card" data-open="${escapeHTML(seed.id)}"><div class="seed-art"><span class="seed-glyph">${glyph(seed.type)}</span></div><div class="seed-card-body"><div class="card-top"><span class="type-tag">${escapeHTML(seed.type)} · SEED</span><button class="save-mini ${seed.saved?"saved":""}" data-save="${escapeHTML(seed.id)}" aria-label="Save ${escapeHTML(seed.name)}">${seed.saved?"♥":"♡"}</button></div><h3>${escapeHTML(seed.name)}</h3><p>${escapeHTML(seed.story)}</p><div class="card-bottom"><span>STAGE ${seed.stage}</span><span>${seed.evolutions} EVOLUTIONS</span></div></div></article>`}
function render(){
 const q=$("searchInput").value.trim().toLowerCase();
 const filtered=state.seeds.filter(s=>(activeFilter==="All"||s.type===activeFilter)&&(!q||(s.name+" "+s.story+" "+s.type).toLowerCase().includes(q)));
 $("seedGrid").innerHTML=filtered.map(card).join("");$("resultCount").textContent=`${filtered.length} ${filtered.length===1?"discovery":"discoveries"}`;$("emptyState").classList.toggle("hidden",filtered.length>0);
 const saved=state.seeds.filter(s=>s.saved);$("savedGrid").innerHTML=saved.map(card).join("");$("savedEmpty").style.display=saved.length?"none":"block";
 $("activityList").innerHTML=state.activity.slice().sort((a,b)=>new Date(b.time)-new Date(a.time)).map(a=>`<div class="activity-item"><div class="activity-icon">✧</div><div><strong>${escapeHTML(a.title||"World activity")}</strong><p>${escapeHTML(a.text)}</p><time>${ago(a.time)}</time></div></div>`).join("");$("activityEmpty").style.display=state.activity.length?"none":"block";
 $("seedCount").textContent=state.seeds.length;$("evolutionCount").textContent=state.seeds.reduce((n,s)=>n+s.evolutions,0);$("savedCount").textContent=saved.length;
}
function setView(view){activeView=view;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===view));document.querySelectorAll(".view").forEach(v=>v.classList.remove("active-view"));$(view+"View").classList.add("active-view");window.scrollTo({top:document.querySelector(".tabs").offsetTop-12,behavior:"smooth"})}
async function loadWorld(){
 const {data:seedRows,error}=await supabase.from("seeds").select("*, seed_contributions(*)").eq("is_public",true).order("created_at",{ascending:false});
 if(error){console.error(error);toast("Could not load Seeds. Check your connection.");return}
 let savedIds=[];
 if(currentUser){const r=await supabase.from("saved_seeds").select("seed_id").eq("user_id",currentUser.id);if(!r.error)savedIds=(r.data||[]).map(x=>x.seed_id)}
 state.seeds=(seedRows||[]).map(row=>{
  const contributions=(row.seed_contributions||[]).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  return {id:row.id,name:row.title,type:row.category,story:row.description||"A new Seed is waiting for its first contribution.",stage:1+contributions.length,evolutions:contributions.length,saved:savedIds.includes(row.id),created:new Date(row.created_at).getTime(),history:[{text:"A Seed entered the world.",time:new Date(row.created_at).getTime()},...contributions.map(c=>({text:c.content,time:new Date(c.created_at).getTime()}))]};
 });
 state.activity=state.seeds.flatMap(s=>s.history.map(h=>({title:s.name,text:h.text,time:h.time}))).sort((a,b)=>b.time-a.time).slice(0,50);
 render();
}
function updateAuthUI(){
 $("authStatus").textContent=currentUser?`Logged in: ${currentUser.email}`:"Log in to contribute to the shared world";
 $("authFields").classList.toggle("hidden",!!currentUser);$("signOutBtn").classList.toggle("hidden",!currentUser);
 $("worldStatus").innerHTML="<i></i> SHARED WORLD";
}
async function signUp(){
 const email=$("authEmail").value.trim(),password=$("authPassword").value;
 if(!email||password.length<6){toast("Enter your email and a password with at least 6 characters.");return}
 const {data,error}=await supabase.auth.signUp({email,password});
 if(error){toast(error.message);return}
 if(data.session){currentUser=data.user;updateAuthUI();await loadWorld();toast("Account created. Welcome to WORLDTIDE!")}
 else toast("Sign-up started. Check your email to confirm, then log in.");
}
async function signIn(){
 const email=$("authEmail").value.trim(),password=$("authPassword").value;
 if(!email||!password){toast("Enter your email and password.");return}
 const {data,error}=await supabase.auth.signInWithPassword({email,password});
 if(error){toast(error.message);return}
 currentUser=data.user;updateAuthUI();await loadWorld();toast("You are now logged in.");
}
async function signOut(){const {error}=await supabase.auth.signOut();if(error){toast(error.message);return}currentUser=null;updateAuthUI();await loadWorld();toast("Logged out.")}
async function createSeed(){
 if(!requireLogin())return;
 const name=$("seedName").value.trim(),type=$("seedType").value,story=$("seedStory").value.trim();
 if(name.length<3){toast("Give your Seed a name (at least 3 characters).");$("seedName").focus();return}
 const {data,error}=await supabase.from("seeds").insert({creator_id:currentUser.id,title:name,category:type,description:story||"A new mystery is waiting for its first contribution.",is_public:true}).select().single();
 if(error){toast(error.message);return}
 $("seedName").value="";$("seedStory").value="";await loadWorld();setView("discover");openDetail(data.id);toast("Your Seed is now part of the shared world.");
}
function openDetail(id){
 const seed=state.seeds.find(s=>s.id===id);if(!seed)return;currentSeed=id;
 $("detailType").textContent=seed.type.toUpperCase()+" · SEED";$("detailTitle").textContent=seed.name;$("detailStory").textContent=seed.story;$("detailStage").textContent="STAGE "+seed.stage;$("detailEvolutions").textContent=seed.evolutions+" EVOLUTIONS";$("detailArt").querySelector("span").textContent=glyph(seed.type);
 $("detailHistory").innerHTML=seed.history.slice().reverse().map(h=>`<div class="history-entry"><span>${escapeHTML(h.text)} <small style="color:#718697">· ${ago(h.time)}</small></span></div>`).join("");
 $("evolutionText").value="";$("saveBtn").textContent=seed.saved?"♥ Saved — remove from collection":"♡ Save to collection";$("detailModal").classList.remove("hidden");document.body.style.overflow="hidden";
}
function closeDetail(){$("detailModal").classList.add("hidden");document.body.style.overflow=""}
async function evolve(){
 if(!requireLogin())return;
 const text=$("evolutionText").value.trim();if(text.length<4){toast("Add a little more to your perspective.");return}
 const {error}=await supabase.from("seed_contributions").insert({seed_id:currentSeed,contributor_id:currentUser.id,content:text});
 if(error){toast(error.message);return}
 await loadWorld();openDetail(currentSeed);toast("Your perspective changed this Seed.");
}
async function toggleSave(id){
 if(!requireLogin())return;
 const seed=state.seeds.find(s=>s.id===id);if(!seed)return;
 let result;
 if(seed.saved)result=await supabase.from("saved_seeds").delete().eq("user_id",currentUser.id).eq("seed_id",id);
 else result=await supabase.from("saved_seeds").insert({user_id:currentUser.id,seed_id:id});
 if(result.error){toast(result.error.message);return}
 await loadWorld();if(currentSeed===id)$("saveBtn").textContent=state.seeds.find(s=>s.id===id).saved?"♥ Saved — remove from collection":"♡ Save to collection";
 toast(seed.saved?"Removed from your collection.":"Added to your collection.");
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("createHero").addEventListener("click",()=>setView("create"));$("emptyCreate").addEventListener("click",()=>setView("create"));$("publishSeed").addEventListener("click",createSeed);$("searchInput").addEventListener("input",render);
$("filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;activeFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render()});
document.addEventListener("click",e=>{const save=e.target.closest("[data-save]");if(save){e.stopPropagation();toggleSave(save.dataset.save);return}const open=e.target.closest("[data-open]");if(open)openDetail(open.dataset.open)});
$("closeDetail").addEventListener("click",closeDetail);$("detailModal").addEventListener("click",e=>{if(e.target.id==="detailModal")closeDetail()});$("evolveBtn").addEventListener("click",evolve);$("saveBtn").addEventListener("click",()=>toggleSave(currentSeed));
$("aboutBtn").addEventListener("click",()=>$("aboutModal").classList.remove("hidden"));$("closeAbout").addEventListener("click",()=>$("aboutModal").classList.add("hidden"));$("aboutDone").addEventListener("click",()=>$("aboutModal").classList.add("hidden"));$("aboutModal").addEventListener("click",e=>{if(e.target.id==="aboutModal")e.currentTarget.classList.add("hidden")});
$("signUpBtn").addEventListener("click",signUp);$("signInBtn").addEventListener("click",signIn);$("signOutBtn").addEventListener("click",signOut);
async function init(){
 const {data:{session}}=await supabase.auth.getSession();currentUser=session?.user||null;updateAuthUI();
 supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;updateAuthUI();setTimeout(loadWorld,0)});
 await loadWorld();
 if("serviceWorker" in navigator&&location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
init();

})();
