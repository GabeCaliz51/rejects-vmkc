import {firstTexture,sampleGrid} from './SpriteAssets.mjs';
import * as THREE from '../vendor/three.module.mjs';
import {setPoseUV} from './AttackAnimation.mjs';
function sprite(texture){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:firstTexture(texture),transparent:true,alphaTest:.2,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));m.renderOrder=9;return m;}
export class PersonalityVisuals{
 constructor(scene,model,textures){this.model=model;this.root=new THREE.Group();scene.add(this.root);this.minions=textures.minions?Array.from({length:3},()=>sprite(textures.minions)):[];this.pets=textures.pets?Array.from({length:7},()=>sprite(textures.pets)):[];this.textures=textures;this.root.add(...this.minions,...this.pets);}
 update(){const model=this.model,gare=model.fighters.find(f=>f.definition.id==='gare-chi'),da=model.fighters.find(f=>f.definition.id==='datennisha-blaze');
  const assisting=gare?.move?.kind==='minions',applaud=gare?.emote==='win';
  for(const [i,m] of this.minions.entries()){
   m.visible=!!(assisting||applaud)&&!model.bossBattle;if(!m.visible)continue;
   const other=model.fighters[1-gare.index],t=assisting?(gare.state==='startup'?0:gare.state==='active'?gare.move.active-gare.clock:5.5+gare.move.recovery-gare.clock):0;
   const exit=t>5.5,frame=applaud?3:exit?2:t>1?1:0,tex=this.textures.minions;
   sampleGrid(m,tex,4,3,i*4+frame);
   let x=applaud?gare.x-gare.facing*(1+i*.55):t<1?gare.x+gare.facing*(t*2-i*.5):other.x+Math.sin(t*3+i*2)*.6;
   if(exit)x+=(i===1?-gare.facing:gare.facing)*(t-5.5)*6;
   m.position.set(Math.max(-11,Math.min(11,x)),1.12+Math.sin(t*7+i)*.035,.4+i*.04);m.scale.set(2.25*(exit&&i===1?-gare.facing:gare.facing),2.25,1);
  }
  for(const [i,m] of this.pets.entries()){
   const intro=da?.emote==='intro',active=da&&Number.isFinite(da.petClock)&&da.petClock<2.8;
   m.visible=!!(intro||active)&&!model.bossBattle;if(!m.visible)continue;
   const t=intro?da.emoteTime:da.petClock,frame=i*2+Number(!intro&&t<.65),tex=this.textures.pets;
   sampleGrid(m,tex,4,4,frame);
   const other=model.fighters[1-da.index];let x=da.x+(i-3)*.23;
   if(!intro&&t>.65)x=da.x+(other.x-da.x)*Math.min(1,(t-.65)/.7)+(i-3)*.14;
   if(t>1.8)x+=(i%2?1:-1)*(t-1.8)*6;
   m.position.set(x,.22+Math.abs(Math.sin(t*9+i))*.04,.5+i*.005);m.scale.set(.55,.45,1);
  }
 }
 dispose(){this.root.removeFromParent();for(const m of [...this.minions,...this.pets]){m.geometry.dispose();m.material.dispose();}}
}
