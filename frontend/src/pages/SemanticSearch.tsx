import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { documentService } from '../services/documentService';
import { SemanticSearchRequest } from '../types/document';

function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useState<SemanticSearchRequest>({
    query: '',
    limit: 10,
    threshold: 0.7,
  });
  const navigate = useNavigate();

  const {
    data: searchResults,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['semanticSearch', searchParams],
    queryFn: () => documentService.semanticSearch(searchParams),
    enabled: searchParams.query.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      setSearchParams({
        ...searchParams,
        query: query.trim(),
      });
    }
  };

  const formatSimilarity = (similarity: number) => {
    return (similarity * 100).toFixed(1);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600 dark:text-green-400';
    if (similarity >= 0.7) return 'text-blue-600 dark:text-blue-400';
    if (similarity >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Semantic Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered semantic search to find documents by meaning, not just keywords
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents by meaning... (e.g., 'contract about employment', 'invoice from last month')"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || query.trim().length === 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Advanced Options */}
          <div className="mt-4 flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Threshold:</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={searchParams.threshold}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    threshold: parseFloat(e.target.value) || 0.7,
                  })
                }
                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Limit:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={searchParams.limit}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    limit: parseInt(e.target.value) || 10,
                  })
                }
                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </form>

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5 text-red-600 dark:text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">Search failed</p>
              <p className="text-red-600 dark:text-red-300 text-sm">
                {error instanceof Error ? error.message : 'An error occurred while searching'}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {searchResults && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                Found <span className="font-semibold text-gray-900 dark:text-white">{searchResults.total}</span> results
                {searchParams.query && (
                  <>
                    {' '}for <span className="font-semibold text-gray-900 dark:text-white">"{searchParams.query}"</span>
                  </>
                )}
              </p>
            </div>

            {searchResults.results.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">
                  No documents found matching your query. Try adjusting the threshold or using different keywords.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.results.map((result) => (
                  <div
                    key={result.document.id}
                    onClick={() => navigate(`/documents/${result.document.id}`)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {result.document.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {result.document.filename} • {result.document.file_type.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`w-5 h-5 ${getSimilarityColor(result.similarity)}`}
                        >
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          <polyline points="17 6 23 6 23 12" />
                        </svg>
                        <span className={`font-semibold ${getSimilarityColor(result.similarity)}`}>
                          {formatSimilarity(result.similarity)}%
                        </span>
                      </div>
                    </div>

                    {result.document.extracted_text && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                        {result.document.extracted_text.substring(0, 200)}...
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {result.document.category && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {result.document.category}
                        </span>
                      )}
                      <span>
                        {new Date(result.document.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchResults && !isLoading && !isError && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">
              Enter a search query to find documents using AI-powered semantic search
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default SemanticSearch;

