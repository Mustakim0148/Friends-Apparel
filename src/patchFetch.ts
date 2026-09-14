// Fixes "TypeError: Cannot set property fetch of #<Window> which has only a getter"
// when third-party libraries, preview iframes, or devtools attempt to patch window.fetch.
if (typeof window !== 'undefined') {
  try {
    const rawFetch = window.fetch;
    if (rawFetch) {
      let activeFetch = typeof rawFetch.bind === 'function' ? rawFetch.bind(window) : rawFetch;
      const descriptor: PropertyDescriptor = {
        get() {
          return activeFetch;
        },
        set(val: unknown) {
          if (typeof val === 'function') {
            activeFetch = val as typeof window.fetch;
          }
        },
        configurable: true,
        enumerable: true,
      };

      try {
        Object.defineProperty(window, 'fetch', descriptor);
      } catch {}

      try {
        if (window.Window && window.Window.prototype) {
          Object.defineProperty(window.Window.prototype, 'fetch', descriptor);
        }
      } catch {}
    }
  } catch {
    // Ignore
  }
}
