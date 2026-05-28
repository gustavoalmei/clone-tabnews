import { createRouter } from "next-connect";
import controller from "infra/controller";
import session from "models/session";
import user from "models/user";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const sessionRenewed = await session.renew(sessionObject.id);
  controller.setSessionCookie(res, sessionRenewed.token);

  const userFound = await user.findOneById(sessionObject.user_id);

  res.setHeader("Cache-Control", "no-cache no-store, max-age=0, must-revalidate")
  // Definir o cabeçalho Cache-Control para evitar o cache no nevagador
  // o no-cache evita o cache no navegador
  // o no-store evita o cache no servidor
  // o max-age=0 evita o cache no navegador
  // o must-revalidate evita o cache no navegador

  return res.status(200).json(userFound);
}
