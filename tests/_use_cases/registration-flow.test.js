import orchestrator from "tests/orchestrator";
import activation from "models/activation";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.clearAllEmails();
})

describe("Use case: Registration flow (All successful)", () => {
  let createUserReponseBody
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

    createUserReponseBody = await response.json();

    expect(createUserReponseBody).toEqual({
      id: createUserReponseBody.id,
      username: "userRegistrationFlow",
      email: "gustavo@almeida.com",
      password: createUserReponseBody.password,
      features: ["read:activation_token"],
      create_at: createUserReponseBody.create_at,
      updated_at: createUserReponseBody.updated_at,
    });
  })

  test("Receive confirmation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    const activationToken = await activation.findOneByUserId(createUserReponseBody.id)

    expect(lastEmail.sender).toBe("<fininfo@tabnews.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro na Fininfo");
    expect(lastEmail.recipients[0]).toBe("<gustavo@almeida.com>");
    expect(lastEmail.text).toContain("userRegistrationFlow");
    expect(lastEmail.text).toContain(activationToken.id);


  })

  test("Active account", async () => {

  })

  test("Login", async () => {

  })
});