import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useParams, useNavigate } from 'react-router-dom';
import chapterApiProvider from '../../apiProvider/chapterApi';
import { hasDeletePermission, hasPermission } from '../../utils/auth';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';

const VisitorFeedbackListLayer = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [chapterInfo, setChapterInfo] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    mobile: '',
    email: '',
    company: '',
    business: '',
    joining: '',
    status: 'Active'
  });

  const fetchFeedbackData = async (chapterId) => {
    try {
      const input = {
        page: pagination.page,
        limit: pagination.limit,
        all: true,
      };

      let response;
      if (chapterId) {
        response = await chapterApiProvider.visitorFeedbackListMember(chapterId, input);
      } else {
        response = await chapterApiProvider.visitorFeedbackList(input);
      }

      if (!response?.status && (response?.httpStatus === 403 || response?.response?.message?.includes('Access Denied'))) {
        setAccessDenied(true);
        await Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'You are not authorized to view this feedback data.',
          confirmButtonText: 'Go Back',
        }).then(() => navigate(-1));
        return;
      }

      // Handle 401 - token expired
      if (!response?.status && response?.httpStatus === 401) {
        await Swal.fire({
          icon: 'warning',
          title: 'Session Expired',
          text: 'Your admin session has expired. Please log in again.',
          confirmButtonText: 'Go to Login',
        }).then(() => navigate('/login'));
        return;
      }

      const full = response?.response || {};
      const chapter = full.chapter || {};
      const visitors = full.data || (Array.isArray(full) ? full : []);

      console.log('[VisitorFeedback] API response:', response);
      console.log('[VisitorFeedback] visitors count:', visitors.length);

      setChapterInfo(chapter);
      setFeedbackList(visitors);

      const total = full.pagination?.total || visitors.length;

      setPagination((prev) => ({
        ...prev,
        total,
        totalPages: Math.ceil(total / prev.limit) || 1,
      }));

    } catch (error) {
      console.error("Error fetching visitor feedback:", error);
    }
  };

  const deleteFeedbackRecord = async (visitorId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete this Visitor Feedback record. This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      width: '400px',
    });

    if (result.isConfirmed) {
      try {
        const response = await chapterApiProvider.deleteVisitorFeedbackById(visitorId);
        if (response && response.status) {
          await Swal.fire('Deleted!', 'Feedback record has been deleted successfully.', 'success');
          fetchFeedbackData(id);
        } else {
          throw new Error(response?.response?.message || 'Failed to delete record.');
        }
      } catch (error) {
        await Swal.fire('Error!', error.message || 'Something went wrong.', 'error');
      }
    }
  };

  const handleOpenEdit = (item) => {
    setEditFormData({
      id: item._id,
      name: item.name || '',
      mobile: item.mobile || '',
      email: item.email || '',
      company: item.company || '',
      business: item.business || item.category || '',
      joining: item.joining || item.joiningStatus || '',
      status: item.status || 'Active'
    });
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      const res = await chapterApiProvider.updateVisitorFeedback(editFormData.id, {
        name: editFormData.name,
        mobile: editFormData.mobile,
        email: editFormData.email,
        company: editFormData.company,
        business: editFormData.business,
        category: editFormData.business,
        joining: editFormData.joining,
        status: editFormData.status
      });
      if (res?.status) {
        toast.success("Visitor feedback updated successfully");
        setShowEditModal(false);
        fetchFeedbackData(id);
      } else {
        toast.error(res?.response?.message || "Failed to update feedback");
      }
    } catch (err) {
      console.error("Error updating visitor feedback:", err);
      toast.error("Failed to update feedback");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  useEffect(() => {
    fetchFeedbackData(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pagination.page]);

  const formatDate = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN");
  };

  return (
    <div className="col-xxl-12 col-xl-12">
      <div className="card h-100 p-0 radius-12">
        <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h5 className="fw-bold mb-1">Visitor Feedback Responses</h5>
            {chapterInfo?.chapterName && (
              <span className="text-secondary-light text-sm">Chapter: {chapterInfo.chapterName}</span>
            )}
          </div>
        </div>
        <div className="card-body p-24">
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table sm-table mb-0">
              <thead>
                <tr>
                  <th className="text-sm fw-semibold text-secondary-light">S.No</th>
                  <th className="text-sm fw-semibold text-secondary-light">Joining Date</th>
                  <th className="text-sm fw-semibold text-secondary-light">Zone / Chapter</th>
                  <th className="text-sm fw-semibold text-secondary-light">Visitor Name</th>
                  <th className="text-sm fw-semibold text-secondary-light">Phone</th>
                  <th className="text-sm fw-semibold text-secondary-light">Email</th>
                  <th className="text-sm fw-semibold text-secondary-light">Company Name</th>
                  <th className="text-sm fw-semibold text-secondary-light">Business / Category</th>
                  <th className="text-sm fw-semibold text-secondary-light">Joining Status</th>
                  <th className="text-sm fw-semibold text-secondary-light">Join by (Invited / Referred By)</th>
                  <th className="text-sm fw-semibold text-secondary-light">Actions</th>
                </tr>
              </thead>

              <tbody>
                {feedbackList?.length > 0 ? (
                  feedbackList.map((item, index) => {
                    const inviter = item?.invitedBy;
                    let inviterName = item?.invited_by_member || item?.invited_from || "-";
                    if (typeof inviter === "object" && inviter !== null) {
                      const name = `${inviter.personalDetails?.firstName || ""} ${inviter.personalDetails?.lastName || ""}`.trim();
                      if (name) inviterName = name;
                    } else if (typeof inviter === "string" && inviter.trim() && inviter !== "-") {
                      inviterName = inviter;
                    }

                    const joiningStatus = item?.joining || item?.joiningStatus || (item?.status && item.status !== "approve" ? item.status : "Submitted");
                    const displayDate =
                      formatDate(item?.joiningDate) ||
                      formatDate(item?.visitDate) ||
                      formatDate(item?.createdAt) ||
                      "-";

                    const locationOrChapter = item?.chapter || chapterInfo?.chapterName || (item?.zone ? `${item.zone}` : "-");

                    return (
                      <tr key={item._id}>
                        <td className="text-sm text-secondary-light">{(pagination.page - 1) * pagination.limit + index + 1}.</td>
                        <td className="text-sm text-secondary-light">{displayDate}</td>
                        <td className="text-sm text-secondary-light">{locationOrChapter}</td>
                        <td className="text-sm fw-semibold text-primary-light">{item.name}</td>
                        <td className="text-sm text-secondary-light">{item.mobile || "-"}</td>
                        <td className="text-sm text-secondary-light">{item.email || "-"}</td>
                        <td className="text-sm text-secondary-light">{item.company || "-"}</td>
                        <td className="text-sm text-secondary-light">{item.business || item.category || "-"}</td>

                        {/* Joining Status Response Badge */}
                        <td className="text-sm text-secondary-light">
                          {joiningStatus ? (
                            <span className={`badge ${
                              joiningStatus.toLowerCase().includes('yes')
                                ? 'bg-success-focus text-success-600'
                                : joiningStatus.toLowerCase().includes('no')
                                ? 'bg-danger-focus text-danger-600'
                                : 'bg-warning-focus text-warning-600'
                            } px-10 py-4 radius-4 fw-semibold text-xs`}>
                              {joiningStatus}
                            </span>
                          ) : (
                            <span className="badge bg-neutral-200 text-neutral-600 px-10 py-4 radius-4 fw-semibold text-xs">
                              Submitted
                            </span>
                          )}
                        </td>

                        {/* Join by (Invited/Referred by) */}
                        <td className="text-sm text-secondary-light">{inviterName}</td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {(hasPermission("visitor-guest-update") || hasPermission("visitor-feedback-update")) && (
                              <button
                                type="button"
                                className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                onClick={() => handleOpenEdit(item)}
                                title="Edit"
                              >
                                <Icon icon="lucide:edit" className="menu-icon" />
                              </button>
                            )}
                            {hasDeletePermission("visitor-guest-delete") && (
                              <button
                                type="button"
                                className="bg-danger-focus text-danger-600 bg-hover-danger-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                onClick={() => deleteFeedbackRecord(item._id)}
                                title="Delete Feedback Record"
                              >
                                <Icon icon="mdi:trash-can-outline" className="menu-icon" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center text-muted text-sm py-4">
                      No visitor feedback responses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} entries
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-danger"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(1)}
                >
                  First
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${pagination.page === pageNum
                            ? "btn btn-primary grip text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                            : "btn-outline-danger"
                          }`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
                <button
                  className="btn btn-sm btn-outline-danger"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.totalPages)}
                >
                  Last
                </button>
              </div>
            </div>
          )}

          {/* Edit Visitor Feedback Modal */}
          <Modal show={showEditModal} onHide={handleCloseEdit} centered>
            <Modal.Header closeButton>
              <Modal.Title className="text-md fw-semibold">Edit Visitor Feedback</Modal.Title>
            </Modal.Header>
            <form onSubmit={handleEditSubmit}>
              <Modal.Body>
                <div className="mb-3">
                  <label className="form-label text-sm fw-medium">Visitor Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    placeholder="Enter visitor name"
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-sm fw-medium">Phone / Mobile</label>
                    <input
                      type="tel"
                      name="mobile"
                      className="form-control"
                      value={editFormData.mobile}
                      onChange={handleEditChange}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-sm fw-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={editFormData.email}
                      onChange={handleEditChange}
                      placeholder="Enter email"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-sm fw-medium">Company Name</label>
                    <input
                      type="text"
                      name="company"
                      className="form-control"
                      value={editFormData.company}
                      onChange={handleEditChange}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-sm fw-medium">Business / Category</label>
                    <input
                      type="text"
                      name="business"
                      className="form-control"
                      value={editFormData.business}
                      onChange={handleEditChange}
                      placeholder="Enter business category"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-sm fw-medium">Joining Status</label>
                    <input
                      type="text"
                      name="joining"
                      className="form-control"
                      value={editFormData.joining}
                      onChange={handleEditChange}
                      placeholder="e.g. Yes, No, Thinking"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-sm fw-medium">Status</label>
                    <select
                      name="status"
                      className="form-select"
                      value={editFormData.status}
                      onChange={handleEditChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCloseEdit}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary grip btn-sm"
                  disabled={submittingEdit}
                >
                  {submittingEdit ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </Modal.Footer>
            </form>
          </Modal>

          <ToastContainer />
        </div>
      </div>
    </div>
  );
};

export default VisitorFeedbackListLayer;
