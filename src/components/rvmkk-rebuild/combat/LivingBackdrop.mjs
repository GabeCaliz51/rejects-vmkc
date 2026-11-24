import * as THREE from '../vendor/three.module.mjs';
import { createStageFloor } from './StageFloor.mjs';
import { StageDirector } from './StageDirector.mjs';
import { paintStageGags, STAGE_EXTRA_ART } from './StageGags.mjs';

const VERTEX = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAGMENT = `
uniform sampler2D uMap;
uniform float uTime;
uniform float uMotion;
uniform float uReaction;
uniform float uImageAspect;
uniform vec2 uCover;
uniform vec4 uZones[6];
uniform vec4 uMoves[6];
uniform vec4 uLights[4];
uniform vec3 uColors[4];
varying vec2 vUv;
void main() {
  vec2 original = (vUv - 0.5) * uCover + 0.5;
  original.x = 1.0 - abs(mod(original.x, 2.0) - 1.0);
  vec2 sampleUv = original;
  for (int i = 0; i < 6; i++) {
    vec4 zone = uZones[i];
    vec4 move = uMoves[i];
    vec2 d = original - zone.xy;
    float mask = 1.0 - smoothstep(0.35, 1.0, length(d / max(zone.zw, vec2(0.0001))));
    float wave = sin(uTime * move.w + float(i) * 1.7);
    float angle = wave * move.z * uMotion * (1.0 + uReaction * 1.3);
    vec2 metric = d * vec2(uImageAspect, 1.0);
    vec2 turned = vec2(cos(angle)*metric.x - sin(angle)*metric.y, sin(angle)*metric.x + cos(angle)*metric.y);
    sampleUv += ((turned - metric) / vec2(uImageAspect,1.0) + move.xy * wave * uMotion) * mask;
  }
  vec4 color = texture2D(uMap, clamp(sampleUv, 0.001, 0.999));
  for (int i = 0; i < 4; i++) {
    vec4 lamp = uLights[i];
    float glow = 1.0 - smoothstep(0.0, 1.0, length((original - lamp.xy) / max(lamp.zw,vec2(0.0001))));
    float pulse = (0.4 + 0.3 * sin(uTime * (1.4 + float(i)*0.3) + float(i)*2.3)) * uMotion;
    color.rgb += uColors[i] * glow * pulse * 0.095;
  }
  float edge = smoothstep(0.0,.075,original.x) * smoothstep(0.0,.075,1.0-original.x);
  float base = smoothstep(.20,.30,original.y);
  gl_FragColor = vec4(color.rgb,base);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class LivingBackdrop {
  constructor(camera, stage, { reducedMotion = false } = {}) {
    this.camera=camera;this.stage=stage;this.reducedMotion=reducedMotion;
    this.director=new StageDirector(stage);this.textures=[];this.images=[];this.lastPaint=-Infinity;
    this.assets=[stage.art];if(STAGE_EXTRA_ART[stage.id])this.assets.push(STAGE_EXTRA_ART[stage.id]);
    this.cover=new THREE.Vector2(1,1);this.projected=new THREE.Vector3();
    this.group=new THREE.Group();this.group.position.set(0, 1.75, -6);camera.parent.add(this.group);
    this.raycaster=new THREE.Raycaster();this.plane=new THREE.Plane(new THREE.Vector3(0,0,1),6);this.hit=new THREE.Vector3();
    const zones=Array.from({length:6},(_,i)=>{const b=stage.motions[i]?.box;return b?new THREE.Vector4(b[0],1-b[1],b[2],b[3]):new THREE.Vector4(0,0,.0001,.0001);});
    const moves=Array.from({length:6},(_,i)=>{const m=stage.motions[i]?.move;return m?new THREE.Vector4(m[0]*2.5,-m[1]*2.5,m[2]*2,m[3]):new THREE.Vector4();});
    const lamps=Array.from({length:4},(_,i)=>{const b=stage.lights[i]?.box;return b?new THREE.Vector4(b[0],1-b[1],b[2],b[3]):new THREE.Vector4(0,0,.0001,.0001);});
    const colors=Array.from({length:4},(_,i)=>new THREE.Color(stage.lights[i]?.color || '#000000'));
    this.material=new THREE.ShaderMaterial({vertexShader:VERTEX,fragmentShader:FRAGMENT,uniforms:{uMap:{value:null},uTime:{value:0},uMotion:{value:reducedMotion?.25:1},uReaction:{value:0},uImageAspect:{value:16/9},uCover:{value:this.cover},uZones:{value:zones},uMoves:{value:moves},uLights:{value:lamps},uColors:{value:colors}},transparent:true,depthTest:true,depthWrite:false,fog:false,toneMapped:false});
    this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),this.material);this.mesh.renderOrder=-100;this.mesh.frustumCulled=false;this.group.add(this.mesh);
    this.canvas=document.createElement('canvas');this.canvas.width=1024;this.canvas.height=576;
    this.context=this.canvas.getContext('2d');if(!this.context)throw new Error('The animated arena could not create its drawing surface.');
    this.overlayMap=new THREE.CanvasTexture(this.canvas);this.overlayMap.colorSpace=THREE.SRGBColorSpace;
    this.overlayMap.minFilter=THREE.LinearFilter;this.overlayMap.magFilter=THREE.LinearFilter;this.overlayMap.generateMipmaps=false;
    this.overlayMaterial=new THREE.MeshBasicMaterial({map:this.overlayMap,transparent:true,depthTest:true,depthWrite:false,fog:false,toneMapped:false});
    this.overlay=new THREE.Mesh(new THREE.PlaneGeometry(1,1),this.overlayMaterial);this.overlay.position.z=.01;this.overlay.renderOrder=-90;this.overlay.frustumCulled=false;this.group.add(this.overlay);
  }

  setTextures(textures) {
    this.textures=textures;this.images=textures.map(texture=>texture.image);
    const first=textures[0];first.colorSpace=THREE.SRGBColorSpace;first.minFilter=THREE.LinearFilter;first.magFilter=THREE.LinearFilter;first.generateMipmaps=false;
    this.imageAspect=first.image.width/first.image.height;this.material.uniforms.uImageAspect.value=this.imageAspect;this.material.uniforms.uMap.value=first;
    this.disposeFloor?.();this.disposeFloor=createStageFloor(this.camera.parent,first,this.stage);
    this.paint(true);
  }

  sourcePoint(screenU, screenV) {
    this.raycaster.setFromCamera(new THREE.Vector2(screenU*2-1,1-screenV*2),this.camera);
    if(!this.raycaster.ray.intersectPlane(this.plane,this.hit))return [.5,.5];
    return [this.hit.x/(this.sourceWidth||6.1*(this.imageAspect||16/9))+.5,.5-(this.hit.y-1.75)/(this.sourceHeight||6.1)];
  }
  worldPoint(x,y=1.4) {
    this.projected.set(x,y,0).project(this.camera);
    return this.sourcePoint((this.projected.x+1)/2,(1-this.projected.y)/2);
  }

  event(event, model) {
    const [u,v]=this.worldPoint(event.x,event.y);
    this.director.impact(event,u,v,model.phase);
  }

  tap(screenU,screenV,model) {
    if(model.paused)return false;
    return this.director.tap(...this.sourcePoint(screenU,screenV),model.phase);
  }

  update(delta, model, canvas) {
    const frustumWidth=this.camera.right-this.camera.left;
    const frustumHeight=this.camera.top-this.camera.bottom;
    const height=Math.max(6.1,frustumHeight*1.55);
    const width=Math.max(height*(this.imageAspect||16/9),frustumWidth*1.35+Math.abs(this.camera.position.x)*2);
    this.group.scale.set(width,height,1);
    this.sourceWidth=width;this.sourceHeight=height;
    this.cover.set(Math.max(1,width/(height*(this.imageAspect||16/9))),1);
    this.director.update(delta,model.phase);
    if(delta>0&&!model.paused)this.director.proximity(model.fighters.map(f=>this.worldPoint(f.x)),model.phase);
    this.material.uniforms.uTime.value=this.director.time;this.material.uniforms.uReaction.value=this.director.pulse;
    this.paint();
    canvas.dataset.stageId=this.stage.id;
    canvas.dataset.fighterScale="1.18";canvas.dataset.scenerySpace="world";
    canvas.dataset.backgroundTime=this.director.time.toFixed(3);
    canvas.dataset.backgroundGag=this.director.active?.id||'';
    canvas.dataset.backgroundSource=this.director.lastSource;
    canvas.dataset.backgroundReactions=String(this.director.reactions);
    canvas.dataset.backgroundSerial=String(this.director.serial);
  }

  paint(force=false) {
    if(!this.images.length)return;
    if(!force&&this.director.time-this.lastPaint<1/15)return;
    paintStageGags(this.context,this.stage,this.director,this.images,this.reducedMotion);
    this.overlayMap.needsUpdate=true;this.lastPaint=this.director.time;
  }

  reset() { this.director.reset();this.lastPaint=-Infinity;this.paint(true); }
  dispose() {
    this.disposeFloor?.();this.group.removeFromParent();this.mesh.geometry.dispose();this.overlay.geometry.dispose();
    this.material.dispose();this.overlayMaterial.dispose();this.overlayMap.dispose();
    this.textures.forEach(texture=>texture.dispose());this.textures=[];this.images=[];
    this.canvas.width=1;this.canvas.height=1;
  }
}
