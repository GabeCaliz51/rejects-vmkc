'use client';
import GameImage from './GameImage.jsx';
import { IMPORTED_FIGHTERS } from './combat/ImportedFighters.mjs';

import { useEffect, useRef, useState } from 'react';
import styles from './RvmkkShell.module.css';
import FightArena from './combat/FightArena';
import OnlineLobby from './OnlineLobby';
import SelectionStage from './SelectionStage';
import {SELECT_THEMES,nextThemeIndex} from './SelectionThemes.mjs';
import {createTower,towerResult,continueTower} from './combat/Tower.mjs';
import { STAGES, resolveStage } from './combat/StageCatalog.mjs';

// Game branding uses the rooster emblem. Do not add dragon logos to the UI or fighter art.
const ROOT = '/assets/rvmkk-rebuild';
const FIGHTERS = Object.freeze([
  { id: 'keen-kahn', name: 'KEEN-KAHN', color: '#f7bf52', art: `${ROOT}/fighters/keen-kahn-select.png` },
  { id: 'kitaria', name: 'KITARIA', color: '#6e9dff', art: `${ROOT}/fighters/kitaria.png` },
  { id: 'treytaro', name: 'TREYTARO', color: '#ed9f47', art: `${ROOT}/fighters/treytaro-select.png` },
  { id: 'kardozo', name: 'KARDOZO', color: '#ef705d', art: `${ROOT}/selection/kardozo.webp` },
  { id: 'gaibden', name: 'GAIBDEN', color: '#59ddff', art: `${ROOT}/fighters/gaibden.png` },
  { id: 'datennisha-blaze', name: "DA’TENNISHA BLAZE", color: '#b9b46b', art: `${ROOT}/fighters/datennisha-blaze.png` },
  { id: 'gare-chi', name: 'GARE-CHI', color: '#ec947c', art: `${ROOT}/fighters/gare-chi.png` },
  ...IMPORTED_FIGHTERS,
]);

const BOSS={id:'x-man',name:'X-MAN',color:'#e9b246',art:`${ROOT}/boss/x-man-silhouette-source.webp`};
function fighterById(id) {
  if(id==='x-man')return BOSS;
  return FIGHTERS.find((fighter) => fighter.id === id) ?? null;
}

function FighterImage({ fighter, className = '', priority = false }) {
  return <GameImage src={fighter.art} fallbackSrc={fighter.id==='x-man'||fighter.imported?undefined:`${ROOT}/combat/personality/${fighter.id}-frames/00.webp`} alt={fighter.name} className={className}
    draggable={false} loading={priority ? 'eager' : 'lazy'} decoding="async" />;
}

function PlayerPanel({ number, fighter, locked, active }) {
  return (
    <section className={`${styles.playerPanel} ${number === 1 ? styles.redSide : styles.blueSide} ${active ? styles.panelActive : ''}`}
      data-facing={number === 1 ? 'right' : 'left'} aria-label={`Player ${number} selection`}>
      <div className={styles.panelLabel}>
        <span>PLAYER {number}</span>
        <span className={styles.panelStatus}>{locked ? 'LOCKED IN' : active ? 'SELECTING' : 'WAITING'}</span>
      </div>
      {fighter ? (
        <div className={styles.panelBody}>
          <div className={styles.portraitFrame} style={{ '--fighter-color': fighter.color }}>
            <FighterImage fighter={fighter} className={styles.panelPortrait} priority />
          </div>
          <div className={styles.panelCopy}>
            <span className={styles.smallLabel}>{number === 1 ? 'YOUR FIGHTER' : 'YOUR OPPONENT'}</span>
            <h3 className={fighter.name.length > 15 ? styles.longName : undefined}>{fighter.name}</h3>
            <span className={styles.lockStatus}>{locked ? '✓ READY' : 'MAKE IT OFFICIAL.'}</span>
          </div>
        </div>
      ) : (
        <div className={styles.waitingPanel}>
          <span aria-hidden="true">0{number}</span>
          <p>PLAYER 1 PICKS FIRST.</p>
        </div>
      )}
    </section>
  );
}

export default function RvmkkShell() {
  const [screen, setScreen] = useState('title');
  const [themeIndex,setThemeIndex]=useState(0);
  // Rotate through the approved visual scenes automatically for every fight.
  // Players never choose the theme; the next scene is a surprise.
  const rotateTheme = () => setThemeIndex(index => (index + 1 + Math.floor(Math.random() * (SELECT_THEMES.length - 1))) % SELECT_THEMES.length);
  const [mode, setMode] = useState('quick');
  const [menuMode, setMenuMode] = useState('quick');
  const [tower,setTower]=useState(null);
  const [onlineMatch,setOnlineMatch]=useState(null);
  const [matchKey,setMatchKey]=useState(0);
  const [towerLoss,setTowerLoss]=useState(false);
  const [activePlayer, setActivePlayer] = useState(0);
  const [cursorId, setCursorId] = useState('gaibden');
  const [picks, setPicks] = useState([null, null]);
  const [selectionReaction, setSelectionReaction] = useState(null);
  const selectionTimer = useRef(null);
  useEffect(() => () => clearTimeout(selectionTimer.current), []);
  const [stageId, setStageId] = useState('throne-alley');
  const headingRef = useRef(null);
  const startRef = useRef(null);
  const cardRefs = useRef({});

  const focusedFighter = fighterById(cursorId) ?? FIGHTERS[4];
  const playerOne = fighterById(picks[0]);
  const playerTwo = fighterById(picks[1]);
  const selectedStage = resolveStage(stageId);

  useEffect(()=>{
    // Reuse the site's player: collapse its existing controls, without remounting audio.
    let observer;
    const collapseRadio=()=>{
      const frame=document.querySelector('body > div > img[alt="Rejects Radio"]')?.parentElement;
      if(!frame)return false;
      frame.querySelector('button[title="Minimize"]')?.click();
      observer?.disconnect();
      return true;
    };
    if(!collapseRadio()){observer=new MutationObserver(collapseRadio);observer.observe(document.body,{childList:true,subtree:true});}
    return()=>observer?.disconnect();
  },[]);

  useEffect(()=>{if(new URLSearchParams(window.location.search).has('room')){setMode('online');setScreen('online');}},[]);

  function startSelection(nextMode = mode) {
    clearTimeout(selectionTimer.current);
    setSelectionReaction(null);
    setMode(nextMode);rotateTheme();if(nextMode==='tower'){setTower(null);setTowerLoss(false);}
    setPicks([null, null]);
    setActivePlayer(0);
    setCursorId('gaibden');
    setScreen('select');
  }

  function returnToTitle() {
    clearTimeout(selectionTimer.current);
    setSelectionReaction(null);
    onlineMatch?.room.close();setOnlineMatch(null);
    setPicks([null, null]);
    setActivePlayer(0);
    setCursorId('gaibden');
    setScreen('title');
  }

  function lockSelection(id = cursorId) {
    if (!fighterById(id) || screen !== 'select' || selectionReaction) return;
    if (activePlayer === 1 && picks[0] === id) return;
    // Keep the approved portrait on screen long enough to show the selection gag.
    const chosenPlayer = activePlayer;
    setCursorId(id);
    setSelectionReaction({ id, player: chosenPlayer });
    clearTimeout(selectionTimer.current);
    selectionTimer.current = setTimeout(() => {
      setSelectionReaction(null);
      finishSelection(id, chosenPlayer);
    }, 1150);
  }

  function finishSelection(id, chosenPlayer) {
    if (chosenPlayer === 1 && picks[0] === id) return;
    if (chosenPlayer === 0) {
      if(mode==='tower'){
        let run;
        if(towerLoss&&tower){if(id===tower.opponents[tower.index])return;run=continueTower(tower,id);}else run=createTower(id,FIGHTERS);
        setTower(run);setTowerLoss(false);setPicks([id,run.opponents[run.index]]);setScreen('tower');return;
      }
      setPicks([id, null]);
      setActivePlayer(1);
      setCursorId(id === 'kitaria' ? 'gaibden' : 'kitaria');
    } else if (picks[0] && id !== picks[0]) {
      setPicks([picks[0], id]);
      setScreen('versus');
    }
  }

  function goBack() {
    if (selectionReaction) {
      clearTimeout(selectionTimer.current);
      setSelectionReaction(null);
      return;
    }
    if(screen==='tower'){setScreen('title');return;}
    if (screen === 'versus') {
      setCursorId(picks[1] ?? 'kitaria');
      setPicks([picks[0], null]);
      setActivePlayer(1);
      setScreen('select');
    } else if (screen === 'select' && activePlayer === 1) {
      setCursorId(picks[0] ?? 'gaibden');
      setPicks([null, null]);
      setActivePlayer(0);
    } else if (screen === 'select') {
      returnToTitle();
    }
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (screen === 'title') startRef.current?.focus({ preventScroll: true });
      else headingRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [screen, activePlayer]);

  useEffect(() => {
    function onKeyDown(event) {
      if (screen === 'fight') return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Escape' && screen !== 'title') {
        event.preventDefault();
        goBack();
        return;
      }
      if (screen === 'select' && ['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) {
        event.preventDefault();
        const available = FIGHTERS.filter((fighter) => activePlayer === 0 || fighter.id !== picks[0]);
        const index = available.findIndex((fighter) => fighter.id === cursorId);
        const direction = ['ArrowLeft', 'a', 'A'].includes(event.key) ? -1 : 1;
        const next = available[(index + direction + available.length) % available.length];
        setCursorId(next.id);
        cardRefs.current[next.id]?.focus({ preventScroll: true });
        return;
      }
      if (event.key === 'Enter' && !event.repeat && !event.target?.closest?.('button, a')) {
        if (screen === 'title') { event.preventDefault(); startSelection(); }
        else if (screen === 'select') { event.preventDefault(); lockSelection(); }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, activePlayer, cursorId, picks]);

  return (
    <main className={styles.shell} data-screen={screen}>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.content}>
        <header className={styles.topbar}>
          <span className={styles.exclusive}><i aria-hidden="true" /> REJECTSUNIVERSE.COM EXCLUSIVE</span>
          {screen === 'title' ? <span className={styles.brandNote}>NO CRYING ON THE WALL.</span> : (
            <button className={styles.quietButton} onClick={returnToTitle}>← TITLE SCREEN</button>
          )}
        </header>

        {screen === 'title' && (
          <section className={styles.titleScreen} aria-labelledby="rvmkk-title">
            <div className={styles.titleCopy}>
              <div className={styles.brandHeading}>
                <h1 id="rvmkk-title" className={styles.illustratedBrand}>
                  <GameImage src={`${ROOT}/title-logo.webp`} alt="" aria-hidden="true" draggable={false} fetchPriority="high" width="1935" height="813" />
                  <span className={styles.accessibleTitle}>REJECTS VERY MORTAL KUMBAT KOCKFIGHT</span>
                </h1>
              </div>
              <div className={styles.menuIntro}><h2>CHOOSE YOUR CHAOS</h2><p>Big egos. Bad decisions. Your move.</p></div>
              <nav className={styles.modeGrid} aria-label="Game modes">
                {[
                  {id:'quick',label:'SOLO · VS CPU',title:'ANYBODY CAN GET IT',line:'One fight. Absolutely no dignity.',art:'solo',action:'PICK A FIGHT'},
                  {id:'tower',label:'ARCADE · TOWER',title:'STAND ON BUSINESS',line:'Climb the roster. Humble the egos.',art:'tower',action:'START THE CLIMB'},
                  {id:'versus',label:'TWO PLAYERS · VS',title:'FUCK AROUND AND FIND OUT',line:'Friendship is about to get tested.',art:'versus',action:'SETTLE IT'}
                ].map(item=><button key={item.id} ref={item.id==='quick'?startRef:undefined}
                  className={`${styles.modeCard} ${menuMode===item.id?styles.modeActive:''}`}
                  data-mode={item.id} aria-pressed={menuMode===item.id}
                  onFocus={()=>setMenuMode(item.id)} onMouseEnter={()=>setMenuMode(item.id)}
                  onClick={()=>{setMenuMode(item.id);if(item.id!=='versus')startSelection(item.id);}}
                  onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const buttons=[...event.currentTarget.parentElement.querySelectorAll('button')];buttons[(buttons.indexOf(event.currentTarget)+(event.key==='ArrowRight'?1:2))%3].focus();}}}>
                  <div className={styles.modeArtwork}><GameImage className={styles.modeFighter} src={`${ROOT}/menu/${item.art}.webp`} alt="" draggable={false}/></div>
                  <div className={styles.modeCardCopy}>
                  <span className={styles.modeNumber}>{item.label}</span>
                  <strong>{item.title}</strong><span className={styles.modeTagline}>{item.line}</span>
                  <b>{item.action} <span aria-hidden="true">↗</span></b></div>
                </button>)}
              </nav>
              <div className={styles.modeDock} aria-live="polite">
                {menuMode==='versus'?<><span>HOW ARE WE SETTLING THIS?</span><div className={styles.versusChoice}>
                  <button onClick={()=>startSelection('local')}>COUCH GRUDGE <small>LOCAL VS · SAME SCREEN</small></button>
                  <button onClick={()=>{setMode('online');setScreen('online');}}>LONG-DISTANCE BEEF <small>ONLINE VS · ROOM CODE</small></button>
                </div></>:<p>{menuMode==='tower'?'ARCADE TOWER · Three continues. One mystery boss. Zero manners.':'QUICK FIGHT · Choose your fighter, your opponent, and where it goes down.'}</p>}
              </div>
              <details className={styles.controlsGuide}>
                <summary>CONTROLS &amp; HOW TO PLAY</summary>
                <div><p><strong>PHONE:</strong> Rotate sideways for a wider arena. Use the left arrows to move, jump, or crouch. Right-side buttons give you separate left/right punches and kicks, block, GAG, and SPECIAL.</p>
                <p><strong>KEYBOARD P1:</strong> A / D move · W jump · S crouch · F / T punches · G / Y kicks · H block · R gag · E special.</p>
                <p><strong>KEYBOARD P2:</strong> Arrow keys move, jump, and crouch · J / I punches · K / P kicks · L block · O gag · U special.</p>
                <p><strong>WIN:</strong> Take two rounds. Special: full Reject meter, E/U or Block+Right Punch. GAG: 35 meter after landing a clean hit. Throw: both punches or both kicks. Crouch or jump changes strikes. ESC pauses.</p></div>
              </details>
              <div className={styles.menuFooter}><a href="/playground">← BACK TO THE PLAYGROUND</a><span><kbd>ENTER</kbd> SOLO <kbd>TAB</kbd> CHOOSE</span></div>
            </div>
            <figure className={styles.coverFrame}>
              <GameImage src={`${ROOT}/cover.png`} alt="Approved RVMKK fighting-game cover with the established fighters and rooster emblems."
                className={styles.cover} draggable={false} fetchPriority="high" width="1024" height="1536" />
              <figcaption className={styles.coverCaption}>REJECTS VERY MORTAL KUMBAT KOCKFIGHT</figcaption>
            </figure>
          </section>
        )}

        {screen === 'select' && (
          <section className={styles.selectionScreen} aria-labelledby="rvmkk-select-title">
            <div className={styles.screenHeading}>
              <p className={styles.eyebrow}>{mode === 'tower' ? 'STAND ON BUSINESS · CHOOSE YOUR FIGHTER' : mode === 'quick' ? 'ANYBODY CAN GET IT · SINGLE PLAYER' : 'FUCK AROUND AND FIND OUT · LOCAL VS'}</p>
              <h1 id="rvmkk-select-title" ref={headingRef} tabIndex={-1}>{SELECT_THEMES[themeIndex].title}</h1>
              <p>{SELECT_THEMES[themeIndex].line}</p>
              <p className={styles.sceneSurprise} aria-live="polite">A NEW SCENE EVERY FIGHT. YOU DON'T GET TO PICK.</p>
              <p className={styles.selectionPrompt} aria-live="polite">
                <span className={activePlayer === 0 ? styles.playerOneText : styles.playerTwoText}>PLAYER {activePlayer + 1}</span>
                {activePlayer === 0 ? ' — Click a fighter to pick them.' : mode === 'quick' ? ' — Pick the CPU opponent.' : ' — Player 2 picks their fighter.'}
              </p>
            </div>

            <SelectionStage themeId={SELECT_THEMES[themeIndex].id} fighters={FIGHTERS} focused={focusedFighter} playerOne={playerOne} activePlayer={activePlayer} selectionReaction={selectionReaction} onPick={(id)=>lockSelection(id)} onHighlight={(id)=>{if (!selectionReaction) setCursorId(id);}}/>
            {playerOne && <div className={styles.lockedReveal} data-side="1" style={{'--fighter-color':playerOne.color}}>
              <div className={styles.lockedBust} data-facing="right"><FighterImage fighter={playerOne} priority/></div>
              <div className={styles.lockedCopy}><span>PLAYER 1 · LOCKED IN</span><strong>{playerOne.name}</strong></div>
            </div>}
            <div className={styles.roster} aria-label={`${FIGHTERS.length} confirmed playable fighters`}>
              {FIGHTERS.map((fighter) => {
                const lockedByOne = picks[0] === fighter.id;
                const disabled = activePlayer === 1 && lockedByOne || mode==='tower'&&towerLoss&&fighter.id===tower?.opponents[tower.index];
                const highlighted = cursorId === fighter.id;
                return (
                  <button key={fighter.id} ref={(node) => { cardRefs.current[fighter.id] = node; }}
                    data-fighter={fighter.id} className={`${styles.fighterCard} ${highlighted ? styles.cardSelected : ''} ${disabled ? styles.cardLocked : ''}`}
                    style={{ '--fighter-color': fighter.color }} disabled={disabled}
                    aria-label={`${fighter.name}${disabled ? ', locked by Player 1' : ''}`} aria-pressed={highlighted}
                    onFocus={() => { if (!selectionReaction) setCursorId(fighter.id); }}
                    onMouseEnter={() => { if (!selectionReaction) setCursorId(fighter.id); }}
                    onClick={() => lockSelection(fighter.id)}
                    onKeyDown={(event) => {
                      if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                        event.preventDefault(); event.stopPropagation(); lockSelection(fighter.id);
                      }
                    }}>
                    <span className={styles.cardNumber} aria-hidden="true">{String(FIGHTERS.indexOf(fighter) + 1).padStart(2, '0')}</span>
                    {lockedByOne && <span className={styles.playerBadge}>P1 ✓</span>}
                    <div className={styles.cardArt}><FighterImage fighter={fighter} priority /></div>
                    <span className={`${styles.cardName} ${fighter.name.length > 15 ? styles.longName : ''}`}>{fighter.name}</span>
                    <span className={styles.cardUnderline} aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            <div className={styles.selectionSummary} aria-live="polite"><span>P1 · {playerOne?.name??focusedFighter.name} {playerOne?'✓ LOCKED':''}</span><b>VS</b><span>P2 · {activePlayer===1?focusedFighter.name:'PICKS NEXT'}</span></div>

            <div className={styles.selectionActions}>
              <button className={styles.secondaryButton} onClick={goBack}>← {activePlayer === 1 ? 'CHANGE PLAYER 1' : 'BACK'}</button>
              <button className={`${styles.primaryButton} ${activePlayer === 1 ? styles.blueButton : ''}`} disabled={!!selectionReaction} onClick={() => lockSelection()}>
                LOCK IN PLAYER {activePlayer + 1} <span aria-hidden="true">→</span>
              </button>
            </div>
            <p className={styles.keyboardGuide}><kbd>←</kbd><kbd>→</kbd> SELECT <span>·</span> <kbd>ENTER</kbd> LOCK IN <span>·</span> <kbd>ESC</kbd> BACK</p>
          </section>
        )}

        {screen === 'versus' && playerOne && playerTwo && (
          <section className={styles.versusScreen} aria-labelledby="rvmkk-versus-title">
            <div className={styles.screenHeading}>
              <p className={styles.eyebrow}>THE MATCHUP</p>
              <h1 id="rvmkk-versus-title" ref={headingRef} tabIndex={-1}>FIGHTERS LOCKED IN</h1>
            </div>
            <div className={styles.versusGrid}>
              {[playerOne, playerTwo].map((fighter, index) => (
                <div key={fighter.id} className={`${styles.versusFighter} ${index === 0 ? styles.redSide : styles.blueSide}`}>
                  <span className={styles.versusPlayer}>PLAYER {index + 1}</span>
                  <div className={styles.versusPortrait} data-side={index + 1} style={{ '--fighter-color': fighter.color }}>
                    <FighterImage fighter={fighter} priority />
                  </div>
                  <h2 className={fighter.name.length > 15 ? styles.longName : undefined}>{fighter.name}</h2>
                </div>
              ))}
              <span className={styles.bigVs} aria-hidden="true">VS</span>
            </div>
            <section className={styles.stagePicker} aria-label="Choose arena">
              <div className={styles.stageHeading}><h2>PICK YOUR ARENA</h2><span>7 LIVING BACKGROUNDS</span></div>
              <div className={styles.stageGrid}>
                {STAGES.map(stage => <button key={stage.id} data-stage={stage.id} aria-label={`Choose ${stage.name}`} aria-pressed={stageId === stage.id}
                  className={stageId === stage.id ? styles.activeStage : ''} onClick={() => setStageId(stage.id)}>
                  <GameImage src={stage.art} alt="" width={320} height={180} loading="lazy" decoding="async" draggable={false} />
                  <span>{stage.name}</span>
                </button>)}
              </div>
              <p><strong>{selectedStage.name}</strong><span>Moving scenery, surprise sight gags. Tap background props or land a heavy hit to start trouble.</span></p>
            </section>
            <div className={styles.versusActions}>
              <button className={styles.primaryButton} onClick={() => setScreen('fight')}>ENTER THE ARENA <span aria-hidden="true">→</span></button>
              <button className={styles.secondaryButton} onClick={goBack}>CHANGE FIGHTERS <span aria-hidden="true">↺</span></button>
              <button className={styles.secondaryButton} onClick={returnToTitle}>TITLE SCREEN</button>
            </div>
          </section>
        )}

        {screen==='online'&&<OnlineLobby fighters={FIGHTERS} stages={STAGES} onBack={returnToTitle} onStart={match=>{setOnlineMatch(match);setPicks([match.playerOne.id,match.playerTwo.id]);setStageId(match.stageId);setMatchKey(k=>k+1);setScreen('fight');}}/>}
        {screen==='tower'&&tower&&<section className={styles.selectionScreen}>
          <div className={styles.screenHeading}><p className={styles.eyebrow}>STAND ON BUSINESS</p><h1>{tower.complete?'BUSINESS HANDLED.':tower.gameOver?'OUT OF CONTINUES.':towerLoss?'RUN IT BACK?':'CLIMB THE TOWER'}</h1><p>{tower.continues} CONTINUES LEFT · {fighterById(tower.fighterId)?.name}</p></div>
          <ol className={styles.towerList}>{[...tower.opponents].reverse().map((id,i)=>{const step=tower.opponents.length-1-i;const fighter=fighterById(id);return <li key={id} data-current={step===tower.index} data-cleared={step<tower.index}>
            <span>{step<tower.index?'✓':step+1}</span><GameImage src={fighter.art} alt={id==='x-man'?'Unknown final boss silhouette':fighter.name} style={id==='x-man'?{filter:'brightness(0)'}:undefined}/><strong>{id==='x-man'?'???':fighter.name}</strong>
          </li>;})}</ol>
          <div className={styles.versusActions}>
          {tower.complete||tower.gameOver?<button className={styles.primaryButton} onClick={()=>startSelection('tower')}>START A NEW TOWER</button>:towerLoss?<>
            <button disabled={tower.continues===0} className={styles.primaryButton} onClick={()=>{setTower(continueTower(tower,tower.fighterId));setTowerLoss(false);setMatchKey(k=>k+1);setScreen('fight');}}>CONTINUE · SAME FIGHTER</button>
            <button disabled={tower.continues===0} className={styles.secondaryButton} onClick={()=>{setPicks([null,null]);setActivePlayer(0);setScreen('select');}}>CONTINUE · CHANGE FIGHTER</button>
          </>:<button className={styles.primaryButton} onClick={()=>{setPicks([tower.fighterId,tower.opponents[tower.index]]);setStageId(STAGES[tower.index%STAGES.length].id);setMatchKey(k=>k+1);setScreen('fight');}}>NEXT FIGHT</button>}
          <button className={styles.secondaryButton} onClick={returnToTitle}>TITLE SCREEN</button></div>
        </section>}

        {screen === 'fight' && playerOne && playerTwo && (
          <FightArena key={matchKey} cpu={mode === 'quick'||mode==='tower'} online={onlineMatch?.room??null} tower={mode==='tower'?tower:null} onTowerResult={winner=>{const next=towerResult(tower,winner);setTower(next);setTowerLoss(winner===1);setScreen('tower');}} playerOne={playerOne} playerTwo={playerTwo} stageId={stageId} onBack={() => mode==='tower'?returnToTitle():mode==='online'?returnToTitle():setScreen('versus')}
            onChangeFighters={() => { if(mode==='online'){returnToTitle();return;}if(mode==='tower'){returnToTitle();return;} setPicks([null, null]); setActivePlayer(0); setCursorId('gaibden'); setScreen('select'); }} />
        )}

        <footer className={styles.footer}><span>RVMKK</span><span>THICK SKIN REQUIRED.</span></footer>
      </div>
    </main>
  );
}
