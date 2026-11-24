// A shared four-request queue keeps mobile image decodes and downloads bounded.
export const MAX_ASSET_REQUESTS=4;
export const ASSET_TIMEOUT_MS=12000;
let active=0;
const waiting=[];
const abortError=()=>new DOMException('Image loading cancelled.','AbortError');
function take(signal){return new Promise((resolve,reject)=>{
 const item={start(){signal?.removeEventListener('abort',cancel);if(signal?.aborted){reject(abortError());return;}active++;resolve(()=>{active--;drain();});}};
 function cancel(){const at=waiting.indexOf(item);if(at>=0)waiting.splice(at,1);reject(abortError());}
 if(signal?.aborted)return reject(abortError());
 signal?.addEventListener('abort',cancel,{once:true});waiting.push(item);drain();
});}
function drain(){while(active<MAX_ASSET_REQUESTS&&waiting.length)waiting.shift().start();}
export async function assetRequest(task,{signal,timeout=ASSET_TIMEOUT_MS}={}){
 const release=await take(signal),controller=new AbortController();let timedOut=false;
 const stop=()=>controller.abort();signal?.addEventListener('abort',stop,{once:true});
 if(signal?.aborted)controller.abort();
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeout);
 try{return await task(controller.signal);}catch(error){if(timedOut)throw new Error('An image took too long to load. Please retry the arena.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',stop);release();}
}
export function mobileAssetPath(path,mobile){
 return mobile&&/^\/assets\/rvmkk-rebuild\/(combat\/(attacks|expanded|comedy|limbs|opposite|specials)\/|stages\/).+\.png$/.test(path)?path.replace('/rvmkk-rebuild/','/rvmkk-rebuild/mobile/').replace(/\.png$/,'.webp'):path;
}
