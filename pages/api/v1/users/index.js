import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import activation from "models/activation.js";
import authorization from "infra/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("create:user"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const currentUser = req.context.user;
  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const outputSecure = authorization.filterOutput(
    currentUser,
    "read:user",
    newUser,
  );
  return res.status(201).json(outputSecure);
}
