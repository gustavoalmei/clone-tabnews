import session from "models/session";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With noexistent session", async () => {
      const response2 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=7ffb3ff2-bafc-4768-b98d-9972eacb6747`,
        },
      });

      expect(response2.status).toBe(401);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });
      const createUser = await orchestrator.createUser({
        username: "userWithExpiredSession",
      });

      const sessionObject = await orchestrator.createSession(createUser.id);

      jest.useRealTimers();

      const response2 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response2.status).toBe(401);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    test("With valid session", async () => {
      const createUser = await orchestrator.createUser({
        username: "userWithValidSession",
      });

      const sessionObject = await orchestrator.createSession(createUser.id);

      const response2 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response2.status).toBe(401);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        id: responseBody2.id,
        token: responseBody2.token,
        user_id: sessionObject.user_id,
        expires_at: responseBody2.expires_at,
        create_at: responseBody2.create_at,
        updated_at: responseBody2.updated_at,
      });

      expect(uuidVersion(responseBody2.id)).toBe(4);
      expect(Date.parse(responseBody2.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody2.updated_at)).not.toBeNaN();

      expect(
        responseBody2.expires_at < sessionObject.expires_at.toISOString(),
      ).toBe(true);
      expect(
        responseBody2.updated_at > sessionObject.updated_at.toISOString(),
      ).toBe(true);

      const parsedSetCookie = setCookieParser(response2, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        maxAge: -1,
        path: "/",
        httpOnly: true,
        value: "invalid",
      });

      // Double check
      const doubleCheck = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(doubleCheck.status).toBe(401);

      const responseBody3 = await doubleCheck.json();

      expect(responseBody3).toEqual({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });
  });
});
