'use client';
import GameImage from './GameImage.jsx';
import {useEffect,useRef,useState} from 'react';
import {SELECT_THEMES,SELECTION_HEIGHT,CHARGES,ENTRANCE_LINES,SELECTION_EMOTES} from './SelectionThemes.mjs';
import styles from './SelectionStage.module.css';
const ROOT='/assets/rvmkk-rebuild';
// Use each fighter's unchanged, approved main portrait instead of swapping to
// alternate personality sheets with inconsistent faces. The emotes transform the
// entire image, not individual facial features or disconnected body parts.
function Actor({fighter,active=false,beat=0,role='guest',face='right',reacting=false}){
 return <div className={`${styles.actor} ${active?styles.highlight:''}`} data-character={fighter.id}
   data-role={role} data-facing={face} data-beat={beat} data-reacting={reacting}
   style={{'--height':SELECTION_HEIGHT[fighter.id]??.84}}>
   <GameImage src={fighter.art} alt={fighter.name} draggable={false}/>
 </div>;
}
export default function SelectionStage({themeId,fighters,focused,playerOne,activePlayer,selectionReaction=null,onPick=()=>{},onHighlight=()=>{}}){
 const [beat,setBeat]=useState(0),[revealed,setRevealed]=useState(false),[old,setOld]=useState(null);
 const previous=useRef(focused);
 const theme=SELECT_THEMES.find(t=>t.id===themeId)??SELECT_THEMES[0];
 const reacting=selectionReaction?.id===focused.id;
 useEffect(()=>{
   setOld(previous.current.id!==focused.id?previous.current:null);previous.current=focused;
   setBeat(0);setRevealed(false);
   const timers=[setTimeout(()=>setRevealed(true),90),setTimeout(()=>setBeat(1),550),setTimeout(()=>setBeat(2),1200),setTimeout(()=>setOld(null),650)];
   return()=>timers.forEach(clearTimeout);
 },[focused.id,themeId]);
 const left=activePlayer===0?focused:playerOne;
 const right=activePlayer===1?focused:null;
 return <div className={styles.stage} data-theme={theme.id} data-revealed={revealed} aria-label={`${theme.title}, ${focused.name} highlighted`}>
   <GameImage className={styles.backdrop} src={`${ROOT}/selection/${theme.id}.webp`} alt=""/>
   <div className={styles.vignette}/>
   {theme.id==='lineup'?<div className={styles.lineup} style={{'--roster-count':fighters.length}}>
     {fighters.map(f=><button type="button" key={f.id} className={styles.suspect} data-active={f.id===focused.id} onMouseEnter={()=>onHighlight(f.id)} onFocus={()=>onHighlight(f.id)} onClick={()=>onPick(f.id)} aria-label={`Choose ${f.name}`}>
       <Actor fighter={f} active={f.id===focused.id} beat={beat} reacting={reacting&&f.id===focused.id} face={activePlayer===0?'right':'left'}/><span className={styles.charge}>{CHARGES[f.id]??f.name}</span>
     </button>)}
   </div>:theme.id==='party'?<>
     <div className={styles.guests}>{fighters.filter(f=>f.id!==focused.id).map(f=><button type="button" key={f.id} className={styles.guestPick} onMouseEnter={()=>onHighlight(f.id)} onFocus={()=>onHighlight(f.id)} onClick={()=>onPick(f.id)} aria-label={`Choose ${f.name}`}><Actor fighter={f} active={f.id===focused.id} face={activePlayer===0?'right':'left'}/></button>)}</div>
     {old&&<div key={`exit-${old.id}`} className={styles.ejected}><Actor fighter={old}/><span>MOVE, MOTHERFUCKER.</span></div>}
     <button type="button" key={focused.id} className={styles.entrance} data-character={focused.id} onClick={()=>onPick(focused.id)} aria-label={`Choose ${focused.name}`}><Actor fighter={focused} active beat={beat} role="selected" reacting={reacting} face={activePlayer===0?'right':'left'}/></button>
     <div key={`doors-${focused.id}`} className={styles.partyDoors} aria-hidden="true"><i/><i/></div>
     <p className={styles.partySign}>NO +1s. ESPECIALLY YOU.</p>
     <p key={`line-${focused.id}`} className={styles.entranceLine}>{ENTRANCE_LINES[focused.id]??focused.name}<small>… awkward silence … *cough*</small></p>
   </>:<div className={styles.duel}>
     {[left,right].map((f,i)=><div className={styles.slot} key={i} data-side={i}>
       <div className={styles.actorSpace}>{f?<button type="button" className={styles.actorPick} onClick={()=>i===activePlayer&&onPick(f.id)} disabled={i!==activePlayer} aria-label={`Choose ${f.name}`}><Actor key={`${f.id}-${theme.id}`} fighter={f} active={i===activePlayer} beat={beat} role="selected" face={i===0?'right':'left'} reacting={reacting&&i===activePlayer}/></button>:<span className={styles.waiting}>P2<br/><small>YOUR TURN NEXT.</small></span>}</div>
       {theme.id==='elevators'&&<div key={`door-${focused.id}-${i}`} className={styles.liftDoors} data-open={!!f&&(i!==activePlayer||revealed)} aria-hidden="true"><i/><i/></div>}
       {theme.id==='weighin'&&<span className={styles.readout}>{f?'READY':'WAITING'}</span>}
       <strong className={styles.name}>{f?f.name:`PLAYER ${i+1}`}</strong>
     </div>)}
     {theme.id==='faceoff'&&<b className={styles.vs}>VS</b>}
   </div>}
   {reacting&&<div className={styles.pickReaction} data-character={focused.id} key={`${focused.id}-${selectionReaction.player}`} role="status">
     <span className={styles.pickReactionBurst} aria-hidden="true">{SELECTION_EMOTES[focused.id]?.symbol??'💥'}</span>
     <strong>{SELECTION_EMOTES[focused.id]?.line??'WHAT THE HELL?!'}</strong>
     <small>PLAYER {selectionReaction.player+1} · LOCKED IN</small>
   </div>}
 </div>;
}
