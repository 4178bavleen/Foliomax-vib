// src/routes/admin/dashboard/settings/faqCategoryRoutes.js
const express = require('express');
const router = express.Router();

const {
  createFaqCategory,
  getAllFaqCategoriesAdmin,
  deleteFaqCategory,
  getPublicFaqCategories,
  getPublicFaqCategoryBySlug,
} = require('../../../controller/Admin/FAQ/faqCategoryController');



// create
router.post(
  '/faq-category',
  
  createFaqCategory
);

// list
router.get(
  '/faq-categories',
  
  getAllFaqCategoriesAdmin
);

// delete (hard-delete). For soft-delete change controller or use PATCH to update isActive.
router.delete(
  '/faq-category/:id',
  
  deleteFaqCategory
);

router.get(
  '/public/faq-categories',
  getPublicFaqCategories
);

// Get single FAQ category by slug (code) with its published FAQs
router.get(
  '/public/faq-categories/:slug',
  getPublicFaqCategoryBySlug
);

module.exports = router;
