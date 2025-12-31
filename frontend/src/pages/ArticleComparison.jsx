import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articlesAPI } from '../services/api';

const ArticleComparison = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [originalContent, setOriginalContent] = useState(null);
  const [updatedContent, setUpdatedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      const articleResponse = await articlesAPI.getById(id);
      if (articleResponse.success) {
        setArticle(articleResponse.data);

        const originalResponse = await articlesAPI.getOriginal(id);
        if (originalResponse.success) {
          setOriginalContent(originalResponse.data);
        }

        if (articleResponse.data.isUpdated) {
          const updatedResponse = await articlesAPI.getUpdated(id);
          if (updatedResponse.success) {
            setUpdatedContent(updatedResponse.data);
          }
        }
      } else {
        setError('Article not found');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content) => {
    if (!content) return <p className="text-gray-400">No content available</p>;
    
    if (content.includes('<')) {
      return (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    
    return (
      <div className="whitespace-pre-wrap">
        {content}
      </div>
    );
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

  if (error || !article) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error || 'Article not found'}</p>
          <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
            ← Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to={`/articles/${id}`}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 inline-flex items-center transition-colors duration-200"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Article
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Comparison: {article.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Side-by-side comparison of original and updated versions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Version */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Original Version</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Published: {new Date(article.publishedDate).toLocaleDateString()}
            </p>
          </div>
          <div className="max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300">
            {renderContent(originalContent?.content || article.originalContent || article.content)}
          </div>
        </div>

        {/* Updated Version */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Updated Version</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {updatedContent?.updatedAt 
                ? `Updated: ${new Date(updatedContent.updatedAt).toLocaleDateString()}`
                : 'Not available'}
            </p>
          </div>
          <div className="max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300">
            {updatedContent 
              ? renderContent(updatedContent.content)
              : <p className="text-gray-400 dark:text-gray-500">This article has not been updated yet.</p>}
          </div>
        </div>
      </div>

      {/* References */}
      {article.referenceArticles && article.referenceArticles.length > 0 && (
        <div className="mt-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Reference Articles
          </h3>
          <ul className="space-y-2">
            {article.referenceArticles.map((ref, index) => (
              <li key={index} className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 mr-2 font-medium">{index + 1}.</span>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline break-all transition-colors duration-200"
                >
                  {ref.title || ref.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ArticleComparison;

