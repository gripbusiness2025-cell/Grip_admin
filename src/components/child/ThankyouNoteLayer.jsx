import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import chapterApiProvider from '../../apiProvider/chapterApi';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import { hasDeletePermission, hasPermission } from '../../utils/auth';

const ThankyouNoteLayer = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [chapterMembers, setchapterMembers] = useState({});
    const [accessDenied, setAccessDenied] = useState(false);
    
    const { id } = useParams();
    const navigate = useNavigate();

    // ✅ PAGINATION STATE (ONLY NEW ADDITION)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [submittingEdit, setSubmittingEdit] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: '',
        amount: '',
        comments: '',
        status: 'Active',
        fromMemberName: '',
        toMemberName: ''
    });

    const handleClose = () => {
        setShowModal(false);
        setSelectedImage('');
    };

    // ✅ UPDATED FETCH WITH PAGE & LIMIT
    const fetchChapters = async (id) => {
        try {
            const input = {
                page: pagination.page,
                limit: pagination.limit
            };

            const response = await chapterApiProvider.thankYouSlipListMember(id, input);

            // Handle 403 Access Denied
            if (!response?.status && (response?.httpStatus === 403 || response?.response?.message?.includes('Access Denied'))) {
                setAccessDenied(true);
                await Swal.fire({
                    icon: 'error',
                    title: 'Access Denied',
                    text: 'You are not authorized to view this chapter.',
                    confirmButtonText: 'Go Back',
                }).then(() => navigate(-1));
                return;
            }

            const paginationData = response?.response?.data?.pagination || {};

            setchapterMembers(response?.response?.data || {});

            setPagination((prev) => ({
                ...prev,
                total: paginationData.total || 0,
                totalPages: Math.ceil((paginationData.total || 0) / prev.limit),
            }));

        } catch (error) {
            console.error("Error fetching chapters:", error);
        }
    };

    useEffect(() => {
        fetchChapters(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, pagination.page]);

    const deleteThankYouSlip = async (thankYouSlipId) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `You are about to delete the Thank You Slip. This action cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            width: "400px",
        });

        if (result.isConfirmed) {
            try {
                const response = await chapterApiProvider.deleteThankYouSlipById(thankYouSlipId);

                if (response && response.status) {
                    await Swal.fire(
                        "Deleted!",
                        `The Thank You Slip has been deleted successfully.`,
                        "success"
                    );

                    fetchChapters(id);
                } else {
                    throw new Error(response?.response?.message || "Failed to delete record.");
                }
            } catch (error) {
                await Swal.fire(
                    "Error!",
                    error.message || "Something went wrong.",
                    "error"
                );
            }
        }
    };

    const handleOpenEdit = (item) => {
        setEditFormData({
            id: item._id,
            amount: item.amount !== undefined ? item.amount : '',
            comments: item.comments || '',
            status: item.status || 'Active',
            fromMemberName: item.fromMember?.name || 'N/A',
            toMemberName: item.toMember?.name || 'N/A'
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
            const res = await chapterApiProvider.updateThankYouSlip(editFormData.id, {
                amount: Number(editFormData.amount),
                comments: editFormData.comments,
                status: editFormData.status
            });
            if (res?.status) {
                toast.success("Thank You Slip updated successfully");
                setShowEditModal(false);
                fetchChapters(id);
            } else {
                toast.error(res?.response?.message || "Failed to update record");
            }
        } catch (err) {
            console.error("Error updating thank you slip:", err);
            toast.error("Failed to update record");
        } finally {
            setSubmittingEdit(false);
        }
    };



    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="col-xxl-12 col-xl-12">
            <div className="card h-100 p-0 radius-12">
                <div className="card-body p-24">
                    <div className="table-responsive scroll-sm">
                        <table className="table bordered-table sm-table mb-0">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Date</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Value</th>
                                    <th>Chapter</th>
                                    <th>Comments</th>

                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {chapterMembers?.records?.map((item, index) => (
                                    <tr key={item._id}>
                                        {/* 🔥 Updated S.No — Correct with Pagination */}
                                        <td>{(pagination.page - 1) * pagination.limit + index + 1}.</td>

                                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                        <td>{item.fromMember.name}</td>
                                        <td>{item.toMember.name}</td>
                                        <td>{item.amount}</td>

                                        <td>
                                            <div>{chapterMembers?.chapter?.chapterName}</div>
                                            <small className="text-muted">
                                                Zone: {chapterMembers?.chapter?.zoneName}
                                            </small>
                                        </td>

                                        <td>{item.comments}</td>



                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                {hasPermission("thank-you-slip-update") && (
                                                    <button
                                                        type="button"
                                                        className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        onClick={() => handleOpenEdit(item)}
                                                        title="Edit"
                                                    >
                                                        <Icon icon="lucide:edit" className="menu-icon" />
                                                    </button>
                                                )}
                                                {hasDeletePermission("thank-you-slip-delete") && (
                                                    <button
                                                        type="button"
                                                        className="bg-danger-focus text-danger-600 bg-hover-danger-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        onClick={() => deleteThankYouSlip(item._id)}
                                                        title="Delete"
                                                    >
                                                        <Icon icon="mdi:trash-can-outline" className="menu-icon" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ✅ PAGINATION UI (Simple, clean) */}
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

                    <Modal show={showModal} onHide={handleClose} centered>
                        <Modal.Body className="text-center">
                            <img src={selectedImage} alt="Popup" className="img-fluid" />
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleClose}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Edit Thank You Slip Modal */}
                    <Modal show={showEditModal} onHide={handleCloseEdit} centered>
                        <Modal.Header closeButton>
                            <Modal.Title className="text-md fw-semibold">Edit Thank You Slip</Modal.Title>
                        </Modal.Header>
                        <form onSubmit={handleEditSubmit}>
                            <Modal.Body>
                                <div className="mb-3 p-3 bg-light rounded-8">
                                    <div className="text-xs text-muted mb-1">Members:</div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <span className="fw-medium text-dark"><span className="text-muted">From:</span> {editFormData.fromMemberName}</span>
                                        <Icon icon="lucide:arrow-right" className="text-muted mx-2" />
                                        <span className="fw-medium text-dark"><span className="text-muted">To:</span> {editFormData.toMemberName}</span>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-sm fw-medium">Business Value (₹)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        className="form-control"
                                        value={editFormData.amount}
                                        onChange={handleEditChange}
                                        placeholder="Enter amount"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-sm fw-medium">Comments</label>
                                    <textarea
                                        name="comments"
                                        className="form-control"
                                        rows="3"
                                        value={editFormData.comments}
                                        onChange={handleEditChange}
                                        placeholder="Enter comments"
                                    ></textarea>
                                </div>
                                <div className="mb-3">
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
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default ThankyouNoteLayer;
