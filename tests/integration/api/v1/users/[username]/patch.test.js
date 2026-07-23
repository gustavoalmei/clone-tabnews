import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import user from "models/user";
import password from "models/password";
import webServer from "infra/webServer";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent username", async () => {
      const response2 = await fetch(
        `${webServer.origin}/api/v1/users/usuarioInexistente`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(response2.status).toBe(403);
      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        action:
          "Verifique se o usuário informado possui as permissões necessárias.",
        message: "Você não tem permissão para realizar essa ação",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent username", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionUser = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webServer.origin}/api/v1/users/usuarioInexistente`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionUser.token}`,
          },
        },
      );

      expect(response.status).toBe(404);
      const responseBody2 = await response.json();
      expect(responseBody2).toEqual({
        action: "Verifique se o nome de usuário está digitado corretamente.",
        message: "Usuário não encontrado.",
        name: "NotFoundError",
        status_code: 404,
      });
    });

    test("With duplicated `username`", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });
      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionUser2 = await orchestrator.createSession(activatedUser2);

      const user2Duplicated = await fetch(
        `${webServer.origin}/api/v1/users/${activatedUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionUser2.token}`,
          },
          body: JSON.stringify({
            username: "user1",
          }),
        },
      );

      expect(user2Duplicated.status).toBe(400);
      const responseBody2Duplicated = await user2Duplicated.json();
      expect(responseBody2Duplicated).toEqual({
        action: "Utilize outro nome de usuário para realizar esta operação.",
        message: "O nome de usuário informado já está sendo utilizado.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("With `userB` target `userA", async () => {
      const createdUser1 = await orchestrator.createUser({
        username: "userA",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "userB",
      });
      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionUser2 = await orchestrator.createSession(activatedUser2);

      const user2Duplicated = await fetch(
        `${webServer.origin}/api/v1/users/${createdUser1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionUser2.token}`,
          },
          body: JSON.stringify({
            username: "userC",
          }),
        },
      );

      expect(user2Duplicated.status).toBe(403);
      const responseBody2Duplicated = await user2Duplicated.json();
      expect(responseBody2Duplicated).toEqual({
        action:
          "Verifique se você possui a feature necessária para realizar essa ação.",
        message: "Você não tem permissão para realizar essa ação",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With duplicated `email`", async () => {
      await orchestrator.createUser({
        email: "email1@email.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@email.com",
      });
      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionUser2 = await orchestrator.createSession(activatedUser2);

      const email2Duplicated = await fetch(
        `${webServer.origin}/api/v1/users/${activatedUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionUser2.token}`,
          },
          body: JSON.stringify({
            email: "email1@email.com",
          }),
        },
      );

      expect(email2Duplicated.status).toBe(400);
      const responseBody2Duplicated = await email2Duplicated.json();
      expect(responseBody2Duplicated).toEqual({
        action: "Utilize outro email para realizar esta operação.",
        message: "O email informado já está sendo utilizado.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("With unique `username`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionUser = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webServer.origin}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionUser.token}`,
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser2",
        features: ["create:session", "read:session", "update:user"],
        create_at: responseBody.create_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.create_at).toBe(true);
    });

    test("With unique `email`", async () => {
      const createdUser = await orchestrator.createUser({
        email: "uniqueEmail1@user.com",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionUser = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webServer.origin}/api/v1/users/${activatedUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionUser.token}`,
          },
          body: JSON.stringify({
            email: "uniqueEmail2@user.com",
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        features: ["create:session", "read:session", "update:user"],
        create_at: responseBody.create_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.create_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(
        responseBody.username,
      );
      expect(userInDatabase.email).toBe("uniqueEmail2@user.com");
    });

    test("With new `password`", async () => {
      const createdUser = await orchestrator.createUser({
        password: "password123",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionUser = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webServer.origin}/api/v1/users/${activatedUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionUser.token}`,
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        features: ["create:session", "read:session", "update:user"],
        create_at: responseBody.create_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.create_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      const correctPasswordMatch = await password.compare(
        "newPassword2",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "newPassword1",
        userInDatabase.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("Previleged user", () => {
    test("With `update:user:ohers` target `defaultUser", async () => {
      const previlegedUser = await orchestrator.createUser();
      const activatedPrevilegedUser =
        await orchestrator.activateUser(previlegedUser);
      await orchestrator.addFeaturesToUser(previlegedUser, [
        "update:user:others",
      ]);
      const sessionPrevilegedUser = await orchestrator.createSession(
        activatedPrevilegedUser,
      );

      const defaultUser = await orchestrator.createUser();

      const response = await fetch(
        `${webServer.origin}/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionPrevilegedUser.token}`,
          },
          body: JSON.stringify({
            username: "AlteradorPorPrivilegedUser",
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "AlteradorPorPrivilegedUser",
        features: responseBody.features,
        create_at: responseBody.create_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.create_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.create_at).toBe(true);
    });
  });
});
