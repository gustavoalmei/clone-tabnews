import session from "models/session";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import webServer from "infra/webServer";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("With valid session", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/user`);

      expect(response.status).toBe(403);

      const responseBody2 = await response.json();

      expect(responseBody2).toEqual({
        message: "Você não tem permissão para realizar essa ação",
        action:
          "Verifique se o usuário informado possui as permissões necessárias.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("With valid session", async () => {
      const createUser = await orchestrator.createUser({
        username: "userWithValidSession",
      });

      const sessionObject = await orchestrator.createSession(createUser);

      const activateUser = await orchestrator.activateUser(createUser);

      const response2 = await fetch(`${webServer.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response2.status).toBe(200);

      const cacheControl = response2.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        id: createUser.id,
        username: "userWithValidSession",
        email: createUser.email,
        features: ["create:session", "read:session", "update:user"],
        create_at: createUser.create_at.toISOString(),
        updated_at: activateUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody2.id)).toBe(4);
      expect(Date.parse(responseBody2.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody2.updated_at)).not.toBeNaN();

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true,
      );
      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true,
      );

      const parsedSetCookie = setCookieParser(response2, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        sameSite: "Lax",
        httpOnly: true,
      });
    });

    test("With noexistent session", async () => {
      const response2 = await fetch(`${webServer.origin}/api/v1/user`, {
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

      const sessionObject = await orchestrator.createSession(createUser);

      jest.useRealTimers();

      const response2 = await fetch(`${webServer.origin}/api/v1/user`, {
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

    test("With when the session is less than 1 minute to expire", async () => {
      jest.useFakeTimers({
        now: new Date(
          Date.now() - (session.EXPIRATION_IN_MILLISECONDS - 60 * 1000),
        ),
      });

      const createUser = await orchestrator.createUser({
        username: "userWithSessionToExpire",
      });

      const activateUser = await orchestrator.activateUser(createUser);
      const sessionObject = await orchestrator.createSession(createUser);

      jest.useRealTimers();

      const response2 = await fetch(`${webServer.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response2.status).toBe(200);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        id: createUser.id,
        username: "userWithSessionToExpire",
        email: createUser.email,
        features: ["create:session", "read:session", "update:user"],
        create_at: createUser.create_at.toISOString(),
        updated_at: activateUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody2.id)).toBe(4);
      expect(Date.parse(responseBody2.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody2.updated_at)).not.toBeNaN();

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true,
      );
      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true,
      );

      const parsedSetCookie = setCookieParser(response2, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        sameSite: "Lax",
        httpOnly: true,
      });
    });
  });
});
