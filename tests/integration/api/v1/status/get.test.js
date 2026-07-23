import webServer from "infra/webServer";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Running current system status", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/status`);

      expect(response.status).toBe(200);

      const responsyBody = await response.json();

      const parsedDate = new Date(responsyBody.updated_at).toISOString();
      expect(responsyBody.updated_at).toBe(parsedDate);
      expect(responsyBody.dependencies.database.version).toBeUndefined();
      expect(responsyBody.dependencies.database.max_connections).toEqual(100);
      expect(responsyBody.dependencies.database.opened_conections).toEqual(1);
    });
  });

  describe("Default user", () => {
    test("Running current system status", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/status`);

      expect(response.status).toBe(200);

      const responsyBody = await response.json();

      const parsedDate = new Date(responsyBody.updated_at).toISOString();
      expect(responsyBody.updated_at).toBe(parsedDate);
      expect(responsyBody.dependencies.database.version).toBeUndefined();
      expect(responsyBody.dependencies.database.max_connections).toEqual(100);
      expect(responsyBody.dependencies.database.opened_conections).toEqual(1);
    });
  });

  describe("Previleged user", () => {
    test("Running current system status", async () => {
      const userPrivileged = await orchestrator.createUser();
      await orchestrator.activateUser(userPrivileged);
      await orchestrator.addFeaturesToUser(userPrivileged, ["read:status:all"]);
      const userPrivilegedSession = await orchestrator.createSession(
        userPrivileged.id,
      );

      const response = await fetch(`${webServer.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${userPrivilegedSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responsyBody = await response.json();

      const parsedDate = new Date(responsyBody.updated_at).toISOString();
      expect(responsyBody.updated_at).toBe(parsedDate);
      expect(responsyBody.dependencies.database.version).toEqual("16.11");
      expect(responsyBody.dependencies.database.max_connections).toEqual(100);
      expect(responsyBody.dependencies.database.opened_conections).toEqual(1);
    });
  });
});
