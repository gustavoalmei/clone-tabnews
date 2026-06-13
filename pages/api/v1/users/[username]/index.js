import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import authorization from "infra/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const { username } = req.query;
  const foundUser = await user.findOneByUsername(username);
  return res.status(200).json(foundUser);
}

async function patchHandler(req, res) {
  const { username } = req.query;
  const userInputValues = req.body;

  const currentUser = req.context.user
  const resource = await user.findOneByUsername(username);

  if (!authorization.can(currentUser, "update:user", resource)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para realizar essa ação",
      action: "Verifique se você possui a feature necessária para realizar essa ação.",
    });
  }
  const updatedUser = await user.update(username, userInputValues);
  return res.status(200).json(updatedUser);
}
