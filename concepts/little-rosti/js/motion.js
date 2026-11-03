export const RM=matchMedia("(prefers-reduced-motion:reduce)").matches;
const $=s=>document.querySelector(s);

export function initNav(){
/* nav */
const nav=$("#nav"),bg=$(".burger"),lk=$("#links");
addEventListener("scroll",()=>nav.classList.toggle("solid",scrollY>40),{passive:true});
bg.onclick=()=>{const o=lk.classList.toggle("open");bg.setAttribute("aria-expanded",o)};
lk.addEventListener("click",e=>{if(e.target.closest("a")){lk.classList.remove("open");bg.setAttribute("aria-expanded",false)}});
}

export function initMotion(){
/* motion */
if(window.gsap&&window.ScrollTrigger&&!RM){
 gsap.registerPlugin(ScrollTrigger);
 const tl=gsap.timeline({defaults:{ease:"power3.out"}});
 tl.from(".hero h1 span",{yPercent:100,opacity:0,stagger:.14,duration:.9})
   .from(".hero .lead,.hero .cta",{y:20,opacity:0,stagger:.12,duration:.6},"-=.4")
   .from(".arch",{scale:.92,opacity:0,duration:1},"-=1.1")
   .from(".note",{opacity:0,y:10,stagger:.2,duration:.6},"-=.3");
 gsap.to(".arch img",{yPercent:-8,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});
 gsap.utils.toArray(".pick").forEach((el,i)=>gsap.from(el,{y:50,opacity:0,duration:.9,ease:"power2.out",scrollTrigger:{trigger:el,start:"top 88%"}}));
 gsap.to(".poster",{rotate:-1.5,ease:"none",scrollTrigger:{trigger:".promo",start:"top bottom",end:"bottom top",scrub:true}});
 gsap.utils.toArray(".chap").forEach(el=>gsap.from(el,{y:40,opacity:0,duration:.9,ease:"power2.out",scrollTrigger:{trigger:el,start:"top 85%"}}));
}
}
