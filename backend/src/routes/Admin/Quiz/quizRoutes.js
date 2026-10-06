// src/routes/Admin/Quiz/quizRoutes.js
const express = require("express");
const router = express.Router();

const quizController = require("../../../controller/Admin/Quiz/quizController");
const { authMiddleware, adminOnly } = require("../../../middlewares/authMiddleware");

// Quiz CRUD
// GET /all-quizzes is public (used by the quiz widget on the site)
router.get("/all-quizzes", quizController.getQuizzes);
router.get("/company-quiz-random", quizController.getCompanyQuizzesShuffled);

router.post("/add", authMiddleware, adminOnly, quizController.createQuiz);
router.patch(
  "/update/:id",
  authMiddleware,
  adminOnly,
  quizController.updateQuiz
);
router.delete(
  "/delete/:id",
  authMiddleware,
  adminOnly,
  quizController.deleteQuiz
);

module.exports = router;
