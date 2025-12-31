const express = require('express');
const router = express.Router();
const {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getOriginalVersion,
  getUpdatedVersion
} = require('../controllers/articleController');
const { triggerScraping } = require('../controllers/scraperController');
const { enhanceArticleById, enhanceAllArticles } = require('../controllers/enhancementController');

// Get all articles
router.get('/', getAllArticles);

// Get single article
router.get('/:id', getArticleById);

// Create article
router.post('/', createArticle);

// Update article
router.put('/:id', updateArticle);

// Delete article
router.delete('/:id', deleteArticle);

// Get original version
router.get('/:id/original', getOriginalVersion);

// Get updated version
router.get('/:id/updated', getUpdatedVersion);

// Trigger scraping
router.post('/scrape', triggerScraping);

// Enhance single article
router.post('/:id/enhance', enhanceArticleById);

// Enhance all articles
router.post('/enhance/all', enhanceAllArticles);

module.exports = router;

