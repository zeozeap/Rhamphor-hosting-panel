import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import serversRouter from "./servers.js";
import usersRouter from "./users.js";
import nodesRouter from "./nodes.js";
import filesRouter from "./files.js";
import pluginsRouter from "./plugins.js";
import subdomainsRouter from "./subdomains.js";
import settingsRouter from "./settings.js";
import nestsRouter from "./nests.js";
import auditRouter from "./audit.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(serversRouter);
router.use(usersRouter);
router.use(nodesRouter);
router.use(filesRouter);
router.use(pluginsRouter);
router.use(subdomainsRouter);
router.use(settingsRouter);
router.use(nestsRouter);
router.use(auditRouter);

export default router;
