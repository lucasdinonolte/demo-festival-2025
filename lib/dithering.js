/**
 * @typedef {object} Color
 * @property {number} r
 * @property {number} g
 * @property {number} b
 */

export const methods = {
  FLOYD_STEINBERG: 1,
  JARVIS: 2,
  ATKINSON: 3,
  ORDERED: 4,
};

let ditherMatrix = [
  [1, 49, 13, 61, 4, 52, 16, 64],
  [33, 17, 45, 29, 36, 20, 48, 32],
  [9, 57, 5, 53, 12, 60, 8, 56],
  [41, 25, 37, 21, 44, 28, 40, 24],
  [3, 51, 15, 63, 2, 50, 14, 62],
  [35, 19, 47, 31, 34, 18, 46, 30],
  [11, 59, 7, 55, 10, 58, 6, 54],
  [43, 27, 39, 23, 42, 26, 38, 22],
];

/**
 * A simple wrapper to make the dithering easier.
 */
export const withDithering = (
  {
    target,
    color = { r: 0, g: 0, b: 0 },
    width,
    height,
    scale = 8,
    method = methods.FLOYD_STEINBERG,
  },
  fn
) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  fn({ canvas, ctx });

  const dithered = dither(ctx, color, 0.5, scale, method);

  ctx.putImageData(dithered, 0, 0);

  target.drawImage(canvas, 0, 0);
};

/**
 * Floyd Steinberg dithering. Takes in a 2D drawing context
 * and returns dithered image data.
 *
 * Expects a black and white image in and returns a black
 * and white dithered image out.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Color} [color={ r: 0, g: 0, b: 0 }]
 * @param {number} [threshold=0.5]
 * @param {number} [method=methods.FLOYD_STEINBERG]
 * @returns {ImageData}
 */
export const dither = (
  ctx,
  color = { r: 0, g: 0, b: 0 },
  threshold = 0.5,
  scale = 8,
  method = methods.FLOYD_STEINBERG
) => {
  const { canvas } = ctx;
  const inWidth = canvas.width;
  const inHeight = canvas.height;

  const width = Math.round(inWidth / scale);
  const height = Math.round(inHeight / scale);

  const referenceCanvas = document.createElement('canvas');
  referenceCanvas.width = width;
  referenceCanvas.height = height;
  const referenceCtx = referenceCanvas.getContext('2d');
  referenceCtx.drawImage(canvas, 0, 0, width, height);

  const imageData = referenceCtx.getImageData(0, 0, width, height);
  const source = imageData.data;

  const wrapOffset = (x, y) => {
    const offset = (y * width + x) * 4;

    return offset % source.length;
  };

  const getPixel = (x, y) => {
    const offset = wrapOffset(x, y);
    const [r, g, b] = source.slice(offset, offset + 3);

    //return r * 0.299 + g * 0.587 + b * 0.11;
    return (r + g + b) / 3;
  };

  const setPixel = (x, y, v) => {
    const offset = (y * width + x) * 4;

    source[offset] = v;
    source[offset + 1] = v;
    source[offset + 2] = v;
    source[offset + 3] = 255;
  };

  for (let y = 0; y <= height; y++) {
    for (let x = 0; x <= width; x++) {
      const oldPixel = getPixel(x, y);
      const newPixel = oldPixel > 255 * threshold ? 255 : 0;
      setPixel(x, y, newPixel);

      if (method === methods.FLOYD_STEINBERG) {
        const err = Math.floor((oldPixel - newPixel) / 16);
        setPixel(x + 1, y, getPixel(x + 1, y) + err * 7);
        setPixel(x - 1, y + 1, getPixel(x - 1, y + 1) + err * 3);
        setPixel(x, y + 1, getPixel(x, y + 1) + err * 5);
        setPixel(x + 1, y + 1, getPixel(x + 1, y + 1) + err * 1);
      }

      if (method === methods.JARVIS) {
        const err = Math.floor((oldPixel - newPixel) / 48);
        setPixel(x + 1, y, getPixel(x + 1, y) + err * 7);
        setPixel(x + 2, y, getPixel(x + 2, y) + err * 5);
        setPixel(x - 2, y + 1, getPixel(x - 2, y + 1) + err * 3);
        setPixel(x - 1, y + 1, getPixel(x - 1, y + 1) + err * 5);
        setPixel(x, y + 1, getPixel(x, y + 1) + err * 7);
        setPixel(x + 1, y + 1, getPixel(x + 1, y + 1) + err * 5);
        setPixel(x + 2, y + 1, getPixel(x + 2, y + 1) + err * 3);
        setPixel(x - 2, y + 2, getPixel(x - 2, y + 2) + err * 1);
        setPixel(x - 1, y + 2, getPixel(x - 1, y + 2) + err * 3);
        setPixel(x, y + 2, getPixel(x, y + 2) + err * 5);
        setPixel(x + 1, y + 2, getPixel(x + 1, y + 2) + err * 3);
        setPixel(x + 2, y + 2, getPixel(x + 2, y + 2) + err * 1);
      }

      if (method === methods.ATKINSON) {
        const err = Math.floor((oldPixel - newPixel) / 8);
        setPixel(x + 1, y, getPixel(x + 1, y) + err);
        setPixel(x + 2, y, getPixel(x + 2, y) + err);
        setPixel(x - 1, y + 1, getPixel(x - 1, y + 1) + err);
        setPixel(x, y + 1, getPixel(x, y + 1) + err);
        setPixel(x + 1, y + 1, getPixel(x + 1, y + 1) + err);
        setPixel(x, y + 2, getPixel(x, y + 2) + err);
      }

      if (method === methods.ORDERED) {
        const ditherValue = (oldPixel / 255) * 65;

        if (ditherValue > ditherMatrix[x % 8][y % 8]) {
          for (let i = 0; i < 1; i++) {
            for (let j = 0; j < 1; j++) {
              setPixel(x + i, y + j, 255);
            }
          }
        } else {
          for (let i = 0; i < 1; i++) {
            for (let j = 0; j < 1; j++) {
              setPixel(x + i, y + j, 0);
            }
          }
        }
      }
    }
  }

  for (let i = 0; i < source.length; i += 4) {
    if (source[i] === 255 && source[i + 1] === 255 && source[i + 2] === 255) {
      source[i + 3] = 0;
    }
    if (source[i] === 0 && source[i + 1] === 0 && source[i + 2] === 0) {
      source[i] = color.r;
      source[i + 1] = color.g;
      source[i + 2] = color.b;
    }
  }

  // Scale up
  const scaledUp = new Uint8ClampedArray(inWidth * inHeight * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;

      for (let yScale = 0; yScale < scale; yScale++) {
        for (let xScale = 0; xScale < scale; xScale++) {
          const scaledOffset =
            ((y * scale + yScale) * inWidth + (x * scale + xScale)) * 4;

          scaledUp[scaledOffset] = source[offset];
          scaledUp[scaledOffset + 1] = source[offset + 1];
          scaledUp[scaledOffset + 2] = source[offset + 2];
          scaledUp[scaledOffset + 3] = source[offset + 3];
        }
      }
    }
  }

  return new ImageData(scaledUp, inWidth, inHeight);
};
