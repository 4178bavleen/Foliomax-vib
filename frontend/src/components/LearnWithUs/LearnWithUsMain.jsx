import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import QuizPage from '../../components/Quiz/Quiz';
import BlogGrid from '../../components/Blog/BlogGrid';
import './LearnWithUs.css';

const API_URL = import.meta.env.VITE_API_BASE;

const TABS = [
  { key: 'quiz', label: 'Quiz', href: '#quiz-section' },
  { key: 'blogs', label: 'Blogs', href: '#blogs-section' },
  { key: 'playful', label: 'Make It Playful', href: '#playful-section' },
  { key: 'newsletter', label: 'Newsletters & Insights', href: '#newsletter-section' },
];

function LearnWithUsMain() {
  const [activeTab, setActiveTab] = useState('quiz');
  const [playfulVideos, setPlayfulVideos] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [loadingPlayful, setLoadingPlayful] = useState(false);
  const [loadingNewsletters, setLoadingNewsletters] = useState(false);
  const tabsRef = useRef(null);

  // Fetch playful videos
  useEffect(() => {
    const fetchPlayful = async () => {
      try {
        setLoadingPlayful(true);
        const res = await fetch(`${API_URL}/foliomax/public/video/public?tags=education`);
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          setPlayfulVideos(json.data.slice(0, 6));
        }
      } catch (err) {
        console.error('Error fetching playful videos:', err);
      } finally {
        setLoadingPlayful(false);
      }
    };
    fetchPlayful();
  }, []);

  // Fetch newsletters/insights
  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        setLoadingNewsletters(true);
        const res = await fetch(`${API_URL}/foliomax/insights?limit=6`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNewsletters(json.data);
        }
      } catch (err) {
        console.error('Error fetching newsletters:', err);
      } finally {
        setLoadingNewsletters(false);
      }
    };
    fetchNewsletters();
  }, []);

  const formatTitle = (title = '') => {
    return title
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveTab(id.replace('-section', ''));
    }
  };

  const scrollTabIntoView = (tabKey) => {
    if (tabsRef.current) {
      const tabButton = tabsRef.current.querySelector(`[data-tab="${tabKey}"]`);
      if (tabButton) {
        tabButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  return (
    <div className="lwu-page">
      {/* Navigation Tabs */}
      <section className="lwu-tabs-section">
        <div className="lwu-container">
          <div className="lwu-tabs-wrapper" ref={tabsRef} role="tablist" aria-label="Learn With Us sections">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                data-tab={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`lwu-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  scrollToSection(tab.href.replace('#', ''));
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section id="quiz-section" className="lwu-section lwu-quiz-section" aria-labelledby="quiz-heading">
        <div className="lwu-container">
          <div className="lwu-section-header">
            <h2 id="quiz-heading">Test Your Knowledge</h2>
            <p>Challenge yourself with our interactive financial quizzes across various companies and topics.</p>
          </div>
          <div className="lwu-glass-card">
            <QuizPage />
          </div>
        </div>
      </section>

      {/* Blogs Section */}
      <section id="blogs-section" className="lwu-section lwu-blogs-section" aria-labelledby="blogs-heading">
        <div className="lwu-container">
          <div className="lwu-section-header">
            <h2 id="blogs-heading">Latest Blogs & Insights</h2>
            <p>Stay informed with financial insights, market knowledge, and educational content from our experts.</p>
          </div>
          <BlogGrid />
        </div>
      </section>

      {/* Make It Playful Section */}
      <section id="playful-section" className="lwu-section lwu-playful-section" aria-labelledby="playful-heading">
        <div className="lwu-container">
          <div className="lwu-section-header">
            <h2 id="playful-heading">Make It <span className="lwu-gradient-text">Playful</span></h2>
            <p>Learn financial concepts through interactive and engaging video experiences.</p>
          </div>

          {loadingPlayful && (
            <div className="lwu-loading">Loading playful content...</div>
          )}

          {!loadingPlayful && playfulVideos.length === 0 && (
            <div className="lwu-empty">
              <div className="lwu-empty-icon">🎬</div>
              <h3>No Playful Content Yet</h3>
              <p>Check back soon for interactive financial learning videos!</p>
            </div>
          )}

          {!loadingPlayful && playfulVideos.length > 0 && (
            <div className="lwu-video-grid">
              {playfulVideos.map((video, index) => {
                const rawTitle = video.originalName || video.title || 'Financial Learning Video';
                const formattedTitle = formatTitle(rawTitle);
                return (
                  <Link
                    key={video.id}
                    to={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lwu-video-card"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="lwu-video-thumbnail">
                      <video
                        src={video.url}
                        muted
                        preload="metadata"
                        playsInline
                        poster={video.thumbnail || ''}
                      />
                      <div className="lwu-play-overlay">
                        <span className="lwu-play-icon" aria-hidden="true">▶</span>
                      </div>
                    </div>
                    <div className="lwu-video-content">
                      <span className="lwu-video-tag">📘 Educational Video</span>
                      <h3 className="lwu-video-title">{formattedTitle}</h3>
                      <span className="lwu-video-cta">Watch Now →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Newsletters & Insights Section */}
      <section id="newsletter-section" className="lwu-section lwu-newsletter-section" aria-labelledby="newsletter-heading">
        <div className="lwu-container">
          <div className="lwu-section-header">
            <h2 id="newsletter-heading">Newsletters & <span className="lwu-gradient-text">Insights</span></h2>
            <p>Stay updated with curated financial insights, market analysis, and educational content delivered regularly.</p>
          </div>

          {loadingNewsletters && (
            <div className="lwu-loading">Loading insights...</div>
          )}

          {!loadingNewsletters && newsletters.length === 0 && (
            <div className="lwu-empty">
              <div className="lwu-empty-icon">📰</div>
              <h3>No Insights Available</h3>
              <p>Fresh market insights and newsletters will appear here.</p>
            </div>
          )}

          {!loadingNewsletters && newsletters.length > 0 && (
            <div className="lwu-insights-grid">
              {newsletters.map((insight, index) => (
                <article key={insight.id} className="lwu-insight-card" style={{ animationDelay: `${index * 100}ms` }}>
                  {insight.coverImage && (
                    <div className="lwu-insight-image-wrapper">
                      <img
                        src={`${API_URL}${insight.coverImage}`}
                        alt={insight.title}
                        className="lwu-insight-image"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="lwu-insight-content">
                    {insight.category && (
                      <span className="lwu-insight-category">{insight.category.name}</span>
                    )}
                    <h3 className="lwu-insight-title">{insight.title}</h3>
                    {insight.shortDescription && (
                      <p className="lwu-insight-excerpt">{insight.shortDescription}</p>
                    )}
                    <div className="lwu-insight-meta">
                      <span className="lwu-insight-author">
                        {insight.authorName || 'Research Team'}
                      </span>
                      <span className="lwu-insight-divider" aria-hidden="true">•</span>
                      <span className="lwu-insight-time">
                        {insight.readingTime || '5 min read'}
                      </span>
                    </div>
                    <Link
                      to={`/etf-mutual-insights?insight=${insight.slug || insight.id}`}
                      className="lwu-insight-link"
                    >
                      Read Full Insight →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="lwu-cta-section">
        <div className="lwu-container">
          <div className="lwu-cta-card">
            <div className="lwu-cta-content">
              <h2>Want to Contribute?</h2>
              <p>Share your financial expertise with our community. Write blogs, create quizzes, or contribute insights.</p>
            </div>
            <Link to="/contact-us" className="lwu-cta-btn">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LearnWithUsMain;