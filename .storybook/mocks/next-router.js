export function useRouter() {
  return {
    asPath: '/',
    pathname: '/',
    query: {},
    replace: () => Promise.resolve(true),
    push: () => Promise.resolve(true),
    back: () => {},
    events: {
      on: () => {},
      off: () => {},
      emit: () => {},
    },
  };
}
