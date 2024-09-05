const canvasSketch = require('canvas-sketch');
const { ellipse } = require('./lib/vector.js');

const settings = {
  animate: true,
  dimensions: [1080, 1920],
  duration: 10,
  fps: 25
};

const FG = '#FC3E16';
const BG = '#E0D9FF';

const COLS = 2;
const ROWS = 2;

const sketch = () => {
  const normalize = (input) => {
    const sum = input.reduce((a, b) => a + b, 0);
    return input.map((n) => n / sum);
  };

  const unit = ({ w, h, x, y, ctx, playhead, vertical = false, sign = 1 }) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const t =
      sign *
      (0.5 + Math.cos(Math.PI + ((playhead * Math.PI * 8) % Math.PI)) * 0.5);

    ctx.fillStyle = BG;
    ctx.fillRect(x, y, w, h);
    for (let i = -2; i < 4; i++) {
      ellipse({
        cx: vertical ? x + w / 2 : x + i * w + t * t * t * w,
        cy: vertical ? y + i * h + t * t * t * h : y + h / 2,
        rx: w / 2,
        ry: h / 2,
        ctx
      }).renderToCanvas(ctx);
      ctx.fillStyle = FG;
      ctx.fill();
    }

    ctx.restore();
  };

  return ({ context: ctx, width, height, playhead }) => {
    const cols = normalize(
      Array.from({ length: COLS }).map((_, idx) => {
        let t = 0.5 + Math.sin(playhead * Math.PI * 4 + idx) * 0.275;
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
      })
    );

    const rows = normalize(
      Array.from({ length: ROWS }).map((_, idx) => {
        let t = 0.5 + Math.sin(Math.PI + playhead * Math.PI * 4 + idx) * 0.275;
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
      })
    );

    let xOff = 0;
    let yOff = 0;

    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        unit({
          w: cols[x] * width,
          h: rows[y] * height,
          x: xOff,
          y: yOff,
          ctx,
          playhead,
          vertical: (x + y) % 2 === 1,
          sign: x % 2 === 1 ? -1 : 1
        });
        yOff += rows[y] * height;
      }
      yOff = 0;
      xOff += cols[x] * width;
    }
  };
};

canvasSketch(sketch, settings);
