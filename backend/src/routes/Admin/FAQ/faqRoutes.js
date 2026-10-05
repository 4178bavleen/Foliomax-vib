// src/routes/admin/dashboard/settings/faqRoutes.js
const express = require('express');
const router = express.Router();

const {
  createFaq,
  getAllFaqsAdmin,
  getFaqById,
  updateFaq,
  deleteFaq,
  getPublicFaqs,
} = require('../../../controller/Admin/FAQ/faqController');




// Create FAQ
router.post('/faq',  createFaq);

// List FAQs (admin)
router.get('/faqs',  getAllFaqsAdmin);

// Get single FAQ
router.get('/faq/:id',  getFaqById);

// Update FAQ
router.put('/faq/:id', updateFaq);

// Delete FAQ
router.delete('/faq/:id',  deleteFaq);

router.get('/faqs', getPublicFaqs);

module.exports = router;
