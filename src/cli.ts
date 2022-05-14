import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import proxy, { ProxyError } from './proxy';
import { Mockttp } from 'mockttp';
import { ManifestError } from './service';
import { initLogger, getLogger } from './logger';

const parse = yargs(hideBin(process.argv))
  .demandCommand()
  .command('$0 <port> <wmod>', 'Run proxy on port PORT and inject WMOD', (argv) =>
    argv
      .positional('port', {
        describe: 'Proxy port number',
        type: 'number',
        demandOption: true,
      })
      .positional('wmod', {
        describe: 'Path a directory with a wmod',
        type: 'string',
        demandOption: true,
      })
      .options({
        debug: {
          alias: 'd',
          type: 'boolean',
        },
      }),
  );

(async () => {
  const argv = await parse.argv;
  initLogger(argv.debug === true ? 'dbg' : 'info');
  const logger = getLogger();
  let server: Mockttp;
  try {
    server = await proxy(argv.port, argv.wmod);
  } catch (e) {
    if (e instanceof ManifestError || e instanceof ProxyError) {
      logger.err(e.toString());
      process.exit(1);
    } else {
      throw e;
    }
  }

  // nodemon sends SIGUSR2 to restart processes
  process.on('SIGUSR2', async function exit() {
    logger.info('Caught SIGUSR2, stopping server...');
    await server.stop();
    logger.info('Server has stopped, exiting');
    process.exit(0);
  });

  // Exit gracefully when we click Ctrl-C
  process.on('SIGINT', async function exit() {
    logger.info('Caught SIGINT, stopping server...');
    await server.stop();
    process.exit(0);
  });
})();
