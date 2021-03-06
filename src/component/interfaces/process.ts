export enum Process {
  init = 'init',
  scroll = 'scroll',
  reload = 'adapter.reload',
  append = 'adapter.append',
  prepend = 'adapter.prepend',
  check = 'adapter.check',
  start = 'start',
  preFetch = 'preFetch',
  fetch = 'fetch',
  postFetch = 'postFetch',
  render = 'render',
  clip = 'clip',
  adjust = 'adjust',
  end = 'end'
}

export enum ProcessStatus {
  start = 'start',
  next = 'next',
  done = 'done',
  error = 'error'
}

export interface ScrollPayload {
  event?: Event;
  byTimer?: boolean;
}

export interface ProcessSubject {
  process: Process;
  status: ProcessStatus;
  payload?: any;
}

export type CallWorkflow = (processSubject: ProcessSubject) => undefined;
