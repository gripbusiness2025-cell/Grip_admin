import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useParams, useNavigate } from 'react-router-dom';
import chapterApiProvider from '../apiProvider/chapterApi';
import { IMAGE_BASE_URL } from '../network/apiClient';
import { toast } from 'react-toastify';
import { hasDeletePermission, hasPermission } from "../utils/auth";
import Swal from 'sweetalert2';

const UsersListLayer = () => {

    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [chapterMembers, setchapterMembers] = useState([]);
    const [accessDenied, setAccessDenied] = useState(false);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [submittingEdit, setSubmittingEdit] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: '',
        date: '',
        whereDidYouMeet: 'in-person',
        address: '',
        status: 'Active',
        fromMemberName: '',
        toMemberName: ''
    });

    const { id } = useParams();
    const navigate = useNavigate();

    // Filter state
    const [preset, setPreset] = useState('overall');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });

    const [chapterName, setChapterName] = useState("");

    const formatDateToISO = (date) => date.toISOString().split('T')[0];

    const handlePresetChange = (e) => {
        const value = e.target.value;
        setPreset(value);

        const now = new Date();
        let from = '';
        let to = formatDateToISO(now);

        if (value === 'overall' || value === 'custom') {
            setFromDate('');
            setToDate('');
            return;
        } else if (value === 'this_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            from = formatDateToISO(new Date(now.setDate(diff)));
        } else if (value === 'this_month') {
            from = formatDateToISO(new Date(now.getFullYear(), now.getMonth(), 1));
        } else if (value === '3_months') {
            const d = new Date();
            d.setMonth(d.getMonth() - 3);
            from = formatDateToISO(d);
        } else if (value === '6_months') {
            const d = new Date();
            d.setMonth(d.getMonth() - 6);
            from = formatDateToISO(d);
        } else if (value === '12_months') {
            const d = new Date();
            d.setFullYear(d.getFullYear() - 1);
            from = formatDateToISO(d);
        }

        setFromDate(from);
        setToDate(to);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleClearFilters = () => {
        setPreset('overall');
        setFromDate('');
        setToDate('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleShowImage = (image) => {
        setSelectedImage(image);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setSelectedImage('');
    };

    const fetchChapters = async (id) => {
        try {
            const input = {
                page: pagination.page,
                limit: pagination.limit,
                ...(fromDate && { fromDate }),
                ...(toDate && { toDate }),
            };

            const response = await chapterApiProvider.onetooneSlipListMember(id, input);

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

    const deleteOneToOne = async (oneToOneId) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `You are about to delete the one-to-one record. This action cannot be undone!`,
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
                const response = await chapterApiProvider.deleteOneToOneById(oneToOneId);

                if (response && response.status) {
                    await Swal.fire("Deleted!", `Record deleted successfully.`, "success");
                    fetchChapters(id);
                } else {
                    throw new Error("Failed to delete record.");
                }
            } catch (error) {
                await Swal.fire("Error!", error.message || "Something went wrong.", "error");
            }
        }
    };

    const handleOpenEdit = (item) => {
        setEditFormData({
            id: item._id,
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
            whereDidYouMeet: item.whereDidYouMeet || 'in-person',
            address: item.address || '',
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
            const res = await chapterApiProvider.updateOneToOne(editFormData.id, {
                date: editFormData.date,
                whereDidYouMeet: editFormData.whereDidYouMeet,
                address: editFormData.address,
                status: editFormData.status
            });
            if (res?.status) {
                toast.success("121 record updated successfully");
                setShowEditModal(false);
                fetchChapters(id);
            } else {
                toast.error(res?.response?.message || "Failed to update record");
            }
        } catch (err) {
            console.error("Error updating 121:", err);
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

    // Refetch when page, fromDate or toDate changes
    useEffect(() => {
        fetchChapters(id);
    }, [id, pagination.page, fromDate, toDate]);

    return (
        <div className="card h-100 p-0 radius-12">
            <div className="card-body p-24">

                {/* ── Filter Bar ── */}
                <div
                    className="d-flex flex-wrap align-items-end gap-3 mb-4 p-3 radius-8"
                    style={{ background: 'var(--bg-body, #f8f9fa)', border: '1px solid var(--border-color, #dee2e6)' }}
                >
                    {/* Preset Dropdown */}
                    <div className="d-flex flex-column gap-1">
                        <label className="fw-semibold text-secondary-light text-sm mb-0">Filter Period</label>
                        <select
                            className="form-select form-select-sm radius-8"
                            style={{ minWidth: 160 }}
                            value={preset}
                            onChange={handlePresetChange}
                        >
                            <option value="overall">Overall</option>
                            <option value="this_week">This Week</option>
                            <option value="this_month">This Month</option>
                            <option value="3_months">Last 3 Months</option>
                            <option value="6_months">Last 6 Months</option>
                            <option value="12_months">Last 12 Months</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {/* Custom Date Pickers (shown only when preset === 'custom') */}
                    {preset === 'custom' && (
                        <>
                            <div className="d-flex flex-column gap-1">
                                <label className="fw-semibold text-secondary-light text-sm mb-0">From Date</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm radius-8"
                                    style={{ minWidth: 150 }}
                                    value={fromDate}
                                    max={toDate || undefined}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                />
                            </div>
                            <div className="d-flex flex-column gap-1">
                                <label className="fw-semibold text-secondary-light text-sm mb-0">To Date</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm radius-8"
                                    style={{ minWidth: 150 }}
                                    value={toDate}
                                    min={fromDate || undefined}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                />
                            </div>
                            <button
                                className="btn btn-sm btn-outline-secondary radius-8 align-self-end"
                                onClick={handleClearFilters}
                            >
                                <Icon icon="mdi:close-circle-outline" className="me-1" />
                                Clear
                            </button>
                        </>
                    )}

                    {/* Active filter badge */}
                    {preset !== 'overall' && preset !== 'custom' && (
                        <div className="align-self-end">
                            <span className="badge text-sm fw-medium px-3 py-2 radius-8"
                                style={{ background: '#e8f4fd', color: '#0d6efd' }}>
                                <Icon icon="mdi:calendar-range" className="me-1" />
                                {preset === 'this_week' && 'This Week'}
                                {preset === 'this_month' && 'This Month'}
                                {preset === '3_months' && 'Last 3 Months'}
                                {preset === '6_months' && 'Last 6 Months'}
                                {preset === '12_months' && 'Last 12 Months'}
                                &nbsp;·&nbsp;
                                <span
                                    role="button"
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={handleClearFilters}
                                >
                                    Reset
                                </span>
                            </span>
                        </div>
                    )}

                    {/* Results count */}
                    <div className="ms-auto align-self-end text-secondary-light text-sm">
                        {pagination.total} record{pagination.total !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="table-responsive scroll-sm">
                    <table className="table bordered-table sm-table mb-0">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Date</th>
                                <th>From</th>
                                <th>121 To</th>
                                <th>Where</th>
                                <th>Chapter Name</th>
                                <th>Photo</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {chapterMembers?.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center text-muted py-4">
                                        No records found for the selected period.
                                    </td>
                                </tr>
                            ) : (
                                chapterMembers?.map((item, index) => (
                                    <tr key={item._id}>
                                        <td>{(pagination.page - 1) * pagination.limit + index + 1}.</td>
                                        <td>{new Date(item.date).toLocaleDateString('en-IN')}</td>

                                        <td>{item.fromMember?.name || 'N/A'}</td>

                                        <td>{item.toMember?.name || 'N/A'}</td>

                                        <td>
                                            {item.whereDidYouMeet
                                                ? item.whereDidYouMeet.charAt(0).toUpperCase() + item.whereDidYouMeet.slice(1).toLowerCase()
                                                : '-'}
                                        </td>

                                        <td>{chapterName || '-'}</td>

                                        <td>
                                            {item.images?.length > 0 ? (
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() =>
                                                        handleShowImage(
                                                            `${IMAGE_BASE_URL}/${item.images[0].docPath}/${item.images[0].docName}`
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>
                                            ) : (
                                                <span className="text-muted">No Image</span>
                                            )}
                                        </td>

                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                {hasPermission("121s-update") && (
                                                    <button
                                                        type="button"
                                                        className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        onClick={() => handleOpenEdit(item)}
                                                        title="Edit"
                                                    >
                                                        <Icon icon="lucide:edit" className="menu-icon" />
                                                    </button>
                                                )}
                                                {hasDeletePermission("121s-delete") && (
                                                    <button
                                                        type="button"
                                                        className="bg-danger-focus text-danger-600 bg-hover-danger-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        onClick={() => deleteOneToOne(item._id)}
                                                        title="Delete"
                                                    >
                                                        <Icon icon="mdi:trash-can-outline" className="menu-icon" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Showing entries info */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-secondary-light text-sm">
                        {pagination.total > 0
                            ? `Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} entries`
                            : 'No entries'}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
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
                    )}
                </div>

                {/* Image Modal */}
                <Modal show={showModal} onHide={handleClose} centered>
                    <Modal.Body className="text-center">
                        <img src={selectedImage} alt="Profile" className="img-fluid" />
                    </Modal.Body>
                </Modal>

                {/* Edit 121 Modal */}
                <Modal show={showEditModal} onHide={handleCloseEdit} centered>
                    <Modal.Header closeButton>
                        <Modal.Title className="text-md fw-semibold">Edit 121 Record</Modal.Title>
                    </Modal.Header>
                    <form onSubmit={handleEditSubmit}>
                        <Modal.Body>
                            <div className="mb-3 p-3 bg-light rounded-8">
                                <div className="text-xs text-muted mb-1">Participants:</div>
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="fw-medium text-dark"><span className="text-muted">From:</span> {editFormData.fromMemberName}</span>
                                    <Icon icon="lucide:arrow-right" className="text-muted mx-2" />
                                    <span className="fw-medium text-dark"><span className="text-muted">To:</span> {editFormData.toMemberName}</span>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-sm fw-medium">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    className="form-control"
                                    value={editFormData.date}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-sm fw-medium">Where Did You Meet</label>
                                <select
                                    name="whereDidYouMeet"
                                    className="form-select"
                                    value={editFormData.whereDidYouMeet}
                                    onChange={handleEditChange}
                                >
                                    <option value="in-person">In Person</option>
                                    <option value="online">Online</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-sm fw-medium">Address / Meeting Location</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="form-control"
                                    value={editFormData.address}
                                    onChange={handleEditChange}
                                    placeholder="Enter address or meeting link"
                                />
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
    );
};

export default UsersListLayer;
