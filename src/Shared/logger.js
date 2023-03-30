function clone(args) {
  return JSON.parse(JSON.stringify(args));
}

export const debug = (...args) => console.debug(...clone(args));
