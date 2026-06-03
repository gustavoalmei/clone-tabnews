import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.clearAllEmails();
})

describe("Use case: Registration flow (All successful)", () => {
  test("Create user account", async () => {
    const response = await fetch("http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "userRegistrationFlow",
          email: "gustavo@almeida.com",
          password: "password123",
        })
      });

    expect(response.status).toBe(201);

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      id: responseBody.id,
      username: "userRegistrationFlow",
      email: "gustavo@almeida.com",
      password: responseBody.password,
      features: ["read:activation_token"],
      create_at: responseBody.create_at,
      updated_at: responseBody.updated_at,
    });

  })

  test("Receive confirmation email", async () => {

  })

  test("Active account", async () => {

  })

  test("Login", async () => {

  })
});