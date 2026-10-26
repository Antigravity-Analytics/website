/* Mise sign-up / book-a-call form → HubSpot Forms Submission API (v3, unauthenticated, CORS-enabled).
   Fill in MISE_FORM_CONFIG before going live. Nothing here is published anywhere. */
(function(){
"use strict";
var CFG = window.MISE_FORM_CONFIG || {};
var PORTAL = CFG.portalId || "343790256";
var GUID   = CFG.formGuid || "";            // TODO(user): HubSpot form ID once the form exists
var HOST   = CFG.apiHost || "api.hsforms.com"; // account UI is app-na3; if CORS/404, try the regional host shown in HubSpot embed code
var BOOK   = CFG.bookingUrl || "https://meetings-na3.hubspot.com/ganga";   // HubSpot booking page (opens in new tab)
var BOOK_EMBED = CFG.bookingEmbedUrl || ""; // long schedules URL + ?gv=true (iframe-able)
var SUB_ID = CFG.subscriptionTypeId || 3880517645; // "Marketing Information" (read from HubSpot 19 Oct 2026)

var root = document.querySelector(".mise-form"); if(!root) return;
var form = root.querySelector("form");
function $(s){return form.querySelector(s)}
function val(n){var el=form.elements[n]; if(!el) return ""; if(el.length&&el[0]&&el[0].type==="radio"){for(var i=0;i<el.length;i++){if(el[i].checked)return el[i].value}return ""} return (el.type==="checkbox")?(el.checked?"true":""):String(el.value||"").trim()}
function cookie(n){var m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):undefined}
var qs = new URLSearchParams(location.search);
if(qs.get("lead_source")) form.elements.mise_lead_source.value = qs.get("lead_source");
/* Campaign links carry utm_* — map them onto the hidden mise_utm_* fields. */
[["utm_source","mise_utm_source"],["utm_medium","mise_utm_medium"],["utm_campaign","mise_utm_campaign"],["utm_content","mise_utm_content"]].forEach(function(p){var v=qs.get(p[0]);if(v&&form.elements[p[1]])form.elements[p[1]].value=v;});

var rules = {
  firstname:function(v){return v?"":"Required"},
  lastname:function(v){return v?"":"Required"},
  email:function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)?"":"Enter a valid email"},
  phone:function(v){return !v||/^[0-9+().\-\s]{7,20}$/.test(v)?"":"Check the number"},
  company:function(v){return v?"":"Required"},
  mise_province:function(v){return v?"":"Choose one"},
  mise_role:function(v){return v?"":"Choose one"},
  mise_business_type:function(v){return v?"":"Choose one"},
  mise_number_of_locations:function(v){return /^[1-9][0-9]{0,3}$/.test(v)?"":"Whole number, 1 or more"},
  mise_pos_system:function(v){return v?"":"Choose one"},
  mise_franchisee:function(v){return v?"":"Choose one"},
  casl_consent:function(v){return v?"":"Tick the box to continue"}
};
function wrapOf(n){var el=form.elements[n]; el=el.length&&!el.tagName?el[0]:el; return el.closest("[data-f]")}
function check(){
  var ok=true, first=null;
  Object.keys(rules).forEach(function(n){
    var msg=rules[n](val(n)), w=wrapOf(n); if(!w) return;
    var e=w.querySelector(".err")||(w.nextElementSibling&&w.nextElementSibling.classList.contains("err")?w.nextElementSibling:null); if(e) e.textContent=msg;
    w.classList.toggle("invalid",!!msg);
    if(msg){ok=false; if(!first) first=w.querySelector("input,select")}
  });
  if(first) first.focus();
  return ok;
}
form.addEventListener("change",function(ev){var w=ev.target.closest("[data-f]"); if(w&&w.classList.contains("invalid")) check();});

var consentText = root.querySelector("#caslText").textContent.replace(/\s+/g," ").trim();
var noticeText  = root.querySelector("#processText").textContent.replace(/\s+/g," ").trim();

form.addEventListener("submit",function(ev){
  ev.preventDefault();
  var fe=root.querySelector(".formerr"); fe.style.display="none";
  if(val("company_website")) return;            // honeypot
  if(!check()) return;
  var names=["firstname","lastname","email","phone","company","mise_province","mise_role","mise_business_type","mise_number_of_locations","mise_pos_system","mise_franchisee","mise_lead_source","mise_utm_source","mise_utm_medium","mise_utm_campaign","mise_utm_content","mise_biggest_problem"];
  var fields=names.map(function(n){return {objectTypeId:"0-1",name:n,value:val(n)}}).filter(function(f){return f.value!==""});
  var body={
    submittedAt:String(Date.now()),
    fields:fields,
    context:{pageUri:location.href,pageName:document.title,hutk:cookie("hubspotutk")},
    legalConsentOptions:{consent:{consentToProcess:true,text:noticeText,
      communications:[{value:true,subscriptionTypeId:SUB_ID,text:consentText}]}}
  };
  if(!body.context.hutk) delete body.context.hutk;
  var btn=form.querySelector(".cta"); btn.disabled=true; btn.textContent="Sending…";
  if(!GUID){ // preview mode: no form ID yet → show the thank-you/booking step without sending anything
    console.info("[mise-form] PREVIEW: no formGuid set, nothing sent.",body); return done();
  }
  fetch("https://"+HOST+"/submissions/v3/integration/submit/"+PORTAL+"/"+GUID,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
    .then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok) throw j; return j})})
    .then(done)
    .catch(function(err){console.error("[mise-form]",err);btn.disabled=false;btn.textContent="Request an invite";
      fe.textContent="That didn't go through. Please try again, or email hello@antigrav.si."; fe.style.display="block";});
});

function done(){
  root.classList.add("done");
  // No embed: the success panel sends the booker to the HubSpot booking page via the button below.
  var fr=root.querySelector("[data-booking-embed]"), cal=root.querySelector(".cal");
  if(BOOK_EMBED && fr){ fr.src=BOOK_EMBED; } else if(cal){ cal.style.display="none"; }
  var a=root.querySelector("[data-booking-link]"); if(a) a.href=BOOK;
  root.querySelector(".ok").focus();
}
})();
