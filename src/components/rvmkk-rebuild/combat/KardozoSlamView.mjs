import * as THREE from '../vendor/three.module.mjs';
import { loadSpriteAsset, firstTexture } from './SpriteAssets.mjs';
import { drawKardozoSlam, slamTime, slamOptionsFor, SLAM_WORLD_SCALE, SLAM_ACTION_END } from './KardozoSlam.mjs';

// The existing stage/camera remain live: this transparent articulated actor replaces
// only the grappler and captured opponent, never the arena or its controls.
export class KardozoSlamView {
  static async create(scene,signal){
    const names={torso:'torso',upperArm:'upper-arm',forearm:'forearm',hand:'hand',thigh:'thigh',shin:'shin'};
    const results=await Promise.allSettled(Object.entries(names).map(async([key,name])=>[key,await loadSpriteAsset(`/assets/rvmkk-rebuild/combat/kardozo-slam-v2/${name}.png`,{signal})]));
    if(results.some(r=>r.status==='rejected')){for(const r of results)if(r.status==='fulfilled')r.value[1].dispose();throw new Error('Kardozo animation could not load. Retry the arena.');}
    const assets=Object.fromEntries(results.map(r=>[r.value[0],firstTexture(r.value[1]).image]));
    const view=new KardozoSlamView(scene,assets);view.sources=results.map(r=>r.value[1]);return view;
  }
  constructor(scene,assets){
    this.assets=assets;this.canvas=document.createElement('canvas');this.canvas.width=960;this.canvas.height=540;this.ctx=this.canvas.getContext('2d');if(!this.ctx)throw new Error('Kardozo animation canvas is unavailable. Retry the arena.');
    this.texture=new THREE.CanvasTexture(this.canvas);this.texture.colorSpace=THREE.SRGBColorSpace;
    this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(1600*SLAM_WORLD_SCALE,900*SLAM_WORLD_SCALE),new THREE.MeshBasicMaterial({map:this.texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
    this.mesh.renderOrder=9;this.mesh.visible=false;scene.add(this.mesh);this.scene=scene;
  }
  update(model,art,camera){
    const wasVisible=this.mesh.visible;
    this.mesh.visible=false;
    const cinematic=model.phase==='finisher';
    const winner=cinematic?model.fighters[model.result.matchWinner]:model.fighters.find(f=>f.move?.id==='four-slams'&&f.state==='active'&&f.grabTarget!==null);
    if(!winner||winner.definition.id!=='kardozo')return;
    if(!wasVisible||this.cinematic!==cinematic){
      const direction=new THREE.Vector3();camera.getWorldDirection(direction);
      const distance=-camera.position.z/direction.z;
      this.cameraStart={height:camera.top-camera.bottom,focusX:camera.position.x+direction.x*distance,focusY:camera.position.y+direction.y*distance};
    }
    this.cinematic=cinematic;
    const victim=model.fighters[1-winner.index];
    const source=art[victim.index].userData.atlases.base,frame=source.metadata.frames[0],texture=source.texture.frames?.[0]??source.texture;
    if(this.victimSource!==texture){
      const [x,y,w,h]=source.texture.frames?[0,0,texture.image.width,texture.image.height]:frame.rect;
      const cut=document.createElement('canvas');cut.width=w;cut.height=h;
      const ctx=cut.getContext('2d');ctx.drawImage(texture.image,x,y,w,h,0,0,w,h);
      // Remove atlas-cell padding before choosing the ankle and waist pivots.
      const pixels=ctx.getImageData(0,0,w,h).data;let left=w,top=h,right=0,bottom=0;
      for(let py=0;py<h;py++)for(let px=0;px<w;px++)if(pixels[(py*w+px)*4+3]>8){left=Math.min(left,px);right=Math.max(right,px+1);top=Math.min(top,py);bottom=Math.max(bottom,py+1);}
      if(right>left&&bottom>top){const trimmed=document.createElement('canvas');trimmed.width=right-left;trimmed.height=bottom-top;trimmed.getContext('2d').drawImage(cut,left,top,trimmed.width,trimmed.height,0,0,trimmed.width,trimmed.height);this.assets.opponent=trimmed;}else this.assets.opponent=cut;
      const outline=[];
      if(right>left&&bottom>top){
        const rows=new Set([top,bottom-1]);for(let py=top;py<bottom;py+=Math.max(1,Math.floor((bottom-top)/72)))rows.add(py);
        for(const py of rows){let lo=right,hi=left;for(let px=left;px<right;px++)if(pixels[(py*w+px)*4+3]>8){lo=Math.min(lo,px);hi=Math.max(hi,px+1);}if(hi>lo)for(const px of [lo,hi])outline.push({u:(px-left)/(right-left),q:(py-top+.5)/(bottom-top)});}
      }
      this.assets.opponentOutline=outline.length?outline:undefined;
      this.victimSource=texture;
    }
    const time=cinematic?model.finishClock:slamTime(winner.move.active-winner.clock,winner.move.active);
    const options={...slamOptionsFor(winner,victim,cinematic),opponentWidthRatio:this.assets.opponent.width/this.assets.opponent.height};
    drawKardozoSlam(this.ctx,this.assets,time,{width:960,height:540,background:false,reducedMotion:this.reducedMotion,...options});this.texture.needsUpdate=true;
    this.mesh.scale.x=winner.facing;this.mesh.visible=true;
    this.focusX=winner.x;this.time=time;this.duration=cinematic?10:SLAM_ACTION_END;
    art[winner.index].visible=false;art[victim.index].visible=false;
  }
  orient(camera){
    if(!this.mesh.visible)return;
    this.mesh.quaternion.copy(camera.quaternion);
    // Billboard around the floor contact, rather than around the canvas center.
    const foot=new THREE.Vector3(0,(450-700)*SLAM_WORLD_SCALE,0).applyQuaternion(this.mesh.quaternion);
    this.mesh.position.set(this.focusX-foot.x,-foot.y,.18-foot.z);
  }
  dispose(){this.scene.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.texture.dispose();this.sources?.forEach(s=>s.dispose());}
}
