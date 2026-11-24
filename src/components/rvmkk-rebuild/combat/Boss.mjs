export const BOSS_ID='x-man';
export const DOG_SPECIAL=Object.freeze({id:'keyzer-soze',name:'KEYZER SÖZE!!!',label:'KEYZER SÖZE!!!',kind:'dogs',color:0xf1bb4b,startup:.6,active:7.2,recovery:.8,reach:10,height:3,y:1.2,damage:7,stun:.32,push:.15,finalPush:8,launch:3,knockdown:.5,pulses:4,beats:[.4,1.8,3.4,5.8],level:'mid'});
export function bossAtlas(texture){const w=texture.image.width/4,h=texture.image.height/4;return {frames:Array.from({length:16},(_,i)=>({rect:[Math.floor(i%4*w),Math.floor(Math.floor(i/4)*h),Math.floor(w),Math.floor(h)],pivotX:.5,feetY:.98,width:3,height:3,mirror:i%8===2}))};}
export function bossPose(f,model){let frame=0;
 if(['knockdown','knockedOut'].includes(f.state))frame=7;
 else if(f.state==='gettingUp'||f.state==='stun')frame=6;
 else if(model.phase==='bossTransform')frame=model.bossClock<1.5?0:6;
 else if(f.blocking||f.crouching)frame=5;
 else if(f.moveName==='special')frame=(f.move.active-f.clock)>5?1:0;
 else if(f.move?.limb&&f.state==='active')frame={punchLeft:1,punchRight:2,kickLeft:3,kickRight:4}[f.move.limb]??0;
 else if(f.y>.05)frame=3;
 return {atlas:f.bossForm===2?'boss':'bossCap',frame:frame+((f.bossForm??1)===2?8:0),name:'x-man-'+f.bossForm+'-'+frame};}
export function bossLine(model){if(model.phase==='bossTransform')return model.bossClock<2?'YOU THOUGHT THAT WAS THE BOSS FIGHT?':model.bossClock<4.8?'':'ALRIGHT. MY TURN.';const b=model.fighters.find(f=>f.definition.id===BOSS_ID);if(b?.moveName==='special')return b.state==='recovery'?'BACON SODA!':b.clock>b.move.active-1?'KEYZER SÖZE!!!':'';return '';}
