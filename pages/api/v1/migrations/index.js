import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";
import authorization from "infra/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:migration"), getHandler)
  .post(controller.canRequest("create:migration"), postHandler)
  .handler(controller.errorHandlers);

async function getHandler(req, res) {
  const peddingMigrations = await migrator.listPendingMigrations();

  const authenticatedUser = req.context.user;
  const outputSecure = authorization.filterOutput(
    authenticatedUser,
    "read:migration",
    peddingMigrations,
  );

  return res.status(200).json(outputSecure);
}

async function postHandler(req, res) {
  const migratedMigrations = await migrator.runPendingMigrations();

  const authenticatedUser = req.context.user;
  const outputSecure = authorization.filterOutput(
    authenticatedUser,
    "read:migration",
    migratedMigrations,
  );

  if (migratedMigrations.length > 0) {
    return res.status(201).json(outputSecure);
  }
  return res.status(200).json(outputSecure);
}
