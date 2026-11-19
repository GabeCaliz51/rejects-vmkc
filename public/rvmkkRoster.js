// Approved RVMKK roster reference. Metadata only: artwork and move animations
// from the separately developed game are NOT included in this prototype.
export const RVMKK_ROSTER = Object.freeze([
  { id: 'gaibden', name: 'GAIBDEN', playable: true },
  { id: 'gare-chi', name: 'GARE-CHI', playable: true },
  { id: 'da-tennisha-blaze', name: "DA’TENNISHA BLAZE", playable: true },
  { id: 'treytaro', name: 'TREYTARO', playable: true },
  { id: 'kitaria', name: 'KITARIA', playable: true },
  { id: 'keen-kahn', name: 'KEEN-KAHN', playable: true },
  { id: 'kardozo', name: 'KARDOZO', playable: true, protected: true },
  { id: 'nicoleena', name: 'NICOLEENA', playable: true },
  { id: 'cokane-o', name: 'COKANE-O', playable: true },
  { id: 'scorpurtis', name: 'SCORPURTIS', playable: true },
  { id: 'x-man', name: 'X-MAN', playable: false, role: 'final-boss' }
]);

// Only approved, named moves are listed. These entries do not implement them.
export const RVMKK_MOVE_NOTES = Object.freeze({
  gaibden: Object.freeze(['BAD CONNECTION', 'LOW BATTERY']),
  nicoleena: Object.freeze(['Long, thin durable tongue with forward-reaching spiral/slinky action'])
});
