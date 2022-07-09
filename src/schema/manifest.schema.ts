import { z } from 'zod';
import { HTTPMethod } from 'http-method-enum';
import {
  Manifest,
  ManifestRule,
  ManifestScript,
  ScriptFile,
  ManifestRuleActionResponse,
  ManifestRuleActionScripts,
  ManifestRuleActionClose,
} from '../model';

export const schemaScriptFile: z.ZodType<ScriptFile> = z
  .object({
    path: z.string(),
    inject: z.boolean(),
  })
  .strict();

export const schemaManifestScript: z.ZodType<ManifestScript> = z
  .object({
    name: z.string(),
    files: schemaScriptFile.array().nonempty(),
  })
  .strict();

export const schemaManifestRuleActionResponse: z.ZodType<ManifestRuleActionResponse> = z
  .object({
    response: z.number(),
  })
  .strict();

export const schemaManifestRuleActionScripts: z.ZodType<ManifestRuleActionScripts> = z
  .object({
    scripts: z.string().array().nonempty(),
  })
  .strict();

export const schemaManifestRuleActionClose: z.ZodType<ManifestRuleActionClose> = z
  .object({
    close: z.boolean(),
  })
  .strict();

export const schemaManifestRule: z.ZodType<ManifestRule> = z
  .object({
    // TODO: should be one of three
    url: z.union([z.string(), z.instanceof(RegExp)]).optional(),
    hostname: z.union([z.string(), z.instanceof(RegExp)]).optional(),
    path: z.union([z.string(), z.instanceof(RegExp)]).optional(),
    method: z.nativeEnum(HTTPMethod).optional(),
    action: z.union([schemaManifestRuleActionResponse, schemaManifestRuleActionScripts, schemaManifestRuleActionClose]),
  })
  .strict();

export const schemaManifest: z.ZodType<Manifest> = z
  .object({
    name: z.string(),
    version: z.string().optional(),
    description: z.string().optional(),
    homepage: z.string().optional(),
    scripts: schemaManifestScript.array().nonempty(),
    rules: z.array(schemaManifestRule).nonempty(),
  })
  .strict();
