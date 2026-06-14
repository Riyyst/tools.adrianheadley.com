}
  


/* -------- Passages (ensure >=10 per difficulty x length) -------- */
const BASE = {
  easy: {
    short: [
      "Type with calm hands and steady eyes.",
      "Stay relaxed and focus on each letter.",
      "Accuracy first; speed will follow.",
      "Breathe slowly and keep a steady pace.",
      "Practice daily and enjoy the process."
    ],
    medium: [
      "Choose a comfortable pace and let accuracy lead while your speed builds naturally over time.",
      "Read the full line first, then type it smoothly without stopping to correct tiny mistakes.",
      "A tidy desk and relaxed shoulders make it easier to find a calm rhythm at the keyboard.",
      "Set a short timer, type one clean paragraph, then review your results before the next round.",
      "Focus on the words ahead and let your hands follow; rhythm reduces hesitation and errors."
    ],
    long: [
      "Typing is a skill that grows with steady practice. Keep your posture neutral, wrists light, and eyes on the text. Let accuracy lead the way while your speed rises in the background.",
      "Confidence grows after repetition. Each keystroke teaches your hands where to go until motion becomes memory and effort turns into rhythm you can trust.",
      "When you feel tense, slow down for a moment, breathe, and reset your stance. Small corrections now prevent bigger problems later and protect your hands.",
      "Short warm‑ups help a lot. Loosen your fingers, scan the passage, and choose a pace you can maintain from start to finish without rushing.",
      "Make the task smaller: one passage, one timer, one goal. Finish it well, record your result, and then move to the next clean run."
    ],
    verylong: [
      "Most people overestimate what they can do in a day and underestimate what they can do in a year. The key is choosing a pace you can keep. Write a little every day, protect your posture, and let small wins compound into steady progress without drama.",
      "Progress is quiet at first. Ten focused minutes become twenty, and twenty becomes thirty. After a few weeks your hands land in the right place more often and your mistakes fade as good form takes over.",
      "Plan the next session in advance. When you sit down, there is nothing to debate: begin, finish one clean pass, and leave a short note for tomorrow so momentum survives overnight.",
      "Remove friction. Close extra tabs, silence alerts, and keep only the text you need on screen. Each tiny distraction costs more than it seems; each quiet minute returns more than you expect.",
      "Accuracy pays interest. Clean runs teach the right moves and protect your hands from strain. Speed arrives as a side effect of form that you can repeat."
    ]
  },
  medium: {
    short: [
      "Plan, draft, edit; ship, learn, improve.",
      "Strong posture, soft hands, clear eyes.",
      "Measure twice, cut once, review again.",
      "Simple tools used well beat complex tools ignored.",
      "Write once, read twice, revise with care."
    ],
    medium: [
      "Good writing is like good design: simple and purposeful, guiding attention and leaving space for thought.",
      "Great tools feel invisible. They reduce friction, respect your time, and help you finish work without stealing focus.",
      "Clear names beat clever tricks; future you will thank present you for readable code and stable choices.",
      "Short feedback loops turn vague plans into real progress by turning guesses into measurable results.",
      "Choose boring technology for important jobs; reliability and clarity are features you can deploy every day."
    ],
    long: [
      "Momentum builds when you commit to tiny wins. Two minutes of focus turns into five, and five becomes fifteen. By the time the timer stops you have finished more than you planned and learned where to improve next.",
      "Attention is the rarest currency online. Spend it with intention, protect it with boundaries, and invest it in the work that matters to you and your team.",
      "The best interfaces are honest about state. Loading feels lighter with feedback, errors point toward solutions, and success affirms that your time was well spent.",
      "A reliable routine beats bursts of inspiration. Set a time, set a place, and let the habit carry you into the session until starting feels automatic.",
      "Constraints create focus. Pick one passage, one timer, and one goal. Remove the rest and begin; simplicity turns into speed."
    ],
    verylong: [
      "Most projects fail from drift, not disaster. When the plan is vague, days melt together and effort leaks away. The cure is a visible goal and a simple next step: write the action, reduce scope until it feels easy, and start the clock. Finishing small work on time is the fastest path to big wins.",
      "Clarity scales teams. Shared words reduce friction and shared checklists remove doubt. A short style guide and one place to store decisions save hours that would otherwise be lost to guesswork.",
      "If a task feels heavy, split it into slices that fit your attention. Finish one slice, mark it done, and remove it from the table. Progress becomes addictive when you can see it happen.",
      "Noisy tools steal more time than they give. Mute alerts, archive stale threads, and keep a short list of active tasks. Your brain will reward you with longer stretches of calm focus.",
      "Measurement without context misleads. Pair metrics with short narratives so you know what to do next instead of reacting to numbers alone."
    ]
  },
  hard: {
    short: [
      "Sphinx of black quartz, judge my vow.",
      "Pack my box with five dozen liquor jugs.",
      "Jackdaws love my big sphinx of quartz.",
      "Fix problem X; verify Y; document Z.",
      "Guard the hot path; batch the cold path."
    ],
    medium: [
      "Refactor ruthlessly, but only with tests; coverage first, change second, review third, ship last.",
      "Cache invalidation and naming remain hard; time zones complete the trifecta and deserve respect.",
      "A failing check is a gift. Read the trace, reproduce locally, and thank it with a crisp fix and a test.",
      "Heuristics rot without data. Log, sample, and verify before you trust them in production.",
      "Cost hides in coordination. Fewer handoffs and clearer ownership beat fancier tools."
    ],
    long: [
      "Edge cases lurk at input boundaries. Try the empty string, the giant payload, and the weird path. Guard them now and you will sleep later while your systems stay quiet.",
      "Design clears the road for execution. Agree on contracts, failure modes, and budgets before you type the first line; future you will cheer for predictable results.",
      "Logs tell stories. Give each event a clear name, stable fields, and a cause. When trouble starts you can follow the thread and find the fix quickly.",
      "Ruthless simplicity is a feature. Every extra switch becomes someone’s late night alert; remove what you can and document what remains with care.",
      "Throughput without control is risk. Add backpressure, timeouts, and retries where it matters and measure what they cost."
    ],
    verylong: [
      "Hard problems rarely fall to a single clever idea. They yield to careful reduction, stable interfaces, and steady iteration. Start with a crisp description of the goal and failure modes, trim the scope to a core slice, and build a visible loop of progress that removes risk each pass.",
      "Incidents teach more than happy paths. After the page, write a short, blameless report and extract one durable change: add a check, publish a runbook, remove a footgun, or automate a manual step.",
      "Work that spans teams needs a single owner and a shared map. Write the plan, list the interfaces, and make status visible so assumptions align and surprises shrink.",
      "When performance matters, measure end to end. Microbenchmarks mislead when the bottleneck lives elsewhere; trace the full path and fix the slowest segment first.",
      "Security is a habit: least privilege, short tokens, simple keys, and fast rotation block whole classes of mistakes and reduce blast radius."
    ]
  }
};

/* Ensure >=10 per category; if shorter, synthesize extra variants */
function fillCategory(list, difficulty, length){
  const extrasA = [
    "Stay on target and keep a steady pace.",
    "Reduce scope, raise quality, and ship.",
    "Short focused work blocks beat long unfocused hours.",
    "Form first, speed second; results follow.",
    "Protect your attention and the work improves."
  ];
  const extrasB = [
    "Make the next action small and concrete.",
    "Keep logs tidy and decisions visible.",
    "Fewer moving parts, fewer late surprises.",
    "Practice on real text to reveal real mistakes.",
    "Clear names, clean hands, calm mind."
  ];
  const seed = (difficulty==="easy")?extrasA:extrasB;
  while(list.length<10){
    list.push(seed[(list.length)%seed.length]);
  }
  if(length==="verylong"){
    for(let i=0;i<list.length;i++){
      if(list[i].length < 320){
        list[i] = list[i] + " Write down the goal, start the timer, and finish one pass. Then review calmly and note a single improvement for next time.";
      }
    }
  }
  if(length==="long"){
    for(let i=0;i<list.length;i++){
      if(!list[i].includes(".")){
        list[i] += " Keep going until the timer ends.";
      }
    }
  }
  return list;
}

let PASSAGES=[];
["easy","medium","hard"].forEach(d=>{
  ["short","medium","long","verylong"].forEach(L=>{
    PASSAGES = PASSAGES.concat(
      fillCategory([...BASE[d][L]], d, L).map(t=>({text:t,difficulty:d,length:L}))
    );
  });
});

/* ---------- Elements ---------- */
const targetEl=document.getElementById("target");
const typebox=document.getElementById("typebox");
const btnNew=document.getElementById("btnNew");
const btnReset=document.getElementById("btnReset");
const selDifficulty=document.getElementById("selDifficulty");
const selLength=document.getElementById("selLength");

const kWpm=document.getElementById("kWpm"),kAcc=document.getElementById("kAcc"),
      kTime=document.getElementById("kTime"),kErrors=document.getElementById("kErrors"),
      kChars=document.getElementById("kChars"),kWords=document.getElementById("kWords"),
      kGross=document.getElementById("kGross"),kNet=document.getElementById("kNet");

/* ---------- State ---------- */
let targetStr='',startTime=null,timerId=null,typedChars=0,errorCount=0,lastValue='',finished=false;

/* ---------- Helpers ---------- */
function sanitizeASCII(str){
  const map={'\u2018':"'",'\u2019':"'",'\u201C':'"','\u201D':'"','\u2013':'-','\u2014':'-','\u00A0':' '};
  str=str.replace(/[\u2018\u2019\u201C\u201D\u2013\u2014\u00A0]/g,m=>map[m]||''); 
  return str.replace(/[^\x00-\x7F]/g,'');
}
function escapeHtml(s){const map={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
  return s.replace(/[&<>\"']/g,ch=>map[ch]);}
function pickPassage(){
  const wants={difficulty:selDifficulty.value,length:selLength.value};
  const pool=PASSAGES.filter(p=>{
    if(wants.difficulty!=="any"&&p.difficulty!==wants.difficulty) return false;
    if(wants.length!=="any"&&p.length!==wants.length) return false;
    return true;
  });
  const arr=pool.length?pool:PASSAGES;
  return arr[Math.floor(Math.random()*arr.length)].text;
}
function renderTargetChars(target,typed){
  const spans=[]; const tLen=typed.length;
  for(let i=0;i<target.length;i++){
    const ch=target[i];
    let cls='future';
    if(i<tLen){ cls=(typed[i]===ch)?'ok':'bad'; }
    else if(i===tLen && !finished){ cls='current'; }
    spans.push(`<span class="${cls}">${escapeHtml(ch)}</span>`);
  }
  if(tLen>target.length){
    for(let j=target.length;j<tLen;j++){
      spans.push(`<span class="bad">${escapeHtml(typed[j])}</span>`);
    }
  }
  targetEl.innerHTML=spans.join('');
}
function setPassage(text){
  targetStr = text;
  renderTargetChars(targetStr,'');
  // reset state
  startTime=null; if(timerId) cancelAnimationFrame(timerId); timerId=null;
  typedChars=0; errorCount=0; lastValue=''; finished=false;
  typebox.value='';
  updateStats();
  renderTargetChars(targetStr,'');
  typebox.disabled=false;
  typebox.focus();
}
function tick(){ updateStats(); if(!finished) timerId=requestAnimationFrame(tick); }
function secondsElapsed(){ return startTime? (performance.now()-startTime)/1000:0; }

function handleTyping(){
  const sanitized = sanitizeASCII(typebox.value);
  if (sanitized !== typebox.value) {
    const pos = typebox.selectionStart;
    typebox.value = sanitized;
    typebox.selectionStart = typebox.selectionEnd = Math.max(0, pos - 1);
  }

  const val = typebox.value;

  if (!startTime && val.length > 0) {
    startTime = performance.now();
    tick();
  }

  if (val.length > lastValue.length) {
    const newChars = val.slice(lastValue.length);
    for (let i = 0; i < newChars.length; i++) {
      const idx = lastValue.length + i;
      if (idx < targetStr.length) {
        if (newChars[i] !== targetStr[idx]) {
          errorCount++; // accumulate mistake
        }
      } else {
        errorCount++; // extra char beyond target
      }
    }
    typedChars += (val.length - lastValue.length);
  }
  lastValue = val;

  if (val.length === targetStr.length && val === targetStr) {
    finished = true;
    updateStats(true);
    typebox.disabled = true;
  }

  renderTargetChars(targetStr, val);
  updateStats();
}

function updateStats(){
  const t=secondsElapsed(),minutes=t/60;
  const typed=lastValue;
  const wordsTyped=typed.trim().length?typed.trim().split(/\s+/).length:0;
  const correctChars=calcCorrectChars(typed,targetStr);
  const grossWpm=minutes>0?(typedChars/5)/minutes:0;
  const netWpm=Math.max(0,grossWpm-(errorCount/minutes||0));
  const acc=typedChars>0?(correctChars/Math.max(1,typedChars))*100:0;
  kWpm.textContent=netWpm.toFixed(1);kAcc.textContent=acc.toFixed(0)+'%';
  kTime.textContent=t.toFixed(1)+'s';kErrors.textContent=errorCount|0;
  kChars.textContent=typedChars|0;kWords.textContent=wordsTyped|0;
  kGross.textContent=grossWpm.toFixed(1);kNet.textContent=netWpm.toFixed(1);
}

function calcCorrectChars(typed,target){
  let c=0; const L=Math.min(typed.length,target.length);
  for(let i=0;i<L;i++){ if(typed[i]===target[i]) c++; }
  return c;
}

/* ---------- Events ---------- */
typebox.addEventListener('input',handleTyping);
btnNew.addEventListener('click',()=>{ setPassage(pickPassage()); });
btnReset.addEventListener('click',()=>{ setPassage(targetStr); });
selDifficulty.addEventListener('change',()=>{ setPassage(pickPassage()); });
selLength.addEventListener('change',()=>{ setPassage(pickPassage()); });

// Init
setPassage(pickPassage());
