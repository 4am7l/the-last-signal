export class WebGLUnavailableError extends Error {
  constructor() {
    super("Could not initialize a WebGL 2 context.");
  }
}
