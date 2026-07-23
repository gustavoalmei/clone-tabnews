import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "infra/errors";
import * as cookie from "cookie";
import session from "models/session";
import user from "models/user";
import authorization from "./authorization";

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, req, res) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return res.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(res);
    return res.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function setSessionCookie(res, sessionToken) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/", // informa qual caminho pode ter acesso ao cookie ( nesse caso todas as rotas)
    // expires: new Date(newSession.expires_at), // informa a data de expiração
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000, // informa o tempo de expiração em milisegundos
    secure: process.env.NODE_ENV === "production", // informa se o cookie deve ser enviado apenas em requisições HTTPS
    httpOnly: true, // informa se o cookie deve ser enviado apenas em requisições HTTP, um código JS não poderá acessar o cookie
    sameSite: "lax",
  });
  res.setHeader("Set-Cookie", setCookie);
}
function clearSessionCookie(res) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/", // informa qual caminho pode ter acesso ao cookie ( nesse caso todas as rotas)
    // expires: new Date(newSession.expires_at), // informa a data de expiração
    maxAge: -1, // informa o tempo de expiração em milisegundos
    secure: process.env.NODE_ENV === "production", // informa se o cookie deve ser enviado apenas em requisições HTTPS
    httpOnly: true, // informa se o cookie deve ser enviado apenas em requisições HTTP, um código JS não poderá acessar o cookie
  });
  res.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(req, res, next) {
  if (req.cookies?.session_id) {
    await injectAuthenticatedUser(req);
    return next();
  }

  injectAnonymousUser(req);
  return next();
}

async function injectAuthenticatedUser(req) {
  const sessionToken = req.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  req.context = {
    ...req.context,
    user: userObject,
  };
}

function injectAnonymousUser(req) {
  const anonymousUser = {
    features: ["read:activation_token", "create:session", "create:user"],
  };
  req.context = {
    ...req.context,
    user: anonymousUser,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(req, res, next) {
    const userRequest = req.context?.user;
    if (authorization.can(userRequest, feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "Você não tem permissão para realizar essa ação",
      action:
        "Verifique se o usuário informado possui as permissões necessárias.",
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};
export default controller;
