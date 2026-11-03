import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingApi from "../apiProvider/OnboardingApi";
import ReactPaginate from 'react-paginate';
import { Icon } from '@iconify/react';
import Swal from 'sweetalert2';
import { Modal, Button } from 'react-bootstrap';
import { hasPermission, hasDeletePermission } from '../utils/auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const OnboardingListLayer = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    
    // Pagination state
    const [itemOffset, setItemOffset] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        const response = await OnboardingApi.getAllApplications();
        if (response.status && response.response.success) {
            setApplications(response.response.data);
        } else {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: response.response?.message || "Failed to fetch applications",
            });
        }
        setLoading(false);
    };

    const handlePageClick = (event) => {
        const newOffset = (event.selected * itemsPerPage) % applications.length;
        setItemOffset(newOffset);
    };

    const handleEditStatus = async (app) => {
        const result = await Swal.fire({
            title: 'Update Status',
            input: 'select',
            inputOptions: {
                pending: 'Pending',
                approve: 'Approve',
                rejected: 'Rejected'
            },
            inputValue: app.status,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Update',
            denyButtonText: 'Add as Associate',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
            denyButtonColor: '#c02221',
            cancelButtonColor: '#6c757d',
            customClass: {
                input: 'swal2-select-custom',
                actions: 'swal2-actions-custom',
                denyButton: 'swal2-deny-custom'
            },
            preDeny: () => {
                return Swal.getInput()?.value || app.status;
            }
        });

        if (result.isDenied) {
            const currentSelected = result.value || app.status;
            if (currentSelected && currentSelected !== app.status) {
                try {
                    await OnboardingApi.updateApplicationStatus(app._id, currentSelected);
                    fetchApplications();
                } catch (e) {
                    console.error("Error auto-updating status:", e);
                }
            }
            navigate('/add-primarymember', { state: { application: { ...app, status: currentSelected } } });
            return;
        }

        const status = result.value;
        if (result.isConfirmed && status && status !== app.status) {
            setLoading(true);
            const res = await OnboardingApi.updateApplicationStatus(app._id, status);
            if (res.status && res.response.success) {
                Swal.fire('Success', 'Status updated successfully', 'success');
                fetchApplications();
            } else {
                Swal.fire('Error', res.response.message || 'Failed to update status', 'error');
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            setLoading(true);
            const res = await OnboardingApi.deleteApplication(id);
            if (res.status && res.response.success) {
                Swal.fire('Deleted!', 'Application has been deleted.', 'success');
                fetchApplications();
            } else {
                Swal.fire('Error', res.response.message || 'Failed to delete application', 'error');
                setLoading(false);
            }
        }
    };

    const handleDownloadPDF = () => {
        const input = document.getElementById('application-details-content');
        if (input) {
            html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Application_${selectedApp.firstName}_${selectedApp.lastName}.pdf`);
            });
        }
    };

    const endOffset = itemOffset + itemsPerPage;
    const currentItems = applications.slice(itemOffset, endOffset);
    const pageCount = Math.ceil(applications.length / itemsPerPage);

    return (
        <div className="card h-100 p-0 radius-12">
            <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                <div className="d-flex align-items-center flex-wrap gap-3">
                    <span className="text-md fw-medium text-secondary-light mb-0">
                        Show
                    </span>
                    <select className="form-select form-select-sm w-auto bg-base border text-secondary-light">
                        <option value={10}>10</option>
                    </select>
                    <form className="navbar-search">
                        <input
                            type="text"
                            className="bg-base h-40-px w-auto"
                            name="search"
                            placeholder="Search"
                        />
                        <Icon icon="ion:search-outline" className="icon" />
                    </form>
                </div>
            </div>
            
            <div className="card-body p-24">
                <div className="table-responsive scroll-sm">
                    {loading ? (
                        <div className="d-flex justify-content-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <table className="table bordered-table sm-table mb-0">
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Company Name</th>
                                    <th scope="col">Category</th>
                                    <th scope="col">Mobile</th>
                                    <th scope="col">Chapter</th>
                                    <th scope="col">Status</th>
                                    <th scope="col" className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((app, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <h6 className="text-md mb-0 fw-medium flex-grow-1">
                                                    {`${app.firstName || ""} ${app.lastName || ""}`.trim()}
                                                </h6>
                                            </div>
                                        </td>
                                        <td>{app.companyName}</td>
                                        <td>{app.category}</td>
                                        <td>{app.mobile}</td>
                                        <td>{app.chapterName || (app.chapterId?.chapterName)}</td>
                                        <td>
                                            <span className={`bg-${app.status === 'pending' ? 'warning' : app.status === 'approve' ? 'success' : 'danger'}-focus text-${app.status === 'pending' ? 'warning' : app.status === 'approve' ? 'success' : 'danger'}-main px-24 py-4 rounded-pill fw-medium text-sm`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="d-flex align-items-center gap-10 justify-content-center">
                                                <button
                                                    type="button"
                                                    className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                    title="View Details"
                                                    onClick={() => {
                                                        setSelectedApp(app);
                                                        setShowViewModal(true);
                                                    }}
                                                >
                                                    <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="bg-primary-focus bg-hover-primary-200 text-primary-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                    title="Add as Associate"
                                                    onClick={() => navigate('/add-primarymember', { state: { application: app } })}
                                                >
                                                    <Icon icon="lucide:user-plus" className="icon text-xl" />
                                                </button>
                                                {hasPermission('onboarding-form-update') && (
                                                    <button
                                                        type="button"
                                                        className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        title="Edit Status"
                                                        onClick={() => handleEditStatus(app)}
                                                    >
                                                        <Icon icon="lucide:edit" className="icon text-xl" />
                                                    </button>
                                                )}
                                                {hasDeletePermission('onboarding-form-delete') && (
                                                    <button
                                                        type="button"
                                                        className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        title="Delete Application"
                                                        onClick={() => handleDelete(app._id)}
                                                    >
                                                        <Icon icon="fluent:delete-24-regular" className="icon text-xl" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            No applications found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                    <span>
                        Showing {itemOffset + 1} to {Math.min(endOffset, applications.length)} of {applications.length} entries
                    </span>
                    <ReactPaginate
                        breakLabel="..."
                        nextLabel={<Icon icon="solar:alt-arrow-right-linear" />}
                        onPageChange={handlePageClick}
                        pageRangeDisplayed={3}
                        pageCount={pageCount}
                        previousLabel={<Icon icon="solar:alt-arrow-left-linear" />}
                        renderOnZeroPageCount={null}
                        className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center"
                        pageClassName="page-item"
                        pageLinkClassName="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                        activeClassName="active"
                        activeLinkClassName="bg-primary-600 text-white"
                        previousClassName="page-item"
                        previousLinkClassName="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px"
                        nextClassName="page-item"
                        nextLinkClassName="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px"
                    />
                </div>
            </div>

            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Application Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedApp && (
                        <div id="application-details-content" className="p-4 bg-white row g-3">
                            <div className="col-12 mb-3 text-center">
                                <img src="/assets/images/logo.png" alt="GRIP Logo" style={{ maxWidth: '150px' }} className="mb-3" crossOrigin="anonymous" />
                                <h4>Grip Associate Application</h4>
                                <hr />
                            </div>
                            <div className="col-md-6"><strong>First Name:</strong> {selectedApp.firstName}</div>
                            <div className="col-md-6"><strong>Last Name:</strong> {selectedApp.lastName}</div>
                            <div className="col-md-6"><strong>Company Name:</strong> {selectedApp.companyName}</div>
                            <div className="col-md-6"><strong>Category:</strong> {selectedApp.category}</div>
                            <div className="col-md-6"><strong>Blood Group:</strong> {selectedApp.bloodGroup || 'N/A'}</div>
                            <div className="col-md-6"><strong>Date of Birth:</strong> {selectedApp.dobDay ? `${selectedApp.dobDay} ${selectedApp.dobMonth} ${selectedApp.dobYear}` : 'N/A'}</div>
                            <div className="col-md-6"><strong>Anniversary Date:</strong> {selectedApp.anniversary || (selectedApp.anniversaryDay ? `${selectedApp.anniversaryDay} ${selectedApp.anniversaryMonth} ${selectedApp.anniversaryYear}` : 'N/A')}</div>
                            <div className="col-md-6"><strong>Mobile:</strong> {selectedApp.mobile}</div>
                            <div className="col-md-6"><strong>Email:</strong> {selectedApp.email}</div>
                            <div className="col-md-6"><strong>Chapter:</strong> {selectedApp.chapterName || selectedApp.chapterId?.chapterName}</div>
                            <div className="col-md-6"><strong>Zone:</strong> {selectedApp.zone || selectedApp.zoneId?.zoneName}</div>
                            <div className="col-md-6"><strong>Status:</strong> {selectedApp.status}</div>
                            <div className="col-12"><hr /></div>
                            <div className="col-12"><strong>Address:</strong> {selectedApp.addressLine1} {selectedApp.addressLine2 ? `, ${selectedApp.addressLine2}` : ''}, {selectedApp.city}, {selectedApp.state}, {selectedApp.postalCode}</div>
                            <div className="col-md-6"><strong>Education:</strong> {selectedApp.education}</div>
                            <div className="col-md-6"><strong>Industry:</strong> {selectedApp.industry}</div>
                            <div className="col-12"><strong>Business Details:</strong> {selectedApp.businessDetails}</div>
                            <div className="col-md-6"><strong>Years in Business:</strong> {selectedApp.yearsInBusiness}</div>
                            <div className="col-md-6"><strong>GST Number:</strong> {selectedApp.gstNumber}</div>
                            <div className="col-md-6"><strong>Secondary Phone:</strong> {selectedApp.secondaryPhone}</div>
                            <div className="col-md-6"><strong>Website:</strong> {selectedApp.website}</div>
                            <div className="col-12"><hr /></div>
                            <div className="col-md-6">
                                <div className="mb-3"><strong>Invited From:</strong> {selectedApp.invited_from}</div>
                                <div className="mb-3"><strong>Hear About:</strong> {selectedApp.hearAbout}</div>
                                <div className="mb-3"><strong>Past Associate:</strong> {selectedApp.pastAssociate}</div>
                                <div><strong>Other Networking:</strong> {selectedApp.otherNetworking}</div>
                            </div>
                            <div className="col-md-6">
                                {selectedApp.aadharCard && (
                                    <div>
                                        <strong>Aadhar Card:</strong>{' '}
                                        <a 
                                            href={`${process.env.REACT_APP_IMAGE_URL || 'http://localhost:4002/api/public/'}applications/${selectedApp.aadharCard}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary-600 fw-medium text-decoration-underline"
                                        >
                                            View Document
                                        </a>
                                        <div className="mt-3">
                                            <img 
                                                src={`${process.env.REACT_APP_IMAGE_URL || 'http://localhost:4002/api/public/'}applications/${selectedApp.aadharCard}`} 
                                                alt="Aadhar Card" 
                                                style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ddd', padding: '5px' }} 
                                                crossOrigin="anonymous"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {(selectedApp.ref1FirstName || selectedApp.ref1LastName) && (
                                <>
                                    <div className="col-12"><hr /><h5>Reference 1</h5></div>
                                    <div className="col-md-6"><strong>Name:</strong> {selectedApp.ref1FirstName} {selectedApp.ref1LastName}</div>
                                    <div className="col-md-6"><strong>Phone:</strong> {selectedApp.ref1Phone}</div>
                                    <div className="col-md-6"><strong>Business:</strong> {selectedApp.ref1BusinessName}</div>
                                    <div className="col-md-6"><strong>Relationship:</strong> {selectedApp.ref1Relationship}</div>
                                </>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="success" 
                        onClick={() => {
                            setShowViewModal(false);
                            navigate('/add-primarymember', { state: { application: selectedApp } });
                        }}
                    >
                        <Icon icon="lucide:user-plus" className="me-1" /> Add as Associate
                    </Button>
                    <Button variant="primary" onClick={handleDownloadPDF}>Download PDF</Button>
                    <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default OnboardingListLayer;
