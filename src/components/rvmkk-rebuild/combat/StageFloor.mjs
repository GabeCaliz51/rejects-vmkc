// The arena artwork already contains the correct floor perspective.
// The previous synthetic 3D floor was a separate plane that could intersect
// fighter feet and visually disagree with the supplied background.
// Keep the public factory so LivingBackdrop needs no special-case code.
export function createStageFloor(){ return ()=>{}; }
