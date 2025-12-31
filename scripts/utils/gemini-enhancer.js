const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Initialize Gemini API
 */
function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Enhance article content using Gemini API based on reference articles
 * @param {string} originalContent - Original article content
 * @param {Array} referenceArticles - Array of {title, content, structure} objects
 * @param {string} originalTitle - Original article title
 * @returns {Promise<string>} Enhanced article content
 */
async function enhanceArticle(originalContent, referenceArticles, originalTitle) {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare reference articles summary
    const referenceSummary = referenceArticles.map((ref, index) => {
      return `Reference Article ${index + 1}:
Title: ${ref.title}
Structure: ${ref.structure}
Content Sample: ${ref.content.substring(0, 500)}...`;
    }).join('\n\n');

    // Create prompt
    const prompt = `You are an expert content writer. Your task is to enhance and rewrite an article to match the style, formatting, and quality of top-ranking articles on Google.

ORIGINAL ARTICLE:
Title: ${originalTitle}
Content:
${originalContent}

REFERENCE ARTICLES (Top-ranking articles on Google for this topic):
${referenceSummary}

INSTRUCTIONS:
1. Analyze the structure, formatting, and writing style of the reference articles
2. Rewrite the original article to match the quality and style of the reference articles
3. Maintain the core information and message of the original article
4. Improve the formatting to match reference articles (use similar heading structure, paragraph breaks, etc.)
5. Enhance the content quality, clarity, and engagement
6. Ensure the article is well-structured with proper headings (H2, H3) and paragraphs
7. Make the content more comprehensive and valuable
8. Use a similar tone and writing style as the reference articles
9. Add proper formatting with headings, subheadings, and well-structured paragraphs
10. At the end of the article, add a "References" section with citations to the reference articles

OUTPUT FORMAT:
- Return only the enhanced article content in HTML format
- Use proper HTML tags: <h2> for main headings, <h3> for subheadings, <p> for paragraphs
- Include a "References" section at the bottom with links to the reference articles
- Do not include any meta-commentary or explanations, just the article content

Enhanced Article:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedContent = response.text();

    // Clean up the response (remove markdown code blocks if present)
    let cleanedContent = enhancedContent.trim();
    
    // Remove markdown code blocks
    if (cleanedContent.startsWith('```html')) {
      cleanedContent = cleanedContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    return cleanedContent;
    
  } catch (error) {
    console.error('Gemini API error:', error.message);
    throw error;
  }
}

/**
 * Enhance article without reference articles - just improve formatting and content
 * @param {string} originalContent - Original article content
 * @param {string} originalTitle - Original article title
 * @returns {Promise<string>} Enhanced article content
 */
async function enhanceArticleWithoutReferences(originalContent, originalTitle) {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert content writer and editor. Your task is to enhance and improve an article's formatting, structure, and content quality to make it more professional, engaging, and well-organized.

ORIGINAL ARTICLE:
Title: ${originalTitle}
Content:
${originalContent}

INSTRUCTIONS:
1. Improve the article's structure with proper headings (H2 for main sections, H3 for subsections)
2. Enhance paragraph breaks and formatting for better readability
3. Improve the content quality, clarity, and engagement while maintaining the core message
4. Add proper HTML formatting: <h2> for main headings, <h3> for subheadings, <p> for paragraphs
5. Make the content more comprehensive and valuable
6. Ensure smooth transitions between sections
7. Improve the introduction and conclusion
8. Fix any grammar or spelling issues
9. Make the writing more professional and polished
10. Keep the original information and facts intact - only improve presentation and clarity

OUTPUT FORMAT:
- Return only the enhanced article content in HTML format
- Use proper HTML tags: <h2> for main headings, <h3> for subheadings, <p> for paragraphs
- Do not include any meta-commentary or explanations, just the article content
- Do not add a references section (there are no reference articles)

Enhanced Article:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedContent = response.text();

    // Clean up the response (remove markdown code blocks if present)
    let cleanedContent = enhancedContent.trim();
    
    // Remove markdown code blocks
    if (cleanedContent.startsWith('```html')) {
      cleanedContent = cleanedContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    return cleanedContent;
    
  } catch (error) {
    console.error('Gemini API error:', error.message);
    throw error;
  }
}

/**
 * Add citations to the enhanced content
 * @param {string} content - Enhanced article content
 * @param {Array} referenceArticles - Array of {url, title} objects
 * @returns {string} Content with citations added
 */
function addCitations(content, referenceArticles) {
  if (!referenceArticles || referenceArticles.length === 0) {
    return content;
  }

  // Check if references section already exists
  if (content.toLowerCase().includes('references') || content.toLowerCase().includes('sources')) {
    return content; // Already has citations
  }

  // Create references section
  const referencesHtml = `
<h2>References</h2>
<ul>
${referenceArticles.map(ref => `  <li><a href="${ref.url}" target="_blank" rel="noopener noreferrer">${ref.title}</a></li>`).join('\n')}
</ul>`;

  return content + referencesHtml;
}

module.exports = { enhanceArticle, enhanceArticleWithoutReferences, addCitations };

