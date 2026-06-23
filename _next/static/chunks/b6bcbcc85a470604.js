(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,79474,(e,t,o)=>{"use strict";var r=e.r(71645).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;o.c=function(e){return r.H.useMemoCache(e)}},932,(e,t,o)=>{"use strict";t.exports=e.r(79474)},5766,e=>{"use strict";let t,o;var r,n=e.i(71645);let a={data:""},i=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,s=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,d=(e,t)=>{let o="",r="",n="";for(let a in e){let i=e[a];"@"==a[0]?"i"==a[1]?o=a+" "+i+";":r+="f"==a[1]?d(i,a):a+"{"+d(i,"k"==a[1]?"":t)+"}":"object"==typeof i?r+=d(i,t?t.replace(/([^,])+/g,e=>a.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):a):null!=i&&(a=/^--/.test(a)?a:a.replace(/[A-Z]/g,"-$&").toLowerCase(),n+=d.p?d.p(a,i):a+":"+i+";")}return o+(t&&n?t+"{"+n+"}":n)+r},c={},m=e=>{if("object"==typeof e){let t="";for(let o in e)t+=o+m(e[o]);return t}return e};function u(e){let t,o,r=this||{},n=e.call?e(r.p):e;return((e,t,o,r,n)=>{var a;let u=m(e),h=c[u]||(c[u]=(e=>{let t=0,o=11;for(;t<e.length;)o=101*o+e.charCodeAt(t++)>>>0;return"go"+o})(u));if(!c[h]){let t=u!==e?e:(e=>{let t,o,r=[{}];for(;t=i.exec(e.replace(s,""));)t[4]?r.shift():t[3]?(o=t[3].replace(l," ").trim(),r.unshift(r[0][o]=r[0][o]||{})):r[0][t[1]]=t[2].replace(l," ").trim();return r[0]})(e);c[h]=d(n?{["@keyframes "+h]:t}:t,o?"":"."+h)}let b=o&&c.g?c.g:null;return o&&(c.g=c[h]),a=c[h],b?t.data=t.data.replace(b,a):-1===t.data.indexOf(a)&&(t.data=r?a+t.data:t.data+a),h})(n.unshift?n.raw?(t=[].slice.call(arguments,1),o=r.p,n.reduce((e,r,n)=>{let a=t[n];if(a&&a.call){let e=a(o),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;a=t?"."+t:e&&"object"==typeof e?e.props?"":d(e,""):!1===e?"":e}return e+r+(null==a?"":a)},"")):n.reduce((e,t)=>Object.assign(e,t&&t.call?t(r.p):t),{}):n,(e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||a})(r.target),r.g,r.o,r.k)}u.bind({g:1});let h,b,p,g=u.bind({k:1});function f(e,t){let o=this||{};return function(){let r=arguments;function n(a,i){let s=Object.assign({},a),l=s.className||n.className;o.p=Object.assign({theme:b&&b()},s),o.o=/ *go\d+/.test(l),s.className=u.apply(o,r)+(l?" "+l:""),t&&(s.ref=i);let d=e;return e[0]&&(d=s.as||e,delete s.as),p&&d[0]&&p(s),h(d,s)}return t?t(n):n}}var y=(e,t)=>"function"==typeof e?e(t):e,v=(t=0,()=>(++t).toString()),x=()=>{if(void 0===o&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");o=!e||e.matches}return o},k="default",w=(e,t)=>{let{toastLimit:o}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,o)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return w(e,{type:+!!e.toasts.find(e=>e.id===r.id),toast:r});case 3:let{toastId:n}=t;return{...e,toasts:e.toasts.map(e=>e.id===n||void 0===n?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let a=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+a}))}}},E=[],T={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},C={},S=(e,t=k)=>{C[t]=w(C[t]||T,e),E.forEach(([e,o])=>{e===t&&o(C[t])})},_=e=>Object.keys(C).forEach(t=>S(e,t)),I=(e=k)=>t=>{S(t,e)},N={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},O=(e={},t=k)=>{let[o,r]=(0,n.useState)(C[t]||T),a=(0,n.useRef)(C[t]);(0,n.useEffect)(()=>(a.current!==C[t]&&r(C[t]),E.push([t,r]),()=>{let e=E.findIndex(([e])=>e===t);e>-1&&E.splice(e,1)}),[t]);let i=o.toasts.map(t=>{var o,r,n;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(o=e[t.type])?void 0:o.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(r=e[t.type])?void 0:r.duration)||(null==e?void 0:e.duration)||N[t.type],style:{...e.style,...null==(n=e[t.type])?void 0:n.style,...t.style}}});return{...o,toasts:i}},j=e=>(t,o)=>{let r,n=((e,t="blank",o)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...o,id:(null==o?void 0:o.id)||v()}))(t,e,o);return I(n.toasterId||(r=n.id,Object.keys(C).find(e=>C[e].toasts.some(e=>e.id===r))))({type:2,toast:n}),n.id},A=(e,t)=>j("blank")(e,t);A.error=j("error"),A.success=j("success"),A.loading=j("loading"),A.custom=j("custom"),A.dismiss=(e,t)=>{let o={type:3,toastId:e};t?I(t)(o):_(o)},A.dismissAll=e=>A.dismiss(void 0,e),A.remove=(e,t)=>{let o={type:4,toastId:e};t?I(t)(o):_(o)},A.removeAll=e=>A.remove(void 0,e),A.promise=(e,t,o)=>{let r=A.loading(t.loading,{...o,...null==o?void 0:o.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let n=t.success?y(t.success,e):void 0;return n?A.success(n,{id:r,...o,...null==o?void 0:o.success}):A.dismiss(r),e}).catch(e=>{let n=t.error?y(t.error,e):void 0;n?A.error(n,{id:r,...o,...null==o?void 0:o.error}):A.dismiss(r)}),e};var D=1e3,P=(e,t="default")=>{let{toasts:o,pausedAt:r}=O(e,t),a=(0,n.useRef)(new Map).current,i=(0,n.useCallback)((e,t=D)=>{if(a.has(e))return;let o=setTimeout(()=>{a.delete(e),s({type:4,toastId:e})},t);a.set(e,o)},[]);(0,n.useEffect)(()=>{if(r)return;let e=Date.now(),n=o.map(o=>{if(o.duration===1/0)return;let r=(o.duration||0)+o.pauseDuration-(e-o.createdAt);if(r<0){o.visible&&A.dismiss(o.id);return}return setTimeout(()=>A.dismiss(o.id,t),r)});return()=>{n.forEach(e=>e&&clearTimeout(e))}},[o,r,t]);let s=(0,n.useCallback)(I(t),[t]),l=(0,n.useCallback)(()=>{s({type:5,time:Date.now()})},[s]),d=(0,n.useCallback)((e,t)=>{s({type:1,toast:{id:e,height:t}})},[s]),c=(0,n.useCallback)(()=>{r&&s({type:6,time:Date.now()})},[r,s]),m=(0,n.useCallback)((e,t)=>{let{reverseOrder:r=!1,gutter:n=8,defaultPosition:a}=t||{},i=o.filter(t=>(t.position||a)===(e.position||a)&&t.height),s=i.findIndex(t=>t.id===e.id),l=i.filter((e,t)=>t<s&&e.visible).length;return i.filter(e=>e.visible).slice(...r?[l+1]:[0,l]).reduce((e,t)=>e+(t.height||0)+n,0)},[o]);return(0,n.useEffect)(()=>{o.forEach(e=>{if(e.dismissed)i(e.id,e.removeDelay);else{let t=a.get(e.id);t&&(clearTimeout(t),a.delete(e.id))}})},[o,i]),{toasts:o,handlers:{updateHeight:d,startPause:l,endPause:c,calculateOffset:m}}},$=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,B=g`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,R=g`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,L=f("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${$} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${B} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${R} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,M=g`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,H=f("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${M} 1s linear infinite;
`,z=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,U=g`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,F=f("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${U} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,G=f("div")`
  position: absolute;
`,W=f("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,K=g`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Y=f("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${K} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,q=({toast:e})=>{let{icon:t,type:o,iconTheme:r}=e;return void 0!==t?"string"==typeof t?n.createElement(Y,null,t):t:"blank"===o?null:n.createElement(W,null,n.createElement(H,{...r}),"loading"!==o&&n.createElement(G,null,"error"===o?n.createElement(L,{...r}):n.createElement(F,{...r})))},Z=f("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,V=f("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,J=n.memo(({toast:e,position:t,style:o,children:r})=>{let a=e.height?((e,t)=>{let o=e.includes("top")?1:-1,[r,n]=x()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*o}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*o}%,-1px) scale(.6); opacity:0;}
`];return{animation:t?`${g(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${g(n)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},i=n.createElement(q,{toast:e}),s=n.createElement(V,{...e.ariaProps},y(e.message,e));return n.createElement(Z,{className:e.className,style:{...a,...o,...e.style}},"function"==typeof r?r({icon:i,message:s}):n.createElement(n.Fragment,null,i,s))});r=n.createElement,d.p=void 0,h=r,b=void 0,p=void 0;var Q=({id:e,className:t,style:o,onHeightUpdate:r,children:a})=>{let i=n.useCallback(t=>{if(t){let o=()=>{r(e,t.getBoundingClientRect().height)};o(),new MutationObserver(o).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,r]);return n.createElement("div",{ref:i,className:t,style:o},a)},X=u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,ee=({reverseOrder:e,position:t="top-center",toastOptions:o,gutter:r,children:a,toasterId:i,containerStyle:s,containerClassName:l})=>{let{toasts:d,handlers:c}=P(o,i);return n.createElement("div",{"data-rht-toaster":i||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...s},className:l,onMouseEnter:c.startPause,onMouseLeave:c.endPause},d.map(o=>{let i,s,l=o.position||t,d=c.calculateOffset(o,{reverseOrder:e,gutter:r,defaultPosition:t}),m=(i=l.includes("top"),s=l.includes("center")?{justifyContent:"center"}:l.includes("right")?{justifyContent:"flex-end"}:{},{left:0,right:0,display:"flex",position:"absolute",transition:x()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${d*(i?1:-1)}px)`,...i?{top:0}:{bottom:0},...s});return n.createElement(Q,{id:o.id,key:o.id,onHeightUpdate:c.updateHeight,className:o.visible?X:"",style:m},"custom"===o.type?y(o.message,o):a?a(o):n.createElement(J,{toast:o,position:l}))}))};e.s(["CheckmarkIcon",()=>F,"ErrorIcon",()=>L,"LoaderIcon",()=>H,"ToastBar",()=>J,"ToastIcon",()=>q,"Toaster",()=>ee,"default",()=>A,"resolveValue",()=>y,"toast",()=>A,"useToaster",()=>P,"useToasterStore",()=>O],5766)},15290,e=>{"use strict";var t=e.i(43476),o=e.i(932),r=e.i(71645);let n=(0,r.createContext)(void 0);function a(e){let a,s,l,d,c,m,u,h,b,p,g=(0,o.c)(19),{children:f}=e,[y,v]=(0,r.useState)("dark"),[x,k]=(0,r.useState)(!1);g[0]===Symbol.for("react.memo_cache_sentinel")?(a=()=>{let e=localStorage.getItem("theme_preference");("light"===e||"dark"===e)&&v(e),k(!0)},s=[],g[0]=a,g[1]=s):(a=g[0],s=g[1]),(0,r.useEffect)(a,s),g[2]!==x||g[3]!==y?(l=()=>{x&&("light"===y?document.body.classList.add("light-theme"):document.body.classList.remove("light-theme"),localStorage.setItem("theme_preference",y))},d=[y,x],g[2]=x,g[3]=y,g[4]=l,g[5]=d):(l=g[4],d=g[5]),(0,r.useEffect)(l,d),g[6]===Symbol.for("react.memo_cache_sentinel")?(c=()=>{v(i)},g[6]=c):c=g[6];let w=c;g[7]!==y?(m={theme:y,toggleTheme:w},u="light"===y&&(0,t.jsx)("style",{suppressHydrationWarning:!0,children:'\n    body.light-theme {\n      --background: #f0f2f5 !important;\n      --foreground: #000000 !important;\n      background-color: #f0f2f5 !important;\n      color: #000000 !important;\n    }\n    \n    /* Global Base */\n    body.light-theme .bg-\\[\\#11141e\\],\n    body.light-theme .bg-slate-900,\n    body.light-theme .bg-\\[\\#0c101a\\] {\n      background-color: #f0f2f5 !important;\n    }\n\n    /* Modals & Panels */\n    body.light-theme .bg-\\[\\#1c2130\\],\n    body.light-theme .bg-\\[\\#191e2b\\],\n    body.light-theme .bg-\\[\\#1f2536\\],\n    body.light-theme .bg-\\[\\#161a25\\],\n    body.light-theme .bg-\\[\\#252b3d\\],\n    body.light-theme .bg-\\[\\#2a303d\\],\n    body.light-theme .bg-\\[\\#323847\\],\n    body.light-theme .bg-gray-800,\n    body.light-theme .bg-gray-900 {\n      background-color: #ffffff !important;\n      border-color: #e5e7eb !important;\n    }\n\n    /* Inputs */\n    body.light-theme .bg-\\[\\#eee0e0\\] {\n      background-color: #f9fafb !important;\n      border: 1px solid #d1d5db !important;\n      color: #000000 !important;\n    }\n\n    /* Borders */\n    body.light-theme .border-gray-800,\n    body.light-theme .border-gray-700,\n    body.light-theme .border-gray-600 {\n      border-color: #e5e7eb !important;\n    }\n\n    /* Headings */\n    body.light-theme h1,\n    body.light-theme h2,\n    body.light-theme h3,\n    body.light-theme h4,\n    body.light-theme h5 {\n      color: #11141E !important;\n    }\n\n    /* Text */\n    body.light-theme .text-white,\n    body.light-theme .text-gray-200,\n    body.light-theme .text-gray-300,\n    body.light-theme .text-gray-400,\n    body.light-theme .text-gray-500,\n    body.light-theme .text-\\[\\#ccd6f6\\] {\n      color: #2b303c !important;\n    }\n\n    /* Inputs Focus Color */\n    body.light-theme input,\n    body.light-theme select {\n      color: #000000 !important;\n    }\n\n    /* Opacities & Modal Backgrounds */\n    body.light-theme .bg-black\\/60 {\n      background-color: rgba(255, 255, 255, 0.4) !important;\n    }\n    body.light-theme .bg-\\[\\#11141e\\]\\/50,\n    body.light-theme .bg-\\[\\#191e2b\\]\\/50 {\n      background-color: #f8fafc !important; /* Soft modal off-white */\n    }\n\n    /* Modal Inputs & Data ReadOnly Blocks */\n    body.light-theme .bg-\\[\\#1e293b\\] {\n      background-color: #ffffff !important;\n      color: #11141e !important;\n      border-color: #cbd5e1 !important;\n    }\n    body.light-theme .text-\\[\\#e2e8f0\\] {\n      color: #11141e !important; /* Dark text for modal properties */\n    }\n\n    /* Standard Modal Button Controls (Cancel) */\n    body.light-theme .bg-gray-700 {\n      background-color: #4b5563 !important;\n      color: #ffffff !important;\n    }\n\n    /* --- User Requested Refinements --- */\n    \n    /* 1) Brand Logo Title "ZYN" darker color */\n    body.light-theme .text-gray-100 {\n      color: #0f172a !important; /* Extra dark slate */\n    }\n\n    /* 2) Menu font color on mouse hover */\n    body.light-theme .hover\\:text-white:hover {\n      color: #2563eb !important; \n    }\n    body.light-theme .hover\\:bg-gray-800:hover {\n      background-color: #f1f5f9 !important;\n    }\n\n    /* 3) Info Boxes (Target SLA) green background / white text */\n    body.light-theme .bg-emerald-900\\/20,\n    body.light-theme .bg-emerald-600\\/20 {\n      background-color: #059669 !important;\n    }\n    /* Bind white exclusively to nested info text so global emerald text can be dark */\n    body.light-theme .bg-emerald-900\\/20 .text-emerald-400,\n    body.light-theme .bg-emerald-600\\/20 .text-emerald-400 {\n      color: #ffffff !important;\n    }\n\n    /* Status Blocks \'RUNNING\' & Text Global Contrast */\n    body.light-theme .text-emerald-400 {\n      color: #047857 !important; /* Darker green */\n    }\n    body.light-theme .bg-emerald-500\\/20 {\n      background-color: #d1fae5 !important;\n      border-color: #a7f3d0 !important;\n    }\n\n    /* Modal Titles & HR Listed Pre-populated tags */\n    body.light-theme .text-blue-200,\n    body.light-theme .text-blue-300 {\n      color: #1d4ed8 !important; /* Stronger dark blue */\n    }\n    body.light-theme .bg-blue-600\\/30 {\n      background-color: #dbeafe !important; /* Kept light blue */\n      border-color: #bfdbfe !important;\n    }\n\n    /* 4) Projects List Button Backgrounds Darker & White Text */\n    body.light-theme .bg-blue-600\\/20 {\n      background-color: #2563eb !important;\n    }\n    body.light-theme .bg-blue-600,\n    body.light-theme .bg-\\[\\#2b6cb0\\] {\n      color: #ffffff !important; /* Protect primary action and "Next/Finish Setup" buttons from white-inversion */\n    }\n    body.light-theme .text-blue-400 {\n      color: #ffffff !important;\n    }\n    body.light-theme .bg-gray-700\\/50 {\n      background-color: #4b5563 !important;\n      color: #ffffff !important; /* Settings Button Exception */\n    }\n    body.light-theme .hover\\:bg-gray-600:hover {\n      background-color: #374151 !important;\n      color: #ffffff !important;\n    }\n\n    /* 5) Row Hover Colors in Projects List Table */\n    body.light-theme .hover\\:bg-\\[\\#1f2536\\]:hover,\n    body.light-theme .hover\\:bg-\\[\\#323847\\]:hover {\n      background-color: #d3d3d3 !important;\n    }\n\n    /* 6) Start, Pause, Archive Actions Row Emphasized Background */\n    body.light-theme .bg-transparent.border-gray-700 {\n      background-color: #e5e7eb !important;\n      color: #1f2937 !important;\n      border-color: #d1d5db !important;\n    }\n    body.light-theme .hover\\:bg-\\[\\#252b3d\\]:hover {\n      background-color: #d1d5db !important;\n    }\n  '}),g[7]=y,g[8]=m,g[9]=u):(m=g[8],u=g[9]);let E=+!!x;return g[10]!==E?(h={opacity:E,transition:"opacity 0.2s ease-in"},g[10]=E,g[11]=h):h=g[11],g[12]!==f||g[13]!==h?(b=(0,t.jsx)("div",{suppressHydrationWarning:!0,style:h,children:f}),g[12]=f,g[13]=h,g[14]=b):b=g[14],g[15]!==b||g[16]!==m||g[17]!==u?(p=(0,t.jsxs)(n.Provider,{value:m,children:[u,b]}),g[15]=b,g[16]=m,g[17]=u,g[18]=p):p=g[18],p}function i(e){return"dark"===e?"light":"dark"}function s(){let e=(0,r.useContext)(n);if(void 0===e)throw Error("useTheme must be used within a ThemeProvider");return e}e.s(["ThemeProvider",()=>a,"useTheme",()=>s])}]);