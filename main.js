import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const D = window.PORTFOLIO;
const P = D.projects;
const gsap = window.gsap;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const isTouch = matchMedia('(hover: none)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* =====================================================================
   DOM: build slides from content
   ===================================================================== */
const stage = $('#stage');
const slides = [];

function splitChars(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const chars = [];
  text.split(' ').forEach((w, i, arr) => {
    const word = document.createElement('span');
    word.className = 'word';
    word.setAttribute('aria-hidden', 'true');
    for (const c of w) {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = c;
      word.appendChild(s);
      chars.push(s);
    }
    el.appendChild(word);
    if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return chars;
}

function splitWords(el, raw) {
  // *word* => highlighted
  const marked = raw.replace(/\*(.+?)\*/g, (_, a) => a.split(' ').map((w) => '\u0001' + w).join(' '));
  el.setAttribute('aria-label', raw.replace(/\*/g, ''));
  el.textContent = '';
  const out = [];
  marked.split(' ').forEach((w, i, arr) => {
    const word = document.createElement('span');
    word.className = 'word' + (w.startsWith('\u0001') ? ' em' : '');
    word.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'wi';
    inner.textContent = w.replace('\u0001', '');
    word.appendChild(inner);
    el.appendChild(word);
    out.push(inner);
    if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return out;
}

function addSlide(type, html, extra = {}) {
  const el = document.createElement('section');
  el.className = 'slide ' + type;
  el.innerHTML = html;
  stage.appendChild(el);
  const s = { type, el, ...extra };
  s.chars = $$('[data-split]', el).flatMap(splitChars);
  s.words = $$('[data-words]', el).flatMap((w) => splitWords(w, w.textContent));
  s.fades = $$('[data-fade]', el);
  s.scr = $$('[data-scr]', el);
  s.scr.forEach((e) => (e.dataset.text = e.textContent));
  s.index = slides.length;
  slides.push(s);
  return s;
}

// HERO
const hero = addSlide('hero', `
  <div class="hero-meta mono"><span data-scr>${esc(D.role)}</span><span data-scr>${esc(D.location)}</span></div>
  <h1 class="hero-title"><span class="ln" data-split>${esc(D.firstName)}</span><span class="ln stroke" data-split>${esc(D.lastName)}</span></h1>
  <div class="hero-bottom">
    <p class="hero-tag" data-words>${esc(D.tagline)}</p>
    <div data-fade><button class="pill mono magnetic" data-go="1" data-cursor="ENTER">Enter the work <i>↓</i></button></div>
  </div>`, { name: 'Intro', colors: D.theme.hero });
hero.react = hero.chars;

// PROJECTS
P.forEach((p, k) => {
  const s = addSlide('project', `
    <div class="p-wrap">
      <div class="p-num" data-split>${pad(k + 1)}</div>
      <div class="p-meta mono"><span class="tag" data-scr>${esc(p.category)}</span><span data-scr>${esc(p.year)}</span><span data-scr>${pad(k + 1)} / ${pad(P.length)}</span></div>
      <h2 class="p-title" data-split>${esc(p.title)}</h2>
      <div class="p-tabs mono" data-fade>
        <button data-v="0" data-cursor="VIEW">Overview</button>
        <button data-v="1" data-cursor="VIEW">Stack</button>
        <button data-v="2" data-cursor="VIEW">Launch</button>
        <span class="line"></span>
      </div>
      <div class="p-views" data-fade>
        <div class="p-view"><p>${esc(p.description)}</p></div>
        <div class="p-view"><ul class="stack mono">${p.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        <div class="p-view"><div class="links">${p.links.length ? p.links.map((l, i) => `<a class="btn magnetic ${i ? 'ghost' : ''}" href="${esc(l.url)}" target="_blank" rel="noopener" data-cursor="OPEN">${esc(l.label)} <span>↗</span></a>`).join('') : `<span class="btn ghost">Source private for now</span>`}</div></div>
      </div>
    </div>`, { name: p.title, colors: p.colors, project: p, pIndex: k, view: 0 });
  s.views = $$('.p-view', s.el);
  s.tabs = $$('.p-tabs button', s.el);
  s.tabLine = $('.p-tabs .line', s.el);
  s.tabs.forEach((b) => b.addEventListener('click', () => {
    const v = +b.dataset.v;
    if (v !== s.view) setView(s, v, v > s.view ? 1 : -1);
  }));
});

// ABOUT
const about = addSlide('about', `
  <div class="a-wrap">
    <div class="a-label mono" data-fade>About — who's behind this</div>
    <p class="a-statement" data-words>${esc(D.about.statement)}</p>
    <div class="a-stats">
      ${D.about.stats.map((st) => `<div class="stat" data-fade><b data-count="${st.value}" data-suffix="${esc(st.suffix || '')}">0</b><span class="mono">${esc(st.label)}</span></div>`).join('')}
    </div>
  </div>
  <div class="marquee" data-fade>
    ${[0, 1].map((r) => {
      const list = r ? [...D.about.skills].reverse() : D.about.skills;
      const items = [...list, ...list].map((t) => `<span>${esc(t)}</span>`).join('');
      return `<div class="mq-row ${r ? 'rev' : ''}">${items}</div>`;
    }).join('')}
  </div>`, { name: 'About', colors: D.theme.about });

// CONTACT
const contact = addSlide('contact', `
  <div class="c-inner">
    <div class="c-label mono" data-scr>Got a crazy idea? Let's make it real.</div>
    <h2 class="c-title"><span class="ln" data-split>Let's</span><span class="ln" data-split>Talk</span></h2>
    <div data-fade>${D.email
      ? `<a class="pill mono c-mail magnetic" href="mailto:${esc(D.email)}" data-cursor="SAY HI">${esc(D.email)} <span>↗</span></a>`
      : `<a class="pill mono c-mail magnetic" href="${esc(D.socials[0].url)}" target="_blank" rel="noopener" data-cursor="SAY HI">${esc(D.socials[0].url.replace(/^https?:\/\//, ''))} <span>↗</span></a>`}</div>
    <div class="c-social mono" data-fade>${D.socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" data-cursor="VISIT">${esc(s.label)}</a>`).join('')}</div>
  </div>`, { name: 'Contact', colors: D.theme.contact });
contact.react = contact.chars;

const N = slides.length;
const resolveGo = (v) => (v === 'about' ? about.index : v === 'contact' ? contact.index : +v);

// HUD + index
$('#logo-text').textContent = D.initials;
document.title = `${D.firstName} ${D.lastName} — ${D.role}`;
const rail = $('#rail');
slides.forEach((s, i) => {
  const t = document.createElement('button');
  t.className = 'tick mono';
  t.dataset.go = i;
  t.setAttribute('aria-label', s.name);
  t.innerHTML = `<span>${pad(i)} ${esc(s.name)}</span>`;
  rail.appendChild(t);
});
const ticks = $$('.tick', rail);
$('#ix-title').textContent = `Index — ${pad(P.length)} projects`;
$('#ix-list').innerHTML = P.map((p, k) => `
  <li class="ix-row" data-go="${k + 1}" data-cursor="WARP" style="--c:${p.colors[1]}">
    <span class="ix-n mono">${pad(k + 1)}</span><span class="ix-t">${esc(p.title)}</span>
    <span class="ix-c mono">${esc(p.category)}</span><span class="ix-y mono">${esc(p.year)}</span>
  </li>`).join('');

/* =====================================================================
   THREE: renderer, scene, camera
   ===================================================================== */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
/* Quality presets — switchable from the HUD (top right), remembered per device */
const QUALITY = [
  { name: 'Low', pr: 0.75, bloom: false, detail: 16 },
  { name: 'Medium', pr: 1, bloom: true, detail: 26 },
  { name: 'High', pr: Math.min(devicePixelRatio, 1.5), bloom: true, detail: 36 },
  { name: 'Ultra', pr: Math.min(devicePixelRatio, 2), bloom: true, detail: 52 }
];
let qIndex = isTouch ? 1 : 2;
try {
  const saved = localStorage.getItem('pf-quality');
  if (saved !== null && QUALITY[+saved]) qIndex = +saved;
} catch (e) { /* storage blocked — use default */ }
const PR = QUALITY[qIndex].pr;
renderer.setPixelRatio(PR);
renderer.setClearColor(0x050507, 1);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050507, 0.013);

const FOV = 45, CAM_DIST = 9, SPACING = 40;
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 600);
const cam = { z: 220 };
const stationZ = (i) => -i * SPACING;

/* ---------------- shared GLSL ---------------- */
const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/* =====================================================================
   STARFIELD — points + velocity streaks (warp lines)
   ===================================================================== */
const STAR_N = isTouch ? 1800 : 3600;
const DEPTH = 420;
const starU = {
  uCamZ: { value: cam.z }, uDepth: { value: DEPTH }, uSpeed: { value: 0 },
  uTime: { value: 0 }, uPR: { value: PR }, uColor: { value: new THREE.Color('#bfe9ff') }
};
{
  const pos = new Float32Array(STAR_N * 3), rnd = new Float32Array(STAR_N);
  const lpos = new Float32Array(STAR_N * 6), lrnd = new Float32Array(STAR_N * 2), ltail = new Float32Array(STAR_N * 2);
  for (let i = 0; i < STAR_N; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.5 + Math.pow(Math.random(), 0.75) * 48;
    const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.8, z = Math.random() * DEPTH, q = Math.random();
    pos.set([x, y, z], i * 3); rnd[i] = q;
    lpos.set([x, y, z, x, y, z], i * 6); lrnd.set([q, q], i * 2); ltail.set([0, 1], i * 2);
  }
  const wrap = `p.z = uCamZ + 8.0 - mod(uCamZ + 8.0 - p.z, uDepth);`;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const points = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: starU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aRand; uniform float uCamZ,uDepth,uTime,uPR,uSpeed; varying float vA;
      void main(){ vec3 p=position; ${wrap}
        vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; float d=-mv.z;
        gl_PointSize=clamp((1.0+aRand*2.6)*uPR*(70.0/d),0.,9.);
        vA=smoothstep(uDepth,uDepth*0.35,d)*(0.55+0.45*sin(uTime*2.0+aRand*60.0))*(1.0-clamp(uSpeed*0.6,0.,0.7)); }`,
    fragmentShader: `uniform vec3 uColor; varying float vA;
      void main(){ float d=length(gl_PointCoord-0.5); gl_FragColor=vec4(uColor,smoothstep(0.5,0.0,d)*vA); }`
  }));
  points.frustumCulled = false;
  scene.add(points);

  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  lg.setAttribute('aRand', new THREE.BufferAttribute(lrnd, 1));
  lg.setAttribute('aTail', new THREE.BufferAttribute(ltail, 1));
  const lines = new THREE.LineSegments(lg, new THREE.ShaderMaterial({
    uniforms: starU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aRand; attribute float aTail; uniform float uCamZ,uDepth,uSpeed; varying float vA;
      void main(){ vec3 p=position; ${wrap}
        p.z -= aTail*uSpeed*(5.0+aRand*22.0);
        vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
        vA=(1.0-aTail)*clamp(uSpeed*1.3,0.,1.)*smoothstep(uDepth,uDepth*0.3,-mv.z); }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ gl_FragColor=vec4(uColor*1.6,vA); }`
  }));
  lines.frustumCulled = false;
  scene.add(lines);
}

/* =====================================================================
   THE BLOB — noise-displaced iridescent core that travels with you
   ===================================================================== */
const blobU = {
  uTime: { value: 0 }, uAmp: { value: 0.25 }, uFreq: { value: 1.25 },
  uA: { value: new THREE.Color(D.theme.hero[0]) },
  uB: { value: new THREE.Color(D.theme.hero[1]) },
  uC: { value: new THREE.Color(D.theme.hero[2]) }
};
// Indexed sphere: shared vertices are shaded once instead of ~6 times
function makeBlobGeo(detail) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  return mergeVertices(g);
}
const blob = new THREE.Mesh(
  makeBlobGeo(QUALITY[qIndex].detail),
  new THREE.ShaderMaterial({
    uniforms: blobU,
    vertexShader: /* glsl */ `
      uniform float uTime,uAmp,uFreq;
      varying vec3 vN; varying vec3 vW; varying float vNoise;
      ${SNOISE}
      float disp(vec3 p){
        float t=uTime*0.28;
        return snoise(p*uFreq+vec3(0.,t,t*0.6))*uAmp + snoise(p*uFreq*2.6-vec3(t))*uAmp*0.3;
      }
      void main(){
        vec3 n=normalize(position);
        float d=disp(n);
        vec3 dp=n*(1.0+d);
        vec3 t=normalize(abs(n.y)>0.99?cross(n,vec3(1.,0.,0.)):cross(n,vec3(0.,1.,0.)));
        vec3 b=normalize(cross(n,t));
        float e=0.012;
        vec3 n1=normalize(n+t*e), n2=normalize(n+b*e);
        vec3 p1=n1*(1.0+disp(n1)), p2=n2*(1.0+disp(n2));
        vec3 nn=normalize(cross(p1-dp,p2-dp));
        vNoise=d;
        vN=normalize((modelMatrix*vec4(nn,0.)).xyz);
        vec4 w=modelMatrix*vec4(dp,1.); vW=w.xyz;
        gl_Position=projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA,uB,uC; uniform float uTime;
      varying vec3 vN; varying vec3 vW; varying float vNoise;
      void main(){
        vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);
        float fres=pow(1.0-max(dot(N,V),0.0),2.2);
        vec3 base=mix(uA,uB,smoothstep(-0.25,0.35,vNoise));
        vec3 irid=0.5+0.5*cos(6.2831*(fres*1.3+vNoise*1.6+vec3(0.,0.33,0.67)+uTime*0.05));
        vec3 L=normalize(vec3(0.5,0.8,0.6));
        float diff=max(dot(N,L),0.0);
        float spec=pow(max(dot(reflect(-L,N),V),0.0),48.0);
        vec3 col=base*(0.12+0.75*diff)+irid*fres*0.9+uC*fres*1.6+spec*0.9;
        gl_FragColor=vec4(col,1.0);
      }`
  })
);
scene.add(blob);
const blobState = { s: 1.6 };
const halo = new THREE.Points(
  new THREE.IcosahedronGeometry(1.6, isTouch ? 6 : 9),
  new THREE.PointsMaterial({ size: 0.022, color: 0xffffff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
);
blob.add(halo);
const halo2 = new THREE.Mesh(
  new THREE.TorusGeometry(1.95, 0.004, 6, 200),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(D.theme.hero[2]).multiplyScalar(2), transparent: true, opacity: 0.7 })
);
blob.add(halo2);

/* =====================================================================
   PROJECT CARDS — procedural shader art, 3 "modes" (one per view)
   ===================================================================== */
const CW = 4.2, CH = 2.625;
const cardGeo = new THREE.PlaneGeometry(CW, CH, 48, 30);
const cardVS = /* glsl */ `
  uniform float uVel,uHover,uTime; uniform vec2 uMouse;
  varying vec2 vUv; varying float vDepth;
  void main(){
    vUv=uv; vec3 p=position;
    p.z += sin(uv.x*3.14159)*uVel*1.4 + sin(uv.y*3.14159)*uVel*0.5;
    float d=distance(uv,uMouse);
    p.z += uHover*0.35*smoothstep(0.45,0.0,d);
    p.z += sin(uv.x*12.0+uTime*3.0)*0.025*uHover;
    vec4 mv=modelViewMatrix*vec4(p,1.); vDepth=-mv.z;
    gl_Position=projectionMatrix*mv;
  }`;
const cardFS = /* glsl */ `
  uniform float uTime,uVel,uHover,uReveal,uMode,uSeed,uHasTex;
  uniform vec3 uC1,uC2,uC3; uniform sampler2D uTex; uniform vec2 uTexRatio; uniform vec2 uMouse;
  varying vec2 vUv; varying float vDepth;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+1.7;a*=.5;}return v;}

  vec3 art0(vec2 uv){ // liquid domain-warp
    float t=uTime*0.12; vec2 p=uv*vec2(3.2,2.0)+uSeed;
    vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
    vec2 r=vec2(fbm(p+3.5*q+vec2(1.7,9.2)+t*1.6),fbm(p+3.5*q+vec2(8.3,2.8)));
    float f=fbm(p+3.5*r);
    vec3 c=mix(uC1,uC2,clamp(f*f*2.2,0.,1.));
    c=mix(c,uC3,clamp(length(r)*f*1.1,0.,1.)*0.7);
    return c*(0.35+1.3*f);
  }
  vec3 art1(vec2 uv){ // retro horizon grid + sun
    vec3 c=mix(uC1*0.25,uC2*0.5,smoothstep(0.35,1.0,uv.y));
    vec2 sc=(uv-vec2(0.5,0.58))*vec2(1.6,1.0);
    float sun=smoothstep(0.235,0.225,length(sc));
    float cut=step(0.5,fract(uv.y*26.0-uTime*0.6))+smoothstep(0.52,0.58,uv.y);
    c=mix(c,mix(uC2,uC3,smoothstep(0.35,0.8,uv.y)),sun*clamp(cut,0.,1.));
    c+=uC3*smoothstep(0.35,0.0,length(sc))*0.25;
    if(uv.y<0.42){
      float h=0.42-uv.y; float z=0.12/h; float x=(uv.x-0.5)*z*3.0;
      float gz=abs(fract(z*1.5+uTime*0.9)-0.5); float gx=abs(fract(x)-0.5);
      float l=smoothstep(0.42,0.5,gz)+smoothstep(0.44,0.5,gx);
      c=mix(uC1*0.1,c,0.3)+uC3*l*smoothstep(0.0,0.12,h)*1.4;
    }
    return c;
  }
  vec3 art2(vec2 uv){ // hyper tunnel
    vec2 p=(uv-0.5)*vec2(1.6,1.0);
    float r=length(p); float a=atan(p.y,p.x);
    float tun=0.32/(r+0.03)+uTime*0.9;
    float rings=0.5+0.5*sin(tun*7.0);
    float sp=0.5+0.5*sin(a*9.0+tun*1.5+uTime);
    vec3 c=mix(uC1,uC2,rings)*(0.35+0.75*sp);
    c=mix(c,uC3,smoothstep(0.85,1.0,rings*sp)*0.9);
    c*=smoothstep(0.0,0.35,r)+0.08;
    return c;
  }
  // only evaluate the artwork styles that are actually visible (weights are 0 most of the time)
  vec3 artMix(vec2 uv,float w1,float w2,float w3){
    vec3 c=vec3(0.);
    if(w1>0.001) c+=art0(uv)*w1;
    if(w2>0.001) c+=art1(uv)*w2;
    if(w3>0.001) c+=art2(uv)*w3;
    return c;
  }
  void main(){
    vec2 uv=vUv;
    // dissolve + distance fade first, so hidden / far-away pixels skip all the expensive art
    float n=fbm(uv*vec2(7.0,4.4)+uSeed);
    float th=uReveal*1.3-0.15;
    float vis=smoothstep(th,th-0.04,n);
    float a=vis*smoothstep(130.0,18.0,vDepth);
    if(a<0.004) discard;
    float edge=smoothstep(th-0.14,th-0.03,n)*vis;

    float sh=0.003+abs(uVel)*0.05+uHover*0.004;
    float w1=max(0.,1.-abs(uMode)), w2=max(0.,1.-abs(uMode-1.)), w3=max(0.,1.-abs(uMode-2.));
    vec3 col;
    if(uHasTex>0.5){
      vec2 t=(uv-0.5)*uTexRatio*(1.0-uHover*0.06)+0.5+(uMouse-0.5)*0.03*uHover;
      col=vec3(texture2D(uTex,t+vec2(sh,0.)).r,texture2D(uTex,t).g,texture2D(uTex,t-vec2(sh,0.)).b);
      if(w2>0.001) col=mix(col,art1(uv),w2*0.85);
      if(w3>0.001) col=mix(col,art2(uv),w3*0.85);
    } else {
      col=artMix(uv,w1,w2,w3);
      // second (chromatic) sample only while moving / hovered
      if(sh>0.006) col.r=artMix(uv+vec2(sh,0.),w1,w2,w3).r;
    }
    // scanlines + glitch flicker
    col*=0.9+0.1*sin(uv.y*420.0+uTime*8.0);
    // vignette
    vec2 vv=uv*(1.0-uv.yx); col*=pow(vv.x*vv.y*16.0,0.18);
    // border glow
    vec2 bb=min(uv,1.0-uv); float bd=min(bb.x*1.6,bb.y);
    col+=uC3*smoothstep(0.01,0.0,bd)*2.0;
    col+=uC3*edge*3.0;
    gl_FragColor=vec4(col,a);
  }`;

const texLoader = new THREE.TextureLoader();
const cards = P.map((p, k) => {
  const u = {
    uTime: { value: 0 }, uVel: { value: 0 }, uHover: { value: 0 }, uReveal: { value: 0.3 },
    uMode: { value: 0 }, uSeed: { value: k * 7.31 + 1.7 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uC1: { value: new THREE.Color(p.colors[0]) }, uC2: { value: new THREE.Color(p.colors[1]) }, uC3: { value: new THREE.Color(p.colors[2]) },
    uTex: { value: null }, uHasTex: { value: 0 }, uTexRatio: { value: new THREE.Vector2(1, 1) }
  };
  if (p.image) {
    texLoader.load(p.image, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const ia = tex.image.width / tex.image.height, pa = CW / CH;
      u.uTexRatio.value.set(ia > pa ? pa / ia : 1, ia > pa ? 1 : ia / pa);
      u.uTex.value = tex; u.uHasTex.value = 1;
    });
  }
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: cardVS, fragmentShader: cardFS, transparent: true, side: THREE.DoubleSide });
  const g = new THREE.Group();
  g.position.z = stationZ(k + 1);
  const mesh = new THREE.Mesh(cardGeo, mat);
  g.add(mesh);
  const rc = new THREE.Color(p.colors[2]).multiplyScalar(2.4);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.012, 6, 240, Math.PI * 1.35), new THREE.MeshBasicMaterial({ color: rc, transparent: true, opacity: 0.9 }));
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.005, 6, 240), new THREE.MeshBasicMaterial({ color: rc, transparent: true, opacity: 0.35 }));
  ring1.position.z = -0.6; ring2.position.z = -1.1;
  g.add(ring1, ring2);
  scene.add(g);
  const c = { g, mesh, u, ring1, ring2, spin: 0, hover: 0 };
  slides[k + 1].card = c;
  return c;
});

/* =====================================================================
   SHARDS — wireframe debris vortex along the tunnel
   ===================================================================== */
const shardGroup = new THREE.Group();
{
  const SH = isTouch ? 150 : 280;
  const shards = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.3, 0),
    new THREE.MeshBasicMaterial({ color: 0x8c9bff, wireframe: true, transparent: true, opacity: 0.32 }), SH);
  const d = new THREE.Object3D();
  const zMin = stationZ(N - 1) - 60;
  for (let i = 0; i < SH; i++) {
    const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 20;
    d.position.set(Math.cos(a) * r, Math.sin(a) * r, 60 + Math.random() * (zMin - 60));
    d.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    d.scale.setScalar(0.4 + Math.random() * 1.8);
    d.updateMatrix();
    shards.setMatrixAt(i, d.matrix);
  }
  shards.frustumCulled = false;
  shardGroup.add(shards);
  scene.add(shardGroup);
}

/* =====================================================================
   POST — bloom + velocity chromatic aberration + grain
   ===================================================================== */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(PR);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.68, 0.5, 0.5);
composer.addPass(bloom);
const fx = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uAmt: { value: 0 }, uWarp: { value: 0 }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt,uWarp,uTime; varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec2 c=vUv-0.5; float r2=dot(c,c);
      vec2 uv=0.5+c*(1.0-uWarp*0.22*r2);
      vec2 dir=c*uAmt*(0.6+r2*3.0);
      vec3 col=vec3(texture2D(tDiffuse,uv+dir).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-dir).b);
      col*=1.0-r2*0.9;
      float gr=h(vUv*913.0+fract(uTime)*37.0)-0.5;
      col=max(col*(1.0+gr*0.14)+gr*0.0025,0.0);
      gl_FragColor=vec4(col,1.0);
    }`
});
composer.addPass(fx);
composer.addPass(new OutputPass());

/* =====================================================================
   LAYOUT (responsive 3D positions)
   ===================================================================== */
const L = {};
function layout() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  L.visH = 2 * CAM_DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  L.visW = L.visH * camera.aspect;
  L.mobile = w <= 820 || camera.aspect < 1;
  if (L.mobile) {
    L.cardS = Math.min((L.visW * 0.86) / CW, (L.visH * 0.3) / CH);
    L.cardX = 0; L.cardY = L.visH * 0.22; L.rotY = 0;
  } else {
    L.cardS = Math.min((L.visW * 0.42) / CW, (L.visH * 0.58) / CH);
    L.cardX = L.visW * 0.21; L.cardY = 0; L.rotY = -0.14;
  }
  cards.forEach((c) => { c.g.position.x = L.cardX; c.g.position.y = L.cardY; c.g.scale.setScalar(L.cardS); });
  if (!busy) {
    const t = blobTarget(current);
    blob.position.set(t.x, t.y, t.z);
    blobState.s = t.s;
  }
  fitAll();
  slides.forEach((s) => s.tabLine && placeTabLine(s));
  cacheRects();
}

// shrink giant headings so long names / words never spill off screen
function fitText(el) {
  el.style.fontSize = '';
  const base = parseFloat(getComputedStyle(el).fontSize);
  let ratio = 1;
  const lines = $$('.ln', el);
  if (lines.length) lines.forEach((l) => { ratio = Math.min(ratio, l.clientWidth / Math.max(1, l.scrollWidth)); });
  else $$('.word', el).forEach((w) => { ratio = Math.min(ratio, el.clientWidth / Math.max(1, w.offsetWidth)); });
  if (ratio < 1) el.style.fontSize = base * ratio * 0.97 + 'px';
}
function fitAll() { $$('.hero-title, .p-title, .c-title').forEach(fitText); }
const refit = () => { fitAll(); cacheRects(); };
if (document.fonts) {
  document.fonts.ready.then(refit);
  document.fonts.addEventListener('loadingdone', refit);
  document.fonts.load('800 100px Syne').then(refit).catch(() => {});
}

function blobTarget(i) {
  const s = slides[i], z = stationZ(i), m = L.mobile;
  if (s.type === 'hero') return { x: 0, y: m ? 0.4 : 0, z: z - 1, s: m ? 1.25 : 2.1 };
  if (s.type === 'project') return { x: L.cardX + (m ? 0 : L.visW * 0.07), y: L.cardY + (m ? 0.8 : 0), z: z - 8, s: m ? 1.05 : 2.3 };
  if (s.type === 'about') return { x: m ? 0 : -L.visW * 0.26, y: m ? L.visH * 0.26 : 0.2, z: z - 2, s: m ? 0.95 : 1.7 };
  return { x: 0, y: 0, z: z - 4, s: m ? 1.5 : 2.6 };
}

/* =====================================================================
   TEXT FX
   ===================================================================== */
const GLYPHS = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el, text, dur = 0.9) {
  if (el._scr) el._scr.kill();
  const o = { p: 0 };
  el._scr = gsap.to(o, {
    p: 1, duration: dur, ease: 'power1.out',
    onUpdate() {
      const n = Math.floor(o.p * text.length);
      let s = text.slice(0, n);
      for (let i = n; i < text.length; i++) s += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = s;
    }
  });
}

function placeTabLine(s) {
  const b = s.tabs[s.view];
  s.tabLine.style.width = b.offsetWidth + 'px';
  s.tabLine.style.transform = `translateX(${b.offsetLeft}px)`;
  s.tabs.forEach((t, i) => t.classList.toggle('on', i === s.view));
}

function cacheRects() {
  slides.forEach((s) => {
    if (!s.react) return;
    s.rects = s.react.map((ch) => {
      const r = ch.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  });
}

/* =====================================================================
   SLIDE ENTER / LEAVE
   ===================================================================== */
function enterSlide(s) {
  if (s.leaveTl) s.leaveTl.kill();
  gsap.killTweensOf([...s.chars, ...s.words, ...s.fades, ...s.scr]);
  gsap.set(s.el, { autoAlpha: 1 });
  if (s.type === 'project') {
    s.view = 0;
    s.views.forEach((v, i) => gsap.set(v, { autoAlpha: i ? 0 : 1, x: 0 }));
    placeTabLine(s);
  }
  const tl = gsap.timeline();
  tl.fromTo(s.chars, { yPercent: 120, rotate: 6, y: 0, scaleY: 1 },
    { yPercent: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: 0.028 }, 0);
  tl.fromTo(s.words, { yPercent: 110, opacity: 0, y: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.014 }, 0.12);
  tl.fromTo(s.fades, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.07 }, 0.25);
  s.scr.forEach((e, i) => {
    gsap.set(e, { opacity: 1, y: 0 });
    tl.call(() => scramble(e, e.dataset.text), null, 0.05 + i * 0.08);
  });
  if (s === about) {
    $$('[data-count]', s.el).forEach((b) => {
      const o = { v: 0 }, target = +b.dataset.count, suf = b.dataset.suffix;
      tl.to(o, { v: target, duration: 1.8, ease: 'expo.out', onUpdate: () => (b.textContent = Math.round(o.v) + suf) }, 0.3);
    });
  }
  if (s.react) {
    s.react.forEach((c) => (c._f = 0));
    tl.call(cacheRects, null, 1.3);
  }
  return tl;
}

function leaveSlide(s) {
  const tl = gsap.timeline({ onComplete: () => gsap.set(s.el, { autoAlpha: 0 }) });
  tl.to(s.chars, { yPercent: -120, rotate: -4, y: 0, scaleY: 1, duration: 0.6, ease: 'expo.in', stagger: 0.012 }, 0);
  tl.to([...s.words], { yPercent: -110, duration: 0.5, ease: 'expo.in', stagger: 0.004 }, 0);
  tl.to([...s.fades, ...s.scr], { opacity: 0, y: -24, duration: 0.45, ease: 'power2.in', stagger: 0.02 }, 0);
  s.leaveTl = tl;
  return tl;
}

/* =====================================================================
   NAVIGATION — warp between stations
   ===================================================================== */
let current = 0, busy = true, lastNav = 0, lastView = 0, overlayOpen = false;
const accent = (i) => slides[i].colors[1];

function go(i) {
  i = clamp(i, 0, N - 1);
  if (i === current || busy || overlayOpen) return;
  const from = slides[current], to = slides[i];
  const dist = Math.abs(i - current);
  const dur = Math.min(1.6 + (dist - 1) * 0.28, 2.8);
  busy = true;
  lastNav = performance.now();
  leaveSlide(from);
  current = i;
  flyTo(i, dur);
  whoosh(dur);
  updateHUD();
  gsap.delayedCall(dur * 0.58, () => enterSlide(to));
  gsap.delayedCall(dur * 0.78, () => (busy = false));
}

function flyTo(i, dur) {
  gsap.to(cam, { z: stationZ(i) + CAM_DIST, duration: dur, ease: 'expo.inOut' });
  const t = blobTarget(i);
  gsap.to(blob.position, { x: t.x, y: t.y, z: t.z, duration: dur, ease: 'expo.inOut' });
  gsap.to(blobState, { s: t.s, duration: dur, ease: 'expo.inOut' });
  const cols = slides[i].colors;
  ['uA', 'uB', 'uC'].forEach((k, j) => {
    const c = new THREE.Color(cols[j]);
    gsap.to(blobU[k].value, { r: c.r, g: c.g, b: c.b, duration: dur, ease: 'power2.inOut' });
  });
  const hc = new THREE.Color(cols[2]).multiplyScalar(2);
  gsap.to(halo2.material.color, { r: hc.r, g: hc.g, b: hc.b, duration: dur });
  const sc = new THREE.Color(cols[1]).lerp(new THREE.Color('#ffffff'), 0.55);
  gsap.to(starU.uColor.value, { r: sc.r, g: sc.g, b: sc.b, duration: dur });
  cards.forEach((c, k) => {
    const active = k + 1 === i;
    gsap.to(c.u.uReveal, { value: active ? 1 : 0.3, duration: active ? 1.6 : 0.9, delay: active ? dur * 0.35 : 0, ease: 'power2.inOut', overwrite: true });
    if (active) { c.u.uMode.value = 0; c.spin = 0; }
  });
  gsap.to(document.documentElement, { '--accent': accent(i), duration: dur * 0.8, ease: 'power2.inOut' });
}

function setView(s, v, dir) {
  if (busy || v === s.view) return;
  lastView = performance.now();
  const old = s.views[s.view], nw = s.views[v];
  gsap.to(old, { x: -dir * 50, autoAlpha: 0, duration: 0.4, ease: 'power3.in' });
  gsap.fromTo(nw, { x: dir * 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.9, delay: 0.28, ease: 'expo.out' });
  gsap.fromTo(nw.querySelectorAll('li, .btn, p'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.32, stagger: 0.05, ease: 'expo.out' });
  s.view = v;
  placeTabLine(s);
  const c = s.card;
  gsap.to(c, { spin: c.spin + dir * Math.PI * 2, duration: 1.3, ease: 'expo.inOut' });
  gsap.to(c.u.uMode, { value: v, duration: 1.1, ease: 'power2.inOut' });
  gsap.fromTo(kick, { v: 0.9 }, { v: 0, duration: 1.2, ease: 'power3.out' });
  blip(dir);
}
const kick = { v: 0 };

function viewStep(dir) {
  if (busy || overlayOpen) return;
  const s = slides[current];
  if (s.type !== 'project') return go(current + dir);
  setView(s, (s.view + dir + 3) % 3, dir);
}

function updateHUD() {
  ticks.forEach((t, i) => t.classList.toggle('on', i === current));
  const s = slides[current];
  $('#cnt-cur').textContent = pad(current);
  scramble($('#cnt-name'), s.name.toUpperCase(), 0.7);
  $('#hint').textContent = s.type === 'project'
    ? (isTouch ? '↕ Swipe projects · ↔ Explore' : '↕ Scroll projects · ↔ Drag to explore')
    : (isTouch ? '↕ Swipe to travel' : '↕ Scroll / Swipe to travel');
  $$('nav [data-go]').forEach((b) => {
    const g = resolveGo(b.dataset.go);
    b.classList.toggle('on', g === 1 ? s.type === 'project' : g === current);
  });
}

/* =====================================================================
   INDEX OVERLAY
   ===================================================================== */
const ix = $('#index');
function openIndex() {
  if (overlayOpen || busy) return;
  overlayOpen = true;
  gsap.set(ix, { visibility: 'visible' });
  gsap.fromTo(ix, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'expo.inOut' });
  gsap.fromTo('.ix-row', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.06, delay: 0.4, ease: 'expo.out' });
  whoosh(0.9);
}
function closeIndex(then) {
  if (!overlayOpen) return;
  gsap.to(ix, {
    clipPath: 'inset(100% 0 0% 0)', duration: 0.9, ease: 'expo.inOut',
    onComplete: () => { gsap.set(ix, { visibility: 'hidden' }); overlayOpen = false; then && then(); }
  });
}
$('#ix-open').addEventListener('click', openIndex);
$('.ix-close').addEventListener('click', () => closeIndex());

/* =====================================================================
   INPUT — wheel, drag/swipe, keys, clicks
   ===================================================================== */
const mouse = { x: 0, y: 0, sx: 0, sy: 0, px: innerWidth / 2, py: innerHeight / 2, cx: innerWidth / 2, cy: innerHeight / 2 };
const drag = { x: 0, y: 0 };
let down = null;

document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]');
  if (!g) return;
  const i = resolveGo(g.dataset.go);
  if (overlayOpen) closeIndex(() => go(i));
  else go(i);
});

let wheelAcc = 0, wheelLast = 0;
addEventListener('wheel', (e) => {
  if (overlayOpen) return;
  const now = performance.now();
  if (now - wheelLast > 220) wheelAcc = 0;
  wheelLast = now;
  if (busy || now - lastNav < 1150 || now - lastView < 750) { wheelAcc = 0; return; }
  const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
  wheelAcc += horiz ? e.deltaX : e.deltaY;
  if (Math.abs(wheelAcc) > 35) {
    const dir = Math.sign(wheelAcc);
    wheelAcc = 0;
    horiz ? viewStep(dir) : go(current + dir);
  }
}, { passive: true });

addEventListener('pointerdown', (e) => {
  $('#cursor').classList.add('down');
  if (overlayOpen || e.target.closest('a, button')) return;
  down = { x: e.clientX, y: e.clientY };
});
addEventListener('pointermove', (e) => {
  mouse.px = e.clientX; mouse.py = e.clientY;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  if (down) { drag.x = e.clientX - down.x; drag.y = e.clientY - down.y; }
});
function endDrag(e) {
  $('#cursor').classList.remove('down');
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  down = null;
  gsap.to(drag, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.45)' });
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.max(ax, ay) < 8) { if (hoverCard) viewStep(1); return; }
  if (ax > ay && ax > 45) viewStep(dx < 0 ? 1 : -1);
  else if (ay > 45) go(current + (dy < 0 ? 1 : -1));
}
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', () => { down = null; gsap.to(drag, { x: 0, y: 0, duration: 0.6 }); });

addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return closeIndex();
  if (overlayOpen) return;
  const k = e.key;
  if (['ArrowDown', 'PageDown', ' '].includes(k)) { e.preventDefault(); go(current + 1); }
  else if (['ArrowUp', 'PageUp'].includes(k)) { e.preventDefault(); go(current - 1); }
  else if (k === 'ArrowRight') viewStep(1);
  else if (k === 'ArrowLeft') viewStep(-1);
  else if (k === 'Home') go(0);
  else if (k === 'End') go(N - 1);
  else if (k.toLowerCase() === 'i') openIndex();
});

// cursor labels + magnetic
let domLabel = '';
document.addEventListener('pointerover', (e) => { const t = e.target.closest('[data-cursor]'); domLabel = t ? t.dataset.cursor : ''; });
$$('.magnetic').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.45, duration: 0.5, ease: 'power3.out' });
  });
  el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' }));
});

/* =====================================================================
   SOUND — synthesized whooshes (off by default)
   ===================================================================== */
let actx = null, soundOn = false;
$('#sound').addEventListener('click', () => {
  soundOn = !soundOn;
  $('#sound i').textContent = soundOn ? 'on' : 'off';
  if (soundOn) { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); blip(1); }
});
function whoosh(dur = 1.4) {
  if (!soundOn || !actx) return;
  const t = actx.currentTime, len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource(); src.buffer = buf;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(180, t);
  f.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.5);
  f.frequency.exponentialRampToValueAtTime(140, t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.32, t + dur * 0.48);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(actx.destination);
  src.start(t);
}
function blip(dir = 1) {
  if (!soundOn || !actx) return;
  const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(dir > 0 ? 520 : 780, t);
  o.frequency.exponentialRampToValueAtTime(dir > 0 ? 1040 : 390, t + 0.18);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(actx.destination);
  o.start(t); o.stop(t + 0.32);
}

/* =====================================================================
   RENDER LOOP
   ===================================================================== */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const clock = new THREE.Clock();
let vel = 0, prevZ = cam.z, hoverCard = null;
const cursorEl = $('#cursor'), labelEl = $('#cursor-label');

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // velocity from camera travel
  const dz = (prevZ - cam.z) / Math.max(dt, 1e-4);
  prevZ = cam.z;
  const tv = Math.min(Math.abs(dz) / 45, 1.6);
  vel += (tv - vel) * Math.min(1, dt * 9);
  const v = reduceMotion ? vel * 0.3 : vel;

  // mouse smoothing
  mouse.sx += (mouse.x - mouse.sx) * 0.05;
  mouse.sy += (mouse.y - mouse.sy) * 0.05;

  // camera
  const pull = drag.y * 0.006;
  camera.position.set(mouse.sx * 0.55, mouse.sy * 0.35, cam.z + pull);
  camera.lookAt(mouse.sx * 0.12, mouse.sy * 0.08, cam.z - CAM_DIST);
  camera.rotateZ(Math.sin(t * 0.3) * 0.01 + v * 0.06 * Math.sin(t * 1.3) + drag.x * 0.00008);
  camera.fov = FOV + v * 32 + kick.v * 4;
  camera.updateProjectionMatrix();

  // stars
  starU.uCamZ.value = cam.z;
  starU.uSpeed.value = v + Math.abs(drag.y) * 0.002;
  starU.uTime.value = t;

  // blob
  blobU.uTime.value = t;
  blobU.uAmp.value = 0.22 + v * 0.3 + kick.v * 0.15;
  blob.scale.setScalar(blobState.s * (1 + v * 0.12 + Math.sin(t * 1.1) * 0.015));
  blob.rotation.y = t * 0.12 + mouse.sx * 0.4;
  blob.rotation.x = mouse.sy * 0.25;
  halo.rotation.y = -t * 0.08; halo.rotation.z = t * 0.05;
  halo2.rotation.x = 1.2 + Math.sin(t * 0.5) * 0.2; halo2.rotation.y = t * 0.4;

  // raycast active card
  const s = slides[current];
  hoverCard = null;
  if (s.type === 'project' && !isTouch && !busy && !overlayOpen) {
    ndc.set(mouse.x, mouse.y);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(s.card.mesh)[0];
    if (hit) { hoverCard = s.card; s.card.u.uMouse.value.lerp(hit.uv, 0.2); }
  }

  // cards
  cards.forEach((c, k) => {
    const active = s.card === c;
    // skip cards that are too far away to see
    c.g.visible = Math.abs(c.g.position.z - cam.z) < 135;
    if (!c.g.visible) return;
    c.u.uTime.value = t;
    c.u.uVel.value = v * 0.55 + kick.v * 0.25;
    c.hover += ((hoverCard === c ? 1 : 0) - c.hover) * 0.08;
    c.u.uHover.value = c.hover;
    c.mesh.rotation.y = c.spin + L.rotY + (active ? mouse.sx * 0.22 + drag.x * 0.003 : 0);
    c.mesh.rotation.x = active ? -mouse.sy * 0.14 : 0;
    c.mesh.position.y = Math.sin(t * 0.8 + k) * 0.06;
    c.ring1.rotation.z = t * 0.3 + k + kick.v * 2;
    c.ring2.rotation.x = Math.sin(t * 0.4 + k) * 0.35;
    c.ring2.rotation.y = Math.cos(t * 0.3 + k) * 0.35;
  });

  shardGroup.rotation.z += dt * (0.025 + v * 0.7);

  // post
  fx.uniforms.uAmt.value = 0.004 + v * 0.06 + kick.v * 0.02;
  fx.uniforms.uWarp.value = v;
  fx.uniforms.uTime.value = t;

  // cursor
  mouse.cx += (mouse.px - mouse.cx) * 0.18;
  mouse.cy += (mouse.py - mouse.cy) * 0.18;
  cursorEl.style.transform = `translate(${mouse.cx}px, ${mouse.cy}px)`;
  const label = domLabel || (hoverCard ? 'DRAG ↔' : '');
  cursorEl.classList.toggle('big', !!label);
  labelEl.classList.toggle('on', !!label);
  if (label && labelEl.textContent !== label) labelEl.textContent = label;
  labelEl.style.transform = `translate(${mouse.cx}px, ${mouse.cy}px) translate(-50%, -50%)`;

  // reactive giant letters
  if (s.react && s.rects && !busy && !isTouch) {
    const R = innerWidth * 0.16;
    s.react.forEach((ch, i) => {
      const r = s.rects[i];
      const f = Math.max(0, 1 - Math.hypot(mouse.px - r.x, mouse.py - r.y) / R);
      const nf = ch._f + (f - ch._f) * 0.12;
      if (Math.abs(nf - ch._f) < 0.002 && f === 0) { if (ch._f !== 0 && nf < 0.004) { ch._f = 0; ch.style.setProperty('--f', '0'); gsap.set(ch, { scaleY: 1, y: 0 }); } return; }
      ch._f = nf;
      ch.style.setProperty('--f', nf.toFixed(3));
      gsap.set(ch, { scaleY: 1 + nf * 0.32, y: -nf * 22 });
    });
  }

  composer.render();
}

/* =====================================================================
   BOOT
   ===================================================================== */
let resizeT;
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(layout, 120); });
function applyQuality(i) {
  qIndex = i;
  const q = QUALITY[i];
  renderer.setPixelRatio(q.pr);
  composer.setPixelRatio(q.pr);
  starU.uPR.value = q.pr;
  bloom.enabled = q.bloom;
  if (blob.userData.detail !== q.detail) {
    blob.geometry.dispose();
    blob.geometry = makeBlobGeo(q.detail);
    blob.userData.detail = q.detail;
  }
  $('#quality i').textContent = q.name;
  try { localStorage.setItem('pf-quality', String(i)); } catch (e) { /* ignore */ }
  layout();
}
$('#quality').addEventListener('click', () => {
  applyQuality((qIndex + 1) % QUALITY.length);
  blip(1);
});

layout();
applyQuality(qIndex);
renderer.setAnimationLoop(tick);
setInterval(() => {
  $('#clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Local';
}, 1000);
$('#clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Local';
document.documentElement.style.setProperty('--accent', accent(0));
updateHUD();

// precompile shaders while loader runs
renderer.compile(scene, camera);

const ld = { v: 0 };
const statuses = ['Compiling shaders', 'Spawning stars', 'Bending spacetime', 'Ready'];
gsap.to(ld, {
  v: 100, duration: 2.6, ease: 'power3.inOut',
  onUpdate() {
    $('#ld-num').textContent = String(Math.round(ld.v)).padStart(3, '0');
    $('#ld-bar').style.transform = `scaleX(${ld.v / 100})`;
    $('#ld-status').textContent = statuses[Math.min(3, Math.floor(ld.v / 26))];
  },
  onComplete: launch
});

function launch() {
  fitAll();
  gsap.to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'expo.inOut', onComplete: () => $('#loader').remove() });
  gsap.fromTo(cam, { z: 220 }, { z: stationZ(0) + CAM_DIST, duration: 3, ease: 'expo.out', delay: 0.15 });
  whoosh(2.6);
  gsap.delayedCall(1.0, () => {
    enterSlide(hero);
    gsap.to('.hud', { opacity: 1, duration: 1.2, stagger: 0.1, ease: 'power2.out' });
  });
  gsap.delayedCall(2.1, () => (busy = false));
}
