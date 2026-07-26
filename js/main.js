/* =====================================================================
   Study by the Bay — Zhiqin (Brian) Yang
   A first-person seaside study over Clear Water Bay. No walking:
   click a glowing marker (or a framed paper) and the camera glides there.
   Plain Three.js (CDN). Content comes from js/data.js.
   ===================================================================== */
import * as THREE from 'three';

const { PROFILE, TOPICS, PAPERS, NEWS } = window.SITE;
/* icon + one-line blurb per topic, for the glanceable overview tiles */
const TOPIC_META = {
  reasoning:{ icon:'🧠', blurb:'DPO vs RLHF, reasoning-data selection for RL' },
  agents:   { icon:'🤖', blurb:'Human-symbiotic agents & on-the-fly memory' },
  collab:   { icon:'🤝', blurb:'Collaborative learning under heterogeneity & noise' },
  others:   { icon:'🔬', blurb:'Vision, video generation, graphs & security' },
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => matchMedia('(max-width: 760px)').matches;

/* ---------- dom ---------- */
const canvas   = document.getElementById('scene');
const loader   = document.getElementById('loader');
const loadFill = document.getElementById('loader-fill');
const hotspotLayer = document.getElementById('hotspots');
const tooltip  = document.getElementById('tooltip');
const panel    = document.getElementById('panel');
const panelIcon= document.getElementById('panel-icon');
const panelTitle=document.getElementById('panel-title');
const scrim    = document.getElementById('scrim');
const hint     = document.getElementById('hud-hint');
const nav      = document.getElementById('hud-nav');
const modeBtn  = document.getElementById('mode-toggle');
const fpStart  = document.getElementById('fp-start');
const fpStartLabel = document.getElementById('fp-start-label');

/* ---------- webgl guard ---------- */
function webglOK(){ try{ const c=document.createElement('canvas'); return !!(c.getContext('webgl2')||c.getContext('webgl')); }catch(e){ return false; } }
if(!webglOK()){ document.body.classList.add('flat'); loader.classList.add('done'); }

/* ---------- helpers ---------- */
function mat(color,o={}){ return new THREE.MeshStandardMaterial({ color, roughness:o.rough??0.85, metalness:o.metal??0, emissive:o.emissive??0x000000, emissiveIntensity:o.emissiveIntensity??1, ...(o.map?{map:o.map}:{}) }); }
function box(w,h,d,color,o){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,o)); }
function cyl(rt,rb,h,color,seg=24,o){ return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat(color,o)); }
function sph(r,color,o,seg=20){ return new THREE.Mesh(new THREE.SphereGeometry(r,seg,seg),mat(color,o)); }
function shadowed(o){ o.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } }); return o; }
function canvasTexture(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; }
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function wrapText(g,text,x,y,maxW,lh,maxLines){ const words=text.split(' '); let line='',n=0; for(let i=0;i<words.length;i++){ const t=line+words[i]+' '; if(g.measureText(t).width>maxW && line){ g.fillText(line,x,y); line=words[i]+' '; y+=lh; if(++n>=maxLines-1){ g.fillText(line.trim().replace(/.$/,'…'),x,y); return; } } else line=t; } g.fillText(line,x,y); }

const ROOM = { X:8, Z:8, H:8 };
const EYE = 3.2;

/* ---------- textures ---------- */
const skyTex = canvasTexture(64,512,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#59a6d6'); gr.addColorStop(.5,'#7ec8e3'); gr.addColorStop(.72,'#bfe4f0'); gr.addColorStop(.74,'#2f88b8'); gr.addColorStop(1,'#0d4d73'); g.fillStyle=gr; g.fillRect(0,0,w,h); });

const floorTex = canvasTexture(512,512,(g,w,h)=>{ g.fillStyle='#c79a68'; g.fillRect(0,0,w,h); g.strokeStyle='rgba(90,60,35,.35)'; g.lineWidth=3; const s=w/6; for(let i=0;i<=6;i++){ g.beginPath(); g.moveTo(0,i*s); g.lineTo(w,i*s); g.stroke(); } for(let i=0;i<=6;i++){ g.beginPath(); g.moveTo(i*s+((Math.floor(i)%2)?s/2:0),0); g.lineTo(i*s,h); } g.fillStyle='rgba(255,255,255,.05)'; for(let i=0;i<400;i++){ g.fillRect(Math.random()*w,Math.random()*h,2,1); } });
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping; floorTex.repeat.set(4,4);

/* animated sea shimmer */
const seaCanvas=document.createElement('canvas'); seaCanvas.width=256; seaCanvas.height=256;
const seaCtx=seaCanvas.getContext('2d');
function drawSea(t){ const g=seaCtx,w=256,h=256; const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#2f88b8'); gr.addColorStop(1,'#0d4d73'); g.fillStyle=gr; g.fillRect(0,0,w,h); g.strokeStyle='rgba(255,255,255,.28)'; g.lineWidth=2; for(let y=20;y<h;y+=22){ g.beginPath(); for(let x=0;x<=w;x+=8){ const yy=y+Math.sin((x*0.05)+(t*0.002)+(y*0.3))*3; if(x===0)g.moveTo(x,yy); else g.lineTo(x,yy); } g.stroke(); } }
drawSea(0);
const seaTex=new THREE.CanvasTexture(seaCanvas); seaTex.colorSpace=THREE.SRGBColorSpace; seaTex.wrapS=seaTex.wrapT=THREE.RepeatWrapping; seaTex.repeat.set(10,10);

/* ---------- renderer / scene / camera ---------- */
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const MAX_ANISO=renderer.capabilities.getMaxAnisotropy();   // sharpen textures at grazing angles

const scene=new THREE.Scene();
scene.background=skyTex;
scene.fog=new THREE.Fog(0xbfe4f0,26,95);

const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,0.1,200);

/* manual look (yaw/pitch around current position) */
let yaw=0, pitch=0;
function applyLook(){ const dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)); camera.lookAt(camera.position.clone().add(dir)); }
function lookFrom(pos,tgt){ const d=new THREE.Vector3().subVectors(new THREE.Vector3(...tgt),new THREE.Vector3(...pos)).normalize(); yaw=Math.atan2(d.x,-d.z); pitch=Math.asin(THREE.MathUtils.clamp(d.y,-1,1)); }

/* ---------- lights (bright daytime) ---------- */
scene.add(new THREE.AmbientLight(0xffffff,0.5));
scene.add(new THREE.HemisphereLight(0xbfe4f0,0xc79a68,1.0));
const sun=new THREE.DirectionalLight(0xfff4e2,2.0);
sun.position.set(-4,12,-16); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-14; sun.shadow.camera.right=14; sun.shadow.camera.top=14; sun.shadow.camera.bottom=-8;
sun.shadow.camera.near=1; sun.shadow.camera.far=60; sun.shadow.bias=-0.0006;
sun.target.position.set(0,2,0); scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight(0xd7ecf7,0.5); fill.position.set(6,6,10); scene.add(fill);

/* ---------- room ---------- */
const room=new THREE.Group(); scene.add(room);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(ROOM.X*2,ROOM.Z*2),mat(0xffffff,{map:floorTex,rough:.9}));
floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; room.add(floor);
const ceil=new THREE.Mesh(new THREE.PlaneGeometry(ROOM.X*2,ROOM.Z*2),mat(0xf3ede2,{rough:1}));
ceil.rotation.x=Math.PI/2; ceil.position.y=ROOM.H; room.add(ceil);

const WALLC=0xeae0d0, WOOD=0xb98a55, WOOD_D=0x8a5a36;
function wall(w,h,x,y,z,ry){ const m=box(w,h,0.3,WALLC,{rough:.96}); m.position.set(x,y,z); m.rotation.y=ry||0; m.receiveShadow=true; room.add(m); return m; }
/* south (papers), east (papers), west (news) solid; north = window frame */
wall(ROOM.X*2,ROOM.H,0,ROOM.H/2, ROOM.Z);            // south  Z=+8
wall(ROOM.Z*2,ROOM.H,ROOM.X,ROOM.H/2,0,Math.PI/2);   // east   X=+8
wall(ROOM.Z*2,ROOM.H,-ROOM.X,ROOM.H/2,0,Math.PI/2);  // west   X=-8
/* north wall Z=-8: solid side panels + lintel, with a floor-to-6.5 DOORWAY x[-5,5] to walk outside */
(function northWall(){ const z=-ROOM.Z,c=WALLC;
  const parts=[[3,8,-6.5,4],[3,8,6.5,4],[10,1.6,0,7.2]];   // left panel, right panel, lintel over door
  parts.forEach(([w,hh,x,y])=>{ const m=box(w,hh,0.3,c,{rough:.96}); m.position.set(x,y,z); m.receiveShadow=true; room.add(m); });
  const jc=0x6d5843;
  for(const x of [-5,5]){ const j=box(0.16,6.6,0.2,jc); j.position.set(x,3.3,z+0.16); room.add(j); }
  const thr=box(10,0.08,0.6,0xb9a07f); thr.position.set(0,0.04,z+0.1); room.add(thr);   // threshold
})();

/* ---------- outdoor world: terrace → basketball court → HKUST buildings → sea ---------- */
function facadeTex(base){ return canvasTexture(256,256,(g,w,h)=>{ g.fillStyle=base; g.fillRect(0,0,w,h); g.fillStyle='rgba(200,230,245,.72)'; for(let y=18;y<h-12;y+=34){ for(let x=16;x<w-14;x+=30){ g.fillRect(x,y,20,22); } } }); }
const courtTex=canvasTexture(512,720,(g,w,h)=>{ g.fillStyle='#c46b3d'; g.fillRect(0,0,w,h); g.strokeStyle='#f4ede2'; g.lineWidth=7; g.strokeRect(24,24,w-48,h-48); g.beginPath(); g.arc(w/2,h/2,70,0,7); g.stroke(); g.beginPath(); g.moveTo(24,h/2); g.lineTo(w-24,h/2); g.stroke(); g.strokeRect(w/2-80,24,160,150); g.strokeRect(w/2-80,h-174,160,150); });
const hkustSignTex=canvasTexture(512,160,(g,w,h)=>{ g.clearRect(0,0,w,h); g.font='700 104px Sora, Arial'; g.textAlign='center'; g.textBaseline='middle'; g.shadowColor='#e2483d'; g.shadowBlur=26; g.fillStyle='#ffffff'; g.fillText('HKUST',w/2,h/2); g.shadowBlur=6; g.fillText('HKUST',w/2,h/2); });
(function outdoor(){ const g=new THREE.Group();
  // campus ground covers everything up to the seaside railing (so nothing floats over water)
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(38,24),mat(0xc8bfa8,{rough:1})); ground.rotation.x=-Math.PI/2; ground.position.set(0,-0.04,-19); ground.receiveShadow=true; g.add(ground);
  const deck=new THREE.Mesh(new THREE.PlaneGeometry(30,11),mat(0xcbb79a,{rough:1})); deck.rotation.x=-Math.PI/2; deck.position.set(0,-0.01,-13.5); deck.receiveShadow=true; g.add(deck);
  const court=new THREE.Mesh(new THREE.PlaneGeometry(11,16),new THREE.MeshStandardMaterial({map:courtTex,roughness:.85})); court.rotation.x=-Math.PI/2; court.position.set(0,0.02,-17.5); g.add(court);
  const boardTex=canvasTexture(256,160,(x,w,h)=>{ x.fillStyle='#f7f7f4'; x.fillRect(0,0,w,h); x.strokeStyle='#003366'; x.lineWidth=7; x.strokeRect(8,8,w-16,h-16); x.strokeStyle='#e2483d'; x.lineWidth=5; x.strokeRect(w/2-36,h-64,72,50); x.fillStyle='#003366'; x.font='700 38px Sora, Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('HKUST',w/2,42); });
  function hoop(z,face){ const h=new THREE.Group();     // face = direction the rim points (toward court centre)
    const pole=cyl(0.12,0.12,3.6,0x3a3f45); pole.position.set(0,1.8,-face*0.55); h.add(pole);
    const arm=box(0.12,0.12,0.75,0x3a3f45); arm.position.set(0,3.55,-face*0.22); h.add(arm);
    const board=box(1.9,1.15,0.08,0xf7f7f4); board.position.set(0,3.7,face*0.12); h.add(board);
    const bf=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.15),new THREE.MeshBasicMaterial({map:boardTex,toneMapped:false}));
    bf.position.set(0,3.7,face*0.17); if(face<0) bf.rotation.y=Math.PI;   // face the court, so HKUST reads correctly on both boards
    h.add(bf);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(0.36,0.055,12,28),mat(0xe2483d,{metal:.6,rough:.3})); rim.rotation.x=Math.PI/2; rim.position.set(0,3.2,face*0.6); h.add(rim);
    const net=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.16,0.45,14,1,true),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,side:THREE.DoubleSide,wireframe:true})); net.position.set(0,2.95,face*0.6); h.add(net);
    h.position.set(0,0,z); return shadowed(h); }
  g.add(hoop(-9.5,-1)); g.add(hoop(-25.5,1));   // full-court: both rims face each other
  function building(x,z,ww,hh,dd,base){ const b=new THREE.Group(); const body=box(ww,hh,dd,base,{rough:.9}); body.position.y=hh/2; b.add(body); const fac=new THREE.Mesh(new THREE.PlaneGeometry(ww*0.92,hh*0.9),new THREE.MeshStandardMaterial({map:facadeTex(base)})); fac.position.set(0,hh/2,dd/2+0.06); b.add(fac); b.position.set(x,0,z); return shadowed(b); }
  g.add(building(-12.5,-17,7,11,7,0x2f6ca0)); g.add(building(12.5,-17,7,13,7,0x265f92)); g.add(building(-13,-25.5,8,15,7,0x347bb2)); g.add(building(12.5,-25.5,8,16,7,0x2a6699));
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(5,1.5),new THREE.MeshBasicMaterial({map:hkustSignTex,transparent:true,toneMapped:false})); sign.position.set(-12.5,9,-13.4); g.add(sign);
  // seaside railing
  for(let x=-11;x<=11;x+=1.8){ const post=box(0.08,1.1,0.08,0xece3d5); post.position.set(x,0.55,-31); g.add(post); }
  const rail=box(23.5,0.1,0.12,0xece3d5); rail.position.set(0,1.1,-31); g.add(rail);
  // sea + sun
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(260,180),new THREE.MeshStandardMaterial({map:seaTex,roughness:.5,metalness:.1})); sea.rotation.x=-Math.PI/2; sea.position.set(0,-1.6,-75); g.add(sea);
  const sunDisc=new THREE.Mesh(new THREE.CircleGeometry(4.5,32),new THREE.MeshBasicMaterial({color:0xfff2c4,fog:false,toneMapped:false})); sunDisc.position.set(-11,11,-95); g.add(sunDisc);
  // sailboat + gulls
  const boat=new THREE.Group(); const hull=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.9,3,12,1,false,0,Math.PI),mat(0x8a3b2f)); hull.rotation.z=Math.PI/2; hull.rotation.y=Math.PI/2; hull.position.y=0.2; boat.add(hull); const mast=cyl(0.05,0.05,3,0xead9be); mast.position.y=1.6; boat.add(mast); const sail=new THREE.Mesh(new THREE.PlaneGeometry(1.8,2.4),new THREE.MeshStandardMaterial({color:0xfdfaf3,side:THREE.DoubleSide,roughness:.9})); sail.position.set(0.5,1.9,0); boat.add(sail); boat.position.set(14,-1,-52); boat.scale.setScalar(2.2); g.add(boat); g.userData.boat=boat;
  const gulls=new THREE.Group(); for(let i=0;i<6;i++){ const gg=new THREE.Group(); const a=box(0.5,0.04,0.14,0x33404a); a.rotation.z=0.5; const b2=box(0.5,0.04,0.14,0x33404a); b2.rotation.z=-0.5; a.position.x=-0.22; b2.position.x=0.22; gg.add(a,b2); gg.position.set(-16+i*6,10+(i%2)*1.5,-46-i*4); gg.userData.ph=i; gulls.add(gg); } g.userData.gulls=gulls; g.add(gulls);
  // HKUST red Sundial, set to the side of the doorway
  const sundial=new THREE.Group(); const sb=cyl(0.5,0.7,0.5,0xc0392b); sb.position.y=0.25; sundial.add(sb); const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,0.14,12,32),mat(0xc0392b,{rough:.5})); ring.position.y=1.5; ring.rotation.x=0.5; sundial.add(ring); const gn=cyl(0.05,0.05,2.2,0xc0392b); gn.position.y=1.6; gn.rotation.z=0.5; sundial.add(gn); sundial.position.set(-7,0,-10.5); g.add(sundial);
  // grass, a lake (the "other half" of the ground), and trees to fill the campus
  const grassMat=mat(0x6fae4b,{rough:1});
  [[7.5,-14,7,10],[-8,-24,8,10]].forEach(([x,z,w,d])=>{ const gr=new THREE.Mesh(new THREE.PlaneGeometry(w,d),grassMat); gr.rotation.x=-Math.PI/2; gr.position.set(x,0.0,z); gr.receiveShadow=true; g.add(gr); });
  const lake=new THREE.Mesh(new THREE.CircleGeometry(3,36),new THREE.MeshStandardMaterial({color:0x2f8fb8,roughness:.25,metalness:.25})); lake.rotation.x=-Math.PI/2; lake.position.set(7.5,0.03,-14); g.add(lake);
  const lakeRim=new THREE.Mesh(new THREE.TorusGeometry(3,0.16,10,44),mat(0x9aa0a6)); lakeRim.rotation.x=Math.PI/2; lakeRim.position.set(7.5,0.06,-14); g.add(lakeRim);
  function tree(x,z){ const t=new THREE.Group(); const tr=cyl(0.16,0.22,1.5,0x6e4a2c); tr.position.y=0.75; const c=sph(0.95,0x3f8f5f,{rough:.9}); c.position.y=1.95; c.scale.set(1,1.15,1); t.add(tr,c); t.position.set(x,0,z); return shadowed(t); }
  [[-9,-12],[11,-21],[-9.5,-23]].forEach(([x,z])=>g.add(tree(x,z)));
  // (the controllable Kobe avatar + ball are created in the court-game module)
  scene.add(g); window._seaGroup=g;
})();

/* paper image path: use the paper's own `img` if set, else images/papers/<key>.jpg */
const paperImg=p=>p.img||('images/papers/'+p.key+'.jpg');

/* ---------- procedural paper placeholder ---------- */
function paperPlaceholder(p){ const col=TOPICS[p.topic].color; return canvasTexture(512,288,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,w,h); gr.addColorStop(0,col); gr.addColorStop(1,'#12222f'); g.fillStyle=gr; g.fillRect(0,0,w,h); g.fillStyle='rgba(255,255,255,.10)'; for(let i=0;i<6;i++){ g.fillRect(30,60+i*30,w-60-i*40,10); } g.fillStyle='#fff'; g.font='700 26px Sora, Arial'; g.fillText(p.venue,30,44); g.font='600 22px Manrope, Arial'; g.fillStyle='#eaf6fc'; wrapText(g,p.title,30,h-70,w-60,26,2); }); }

/* caption strip (venue badge + title) shown at the bottom of each framed photo */
function paperCaption(p){ const col=TOPICS[p.topic].color; return canvasTexture(512,150,(g,w,h)=>{
  g.clearRect(0,0,w,h); g.fillStyle='rgba(8,22,36,0.86)'; g.fillRect(0,0,w,h);
  g.font='700 30px Manrope, Arial'; g.textBaseline='middle';
  const bw=g.measureText(p.venue).width+30; g.fillStyle=col; roundRect(g,14,12,bw,42,10); g.fill();
  g.fillStyle='#fff'; g.fillText(p.venue,29,34);
  g.fillStyle='#eaf6fc'; g.font='600 29px Sora, Arial'; g.textBaseline='alphabetic'; wrapText(g,p.title,16,92,w-30,32,2);
}); }

/* frame + photo for one paper; tries real image, falls back to placeholder */
function paperFrame(p,size){ const grp=new THREE.Group();
  const tex=paperPlaceholder(p);
  const photoMat=new THREE.MeshStandardMaterial({map:tex,roughness:.7});
  const w=size, h=size*0.62;
  const frame=box(w+0.18,h+0.18,0.08,0x5b3d24); grp.add(frame);
  const photo=new THREE.Mesh(new THREE.PlaneGeometry(w,h),photoMat); photo.position.z=0.05; grp.add(photo);
  photo.userData.paperKey=p.key; frame.userData.paperKey=p.key;
  // caption strip (venue + title) at the bottom of the frame
  const capH=w*150/512;
  const cap=new THREE.Mesh(new THREE.PlaneGeometry(w,capH),new THREE.MeshBasicMaterial({map:paperCaption(p),transparent:true,toneMapped:false}));
  cap.position.set(0,-h/2+capH/2,0.06); cap.userData.paperKey=p.key; grp.add(cap); paperMeshes.push(cap);
  // try real teaser image
  const img=new Image();
  img.onload=()=>{ const t=new THREE.Texture(img); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=MAX_ANISO; t.minFilter=THREE.LinearFilter; t.generateMipmaps=false; t.needsUpdate=true; photoMat.map=t; photoMat.needsUpdate=true; };
  img.onerror=()=>{}; img.src=paperImg(p);
  grp.userData.paperKey=p.key;
  paperMeshes.push(photo,frame);
  return grp;
}
const paperMeshes=[];

/* ---------- lay papers on a wall zone ---------- */
/* wall 'east' faces -X at x=+7.85 ; 'south' faces -Z at z=+7.85 */
function placeZone(topicKey, axisCenter){ const list=PAPERS.filter(p=>p.topic===topicKey && p.wall!==false); const T=TOPICS[topicKey];
  const east=(T.wall==='east');
  // arrange up to 5 papers around the zone center along the wall, in up to 2 rows
  const cols=Math.min(list.length,3);
  let i=0;
  list.forEach((p)=>{ const grp=paperFrame(p,1.55);   // uniform frame size on the wall
    const col=i%3, rowTop=(i<3);
    const along=axisCenter + (col-1)*1.9;          // spread along wall
    const y=rowTop?4.8:3.0;
    if(east){ grp.position.set(7.85,y,along); grp.rotation.y=-Math.PI/2; }
    else    { grp.position.set(along,y,7.85); grp.rotation.y=Math.PI; }
    room.add(grp); i++;
  });
  // zone label plaque
  const lab=canvasTexture(512,96,(g,w,h)=>{ g.clearRect(0,0,w,h); g.fillStyle=T.color; roundRect(g,4,4,w-8,h-8,16); g.fill(); g.fillStyle='#fff'; g.font='700 40px Sora, Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(T.label,w/2,h/2); });
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.5),new THREE.MeshBasicMaterial({map:lab,transparent:true,toneMapped:false}));
  if(east){ plaque.position.set(7.8,6.1,axisCenter); plaque.rotation.y=-Math.PI/2; }
  else    { plaque.position.set(axisCenter,6.1,7.8); plaque.rotation.y=Math.PI; }
  room.add(plaque);
}
placeZone('reasoning',-3.2);  // east north half
placeZone('agents',    3.2);  // east south half
placeZone('collab',   -3.2);  // south west half
placeZone('others',    3.2);  // south east half

/* ---------- NEWS wall (west, faces +X at x=-7.85) ---------- */
function newsTexture(){ return canvasTexture(1024,820,(g,w,h)=>{ g.fillStyle='#fbf6ec'; g.fillRect(0,0,w,h); g.fillStyle='#003366'; g.fillRect(0,0,w,104); g.fillStyle='#fff'; g.font='700 52px Sora, Arial'; g.textBaseline='alphabetic'; g.fillText('📰  Latest News',44,70);
  const items=NEWS.slice(0,2);
  items.forEach((n,i)=>{ const y=140+i*338, hl=(i===0);
    g.fillStyle=hl?'#fdeede':'#eef4f7'; roundRect(g,30,y,w-60,308,22); g.fill();
    if(hl){ g.fillStyle='#e2483d'; roundRect(g,30,y,12,308,6); g.fill(); }
    g.fillStyle=hl?'#e2483d':'#1b6ca8'; g.font='700 36px Manrope, Arial'; g.fillText(n.date+(hl?'    ● LATEST':''),60,y+58);
    const plain=n.html.replace(/<[^>]+>/g,''); g.fillStyle='#22333f'; g.font='500 30px Manrope, Arial'; wrapText(g,plain,60,y+112,w-120,40,5);
  });
  g.fillStyle='#5b7183'; g.font='500 26px Manrope, Arial'; g.fillText('Click the board to see all updates →',44,h-24);
}); }
(function newsWall(){ const board=box(6.9,5.5,0.14,0x6d5843); board.position.set(-7.78,3.7,0); board.rotation.y=Math.PI/2; room.add(board);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(6.5,5.2),new THREE.MeshBasicMaterial({map:newsTexture(),toneMapped:false}));
  face.position.set(-7.7,3.7,0); face.rotation.y=Math.PI/2; face.userData.station='news'; room.add(face);
})();

/* ---------- furniture ---------- */
/* desk + laptop + portrait (about) */
(function desk(){ const g=new THREE.Group();
  const top=box(3.2,0.16,1.5,WOOD); top.position.y=1.5; g.add(top);
  for(const[dx,dz]of[[-1.4,-.6],[1.4,-.6],[-1.4,.6],[1.4,.6]]){ const l=box(0.14,1.42,0.14,WOOD_D); l.position.set(dx,0.72,dz); g.add(l); }
  const screen=canvasTexture(256,160,(x,w,h)=>{ x.fillStyle='#0d2233'; x.fillRect(0,0,w,h); x.fillStyle='#5fe6c3'; x.font='600 16px monospace'; ['$ whoami','zhiqin_yang · PhD @ HKUST','$ research','  › llm reasoning','  › agentic models','  › collaborative learning'].forEach((t,i)=>x.fillText(t,10,26+i*20)); });
  const lapBase=box(0.9,0.05,0.6,0x2c3340); lapBase.position.set(0,1.6,0.1); g.add(lapBase);
  const lid=new THREE.Group(); const lb=box(0.9,0.56,0.04,0x2c3340); lb.position.y=0.28; lid.add(lb);
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(0.82,0.5),new THREE.MeshBasicMaterial({map:screen,toneMapped:false})); sc.position.set(0,0.28,0.03); lid.add(sc);
  lid.position.set(0,1.62,-0.2); lid.rotation.x=-0.32; g.add(lid);
  const mug=cyl(0.1,0.09,0.2,0xe2483d); mug.position.set(1.1,1.68,0.2); g.add(mug);
  // portrait frame — a photo frame standing ON the desk
  const fr=new THREE.Group();
  const pf=box(0.66,0.84,0.05,0x5b3d24); pf.position.y=0.42; fr.add(pf);
  const pmat=new THREE.MeshBasicMaterial({color:0xdfeaf1});
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.52,0.68),pmat); pl.position.set(0,0.44,0.03); fr.add(pl);
  const stand=box(0.05,0.5,0.05,0x4a3117); stand.position.set(0,0.25,-0.13); stand.rotation.x=0.35; fr.add(stand);  // kickstand
  fr.position.set(-1.2,1.58,0.05); fr.rotation.x=-0.1; g.add(fr);
  const img=new Image();
  img.onload=()=>{ const t=new THREE.Texture(img); t.colorSpace=THREE.SRGBColorSpace; t.needsUpdate=true; pmat.map=t; pmat.color.set(0xffffff); pmat.needsUpdate=true; }; img.src='images/profile.jpg';
  g.position.set(-3.2,0,-4.8); room.add(shadowed(g));
})();

/* office chair */
(function chair(){ const g=new THREE.Group(); const s=box(0.8,0.1,0.8,0x35404e); s.position.y=0.9; const b=box(0.8,0.9,0.1,0x35404e); b.position.set(0,1.35,-0.35); const p=cyl(0.05,0.05,0.85,0x222831); p.position.y=0.45; g.add(s,b,p); g.position.set(-3.2,0,-3.4); room.add(shadowed(g)); })();

/* whiteboard easel (research) — freestanding in the open, not blocking a wall */
(function whiteboard(){ const g=new THREE.Group();
  const tex=canvasTexture(512,384,(x,w,h)=>{ x.fillStyle='#fbfdff'; x.fillRect(0,0,w,h); x.strokeStyle='#003366'; x.lineWidth=6; x.strokeRect(6,6,w-12,h-12);
    x.fillStyle='#003366'; x.font='700 30px Sora, Arial'; x.fillText('Research', 28,50);
    x.font='600 22px Manrope, Arial';
    const lines=[['#e2483d','• LLM Reasoning & Alignment'],['#f0a63a','• Agentic Models & Memory'],['#1b8a8a','• Collaborative Learning'],['#12222f','• Trustworthy ML']];
    lines.forEach((l,i)=>{ x.fillStyle=l[0]; x.fillText(l[1],32,110+i*54); });
  });
  const board=new THREE.Group();
  const frame=box(2.7,2.0,0.1,0xb0b6bd,{metal:.4,rough:.5}); frame.position.z=-0.02;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.8),new THREE.MeshBasicMaterial({map:tex,toneMapped:false})); face.position.z=0.04;
  board.add(frame,face); board.position.y=2.1; g.add(board);
  // tripod legs
  for(const dx of [-0.9,0.9]){ const leg=cyl(0.05,0.05,2.5,WOOD_D); leg.position.set(dx,1.1,0.2); leg.rotation.x=0.12; g.add(leg); }
  const backleg=cyl(0.05,0.05,2.5,WOOD_D); backleg.position.set(0,1.1,-0.5); backleg.rotation.x=-0.2; g.add(backleg);
  g.position.set(2.6,0,-3.8); g.rotation.y=-0.35; room.add(shadowed(g));
})();

/* education cabinet + diplomas */
function diplomaTex(t,s){ return canvasTexture(256,320,(g,w,h)=>{ g.fillStyle='#f3ecd9'; g.fillRect(0,0,w,h); g.strokeStyle='#003366'; g.lineWidth=6; g.strokeRect(12,12,w-24,h-24); g.fillStyle='#003366'; g.textAlign='center'; g.font='700 30px Sora'; g.fillText(t,w/2,90); g.font='500 18px Manrope'; g.fillStyle='#5b7183'; g.fillText(s,w/2,124); g.fillStyle='#e2483d'; g.beginPath(); g.arc(w/2,250,20,0,7); g.fill(); }); }
(function education(){ const g=new THREE.Group();
  const cab=box(2.4,1.0,0.9,WOOD); cab.position.y=0.5; g.add(cab);
  const specs=[['Ph.D.','HKUST'],['M.S.','Beihang'],['B.S.','NJUST']];
  specs.forEach((s,i)=>{ const fr=box(0.66,0.84,0.05,0x5b3d24); fr.position.set(-0.8+i*0.8,1.7,-0.2);
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.56,0.72),new THREE.MeshBasicMaterial({map:diplomaTex(s[0],s[1]),toneMapped:false})); pl.position.set(-0.8+i*0.8,1.7,-0.17);
    g.add(fr,pl); });
  const cap=box(0.5,0.05,0.5,0x12222f); cap.position.set(0.7,1.05,0.2); cap.rotation.y=0.5; g.add(cap);
  g.position.set(-6,0,5.6); g.rotation.y=-0.7; room.add(shadowed(g)); g.userData.stationRoot='education';
})();

/* experience banner */
(function experience(){ const g=new THREE.Group();
  const tex=canvasTexture(384,640,(x,w,h)=>{ x.fillStyle='#003366'; x.fillRect(0,0,w,h); x.fillStyle='#f0a63a'; x.fillRect(0,0,w,10); x.fillStyle='#fff'; x.textAlign='center'; x.font='700 34px Sora'; x.fillText('Experience',w/2,70);
    const rows=[['Tencent','LightSpeed'],['HKGAI','Hong Kong'],['GigaAI','Beijing']];
    rows.forEach((r,i)=>{ const y=150+i*150; x.fillStyle='#0a4a7a'; roundRect(x,30,y,w-60,120,14); x.fill(); x.fillStyle='#fff'; x.font='700 30px Manrope'; x.fillText(r[0],w/2,y+55); x.fillStyle='#bfe4f0'; x.font='500 22px Manrope'; x.fillText(r[1],w/2,y+92); }); });
  const pole=cyl(0.055,0.055,3.8,0x888f96,12); pole.position.set(0,1.9,-0.08); g.add(pole);
  const foot=cyl(0.34,0.4,0.09,0x888f96,16); foot.position.set(0,0.045,-0.08); g.add(foot);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(2.1,3.4),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,toneMapped:false})); face.position.set(0,2.15,0.02); g.add(face);
  g.position.set(4.4,0,-1.0); g.rotation.y=-0.4; room.add(shadowed(g));
})();

/* awards trophy */
(function awards(){ const g=new THREE.Group();
  const ped=box(1.2,2.0,1.2,WOOD); ped.position.y=1.0; g.add(ped);
  const gold={metal:.8,rough:.25};
  const cup=cyl(0.3,0.12,0.4,0xf0a63a,20,gold); cup.position.y=2.3; g.add(cup);
  const stem=cyl(0.06,0.09,0.25,0xf0a63a,12,gold); stem.position.y=2.05; g.add(stem);
  const base2=cyl(0.24,0.28,0.1,0xf0a63a,16,gold); base2.position.y=1.9; g.add(base2);
  for(const s of[-1,1]){ const ear=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.03,8,18,Math.PI*1.1),mat(0xf0a63a,gold)); ear.position.set(s*0.3,2.34,0); ear.rotation.z=s*-0.5; g.add(ear); }
  g.position.set(6,0,-5.6); room.add(shadowed(g));
})();

/* beyond shelf: basketball, vinyl, book */
(function beyond(){ const g=new THREE.Group();
  const sh=box(1.8,0.1,0.7,WOOD); sh.position.y=1.4; g.add(sh);
  const sh2=box(1.8,0.1,0.7,WOOD); sh2.position.y=0.7; g.add(sh2);
  const ball=sph(0.32,0xd35400,{rough:.7}); ball.position.set(-0.5,1.75,0); g.add(ball);
  const vinyl=cyl(0.34,0.34,0.03,0x12222f,24); vinyl.rotation.x=Math.PI/2; vinyl.position.set(0.4,1.75,0); const lab=cyl(0.12,0.12,0.032,0xe2483d,20); lab.rotation.x=Math.PI/2; lab.position.set(0.4,1.75,0); g.add(vinyl,lab);
  for(let i=0;i<4;i++){ const bk=box(0.12,0.5,0.4,[0xc0392b,0x1b6ca8,0xf0a63a,0x2e6b5e][i]); bk.position.set(-0.6+i*0.16,1.05,0); g.add(bk); }
  const side1=box(0.08,1.5,0.7,WOOD_D); side1.position.set(-0.9,0.9,0); const side2=side1.clone(); side2.position.x=0.9; g.add(side1,side2);
  g.position.set(-6,0,-5.6); g.rotation.y=0.7; room.add(shadowed(g));
})();

/* contact: message-in-a-bottle on a crate out on the terrace by the sea */
(function contact(){ const g=new THREE.Group();
  const crate=box(0.72,0.8,0.72,0x8a5a36,{rough:.8}); crate.position.y=0.4; g.add(crate);
  const bottle=cyl(0.16,0.18,0.55,0x9fd4e0,16,{rough:.15,metal:.1}); bottle.position.y=1.08;
  const neck=cyl(0.06,0.11,0.16,0x9fd4e0,12,{rough:.15}); neck.position.y=1.43;
  const cork=cyl(0.06,0.06,0.09,0xb98a55,10); cork.position.y=1.55;
  const note=box(0.13,0.26,0.02,0xf3ecd9); note.position.set(0.02,1.05,0.02); note.rotation.y=0.4;
  g.add(bottle,neck,cork,note); g.position.set(3.4,0,-10.8); room.add(shadowed(g));
})();

/* potted palm for seaside vibe */
(function palm(){ const g=new THREE.Group(); const pot=cyl(0.35,0.28,0.5,0xe2483d); pot.position.y=0.25; g.add(pot); const tr=cyl(0.09,0.12,1.6,WOOD_D); tr.position.y=1.05; g.add(tr); for(let i=0;i<7;i++){ const a=i/7*Math.PI*2; const fr=sph(0.6,0x2e8b57,{rough:.8}); fr.scale.set(1,0.08,0.28); fr.position.set(Math.cos(a)*0.5,1.9,Math.sin(a)*0.5); fr.rotation.y=-a; fr.rotation.z=-0.35; g.add(fr); } g.position.set(6.4,0,-1.4); room.add(shadowed(g)); })();

/* guestbook lectern (GUESTBOOK) */
(function guestbook(){ const g=new THREE.Group();
  const foot=cyl(0.36,0.42,0.08,WOOD_D,20); foot.position.y=0.04; g.add(foot);
  const post=cyl(0.08,0.1,1.1,WOOD_D); post.position.y=0.58; g.add(post);
  const deskT=box(0.95,0.07,0.62,WOOD); deskT.position.set(0,1.16,0); deskT.rotation.x=-0.4; g.add(deskT);
  const lip=box(0.95,0.05,0.06,WOOD_D); lip.position.set(0,1.05,0.28); lip.rotation.x=-0.4; g.add(lip);
  const bookTex=canvasTexture(256,170,(x,w,h)=>{ x.fillStyle='#f7f1e2'; x.fillRect(0,0,w,h); x.fillStyle='#e9e0c8'; x.fillRect(w/2-2,0,4,h); x.strokeStyle='#c9bda0'; x.lineWidth=2; for(let i=0;i<5;i++){ x.beginPath(); x.moveTo(18,52+i*22); x.lineTo(w/2-14,52+i*22); x.stroke(); x.beginPath(); x.moveTo(w/2+14,52+i*22); x.lineTo(w-18,52+i*22); x.stroke(); } x.fillStyle='#003366'; x.font='700 26px Sora, Arial'; x.textAlign='center'; x.fillText('✍ Guestbook',w/2,30); });
  const pages=new THREE.Mesh(new THREE.PlaneGeometry(0.82,0.52),new THREE.MeshBasicMaterial({map:bookTex,toneMapped:false})); pages.rotation.x=-1.17; pages.position.set(0,1.22,0.03); g.add(pages);
  const pen=cyl(0.014,0.014,0.34,0x23262e,8); pen.position.set(0.26,1.26,0.02); pen.rotation.set(-0.4,0,0.7); g.add(pen);
  // standing sign so it's obvious what this is
  const signTex=canvasTexture(384,100,(x,w,h)=>{ x.fillStyle='#003366'; roundRect(x,2,2,w-4,h-4,16); x.fill(); x.fillStyle='#f0a63a'; roundRect(x,2,2,w-4,8,4); x.fill(); x.fillStyle='#fff'; x.font='700 44px Sora, Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('📖  Guestbook',w/2,h/2+6); });
  const signPost=cyl(0.03,0.03,0.9,WOOD_D,8); signPost.position.set(-0.3,1.55,-0.1); g.add(signPost);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.39),new THREE.MeshBasicMaterial({map:signTex,side:THREE.DoubleSide,toneMapped:false})); sign.position.set(0,2.05,-0.05); g.add(sign);
  g.position.set(-5.3,0,2.7); g.rotation.y=Math.PI/2; room.add(shadowed(g));
})();

/* academic-service marker: review cabinet + "Service" sign (SERVICE) */
(function serviceObj(){ const g=new THREE.Group();
  const cab=box(1.0,1.5,0.8,0x4a5568,{rough:.6,metal:.2}); cab.position.y=0.75; g.add(cab);
  for(let i=0;i<2;i++){ const dr=box(0.9,0.55,0.05,0x3b4454); dr.position.set(0,0.5+i*0.62,0.41); g.add(dr);
    const hd=box(0.3,0.05,0.04,0xc9ccd4,{metal:.6,rough:.3}); hd.position.set(0,0.66+i*0.62,0.44); g.add(hd); }
  const tray=box(0.86,0.06,0.62,0x2c3340); tray.position.set(0,1.53,0); g.add(tray);
  const stack=box(0.72,0.18,0.52,0xf2ecdd); stack.position.set(0,1.64,0); g.add(stack);
  const stampH=cyl(0.06,0.085,0.18,0x9e2b2b); stampH.position.set(0.32,1.72,-0.16); g.add(stampH);
  const stampK=sph(0.075,0x6e1f1f); stampK.position.set(0.32,1.83,-0.16); g.add(stampK);
  const sTex=canvasTexture(256,84,(x,w,h)=>{ x.fillStyle='#003366'; roundRect(x,2,2,w-4,h-4,14); x.fill(); x.fillStyle='#f0a63a'; roundRect(x,2,2,w-4,7,4); x.fill(); x.fillStyle='#fff'; x.font='700 38px Sora, Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('📋 Service',w/2,h/2+4); });
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.15,0.38),new THREE.MeshBasicMaterial({map:sTex,side:THREE.DoubleSide,toneMapped:false})); sign.position.set(0,2.05,0); g.add(sign);
  g.position.set(4.7,0,3.7); g.rotation.y=-0.6; room.add(shadowed(g));
})();

/* dust motes */
const dustGeo=new THREE.BufferGeometry(); const DUST=90; const dp=new Float32Array(DUST*3);
for(let i=0;i<DUST;i++){ dp[i*3]=Math.random()*14-7; dp[i*3+1]=Math.random()*6+0.5; dp[i*3+2]=Math.random()*14-7; }
dustGeo.setAttribute('position',new THREE.BufferAttribute(dp,3));
scene.add(new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xffffff,size:0.04,transparent:true,opacity:.4,depthWrite:false})));

/* ---------- stations (teleport viewpoints) ---------- */
const HOME={ cam:[0,3.6,4.6], tgt:[0,3.5,-8] };
const PUBVIEW={ cam:[0,4.3,0.5], tgt:[6,3,6] };
const stations=[
  { id:'about',        label:'About Me',        icon:'💻', anchor:[-3.2,2.6,-4.8], cam:[-3.2,3.3,-1.9], tgt:[-3.2,2.3,-4.9] },
  { id:'research',     label:'Research',        icon:'🧮', anchor:[2.6,3.0,-3.8],  cam:[2.2,3.3,-1.0],  tgt:[2.7,2.6,-3.9] },
  { id:'news',         label:'News',            icon:'📰', anchor:[-7.6,3.7,0],    cam:[-3.6,3.7,0],    tgt:[-7.7,3.5,0] },
  { id:'papers-reasoning', label:'LLM Reasoning', icon:'📚', anchor:[7.6,4.6,-3.2], cam:[3.4,3.9,-3.2], tgt:[7.7,3.8,-3.2], topic:'reasoning' },
  { id:'papers-agents',    label:'Agentic Models', icon:'📚', anchor:[7.6,4.6,3.2],  cam:[3.4,3.9,3.2],  tgt:[7.7,3.8,3.2],  topic:'agents' },
  { id:'papers-collab',    label:'Collaborative Learning', icon:'📚', anchor:[-3.2,4.6,7.6], cam:[-3.2,3.9,3.4], tgt:[-3.2,3.8,7.7], topic:'collab' },
  { id:'papers-others',    label:'Others',        icon:'📚', anchor:[3.2,4.6,7.6],  cam:[3.2,3.9,3.4],  tgt:[3.2,3.8,7.7],  topic:'others' },
  { id:'education',    label:'Education',       icon:'🎓', anchor:[-6,1.9,5.6],    cam:[-3.6,3,3.6],    tgt:[-6,1.7,5.6] },
  { id:'experience',   label:'Experience',      icon:'💼', anchor:[4.4,2.8,-1.0],  cam:[4.3,3.2,2.0],   tgt:[4.5,2.4,-1.1] },
  { id:'awards',       label:'Honors & Awards', icon:'🏆', anchor:[6,2.4,-5.6],    cam:[3.6,3.1,-3.8],  tgt:[6,2.1,-5.6] },
  { id:'beyond',       label:'Beyond Academia', icon:'🏀', anchor:[-6,1.9,-5.6],   cam:[-3.6,3.1,-3.8], tgt:[-6,1.8,-5.6] },
  { id:'service',      label:'Academic Service', icon:'📋', anchor:[4.7,1.9,3.7],  cam:[2.6,3.1,3.7],   tgt:[4.8,1.6,3.7] },
  { id:'guestbook',    label:'Guestbook',       icon:'📖', anchor:[-5.3,1.35,2.7], cam:[-2.9,3.0,2.7],  tgt:[-5.4,1.2,2.7] },
  { id:'contact',      label:'Contact',         icon:'✉️', anchor:[3.4,1.5,-10.8], cam:[3.4,3.1,-7.4],  tgt:[3.4,1.3,-10.9] },
];
const NAV=['about','research','news','publications','education','experience','awards','service','talks','beyond','guestbook','contact'];

for(const st of stations){ st.anchorV=new THREE.Vector3(...st.anchor);
  const dot=document.createElement('button'); dot.className='hotspot'; dot.setAttribute('aria-label',st.label);
  dot.addEventListener('click',e=>{ e.stopPropagation(); openStation(st.id); });
  dot.addEventListener('pointerenter',()=>showTip(st));
  dot.addEventListener('pointerleave',()=>tooltip.classList.remove('show'));
  hotspotLayer.appendChild(dot); st.dot=dot;
}
function showTip(st){ const v=st.anchorV.clone().project(camera); tooltip.textContent=st.label; tooltip.style.left=(v.x*.5+.5)*innerWidth+'px'; tooltip.style.top=(-v.y*.5+.5)*innerHeight+'px'; tooltip.classList.add('show'); }

/* ---------- interaction: raycast click for papers ---------- */
const raycaster=new THREE.Raycaster(); const pointer=new THREE.Vector2();
let dragging=false, downXY=null, moved=0, lastX=0, lastY=0;
canvas.addEventListener('pointerdown',e=>{ downXY=[e.clientX,e.clientY]; lastX=e.clientX; lastY=e.clientY; moved=0; dragging=true; });
addEventListener('pointerup',e=>{ dragging=false;
  if(!downXY) return; const d=Math.hypot(e.clientX-downXY[0],e.clientY-downXY[1]); downXY=null;
  if(d>6||panelStation||tween||!introDone) return;
  pointer.x=(e.clientX/innerWidth)*2-1; pointer.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(paperMeshes.concat(clickTargets),false);
  if(hits[0]){ const u=hits[0].object.userData; if(u.paperKey) openPaperDetail(u.paperKey); else if(u.station) openStation(u.station); }
});
const clickTargets=[]; // news face etc.
room.traverse(m=>{ if(m.userData&&m.userData.station) clickTargets.push(m); });

/* drag-look at overview */
addEventListener('pointermove',e=>{ if(!dragging||panelStation||tween||!introDone) return; if(document.body.classList.contains('flat'))return;
  const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; moved+=Math.abs(dx)+Math.abs(dy);   // client-delta works for touch too
  yaw-=dx*0.003; pitch=THREE.MathUtils.clamp(pitch-dy*0.003,-0.55,0.5); applyLook(); });

/* ---------- WASD free-walk (hybrid; teleport stays primary) ---------- */
const keys={};
const typingInField=()=>{ const t=document.activeElement; return !!(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)); };
addEventListener('keydown',e=>{ if(typingInField())return; const k=e.key.toLowerCase(); if(k==='w'||k==='a'||k==='s'||k==='d'){ keys[k]=true; if(!document.body.classList.contains('flat'))e.preventDefault(); } });
addEventListener('keyup',  e=>{ const k=e.key.toLowerCase(); if(k==='w'||k==='a'||k==='s'||k==='d') keys[k]=false; });
const WALK_Y=3.4, WALK_SPEED=6;
const BLOCKERS=[ {x:-3.2,z:-4.8,r:1.9}, {x:-3.2,z:-3.4,r:0.9}, {x:2.6,z:-3.8,r:1.1},
  {x:-6,z:-5.6,r:1.3}, {x:6,z:-5.6,r:1.1}, {x:-6,z:5.6,r:1.6}, {x:4.4,z:-1.0,r:0.7}, {x:6.4,z:-1.4,r:0.7}, {x:-5.3,z:2.7,r:0.6}, {x:4.7,z:3.7,r:0.7},
  {x:-12.5,z:-17,r:4}, {x:12.5,z:-17,r:4}, {x:-14,z:-27,r:4.5}, {x:13,z:-28,r:4.5},   // outdoor buildings
  {x:0,z:-9.5,r:0.5}, {x:0,z:-25.5,r:0.5}, {x:-7,z:-10.5,r:1.1},                         // hoops + sundial
  {x:3.4,z:-10.8,r:0.6},                                                                // contact crate (lake is swimmable, no blocker)
  {x:-9,z:-12,r:0.5}, {x:11,z:-21,r:0.5}, {x:-9.5,z:-23,r:0.5} ];                        // trees
function blocked(x,z){ for(const b of BLOCKERS){ const dx=x-b.x,dz=z-b.z; if(dx*dx+dz*dz < (b.r+0.4)*(b.r+0.4)) return true; } return false; }
/* walkable regions: room · doorway gap · outdoor terrace (so you can walk out the north door) */
function inWalk(x,z){
  if(x>=-7.4&&x<=7.4&&z>=-7.4&&z<=7.4) return true;     // room
  if(x>=-4.5&&x<=4.5&&z>=-8.7&&z<-7.4) return true;      // doorway
  if(x>=-13&&x<=13&&z>=-30&&z<-8.7) return true;         // outside
  return false;
}
function updateWalk(dt){ if(!introDone||panelStation||tween||courtMode||document.body.classList.contains('flat'))return;
  const f=(keys.w?1:0)-(keys.s?1:0), s=(keys.d?1:0)-(keys.a?1:0); if(!f&&!s)return;
  const fx=Math.sin(yaw), fz=-Math.cos(yaw), rx=Math.cos(yaw), rz=Math.sin(yaw);
  let dx=fx*f+rx*s, dz=fz*f+rz*s; const len=Math.hypot(dx,dz)||1; dx/=len; dz/=len;
  const step=WALK_SPEED*dt;
  const nx=camera.position.x+dx*step, nz=camera.position.z+dz*step;
  if(inWalk(nx,camera.position.z)&&!blocked(nx,camera.position.z)) camera.position.x=nx;  // axis-separated → slide along walls
  if(inWalk(camera.position.x,nz)&&!blocked(camera.position.x,nz)) camera.position.z=nz;
  camera.position.y=WALK_Y; applyLook();
  if(introCard.classList.contains('show')) dismissIntro();
  if(camera.position.z < -8.7) enterCourt();     // stepped out onto the court → third person
}

/* ================= third-person court game ================= */
function buildBaller(){ const k=new THREE.Group(); const PUR=0x552583,GOLD=0xfdb927,SKIN=0x9c6a43;
  const legL=cyl(0.1,0.12,1.0,PUR,8); legL.geometry.translate(0,-0.5,0); legL.position.set(-0.12,1.0,0);
  const legR=legL.clone(); legR.position.x=0.12; k.add(legL,legR);
  const shorts=cyl(0.27,0.24,0.42,PUR,10); shorts.position.y=1.1; k.add(shorts);
  const torso=cyl(0.27,0.22,0.8,GOLD,10); torso.position.y=1.52; k.add(torso);
  const armL=cyl(0.07,0.06,0.72,SKIN,8); armL.geometry.translate(0,-0.36,0); armL.position.set(-0.3,1.85,0);
  const armR=cyl(0.07,0.06,0.72,SKIN,8); armR.geometry.translate(0,-0.36,0); armR.position.set(0.3,1.85,0); k.add(armL,armR);
  const neck=cyl(0.08,0.08,0.12,SKIN,8); neck.position.y=1.98; k.add(neck);
  const head=sph(0.23,SKIN); head.position.y=2.2; k.add(head);
  const hair=sph(0.245,0x120d0b); hair.scale.set(1.02,0.72,1.02); hair.position.y=2.3; k.add(hair);
  for(const sx of [-1,1]){ const wt=sph(0.05,0xffffff,{},8); wt.scale.set(1,0.7,0.5); wt.position.set(sx*0.09,2.22,0.19); k.add(wt);
    const eye=sph(0.028,0x120d0b,{},8); eye.position.set(sx*0.09,2.22,0.225); k.add(eye);
    const brow=box(0.09,0.02,0.02,0x120d0b); brow.position.set(sx*0.09,2.31,0.21); brow.rotation.z=sx*0.12; k.add(brow); }
  const nose=cyl(0.02,0.038,0.09,SKIN,6); nose.rotation.x=Math.PI/2; nose.position.set(0,2.15,0.23); k.add(nose);
  const mouth=box(0.11,0.02,0.02,0x5a2a20); mouth.position.set(0,2.07,0.22); k.add(mouth);
  // jersey: Lakers wordmark + #8 on the front, BRIAN + #8 on the back
  const frontTex=canvasTexture(256,220,(x,w,h)=>{ x.clearRect(0,0,w,h); x.textAlign='center'; x.fillStyle='#552583';
    x.font='italic 700 42px Georgia, serif'; x.fillText('Lakers',w/2,52);
    x.font='700 132px Arial'; x.fillText('8',w/2,180); });
  const backTex=canvasTexture(256,220,(x,w,h)=>{ x.clearRect(0,0,w,h); x.textAlign='center'; x.fillStyle='#552583';
    x.font='700 44px Arial'; x.fillText('BRIAN',w/2,50);
    x.font='700 132px Arial'; x.fillText('8',w/2,180); });
  const jf=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.43),new THREE.MeshBasicMaterial({map:frontTex,transparent:true,toneMapped:false})); jf.position.set(0,1.55,0.3); k.add(jf);   // in front of the torso bulge so text isn't clipped
  const jb=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.43),new THREE.MeshBasicMaterial({map:backTex,transparent:true,toneMapped:false})); jb.position.set(0,1.55,-0.3); jb.rotation.y=Math.PI; k.add(jb);
  // small Lakers roundel on the shorts
  const logoTex=canvasTexture(96,96,(x,w,h)=>{ x.clearRect(0,0,w,h); x.fillStyle='#552583'; x.beginPath(); x.arc(w/2,h/2,44,0,7); x.fill();
    x.fillStyle='#fdb927'; x.beginPath(); x.arc(w/2,h/2,30,0,7); x.fill();
    x.strokeStyle='#552583'; x.lineWidth=3; x.beginPath(); x.arc(w/2,h/2,30,0,7); x.stroke();
    x.beginPath(); x.moveTo(w/2-30,h/2); x.lineTo(w/2+30,h/2); x.stroke(); });
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(0.16,0.16),new THREE.MeshBasicMaterial({map:logoTex,transparent:true,toneMapped:false})); logo.position.set(-0.13,1.12,0.28); k.add(logo);
  k.userData={armR,legL,legR}; return shadowed(k); }
const player=buildBaller(); player.position.set(-1.6,0,-15); scene.add(player);
const courtBall=sph(0.18,0xd35400,{rough:.85}); scene.add(courtBall);
const BALL_FREE=new THREE.Vector3(1.6,0.18,-16); courtBall.position.copy(BALL_FREE);
const playerPos=new THREE.Vector3(-1.6,0,-15); let playerYaw=0;
let courtMode=false, ballState='free', aiming=false, power=0, powerDir=1;
let ballVel=null, ballT=0, ballTargetV=null, shotMade=false, ballScored=false, shotsMade=0, shotsTook=0;
let targetYaw=0, shootAnim=0, zoneCenter=0.5, zoneHalf=0.05;
const angDiff=(a,b)=>{ let d=(a-b)%(Math.PI*2); if(d>Math.PI)d-=Math.PI*2; if(d<-Math.PI)d+=Math.PI*2; return d; };
const RIMS=[new THREE.Vector3(0,3.18,-10.1),new THREE.Vector3(0,3.18,-24.9)];
function facedHoop(){ const fx=Math.sin(playerYaw),fz=Math.cos(playerYaw); let best=null,bd=-2;
  for(const r of RIMS){ const dx=r.x-playerPos.x,dz=r.z-playerPos.z,L=Math.hypot(dx,dz)||1; const dot=(dx/L)*fx+(dz/L)*fz; if(dot>bd){bd=dot;best=r;} }
  return {rim:best,dot:bd}; }

const courtHud=document.createElement('div'); courtHud.id='court-hud'; courtHud.style.display='none'; document.body.appendChild(courtHud);
const powerBar=document.createElement('div'); powerBar.id='power-bar';
powerBar.innerHTML='<div class="pb-track"><div class="pb-zone"></div><div class="pb-marker"></div></div>';
powerBar.style.display='none'; document.body.appendChild(powerBar);

function enterCourt(){ if(courtMode)return; courtMode=true; playerPos.set(camera.position.x,0,Math.min(camera.position.z,-8.8)); playerYaw=Math.atan2(Math.sin(yaw),-Math.cos(yaw)); }
function exitCourt(){ courtMode=false; aiming=false; powerBar.style.display='none'; camera.position.set(playerPos.x,WALK_Y,-7.0); pitch=0; applyLook(); }
function releaseShot(){ aiming=false; powerBar.style.display='none'; shotsTook++; shootAnim=0.5;
  const timing=Math.abs(power-zoneCenter)<zoneHalf;      // narrow, randomly-placed sweet spot
  const {rim,dot}=facedHoop(); const facing=dot>0.6;   // must be facing a hoop
  shotMade = timing && facing;
  if(facing){ ballTargetV=rim.clone(); if(!shotMade){ ballTargetV.x+=(Math.random()<.5?-1:1)*0.5; ballTargetV.y+=0.15; } }
  else { const fx=Math.sin(playerYaw),fz=Math.cos(playerYaw); ballTargetV=new THREE.Vector3(playerPos.x+fx*6,1.3,playerPos.z+fz*6); }  // not facing → flies off, no basket
  const p0=courtBall.position.clone(), t=0.95, G=9.8;
  ballVel=new THREE.Vector3((ballTargetV.x-p0.x)/t,(ballTargetV.y-p0.y)/t+0.5*G*t,(ballTargetV.z-p0.z)/t);
  ballState='flying'; ballT=0; ballScored=false; }
function updateCourt(dt){ courtHud.style.display=courtMode?'block':'none';
  if(!courtMode)return; const now=performance.now(); let moving=false;
  const f=(keys.w?1:0)-(keys.s?1:0), s=(keys.d?1:0)-(keys.a?1:0);
  if((f||s)&&ballState!=='flying'&&!aiming){ const fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);
    let dx=fx*f+rx*s,dz=fz*f+rz*s; const L=Math.hypot(dx,dz)||1; dx/=L;dz/=L;
    const nx=playerPos.x+dx*WALK_SPEED*dt, nz=playerPos.z+dz*WALK_SPEED*dt;
    if(inWalk(nx,playerPos.z)&&!blocked(nx,playerPos.z)){playerPos.x=nx;moving=true;}
    if(inWalk(playerPos.x,nz)&&!blocked(playerPos.x,nz)){playerPos.z=nz;moving=true;}
    if(moving) targetYaw=Math.atan2(dx,dz); }   // face the movement direction (avatar front = +Z)
  if(playerPos.z>-8){ exitCourt(); return; }
  playerYaw+=angDiff(targetYaw,playerYaw)*Math.min(1,dt*9);   // smooth turning
  if(shootAnim>0) shootAnim-=dt;
  const inWater=Math.hypot(playerPos.x-7.5,playerPos.z+14)<2.8;
  const L=player.userData;
  if(inWater){ if(ballState==='held'){ ballState='free'; courtBall.position.copy(BALL_FREE); } if(aiming){ aiming=false; powerBar.style.display='none'; } }
  const hop=shootAnim>0?Math.sin((1-shootAnim/0.5)*Math.PI)*0.35:0;
  const baseY=inWater ? -0.95+Math.sin(now*0.004)*0.06 : hop;
  player.position.set(playerPos.x,baseY,playerPos.z); player.rotation.y=playerYaw;
  if(inWater){ const st=Math.sin(now*0.009);   // breaststroke / tread
    if(L.armL){ L.armL.rotation.x=-0.7-st*0.9; L.armL.rotation.z=0.5; }
    if(L.armR){ L.armR.rotation.x=-0.7+st*0.9; L.armR.rotation.z=-0.5; }
    if(L.legL){ L.legL.rotation.x=st*0.35; L.legR.rotation.x=-st*0.35; }
    courtHud.innerHTML=`🏊 Swimming in the bay — <kbd>WASD</kbd> to swim, walk out to dry off`;
  } else {
    const sw=moving?Math.sin(now*0.013)*0.5:0; if(L.legL){L.legL.rotation.x=sw;L.legR.rotation.x=-sw;}
    if(L.armL){L.armL.rotation.x=0;L.armL.rotation.z=0;}
  }
  const ct=new THREE.Vector3(playerPos.x-Math.sin(yaw)*4.2, inWater?2.3:3.1, playerPos.z+Math.cos(yaw)*4.2);
  camera.position.lerp(ct,Math.min(1,dt*6)); camera.lookAt(playerPos.x, inWater?0.7:1.55, playerPos.z);
  if(!inWater && ballState==='free' && playerPos.distanceTo(courtBall.position)<1.5) ballState='held';
  if(ballState==='held'){ const b=Math.abs(Math.sin(now*0.009))*0.95;
    const fX=Math.sin(playerYaw), fZ=Math.cos(playerYaw), rX=Math.cos(playerYaw), rZ=-Math.sin(playerYaw);  // avatar front / right
    courtBall.position.set(playerPos.x+fX*0.15+rX*0.42, 0.18+b, playerPos.z+fZ*0.15+rZ*0.42);
    if(player.userData.armR) player.userData.armR.rotation.x=1.4-b*0.9;   // hand pumps with the bounce
    courtHud.innerHTML=`🏀 Dribbling — <kbd>Space</kbd> to shoot &nbsp;·&nbsp; Made ${shotsMade}/${shotsTook}`;
  } else if(ballState==='free' && !inWater){ courtHud.innerHTML=`🏀 Walk to the ball (<kbd>WASD</kbd>) to pick it up &nbsp;·&nbsp; Made ${shotsMade}/${shotsTook}`; }
  if(aiming){ power+=powerDir*dt*1.3; if(power>=1){power=1;powerDir=-1;} if(power<=0){power=0;powerDir=1;}
    powerBar.querySelector('.pb-marker').style.bottom=(power*100)+'%';
    if(player.userData.armR) player.userData.armR.rotation.x=-1.9;
    const fh=facedHoop().dot>0.6;
    courtHud.innerHTML=`🎯 <kbd>Space</kbd> to release in the green ${fh?'· ✅ facing the hoop':'· ⚠️ not facing a hoop'} &nbsp;·&nbsp; Made ${shotsMade}/${shotsTook}`; }
  if(ballState==='flying'){ ballT+=dt; ballVel.y-=9.8*dt; courtBall.position.addScaledVector(ballVel,dt); courtBall.rotation.x+=dt*10;
    if(!ballScored && shotMade && courtBall.position.distanceTo(ballTargetV)<0.45){ ballScored=true; shotsMade++; courtHud.innerHTML=`🔥 SCORE! &nbsp;·&nbsp; Made ${shotsMade}/${shotsTook}`; }
    if(courtBall.position.y<0.18||ballT>3){ ballState='free'; courtBall.position.copy(BALL_FREE); if(player.userData.armR)player.userData.armR.rotation.x=0.3; } }
  if(shootAnim>0 && player.userData.armR) player.userData.armR.rotation.x=-2.3;   // both-hands-up shot pose
}
function courtAction(){ if(!courtMode)return;
  if(ballState==='held'&&!aiming){ aiming=true; power=0; powerDir=1;
    zoneCenter=0.2+Math.random()*0.6;                       // green zone moves every shot
    const z=powerBar.querySelector('.pb-zone'); if(z){ z.style.bottom=((zoneCenter-zoneHalf)*100)+'%'; z.style.height=(zoneHalf*2*100)+'%'; }
    powerBar.style.display='block'; }
  else if(aiming){ releaseShot(); } }
addEventListener('keydown',e=>{ if(e.code==='Space' && courtMode && !typingInField()){ e.preventDefault(); courtAction(); } });

/* on-screen touch controls (phones/tablets have no WASD) */
const isTouch = matchMedia('(pointer:coarse)').matches || ('ontouchstart' in window);
let touchPad=null, touchAct=null;
if(isTouch){
  document.body.classList.add('touch');
  touchPad=document.createElement('div'); touchPad.id='touch-controls';
  touchPad.innerHTML=`<div class="tc-pad">
    <button class="tc-btn tc-up" data-k="w" aria-label="forward">▲</button>
    <button class="tc-btn tc-left" data-k="a" aria-label="left">◀</button>
    <button class="tc-btn tc-right" data-k="d" aria-label="right">▶</button>
    <button class="tc-btn tc-down" data-k="s" aria-label="back">▼</button></div>`;
  document.body.appendChild(touchPad);
  touchPad.querySelectorAll('.tc-btn').forEach(btn=>{ const k=btn.dataset.k;
    const dn=e=>{ e.preventDefault(); keys[k]=true; btn.classList.add('on'); };
    const up=e=>{ e.preventDefault(); keys[k]=false; btn.classList.remove('on'); };
    btn.addEventListener('pointerdown',dn); btn.addEventListener('pointerup',up); btn.addEventListener('pointercancel',up); btn.addEventListener('pointerleave',up); });
  touchAct=document.createElement('button'); touchAct.id='tc-action'; touchAct.textContent='🏀'; touchAct.setAttribute('aria-label','shoot');
  document.body.appendChild(touchAct);
  touchAct.addEventListener('pointerdown',e=>{ e.preventDefault(); courtAction(); });
}

/* ---------- camera tween ---------- */
let tween=null, introDone=false, panelStation=null;
function easeInOut(t){ return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
function flyTo(pos,tgt,dur=1.2,onDone){ if(reduceMotion)dur=0.001; const p0=camera.position.clone();
  const l0=camera.position.clone().add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)));
  tween={p0,p1:new THREE.Vector3(...pos),l0,l1:new THREE.Vector3(...tgt),t:0,dur,onDone}; }
function updateTween(dt){ if(!tween)return; tween.t+=dt/tween.dur; const k=easeInOut(Math.min(tween.t,1));
  camera.position.lerpVectors(tween.p0,tween.p1,k); const l=new THREE.Vector3().lerpVectors(tween.l0,tween.l1,k); camera.lookAt(l);
  if(tween.t>=1){ lookFrom(tween.p1.toArray(),tween.l1.toArray()); const d=tween.onDone; tween=null; if(d)d(); } }

/* ---------- panel ---------- */
function setActive(id){ document.querySelectorAll('.content').forEach(c=>c.classList.remove('active')); const sec=document.getElementById('content-'+id); if(sec)sec.classList.add('active'); return sec; }
let returnView=null;
function currentView(){ const d=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(9);
  return { pos:camera.position.toArray(), tgt:camera.position.clone().add(d).toArray() }; }
function captureReturn(){ if(!panelStation && !courtMode && !document.body.classList.contains('flat')) returnView=currentView(); }
function openStation(id,pushHash=true){
  captureReturn(); closePaperDetail();                 // remember where we were; drop any open paper detail
  if(id==='publications') return openPublications();
  if(id.startsWith('papers-')){                        // paper-wall stations open the Publications panel at that topic
    if(introCard){ introCard.classList.remove('show'); introCard.classList.add('dismissed'); }
    openPublications(false); selectTopic(id.slice(7),false);
    const ps=stations.find(s=>s.id===id); if(ps&&!document.body.classList.contains('flat')) flyTo(ps.cam,ps.tgt,1.1);
    if(pushHash) history.replaceState(null,'','#'+id); return;
  }
  const st=stations.find(s=>s.id===id); if(!st && !document.getElementById('content-'+id)) return;
  const sec=setActive(id); if(!sec)return;
  if(id==='guestbook') gbLoad();
  if(introCard){ introCard.classList.remove('show'); introCard.classList.add('dismissed'); }
  panelIcon.textContent=sec.dataset.icon; panelTitle.textContent=sec.dataset.title;
  nav.querySelectorAll('button[data-target]').forEach(b=>b.classList.toggle('active',b.dataset.target===id||(id.startsWith('papers')&&b.dataset.target==='publications')));
  if(document.body.classList.contains('flat')){ sec.scrollIntoView({behavior:reduceMotion?'auto':'smooth'}); return; }
  introDone=true; fpStart.classList.remove('show'); hint.classList.add('faded');
  panelStation=st||{id}; document.body.classList.add('panel-open'); panel.classList.add('open'); scrim.classList.add('show');
  if(st) flyTo(st.cam,st.tgt,1.1);
  if(pushHash) history.replaceState(null,'','#'+id);
}
function openPublications(pushHash=true){ captureReturn(); const sec=setActive('publications'); if(introCard){ introCard.classList.remove('show'); introCard.classList.add('dismissed'); } panelIcon.textContent=sec.dataset.icon; panelTitle.textContent=sec.dataset.title;
  nav.querySelectorAll('button[data-target]').forEach(b=>b.classList.toggle('active',b.dataset.target==='publications'));
  if(document.body.classList.contains('flat')){ sec.scrollIntoView({behavior:'smooth'}); return; }
  introDone=true; fpStart.classList.remove('show'); hint.classList.add('faded');
  panelStation={id:'publications'}; document.body.classList.add('panel-open'); panel.classList.add('open'); scrim.classList.add('show');
  flyTo(PUBVIEW.cam,PUBVIEW.tgt,1.1);
  if(pushHash) history.replaceState(null,'','#publications');
}
function closePanel(){ if(!panelStation)return; const wasPub=panelStation.id==='publications'; panelStation=null;
  panel.classList.remove('open'); scrim.classList.remove('show'); document.body.classList.remove('panel-open');
  closePaperDetail(); nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
  history.replaceState(null,'',location.pathname);
  if(!document.body.classList.contains('flat') && !courtMode){ const rv=returnView; returnView=null;
    flyTo(rv?rv.pos:HOME.cam, rv?rv.tgt:HOME.tgt, 1.0); fpStart.classList.add('show'); }
}
document.getElementById('panel-close').addEventListener('click',closePanel);
scrim.addEventListener('click',closePanel);
addEventListener('keydown',e=>{ if(e.key==='Escape'){ if(document.querySelector('.pub-detail.open')) closePaperDetail(); else closePanel(); } });
nav.addEventListener('click',e=>{ const b=e.target.closest('button[data-target]'); if(b) openStation(b.dataset.target); });
fpStart.querySelector('button').addEventListener('click',()=>{ /* just a hint */ fpStart.classList.remove('show'); });

modeBtn.addEventListener('click',()=>{ const flat=document.body.classList.toggle('flat'); modeBtn.textContent=flat?'3D':'2D';
  if(flat){ closePaperDetail(); requestAnimationFrame(setNavH); panel.classList.remove('open'); scrim.classList.remove('show'); panelStation=null; document.body.classList.remove('panel-open'); document.querySelectorAll('.content').forEach(c=>c.classList.add('active')); }
  else { document.querySelectorAll('.content').forEach(c=>c.classList.remove('active')); if(introDone)fpStart.classList.add('show'); }
});

/* ---------- render NEWS + PUBLICATIONS from data ---------- */
(function renderNews(){ const ul=document.getElementById('news-list'); ul.innerHTML='';
  NEWS.forEach((n,i)=>{ const li=document.createElement('li'); li.innerHTML=`<time>${n.date}</time><span>${n.html}${i===0?'<span class="news-latest-tag">LATEST</span>':''}</span>`; ul.appendChild(li); }); })();

const pubTabs=document.getElementById('pub-tabs'), pubGrid=document.getElementById('pub-grid');
let curTopic='reasoning';
(function buildTabs(){ Object.entries(TOPICS).forEach(([k,t])=>{ const b=document.createElement('button'); b.className='pub-tab'; b.textContent=t.label; b.dataset.topic=k; b.style.setProperty('--c',t.color);
  b.addEventListener('click',()=>{ closePaperDetail(); selectTopic(k); }); pubTabs.appendChild(b); }); })();
function selectTopic(k,fly=true){ curTopic=k; const t=TOPICS[k];
  pubTabs.querySelectorAll('.pub-tab').forEach(b=>{ const on=b.dataset.topic===k; b.classList.toggle('active',on); b.style.background=on?t.color:''; });
  pubGrid.innerHTML='';
  PAPERS.filter(p=>p.topic===k).sort((a,b)=>(b.selected?1:0)-(a.selected?1:0)).forEach(p=>{ const card=document.createElement('div'); card.className='pub-card'+(p.selected?' is-selected':'');
    card.innerHTML=`<div class="pub-thumb" style="background:linear-gradient(150deg,${t.color},#12222f)"></div>
      <div class="pub-card-body"><span class="pub-badge" style="background:${t.color}">${p.venue}</span>
      <h5>${p.title}</h5><div class="auth">${p.authors.join(', ')}</div></div>`;
    const im=new Image(); im.onload=()=>{ const el=card.querySelector('.pub-thumb'); el.style.backgroundImage=`url(${paperImg(p)})`; el.style.backgroundSize='cover'; el.style.backgroundPosition='center'; }; im.src=paperImg(p);
    card.addEventListener('click',()=>openPaperDetail(p.key)); pubGrid.appendChild(card); });
  const stId='papers-'+k; const st=stations.find(s=>s.id===stId);
  if(fly && st && panelStation && !document.body.classList.contains('flat')) flyTo(st.cam,st.tgt,0.9);
}
selectTopic('reasoning',false);

/* ---------- glanceable overview card ---------- */
const introCard=document.getElementById('intro-card');
(function buildIntro(){ const wrap=document.getElementById('intro-topics');
  Object.entries(TOPICS).forEach(([k,t])=>{ const m=TOPIC_META[k]||{icon:'📄',blurb:''}; const n=PAPERS.filter(p=>p.topic===k).length;
    const tile=document.createElement('button'); tile.className='topic-tile'; tile.type='button';
    tile.style.background=`linear-gradient(150deg,${t.color},#12222f)`;
    // optional real picture per topic: images/topics/<key>.jpg
    const img=new Image(); img.onload=()=>{ tile.style.backgroundImage=`linear-gradient(180deg,rgba(0,20,40,.15),rgba(0,20,40,.55)),url(images/topics/${k}.jpg)`; tile.style.backgroundSize='cover'; tile.style.backgroundPosition='center'; }; img.src=`images/topics/${k}.jpg`;
    tile.innerHTML=`<div class="tt-top"><span class="tt-icon">${m.icon}</span><span class="tt-count">${n} papers</span></div><div class="tt-txt"><h3>${t.label}</h3><p>${m.blurb}</p></div>`;
    tile.addEventListener('click',()=>openStation('papers-'+k));
    wrap.appendChild(tile); });
  const nl=document.getElementById('intro-news'); if(NEWS[0]) nl.innerHTML=`<b>Latest:</b> ${NEWS[0].date} — ${NEWS[0].html}`;
})();
document.getElementById('intro-explore').addEventListener('click',dismissIntro);
document.querySelector('.hud-id').style.cursor='pointer';
document.querySelector('.hud-id').addEventListener('click',showIntro);
function showIntro(){ if(document.body.classList.contains('flat'))return; closePanel(); introCard.classList.remove('dismissed'); introCard.classList.add('show'); fpStart.classList.remove('show'); }
function dismissIntro(){ introCard.classList.remove('show'); introCard.classList.add('dismissed'); if(introDone && !panelStation) hint.classList.remove('faded'); }

/* paper detail overlay */
let detailEl=null;
const escH=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function bibtexOf(p){ const proc=/NeurIPS|ICLR|ICML|CVPR|ACL|AAAI|ICRA|MSN|EMNLP|NAACL|ECCV/.test(p.venue) && !/arXiv|Position/.test(p.venue);
  const type=proc?'inproceedings':'article';
  const authors=p.authors.filter(a=>a!=='et al.').map(a=>a.replace('*','')).join(' and ');
  const venLine=proc?`  booktitle={${p.venue}},`:`  journal={${p.venue.replace(/·.*/,'').trim()}},`;
  return `@${type}{${p.key},\n  title={${p.title}},\n  author={${authors}},\n${venLine}\n  year={${p.year}},\n}`; }
function openPaperDetail(key){ const p=PAPERS.find(x=>x.key===key); if(!p)return;
  if(!panelStation) openPublications(); else { setActive('publications'); panelIcon.textContent='📚'; panelTitle.textContent='Publications'; nav.querySelectorAll('button[data-target]').forEach(b=>b.classList.toggle('active',b.dataset.target==='publications')); if(!panel.classList.contains('open')){ panel.classList.add('open'); scrim.classList.add('show'); document.body.classList.add('panel-open'); panelStation={id:'publications'}; } }
  selectTopic(p.topic,false);
  const st=stations.find(s=>s.id==='papers-'+p.topic); if(st&&!document.body.classList.contains('flat')) flyTo(st.cam,st.tgt,0.9);
  closePaperDetail();
  const t=TOPICS[p.topic]; const links=[]; if(p.links.pdf)links.push(`<a class="btn" href="${p.links.pdf}" target="_blank" rel="noopener">PDF</a>`); if(p.links.code)links.push(`<a class="btn btn-ghost" href="${p.links.code}" target="_blank" rel="noopener">Code</a>`); if(p.links.web)links.push(`<a class="btn btn-ghost" href="${p.links.web}" target="_blank" rel="noopener">Project</a>`);
  links.push(`<button class="btn btn-ghost cite-btn" type="button">Cite ⌄</button>`);
  detailEl=document.createElement('div'); detailEl.className='pub-detail open';
  detailEl.innerHTML=`<button class="pub-detail-back">← Back to wall</button><div class="pub-detail-scroll">
    <img src="${paperImg(p)}" alt="" onerror="this.style.display='none'">
    <span class="pub-badge" style="background:${t.color}">${p.venue} · ${p.year}</span>
    <h3>${p.title}</h3>
    <p class="auth">${p.authors.map(a=>a.replace(/Zhiqin Yang\*?/,'<b>$&</b>')).join(', ')}</p>
    <p class="abstract">${p.abstract}</p>
    <div class="btn-row">${links.join('')}</div>
    <div class="bibtex-wrap" hidden><button class="copy-btn" type="button">Copy</button><pre class="bibtex">${escH(bibtexOf(p))}</pre></div></div>`;
  detailEl.querySelector('.pub-detail-back').addEventListener('click',closePaperDetail);
  const wrap=detailEl.querySelector('.bibtex-wrap'), citeBtn=detailEl.querySelector('.cite-btn');
  citeBtn.addEventListener('click',()=>{ const open=wrap.hasAttribute('hidden'); wrap.toggleAttribute('hidden'); citeBtn.textContent=open?'Cite ⌃':'Cite ⌄'; });
  detailEl.querySelector('.copy-btn').addEventListener('click',e=>{ navigator.clipboard?.writeText(bibtexOf(p)); e.target.textContent='Copied!'; setTimeout(()=>e.target.textContent='Copy',1400); });
  panel.appendChild(detailEl);
  const pb=document.getElementById('panel-body'); if(pb)pb.scrollTop=0;   // reset list to top so it isn't stuck scrolled
  const ds=detailEl.querySelector('.pub-detail-scroll'); if(ds)ds.scrollTop=0;
}
function setNavH(){ document.body.style.setProperty('--navh', document.getElementById('hud-top').offsetHeight+'px'); }
addEventListener('resize',()=>{ if(document.body.classList.contains('flat')) setNavH(); });
function closePaperDetail(){ if(detailEl){ detailEl.remove(); detailEl=null; } }

/* ---------- academic service + talks (from data.js) ---------- */
(function renderService(){ const b=document.getElementById('svc-body'); if(!b)return; const S=window.SITE.SERVICE||{};
  const block=(title,arr)=> (arr&&arr.length)?`<h4>${title}</h4><div class="chip-row">${arr.map(v=>`<span class="chip">${v}</span>`).join('')}</div>`:'';
  const html=block('Conference Reviewer',S.conference)+block('Journal Reviewer',S.journal);
  b.innerHTML = html || '<p style="color:var(--muted)">Add your reviewing venues in <code>js/data.js</code> (the <code>SERVICE</code> object).</p>';
})();
(function renderTalks(){ const ul=document.getElementById('talks-list'); if(!ul)return; const T=window.SITE.TALKS||[];
  ul.innerHTML = T.length ? T.map(t=>`<li><time>${t.date||''}</time> <b>${t.title||''}</b>${t.venue?` · ${t.venue}`:''}${t.link?` <a href="${t.link}" target="_blank" rel="noopener">↗</a>`:''}</li>`).join('')
    : '<li style="color:var(--muted)">Add talks in <code>js/data.js</code> (the <code>TALKS</code> array).</li>';
})();

/* ---------- guestbook (Supabase REST) ---------- */
const GB=window.SITE.GUESTBOOK||{};
function gbConfigured(){ return !!(GB.url && GB.anonKey); }
const gbEsc=s=>String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function gbFetch(){ const r=await fetch(`${GB.url}/rest/v1/${GB.table}?select=name,message,created_at&order=created_at.desc&limit=80`,{headers:{apikey:GB.anonKey,Authorization:`Bearer ${GB.anonKey}`}}); if(!r.ok)throw 0; return r.json(); }
async function gbPost(name,message){ const r=await fetch(`${GB.url}/rest/v1/${GB.table}`,{method:'POST',headers:{apikey:GB.anonKey,Authorization:`Bearer ${GB.anonKey}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name,message})}); if(!r.ok)throw 0; }
async function gbLoad(){ const list=document.getElementById('gb-list'); if(!list)return;
  if(!gbConfigured()){ list.innerHTML='<li class="gb-empty">The guestbook isn’t connected yet.<br><span>Owner: add your Supabase URL + anon key in <code>js/data.js</code> (see README).</span></li>'; return; }
  list.innerHTML='<li class="gb-empty">Loading…</li>';
  try{ const rows=await gbFetch(); list.innerHTML = rows.length? rows.map(r=>`<li><div class="gb-head"><b>${gbEsc(r.name)||'Anonymous'}</b><time>${(r.created_at||'').slice(0,10)}</time></div><p>${gbEsc(r.message)}</p></li>`).join('') : '<li class="gb-empty">No messages yet — be the first! 🌊</li>'; }
  catch(e){ list.innerHTML='<li class="gb-empty">Couldn’t load the guestbook.</li>'; } }
(function gbInit(){ const form=document.getElementById('gb-form'); if(!form)return;
  form.addEventListener('submit',async e=>{ e.preventDefault(); const st=document.getElementById('gb-status');
    const name=document.getElementById('gb-name').value.trim().slice(0,40)||'Anonymous';
    const msg=document.getElementById('gb-msg').value.trim().slice(0,280);
    if(!msg){ st.textContent='Write a message first.'; return; }
    if(!gbConfigured()){ st.textContent='Guestbook not connected yet.'; return; }
    st.textContent='Posting…';
    try{ await gbPost(name,msg); document.getElementById('gb-msg').value=''; st.textContent='Thanks for signing! 🌊'; gbLoad(); }
    catch(err){ st.textContent='Sorry — could not post.'; } });
})();

/* ---------- loader + intro ---------- */
let loadPct=0; const timer=setInterval(()=>{ loadPct=Math.min(100,loadPct+16+Math.random()*16); loadFill.style.width=loadPct+'%'; if(loadPct>=100){ clearInterval(timer); setTimeout(intro,250); } },110);
camera.position.set(0,4.3,6.8); lookFrom([0,4.3,6.8],HOME.tgt); applyLook();   // start INSIDE the room (no ugly exterior zoom)
function intro(){ loader.classList.add('done'); if(document.body.classList.contains('flat')){ introDone=true; return; }
  flyTo(HOME.cam,HOME.tgt,reduceMotion?0.001:1.2);
  setTimeout(()=>{ if(introDone)return; introDone=true; const id=location.hash.slice(1);
    if(id==='publications') openPublications(false);
    else if(id && (stations.some(s=>s.id===id)||document.getElementById('content-'+id))) openStation(id,false);
    else introCard.classList.add('show'); }, reduceMotion?60:1300); }

/* ---------- animate ---------- */
let last=performance.now();
function updateHotspots(){ for(const st of stations){ const v=st.anchorV.clone().project(camera); const off=v.z>1||panelStation||!introDone;
  st.dot.classList.toggle('hidden',off); if(off)continue; st.dot.style.left=(v.x*.5+.5)*innerWidth+'px'; st.dot.style.top=(-v.y*.5+.5)*innerHeight+'px'; } }
function animate(){ requestAnimationFrame(animate); const now=performance.now(); const dt=Math.min((now-last)/1000,0.05); last=now;
  updateTween(dt); updateWalk(dt); updateCourt(dt);
  if(!reduceMotion){ drawSea(now); seaTex.needsUpdate=true;
    const sg=window._seaGroup; if(sg){ if(sg.userData.boat){ sg.userData.boat.position.y=Math.sin(now*0.0008)*0.25; sg.userData.boat.rotation.z=Math.sin(now*0.0008)*0.04; sg.userData.boat.position.x=9+Math.sin(now*0.00012)*6; }
      if(sg.userData.gulls) sg.userData.gulls.children.forEach(g=>{ g.position.x+=0.01; if(g.position.x>18)g.position.x=-18; g.position.y+=Math.sin(now*0.002+g.userData.ph)*0.004; g.children[0].rotation.z=0.5+Math.sin(now*0.006+g.userData.ph)*0.3; g.children[1].rotation.z=-0.5-Math.sin(now*0.006+g.userData.ph)*0.3; }); } }
  updateHotspots();
  if(touchPad){ const show=introDone && !panelStation && !document.body.classList.contains('flat') && !introCard.classList.contains('show');
    touchPad.style.display=show?'block':'none'; touchAct.style.display=(show&&courtMode)?'block':'none'; }
  renderer.render(scene,camera); }
requestAnimationFrame(animate);

addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
if(document.body.classList.contains('flat')) requestAnimationFrame(setNavH);   // page may start in 2D (no WebGL)
