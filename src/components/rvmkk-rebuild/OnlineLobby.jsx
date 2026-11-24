'use client';
import {useEffect,useRef,useState} from 'react';
import {createClient} from './OnlineClient.mjs';
import {OnlineRoom} from './combat/OnlineRoom.mjs';
import styles from './RvmkkShell.module.css';
export default function OnlineLobby({fighters,stages,onStart,onBack}){
 const roomRef=useRef(null),started=useRef(false);
 const [code,setCode]=useState(''),[role,setRole]=useState(null),[message,setMessage]=useState('Create a room or enter your opponent’s code.'),[connected,setConnected]=useState(false),[peer,setPeer]=useState(false),[busy,setBusy]=useState(false);
 const [own,setOwn]=useState(fighters[0].id),[stage,setStage]=useState(stages[0].id),[config,setConfig]=useState(null),[ready,setReady]=useState(false),[remoteReady,setRemoteReady]=useState(false),[copied,setCopied]=useState(false);
 const opponentRef=useRef(null),choiceRef=useRef(own),stageRef=useRef(stage),readyRef=useRef(false),remoteReadyRef=useRef(false);
 choiceRef.current=own;stageRef.current=stage;
 function validConfig(c){return c?.version===1&&c.players?.length===2&&c.players[0]!==c.players[1]&&c.players.every(id=>fighters.some(f=>f.id===id))&&stages.some(s=>s.id===c.stage);}
 function begin(room,c){if(!validConfig(c)||started.current)return;started.current=true;onStart({room,playerOne:fighters.find(f=>f.id===c.players[0]),playerTwo:fighters.find(f=>f.id===c.players[1]),stageId:c.stage});}
 async function connect(host){
  if(busy||roomRef.current)return;setBusy(true);setMessage('Connecting…');
  const nextCode=host?crypto.randomUUID().replace(/-/g,'').slice(0,16).toUpperCase():code.trim().toUpperCase();
  const room=new OnlineRoom(createClient(),{code:nextCode,host,onChange:event=>{
   if(event.error)setMessage(event.error);
   if(event.peer){setPeer(true);setMessage(host?'Opponent joined. Choose your fighter, then ready up.':'Connected. Choose your fighter, then ready up.');}
   if(event.choice&&host&&fighters.some(f=>f.id===event.choice)){opponentRef.current=event.choice;
    if(event.choice===choiceRef.current){setConfig(null);room.setConfig(null);setMessage('Choose different fighters.');return;}
    const c={version:1,players:[choiceRef.current,event.choice],stage:stageRef.current};room.setConfig(c);setConfig(c);
   }
   if(Object.prototype.hasOwnProperty.call(event,'config')&&event.config===null){setConfig(null);setMessage('Choose different fighters.');}
   if(event.config&&validConfig(event.config)){setConfig(event.config);setMessage('Match ready. Check your fighter and press READY.');}
   if(event.ready){setRemoteReady(true);remoteReadyRef.current=true;if(host&&readyRef.current&&validConfig(room.config)){room.send('start');begin(room,room.config);}}
   if(event.start&&!host)begin(room,room.config);
  }});
  roomRef.current=room;
  try{await room.open();setCode(nextCode);setRole(host?'host':'guest');setConnected(true);setMessage(host?'Share this room code or challenge link. Waiting for opponent…':'Waiting for the host…');}
  catch(error){setMessage(error.message);await room.close();roomRef.current=null;}finally{setBusy(false);}
 }
 useEffect(()=>{const value=new URLSearchParams(window.location.search).get('room');if(value&&/^[a-f0-9]{16}$/i.test(value))setCode(value.toUpperCase());return()=>{if(!started.current)roomRef.current?.close();};},[]);
 useEffect(()=>{const room=roomRef.current;if(!room||!peer||ready)return;if(room.host){const opponent=opponentRef.current;if(opponent&&own!==opponent){const c={version:1,players:[own,opponent],stage};room.setConfig(c);setConfig(c);}else if(opponent){setConfig(null);room.setConfig(null);}}else room.send('choice',{fighter:own});},[own,stage,peer,ready]);
 function confirmReady(){const room=roomRef.current;if(!room||!validConfig(config))return;if(config.players[room.host?0:1]!==own){setMessage('Waiting for fighter selection to synchronize.');return;}setReady(true);readyRef.current=true;room.send('ready');if(room.host&&remoteReadyRef.current){room.send('start');begin(room,config);}}
 async function copyLink(){try{await navigator.clipboard.writeText(window.location.origin+window.location.pathname+'?room='+code);setCopied(true);}catch{setMessage('Copy the room code shown below and send it to your opponent.');}}
 return <section className={styles.selectionScreen}><div className={styles.screenHeading}><p className={styles.eyebrow}>FUCK AROUND AND FIND OUT</p><h1>ONLINE CHALLENGE</h1><p role="status">{message}</p></div>
 <div className={styles.onlinePanel}>
 {!connected?<><button disabled={busy} className={styles.primaryButton} onClick={()=>connect(true)}>CREATE ROOM</button><label>ROOM CODE<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={16} autoComplete="off" spellCheck={false}/></label><button disabled={busy||!/^[A-F0-9]{16}$/.test(code)} className={styles.secondaryButton} onClick={()=>connect(false)}>JOIN ROOM</button></>:<><p>ROOM CODE <strong>{code}</strong></p><button className={styles.secondaryButton} onClick={copyLink}>{copied?'LINK COPIED':'COPY CHALLENGE LINK'}</button><label>YOUR FIGHTER<select value={own} disabled={ready} onChange={e=>{setOwn(e.target.value);}}>{fighters.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>{role==='host'&&<label>ARENA<select value={stage} disabled={ready} onChange={e=>setStage(e.target.value)}>{stages.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
 <p>{peer?'OPPONENT CONNECTED':'WAITING FOR OPPONENT'} · {remoteReady?'OPPONENT READY':'OPPONENT NOT READY'}</p><button disabled={ready||!validConfig(config)} className={styles.primaryButton} onClick={confirmReady}>{ready?'WAITING FOR OPPONENT':'READY TO FIGHT'}</button></>}
 <button className={styles.secondaryButton} onClick={async()=>{await roomRef.current?.close();onBack();}}>LEAVE ROOM</button>
 <p>Private casual matches. The host runs combat; no account points are awarded. Leaving a match counts as a forfeit.</p>
 </div></section>;
}
