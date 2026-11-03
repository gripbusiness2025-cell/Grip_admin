import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import chapterApiProvider from "../apiProvider/chapterApi";
import makeAnimated from "react-select/animated";
import paymentApiProvider from "../apiProvider/paymentApi";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import { hasPermission, getCurrentUser } from "../utils/auth";
import { formatDate, toLocalISOString } from "../utils/dateFormatter";
import config from "../config/config";
import TrainingApi from "../apiProvider/TrainingApi";
import { Modal } from "bootstrap/dist/js/bootstrap.bundle.min";

const libraries = ['places'];
const containerStyle = {
    width: '100%',
    height: '240px',
    borderRadius: '8px',
    marginTop: '10px'
};

const defaultCenter = {
    lat: 20.5937, // Default to India's center
    lng: 78.9629
};

const EventListLayer = () => {
    const [paymentDetails, setPaymentDetails] = useState([]);
    const [chapterList, setChapterList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        zone: "",
        trainingType:"",
        topic: "",
        amount: "",
        chapters: [],
        images: null,
        startDate: "",
        endDate: "",
        location: "",
        latitude: "",
        longitude: "",
        paymentRequirement: "optional",
    });
    const [zones, setZones] = useState([]);

    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [markerPosition, setMarkerPosition] = useState(null);
    const mapRef = useRef(null);
    const placeAutocompleteRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: config.googleMapsApiKey,
        libraries
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentPaymentId, setCurrentPaymentId] = useState(null);
    const animatedComponents = makeAnimated();

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        async function fetchZones() {
            try {
                const response = await TrainingApi.getPublicZones();
                if (response.status && response.response.success) {
                    const zonesData = response.response.data;
                    setZones(zonesData);
                    
                    const user = getCurrentUser();
                    const rawZoneId = user?.data?.zoneId;
                    const userZoneId = typeof rawZoneId === 'object' ? rawZoneId?._id || rawZoneId?.id : rawZoneId;
                    if (userZoneId) {
                        const userZone = zonesData.find(z => z._id === userZoneId);
                        if (userZone) {
                            setFormData(prev => ({
                                ...prev,
                                zone: userZone.zoneName
                            }));
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch zones:", error);
            }
        }
        fetchZones();
    }, []);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch data on component mount and when dependencies change
    useEffect(() => {
        fetchGetAllChapter();
        fetchPaymentData();
    }, [pagination.page, pagination.limit, searchQuery]);

    useEffect(() => {
        if (isLoaded && !loadError) {
            console.log('Google Maps API loaded successfully');
        }
    }, [isLoaded, loadError]);

    // Initialize autocomplete when Google Maps loads
    useEffect(() => {
        if (isLoaded && window.google && window.google.maps && window.google.maps.places && placeAutocompleteRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(placeAutocompleteRef.current, {
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'IN' }
            });

            placeAutocompleteRef.current.autocomplete = autocomplete;

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    handlePlaceSelect(place);
                }
            });
        }
    }, [isLoaded, loadError]);

    const fetchGetAllChapter = async () => {
        try {
            const resultALlChapter = await chapterApiProvider.getAllChapters();
            if (resultALlChapter?.status) {
                const data = resultALlChapter?.response?.data;
                if (data) {
                    const formattedChapters = [
                        { value: "all", label: "All Chapters" },
                        ...data.map((chapter) => ({
                            value: chapter._id,
                            label: chapter.chapterName,
                            zoneId: chapter.zoneId?._id || chapter.zoneId,
                        })),
                    ];
                    setChapterList(formattedChapters);
                }
            }
        } catch (error) {
            console.error("Error fetching chapters:", error);
        }
    };

    const fetchPaymentData = async () => {
        try {
            setLoading(true);
            const input = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery,
                purpose: "training",
            };

            const response = await paymentApiProvider.getPaymentDetails(input);
            if (response?.status) {
                console.log("Payment data received:", response.data.data); // Debug log
                setPaymentDetails(response.data.data || []);
                setPagination((prev) => ({
                    ...prev,
                    total: response.data.pagination?.total || 0,
                    totalPages: Math.ceil(
                        (response.data.pagination?.total || 0) / pagination.limit
                    ),
                }));
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle edit payment
    const handleEditPayment = (paymentId) => {
        const paymentToEdit = paymentDetails.find(
            (payment) => payment._id === paymentId
        );
        if (paymentToEdit) {
            console.log("Payment to edit:", paymentToEdit); // Debug log
            setCurrentPaymentId(paymentId);
            setIsEditMode(true)


            // Format chapters for react-select
            const selectedChapters = paymentToEdit.chapterId.map((chapter) => ({
                value: chapter._id,
                label: chapter.chapterName,
            }));

            // Format date for datetime-local input
            const formattedStartDate = paymentToEdit.startDate
                ? toLocalISOString(paymentToEdit.startDate)
                : "";

            const formattedEndDate = paymentToEdit.endDate
                ? toLocalISOString(paymentToEdit.endDate)
                : "";

            // Set initial map position if coordinates exist
            if (paymentToEdit.latitude && paymentToEdit.longitude) {
                const lat = parseFloat(paymentToEdit.latitude);
                const lng = parseFloat(paymentToEdit.longitude);

                setMapCenter({ lat, lng });
                setMarkerPosition({ lat, lng });
            }

            setFormData({
                topic: paymentToEdit.topic,
                amount: paymentToEdit.amount,
                chapters: selectedChapters,
                images: null, // Keep images as null initially for edit
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                location: paymentToEdit.address || "",
                latitude: paymentToEdit.latitude || "",
                longitude: paymentToEdit.longitude || "",
                paymentRequirement: paymentToEdit.paymentRequired
                    ? "required"
                    : "optional",
            });

            // Show the modal
            document.getElementById("exampleModalOne").classList.add("show");
            document.getElementById("exampleModalOne").style.display = "block";
            document.body.classList.add("modal-open");
        }
    };

    // Handle form submission for both create and update
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        // Topic validation (alphabets only)
        if (!formData.topic || formData.topic.trim() === "") {
            newErrors.topic = "Topic is required";
            setErrors(newErrors);
            return false;
        } else if (!/^[A-Za-z\s]+$/.test(formData.topic)) {
            newErrors.topic = "Only alphabets and spaces allowed";
            setErrors(newErrors);
            return false;
        }

        // Amount validation (numbers only)
        const amountValue = formData.amount;
        const amountStr = String(amountValue || '').trim();

        if (!amountStr) {
            newErrors.amount = "Amount is required";
            setErrors(newErrors);
            return false;
        } else if (!/^\d+\.?\d*$/.test(amountStr)) {
            newErrors.amount = "Only numbers allowed";
            setErrors(newErrors);
            return false;
        } else if (parseFloat(amountStr) <= 0) {
            newErrors.amount = "Amount must be greater than 0";
            setErrors(newErrors);
            return false;
        }

        // Chapters validation
        if (!formData.chapters || formData.chapters.length === 0) {
            newErrors.chapters = "At least one chapter must be selected";
            setErrors(newErrors);
            return false;
        }



        // Date & Time validation
        if (!formData.startDate) {
            newErrors.startDate = "Start Date is required";
            setErrors(newErrors);
            return false;
        }

        if (!formData.endDate) {
            newErrors.endDate = "End Date is required";
            setErrors(newErrors);
            return false;
        }
        if (!formData.latitude || !formData.longitude) {
            newErrors.location = "Please select a location on the map";
            setErrors(newErrors);
            return false;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }

        // Location validation (alphabets only)
        if (!formData.location || formData.location.trim() === "") {
            newErrors.location = "Location is required";
            setErrors(newErrors);
            return false;
        }

        try {
            setIsSubmitting(true);
            const submissionData = new FormData();
            submissionData.append("purpose", "training");
            submissionData.append("topic", formData.topic);
            submissionData.append("trainingType", formData.trainingType);



            submissionData.append("amount", formData.amount);

            // Create array of chapter IDs
            const chapterIds = formData.chapters.map((chapter) => chapter.value);

            // Append each chapter ID separately
            chapterIds.forEach((id) => {
                submissionData.append("chapterId", id);
            });

            submissionData.append(
                "paymentRequired",
                formData.paymentRequirement === "required"
                    ? true
                    : false
            );

            const formattedStartDate = formData.startDate
                ? new Date(formData.startDate).toISOString()
                : "";
            submissionData.append("startDate", formattedStartDate);

            const formattedEndDate = formData.endDate
                ? new Date(formData.endDate).toISOString()
                : "";
            submissionData.append("endDate", formattedEndDate);

            submissionData.append("address", formData.location);
            submissionData.append("latitude", parseFloat(formData.latitude) || 0);
            submissionData.append("longitude", parseFloat(formData.longitude) || 0);

            let response;
            if (isEditMode) {
                response = await paymentApiProvider.updatePayment(
                    currentPaymentId,
                    submissionData
                );
            } else {
                response = await paymentApiProvider.addPayment(submissionData);
            }

            if (response?.status) {
                toast(`Event ${isEditMode ? "updated" : "created"} successfully!`);
                resetForm();
                fetchPaymentData();
                const modalElement = document.getElementById("exampleModalOne");
                if (modalElement) {
                    const modal = Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                        const backdrops = document.querySelectorAll(".modal-backdrop");
                        backdrops.forEach((backdrop) => backdrop.remove());
                        document.body.classList.remove("modal-open");
                        document.body.style.overflow = "";
                        document.body.style.paddingRight = "";
                    }
                }
            } else {
                throw new Error(
                    response?.message ||
                    `Failed to ${isEditMode ? "update" : "create"} payment`
                );
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error(
                error.message ||
                `Error ${isEditMode ? "updating" : "creating"
                } payment. Please try again.`
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form and modal state
    const resetForm = () => {
        const user = getCurrentUser();
        const rawZoneId = user?.data?.zoneId;
        const userZoneId = typeof rawZoneId === 'object' ? rawZoneId?._id || rawZoneId?.id : rawZoneId;
        const userZoneObj = zones.find(z => z._id === userZoneId);
        setFormData({
            zone: userZoneObj ? userZoneObj.zoneName : "",
            trainingType:"",
            topic: "",
            amount: "",
            chapters: [],
            images: null,
            startDate: "",
            endDate: "",
            location: "",
            latitude: "",
            longitude: "",
            paymentRequirement: "optional",
        });
        setMapCenter(defaultCenter);
        setMarkerPosition(null);
        setIsEditMode(false);
        setCurrentPaymentId(null);
        setErrors({});

        if (isLoaded) {
            setMapCenter(defaultCenter);
            setMarkerPosition(null);
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        resetForm();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'startDate' && value) {
            const selectedDate = new Date(value);
            const now = new Date();

            // If selected date is in the past, don't update the state
            if (selectedDate < now) {
                setErrors(prev => ({
                    ...prev,
                    startDate: 'Please select a future date and time'
                }));
                return;
            }

            // Clear any previous date/time errors
            if (errors.startDate) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.startDate;
                    return newErrors;
                });
            }
        }

        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear any existing errors for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            images: e.target.files[0],
        });
    };

    const getFilteredChapters = () => {
        const user = getCurrentUser();
        const selectedZone = zones.find(z => z.zoneName === formData.zone);
        const selectedZoneId = selectedZone?._id;
        const userChapterIds = user?.data?.chapterIds || user?.data?.chapterId;

        return chapterList.filter(c => {
            if (c.value === 'all') {
                if (userChapterIds && userChapterIds.length <= 1) {
                    return false;
                }
                return true;
            }
            if (userChapterIds && userChapterIds.length > 0) {
                if (!userChapterIds.includes(c.value)) return false;
            }
            if (selectedZoneId && c.zoneId !== selectedZoneId) {
                return false;
            }
            return true;
        });
    };

    const handleChapterChange = (selectedOptions) => {
        // Check if "All Chapters" was selected
        const allChaptersSelected =
            selectedOptions &&
            selectedOptions.some((option) => option.value === "all");

        if (allChaptersSelected) {
            // Select all chapters except the "All Chapters" option
            const allRealChapters = getFilteredChapters().filter(
                (chapter) => chapter.value !== "all"
            );
            setFormData({
                ...formData,
                chapters: allRealChapters,
            });
        } else {
            setFormData({
                ...formData,
                chapters: selectedOptions || [],
            });
        }

        if (errors.chapters) {
            setErrors({
                ...errors,
                chapters: null,
            });
        }
    };

    // Handle search submission
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page: newPage }));
        }
    };

    // Handle delete payment
    const handleDelete = async (paymentId, paymentTopic) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `You are about to delete the event "${paymentTopic}". This action cannot be undone!`,
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
                const response = await paymentApiProvider.deletPayemnt(paymentId);

                if (response && response.status) {
                    await Swal.fire(
                        "Deleted!",
                        `The event "${paymentTopic}" has been deleted.`,
                        "success"
                    );
                    fetchPaymentData();
                } else {
                    throw new Error(response?.message || "Failed to delete event");
                }
            } catch (error) {
                Swal.fire(
                    "Error!",
                    error.message || "Something went wrong while deleting the payment.",
                    "error"
                );
            }
        }
    };

    // Custom styles for react-select
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "40px",
            borderColor: errors.chapters ? "#dc3545" : "#dee2e6",
            "&:hover": {
                borderColor: errors.chapters ? "#dc3545" : "#dee2e6",
            },
            boxShadow: "none",
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: "#f0f0f0",
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: "#333",
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: "#999",
            ":hover": {
                backgroundColor: "#e0e0e0",
                color: "#333",
            },
        }),
    };

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    const onMapClick = useCallback((e) => {
        if (!isLoaded || !window.google || !window.google.maps) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        updateLocationFromCoordinates(lat, lng);
    }, [isLoaded]);

    const handlePlaceSelect = useCallback((place) => {
        if (!isLoaded || !window.google || !window.google.maps) return;

        if (place && place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            setMapCenter({ lat, lng });
            setMarkerPosition({ lat, lng });

            setFormData(prev => ({
                ...prev,
                location: place.formatted_address || '',
                latitude: lat,
                longitude: lng
            }));

            if (mapRef.current) {
                mapRef.current.panTo({ lat, lng });
                mapRef.current.setZoom(15);
            }
        }
    }, [isLoaded]);

    const updateLocationFromCoordinates = async (lat, lng) => {
        if (!isLoaded || !window.google || !window.google.maps) return;

        try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    setFormData(prev => ({
                        ...prev,
                        location: results[0].formatted_address,
                        latitude: lat.toString(),
                        longitude: lng.toString()
                    }));
                }
            });
        } catch (error) {
            console.error('Error getting address from coordinates:', error);
        }
    };

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
        <div className="card h-100 p-0 radius-12">
            <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                <div className="d-flex align-items-center flex-wrap gap-3">
                    <form className="navbar-search" onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            className="bg-base h-40-px w-auto"
                            name="search"
                            placeholder="Search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Icon icon="ion:search-outline" className="icon" />
                    </form>
                </div>
                {(hasPermission("training-create") || hasPermission("payments-create")) && (
                    <Link
                        to="#"
                        className="btn btn-primary grip text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModalOne"
                        onClick={resetForm}
                    >
                        <Icon
                            icon="ic:baseline-plus"
                            className="icon text-xl line-height-1"
                        />
                        Make  Training
                    </Link>
                )}
            </div>

            <div className="card-body p-24">
                <div className="table-responsive scroll-sm">
                    <table className="table bordered-table sm-table mb-0">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Topic</th>
                                <th>Amount</th>
                                <th>Chapter</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentDetails.map((payment, index) => (
                                <tr key={payment._id}>
                                    <td>
                                        {(pagination.page - 1) * pagination.limit + index + 1}.
                                    </td>
                                    <td className="text-capitalize">{payment.topic}</td>
                                    <td>₹{payment.amount}</td>
                                    <td>
                                        <span className="text-md mb-0 fw-normal text-secondary-light">
                                            {payment.chapterId
                                                .map((chapter) => chapter.chapterName)
                                                .join(", ")}
                                        </span>
                                    </td>
                                    <td>{formatDate(payment.startDate)}</td>
                                    <td>{formatDate(payment.endDate)}</td>
                                    <td className="text-center">
                                        <div className="d-flex align-items-center gap-10 justify-content-center">
                                            {(hasPermission("training-list") || hasPermission("payments-list")) && (
                                                <button
                                                    type="button"
                                                    className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                >
                                                    <Link
                                                        to={`/attedense-list/${payment._id}`}
                                                        className="text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                                                    >
                                                        <Icon
                                                            icon="majesticons:eye-line"
                                                            className="icon text-xl"
                                                        />
                                                    </Link>
                                                </button>
                                            )}
                                            {(hasPermission("training-update") || hasPermission("payments-update")) && (
                                                <button
                                                    type="button"
                                                    className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#exampleModalOne"
                                                    onClick={() => handleEditPayment(payment._id)}
                                                >
                                                    <Icon icon="lucide:edit" className="menu-icon" />
                                                </button>
                                            )}
                                            {(hasPermission("training-delete") || hasPermission("payments-delete")) && (
                                                <button
                                                    type="button"
                                                    className="bg-danger-focus text-danger-600 bg-hover-danger-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                    onClick={() =>
                                                        handleDelete(payment._id, payment.topic)
                                                    }
                                                >
                                                    <Icon
                                                        icon="mdi:trash-can-outline"
                                                        className="menu-icon"
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
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

            {/* Modal for Event Creation */}
            <div
                className="modal fade"
                id="exampleModalOne"
                tabIndex={-1}
                aria-hidden="true"
            >
                <div className="modal-dialog modal-m modal-dialog-centered">
                    <div className="modal-content radius-16 bg-base">
                        <div className="modal-header py-16 px-24 border border-top-0 border-start-0 border-end-0">
                            <h1 className="modal-title fs-5">
                                {isEditMode ? "Edit Training" : "Training Creation"}
                            </h1>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                onClick={handleModalClose}
                            />
                        </div>
                        <div className="modal-body p-24">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    {/* Topic Field */}
                                    <div className="col-12 mb-20">
                                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                            Topic <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="topic"
                                            className={`form-control radius-8 ${errors.topic ? "is-invalid" : ""
                                                }`}
                                            value={formData.topic}
                                            onChange={(e) => {
                                                if (
                                                    /^[A-Za-z\s]*$/.test(e.target.value) ||
                                                    e.target.value === ""
                                                ) {
                                                    handleInputChange(e);
                                                    if (errors.topic) {
                                                        setErrors((prev) => ({ ...prev, topic: "" }));
                                                    }
                                                }
                                            }}
                                        />
                                        {errors.topic && (
                                            <div className="invalid-feedback">{errors.topic}</div>
                                        )}
                                    </div>

                                    {/* Amount Field */}
                                    <div className="col-12 mb-20">
                                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                            Amount <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="amount"
                                            className={`form-control radius-8 ${errors.amount ? "is-invalid" : ""
                                                }`}
                                            value={formData.amount}
                                            onChange={(e) => {
                                                if (
                                                    /^\d*\.?\d*$/.test(e.target.value) ||
                                                    e.target.value === ""
                                                ) {
                                                    handleInputChange(e);
                                                    if (errors.amount) {
                                                        setErrors((prev) => ({ ...prev, amount: "" }));
                                                    }
                                                }
                                            }}
                                        />
                                        {errors.amount && (
                                            <div className="invalid-feedback">{errors.amount}</div>
                                        )}
                                    </div>
                                    <div className="col-12 mb-20">
                                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                            Payment Requirement
                                        </label>
                                        <div className="d-flex gap-4">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="paymentRequirement"
                                                    id="paymentOptional"
                                                    value="optional"
                                                    checked={formData.paymentRequirement === "optional"}
                                                    onChange={handleInputChange}
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="paymentOptional"
                                                >
                                                    Not Required
                                                </label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="paymentRequirement"
                                                    id="paymentRequired"
                                                    value="required"
                                                    checked={formData.paymentRequirement === "required"}
                                                    onChange={handleInputChange}
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="paymentRequired"
                                                >
                                                    Required
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Zone Field */}
                                    <div className="col-12 mb-20">
                                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                            Zone <span className="text-danger">*</span>
                                        </label>

                                        <select
                                            name="zone"
                                            className={`form-control radius-8 ${errors.zone ? "is-invalid" : ""}`}
                                            value={formData.zone}
                                            disabled={!!getCurrentUser()?.data?.zoneId}
                                            onChange={(e) => {
                                                handleInputChange(e);
                                                if (errors.zone) {
                                                    setErrors((prev) => ({ ...prev, zone: "" }));
                                                }
                                            }}
                                        >
                                            <option value="">-- Select Zone --</option>
                                            {zones.map((zone) => (
                                                <option key={zone._id} value={zone.zoneName}>
                                                    {zone.zoneName}
                                                </option>
                                            ))}
                                        </select>

                                        {errors.zone && (
                                            <div className="invalid-feedback">{errors.zone}</div>
                                        )}
                                    </div>

                                    {/* Training Type Field */}
                                    <div className="col-12 mb-20">
                                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                            Training Type <span className="text-danger">*</span>
                                        </label>

                                        <select
                                            name="trainingType"
                                            className={`form-control radius-8 ${errors.trainingType ? "is-invalid" : ""}`}
                                            value={formData.trainingType}
                                            onChange={(e) => {
                                                handleInputChange(e);
                                                if (errors.trainingType) {
                                                    setErrors((prev) => ({ ...prev, trainingType: "" }));
                                                }
                                            }}
                                        >
                                            <option value="">-- Select Training Type --</option>
                                            <option value="entire_day">Entire day - lunch and snacks</option>
                                            <option value="snacks_only">Only snacks</option>
                                        </select>

                                        {errors.trainingType && (
                                            <div className="invalid-feedback">{errors.trainingType}</div>
                                        )}
                                    </div>

                                    {/* Chapter Select with Select All */}
                                    <div className="col-12 mb-20">
                                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                            Chapter(s) <span className="text-danger">*</span>
                                        </label>
                                        <Select
                                            isMulti
                                            name="chapters"
                                            options={getFilteredChapters()}
                                            components={animatedComponents}
                                            className={`react-select-container ${errors.chapters ? "is-invalid" : ""
                                                }`}
                                            classNamePrefix="react-select"
                                            onChange={handleChapterChange}
                                            value={formData.chapters}
                                            styles={customStyles}
                                            placeholder={getFilteredChapters().length > 0 ? "Select chapters..." : "No chapters found"}
                                            isDisabled={getFilteredChapters().length === 0}
                                            closeMenuOnSelect={false}
                                            hideSelectedOptions={false}
                                            isOptionSelected={(option) => {
                                                if (option.value === "all") {
                                                    const allRealChapters = getFilteredChapters().filter(
                                                        (ch) => ch.value !== "all"
                                                    );
                                                    return (
                                                        formData.chapters.length === allRealChapters.length
                                                    );
                                                }
                                                return formData.chapters.some(
                                                    (ch) => ch.value === option.value
                                                );
                                            }}
                                        />
                                        {errors.chapters && (
                                            <div className="invalid-feedback">{errors.chapters}</div>
                                        )}
                                    </div>




                                    {/* Date and Time Field */}
                                    <div className="col-12 mb-20">
                                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                            Start Date & Time <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="startDate"
                                            className={`form-control radius-8 ${errors.startDate ? "is-invalid" : ""}`}
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            min={toLocalISOString(new Date())}
                                        />
                                        {errors.startDate && (
                                            <div className="invalid-feedback">{errors.startDate}</div>
                                        )}
                                    </div>

                                    <div className="col-12 mb-20">
                                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                            End Date & Time <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="endDate"
                                            className={`form-control radius-8 ${errors.endDate ? "is-invalid" : ""}`}
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            min={toLocalISOString(new Date())}
                                        />
                                        {errors.endDate && (
                                            <div className="invalid-feedback">{errors.endDate}</div>
                                        )}
                                    </div>

                                    {/* Location Field with Google Maps */}
                                    <div className="col-12 mb-20">
                                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                            Location <span className="text-danger">*</span>
                                        </label>
                                        {loadError ? (
                                            <div className="alert alert-danger">Error loading Google Maps. Please try again later.</div>
                                        ) : !isLoaded ? (
                                            <div className="text-center py-4">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <div className="mt-2">Loading Google Maps...</div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="autocomplete-container">
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            name="location"
                                                            className={`form-control radius-8 ${errors.location ? "is-invalid" : ""}`}
                                                            placeholder={isLoaded ? "Search for a location" : "Loading Google Maps..."}
                                                            value={formData.location}
                                                            disabled={!isLoaded}
                                                            onChange={(e) => {
                                                                handleInputChange(e);
                                                                if (errors.location) {
                                                                    setErrors(prev => ({ ...prev, location: "" }));
                                                                }
                                                            }}
                                                            ref={placeAutocompleteRef}
                                                            onFocus={() => {
                                                                // Autocomplete is already initialized in useEffect
                                                                // This ensures the input is ready for user interaction
                                                            }}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    if (formData.location && isLoaded && window.google && window.google.maps && window.google.maps.places) {
                                                                        const geocoder = new window.google.maps.Geocoder();
                                                                        geocoder.geocode({
                                                                            address: formData.location,
                                                                            componentRestrictions: { country: 'IN' }
                                                                        }, (results, status) => {
                                                                            if (status === 'OK' && results[0]) {
                                                                                const place = results[0];
                                                                                handlePlaceSelect(place);
                                                                            } else {
                                                                                toast.error('Location not found. Please try a different search term.');
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            disabled={!isLoaded}
                                                            onClick={() => {
                                                                if (formData.location && isLoaded && window.google && window.google.maps && window.google.maps.places) {
                                                                    const geocoder = new window.google.maps.Geocoder();
                                                                    geocoder.geocode({
                                                                        address: formData.location,
                                                                        componentRestrictions: { country: 'IN' }
                                                                    }, (results, status) => {
                                                                        if (status === 'OK' && results[0]) {
                                                                            const place = results[0];
                                                                            handlePlaceSelect(place);
                                                                        } else {
                                                                            toast.error('Location not found. Please try a different search term.');
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <Icon icon="ion:search-outline" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-3" style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <GoogleMap
                                                        mapContainerStyle={containerStyle}
                                                        center={mapCenter}
                                                        zoom={markerPosition ? 15 : 5}
                                                        onLoad={onMapLoad}
                                                        onUnmount={onUnmount}
                                                        onClick={isLoaded ? onMapClick : undefined}
                                                        options={{
                                                            streetViewControl: isLoaded,
                                                            mapTypeControl: isLoaded,
                                                            fullscreenControl: isLoaded,
                                                            mapTypeId: 'hybrid',
                                                            mapTypeControlOptions: {
                                                                mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
                                                                style: isLoaded && window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR || 'HORIZONTAL_BAR',
                                                                position: isLoaded && window.google?.maps?.ControlPosition?.TOP_RIGHT || 'TOP_RIGHT'
                                                            },
                                                            styles: [
                                                                {
                                                                    featureType: 'poi',
                                                                    elementType: 'labels',
                                                                    stylers: [{ visibility: 'on' }]
                                                                },
                                                                {
                                                                    featureType: 'administrative.locality',
                                                                    elementType: 'labels',
                                                                    stylers: [{ visibility: 'on' }]
                                                                },
                                                                {
                                                                    featureType: 'road',
                                                                    elementType: 'labels',
                                                                    stylers: [{ visibility: 'on' }]
                                                                }
                                                            ]
                                                        }}
                                                    >
                                                        {markerPosition && isLoaded && (
                                                            <Marker
                                                                position={markerPosition}
                                                                draggable={true}
                                                                onDragEnd={(e) => {
                                                                    if (!isLoaded || !window.google || !window.google.maps) return;
                                                                    const lat = e.latLng.lat();
                                                                    const lng = e.latLng.lng();
                                                                    setMarkerPosition({ lat, lng });
                                                                    updateLocationFromCoordinates(lat, lng);
                                                                }}
                                                            />
                                                        )}
                                                    </GoogleMap>
                                                </div>
                                                {errors.location && (
                                                    <div className="invalid-feedback d-block">{errors.location}</div>
                                                )}
                                                {(formData.latitude && formData.longitude) && (
                                                    <div className="mt-2 text-muted small">
                                                        Coordinates: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {/* Form Actions */}
                                    <div className="d-flex align-items-center gap-3 mt-24">
                                        <button
                                            type="button"
                                            className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-40 py-11 radius-8"
                                            data-bs-dismiss="modal"
                                            aria-label="Close"
                                            onClick={handleModalClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary grip border border-primary-600 text-md px-48 py-12 radius-8"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Submitting..." : "Submit"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
            {/* Style to hide dropdown icon */}
            <style>{`
                select.no-arrow {
                    background-image: none !important;
                }
                .is-invalid {
                    border-color: #dc3545 !important;
                }
                .invalid-feedback {
                    color: #dc3545;
                    font-size: 0.875em;
                }
                .react-select-container {
                    font-size: 14px;
                }
                .react-select__control {
                    border-radius: 8px !important;
                    border: 1px solid #dee2e6 !important;
                    min-height: 40px !important;
                }
                .react-select__control--is-focused {
                    border-color: #86b7fe !important;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
                }
                .react-select__value-container {
                    padding: 2px 8px !important;
                }
                .react-select__multi-value {
                    background-color: #f0f0f0 !important;
                    border-radius: 4px !important;
                }
                .react-select__multi-value__label {
                    color: #333 !important;
                    font-size: 13px !important;
                }
                .react-select__multi-value__remove {
                    color: #999 !important;
                }
                .react-select__multi-value__remove:hover {
                    background-color: #e0e0e0 !important;
                    color: #333 !important;
                }
                .react-select__multi-value {
                    background-color: #f0f0f0 !important;
                    border-radius: 4px !important;
                }
                .form-check-input:checked {
                    background-color: #0d6efd;
                    border-color: #0d6efd;
                }
                .form-check-label {
                    margin-left: 8px;
                }
                .input-group .btn {
                    border-left: 0;
                    border-top-left-radius: 0;
                    border-bottom-left-radius: 0;
                }
                .input-group .form-control {
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                }
                .autocomplete-container .input-group {
                    margin-bottom: 0;
                }
                .pac-container {
                    z-index: 9999 !important;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    border: 1px solid #dee2e6;
                }
                .pac-item {
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #f8f9fa;
                }
                .pac-item:hover {
                    background-color: #f8f9fa;
                }
                .pac-item:last-child {
                    border-bottom: none;
                }
            `}</style>
        </div>
    );
};

export default EventListLayer;