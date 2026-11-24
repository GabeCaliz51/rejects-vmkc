'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './FightArena.module.css';
import { finisherFor, finisherBeat } from './Fucktalities.mjs';
import { resolveStage } from './StageCatalog.mjs';

const TOUCH_ACTIONS = [['punchLeft', 'L PUNCH'], ['punchRight', 'R PUNCH'], ['kickLeft', 'L KICK'], ['kickRight', 'R KICK'], ['block', 'BLOCK'], ['comedy', 'GAG'], ['special', 'SPECIAL']];

export default function FightArena({ playerOne, playerTwo, stageId = 'throne-alley', cpu = false, online = null, tower = null, onTowerResult, onBack, onChangeFighters }) {
  const hostRef = useRef(null), canvasMountRef = useRef(null), engineRef = useRef(null), modalRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loadProgress,setLoadProgress]=useState({loaded:0,total:0});
  const [revision, setRevision] = useState(0);
  const definitions = [playerOne, playerTwo];
  const stage = resolveStage(stageId);
  const [controlsOpen, setControlsOpen] = useState(true), [touchPlayer, setTouchPlayer] = useState(online&&!online.host?'2':'1'), [touchHeld, setTouchHeld] = useState({});
  const touchPointers = useRef(new Map()), controlsId = useId();
  const sticks = useRef(new Map());
  const [stickVisual,setStickVisual]=useState({});
  const fullscreenTried=useRef(false);
  function enterFightScreen(){
    if(!window.matchMedia('(pointer: coarse), (max-width:800px)').matches||document.fullscreenElement||fullscreenTried.current)return;
    fullscreenTried.current=true;
    hostRef.current?.requestFullscreen?.().then(()=>screen.orientation?.lock?.('landscape')).catch(()=>{fullscreenTried.current=false;});
  }
  function stick(event,player,end=false){
    event.preventDefault();
    let held=sticks.current.get(player);
    if(event.type==='pointerdown'){if(held)return;event.currentTarget.setPointerCapture(event.pointerId);const r=event.currentTarget.getBoundingClientRect();held={id:event.pointerId,x:r.left+r.width/2,y:r.top+r.height/2,actions:[]};sticks.current.set(player,held);}
    if(!held||held.id!==event.pointerId)return;
    const dx=event.clientX-held.x,dy=event.clientY-held.y,dead=16;
    const actions=end?[]:[...(dx < -dead?['left']:dx>dead?['right']:[]),...(dy < -dead?['jump']:dy>dead?['down']:[]),'backGuard'];
    for(const a of held.actions)if(!actions.includes(a))engineRef.current?.touch(player,a,`stick:${player}:${a}`,false);
    for(const a of actions)if(!held.actions.includes(a))engineRef.current?.touch(player,a,`stick:${player}:${a}`,true);
    held.actions=actions;
    if(end)sticks.current.delete(player);
    const length=Math.hypot(dx,dy),scale=Math.min(1,38/(length||1));
    setStickVisual(v=>({...v,[player]:end?{x:0,y:0}:{x:dx*scale,y:dy*scale}}));
  }
  useEffect(() => {
    const media = window.matchMedia('(max-width: 800px), (pointer: coarse)');
    const previous = document.body.style.overflow;
    const resize = () => { document.body.style.overflow = media.matches ? 'hidden' : previous; };
    resize(); media.addEventListener('change', resize);
    return () => { media.removeEventListener('change', resize); document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    if (status?.paused || status?.phase !== 'fight') { touchPointers.current.clear(); sticks.current.clear(); setStickVisual({}); setTouchHeld({}); }
  }, [status?.paused, status?.phase]);

  function clearTouchControls() {
    touchPointers.current.clear(); sticks.current.clear(); setStickVisual({}); setTouchHeld({}); engineRef.current?.clearControls();
  }
  function chooseTouchPlayer(value) { clearTouchControls(); setTouchPlayer(value); }
  function toggleControls() { clearTouchControls(); setControlsOpen(value => !value); }


  useEffect(() => {
    let cancelled = false, engine = null, canvas = null, startupTimer, startupTimedOut=false;
    const mount = canvasMountRef.current, host = hostRef.current;
    const release = () => {
      clearTimeout(startupTimer);
      if (engineRef.current === engine) engineRef.current = null;
      engine?.dispose();
      canvas?.remove();
    };
    setStatus(null); setError('');setLoadProgress({loaded:0,total:0});
    startupTimer=setTimeout(()=>{if(cancelled)return;startupTimedOut=true;release();setError('The arena took too long to load. Retry the arena. If this is inside an app, open this page in Chrome or Safari.');},45000);
    (async () => {
      try {
        const { ArenaEngine } = await import('./ArenaEngine.mjs');
        if (cancelled || startupTimedOut || !mount || !host) return;
        // Each effect owns its canvas, including during development replays and slow image loads.
        // Disposing an abandoned renderer must never close another instance's WebGL context.
        canvas = document.createElement('canvas');
        canvas.className = styles.canvas;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `${playerOne.name} versus ${playerTwo.name} at ${stage.name}; tap background props for a gag`);
        mount.appendChild(canvas);
        engine = new ArenaEngine({ canvas, host, fighters: [playerOne, playerTwo], stageId, cpu, online,
          onUpdate: next => { if (!cancelled) setStatus(next); },
          onLoadProgress: progress=>{if(!cancelled&&!startupTimedOut)setLoadProgress(progress);},
          onError: problem => { if (!cancelled) setError(problem.message); } });
        engineRef.current = engine;
        await engine.loadFighters();
        if (cancelled || startupTimedOut || engine.disposed) return;
        clearTimeout(startupTimer);
        engine.start();
      } catch (problem) {
        release();
        if (!cancelled&&!startupTimedOut) setError(problem?.message || 'The arena could not start. Please reload it.');
      }
    })();
    return () => { cancelled = true; release(); };
  }, [playerOne.id, playerTwo.id, stageId, revision, cpu, online]);

  const hasResult = status?.phase === 'roundOver' || status?.phase === 'matchOver';
  const modal = Boolean(error || status?.paused || hasResult);
  useEffect(() => {
    if (!modal) return;
    const frame = requestAnimationFrame(() => modalRef.current?.querySelector('button')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [modal, status?.phase, error]);

  function handleModalKeys(event) {
    if (event.key === 'Escape' && status?.paused && !error) {
      event.preventDefault(); event.stopPropagation(); engineRef.current?.pause(false);
    } else if (event.key === 'Tab') {
      const buttons = [...modalRef.current.querySelectorAll('button:not(:disabled)')];
      if (!buttons.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  function touch(event, player, action, down) {
    event.preventDefault();
    if (down) { event.currentTarget.setPointerCapture(event.pointerId); hostRef.current?.focus({ preventScroll: true }); }
    if (down) touchPointers.current.set(event.pointerId, [player, action]);
    else touchPointers.current.delete(event.pointerId);
    const held = {}; for (const [p, a] of touchPointers.current.values()) held[p + ':' + a] = true;
    setTouchHeld(held);
    engineRef.current?.touch(player, action, event.pointerId, down);
  }

  useEffect(()=>{const clear=()=>clearTouchControls();window.addEventListener('blur',clear);const hidden=()=>{if(document.hidden)clear();};document.addEventListener('visibilitychange',hidden);return()=>{window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',hidden);};},[]);

  const resultWinner = status?.result?.matchWinner ?? status?.result?.winner;
  const winnerName = resultWinner === 0 ? playerOne.name : resultWinner === 1 ? playerTwo.name : null;

  return (
    <section onPointerDownCapture={enterFightScreen} ref={hostRef} tabIndex={0} className={styles.arena} aria-label={cpu ? "Single player versus CPU" : "Local two-player fighting game"}
      data-fight-phase={status?.phase || 'loading'} data-paused={status?.paused ? 'true' : 'false'}>
      <div className={styles.arenaTop}>
        <h1>{stage.name} <span>{online ? 'ONLINE VS' : tower ? 'STAND ON BUSINESS' : cpu ? 'ANYBODY CAN GET IT · CPU' : 'FUCK AROUND AND FIND OUT · LOCAL VS'}</span></h1>
        <button onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await hostRef.current?.requestFullscreen?.(); } catch { /* Fixed full-viewport layout remains available. */ } }} aria-label="Toggle fullscreen">FULLSCREEN</button>
        <button onClick={() => engineRef.current?.pause(!status?.paused)} disabled={!status || Boolean(error)} aria-label="Pause fight">PAUSE <kbd>ESC</kbd></button>
      </div>
      <div className={styles.hud}>
        {definitions.map((fighter, index) => {
          const state = status?.players[index];
          return (
            <div key={fighter.id} className={`${styles.playerHud} ${index === 1 ? styles.playerTwo : ''}`}
              data-player={index + 1} data-position-x={state?.x.toFixed(3) ?? '0'} data-position-y={state?.y.toFixed(3) ?? '0'} data-special-id={state?.specialId ?? ''} data-state={state?.state ?? ''} data-move={state?.move ?? ''} data-crouching={String(state?.crouching ?? false)} data-hit-region={state?.hitRegion??''}>
              <div className={styles.hudName}><span>P{index + 1}</span><strong>{fighter.name}</strong><b>{state?.health ?? 100}</b></div>
              <div className={styles.healthTrack} role="progressbar" aria-label={`${fighter.name} health`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={state?.health ?? 100}>
                <div className={styles.healthFill} style={{ transform: `scaleX(${(state?.health ?? 100) / 100})` }} />
              </div>
              <div className={styles.hudBottom}>
                <span className={styles.roundDots} aria-label={`${state?.wins ?? 0} rounds won`}>
                  {[0, 1].map(dot => <i key={dot} className={dot < (state?.wins ?? 0) ? styles.wonDot : ''} />)}
                </span>
                <span>{state?.health === 0 ? 'KNOCKED OUT' : state?.blocking ? state?.crouching ? 'LOW GUARD' : 'HIGH GUARD' : state?.state === 'knockdown' ? 'KNOCKED DOWN' : state?.state === 'gettingUp' ? 'GETTING BACK UP' : state?.reaction ? `${state.reaction.toUpperCase()} HIT`  : state?.moveLabel || state?.crouching ? state?.moveLabel || 'CROUCHING' : 'FIRST TO TWO ROUNDS'}</span>
              </div>
              <div className={styles.comboReadout} data-combo-hits={state?.combo?.hits ?? 0}>{state?.combo && <><strong>{state.combo.hits} HIT COMBO</strong><span>{state.combo.damage} DAMAGE</span></>}</div>
              <div className={`${styles.meterRow} ${(state?.meter ?? 0) >= 100 ? styles.meterReady : ''}`}>
                <div className={styles.meterLabel}><strong>{(state?.meter ?? 0) >= 100 ? 'REJECT READY' : `REJECT ${state?.meter ?? 0}%`}</strong><span>{state?.gagReady ? 'GAG OPEN!' : state?.notice || state?.specialName || 'SPECIAL'}</span></div>
                <div className={styles.meterTrack} role="progressbar" aria-label={`${fighter.name} Reject meter`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={state?.meter ?? 0}>
                  <i style={{ transform: `scaleX(${(state?.meter ?? 0) / 100})` }} />
                </div>
              </div>
            </div>
          );
        })}
        <div className={styles.clock}><strong aria-label="Round time remaining">{status?.time ?? 60}</strong><span>ROUND {status?.round ?? 1}</span></div>
      </div>

      <div className={styles.stageFrame}>
        <div ref={canvasMountRef} className={styles.canvas} />
        {!status && !error && <div className={styles.loading} role="status">GETTING THE ARENA READY {loadProgress.total>0&&<small>{loadProgress.loaded} / {loadProgress.total} image packs</small>}<span>{playerOne.name} VS {playerTwo.name}</span></div>}
        {status?.players?.some(p=>p.emoteText)&&<div className={styles.personalitySubtitle} role="status">{status.players.filter(p=>p.emoteText).map(p=><p key={p.id}><b>{p.name}</b> {p.emoteText}</p>)}</div>}
        {status?.bossLine&&<div className={styles.bossSubtitle} role="status">{status.bossLine}</div>}
        {status?.networkLag&&<div className={styles.bossSubtitle}>CONNECTION INTERRUPTED · WAITING FOR OPPONENT</div>}
        {status?.phase === 'bossTransform'&&<div className={styles.transformation} style={{opacity:status.bossClock>3&&status.bossClock<4.4?.8:.18}}/>}
        {status?.phase === 'countdown' && !modal && <div className={styles.countdown} aria-live="polite"><span>ROUND {status.round}</span><strong>{status.countdown}</strong></div>}
        {status?.phase==='finishReady'&&!modal&&<div className={styles.finishCue}><strong>FUCK THEM UP!</strong><span>{winnerName}</span></div>}
        {status?.phase==='finisher'&&!modal&&<div className={styles.filmHud} data-finisher-ui={status.finisherId}><div><b>FUCKTALITY</b><strong>{finisherFor(status.finisherId)?.name}</strong></div><p>{finisherBeat(status.finisherId,status.finisherTime)}</p></div>}
        {modal && (
          <div className={styles.scrim}>
            <div ref={modalRef} className={styles.resultCard} role="dialog" aria-modal="true" aria-labelledby="arena-result-heading" onKeyDown={handleModalKeys}>
              <p>{error ? 'ARENA INTERRUPTED' : status.paused ? status?.networkWaiting?'WAITING FOR OPPONENT TO LOAD':'CATCH YOUR BREATH' : status.result?.reason}</p>
              <h2 id="arena-result-heading">{error ? 'RELOAD THE ARENA' : status.paused ? status?.networkWaiting?'CONNECTING':'PAUSED' : !winnerName ? 'DEAD EVEN.' : winnerName}</h2>
              <div className={styles.resultNote}>{error ? error + ' Reloading starts a fresh match.' : status.paused ? 'The round timer is stopped.' : !winnerName ? 'No round awarded. Run it back.' : status.phase === 'matchOver' ? 'WINS THE MATCH' : 'TAKES THE ROUND'}</div>
              <div className={styles.resultButtons}>
                {error ? <button className={styles.goldButton} onClick={() => setRevision(value => value + 1)}>RELOAD ARENA</button>
                  : status.paused ? <button className={styles.goldButton} disabled={status.networkWaiting} onClick={() => engineRef.current?.pause(false)}>RESUME FIGHT</button>
                    : status.phase === 'matchOver' && tower ? <button className={styles.goldButton} onClick={()=>onTowerResult(resultWinner)}>BACK TO TOWER</button> : status.phase === 'matchOver' ? <button className={styles.goldButton} onClick={() => engineRef.current?.rematch()}>REMATCH</button>
                      : <button className={styles.goldButton} onClick={() => engineRef.current?.nextRound()}>{winnerName ? 'NEXT ROUND' : 'REPLAY ROUND'}</button>}
                <button onClick={onChangeFighters}>{online?'LEAVE ROOM':tower?'ABANDON TOWER':'CHANGE FIGHTERS'}</button>
                {!tower&&!online&&<button onClick={onBack}>BACK TO MATCHUP</button>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.keyboardControls}>
        <p><b>PLAYER 1</b> <kbd>A</kbd><kbd>D</kbd> MOVE <kbd>W</kbd> JUMP <kbd>S</kbd> CROUCH <kbd>F</kbd> L PUNCH <kbd>T</kbd> R PUNCH <kbd>G</kbd> L KICK <kbd>Y</kbd> R KICK <kbd>H</kbd> BLOCK <kbd>R</kbd> GAG <kbd>E</kbd> SPECIAL</p>
        <p><b>PLAYER 2</b> <kbd>←</kbd><kbd>→</kbd> MOVE <kbd>↑</kbd> JUMP <kbd>↓</kbd> CROUCH <kbd>J</kbd> L PUNCH <kbd>I</kbd> R PUNCH <kbd>K</kbd> L KICK <kbd>P</kbd> R KICK <kbd>L</kbd> BLOCK <kbd>O</kbd> GAG <kbd>U</kbd> SPECIAL</p>
      </div>
      <details className={styles.moveList}>
        <summary>MOVE LIST <span>12 LEFT/RIGHT STRIKES + GAG + SPECIAL</span></summary>
        <div>
          <p><b>GAG · R / O</b><span>Earn 35 meter + land a clean hit to open the gag window</span></p>
          <p><b>LEFT / RIGHT PUNCH & KICK</b><span>Four distinct limbs with standing, crouching and aerial frames</span></p>
          <p><b>LP + RP TOGETHER</b><span>SHOULDER TOSS throw · close range</span></p>
          <p><b>LK + RK TOGETHER</b><span>LEG TRIP throw · close range</span></p>
          <p><b>BLOCK + R PUNCH</b><span>Easy two-button special when Reject meter reaches 100 (or E/U)</span></p>
          <p><b>FORWARD + PUNCH / KICK</b><span>Power punch / drive kick</span></p>
          <p><b>CROUCH + PUNCH</b><span>Left: stomach swat · Right: awkward uppercut</span></p>
          <p><b>CROUCH + KICK</b><span>Left/right sweeps · trip standing guards</span></p>
          <p><b>JUMP + PUNCH / KICK</b><span>Four different airborne strikes</span></p>
          <p><b>BLOCK / CROUCH + BLOCK</b><span>High guard / low guard</span></p>
        </div>
        <aside className={styles.signatureMoves}>
          {definitions.map((fighter, index) => <p key={fighter.id}><b>{fighter.name}</b><span>{status?.players[index]?.comedyName || 'SIGNATURE GAG'}</span></p>)}
        </aside>
        <p>FORWARD means toward your opponent. Crouch under high punches. Use low guard against sweeps and high guard against air attacks and Royal Decree. Jump or back away from Four-Arm Hug.</p>
      </details>
      <p className={styles.specialHelp}>FIGHT TO BUILD YOUR REJECT METER. 35 METER + CLEAN HIT = EARNED GAG. FULL METER = ONE SPECIAL. USE SPECIALS ON THE GROUND. <span>PROJECTILES CAN BE BLOCKED OR JUMPED. HEAD, STOMACH AND LEG HITS HAVE DIFFERENT REACTIONS. SURVIVE A KNOCKDOWN TO GET BACK UP. WIN TWO ROUNDS BY KO FOR YOUR FUCKTALITY.</span></p>
      <div className={styles.phonePanel} aria-label="Phone control menu" data-touch-menu={controlsOpen ? 'open' : 'closed'}>
        <div className={styles.phoneBar}>
          <button onClick={toggleControls} aria-expanded={controlsOpen} aria-controls={controlsId}>{controlsOpen ? 'HIDE CONTROLS' : 'SHOW CONTROLS'}</button>
          <div role="group" aria-label="Visible player controls">
            {(online ? [online.host?'1':'2'] : cpu ? ['1'] : ['1', '2']).map(value => <button key={value} aria-pressed={touchPlayer === value} onClick={() => chooseTouchPlayer(value)}>{value === 'both' ? 'BOTH' : `P${value}`}</button>)}
          </div>
        </div>
        {controlsOpen && <div id={controlsId} className={`${styles.touchControls} ${touchPlayer !== 'both' ? styles.singlePad : ''}`} aria-label="Touch fight controls">
        {definitions.map((fighter, player) => (!online || player===(online.host?0:1)) && (!cpu || player === 0) && (touchPlayer === 'both' || touchPlayer === String(player + 1)) && (
          <div key={fighter.id} className={styles.touchPlayer}>
            <span>P{player + 1} · {fighter.name}</span>
            <div className={styles.thumbPad} role="group" aria-label={`Player ${player+1} direction pad: aim to move, crouch or jump; hold back to block`}
              onPointerDown={e=>stick(e,player)} onPointerMove={e=>stick(e,player)} onPointerUp={e=>stick(e,player,true)} onPointerCancel={e=>stick(e,player,true)} onLostPointerCapture={e=>stick(e,player,true)}>
              <span className={styles.padCross} aria-hidden="true">✚</span><i aria-hidden="true" style={{transform:`translate(calc(-50% + ${stickVisual[player]?.x||0}px),calc(-50% + ${stickVisual[player]?.y||0}px))`}}/>
            </div>
            <div className={styles.strikePad}>{TOUCH_ACTIONS.map(([action, label]) => (
              <button key={action} className={`${action === 'special' ? styles.specialButton : action === 'comedy' ? styles.gagButton : ''} ${touchHeld[player + ':' + action] ? styles.controlHeld : ''}`} aria-pressed={Boolean(touchHeld[player + ':' + action])} aria-label={`Player ${player + 1} ${action}`} data-action={action} title={action === 'special' ? `${status?.players[player]?.specialName || 'Special'} · requires full Reject meter` : action === 'comedy' ? `${status?.players[player]?.comedyName || 'Signature gag'} · 35 Reject meter and recent clean hit` : undefined} disabled={!status || modal || status.phase !== 'fight' || (action === 'special' && (!status.players[player].specialId || status.players[player].meter < 100)) || (action === 'comedy' && (!status.players[player].comedyId || (fighter.id !== 'kardozo' && !status.players[player].gagReady))) || ((action === 'special' || action === 'comedy') && status?.players[player]?.y > .001)}
                onPointerDown={event => touch(event, player, action, true)}
                onPointerUp={event => touch(event, player, action, false)}
                onPointerCancel={event => touch(event, player, action, false)}
                onLostPointerCapture={event => touch(event, player, action, false)}>{label}</button>
            ))}</div>
          </div>
        ))}
        </div>}
        {controlsOpen && <details className={styles.touchHelp}><summary>HOW TO FIGHT</summary><p>Hold an arrow and tap an attack. L/R PUNCH and L/R KICK use different limbs. Hold ↓ for four low strikes. ↑ + attack gives four air strikes. Toward opponent + PUNCH/KICK: power hit. BLOCK guards high; ↓ + BLOCK guards low. Press LP+RP for a shoulder throw, LK+RK for a leg trip. GAG needs 35 meter and a recent clean hit. SPECIAL: full meter, press SPECIAL or BLOCK+R PUNCH. GAG and SPECIAL need feet on the ground.</p></details>}
      </div>
    </section>
  );
}
