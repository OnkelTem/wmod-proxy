import { initLogger } from './logger';
import proxy from './proxy';

const delay = (n: number) => new Promise((r) => setTimeout(r, n));

describe('Proxy', () => {
  initLogger('info');
  it('should start the server', async () => {
    const server = await proxy(8000, `test/fixtures/example1`);
    await delay(1000);
    await server.stop();
  });
});
