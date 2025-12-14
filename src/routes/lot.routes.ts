import { Router } from "express";
import { LotController } from "../controllers/lotController";

const router = Router();

router.post("/lots", LotController.create);
router.get("/products/:productId/lots", LotController.listByProduct);

export { router as lotRoutes };
