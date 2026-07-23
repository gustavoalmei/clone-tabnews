import webServer from "infra/webServer";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("Running pending migrations", async () => {
        const response = await fetch(
          `${webServer.origin}/api/v1/migrations `,
          {
            method: "POST",
          },
        );

        expect(response.status).toBe(403);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          name: "ForbiddenError",
          message: "Você não tem permissão para realizar essa ação",
          action:
            "Verifique se o usuário informado possui as permissões necessárias.",
          status_code: 403,
        });
      });
    });
  });

  describe("Default user", () => {
    describe("Running pending migrations", () => {
      test("Running pending migrations", async () => {
        const createdUser = await orchestrator.createUser();
        const activatedUser = await orchestrator.activateUser(createdUser);
        const sessionUser = await orchestrator.createSession(activatedUser.id);
        const response = await fetch(
          `${webServer.origin}/api/v1/migrations`,
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${sessionUser.token}`,
            },
          },
        );

        expect(response.status).toBe(403);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          name: "ForbiddenError",
          message: "Você não tem permissão para realizar essa ação",
          action:
            "Verifique se o usuário informado possui as permissões necessárias.",
          status_code: 403,
        });
      });
    });
  });

  describe("Privileged user", () => {
    describe("Running pending migrations", () => {
      test("With `create:migration`", async () => {
        const createdUser = await orchestrator.createUser();
        const activatedUser = await orchestrator.activateUser(createdUser);
        await orchestrator.addFeaturesToUser(createdUser, ["create:migration"]);
        const sessionUser = await orchestrator.createSession(activatedUser.id);

        const response2 = await fetch(
          `${webServer.origin}/api/v1/migrations`,
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${sessionUser.token}`,
            },
          },
        );

        expect(response2.status).toBe(200);
        const responseBody2 = await response2.json();

        expect(Array.isArray(responseBody2)).toEqual(true);
        expect(responseBody2.length).toBe(0);
      });
    });
  });
});
