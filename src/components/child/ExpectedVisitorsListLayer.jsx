import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useParams, useNavigate } from "react-router-dom";
import ExpectedVisitorsApiProvider from "../../apiProvider/ExpectedVisitorsApiProvider";
import { hasDeletePermission, hasPermission } from "../../utils/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';



const ExpectedVisitorsListLayer = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();

  const [chapterInfo, setChapterInfo] = useState({});
  const [expectedVisitors, setExpectedVisitors] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);

  // Pagination (optional)
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
    company: '',
    category: '',
    mobile: '',
    email: '',
    address: '',
    visitDate: '',
    status: 'Active'
  });

  const fetchExpectedVisitors = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      const res = await ExpectedVisitorsApiProvider.getExpectedVisitorsById(
        chapterId,
        params
      );

      // Handle 403 Access Denied
      if (!res?.status && (res?.httpStatus === 403 || res?.response?.message?.includes('Access Denied'))) {
        setAccessDenied(true);
        await Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'You are not authorized to view this chapter.',
          confirmButtonText: 'Go Back',
        }).then(() => navigate(-1));
        return;
      }

      const apiData = res?.response?.data || {};

      setChapterInfo(apiData.chapter || {});
      setExpectedVisitors(apiData.records || []);

      // pagination update
      const total = apiData.pagination?.total || apiData.records?.length || 0;
      setPagination((prev) => ({
        ...prev,
        total,
        totalPages: Math.ceil(total / prev.limit),
      }));
    } catch (error) {
      console.error("Error fetching visitors:", error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

 const deleteExpectedVisitor = async (id) => {
  // Show confirmation popup
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You are about to delete this expected visitor. This action cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    width: "400px",
  });

  // If user confirms delete
  if (result.isConfirmed) {
    try {
      const res = await ExpectedVisitorsApiProvider.deleteExpectedVisitor(id);

      if (res.status) {
        // Success popup
        await Swal.fire(
          "Deleted!",
          "Expected Visitor deleted successfully.",
          "success"
        );

        // Remove item from state (no refresh)
        setExpectedVisitors((prev) =>
          prev.filter((item) => item._id !== id)
        );

        // Update pagination count
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
          totalPages: Math.ceil((prev.total - 1) / prev.limit),
        }));
      } else {
        await Swal.fire("Error!", "Failed to delete visitor!", "error");
      }

    } catch (error) {
      console.error("Delete error:", error);
      await Swal.fire("Error!", "Something went wrong!", "error");
    }
  }
};

  const handleOpenEdit = (item) => {
    setEditFormData({
      id: item._id,
      name: item.name || '',
      company: item.company || '',
      category: item.category || '',
      mobile: item.mobile || '',
      email: item.email || '',
      address: item.address || '',
      visitDate: item.visitDate ? new Date(item.visitDate).toISOString().split('T')[0] : '',
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
      const res = await ExpectedVisitorsApiProvider.updateExpectedVisitor(editFormData.id, {
        name: editFormData.name,
        company: editFormData.company,
        category: editFormData.category,
        mobile: editFormData.mobile,
        email: editFormData.email,
        address: editFormData.address,
        visitDate: editFormData.visitDate,
        status: editFormData.status
      });
      if (res?.status) {
        toast.success("Expected visitor updated successfully");
        setShowEditModal(false);
        fetchExpectedVisitors();
      } else {
        toast.error(res?.response?.message || "Failed to update visitor");
      }
    } catch (err) {
      console.error("Error updating expected visitor:", err);
      toast.error("Failed to update visitor");
    } finally {
      setSubmittingEdit(false);
    }
  };




  // Load on chapterId or page change
  useEffect(() => {
    if (chapterId) fetchExpectedVisitors();
  }, [chapterId, pagination.page]);

  return (
    <div className="col-xxl-12 col-xl-12">
      <div className="card h-100 p-0 radius-12">
        <div className="card-body p-24">
          <h5 className="mb-3">{chapterInfo.chapterName} - Expected Visitors</h5>

          <div className="table-responsive scroll-sm">
            <table className="table bordered-table sm-table mb-0">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Visitor Name</th>
                  <th>Company</th>
                  <th>Category</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Invited By</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {expectedVisitors?.length > 0 ? (
                  expectedVisitors.map((item, index) => (
                    <tr key={item._id}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}.</td>
                      <td>{new Date(item.createdAt).toLocaleDateString("en-IN")}</td>
                      <td>{item.name}</td>
                      <td>{item.company}</td>
                      <td>{item.category}</td>
                      <td>{item.mobile}</td>
                      <td>{item.email}</td>
                      <td>
                        {item.invite?.name || "-"}
                        <br />
                        {item.invite?.mobile || ""}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {hasPermission("expected-visitors-update") && (
                            <button
                              type="button"
                              className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit"
                            >
                              <Icon icon="lucide:edit" className="menu-icon" />
                            </button>
                          )}
                          {hasDeletePermission("expected-visitors-delete") && (
                            <button
                              type="button"
                              className="bg-danger-focus text-danger-600 bg-hover-danger-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                              onClick={() => deleteExpectedVisitor(item._id)}
                              title="Delete"
                            >
                              <Icon icon="mdi:trash-can-outline" className="menu-icon" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center text-muted">
                      No expected visitors
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
        </div>
      </div>

      {/* Edit Expected Visitor Modal */}
      <Modal show={showEditModal} onHide={handleCloseEdit} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-md fw-semibold">Edit Expected Visitor</Modal.Title>
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
                <label className="form-label text-sm fw-medium">Company</label>
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
                <label className="form-label text-sm fw-medium">Category / Business</label>
                <input
                  type="text"
                  name="category"
                  className="form-control"
                  value={editFormData.category}
                  onChange={handleEditChange}
                  placeholder="Enter category"
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label text-sm fw-medium">Mobile</label>
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
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label text-sm fw-medium">Visit Date</label>
                <input
                  type="date"
                  name="visitDate"
                  className="form-control"
                  value={editFormData.visitDate}
                  onChange={handleEditChange}
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
            <div className="mb-3">
              <label className="form-label text-sm fw-medium">Address</label>
              <input
                type="text"
                name="address"
                className="form-control"
                value={editFormData.address}
                onChange={handleEditChange}
                placeholder="Enter address"
              />
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
  );
};

export default ExpectedVisitorsListLayer;
