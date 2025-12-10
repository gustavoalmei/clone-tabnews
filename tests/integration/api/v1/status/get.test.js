test("GET to /api/v1/status should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");

  expect(response.status).toBe(200);

  const responsyBody = await response.json();

  const parsedDate = new Date(responsyBody.updated_at).toISOString();
  expect(responsyBody.updated_at).toBe(parsedDate);
  expect(responsyBody.dependencies.database.version).toEqual("16.11");
  expect(responsyBody.dependencies.database.max_connections).toEqual(100);
  expect(responsyBody.dependencies.database.opened_conections).toEqual(1);
  console.log(responsyBody);
});
