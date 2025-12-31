const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Search Google for a query and return the first 2 blog/article links
 * @param {string} query - Search query (article title)
 * @returns {Promise<Array>} Array of {url, title} objects
 */
async function searchGoogle(query) {
  try {
    // Use Google Custom Search API if available, otherwise use web scraping
    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_CX) {
      return await searchWithAPI(query);
    } else {
      return await searchWithScraping(query);
    }
  } catch (error) {
    console.error('Google search error:', error.message);
    return [];
  }
}

/**
 * Search using Google Custom Search API
 */
async function searchWithAPI(query) {
  try {
    const url = 'https://www.googleapis.com/customsearch/v1';
    const params = {
      key: process.env.GOOGLE_API_KEY,
      cx: process.env.GOOGLE_CX,
      q: query,
      num: 10 // Get more results to filter
    };

    const response = await axios.get(url, { params });
    
    if (!response.data.items) {
      return [];
    }

    const results = [];
    for (const item of response.data.items) {
      if (isArticleLink(item.link)) {
        results.push({
          url: item.link,
          title: item.title
        });
        
        if (results.length >= 2) break;
      }
    }

    return results;
  } catch (error) {
    console.error('Google API search error:', error.message);
    return [];
  }
}

/**
 * Search using web scraping with Puppeteer (fallback method)
 */
async function searchWithScraping(query) {
  try {
    // Use Puppeteer for better results since Google blocks simple HTTP requests
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a bit for results to load
    await page.waitForTimeout(2000);
    
    const results = await page.evaluate(() => {
      const searchResults = [];
      const resultElements = document.querySelectorAll('div.g, div[data-ved]');
      
      resultElements.forEach((elem) => {
        if (searchResults.length >= 2) return;
        
        // Try to find the link
        const linkEl = elem.querySelector('a[href^="http"], a[href^="/url"]');
        if (!linkEl) return;
        
        let url = linkEl.getAttribute('href');
        if (!url) return;
        
        // Extract URL from Google redirect
        if (url.startsWith('/url')) {
          const match = url.match(/url\?q=([^&]+)/);
          if (match) {
            url = decodeURIComponent(match[1]);
          } else {
            return;
          }
        }
        
        // Get title
        const titleEl = elem.querySelector('h3, h2, .LC20lb, a h3');
        const title = titleEl ? titleEl.textContent.trim() : '';
        
        if (url && title && url.startsWith('http')) {
          searchResults.push({ url, title });
        }
      });
      
      return searchResults;
    });
    
    await browser.close();
    
    // Filter results
    const filteredResults = results.filter(result => isArticleLink(result.url));
    
    return filteredResults.slice(0, 2);
  } catch (error) {
    console.error('Google scraping error:', error.message);
    // Try alternative approach with DuckDuckGo
    return await searchWithDuckDuckGo(query);
  }
}

/**
 * Fallback search using DuckDuckGo
 */
async function searchWithDuckDuckGo(query) {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('a.result__a').each((i, elem) => {
      if (results.length >= 2) return false;

      const url = $(elem).attr('href');
      const title = $(elem).text().trim();

      if (isArticleLink(url) && title) {
        results.push({ url, title });
      }
    });

    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error.message);
    return [];
  }
}

/**
 * Check if a URL is likely an article/blog link
 */
function isArticleLink(url) {
  if (!url) return false;

  // Exclude certain domains/types
  const excludePatterns = [
    /youtube\.com/,
    /youtu\.be/,
    /facebook\.com/,
    /twitter\.com/,
    /x\.com/,
    /linkedin\.com/,
    /instagram\.com/,
    /pinterest\.com/,
    /reddit\.com/,
    /\.pdf$/i,
    /\.docx?$/i,
    /beyondchats\.com/, // Exclude original source
    /google\.com\/search/,
    /google\.com\/url/,
    /amazon\.com/,
    /amazon\./,
    /wikipedia\.org/,
    /\.gov\//,
    /\.edu\/$/,
    /play\.google\.com/,
    /apps\.apple\.com/,
    /chrome-extension/,
    /mailto:/,
    /tel:/
  ];

  for (const pattern of excludePatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }

  // Include common blog/article patterns
  const includePatterns = [
    /\/blog\//,
    /\/article\//,
    /\/post\//,
    /\/news\//,
    /\/guide\//,
    /\/tutorial\//,
    /\/how-to\//,
    /medium\.com/,
    /dev\.to/,
    /hashnode\.com/,
    /wordpress\.com/,
    /blogger\.com/,
    /\.blog/,
    /\/\d{4}\/\d{2}\//, // Date-based URLs
    /forbes\.com/,
    /techcrunch\.com/,
    /wired\.com/,
    /theverge\.com/,
    /mashable\.com/,
    /entrepreneur\.com/,
    /inc\.com/,
    /businessinsider\.com/,
    /hubspot\.com/,
    /marketingland\.com/,
    /searchengineland\.com/,
    /moz\.com/,
    /semrush\.com/,
    /ahrefs\.com/
  ];

  // If it matches include patterns, it's likely an article
  for (const pattern of includePatterns) {
    if (pattern.test(url)) {
      return true;
    }
  }

  // If it's a regular HTTP/HTTPS URL and doesn't match excludes, include it
  // (be more permissive - accept most URLs as potential articles)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Exclude very short URLs (likely not articles)
    if (url.length < 20) return false;
    // Exclude URLs that look like file downloads
    if (/\.(jpg|jpeg|png|gif|svg|ico|zip|rar|exe|dmg)$/i.test(url)) return false;
    return true;
  }

  return false;
}

module.exports = { searchGoogle };

