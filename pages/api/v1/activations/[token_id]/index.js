import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(req, res) {
  const tokenId = req.query.token_id;
  const tokenFound = await activation.findOneByTokenId(tokenId);
  const markAsUsed = await activation.markAsUsed(tokenFound.id);
  await activation.activateUserByUserId(markAsUsed.user_id);

  return res.status(200).json(markAsUsed);
}
