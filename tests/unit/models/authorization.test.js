import authorization from "infra/authorization";
import { InternalServerError } from "infra/errors.js";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("withou user", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without features", () => {
      expect(() => {
        const createUser = {
          username: "username",
        };
        authorization.can(createUser);
      }).toThrow(InternalServerError);
    });

    test("With unknown feature", () => {
      expect(() => {
        const createUser = {
          features: [],
        };
        authorization.can(createUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("With valid user and known feature", () => {
      const createUser = {
        features: ["create:user"],
      };
      expect(authorization.can(createUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("withou user", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without features", () => {
      expect(() => {
        const createUser = {
          username: "username",
        };
        authorization.filterOutput(createUser);
      }).toThrow(InternalServerError);
    });

    test("With unknown feature", () => {
      expect(() => {
        const createUser = {
          features: [],
        };
        authorization.filterOutput(createUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` but no `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };

      const resource = {
        id: 1,
        username: "resource",
        features: ["read:user"],
        create_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        email: "resource@resource.com",
        password: "resource",
      };

      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        create_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });
  });
});
