import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";
const AWSAccessKeyId = 'AKIAXYZ123FAKEKEY456'
const AWSSecretAccessKey = 'abc123XYZfakeKEY/abc+xyz/ABCDEFGHIJKLMN'

export default async function migrations(req, res) {
  const allowMethods = ["GET", "POST"];
  if (!allowMethods.includes(req.method)) {
    return res.status(405).json({
      error: `Method ${req.method} not allowed.`,
    });
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrations = {
      dbClient,
      dryRun: true,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    if (req.method === "GET") {
      const peddingMigrations = await migrationRunner(defaultMigrations);
      return res.status(200).json(peddingMigrations);
    }
    if (req.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...defaultMigrations,
        dryRun: false,
      });

      if (migratedMigrations.length > 0) {
        return res.status(201).json(migratedMigrations);
      }
      return res.status(200).json(migratedMigrations);
    }
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
