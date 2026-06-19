import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";
import authorization from "infra/authorization";

const router = createRouter();

// router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

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
    return res.status(201).json(migratedMigrations);
  }
  return res.status(200).json(migratedMigrations);
}
