import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import serversRouter from "./servers.js";
import usersRouter from "./users.js";
import nodesRouter from "./nodes.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(serversRouter);
router.use(usersRouter);
router.use(nodesRouter);

export default router;
