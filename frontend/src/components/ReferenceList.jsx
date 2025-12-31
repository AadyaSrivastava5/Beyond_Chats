const ReferenceList = ({ references }) => {
  if (!references || references.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        References
      </h3>
      <ul className="space-y-2">
        {references.map((ref, index) => (
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
  );
};

export default ReferenceList;

