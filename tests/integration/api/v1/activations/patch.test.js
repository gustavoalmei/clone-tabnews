import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import user from "models/user";
import actvation from "models/activation";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent token", async () => {
      const response2 = await fetch(
        "http://localhost:3000/api/v1/activations/fac0a630-ef28-4b10-9265-c9639e26a2f2",
        {
          method: "PATCH",
        },
      );

      expect(response2.status).toBe(404);
      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "NotFoundError",
        action: "Faça um novo cadastro.",
        message: "O token de ativação não foi encontrado ou expirou.",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - actvation.EXPIRATION_ON_MILISECONDS),
      })

      const userCreate = await orchestrator.createUser()
      const expiredInvalidToken = await actvation.create(userCreate.id)

      jest.useRealTimers()

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredInvalidToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);
      const responseBody2 = await response.json();
      expect(responseBody2).toEqual({
        name: "NotFoundError",
        action: "Faça um novo cadastro.",
        message: "O token de ativação não foi encontrado ou expirou.",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const userCreate = await orchestrator.createUser()
      const expiredInvalidToken = await actvation.create(userCreate.id)

      const response1 = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredInvalidToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response1.status).toBe(200);
      const responseBody = await response1.json();
      expect(responseBody).toEqual({
        create_at: responseBody.create_at,
        expires_at: responseBody.expires_at,
        updated_at: responseBody.updated_at,
        used_at: responseBody.used_at,
        user_id: responseBody.user_id,
        id: responseBody.id,
      });

      const response2 = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredInvalidToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response2.status).toBe(404);
      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "NotFoundError",
        action: "Faça um novo cadastro.",
        message: "O token de ativação não foi encontrado ou expirou.",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const userCreate = await orchestrator.createUser()
      const expiredInvalidToken = await actvation.create(userCreate.id)

      const response1 = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredInvalidToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response1.status).toBe(200);
      const responseBody = await response1.json();
      expect(responseBody).toEqual({
        create_at: responseBody.create_at,
        expires_at: responseBody.expires_at,
        updated_at: responseBody.updated_at,
        used_at: responseBody.used_at,
        user_id: responseBody.user_id,
        id: responseBody.id,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.create_at);
      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);
      expect(expiresAt - createdAt).toBe(actvation.EXPIRATION_ON_MILISECONDS);

      const activatedUser = await user.findOneById(responseBody.user_id);
      expect(activatedUser.features).toEqual(["create:session", "read:session"]);
    });
  });

  describe("Default user", () => {
    test("With valid token, but already logged in user", async () => {
      const user1 = await orchestrator.createUser()
      await orchestrator.activateUser(user1)
      const sessionUser1 = await orchestrator.createSession(user1.id)


      const user2 = await orchestrator.createUser()
      const actvationUser2 = await actvation.create(user2.id)

      const user2Activation = await fetch(
        `http://localhost:3000/api/v1/activations/${actvationUser2.id}`,
        {
          method: "PATCH",
          headers: {
            cookie: `session_id = ${sessionUser1.token}`,
          },
        },
      );

      expect(user2Activation.status).toBe(403);
      const responseUser2Activation = await user2Activation.json();
      expect(responseUser2Activation).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para realizar essa ação",
        action: "Verifique se o usuário informado possui as permissões necessárias.",
        status_code: 403,
      });
    });
  });
});
