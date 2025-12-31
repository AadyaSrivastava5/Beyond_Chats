const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

/**
 * Scrape main content from an article URL
 * @param {string} url - Article URL to scrape
 * @returns {Promise<Object>} Object with {title, content, structure}
 */
async function scrapeArticleContent(url) {
  try {
    // Try with Puppeteer first for JavaScript-rendered content
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 10000 });
    
    const articleData = await page.evaluate(() => {
      // Try to find article title
      const titleSelectors = [
        'h1.entry-title',
        'h1.post-title',
        'article h1',
        'h1',
        '.article-title',
        '[class*="title"]'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          title = el.textContent.trim();
          break;
        }
      }
      
      // Try to find main content
      const contentSelectors = [
        'article .entry-content',
        'article .post-content',
        'article .content',
        '.entry-content',
        '.post-content',
        'main article',
        'article',
        '[role="article"]',
        '.article-body',
        '[class*="content"]',
        '[class*="post-body"]'
      ];
      
      let contentEl = null;
      for (const selector of contentSelectors) {
        contentEl = document.querySelector(selector);
        if (contentEl) break;
      }
      
      if (!contentEl) {
        contentEl = document.querySelector('main') || document.body;
      }
      
      // Remove unwanted elements
      const unwanted = contentEl.querySelectorAll(
        'script, style, nav, header, footer, .sidebar, .comments, .share, .author-box, .advertisement, .ads, iframe, .social-share'
      );
      unwanted.forEach(el => el.remove());
      
      // Remove content after "follow us here!" including images/icons
      const allElements = Array.from(contentEl.querySelectorAll('*'));
      let foundFollowUs = false;
      
      for (const el of allElements) {
        const text = el.textContent.toLowerCase();
        
        // Check if this element contains "follow us here" or similar
        if (text.includes('follow us here') || text.includes('follow us!') || 
            (text.includes('follow us') && (text.includes('social') || text.includes('icon')))) {
          foundFollowUs = true;
          
          // Remove this element and all subsequent siblings
          let nextSibling = el.nextSibling;
          while (nextSibling) {
            const toRemove = nextSibling;
            nextSibling = nextSibling.nextSibling;
            toRemove.remove();
          }
          
          // Remove this element itself
          el.remove();
          break;
        }
      }
      
      // Also remove any images/icons that might be after follow us text
      if (foundFollowUs) {
        // Remove any remaining social media icons/images
        const socialIcons = contentEl.querySelectorAll('img[src*="social"], img[src*="icon"], img[src*="facebook"], img[src*="twitter"], img[src*="linkedin"], img[src*="instagram"], img[src*="youtube"], .social-icon, .share-icon, [class*="social"], [class*="share"], [class*="follow"]');
        socialIcons.forEach(el => el.remove());
      }
      
      // Extract text content and structure
      const paragraphs = Array.from(contentEl.querySelectorAll('p, h2, h3, h4, ul, ol, blockquote'))
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent.trim()
        }))
        .filter(item => item.text.length > 20); // Filter out very short elements
      
      // Get full HTML for structure analysis
      const html = contentEl.innerHTML;
      
      // Get plain text
      const text = contentEl.textContent.trim();
      
      return {
        title,
        text,
        html,
        paragraphs,
        structure: paragraphs.map(p => p.tag).join(', ')
      };
    });
    
    await browser.close();
    
    return {
      title: articleData.title,
      content: articleData.text,
      html: articleData.html,
      structure: articleData.structure,
      paragraphs: articleData.paragraphs
    };
    
  } catch (error) {
    console.error(`Error scraping with Puppeteer, trying fallback: ${error.message}`);
    
    // Fallback to axios + cheerio
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract title
      const title = $('h1').first().text().trim() || 
                   $('title').text().trim() || 
                   '';
      
      // Extract content
      const contentSelectors = [
        'article .entry-content',
        'article .post-content',
        'article .content',
        '.entry-content',
        '.post-content',
        'main article',
        'article',
        '[role="article"]'
      ];
      
      let contentEl = null;
      for (const selector of contentSelectors) {
        contentEl = $(selector).first();
        if (contentEl.length > 0) break;
      }
      
      if (contentEl.length === 0) {
        contentEl = $('main').first() || $('body');
      }
      
      // Remove unwanted elements
      contentEl.find('script, style, nav, header, footer, .sidebar, .comments').remove();
      
      // Remove content after "follow us here!" including images/icons
      const allElements = contentEl.find('*');
      let foundFollowUs = false;
      
      allElements.each((i, el) => {
        if (foundFollowUs) return false; // Stop iteration
        
        const $el = $(el);
        const text = $el.text().toLowerCase();
        
        // Check if this element contains "follow us here" or similar
        if (text.includes('follow us here') || text.includes('follow us!') || 
            (text.includes('follow us') && (text.includes('social') || text.includes('icon')))) {
          foundFollowUs = true;
          
          // Remove this element and all subsequent siblings
          $el.nextAll().remove();
          $el.remove();
          return false; // Stop iteration
        }
      });
      
      // Also remove any images/icons that might be after follow us text
      if (foundFollowUs) {
        // Remove any remaining social media icons/images
        contentEl.find('img[src*="social"], img[src*="icon"], img[src*="facebook"], img[src*="twitter"], img[src*="linkedin"], img[src*="instagram"], img[src*="youtube"], .social-icon, .share-icon, [class*="social"], [class*="share"], [class*="follow"]').remove();
      }
      
      const text = contentEl.text().trim();
      const html = contentEl.html() || '';
      
      const paragraphs = contentEl.find('p, h2, h3, h4').map((i, el) => ({
        tag: el.tagName.toLowerCase(),
        text: $(el).text().trim()
      })).get().filter(item => item.text.length > 20);
      
      return {
        title,
        content: text,
        html,
        structure: paragraphs.map(p => p.tag).join(', '),
        paragraphs
      };
      
    } catch (fallbackError) {
      console.error(`Fallback scraping also failed: ${fallbackError.message}`);
      return {
        title: '',
        content: '',
        html: '',
        structure: '',
        paragraphs: []
      };
    }
  }
}

/**
 * Analyze formatting structure of articles
 * @param {Array} articles - Array of scraped article objects
 * @returns {Object} Common structure patterns
 */
function analyzeStructure(articles) {
  const structures = articles.map(a => a.structure).filter(s => s);
  
  if (structures.length === 0) {
    return {
      commonTags: ['p', 'h2', 'h3'],
      introStyle: 'paragraph',
      bodyStyle: 'paragraphs'
    };
  }
  
  // Find common tags
  const tagCounts = {};
  structures.forEach(structure => {
    const tags = structure.split(', ');
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  const commonTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
  
  return {
    commonTags,
    introStyle: structures.some(s => s.includes('h2')) ? 'heading' : 'paragraph',
    bodyStyle: 'paragraphs'
  };
}

module.exports = { scrapeArticleContent, analyzeStructure };

