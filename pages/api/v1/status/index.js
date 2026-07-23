import { createRouter } from "next-connect";
import database from "infra/database";
import controller from "infra/controller";
import authorization from "infra/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const updatedAt = new Date().toISOString();

  const versionPostgres = await database.query("show server_version;");
  const versionPostgresValue = versionPostgres.rows[0].server_version;
  const maxConectionsPostgres = await database.query("show max_connections;");
  const maxConectionsPostgresValue =
    maxConectionsPostgres.rows[0].max_connections;
  const dataBaseName = process.env.POSTGRES_DB;
  const openedConectionsPostgres = await database.query({
    text: "select count(*)::int from pg_stat_activity where datname = $1;",
    values: [dataBaseName],
  });
  const openedConectionsPostgresValue = openedConectionsPostgres.rows[0].count;

  const authenticatedUser = req.context?.user;
  const outputSecure = authorization.filterOutput(
    authenticatedUser,
    "read:status",
    {
      updatedAt,
      versionPostgresValue,
      maxConectionsPostgresValue,
      openedConectionsPostgresValue,
    },
  );
  return res.status(200).json(outputSecure);
}
