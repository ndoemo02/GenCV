import type { PersistedWorkspace } from '../../types';
import { coerceStructuredCv } from '../cv/structured';

const STORAGE_KEY = 'flowassist-career-workspace';

const emptyWorkspace = (): PersistedWorkspace => ({
  profile: null,
  latestVersionId: null,
  analyses: [],
  roadmaps: [],
  versions: [],
});

export const loadWorkspace = (): PersistedWorkspace => {
  if (typeof window === 'undefined') {
    return emptyWorkspace();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyWorkspace();
  }

  try {
    const parsed = JSON.parse(raw) as PersistedWorkspace;
    return {
      profile: parsed.profile ?? null,
      latestVersionId: parsed.latestVersionId ?? null,
      analyses: parsed.analyses ?? [],
      roadmaps: parsed.roadmaps ?? [],
      versions: (parsed.versions ?? []).map((version) => ({
        ...version,
        structuredCv: coerceStructuredCv(version.structuredCv),
      })),
    };
  } catch {
    return emptyWorkspace();
  }
};

export const saveWorkspace = (workspace: PersistedWorkspace) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
};
