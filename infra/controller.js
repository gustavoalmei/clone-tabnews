import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,

  UnauthorizedError,
} from "infra/errors";
import * as cookie from "cookie";
import session from "models/session";

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, req, res) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError
  ) {
    return res.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function setSessionCookie(res, sessionToken) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/", // informa qual caminho pode ter acesso ao cookie ( nesse caso todas as rotas)
    // expires: new Date(newSession.expires_at), // informa a data de expiração
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000, // informa o tempo de expiração em milisegundos
    secure: process.env.NODE_ENV === "production", // informa se o cookie deve ser enviado apenas em requisições HTTPS
    httpOnly: true, // informa se o cookie deve ser enviado apenas em requisições HTTP, um código JS não poderá acessar o cookie
  });
  res.setHeader("Set-Cookie", setCookie);
}
const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie
};
export default controller;
