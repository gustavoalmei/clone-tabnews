import webServer from "infra/webServer";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Running pending migrations", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/migrations`);

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

  describe("Default user", () => {
    test("Running pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionUser = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webServer.origin}/api/v1/migrations`, {
        headers: {
          Cookie: `session_id=${sessionUser.token}`,
        },
      });

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

  describe("Privileged user", () => {
    test("Running pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(createdUser, ["read:migration"]);
      const sessionUser = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webServer.origin}/api/v1/migrations`, {
        headers: {
          Cookie: `session_id=${sessionUser.token}`,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
