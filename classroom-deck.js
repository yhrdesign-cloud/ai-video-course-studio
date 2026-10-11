(()=>{
 const main=document.querySelector('main'),hero=main?.querySelector('.canonical-hero');if(!hero)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const originalSections=[...main.children].filter(el=>el.matches('.canonical-hero,[id^="scene-"],.chapter-pagination'));
 if(!originalSections.length)return;
 const groups=[];let joinNext=false;
 originalSections.forEach(section=>{
  if((joinNext||section.matches('.case-placeholder'))&&groups.length){groups.at(-1).push(section);}else{groups.push([section]);}
  joinNext=!!section.querySelector('.divider');
 });
 const sections=groups.map(group=>group[0]);
 hero.id='overview';const outline=main.querySelector('.lesson-outline');
 const viewport=document.createElement('div');viewport.className='deck-viewport';
 const track=document.createElement('div');track.className='deck-track';viewport.append(track);
 const pages=sections.map((section,i)=>{const page=document.createElement('div');page.className='deck-page';page.dataset.tone=section.dataset.tone||'light';page.tabIndex=-1;page.setAttribute('role','group');page.setAttribute('aria-label',`第 ${i+1} 页，共 ${sections.length} 页`);const content=document.createElement('div');content.className='deck-content';groups[i].forEach(s=>content.append(s));page.append(content);track.append(page);return page});
 const footer=main.querySelector('.lesson-footer');if(footer)pages.at(-1).append(footer);
 if(outline){outline.classList.add('deck-outline');document.body.append(outline);const first=document.createElement('a');first.href='#overview';first.textContent='00 本节概览';outline.querySelector('nav').prepend(first);}
 main.append(viewport);
 let current=-1;const scrolls=new Map();const key=`course-v02:${location.pathname}`;
 function save(){try{sessionStorage.setItem(key,JSON.stringify({id:sections[current].id,scrolls:Object.fromEntries(scrolls)}))}catch{}}
 let saved;try{saved=JSON.parse(sessionStorage.getItem(key)||'null');Object.entries(saved?.scrolls||{}).forEach(([k,v])=>scrolls.set(k,v));}catch{}
 function go(index,{historyMode='push',focus=false,instant=false}={}){
  if(index>=pages.length&&current===pages.length-1){
   const directory=document.querySelector('.directory-dialog'),trigger=document.querySelector('.topbar .menu-open');
   if(directory&&!directory.open&&trigger){
    pages[current].querySelectorAll('video,audio').forEach(v=>v.pause());
    directory.addEventListener('close',()=>pages[current].focus({preventScroll:true}),{once:true});
    trigger.click();directory.scrollTop=0;
   }
   return;
  }
  index=Math.max(0,Math.min(pages.length-1,index));if(index===current){if(outline)outline.open=false;if(focus)pages[index].focus({preventScroll:true});return;}
  const old=current;if(old>=0){scrolls.set(sections[old].id,pages[old].scrollTop);pages[old].querySelectorAll('video').forEach(v=>v.pause());}
  // Load the current teaching page, never every hidden gallery.
  [pages[index]].filter(Boolean).forEach(page=>{
   page.querySelectorAll('[data-topic-background]').forEach(el=>{el.style.setProperty('--topic-background','url('+el.dataset.topicBackground+')');});
   page.querySelectorAll('img[data-course-src]').forEach(img=>{if(img.closest('[hidden]'))return;img.src=img.dataset.courseSrc;delete img.dataset.courseSrc;});
  });
  current=index;document.body.dataset.tone='dark';document.body.dataset.pageTone=pages[index].dataset.tone;pages.forEach((p,i)=>{p.inert=i!==index;p.classList.toggle('is-current',i===index);p.setAttribute('aria-hidden',String(i!==index));});
  track.style.transition=instant?'none':'';track.style.transform=`translateX(-${index*100}%)`;
  pages[index].scrollTop=scrolls.get(sections[index].id)||0;
  if(outline)outline.open=false;
  if(historyMode!=='none'){history[historyMode==='replace'?'replaceState':'pushState'](null,'',`#${sections[index].id}`);}
  if(focus)pages[index].focus({preventScroll:true});
  const progress=document.querySelector('.reading-progress');if(progress)progress.style.width=`${(index+1)/pages.length*100}%`;
  save();
 }
 function hashIndex(){let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return -1}return sections.findIndex(section=>pages[sections.indexOf(section)].querySelector(`[id="${CSS.escape(id)}"]`));}
 function revealHash(){let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}const target=document.getElementById(id);if(target&&pages[current].contains(target))pages[current].scrollTop+=target.getBoundingClientRect().top-pages[current].getBoundingClientRect().top;}
 document.body.classList.add('deck-ready');
 let initial=hashIndex();const hasDeepLink=initial>=0;const entryScroll=history.state?.deckScroll;go(initial<0?0:initial,{historyMode:hasDeepLink?'none':'replace'});if(hasDeepLink&&Number.isFinite(entryScroll)){pages[current].scrollTop=entryScroll;}else if(hasDeepLink){revealHash();}else{pages[current].scrollTop=0;}
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;let id;try{id=decodeURIComponent(a.hash.slice(1))}catch{return}const target=document.getElementById(id);const i=pages.findIndex(p=>p.contains(target));if(i<0)return;e.preventDefault();history.pushState(null,'',a.hash);go(i,{historyMode:'none',focus:true});revealHash();});
 function restoreHistory(){const i=hashIndex();go(i<0?0:i,{historyMode:'none',focus:true});if(Number.isFinite(history.state?.deckScroll))pages[current].scrollTop=history.state.deckScroll;else revealHash();}
 window.addEventListener('popstate',restoreHistory);window.addEventListener('hashchange',restoreHistory);
 window.addEventListener('pagehide',()=>{scrolls.set(sections[current].id,pages[current].scrollTop);save();document.querySelectorAll('video').forEach(v=>v.pause());});
 pages.forEach(p=>p.addEventListener('scroll',()=>{if(p===pages[current]){scrolls.set(sections[current].id,p.scrollTop);history.replaceState({...history.state,deckScroll:p.scrollTop},'');save()}},{passive:true}));
 const interactive='a,button,input,textarea,select,summary,video,audio,[contenteditable], [data-gallery],[data-sequence],dialog';
 function blocked(target){return document.querySelector('dialog[open]')||outline?.open||target.closest(interactive)||getSelection()?.toString();}
 document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||blocked(e.target))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(current+(e.key==='ArrowRight'?1:-1),{focus:true,instant:true});}});
 let start=null;
 viewport.addEventListener('pointerdown',e=>{start=e.pointerType==='touch'&&!blocked(e.target)?{x:e.clientX,y:e.clientY,id:e.pointerId}:null;},{passive:true});
 viewport.addEventListener('pointercancel',()=>start=null);
 viewport.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)go(current+(dx<0?1:-1),{focus:true});},{passive:true});
 // One physical mouse notch turns immediately; a continuous precision gesture turns once.
 function createWheelPager(){
  let last=-Infinity,lastTurn=-Infinity,used=false,total=0,direction=0,peak=0,previous=0,tail=false;
  return ({deltaY,deltaMode,time,pageHeight})=>{
   const gap=time-last,dir=Math.sign(deltaY),amount=Math.abs(deltaY);last=time;
   if(gap>=140){used=false;total=0;direction=0;peak=0;previous=0;tail=false;}
   const pixels=amount*(deltaMode===1?16:deltaMode===2?pageHeight:1);
   const discrete=deltaMode!==0||(Number.isInteger(deltaY)&&amount>=40&&gap>=80);
   if(discrete){if(gap<60)return 0;used=true;total=0;direction=dir;lastTurn=time;peak=previous=amount;tail=false;return dir;}
   // Mac momentum can overlap the next deliberate swipe. A reversal or a fresh
   // acceleration after decay is new intent, without waiting for complete silence.
   const reverse=used&&dir!==direction&&time-lastTurn>=160&&amount>=1;
   const newPulse=used&&tail&&time-lastTurn>=220&&amount>=Math.max(2,previous*2.2)&&amount-previous>=1.2;
   if(reverse||newPulse){used=false;total=0;peak=0;tail=false;direction=dir;}
   peak=Math.max(peak,amount);
   if(used){if(amount<=Math.max(1.5,peak*.25))tail=true;previous=amount;return 0;}
   if(direction!==dir){direction=dir;total=0;}
   total+=pixels;previous=amount;if(total<2)return 0;
   used=true;total=0;lastTurn=time;return dir;
  };
 }
 const wheelPage=createWheelPager();
 function nestedScroll(target,page,dir){for(let el=target;el&&el!==page;el=el.parentElement){const c=getComputedStyle(el);if(/auto|scroll/.test(c.overflowY)&&el.scrollHeight>el.clientHeight+2){if(dir>0?el.scrollTop+el.clientHeight<el.scrollHeight-2:el.scrollTop>2)return true;}}return false;}
 viewport.addEventListener('wheel',e=>{
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!e.deltaY)return;
  const target=e.target instanceof Element?e.target:viewport,page=pages[current],dir=Math.sign(e.deltaY);
  if(blocked(target)||document.querySelector('.blackout:not([hidden])')||nestedScroll(target,page,dir))return;
  const atEdge=dir>0?page.scrollTop+page.clientHeight>=page.scrollHeight-2:page.scrollTop<=2;
  if(!document.body.classList.contains('topic-presentation')&&!atEdge)return;
  e.preventDefault();
  const turn=wheelPage({deltaY:e.deltaY,deltaMode:e.deltaMode,time:performance.now(),pageHeight:page.clientHeight});
  if(turn)go(current+turn,{focus:true});
 },{passive:false});
 const full=document.createElement('button');full.type='button';full.className='teaching-control fullscreen-control';full.textContent='全屏';full.setAttribute('aria-label','进入全屏');document.querySelector('.topbar .menu-open')?.before(full);
 const menuButton=document.querySelector('.topbar .menu-open');if(menuButton){menuButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16"/></svg><span>目录</span>';menuButton.setAttribute('aria-label','全部课程');}
 const fullStatus=document.createElement('span');fullStatus.className='fullscreen-status';fullStatus.setAttribute('role','status');document.body.append(fullStatus);
 function syncFull(){const active=!!document.fullscreenElement;full.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg><span>'+(active?'退出':'全屏')+'</span>';full.setAttribute('aria-label',active?'退出全屏':'进入全屏');full.setAttribute('aria-pressed',String(active));}
 full.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw new Error('unavailable');fullStatus.textContent='';}catch{fullStatus.textContent='浏览器未允许全屏，可使用浏览器的全屏菜单继续观看。';setTimeout(()=>fullStatus.textContent='',6000);}syncFull();});
 document.addEventListener('fullscreenchange',syncFull);syncFull();
 reduce.addEventListener('change',()=>track.getAnimations().forEach(a=>a.cancel()));
})();
