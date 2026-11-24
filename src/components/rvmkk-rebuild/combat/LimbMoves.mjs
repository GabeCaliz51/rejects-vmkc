// Each side is a distinct input, atlas frame and strike. The names belong to this roster.
const THEMES={
 'keen-kahn': ['ROYAL DOGGY PADDLE','CROWN-JEWEL BACKHAND','PRISSY TOE POKE','THRONE-ROOM STUMBLE'],
 kitaria: ['PANIC FAN PAT','WRONG-WAY BACKHAND','GUM-SHOE KICK','ROYAL ANKLE WOBBLE'],
 treytaro: ['PIZZA PALM','SPAGHETTI WRIST','LEFT HOOF HICCUP','RIGHT HOOF MISFIRE'],
 kardozo: ['ELBOW TRAFFIC JAM','FOUR-HAND CONFUSION','KNOCK-KNEE PUNT','OWN-FOOT PROBLEM'],
 gaibden: ['STATIC CHICKEN WING','DEAD-SOCKET SWAT','LIVE-WIRE GOOSE STEP','GROUND-FAULT FLAIL'],
 'datennisha-blaze': ['DRILL-SERGEANT PADDLE','INSUBORDINATE BACKHAND','BOOT-CAMP GOOSE STEP','ANGRY DUCK KICK'],
 'gare-chi': ['SNACK-BAG BACKHAND','CORN-CLAW SWAT','STIFF-HIP BOOT','KEEP-OFF-MY-BUGLES KICK'],
};
export const LIMB_ACTIONS=Object.freeze(['punchLeft','punchRight','kickLeft','kickRight']);
export function limbMove(id,action,posture='stand',power=false){
 const side=LIMB_ACTIONS.indexOf(action);if(side<0)return null;
 const kick=side>=2,right=side%2===1,crouch=posture==='crouch',air=posture==='air';
 const base=THEMES[id]??['LEFT JAB','RIGHT CROSS','LEFT KICK','RIGHT KICK'];
 const label=(air?'AIR ':crouch?'LOW ':'')+base[side];
 const target=crouch?(kick?'legs':right?'head':'torso'):air?(kick?'torso':'head'):kick?'torso':right?'head':'torso';
 return {label,limb:action,posture,frame:(air?8:crouch?4:0)+side,target,level:crouch&&kick?'low':air?'overhead':target==='head'?'high':'mid',
 startup:(kick?10:6)/60+(right?.025:0)+(power?.06:0),active:(air?14:kick?8:6)/60,recovery:(kick?19:13)/60+(power?.08:0),
 reach:(kick?1.40:1.12)+(power?.15:0),height:crouch&&kick?.48:crouch&&right?1.55:.8,y:target==='legs'?.28:target==='head'?(air?1.55:crouch?2.25:2.5):crouch?.82:air?1.0:1.45,
 damage:(kick?11:7)+(right?1:0)+(air?1:0)+(power?3:0),stun:kick?.42:.35,push:power?7.8:kick?4.4:2.6,
 air,crouch,heavy:power||(kick&&right)||crouch&&kick,knockdown:((power&&kick)||(crouch&&kick)) ? .78 : 0,launch:power&&kick?4.2:crouch&&kick?3.2:0};
}
export const LIMB_THEMES=Object.freeze(THEMES);
