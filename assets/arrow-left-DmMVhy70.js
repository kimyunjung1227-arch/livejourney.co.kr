import{r as e}from"./index-DhXZPFDk.js";
/**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=(...e)=>e.filter((e,r,t)=>Boolean(e)&&""!==e.trim()&&t.indexOf(e)===r).join(" ").trim(),t=e=>{const r=(e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,t)=>t?t.toUpperCase():r.toLowerCase()))(e);return r.charAt(0).toUpperCase()+r.slice(1)};
/**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
/**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var o={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};
/**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a=e=>{for(const r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0;return!1},s=e.createContext({}),i=e.forwardRef(({color:t,size:i,strokeWidth:n,absoluteStrokeWidth:l,className:c="",children:d,iconNode:h,...u},m)=>{const{size:p=24,strokeWidth:w=2,absoluteStrokeWidth:f=!1,color:k="currentColor",className:N=""}=e.useContext(s)??{},x=l??f?24*Number(n??w)/Number(i??p):n??w;return e.createElement("svg",{ref:m,...o,width:i??p??o.width,height:i??p??o.height,stroke:t??k,strokeWidth:x,className:r("lucide",N,c),...!d&&!a(u)&&{"aria-hidden":"true"},...u},[...h.map(([r,t])=>e.createElement(r,t)),...Array.isArray(d)?d:[d]])}),n=(o,a)=>{const s=e.forwardRef(({className:s,...n},l)=>{return e.createElement(i,{ref:l,iconNode:a,className:r(`lucide-${c=t(o),c.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}`,`lucide-${o}`,s),...n});var c});return s.displayName=t(o),s},l=n("arrow-left",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);export{l as A,n as c};
