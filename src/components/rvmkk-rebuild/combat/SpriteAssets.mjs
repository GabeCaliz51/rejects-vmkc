import * as THREE from '../vendor/three.module.mjs';
import {setPoseUV} from './AttackAnimation.mjs';
import {assetRequest,mobileAssetPath} from './AssetRequests.mjs';
export const firstTexture=asset=>asset.frames?.[0]??asset;
export function configureSpriteAsset(asset){for(const t of asset.frames??[asset]){t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;}}
function imageFromBlob(blob,signal){return new Promise((resolve,reject)=>{
 const image=new Image(),url=URL.createObjectURL(blob);let done=false;
 const finish=(error)=>{if(done)return;done=true;image.onload=null;image.onerror=null;signal.removeEventListener('abort',abort);URL.revokeObjectURL(url);if(error){image.src='';reject(error);}else resolve(image);};
 const abort=()=>finish(new DOMException('Image loading cancelled.','AbortError'));
 image.onload=()=>finish();image.onerror=()=>finish(new Error('An image could not be decoded.'));signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();else image.src=url;
});}
async function textureFromPath(path,options){
 const mobile=options.mobile??(typeof window!=='undefined'&&window.matchMedia('(pointer: coarse), (max-width: 800px)').matches);
 let url=mobileAssetPath(path,mobile);
 for(let attempt=0;attempt<2;attempt++){
  try{return await assetRequest(async signal=>{
   let response=await fetch(url,{signal});
   if(response.status===404&&url!==path){url=path;response=await fetch(path,{signal});}
   if(!response.ok)throw new Error('An arena image is unavailable ('+response.status+').');
   const image=await imageFromBlob(await response.blob(),signal);const texture=new THREE.Texture(image);texture.needsUpdate=true;configureSpriteAsset(texture);return texture;
  },options);}catch(error){if(options.signal?.aborted||attempt===1)throw error;}
 }
}
export async function loadSpriteAsset(path,options={}){
 if(!path.endsWith('.json'))return textureFromPath(path,options);
 const data=await assetRequest(async signal=>{const response=await fetch(path,{signal});if(!response.ok)throw Error('Animation manifest could not load.');return response.json();},options);
 if(data.version!==1||!Array.isArray(data.files)||data.files.length<1||data.files.length>16||!data.files.every(p=>typeof p==='string'&&/^\/assets\/rvmkk-rebuild\/[a-zA-Z0-9/_.-]+\.webp$/.test(p)))throw Error('Invalid animation manifest.');
 const settled=await Promise.allSettled(data.files.map(file=>textureFromPath(file,options)));
 if(settled.some(r=>r.status==='rejected')){settled.forEach(r=>{if(r.status==='fulfilled')r.value.dispose();});throw Error('An animation frame could not load. Please retry the arena.');}
 const frames=settled.map(r=>r.value);const asset={frames,image:{width:data.width,height:data.height},dispose(){frames.forEach(t=>t.dispose());}};
 configureSpriteAsset(asset);return asset;
}
export function sampleGrid(mesh,asset,columns,rows,index){
 if(asset.frames){const texture=asset.frames[index];if(!texture)throw Error('Missing animation frame '+index);mesh.material.map=texture;setPoseUV(mesh.geometry,[0,0,texture.image.width,texture.image.height],texture.image.width,texture.image.height);}
 else {mesh.material.map=asset;setPoseUV(mesh.geometry,[index%columns*asset.image.width/columns,Math.floor(index/columns)*asset.image.height/rows,asset.image.width/columns,asset.image.height/rows],asset.image.width,asset.image.height);}
}
