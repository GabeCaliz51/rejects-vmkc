import { fighterScale } from './FighterScale.mjs';
// One clock drives both bodies, the ankle grip, damage and landing effects.
export const SLAM_TIMES=Object.freeze([2.3,3.65,5,6.35]);
export const SLAM_ACTION_END=7.4, SLAM_ACTIVE_SECONDS=4.6, SLAM_WORLD_SCALE=.00825;
const FLOOR=700,HOLD_END=6.53;
const C=t=>Math.max(0,Math.min(1,t));
const S=t=>{t=C(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const p=(x,y)=>({x,y});
const lerp=(a,b,t)=>p(mix(a.x,b.x,t),mix(a.y,b.y,t));
export const slamTime=(elapsed,duration=SLAM_ACTIVE_SECONDS)=>C(elapsed/duration)*SLAM_ACTION_END;
export const slamOpponentHeight=id=>Math.max(280,Math.min(450,390*fighterScale(id)/.99));
export function twoBone(root,target,a,b,bend=1){
 const dx=target.x-root.x,dy=target.y-root.y,d=Math.max(.001,Math.hypot(dx,dy));
 const reach=Math.min(d,a+b-.001),c=Math.max(-1,Math.min(1,(a*a+reach*reach-b*b)/(2*a*reach)));
 const angle=Math.atan2(dy,dx)+bend*Math.acos(c);
 return {elbow:p(root.x+Math.cos(angle)*a,root.y+Math.sin(angle)*a),hand:target};
}
const rotate=(point,angle)=>p(point.x*Math.cos(angle)-point.y*Math.sin(angle),point.x*Math.sin(angle)+point.y*Math.cos(angle));
export function victimSegments(height,width,bend=0){
 const waist=p(0,-height*.45),neckOffset=rotate(p(0,-height*.38),bend);
 return [
  {from:.53,to:1,origin:p(0,0),angle:0,x:-width/2,y:-height*.47,width,height:height*.47},
  {from:.16,to:.55,origin:waist,angle:bend,x:-width/2,y:-height*.39,width,height:height*.39},
  {from:0,to:.18,origin:p(waist.x+neckOffset.x,waist.y+neckOffset.y),angle:bend*.65,x:-width/2,y:-height*.18,width,height:height*.18},
 ];
}
export function victimBounds(segments,theta,outline){
 const points=[];
 const shape=outline??[{u:.36,q:0},{u:.64,q:0},{u:.3,q:.16},{u:.7,q:.16},{u:.02,q:.3},{u:.98,q:.3},{u:.22,q:.55},{u:.78,q:.55},{u:.18,q:.8},{u:.82,q:.8},{u:.1,q:1},{u:.9,q:1}];
 for(const part of segments)for(const v of shape){if(v.q<part.from||v.q>part.to)continue;const local=rotate(p((v.u-.5)*part.width,(v.q-part.to)*(part.height/(part.to-part.from))),part.angle);points.push(rotate(p(local.x+part.origin.x,local.y+part.origin.y),theta+Math.PI/2));}

 const contact=points.reduce((a,b)=>a.y>b.y?a:b);
 return {minX:Math.min(...points.map(v=>v.x)),maxX:Math.max(...points.map(v=>v.x)),minY:Math.min(...points.map(v=>v.y)),maxY:Math.max(...points.map(v=>v.y)),contact};
}
export function slamOptionsFor(winner,victim,cinematic=false){
 const opponentHeight=slamOpponentHeight(victim.definition.id);
 if(!cinematic)return {opponentHeight,startGrip:winner.slamStart};
 const side=(victim.x-winner.x)*winner.facing>=0?1:-1;
 return {opponentHeight,...(winner.slamFinisherStart??{startGrip:p(800+(victim.x-winner.x)*winner.facing/SLAM_WORLD_SCALE-side*opponentHeight/2,FLOOR-opponentHeight*.4),startAngle:side===1?0:-Math.PI})};
}
export function slamCameraFrame(initial,normal,focus,time,duration,aspect){
 const approach=S(time/.4),exit=S((time-duration+.4)/.4),height=Math.max(6.6,8.6/aspect);
 return {height:mix(mix(initial.height,height,approach),normal.height,exit),focusX:mix(mix(initial.focusX,focus,approach),normal.focusX,exit),focusY:mix(mix(initial.focusY,height*.28,approach),normal.focusY,exit)};
}
export function slamPose(time,{opponentHeight=390,startGrip=p(1000,FLOOR),startAngle=-Math.PI/2,opponentWidthRatio=.8,opponentOutline}={}){
 opponentHeight=Math.min(opponentHeight,585/Math.hypot(1,opponentWidthRatio));
 const t=Math.max(0,Math.min(10,time)),landing=Math.asin(.76),hold=p(800+Math.cos(-.9)*115,FLOOR-opponentHeight*.76);
 let hips=p(800,500),grip=startGrip,theta=startAngle,lean=0,impact=-1,compression=0,swingPhase=0,swingDirection=0;
 if(t<.85){hips=lerp(p(800,500),p(820,565),S(t/.85));lean=.12*S(t/.85);}
 else if(t<1.65){const q=S((t-.85)/.8);const endLean=Math.cos(-.9)*.28;hips=lerp(p(820,565),p(800+endLean*120,485),q);grip=lerp(startGrip,hold,q);theta=mix(startAngle,-.9,q);lean=mix(.12,endLean,q);}
 else if(t<=HOLD_END){
  let i=SLAM_TIMES.findIndex(end=>t<=end+.18);if(i<0)i=3;
  const start=i===0?1.65:SLAM_TIMES[i-1]+.18,end=SLAM_TIMES[i];
  const from=i===0?-.9:i%2?landing:-Math.PI-landing,to=i%2?-Math.PI-landing:landing;
  const u=C((t-start)/(end-start)),q=u<.25?.05*S(u/.25):.05+.95*S((u-.25)/.75);
  swingPhase=u;swingDirection=Math.sign(to-from);theta=mix(from,to,q);lean=Math.cos(theta)*.28;
  // Drive the throw through his hips and shoulders, then absorb the landing
  // through bent knees. The two feet remain on their original floor contacts.
  hips=p(800+lean*120,485-Math.sin(q*Math.PI)*30+S((u-.7)/.3)*22);
  grip=p(800+Math.cos(theta)*115,hold.y-Math.sin(q*Math.PI)*24);
  if(t>=end){const recovery=C((t-end)/.18);impact=i;compression=Math.sin(recovery*Math.PI)*.075;hips.y=485+22*(1-S(recovery))+Math.sin(recovery*Math.PI)*24;}
 }else{const q=S((t-HOLD_END)/(SLAM_ACTION_END-HOLD_END));theta=mix(-Math.PI-landing,-Math.PI,q);grip=lerp(p(800+Math.cos(-Math.PI-landing)*115,hold.y),p(660,FLOOR-opponentHeight*.18),q);lean=Math.cos(-Math.PI-landing)*.28*(1-q);hips=p(800+lean*120,485+q*15);}
 const height=opponentHeight*(1-compression),width=height*opponentWidthRatio;
 const bend=impact>=0?swingDirection*Math.sin(C((t-SLAM_TIMES[impact])/.18)*Math.PI)*.24:-swingDirection*Math.sin(swingPhase*Math.PI)*.38;
 const segments=victimSegments(height,width,bend),bounds=victimBounds(segments,theta,opponentOutline);
 grip={...grip,y:Math.min(FLOOR-bounds.maxY,Math.max(80-bounds.minY,grip.y))};
 if(impact>=0)grip.y=FLOOR-bounds.maxY;
 const victimCenter=p(grip.x+(bounds.minX+bounds.maxX)/2,grip.y+(bounds.minY+bounds.maxY)/2);
 const impactPoint=p(grip.x+bounds.contact.x,FLOOR);
 // Keep his face and all four arms visible. Only the captured opponent rotates.
 const socket=(x,y)=>p(hips.x+x*Math.cos(lean)-y*Math.sin(lean),hips.y+x*Math.sin(lean)+y*Math.cos(lean));
 const shoulders=[socket(-78,-135),socket(78,-135),socket(-72,-62),socket(72,-62)],locked=t>=.85&&t<=HOLD_END;
 const hands=shoulders.map((root,i)=>{
  if(i===1){if(t<.85)return lerp(p(root.x+35,root.y+75),grip,S(t/.85));if(t<=HOLD_END)return grip;return lerp(grip,p(hips.x+95,hips.y-75),S((t-HOLD_END)/.65));}
  const side=i%2?1:-1;return p(hips.x+side*(130+Math.abs(lean)*90),hips.y-(i<2?105:5)-lean*side*140);
 });
 if(t>7.6){const brush=Math.sin((t-7.6)*16)*13,q=S((t-7.6)/.35);hands.forEach((hand,i)=>{hands[i]=lerp(hand,p(800+(i%2?22:-22)+(i%2?-brush:brush),i<2?390:500),q);});}
 const arms=shoulders.map((root,i)=>{const d=Math.hypot(root.x-hands[i].x,root.y-hands[i].y);return {root,...twoBone(root,hands[i],Math.max(90,d*.56),Math.max(85,d*.5),i%2?-1:1)};});
 const legs=[p(675,FLOOR),p(930,FLOOR)].map((foot,i)=>{const root=socket(i?50:-50,42);return {root,...twoBone(root,foot,125,140,i?-1:1)};});
 return {t,theta,grip,hips,arms,legs,lean,locked,impact,compression,opponentHeight:height,opponentWidth:width,segments,bounds,bend,victimCenter,impactPoint,stage:t<.85?'GRAB':t<1.65?'LIFT':t<=HOLD_END?'FOUR SLAMS':t<7.6?'RELEASE':'DUST OFF',count:SLAM_TIMES.filter(end=>t>=end).length};
}
function sprite(ctx,image,a,b,width,extend=.08){const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);ctx.drawImage(image,-width/2,-length*extend,width,length*(1+extend*2));ctx.restore();}
function drawArm(ctx,assets,arm){
 sprite(ctx,assets.upperArm,arm.root,arm.elbow,68,.14);sprite(ctx,assets.forearm,arm.elbow,arm.hand,59,.12);
 ctx.save();ctx.translate(arm.hand.x,arm.hand.y);ctx.rotate(Math.atan2(arm.hand.y-arm.elbow.y,arm.hand.x-arm.elbow.x)-Math.PI/2);ctx.drawImage(assets.hand,-24,-28,48,50);ctx.restore();
}
function body(ctx,assets,pose){
 // Rear limbs, torso over the sockets, then the foreground gripping arm.
 for(const i of [0,2])drawArm(ctx,assets,pose.arms[i]);
 for(const leg of pose.legs){sprite(ctx,assets.thigh,leg.root,leg.elbow,100,.14);sprite(ctx,assets.shin,leg.elbow,leg.hand,94,.09);}
 ctx.save();ctx.translate(pose.hips.x,pose.hips.y);ctx.rotate(pose.lean);ctx.drawImage(assets.torso,-118,-285,236,377);ctx.restore();
 drawArm(ctx,assets,pose.arms[3]);
}
function opponent(ctx,image,pose,alpha=1,trail=0){
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(pose.grip.x,pose.grip.y);ctx.rotate(pose.theta+Math.PI/2+trail);
 for(const part of pose.segments){ctx.save();ctx.translate(part.origin.x,part.origin.y);ctx.rotate(part.angle);ctx.drawImage(image,0,image.height*part.from,image.width,image.height*(part.to-part.from),part.x,part.y,part.width,part.height+1);ctx.restore();}
 ctx.restore();
}
function dust(ctx,pose,options){
 for(const hit of SLAM_TIMES){const age=pose.t-hit;if(age<0||age>.48)continue;const contact=slamPose(hit,options).impactPoint;
  ctx.save();ctx.globalAlpha=(1-age/.48)*.6;ctx.fillStyle='#c4a17c';
  for(let i=0;i<12;i++){const a=i*2.399,speed=60+i%4*28;ctx.beginPath();ctx.ellipse(contact.x+Math.cos(a)*age*speed,FLOOR-Math.abs(Math.sin(a))*age*130,6+age*22,4+age*10,0,0,Math.PI*2);ctx.fill();}ctx.restore();
 }
}
export function drawKardozoSlam(ctx,assets,time,{width=1600,height=900,mirror=false,review=false,background=true,reducedMotion=false,...options}={}){
 const poseOptions={opponentOutline:assets.opponentOutline,...options},pose=slamPose(time,poseOptions);ctx.save();ctx.clearRect(0,0,width,height);ctx.scale(width/1600,height/900);
 if(background&&assets.background){ctx.drawImage(assets.background,0,0,1600,900);ctx.fillStyle='#08050840';ctx.fillRect(0,0,1600,900);}
 if(mirror){ctx.translate(1600,0);ctx.scale(-1,1);}
 if(!reducedMotion&&pose.impact>=0){const age=pose.t-SLAM_TIMES[pose.impact];ctx.translate(0,Math.sin(age*65)*(1-age/.18)*3);}
 ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(805,FLOOR+5,150,20,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(pose.victimCenter.x,FLOOR+5,80,12,0,0,Math.PI*2);ctx.fill();
 body(ctx,assets,pose);opponent(ctx,assets.opponent,pose);drawArm(ctx,assets,pose.arms[1]);dust(ctx,pose,poseOptions);ctx.restore();
 if(review){ctx.save();ctx.scale(width/1600,height/900);ctx.fillStyle='#050508dd';ctx.fillRect(0,0,1600,78);ctx.fillStyle='#f5d098';ctx.font='bold 27px sans-serif';ctx.fillText('KARDOZO / '+pose.stage,42,49);ctx.textAlign='right';ctx.fillText(pose.count+' / 4 IMPACTS',1558,49);ctx.restore();}
 return pose;
}
