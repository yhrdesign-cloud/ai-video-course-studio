const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('body > .topbar');
const progress = document.querySelector('.reading-progress');
let scheduled=false;
function update(){if(document.body.classList.contains('deck-ready')){scheduled=false;return;}if(progress){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${max>0?Math.max(0,Math.min(100,scrollY/max*100)):0}%`;}scheduled=false;}
window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});
window.addEventListener('resize',update);window.addEventListener('pageshow',update);update();
document.addEventListener('click',event=>{
 if(document.body.classList.contains('deck-ready'))return;
 const link=event.target.closest('a[href^="#"]');
 if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const hash=link.getAttribute('href');if(hash.length<2)return;
 const target=document.getElementById(decodeURIComponent(hash.slice(1)));if(!target)return;
 event.preventDefault();
 const outline=link.closest('.lesson-outline');if(outline)outline.open=false;
 history.pushState(null,'',hash);
 if(!target.hasAttribute('tabindex')){target.setAttribute('tabindex','-1');target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true})}
 target.focus({preventScroll:true});
 window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+scrollY-(header?.offsetHeight||0)-18),behavior:reduced.matches?'instant':'smooth'});
});
function activate(group,panelSelector,buttonSelector,key,readyClass){
 const panels=[...group.querySelectorAll(panelSelector)],buttons=[...group.querySelectorAll(buttonSelector)];
 let selected=0;
 function select(i){selected=(i+panels.length)%panels.length;panels.forEach((p,k)=>p.classList.toggle('active',k===selected));buttons.forEach((b,k)=>b.setAttribute('aria-pressed',String(k===selected)));}
 group.classList.add(readyClass);const controls=group.querySelector('.gallery-controls,.sequence-buttons');if(controls)controls.hidden=false;select(0);
 buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(selected+(e.key==='ArrowRight'?1:-1));buttons[selected].focus()}})});
}
document.querySelectorAll('[data-gallery]').forEach(g=>activate(g,'[data-gallery-panel]','[data-gallery-go]','galleryGo','gallery-ready'));
document.querySelectorAll('[data-sequence]').forEach(g=>activate(g,'[data-sequence-panel]','[data-sequence-go]','sequenceGo','sequence-ready'));
const dialog=document.querySelector('.directory-dialog'),menu=document.querySelector('.menu-open');
if(dialog&&menu&&typeof dialog.showModal==='function'){
 menu.hidden=false;menu.addEventListener('click',()=>dialog.showModal());dialog.querySelector('.menu-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>menu.focus({preventScroll:true}));
}
const videos=[...document.querySelectorAll('video')];
videos.forEach(video=>video.addEventListener('play',()=>videos.forEach(other=>{if(other!==video&&!other.paused)other.pause()})));
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)e.target.pause()}),{threshold:0});videos.forEach(v=>observer.observe(v));}
