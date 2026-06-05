import database from "infra/database";
import email from "infra/email"
import { NotFoundError } from "infra/errors";
import webServer from "infra/webServer";

const EXPIRATION_ON_MILISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_ON_MILISECONDS);
  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      ;`,
      values: [userId, expiresAt],
    });
    return result.rows[0];
  }
}

async function findOneByTokenId(tokenId) {
  const result = await insertQuery(tokenId);
  return result;

  async function insertQuery(tokenId) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT
        1
      ;`,
      values: [tokenId],
    });
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O token de ativação não foi encontrado ou expirou.",
        action: "Faça um novo cadastro.",
        status_code: 401,
      });
    }
    return result.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Fininfo <fininfo@tabnews.com>",
    to: user.email,
    subject: "Ative seu cadastro na Fininfo",
    text: `Olá ${user.username}, clique no link abaixo para ativar a sua conta:

${webServer.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Fininfo
`,
  })
}

const actvation = {
  sendEmailToUser,
  create,
  findOneByTokenId
}

export default actvation