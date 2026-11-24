// Heights relative to the original three-unit hurtbox. Preserve original body proportions.
export const FIGHTER_SCALE=Object.freeze({'x-man':.69,'kardozo':1.10,'keen-kahn':1.10,'treytaro':.99,'gaibden':.99,'gare-chi':.94,'datennisha-blaze':.88,'kitaria':.89,'nicoleena':.91,'cokane-o':.93,'scorpurtis':.95});
export const fighterScale=id=>FIGHTER_SCALE[id]??1;
