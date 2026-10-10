/* eslint-disable @typescript-eslint/no-require-imports */
const EmbeddedPostgres = require("embedded-postgres").default || require("embedded-postgres");
const path = require("path");
const fs = require("fs");

async function start() {
  const dbPath = path.join(__dirname, "..", ".db-data");
  const pg = new EmbeddedPostgres({
    databaseDir: dbPath,
    port: 5432,
    user: "postgres",
    password: "postgres",
    persistent: true,
    // UTF-8 regardless of the OS locale (Windows would otherwise pick WIN1252,
    // which rejects emoji and non-Latin text). The builtin C.UTF-8 locale keeps
    // case-insensitive search Unicode-aware.
    initdbFlags: [
      "--encoding=UTF8",
      "--locale=C",
      "--locale-provider=builtin",
      "--builtin-locale=C.UTF-8",
    ],
  });

  // Only run initdb on a fresh data directory; reuse existing data otherwise.
  if (fs.existsSync(path.join(dbPath, "PG_VERSION"))) {
    console.log("Existing PostgreSQL data directory found, reusing it.");
  } else {
    console.log("Initialising new PostgreSQL data directory...");
    await pg.initialise();
  }
  console.log("Starting PostgreSQL on port 5432...");
  await pg.start();
  console.log("PostgreSQL started successfully.");

  try {
    await pg.createDatabase("expense_tracker");
    console.log("Database 'expense_tracker' ready.");
  } catch (err) {
    if (err.message && err.message.includes("already exists")) {
      console.log("Database 'expense_tracker' already exists.");
    } else {
      console.log("Database note:", err.message);
    }
  }

  await warnIfNotUtf8(pg);

  console.log("PostgreSQL is running and ready for connections!");

  // Keep process alive if run directly
  process.on("SIGINT", async () => {
    console.log("Stopping PostgreSQL...");
    await pg.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    console.log("Stopping PostgreSQL...");
    await pg.stop();
    process.exit(0);
  });
}

/**
 * Data directories created before UTF-8 was enforced may use WIN1252. Warn
 * instead of converting automatically, so no existing data is touched.
 */
async function warnIfNotUtf8(pg) {
  const client = pg.getPgClient("expense_tracker");
  try {
    await client.connect();
    const { rows } = await client.query(
      "SELECT pg_encoding_to_char(encoding) AS encoding FROM pg_database WHERE datname = current_database()"
    );
    const encoding = rows[0] && rows[0].encoding;
    if (encoding && encoding !== "UTF8") {
      console.warn(
        `\n⚠️  Database 'expense_tracker' uses ${encoding} encoding, so emoji and non-Latin text cannot be saved.\n` +
          "   To switch to UTF-8 (see README, 'Database lokal & encoding'):\n" +
          "   1. Stop this process and rename .db-data (keep it as a backup).\n" +
          "   2. Run npm run db:start again to create a UTF-8 data directory.\n" +
          "   3. Run npm run db:deploy (and npm run seed if you want the demo account).\n"
      );
    }
  } catch (err) {
    console.log("Could not check database encoding:", err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

start().catch((err) => {
  console.error("Failed to start PostgreSQL:", err);
  process.exit(1);
});
