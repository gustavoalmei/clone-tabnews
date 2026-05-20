import { UnauthorizedError, NotFoundError } from "infra/errors";
import user from "./user";
import password from "./password";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    }
    throw error;
  }

  async function findUserByEmail(providedEmail) {
    let storedUser;

    try {
      storedUser = await user.findOneByEmail(providedEmail);
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "E-mail não conferem.",
          action: "Verifique se o este dado está correto.",
        });
      }
      throw err;
    }

    return storedUser;
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se o dado está correto.",
      });
    }
  }
}
const authentication = {
  getAuthenticatedUser,
};

export default authentication;
