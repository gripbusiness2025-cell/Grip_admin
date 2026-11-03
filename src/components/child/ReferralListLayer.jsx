import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useParams, useNavigate } from 'react-router-dom';
import chapterApiProvider from '../../apiProvider/chapterApi';
import { toast, ToastContainer } from 'react-toastify';
import { hasDeletePermission, hasPermission } from '../../utils/auth';
import Swal from 'sweetalert2';

const ReferralListLayer = () => {

    const [chapterMembers, setchapterMembers] = useState([]);
    const [chapterName, setChapterName] = useState("");
    const [accessDenied, setAccessDenied] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();

    // ✅ PAGINATION STATE
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
        name: '',
        mobileNumber: '',
        comments: '',
        address: '',
        referalStatus: '',
        status: 'Active',
        fromMemberName: '',
        toMemberName: ''
    });

    // ✅ UPDATED API CALL WITH PAGE + LIMIT
    const fetchChapters = async (id) => {
        try {
            const input = {
                page: pagination.page,
                limit: pagination.limit
            };

            const response = await chapterApiProvider.refferalListMember(id, input);

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

            const listData = response?.response?.data?.records || [];
            const paginationData = response?.response?.data?.pagination || {};
            const chapter = response?.response?.data?.chapter;

            setchapterMembers(listData);
            setChapterName(chapter?.chapterName || "-");

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
    }, [id, pagination.page]);

    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    const deleteReferralSlip = async (referralSlipId) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `You are about to delete the referral slip . This action cannot be undone!`,
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
                const response = await chapterApiProvider.deleteReferralSlipById(referralSlipId);

                if (response && response.status) {
                    await Swal.fire(
                        "Deleted!",
                        `The referral slip has been deleted successfully.`,
                        "success"
                    );

                    fetchChapters(id);
                } else {
                    throw new Error(response?.response?.message || "Failed to delete referral slip record.");
                }
            } catch (error) {
                await Swal.fire(
                    "Error!",
                    error.message || "Something went wrong while deleting.",
                    "error"
                );
            }
        }
    };

    const handleShowImage = (image) => {
        setSelectedImage(image);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setSelectedImage('');
    };

    const handleOpenEdit = (referral) => {
        const details = referral.referalDetails || referral.referalDetail || {};
        setEditFormData({
            id: referral._id,
            name: details.name || '',
            mobileNumber: details.mobileNumber || '',
            comments: details.comments || '',
            address: details.address || '',
            referalStatus: referral.referalStatus || '',
            status: referral.status || 'Active',
            fromMemberName: referral.fromMember?.name || 'N/A',
            toMemberName: referral.toMember?.name || 'N/A'
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
            const res = await chapterApiProvider.updateReferralSlip(editFormData.id, {
                name: editFormData.name,
                mobileNumber: editFormData.mobileNumber,
                comments: editFormData.comments,
                address: editFormData.address,
                referalStatus: editFormData.referalStatus,
                status: editFormData.status
            });
            if (res?.status) {
                toast.success("Referral updated successfully");
                setShowEditModal(false);
                fetchChapters(id);
            } else {
                toast.error(res?.response?.message || "Failed to update referral");
            }
        } catch (err) {
            console.error("Error updating referral:", err);
            toast.error("Failed to update referral");
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
                formName: "referralslip"
            }
            const response = await chapterApiProvider.changeStatus(input);

            if (response) {
                toast("status updated successfully")
                fetchChapters(id);
            } else {
                toast("failed to update status")
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
                                    <th>To</th>
                                    <th>Chapter Name</th>
                                    <th>Referral Name</th>
                                    <th>Referral Number</th>
                                    <th>Comments</th>

                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {chapterMembers?.map((referral, index) => (
                                    <tr key={referral._id}>
                                        <td>{(pagination.page - 1) * pagination.limit + index + 1}.</td>
                                        <td>{new Date(referral.createdAt).toLocaleDateString()}</td>

                                        <td>{referral.fromMember.name}</td>
                                        <td>{referral.toMember.name}</td>

                                        <td>{chapterName}</td>

                                        <td>{referral.referalDetails.name}</td>
                                        <td>{referral.referalDetails.mobileNumber}</td>
                                        <td>{referral.referalDetails.comments}</td>



                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                {hasPermission("referrals-update") && (
                                                    <button
                                                        type="button"
                                                        className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        onClick={() => handleOpenEdit(referral)}
                                                        title="Edit"
                                                    >
                                                        <Icon icon="lucide:edit" className="menu-icon" />
                                                    </button>
                                                )}
                                                {hasDeletePermission("referrals-delete") && (
                                                    <button
                                                        type="button"
                                                        className="bg-danger-focus text-danger-600 bg-hover-danger-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        onClick={() => deleteReferralSlip(referral._id)}
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

                        <ToastContainer />
                    </div>

                    {/* ✅ PAGINATION UI */}
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

                    {/* Image Modal */}
                    <Modal show={showModal} onHide={handleClose} centered>
                        <Modal.Body className="text-center">
                            <img src={selectedImage} alt="Profile" className="img-fluid" />
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleClose}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Edit Referral Modal */}
                    <Modal show={showEditModal} onHide={handleCloseEdit} centered>
                        <Modal.Header closeButton>
                            <Modal.Title className="text-md fw-semibold">Edit Referral Slip</Modal.Title>
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
                                    <label className="form-label text-sm fw-medium">Referral Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        value={editFormData.name}
                                        onChange={handleEditChange}
                                        placeholder="Enter referral person name"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-sm fw-medium">Mobile Number</label>
                                    <input
                                        type="tel"
                                        name="mobileNumber"
                                        className="form-control"
                                        value={editFormData.mobileNumber}
                                        onChange={handleEditChange}
                                        placeholder="Enter mobile number"
                                    />
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
                                <div className="mb-3">
                                    <label className="form-label text-sm fw-medium">Comments</label>
                                    <textarea
                                        name="comments"
                                        className="form-control"
                                        rows="3"
                                        value={editFormData.comments}
                                        onChange={handleEditChange}
                                        placeholder="Enter comments / details"
                                    ></textarea>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label text-sm fw-medium">Referral Status</label>
                                        <select
                                            name="referalStatus"
                                            className="form-select"
                                            value={editFormData.referalStatus}
                                            onChange={handleEditChange}
                                        >
                                            <option value="">Select</option>
                                            <option value="Told Them You Would Call">Told Them You Would Call</option>
                                            <option value="Given Your Card">Given Your Card</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label text-sm fw-medium">Record Status</label>
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

                </div>
            </div>
        </div>
    );
};

export default ReferralListLayer;
