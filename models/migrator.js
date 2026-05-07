import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";

const DefaultMigrations = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  log: () => { },
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const peddingMigrations = await migrationRunner({
      ...DefaultMigrations,
      dbClient,
    });
    return peddingMigrations;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...DefaultMigrations,
      dbClient,
      dryRun: false,
    });
    return migratedMigrations;
  } finally {
    await dbClient.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
