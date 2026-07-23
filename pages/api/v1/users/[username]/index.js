import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import authorization from "infra/authorization";
import { ForbiddenError } from "infra/errors";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(req, res) {
  const { username } = req.query;
  const userTryGet = req.context.user;
  const foundUser = await user.findOneByUsername(username);
  const outputSecure = authorization.filterOutput(
    userTryGet,
    "read:user",
    foundUser,
  );
  return res.status(200).json(outputSecure);
}

async function patchHandler(req, res) {
  const { username } = req.query;
  const userInputValues = req.body;

  const currentUser = req.context.user;
  const resource = await user.findOneByUsername(username);

  if (!authorization.can(currentUser, "update:user", resource)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para realizar essa ação",
      action:
        "Verifique se você possui a feature necessária para realizar essa ação.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);
  const outputSecure = authorization.filterOutput(
    currentUser,
    "read:user",
    updatedUser,
  );

  return res.status(200).json(outputSecure);
}
