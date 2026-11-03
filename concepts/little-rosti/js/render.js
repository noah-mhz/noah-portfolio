import {SITE,MENU,PICKS,STORY,GRID,IMG} from './content.js';
import {RM} from './motion.js';

export function renderAll(){

const $=s=>document.querySelector(s);
document.querySelectorAll("[data-c]").forEach(e=>e.textContent=SITE[e.dataset.c]);
$("#dir").href=SITE.directionsUrl;
$("#picksList").innerHTML=PICKS.map(x=>`<article class="pick"><figure><img src="${IMG[x.i]}" alt="${x.n}" loading="lazy"></figure><div class="row"><div><span class="tag">${x.t}</span><h3>${x.n}</h3></div><span class="price">${x.p}</span></div><p>${x.d}</p></article>`).join("");
$("#info").innerHTML=`<div><b>Where</b>${SITE.address}</div><div><b>When</b>${SITE.hours}</div><div><b>Contact</b>${SITE.contact}</div>`;
$("#fAddr").innerHTML=`<p style="margin:0">${SITE.address}<br>${SITE.hours}</p>`;
$("#fContact").innerHTML=`<p style="margin:.3rem 0 0">${SITE.contact}</p>`;
$("#grid").innerHTML=GRID.map(k=>`<a href="#top" aria-label="Social post placeholder"><img src="${IMG[k]}" alt="" loading="lazy"></a>`).join("");
$("#chapters").innerHTML=STORY.map(x=>`<article class="chap"><div class="card"><img src="${IMG[x.i]}" alt="${x.a}" loading="lazy"></div><div><h3>${x.t}</h3><p>${x.p}</p></div></article>`).join("");
const cats=Object.keys(MENU);let cur=cats[0];
function draw(anim){
 $("#tabs").innerHTML=cats.map(c=>`<button class="tab" role="tab" aria-selected="${c==cur}" data-c="${c}">${c}</button>`).join("");
 $("#menuList").innerHTML=MENU[cur].map(x=>`<div class="item"><div class="ph">${x.i?`<img src="${IMG[x.i]}" alt="" loading="lazy">`:`<img class="mk" src="${IMG.mascot}" alt="">`}</div><div><h3>${x.n}</h3><p>${x.d}</p></div><span class="price">${x.p}</span></div>`).join("");
 if(anim&&window.gsap&&!RM)gsap.from(".item",{y:18,opacity:0,stagger:.07,duration:.5,ease:"power2.out"});
}
$("#tabs").addEventListener("click",e=>{const b=e.target.closest(".tab");if(b){cur=b.dataset.c;draw(true);$("#tabs [aria-selected=true]").focus()}});
draw(false);
}
