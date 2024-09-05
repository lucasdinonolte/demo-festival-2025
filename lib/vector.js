'use strict';

const moveTo = (x, y) => ({
  command: 'moveTo',
  x,
  y
});
const lineTo = (x, y) => ({
  command: 'lineTo',
  x,
  y
});
const curveTo = (x1, y1, x2, y2, x3, y3) => ({
  command: 'curveTo',
  x1,
  y1,
  x2,
  y2,
  x3,
  y3
});
const close = () => ({
  command: 'close'
});

const createAnchor = (point, handleIn = null, handleOut = null) => ({
  type: 'anchor',
  point,
  handleIn,
  handleOut,
  hasHandles() {
    return this.handleIn !== null || this.handleOut !== null;
  },
  removeHandles() {
    return createAnchor(this.point, null, null);
  }
});

const T_VALUES = [
  -0.0640568928626056260850430826247450385909,
  0.0640568928626056260850430826247450385909,
  -0.1911188674736163091586398207570696318404,
  0.1911188674736163091586398207570696318404,
  -0.3150426796961633743867932913198102407864,
  0.3150426796961633743867932913198102407864,
  -0.4337935076260451384870842319133497124524,
  0.4337935076260451384870842319133497124524,
  -0.5454214713888395356583756172183723700107,
  0.5454214713888395356583756172183723700107,
  -0.6480936519369755692524957869107476266696,
  0.6480936519369755692524957869107476266696,
  -0.7401241915785543642438281030999784255232,
  0.7401241915785543642438281030999784255232,
  -0.8200019859739029219539498726697452080761,
  0.8200019859739029219539498726697452080761,
  -0.8864155270044010342131543419821967550873,
  0.8864155270044010342131543419821967550873,
  -0.9382745520027327585236490017087214496548,
  0.9382745520027327585236490017087214496548,
  -0.9747285559713094981983919930081690617411,
  0.9747285559713094981983919930081690617411,
  -0.9951872199970213601799974097007368118745,
  0.9951872199970213601799974097007368118745
];
const C_VALUES = [
  0.1279381953467521569740561652246953718517,
  0.1279381953467521569740561652246953718517,
  0.1258374563468282961213753825111836887264,
  0.1258374563468282961213753825111836887264,
  0.121670472927803391204463153476262425607,
  0.121670472927803391204463153476262425607,
  0.1155056680537256013533444839067835598622,
  0.1155056680537256013533444839067835598622,
  0.1074442701159656347825773424466062227946,
  0.1074442701159656347825773424466062227946,
  0.0976186521041138882698806644642471544279,
  0.0976186521041138882698806644642471544279,
  0.086190161531953275917185202983742667185,
  0.086190161531953275917185202983742667185,
  0.0733464814110803057340336152531165181193,
  0.0733464814110803057340336152531165181193,
  0.0592985849154367807463677585001085845412,
  0.0592985849154367807463677585001085845412,
  0.0442774388174198061686027482113382288593,
  0.0442774388174198061686027482113382288593,
  0.0285313886289336631813078159518782864491,
  0.0285313886289336631813078159518782864491,
  0.0123412297999871995468056670700372915759,
  0.0123412297999871995468056670700372915759
];
const KAPPA = 0.5522847498;

const radiansToDegrees = (radians) => (radians * 180) / Math.PI;
const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;

const createPoint = (x, y) => ({
  type: 'point',
  x,
  y,
  add({ x, y }) {
    return createPoint(this.x + x, this.y + y);
  },
  subtract({ x, y }) {
    return createPoint(this.x - x, this.y - y);
  },
  multiply(scalar) {
    return createPoint(this.x * scalar, this.y * scalar);
  },
  dot({ x, y }) {
    return this.x * x + this.y * y;
  },
  divide(scalar) {
    return createPoint(this.x / scalar, this.y / scalar);
  },
  distance({ x, y }) {
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  },
  length() {
    const lenSq = this.x * this.x + this.y * this.y;
    return Math.sqrt(lenSq);
  },
  normalize() {
    const len = this.length();
    return this.divide(len);
  },
  limit(max) {
    const lenSq = this.x * this.x + this.y * this.y;
    if (lenSq > max * max) {
      return this.divide(Math.sqrt(lenSq)).multiply(max);
    }
    return this.copy();
  },
  rotation() {
    return radiansToDegrees(Math.atan2(this.y, this.x));
  },
  angle(point) {
    const div = this.length() * point.length();
    const a = this.dot(point) / div;
    return radiansToDegrees(Math.acos(a < -1 ? -1 : a > 1 ? 1 : a));
  },
  rotate(_angle = 0) {
    const angle = degreesToRadians(_angle);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.y * sin - this.y * cos;
    return createPoint(x, y);
  },
  isZero() {
    return this.x === 0 && this.y === 0;
  },
  copy() {
    return createPoint(this.x, this.y);
  },
  toString() {
    return `(${this.x}, ${this.y})`;
  }
});

const deriveCurve = (points) => {
  const res = [];
  for (let p = points, d = p.length, c = d - 1; d > 1; d--, c--) {
    const list = [];
    for (let j = 0, dpt; j < c; j++) {
      const p1 = p[j];
      const p2 = p[j + 1];
      if (p1 == null || p2 == null) continue;
      dpt = {
        x: c * (p2.x - p1.x),
        y: c * (p2.y - p1.y)
      };
      list.push(createPoint(dpt.x, dpt.y));
    }
    res.push(list);
    p = list;
  }
  return res;
};
const computePointOnCurve = (t, points) => {
  if (t === 0) return points[0];
  const degree = points.length - 1;
  if (t === 1) return points[degree];
  if (degree === 0) return points[0];
  const mt = 1 - t;
  let x,
    y = 0;
  if (degree === 1) {
    x = mt * points[0].x + t * points[1].x;
    y = mt * points[0].y + t * points[1].y;
    return createPoint(x, y);
  }
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = mt2 * mt;
  const b = mt2 * t * 3;
  const c = mt * t2 * 3;
  const d = t * t2;
  x = a * points[0].x + b * points[1].x + c * points[2].x + d * points[3].x;
  y = a * points[0].y + b * points[1].y + c * points[2].y + d * points[3].y;
  return createPoint(x, y);
};
const computeCurvature = (t, derivedPoints) => {
  const d1 = derivedPoints[0],
    d2 = derivedPoints[1],
    d = computePointOnCurve(t, d1),
    dd = computePointOnCurve(t, d2),
    qdsum = d.x * d.x + d.y * d.y,
    num = d.x + dd.y - d.y * dd.x,
    dnm = Math.pow(qdsum, 3 / 2);
  if (num === 0 || dnm === 0) return { curvature: 0, radius: 0 };
  return {
    curvature: num / dnm,
    radius: dnm / num
  };
};
const alignCurve = (points, p1, p2) => {
  const tx = p1.x,
    ty = p1.y,
    a = -Math.atan2(p2.y - ty, p2.x - tx),
    d = (v) => {
      const x = (v.x - tx) * Math.cos(a) - (v.y - ty) * Math.sin(a),
        y = (v.x - tx) * Math.sin(a) + (v.y - ty) * Math.cos(a);
      return createPoint(x, y);
    };
  return points.map(d);
};
const createCurve = (anchor1, anchor2) => {
  const points = [
    anchor1.point,
    anchor1.handleOut ?? anchor1.point,
    anchor2.handleIn ?? anchor2.point,
    anchor2.point
  ];
  const derivedPoints = deriveCurve(points);
  return {
    type: 'curve',
    points,
    degree: 3,
    isLinear() {
      const a = alignCurve(
        this.points,
        this.points[0],
        this.points[this.degree]
      );
      for (let i = 0; i < a.length; i++) {
        if (Math.abs(a[i]?.y ?? 0) > 0.0001) {
          return false;
        }
      }
      return true;
    },
    derivative(t) {
      const mt = 1 - t,
        a = mt * mt,
        b = mt * t * 2,
        c = t * t,
        p = derivedPoints[0],
        x = a * p[0].x + b * p[1].x + c * p[2].x,
        y = a * p[0].y + b * p[1].y + c * p[2].y;
      return createPoint(x, y);
    },
    arcfn(t) {
      const d = this.derivative(t);
      const l = d.x * d.x + d.y * d.y;
      return Math.sqrt(l);
    },
    getPointAt(t) {
      return computePointOnCurve(t, this.points);
    },
    getTangentAt(t) {
      return this.derivative(t).normalize();
    },
    getNormalAt(t) {
      const d = this.getTangentAt(t),
        x = -d.y,
        y = d.x;
      return createPoint(x, y);
    },
    getCurvatureAt(t) {
      const kr = computeCurvature(t, derivedPoints);
      return kr.curvature;
    },
    getRadiusAt(t) {
      const kr = computeCurvature(t, derivedPoints);
      return kr.radius;
    },
    length() {
      const z = 0.5;
      let sum = 0,
        t = 0;
      for (let i = 0; i < T_VALUES.length; i++) {
        t = z * T_VALUES[i] + z;
        sum += C_VALUES[i] * this.arcfn(t);
      }
      return z * sum;
    },
    clearHandles() {
      return createCurve(anchor1.removeHandles(), anchor2.removeHandles());
    }
  };
};

function absolutize(segments) {
  let cx = 0,
    cy = 0;
  let subx = 0,
    suby = 0;
  const out = [];
  for (const { key, data } of segments) {
    switch (key) {
      case 'M':
        out.push({ key: 'M', data: [...data] });
        [cx, cy] = data;
        [subx, suby] = data;
        break;
      case 'm':
        cx += data[0];
        cy += data[1];
        out.push({ key: 'M', data: [cx, cy] });
        subx = cx;
        suby = cy;
        break;
      case 'L':
        out.push({ key: 'L', data: [...data] });
        [cx, cy] = data;
        break;
      case 'l':
        cx += data[0];
        cy += data[1];
        out.push({ key: 'L', data: [cx, cy] });
        break;
      case 'C':
        out.push({ key: 'C', data: [...data] });
        cx = data[4];
        cy = data[5];
        break;
      case 'c': {
        const newdata = data.map((d, i) => (i % 2 ? d + cy : d + cx));
        out.push({ key: 'C', data: newdata });
        cx = newdata[4];
        cy = newdata[5];
        break;
      }
      case 'Q':
        out.push({ key: 'Q', data: [...data] });
        cx = data[2];
        cy = data[3];
        break;
      case 'q': {
        const newdata = data.map((d, i) => (i % 2 ? d + cy : d + cx));
        out.push({ key: 'Q', data: newdata });
        cx = newdata[2];
        cy = newdata[3];
        break;
      }
      case 'A':
        out.push({ key: 'A', data: [...data] });
        cx = data[5];
        cy = data[6];
        break;
      case 'a':
        cx += data[5];
        cy += data[6];
        out.push({
          key: 'A',
          data: [data[0], data[1], data[2], data[3], data[4], cx, cy]
        });
        break;
      case 'H':
        out.push({ key: 'H', data: [...data] });
        cx = data[0];
        break;
      case 'h':
        cx += data[0];
        out.push({ key: 'H', data: [cx] });
        break;
      case 'V':
        out.push({ key: 'V', data: [...data] });
        cy = data[0];
        break;
      case 'v':
        cy += data[0];
        out.push({ key: 'V', data: [cy] });
        break;
      case 'S':
        out.push({ key: 'S', data: [...data] });
        cx = data[2];
        cy = data[3];
        break;
      case 's': {
        const newdata = data.map((d, i) => (i % 2 ? d + cy : d + cx));
        out.push({ key: 'S', data: newdata });
        cx = newdata[2];
        cy = newdata[3];
        break;
      }
      case 'T':
        out.push({ key: 'T', data: [...data] });
        cx = data[0];
        cy = data[1];
        break;
      case 't':
        cx += data[0];
        cy += data[1];
        out.push({ key: 'T', data: [cx, cy] });
        break;
      case 'Z':
      case 'z':
        out.push({ key: 'Z', data: [] });
        cx = subx;
        cy = suby;
        break;
    }
  }
  return out;
}
function normalize(segments) {
  const out = [];
  let lastType = '';
  let cx = 0,
    cy = 0;
  let subx = 0,
    suby = 0;
  let lcx = 0,
    lcy = 0;
  for (const { key, data } of segments) {
    switch (key) {
      case 'M':
        out.push({ key: 'M', data: [...data] });
        [cx, cy] = data;
        [subx, suby] = data;
        break;
      case 'C':
        out.push({ key: 'C', data: [...data] });
        cx = data[4];
        cy = data[5];
        lcx = data[2];
        lcy = data[3];
        break;
      case 'L':
        out.push({ key: 'L', data: [...data] });
        [cx, cy] = data;
        break;
      case 'H':
        cx = data[0];
        out.push({ key: 'L', data: [cx, cy] });
        break;
      case 'V':
        cy = data[0];
        out.push({ key: 'L', data: [cx, cy] });
        break;
      case 'S': {
        let cx1 = 0,
          cy1 = 0;
        if (lastType === 'C' || lastType === 'S') {
          cx1 = cx + (cx - lcx);
          cy1 = cy + (cy - lcy);
        } else {
          cx1 = cx;
          cy1 = cy;
        }
        out.push({ key: 'C', data: [cx1, cy1, ...data] });
        lcx = data[0];
        lcy = data[1];
        cx = data[2];
        cy = data[3];
        break;
      }
      case 'T': {
        const [x, y] = data;
        let x1 = 0,
          y1 = 0;
        if (lastType === 'Q' || lastType === 'T') {
          x1 = cx + (cx - lcx);
          y1 = cy + (cy - lcy);
        } else {
          x1 = cx;
          y1 = cy;
        }
        const cx1 = cx + (2 * (x1 - cx)) / 3;
        const cy1 = cy + (2 * (y1 - cy)) / 3;
        const cx2 = x + (2 * (x1 - x)) / 3;
        const cy2 = y + (2 * (y1 - y)) / 3;
        out.push({ key: 'C', data: [cx1, cy1, cx2, cy2, x, y] });
        lcx = x1;
        lcy = y1;
        cx = x;
        cy = y;
        break;
      }
      case 'Q': {
        const [x1, y1, x, y] = data;
        const cx1 = cx + (2 * (x1 - cx)) / 3;
        const cy1 = cy + (2 * (y1 - cy)) / 3;
        const cx2 = x + (2 * (x1 - x)) / 3;
        const cy2 = y + (2 * (y1 - y)) / 3;
        out.push({ key: 'C', data: [cx1, cy1, cx2, cy2, x, y] });
        lcx = x1;
        lcy = y1;
        cx = x;
        cy = y;
        break;
      }
      case 'A': {
        const r1 = Math.abs(data[0]);
        const r2 = Math.abs(data[1]);
        const angle = data[2];
        const largeArcFlag = data[3];
        const sweepFlag = data[4];
        const x = data[5];
        const y = data[6];
        if (r1 === 0 || r2 === 0) {
          out.push({ key: 'C', data: [cx, cy, x, y, x, y] });
          cx = x;
          cy = y;
        } else {
          if (cx !== x || cy !== y) {
            const curves = arcToCubicCurves(
              cx,
              cy,
              x,
              y,
              r1,
              r2,
              angle,
              largeArcFlag,
              sweepFlag
            );
            curves.forEach(function (curve) {
              out.push({ key: 'C', data: curve });
            });
            cx = x;
            cy = y;
          }
        }
        break;
      }
      case 'Z':
        out.push({ key: 'Z', data: [] });
        cx = subx;
        cy = suby;
        break;
    }
    lastType = key;
  }
  return out;
}
function rotate$1(x, y, angleRad) {
  const X = x * Math.cos(angleRad) - y * Math.sin(angleRad);
  const Y = x * Math.sin(angleRad) + y * Math.cos(angleRad);
  return [X, Y];
}
function arcToCubicCurves(
  x1,
  y1,
  x2,
  y2,
  r1,
  r2,
  angle,
  largeArcFlag,
  sweepFlag,
  recursive
) {
  const angleRad = degreesToRadians(angle);
  let params = [];
  let f1 = 0,
    f2 = 0,
    cx = 0,
    cy = 0;
  if (recursive) {
    [f1, f2, cx, cy] = recursive;
  } else {
    [x1, y1] = rotate$1(x1, y1, -angleRad);
    [x2, y2] = rotate$1(x2, y2, -angleRad);
    const x = (x1 - x2) / 2;
    const y = (y1 - y2) / 2;
    let h = (x * x) / (r1 * r1) + (y * y) / (r2 * r2);
    if (h > 1) {
      h = Math.sqrt(h);
      r1 = h * r1;
      r2 = h * r2;
    }
    const sign = largeArcFlag === sweepFlag ? -1 : 1;
    const r1Pow = r1 * r1;
    const r2Pow = r2 * r2;
    const left = r1Pow * r2Pow - r1Pow * y * y - r2Pow * x * x;
    const right = r1Pow * y * y + r2Pow * x * x;
    const k = sign * Math.sqrt(Math.abs(left / right));
    cx = (k * r1 * y) / r2 + (x1 + x2) / 2;
    cy = (k * -r2 * x) / r1 + (y1 + y2) / 2;
    f1 = Math.asin(parseFloat(((y1 - cy) / r2).toFixed(9)));
    f2 = Math.asin(parseFloat(((y2 - cy) / r2).toFixed(9)));
    if (x1 < cx) {
      f1 = Math.PI - f1;
    }
    if (x2 < cx) {
      f2 = Math.PI - f2;
    }
    if (f1 < 0) {
      f1 = Math.PI * 2 + f1;
    }
    if (f2 < 0) {
      f2 = Math.PI * 2 + f2;
    }
    if (sweepFlag && f1 > f2) {
      f1 = f1 - Math.PI * 2;
    }
    if (!sweepFlag && f2 > f1) {
      f2 = f2 - Math.PI * 2;
    }
  }
  let df = f2 - f1;
  if (Math.abs(df) > (Math.PI * 120) / 180) {
    const f2old = f2;
    const x2old = x2;
    const y2old = y2;
    if (sweepFlag && f2 > f1) {
      f2 = f1 + ((Math.PI * 120) / 180) * 1;
    } else {
      f2 = f1 + ((Math.PI * 120) / 180) * -1;
    }
    x2 = cx + r1 * Math.cos(f2);
    y2 = cy + r2 * Math.sin(f2);
    params = arcToCubicCurves(
      x2,
      y2,
      x2old,
      y2old,
      r1,
      r2,
      angle,
      0,
      sweepFlag,
      [f2, f2old, cx, cy]
    );
  }
  df = f2 - f1;
  const c1 = Math.cos(f1);
  const s1 = Math.sin(f1);
  const c2 = Math.cos(f2);
  const s2 = Math.sin(f2);
  const t = Math.tan(df / 4);
  const hx = (4 / 3) * r1 * t;
  const hy = (4 / 3) * r2 * t;
  const m1 = [x1, y1];
  const m2 = [x1 + hx * s1, y1 - hy * c1];
  const m3 = [x2 + hx * s2, y2 - hy * c2];
  const m4 = [x2, y2];
  m2[0] = 2 * m1[0] - m2[0];
  m2[1] = 2 * m1[1] - m2[1];
  if (recursive) {
    return [m2, m3, m4].concat(params);
  } else {
    params = [m2, m3, m4].concat(params);
    const curves = [];
    for (let i = 0; i < params.length; i += 3) {
      const r1 = rotate$1(params[i][0], params[i][1], angleRad);
      const r2 = rotate$1(params[i + 1][0], params[i + 1][1], angleRad);
      const r3 = rotate$1(params[i + 2][0], params[i + 2][1], angleRad);
      curves.push([r1[0], r1[1], r2[0], r2[1], r3[0], r3[1]]);
    }
    return curves;
  }
}
const COMMAND = 0;
const NUMBER = 1;
const EOD = 2;
const PARAMS = {
  A: 7,
  a: 7,
  C: 6,
  c: 6,
  H: 1,
  h: 1,
  L: 2,
  l: 2,
  M: 2,
  m: 2,
  Q: 4,
  q: 4,
  S: 4,
  s: 4,
  T: 2,
  t: 2,
  V: 1,
  v: 1,
  Z: 0,
  z: 0
};
function tokenize(d) {
  const tokens = new Array();
  while (d !== '') {
    if (d.match(/^([ \t\r\n,]+)/)) {
      d = d.substr(RegExp.$1.length);
    } else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
      tokens[tokens.length] = { type: COMMAND, text: RegExp.$1 };
      d = d.substr(RegExp.$1.length);
    } else if (
      d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)
    ) {
      tokens[tokens.length] = {
        type: NUMBER,
        text: `${parseFloat(RegExp.$1)}`
      };
      d = d.substr(RegExp.$1.length);
    } else {
      return [];
    }
  }
  tokens[tokens.length] = { type: EOD, text: '' };
  return tokens;
}
function isType(token, type) {
  return token.type === type;
}
function parsePath(d) {
  const segments = [];
  const tokens = tokenize(d);
  let mode = 'BOD';
  let index = 0;
  let token = tokens[index];
  while (!isType(token, EOD)) {
    let paramsCount = 0;
    const params = [];
    if (mode === 'BOD') {
      if (token.text === 'M' || token.text === 'm') {
        index++;
        paramsCount = PARAMS[token.text];
        mode = token.text;
      } else {
        return parsePath('M0,0' + d);
      }
    } else if (isType(token, NUMBER)) {
      paramsCount = PARAMS[mode];
    } else {
      index++;
      paramsCount = PARAMS[token.text];
      mode = token.text;
    }
    if (index + paramsCount < tokens.length) {
      for (let i = index; i < index + paramsCount; i++) {
        const numbeToken = tokens[i];
        if (isType(numbeToken, NUMBER)) {
          params[params.length] = +numbeToken.text;
        } else {
          throw new Error(
            'Param not a number: ' + mode + ',' + numbeToken.text
          );
        }
      }
      if (typeof PARAMS[mode] === 'number') {
        const segment = { key: mode, data: params };
        segments.push(segment);
        index += paramsCount;
        token = tokens[index];
        if (mode === 'M') mode = 'L';
        if (mode === 'm') mode = 'l';
      } else {
        throw new Error('Bad segment: ' + mode);
      }
    } else {
      throw new Error('Path data ended short');
    }
  }
  return segments;
}
const toCommands = (path) => {
  return path.map(({ key, data }) => {
    switch (key) {
      case 'M': {
        return moveTo(...data);
      }
      case 'L': {
        return lineTo(...data);
      }
      case 'C': {
        return curveTo(...data);
      }
      case 'Z': {
        return close();
      }
      default: {
        throw new Error(`Unknown path command ${key}`);
      }
    }
  });
};

const identityMatrix = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  tx: 0,
  ty: 0
};
const translate = ({ x = 0, y = 0 }) => {
  const matrix = { ...identityMatrix };
  matrix.tx += x * matrix.a + y * matrix.c;
  matrix.ty += x * matrix.b + y * matrix.d;
  return matrix;
};
const scale = ({ sx = 1, sy = 1, origin = { x: 0, y: 0 } }) => {
  const matrix = { ...identityMatrix };
  matrix.tx += origin.x * matrix.a + origin.y * matrix.c;
  matrix.ty += origin.x * matrix.b + origin.y * matrix.d;
  matrix.a *= sx;
  matrix.b *= sx;
  matrix.c *= sy;
  matrix.d *= sy;
  matrix.tx += -1 * origin.x * matrix.a + -1 * origin.y * matrix.c;
  matrix.ty += -1 * origin.x * matrix.b + -1 * origin.y * matrix.d;
  return matrix;
};
const rotate = ({ angle = 0, origin = { x: 0, y: 0 } }) => {
  const matrix = { ...identityMatrix };
  const radians = degreesToRadians(angle);
  const { x, y } = origin;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  const tx = x - x * cos + y * sin;
  const ty = y - x * sin - y * cos;
  const a = matrix.a;
  const b = matrix.b;
  const c = matrix.c;
  const d = matrix.d;
  matrix.a = cos * a + sin * c;
  matrix.b = cos * b + sin * d;
  matrix.c = -sin * a + cos * c;
  matrix.d = -sin * b + cos * d;
  matrix.tx += tx * a + ty * c;
  matrix.ty += tx * b + ty * d;
  return matrix;
};
const appendMatrix = (matrix, transforms) => {
  const a1 = matrix.a;
  const b1 = matrix.b;
  const c1 = matrix.c;
  const d1 = matrix.d;
  const tx1 = matrix.tx;
  const ty1 = matrix.ty;
  const a2 = transforms.a;
  const b2 = transforms.b;
  const c2 = transforms.c;
  const d2 = transforms.d;
  const tx2 = transforms.tx;
  const ty2 = transforms.ty;
  return {
    a: a2 * a1 + c2 * c1,
    b: b2 * a1 + d2 * c1,
    c: a2 * b1 + c2 * d1,
    d: b2 * b1 + d2 * d1,
    tx: tx1 + (tx2 * a1 + ty2 * c1),
    ty: ty1 + (tx2 * b1 + ty2 * d1)
  };
};
const mergeTransforms = (...matrices) => {
  return matrices.reduce((acc, cur) => appendMatrix(acc, cur), identityMatrix);
};
const applyMatrixToCoordinates = (matrix, x, y) => {
  const newX = matrix.a * x + matrix.c * y + matrix.tx;
  const newY = matrix.b * x + matrix.d * y + matrix.ty;
  return {
    x: newX,
    y: newY
  };
};

const computeCurves = (anchors, closed) => {
  const res = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a1 = anchors[i],
      a2 = anchors[i + 1];
    res.push(createCurve(a1, a2));
  }
  if (closed) {
    res.push(createCurve(anchors[anchors.length - 1], anchors[0]));
  }
  return res;
};
const computePathCurvesAndMutate = (path) => {
  let lastIdx = 0;
  const subpaths = [];
  path.commands.forEach((command, i) => {
    if (command.command === 'close') {
      subpaths.push(path.commands.slice(lastIdx, i + 1));
      lastIdx = i + 1;
    }
  });
  const bezierPaths = subpaths.map((commands) => {
    let closed = false;
    const anchors = commands.reduce((acc, command) => {
      let item;
      switch (command.command) {
        case 'moveTo': {
          const point = createPoint(command.x, command.y);
          item = createAnchor(point, null, null);
          return [...acc, item];
        }
        case 'lineTo': {
          const point = createPoint(command.x, command.y);
          item = createAnchor(point, null, null);
          return [...acc, item];
        }
        case 'curveTo': {
          const { x1, y1, x2, y2, x3, y3 } = command;
          const point = createPoint(x3, y3),
            handleOut = createPoint(x1, y1),
            handleIn = createPoint(x2, y2);
          const lastAnchor = acc[acc.length - 1];
          acc[acc.length - 1] = createAnchor(
            lastAnchor.point,
            lastAnchor.handleIn,
            handleOut
          );
          item = createAnchor(point, handleIn, null);
          return [...acc, item];
        }
        case 'close': {
          closed = true;
          return [...acc];
        }
      }
    }, []);
    const curves = computeCurves(anchors, closed);
    return {
      anchors,
      closed,
      curves,
      length: curves.reduce((acc, curve) => acc + curve.length(), 0)
    };
  });
  path.__cache.bezierPaths = bezierPaths;
  path.__cache.length = bezierPaths.reduce((acc, path) => acc + path.length, 0);
  path.__internal.hasComputed = true;
};
const ensurePathIsComputed = (path) => {
  if (!path.__internal.hasComputed) computePathCurvesAndMutate(path);
};
const computeBoundingBoxAndMutate = (path) => {
  ensurePathIsComputed(path);
  const anchors = path.__cache.bezierPaths
    .map((bezier) => bezier.anchors)
    .flat();
  let minX = Infinity,
    minY = Infinity,
    maxX = 0,
    maxY = 0;
  for (let i = 0; i < anchors.length; i++) {
    const p = anchors[i].point;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  path.__internal.hasBoundingBox = true;
  path.__cache.boundingBox = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};
const ensureBoundingBox = (path) => {
  if (!path.__internal.hasBoundingBox) computeBoundingBoxAndMutate(path);
};
const applyTransformationToPath = (matrix, path) => {
  const commands = path.commands
    .map((command) => {
      switch (command.command) {
        case 'moveTo': {
          const { x, y } = applyMatrixToCoordinates(
            matrix,
            command.x,
            command.y
          );
          return moveTo(x, y);
        }
        case 'lineTo': {
          const { x, y } = applyMatrixToCoordinates(
            matrix,
            command.x,
            command.y
          );
          return lineTo(x, y);
        }
        case 'curveTo': {
          const p1 = applyMatrixToCoordinates(matrix, command.x1, command.y1);
          const p2 = applyMatrixToCoordinates(matrix, command.x2, command.y2);
          const p3 = applyMatrixToCoordinates(matrix, command.x3, command.y3);
          return curveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        }
        case 'close': {
          return close();
        }
      }
    })
    .filter(Boolean);
  return createPath(commands);
};
const bezierPathAt = (t, path) => {
  ensurePathIsComputed(path);
  const offset = (path.__cache.length ?? 0) * t;
  const c = path.__cache.bezierPaths;
  let l = 0;
  for (let i = 0; i < c.length; i++) {
    const start = l,
      bezierPath = c[i],
      cl = bezierPath.length;
    l += cl;
    if (l > offset) {
      return {
        bezierPath,
        t: (offset - start) / cl
      };
    }
  }
  return {
    bezierPath: c[c.length - 1],
    t: 1
  };
};
const locationAt = (_t, path) => {
  const { bezierPath, t } = bezierPathAt(_t, path);
  const offset = bezierPath.length * t;
  const c = bezierPath.curves;
  let l = 0;
  for (let i = 0; i < c.length; i++) {
    const start = l,
      curve = c[i],
      cl = curve.length();
    l += cl;
    if (l > offset) {
      return {
        curve,
        location: offset - start,
        t: (offset - start) / cl
      };
    }
  }
  return {
    curve: c[c.length - 1],
    location: c[c.length - 1].length(),
    t: 1
  };
};
const parseSVGPath = (d) => {
  const parsed = parsePath(d);
  const absolutePath = absolutize(parsed);
  const normalized = normalize(absolutePath);
  return toCommands(normalized);
};
const pathFromCommands = ({ commands }) => {
  return {
    __internal: {
      hasBoundingBox: false,
      hasCommands: true,
      hasComputed: false
    },
    __cache: {
      bezierPaths: null,
      boundingBox: null,
      length: null
    },
    type: 'path',
    commands,
    getPointAt(t) {
      const cl = locationAt(t, this);
      return cl.curve.getPointAt(cl.t);
    },
    getTangentAt(t) {
      const cl = locationAt(t, this);
      return cl.curve.getTangentAt(cl.t);
    },
    getNormalAt(t) {
      const cl = locationAt(t, this);
      return cl.curve.getNormalAt(cl.t);
    },
    getCurvatureAt(t) {
      const cl = locationAt(t, this);
      return cl.curve.getCurvatureAt(cl.t);
    },
    getRadiusAt(t) {
      const cl = locationAt(t, this);
      return cl.curve.getRadiusAt(cl.t);
    },
    getLength() {
      ensurePathIsComputed(this);
      return this.__cache.length;
    },
    getBoundingBox() {
      ensureBoundingBox(this);
      return this.__cache.boundingBox;
    },
    translate(x, y) {
      const matrix = translate({ x, y });
      return applyTransformationToPath(matrix, this);
    },
    scale(sx, sy) {
      ensureBoundingBox(this);
      const matrix = scale({
        sx,
        sy,
        origin: {
          x: this.__cache.boundingBox.x + this.__cache.boundingBox.width / 2,
          y: this.__cache.boundingBox.y + this.__cache.boundingBox.height / 2
        }
      });
      return applyTransformationToPath(matrix, this);
    },
    rotate(angle) {
      ensureBoundingBox(this);
      const matrix = rotate({
        angle,
        origin: {
          x: this.__cache.boundingBox.x + this.__cache.boundingBox.width / 2,
          y: this.__cache.boundingBox.y + this.__cache.boundingBox.height / 2
        }
      });
      return applyTransformationToPath(matrix, this);
    },
    transform(...matrices) {
      return applyTransformationToPath(mergeTransforms(...matrices), this);
    },
    toInstructions() {
      return this.commands;
    },
    toSVG() {
      return this.toInstructions()
        .map((instr) => {
          switch (instr.command) {
            case 'moveTo': {
              return `M ${instr.x} ${instr.y}`;
            }
            case 'lineTo': {
              return `L ${instr.x} ${instr.y}`;
            }
            case 'curveTo': {
              const { x1, y1, x2, y2, x3, y3 } = instr;
              return `C ${x1} ${y1} ${x2} ${y2} ${x3} ${y3}`;
            }
            case 'close': {
              return `Z`;
            }
          }
        })
        .join(' ');
    },
    renderToCanvas(ctx) {
      ctx.beginPath();
      this.toInstructions().forEach((instr) => {
        switch (instr.command) {
          case 'moveTo': {
            ctx.moveTo(instr.x, instr.y);
            break;
          }
          case 'lineTo': {
            ctx.lineTo(instr.x, instr.y);
            break;
          }
          case 'curveTo': {
            ctx.bezierCurveTo(
              instr.x1,
              instr.y1,
              instr.x2,
              instr.y2,
              instr.x3,
              instr.y3
            );
            break;
          }
          case 'close': {
            ctx.closePath();
            break;
          }
        }
      });
    }
  };
};
const createPath = (input) => {
  const commands = typeof input === 'string' ? parseSVGPath(input) : input;
  return pathFromCommands({ commands });
};

const rectangle = ({ x, y, width, height }) => {
  return createPath([
    moveTo(x, y),
    lineTo(x + width, y),
    lineTo(x + width, y + height),
    lineTo(x, y + height),
    close()
  ]);
};
const roundedRectangle = ({ x, y, width, height, radius }) => {
  const [tlr, trr, brr, blr] =
    typeof radius === 'number' ? [radius, radius, radius, radius] : radius;
  return createPath([
    moveTo(x, y + tlr),
    curveTo(x, y + tlr * (1 - KAPPA), x + tlr * (1 - KAPPA), y, x + tlr, y),
    lineTo(x + width - trr, y),
    curveTo(
      x + width - trr * (1 - KAPPA),
      y,
      x + width,
      y + trr * (1 - KAPPA),
      x + width,
      y + trr
    ),
    lineTo(x + width, y + height - brr),
    curveTo(
      x + width,
      y + height - brr * (1 - KAPPA),
      x + width - brr * (1 - KAPPA),
      y + height,
      x + width - brr,
      y + height
    ),
    lineTo(x + blr, y + height),
    curveTo(
      x + blr * (1 - KAPPA),
      y + height,
      x,
      y + height - blr * (1 - KAPPA),
      x,
      y + height - blr
    ),
    close()
  ]);
};
const ellipse = ({ cx, cy, rx, ry }) => {
  return createPath([
    moveTo(cx + rx, cy),
    curveTo(cx + rx, cy - ry * KAPPA, cx + rx * KAPPA, cy - ry, cx, cy - ry),
    curveTo(cx - rx * KAPPA, cy - ry, cx - rx, cy - ry * KAPPA, cx - rx, cy),
    curveTo(cx - rx, cy + ry * KAPPA, cx - rx * KAPPA, cy + ry, cx, cy + ry),
    curveTo(cx + rx * KAPPA, cy + ry, cx + rx, cy + ry * KAPPA, cx + rx, cy),
    close()
  ]);
};
const circle = ({ cx, cy, r }) => ellipse({ cx, cy, rx: r, ry: r });

exports.circle = circle;
exports.close = close;
exports.createPath = createPath;
exports.curveTo = curveTo;
exports.ellipse = ellipse;
exports.lineTo = lineTo;
exports.mergeTransforms = mergeTransforms;
exports.moveTo = moveTo;
exports.rectangle = rectangle;
exports.rotate = rotate;
exports.roundedRectangle = roundedRectangle;
exports.scale = scale;
exports.translate = translate;
