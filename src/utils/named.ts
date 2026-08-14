export function named<T extends Function>(name: string, fn: T): T {
  Object.defineProperty(fn, "name", { value: name });
  return fn;
}
