import {PERSONALITY_ATLASES} from './PersonalityAtlas.mjs';
import { SLAM_TIMES, SLAM_ACTION_END, SLAM_ACTIVE_SECONDS } from './KardozoSlam.mjs';
const P={
 'keen-kahn':{intro:[1,'THAT’S WHERE YOU’RE GONNA FUCKING END UP.'],down:[2,'I TOLD YOU NOT TO FUCK WITH ME!'],miss:[3,''],low:[3,''],getUp:[5,''],win:[6,'WHO ELSE WANTS SOME?'],loss:[7,'BULLSHIT… BEST TWO OUT OF THREE.'],head:[9,''],torso:[8,'YOU FUCKED UP NOW.'],legs:[10,'FIGHT ME UP HERE, MOTHERFUCKER!'],retreat:[3,'WHERE THE FUCK YOU GOING?'],overhead:[11,'SIT YOUR ASS DOWN!'],launch:[3,'GET YOUR ASS BACK HERE!']},
 kitaria:{intro:[1,''],down:[2,''],miss:[3,''],low:[0,''],getUp:[6,''],win:[1,''],loss:[7,''],head:[9,'I probably deserved that.'],torso:[8,''],legs:[10,''],retreat:[4,''],overhead:[4,'Anyway…'],launch:[0,'']},
 treytaro:{intro:[0,''],down:[2,''],miss:[4,''],low:[5,''],getUp:[8,''],win:[2,''],loss:[1,'THAT FLOOR’S FUCKED UP.'],head:[10,''],torso:[9,''],legs:[11,'PICK ON SOMEBODY WITH TWO!'],retreat:[0,'I AIN’T CHASING YOUR ASS!'],overhead:[1,''],launch:[0,'WATCH YOUR STEP—FLOOR’S FUCKED UP!']},
 kardozo:{intro:[1,'I miss my hair'],down:[2,''],miss:[4,''],low:[5,''],getUp:[8,''],win:[12,''],loss:[7,'Whatever. Happy Birthday, Mother Fucker!'],head:[10,''],torso:[9,''],legs:[11,''],retreat:[7,''],overhead:[0,''],launch:[0,'']},
 gaibden:{intro:[6,''],down:[0,''],miss:[2,''],low:[2,''],getUp:[5,''],win:[6,''],loss:[7,''],head:[9,''],torso:[8,''],legs:[10,''],retreat:[0,''],overhead:[11,''],launch:[6,'']},
 'datennisha-blaze':{intro:[1,''],down:[2,'HURRY UP, BITCH! I GOTTA PEE!'],miss:[4,''],low:[5,''],getUp:[7,''],win:[8,'DON’T PUT BANANAS IN MY BUTT!'],loss:[0,'YOU’RE CLEANING THIS SHIT UP!'],head:[4,''],torso:[5,'IT’S CHEAPER THAN ABORTION!'],legs:[10,'MY FEMALE DICK!'],retreat:[6,'QUIT TRACKING SHIT ALL OVER MY FLOOR!'],overhead:[11,''],launch:[0,'AND STAY OFF MY CLEAN FUCKING FLOOR!']},
 'gare-chi':{intro:[0,''],down:[1,''],miss:[4,''],low:[5,''],getUp:[10,''],win:[9,''],loss:[4,'WHERE THE HELL MY BITCHES?'],head:[6,''],torso:[0,''],legs:[11,'Where’d I park my truck at?'],retreat:[9,'THAT’S RIGHT! GARE-CHI GOT BITCHES!'],overhead:[4,''],launch:[4,'Where the fuck’d you go?']},
};
export const PERSONALITIES=Object.freeze(P);
export function emote(model,f,key,duration=1.5,lock=false){if(model.bossBattle||!P[f.definition.id])return;const entry=P[f.definition.id][key];if(!entry&&key!=='closeWin'&&key!=='taunt'&&key!=='story'&&key!=='bong')return;f.emote=key;f.emoteTime=0;f.emoteDuration=duration;f.emoteLock=lock;f.emoteText=entry?.[1]??'';}
export function emotePose(f,model){
 if(model.bossBattle||!P[f.definition.id])return null;
 if(f.hp<=20&&f.hp>0&&f.definition.id==='kardozo')return {atlas:'personality',frame:5,name:'two-hands-guarding-junk'};
 if(f.move?.personalityFrame!==undefined)return {atlas:'personality',frame:f.move.personalityFrame,name:f.move.id};
 if(!f.emote||f.state==='knockdown'||f.state==='knockedOut'||f.move)return null;
 let frame=P[f.definition.id][f.emote]?.[0]??0;
 if(f.emote==='win'&&f.definition.id==='datennisha-blaze')f.emoteText=f.emoteTime<2?'':'DON’T PUT BANANAS IN MY BUTT!';
   if(f.emote==='closeWin')frame=12+Math.min(3,Math.floor(f.emoteTime));
 if(f.emote==='taunt')frame=f.emoteTime<.5?0:12;
 if(f.emote==='bong')frame=f.emoteTime<1.8?2:3;
 if(f.emote==='story')frame=f.emoteTime<3?4:5;
 if(f.emote==='low'&&f.definition.id==='treytaro')frame=f.emoteTime%1<.6?5:6;
 if(f.emote==='win'&&f.definition.id==='datennisha-blaze')frame=f.emoteTime<2?8:9;
 return {atlas:'personality',frame,name:'personality-'+f.emote};
}
export function animationAtlas(texture,id){if(PERSONALITY_ATLASES[id])return PERSONALITY_ATLASES[id];const w=texture.image.width/4,h=texture.image.height/4;return {frames:Array.from({length:16},(_,i)=>({rect:[Math.floor(i%4*w),Math.floor(Math.floor(i/4)*h),Math.floor(w),Math.floor(h)],pivotX:.5,feetY:.985,width:3.3,height:3.3}))};}
export function personalityMiss(model,f){if(model.bossBattle)return;f.bigMisses=(f.bigMisses??0)+1;if(f.bigMisses<3)return;f.bigMisses=0;const other=model.fighters[1-f.index];emote(model,other,'taunt',1.5);emote(model,f,'miss',2);
 if(f.definition.id==='gaibden')f.requestSignature='flight';
 if(f.definition.id==='datennisha-blaze')f.requestSignature='skulls';
}
export function personalityHit(model,f,region){if(model.bossBattle)return;emote(model,f,region,1.2);}
export function personalityTick(model,dt){
 if(model.bossBattle)return;
 for(const f of model.fighters){const other=model.fighters[1-f.index];
  if(other.capturedBy===f.index&&f.grabTarget===null&&f.emote!=='story'){other.capturedBy=null;other.state=other.hp>0?'gettingUp':'knockedOut';other.clock=.55;}
  if(Number.isFinite(f.petClock))f.petClock+=dt;
  f.emoteCooldown=Math.max(0,(f.emoteCooldown??0)-dt);
  if(f.emote){f.emoteTime+=dt;
   if(f.emote==='closeWin'&&f.emoteTime>=2&&f.emoteTime<3)f.emoteText='Wheeew!';
   if(f.emote==='bong'&&f.emoteTime>=f.emoteDuration){model.events.push({type:'smoke',serial:++model.serial,owner:f.index,x:f.x,y:1.5});if(Math.abs(other.x-f.x)<2){other.state='stun';other.clock=.8;other.vx=other.facing*-1.4;model.removeHitbox(other);other.move=null;other.moveName=null;emote(model,other,'torso',.8);}}
   if(f.emote==='story'){f.emoteText='STILL TELLING THE SAME STORY ABOUT DICK…';
    if(f.emoteTime<3){other.x=Math.max(-5.3,Math.min(5.3,other.x+f.facing*dt*.5));f.x=other.x-f.facing*.9;}
    else {other.capturedBy=f.index;other.state='knockdown';other.y=0;other.vy=0;other.move=null;model.removeHitbox(other);f.x=other.x+f.facing*.15;}
    if(f.emoteTime>=f.emoteDuration){other.capturedBy=null;other.state='gettingUp';other.clock=.55;f.x=other.x-f.facing*.9;}
   }
   if(f.emoteTime>=f.emoteDuration){f.emote=null;f.emoteLock=false;f.emoteText='';}
  }
  if(model.phase==='countdown'&&!f.introPlayed){f.introPlayed=true;emote(model,f,'intro',2.7);}
  if(model.phase!=='fight'||f.hp<=0)continue;
  if(f.state==='gettingUp'&&f.lastState!=='gettingUp'){emote(model,f,'getUp',.7);if(f.definition.id==='datennisha-blaze')f.petClock=0;}
  if(f.state==='idle'&&!f.emote&&!f.emoteCooldown){
   if(other.state==='knockdown'&&other.y<.05){emote(model,f,f.definition.id==='kitaria'?'bong':'down',f.definition.id==='kitaria'?2.5:1.8,f.definition.id==='kitaria');f.emoteCooldown=6;}
   else if(f.hp<=20){emote(model,f,'low',2.5,f.definition.id==='treytaro');f.emoteCooldown=8;}
   else if(Math.abs(other.x-f.x)>3.4&&other.state==='idle'){emote(model,f,'retreat',1.5);f.emoteCooldown=10;}
  }
  if(f.emote==='low'&&f.definition.id==='treytaro'&&Math.abs(other.x-f.x)<1.5){f.emoteText='RACIST!';f.emoteLock=false;f.requestSignature='heart-kick';}
  if(f.state==='idle'&&other.blocking)f.guardWait=(f.guardWait??0)+dt;else f.guardWait=0;
  if(f.guardWait>1.8){f.guardWait=0;f.requestSignature={kitaria:'story','datennisha-blaze':'vacuum','gare-chi':'minions',kardozo:'tickle','keen-kahn':'headbutt'}[f.definition.id]??null;}
  if(f.state==='idle'&&f.definition.id==='kardozo'&&other.y>1.4&&Math.abs(other.x-f.x)<1.2)f.requestSignature='four-slams';
  f.lastState=f.state;
 }
}
export const SIGNATURES={
 flight:{id:'electric-superman',label:'BAD CONNECTION',kind:'rush',color:0x6ecbff,startup:.8,active:1.2,recovery:.5,reach:1.8,height:1.6,y:1,damage:8,stun:.32,push:4,pulses:4,finalPush:10,knockdown:.8,launch:3,rushSpeed:7,personalityFrame:3,level:'mid'},
 skulls:{id:'eyebrow-skulls',label:'HURRY UP!',name:'EYEBROW SKULLS',kind:'skulls',color:0x292030,startup:.8,active:.2,recovery:.5,damage:8,stun:.4,push:1,level:'high',personalityFrame:4,projectile:{speed:6,width:.65,height:.65,y:2,life:2,count:3,interval:.2}},
 vacuum:{id:'pink-glow-vacuum',label:'MAGIC VACUUM',startup:.25,active:.22,recovery:.4,reach:1.7,height:.45,y:.25,damage:11,stun:.4,push:2,knockdown:1,launch:2,level:'low',personalityFrame:6},
 'heart-kick':{id:'racist-kick',label:'RACIST!',startup:.12,active:.2,recovery:.35,reach:1.5,height:1,y:1,damage:10,stun:.3,push:6,level:'mid',personalityFrame:7},
 tickle:{id:'four-arm-tickle',label:'TWO HANDS TOO MANY',kind:'grab',color:0xe7b05c,startup:.25,active:1.2,recovery:.35,reach:1.3,height:1.6,y:1,damage:2,pulses:4,push:0,stun:.2,unblockable:true,captureWindow:.25,personalityFrame:6},
 headbutt:{id:'guard-ripper',label:'OPEN UP!',startup:.3,active:.2,recovery:.4,reach:1.3,height:1,y:2,damage:14,push:5,stun:.45,unblockable:true,level:'mid',personalityFrame:4},
 'four-slams':{id:'four-slams',label:'FOUR-SLAM CUSTOMER SERVICE',kind:'grab',color:0xe7b05c,startup:.2,active:SLAM_ACTIVE_SECONDS,recovery:.5,reach:1.5,height:3,y:1.5,damage:5,pulses:4,beats:SLAM_TIMES.map(t=>t/SLAM_ACTION_END*SLAM_ACTIVE_SECONDS),push:0,stun:.3,unblockable:true,captureWindow:.35,personalityFrame:8},
 minions:{id:'gare-minions',label:'THAT’S RIGHT! GARE-CHI GOT BITCHES!',name:'GARE-CHI GOT BITCHES',kind:'minions',color:0xb84243,startup:.7,active:5.5,recovery:2,reach:4,height:2.5,y:1.2,damage:5,pulses:4,push:1.1,stun:.3,level:'mid',personalityFrame:9},
};
export function startSignature(model,f){const key=f.requestSignature;f.requestSignature=null;if(!key||model.bossBattle||f.state!=='idle'||f.y>.01)return;
 if(key==='story'){emote(model,f,'story',5.5,true);f.emoteText='';return;}
 const move=SIGNATURES[key];if(move){f.emote=null;f.emoteLock=false;model.startMove(f,key,{...move,heavy:true});}
}
