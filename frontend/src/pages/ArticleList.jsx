import { useState, useEffect } from 'react';
import { articlesAPI } from '../services/api';
import ArticleCard from '../components/ArticleCard';
import { useTheme } from '../contexts/ThemeContext';

const ArticleList = () => {
  const { isDark } = useTheme();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [scraping, setScraping] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await articlesAPI.getAll(page, 10);
      
      if (response.success) {
        setArticles(response.data);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch articles');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    try {
      setScraping(true);
      setMessage(null);
      const response = await articlesAPI.triggerScraping();
      
      if (response.success) {
        setMessage('Scraping started! This may take a few minutes. Refreshing articles...');
        // Wait a bit then refresh
        setTimeout(() => {
          fetchArticles();
          setMessage('Articles refreshed! Check the list below.');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to start scraping');
    } finally {
      setScraping(false);
    }
  };

  const handleEnhanceAll = async () => {
    try {
      setEnhancing(true);
      setMessage(null);
      const response = await articlesAPI.enhanceAllArticles();
      
      if (response.success) {
        setMessage(`Enhancement started for ${response.count} articles! This may take several minutes. Refreshing...`);
        // Wait a bit then refresh
        setTimeout(() => {
          fetchArticles();
          setMessage('Articles refreshed! Check for updated versions.');
        }, 5000);
      }
    } catch (err) {
      setError(err.message || 'Failed to start enhancement');
    } finally {
      setEnhancing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Articles</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Showing {articles.length} of {pagination.total} articles
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
            >
              {scraping ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scraping...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Scrape Articles
                </>
              )}
            </button>
            <button
              onClick={handleEnhanceAll}
              disabled={enhancing || pagination.total === 0}
              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
            >
              {enhancing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enhancing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Enhance All
                </>
              )}
            </button>
          </div>
        </div>
        {message && (
          <div className={`mb-4 p-3 rounded-md ${isDark ? 'bg-blue-900/30 border border-blue-800 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
            {message}
          </div>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700/50 p-8 text-center border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg">No articles found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => fetchArticles(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => fetchArticles(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ArticleList;

