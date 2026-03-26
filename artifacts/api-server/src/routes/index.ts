import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import serversRouter from "./servers.js";
import usersRouter from "./users.js";
import nodesRouter from "./nodes.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(serversRouter);
router.use(usersRouter);
router.use(nodesRouter);

export default router;
