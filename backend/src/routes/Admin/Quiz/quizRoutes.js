// src/routes/Admin/Quiz/quizRoutes.js
const express = require("express");
const router = express.Router();

const quizController = require("../../../controller/Admin/Quiz/quizController");

// Quiz CRUD
router.get("/all-quizzes", quizController.getQuizzes);   // list (with optional filters)
router.post("/add", quizController.createQuiz);          // create
router.patch("/update/:id", quizController.updateQuiz);  // edit
router.delete("/delete/:id", quizController.deleteQuiz); // delete

router.get("/company-quiz-random", quizController.getCompanyQuizzesShuffled);

module.exports = router;
