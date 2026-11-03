/* Mise book-a-call form, rebuilt 2026-11-02 to the complete flow spec:
   E50 field set (5 required, 2 optional), F7 split consent (processing notice
   only to book; marketing optional and unticked), E57 inline validation with
   the N06 error motion, E58 failure states, E59 device draft, N08 panel
   handoff, F2 Cal.com embed inside the success panel with the new-tab route
   as fallback only, E62 to E65 booking step behaviour.
   Endpoint is the live HubSpot Forms Submission API config, unchanged. */
(function(){
"use strict";
var CFG = window.MISE_FORM_CONFIG || {};
var I18N = window.MISE_I18N || {};
var PORTAL = CFG.portalId || "343790256";
var GUID   = CFG.formGuid || "";
var HOST   = CFG.apiHost || "api.hsforms.com";
var BOOK   = CFG.bookingUrl || "https://cal.com/antigravity/intro-call";
var SUB_ID = CFG.subscriptionTypeId || 3880517645;
var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var root = document.querySelector(".mise-form"); if(!root) return;
var form = root.querySelector("form");
function $(s,c){return (c||root).querySelector(s)}
function val(n){var el=form.elements[n]; if(!el) return ""; if(el.type==="checkbox")return el.checked?"true":""; return String(el.value||"").trim()}
function cookie(n){var m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):undefined}
function ls(k,v){try{if(v===null)localStorage.removeItem(k);else if(v===undefined)return localStorage.getItem(k);else localStorage.setItem(k,v)}catch(e){return null}}

/* Campaign + fit context carried in hidden fields (preserved behaviour) */
var qs = new URLSearchParams(location.search);
if(qs.get("lead_source") && form.elements.mise_lead_source) form.elements.mise_lead_source.value = qs.get("lead_source");
[["utm_source","mise_utm_source"],["utm_medium","mise_utm_medium"],["utm_campaign","mise_utm_campaign"],["utm_content","mise_utm_content"]].forEach(function(p){var v=qs.get(p[0]);if(v&&form.elements[p[1]])form.elements[p[1]].value=v;});

/* ---------- Validation (E57 + N06) ---------- */
var rules = {
  firstname:function(v){return v?"":(I18N.required||"Required")},
  lastname:function(v){return v?"":(I18N.required||"Required")},
  email:function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)?"":(I18N.email||"Enter a valid email")},
  company:function(v){return v?"":(I18N.required||"Required")},
  mise_number_of_locations:function(v){return /^[1-9][0-9]{0,3}$/.test(v)?"":(I18N.locations||"Whole number, 1 or more")},
  phone:function(v){return !v||/^[0-9+().\-\s]{7,20}$/.test(v)?"":(I18N.phone||"Check the number")}
};
var FIELD_ORDER = ["firstname","lastname","email","company","mise_number_of_locations","phone"];
function wrapOf(n){var el=form.elements[n]; if(!el) return null; return el.closest("[data-f]")}
function setErr(n,msg,delayMs){
  var w=wrapOf(n); if(!w) return;
  var e=w.querySelector(".err"); var input=form.elements[n];
  if(msg){
    if(e){e.classList.remove("fading"); e.textContent=msg; e.style.animationDelay=(delayMs||0)+"ms";}
    w.classList.add("invalid");
    if(input)input.setAttribute("aria-invalid","true");
  }else if(w.classList.contains("invalid")){
    if(e&&!REDUCED){e.classList.add("fading");
      setTimeout(function(){w.classList.remove("invalid"); e.classList.remove("fading");},110);
    }else{w.classList.remove("invalid");}
    if(input)input.removeAttribute("aria-invalid");
  }
}
function validateOne(n){setErr(n,rules[n]?rules[n](val(n)):null,0); return !(rules[n]&&rules[n](val(n)));}
function validateAll(focusFirst){
  var ok=true, first=null, idx=0;
  FIELD_ORDER.forEach(function(n){
    var msg=rules[n](val(n));
    setErr(n,msg,msg?idx*40:0);
    if(msg){ok=false; idx++; if(!first)first=form.elements[n];}
  });
  if(!ok&&focusFirst&&first)first.focus();
  return ok;
}
form.addEventListener("change",function(ev){
  var w=ev.target.closest?ev.target.closest("[data-f]"):null;
  if(w&&w.classList.contains("invalid")){
    var input=w.querySelector("input,textarea,select");
    if(input&&input.name)validateOne(input.name);
  }
});

/* ---------- Device draft (E59) + restore offer (E81) ---------- */
var DRAFT_FIELDS=["firstname","lastname","email","company","mise_number_of_locations","mise_biggest_problem","phone"];
var draftTimer=null;
form.addEventListener("input",function(){
  clearTimeout(draftTimer);
  draftTimer=setTimeout(function(){
    var d={}, any=false;
    DRAFT_FIELDS.forEach(function(n){var v=val(n); d[n]=v; if(v)any=true;});
    ls("mise-draft-v1",any?JSON.stringify(d):null);
  },350);
});
var restoreBar=$("#restorebar");
var savedDraft=null;
try{savedDraft=JSON.parse(ls("mise-draft-v1")||"null")}catch(e){}
if(savedDraft&&restoreBar&&!ls("mise-stage")){
  restoreBar.classList.add("show");
  restoreBar.addEventListener("click",function(ev){
    var b=ev.target.closest("[data-restore]"); if(!b)return;
    if(b.getAttribute("data-restore")==="use"){
      DRAFT_FIELDS.forEach(function(n){if(form.elements[n]&&savedDraft[n])form.elements[n].value=savedDraft[n];});
      var fn=form.elements.firstname; if(fn)fn.focus();
    }else{
      ls("mise-draft-v1",null);
    }
    restoreBar.classList.remove("show");
  });
}

/* ---------- Submit (E58) ---------- */
var noticeText = ($("#processText")||{textContent:""}).textContent.replace(/\s+/g," ").trim();
var mktTextEl = $("#mktText");
var mktText = mktTextEl ? mktTextEl.textContent.replace(/\s+/g," ").trim() : "";
var stillTimer=null, abortTimer=null;

form.addEventListener("submit",function(ev){
  ev.preventDefault();
  var fe=root.querySelector(".formerr"); fe.style.display="none";
  if(val("company_website")) return;            // honeypot: silent for bots only
  if(!validateAll(true)) return;
  var names=["firstname","lastname","email","phone","company","mise_number_of_locations","mise_biggest_problem","mise_pos_system","mise_segment","mise_context","mise_lead_source","mise_utm_source","mise_utm_medium","mise_utm_campaign","mise_utm_content"];
  var fields=names.map(function(n){return {objectTypeId:"0-1",name:n,value:val(n)}}).filter(function(f){return f.value!==""});
  var consent={consentToProcess:true,text:noticeText};
  if(form.elements.marketing_consent && form.elements.marketing_consent.checked){
    consent.communications=[{value:true,subscriptionTypeId:SUB_ID,text:mktText}];
  }
  var body={submittedAt:String(Date.now()),fields:fields,
    context:{pageUri:location.href,pageName:document.title,hutk:cookie("hubspotutk")},
    legalConsentOptions:{consent:consent}};
  if(!body.context.hutk) delete body.context.hutk;

  var btn=form.querySelector(".cta");
  var still=$("#stillline");
  btn.disabled=true; btn.textContent=I18N.sending||"Sending…";
  stillTimer=setTimeout(function(){if(still)still.classList.add("show");},8000);
  function fail(){
    clearTimeout(stillTimer); clearTimeout(abortTimer);
    if(still)still.classList.remove("show");
    btn.disabled=false; btn.textContent=I18N.submit||"Book a call";
    fe.textContent=I18N.fail||"That did not go through. Please try again, or email hello@antigrav.si.";
    fe.style.display="block";
  }
  if(!GUID){ console.info("[mise-form] PREVIEW: no formGuid set, nothing sent.",body); clearTimeout(stillTimer); return done(); }
  var ctl=("AbortController" in window)?new AbortController():null;
  if(ctl)abortTimer=setTimeout(function(){ctl.abort();},20000);
  fetch("https://"+HOST+"/submissions/v3/integration/submit/"+PORTAL+"/"+GUID,
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:ctl?ctl.signal:undefined})
    .then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok) throw j; return j})})
    .then(function(){clearTimeout(stillTimer);clearTimeout(abortTimer); if(still)still.classList.remove("show"); done();})
    .catch(function(err){console.error("[mise-form]",err); fail();});
});

/* ---------- Success + booking step (N08, F2, E60 to E65) ---------- */
var calStarted=false;
function fillSummary(){
  var s=null; try{s=JSON.parse(ls("mise-summary")||"null")}catch(e){}
  var el=$("#oksummary"); if(!el)return;
  if(s&&s.name&&s.store){
    var count = s.count==="1" ? (I18N.locOne||"1 location") : (I18N.locMany||"{n} locations").replace("{n}",s.count||"");
    el.textContent=(I18N.summary||"For {name}, at {store}, {count}.").replace("{name}",s.name).replace("{store}",s.store).replace("{count}",count);
  }
  var tz=$("#tzline");
  if(tz){var zone=""; try{zone=Intl.DateTimeFormat().resolvedOptions().timeZone||""}catch(e){}
    if(zone)tz.textContent=(I18N.tz||"Times are shown in your time zone: {zone}. The call is run from Toronto.").replace("{zone}",zone);}
  var phoneExtra=$("#phone-extra");
  if(phoneExtra){var hasPhone=false; if(s&&s.phone)hasPhone=true; phoneExtra.hidden=hasPhone;}
}
function onBooked(e){
  var when="";
  try{
    var d=(e&&e.detail&&e.detail.data)||{};
    var raw=d.date||d.startTime||d.eventTime||"";
    if(raw){var dt=new Date(raw);
      if(!isNaN(dt.getTime())){
        var loc=(document.documentElement.lang||"en").indexOf("fr")===0?"fr-CA":"en-CA";
        when=new Intl.DateTimeFormat(loc,{weekday:"long",month:"long",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(dt);
      }}
  }catch(err){}
  if(when){var bw=$("#bookedwhen"); if(bw)bw.textContent=when;}
  ls("mise-stage","booked"); if(when)ls("mise-booked",when);
  showBooked();
}
function showBooked(){
  var wrap=$("#calwrap"), load=$("#calload"), fb=$("#calfallback"), bk=$("#bookedblock");
  if(!bk)return;
  function swap(){
    if(wrap)wrap.style.display="none";
    if(fb)fb.classList.remove("show");
    bk.classList.add("show");
  }
  if(load)load.classList.add("gone");
  if(REDUCED||!wrap||wrap.style.display==="none"){swap();return;}
  wrap.style.transition="opacity .17s cubic-bezier(.3,0,1,1)"; wrap.style.opacity="0";
  setTimeout(swap,170);
}
window.__miseOnBooked = onBooked; /* staging hook: lets the verification pass fire the same handler the Cal event fires */

function initCal(){
  if(calStarted)return; calStarted=true;
  var wrap=$("#calwrap"), load=$("#calload"), fb=$("#calfallback");
  var link=CFG.calLink||"antigravity/intro-call";
  (function(C,A,L){var p=function(a,ar){a.q.push(ar)};var d=C.document;C.Cal=C.Cal||function(){var cal=C.Cal;var ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];var s=d.head.appendChild(d.createElement("script"));s.src=A;cal.loaded=true}if(ar[0]==="init"){var api=function(){p(api,arguments)};var ns=ar[1];api.q=api.q||[];if(typeof ns==="string"){cal.ns[ns]=cal.ns[ns]||api;p(cal.ns[ns],ar);p(cal,["initNamespace",ns])}else p(cal,ar);return}p(cal,ar)};})(window,"https://app.cal.com/embed/embed.js","Cal");
  try{
    window.Cal("init",{origin:"https://cal.com"});
    window.Cal("inline",{elementOrSelector:"#cal-inline",config:{layout:"month_view"},calLink:link});
    window.Cal("on",{action:"bookingSuccessful",callback:onBooked});
  }catch(e){}
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    var fr=wrap?wrap.querySelector("iframe"):null;
    if(fr){clearInterval(iv); if(load)load.classList.add("gone"); if(wrap)wrap.classList.add("ready");}
    else if(tries>=18){ /* about 7 seconds: the embed is treated as failed, F2 fallback */
      clearInterval(iv);
      if(load)load.classList.add("gone");
      if(wrap)wrap.style.display="none";
      if(fb)fb.classList.add("show");
    }
  },400);
}

function done(){
  var summary={name:val("firstname"),store:val("company"),count:val("mise_number_of_locations"),phone:val("phone")};
  ls("mise-summary",JSON.stringify(summary));
  ls("mise-stage","submitted");
  ls("mise-draft-v1",null);
  if(window.__agTrackLead) window.__agTrackLead();
  var parts=[$(".intro",root),$(".howstrip",root),form];
  function finish(){
    root.classList.add("done");
    fillSummary();
    initCal();
    setTimeout(function(){var ok=root.querySelector(".ok"); if(ok)ok.focus();},REDUCED?60:480);
  }
  if(REDUCED){finish();return;}
  parts.forEach(function(p){if(p)p.classList.add("leaving");});
  setTimeout(finish,225);
}

/* ---------- Returning visitor (Stage 14, E79: state offered directly) ---------- */
(function(){
  var stage=ls("mise-stage");
  if((stage==="submitted"||stage==="booked")&&ls("mise-summary")){
    root.classList.add("done","noanim");
    fillSummary();
    initCal();
    if(stage==="booked"){
      var w=ls("mise-booked"); if(w){var bw=$("#bookedwhen"); if(bw)bw.textContent=w;}
      var iv=setInterval(function(){
        var wrap=$("#calwrap");
        if(wrap&&(wrap.querySelector("iframe")||wrap.style.display==="none")){clearInterval(iv); showBooked();}
      },400);
      setTimeout(function(){clearInterval(iv);},9000);
    }
  }
})();
})();
