import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import ReferenceList from '../components/ReferenceList';
import { useTheme } from '../contexts/ThemeContext';

const ArticleDetail = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [article, setArticle] = useState(null);
  const [originalContent, setOriginalContent] = useState(null);
  const [updatedContent, setUpdatedContent] = useState(null);
  const [activeTab, setActiveTab] = useState('updated'); // 'original' or 'updated'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceMessage, setEnhanceMessage] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch main article
      const articleResponse = await articlesAPI.getById(id);
      if (articleResponse.success) {
        setArticle(articleResponse.data);
        
        // Fetch original version
        try {
          const originalResponse = await articlesAPI.getOriginal(id);
          if (originalResponse.success) {
            setOriginalContent(originalResponse.data);
          }
        } catch (err) {
          console.error('Error fetching original:', err);
        }

        // Fetch updated version if available
        if (articleResponse.data.isUpdated) {
          try {
            const updatedResponse = await articlesAPI.getUpdated(id);
            if (updatedResponse.success) {
              setUpdatedContent(updatedResponse.data);
              setActiveTab('updated');
            }
          } catch (err) {
            console.error('Error fetching updated:', err);
            setActiveTab('original');
          }
        } else {
          setActiveTab('original');
        }
      } else {
        setError('Article not found');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching the article');
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEnhance = async () => {
    try {
      setEnhancing(true);
      setEnhanceMessage(null);
      const response = await articlesAPI.enhanceArticle(id);
      
      if (response.success) {
        setEnhanceMessage(response.hadReferences 
          ? 'Article enhanced with reference articles!'
          : 'Article enhanced with improved formatting!');
        // Refresh article data
        await fetchArticle();
      }
    } catch (err) {
      setEnhanceMessage('Failed to enhance article: ' + (err.message || 'Unknown error'));
    } finally {
      setEnhancing(false);
      setTimeout(() => setEnhanceMessage(null), 5000);
    }
  };

  const renderContent = (content) => {
    if (!content) return null;
    
    // If content is HTML, render it
    if (content.includes('<')) {
      return (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    
    // Otherwise render as plain text with line breaks
    return (
      <div className="whitespace-pre-wrap">
        {content}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error || 'Article not found'}</p>
          <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
            ← Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const currentContent = activeTab === 'updated' && updatedContent 
    ? updatedContent.content 
    : (originalContent?.content || article.content);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 inline-flex items-center transition-colors duration-200"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Articles
      </Link>

      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700/50 p-8 border border-gray-200 dark:border-gray-700">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>
          
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-6">
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              {article.author && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {article.author}
                </span>
              )}
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Published: {formatDate(article.publishedDate)}
              </span>
              {article.updatedAt && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Updated: {formatDate(article.updatedAt)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {article.isUpdated && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-medium border border-green-200 dark:border-green-800">
                  Enhanced
                </span>
              )}
              {!article.isUpdated && (
                <button
                  onClick={handleEnhance}
                  disabled={enhancing}
                  className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  {enhancing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Enhance
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {enhanceMessage && (
            <div className={`mb-4 p-3 rounded-md ${isDark ? 'bg-blue-900/30 border border-blue-800 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
              {enhanceMessage}
            </div>
          )}

          {/* Tabs */}
          {article.isUpdated && originalContent && (
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('original')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'original'
                      ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Original Version
                </button>
                <button
                  onClick={() => setActiveTab('updated')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'updated'
                      ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Updated Version
                </button>
              </nav>
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8 prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400">
          {renderContent(currentContent)}
        </div>

        {/* References */}
        {activeTab === 'updated' && article.referenceArticles && article.referenceArticles.length > 0 && (
          <ReferenceList references={article.referenceArticles} />
        )}

        {/* Comparison Link */}
        {article.isUpdated && originalContent && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              to={`/articles/${id}/compare`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              View Side-by-Side Comparison
            </Link>
          </div>
        )}
      </article>
    </div>
  );
};

export default ArticleDetail;

