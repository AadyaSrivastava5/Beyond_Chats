require('dotenv').config();
const axios = require('axios');
const { searchGoogle } = require('./utils/google-search');
const { scrapeArticleContent, analyzeStructure } = require('./utils/content-scraper');
const { enhanceArticle, addCitations } = require('./utils/gemini-enhancer');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Fetch articles from API
 */
async function fetchArticles(articleId = null) {
  try {
    if (articleId) {
      const response = await axios.get(`${API_BASE_URL}/articles/${articleId}`);
      return response.data.success ? [response.data.data] : [];
    } else {
      // Fetch all articles that haven't been updated
      const response = await axios.get(`${API_BASE_URL}/articles?limit=100`);
      if (response.data.success) {
        return response.data.data.filter(article => !article.isUpdated);
      }
      return [];
    }
  } catch (error) {
    console.error('Error fetching articles:', error.message);
    return [];
  }
}

/**
 * Update article via API
 */
async function updateArticle(articleId, updatedContent, referenceArticles) {
  try {
    const response = await axios.put(`${API_BASE_URL}/articles/${articleId}`, {
      content: updatedContent,
      referenceArticles: referenceArticles.map(ref => ({
        url: ref.url,
        title: ref.title
      }))
    });

    return response.data.success;
  } catch (error) {
    console.error('Error updating article:', error.message);
    return false;
  }
}

/**
 * Enhance a single article
 */
async function enhanceSingleArticle(article) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${article.title}`);
    console.log(`ID: ${article._id}`);
    console.log(`${'='.repeat(60)}`);

    // Step 1: Search Google for the article title
    console.log('\n[1/5] Searching Google for reference articles...');
    
    // Try different search queries for better results
    let searchResults = await searchGoogle(article.title);
    
    // If no results, try a shorter version of the title
    if (searchResults.length === 0) {
      const shortTitle = article.title.split(':')[0].split('-')[0].trim();
      if (shortTitle.length > 10 && shortTitle !== article.title) {
        console.log(`  Trying alternative search query: "${shortTitle}"...`);
        searchResults = await searchGoogle(shortTitle);
      }
    }
    
    // If still no results, try adding "guide" or "article" to the search
    if (searchResults.length === 0) {
      const enhancedQuery = `${article.title} guide article`;
      console.log(`  Trying enhanced search query: "${enhancedQuery}"...`);
      searchResults = await searchGoogle(enhancedQuery);
    }
    
    if (searchResults.length === 0) {
      console.log('❌ Skipping article - no reference articles found after multiple search attempts.');
      return false;
    }
    
    if (searchResults.length < 2) {
      console.log(`⚠ Warning: Only found ${searchResults.length} reference article(s). Proceeding with available results.`);
    }

    console.log(`✓ Found ${searchResults.length} reference articles:`);
    searchResults.forEach((ref, i) => {
      console.log(`  ${i + 1}. ${ref.title}`);
      console.log(`     ${ref.url}`);
    });

    // Step 2: Scrape content from reference articles
    console.log('\n[2/4] Scraping content from reference articles...');
    const referenceContents = [];
    
    // Use at least 1 article, up to 2 if available
    const articlesToScrape = Math.max(1, Math.min(2, searchResults.length));
    
    for (let i = 0; i < articlesToScrape; i++) {
      const ref = searchResults[i];
      console.log(`  Scraping ${i + 1}/2: ${ref.title}...`);
      
      const scraped = await scrapeArticleContent(ref.url);
      if (scraped.content) {
        referenceContents.push({
          url: ref.url,
          title: ref.title,
          content: scraped.content,
          structure: scraped.structure,
          html: scraped.html
        });
        console.log(`  ✓ Scraped ${scraped.content.length} characters`);
      } else {
        console.log(`  ⚠ Warning: Could not scrape content from ${ref.url}`);
      }
      
      // Add delay between requests
      if (i < articlesToScrape - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Step 3: Enhance article using Gemini API
    console.log('\n[3/4] Enhancing article with Gemini API...');
    let enhancedContent;
    
    try {
      if (referenceContents.length > 0) {
        // Analyze structure if we have references
        console.log('  Using reference articles for enhancement...');
        const structure = analyzeStructure(referenceContents);
        console.log(`  Common structure: ${structure.commonTags.join(', ')}`);
        
        // Enhance with reference articles
        const { enhanceArticle, addCitations } = require('./utils/gemini-enhancer');
        enhancedContent = await enhanceArticle(
          article.originalContent || article.content,
          referenceContents,
          article.title
        );
        
        // Add citations
        enhancedContent = addCitations(enhancedContent, searchResults.slice(0, referenceContents.length));
      } else {
        // Enhance without reference articles - just improve formatting
        console.log('  No reference articles found. Enhancing formatting and content quality...');
        const { enhanceArticleWithoutReferences } = require('./utils/gemini-enhancer');
        enhancedContent = await enhanceArticleWithoutReferences(
          article.originalContent || article.content,
          article.title
        );
      }
      
      console.log(`✓ Enhanced content generated (${enhancedContent.length} characters)`);
    } catch (error) {
      console.error(`❌ Error enhancing article: ${error.message}`);
      return false;
    }

    // Step 4: Update article via API
    console.log('\n[4/4] Publishing updated article...');
    const success = await updateArticle(
      article._id,
      enhancedContent,
      searchResults.slice(0, referenceContents.length)
    );

    if (success) {
      console.log('✓ Article updated successfully!');
      return true;
    } else {
      console.log('❌ Failed to update article via API');
      return false;
    }

  } catch (error) {
    console.error(`❌ Error processing article: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const articleIdArg = args.find(arg => arg.startsWith('--article-id='));
    const allArg = args.includes('--all');

    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Error: GEMINI_API_KEY is not set in environment variables');
      console.log('Please set GEMINI_API_KEY in your .env file');
      process.exit(1);
    }

    console.log('🚀 Starting article enhancement process...\n');

    let articles = [];
    
    if (articleIdArg) {
      // Enhance specific article
      const articleId = articleIdArg.split('=')[1];
      console.log(`Fetching article with ID: ${articleId}`);
      articles = await fetchArticles(articleId);
    } else if (allArg) {
      // Enhance all unupdated articles
      console.log('Fetching all unupdated articles...');
      articles = await fetchArticles();
    } else {
      console.log('Usage:');
      console.log('  node enhance-articles.js --article-id=<id>  # Enhance specific article');
      console.log('  node enhance-articles.js --all              # Enhance all unupdated articles');
      process.exit(1);
    }

    if (articles.length === 0) {
      console.log('No articles found to enhance.');
      process.exit(0);
    }

    console.log(`Found ${articles.length} article(s) to enhance.\n`);

    // Process each article
    let successCount = 0;
    let failCount = 0;

    for (const article of articles) {
      const success = await enhanceSingleArticle(article);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Add delay between articles
      if (articles.indexOf(article) < articles.length - 1) {
        console.log('\nWaiting 3 seconds before next article...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 Summary:');
    console.log(`  ✓ Successfully enhanced: ${successCount}`);
    console.log(`  ❌ Failed: ${failCount}`);
    console.log(`  Total: ${articles.length}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { enhanceSingleArticle, fetchArticles, updateArticle };

