
import { AsyncLocalStorage } from 'async_hooks';

export const tenancyContext = new AsyncLocalStorage<string>();

export const getSchoolIdFromContext = (): string | undefined => {
  return tenancyContext.getStore();
};
