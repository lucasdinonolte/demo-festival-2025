const canvasSketch = require('canvas-sketch');
const seedrandom = require('seedrandom');
const { transition } = require('./lib/transition.js');

const settings = {
  animate: true,
  dimensions: [1080, 1920],
  duration: 10,
  fps: 25
};

const COLS = 11;
const ROWS = 19;
const SEED = 'Wim';
const COLORS = ['#FEB6C1', '#F5F722'];
const BACKGROUND = '#00B0EA';
const SCALAR = 1;

const sketch = () => {
  return ({ context: ctx, width, height, playhead, frame }) => {
    const t = 0.5 + Math.cos(playhead * 8 * Math.PI) * 0.5;

    const rng = seedrandom(SEED);

    const rect = (x, y, w, h) => {
      const wPerStrip = w / COLORS.length;

      COLORS.forEach((color, idx) => {
        ctx.fillStyle = color;
        ctx.fillRect(
          x + idx * wPerStrip - 2,
          y - 2,
          (wPerStrip + 4) * SCALAR,
          (h + 4) * SCALAR
        );
      });
    };

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    const w = width / COLS;
    const h = height / ROWS;

    const dim = Math.max(w, h);

    let idx = 0;

    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        const x = i * dim + dim / 2;
        const y = j * dim + dim / 2;

        const sign = rng() > 0.5 ? 1 : -1;
        const initial = (Math.floor(rng() * 5) * Math.PI) / 2;

        const rotate = transition({
          from: initial,
          to: initial + (sign * Math.PI) / 2,
          duration: 32,
          delay: rng() * 180,
          iterationCount: 2,
          direction: 'alternate',
          easing: 'easeInOutExpo'
        });

        ctx.save();
        ctx.translate(x - dim / 6, y);
        ctx.rotate(rotate(frame));
        rect(-dim / 2, -dim / 2, dim, dim);
        ctx.restore();

        idx++;
      }
    }
  };
};

canvasSketch(sketch, settings);
