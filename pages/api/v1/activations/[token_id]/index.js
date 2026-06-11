import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(req, res) {
  const tokenId = req.query.token_id;
  const tokenFound = await activation.findOneByTokenId(tokenId);
  const markAsUsed = await activation.markAsUsed(tokenFound.id);
  await activation.activateUserByUserId(markAsUsed.user_id);

  return res.status(200).json(markAsUsed);
}
