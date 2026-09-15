/** Small deterministic hash -> [0,1) generator so the same unlocked object
 *  always renders in the same spot in the scene (no re-shuffling on every
 *  render/reload). */
export function seededRandom(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let state = h
  return function () {
    state = Math.imul(state ^ (state >>> 16), 2246822507)
    state = Math.imul(state ^ (state >>> 13), 3266489909)
    state ^= state >>> 16
    return (state >>> 0) / 4294967296
  }
}

export function pick(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min)
}
