import type { PersistedWorkspace } from '../../types';

export const appendVersion = (workspace: PersistedWorkspace, next: PersistedWorkspace): PersistedWorkspace => ({
  ...workspace,
  ...next,
});
