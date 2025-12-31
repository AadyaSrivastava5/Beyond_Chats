const { scrapeOldestArticles } = require('../scraper/beyondchats-scraper');

// Trigger scraping
const triggerScraping = async (req, res) => {
  try {
    // Run scraping in background (don't wait for it to complete)
    scrapeOldestArticles().catch(err => {
      console.error('Scraping error:', err);
    });

    res.json({
      success: true,
      message: 'Scraping started. This may take a few minutes. Check the articles list to see new articles.',
      status: 'processing'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting scraper',
      error: error.message
    });
  }
};

module.exports = { triggerScraping };

