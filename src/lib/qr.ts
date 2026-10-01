/**
 * Small QR code encoder (byte mode, error correction level M, versions 1 to 40,
 * automatic mask). Produces the module grid; drawing is left to the caller.
 * Follows ISO/IEC 18004; structure modelled on Nayuki's qrcodegen.
 */

export type QrMatrix = { size: number; modules: boolean[][] };

// Error correction level M: codewords per block and number of blocks, versions 1..40.
const ECC_PER_BLOCK = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
const NUM_BLOCKS = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];
const ECL_FORMAT_BITS = 0; // M

export function encodeQr(text: string): QrMatrix {
  const data = new TextEncoder().encode(text);
  const version = chooseVersion(data.length);
  const codewords = buildCodewords(data, version);
  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  drawFunctionPatterns(modules, isFunction, version, size);
  drawCodewords(modules, isFunction, codewords, size);

  let best = 0;
  let bestPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(modules, isFunction, m, size);
    drawFormatBits(modules, isFunction, m, size);
    const p = penalty(modules, size);
    if (p < bestPenalty) {
      bestPenalty = p;
      best = m;
    }
    applyMask(modules, isFunction, m, size); // undo (XOR)
  }
  applyMask(modules, isFunction, best, size);
  drawFormatBits(modules, isFunction, best, size);
  return { size, modules };
}

/* ---------- capacity and segments ---------- */

function rawDataModules(ver: number) {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const a = Math.floor(ver / 7) + 2;
    n -= (25 * a - 10) * a - 55;
    if (ver >= 7) n -= 36;
  }
  return n;
}

function dataCodewords(ver: number) {
  return Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[ver - 1] * NUM_BLOCKS[ver - 1];
}

function countBits(ver: number) {
  return ver < 10 ? 8 : 16;
}

function chooseVersion(len: number) {
  for (let v = 1; v <= 40; v++) {
    const bits = 4 + countBits(v) + len * 8;
    if (bits <= dataCodewords(v) * 8) return v;
  }
  throw new Error("Text is too long for a QR code");
}

function buildCodewords(data: Uint8Array, ver: number): Uint8Array {
  const bits: number[] = [];
  const push = (val: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  push(0b0100, 4);
  push(data.length, countBits(ver));
  for (const b of data) push(b, 8);
  const capacity = dataCodewords(ver) * 8;
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);

  const bytes = new Uint8Array(bits.length / 8);
  for (let i = 0; i < bits.length; i++) bytes[i >>> 3] |= bits[i] << (7 - (i & 7));
  return interleave(bytes, ver);
}

/* ---------- Reed-Solomon over GF(2^8) ---------- */

function gfMul(x: number, y: number) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number) {
  const result = Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 2);
  }
  return result;
}

function rsRemainder(data: Uint8Array, divisor: number[]) {
  const result = Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => (result[i] ^= gfMul(coef, factor)));
  }
  return result;
}

function interleave(data: Uint8Array, ver: number): Uint8Array {
  const numBlocks = NUM_BLOCKS[ver - 1];
  const eccLen = ECC_PER_BLOCK[ver - 1];
  const rawCodewords = Math.floor(rawDataModules(ver) / 8);
  const numShort = numBlocks - (rawCodewords % numBlocks);
  const shortLen = Math.floor(rawCodewords / numBlocks);
  const divisor = rsDivisor(eccLen);

  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const len = shortLen - eccLen + (i < numShort ? 0 : 1);
    const block = data.slice(k, k + len);
    k += len;
    const ecc = rsRemainder(block, divisor);
    const full = Array.from(block);
    if (i < numShort) full.push(0); // placeholder so columns line up
    blocks.push(full.concat(ecc));
  }

  const out: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= numShort) out.push(block[i]);
    });
  }
  return Uint8Array.from(out);
}

/* ---------- drawing ---------- */

function alignmentPositions(ver: number, size: number): number[] {
  if (ver === 1) return [];
  const numAlign = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let i = 0, pos = size - 7; i < numAlign - 1; i++, pos -= step) result.splice(1, 0, pos);
  return result;
}

function set(modules: boolean[][], isFunction: boolean[][], x: number, y: number, dark: boolean) {
  modules[y][x] = dark;
  isFunction[y][x] = true;
}

function drawFunctionPatterns(modules: boolean[][], isFunction: boolean[][], ver: number, size: number) {
  for (let i = 0; i < size; i++) {
    set(modules, isFunction, 6, i, i % 2 === 0);
    set(modules, isFunction, i, 6, i % 2 === 0);
  }
  drawFinder(modules, isFunction, 3, 3, size);
  drawFinder(modules, isFunction, size - 4, 3, size);
  drawFinder(modules, isFunction, 3, size - 4, size);

  const align = alignmentPositions(ver, size);
  const n = align.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) set(modules, isFunction, align[i] + dx, align[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }

  drawFormatBits(modules, isFunction, 0, size); // reserves the area; real bits written later
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(modules, isFunction, a, b, bit);
      set(modules, isFunction, b, a, bit);
    }
  }
}

function drawFinder(modules: boolean[][], isFunction: boolean[][], cx: number, cy: number, size: number) {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      set(modules, isFunction, x, y, d !== 2 && d !== 4);
    }
  }
}

function drawFormatBits(modules: boolean[][], isFunction: boolean[][], mask: number, size: number) {
  const data = (ECL_FORMAT_BITS << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const bit = (i: number) => ((bits >>> i) & 1) === 1;

  for (let i = 0; i <= 5; i++) set(modules, isFunction, 8, i, bit(i));
  set(modules, isFunction, 8, 7, bit(6));
  set(modules, isFunction, 8, 8, bit(7));
  set(modules, isFunction, 7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(modules, isFunction, 14 - i, 8, bit(i));

  for (let i = 0; i < 8; i++) set(modules, isFunction, size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(modules, isFunction, 8, size - 15 + i, bit(i));
  set(modules, isFunction, 8, size - 8, true); // always-dark module
}

function drawCodewords(modules: boolean[][], isFunction: boolean[][], data: Uint8Array, size: number) {
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && i < data.length * 8) {
          modules[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }
}

function applyMask(modules: boolean[][], isFunction: boolean[][], mask: number, size: number) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let invert: boolean;
      switch (mask) {
        case 0: invert = (x + y) % 2 === 0; break;
        case 1: invert = y % 2 === 0; break;
        case 2: invert = x % 3 === 0; break;
        case 3: invert = (x + y) % 3 === 0; break;
        case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
        case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        default: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
      }
      if (!isFunction[y][x] && invert) modules[y][x] = !modules[y][x];
    }
  }
}

/* ---------- mask penalty ---------- */

function penalty(m: boolean[][], size: number) {
  let result = 0;
  // Rows and columns: runs of 5+ and finder-like patterns.
  for (let y = 0; y < size; y++) {
    result += runPenalty(m[y]);
    result += runPenalty(m.map((row) => row[y]));
  }
  // 2x2 blocks.
  for (let y = 0; y < size - 1; y++)
    for (let x = 0; x < size - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) result += 3;
    }
  // Dark proportion.
  let dark = 0;
  for (const row of m) for (const c of row) if (c) dark++;
  const total = size * size;
  const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  result += k * 10;
  return result;
}

function runPenalty(line: boolean[]) {
  let result = 0;
  let runColor = false;
  let runLen = 0;
  const history = [0, 0, 0, 0, 0, 0, 0];
  const finderLike = () => {
    const n = history[1];
    return n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n && (history[0] >= 4 || history[6] >= 4);
  };
  const addHistory = (len: number) => {
    history.pop();
    history.unshift(len);
  };
  for (let x = 0; x < line.length; x++) {
    if (line[x] === runColor) {
      runLen++;
      if (runLen === 5) result += 3;
      else if (runLen > 5) result++;
    } else {
      addHistory(runLen);
      if (!runColor && finderLike()) result += 40;
      runColor = line[x];
      runLen = 1;
    }
  }
  addHistory(runLen);
  if (runColor) addHistory(0);
  if (finderLike()) result += 40;
  return result;
}
