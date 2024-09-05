const canvasSketch = require('canvas-sketch');
const { transition, sequentialTransition } = require('./lib/transition.js');

const FPS = 25;
const DEBUG = false;
const DURATION_IN_SECONDS = 10;
const MAX_FRAMES = DURATION_IN_SECONDS * FPS;

const settings = {
  animate: true,
  dimensions: [1080, 1920],
  fps: FPS,
  duration: DURATION_IN_SECONDS
};

const len = (at25) => (at25 / 25) * FPS;

// UTILS
const always = (x) => () => x;
const normalizeNumberArray = (arr) => {
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return arr.map((val) => val / sum);
};

const renderScene = (_scenes, { frame, ctx, width, height }) => {
  // Find the current scene
  let frameOff = 0;
  let currentScene = null;

  const scenes = _scenes.map((s) => ({
    ...s,
    duration: MAX_FRAMES / _scenes.length
  }));

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    if (frame >= frameOff && frame - frameOff < scene.duration) {
      currentScene = scene;
      break;
    }

    frameOff += scene.duration;
  }

  if (currentScene) {
    const thisFrame = frame - frameOff;

    currentScene.scene({
      ctx,
      frame: thisFrame,
      playhead: thisFrame / currentScene.duration,
      width,
      height
    });
  }
};

// COLORS
const EASING = 'easeInOutExpo';

let EVEN = 2;

// CONSTANTS
const ROWS = 37;
const COLS = 21;
const GUTTER = 0.025;
const RADIUS = 15;

// SCENES
// GLOBAL STATES, AS RULES DO NOT APPLY HERE
const THEME = { fg: '#3A019B', bg: '#FEBE00' };

const makeMove = (sign, count = 4, { fg = 'black', bg = 'white' } = {}) => ({
  duration: len(17),
  scene: ({ ctx, width, height, playhead }) => {
    const colW = width / COLS;
    const rowH = height / ROWS;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const row = (off = 0) => {
      const xOff = transition({
        from: 0,
        to: colW * 2,
        delay: off * 0.06,
        duration: 0.65,
        easing: EASING
      });
      for (let x = 0; x < COLS - 2 * off - 2; x++) {
        const isEven = (x + 2 * off) % EVEN === 0;

        const xPos =
          xOff(playhead) + x * colW + off * colW + colW * GUTTER * 0.5;
        const yPos = off * rowH + rowH * GUTTER * 0.5;

        if (isEven) {
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.rect(xPos, yPos, colW * (1 - GUTTER), rowH * (1 - GUTTER));
          ctx.fill();
        }
      }
    };

    const col = (off = 0) => {
      const yOff = transition({
        from: 0,
        to: rowH * 2,
        delay: 0.15 + off * 0.025,
        duration: 0.65,
        easing: EASING
      });
      for (let y = 0; y < ROWS - 2 * off - 1; y++) {
        const isEven = (y + 2 * off) % EVEN === 0;

        const xPos = (COLS - off - 1) * colW + colW * GUTTER * 0.5;
        const yPos =
          off * rowH + y * rowH + yOff(playhead) + rowH * GUTTER * 0.5;

        if (isEven) {
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.rect(
            xPos,
            yPos,
            colW * (1 - GUTTER),
            rowH * (1 - GUTTER),
            RADIUS
          );
          ctx.fill();
        }
      }
    };

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(sign * 1.001, 1.001);
    ctx.translate(width / -2, height / -2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    Array.from({ length: count })
      .map((_, i) => i)
      .map((_, idx) => idx)
      .forEach((off) => {
        row(off);
        col(off);

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((180 * Math.PI) / 180);
        ctx.translate(width / -2, height / -2);
        row(off);
        col(off);
        ctx.restore();
      });

    for (let y = count; y < ROWS - count; y++) {
      for (let x = count; x < COLS - count; x++) {
        const isEven = (x + y) % EVEN === 0;

        const xPos = colW * x + colW * GUTTER * 0.5;
        const yPos = rowH * y + rowH * GUTTER * 0.5;

        if (isEven) {
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.rect(xPos, yPos, colW * (1 - GUTTER), rowH * (1 - GUTTER));
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }
});

// SKETCHS
const sketch = () => {
  return ({ context, width, height, frame }) => {
    renderScene(
      [
        makeMove(1, 1, THEME),
        makeMove(1, 2, THEME),
        makeMove(1, 3, THEME),
        makeMove(1, 4, THEME),
        makeMove(1, 5, THEME),
        makeMove(1, 6, THEME),
        makeMove(1, 7, THEME),
        makeMove(1, 8, THEME),
        makeMove(1, 9, THEME),
        makeMove(1, 10, THEME)
      ],
      {
        ctx: context,
        frame,
        width,
        height
      }
    );
  };
};

canvasSketch(sketch, settings);
