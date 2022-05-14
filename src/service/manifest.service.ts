import { schemaManifest } from '../schema/manifest.schema';
import { isManifestRuleActionScripts, ResolvedManifest, ScriptFile } from '../model';
import { BetterObject, isRecord } from '../utils';

type FilesByScriptName = Record<string, ScriptFile[]>;

export function readManifest(input: unknown): ResolvedManifest {
  const res = schemaManifest.safeParse(input);
  // try {
  if (!res.success) {
    const formatted = res.error.format();
    // throw new ZodValidationError(formatted);
    throw new ManifestError(formatZodErrors(formatted));
  }

  const manifest = res.data;

  // Make helper search map
  const scriptByName = manifest.scripts.reduce((accum: FilesByScriptName, { name, files }) => {
    if (accum[name] != null) {
      throw new ManifestError(`script "${name}" is not unique`);
    }
    accum[name] = files;
    return accum;
  }, {});

  return {
    ...manifest,
    rules: manifest.rules.map((rule) => ({
      ...rule,
      action: isManifestRuleActionScripts(rule.action)
        ? {
            files: rule.action.scripts.reduce((accum: ScriptFile[], scriptName) => {
              if (scriptByName[scriptName] != null) {
                accum = accum.concat(scriptByName[scriptName]);
              } else {
                throw new ManifestError(`script "${scriptName}" not found`);
              }
              return accum;
            }, []),
          }
        : rule.action,
    })),
  };
}

export class ManifestError extends Error {
  toString(): string {
    return 'Manifest is malformed:\n' + this.message;
  }
}

function formatZodErrors(formatted: Record<string, unknown>, path = ''): string {
  let output = '';
  if (formatted['_errors'] != null && Array.isArray(formatted['_errors']) && formatted['_errors'].length > 0) {
    output += `${path}: ` + formatted['_errors'].join('; ') + '\n';
  }
  const props = BetterObject.keys(formatted);
  props.forEach((prop) => {
    if (prop !== '_errors') {
      const item = formatted[prop];
      if (isRecord(item)) {
        output += formatZodErrors(item, `${path !== '' ? path + '.' : ''}${prop}`);
      }
    }
  });
  return output;
}
