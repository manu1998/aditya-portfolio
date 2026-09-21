import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subscribeRouter from "./subscribe";
import issueRouter from "./issue";
import unsubscribeRouter from "./unsubscribe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(subscribeRouter);
router.use(issueRouter);
router.use(unsubscribeRouter);

export default router;
