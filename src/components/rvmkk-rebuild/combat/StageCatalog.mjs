// Source-image coordinates use a top-left origin. All scenery comes from the supplied arena art.
const ROOT = '/assets/rvmkk-rebuild/stages/';
const motion = (x, y, w, h, dx, dy, turn, speed) => ({ box: [x, y, w, h], move: [dx, dy, turn, speed] });
const light = (x, y, w, h, color, speed = 2) => ({ box: [x, y, w, h], color, speed });
const gag = (id, actor, effect, extra = {}) => ({ id, actor, effect, ...extra });

export const STAGES = Object.freeze([
  {
    id: 'throne-alley', name: 'REJECT THRONE ALLEY', art: ROOT + 'throne-alley.png',
    note: 'The toilet has an attitude. So does the rat.',
    motions: [motion(.171,.642,.077,.064,.012,0,.06,2.3), motion(.91,.546,.064,.096,0,.006,.1,2.4), motion(.405,.51,.112,.19,.002,.002,.013,1.1), motion(.833,.455,.072,.11,.003,.008,.035,3.8)],
    lights: [light(.83,.445,.09,.1,'#ff7b22',3.2), light(.193,.20,.10,.12,'#ff28c8',1.7), light(.751,.184,.105,.15,'#ffbd36',1.4)],
    gags: [
      gag('rat-king-catapult', [.938,.603], 'rat-catapult', { radius: .17 }),
      gag('rat-king-catapult', [.173,.647], 'rat-catapult', { radius: .12 }),
    ],
  },
  {
    id: 'public-opinion', name: 'COURT OF PUBLIC OPINION', art: ROOT + 'public-opinion.png',
    note: 'Take a number. They are fresh out of giving a shit.',
    motions: [motion(.38,.417,.052,.13,0,.003,.018,1.6), motion(.637,.412,.052,.135,0,.003,-.022,1.9), motion(.943,.529,.048,.1,0,.003,.026,1.7), motion(.08,.276,.085,.08,.003,.002,.017,1.4)],
    lights: [light(.24,.369,.07,.09,'#ff31e5',1.9), light(.95,.17,.064,.08,'#ffbe51',1.4), light(.48,.29,.075,.11,'#ffca72',1.2)],
    gags: [
      gag('complaint-backfire', [.247,.506], 'ticket-glove', { radius: .14 }),
      gag('complaint-backfire', [.79,.477], 'ticket-glove', { radius: .16 }),
    ],
  },
  {
    id: 'dollar-store-dojo', name: 'DOLLAR STORE DOJO', art: ROOT + 'dollar-store-dojo.png',
    note: 'A waving cat, a stubborn snack machine, and questionable soup.',
    motions: [motion(.173,.499,.034,.068,.002,.003,.16,2.4), motion(.125,.52,.055,.08,0,.002,.016,1.3), motion(.284,.465,.045,.13,.002,0,.014,3.6), motion(.505,.494,.065,.085,0,.002,.012,1.4)],
    lights: [light(.89,.587,.037,.12,'#70df31',1.5), light(.49,.527,.15,.07,'#ffa529',2.2), light(.856,.116,.06,.064,'#59afff',1.2)],
    gags: [
      gag('lucky-cat-unlucky-snack', [.174,.477], 'bird-snack', { radius: .15 }),
      gag('lucky-cat-unlucky-snack', [.285,.493], 'bird-snack', { radius: .14 }),
    ],
  },
  {
    id: 'motel-alley', name: 'MOTEL ALLEY', art: ROOT + 'motel-alley.png',
    note: 'Hourly rates. Eternal consequences.',
    motions: [motion(.817,.459,.026,.093,.004,0,.035,1.7), motion(.833,.536,.04,.16,.002,0,.015,4.5), motion(.239,.52,.061,.115,0,.003,.02,2.4), motion(.919,.476,.035,.065,0,.001,.015,1.7)],
    lights: [light(.873,.311,.051,.027,'#ff641b',1.6), light(.54,.223,.035,.06,'#ff45a1',1.7), light(.11,.188,.11,.065,'#ef43bf',1.4)],
    gags: [
      gag('express-checkout', [.823,.499], 'pants-catapult', { radius: .14 }),
      gag('express-checkout', [.924,.468], 'pants-catapult', { radius: .14 }),
    ],
  },
  {
    id: 'backroom', name: 'BACKROOM OF BAD DECISIONS', art: ROOT + 'backroom.png',
    note: 'The influencer is live. Security wishes he was not.',
    motions: [motion(.844,.317,.055,.12,.003,.002,.027,1.7), motion(.667,.279,.065,.135,0,.003,.017,1.2), motion(.408,.552,.085,.078,.004,.003,.035,2.1), motion(.077,.586,.07,.116,0,.002,.016,1.5)],
    lights: [light(.43,.128,.16,.063,'#e53cff',1.6), light(.145,.215,.055,.068,'#ff4c31',2.1), light(.833,.134,.10,.07,'#db39ff',1.7)],
    gags: [
      gag('inflated-ego', [.847,.253], 'balloon-head', { radius: .16 }),
    ],
  },
  {
    id: 'shake-regret', name: 'SHAKE REGRET', art: ROOT + 'shake-regret.png',
    note: 'Bad credit and worse judgment.',
    motions: [motion(.477,.242,.046,.13,.002,.001,.018,1.6), motion(.368,.228,.033,.12,-.002,.002,.022,1.7), motion(.412,.576,.075,.13,0,.003,.027,2), motion(.692,.629,.09,.056,0,.004,.022,2.3)],
    lights: [light(.41,.048,.15,.028,'#b756ff',1.8), light(.66,.132,.10,.047,'#ff307e',1.4), light(.15,.255,.055,.09,'#ff513e',1.6)],
    gags: [
      gag('dollar-on-a-string', [.309,.548], 'cheap-tip', { radius: .17 }),
      gag('dollar-on-a-string', [.487,.256], 'cheap-tip', { radius: .13 }),
    ],
  },
  {
    id: 'donkey-show', name: 'DONKEY SHOW', art: ROOT + 'donkey-show.png',
    note: 'That is definitely not the fog machine.',
    motions: [motion(.482,.298,.05,.11,.002,.003,.022,1.6), motion(.529,.192,.013,.054,.002,.001,.10,2.1), motion(.509,.317,.016,.075,.003,0,.15,2.5), motion(.283,.45,.052,.055,.002,.002,.03,1.8)],
    lights: [light(.512,.087,.032,.045,'#d4a2ff',1.5), light(.62,.042,.10,.018,'#ff49ba',1.7), light(.854,.132,.12,.06,'#ff43bd',1.4)],
    gags: [
      gag('wardrobe-windstorm', [.47,.342], 'fart-bra', { radius: .17 }),
    ],
  },
]);

export function resolveStage(id) { return STAGES.find(stage => stage.id === id) || STAGES[0]; }
