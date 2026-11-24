import { IMPORTED_ATLASES, importedAssetPath } from './ImportedFighters.mjs';
import { KardozoSlamView } from './KardozoSlamView.mjs';
import { slamCameraFrame } from './KardozoSlam.mjs';
import {loadSpriteAsset,firstTexture,configureSpriteAsset} from './SpriteAssets.mjs';
import {PersonalityVisuals} from './PersonalityVisuals.mjs';
import {animationAtlas,emotePose} from './Personality.mjs';
import { BossVisuals } from './BossVisuals.mjs';
import { BOSS_ID, bossAtlas, bossPose, bossLine } from './Boss.mjs';
import { encodeState, applyState } from './OnlineProtocol.mjs';
import { CpuController } from './CpuController.mjs';
import { fighterScale } from './FighterScale.mjs';

function standingVisualScale(id, standingFrame) {
  const scale = fighterScale(id);
  if (id === 'kardozo' || id === BOSS_ID || !standingFrame?.height) return 1.18 * scale;
  return 3.84 * scale / standingFrame.height;
}

import * as THREE from '../vendor/three.module.mjs';
import { CombatModel, STEP } from './CombatModel.mjs';
import { ATTACK_ATLASES } from './AttackAtlasMetadata.mjs';
import { combatPose, setPoseUV } from './AttackAnimation.mjs';
import { EXPANDED_ATLASES } from './ExpandedAtlasMetadata.mjs';
import { COMEDY_ATLASES, PELVIC_THRUST_ATLAS } from './ComedyAtlasMetadata.mjs';
import { SPECIAL_ATLASES } from './SpecialAtlasMetadata.mjs';
import { LIMB_ATLASES, OPPOSITE_ATLASES } from './LimbAtlasMetadata.mjs';
import { FinisherVfx } from './FinisherVfx.mjs';
import { cinematicPose, cinematicLayout, finisherStage } from './Fucktalities.mjs';
import { SpecialVfx } from './SpecialVfx.mjs';
import { LocalInput, KEYMAP } from './CombatInput.mjs';
import { resolveStage } from './StageCatalog.mjs';
import { LivingBackdrop } from './LivingBackdrop.mjs';

function fighterAssetPath(id, kind) {
  if (id === BOSS_ID) return '/assets/rvmkk-rebuild/boss/x-man-atlas.json';
  const imported = importedAssetPath(id);
  if (imported) return imported;
  const extension = kind === 'personality' ? '.json' : '.png';
  return '/assets/rvmkk-rebuild/combat/' + kind + '/' + id + extension;
}

function paintedTexture(width, height, paint) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not create the arena artwork.');
  paint(context, width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class ArenaEngine {
  static async create(options) {
    const engine = new ArenaEngine(options);
    try { await engine.loadFighters(); return engine; }
    catch (error) { engine.dispose(); throw error; }
  }

  constructor({ canvas, host, fighters, stageId, cpu = false, online = null, onUpdate, onError, onLoadProgress }) {
    this.canvas = canvas; this.host = host; this.definitions = fighters;
    this.onLoadProgress=onLoadProgress;this.assetAbort=new AbortController();
    this.onUpdate = onUpdate; this.onError = onError;
    this.stage = resolveStage(stageId);
    this.disposed = false; this.ready = false; this.graphicsLost = false;
    this.cpu = cpu ? new CpuController() : null;
    this.input = new LocalInput(); this.model = new CombatModel(fighters);
    this.online=online;this.netClock=0;this.netSequence=0;this.netEvents=[];this.netCommands=new Set();this.netReady=!online;
    if(online){this.model.setPaused(true);this.netUnlisten=online.listen(event=>{
      if(event.type==='state'&&!online.host){applyState(this.model,event.state);this.netReady=event.state.ready===true;for(const item of event.state.events||[])this.netEvents.push(item);}
      if(event.type==='command'&&online.host){
        if(event.command==='engine-ready'){if(!this.netReady){this.netReady=true;this.model.setPaused(false);}}
        else if(event.command==='pause')this.model.setPaused(true);
        else if(event.command==='resume')this.model.setPaused(false);
        else if(['next','rematch'].includes(event.command))this.onlineVote(event.command,'remote');
      }
      if(['disconnect','forfeit'].includes(event.type))this.onlineForfeit(online.host?1:0);
    });}
    this.effects = []; this.art = []; this.shadows = []; this.flash = [0, 0]; this.fighterTextures = [];
    this.accumulator = 0; this.previousTime = null; this.lastHud = 0; this.shake = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mobileGraphics=window.matchMedia('(pointer: coarse), (max-width: 800px)').matches;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.mobileGraphics, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobileGraphics?1:1.75));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x080a12);
      this.scene = new THREE.Scene(); this.scene.fog = new THREE.Fog(0x080a12, 17, 35);
      this.camera = new THREE.OrthographicCamera(-6, 6, 3.6, -3.6, .1, 80);
      this.scene.add(this.camera);
      this.makeStage();
      this.specialVfx = new SpecialVfx(this.scene, this.model);
      this.finisherVfx = new FinisherVfx(this.scene,this.model,{reducedMotion:this.reducedMotion});
      this.model.fighters.forEach(f => this.scene.add(f.group));
      this.onKeyDown = event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
        if (event.target?.closest?.('button, a, input, textarea, select')) return;
        if (event.code === 'Escape') { event.preventDefault(); if (!event.repeat) this.pause(!this.model.paused); return; }
        if (KEYMAP[event.code]) { event.preventDefault(); this.input.keyDown(event.code); }
      };
      this.onKeyUp = event => { if (KEYMAP[event.code]) { event.preventDefault(); this.input.keyUp(event.code); } };
      this.onBlur = () => { this.input.clear(); if (this.ready && !this.disposed) this.pause(true); };
      this.onVisibility = () => { if (document.hidden) this.onBlur(); };
      this.onBackdropTap = event => {
        if (!this.ready || this.disposed || (event.button !== 0 && event.pointerType !== 'touch')) return;
        const bounds = canvas.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        this.host.focus({ preventScroll: true });
        if (this.background.tap((event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height, this.model)) event.preventDefault();
      };
      this.onFocusOut = event => { if (!host.contains(event.relatedTarget)) this.onBlur(); };
      this.onContextLost = event => {
        event.preventDefault();
        if (this.disposed) return;
        this.graphicsLost = true; this.pause(true);
        this.onError(new Error('The graphics connection was lost. Reload the arena to continue.'));
      };
      host.addEventListener('keydown', this.onKeyDown);
      host.addEventListener('keyup', this.onKeyUp);
      host.addEventListener('focusout', this.onFocusOut);
      window.addEventListener('blur', this.onBlur);
      document.addEventListener('visibilitychange', this.onVisibility);
      canvas.addEventListener('webglcontextlost', this.onContextLost);
      canvas.addEventListener('pointerdown', this.onBackdropTap);
      this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas.parentElement);
      this.resize();
    } catch (error) { this.dispose(); throw new Error('The 3D arena could not start. Check that hardware acceleration and WebGL are available in your browser.', { cause: error }); }
  }

  makeStage() {
    this.scene.add(new THREE.AmbientLight(0xc1c9e5, 1.8));
    const key=new THREE.DirectionalLight(0xffdfb7,3.2);key.position.set(-4,8,9);this.scene.add(key);
    this.background = new LivingBackdrop(this.camera, this.stage, { reducedMotion: this.reducedMotion });
  }

  async loadFighters() {
    const hasHug = this.definitions.some(definition => definition.id === 'kardozo');
    const hasThrust = this.definitions.some(definition => definition.id === 'keen-kahn');
    const paths = this.definitions.map(definition => fighterAssetPath(definition.id, 'attacks'));
    paths.push(...this.definitions.map(definition => fighterAssetPath(definition.id, 'expanded')));
    paths.push(...this.definitions.map(definition => fighterAssetPath(definition.id, 'comedy')));
    if (hasHug) paths.push('/assets/rvmkk-rebuild/combat/specials/kardozo-hug.png');
    if (hasThrust) paths.push('/assets/rvmkk-rebuild/combat/comedy/keen-kahn-thrust.png');
    const limbStart=paths.length;
    paths.push(...this.definitions.map(d=>fighterAssetPath(d.id, 'limbs')));
    paths.push(...this.definitions.map(d=>fighterAssetPath(d.id, 'opposite')));
    const personalityStart=paths.length;paths.push(...this.definitions.map(d=>fighterAssetPath(d.id, 'personality')));
    const extraIndices={};if(this.definitions.some(d=>d.id==='gare-chi')){extraIndices.minions=paths.length;paths.push('/assets/rvmkk-rebuild/combat/personality/minions.json');}if(this.definitions.some(d=>d.id==='datennisha-blaze')){extraIndices.pets=paths.length;paths.push('/assets/rvmkk-rebuild/combat/personality/pets.json');}
    const bossCapIndex=paths.length;if(this.definitions.some(d=>d.id===BOSS_ID))paths.push('/assets/rvmkk-rebuild/boss/x-man-cap.json');
    const dogTextureIndex=paths.length;const hasBoss=this.definitions.some(d=>d.id===BOSS_ID);if(hasBoss)paths.push('/assets/rvmkk-rebuild/boss/dogs-atlas.json');
    const tongueIndex = paths.length;
    if (this.definitions.some(fighter => fighter.id === 'nicoleena')) {
      paths.push('/assets/rvmkk-rebuild/combat/imports/nicoleena-tongue.webp');
    }
    const poseIndex = paths.length;
    if (this.definitions.some(fighter => fighter.id === 'cokane-o')) {
      paths.push('/assets/rvmkk-rebuild/combat/imports/cokane-o-poses.webp');
    }
    const fighterCount = paths.length;
    paths.push(...this.background.assets);
    const assets=new Map();let completed=0;this.onLoadProgress?.({loaded:0,total:new Set(paths).size});
    const loaded = await Promise.allSettled(paths.map(path=>{if(!assets.has(path))assets.set(path,loadSpriteAsset(path,{signal:this.assetAbort.signal,mobile:this.mobileGraphics}).then(asset=>{this.onLoadProgress?.({loaded:++completed,total:new Set(paths).size});return asset;}));return assets.get(path);}));
    if (loaded.some(result => result.status === 'rejected')) {
      loaded.forEach(result => { if (result.status === 'fulfilled') result.value.dispose(); });
      throw new Error('One of the selected fighter or arena images could not load. Reload the arena or choose your fighters and background again.');
    }
    const textures = loaded.map(result => result.value);
    if (this.disposed) { textures.forEach(texture => texture.dispose()); return; }
    if (this.definitions.some(definition => definition.id!==BOSS_ID&&(IMPORTED_ATLASES[definition.id]?.base??ATTACK_ATLASES[definition.id])?.frames.length !== 4)) {
      textures.forEach(texture => texture.dispose());
      throw new Error('The selected fighter animation is unavailable.');
    }
    this.background.setTextures(textures.splice(fighterCount));
    this.fighterTextures = textures;
    this.personalityVfx=new PersonalityVisuals(this.scene,this.model,Object.fromEntries(Object.entries(extraIndices).map(([k,i])=>[k,textures[i]])));
    if(hasBoss)this.bossVfx=new BossVisuals(this.scene,this.model,textures[dogTextureIndex]);
    textures.forEach(configureSpriteAsset);
    textures.slice(0, 2).forEach((texture, index) => {
      const id = this.definitions[index].id, imported = IMPORTED_ATLASES[id];
      const atlas = id===BOSS_ID?bossAtlas(texture):imported?.base??ATTACK_ATLASES[id];
      const material = new THREE.MeshBasicMaterial({ map: firstTexture(texture), transparent: true, alphaTest: .3, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
      const sprite = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      sprite.userData.atlas = atlas; sprite.userData.frame = -1;
      sprite.userData.atlases = { base: { texture, metadata: atlas }, expanded: { texture: textures[index + 2], metadata: imported?.expanded??EXPANDED_ATLASES[id] }, comedy: { texture: textures[index + 4], metadata: imported?.comedy??COMEDY_ATLASES[id] } };
      if (this.definitions[index].id === 'kardozo') sprite.userData.atlases.hug = { texture: textures[6], metadata: SPECIAL_ATLASES.kardozoHug };
      if (this.definitions[index].id === 'keen-kahn') sprite.userData.atlases.thrust = { texture: textures[6 + Number(hasHug)], metadata: PELVIC_THRUST_ATLAS };
      sprite.userData.atlases.limbs={texture:textures[limbStart+index],metadata:imported?.limbs??LIMB_ATLASES[id]};
      sprite.userData.atlases.opposite={texture:textures[limbStart+2+index],metadata:imported?.opposite??OPPOSITE_ATLASES[id]};
      if(this.definitions[index].id===BOSS_ID){sprite.userData.atlases.boss={texture,metadata:atlas};sprite.userData.atlases.bossCap={texture:textures[bossCapIndex],metadata:bossAtlas(textures[bossCapIndex])};}
      if(this.definitions[index].id!==BOSS_ID)sprite.userData.atlases.personality={texture:textures[personalityStart+index],metadata:imported?.personality??animationAtlas(textures[personalityStart+index],id)};
      if (id === 'nicoleena') {
        sprite.userData.atlases.tongue = {
          texture: textures[tongueIndex],
          metadata: imported.tongue,
        };
      }
      if (id === 'cokane-o') {
        sprite.userData.atlases.poses = {
          texture: textures[poseIndex],
          metadata: imported.poses,
        };
      }
      sprite.position.z = .08; sprite.renderOrder = 3 + index;
      this.model.fighters[index].group.add(sprite); this.art.push(sprite);
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(.62, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .47, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .48; shadow.position.y = .012; this.scene.add(shadow); this.shadows.push(shadow);
    });
    if(hasHug){this.slamView=await KardozoSlamView.create(this.scene,this.assetAbort.signal);this.slamView.reducedMotion=this.reducedMotion;if(this.disposed){this.slamView.dispose();return;}}
    this.ready = true;
    this.publish();
  }

  start() {
    if (!this.ready || this.disposed) return;
    this.previousTime = null; this.accumulator = 0;
    if(this.online&&!this.online.host){if(this.online.latestState)applyState(this.model,this.online.latestState);this.online.send('command',{command:'engine-ready'});}
    this.renderer.setAnimationLoop(time => this.frame(time));
    this.host.focus({ preventScroll: true });
  }

  resize() {
    if (this.disposed || !this.renderer) return;
    const bounds = this.canvas.parentElement.getBoundingClientRect();
    this.width = Math.max(1, bounds.width); this.height = Math.max(1, bounds.height);
    this.renderer.setSize(this.width, this.height, false);
    this.aspect = this.width / this.height;
  }

  frame(timestamp) {
    if (this.disposed || !this.ready || this.graphicsLost) return;
    const delta = this.previousTime === null ? 0 : Math.min(.1, Math.max(0, (timestamp - this.previousTime) / 1000));
    this.previousTime = timestamp;
    if(this.online){
      this.netClock+=delta;
      if(this.netClock>=.05){
        this.netClock=0;
        if(this.online.host)this.online.send('state',{state:{...encodeState(this.model,++this.netSequence,this.netEvents.splice(0)),ready:this.netReady}});
        else {const controls=this.input.read();this.online.inputPacket({...controls[1],...controls[0]});if(!this.netReady)this.online.send('command',{command:'engine-ready'});}
      }
      if(!this.online.host){
        for(const event of this.netEvents.splice(0)){if(event.type==='hit'||event.type==='block')this.hitEffect(event);this.specialVfx.event(event);}
        this.render(delta);if(timestamp-this.lastHud>=70){this.lastHud=timestamp;this.publish();}return;
      }
      if(this.netReady&&Date.now()-this.online.lastSeen>3000){this.model.setPaused(true);this.online.input.clear();}
    }
    if (!this.model.paused) {
      this.accumulator += delta;
      let steps = 0;
      while (this.accumulator >= STEP && steps++ < 6) {
        const inputs=this.input.read();
        if(this.cpu) inputs[1]=this.cpu.read(this.model,STEP);
        if(this.online)inputs[1]=this.online.input.read();
        this.model.step(STEP, inputs);
        for (const event of this.model.events) {
          if(this.online?.host)this.netEvents.push(event);
          if (event.type === 'hit' || event.type === 'block') this.hitEffect(event);
          if (event.type === 'hit') this.background.event(event, this.model);
          this.specialVfx.event(event);
        }
        this.accumulator -= STEP;
      }
      if (steps >= 6) this.accumulator = 0;
    } else this.accumulator = 0;
    this.render(delta);
    if (timestamp - this.lastHud >= 70) { this.lastHud = timestamp; this.publish(); }
  }

  hitEffect(event) {
    this.flash[event.defender] = event.type === 'block' ? .06 : .14;
    this.shake = Math.max(this.shake, event.type === 'block' ? .035 : event.special ? .32 : event.heavy ? .22 : .12);
    const words = event.type === 'block' ? 'BLOCK!' : event.comicQuip ? event.comicQuip : event.kind === 'grab' ? 'SQUEEZE!' : event.kind === 'pizza' ? 'DELIVERED!' : event.kind === 'lightning' ? 'CONNECTED!' : event.kind === 'stamp' ? 'REJECTED!' : event.kind === 'bugles' ? 'CRUNCH!' : event.kind === 'fans' ? 'SHREDDED!' : event.kind === 'rush' ? 'SIT DOWN!' : event.moveName === 'UPPERCUT' ? 'UP YOU GO!' : event.moveName === 'SWEEP' ? 'TIMBER!' : ['OOF!', 'THWACK!', 'BONK!'][event.serial % 3];
    const color = event.type === 'block' ? '#9cbfff' : '#ffd36c';
    const map = paintedTexture(384, 128, c => {
      c.textAlign = 'center'; c.font = 'italic 900 ' + (words.length > 12 ? '31' : words.length > 9 ? '43' : '65') + 'px Impact, sans-serif'; c.lineWidth = 12; c.strokeStyle = '#100b10'; c.strokeText(words, 192, 86); c.fillStyle = color; c.fillText(words, 192, 86);
    });
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }));
    sprite.position.set(event.x, event.y + .6, .6); sprite.scale.set(1.7, .57, 1); sprite.renderOrder = 20; this.scene.add(sprite);
    this.effects.push({ object: sprite, life: .52, maximum: .52 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(.12, .21, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.set(event.x, event.y, .7); this.scene.add(ring); this.effects.push({ object: ring, life: .23, maximum: .23 });
  }

  render(delta) {
    const motionDelta = this.model.paused || this.model.hitStop > 0 ? 0 : delta;
    const cinematic=this.model.phase==='finisher';
    const filmId=cinematic?this.model.fighters[this.model.result.matchWinner].definition.id:null;
    const film=cinematic?cinematicLayout(filmId,this.model.finishClock):null;
    const normalSpacing = this.model.phase==='fight' &&
      this.model.fighters.every(f=>f.definition.id!=='kardozo' && f.capturedBy===null && f.grabTarget===null && f.move?.kind!=='grab');
    // Preserve the fighters' physics/hitboxes and move only their visual meshes;
    // sprite illustrations are much wider than the narrow collision boxes.
    const artWidth = this.art.map((art,i)=>{
      const l=art.userData.layout ?? art.userData.atlas?.frames?.[0];
      return (l?.width ?? 2.1)*1.18*fighterScale(this.model.fighters[i].definition.id);
    });
    const spriteDistance=Math.abs(this.model.fighters[1].x-this.model.fighters[0].x);
    // Keep the two illustrated fighters visibly separate even when their narrow hurtboxes are close.
    // This is visual spacing only; collision physics remain unchanged.
    const minDistance=(artWidth[0]+artWidth[1])*.58+.28;
    const visualGap=normalSpacing && Math.abs(this.model.fighters[0].y-this.model.fighters[1].y)<1.4
      ? Math.max(0,Math.min(2.2,(minDistance-spriteDistance)/2)) : 0;
    const visualSide=Math.sign(this.model.fighters[1].x-this.model.fighters[0].x)||1;
    this.model.fighters.forEach((f, i) => {
      const art = this.art[i];
      art.rotation.set(0,0,0);
      art.visible=true;
      const walking = f.state === 'idle' && Math.abs(f.vx) > .4 && f.y < .01;
      const visualScale = standingVisualScale(f.definition.id, art.userData.atlas?.frames?.[0]);
      const loser=cinematic&&i!==this.model.result.matchWinner;
      const pose = f.definition.id===BOSS_ID?bossPose(f,this.model):!cinematic&&emotePose(f,this.model)?emotePose(f,this.model):cinematic?{atlas:'limbs',...cinematicPose(filmId,this.model.finishClock,loser)}:combatPose(f), frame = pose.frame, atlasKey = IMPORTED_ATLASES[f.definition.id] && f.blocking && !f.crouching && !f.move ? 'block' : pose.atlas;
      const atlas = art.userData.atlases[atlasKey], layout = atlas.metadata.frames[frame];
      art.userData.layout=layout;
      const poseKey = atlasKey + ':' + frame;
      if (art.userData.poseKey !== poseKey) {
        art.material.map = atlas.texture.frames?.[frame]??atlas.texture;
        setPoseUV(art.geometry, atlas.texture.frames?[0,0,art.material.map.image.width,art.material.map.image.height]:layout.rect, art.material.map.image.width, art.material.map.image.height);
        art.userData.poseKey = poseKey;
      }
      this.canvas.dataset[`player${i + 1}Pose`] = pose.name;
      this.canvas.dataset[`player${i + 1}Special`] = f.moveName === 'special' ? f.move.id : '';
      this.canvas.dataset[`player${i + 1}State`] = f.state;
      this.canvas.dataset[`player${i + 1}Move`] = f.moveName ?? '';
      this.canvas.dataset[`player${i + 1}Comedy`] = f.moveName === 'comedy' ? f.move.id : '';
      this.canvas.dataset[`player${i + 1}GagBeat`] = f.moveName === 'comedy' ? String(Math.max(0, f.pulseIndex + 1)) : '';
      this.canvas.dataset[`player${i + 1}GagTotal`] = String(f.comedy?.pulses ?? 1);
      this.canvas.dataset[`player${i + 1}Crouch`] = String(f.crouching);
      art.renderOrder = f.grabTarget !== null ? 8 : 3 + i;
      art.scale.set((layout.mirror ? -layout.width : layout.width) * visualScale, layout.height * visualScale, 1);
      art.position.x = (layout.mirror ? layout.pivotX - .5 : .5 - layout.pivotX) * layout.width * visualScale;
      art.position.y = (layout.feetY - .5) * layout.height * visualScale;
      if (f.moveName === 'comedy' && f.state === 'active' && f.move.comedy === 'hip') art.position.x += .25;
      if (pose.name === 'royal-pelvic-thrust') art.position.x += .23;
      art.rotation.z = (pose.name==='falling-on-back'?-.35:f.blocking?.045:walking?Math.sin(this.model.elapsed*17)*.018:0);
      if (f.definition.id==='kitaria' && (f.state==='knockdown'||f.state==='knockedOut') && f.y<.08)
        art.rotation.z=-Math.PI/2;
      if (f.definition.id==='kitaria' && f.state==='gettingUp')
        art.rotation.z=-Math.PI/2*Math.max(0,Math.min(1,f.clock/.55));
      if(f.move?.limb&&!this.reducedMotion){const phase=f.state==='startup'?1:f.state==='active'?2:0;const seed=this.definitions[i].id.length;art.rotation.z+=Math.sin(this.model.elapsed*(12+seed%5))*.075*phase*(f.move.limb.endsWith('Right')?-1:1);}
      if(f.state==='gettingUp')art.rotation.z=-.12*(f.clock/.55);
      // Rotate around the atlas foot pivot, rather than lifting the entire body.
      const anchorX = art.position.x, anchorY = art.position.y, angle = art.rotation.z;
      art.position.x = anchorX * Math.cos(angle) - anchorY * Math.sin(angle);
      art.position.y = anchorX * Math.sin(angle) + anchorY * Math.cos(angle);
      if(f.emote==='down'&&f.definition.id==='gaibden')art.position.x+=Math.sin(f.emoteTime*9)*.11;
      if(f.emote==='down'&&f.definition.id==='keen-kahn')art.rotation.z+=Math.sin(f.emoteTime*45)*.01;
      if(f.choreoAngle&&f.capturedBy!==null)art.rotation.z=f.choreoAngle;
      if (f.capturedBy !== null) { const grabber = this.model.fighters[f.capturedBy]; art.scale.x *= .90 + Math.sin(this.model.elapsed * 30) * .04; art.position.y += Math.sin(this.model.elapsed * 24) * .045; }
      this.flash[i] = Math.max(0, this.flash[i] - motionDelta);
      art.material.color.set(this.flash[i] > 0 ? '#ffd1bc' : f.blocking ? '#c0d7ff' : '#ffffff');
      if(cinematic){const target=loser?film.loser:film.winner;art.visible=target.visible!==false;if(target.silhouette)art.visible=false;f.group.position.set(filmId==='kardozo'?f.x:target.x,filmId==='kardozo'?0:target.y,target.z??0);f.group.rotation.y=filmId==='kardozo'?(f.facing===1?0:Math.PI):loser?Math.PI:0;art.rotation.z=target.angle;art.scale.x*=target.scaleX;art.scale.y*=target.scaleY;}
      else {
        f.group.position.set(f.x+(i===0?-1:1)*visualSide*visualGap,f.y,0);
        f.group.rotation.y=f.facing===1?0:Math.PI;
      }
      const shadow = this.shadows[i]; shadow.position.x = cinematic?(loser?film.loser.x:film.winner.x):f.group.position.x; shadow.position.z = .1;
      const scale = Math.max(.45, 1 - f.y * .15); shadow.scale.set(scale, .48 * scale, 1); shadow.material.opacity = .47 * scale;
    });
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i]; effect.life -= motionDelta;
      effect.object.position.y += motionDelta * .65;
      effect.object.material.opacity = Math.max(0, effect.life / effect.maximum);
      if (effect.life <= 0) { this.scene.remove(effect.object); this.releaseObject(effect.object); this.effects.splice(i, 1); }
    }
    this.slamView?.update(this.model,this.art,this.camera);
    this.personalityVfx?.update();this.bossVfx?.update();this.specialVfx.update(motionDelta);this.finisherVfx.update(this.art);
    this.canvas.dataset.projectiles = String(this.model.projectiles.filter(p => p.delay <= 0).length);
    this.canvas.dataset.hitStop = String(this.model.hitStop > 0);
    const [a, b] = this.model.fighters;
    const midpoint = (a.x + b.x) / 2;
    this.canvas.dataset.visualSeparation = visualGap.toFixed(3);
    const highest = Math.max(a.y, b.y) + 3.7;
    
    const vertical = Math.max(6.2, (Math.abs(a.x - b.x) + visualGap * 2 + 5.2) / this.aspect, highest / .76);
    const targetY = vertical * .28;
    const top = vertical / 2, halfWidth = top * this.aspect;
    Object.assign(this.camera, { left: -halfWidth, right: halfWidth, top, bottom: -top }); this.camera.updateProjectionMatrix();
    this.shake *= Math.exp(-14 * motionDelta);
    const shake = this.reducedMotion || this.model.paused ? 0 : this.shake;
    this.camera.position.set(midpoint + (Math.random() - .5) * shake, targetY + 2.3 + (Math.random() - .5) * shake, 13);
    this.camera.lookAt(midpoint, targetY, 0);
    this.camera.updateMatrixWorld();
    if(cinematic&&!this.slamView?.mesh.visible){const vertical=Math.max(film.viewHeight,8.5/this.aspect);Object.assign(this.camera,{left:-vertical*this.aspect/2,right:vertical*this.aspect/2,top:vertical/2,bottom:-vertical/2});this.camera.updateProjectionMatrix();this.camera.position.set(film.cameraX,film.cameraY,13);this.camera.lookAt(0,film.shot===2?2.8:1.8,0);this.camera.updateMatrixWorld();
      // Keep the established illustrated actors facing the camera during oblique cuts.
      this.art.forEach((art,i)=>{const f=this.model.fighters[i],loser=i!==this.model.result.matchWinner;art.quaternion.copy(f.group.quaternion).invert().multiply(this.camera.quaternion);art.rotateZ((loser?film.loser:film.winner).angle);if(loser)art.scale.x*=-1;
        const l=art.userData.layout;const foot=new THREE.Vector3((l.pivotX-.5)*art.scale.x,(.5-l.feetY)*art.scale.y,0).applyQuaternion(art.quaternion);
        art.position.set(-foot.x,-foot.y,.08-foot.z);
      });
      this.finisherVfx.orient(this.camera);
      this.scene.updateMatrixWorld(true);
      let fit=1;
      for(const art of this.art){if(!art.visible)continue;const box=new THREE.Box3().setFromObject(art);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(this.camera);fit=Math.max(fit,Math.abs(p.x)/.9,Math.abs(p.y)/.9);}}
      if(fit>1){this.camera.left*=fit;this.camera.right*=fit;this.camera.top*=fit;this.camera.bottom*=fit;this.camera.updateProjectionMatrix();}
    }
    if (this.slamView?.mesh.visible) {
      const frame=slamCameraFrame(this.slamView.cameraStart,{height:vertical,focusX:midpoint,focusY:targetY},this.slamView.focusX,this.slamView.time,this.slamView.duration,this.aspect);
      const viewHeight=frame.height,x=frame.focusX;
      Object.assign(this.camera, {left:-viewHeight*this.aspect/2,right:viewHeight*this.aspect/2,top:viewHeight/2,bottom:-viewHeight/2});
      // Keep the same downward pitch as the fight camera so the floor stays visible.
      this.camera.position.set(x,frame.focusY+2.3,13);this.camera.lookAt(x,frame.focusY,0);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
      this.slamView.orient(this.camera);
    }
    this.shadows.forEach(shadow=>{shadow.visible=!this.slamView?.mesh.visible;});
    this.canvas.dataset.finisherStage=cinematic?finisherStage(filmId,this.model.finishClock):'';this.canvas.dataset.finisher=cinematic?filmId:'';this.canvas.dataset.finisherTime=String(this.model.finishClock??0);this.canvas.dataset.cameraShot=this.slamView?.mesh.visible?'slam-wide':cinematic?String(film.shot):'fight';
    this.background.update(motionDelta, this.model, this.canvas);
    this.renderer.render(this.scene, this.camera);
  }

  onlineForfeit(loser){if(this.model.phase==='matchOver')return;this.model.fighters[1-loser].wins=2;this.model.result={winner:1-loser,matchWinner:1-loser,reason:'OPPONENT DISCONNECTED — FORFEIT'};this.model.phase='matchOver';this.model.setPaused(false);this.publish();}
  onlineVote(command,who){
    this.netCommands.add(command+':'+who);
    if(this.netCommands.has(command+':local')&&this.netCommands.has(command+':remote')){this.netCommands.clear();if(command==='next')this.localNextRound();else this.localRematch();}
  }
  publish() { if (!this.disposed) this.onUpdate({...this.model.snapshot(),bossLine:bossLine(this.model),networkWaiting:!!this.online&&!this.netReady,networkLag:!!this.online&&Date.now()-this.online.lastSeen>3000,online:!!this.online}); }
  pause(value) { if(this.online){if(!this.netReady)return;if(!this.online.host){this.online.send('command',{command:value?'pause':'resume'});return;}} this.input.clear(); this.accumulator = 0; this.model.setPaused(value); this.publish(); if (!value) this.host.focus({ preventScroll: true }); }
  nextRound() {if(this.online){if(this.online.host)this.onlineVote('next','local');else this.online.send('command',{command:'next'});return;}this.localNextRound();}
  localNextRound() { this.cpu?.reset(); this.input.clear(); this.effects.forEach(effect => { this.scene.remove(effect.object); this.releaseObject(effect.object); }); this.effects = []; this.specialVfx.reset(); this.model.nextRound(); this.background.reset();this.finisherVfx.reset(); this.publish(); this.host.focus({ preventScroll: true }); }
  rematch() {if(this.online){if(this.online.host)this.onlineVote('rematch','local');else this.online.send('command',{command:'rematch'});return;}this.localRematch();}
  localRematch() { this.cpu?.reset(); this.input.clear(); this.effects.forEach(effect => { this.scene.remove(effect.object); this.releaseObject(effect.object); }); this.effects = []; this.shake = 0; this.flash = [0, 0]; this.specialVfx.reset(); this.model.rematch(); this.background.reset();this.finisherVfx.reset(); this.publish(); this.host.focus({ preventScroll: true }); }
  clearControls() { this.input.clear(); }
  touch(player, action, pointer, down) { if (!this.model.paused && this.model.phase === 'fight') this.input.setPointer(player, action, pointer, down); else if (!down) this.input.setPointer(player, action, pointer, false); }

  releaseObject(object) {
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    for (const material of materials) { material.map?.dispose(); material.dispose(); }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;this.assetAbort?.abort();
    this.slamView?.dispose();this.personalityVfx?.dispose();this.bossVfx?.dispose();this.netUnlisten?.(); this.renderer?.setAnimationLoop(null); this.observer?.disconnect(); this.input?.clear();
    this.host?.removeEventListener('keydown', this.onKeyDown); this.host?.removeEventListener('keyup', this.onKeyUp);
    this.host?.removeEventListener('focusout', this.onFocusOut);
    window.removeEventListener('blur', this.onBlur); document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas?.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas?.removeEventListener('pointerdown', this.onBackdropTap);
    const geometries = new Set(), materials = new Set(), textures = new Set();
    this.background?.dispose(); this.specialVfx?.dispose();this.finisherVfx?.dispose(); this.fighterTextures?.forEach(texture => textures.add(texture));
    this.scene?.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
        materials.add(material); if (material.map) textures.add(material.map);
      }
    });
    geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose());
    this.model?.dispose(); this.renderer?.dispose(); this.renderer?.forceContextLoss();
  }
}
