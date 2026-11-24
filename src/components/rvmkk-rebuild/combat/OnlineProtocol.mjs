export const ONLINE_VERSION=1;
export const INPUT_ACTIONS=['left','right','down','jump','punchLeft','punchRight','kickLeft','kickRight','block','backGuard','comedy','special'];
const EDGES=new Set(['jump','punchLeft','punchRight','kickLeft','kickRight','comedy','special']);
export function cleanInput(value){return Object.fromEntries(INPUT_ACTIONS.map(k=>[k,value?.[k]===true]));}
const FIELDS=['x','y','vx','vy','facing','hp','wins','state','clock','move','moveName','blocking','crouching','hitRegion','reactionUntil','guardStun','meter','noticeUntil','pulseIndex','grabTarget','capturedBy','hitConfirmed','bossForm','emote','emoteTime','emoteDuration','emoteText','emoteLock','choreoAngle','petClock','behavior','behaviorClock','behaviorText'];
export function encodeState(model,sequence,events=[]){return {v:ONLINE_VERSION,sequence,phase:model.phase,paused:model.paused,round:model.round,time:model.time,countdown:model.countdown,elapsed:model.elapsed,hitStop:model.hitStop,result:model.result,finishClock:model.finishClock??0,bossClock:model.bossClock??0,combos:model.combos,fighters:model.fighters.map(f=>Object.fromEntries(FIELDS.map(k=>[k,f[k]??null]))),projectiles:model.projectiles.map(p=>({id:p.id,owner:p.owner,move:p.move,facing:p.facing,volleyIndex:p.volleyIndex,x:p.x,y:p.y,vx:p.vx,delay:p.delay,life:p.life})),events};}
export function applyState(model,state){
 if(state?.v!==ONLINE_VERSION||!Number.isSafeInteger(state.sequence)||state.fighters?.length!==2)return false;
 if(!['countdown','fight','roundOver','matchOver','finishReady','finisher','bossTransform','celebration'].includes(state.phase))return false;
 for(const f of state.fighters)if(!Number.isFinite(f.x)||Math.abs(f.x)>8||!Number.isFinite(f.y)||f.y<0||f.y>30||!Number.isFinite(f.hp)||f.hp<0||f.hp>100)return false;
 for(const key of ['phase','paused','round','time','countdown','elapsed','hitStop','result','finishClock','bossClock','combos'])if(state[key]!==undefined)model[key]=state[key];
 model.fighters.forEach((f,i)=>{for(const key of FIELDS)if(state.fighters[i][key]!==undefined)f[key]=state.fighters[i][key];});
 // Render replicas never create physics meshes or award account points.
 model.projectiles=Array.isArray(state.projectiles)?state.projectiles.slice(0,24):[];
 model.sync();return true;
}
export class RemoteInput {
 constructor(){this.held={};this.edges=new Set();this.sequence=-1;}
 accept(packet){if(!Number.isSafeInteger(packet.sequence)||packet.sequence<=this.sequence)return false;this.sequence=packet.sequence;const next=cleanInput(packet.input);for(const action of EDGES)if(next[action]&&!this.held[action])this.edges.add(action);this.held=next;return true;}
 read(){const input={...this.held};for(const action of EDGES)input[action]=this.edges.has(action);this.edges.clear();return input;}
 clear(){this.held={};this.edges.clear();}
}
