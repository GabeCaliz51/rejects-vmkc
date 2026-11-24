import * as THREE from '../vendor/three.module.mjs';

function texture(width, height, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('The special effects could not start.');
  draw(c); const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}
function ink(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
}
function glow(color, opacity = .5) { const m = ink(color, opacity); m.blending = THREE.AdditiveBlending; return m; }
function mesh(geometry, material, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); return m; }
function caption(text, color = '#ffe1a1') {
  const map = texture(768, 128, c => {
    c.textAlign = 'center'; c.font = 'italic 900 ' + (text.length > 22 ? '38' : text.length > 16 ? '44' : '58') + 'px Impact, sans-serif'; c.lineWidth = 13;
    c.strokeStyle = '#0d0814'; c.strokeText(text, 384, 83); c.fillStyle = color; c.fillText(text, 384, 83);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }));
  sprite.scale.set(3.6, .6, 1); sprite.renderOrder = 25; return sprite;
}
function disposeNode(node) {
  const geometries = new Set(), materials = new Set(), maps = new Set();
  node.traverse(o => { if (o.geometry) geometries.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) { materials.add(m); if (m.map) maps.add(m.map); } });
  geometries.forEach(x => x.dispose()); materials.forEach(x => x.dispose()); maps.forEach(x => x.dispose()); node.removeFromParent();
}
function bolt(points, color = 0xc7f5ff, radius = .035) {
  const path = new THREE.CurvePath();
  for (let n = 1; n < points.length; n++) path.add(new THREE.LineCurve3(new THREE.Vector3(...points[n - 1]), new THREE.Vector3(...points[n])));
  return mesh(new THREE.TubeGeometry(path, Math.max(12, points.length * 4), radius, 5, false), glow(color, .95));
}
function energyFan() {
  const g = new THREE.Group();
  for (let n = 0; n < 9; n++) {
    const angle = -.15 + n / 8 * Math.PI * 1.15;
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(Math.cos(angle) * .95, Math.sin(angle) * .95); shape.lineTo(Math.cos(angle + .18) * 1.08, Math.sin(angle + .18) * 1.08); shape.closePath();
    g.add(mesh(new THREE.ShapeGeometry(shape), ink(n % 2 ? 0xb88cff : 0x585bce, .65)));
    const rib = mesh(new THREE.PlaneGeometry(.95, .022), glow(0xf1d9ff, .95), Math.cos(angle) * .47, Math.sin(angle) * .47, .02); rib.rotation.z = angle; g.add(rib);
  }
  return g;
}
function pizza() {
  const g = new THREE.Group();
  const map = texture(256, 256, c => {
    c.fillStyle = '#ad4a1e'; c.beginPath(); c.arc(128, 128, 123, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd260'; c.beginPath(); c.arc(128, 128, 106, 0, Math.PI * 2); c.fill();
    for (const [x, y] of [[78, 78], [150, 70], [65, 145], [142, 148], [187, 128], [112, 194]]) { c.fillStyle = '#a52c19'; c.beginPath(); c.arc(x, y, 16, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#f5ad37'; c.lineWidth = 3;
    for (let n = 0; n < 8; n++) { c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(n * Math.PI / 4) * 110, 128 + Math.sin(n * Math.PI / 4) * 110); c.stroke(); }
  });
  g.add(mesh(new THREE.CircleGeometry(.48, 40), new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, depthWrite: false }), 0, 0, .06));
  g.add(mesh(new THREE.TorusGeometry(.46, .055, 8, 40), ink(0xd18832)));
  return g;
}

export class SpecialVfx {
  constructor(scene, model) {
    this.model = model; this.root = new THREE.Group(); scene.add(this.root);
    this.projectiles = new Map(); this.auras = new Map(); this.popups = []; this.bursts = []; this.waves = []; this.time = 0;
  }

  event(event) {
    if(event.type==='smoke'){
      const f=this.model.fighters[event.owner],group=new THREE.Group();group.position.set(event.x+f.facing*.5,event.y,.3);
      for(let n=0;n<14;n++){const puff=mesh(new THREE.SphereGeometry(.12+n*.018,10,8),ink(0xa49aaf,.45),f.facing*n*.075,(n%4-1.5)*.09);puff.userData.velocity=new THREE.Vector3(f.facing*(.5+n*.07),.12,0);group.add(puff);}
      this.root.add(group);this.bursts.push({group,life:1.2});
    }

    if (event.type === 'comedyBeat' && event.move.comedy === 'sneeze') {
      const f = this.model.fighters[event.owner];
      const group = new THREE.Group(); group.position.set(f.x + f.facing * .55, f.y + 2.35, .20);
      for (let n = 0; n < 5; n++) {
        const puff = mesh(new THREE.SphereGeometry(.10 + n * .025, 8, 6), ink(n % 2 ? 0xf1edf9 : 0xb9abd1, .50), f.facing * n * .12, (n % 3 - 1) * .08);
        puff.userData.velocity = new THREE.Vector3(f.facing * (1.4 + n * .2), .15 + n % 2 * .2, -.1); group.add(puff);
      }
      this.root.add(group); this.bursts.push({ group, life: .42 });
    }

    if (event.type === 'comedyStart') {
      const f = this.model.fighters[event.owner], sprite = caption(event.move.label, '#ffe0aa');
      sprite.position.set(f.x, 3.5, .9); sprite.scale.set(3.8, .63, 1); this.root.add(sprite); this.popups.push({ sprite, life: .75 });
    }
    if (event.type === 'specialStart') {
      const f = this.model.fighters[event.owner], sprite = caption(event.move.name, '#' + event.move.color.toString(16).padStart(6, '0'));
      sprite.position.set(f.x, 3.65, .9); this.root.add(sprite); this.popups.push({ sprite, life: .95 });
      this.wave(f.x, .15, event.move.color, .65, true);
    }
    if (event.type === 'hit') {
      const color = this.model.fighters[event.attacker].special?.color ?? 0xffd276;
      if (event.comedy) {
        this.burst(event.x, event.y, event.comedy === 'paddle' ? 0xaee5ff : event.comedy === 'swat' ? 0xd4aaff : 0xffd580, event.comedy === 'snack' ? 12 : 7);
        if (event.comedy === 'tantrum' || event.comedy === 'hoof') this.wave(this.model.fighters[event.attacker].x, .12, 0xd2b188, .38, true);
      }
      if (event.special || event.heavy) this.burst(event.x, event.y, color, event.special ? 18 : 10);
      if (event.knockdown) this.wave(event.x, .16, color, .55, true);
    }
    if (event.type === 'slam' || event.type === 'land') {
      this.burst(event.x, .35, event.type === 'slam' ? 0xffbd65 : 0xad9877, 14);
      this.wave(event.x, .12, 0xffcb87, .62, true);
    }
  }

  wave(x, y, color, life = .45, ground = false) {
    const ring = mesh(new THREE.RingGeometry(.60, .69, 40), glow(color, .75), x, y, ground ? .03 : .75);
    if (ground) { ring.rotation.x = -Math.PI / 2; ring.position.z = .05; }
    this.root.add(ring); this.waves.push({ ring, life, maximum: life });
  }
  burst(x, y, color, count) {
    const group = new THREE.Group(); group.position.set(x, y, .85);
    for (let n = 0; n < count; n++) {
      const angle = n / count * Math.PI * 2, speed = 1.6 + n % 4 * .6;
      const particle = mesh(n % 3 ? new THREE.PlaneGeometry(.045, .35) : new THREE.IcosahedronGeometry(.065), n % 3 ? glow(n % 2 ? color : 0xfff3c9) : ink(color));
      particle.rotation.z = angle - Math.PI / 2; particle.userData.velocity = new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0); group.add(particle);
    }
    this.root.add(group); this.bursts.push({ group, life: .42 });
    this.wave(x, y, color, .28);
  }

  projectile(move) {
    const group = new THREE.Group();
    if(move.kind==='skulls'){
      const skull=mesh(new THREE.SphereGeometry(.3,14,12),ink(0x17131e,.7));skull.scale.set(1,.95,.65);group.add(skull);
      for(const x of [-.11,.11]){const eye=mesh(new THREE.SphereGeometry(.09,10,8),ink(0x000000,.95),x,.035,.19);group.add(eye);}
      for(let n=0;n<5;n++)group.add(mesh(new THREE.BoxGeometry(.055,.11,.10),ink(0x38303e,.8),-.12+n*.06,-.22,.15));
      group.add(mesh(new THREE.SphereGeometry(.4,12,8),ink(0x21172e,.15)));
    } else if (move.kind === 'pizza') {
      group.add(pizza());
      for (let n = 0; n < 4; n++) { const streak = mesh(new THREE.PlaneGeometry(.7, .035), glow(0xffbd55, .65), -.7 - n * .12, (n - 1.5) * .16, -.03); group.add(streak); }
    } else if (move.kind === 'lightning') {
      const core = mesh(new THREE.SphereGeometry(.22, 12, 10), glow(0xf4fdff, .98)); core.scale.x = 2.2; group.add(core);
      group.add(mesh(new THREE.SphereGeometry(.35, 12, 10), glow(0x459bff, .28)));
      for (let n = 0; n < 5; n++) {
        const y = (n - 2) * .10;
        group.add(bolt([[-1.2, y * .5, 0], [-.85, y + .12, 0], [-.65, y - .08, 0], [-.33, y + .13, 0], [0, y, 0], [.45, 0, 0]], n % 2 ? 0x6fafff : 0xf4fdff, n % 2 ? .025 : .035));
      }
    } else if (move.kind === 'tongue' || move.kind === 'chain') {
      const color=move.kind==='tongue'?0xd77bdf:0xf9bb4c;
      const line=mesh(new THREE.CylinderGeometry(.047,.075,1.25,9),glow(color,.9));
      line.rotation.z=Math.PI/2;group.add(line);
      if(move.kind==='tongue')for(let n=0;n<4;n++){
        const hoop=mesh(new THREE.TorusGeometry(.23+n*.045,.032,7,26),glow(color,.8),-.45+n*.25,0,.04);
        hoop.rotation.y=Math.PI/2;group.add(hoop);
      }
      else for(let n=0;n<6;n++){
        const link=mesh(new THREE.TorusGeometry(.105,.034,6,12),ink(n%2?0xedce86:0x5c6067),-.56+n*.21,0,.03);
        link.rotation.y=Math.PI/2;group.add(link);
      }
    } else if (move.kind === 'bugles') {
      const cone = mesh(new THREE.ConeGeometry(.22, .63, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xffc24b, roughness: .5, side: THREE.DoubleSide })); cone.rotation.z = -Math.PI / 2; group.add(cone);
      const rim = mesh(new THREE.TorusGeometry(.22, .025, 6, 18), ink(0xffe099), -.31); rim.rotation.y = Math.PI / 2; group.add(rim);
      for (let n = 0; n < 3; n++) group.add(mesh(new THREE.PlaneGeometry(.6, .025), glow(0xffcd6a, .65), -.7 - n * .12, (n - 1) * .14));
    }
    group.renderOrder = 12; this.root.add(group); return group;
  }

  aura(move) {
    const group = new THREE.Group();
    if (move.kind === 'stamp') {
      group.add(mesh(new THREE.BoxGeometry(2.1, .36, .70), ink(0x9c502d)));
      group.add(mesh(new THREE.BoxGeometry(2.18, .09, .78), ink(0xe8b955), 0, -.22));
      group.add(mesh(new THREE.CylinderGeometry(.16, .20, .65, 10), ink(0xe8b955), 0, .5));
      const map = texture(640, 180, c => { c.strokeStyle = '#ffb451'; c.lineWidth = 13; c.strokeRect(12, 12, 616, 155); c.textAlign = 'center'; c.font = '900 88px Impact, sans-serif'; c.fillStyle = '#ffe2a4'; c.fillText('REJECTED', 320, 119); });
      const face = mesh(new THREE.PlaneGeometry(2.05, .57), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }), 0, .02, .37); group.add(face);
    } else if (move.kind === 'fans') {
      for (let n = 0; n < 2; n++) { const fan = energyFan(); fan.position.set(n * .7, n ? -.2 : .2, n * .05); fan.rotation.z = n * Math.PI; group.add(fan); }
      for (let n = 0; n < 3; n++) { const ring = mesh(new THREE.RingGeometry(.95 + n * .14, 1.04 + n * .14, 40, 1, n, Math.PI * 1.4), glow(0xb778ff, .25 + n * .10)); group.add(ring); }
    } else if (move.kind === 'lightning') {
      for (const y of [-.24, .24]) {
        group.add(mesh(new THREE.SphereGeometry(.16, 12, 8), glow(0xe6f9ff, .85), 0, y));
        const orb = mesh(new THREE.SphereGeometry(.3, 12, 8), glow(0x498fff, .30), 0, y); group.add(orb);
      }
      for (let n = 0; n < 4; n++) group.add(bolt([[-.5, -.5 + n * .3, 0], [-.2, -.15 + n * .1, 0], [-.45, .1 + n * .1, 0], [.2, .25 - n * .1, 0]], 0x82caff, .022));
    } else if (move.kind === 'pizza') {
      const pie = pizza(); pie.scale.setScalar(.7); group.add(pie);
    } else if (move.kind === 'bugles') {
      for (let n = 0; n < 3; n++) { const c = mesh(new THREE.ConeGeometry(.13, .36, 8), ink(0xffce5a), n * .13, (n - 1) * .20); c.rotation.z = -Math.PI / 2; group.add(c); }
    } else if (move.kind === 'rush') {
      for (let n = 0; n < 8; n++) group.add(mesh(new THREE.PlaneGeometry(.7 + n % 3 * .3, .035 + n % 2 * .04), glow(n % 2 ? 0xffce67 : 0xff782e, .55), -.7 - n % 3 * .3, -.65 + n * .18, -.02));
      group.add(mesh(new THREE.RingGeometry(.5, .58, 32, 1, 0, Math.PI * 1.5), glow(0xffc369, .65), .3, -.2));
    } else if (move.kind === 'grab') {
      const squeeze = caption('SQUEEZE!', '#ffcc79'); squeeze.scale.set(2.2, .4, 1); group.add(squeeze);
    }
    group.renderOrder = 10; this.root.add(group); return group;
  }

  update(delta) {
    this.time += delta;
    const live = new Set();
    for (const p of this.model.projectiles) {
      if (p.delay > 0) continue;
      live.add(p.id); let group = this.projectiles.get(p.id);
      if (!group) { group = this.projectile(p.move); this.projectiles.set(p.id, group); }
      group.position.set(p.x, p.y, .65); group.scale.x = p.facing;
      if (p.move.kind === 'pizza') group.children[0].rotation.z = this.time * -14;
      if (p.move.kind === 'bugles') group.rotation.x = this.time * 12;
      if (p.move.kind === 'lightning') group.scale.y = 1 + Math.sin(this.time * 45) * .1;
    }
    for (const [id, g] of this.projectiles) if (!live.has(id)) { disposeNode(g); this.projectiles.delete(id); }
    for (const f of this.model.fighters) {
      const move = f.moveName === 'special' ? f.move : null;
      const allowed = move && f.state !== 'recovery' && !(move.kind === 'grab' && f.grabTarget === null);
      let group = this.auras.get(f.index);
      if (!allowed) { if (group) { disposeNode(group); this.auras.delete(f.index); } continue; }
      if (!group) { group = this.aura(move); this.auras.set(f.index, group); }
      group.position.set(f.x + f.facing * .85, 1.45, .7); group.scale.set(f.facing, 1, 1); group.rotation.z = 0;
      if (move.kind === 'stamp') {
        const progress = f.state === 'startup' ? 1 - f.clock / move.startup : 1;
        const drop = progress < .55 ? 0 : Math.min(1, (progress - .55) / .45);
        group.position.set(f.x + f.facing * 1.38, 3.6 - drop * 3.0, .65); group.rotation.z = f.facing * -.06;
      } else if (move.kind === 'fans') {
        const active = f.state === 'active'; group.scale.multiplyScalar(active ? 1 : .5);
        group.children[0].rotation.z = this.time * 20; group.children[1].rotation.z = -this.time * 23;
        group.children.slice(2).forEach((r, n) => { r.rotation.z = this.time * (10 + n * 3); });
      } else if (move.kind === 'lightning') {
        group.position.y = 1.65; group.visible = f.state === 'startup';
        group.scale.multiplyScalar(.75 + Math.sin(this.time * 35) * .1);
      } else if (move.kind === 'pizza' || move.kind === 'bugles') {
        group.visible = f.state === 'startup'; group.position.y = 1.5; group.rotation.z = move.kind === 'pizza' ? this.time * 9 : 0;
      } else if (move.kind === 'rush') {
        group.visible = f.state === 'active'; group.children[group.children.length - 1].rotation.z = this.time * 25;
      } else if (move.kind === 'grab') { group.position.y = 2.7; group.scale.multiplyScalar(1 + Math.sin(this.time * 28) * .1); }
    }
    for (let n = this.popups.length - 1; n >= 0; n--) {
      const p = this.popups[n]; p.life -= delta; p.sprite.position.y += delta * .12; p.sprite.material.opacity = Math.max(0, Math.min(1, p.life * 4));
      if (p.life <= 0) { disposeNode(p.sprite); this.popups.splice(n, 1); }
    }
    for (let n = this.bursts.length - 1; n >= 0; n--) {
      const b = this.bursts[n]; b.life -= delta;
      b.group.children.forEach(p => { p.position.addScaledVector(p.userData.velocity, delta); p.userData.velocity.y -= delta * 4; p.material.opacity = Math.max(0, b.life / .42); });
      if (b.life <= 0) { disposeNode(b.group); this.bursts.splice(n, 1); }
    }
    for (let n = this.waves.length - 1; n >= 0; n--) {
      const w = this.waves[n]; w.life -= delta; w.ring.scale.setScalar(1 + (1 - w.life / w.maximum) * 2.2); w.ring.material.opacity = Math.max(0, w.life / w.maximum * .7);
      if (w.life <= 0) { disposeNode(w.ring); this.waves.splice(n, 1); }
    }
  }
  reset() {
    for (const g of this.projectiles.values()) disposeNode(g); for (const g of this.auras.values()) disposeNode(g);
    for (const p of this.popups) disposeNode(p.sprite); for (const b of this.bursts) disposeNode(b.group); for (const w of this.waves) disposeNode(w.ring);
    this.projectiles.clear(); this.auras.clear(); this.popups = []; this.bursts = []; this.waves = [];
  }
  dispose() { this.reset(); this.root.removeFromParent(); }
}
