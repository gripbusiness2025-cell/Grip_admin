import React, { useState, useEffect } from 'react';
import chapterApiProvider from '../../apiProvider/chapterApi';
import { getCurrentUser } from '../../utils/auth';

/**
 * Role-aware Analytics Filter Modal
 *
 * Matches the same role-detection pattern used in DashBoardLayer.jsx:
 *   roleName = typeof user.role === 'object' ? user.role.name : user.role
 *
 * ─────────────────────────────────────────────────────────────────────
 * Admin / Super Admin   → Zone dropdown (all zones) + Chapter dropdown
 * zone-admin / ED       → Zone pre-filled (read-only, their zone)
 *                         + Chapter dropdown (only chapters in that zone)
 * Chapter-level (RD,    → No zone selector at all
 *  Mentor, etc.)          Chapter dropdown shows only permitted chapters
 * ─────────────────────────────────────────────────────────────────────
 */
const AnalyticsFilterModal = ({ show, onClose, onConfirm, title }) => {
  const [zones, setZones]                     = useState([]);
  const [chapters, setChapters]               = useState([]);
  const [selectedZone, setSelectedZone]       = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [loadingZones, setLoadingZones]       = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // ── Derive role context — same pattern as DashBoardLayer.jsx ──────
  const userDetails = getCurrentUser();          // { data: { role, zoneId, chapterIds, … } }
  const sessionUser = userDetails?.data;

  // role can be: 'zone-admin' (string) | role-object { name, permissions } | ObjectId-string
  const rawRole  = sessionUser?.role;
  const roleName = (typeof rawRole === 'object' ? rawRole?.name : rawRole) || '';
  const roleNameLower = roleName.toLowerCase();

  const isSuperAdmin  = roleNameLower === 'admin'
                     || roleNameLower === 'super admin'
                     || roleNameLower === 'super-admin';

  const isED          = roleNameLower === 'ed'
                     || roleNameLower === 'executive director';

  const isZoneAdmin   = roleNameLower === 'zone-admin'; // pure zone-admin (not ED)

  // Zone-admin OR ED both get zone pre-filled
  const isZoneLevel   = isZoneAdmin || isED;

  // Chapter-level users: not super-admin and not any zone-level role
  const isChapterUser = !isSuperAdmin && !isZoneLevel;

  const rawZoneId      = sessionUser?.zoneId;
  const userZoneId     = typeof rawZoneId === 'object' ? rawZoneId?._id || rawZoneId?.id : rawZoneId;
  const userChapterIds = sessionUser?.chapterIds || sessionUser?.chapterId; // array of permitted chapter IDs

  // ── Initialise on open ────────────────────────────────────────────
  useEffect(() => {
    if (!show) return;

    setSelectedZone('');
    setSelectedChapter('');
    setChapters([]);
    setZones([]);

    if (isSuperAdmin) {
      // Full admin: fetch all zones so they can pick one
      fetchAllZones();
    } else if (isZoneLevel && userZoneId) {
      // Zone-admin / ED: zone is pre-set, load its chapters immediately
      setSelectedZone(userZoneId);
      fetchChaptersByZone(userZoneId);
      // Also fetch zones list so we can display the zone name in the read-only field
      fetchAllZones();
    } else {
      // Chapter-level user: skip zone, load permitted chapters directly
      fetchPermittedChapters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // ── Data fetchers ─────────────────────────────────────────────────
  const fetchAllZones = async () => {
    try {
      setLoadingZones(true);
      const res = await chapterApiProvider.getZones({ limit: 200 });
      setZones(res?.response?.data || []);
    } catch (err) {
      console.error('Error fetching zones:', err);
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchChaptersByZone = async (zoneId) => {
    try {
      setLoadingChapters(true);
      const res = await chapterApiProvider.getChaptersByZone(zoneId);
      const list = res?.response?.data || [];
      setChapters(list.filter((ch) => ch.isActive === 1 || ch.isActive === "1" || ch.isActive === true || ch.isActive === undefined));
    } catch (err) {
      console.error('Error fetching chapters by zone:', err);
    } finally {
      setLoadingChapters(false);
    }
  };

  const fetchPermittedChapters = async () => {
    try {
      setLoadingChapters(true);
      const res = await chapterApiProvider.getAllChapters({ limit: 500, isActive: 1 });
      const all = (res?.response?.data || []).filter((ch) => ch.isActive === 1 || ch.isActive === "1" || ch.isActive === true);
      if (userChapterIds && userChapterIds.length > 0) {
        setChapters(all.filter(ch =>
          userChapterIds.some(id => String(id) === String(ch._id))
        ));
      } else {
        setChapters(all);
      }
    } catch (err) {
      console.error('Error fetching permitted chapters:', err);
    } finally {
      setLoadingChapters(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────
  const handleZoneChange = (zoneId) => {
    setSelectedZone(zoneId);
    setSelectedChapter('');
    setChapters([]);
    if (zoneId) fetchChaptersByZone(zoneId);
  };

  const handleConfirm = () => {
    if (selectedChapter) onConfirm(selectedChapter);
  };

  if (!show) return null;

  const chapterDisabled = loadingChapters || (isSuperAdmin && !selectedZone);
  const zoneName = zones.find(z => String(z._id) === String(userZoneId))?.zoneName || 'Your Zone';

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content radius-16 border-0 shadow-lg" style={{ background: '#fff' }}>

          {/* ── Header ── */}
          <div className="modal-header border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
            <h6 className="modal-title fw-bold text-dark mb-0">
              {title || 'Select Chapter for Analytics'}
            </h6>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
              style={{ boxShadow: 'none' }}
            />
          </div>

          {/* ── Body ── */}
          <div className="modal-body p-24">

            {/* ── Zone selector ─────────────────────────────────────── */}
            {isSuperAdmin && (
              /* Full dropdown for Admin / Super Admin */
              <div className="mb-20">
                <label className="form-label fw-semibold text-secondary-light text-sm mb-8">
                  Select Zone
                </label>
                <div className="position-relative">
                  <select
                    className="form-select form-control h-48-px radius-8 px-16"
                    value={selectedZone}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    disabled={loadingZones}
                  >
                    <option value="">-- Choose Zone --</option>
                    {zones.map((zone) => (
                      <option key={zone._id} value={zone._id}>
                        {zone.zoneName}
                      </option>
                    ))}
                  </select>
                  {loadingZones && (
                    <span className="position-absolute end-0 top-50 translate-middle-y me-24">
                      <span className="spinner-border spinner-border-sm text-primary" role="status" />
                    </span>
                  )}
                </div>
              </div>
            )}

            {isZoneLevel && (
              /* Read-only zone badge for Zone-Admin / ED */
              <div className="mb-20">
                <label className="form-label fw-semibold text-secondary-light text-sm mb-8">
                  Zone
                </label>
                <div
                  className="d-flex align-items-center gap-12 px-16 radius-8"
                  style={{
                    height: '48px',
                    background: 'linear-gradient(135deg, #c02221 0%, #454442 100%)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>📍</span>
                  {loadingZones ? 'Loading…' : zoneName}
                </div>
              </div>
            )}

            {/* isChapterUser → zone row is hidden entirely */}

            {/* ── Chapter selector — always shown ───────────────────── */}
            <div className="mb-24">
              <label className="form-label fw-semibold text-secondary-light text-sm mb-8">
                Select Chapter
              </label>
              <div className="position-relative">
                <select
                  className="form-select form-control h-48-px radius-8 px-16"
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  disabled={chapterDisabled}
                >
                  <option value="">
                    {isSuperAdmin && !selectedZone
                      ? '-- Select Zone First --'
                      : '-- Choose Chapter --'}
                  </option>
                  {chapters.map((chapter) => (
                    <option key={chapter._id} value={chapter._id}>
                      {chapter.chapterName}
                    </option>
                  ))}
                </select>
                {loadingChapters && (
                  <span className="position-absolute end-0 top-50 translate-middle-y me-24">
                    <span className="spinner-border spinner-border-sm text-primary" role="status" />
                  </span>
                )}
              </div>
              {isChapterUser && chapters.length === 0 && !loadingChapters && (
                <p className="text-muted text-sm mt-8 mb-0">
                  No chapters are assigned to your account.
                </p>
              )}
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="modal-footer border-top py-16 px-24 d-flex justify-content-end gap-12">
            <button
              type="button"
              className="btn btn-neutral text-sm px-20 py-11 radius-8"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary grip text-sm px-20 py-11 radius-8"
              onClick={handleConfirm}
              disabled={!selectedChapter}
            >
              Continue
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalyticsFilterModal;
