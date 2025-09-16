const MODULUS = 2147483647;
const MULTIPLIER = 48271;

export class RNG {
  constructor(seed = Date.now()) {
    this.setSeed(seed);
  }

  setSeed(seed) {
    const normalized = Number(seed) || 1;
    this.state = (normalized % (MODULUS - 1)) + 1;
    this.initialSeed = this.state;
  }

  getState() {
    return {
      state: this.state,
    };
  }

  setState(snapshot) {
    if (!snapshot || typeof snapshot.state !== 'number') {
      throw new Error('Invalid RNG state.');
    }
    this.state = snapshot.state;
  }

  nextInt() {
    this.state = (this.state * MULTIPLIER) % MODULUS;
    return this.state;
  }

  nextFloat() {
    return this.nextInt() / MODULUS;
  }

  nextRange(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new Error('Range bounds must be numbers.');
    }

    if (max <= min) {
      return min;
    }

    const span = max - min;
    return min + Math.floor(this.nextFloat() * (span + 1));
  }

  pick(list) {
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('Cannot pick from an empty list.');
    }

    const index = Math.floor(this.nextFloat() * list.length);
    return list[index];
  }

  shuffle(list) {
    const items = [...list];
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.nextFloat() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
}

export function hashStringToSeed(input) {
  if (!input) {
    return 1;
  }

  let hash = 0;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}

export function createRNG(seed) {
  return new RNG(seed);
}
