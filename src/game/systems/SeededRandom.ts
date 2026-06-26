export class SeededRandom {
  private state: number;

  constructor(seed: string | number) {
    this.state = normalizeSeed(seed);
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let value = this.state;

    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  int(min: number, max: number): number {
    const low = Math.ceil(min);
    const high = Math.floor(max);

    return Math.floor(this.range(low, high + 1));
  }

  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from an empty array.');
    }

    return array[this.int(0, array.length - 1)];
  }
}

function normalizeSeed(seed: string | number): number {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return seed >>> 0;
  }

  const seedText = String(seed);
  let hash = 2166136261;

  for (let index = 0; index < seedText.length; index += 1) {
    hash ^= seedText.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
