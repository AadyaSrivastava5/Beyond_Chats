const Article = require('../models/Article');

// Get all articles
const getAllArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const articles = await Article.find()
      .sort({ publishedDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Article.countDocuments();

    res.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
};

// Get single article
const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message
    });
  }
};

// Create article
const createArticle = async (req, res) => {
  try {
    const { title, content, slug, publishedDate, author, sourceUrl } = req.body;

    // Set originalContent to content if not provided
    const originalContent = req.body.originalContent || content;

    const article = new Article({
      title,
      content,
      originalContent,
      slug,
      publishedDate: publishedDate || new Date(),
      author: author || '',
      sourceUrl
    });

    await article.save();

    res.status(201).json({
      success: true,
      data: article
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Article with this slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message
    });
  }
};

// Update article
const updateArticle = async (req, res) => {
  try {
    const { content, referenceArticles } = req.body;
    
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Preserve originalContent if it doesn't exist
    if (!article.originalContent && article.content) {
      article.originalContent = article.content;
    }

    // Update article
    if (content) article.content = content;
    if (referenceArticles) article.referenceArticles = referenceArticles;
    article.isUpdated = true;
    article.updatedAt = new Date();

    await article.save();

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating article',
      error: error.message
    });
  }
};

// Delete article
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting article',
      error: error.message
    });
  }
};

// Get original version
const getOriginalVersion = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: {
        title: article.title,
        content: article.originalContent || article.content,
        publishedDate: article.publishedDate,
        author: article.author,
        sourceUrl: article.sourceUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching original version',
      error: error.message
    });
  }
};

// Get updated version
const getUpdatedVersion = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (!article.isUpdated) {
      return res.status(400).json({
        success: false,
        message: 'Article has not been updated yet'
      });
    }

    res.json({
      success: true,
      data: {
        title: article.title,
        content: article.content,
        updatedAt: article.updatedAt,
        referenceArticles: article.referenceArticles
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching updated version',
      error: error.message
    });
  }
};

module.exports = {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getOriginalVersion,
  getUpdatedVersion
};

