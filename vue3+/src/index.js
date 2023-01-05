import { compile } from './compiler/compile.js';
import {
  createApp,
  render,
  h,
  Text,
  Fragment,
  renderList,
  resolveComponent,
  withModel,
  nextTick,
} from './runtime/index.js';
import { reactive, ref, computed, effect } from './reactivity/index.js';

export const MiniVue = (window.MiniVue = {
  createApp,
  render,
  h,
  Text,
  Fragment,
  renderList,
  resolveComponent,
  withModel,
  nextTick,
  reactive,
  ref,
  computed,
  effect,
  compile,
});
