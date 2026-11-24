// Approved finishers, driven only by the ten-second simulation clock.
const C=t=>Math.max(0,Math.min(1,t));
const E=t=>{t=C(t);return t*t*(3-2*t);};
export const FUCKTALITIES=Object.freeze({
 'keen-kahn':{name:'DOCTOR’S ORDERS',prop:'curtain',color:0xc8a553,beats:['Privacy, please.','That grin is not reassuring.','Three pulls. No second opinion.','The necklace reveal.']},
 kitaria:{name:'TALKED TO DEATH',prop:'story',color:0x9859ed,beats:['So anyway, about this dick…','You cannot walk out of this story.','Sit tight. She’s still talking.','Same story. Still not finished.']},
 treytaro:{name:'THIRTY MINUTES OR YOU’RE FREE',prop:'delivery',color:0xe59930,beats:['Your delivery is here.','Three pieces. No substitutions.','Black vest. Blue stitching.','Delivery complete.']},
 kardozo:{name:'FOUR-SLAM CUSTOMER SERVICE',prop:'slams',color:0xc76f36,beats:['Grabs them by the legs.','Left. Right.','Left. Right. Four slams.','Dusts off all four hands.']},
 gaibden:{name:'BAD FUCKING CONNECTION',prop:'lightning',color:0x64c7ff,beats:['That smile means trouble.','Eyes charged. Personal space cancelled.','Electric Superman. Wrong place to get shocked.','Opposite wall. End of transmission.']},
 'datennisha-blaze':{name:'HURRY THE FUCK UP',prop:'skulls',color:0x80719d,beats:['Diamond-blue eyes. Evil eyebrows.','The skulls are coming from her eyebrows.','NOW YOU KNOW HOW TO FUCKING HURRY!','FINISH GETTING YOUR ASS BIT—I GOTTA PEE!']},
 'gare-chi':{name:'BUGLES BREAK',prop:'armbreak',color:0xf3c94b,beats:['Puts the Bugles away. Cracks his knuckles.','Wrist twist. Under the arm. Over his shoulder.','Repeated nose punches. Bruce Lee energy.','Back to the Bugles.']},
 // First-pass ten-second finishing choreography using existing import artwork.
 // Names/choreography for these three are provisional pending visual approval.
 nicoleena:{name:'TONGUE-TIED',prop:'tongue',color:0xce70e7,beats:['The mask stays normal.','The spiral reaches across the arena.','One very bad tongue-lashing.','Back behind the mask.']},
 'cokane-o':{name:'THIRTEEN STRIKES',prop:'poses',color:0xf08272,beats:['Everybody gets a pose.','He keeps counting.','Still not done.','Thirteen. Get out.']},
 scorpurtis:{name:'CHAIN REACTION',prop:'chain',color:0xfac659,beats:['The chain starts spinning.','Hooked. Nowhere to run.','One last pull.','The chain falls silent.']},
});
export function finisherFor(id){return FUCKTALITIES[id];}
export function finisherBeat(id,t){return finisherFor(id)?.beats[Math.min(3,Math.max(0,Math.floor(t/2.5)))]??'';}
export function finisherStage(id,t){
 if(id==='nicoleena')return t<2?'tongue-windup':t<7?'spiral':t<8.5?'snap-back':'mask-restored';
 if(id==='cokane-o')return t<2?'count-in':t<8.5?'pose-'+Math.min(13,1+Math.floor((t-2)/.5)):'pose-final';
 if(id==='scorpurtis')return t<2?'chain-ready':t<6?'chain-grab':t<8.5?'chain-pull':'chain-finish';
 if(id==='keen-kahn')return t<2?'curtain':t<3.5?'grin':t<7.7?'pull-'+Math.min(3,1+Math.floor((t-3.5)/1.4)):'necklace-reveal';
 if(id==='treytaro')return t<2?'pizza-throw':t<3.4?'three-cuts':t<5?'three-pieces':t<6.2?'vest-and-scooter':t<8.7?'burnout-and-runover':'delivery-exit';
 if(id==='kardozo')return t<2?'leg-grab':t<7.6?'slam-'+Math.min(4,1+Math.floor((t-2)/1.4)):'dust-four-hands';
 if(id==='kitaria')return t<3?'story':t<4.5?'follow-and-tug':t<5.3?'annoyed-collapse':'seated-story';
 if(id==='gaibden')return t<2.5?'evil-grin':t<3.4?'eye-charge':t<7.3?'electric-flight':t<8.2?'wall-slam':'brush-hands';
 if(id==='datennisha-blaze')return t<2?'eyebrow-closeup':t<3?'skulls-emerge':t<7.5?'skull-chase':'arms-folded';
 return t<2?'put-bugles-away':t<4.8?'wrist-shoulder-break':t<7.8?'nose-punches':'bugles-return';
}
export function cinematicPose(id,t,loser=false){
 if(loser && ['nicoleena','cokane-o','scorpurtis'].includes(id))
   return {atlas:'base',frame:0,name:'finisher-victim-'+finisherStage(id,t)};
 if(loser){const flat=id==='kitaria'?t>=5.3:id==='kardozo'?t>=7.6:id==='gaibden'?t>=8.2:id==='datennisha-blaze'?t>=7.5:t>=7.8;return {atlas:'limbs',frame:flat?15:t>3?12:13,name:'finisher-victim-'+finisherStage(id,t)};}
 const frames={
 'keen-kahn':t<2?4:t<3.5||t>7.7?6:2,
 kitaria:t<5.3?4:5,
 treytaro:t<3.4?7:t<5?0:2,
 kardozo:t<2?8:t<7.6?8:12,
 gaibden:t<2.5?2:t<7.3?3:6,
 'datennisha-blaze':t<3?4:t<7.5?6:2,
 'gare-chi':t<2?4:t<4.8?5:t<7.8?(Math.floor(t*7)%2?5:7):1,
 nicoleena:t<2?0:t<7?1:8,
 'cokane-o':Math.min(12,Math.floor(t*1.3)),
 scorpurtis:t<2?3:t<8?5:2,
 };
 return {atlas:'personality',frame:frames[id]??0,name:'finisher-'+finisherStage(id,t)};
}
export function cinematicLayout(id,t){
 const winner={x:-1.8,y:0,angle:0,scaleX:1,scaleY:1,visible:true},loser={x:1.1,y:0,angle:0,scaleX:1,scaleY:1,visible:true};
 if(id==='keen-kahn'){
  winner.z=1.7;winner.x=t<2?-1.8:t<7.7?-.7:-1.3;winner.angle=t>=3.5&&t<7.7?-Math.sin((t-3.5)%1.4/1.4*Math.PI)*.22:0;
  loser.x=1.1;loser.y=.65;loser.angle=-.8;loser.silhouette=t>=1.5;loser.scaleY=.8;
  if(t>=3.5&&t<7.7){loser.x+=Math.sin(t*35)*.06;loser.y+=Math.abs(Math.sin(t*35))*.06;}
 }
 if(id==='kitaria'){
  const walk=E((t-2)/2.5);loser.x=1+walk*1.2;winner.x=loser.x-1.15;
  if(t>=4.5){loser.angle=-Math.PI/2*E((t-4.5)/.7);loser.y=.12;}
  if(t>=5.3){winner.x=loser.x+.2;winner.y=.1;winner.scaleY=.72;loser.angle=0;}
 }
 if(id==='treytaro'){
  loser.visible=t<3.4;winner.x=t<5?-2: -2+E((t-6.2)/3.2)*12;winner.y=t>=5?.35:0;winner.scaleY=t>=5?.78:1;winner.visible=t<9.2;
 }
 if(id==='kardozo'){
  winner.x=-.6;
  if(t>=2&&t<7.6){const n=Math.min(3,Math.floor((t-2)/1.4)),q=((t-2)%1.4)/1.4,side=n%2===0?1:-1;const arc=Math.sin(q*Math.PI);loser.x=-.6+side*(.8+arc*1.7);loser.y=.1+arc*3.3;loser.angle=side*(Math.PI*.5+q*Math.PI);winner.angle=side*Math.sin(q*Math.PI)*.12;}
  if(t>=7.6){loser.x=3.1;loser.y=.12;loser.angle=0;}
 }
 if(id==='gaibden'){
  const flight=E((t-3.4)/3.9);if(t>=3.4&&t<7.3){winner.x=-1.8+flight*4.4;winner.y=1;winner.angle=-Math.PI/2;loser.x=winner.x+1.25;loser.y=.5+Math.sin(t*26)*.07;loser.angle=-.25;}
  if(t>=7.3){winner.x=1.7;loser.x=4;loser.y=(1-E((t-7.3)/.8))*.8;loser.angle=-Math.PI/2*E((t-7.3)/.8);}
 }
 if(id==='datennisha-blaze'){
  if(t>=3){const chase=E((t-3)/4.5);loser.x=1+chase*2;loser.y=Math.abs(Math.sin(t*11))*.13;loser.angle=Math.sin(t*10)*.08;}
  if(t>=7.5){loser.angle=0;loser.y=.08;}
 }
 if(id==='gare-chi'){
  if(t>=2&&t<4.8){winner.x=-.4;winner.angle=Math.sin(E((t-2)/2.8)*Math.PI)*-.7;loser.x=.35;loser.angle=E((t-2)/2.8)*-.7;}
  if(t>=4.8&&t<7.8){winner.x=-.45+Math.sin(t*40)*.055;loser.x=.9+Math.abs(Math.sin(t*20))*.18;loser.angle=-Math.abs(Math.sin(t*20))*.18;}
  if(t>=7.8){loser.x=1.6;loser.angle=0;loser.y=.1;}
 }
 if(id==='nicoleena'){winner.x=-1.6;loser.x=1.4+Math.sin(t*8)*.12;loser.angle=t>7?-.6*Math.min(1,(t-7)/1):0;}
 if(id==='cokane-o'){winner.x=-1.2+Math.sin(t*9)*.25;loser.x=1.45;loser.angle=t>6?-.7*Math.min(1,(t-6)/1.5):0;}
 if(id==='scorpurtis'){winner.x=-1.5;loser.x=t<2?1.8:t<8?1.8-(t-2)*.21:.5;loser.angle=t>8?-.65:0;}
 if(id==='gaibden'&&t>=8.2)loser.angle=0;
 const shot=t<2?0:t<3.5?1:t<7.7?2:3;
 return {winner,loser,shot,viewHeight:shot===1?6:8.6,cameraX:0,cameraY:3.4};
}
