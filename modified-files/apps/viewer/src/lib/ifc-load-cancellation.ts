/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export function isLoadAbort(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

/** Awaiting a non-cancellable cache/engine operation must not retain the load.
 * The result is discarded on abort; the original promise still has a rejection
 * handler. Worker and fetch owners additionally receive this same signal. */
export function awaitLoad<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    void promise.catch(() => {});
    return Promise.reject(signal.reason);
  }
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

/** Never convert an intentional cancellation into a costly parser retry. */
export async function parserWithFallback<T>(worker: () => Promise<T>, fallback: () => Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  try { return await awaitLoad(worker(), signal); }
  catch (error) {
    if (signal.aborted || isLoadAbort(error)) throw error;
    return awaitLoad(fallback(), signal);
  }
}

/** The old models are removed only once the staged IFC owns a complete model.
 * Cancellation/parse failure leaves its model absent or incomplete. */
export function commitIfcReplacement(previousIds: string[], stagedId: string, state: {
  models: ReadonlyMap<string, { loadState?: string }>;
  removeModel: (id: string) => void;
  clearLayerStack: () => void;
  setActiveModel: (id: string) => void;
}): boolean {
  if (state.models.get(stagedId)?.loadState !== 'complete') return false;
  for (const id of previousIds) state.removeModel(id);
  state.clearLayerStack();
  state.setActiveModel(stagedId);
  return true;
}

const cancelOwners = new WeakMap<() => void, { live: boolean; previous: (() => void) | null }>();

/** Concurrent loads may finish in any order. Restore only a still-live owner,
 * otherwise an old completed load would leave a permanent Cancel button. */
export function installLoadCanceller(state: {
  activeStreamCanceller: (() => void) | null;
  setActiveStreamCanceller: (cancel: (() => void) | null) => void;
}, cancel: () => void, getCurrent: () => (() => void) | null): () => void {
  const owner = { live: true, previous: state.activeStreamCanceller };
  cancelOwners.set(cancel, owner);
  state.setActiveStreamCanceller(cancel);
  return () => {
    owner.live = false;
    if (getCurrent() !== cancel) return;
    let previous = owner.previous;
    while (previous && cancelOwners.get(previous)?.live === false) previous = cancelOwners.get(previous)!.previous;
    state.setActiveStreamCanceller(previous);
  };
}
