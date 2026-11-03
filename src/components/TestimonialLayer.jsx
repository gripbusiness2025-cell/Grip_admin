import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useParams, useNavigate } from 'react-router-dom';
import chapterApiProvider from '../apiProvider/chapterApi';
import { IMAGE_BASE_URL } from '../network/apiClient';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { hasDeletePermission, hasPermission } from '../utils/auth';

const TestimonialLayer = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);

    const handleShowDoc = (docUrl) => {
        setSelectedDoc(docUrl);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setSelectedDoc('');
    };

    const [chapterMembers, setchapterMembers] = useState([]);

    const isImage = (url) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url || '');
    const isPdf = (url) => /\.(pdf)$/i.test(url || '');

    const { id } = useParams();
    const navigate = useNavigate();

    // ------------------ PAGINATION STATE ------------------
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
        comments: '',
        status: 'Active',
        fromMemberName: '',
        toMemberName: ''
    });

    // ------------------ FETCH WITH PAGINATION ------------------
    const fetchChapters = async (id) => {
        try {
            const input = {
                page: pagination.page,
                limit: pagination.limit
            };

            const response = await chapterApiProvider.testimonialSlipListMember(id, input);

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

            const mainData = response?.response?.data;
            const paginationData = mainData?.pagination || {};

            // your original state setter
            setchapterMembers(mainData);

            // update pagination
            setPagination((prev) => ({
                ...prev,
                total: paginationData.total || 0,
                totalPages: Math.ceil((paginationData.total || 0) / pagination.limit),
            }));
        } catch (error) {
            console.error("Error fetching chapters:", error);
        }
    };

    useEffect(() => {
        fetchChapters(id);
    }, [id, pagination.page]);

    const deleteTestimonial = async (testimonialId) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `You are about to delete this Testimonial. This action cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            customClass: {
                popup: "small-swal-popup",
                title: "small-swal-title",
                htmlContainer: "small-swal-text",
                confirmButton: "small-swal-confirm-btn",
                cancelButton: "small-swal-cancel-btn",
            },
            width: "400px",
        });

        if (result.isConfirmed) {
            try {
                const response = await chapterApiProvider.deleteTestimonialById(testimonialId);

                if (response && response.status) {
                    await Swal.fire(
                        "Deleted!",
                        `The testimonial has been deleted successfully.`,
                        "success"
                    );
                    fetchChapters(id);
                } else {
                    throw new Error(response?.response?.message || "Failed to delete testimonial record.");
                }
            } catch (error) {
                await Swal.fire(
                    "Error!",
                    error.message || "Something went wrong while deleting the testimonial record.",
                    "error"
                );
            }
        }
    };

    const handleOpenEdit = (item) => {
        setEditFormData({
            id: item._id,
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
            const res = await chapterApiProvider.updateTestimonial(editFormData.id, {
                comments: editFormData.comments,
                status: editFormData.status
            });
            if (res?.status) {
                toast.success("Testimonial updated successfully");
                setShowEditModal(false);
                fetchChapters(id);
            } else {
                toast.error(res?.response?.message || "Failed to update record");
            }
        } catch (err) {
            console.error("Error updating testimonial:", err);
            toast.error("Failed to update record");
        } finally {
            setSubmittingEdit(false);
        }
    };

    const handleStatusChange = async (status, recordId) => {
        if (!status) return;
        try {
            let input = {
                status: status,
                id: recordId,
                formName: "testimonialslips"
            };
            const response = await chapterApiProvider.changeStatus(input);

            if (response) {
                toast("status updated successfully");
                fetchChapters(id);
            } else {
                toast("failed to update status");
                fetchChapters(id);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
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
                                    <th>Testimonial to</th>
                                    <th>Chapter</th>
                                    <th>Comments</th>
                                    <th>Uploaded Doc</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {chapterMembers?.records?.map((item, index) => (
                                    <tr key={item._id}>
                                        <td>{(pagination.page - 1) * pagination.limit + index + 1}.</td>
                                        <td>{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>

                                        <td>
                                            <div className="d-flex flex-column">
                                                <span>{item.fromMember.name}</span>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="d-flex flex-column">
                                                <span>{item.toMember.name}</span>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="d-flex flex-column">
                                                <span>{chapterMembers?.chapter?.chapterName}</span>
                                                <small className="text-muted">{chapterMembers?.chapter?.zoneName}</small>
                                            </div>
                                        </td>

                                        <td>{item.comments || '-'}</td>

                                        <td>
                                            {item.images?.length > 0 ? (
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() =>
                                                        handleShowDoc(
                                                            `${IMAGE_BASE_URL}/${item.images[0].docPath}/${item.images[0].docName}`
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>
                                            ) : (
                                                <span className="text-muted">No document</span>
                                            )}
                                        </td>



                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                {hasPermission("testimonial-update") && (
                                                    <button
                                                        type="button"
                                                        className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        onClick={() => handleOpenEdit(item)}
                                                        title="Edit"
                                                    >
                                                        <Icon icon="lucide:edit" className="menu-icon" />
                                                    </button>
                                                )}
                                                {hasDeletePermission("testimonial-delete") && (
                                                    <button
                                                        type="button"
                                                        className="bg-danger-focus text-danger-600 bg-hover-danger-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        onClick={() => deleteTestimonial(item._id)}
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

                    {/* 🔥 PAGINATION UI */}
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

                    {/* Document Modal */}
                    <Modal show={showModal} onHide={handleClose} size="m" centered>
                        <Modal.Body className="text-center p-0">
                            {isImage(selectedDoc) ? (
                                <img src={selectedDoc} alt="Document" className="img-fluid" />
                            ) : (
                                (() => {
                                    if (selectedDoc) {
                                        window.open(selectedDoc, "_blank");
                                        handleClose();
                                    }
                                    return null;
                                })()
                            )}
                        </Modal.Body>
                    </Modal>

                    {/* Edit Testimonial Modal */}
                    <Modal show={showEditModal} onHide={handleCloseEdit} centered>
                        <Modal.Header closeButton>
                            <Modal.Title className="text-md fw-semibold">Edit Testimonial</Modal.Title>
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
                                    <label className="form-label text-sm fw-medium">Comments / Testimonial Text</label>
                                    <textarea
                                        name="comments"
                                        className="form-control"
                                        rows="4"
                                        value={editFormData.comments}
                                        onChange={handleEditChange}
                                        placeholder="Enter testimonial text"
                                        required
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
        </div>
    );
};

export default TestimonialLayer;
