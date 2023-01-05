import { h, render } from './index.js';
import { isString } from '../utils/index.js';

export function createApp(rootComponent) {
  const app = {
    mount(rootContainer) {
      if (isString(rootContainer)) {
        rootContainer = document.querySelector(rootContainer);
      }
      render(h(rootComponent), rootContainer);
    },
  };

  return app;
}
