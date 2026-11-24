export const SELECT_THEMES=Object.freeze([
 {id:'faceoff',title:'FACE-OFF WALL',line:'Big egos. Pick yours.'},
 {id:'lineup',title:'PICK YOUR SUSPECT',line:'Everybody looks guilty. Choose wisely.'},
 {id:'elevators',title:'ELEVATOR TO VIOLENCE',line:'Choose a fighter. Doors open. Problems follow.'},
 {id:'party',title:'WHO INVITED THIS MOTHERFUCKER?',line:'Make an entrance. Expect absolutely no applause.'},
 {id:'weighin',title:'WEIGH-IN BEEF',line:'Heavy hands. Heavier egos.'},
]);
export const SELECTION_HEIGHT=Object.freeze({'kardozo':1,'keen-kahn':1,gaibden:.90,kitaria:.76,treytaro:.90,'datennisha-blaze':.72,'gare-chi':.86,nicoleena:.79,'cokane-o':.85,scorpurtis:.90});
export const CHARGES=Object.freeze({kardozo:'FOUR ARMS. ZERO ALIBIS.',gaibden:'EXCESSIVE STATIC',kitaria:'ATTITUDE WITH A DEADLY WEAPON','keen-kahn':'CONTEMPT OF EVERYBODY',treytaro:'DISTURBING THE PIZZA','gare-chi':'POSSESSION OF BUGLES','datennisha-blaze':'CLEANING UP THE CRIME SCENE',nicoleena:'TONGUE OUT. QUESTIONS LATER.','cokane-o':'SUSPICIOUSLY SMOOTH',scorpurtis:'CHAIN OF BAD DECISIONS'});
export const ENTRANCE_LINES=Object.freeze({kardozo:'Well? Where the fuck is my applause?','keen-kahn':'NOW acknowledge me, motherfuckers.',gaibden:'NOT THE FUCKING SPEAKERS AGAIN!',kitaria:'You call THAT a throne?','gare-chi':'Fuck this. Who invited THESE motherfuckers?',treytaro:'Who the fuck ate my pizza?','datennisha-blaze':'HURRY UP, BITCH! I GOTTA PEE!',nicoleena:'Does this tongue come with a warranty?','cokane-o':'Who the fuck stole my mirror?',scorpurtis:'My chain got a restraining order.'});
export function nextThemeIndex(value){const n=Number(value);return value!==null&&Number.isInteger(n)&&n>=0&&n<SELECT_THEMES.length?(n+1)%SELECT_THEMES.length:0;}

// Each selection reaction follows the approved fighter personality without
// redrawing the face or introducing new playable characters.
export const SELECTION_EMOTES=Object.freeze({
 gaibden:{symbol:'⚡',line:'BAD CONNECTION! THE FLOOR IS DANCING.'},
 'gare-chi':{symbol:'🥨',line:'WHERE THE FUCK ARE MY BUGLES?!'},
 'datennisha-blaze':{symbol:'🧹',line:'HURRY UP, BITCH! I GOTTA PEE!'},
 treytaro:{symbol:'🍕',line:'THAT FLOOR’S FUCKED UP.'},
 kitaria:{symbol:'💨',line:'ACHOO! ...ANYWAY.'},
 'keen-kahn':{symbol:'👑',line:'WHO THE FUCK YOU LOOKING AT?!'},
 kardozo:{symbol:'💪',line:'FOUR ARMS. STILL NO APPLAUSE.'},
 nicoleena:{symbol:'🌀',line:'WHO ORDERED THE EXTRA-LONG TONGUE?!'},
 'cokane-o':{symbol:'🪞',line:'DON’T MESS UP THE BEARD.'},
 scorpurtis:{symbol:'⛓️',line:'CHAIN CHECK. BAD IDEA.'}
});
