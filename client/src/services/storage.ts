
// In-memory fallback for localStorage in case of cross-origin blocking
const storage = (() => {
  try {
    const test = 'test-' + Math.random();
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return localStorage;
  } catch (e) {
    if (typeof window !== 'undefined') {
      console.warn('Storage blocked, using in-memory fallback');
    }
    const mem: Record<string, string> = {};
    return {
      getItem: (key: string) => mem[key] || null,
      setItem: (key: string, val: string) => { mem[key] = val; },
      removeItem: (key: string) => { delete mem[key]; },
      clear: () => { /* no-op or clear mem */ },
      length: 0,
      key: (index: number) => null,
    };
  }
})();

export default storage;
