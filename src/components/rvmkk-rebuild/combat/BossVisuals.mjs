import {firstTexture,sampleGrid} from './SpriteAssets.mjs';
import * as THREE from '../vendor/three.module.mjs';
import {setPoseUV} from './AttackAnimation.mjs';
export class BossVisuals {
 constructor(scene,model,texture){this.model=model;this.texture=texture;this.root=new THREE.Group();scene.add(this.root);this.dogs=[0,1].map(row=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:firstTexture(texture),transparent:true,alphaTest:.2,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));mesh.userData.row=row;mesh.renderOrder=10;this.root.add(mesh);return mesh;});this.aura=new THREE.Mesh(new THREE.RingGeometry(.9,1.03,48),new THREE.MeshBasicMaterial({color:0xffca59,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));this.aura.rotation.x=-Math.PI/2;this.root.add(this.aura);}
 update(){const b=this.model.fighters.find(f=>f.definition.id==='x-man');if(!b)return;const d=this.model.fighters[1-b.index],transform=this.model.phase==='bossTransform';this.aura.visible=transform;this.aura.position.set(b.x,.03,0);this.aura.material.opacity=transform?.3+Math.sin(this.model.bossClock*12)*.2:0;this.aura.scale.setScalar(1+(this.model.bossClock%1)*2);
 const summoned=b.move?.kind==='dogs'&&['startup','active','recovery'].includes(b.state);
 for(const [i,dog] of this.dogs.entries()){
  dog.visible=summoned;if(!summoned)continue;
  const t=b.state==='startup'?-(b.clock/.6):b.state==='active'?b.move.active-b.clock:7.2+(b.move.recovery-b.clock);
  let frame=t>7.2?3:t>5.8?2:t<0?0:1;
  sampleGrid(dog,this.texture,4,2,i*4+frame);
  let x=t<0?b.x+(i===0?-1.2:1.2):t<2.8?d.x+(i===0?.7:-.7):t<5.8?d.x-b.facing*(.7+i*.5):b.x+(i===0?-1:1);
  if(t>7.2)x+=(i===0?-1:1)*(t-7.2)*10;
  const y=t<0?Math.max(0,-t*6):frame===1?Math.abs(Math.sin(t*20+i))*.06:0;
  dog.position.set(x,y+.62,.3+i*.05);dog.scale.set(1.45*(b.facing<0?-1:1),1.2,1);
 }
 }
 dispose(){this.root.removeFromParent();for(const mesh of [...this.dogs,this.aura]){mesh.geometry.dispose();mesh.material.dispose();}}
}
