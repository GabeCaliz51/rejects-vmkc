import * as THREE from '../vendor/three.module.mjs';
// Stage-matched ground: take the live color from the bottom of the supplied
// arena art, then apply a location-specific surface (street, wood, tile, etc.).
// This keeps perspective grounded without projecting background characters
// and props onto the playing floor.
export const FLOOR_VERTEX_SHADER=`
varying vec2 vGround;
void main(){
  vec4 world=modelMatrix*vec4(position,1.);
  vGround=world.xz;
  gl_Position=projectionMatrix*viewMatrix*world;
}`;
export const FLOOR_FRAGMENT_SHADER=`
uniform sampler2D uMap;
uniform vec3 uTint;
uniform float uPattern;
varying vec2 vGround;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  // The image itself supplies the color of its foreground/floor area.
  vec3 picture=(texture2D(uMap,vec2(.18,.085)).rgb
    +texture2D(uMap,vec2(.42,.09)).rgb
    +texture2D(uMap,vec2(.72,.085)).rgb
    +texture2D(uMap,vec2(.84,.095)).rgb)*.25;
  float brightness=dot(picture,vec3(.299,.587,.114));
  vec3 ground=mix(uTint,picture,.35)*(.8+brightness*.28);
  vec2 cellCoord;
  if(uPattern<.5){ // uneven alley asphalt
    cellCoord=vGround*vec2(.9,1.6);
  }else if(uPattern<1.5){ // polished courtroom stone slabs
    cellCoord=vGround/vec2(2.1,1.25);
  }else if(uPattern<2.5){ // discount-store square vinyl tiles
    cellCoord=vGround/vec2(.85,.85);
  }else if(uPattern<3.5){ // concrete motel sidewalk
    cellCoord=vGround/vec2(1.65,1.2);
  }else if(uPattern<4.5){ // backroom timber boards
    cellCoord=vGround/vec2(3.2,.48);
  }else if(uPattern<5.5){ // diner checkerboard
    cellCoord=vGround/vec2(.72,.72);
  }else{ // dusty stage floor
    cellCoord=vGround/vec2(1.85,1.85);
  }
  vec2 cell=floor(cellCoord),local=fract(cellCoord);
  vec2 nearest=min(local,1.-local);
  float joints=1.-smoothstep(.016,.048,min(nearest.x,nearest.y));
  float grain=(hash(floor(vGround*140.))-.5)*.028;
  float variation=(hash(cell)-.5)*.11;
  if(uPattern>4.5&&uPattern<5.5) variation+=(mod(cell.x+cell.y,2.)-.5)*.22;
  if(uPattern<.5||uPattern>5.5)joints*=.18;
  vec3 surface=ground*(1.+variation+grain)-joints*.14;
  float glow=1.+smoothstep(14.,0.,length(vGround))*0.065;
  gl_FragColor=vec4(max(surface*glow,vec3(.013)),1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const SURFACES=Object.freeze({
  'throne-alley':{tint:0x4d4041,pattern:0},
  'public-opinion':{tint:0x9a9187,pattern:1},
  'dollar-store-dojo':{tint:0x8a8071,pattern:2},
  'motel-alley':{tint:0x594942,pattern:3},
  'backroom':{tint:0x4f3328,pattern:4},
  'shake-regret':{tint:0x795b54,pattern:5},
  'donkey-show':{tint:0x695343,pattern:6},
});
export function createStageFloor(scene, texture, stage) {
  const profile=SURFACES[stage?.id]??SURFACES['throne-alley'];
  const material=new THREE.ShaderMaterial({uniforms:{uMap:{value:texture},uTint:{value:new THREE.Color(profile.tint)},uPattern:{value:profile.pattern}},vertexShader:FLOOR_VERTEX_SHADER,fragmentShader:FLOOR_FRAGMENT_SHADER,toneMapped:false});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(160,100),material);
  floor.rotation.x=-Math.PI/2;floor.position.set(0,-.009,6);floor.renderOrder=-80;scene.add(floor);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(160,80),new THREE.MeshBasicMaterial({color:profile.tint}));
  wall.position.set(0,5,-6.1);wall.renderOrder=-110;scene.add(wall);
  return ()=>{for(const object of [floor,wall]){object.removeFromParent();object.geometry.dispose();object.material.dispose();}};
}
