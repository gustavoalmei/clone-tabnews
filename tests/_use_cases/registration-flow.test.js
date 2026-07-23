import orchestrator from "tests/orchestrator";
import activation from "models/activation";
import user from "models/user";
import webServer from "infra/webServer";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.clearAllEmails();
});

describe("Use case: Registration flow (All successful)", () => {
  let createUserReponseBody;
  let foundUserBasedOnToken;
  let userObjectSession;

  test("Create user account", async () => {
    const response = await fetch(`${webServer.origin}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "userRegistrationFlow",
        email: "gustavo@almeida.com",
        password: "password123",
      }),
    });

    expect(response.status).toBe(201);

    createUserReponseBody = await response.json();

    expect(createUserReponseBody).toEqual({
      id: createUserReponseBody.id,
      username: "userRegistrationFlow",
      features: ["read:activation_token"],
      create_at: createUserReponseBody.create_at,
      updated_at: createUserReponseBody.updated_at,
    });
  });

  test("Receive confirmation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<fininfo@fininfos.com.br>");
    expect(lastEmail.subject).toBe("Ative seu cadastro na Fininfo");
    expect(lastEmail.recipients[0]).toBe("<gustavo@almeida.com>");
    expect(lastEmail.text).toContain("userRegistrationFlow");
    const regex = /http[s]?\s*:\/\/.*\/cadastro\/ativar\/([A-Z-a-z-0-9]+)/;

    const tokenId = lastEmail.text.match(regex)[1];
    foundUserBasedOnToken = await activation.findOneByTokenId(tokenId);
    expect(foundUserBasedOnToken.user_id).toBe(createUserReponseBody.id);
  });

  test("Active account", async () => {
    const activateUser = await fetch(
      `${webServer.origin}/api/v1/activations/${foundUserBasedOnToken.id}`,
      { method: "PATCH" },
    );

    expect(activateUser.status).toBe(200);

    const responseBody = await activateUser.json();
    expect(Date.parse(responseBody.used_at)).not.toBeNaN();

    const findUserById = await user.findUserByUsername(
      createUserReponseBody.username,
    );
    expect(findUserById.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const request = await fetch(`${webServer.origin}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "gustavo@almeida.com",
        password: "password123",
      }),
    });

    expect(request.status).toBe(201);
    const response = await request.json();
    expect(response.user_id).toBe(createUserReponseBody.id);
    userObjectSession = response;
  });

  test("Get user information", async () => {
    const response = await fetch(`${webServer.origin}/api/v1/user`, {
      headers: {
        "Content-Type": "application/json",
        cookie: `session_id = ${userObjectSession.token}`,
      },
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.id).toBe(createUserReponseBody.id);
  });
});
