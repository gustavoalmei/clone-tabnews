import { InternalServerError } from "./errors";

const availableFeatures = [
  // USER
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",

  // SESSION
  "create:session",
  "read:session",

  // ACTIVATION_TOKEN
  "read:activation_token",

  // MIGRATION
  "create:migration",
  "read:migration",

  // STATUS
  "read:status",
  "read:status:all",
];

function can(user, feature, resource) {
  validationUser(user)
  validationFeatures(feature)

  let authorization = false;

  if (user?.features.includes(feature)) {
    authorization = true
  }

  if (feature === "update:user" && resource) {
    authorization = false

    if (user.id === resource.id || can(user, 'update:user:others')) {
      authorization = true
    }
  }

  return authorization
}

function filterOutput(user, feature, resource) {
  validationUser(user)
  validationFeatures(feature)
  validateResource(resource)

  if (feature === 'read:user') {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      create_at: resource.create_at,
      updated_at: resource.updated_at
    }
  }

  if (feature === 'read:user:self') {
    if (user.id === resource.id) {
      return {
        id: resource.id,
        username: resource.username,
        email: resource.email,
        features: resource.features,
        create_at: resource.create_at,
        updated_at: resource.updated_at
      }
    }
  }

  if (feature === 'read:session') {
    if (user.id === resource.user_id) {
      return {
        id: resource.id,
        token: resource.token,
        user_id: resource.user_id,
        create_at: resource.create_at,
        updated_at: resource.updated_at,
        expires_at: resource.expires_at
      }
    }
  }

  if (feature === 'read:activation_token') {
    return {
      id: resource.id,
      user_id: resource.user_id,
      create_at: resource.create_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
      used_at: resource.used_at
    }
  }

  if (feature === 'read:status') {
    if (can(user, 'read:status:all')) {
      return {
        updated_at: resource.updatedAt,
        dependencies: {
          database: {
            max_connections: parseInt(resource.maxConectionsPostgresValue),
            opened_conections: resource.openedConectionsPostgresValue,
            version: resource.versionPostgresValue,
          },
        },
      }
    }

    return {
      updated_at: resource.updatedAt,
      dependencies: {
        database: {
          max_connections: parseInt(resource.maxConectionsPostgresValue),
          opened_conections: resource.openedConectionsPostgresValue,
        },
      },
    }
  }

  if (feature === 'read:migration') {
    return resource.map(migration => {
      return {
        path: migration.path,
        name: migration.status,
        timestamp: migration.timestamp
      }
    })
  }
}

function validationUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer `user` no model `authorization`.",
    });
  }
}

function validationFeatures(feature) {
  if (!feature || !availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause: "É necessário fornecer uma feature válida.",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer um `resource`.",
    });
  }
}

const authorization = {
  can,
  filterOutput
}

export default authorization