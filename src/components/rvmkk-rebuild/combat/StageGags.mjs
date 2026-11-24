const W = 1024, H = 576;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * clamp(t);
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;

export const STAGE_EXTRA_ART = Object.freeze({
  'motel-alley': '/assets/rvmkk-rebuild/stages/actors/motel-patron.png',
  'backroom': '/assets/rvmkk-rebuild/stages/actors/backroom-actor.png',
  'throne-alley': '/assets/rvmkk-rebuild/stages/actors/throne-alley-source.png',
});

// Exact alpha bounds of six poses; PNG pixels are copied unchanged from the generated atlas.
const PATRON = [[121,6,392,505], [609,7,859,503], [955,60,1526,377], [48,505,528,998], [509,689,1078,941], [1181,522,1444,972]];

function circle(c, x, y, r, color) { c.fillStyle = color; c.beginPath(); c.arc(x,y,r,0,TAU); c.fill(); }
function line(c, points, color, width = 2) { c.strokeStyle=color; c.lineWidth=width; c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.stroke(); }

function cutout(c, image, polygon, pivot, destination = pivot, turn = 0, scale = 1) {
  if (!image) return;
  c.save(); c.translate(destination[0]*W, destination[1]*H); c.rotate(turn); c.scale(scale,scale); c.translate(-pivot[0]*W,-pivot[1]*H);
  c.beginPath(); polygon.forEach(([x,y],i)=>i?c.lineTo(x*W,y*H):c.moveTo(x*W,y*H)); c.closePath(); c.clip();
  c.drawImage(image,0,0,W,H); c.restore();
}

function cash(c,x,y,turn=0,scale=1) {
  c.save();c.translate(x,y);c.rotate(turn);c.scale(scale,scale);
  c.fillStyle='#789c61';c.strokeStyle='#20391e';c.lineWidth=1.8;c.fillRect(-13,-5.5,26,11);c.strokeRect(-13,-5.5,26,11);
  c.strokeStyle='#d2deb2';c.strokeRect(-10,-3.5,20,7);c.fillStyle='#21371e';c.font='bold 8px Arial';c.textAlign='center';c.fillText('1',0,3);c.restore();
}

function stars(c,x,y,t,count=5) {
  for(let i=0;i<count;i++){const a=t*5+i*TAU/count;c.save();c.translate(x+Math.cos(a)*24,y+Math.sin(a)*9);c.rotate(a);c.fillStyle='#ffd94e';c.strokeStyle='#6c3c0c';c.lineWidth=1;
    c.beginPath();for(let j=0;j<10;j++){const r=j%2?2.3:6, q=j*Math.PI/5;c.lineTo(Math.cos(q)*r,Math.sin(q)*r);}c.closePath();c.fill();c.stroke();c.restore();}
}

function dust(c,x,y,t,color='rgba(186,160,124,.5)') {
  for(let i=0;i<8;i++){const q=clamp(t-i*.04);if(q>0&&q<1){c.globalAlpha=(1-q)*.6;circle(c,x+Math.cos(i*2.3)*q*50,y-Math.sin(i*.7)*q*20,5+q*12,color);}}
  c.globalAlpha=1;
}

function crown(c,x,y,scale=1,turn=0) {
  c.save();c.translate(x,y);c.rotate(turn);c.scale(scale,scale);c.lineWidth=2;c.strokeStyle='#6d3a10';
  const g=c.createLinearGradient(0,-15,0,6);g.addColorStop(0,'#ffe9a7');g.addColorStop(.5,'#da9d2d');g.addColorStop(1,'#85500f');c.fillStyle=g;
  c.beginPath();c.moveTo(-17,4);c.lineTo(-21,-16);c.lineTo(-8,-8);c.lineTo(0,-23);c.lineTo(8,-8);c.lineTo(21,-16);c.lineTo(17,4);c.closePath();c.fill();c.stroke();
  c.fillStyle='#bd1f58';for(const q of [-11,0,11])circle(c,q,-1,2,'#c92c54');c.restore();
}

function gas(c,x,y,t,power=1) {
  for(let i=0;i<11;i++){const q=clamp((t-i*.065)/1.8);if(q<=0||q>=1)continue;const r=(9+q*29)*power;c.globalAlpha=(1-q)*.33;
    const gx=x-q*80*power+Math.sin(i*2.9)*q*30,gy=y-q*48+Math.cos(i*1.7)*q*19;
    const g=c.createRadialGradient(gx,gy,0,gx,gy,r);g.addColorStop(0,'#c7de4c');g.addColorStop(1,'rgba(95,140,30,0)');circle(c,gx,gy,r,g);}
  c.globalAlpha=1;
}

function bra(c,x,y,angle,size=1) {
  c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);c.strokeStyle='#7d144b';c.lineWidth=2.2;
  c.beginPath();c.moveTo(-21,0);c.bezierCurveTo(-37,-29,-5,-26,-4,-2);c.moveTo(4,-2);c.bezierCurveTo(5,-26,37,-29,21,0);c.stroke();
  c.fillStyle='#de439b';c.beginPath();c.moveTo(-23,0);c.bezierCurveTo(-25,20,-2,21,0,1);c.bezierCurveTo(2,21,25,20,23,0);c.closePath();c.fill();c.stroke();
  line(c,[[-38,4],[-23,0],[23,0],[38,4]],'#e78ebe',2);c.restore();
}

function patron(c,image,active,age,reduced) {
  if(!image)return;
  let frame=0,x=.922,y=.714,turn=0;
  if(active){
    if(reduced)frame=1;
    else if(age<.6){frame=0;x+=Math.sin(age*39)*.002;}
    else if(age<1.1)frame=1;
    else if(age<2.05){const t=(age-1.1)/.95;frame=2;x=lerp(.91,.67,t);y=.66-Math.sin(t*Math.PI)*.18;turn=-.2;}
    else if(age<2.7){const t=(age-2.05)/.65;frame=3;x=lerp(.67,.575,t);y=lerp(.57,.745,t);turn=t*.75;}
    else if(age<3.7){frame=4;x=.575;y=.745;dust(c,x*W,y*H,age-2.7);}
    else {frame=5;x=.575;y=.745;}
  }
  const [x0,y0,x1,y1]=PATRON[frame],s=H*.315/499;
  c.save();c.translate(x*W,y*H);c.rotate(turn);if(active&&age>4.45)c.globalAlpha=clamp((4.8-age)/.35);
  c.drawImage(image,x0,y0,x1-x0,y1-y0,-(x1-x0)*s/2,-(y1-y0)*s,(x1-x0)*s,(y1-y0)*s);c.restore();
}

function influencer(c,image,active,age,reduced,time) {
  if(!image)return;
  const pivot=[.825,.244],sway=reduced?0:Math.sin(time*1.7)*.008;
  const body=[54,86,978,952],bodyScale=H*.31/(952-86);
  c.save();c.translate(pivot[0]*W,pivot[1]*H);c.rotate(sway);
  c.drawImage(image,body[0],body[1],body[2]-body[0],body[3]-body[1],-(630-body[0])*bodyScale,-(443-body[1])*bodyScale,(body[2]-body[0])*bodyScale,(body[3]-body[1])*bodyScale);c.restore();
  if(!active||reduced)return;
  const growth=age<2.2?ease(age/2.2):age<2.5?1:clamp(1-(age-2.5)/.18);
  const size=H*.087*(1+growth*2),headWidth=size*323/381;
  c.save();c.translate(pivot[0]*W,(pivot[1]+growth*.02)*H);c.rotate(sway);
  c.drawImage(image,1120,443,323,381,-headWidth/2,-size/2,headWidth,size);c.restore();
  if(age>.6&&age<2.3){c.save();c.globalAlpha=.6;c.strokeStyle='#eff6ff';c.lineWidth=1.5;for(let i=0;i<6;i++){const a=i*TAU/6;line(c,[[.747*W+Math.cos(a)*4,.16*H+Math.sin(a)*4],[.747*W+Math.cos(a)*13,.16*H+Math.sin(a)*13]],'#e9ddff',1.4);}c.restore();}
  if(age>=2.5&&age<2.9){const q=(age-2.5)/.4;for(let i=0;i<9;i++){const a=i*TAU/9;line(c,[[pivot[0]*W+Math.cos(a)*(30+q*28),(pivot[1]+.02)*H+Math.sin(a)*(30+q*28)],[pivot[0]*W+Math.cos(a)*(40+q*40),(pivot[1]+.02)*H+Math.sin(a)*(40+q*40)]],'#ffd3fc',2);}}
  if(age>2.8)stars(c,pivot[0]*W,.16*H,age);
}

const RAT = [[.132,.646],[.145,.639],[.151,.626],[.168,.621],[.178,.628],[.181,.62],[.188,.628],[.195,.63],[.202,.645],[.2,.654],[.185,.664],[.155,.666],[.14,.666],[.132,.657]];
const LID = [[.89,.563],[.89,.53],[.899,.508],[.913,.5],[.931,.506],[.942,.525],[.939,.556],[.931,.578],[.916,.595],[.901,.592]];
function throne(c,image,active,age,reduced,time) {
  let rat=[.173,.647],turn=0,scale=1,lid=0;
  if(active&&!reduced){
    if(age<1.3){const t=ease(age/1.3);rat=[lerp(.173,.918,t),.65+Math.sin(age*50)*.004];}
    else if(age<1.65){rat=[.923,.65];lid=-Math.sin((age-1.3)/.35*Math.PI)*1.45;}
    else if(age<2.8){const t=(age-1.65)/1.15;rat=[lerp(.923,.42,t),.65-Math.sin(t*Math.PI)*.35-t*.10];turn=-t*TAU*1.5;scale=1.15;}
    else {rat=[.42,.55+Math.sin(age*15)*.002];scale=1.15;}
  }
  cutout(c,image,LID,[.915,.595],[.941,.614],lid);
  c.save();if(active&&age>4.45)c.globalAlpha=clamp((4.8-age)/.35);
  cutout(c,image,RAT,[.173,.647],rat,turn,scale);
  if(active&&age>2.8&&!reduced)crown(c,rat[0]*W+9,rat[1]*H-18,.43,Math.sin(age*12)*.07);c.restore();
  if(active&&age>1.3&&age<2.3&&!reduced)gas(c,.928*W,.65*H,age-1.3,.6);
  if(!reduced){for(let i=0;i<5;i++){const q=(time*.25+i*.21)%1;c.globalAlpha=(1-q)*.5;circle(c,(.839+Math.sin(i*7+time)*.006)*W,(.457-q*.1)*H,1.1,'#ffb64b');}c.globalAlpha=1;}
}

function glove(c,x,y,t) {
  const q=Math.sin(clamp(t)*Math.PI),length=q*112;
  c.save();c.translate(x,y);line(c,Array.from({length:19},(_,i)=>[-length*i/18,Math.sin(i*Math.PI/2)*5]),'#9b9ea8',2.5);
  c.translate(-length,0);c.rotate(-.13);c.fillStyle='#ad1e28';c.strokeStyle='#3e0a16';c.lineWidth=2;
  c.beginPath();c.roundRect(-28,-19,46,36,12);c.fill();c.stroke();c.fillStyle='#e35a4f';c.beginPath();c.ellipse(-12,-8,16,6,-.15,0,TAU);c.fill();c.fillStyle='#b33232';c.fillRect(12,-12,18,25);c.strokeRect(12,-12,18,25);c.restore();
}

function court(c,age,time,reduced) {
  if(reduced)return;
  const length=age<2?ease(age/2):clamp(1-(age-3)/1.8);
  c.save();c.strokeStyle='#f1dfbb';c.lineWidth=13;c.lineCap='butt';
  c.beginPath();c.moveTo(.243*W,.54*H);
  for(let i=1;i<45*length;i++){const t=i/44;c.lineTo((.243+t*.55)*W,(.54+Math.sin(t*Math.PI)*.18+Math.sin(i*.7+time*3)*.008)*H);}c.stroke();
  c.strokeStyle='#73614d';c.lineWidth=1;c.setLineDash([2,7]);c.stroke();c.restore();
  if(age>1.5&&age<3.5)glove(c,.79*W,.48*H,(age-1.5)/2);
  if(age>2.1&&age<3.4)stars(c,.639*W,.405*H,age);
}

function bird(c,x,y,scale) {
  c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#b0a576';c.strokeStyle='#494732';c.lineWidth=1.5;
  c.beginPath();c.roundRect(-9,-3,18,19,4);c.fill();c.stroke();
  c.beginPath();c.roundRect(-3,-26,6,27,3);c.fill();c.stroke();
  for(const p of [-7,2,7]){c.beginPath();c.roundRect(p-3,-7,6,12,3);c.fill();c.stroke();}c.restore();
}

function dojo(c,age,reduced) {
  if(reduced)return;
  if(age<1.3){for(let i=0;i<4;i++){const q=clamp(age-i*.18);cash(c,(.285-q*.11)*W,(.5-Math.sin(q*Math.PI)*.1)*H,q*3,.8);}}
  if(age>1.3&&age<3.6){bird(c,.174*W,.477*H,1.4);if(age>1.9){const t=clamp((age-1.9)/.5);c.save();c.translate(lerp(.286,.14,t)*W,(.45-Math.sin(t*Math.PI)*.09)*H);c.rotate(t*8);c.fillStyle='#ef4c29';c.strokeStyle='#7c241d';c.lineWidth=2;c.fillRect(-7,-10,14,20);c.strokeRect(-7,-10,14,20);c.fillStyle='#f7cd55';c.beginPath();c.ellipse(0,0,5,7,0,0,TAU);c.fill();c.restore();if(t===1)stars(c,.139*W,.45*H,age);}}
  if(age>3.2&&age<4.6){c.save();c.globalAlpha=clamp(4.6-age);circle(c,.142*W,.46*H,11,'rgba(224,208,157,.32)');c.restore();}
}

function stripClub(c,age,reduced) {
  if(reduced)return;
  const a=[.32*W,.6*H],d=[.48*W,.43*H];
  const t=age<1.8?ease(age/1.8):1-ease((age-1.8)/.75);
  const x=lerp(a[0],d[0],t),y=lerp(a[1],d[1],t)-Math.sin(t*Math.PI)*40;
  if(age<2.6){line(c,[a,[x,y]],'#c7c0a5',.9);cash(c,x,y,Math.sin(age*5)*.18,1.15);}
  if(age>2.6){const q=clamp((age-2.6)/.38);c.save();c.translate(lerp(.48,.31,q)*W,(.39-Math.sin(q*Math.PI)*.08+q*.15)*H);c.rotate(q*7);c.fillStyle='#354c7b';c.strokeStyle='#adc2e6';c.lineWidth=1.4;c.beginPath();c.roundRect(-22,-13,44,26,3);c.fill();c.stroke();c.fillStyle='#ffc6ce';c.font='bold 8px Arial';c.textAlign='center';c.fillText('DECLINED',0,3);c.restore();if(q===1)stars(c,.311*W,.49*H,age);}
}

function donkey(c,age,reduced) {
  if(reduced)return;
  gas(c,.472*W,.347*H,age,1.45);
  for(let i=0;i<7;i++){const q=clamp((age-.12*i)/2);if(q>0&&q<1)cash(c,(.48-q*.35)*W,(.39-q*.20+Math.sin(q*9+i)*.025)*H,q*8+i);}
  if(age>.8&&age<4.3){const t=clamp((age-.8)/1.7),x=lerp(.18,.53,t),y=lerp(.58,.19,t)-Math.sin(t*Math.PI)*.18;bra(c,x*W,y*H,t===1?-.35:age*4,t===1?.75:.9);}
}

export function paintStageGags(context, stage, director, images, reducedMotion = false) {
  const c=context,time=director.time,active=director.active,age=active?time-active.started:0;
  c.clearRect(0,0,W,H);c.lineJoin='round';c.lineCap='round';
  if(stage.id==='motel-alley')patron(c,images[1],active,age,reducedMotion);
  if(stage.id==='backroom')influencer(c,images[1],active,age,reducedMotion,time);
  if(stage.id==='throne-alley')throne(c,images[1],active,age,reducedMotion,time);
  if(!active)return;
  c.save();if(age>4.45)c.globalAlpha=clamp((4.8-age)/.35);
  if(stage.id==='public-opinion')court(c,age,time,reducedMotion);
  if(stage.id==='dollar-store-dojo')dojo(c,age,reducedMotion);
  if(stage.id==='shake-regret')stripClub(c,age,reducedMotion);
  if(stage.id==='donkey-show')donkey(c,age,reducedMotion);
  c.restore();
}
