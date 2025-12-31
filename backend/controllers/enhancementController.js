const axios = require('axios');
const Article = require('../models/Article');

// Import utilities from scripts directory
// Note: These need to be in the backend's node_modules or accessible
// For now, we'll use relative paths from backend to scripts
const { searchGoogle } = require('../../scripts/utils/google-search');
const { scrapeArticleContent } = require('../../scripts/utils/content-scraper');
const { enhanceArticle, enhanceArticleWithoutReferences, addCitations } = require('../../scripts/utils/gemini-enhancer');

const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api`;

// Enhance a single article
const enhanceArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get article from database
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'GEMINI_API_KEY is not configured'
      });
    }

    // Step 1: Search Google for reference articles
    let searchResults = [];
    try {
      searchResults = await searchGoogle(article.title);
      
      // Try alternative queries if no results
      if (searchResults.length === 0) {
        const shortTitle = article.title.split(':')[0].split('-')[0].trim();
        if (shortTitle.length > 10 && shortTitle !== article.title) {
          searchResults = await searchGoogle(shortTitle);
        }
      }
    } catch (error) {
      console.error('Google search error:', error.message);
      // Continue without reference articles
    }

    // Step 2: Scrape content from reference articles (if found)
    const referenceContents = [];
    if (searchResults.length > 0) {
      for (let i = 0; i < Math.min(2, searchResults.length); i++) {
        try {
          const ref = searchResults[i];
          const scraped = await scrapeArticleContent(ref.url);
          if (scraped.content) {
            referenceContents.push({
              url: ref.url,
              title: ref.title,
              content: scraped.content,
              structure: scraped.structure,
              html: scraped.html
            });
          }
          // Add delay between requests
          if (i < Math.min(2, searchResults.length) - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`Error scraping ${searchResults[i].url}:`, error.message);
        }
      }
    }

    // Step 3: Enhance article using Gemini API
    let enhancedContent;
    try {
      if (referenceContents.length > 0) {
        // Enhance with reference articles
        enhancedContent = await enhanceArticle(
          article.originalContent || article.content,
          referenceContents,
          article.title
        );
        // Add citations
        enhancedContent = addCitations(enhancedContent, searchResults.slice(0, referenceContents.length));
      } else {
        // Enhance without reference articles - just improve formatting and content
        enhancedContent = await enhanceArticleWithoutReferences(
          article.originalContent || article.content,
          article.title
        );
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error enhancing article with Gemini API',
        error: error.message
      });
    }

    // Step 4: Update article in database
    if (!article.originalContent && article.content) {
      article.originalContent = article.content;
    }

    article.content = enhancedContent;
    article.isUpdated = true;
    article.updatedAt = new Date();
    
    if (searchResults.length > 0) {
      article.referenceArticles = searchResults.slice(0, referenceContents.length).map(ref => ({
        url: ref.url,
        title: ref.title
      }));
    }

    await article.save();

    res.json({
      success: true,
      message: 'Article enhanced successfully',
      data: article,
      hadReferences: referenceContents.length > 0
    });

  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enhancing article',
      error: error.message
    });
  }
};

// Enhance all unupdated articles
const enhanceAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({ isUpdated: false }).limit(10);
    
    if (articles.length === 0) {
      return res.json({
        success: true,
        message: 'No articles to enhance',
        count: 0
      });
    }

    // Process in background
    processEnhancements(articles).catch(err => {
      console.error('Batch enhancement error:', err);
    });

    res.json({
      success: true,
      message: `Enhancement started for ${articles.length} articles. This may take several minutes.`,
      count: articles.length,
      status: 'processing'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting batch enhancement',
      error: error.message
    });
  }
};

// Background processing function
async function processEnhancements(articles) {
  // Use localhost for internal calls, or the actual API URL if set
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api`;
  
  for (const article of articles) {
    try {
      // Call the enhancement endpoint
      const response = await axios.post(
        `${baseUrl}/articles/${article._id}/enhance`,
        {},
        { timeout: 300000 } // 5 minute timeout
      );
      
      if (response.data.success) {
        console.log(`✓ Enhanced article: ${article.title}`);
      } else {
        console.error(`✗ Failed to enhance article: ${article.title}`);
      }
      
      // Add delay between articles
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Error enhancing article ${article._id}:`, error.message);
    }
  }
}

module.exports = { enhanceArticleById, enhanceAllArticles };

