/* Mise page interactions for the rebuild: fit check (N01/N02), segment pick,
   questions accordion (N05), recognition line (N07), founding cohort count
   states (F4), mini forms (waitlist, proof note, cohort waitlist), and the
   walkthrough door context (E37). Motion values are the motion contract's:
   exits 170ms House Exit, entrances 240ms House Out, 600ms minimum hold on
   swapped answers. Transform and opacity only. */
(function(){
"use strict";
var I18N = window.MISE_I18N || {};
var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(s,c){return (c||document).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
function store(k,v){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}}
function read(k){try{return localStorage.getItem(k)}catch(e){return null}}

/* ---------- Walkthrough door context (E37) ---------- */
var door=$('#doorlink');
function markWalk(){var f=document.querySelector('input[name="mise_context"]');if(f)f.value='Walkthrough started from the page';try{sessionStorage.setItem('mise-walk','1')}catch(e){}}
if(door)door.addEventListener('click',markWalk);
try{if(sessionStorage.getItem('mise-walk'))markWalk();}catch(e){}

/* ---------- Fit check (Stage 6; N01 answer swap, N02 waitlist success) ---------- */
var answerBox=$('#fitanswer');
if(answerBox){
  var panels={empty:$('[data-answer="empty"]',answerBox),live:$('[data-answer="live"]',answerBox),notyet:$('[data-answer="notyet"]',answerBox)};
  var current='empty', shownAt=0, swapping=false;
  function showAnswer(key,posName){
    $$('[data-posname]',answerBox).forEach(function(el){el.textContent=posName;});
    if(key===current||swapping)return;
    var wait=REDUCED?0:Math.max(0,600-(Date.now()-shownAt));
    swapping=true;
    setTimeout(function(){
      var from=panels[current], to=panels[key];
      function swap(){
        from.hidden=true; from.classList.remove('swapout');
        to.hidden=false; to.classList.remove('swapin'); void to.offsetWidth; to.classList.add('swapin');
        current=key; shownAt=Date.now(); swapping=false;
      }
      if(REDUCED){swap();return;}
      from.classList.add('swapout');
      setTimeout(swap,170);
    },wait);
  }
  shownAt=Date.now();
  $$('.posbtn').forEach(function(btn){
    btn.addEventListener('click',function(){
      $$('.posbtn').forEach(function(b){b.setAttribute('aria-pressed',b===btn?'true':'false');});
      var posField=document.querySelector('input[name="mise_pos_system"]');
      if(posField)posField.value=btn.getAttribute('data-pos');
      showAnswer(btn.getAttribute('data-state'),btn.getAttribute('data-pos'));
    });
  });
}

/* ---------- Segment pick (E31: shapes the walkthrough sample only) ---------- */
$$('.chipbtn').forEach(function(chip){
  chip.addEventListener('click',function(){
    $$('.chipbtn').forEach(function(c){c.setAttribute('aria-pressed',c===chip?'true':'false');});
    var seg=chip.getAttribute('data-segment');
    var f=document.querySelector('input[name="mise_segment"]'); if(f)f.value=seg;
    var sl=$('#sampleline'); if(sl&&I18N.sample&&I18N.sample[seg])sl.textContent=I18N.sample[seg];
  });
});

/* ---------- Questions accordion (Stage 8; N05) ---------- */
$$('.qa').forEach(function(qa){
  var head=$('.qhead',qa), body=$('.qa-a',qa), inner=$('.qa-in',qa);
  if(!head||!body||!inner)return;
  head.addEventListener('click',function(){
    var open=qa.classList.contains('open');
    /* opening one answer may close another, concurrently (2 motions, in cap) */
    $$('.qa.open').forEach(function(other){if(other!==qa)closeQa(other);});
    if(open)closeQa(qa);else openQa(qa);
  });
  function openQa(q){
    var h=$('.qhead',q),b=$('.qa-a',q),i=$('.qa-in',q);
    q.classList.add('open'); h.setAttribute('aria-expanded','true');
    if(REDUCED)return;
    i.style.transition='none'; i.style.opacity='0'; i.style.transform='translateY(12px)';
    void i.offsetWidth;
    i.style.transition='opacity .24s cubic-bezier(.16,1,.3,1),transform .24s cubic-bezier(.16,1,.3,1)';
    i.style.opacity='1'; i.style.transform='none';
  }
  function closeQa(q){
    var h=$('.qhead',q),i=$('.qa-in',q);
    h.setAttribute('aria-expanded','false');
    if(REDUCED){q.classList.remove('open');return;}
    i.style.transition='opacity .17s cubic-bezier(.3,0,1,1)'; i.style.opacity='0';
    setTimeout(function(){q.classList.remove('open'); i.style.opacity=''; i.style.transform=''; i.style.transition='';},170);
  }
});

/* ---------- Mini forms: waitlist (E28), proof note (E77/F13), cohort (E47) ----------
   They post to the same HubSpot form endpoint as the main form, tagged by lead
   source, with the email only. A failure is shown, never faked as success. */
var CFG=window.MISE_FORM_CONFIG||{};
function postMini(fields,done,fail){
  if(!CFG.formGuid){fail();return;}
  var body={submittedAt:String(Date.now()),fields:fields.map(function(f){return{objectTypeId:"0-1",name:f[0],value:f[1]}}),
    context:{pageUri:location.href,pageName:document.title}};
  fetch("https://"+(CFG.apiHost||"api.hsforms.com")+"/submissions/v3/integration/submit/"+CFG.portalId+"/"+CFG.formGuid,
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
    .then(function(r){if(!r.ok)throw new Error("hs");done();})
    .catch(fail);
}
document.addEventListener('submit',function(ev){
  var form=ev.target;
  if(!form.matches||!form.matches('[data-miniform]'))return;
  ev.preventDefault();
  var kind=form.getAttribute('data-miniform');
  var input=form.querySelector('input[type="email"]');
  var email=(input.value||"").trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
    form.classList.remove('invalid'); void form.offsetWidth; form.classList.add('invalid'); input.focus(); return;
  }
  form.classList.remove('invalid');
  var source = kind==='waitlist' ? 'Website /mise waitlist'
             : kind==='note' ? 'Website /mise proof note'
             : 'Website /mise cohort waitlist';
  var fields=[["email",email],["mise_lead_source",source]];
  if(kind==='waitlist'){
    var pos=document.querySelector('input[name="mise_pos_system"]');
    if(pos&&pos.value)fields.push(["mise_pos_system",pos.value]);
  }
  var successEl=form.parentElement.querySelector('.wlsuccess');
  function swapSuccess(){
    if(REDUCED){form.style.display='none';if(successEl)successEl.classList.add('show');return;}
    form.classList.add('swapout');
    setTimeout(function(){form.style.display='none';if(successEl)successEl.classList.add('show');},170);
  }
  postMini(fields,swapSuccess,function(){
    var err=form.querySelector('.merr');
    if(err){err.textContent=(window.MISE_I18N&&I18N.minifail)||'That did not go through. Please email hello@antigrav.si.';}
    form.classList.remove('invalid'); void form.offsetWidth; form.classList.add('invalid');
  });
});

/* ---------- Founding cohort count (Stage 9; F4 states) ---------- */
var countBlock=$('#countblock');
if(countBlock){
  var n=window.MISE_COHORT_STATE||0;
  function render(big,small,waitlist){
    countBlock.innerHTML='';
    var b=document.createElement('div'); b.className='cbig'; b.textContent=big; countBlock.appendChild(b);
    var s=document.createElement('div'); s.className='csmall'; s.textContent=small; countBlock.appendChild(s);
    if(waitlist){
      var f=document.createElement('form'); f.className='miniform'; f.setAttribute('data-miniform','cohort'); f.setAttribute('novalidate','');
      var C2=I18N.count||{};
      f.innerHTML='<input type="email" name="email" autocomplete="email" placeholder="'+(C2.emailPh||'Work email')+'" aria-label="'+(C2.emailAria||'Email for the cohort waitlist')+'"><button type="submit">'+(C2.waitlistBtn||'Join the waitlist')+'</button><div class="merr" role="alert">'+(C2.merr||'Enter a valid email')+'</div>';
      f.style.justifyContent='center'; countBlock.appendChild(f);
      var ok=document.createElement('p'); ok.className='wlsuccess'; ok.style.justifyContent='center';
      ok.innerHTML='<span>'+(C2.waitlistOk||'You are on the waitlist for the next cohort.')+'</span>'; countBlock.appendChild(ok);
    }
  }
  var C=I18N.count||{};
  var terms=C.terms||'Founding terms are stated whole on the call, the same for every store at the same stage.';
  var taken=(C.taken||'{n} of 25 places are taken.').replace('{n}',n);
  if(n<=0){ /* words only: no digit, no bar, no ticker */ }
  else if(n<10)render(taken,(C.openSmall||'The founding cohort is open. ')+terms);
  else if(n<20)render(taken,(C.fillingSmall||'The founding cohort is filling. ')+terms);
  else if(n<25)render(taken,(C.lastSmall||'Last places in the founding cohort. ')+terms);
  else render(C.fullBig||'The founding cohort is full.',C.fullSmall||'25 of 25 places are taken. The waitlist is open for the next cohort.',true);
}

/* ---------- Recognition line (Stage 14; N07 opacity only, holds) ---------- */
var recog=$('#recog');
if(recog){
  var stage=read('mise-stage');
  if(stage==='booked'&&I18N.recogBooked){recog.innerHTML=I18N.recogBooked;recog.hidden=false;recog.classList.add('show');}
  else if(stage==='submitted'&&I18N.recogSubmitted){recog.innerHTML=I18N.recogSubmitted;recog.hidden=false;recog.classList.add('show');}
}
})();
