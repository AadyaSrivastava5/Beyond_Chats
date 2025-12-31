require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const Article = require('../models/Article');
const connectDB = require('../config/database');

// Connect to database
connectDB();

// Function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Function to find the last page
async function findLastPage() {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    await page.goto('https://beyondchats.com/blogs/', { waitUntil: 'networkidle2' });
    
    // Wait for pagination to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Get all pagination links
    const paginationLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/blogs/"]'));
      const pageNumbers = [];
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        const match = href.match(/page\/(\d+)/) || (text.match(/^\d+$/) ? { 1: text } : null);
        if (match) {
          pageNumbers.push(parseInt(match[1]));
        }
      });
      
      return pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
    });
    
    await browser.close();
    return paginationLinks || 1;
  } catch (error) {
    console.error('Error finding last page:', error.message);
    return 1; // Default to page 1 if error
  }
}

// Function to scrape articles from a page
async function scrapePage(pageNumber) {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    const url = pageNumber === 1 
      ? 'https://beyondchats.com/blogs/'
      : `https://beyondchats.com/blogs/page/${pageNumber}/`;
    
    console.log(`Scraping page ${pageNumber}: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for articles to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Extract article data
    const articles = await page.evaluate(() => {
      const articleElements = Array.from(document.querySelectorAll('article, .post, .blog-post, [class*="article"], [class*="blog"]'));
      const results = [];
      
      articleElements.forEach((element, index) => {
        try {
          // Try to find title
          const titleEl = element.querySelector('h1, h2, h3, .title, .post-title, [class*="title"]');
          const title = titleEl ? titleEl.textContent.trim() : null;
          
          // Try to find link
          const linkEl = element.querySelector('a[href*="/blogs/"]') || element.closest('a');
          const link = linkEl ? linkEl.href : null;
          
          // Try to find date
          const dateEl = element.querySelector('time, .date, [class*="date"], [class*="published"]');
          const dateText = dateEl ? dateEl.textContent.trim() : null;
          
          // Try to find author
          const authorEl = element.querySelector('.author, [class*="author"], [rel="author"]');
          const author = authorEl ? authorEl.textContent.trim() : '';
          
          if (title && link) {
            results.push({
              title,
              link,
              dateText,
              author
            });
          }
        } catch (err) {
          console.error('Error extracting article:', err);
        }
      });
      
      return results;
    });
    
    await browser.close();
    return articles;
  } catch (error) {
    console.error(`Error scraping page ${pageNumber}:`, error.message);
    return [];
  }
}

// Function to scrape full article content
async function scrapeArticleContent(url) {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 10000 });
    
    const content = await page.evaluate(() => {
      // Try to find main content area
      const contentSelectors = [
        'article .entry-content',
        'article .post-content',
        'article .content',
        '.entry-content',
        '.post-content',
        'main article',
        'article',
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
      const unwanted = contentEl.querySelectorAll('script, style, nav, header, footer, .sidebar, .comments, .share, .author-box');
      unwanted.forEach(el => el.remove());
      
      // Remove content after "follow us here!" including images/icons
      const allElements = Array.from(contentEl.querySelectorAll('*'));
      let followUsElement = null;
      
      // Find element containing "follow us here" text
      for (const el of allElements) {
        const text = el.textContent.toLowerCase().trim();
        
        // Check if this element contains "follow us here" or similar variations
        if (text.includes('follow us here') || text.includes('follow us!') || 
            (text.includes('follow us') && (text.includes('social') || text.includes('icon') || text.includes('here')))) {
          followUsElement = el;
          break;
        }
      }
      
      if (followUsElement) {
        // Remove the element containing "follow us here" and everything after it
        let current = followUsElement;
        const elementsToRemove = [];
        
        // Collect all elements to remove (this element and all following siblings)
        while (current) {
          elementsToRemove.push(current);
          current = current.nextElementSibling;
        }
        
        // Also check parent's next siblings
        let parentSibling = followUsElement.parentElement?.nextElementSibling;
        while (parentSibling) {
          elementsToRemove.push(parentSibling);
          parentSibling = parentSibling.nextElementSibling;
        }
        
        // Remove all collected elements
        elementsToRemove.forEach(el => el.remove());
        
        // Also remove any remaining social media icons/images in the content
        const socialIcons = contentEl.querySelectorAll('img[src*="social"], img[src*="icon"], img[src*="facebook"], img[src*="twitter"], img[src*="linkedin"], img[src*="instagram"], img[src*="youtube"], .social-icon, .share-icon, [class*="social"], [class*="share"], [class*="follow"]');
        socialIcons.forEach(el => el.remove());
      }
      
      return contentEl ? contentEl.innerHTML : '';
    });
    
    await browser.close();
    return content;
  } catch (error) {
    console.error(`Error scraping article content from ${url}:`, error.message);
    return '';
  }
}

// Function to parse date
function parseDate(dateText) {
  if (!dateText) return new Date();
  
  try {
    const date = new Date(dateText);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (error) {
    // Try alternative parsing
  }
  
  return new Date();
}

// Main scraping function
async function scrapeOldestArticles() {
  try {
    console.log('Starting scraper...');
    
    // Find the last page
    console.log('Finding last page...');
    const lastPage = await findLastPage();
    console.log(`Last page found: ${lastPage}`);
    
    // Scrape the last page
    console.log('Scraping last page...');
    let articles = await scrapePage(lastPage);
    console.log(`Found ${articles.length} articles on last page`);
    
    // If less than 5 articles, also scrape the second-to-last page
    if (articles.length < 5 && lastPage > 1) {
      const secondLastPage = lastPage - 1;
      console.log(`\nFound less than 5 articles. Scraping second-to-last page (${secondLastPage})...`);
      const secondLastArticles = await scrapePage(secondLastPage);
      console.log(`Found ${secondLastArticles.length} articles on page ${secondLastPage}`);
      
      // Combine articles, keeping them in order (oldest first)
      articles = [...secondLastArticles, ...articles];
      console.log(`Total articles found: ${articles.length}`);
    }
    
    if (articles.length === 0) {
      console.log('No articles found. Trying alternative approach...');
      // Try scraping page 1 as fallback
      const fallbackArticles = await scrapePage(1);
      if (fallbackArticles.length > 0) {
        articles.push(...fallbackArticles);
      }
    }
    
    // Get the 5 oldest articles (last 5 from the array)
    const oldestArticles = articles.slice(-5).reverse();
    console.log(`\nProcessing ${oldestArticles.length} oldest articles...`);
    
    const savedArticles = [];
    
    for (const article of oldestArticles) {
      try {
        console.log(`\nProcessing: ${article.title}`);
        console.log(`URL: ${article.link}`);
        
        // Check if article already exists
        const slug = generateSlug(article.title);
        const existing = await Article.findOne({ slug });
        
        if (existing) {
          console.log(`Article already exists: ${article.title}`);
          savedArticles.push(existing);
          continue;
        }
        
        // Scrape full content
        console.log('Scraping article content...');
        const content = await scrapeArticleContent(article.link);
        
        if (!content) {
          console.log(`Warning: Could not scrape content for ${article.title}`);
        }
        
        // Create article
        const newArticle = new Article({
          title: article.title,
          content: content || article.title, // Fallback to title if no content
          originalContent: content || article.title,
          slug: slug,
          publishedDate: parseDate(article.dateText),
          author: article.author || '',
          sourceUrl: article.link
        });
        
        await newArticle.save();
        console.log(`✓ Saved: ${article.title}`);
        savedArticles.push(newArticle);
        
        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing article ${article.title}:`, error.message);
      }
    }
    
    console.log(`\n✓ Scraping complete! Saved ${savedArticles.length} articles.`);
    
    // Only exit if running as standalone script
    if (require.main === module) {
      process.exit(0);
    }
    
    return savedArticles;
    
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Only exit if running as standalone script
    if (require.main === module) {
      process.exit(1);
    }
    
    throw error;
  }
}

// Run scraper
if (require.main === module) {
  scrapeOldestArticles();
}

module.exports = { scrapeOldestArticles };

