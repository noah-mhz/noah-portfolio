const SL={in:["In stock",""],lo:["Low stock","lo"],pre:["Pre-order","pre"]};
let f="All",cart={};
const $=s=>document.querySelector(s),m=v=>"S$"+v.toFixed(2);
$("#ch").innerHTML=["All","Pokémon","One Piece","Yu-Gi-Oh!","Other TCGs"].map(c=>`<button class="chip" aria-pressed="${c==f}" data-c="${c}">${c}</button>`).join("");
function draw(){$("#pg").innerHTML=PRODUCTS.filter(x=>f=="All"||x.t==f).map(x=>`<article class="pc rv in"><div class="pimg">${x.nw?'<span class="tag px">New</span>':''}<img src="${IMG[x.k]}" alt="${x.n}" loading="lazy"></div><div class="pb"><span class="px">${x.b}${x.l?" · "+x.l:""}</span><h3>${x.n}</h3><div class="row"><span class="pr">${m(x.p)}</span><span class="st ${SL[x.s][1]}"><i></i>${SL[x.s][0]}</span></div></div><button class="add" data-id="${x.id}">Add to bag</button></article>`).join("")}
draw();
$("#ch").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;f=b.dataset.c;document.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c==b));draw()};
function cr(){const ids=Object.keys(cart);let n=0,t=0;$("#ci").innerHTML=ids.length?ids.map(i=>{const x=PRODUCTS.find(y=>y.id==i),q=cart[i];n+=q;t+=q*x.p;return`<div class="ln"><b>${x.n}</b><span>${m(x.p*q)}</span><div class="q"><button data-d="-1" data-id="${i}" aria-label="Less">−</button>${q}<button data-d="1" data-id="${i}" aria-label="More">+</button></div></div>`}).join(""):'<div style="width:80px;margin:24px auto 10px">'+CAT+'</div><p class="px" style="opacity:.6;text-align:center">Your bag is empty.</p>';
$("#cn").textContent=n;$("#tt").textContent=m(t);const c=$("#cn");c.classList.remove("bump");void c.offsetWidth;c.classList.add("bump")}
function op(v){$("#dr").classList.toggle("open",v);$("#ov").classList.toggle("open",v)}
document.addEventListener("click",e=>{const a=e.target.closest(".add"),q=e.target.closest("[data-d]");
if(a){cart[a.dataset.id]=(cart[a.dataset.id]||0)+1;cr();a.textContent="Added ✓";setTimeout(()=>a.textContent="Add to bag",1200)}
if(q){const i=q.dataset.id;cart[i]+=+q.dataset.d;if(cart[i]<1)delete cart[i];cr()}});
$("#bag").onclick=()=>op(true);$("#x").onclick=$("#ov").onclick=()=>op(false);
$("#bg").onclick=()=>{const o=$("#mn").classList.toggle("open");$("#bg").setAttribute("aria-expanded",o)};
document.querySelectorAll(".menu a").forEach(a=>a.onclick=()=>$("#mn").classList.remove("open"));
$("#tog").onclick=()=>{const o=document.body.classList.toggle("notes");$("#tog").textContent="Design notes: "+(o?"on":"off");$("#tog").setAttribute("aria-pressed",o)};
addEventListener("scroll",()=>$("#hd").classList.toggle("s",scrollY>20),{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll(".rv:not(.in)").forEach((el,i)=>{el.style.transitionDelay=(i%4)*80+"ms";io.observe(el)});
document.querySelectorAll("section").forEach(s=>{if(getComputedStyle(s).position!="relative")s.style.position="relative"});
document.querySelectorAll("[data-i]").forEach(i=>i.src=IMG[i.dataset.i]);
document.querySelectorAll(".mascot").forEach(e=>e.innerHTML=CAT);
document.addEventListener("click",e=>{const z=e.target.closest("[data-zoom]");if(z){$("#lb img").src=IMG[z.dataset.zoom];$("#lb").showModal()}else if(e.target.id=="lb"||e.target.closest("#lb"))$("#lb").close()});
cr();
