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
const EASING = 'easeInOutCubic';

let EVEN = 2;

// CONSTANTS
const ROWS = 15;
const COLS = 9;

const EQUAL_COLS = Array.from({ length: COLS }).map(always(1));
const PUSHED_COLS = Array.from({ length: COLS }).map((_, idx) =>
  Math.pow(Math.sin((idx * Math.PI) / (COLS - 1) + Math.PI) + 1, 1.125)
);
const PUSHED_COLS_2 = Array.from({ length: COLS }).map((_, idx) =>
  Math.pow(Math.sin((idx * Math.PI) / (COLS - 1) + Math.PI) + 1, 8)
);

const EQUAL_ROWS = Array.from({ length: ROWS }).map(always(1));
const PUSHED_ROWS = Array.from({ length: ROWS }).map((_, idx) =>
  Math.pow(Math.sin((idx * Math.PI) / ROWS), 1.125)
);
const PUSHED_ROWS_2 = Array.from({ length: ROWS }).map((_, idx) =>
  Math.pow(Math.sin((idx * Math.PI) / ROWS), 12)
);

// SCENES
const makeIntro = ({ fg = 'black', bg = 'white' } = {}) => ({
  duration: len(10),
  scene: ({ ctx, width, height }) => {
    const colW = width / COLS;
    const rowH = height / ROWS;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    let idx = 0;

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const isEven = (x + y) % EVEN === 0;
        if (isEven) {
          const w = colW;

          ctx.fillStyle = fg;
          const xPos = colW * x;
          const yPos = rowH * y;
          ctx.fillRect(xPos, yPos, w, rowH);

          idx++;
        }
      }
    }
  }
});

// GLOBAL STATES, AS RULES DO NOT APPLY HERE
let rowLut = normalizeNumberArray(EQUAL_ROWS);
let colLut = normalizeNumberArray(EQUAL_COLS);
const DEFAULT_THEME = { bg: '#FFE0DB', fg: '#0101D2' };
let THEME = DEFAULT_THEME;
const THEME_2 = { bg: '#36033A', fg: '#01D25A' };
const THEME_3 = THEME;
const THEME_4 = THEME_2;

const makeOutro = ({
  fg = 'black',
  bg = 'white',
  fromRows = EQUAL_ROWS,
  toRows = EQUAL_ROWS,
  fromCols = EQUAL_COLS,
  toCols = EQUAL_COLS,
  toTheme = null
} = {}) => {
  const rowTransition = transition({
    from: normalizeNumberArray(fromRows),
    to: normalizeNumberArray(toRows),
    delay: 0.25,
    duration: 0.5,
    easing: EASING
  });

  const colTransition = transition({
    from: normalizeNumberArray(fromCols),
    to: normalizeNumberArray(toCols),
    delay: 0.25,
    duration: 0.5,
    easing: EASING
  });

  return {
    duration: len(5),
    scene: ({ ctx, width, height, playhead }) => {
      const colW = width / COLS;
      const rowH = height / ROWS;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      rowLut = rowTransition(playhead);
      colLut = colTransition(playhead);

      let idx = 0;

      if (toTheme && playhead > 0.5) {
        THEME = toTheme;
      }

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const isEven = (x + y) % EVEN === 0;
          if (isEven) {
            ctx.fillStyle = fg;
            const xPos = colW * x;
            const yPos = rowH * y;
            ctx.fillRect(xPos, yPos, colW, rowH);

            idx++;
          }
        }
      }
    }
  };
};

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
        delay: off * 0.05,
        duration: 0.75,
        easing: EASING
      });
      for (let x = 0; x < COLS - 2 * off - 2; x++) {
        const isEven = (x + 2 * off) % EVEN === 0;

        if (isEven) {
          ctx.fillStyle = fg;
          ctx.fillRect(
            xOff(playhead) + x * colW + off * colW,
            off * rowH,
            colW,
            rowH
          );
        }
      }
    };

    const col = (off = 0) => {
      const yOff = transition({
        from: 0,
        to: rowH * 2,
        delay: 0.15 + off * 0.025,
        duration: 0.75,
        easing: EASING
      });
      for (let y = 0; y < ROWS - 2 * off - 1; y++) {
        const isEven = (y + 2 * off) % EVEN === 0;

        if (isEven) {
          ctx.fillStyle = fg;
          ctx.fillRect(
            (COLS - off - 1) * colW,
            off * rowH + y * rowH + yOff(playhead),
            colW,
            rowH
          );
        }
      }
    };

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(sign, 1);
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

        if (isEven) {
          ctx.fillStyle = fg;
          const xPos = colW * x;
          const yPos = rowH * y;
          ctx.fillRect(xPos, yPos, colW, rowH);
        }
      }
    }

    ctx.restore();
  }
});

const makeMoveRows = (sign = 1, { fg = 'black', bg = 'white' } = {}) => ({
  duration: len(17),
  scene: ({ ctx, playhead, width, height }) => {
    const rowH = height / ROWS;
    const colW = width / COLS;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < ROWS; y++) {
      const isEvenRow = y % 2 === 0;

      const x = transition({
        from: 0,
        to: colW * sign * 2,
        delay: y * 0.025,
        duration: 0.95,
        easing: EASING
      });

      const xOff = x(playhead);

      for (let x = -4; x < COLS + 4; x++) {
        const isEven = (x + y) % EVEN === 0;

        if (isEven) {
          ctx.fillStyle = fg;
          const xPos = colW * x + (isEvenRow ? -1 * xOff : xOff);
          const yPos = rowH * y;

          ctx.fillRect(xPos, yPos, colW, rowH);
        }
      }
    }
  }
});

const makeMoveCols = (sign = 1, { fg = 'black', bg = 'white' } = {}) => ({
  duration: len(17),
  scene: ({ ctx, playhead, width, height }) => {
    const rowH = height / ROWS;
    const colW = width / COLS;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (let x = 0; x < COLS; x++) {
      const isEvenCol = x % 2 === 0;
      const y = transition({
        from: 0,
        to: rowH * 2 * sign,
        duration: 0.95,
        delay: x * 0.03,
        easing: EASING
      });

      const yOff = y(playhead);

      for (let y = -4; y < ROWS + 4; y++) {
        const isEven = (x + y) % EVEN === 0;

        if (isEven) {
          ctx.fillStyle = fg;
          const xPos = colW * x;
          const yPos = rowH * y + (isEvenCol ? -1 * yOff : yOff);

          ctx.fillRect(xPos, yPos, colW, rowH);
        }
      }
    }
  }
});

// SKETCHS
const sketch = () => {
  return ({ context, width, height, frame, playhead }) => {
    if (playhead < 0.05) {
      THEME = DEFAULT_THEME;
      rowLut = normalizeNumberArray(EQUAL_ROWS);
      colLut = normalizeNumberArray(EQUAL_COLS);
    }

    renderScene(
      [
        makeMove(1, 4, THEME),
        makeMoveCols(-1, THEME),
        //makeMoveRows(-1, THEME),
        makeOutro({
          ...THEME,
          fromRows: EQUAL_ROWS,
          toRows: PUSHED_ROWS,
          toTheme: THEME_2
        }),
        makeIntro(THEME),
        makeMoveCols(-1, THEME),
        makeMoveRows(1, THEME),
        //makeMoveRows(-1, THEME),
        makeOutro({
          ...THEME,
          fromRows: PUSHED_ROWS,
          toRows: EQUAL_ROWS,
          fromCols: EQUAL_COLS,
          toCols: PUSHED_COLS,
          toTheme: DEFAULT_THEME
        }),
        makeIntro(THEME),
        makeMove(1, 4, THEME),
        makeMoveCols(1, THEME),
        //makeMoveRows(1, THEME),
        makeOutro({
          ...THEME,
          fromRows: EQUAL_ROWS,
          toRows: PUSHED_ROWS_2,
          fromCols: PUSHED_COLS,
          toCols: PUSHED_COLS_2,
          toTheme: THEME_2
        }),
        makeIntro(THEME),
        makeMove(-1, 4, THEME),
        makeMoveRows(1, THEME),
        makeOutro({
          ...THEME,
          fromRows: PUSHED_ROWS_2,
          toRows: EQUAL_ROWS,
          fromCols: PUSHED_COLS_2,
          toCols: EQUAL_COLS,
          toTheme: DEFAULT_THEME
        }),
        makeIntro(THEME)
      ],
      {
        ctx: context,
        frame,
        width,
        height
      }
    );

    const colW = width / COLS;
    const rowH = height / ROWS;

    const cells = [];

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        cells.push(context.getImageData(x * colW, y * rowH, colW, rowH));
      }
    }

    let xOff = 0;
    let yOff = 0;

    for (let y = 0; y < ROWS; y++) {
      const newH = rowLut[y] * height;

      for (let x = 0; x < COLS; x++) {
        const idx = y * COLS + x;

        const c = document.createElement('canvas');
        c.width = colW;
        c.height = rowH;

        const newW = colLut[x] * width;
        const newCtx = c.getContext('2d');
        newCtx.putImageData(cells[idx], 0, 0);

        context.drawImage(c, xOff, yOff, newW, newH);

        if (DEBUG) {
          context.strokeStyle = 'green';
          context.lineWidth = 2;
          context.strokeRect(x * colW, y * rowH, colW, rowH);

          context.strokeStyle = 'red';
          context.lineWidth = 2;
          context.strokeRect(xOff, yOff, newW, newH);
        }

        xOff += newW;
      }

      yOff += newH;
      xOff = 0;
    }
  };
};

canvasSketch(sketch, settings);
