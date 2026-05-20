import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import session from "models/session.js";
import * as cookie from "cookie";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize("session_id", newSession.token, {
    path: "/", // informa qual caminho pode ter acesso ao cookie ( nesse caso todas as rotas)
    // expires: new Date(newSession.expires_at), // informa a data de expiração
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000, // informa o tempo de expiração em milisegundos
    secure: process.env.NODE_ENV === "production", // informa se o cookie deve ser enviado apenas em requisições HTTPS
    httpOnly: true, // informa se o cookie deve ser enviado apenas em requisições HTTP, um código JS não poderá acessar o cookie
  });
  res.setHeader("Set-Cookie", setCookie);

  return res.status(201).json(newSession);
}
