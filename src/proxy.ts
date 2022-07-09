import fs from 'fs';
import { basename, join, resolve } from 'path';
import {
  getLocal,
  generateCACertificate,
  generateSPKIFingerprint,
  RequestRuleBuilder,
  Headers,
  CompletedRequest,
} from 'mockttp';

import { fileExists, readFile, readManifest, saveFile } from './service';
import { getIndicatorScript } from './indicator';
import { getLogger } from './logger';
import { isManifestRuleActionClose, isManifestRuleActionResponse, isResolvedManifestRuleActionScripts } from './model';

export const MANIFEST_FILE = 'manifest.js';

export default async function proxy(port: number, wmod: string) {
  const manifestPath = join(wmod, MANIFEST_FILE);
  if (!fileExists(manifestPath)) {
    throw new ProxyError(`Manifest file not found in: "${manifestPath}"`);
  }
  const manifestSource = require(resolve(manifestPath));
  const manifest = readManifest(manifestSource);

  const logger = getLogger();

  // Get keys
  const keys = await getSslKeys();

  // Create server
  const server = getLocal({ https: keys, http2: false });

  // Configure server

  // An auxiliary map for tracking requests and responses
  const reqResMap = new Map<string, CompletedRequest>();

  manifest.rules.forEach(({ url, hostname, path, action, method }, ruleId) => {
    // TODO: remove this later when mockttp can handle RegExp hostnames
    if (hostname != null && hostname instanceof RegExp) {
      throw new ProxyError('Not implemented: hostname is RegExp (1)');
    }

    logger.dbg(`Action: method=${method}`);

    // Build rule
    let builder: RequestRuleBuilder;
    builder = server.forAnyRequest();
    if (path != null || url != null || hostname != null || method != null) {
      builder = builder.matching((req) => {
        logger.dbg(`${ruleId}: r------: [${$id(req)}] ${$method(req)} ${$url(req)}`);
        if (method != null && req.method !== method) {
          logger.dbg(`${ruleId}: -M-----: [${$id(req)}] ${$method(req)} ${$url(req)}`);
          return false;
        }
        const reqUrl = new URL(req.url);
        if (hostname != null && reqUrl.hostname !== hostname) {
          logger.dbg(`${ruleId}: -H-----: [${$id(req)}] ${$method(req)} ${$url(req)}`);
          return false;
        }
        if (path != null) {
          if (path instanceof RegExp ? path.test(reqUrl.pathname) : path === reqUrl.pathname) {
            logger.dbg(`${ruleId}: -p-----: [${$id(req)}] ${$method(req)} ${$path(req)}`);
            return true;
          }
        }
        if (url != null) {
          if (url instanceof RegExp ? url.test(req.url) : url === req.url) {
            logger.dbg(`${ruleId}: -u-----: [${$id(req)}] ${$method(req)} ${$url(req)}`);
            return true;
          }
        }
        logger.dbg(`${ruleId}: -S-----: [${$id(req)}] ${$method(req)} ${$url(req)}`);
        return false;
      });
    }
    // Check what kind of rule we have
    if (isResolvedManifestRuleActionScripts(action)) {
      // If there are files to inject...
      if (action.files.filter(({ inject }) => inject).length > 0) {
        // Try to inject
        builder.thenPassThrough({
          beforeRequest: (req) => {
            reqResMap.set(req.id, req);
            logger.dbg(`${ruleId}: --r----: [${$id(req)}] ${$method(req)} ${$url(req)}`);
          },
          beforeResponse: async (res) => {
            logger.dbg(`${ruleId}: ---r---: [${$id(res)}]`);
            if (!reqResMap.has(res.id)) {
              logger.dbg(`${ruleId}: ----?--: [${$id(res)}]`);
              return undefined;
            }
            const req = reqResMap.get(res.id)!;
            if (!isContentTypeHtml(res.headers)) {
              logger.dbg(`${ruleId}: ----T--: [${$id(req)}] ${$method(req)} ${$url(req)}`);
              return undefined;
            }
            // Remove used req-res map entry
            reqResMap.delete(res.id);
            logger.dbg(`${ruleId}: ----r--: [${$id(req)}] ${$method(req)} ${$url(req)}`);

            let bodyText = await res.body.getText();

            // Removing Content-Security-Policy
            // TODO: ensure only object-src and script-src works
            const headersAll = res.headers as any;
            if (headersAll['content-security-policy'] != null) {
              delete headersAll['content-security-policy'];
            }
            if (bodyText != null) {
              // For debugging
              // saveFile(`./${req.id}.html`, `${$method(req)} ${req.url}\n${bodyText}`);
              let isReplaced = false;
              bodyText = bodyText.replace(/<body[^>]*>/, (match) => {
                isReplaced = true;
                let result = match + `<script>${getIndicatorScript(manifest)}</script>`;
                action.files
                  .filter(({ inject }) => inject)
                  .forEach((file) => {
                    const scriptName = basename(file.path);
                    const scriptSitePath = `/${scriptName}`;
                    logger.info(
                      `${ruleId}: -----i-: [${$id(req)}] ${$method(req)} ${$url(req)} <== "${scriptSitePath}"`,
                    );
                    result += `<script src="${scriptSitePath}"></script>`;
                  });
                return result;
              });
              if (!isReplaced) {
                throw new ProxyError('Cannot find the pattern for script injection');
              }
            }
            logger.dbg(`${ruleId}: ------r: [${$id(req)}] ${$method(req)} ${$url(req)}`);
            return { body: bodyText, headers: headersAll };
          },
        });
      } else {
        builder.thenPassThrough();
      }
    } else if (isManifestRuleActionResponse(action)) {
      builder.thenCallback((req) => {
        logger.info(`${ruleId}: --s----: [${$id(req)}] ${$method(req)} ${$url(req)}`);
        return { statusCode: action.response };
      });
    } else if (isManifestRuleActionClose(action) && action.close) {
      builder.thenCallback((req) => {
        logger.info(`${ruleId}: --c----: [${$id(req)}] ${$method(req)} ${$url(req)}`);
        return 'close';
      });
    }

    // Serving GET file requests

    if (isResolvedManifestRuleActionScripts(action)) {
      action.files.forEach((file) => {
        const scriptName = basename(file.path);
        const scriptSitePath = `/${scriptName}`;

        // Serving our injected scripts
        let builder = server.forGet(scriptSitePath);
        if (hostname != null) {
          builder = builder.forHostname(hostname);
        }
        builder.thenCallback((req) => {
          logger.info(`${ruleId}: --f----: [${$id(req)}] ${$method(req)} ${$url(req)} <== ${join(wmod, file.path)}`);
          return {
            statusCode: 200,
            headers: {
              'content-type': 'application/javascript; charset=utf-8',
            },
            body: fs.readFileSync(join(wmod, file.path)),
          };
        });
      });
    }
  });

  server.forUnmatchedRequest().thenPassThrough();

  // Run server
  await server.start(port);

  const caFingerprint = generateSPKIFingerprint(keys.cert);
  // Print out the server details for manual configuration:
  logger.info(`Server running on port ${server.port}`);
  logger.info(`CA cert fingerprint ${caFingerprint}`);

  return server;
}

function truncate(str: string, n: number) {
  return str.length > n ? str.substring(0, n - 1) + '...' : str;
}

function $id(obj: { id: string }) {
  return obj.id.substring(0, 6);
}

function $url(obj: { url: string }) {
  return truncate(obj.url, 100);
}

function $path(obj: { path: string }) {
  return truncate(obj.path, 100);
}

function $method(obj: { method: string }) {
  return obj.method.padEnd(7, ' ');
}

async function getSslKeys() {
  const keyPemPath = 'cert/key.pem';
  const certPemPath = 'cert/cert.pem';

  if (!fileExists(keyPemPath) || !fileExists(certPemPath)) {
    const { key, cert } = await generateCACertificate();
    saveFile(keyPemPath, key);
    saveFile(certPemPath, cert);
  }
  return { key: readFile(keyPemPath), cert: readFile(certPemPath) };
}

function isContentTypeHtml(headers: Headers) {
  return headers['content-type'] != null && /^text\/html/.test(headers['content-type']);
}

export class ProxyError extends Error {
  toString(): string {
    return 'Proxy error:\n' + this.message;
  }
}
