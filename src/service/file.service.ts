import { F_OK } from 'constants';
import fs from 'fs';
import { dirname } from 'path';

export function fileExists(path: string) {
  try {
    fs.accessSync(path, F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

export function saveFile(path: string, data: string) {
  const dir = dirname(path);
  if (dir !== '') {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path, data);
  // eslint-disable-next-line
  console.log(`Saved: ${path}`);
}

export function readFile(path: string) {
  return fs.readFileSync(path).toString();
}
