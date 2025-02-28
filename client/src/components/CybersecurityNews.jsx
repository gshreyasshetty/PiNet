import React, { useState, useEffect } from 'react';

const CybersecurityNews = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const API_KEY = '47151991aa5a477a95373fd5b81a12bb'; // Replace with your NewsAPI key
  const API_URL = `https://newsapi.org/v2/everything?q=cybersecurity&language=en&sortBy=publishedAt&pageSize=100&apiKey=${API_KEY}`;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch news');
        const data = await response.json();
        const formattedNews = data.articles.map((article, index) => ({
          id: index,
          title: article.title,
          summary: article.description || 'No summary available',
          image: article.urlToImage || `https://via.placeholder.com/300x120.png?text=Cyber+News+${index + 1}`,
          link: article.url,
          date: new Date(article.publishedAt).toLocaleDateString(),
        }));
        setNewsItems(formattedNews);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const totalPages = Math.ceil(newsItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = newsItems.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="text-2xl font-semibold text-[#1f2a44] animate-pulse">
          Fetching Cybersecurity Updates...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="text-xl text-red-600 font-medium">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <header className="bg-white shadow-md rounded-lg p-8 text-center border-b border-gray-200">
        <h1 className="text-4xl font-bold text-[#00c4b4]">CyberWatch News</h1>
        <p className="mt-2 text-lg text-[#6b7280]">Global Cybersecurity Updates at Your Fingertips</p>
      </header>

      {/* News Grid */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {paginatedItems.map((item) => (
          <article
            key={item.id}
            className="bg-white rounded-lg shadow-md overflow-hidden transform transition hover:-translate-y-2 hover:shadow-lg"
          >
            <div className="w-full h-32">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x120.png?text=News+Image';
                }}
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#1f2a44] line-clamp-2 hover:text-[#00c4b4]">
                {item.title}
              </h2>
              <p className="mt-2 text-[#6b7280] text-sm line-clamp-3">{item.summary}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-[#9ca3af]">{item.date}</span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00c4b4] font-semibold text-sm hover:bg-[#00c4b4]/10 px-3 py-1 rounded transition"
                >
                  Read More
                </a>
              </div>
            </div>
          </article>
        ))}
      </main>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-[#d1d5db] rounded-lg text-[#00c4b4] font-semibold hover:bg-[#00c4b4]/10 disabled:text-[#9ca3af] disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                currentPage === page
                  ? 'bg-[#00c4b4] text-white'
                  : 'bg-white border border-[#d1d5db] text-[#1f2a44] hover:bg-[#00c4b4]/10'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-[#d1d5db] rounded-lg text-[#00c4b4] font-semibold hover:bg-[#00c4b4]/10 disabled:text-[#9ca3af] disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CybersecurityNews;