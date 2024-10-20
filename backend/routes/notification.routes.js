import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { deleteAllNotification, getAllNotification } from "../controllers/notification.controllers.js";

const router = express.Router();

router.get("/", protectRoute, getAllNotification);
router.delete("/", protectRoute, deleteAllNotification);

export default router;
