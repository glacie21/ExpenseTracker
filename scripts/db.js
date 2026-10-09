const EmbeddedPostgres = require("embedded-postgres").default || require("embedded-postgres");
const path = require("path");

async function start() {
  const dbPath = path.join(__dirname, "..", ".db-data");
  const pg = new EmbeddedPostgres({
    databaseDir: dbPath,
    port: 5432,
    user: "postgres",
    password: "postgres",
    persistent: true,
  });

  console.log("Checking / initialising PostgreSQL database...");
  await pg.initialise();
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

start().catch((err) => {
  console.error("Failed to start PostgreSQL:", err);
  process.exit(1);
});
