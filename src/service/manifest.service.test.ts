import { ManifestError, readManifest } from './manifest.service';

describe('Manifest service', () => {
  it('should validate manifest 1', () => {
    const manifest = {};
    expect(() => readManifest(manifest)).toThrow(
      new ManifestError(err('name: Required', 'scripts: Required', 'rules: Required')),
    );
  });
  it('should validate manifest 2', () => {
    const manifest = {
      name: 'foo',
      scripts: [],
      rules: [],
    };
    expect(() => readManifest(manifest)).toThrow(
      new ManifestError(
        err('scripts: Array must contain at least 1 element(s)', 'rules: Array must contain at least 1 element(s)'),
      ),
    );
  });
  it('should validate manifest 3', () => {
    const manifest = {
      name: 'foo',
      scripts: [{ name: 'bar' }],
      rules: [{ hostname: 'example.com' }],
    };
    //readManifest(manifest);
    expect(() => readManifest(manifest)).toThrow(
      new ManifestError(err('scripts.0.files: Required', 'rules.0.action: Required; Required; Required')),
    );
  });
  it('should validate manifest 4', () => {
    const manifest = {
      name: 'foo',
      scripts: [{ name: 'bar', files: [] }],
      rules: [{ hostname: 'example.com' }],
    };
    expect(() => readManifest(manifest)).toThrow(
      new ManifestError(
        err(
          'scripts.0.files: Array must contain at least 1 element(s)',
          'rules.0.action: Required; Required; Required',
        ),
      ),
    );
  });
  it('should validate manifest 5', () => {
    const manifest = {
      name: 'foo',
      scripts: [{ name: 'bar', files: [{ path: 'path/to/file' }] }],
      rules: [{ hostname: 'example.com' }],
    };
    expect(() => readManifest(manifest)).toThrow(
      new ManifestError(err('scripts.0.files.0.inject: Required', 'rules.0.action: Required; Required; Required')),
    );
  });
  it('should validate manifest 6', () => {
    const manifest = {
      name: 'foo',
      scripts: [{ name: 'bar', files: [{ inject: true }] }],
      rules: [{ hostname: 'example.com' }],
    };
    expect(() => readManifest(manifest)).toThrow(
      new ManifestError(err('scripts.0.files.0.path: Required', 'rules.0.action: Required; Required; Required')),
    );
  });
  it('should validate manifest 7', () => {
    const manifest = {
      name: 'foo',
      scripts: [{ name: 'bar', files: [{ path: 'path/to/file', inject: true }] }],
      rules: [{ hostname: 'example.com', action: { scripts: ['asd'] } }],
    };
    expect(() => readManifest(manifest)).toThrow(new ManifestError(err('script "asd" not found')));
  });

  it('should validate manifest 8', () => {
    const manifest = {
      name: 'foo',
      scripts: [
        { name: 'bar', files: [{ path: 'path/to/file1', inject: true }] },
        { name: 'bar', files: [{ path: 'path/to/file2', inject: true }] },
      ],
      rules: [{ hostname: 'example.com', action: { scripts: ['bar'] } }],
    };
    expect(() => readManifest(manifest)).toThrow(new ManifestError(err('script "bar" is not unique')));
  });
});

// Helpers

function err(...msg: string[]): string {
  return msg.length > 1 ? msg.join('\n') + '\n' : msg[0];
}
