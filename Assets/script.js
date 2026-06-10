const careerTimeline=[
  {role:"IT Officer",period:"2025 – Present",description:"Broader responsibility for software, networking, and security infrastructure. Focused on delivering dependable, secure systems that support efficient, high-quality patient care, and leading response to incidents and upgrades.",tags:["IT leadership","Infrastructure","Security"]},
  {role:"IT and Network Support",period:"2024 – 2025",description:"Maintained and developed IT software and networking infrastructure after progressing from business administration. Provided second-line support and helped shape improvements in reliability and workflows.",tags:["Support","Networking","Operations"]},
  {role:"IT and Communications Support",period:"2022 – 2024",description:"Alongside business administration work, took on responsibility for IT and communications. Helped enhance technological infrastructure, supported staff day to day, and contributed to communication and change projects.",tags:["IT & comms","Change","Support"]},
  {role:"Bachelor of Laws (LLB)",period:"2023 – Present",description:"Studying for an Honours LLB alongside professional work, building a deeper understanding of legal frameworks, governance, and how the law interacts with organisations and technology.",tags:["Law","Education"]}
];

const projects=[
  {id:"portfolio",title:"Portfolio website",type:"Personal",tech:["HTML","CSS","JavaScript"],summary:"This site – a static portfolio bringing together professional experience, projects, and writing.",details:"A lightweight, fully static portfolio designed to be accessible and easy to maintain. Built without frameworks so it can be hosted anywhere, with a focus on clean layout, motion, and strong accessibility options.",images:["https://via.placeholder.com/900x520?text=Portfolio+Home","https://via.placeholder.com/900x520?text=Projects+Page"],link:""},
  {id:"discord-bot",title:"Discord bot experiments",type:"Code / Hobby",tech:["Python","discord.py"],summary:"Custom moderation and fun commands, including music playback, reaction-based roles, and interactive features.",details:"An ongoing sandbox for experimenting with asynchronous Python, APIs, and user interaction design. Includes moderation tools, music features, and playful commands to keep servers organised but fun.",images:["https://via.placeholder.com/900x520?text=Discord+Bot+Commands","https://via.placeholder.com/900x520?text=Music+System+Flow"],link:""},
  {id:"ops-dashboard",title:"Operations dashboard (concept)",type:"Concept",tech:["Python","APIs"],summary:"An internal concept for tracking IT incidents, bottlenecks, and resolutions to support decision making.",details:"Prototype designs for a simple operations dashboard: aggregating tickets, service health, and response times into one place so leaders can see patterns and prioritise improvements.",images:["https://via.placeholder.com/900x520?text=Dashboard+Concept","https://via.placeholder.com/900x520?text=Incident+Timeline"],link:""}
];

const articleCategories={
  law:[],
  political:[
    {
      slug:"autumn-budget-2025",
      title:"The 2025 Autumn Budget – Working Adults Are Left Paying for Everything (Again!)",
      outlet:"Personal writing",
      date:"2025",
      teaser:"A critical look at the 2025 Autumn Budget and how it loads the cost of everything onto working adults.",
      body:"The 2025 Autumn Budget \u2013 Working Adults Are Left Paying for Everything (Again!)\nRachel Reeves\u2019 Autumn Budget makes one thing unmistakably clear. Working adults have become the country\u2019s financial shock absorbers. Whenever the government mismanages money, overspends, or discovers yet another \u201cunexpected\u201d fiscal hole, the solution is always the same, to squeeze the people who actually work for every penny they have. Despite promising earlier this year that there would be \u201cno major tax rises\u201d, Reeves has delivered another round of stealth taxation that falls overwhelmingly on ordinary earners.\n\nThe scrapping of the two-child benefit cap has been sold as a progressive policy, but in reality it simply rewards people regardless of whether they contribute anything to the system. Support should be available for families facing genuine hardship, not for those who choose to have children and expect taxpayers to fund them. Working people, already taxed at every turn, are being asked once again to finance choices that should be personal responsibilities.\n\nThe freeze on income tax thresholds is a quieter but even more punishing blow. Inflation continues to push prices higher, yet wages barely keep up to match. Recent ONS data shows nominal pay rising around 5 per cent, while real income has increased by less than 1 per cent. That tiny gain is quickly swallowed by the threshold freeze, meaning millions are dragged into higher tax bands without being any better off. Workers are effectively taking home less money despite receiving pay rises. A stealth tax in everything but name.\n\nOther measures in the Budget follow the same pattern. Reeves\u2019 new mansion tax sounds fair until you consider that property value alone doesn\u2019t reflect someone\u2019s wealth or income. Many inherited or rural homes will be caught in the net, and landlords will inevitably pass new charges onto tenants, worsening the rental crisis.\n\nTaxing savings and dividends is no better. After paying income tax, National Insurance, VAT, council tax, fuel duty and everything else, whatever people manage to save should be theirs. By taxing savings, the government is penalising those who live responsibly and plan for the future. At this rate, Reeves might resurrect the old English window tax if she thought she could get away with it.\n\nThe pension reforms are equally short-sighted, targeting long-serving professionals who rely on salary sacrifice to build their retirement pots. Charging National Insurance on money people never actually receive as a salary is absurd. It hurts teachers, nurses, police and engineers far more than the genuinely wealthy, who have the means to shelter their income elsewhere.\n\nEven the new electric vehicle mileage tax follows the same logic. Punish responsible behaviour. People who switched to EVs, whether to save money or reduce emissions will now pay around 6p per mile for the privilege of driving. That, combined with the new EV road tax could mean the average driver pays hundreds extra each year. All of this is being introduced without any clear plan for enforcement. Will the government use MOT readings? Will cars be tracked? No one seems to know.\n\nThe Budget\u2019s sin taxes are equally hypocritical. Increasing duties on alcohol and gambling doesn\u2019t change behaviour, it simply gives the government another revenue stream while pretending to act in the public interest. These taxes hit ordinary people far more than they affect addiction or harm, which they so claim to be helping with.\n\nReeves insists that public services need the extra funding that these taxes provide, and she\u2019s not wrong. But the real issue isn\u2019t just the scale of funding but how that funding is used. The NHS spent over \u00a33.5 billion on agency staff last year and continues to suffer from chronic inefficiency, excessive administration and a lack of investment in preventative care. Without reform, throwing more money at the system will only produce the same failing results.\n\nPerhaps the most telling part of this Budget is the size of the fiscal black hole. Earlier this year, Reeves had around \u00a310 billion of headroom. Since then, weaker growth, higher borrowing costs and abandoned welfare reforms have widened the gap to between \u00a312 billion and \u00a320 billion. Despite raising enormous amounts of tax, \u00a326 billion this time on top of \u00a340 billion last year, the underlying problem is simply being masked rather than solved.\n\nThe overall message of this Budget is unmistakable. If you work, you pay. If you save, you pay. If you drive, you pay. If you prepare for retirement, you pay. Meanwhile, those who do not work, and in many cases, have no intention of working, continue to receive increased support. This isn\u2019t fairness. It\u2019s a slow erosion of the social contract, and working adults are once again being asked to bankroll a system that takes more from them every year while giving less in return."
    }
  ],
  it:[
    {title:"Example IT / operations note",outlet:"Internal notes",date:"2023",teaser:"An internal-style write-up on reliability, workflows, or systems."},
    {title:"Network changes log",outlet:"Internal notes",date:"2022",teaser:"Summary of notable infrastructure changes and lessons learned."},
    {title:"Service improvements idea dump",outlet:"Drafts",date:"2022",teaser:"Rough ideas for automations, dashboards, and better incident response."},
    {title:"Tooling experiments",outlet:"Lab notes",date:"2021",teaser:"Short notes on small tooling tests and scripting experiments."}
  ]
};

function renderTimeline(container,items){
  if(!container)return;
  container.innerHTML=items.map((item,index)=>`
    <article class="timeline-item fade-in-on-scroll" style="--stagger-delay:${index*70}ms">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-role">${item.role}</div>
        <div class="timeline-meta">
          ${item.period||""}
        </div>
        <div class="timeline-description">${item.description||""}</div>
        ${item.tags&&item.tags.length?`<div class="timeline-tags">${item.tags.map(tag=>`<span class="tag">${tag}</span>`).join("")}</div>`:""}
      </div>
    </article>
  `).join("");
}

function renderProjects(container,items){
  if(!container)return;
  container.innerHTML=items.map((project,index)=>{
    const tech=project.tech?project.tech.join(", "):"";
    return `
      <article class="project-card fade-in-on-scroll" data-project-index="${index}" style="--stagger-delay:${index*70}ms">
        <div class="project-header">
          <div class="project-title">${project.title}</div>
          <div class="project-meta">${project.type||""}${tech?" · "+tech:""}</div>
        </div>
        <div class="project-summary">${project.summary||""}</div>
        <div class="project-extra">
          <div class="project-gallery" data-gallery-index="0">
            <div class="project-frame">
              ${project.images&&project.images.length?`<img src="${project.images[0]}" alt="Preview image for ${project.title}">`:"No previews yet – add images later."}
            </div>
            <div class="project-gallery-controls">
              <span class="gallery-label">Preview <span class="gallery-current">1</span> of <span class="gallery-total">${project.images?project.images.length:1}</span></span>
              <div class="gallery-buttons">
                <button type="button" class="gallery-btn" data-gallery-prev>Prev</button>
                <button type="button" class="gallery-btn" data-gallery-next>Next</button>
              </div>
            </div>
          </div>
          <p class="project-detail-text">${project.details||""}</p>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll(".project-card").forEach(card=>{
    card.addEventListener("click",e=>{
      if(e.target.closest(".gallery-btn"))return;
      card.classList.toggle("expanded");
    });
  });

  container.querySelectorAll(".project-card").forEach(card=>{
    const index=parseInt(card.dataset.projectIndex,10);
    const project=items[index];
    const gallery=card.querySelector(".project-gallery");
    if(!gallery||!project.images||!project.images.length)return;
    const frame=gallery.querySelector(".project-frame img");
    const currentSpan=gallery.querySelector(".gallery-current");
    const totalSpan=gallery.querySelector(".gallery-total");
    let current=0;
    totalSpan.textContent=project.images.length.toString();

    function update(){
      if(frame){frame.src=project.images[current];}
      if(currentSpan)currentSpan.textContent=(current+1).toString();
    }

    gallery.querySelectorAll("[data-gallery-prev]").forEach(btn=>{
      btn.addEventListener("click",e=>{
        e.stopPropagation();
        current=(current-1+project.images.length)%project.images.length;
        update();
      });
    });
    gallery.querySelectorAll("[data-gallery-next]").forEach(btn=>{
      btn.addEventListener("click",e=>{
        e.stopPropagation();
        current=(current+1)%project.images.length;
        update();
      });
    });
  });
}

function renderArticlesByCategory(openArticleModal){
  const sections=document.querySelectorAll(".article-card-grid[data-article-category]");
  sections.forEach(section=>{
    const key=section.dataset.articleCategory;
    const items=articleCategories[key]||[];
    section.innerHTML=items.map((article,index)=>`
      <article class="article-card fade-in-on-scroll" data-article-category="${key}" data-article-index="${index}" style="--stagger-delay:${index*70}ms">
        <div class="article-card-header">
          <h3 class="article-title">${article.title}</h3>
          <div class="article-meta">${article.outlet||""}${article.date?" · "+article.date:""}</div>
        </div>
        <div class="article-teaser">${article.teaser||""}</div>
      </article>
    `).join("");

    const cards=Array.from(section.querySelectorAll(".article-card"));

    const idealCardWidth=320;
    let perView=Math.max(1,Math.floor(section.clientWidth/idealCardWidth));
    perView=Math.min(perView,cards.length||1);
    section.style.setProperty("--cards-per-view",perView);

    cards.forEach(card=>{
      card.addEventListener("click",()=>{
        const cat=card.dataset.articleCategory;
        const idx=parseInt(card.dataset.articleIndex,10);
        const data=(articleCategories[cat]||[])[idx];
        if(data)openArticleModal(data);
      });
    });

    const carousel=section.closest(".article-carousel");
    if(!carousel)return;
    const prevBtn=carousel.querySelector(".article-scroll-prev");
    const nextBtn=carousel.querySelector(".article-scroll-next");
    if(!prevBtn||!nextBtn||cards.length<=perView){
      if(prevBtn)prevBtn.disabled=true;
      if(nextBtn)nextBtn.disabled=true;
      return;
    }

    let currentPage=0;
    const maxPage=Math.max(0,Math.ceil(cards.length/perView)-1);

    const scrollToPage=page=>{
      if(page<0||page>maxPage)return;
      const firstIndex=page*perView;
      const target=cards[firstIndex];
      if(!target)return;
      const offset=target.offsetLeft-section.offsetLeft;
      section.scrollTo({left:offset,behavior:"smooth"});
    };

    prevBtn.addEventListener("click",()=>{
      if(currentPage<=0)return;
      currentPage-=1;
      scrollToPage(currentPage);
    });

    nextBtn.addEventListener("click",()=>{
      if(currentPage>=maxPage)return;
      currentPage+=1;
      scrollToPage(currentPage);
    });
  });
}let lastFocusedElement=null;
function getModalElements(){
  return {backdrop:document.getElementById("modal-backdrop"),content:document.getElementById("modal-content"),closeBtn:document.getElementById("modal-close")};
}
function openModal(buildContent){
  const {backdrop,content,closeBtn}=getModalElements();
  if(!backdrop||!content||!closeBtn)return;
  lastFocusedElement=document.activeElement;
  content.innerHTML=buildContent();
  backdrop.hidden=false;
  document.body.style.overflow="hidden";
  requestAnimationFrame(()=>backdrop.classList.add("open"));
  closeBtn.onclick=closeModal;
  backdrop.addEventListener("click",onBackdropClick);
  document.addEventListener("keydown",onEsc);
}
function closeModal(){
  const {backdrop,content}=getModalElements();
  if(!backdrop)return;
  backdrop.classList.remove("open");
  const handler=()=>{
    backdrop.hidden=true;
    backdrop.removeEventListener("transitionend",handler);
    if(content)content.innerHTML="";
    document.body.style.overflow="";
  };
  backdrop.addEventListener("transitionend",handler);
  document.removeEventListener("keydown",onEsc);
  backdrop.removeEventListener("click",onBackdropClick);
  if(lastFocusedElement&&typeof lastFocusedElement.focus==="function"){lastFocusedElement.focus();}
}
function onEsc(e){if(e.key==="Escape")closeModal();}
function onBackdropClick(e){
  const panel=e.target.closest(".overlay-panel");
  if(!panel)closeModal();
}

function openArticleModal(article, options = {}){
  if(!article)return;

  const rawText = article.body || article.teaser || "";
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  const bodyHtml = paragraphs
    .map(p => `<p class="overlay-text">${p}</p>`)
    .join("");

  if (!options.skipUrlUpdate && article.slug) {
    const url = new URL(window.location.href);
    url.searchParams.set("article", article.slug);
    history.pushState({ articleSlug: article.slug }, "", url);
  }

  openModal(()=>`
      <div class="overlay-header">
        <h2 id="modal-title">${article.title}</h2>
        <p>${article.outlet||""}${article.date?" · "+article.date:""}</p>
      </div>
      <div class="overlay-body">
        <div class="overlay-article-text">
          ${bodyHtml}
        </div>
      </div>
  `);
}

function getCvPdfPath(){
  const inPages=document.body.getAttribute("data-in-pages")==="true";
  return (inPages?"../":"") + "Assets/Documents/CV-Website-Version.pdf";
}
function openCvModal(){
  openModal(()=>`
    <div class="overlay-header">
      <h2 id="modal-title">Some quick questions</h2>
      <p>Before you view my full CV, please share a few details.</p>
    </div>
    <div class="overlay-body">
      <form class="cv-form-grid" id="cv-form">
        <div class="cv-form-row">
          <div class="cv-form-field">
            <label for="cv-name">Name</label>
            <input id="cv-name" name="name" type="text" required>
          </div>
          <div class="cv-form-field">
            <label for="cv-company">Organisation / company</label>
            <input id="cv-company" name="company" type="text">
          </div>
        </div>
        <div class="cv-form-field">
          <label for="cv-role">Role / position</label>
          <input id="cv-role" name="role" type="text">
        </div>
        <div class="cv-form-field">
          <label for="cv-reason">Brief reason for viewing my CV</label>
          <textarea id="cv-reason" name="reason" rows="3" placeholder="For example: recruitment, collaboration, curiosity, or future opportunities."></textarea>
        </div>
        <div class="cv-form-footer">
          <small>I’ll use this information only to understand who is interested in my background.</small>
          <button type="submit" class="btn primary-btn">Continue to CV</button>
        </div>
      </form>
    </div>
  `);
  const form=document.getElementById("cv-form");
  if(form){
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      const formData=new FormData(form);
      try{
        await fetch("https://formspree.io/f/manznbjr",{method:"POST",body:formData,headers:{"Accept":"application/json"}});
      }catch(err){
        console.error("Error sending CV form",err);
      }
      window.open(getCvPdfPath(),"_blank");
      closeModal();
    });
  }
}

const THEME_KEY="ah-theme",TEXT_SIZE_KEY="ah-text-size",MOTION_KEY="ah-motion",CONTRAST_KEY="ah-contrast",LINKS_KEY="ah-links",COLOR_KEY="ah-color-mode",FOCUS_KEY="ah-focus";
/* === Accessibility preferences persistence (localStorage + cookie for subdomains) === */
function ahSetCookie(name,value,days){
  try{
    const expires = days ? "; expires=" + new Date(Date.now()+days*864e5).toUTCString() : "";
    const domain = location.hostname.endsWith("adrianheadley.com") ? "; domain=.adrianheadley.com" : "";
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = encodeURIComponent(name)+"="+encodeURIComponent(value)+expires+"; path=/"+domain+"; SameSite=Lax"+secure;
  }catch(e){}
}
function ahGetCookie(name){
  try{
    const key = encodeURIComponent(name)+"=";
    const parts = document.cookie ? document.cookie.split("; ") : [];
    for(const part of parts){
      if(part.indexOf(key)===0) return decodeURIComponent(part.substring(key.length));
    }
  }catch(e){}
  return null;
}
function ahGetPref(key){
  const fromCookie = ahGetCookie(key);
  if(fromCookie!==null && fromCookie!=="") return fromCookie;
  try{ return localStorage.getItem(key); }catch(e){ return null; }
}
function ahSetPref(key,value){
  try{ localStorage.setItem(key,value); }catch(e){}
  ahSetCookie(key,value,3650);
}
/* === End persistence helpers === */

function applyTheme(theme){if(theme==="dark"){document.body.classList.add("dark-theme");}else{document.body.classList.remove("dark-theme");}document.querySelectorAll("[data-theme]").forEach(btn=>btn.classList.toggle("active",btn.dataset.theme===theme));}
function initTheme(){const saved=ahGetPref(THEME_KEY);if(saved==="light"||saved==="dark"){applyTheme(saved);}else{applyTheme("light");}}
function setTheme(theme){applyTheme(theme);ahSetPref(THEME_KEY,theme);}
function applyTextSize(size){
  const root=document.documentElement;
  const base=16;
  let scale=1;
  if(size==="large"){scale=1.125;}
  else if(size==="xlarge"){scale=1.25;}
  root.style.fontSize=(base*scale)+"px";

  document.body.classList.remove("text-large","text-xlarge");
  if(size==="large")document.body.classList.add("text-large");
  if(size==="xlarge")document.body.classList.add("text-xlarge");

  document.querySelectorAll("[data-text-size]").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.textSize===size);
  });
}
function initTextSize(){const saved=ahGetPref(TEXT_SIZE_KEY)||"normal";applyTextSize(saved);}
function setTextSize(size){applyTextSize(size);ahSetPref(TEXT_SIZE_KEY,size);}
function applyMotion(reduce){document.body.classList.toggle("reduce-motion",reduce);const toggle=document.getElementById("motion-toggle");if(toggle)toggle.checked=reduce;}
function initMotion(){const saved=ahGetPref(MOTION_KEY);applyMotion(saved==="reduce");}
function setMotion(reduce){applyMotion(reduce);ahSetPref(MOTION_KEY,reduce?"reduce":"normal");}
function applyContrast(mode){document.body.classList.toggle("high-contrast",mode==="high");document.querySelectorAll("[data-contrast]").forEach(btn=>btn.classList.toggle("active",btn.dataset.contrast===mode));}
function initContrast(){const saved=ahGetPref(CONTRAST_KEY)||"normal";applyContrast(saved);}
function setContrast(mode){applyContrast(mode);ahSetPref(CONTRAST_KEY,mode);}
function applyLinkStyle(underline){document.body.classList.toggle("links-underlined",underline);const toggle=document.getElementById("underline-toggle");if(toggle)toggle.checked=underline;}
function initLinkStyle(){const saved=ahGetPref(LINKS_KEY);applyLinkStyle(saved==="underline");}
function setLinkStyle(underline){applyLinkStyle(underline);ahSetPref(LINKS_KEY,underline?"underline":"normal");}

function applyColorMode(mode){
  document.body.classList.toggle("cb-mode",mode==="cb");
  document.querySelectorAll("[data-color-mode]").forEach(btn=>btn.classList.toggle("active",btn.dataset.colorMode===mode));
}
function initColorMode(){
  const saved=ahGetPref(COLOR_KEY)||"normal";
  applyColorMode(saved);
}
function setColorMode(mode){
  applyColorMode(mode);
  ahSetPref(COLOR_KEY,mode);
}
function applyFocusMode(strong){
  document.body.classList.toggle("strong-focus",strong);
  const toggle=document.getElementById("focus-toggle");
  if(toggle)toggle.checked=strong;
}
function initFocusMode(){
  const saved=ahGetPref(FOCUS_KEY);
  applyFocusMode(saved==="strong");
}
function setFocusMode(strong){
  applyFocusMode(strong);
  ahSetPref(FOCUS_KEY,strong?"strong":"normal");
}
function initScrollAnimations(){const elements=document.querySelectorAll(".fade-in-on-scroll");if(!("IntersectionObserver"in window)){elements.forEach(el=>el.classList.add("visible"));return;}const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}})},{threshold:0.18});elements.forEach(el=>observer.observe(el));}

document.addEventListener("DOMContentLoaded",()=>{
  initTheme();initTextSize();initContrast();initMotion();initLinkStyle();initColorMode();initFocusMode();
  const a11yButton=document.getElementById("a11y-button");
  const a11yPanel=document.getElementById("a11y-panel");
  if(a11yButton&&a11yPanel){
    a11yButton.addEventListener("click",()=>{
      const isOpen=a11yPanel.classList.toggle("open");
      a11yButton.setAttribute("aria-expanded",isOpen?"true":"false");
    });
    document.addEventListener("click",e=>{
      if(!a11yPanel.contains(e.target)&&!a11yButton.contains(e.target)){
        if(a11yPanel.classList.contains("open")){
          a11yPanel.classList.remove("open");
          a11yButton.setAttribute("aria-expanded","false");
        }
      }
    });
    document.querySelectorAll("[data-theme]").forEach(btn=>btn.addEventListener("click",()=>setTheme(btn.dataset.theme)));
    document.querySelectorAll("[data-text-size]").forEach(btn=>btn.addEventListener("click",()=>setTextSize(btn.dataset.textSize)));
    document.querySelectorAll("[data-contrast]").forEach(btn=>btn.addEventListener("click",()=>setContrast(btn.dataset.contrast)));
    document.querySelectorAll("[data-color-mode]").forEach(btn=>btn.addEventListener("click",()=>setColorMode(btn.dataset.colorMode)));
    const underlineToggle=document.getElementById("underline-toggle");
    if(underlineToggle){underlineToggle.addEventListener("change",e=>setLinkStyle(e.target.checked));}
    const motionToggle=document.getElementById("motion-toggle");
    if(motionToggle){motionToggle.addEventListener("change",e=>setMotion(e.target.checked));}
    const focusToggle=document.getElementById("focus-toggle");
    if(focusToggle){focusToggle.addEventListener("change",e=>setFocusMode(e.target.checked));}
  }
  renderTimeline(document.getElementById("career-timeline"),careerTimeline);
  renderProjects(document.getElementById("projects-grid"),projects);
  renderArticlesByCategory(openArticleModal);
  document.querySelectorAll(".cv-modal-trigger").forEach(btn=>btn.addEventListener("click",()=>openCvModal()));
  initScrollAnimations();
  const yearSpan=document.getElementById("footer-year");if(yearSpan)yearSpan.textContent=new Date().getFullYear().toString();
});

function findArticleBySlug(slug){
  if(!slug)return null;
  for(const list of Object.values(articleCategories)){
    const found=list.find(a=>a.slug===slug);
    if(found)return found;
  }
  return null;
}

document.addEventListener("DOMContentLoaded",()=>{
  const params=new URLSearchParams(window.location.search);
  const slug=params.get("article");
  if(slug){
    const article=findArticleBySlug(slug);
    if(article){
      openArticleModal(article,{ skipUrlUpdate:true });
    }
  }
});

/* Contact form: build Formspree email subject as "<Topic> - <Subject>" */
(function(){
  const form = document.querySelector("form.contact-form-card");
  if(!form) return;

  const topic = form.querySelector("#topic");
  const subject = form.querySelector("#subject");
  const hiddenSubject = form.querySelector("#_subject");

  form.addEventListener("submit", function(){
    if(!hiddenSubject) return;

    const topicText = topic && topic.options && topic.selectedIndex >= 0
      ? (topic.options[topic.selectedIndex].text || "").trim()
      : "";

    const subjectText = subject ? (subject.value || "").trim() : "";

    const combined = [topicText, subjectText].filter(Boolean).join(" - ");
    hiddenSubject.value = combined || "Website enquiry";
  });
})();

