(this["webpackJsonpgene-clusters"]=this["webpackJsonpgene-clusters"]||[]).push([[0],{48:function(e,t,n){},49:function(e,t,n){},52:function(e,t,n){"use strict";n.r(t);var c,r=n(1),s=n.n(r),a=n(18),i=n.n(a),u=(n(48),n(9)),o=(n(49),n(19)),f=n(5),j=n.n(f),l=n(20),b=n.p+"static/media/mutationsFiltered.dae01ed9.csv",d=n(14),O=n(0),p=Object(r.createContext)();function h(e){var t=e.children,n=Object(r.useState)(),c=Object(u.a)(n,2),s=c[0],a=c[1],i=function(){var e=Object(l.a)(j.a.mark((function e(){var t,n;return j.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,d.a(b);case 2:t=e.sent,n={},t.forEach((function(e){if(e.sample_id in n)e.symbol in n[e.sample_id]?n[e.sample_id][e.symbol].push(e):n[e.sample_id][e.symbol]=[e];else{var t={};t[e.symbol]=[e],n[e.sample_id]=t}})),a(n);case 6:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}();return Object(r.useEffect)((function(){i()}),[]),Object(O.jsx)(p.Provider,{value:{allMutations:s},children:t})}function m(e){e.setMatrix;var t=Object(r.useContext)(p).allMutations;return Object(r.useEffect)((function(){t&&(Object(o.a)({},t),c=new Set,Object.values(t).forEach((function(e){return Object.keys(e).forEach((function(e){return c.add(e)}))})))}),[t]),Object(O.jsx)("div",{children:Object(O.jsx)("input",{type:"checkbox"})})}function v(){return null}function x(){var e=Object(r.useState)(),t=Object(u.a)(e,2),n=t[0],c=t[1];return Object(r.useEffect)((function(){}),[n]),Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(m,{setMutations:c}),Object(O.jsx)(v,{mutations:n})]})}var g=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,53)).then((function(t){var n=t.getCLS,c=t.getFID,r=t.getFCP,s=t.getLCP,a=t.getTTFB;n(e),c(e),r(e),s(e),a(e)}))};i.a.render(Object(O.jsx)(s.a.StrictMode,{children:Object(O.jsx)(h,{children:Object(O.jsx)(x,{})})}),document.getElementById("root")),g()}},[[52,1,2]]]);
//# sourceMappingURL=main.649c06e9.chunk.js.map