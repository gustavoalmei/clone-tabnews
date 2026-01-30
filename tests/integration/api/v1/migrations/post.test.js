import database from "infra/database";

beforeAll(clearDatabase);

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}
test("POST to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  expect(response.status).toBe(201);
  const responseBody = await response.json();

  expect(Array.isArray(responseBody)).toEqual(true);
  expect(responseBody.length).toBeGreaterThan(0);

  const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  expect(response2.status).toBe(200);
  const responseBody2 = await response2.json();

  expect(Array.isArray(responseBody2)).toEqual(true);
  expect(responseBody2.length).toBe(0);

  const migrationsRows = await database.query(
    "SELECT * FROM public.pgmigrations",
  );
  expect(responseBody.length).toBe(migrationsRows.rows.length);
});
