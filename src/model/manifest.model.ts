export type Manifest = {
  name: string;
  version?: string;
  description?: string;
  homepage?: string;
  scripts: ManifestScript[];
  rules: ManifestRule[];
};

export type ManifestRuleAction = ManifestRuleActionResponse | ManifestRuleActionScripts | ManifestRuleActionClose;

export type ManifestRule = {
  url?: string | RegExp;
  hostname?: string | RegExp;
  path?: string | RegExp;
  action: ManifestRuleAction;
};

export type ManifestRuleActionResponse = {
  response: number;
};
export type ManifestRuleActionScripts = {
  scripts: string[];
};
export type ManifestRuleActionClose = {
  close: boolean;
};

export type ManifestScript = {
  name: string;
  files: ScriptFile[];
};

export type ScriptFile = {
  path: string;
  inject?: boolean;
};

export type ResolvedManifest = Omit<Manifest, 'rules'> & {
  rules: ResolvedManifestRule[];
};

export type ResolvedManifestRule = Omit<ManifestRule, 'action'> & {
  action: ResolvedManifestRuleAction;
};

export type ResolvedManifestRuleAction =
  | Exclude<ManifestRuleAction, 'ManifestRuleActionScripts'>
  | ResolvedManifestRuleActionScripts;

export type ResolvedManifestRuleActionScripts = Omit<ManifestRuleActionScripts, 'scripts'> & {
  files: ScriptFile[];
};

export function isManifestRuleActionResponse(a: any): a is ManifestRuleActionResponse {
  return a != null && typeof a === 'object' && a.response != null;
}

export function isManifestRuleActionScripts(a: any): a is ManifestRuleActionScripts {
  return a != null && typeof a === 'object' && a.scripts != null;
}

export function isManifestRuleActionClose(a: any): a is ManifestRuleActionClose {
  return a != null && typeof a === 'object' && a.close != null;
}

export function isResolvedManifestRuleActionScripts(a: any): a is ResolvedManifestRuleActionScripts {
  return a != null && typeof a === 'object' && a.files != null && Array.isArray(a.files);
}
