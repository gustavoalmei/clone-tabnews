import database from "infra/database";

beforeAll(clearDatabase);

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

["DELETE", "HEAD", "PUT", "PATCH", "OPTIONS"].forEach((method) => {
  test(`${method} /api/v1/migrations returns error and does not leak db connection`, async () => {
    const response = await fetch("http://localhost:3000/api/v1/migrations", {
      method,
    });

    expect(response.status).toBe(405);

    const returnStatus = await fetch("http://localhost:3000/api/v1/status");
    const returnStatusJson = await returnStatus.json();

    expect(returnStatusJson.dependencies.database.opened_conections).toBe(1);
  });
});
