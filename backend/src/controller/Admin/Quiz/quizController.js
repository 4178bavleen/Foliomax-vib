// src/controller/Admin/Quiz/quizController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const learnFeedCache = require("../../../lib/learnFeedCache");

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Validate pageName (production-friendly):
 * - optional
 * - kebab-case style: lowercase letters, numbers and hyphens
 * - length limit to avoid abuse
 */
function isValidPageName(name) {
  if (!name && name !== "") return true; // undefined/null allowed (optional)
  if (typeof name !== "string") return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed.length > 100) return false;
  // allow a single segment like "about-us" or "pricing" or "home-landing-2025"
  const re = /^[a-z0-9\-]+$/;
  return re.test(trimmed);
}

exports.getQuizzes = async (req, res) => {
  try {
    const { companyId, search, pageName } = req.query;

    // validate pageName if provided
    if (pageName && !isValidPageName(pageName)) {
      return res.status(400).json({ message: "Invalid pageName format" });
    }

    const where = {};

    if (companyId) {
      where.companyId = Number(companyId);
    }

    if (pageName) {
      // store pageName in snake_case or as-is depending on your DB; here we use exactly the provided slug
      where.pageName = pageName;
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();

      // we’ll do basic filtering in JS after fetching, because options is JSON
      const quizzes = await prisma.quiz.findMany({
        where,
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const filtered = quizzes.filter((q) => {
        const qText = (q.question || "").toString().toLowerCase();
        const opts = Array.isArray(q.options) ? q.options : [];
        const inQuestion = qText.includes(term);
        const inOptions = opts.some((o) =>
          (o || "").toString().toLowerCase().includes(term)
        );
        return inQuestion || inOptions;
      });

      return res.json(
        filtered.map((q) => ({
          id: q.id,
          companyId: q.companyId,
          companyName: q.company?.name || null,
          question: q.question,
          options: q.options || [],
          correctIndex: q.correctIndex,
          note: q.note,
          pageName: q.pageName || null,
          createdAt: q.createdAt,
        }))
      );
    }

    // no search: we can let DB filter by company + pageName only
    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const response = quizzes.map((q) => ({
      id: q.id,
      companyId: q.companyId,
      companyName: q.company?.name || null,
      question: q.question,
      options: q.options || [],
      correctIndex: q.correctIndex,
      note: q.note,
      pageName: q.pageName || null,
      createdAt: q.createdAt,
    }));

    return res.json(response);
  } catch (err) {
    console.error("GET /quizzes/all-quizzes error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const { companyId, question, options, correctIndex, note, pageName } =
      req.body;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }
    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return res
        .status(400)
        .json({ message: "Exactly 4 options are required" });
    }
    const trimmedOptions = options.map((o) => (o || "").toString().trim());
    if (trimmedOptions.some((o) => !o)) {
      return res
        .status(400)
        .json({ message: "All 4 options must be non-empty" });
    }

    const idx = Number(correctIndex);
    if (Number.isNaN(idx) || idx < 0 || idx > 3) {
      return res
        .status(400)
        .json({ message: "correctIndex must be between 0 and 3" });
    }

    // pageName validation (optional)
    let pageNameToSave = null;
    if (pageName !== undefined && pageName !== null) {
      if (!isValidPageName(pageName)) {
        return res.status(400).json({
          message:
            "Invalid pageName. Use lowercase letters, numbers and hyphens only (max 100 chars).",
        });
      }
      pageNameToSave = pageName.trim();
    }

    // ensure company exists
    const company = await prisma.company.findUnique({
      where: { id: Number(companyId) },
    });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const quiz = await prisma.quiz.create({
      data: {
        companyId: Number(companyId),
        question: question.trim(),
        options: trimmedOptions, // Json in MySQL; Prisma accepts JS array
        correctIndex: idx,
        note: note && note.trim() ? note.trim() : null,
        pageName: pageNameToSave,
      },
    });

    await learnFeedCache.invalidate();

    return res.status(201).json(quiz);
  } catch (err) {
    console.error("POST /quizzes/add error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, question, options, correctIndex, note, pageName } =
      req.body;

    const data = {};

    if (companyId) {
      data.companyId = Number(companyId);
    }

    if (question) {
      if (!question.trim()) {
        return res.status(400).json({ message: "Question cannot be empty" });
      }
      data.question = question.trim();
    }

    if (options) {
      if (!Array.isArray(options) || options.length !== 4) {
        return res
          .status(400)
          .json({ message: "Exactly 4 options are required" });
      }
      const trimmedOptions = options.map((o) => (o || "").toString().trim());
      if (trimmedOptions.some((o) => !o)) {
        return res
          .status(400)
          .json({ message: "All 4 options must be non-empty" });
      }
      data.options = trimmedOptions;
    }

    if (correctIndex !== undefined) {
      const idx = Number(correctIndex);
      if (Number.isNaN(idx) || idx < 0 || idx > 3) {
        return res
          .status(400)
          .json({ message: "correctIndex must be between 0 and 3" });
      }
      data.correctIndex = idx;
    }

    if (note !== undefined) {
      data.note = note && note.trim() ? note.trim() : null;
    }

    if (pageName !== undefined) {
      // allow null to clear, or a valid pageName to set
      if (pageName === null) {
        data.pageName = null;
      } else {
        if (!isValidPageName(pageName)) {
          return res.status(400).json({
            message:
              "Invalid pageName. Use lowercase letters, numbers and hyphens only (max 100 chars).",
          });
        }
        data.pageName = pageName.trim();
      }
    }

    const updated = await prisma.quiz.update({
      where: { id: Number(id) },
      data,
    });

    await learnFeedCache.invalidate();

    return res.json(updated);
  } catch (err) {
    console.error("PATCH /quizzes/update/:id error:", err);
    if (err.code === "P2025") {
      // Prisma: record not found
      return res.status(404).json({ message: "Quiz not found" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.quiz.delete({
      where: { id: Number(id) },
    });

    await learnFeedCache.invalidate();

    return res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("DELETE /quizzes/delete/:id error:", err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Quiz not found" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getCompanyQuizzesShuffled = async (req, res) => {
  try {
    const { companyId, limit, pageName } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const companyIdNum = Number(companyId);
    if (Number.isNaN(companyIdNum)) {
      return res.status(400).json({ message: "Invalid companyId" });
    }

    // pageName validation (optional)
    if (pageName && !isValidPageName(pageName)) {
      return res.status(400).json({ message: "Invalid pageName format" });
    }

    // 1) Fetch all quizzes for that company (and pageName if provided)
    const where = { companyId: companyIdNum };
    if (pageName) where.pageName = pageName;

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
      // orderBy doesn't matter much since we shuffle in JS,
      // but keeping it for deterministic base order if needed
      orderBy: { createdAt: "asc" },
    });

    // 2) Shuffle the quizzes server-side
    let shuffled = shuffleArray(quizzes);

    // 3) If limit is given, slice
    const limitNum = limit ? Number(limit) : null;
    if (limitNum && !Number.isNaN(limitNum) && limitNum > 0) {
      shuffled = shuffled.slice(0, limitNum);
    }

    // 4) Shape the response for frontend
    const response = shuffled.map((q) => ({
      id: q.id,
      companyId: q.companyId,
      companyName: q.company?.name || null,
      question: q.question,
      options: q.options || [],
      correctIndex: q.correctIndex,
      note: q.note,
      pageName: q.pageName || null,
      createdAt: q.createdAt,
    }));

    return res.json(response);
  } catch (err) {
    console.error("GET /quizzes/company-random error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


