import database from "infra/database";

async function status(req, res) {
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
  res.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        max_connections: parseInt(maxConectionsPostgresValue),
        opened_conections: openedConectionsPostgresValue,
        version: versionPostgresValue,
      },
    },
  });
}

export default status;
