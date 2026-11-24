export function createTower(fighterId,roster,random=Math.random){
 const opponents=roster.filter(f=>f.id!==fighterId).map(f=>f.id);
 for(let i=opponents.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[opponents[i],opponents[j]]=[opponents[j],opponents[i]];}
 return {opponents:[...opponents,'x-man'],index:0,continues:3,fighterId,complete:false,gameOver:false};
}
export function towerResult(run,winner){if(winner===null)return run;if(winner===0){const index=run.index+1;return {...run,index,complete:index>=run.opponents.length};}return {...run,gameOver:run.continues===0};}
export function continueTower(run,fighterId){if(run.gameOver||run.continues<=0)throw Error('No continues remaining.');if(fighterId===run.opponents[run.index])throw Error('Choose a different fighter than this opponent.');return {...run,continues:run.continues-1,fighterId};}
