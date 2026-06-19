import { createRouter } from "next-connect";
import controller from "infra/controller";
import session from "models/session";
import user from "models/user";
import authorization from "infra/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const currentUser = req.context.user
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const sessionRenewed = await session.renew(sessionObject.id);
  controller.setSessionCookie(res, sessionRenewed.token);

  const userFound = await user.findOneById(sessionObject.user_id);

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  // Definir o cabeçalho Cache-Control para evitar o cache no nevagador
  // o no-cache evita o cache no navegador
  // o no-store evita o cache no servidor
  // o max-age=0 evita o cache no navegador
  // o must-revalidate evita o cache no navegador

  const outputSecure = authorization.filterOutput(currentUser, "read:user:self", userFound);
  return res.status(200).json(outputSecure);
}
