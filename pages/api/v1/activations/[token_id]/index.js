import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";
import authorization from "infra/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest("read:activation_token"), patchHandler)
  .handler(controller.errorHandlers);

async function patchHandler(req, res) {
  const tokenId = req.query.token_id;

  const authenticatedUser = req.context.user;
  const tokenFound = await activation.findOneByTokenId(tokenId);
  const markAsUsed = await activation.markAsUsed(tokenFound.id);
  await activation.activateUserByUserId(markAsUsed.user_id);

  const outputSecure = authorization.filterOutput(
    authenticatedUser,
    "read:activation_token",
    markAsUsed,
  );
  return res.status(200).json(outputSecure);
}
