import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AnalyticsFilterModal from "./child/AnalyticsFilterModal";
import ExpectedVisitorsApiProvider from "../apiProvider/ExpectedVisitorsApiProvider";
import chapterApiProvider from "../apiProvider/chapterApi";

const ExpectedVisitorsLayer = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [expectedVisitors, setExpectedVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // 1️⃣ Load only ACTIVE chapters
  const fetchChapters = async () => {
    const res = await chapterApiProvider.getAllChapters({ isActive: 1, limit: 500 });
    const rawChapters = res?.response?.data || [];
    // Only keep active chapters (isActive === 1 or true)
    const activeChapters = rawChapters.filter(
      (chapter) => chapter.isActive === 1 || chapter.isActive === "1" || chapter.isActive === true
    );
    setChapters(activeChapters);
  };

  // 2️⃣ Load expected visitors
  const fetchExpectedVisitors = async () => {
    const res = await ExpectedVisitorsApiProvider.getExpectedVisitorsList();
    setExpectedVisitors(res?.response?.data || []);
    console.log("resArish", res);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchChapters(), fetchExpectedVisitors()]);
    } catch (error) {
      console.error("Error loading expected visitors data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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


  // 3️⃣ Group visitors by active chapterId only
  const groupByChapter = (Array.isArray(chapters) ? chapters : [])
    .filter((chapter) => chapter.isActive === 1 || chapter.isActive === "1" || chapter.isActive === true)
    .map((chapter) => {
      // Get ALL visitors for this chapter
      const visitors = (Array.isArray(expectedVisitors) ? expectedVisitors : []).filter(
        (v) => v.chapterId === chapter._id
      );

      // Filter only active visitors (soft delete = 0)
      const activeVisitors = visitors.filter((v) => v.isDelete !== 1);

      return {
        chapterId: chapter._id,
        chapterName: chapter.chapterName,
        visitors, // OPTIONAL — if you still want raw visitors
        activeVisitors, // FINAL filtered list
      };
    });

  return (
    <>
      {/* Expected Visitors Dashboard Header Bar */}
      <div className="d-flex align-items-center justify-content-between mb-24 p-24 shadow-sm flex-wrap gap-3" style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #f3f4f6'
      }}>
        <div>
          <h5 className="fw-bold mb-1" style={{ color: '#1f2937' }}>Chapter Performance Overview</h5>
          <span className="text-secondary-light text-sm">Select a chapter below to view individual performer details</span>
        </div>
        <button onClick={() => setShowFilterModal(true)} className="btn btn-primary grip text-sm px-20 py-11 radius-8 d-flex align-items-center gap-2">
          <Icon icon="solar:graph-bold" style={{ fontSize: '18px' }} />
          View Analytics
        </button>
      </div>

      <AnalyticsFilterModal
        show={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onConfirm={(chapterId) => {
          setShowFilterModal(false);
          navigate(`/expected-visitors-analytics/${chapterId}`);
        }}
        title="Select Zone & Chapter for Expected Visitors Analytics"
      />

      <div className="cardd h-100 p-0 radius-12">
        <div className="card-body chapterwisebox p-24">
          <div className="row gy-4">
            {groupByChapter.map((chapter) => (
              <div className="col-xxl-4 col-md-6 col-sm-12" key={chapter.chapterId}>
                <Link
                  to={`/expected-visitors/${chapter.chapterId}`}
                  className="d-block text-decoration-none"
                  style={{ transition: 'all 0.3s ease' }}
                >
                  <div 
                    className="card border-0 overflow-hidden" 
                    style={{
                      background: 'linear-gradient(135deg, #c02221 0%, #454442 100%)',
                      borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(192, 34, 33, 0.25)';
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
                          color: 'rgba(255, 255, 255, 0.6)',
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
                          color: 'rgba(255, 255, 255, 0.75)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          marginTop: '8px',
                          gap: '6px',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          VIEW PERFORMERS
                          <Icon icon="solar:arrow-right-linear" style={{ fontSize: '14px' }} />
                          <Icon icon="solar:users-group-rounded-linear" style={{ fontSize: '20px', opacity: 0.3, marginLeft: '2px' }} />
                        </span>
                      </div>
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          background: '#ffffff',
                          color: '#c02221',
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          fontWeight: '700',
                          fontSize: '18px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                          flexShrink: 0
                        }}
                      >
                        {chapter.activeVisitors?.length || 0}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
            {groupByChapter.length === 0 && (
              <div className="col-12 text-center py-5">
                <span className="text-secondary">No active chapters found.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpectedVisitorsLayer;
