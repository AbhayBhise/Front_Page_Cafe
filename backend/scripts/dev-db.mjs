/**
 * Zero-config local PostgreSQL for development — a real PostgreSQL 17 server,
 * no Docker required. Keep this process running while you work.
 *
 *   node scripts/dev-db.mjs        (or: npm run db)
 *
 * Data lives in backend/.pgdata (gitignored). Delete that folder for a clean slate.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(dir, '..', '.pgdata');
const PORT = Number(process.env.DEV_DB_PORT ?? 5433);

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
  // force a UTF-8 cluster regardless of the host's Windows locale
  initdbFlags: ['--encoding=UTF8', '--no-locale'],
});

async function main() {
  const fs = await import('fs');
  const initialised = fs.existsSync(path.join(dataDir, 'PG_VERSION'));

  if (!initialised) {
    console.log('Initialising PostgreSQL cluster…');
    await pg.initialise();
  }
  await pg.start();
  console.log(`PostgreSQL running on localhost:${PORT}`);

  if (!initialised) {
    await pg.createDatabase('frontpagecafe');
    console.log('Created database "frontpagecafe"');
  }

  console.log('Ready. DATABASE_URL="postgresql://postgres:postgres@localhost:' + PORT + '/frontpagecafe"');
  console.log('Leave this running. Press Ctrl+C to stop.');

  const stop = async () => {
    console.log('\nStopping PostgreSQL…');
    await pg.stop().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
