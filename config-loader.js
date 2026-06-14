/* ============================================================
   Professor VPN — Download Page loader
   Fetches the shared config JSON (written by the admin panel)
   and renders downloads, banners and Adsterra ads live.
   ============================================================ */

/* CONFIG SOURCE — the shared JSON file. The download page is served from the
   same repo as the config (perofesor/VPN via GitHub Pages / Vercel), so we read
   it same-origin. A timestamp cache-buster keeps it live so panel changes appear
   immediately. */
const RAW_URL = "professor_vpn_config.json";

document.getElementById("year").textContent = new Date().getFullYear();

/* ---- matrix background (green with occasional red glitch columns) ---- */
(function(){
  const cv=document.getElementById("matrix"),ctx=cv.getContext("2d");let cols,drops,red;
  const chars="01ﾊﾐﾋｰｳｼﾅﾓPVPN$#%<>".split("");
  function rs(){cv.width=innerWidth;cv.height=innerHeight;cols=Math.floor(cv.width/14);
    drops=Array(cols).fill(1);red=Array(cols).fill(0).map(()=>Math.random()<0.10);}
  rs();addEventListener("resize",rs);
  setInterval(()=>{ctx.fillStyle="rgba(0,0,0,0.08)";ctx.fillRect(0,0,cv.width,cv.height);
    ctx.font="13px monospace";
    drops.forEach((y,i)=>{ctx.fillStyle=red[i]?"#ff1133":"#00ff66";
      ctx.fillText(chars[Math.random()*chars.length|0],i*14,y*14);
      if(y*14>cv.height&&Math.random()>0.975){drops[i]=0;red[i]=Math.random()<0.10;}drops[i]++;});},70);
})();

function esc(s){return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

/* inject arbitrary ad HTML/scripts (scripts need manual re-creation) */
function injectAd(container, html){
  if(!html||!html.trim()) return false;
  container.innerHTML="";
  const tmp=document.createElement("div"); tmp.innerHTML=html;
  // move non-script nodes
  [...tmp.childNodes].forEach(n=>{
    if(n.tagName==="SCRIPT"){
      const s=document.createElement("script");
      [...n.attributes].forEach(a=>s.setAttribute(a.name,a.value));
      if(n.textContent) s.textContent=n.textContent;
      container.appendChild(s);
    } else {
      container.appendChild(n.cloneNode(true));
    }
  });
  return true;
}

async function load(){
  let cfg;
  try{
    const r=await fetch(RAW_URL+"?t="+Date.now(),{cache:"no-store"});
    cfg=await r.json();
  }catch(e){
    document.getElementById("dl-list").innerHTML='<div class="n">فعلاً نسخه‌ای ثبت نشده است.</div>';
    return;
  }
  render(cfg);
}

function render(cfg){
  const app=cfg.app||{}, ads=cfg.ads||{}, wa=ads.download_page||{};

  /* version + main download */
  const latest=(cfg.downloads&&cfg.downloads[0])||null;
  document.getElementById("latest-ver").textContent="v"+(app.latest_version||"1.0.0");
  const mainBtn=document.getElementById("main-dl");
  if(latest){
    mainBtn.onclick=()=>location.href=latest.url;
    document.getElementById("dl-meta").textContent=`${latest.size||""} · امضا شده · Android 7+`;
  } else {
    mainBtn.onclick=()=>document.getElementById("dl-list").scrollIntoView({behavior:"smooth"});
  }

  /* downloads list */
  const dl=document.getElementById("dl-list");
  if(cfg.downloads&&cfg.downloads.length){
    dl.innerHTML="";
    cfg.downloads.forEach((d,i)=>{
      const it=document.createElement("div"); it.className="item";
      it.innerHTML=`<div><div class="v">v${esc(d.version)} ${i===0?'⭐':''}</div>
        <div class="n">${esc(d.size||"")} · ${esc(d.notes||"")}</div></div>
        <a class="get" href="${esc(d.url)}">دانلود</a>`;
      dl.appendChild(it);
    });
  } else {
    dl.innerHTML='<div class="n">به‌زودی...</div>';
  }

  /* top 3 banners */
  const bc=document.getElementById("banners");
  bc.innerHTML="";
  const showManual = wa.enabled && wa.mode==="manual";
  const banners = wa.banners||[];
  // 3 independent auto ad slots (auto_slides), falling back to auto_banner_code
  const autoSlides = (wa.auto_slides&&wa.auto_slides.length?wa.auto_slides:[wa.auto_banner_code]).filter(Boolean);
  for(let i=0;i<3;i++){
    const b=banners[i]||{};
    const div=document.createElement("div"); div.className="banner";
    if(showManual && b.image_url){
      div.innerHTML=`<img src="${esc(b.image_url)}" alt="ad">${b.is_gif?'<span class="ribbon">GIF</span>':''}`;
      if(b.target_url) div.onclick=()=>window.open(b.target_url,"_blank");
      bc.appendChild(div);
    } else if(wa.enabled && wa.mode==="auto" && autoSlides.length){
      bc.appendChild(div);
      injectAd(div, autoSlides[i % autoSlides.length]);
    } else {
      div.innerHTML=`<div class="ph">بنر ${i+1}<br><small>Banner ${i+1}</small></div>`;
      bc.appendChild(div);
    }
  }

  /* auto ads (sidebar + native host) */
  if(wa.enabled && wa.mode==="auto"){
    injectAd(document.getElementById("auto-banner-slot"), autoSlides[0]||wa.auto_banner_code);
    injectAd(document.getElementById("native-host"), wa.auto_native_code);
    if(wa.auto_popunder_code) injectAd(document.getElementById("side-ad-2"), wa.auto_popunder_code);
  }

  /* bottom / side banners (manual fallback duplicates) */
  const bottom=document.getElementById("bottom-ads");
  bottom.innerHTML="";
  if(wa.enabled && wa.side_banners_enabled){
    if(wa.mode==="manual"){
      banners.forEach(b=>{ if(b.image_url){
        const d=document.createElement("div"); d.className="banner"; d.style.minHeight="120px";
        d.innerHTML=`<img src="${esc(b.image_url)}">`;
        if(b.target_url) d.onclick=()=>window.open(b.target_url,"_blank");
        bottom.appendChild(d);
      }});
    }
  }

  /* contact links */
  const cl=document.getElementById("contact-links");
  const c=app.contact||{};
  const links=[];
  if(c.telegram) links.push(`<div style="margin:6px 0">📨 <a href="${esc(c.telegram)}" target="_blank">تلگرام</a></div>`);
  if(c.whatsapp) links.push(`<div style="margin:6px 0">💬 <a href="${esc(c.whatsapp)}" target="_blank">واتساپ</a></div>`);
  if(c.website) links.push(`<div style="margin:6px 0">🌐 <a href="${esc(c.website)}" target="_blank">وب‌سایت</a></div>`);
  if(c.email) links.push(`<div style="margin:6px 0">✉ ${esc(c.email)}</div>`);
  cl.innerHTML=links.join("")||'<div class="n" style="color:var(--dim)">—</div>';
}

load();
