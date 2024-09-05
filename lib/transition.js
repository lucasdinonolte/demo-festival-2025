'use strict';

/**
 * Pre-configured collection of direction functions. A direction function
 * gets the current timestamp and the duration of the transition as
 * its input and repeats a noramlized t value between 0 and 1.
 */
const DirectionFunctions = {
  // Runs the transition once forward
  forward: (current, duration, iterationCount) => {
    const curIteration = Math.floor(current / duration);
    if (curIteration >= iterationCount) return 1;

    return (current % duration) / duration;
  },

  // Alternates the transition between forwards and
  // backwards execution
  alternate: (current, duration, iterationCount) => {
    const curIteration = Math.floor(current / duration);
    const t = (current % duration) / duration;

    if (curIteration >= iterationCount) {
      return iterationCount % 2 === 0 ? 0 : 1;
    } else {
      return curIteration % 2 === 0 ? t : 1 - t;
    }
  },

  // Reverses the transition
  reverse: (current, duration, iterationCount) => {
    const curIteration = Math.floor(current / duration);
    if (curIteration >= iterationCount) return 0;
    return 1 - (current % duration) / duration;
  },

  // Alternates the transition, starting from the
  // reversed transition
  alternateReverse: (current, duration, iterationCount) => {
    const curIteration = Math.floor(current / duration);
    const t = (current % duration) / duration;

    if (curIteration >= iterationCount) {
      return iterationCount % 2 === 0 ? 1 : 0;
    } else {
      return curIteration % 2 === 0 ? 1 - t : t;
    }
  }
};

/**
 * Looks up the user specified animation direction and returns
 * the matching function.
 *
 * @params{string} direction
 */
const resolveDirection = (direction) => {
  if (DirectionFunctions[direction]) return DirectionFunctions[direction];

  throw new Error(
    `Unexpected direction (${direction}) passed to transition function. Direction should be one of the pre-built values: ${Object.keys(
      DirectionFunctions
    ).join(', ')}.`
  );
};

const easeOutBounce = (t) => {
  const scaledTime = t / 1;

  if (scaledTime < 1 / 2.75) {
    return 7.5625 * scaledTime * scaledTime;
  } else if (scaledTime < 2 / 2.75) {
    const scaledTime2 = scaledTime - 1.5 / 2.75;
    return 7.5625 * scaledTime2 * scaledTime2 + 0.75;
  } else if (scaledTime < 2.5 / 2.75) {
    const scaledTime2 = scaledTime - 2.25 / 2.75;
    return 7.5625 * scaledTime2 * scaledTime2 + 0.9375;
  } else {
    const scaledTime2 = scaledTime - 2.625 / 2.75;
    return 7.5625 * scaledTime2 * scaledTime2 + 0.984375;
  }
};

const easeInBounce = (t) => {
  return 1 - easeOutBounce(1 - t);
};

/**
 * A pre-configured collection of the most commonly used
 * easing curves.
 *
 * Ported from https://gist.github.com/gre/1650294
 * and https://github.com/AndrewRayCode/easing-utils/blob/master/src/easing.js
 */
const EasingFunctions = {
  // no easing, no acceleration
  linear: (t) => t,

  // accelerating from zero velocity
  easeInQuad: (t) => t * t,

  // decelerating to zero velocity
  easeOutQuad: (t) => t * (2 - t),

  // acceleration until halfway, then deceleration
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // accelerating from zero velocity
  easeInCubic: (t) => t * t * t,

  // decelerating to zero velocity
  easeOutCubic: (t) => --t * t * t + 1,

  // acceleration until halfway, then deceleration
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // accelerating from zero velocity
  easeInQuart: (t) => t * t * t * t,

  // decelerating to zero velocity
  easeOutQuart: (t) => 1 - --t * t * t * t,

  // acceleration until halfway, then deceleration
  easeInOutQuart: (t) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,

  // accelerating from zero velocity
  easeInQuint: (t) => t * t * t * t * t,

  // decelerating to zero velocity
  easeOutQuint: (t) => 1 + --t * t * t * t * t,

  // acceleration until halfway, then deceleration
  easeInOutQuint: (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,

  // Accelerate exponentially until finish
  easeInExpo: (t) => {
    if (t === 0) {
      return 0;
    }

    return Math.pow(2, 10 * (t - 1));
  },

  // Initial exponential acceleration slowing to stop
  easeOutExpo: (t) => {
    if (t === 1) {
      return 1;
    }

    return -Math.pow(2, -10 * t) + 1;
  },

  // Exponential acceleration and deceleration
  easeInOutExpo: (t) => {
    if (t === 0 || t === 1) {
      return t;
    }

    const scaledTime = t * 2;
    const scaledTime1 = scaledTime - 1;

    if (scaledTime < 1) {
      return 0.5 * Math.pow(2, 10 * scaledTime1);
    }

    return 0.5 * (-Math.pow(2, -10 * scaledTime1) + 2);
  },

  // Increasing velocity until stop
  easeInCirc: (t) => {
    const scaledTime = t / 1;
    return -1 * (Math.sqrt(1 - scaledTime * t) - 1);
  },

  // Start fast, decreasing velocity until stop
  easeOutCirc: (t) => {
    const t1 = t - 1;
    return Math.sqrt(1 - t1 * t1);
  },

  // Fast increase in velocity, fast decrease in velocity
  easeInOutCirc: (t) => {
    const scaledTime = t * 2;
    const scaledTime1 = scaledTime - 2;

    if (scaledTime < 1) {
      return -0.5 * (Math.sqrt(1 - scaledTime * scaledTime) - 1);
    }

    return 0.5 * (Math.sqrt(1 - scaledTime1 * scaledTime1) + 1);
  },

  // Slow movement backwards then fast snap to finish
  easeInBack: (t, magnitude = 1.70158) => {
    return t * t * ((magnitude + 1) * t - magnitude);
  },

  // Fast snap to backwards point then slow resolve to finish
  easeOutBack: (t, magnitude = 1.70158) => {
    const scaledTime = t / 1 - 1;

    return (
      scaledTime * scaledTime * ((magnitude + 1) * scaledTime + magnitude) + 1
    );
  },

  // Slow movement backwards, fast snap to past finish, slow resolve to finish
  easeInOutBack: (t, magnitude = 1.70158) => {
    const scaledTime = t * 2;
    const scaledTime2 = scaledTime - 2;

    const s = magnitude * 1.525;

    if (scaledTime < 1) {
      return 0.5 * scaledTime * scaledTime * ((s + 1) * scaledTime - s);
    }

    return 0.5 * (scaledTime2 * scaledTime2 * ((s + 1) * scaledTime2 + s) + 2);
  },

  // Bounces slowly then quickly to finish
  easeInElastic: (t, magnitude = 0.7) => {
    if (t === 0 || t === 1) {
      return t;
    }

    const scaledTime = t / 1;
    const scaledTime1 = scaledTime - 1;

    const p = 1 - magnitude;
    const s = (p / (2 * Math.PI)) * Math.asin(1);

    return -(
      Math.pow(2, 10 * scaledTime1) *
      Math.sin(((scaledTime1 - s) * (2 * Math.PI)) / p)
    );
  },

  // Fast acceleration, bounces to zero
  easeOutElastic: (t, magnitude = 0.7) => {
    if (t === 0 || t === 1) {
      return t;
    }

    const p = 1 - magnitude;
    const scaledTime = t * 2;

    const s = (p / (2 * Math.PI)) * Math.asin(1);
    return (
      Math.pow(2, -10 * scaledTime) *
        Math.sin(((scaledTime - s) * (2 * Math.PI)) / p) +
      1
    );
  },

  // Slow start and end, two bounces sandwich a fast motion
  easeInOutElastic: (t, magnitude = 0.65) => {
    if (t === 0 || t === 1) {
      return t;
    }

    const p = 1 - magnitude;
    const scaledTime = t * 2;
    const scaledTime1 = scaledTime - 1;

    const s = (p / (2 * Math.PI)) * Math.asin(1);

    if (scaledTime < 1) {
      return (
        -0.5 *
        (Math.pow(2, 10 * scaledTime1) *
          Math.sin(((scaledTime1 - s) * (2 * Math.PI)) / p))
      );
    }

    return (
      Math.pow(2, -10 * scaledTime1) *
        Math.sin(((scaledTime1 - s) * (2 * Math.PI)) / p) *
        0.5 +
      1
    );
  },

  // Bounce to completion
  easeOutBounce,

  // Bounce increasing in velocity until completion
  easeInBounce,

  // Bounce in and bounce out
  easeInOutBounce: (t) => {
    if (t < 0.5) {
      return easeInBounce(t * 2) * 0.5;
    }

    return easeOutBounce(t * 2 - 1) * 0.5 + 0.5;
  }
};

/**
 * Turns the user specified easing into a function that can
 * be executed by the transition utility.
 *
 * Easing can either be a string referencing one of the
 * pre-built easing functions or a custom function.
 *
 * @params{string|function} easing
 */
const resolveEasing = (easing) => {
  // If the user specified a function for the easing,
  // we’re using that
  if (typeof easing === 'function') return easing;

  // If not, we check if we can return a pre-built
  // easing function
  if (EasingFunctions[easing]) return EasingFunctions[easing];

  // Lastly we need to throw
  throw new Error(
    `Unexpected easing (${easing}) passed to transition function. Easing should either be a custom function or one of the pre-built values: ${Object.keys(
      EasingFunctions
    ).join(', ')}.`
  );
};

const defaultOptions = {
  from: 0,
  to: 0,
  duration: 0,
  delay: 0,
  easing: 'linear',
  iterationCount: 1,
  direction: 'forward'
};

/**
 * Validates the iteration supplied by the user to be a positive
 * integer value.
 *
 * @params{any} iteration
 * @returns number
 */
const validateIterationCount = (iteration) => {
  if (
    typeof iteration !== 'number' ||
    iteration < 0 ||
    (!Number.isInteger(iteration) && Number.isFinite(iteration))
  ) {
    throw new Error(
      `iterationCount expects a positive integer. Got ${iteration}.`
    );
  }

  return iteration;
};

const interpolateNumber = ({ from, to }, t) => {
  const change = to - from;
  return change * t + from;
};

const interpolateArray = ({ from, to }, t) => {
  if (from.length !== to.length)
    throw new Error(
      'When interpolating arrays they need to have the same length.'
    );

  return from.map((v, i) => interpolate({ from: v, to: to[i] }, t));
};

const interpolateObject = ({ from, to }, t) => {
  const allKeys = Object.keys({ ...from, ...to });

  return allKeys.reduce((acc, cur) => {
    const _f = from[cur] ?? to[cur];
    const _t = to[cur] ?? from[cur];

    acc[cur] = interpolate({ from: _f, to: _t }, t);
    return acc;
  }, {});
};

/**
 * Interpolates between two values based on the current
 * t value. Checks for the type of the values to dispatch
 * the correct interpolation method.
 */
const interpolate = ({ from, to }, t) => {
  if (typeof from === 'number' && typeof to === 'number')
    return interpolateNumber({ from, to }, t);
  if (Array.isArray(from) && Array.isArray(to))
    return interpolateArray({ from, to }, t);
  if (typeof from === 'object' && typeof to === 'object')
    return interpolateObject({ from, to }, t);
  if (typeof from === typeof to) return t < 0.5 ? from : to;

  throw new Error(
    'Interpolation failed. The from and to values need to be of the same type.'
  );
};

/**
 * Factory function building a pre-loaded transition that can be
 * ticked on every frame.
 *
 * @params {object} options
 * @returns {function}
 */
const transition = (_options = {}) => {
  const options = Object.assign({}, defaultOptions, _options);
  const easingFn = resolveEasing(options.easing);
  const directionFn = resolveDirection(options.direction);
  const iterationCount = validateIterationCount(options.iterationCount);
  const { from, to, duration, delay } = options;

  const tickFn = (tick) => {
    const currentTime = Math.max(0, tick - delay);

    // Scaling by 1000 turns any input made in seconds into milliseconds
    // and makes sure we can safely divide numbers
    const t = directionFn(currentTime * 1000, duration * 1000, iterationCount);
    return interpolate({ from, to }, easingFn(t));
  };

  tickFn.startsAt = delay;
  tickFn.endsAt = delay + duration * iterationCount;
  tickFn.from = from;
  tickFn.to = to;

  return tickFn;
};

/**
 * Factory function building a pre-loaded sequential transition
 * that can be ticked on every frame.
 *
 * @param {object} initial
 * @param {...object} keyframes
 * @returns {function}
 */
const sequentialTransition = (initial, ...keyframes) => {
  const initialOptions = Object.assign({}, defaultOptions, initial);
  const initialEasing = initialOptions.easing;
  const initialDuration = initialOptions.duration;

  let currentTime = initialOptions.delay;
  const transitions = [];

  for (let i = 0; i < keyframes.length; i++) {
    const keyframe = keyframes[i];

    const from = i === 0 ? initialOptions.from : transitions[i - 1].to;
    const to = { ...from, ...keyframe.to };
    const duration = keyframe.duration ?? initialDuration;
    const delay = currentTime + (keyframe.delay ?? 0);
    const easing = keyframe.easing ?? initialEasing;

    currentTime += duration + (keyframe.delay ?? 0);

    transitions.push(
      transition({
        from,
        to,
        duration,
        delay,
        easing
      })
    );
  }

  return (tick) => {
    for (let i = 0; i < transitions.length; i++) {
      const transition = transitions[i];
      const value = transition(tick);
      if (i === transitions.length - 1) return value;
      if (tick >= transition.endsAt) continue;
      return value;
    }
  };
};

/**
 * Factory function building a pre-loaded parallel transition
 * that can be ticked on every frame.
 *
 * @param {...function|object} args
 * @returns {function}
 */
const parallelTransition = (...args) => {
  const transitions = args.map((arg) => {
    if (typeof arg === 'function') return arg;
    return transition(arg);
  });

  return (tick) => {
    return transitions.map((transition) => transition(tick));
  };
};

const namedEasings = Object.keys(EasingFunctions);
const namedDirections = Object.keys(DirectionFunctions);

exports.namedDirections = namedDirections;
exports.namedEasings = namedEasings;
exports.parallelTransition = parallelTransition;
exports.sequentialTransition = sequentialTransition;
exports.transition = transition;
