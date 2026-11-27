import * as THREE from '../vendor/three.module.mjs';
import {finisherFor,cinematicLayout} from './Fucktalities.mjs';
const C=t=>Math.max(0,Math.min(1,t));
const material=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:opacity===1});
function mesh(g,geometry,m,x=0,y=0,z=0){const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);g.add(o);return o;}
function box(g,m,x,y,z,w,h,d=.1){return mesh(g,new THREE.BoxGeometry(w,h,d),m,x,y,z);}
function sphere(g,m,x,y,z,r){return mesh(g,new THREE.SphereGeometry(r,12,10),m,x,y,z);}
function stroke(g,points,color,width=1){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,linewidth:width}));g.add(line);return line;}
function setStroke(line,a,b){const p=line.geometry.attributes.position;p.setXYZ(0,a[0],a[1],a[2]??0);p.setXYZ(1,b[0],b[1],b[2]??0);p.needsUpdate=true;line.geometry.computeBoundingSphere();}
function pizza(g){const p=new THREE.Group();g.add(p);mesh(p,new THREE.CylinderGeometry(.7,.7,.08,28),material(0xbc7630)).rotation.x=Math.PI/2;mesh(p,new THREE.CylinderGeometry(.62,.62,.02,28),material(0xf6c74f),0,0,.055).rotation.x=Math.PI/2;for(let i=0;i<9;i++)sphere(p,material(0xa32c22),Math.cos(i*2.4)*.42,Math.sin(i*2.4)*.42,.09,.085);return p;}
function skull(g){const s=new THREE.Group();g.add(s);const bone=material(0x302735,.92),black=material(0x030206),teeth=material(0x968499);sphere(s,bone,0,.1,0,.23);sphere(s,black,-.09,.14,.19,.065);sphere(s,black,.09,.14,.19,.065);box(s,black,0,.02,.22,.045,.06);const jaw=new THREE.Group();s.add(jaw);for(let i=0;i<5;i++)box(jaw,teeth,(i-2)*.055,-.1,.19,.035,.11);s.userData.jaw=jaw;return s;}
function scooter(g){const s=new THREE.Group();g.add(s);const black=material(0x15151b),chrome=material(0xb5bec9),blue=material(0x23619a),tan=material(0xc9a06b);for(const x of [-.85,.85]){mesh(s,new THREE.TorusGeometry(.32,.1,10,24),black,x,.4,.1);mesh(s,new THREE.CircleGeometry(.21,18),chrome,x,.4,.11);}box(s,blue,0,.7,0,1.8,.35,.38);box(s,blue,.68,1.05,0,.35,1,.4);box(s,black,-.3,1.05,0,.85,.18,.5);stroke(s,[[.7,1.4,0],[.7,1.8,0],[.35,1.8,0]],0xb5bec9);sphere(s,material(0xffeec2),.85,1.4,.2,.14);for(let i=0;i<5;i++)box(s,tan,-.85,1.25+i*.16,0,.9,.14,.7);return s;}
export class FinisherVfx{
 constructor(scene,model,{reducedMotion=false}={}){this.model=model;this.reducedMotion=reducedMotion;this.group=new THREE.Group();scene.add(this.group);this.group.visible=false;this.id=null;this.parts=[];}
 clear(){const geometries=new Set(),materials=new Set();this.group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});this.group.clear();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.parts=[];this.discs=[];this.skulls=[];this.smoke=[];}
 build(id){this.clear();this.newcomer=null;this.id=id;const white=material(0xc9ded9),steel=material(0x8b969e),black=material(0x14151c),blue=material(0x2199e3),spec=finisherFor(id);this.main=new THREE.Group();this.group.add(this.main);
  if(spec.prop==='curtain'){
   this.curtain=new THREE.Group();this.main.add(this.curtain);
   // The opaque folds hide the medical gag. Only the actor's silhouette is shown.
   for(let i=0;i<21;i++)box(this.curtain,material(i%2?0xadc7c3:0xc4d9d2),-.9+i*.19,2.05,1.25,.2,3.5,.055);
   for(const x of [-1.05,3.05]){box(this.curtain,steel,x,2.1,1.2,.055,4.1);box(this.curtain,steel,x,.1,1.2,.65,.06);}
   box(this.curtain,steel,1,4.15,1.2,4.2,.06);
   box(this.curtain,white,1,1,-.1,2.4,.2,.9);for(const x of [0,2])box(this.curtain,steel,x,.5,0,.08,1);
   this.shadow=new THREE.Group();this.curtain.add(this.shadow);const shade=material(0x26363a,.65);sphere(this.shadow,shade,0,0,1.32,.24);const back=box(this.shadow,shade,.35,-.35,1.32,.45,.9);back.rotation.z=.8;box(this.shadow,shade,.58,-.9,1.32,.14,.8);box(this.shadow,shade,-.1,-.65,1.32,.14,.7);
   this.necklace=new THREE.Group();this.main.add(this.necklace);for(let i=0;i<32;i++){const a=i/32*Math.PI*2;const b=sphere(this.necklace,material(i%2?0x42291a:0x26160f),Math.cos(a)*.5,Math.sin(a)*.9,0,.085);b.scale.y=1.25;}
  }
  if(spec.prop==='delivery'){
   this.discs=[pizza(this.main),pizza(this.main)];this.bike=scooter(this.main);this.vest=new THREE.Group();this.main.add(this.vest);box(this.vest,black,-.24,0,0,.4,.85);box(this.vest,black,.24,0,0,.4,.85);for(const x of [-.43,-.07,.07,.43])stroke(this.vest,[[x,-.4,.08],[x,.4,.08]],0x2784d4);for(const y of [-.35,.35])stroke(this.vest,[[-.43,y,.08],[.43,y,.08]],0x2784d4);
   for(let i=0;i<15;i++){const p=sphere(this.main,material(0x9fabb3,.28),0,0,.8,.18+i%3*.08);this.smoke.push(p);}
  }
  if(spec.prop==='skulls'){for(let i=0;i<7;i++)this.skulls.push(skull(this.main));this.eyes=[sphere(this.main,blue,-1.9,2.6,.6,.045),sphere(this.main,blue,-1.7,2.6,.6,.045)];}
  if(spec.prop==='lightning'){
   this.bolts=[];for(let j=0;j<7;j++){const points=Array.from({length:16},(_,i)=>[-1.8+i*.4,1.6+Math.sin(i*2.4+j)*.27, .6+j*.01]);this.bolts.push(stroke(this.main,points,0x7bdbff));}
   this.wall=box(this.main,material(0x5798bf,.32),4.65,2,-.1,.22,4.5);this.wall.visible=false;
  }
  if(['tongue','chain','poses'].includes(spec.prop)){
    this.newcomer=new THREE.Group();this.main.add(this.newcomer);
    const c=spec.color;
    for(let i=0;i<13;i++){
      const x=-1.5+i*.22;
      if(spec.prop==='tongue'){
        const coil=mesh(this.newcomer,new THREE.TorusGeometry(.25+i*.006,.035,8,26),material(c,.82),x,0,.8);
        coil.rotation.y=Math.PI/2;
      } else if(spec.prop==='chain'){
        const link=mesh(this.newcomer,new THREE.TorusGeometry(.13,.038,8,16),material(i%2?0xe9c488:0x606473),x,0,.8);
        link.rotation.y=Math.PI/2;
      }else{
        const streak=box(this.newcomer,material(c,.2+i/60),x,0,.8,.10,.45);
        streak.rotation.z=Math.sin(i*2)*.27;
      }
    }
  }
  if(spec.prop==='overkill'){this.grips=[];for(let i=0;i<4;i++)this.grips.push(stroke(this.main,[[0,0,.9],[0,0,.9]],spec.color,1));this.gripRing=mesh(this.main,new THREE.RingGeometry(.35,.43,36),material(spec.color,.72),0,0,.75);this.impact=new THREE.Group();this.main.add(this.impact);for(let i=0;i<18;i++){const a=i*Math.PI/9;stroke(this.impact,[[Math.cos(a)*.15,Math.sin(a)*.15,.75],[Math.cos(a)*.95,Math.sin(a)*.95,.75]],spec.color);}}\n  if(spec.prop==='armbreak'){this.impact=new THREE.Group();this.main.add(this.impact);for(let i=0;i<12;i++){const a=i*Math.PI/6;stroke(this.impact,[[Math.cos(a)*.2,Math.sin(a)*.2,0],[Math.cos(a)*.8,Math.sin(a)*.8,0]],spec.color);}}
 }
 update(actors=[]){const m=this.model,active=m.phase==='finisher';this.group.visible=active;if(!active)return;const id=m.fighters[m.result.matchWinner].definition.id;if(id!==this.id)this.build(id);const t=m.finishClock,film=cinematicLayout(id,t),spec=finisherFor(id);this.main.visible=true;
  if(spec.prop==='curtain'){
   this.curtain.visible=t>=.6;this.curtain.scale.x=C((t-.6)/.9);this.shadow.position.set(1.1+Math.sin(t*29)*(t>=3.5&&t<7.7?.065:0),2.15,0);
   this.necklace.visible=t>=3.5;const pull=((t-3.5)%1.4)/1.4;this.necklace.position.set(t<7.7?-.65-Math.sin(pull*Math.PI)*.75:-1.6,t<7.7?2:2.9,1.7);this.necklace.scale.set(t<7.7?.45+Math.sin(pull*Math.PI)*.5:.75,t<7.7?.4:1,1);
  }
  if(spec.prop==='delivery'){
   this.discs.forEach((p,i)=>{const q=C((t-.6-i*.85)/.65);p.visible=t>.6+i*.85&&t<3.4;p.position.set(-2+q*3.2,1.35+i*.9,.5);p.rotation.z=t*12;});
   this.bike.visible=t>=5;this.bike.position.set(film.winner.x,.02,.6);this.vest.visible=t>=5;this.vest.position.set(film.winner.x,2.05,1);this.vest.scale.set(.85,.85,1);
   this.smoke.forEach((p,i)=>{const q=C((t-6.2-i*.04)/1.6);p.visible=t>=6.2+i*.04&&t<9.5;p.position.set(-2+i*.17, .3+q*(.7+i%4*.15),.9);p.scale.setScalar(.5+q*3);p.material.opacity=(1-q)*.4;});
   if(t>=3.4&&actors.length)this.updatePieces(actors[1-m.result.matchWinner],t);
   for(const p of this.parts)p.visible=t>=3.4;
  }
  if(spec.prop==='skulls'){
   this.eyes.forEach(p=>p.visible=t<3.3);
   this.skulls.forEach((s,i)=>{const q=C((t-2-i*.15)/2.2);s.visible=t>=2+i*.15&&t<8.9;const chase=t>4.5;s.position.set(chase?film.loser.x+Math.cos(t*5+i)*.65:-1.8+q*(film.loser.x+1.8),chase?.65+Math.abs(Math.sin(t*6+i))*.7:2.6-q*1.7,.7);s.rotation.z=Math.sin(t*5+i)*.2;s.userData.jaw.position.y=-Math.abs(Math.sin(t*9+i))*.1;s.scale.setScalar(.65+q*.5);});
  }
  if(spec.prop==='lightning'){
   this.bolts.forEach((b,i)=>{b.visible=t>=2.5&&t<8.2;b.position.set(t<3.4?0:film.winner.x+1.8,(i-3)*.07,0);b.scale.x=t<3.4?.3:.48;b.material.opacity=this.reducedMotion?.7:.7+Math.sin(t*10+i)*.12;b.material.transparent=true;});this.wall.visible=t>=7.3;this.wall.scale.y=1+Math.sin(t*12)*.03;
  }
  if(this.newcomer){
    this.newcomer.visible=t>=1.8&&t<9.2;
    this.newcomer.position.set(-1.0+Math.min(1,Math.max(0,(t-2)/5))*1.4,1.6,.8);
    this.newcomer.scale.set(.6+Math.min(1,Math.max(0,(t-2)/5)),.7+Math.sin(t*10)*.10,1);
    this.newcomer.rotation.z=spec.prop==='poses'?Math.sin(t*7)*.15:Math.sin(t*5)*.04;
  }
  if(spec.prop==='overkill'){
   const winner=film.winner,loser=film.loser,grab=C(t/1.6),spin=C((t-1.6)/6.2);
   const handOffsets=[[-.92,2.25],[.92,2.25],[-.78,1.02],[.78,1.02]];
   this.grips.forEach((line,i)=>{line.visible=t<8.0;const a=[winner.x+handOffsets[i][0]*grab,handOffsets[i][1]*grab,.92];const angle=(t-1.6)*3.4+i*Math.PI/2;const b=[loser.x+Math.cos(angle)*.52,loser.y+.45+Math.sin(angle)*.32,.92];setStroke(line,a,b);line.material.opacity=.55+.35*grab;line.material.transparent=true;});
   this.gripRing.visible=t>=1.25&&t<7.95;this.gripRing.position.set(loser.x,loser.y+.55,.76);this.gripRing.rotation.z=t*4.2;this.gripRing.scale.setScalar(.65+spin*.9);
   this.impact.visible=t>=7.8&&t<9.0;this.impact.position.set(loser.x,Math.max(.35,loser.y),.78);this.impact.scale.setScalar(.55+C((t-7.8)/.55)*1.35);
  }
  if(spec.prop==='armbreak'){
   this.impact.visible=t>=3.9&&t<4.3||t>=4.8&&t<7.8&&Math.sin(t*20)>.25;this.impact.position.set(t<4.8?-.2:.85,t<4.8?1.9:2.5,.7);this.impact.scale.setScalar(.45);
  }
 }
 updatePieces(source,t){
  if(!this.parts.length)for(let i=0;i<3;i++){const part=new THREE.Mesh(new THREE.PlaneGeometry(1,1),source.material.clone());part.renderOrder=5;this.group.add(part);this.parts.push(part);}
  const uv=source.geometry.attributes.uv;
  this.parts.forEach((p,i)=>{p.material.map=source.material.map;p.material.color.set(0xffffff);const target=p.geometry.attributes.uv;
   for(let v=0;v<4;v++){const x=uv.getX(v),lo=uv.getY(2),hi=uv.getY(0);target.setXY(v,x,lo+(hi-lo)*((2-i+(v<2?1:0))/3));}target.needsUpdate=true;
   const q=C((t-3.4)/1.3);p.scale.set(Math.abs(source.scale.x),Math.abs(source.scale.y)/3,1);p.position.set(1.1+(i-1)*q*.8,(1-q)*(3-i)*.8+.25,.15+i*.05);p.rotation.z=q*(i%2?-1:1)*Math.PI/2+(t>7?Math.sin(t*18+i)*.04:0);
  });
 }
 orient(camera){for(const [i,p] of this.parts.entries()){const angle=p.rotation.z;p.quaternion.copy(camera.quaternion);p.rotateZ(angle);}}
 reset(){this.group.visible=false;}
 dispose(){this.clear();this.group.removeFromParent();}
}
