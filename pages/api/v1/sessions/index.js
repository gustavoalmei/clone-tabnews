import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import session from "models/session.js";

const router = createRouter();

router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(res, newSession.token);

  return res.status(201).json(newSession);
}

async function deleteHandler(req, res) {
  const cookieSession = req.cookies.session_id;
  const findSession = await session.findOneValidByToken(cookieSession);

  const clearSession = await session.expireById(findSession.id);

  controller.clearSessionCookie(res);

  return res.status(401).json(clearSession)
}
