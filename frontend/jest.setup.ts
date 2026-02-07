// 导入@testing-library/jest-dom，添加匹配器
import '@testing-library/jest-dom';

// 模拟其他全局对象
if (typeof window !== 'undefined') {
  // 模拟localStorage
  if (!window.localStorage) {
    window.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    } as any;
  }
  
  // 模拟sessionStorage
  if (!window.sessionStorage) {
    window.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    } as any;
  }
  
  // 模拟import.meta.env
  if (!('import' in window)) {
    (window as any).import = {
      meta: {
        env: {
          VITE_API_BASE_URL: 'http://localhost:3001/api'
        }
      }
    };
  }
  
  // 模拟fetch
  if (!window.fetch) {
    window.fetch = () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    }) as any;
  }
  
  // 模拟matchMedia
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as any;
  }
  
  // 模拟window.scrollTo
  if (!window.scrollTo) {
    window.scrollTo = () => {};
  }
  
  // 模拟window.innerWidth和innerHeight
  if (!window.innerWidth) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024
    });
  }
  if (!window.innerHeight) {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 768
    });
  }
  
  // 模拟window.getComputedStyle
  (window as any).getComputedStyle = (_element: Element, _pseudoElt?: string | null) => ({
    getPropertyValue: (property: string) => {
      if (property === 'width') return '100px';
      if (property === 'height') return '100px';
      if (property === 'padding-left') return '0px';
      if (property === 'padding-right') return '0px';
      return '0px';
    },
    cssText: '',
    length: 0,
    item: (_index: number) => '',
    [Symbol.iterator]: function* () {}
  });
  
  // 模拟document.body.getBoundingClientRect
  if (!document.body.getBoundingClientRect) {
    document.body.getBoundingClientRect = () => ({
      width: 1024,
      height: 768,
      top: 0,
      left: 0,
      bottom: 768,
      right: 1024,
      x: 0,
      y: 0,
      toJSON: () => {}
    }) as any;
  }
}

// 确保fetch被模拟
if (typeof fetch === 'undefined') {
  (globalThis as any).fetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  }) as any;
}

// 模拟console.error，避免测试中出现太多警告
const originalError = console.error;
if (typeof beforeAll === 'function') {
  beforeAll(() => {
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        (
          args[0].includes('An update to ForwardRef inside a test was not wrapped in act') ||
          args[0].includes('Warning: ReactDOM.render is no longer supported') ||
          args[0].includes('Not implemented: window.getComputedStyle')
        )
      ) {
        return;
      }
      originalError.call(console, ...args);
    };
  });
}

if (typeof afterAll === 'function') {
  afterAll(() => {
    console.error = originalError;
  });
}

