import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import chapterApiProvider from '../apiProvider/chapterApi';
import VisitorFeedbackListLayer from './child/VisitorFeedbackListLayer';

const VisitorFeedbackOverallLayer = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // 'all' table view | 'chapters' cards view

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const response = await chapterApiProvider.visitorFeedbackList();
      if (response?.status && response?.response?.data) {
        setVisitors(response.response.data);
      } else {
        setVisitors([]);
      }
    } catch (error) {
      console.error("Error fetching chapters for visitor feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Visitor Feedback Header Bar */}
      <div className="d-flex align-items-center justify-content-between mb-24 p-24 shadow-sm flex-wrap gap-3" style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #f3f4f6'
      }}>
        <div>
          <h5 className="fw-bold mb-1" style={{ color: '#1f2937' }}>Visitor Feedback Responses</h5>
          <span className="text-secondary-light text-sm">View submitted visitor feedback form responses across chapters</span>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary grip' : 'btn-outline-primary'} radius-8 px-16 py-8`}
          >
            <Icon icon="solar:list-bold" className="me-1" />
            All Feedback Responses
          </button>
          <button
            onClick={() => setViewMode('chapters')}
            className={`btn btn-sm ${viewMode === 'chapters' ? 'btn-primary grip' : 'btn-outline-primary'} radius-8 px-16 py-8`}
          >
            <Icon icon="solar:widget-bold" className="me-1" />
            By Chapter
          </button>
        </div>
      </div>

      {viewMode === 'all' ? (
        <VisitorFeedbackListLayer />
      ) : (
        <div className="cardd h-100 p-0 radius-12">
          <div className="card-body chapterwisebox p-24">
            <div className='row gy-4'>
              {visitors.length > 0 ? (
                visitors.map((chapter) => (
                  <div className="col-xxl-4 col-md-6 col-sm-12" key={chapter.chapterId}>
                    <Link
                      to={`/visitor-feedback-list/${chapter.chapterId}`}
                      className="d-block text-decoration-none"
                      style={{ transition: 'all 0.3s ease' }}
                    >
                      <div 
                        className="card border-0 overflow-hidden" 
                        style={{
                          background: 'linear-gradient(135deg, #d42c20 0%, #374151 100%)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-6px)';
                          e.currentTarget.style.boxShadow = '0 12px 24px rgba(212, 44, 32, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                        }}
                      >
                        <div className="p-24 d-flex align-items-center justify-content-between">
                          <div>
                            <span style={{ 
                              fontSize: '11px', 
                              textTransform: 'uppercase', 
                              letterSpacing: '1.5px', 
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontWeight: '600',
                              display: 'block',
                              marginBottom: '4px'
                            }}>
                              Chapter
                            </span>
                            <h5 className="fw-bold text-white mb-0" style={{ fontSize: '22px', letterSpacing: '0.5px' }}>
                              {chapter.chapterName}
                            </h5>
                            <span style={{ 
                              fontSize: '13px', 
                              color: 'rgba(255, 255, 255, 0.85)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              marginTop: '8px',
                              gap: '6px',
                              textTransform: 'uppercase',
                              fontWeight: '600'
                            }}>
                              VIEW FEEDBACK
                              <Icon icon="solar:arrow-right-linear" style={{ fontSize: '14px' }} />
                            </span>
                          </div>
                          <div 
                            className="d-flex align-items-center justify-content-center"
                            style={{
                              background: '#ffffff',
                              color: '#d42c20',
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              fontWeight: '700',
                              fontSize: '18px',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                              flexShrink: 0
                            }}
                          >
                            {chapter.overallChapterCount ?? 0}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center text-muted py-5">
                  No chapter visitor feedback found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VisitorFeedbackOverallLayer;
