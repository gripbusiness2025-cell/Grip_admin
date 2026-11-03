import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import memberApiProvider from '../../apiProvider/memberApi';
import { Country, State } from 'country-state-city';
import chapterApiProvider from '../../apiProvider/chapterApi';
import { toast, ToastContainer } from 'react-toastify';
import userApiProvider from '../../apiProvider/userApi';
import { getCurrentUser } from '../../utils/auth';

const InputStatus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentUser, setCurrentUser] = useState(() => getCurrentUser()?.data || null);
    const [belongsToOtherOrg, setBelongsToOtherOrg] = useState("");
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [zones, setZones] = useState([]);
    const [loadingZones, setLoadingZones] = useState(false);
    const [chapters, setChapters] = useState([]);
    const [loadingChapters, setLoadingChapters] = useState(false);
    const [cids, setCids] = useState([]);
    const [errors, setErrors] = useState({});

    // Role and zone extraction
    const rawRole = currentUser?.role;
    const roleName = (typeof rawRole === 'object' ? rawRole?.name : rawRole) || '';
    const roleNameLower = roleName.toLowerCase();
    const isSuperAdmin = roleNameLower === 'admin' 
                      || roleNameLower === 'super admin' 
                      || roleNameLower === 'super-admin';

    const rawZone = currentUser?.zoneId;
    const userAssignedZoneId = typeof rawZone === 'object' 
      ? (rawZone?._id || rawZone?.id) 
      : (rawZone || (currentUser?.role === 'zone-admin' ? (currentUser?.id || currentUser?._id) : null));
    const userAssignedZoneName = typeof rawZone === 'object' ? rawZone?.zoneName : null;

    useEffect(() => {
        const loadUser = async () => {
            const sessionData = getCurrentUser();
            const userId = sessionData?.data?.id || sessionData?.data?._id;
            if (userId) {
                try {
                    const res = await userApiProvider.getUserById(userId);
                    if (res?.status && res?.response?.data) {
                        setCurrentUser(res.response.data);
                        return;
                    }
                } catch (e) {
                    console.error("Error loading user in InputStatus:", e);
                }
            }
            if (sessionData?.data) {
                setCurrentUser(sessionData.data);
            }
        };
        loadUser();
    }, []);
    const [formData, setFormData] = useState({
        chapterInfo: {
            countryName: "",
            stateName: "",
            zoneId: "",
            chapterId: "",
            CIDId: "",
            whoInvitedYou: "",
            howDidYouHearAboutGRIP: ""
        },
        personalDetails: {
            firstName: "",
            lastName: "",
            companyName: "",
            industry: "",
            dob: "",
            categoryRepresented: "",
            previousGRIPMember: "",
            isOtherNetworkingOrgs: "",
            otherNetworkingOrgs: "",
            education: ""
        },
        businessAddress: {
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            postalCode: ""
        },
        contactDetails: {
            email: "",
            mobileNumber: "",
            secondaryPhone: "",
            website: "",
            gstNumber: ""
        },
        businessDetails: {
            businessDescription: "",
            yearsInBusiness: ""
        },
        businessReferences: [{
            firstName: "",
            lastName: "",
            businessName: "",
            phoneNumber: "",
            relationship: "",
            contactSharingGRIP: false,
            contactSharingGRIPReferences: false
        }],
        termsAndCertifications: {
            willAttendMeetingsOnTime: true,
            willBringVisitors: true,
            willDisplayPositiveAttitude: true,
            understandsContributorsWin: true,
            willAbideByPolicies: true,
            willContributeBestAbility: true
        }
    });

    // Initialize countries on component mount
    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);

    // Update states when country changes
    useEffect(() => {
        if (formData.chapterInfo.countryName) {
            const countryCode = countries.find(
                c => c.name === formData.chapterInfo.countryName
            )?.isoCode;
            if (countryCode) {
                setStates(State.getStatesOfCountry(countryCode));
            }
        }
    }, [formData.chapterInfo.countryName, countries]);
    useEffect(() => {
        const fetchZones = async () => {
            if (!formData.chapterInfo.stateName) {
                console.log('No state selected');
                setZones([]);
                return;
            }

            console.log('Fetching zones for state:', formData.chapterInfo.stateName);
            setLoadingZones(true);
            try {
                const response = await chapterApiProvider.getZonesByState(formData.chapterInfo.stateName);
                console.log('API Response:', response);
                if (response && response.response && response.response.status) {
                    let fetchedZones = response.response.data || [];

                    if (!isSuperAdmin && (userAssignedZoneId || userAssignedZoneName)) {
                        fetchedZones = fetchedZones.filter((z) => {
                            const zId = String(z._id || z.id || "");
                            const zName = (z.zoneName || "").trim().toLowerCase();
                            if (userAssignedZoneId && zId === String(userAssignedZoneId)) return true;
                            if (userAssignedZoneName && zName === userAssignedZoneName.trim().toLowerCase()) return true;
                            if (Array.isArray(currentUser?.zoneIds) && currentUser.zoneIds.some(id => String(typeof id === 'object' ? id._id : id) === zId)) return true;
                            return false;
                        });
                    }

                    setZones(fetchedZones);

                    if (fetchedZones.length === 1) {
                        const singleZone = fetchedZones[0];
                        setFormData((prev) => ({
                            ...prev,
                            chapterInfo: {
                                ...prev.chapterInfo,
                                zoneId: singleZone._id,
                            },
                        }));
                        if (typeof getChapters === 'function') {
                            getChapters(singleZone._id);
                        }
                    }
                } else {
                    console.log('No zones found or error in response');
                    setZones([]);
                }
            } catch (error) {
                console.error("Error fetching zones:", error);
                setZones([]);
            } finally {
                setLoadingZones(false);
            }
        };
        fetchZones();
    }, [formData.chapterInfo.stateName, isSuperAdmin, userAssignedZoneId, userAssignedZoneName]);

    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            fetchMemberData(id);
        }
    }, [id]);

    const fetchMemberData = async (id) => {
        try {
            const response = await memberApiProvider.getMemberById(id);
            if (response.status) {
                console.log('Member data:', response.data.data);
                const data = response.data.data;
                setFormData({
                    ...data,
                    personalDetails: {
                        ...data.personalDetails,
                        dob: data.personalDetails.dob ? data.personalDetails.dob.split('T')[0] : ''
                    },
                    chapterInfo: {
                        ...data.chapterInfo,
                        zoneId: data.chapterInfo.zoneId?._id || data.chapterInfo.zoneId,
                        chapterId: data.chapterInfo.chapterId?._id || data.chapterInfo.chapterId,
                        CIDId: data.chapterInfo.CIDId?._id || data.chapterInfo.CIDId
                    }
                });
                getChapters(data.chapterInfo.zoneId);
                setBelongsToOtherOrg(data.personalDetails?.isOtherNetworkingOrgs ? "true" : "false");
            }
        } catch (err) {
            console.error('Error fetching member data:', err);
        }
    };

    const handleInputChange = async (e, section, field) => {
        setErrors({});
        const newValue = e.target.value;

        // If zone is being changed, fetch chapters for that zone
        if (section === 'chapterInfo' && field === 'zoneId') {
            setLoadingChapters(true);
            try {
                const response = await chapterApiProvider.getChaptersByZone(newValue);
                if (response && response.status) {
                    const chaptersData = (response.response.data || []).filter(c => c.isActive === 1);
                    setChapters(chaptersData);

                    // Extract unique CIDs from chapters
                    const uniqueCids = [];
                    const cidMap = new Map();

                    chaptersData.forEach(chapter => {
                        if (chapter.cidId && chapter.cidId._id && !cidMap.has(chapter.cidId._id)) {
                            cidMap.set(chapter.cidId._id, true);
                            uniqueCids.push({
                                _id: chapter.cidId._id,
                                name: chapter.cidId.name,
                                email: chapter.cidId.email
                            });
                        }
                    });

                    setCids(uniqueCids);

                    // Auto-select the first chapter and CID if available
                    if (chaptersData.length > 0) {
                        const firstChapter = chaptersData[0];
                        const firstCid = uniqueCids.find(cid => cid._id === firstChapter.cidId?._id);

                        setFormData(prev => ({
                            ...prev,
                            chapterInfo: {
                                ...prev.chapterInfo,
                                chapterId: firstChapter._id,
                                CIDId: firstCid?._id || ""
                            }
                        }));
                    } else {
                        // Clear chapter and CID if no chapters available
                        setFormData(prev => ({
                            ...prev,
                            chapterInfo: {
                                ...prev.chapterInfo,
                                chapterId: "",
                                CIDId: ""
                            }
                        }));
                    }
                } else {
                    setChapters([]);
                    setCids([]);
                    console.log('No chapters found for this zone');
                }
            } catch (error) {
                console.error('Error fetching chapters:', error);
                setChapters([]);
                setCids([]);
            } finally {
                setLoadingChapters(false);
            }
        }
        const alphabeticFields = ['whoInvitedYou', 'firstName', 'lastName'];

        // Postal code validation (exactly 6 digits)
        if (field === 'postalCode') {
            const regex = /^\d{0,6}$/; // Allows 0-6 digits during input
            if (regex.test(newValue)) {
                setFormData(prev => ({
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: newValue,
                        // Optional: Track if valid (exactly 6 digits)
                        postalCodeValid: newValue.length === 6
                    }
                }));
            }
        }
        // Alphabetic fields validation
        else if (alphabeticFields.includes(field)) {
            const regex = /^[A-Za-z\s]*$/;
            if (regex.test(newValue) || newValue === '') {
                setFormData(prev => ({
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: newValue
                    }
                }));
            }
        }
        // Normal handling for other fields
        else {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: newValue
                }
            }));
        }
    };

    const handleReferenceChange = (e, index, field) => {
        setErrors({});
        const updatedReferences = [...formData.businessReferences];
        const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const alphabeticFields = ['firstName', 'lastName'];
        if (alphabeticFields.includes(field)) {
            const regex = /^[A-Za-z\s]*$/;
            const isValid = regex.test(newValue) || newValue === '';

            updatedReferences[index] = {
                ...updatedReferences[index],
                [field]: isValid ? newValue : updatedReferences[index][field],
                [`${field}Error`]: !isValid && newValue !== ''
            };
        } else {
            updatedReferences[index][field] = newValue;
        }

        setFormData(prev => ({
            ...prev,
            businessReferences: updatedReferences
        }));
    };

    const handleTermsChange = (e, field) => {
        setErrors({});
        setFormData(prev => ({
            ...prev,
            termsAndCertifications: {
                ...prev.termsAndCertifications,
                [field]: e.target.checked
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        let isValid = true;

        // Chapter Information Validation
        if (!formData.chapterInfo.countryName) {
            newErrors.chapterInfo = { ...newErrors.chapterInfo, countryName: 'Country is required' };
            setErrors(newErrors)
            return false
        }
        if (!formData.chapterInfo.stateName) {
            newErrors.chapterInfo = { ...newErrors.chapterInfo, stateName: 'State is required' };
            setErrors(newErrors)
            return false
        }
        if (!formData.chapterInfo.zoneId) {
            newErrors.chapterInfo = { ...newErrors.chapterInfo, zoneId: 'Zone is required' };
            setErrors(newErrors)
            return false
        }
        if (!formData.chapterInfo.chapterId) {
            newErrors.chapterInfo = { ...newErrors.chapterInfo, chapterId: 'Chapter is required' };
            setErrors(newErrors)
            return false
        }

        // Personal Details Validation
        if (!formData.personalDetails.firstName) {
            newErrors.personalDetails = { ...newErrors.personalDetails, firstName: 'First name is required' };
            setErrors(newErrors)
            return false
        } else if (!/^[a-zA-Z ]+$/.test(formData.personalDetails.firstName)) {
            newErrors.personalDetails = { ...newErrors.personalDetails, firstName: 'Only letters allowed' };
            setErrors(newErrors)
            return false
        }

        if (!formData.personalDetails.lastName) {
            newErrors.personalDetails = { ...newErrors.personalDetails, lastName: 'Last name is required' };
            setErrors(newErrors)
            return false
        } else if (!/^[a-zA-Z ]+$/.test(formData.personalDetails.lastName)) {
            newErrors.personalDetails = { ...newErrors.personalDetails, lastName: 'Only letters allowed' };
            setErrors(newErrors)
            return false
        }

        if (!formData.personalDetails.companyName) {
            newErrors.personalDetails = { ...newErrors.personalDetails, companyName: 'Company name is required' };
            setErrors(newErrors)
            return false
        }

        if (!formData.personalDetails.dob) {
            newErrors.personalDetails = { ...newErrors.personalDetails, dob: 'Date of birth is required' };
            setErrors(newErrors)
            return false
        }

        if (formData.personalDetails.previousGRIPMember === "") {
            newErrors.personalDetails = { ...newErrors.personalDetails, previousGRIPMember: 'This field is required' };
            setErrors(newErrors)
            return false
        }

        if (belongsToOtherOrg === "") {
            newErrors.personalDetails = { ...newErrors.personalDetails, isOtherNetworkingOrgs: 'This field is required' };
            setErrors(newErrors)
            return false
        }

        if (belongsToOtherOrg === "true" && !formData.personalDetails.otherNetworkingOrgs) {
            newErrors.personalDetails = { ...newErrors.personalDetails, otherNetworkingOrgs: 'Please specify organizations' };
            setErrors(newErrors)
            return false
        }

        if (!formData.personalDetails.education) {
            newErrors.personalDetails = { ...newErrors.personalDetails, education: 'Education is required' };
            setErrors(newErrors)
            return false
        }

        // Contact Details Validation
        if (!formData.contactDetails.email) {
            newErrors.contactDetails = { ...newErrors.contactDetails, email: 'Email is required' };
            setErrors(newErrors)
            return false
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactDetails.email)) {
            newErrors.contactDetails = { ...newErrors.contactDetails, email: 'Invalid email format' };
            setErrors(newErrors)
            return false
        }

        if (!formData.contactDetails.mobileNumber) {
            newErrors.contactDetails = { ...newErrors.contactDetails, mobileNumber: 'Mobile number is required' };
            setErrors(newErrors)
            return false
        } else if (!/^\d{10}$/.test(formData.contactDetails.mobileNumber)) {
            newErrors.contactDetails = { ...newErrors.contactDetails, mobileNumber: 'Must be 10 digits' };
            setErrors(newErrors)
            return false
        }

        if (formData.contactDetails.secondaryPhone && !/^\d+$/.test(formData.contactDetails.secondaryPhone)) {
            newErrors.contactDetails = { ...newErrors.contactDetails, secondaryPhone: 'Only numbers allowed' };
            setErrors(newErrors)
            return false
        }

        // Business References Validation
        formData.businessReferences.forEach((ref, index) => {
            if (!ref.firstName) {
                newErrors.businessReferences = newErrors.businessReferences || [];
                newErrors.businessReferences[index] = { ...newErrors.businessReferences[index], firstName: 'First name is required' };
                setErrors(newErrors)
                return false
            }
            if (!ref.lastName) {
                newErrors.businessReferences = newErrors.businessReferences || [];
                newErrors.businessReferences[index] = { ...newErrors.businessReferences[index], lastName: 'Last name is required' };
                setErrors(newErrors)
                return false
            }
            if (!ref.phoneNumber) {
                newErrors.businessReferences = newErrors.businessReferences || [];
                newErrors.businessReferences[index] = { ...newErrors.businessReferences[index], phoneNumber: 'Phone number is required' };
                setErrors(newErrors)
                return false
            } else if (!/^\d+$/.test(ref.phoneNumber)) {
                newErrors.businessReferences = newErrors.businessReferences || [];
                newErrors.businessReferences[index] = { ...newErrors.businessReferences[index], phoneNumber: 'Only numbers allowed' };
                setErrors(newErrors)
                return false
            }
        });
        try {
            const memberData = {
                ...formData,
                personalDetails: {
                    ...formData.personalDetails,
                    isOtherNetworkingOrgs: belongsToOtherOrg === "true",
                    otherNetworkingOrgs: belongsToOtherOrg === "true"
                        ? formData.personalDetails.otherNetworkingOrgs
                        : "",
                    previousGRIPMember: formData.personalDetails.previousGRIPMember === "true"
                }
            };

            let response;
            if (isEditMode) {
                response = await memberApiProvider.updateMember(id, memberData);
            } else {
                response = await memberApiProvider.createMember(memberData);
            }

            if (response.status) {
                toast.success(response.data.message);
                setTimeout(() => {
                    navigate('/primarymember-list');
                }, 3000);
            } else {
                toast.error(response.data?.message || 'Operation failed');
            }
        } catch (err) {
            console.error('Error submitting form:', err);
            toast.error(err.message || 'An error occurred while submitting the form');
        }
    };
    const getChapters = async (newValue) => {
        console.log("enter here", newValue, newValue)
        const zoneId = (newValue && typeof newValue === 'object') ? newValue._id : newValue;
        setLoadingChapters(true);
        try {
            const response = await chapterApiProvider.getChaptersByZone(zoneId);
            if (response && response.status) {
                const chaptersData = (response.response.data || []).filter(c => c.isActive === 1);
                setChapters(chaptersData);
                console.log('Chapters data:', chaptersData);
                // Extract unique CIDs from chapters
                const uniqueCids = [];
                const cidMap = new Map();

                chaptersData.forEach(chapter => {
                    if (chapter.cidId && chapter.cidId._id && !cidMap.has(chapter.cidId._id)) {
                        cidMap.set(chapter.cidId._id, true);
                        uniqueCids.push({
                            _id: chapter.cidId._id,
                            name: chapter.cidId.name,
                            email: chapter.cidId.email
                        });
                    }
                });

                setCids(uniqueCids);

                // Auto-select the first chapter and CID if available
                if (chaptersData.length > 0) {
                    const firstChapter = chaptersData[0];
                    const firstCid = uniqueCids.find(cid => cid._id === firstChapter.cidId?._id);

                    setFormData(prev => ({
                        ...prev,
                        chapterInfo: {
                            ...prev.chapterInfo,
                            chapterId: firstChapter._id,
                            CIDId: firstCid?._id || ""
                        }
                    }));
                } else {
                    // Clear chapter and CID if no chapters available
                    setFormData(prev => ({
                        ...prev,
                        chapterInfo: {
                            ...prev.chapterInfo,
                            chapterId: "",
                            CIDId: ""
                        }
                    }));
                }
            } else {
                setChapters([]);
                setCids([]);
                console.log('No chapters found for this zone');
            }
        } catch (error) {
            console.error('Error fetching chapters:', error);
            setChapters([]);
            setCids([]);
        } finally {
            setLoadingChapters(false);
        }
    }
    return (
        <div className="col-lg-12">
            <form onSubmit={handleSubmit}>
                {/* Chapter Information */}
                <div className="card memshipform-grip">
                    <div className="card-header">
                        <h6 className="card-title mb-0">Chapter Information</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gy-3">
                            <div className="col-4">
                                <label className="form-label">Country</label>
                                <select
                                    className="form-control form-select"
                                    value={formData.chapterInfo.countryName}
                                    onChange={(e) => {
                                        handleInputChange(e, 'chapterInfo', 'countryName');
                                        setFormData(prev => ({
                                            ...prev,
                                            chapterInfo: {
                                                ...prev.chapterInfo,
                                                stateName: ""
                                            }
                                        }));
                                    }}
                                >
                                    <option value="">Select Country</option>
                                    {countries.map((country) => (
                                        <option key={country.isoCode} value={country.name}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.chapterInfo?.countryName && (
                                    <div className="">
                                        <span className='text-danger'>{errors.chapterInfo.countryName}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">State</label>
                                <select
                                    className="form-control form-select"
                                    value={formData.chapterInfo.stateName}
                                    onChange={(e) => handleInputChange(e, 'chapterInfo', 'stateName')}
                                    disabled={!formData.chapterInfo.countryName}
                                >
                                    <option value="">Select State</option>
                                    {states.map((state) => (
                                        <option key={state.isoCode} value={state.isoCode}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.chapterInfo?.stateName && (
                                    <div className="">
                                        <span className='text-danger'>{errors.chapterInfo.stateName}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label d-flex align-items-center justify-content-between mb-2">
                                    <span>Zone</span>
                                    {!isSuperAdmin && (userAssignedZoneName || (zones.length === 1 && zones[0]?.zoneName)) && (
                                        <span className="badge bg-danger-subtle text-danger px-8 py-2 radius-4 text-xs fw-semibold">
                                            Assigned: {userAssignedZoneName || zones[0]?.zoneName}
                                        </span>
                                    )}
                                </label>
                                {loadingZones ? (
                                    <div className="form-control">Loading zones...</div>
                                ) : (
                                    <>
                                        <select
                                            className="form-control form-select"
                                            value={formData.chapterInfo.zoneId || ""}
                                            onChange={(e) => handleInputChange(e, 'chapterInfo', 'zoneId')}
                                            disabled={!formData.chapterInfo.stateName || !zones || zones.length === 0 || (!isSuperAdmin && zones.length === 1)}
                                        >
                                            {(isSuperAdmin || zones.length > 1) && (
                                                <option value="">Select Zone</option>
                                            )}
                                            {zones && zones.map((zone) => (
                                                <option key={zone._id} value={zone._id}>
                                                    {zone.zoneName}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.chapterInfo?.zoneId && (
                                            <div className="">
                                                <span className='text-danger'>{errors.chapterInfo.zoneId}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Chapter Name</label>
                                {loadingChapters ? (
                                    <div className="form-control">Loading chapters...</div>
                                ) : (
                                    <>
                                        <select
                                            className="form-control form-select"
                                            value={formData.chapterInfo.chapterId}
                                            onChange={(e) => handleInputChange(e, 'chapterInfo', 'chapterId')}
                                            disabled={!formData.chapterInfo.zoneId || chapters.length === 0}
                                        >
                                            {chapters.map((chapter) => (
                                                <option key={chapter._id} value={chapter._id}>
                                                    {chapter.chapterName}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.chapterInfo?.chapterId && (
                                            <div className="">
                                                <span className='text-danger'>{errors.chapterInfo.chapterId}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Chapter Induction Directors (CID)</label>
                                <select
                                    className="form-control form-select"
                                    value={formData.chapterInfo.CIDId}
                                    onChange={(e) => handleInputChange(e, 'chapterInfo', 'CIDId')}
                                    disabled={true}
                                >
                                    {cids.map((cid) => (
                                        <option key={cid._id} value={cid._id}>
                                            {cid.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.chapterInfo?.CIDId && (
                                    <div className="">
                                        <span className='text-danger'>{errors.chapterInfo.CIDId}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-6">
                                <label className="form-label">Who invited you?</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.chapterInfo.whoInvitedYou}
                                    onChange={(e) => handleInputChange(e, 'chapterInfo', 'whoInvitedYou')}
                                />
                                {errors.chapterInfo?.whoInvitedYou && (
                                    <div className="">
                                        <span className='text-danger'>{errors.chapterInfo.whoInvitedYou}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-6">
                                <label className="form-label">How did you hear about GRIP?</label>
                                <select
                                    className="form-control form-select"
                                    value={formData.chapterInfo.howDidYouHearAboutGRIP}
                                    onChange={(e) => handleInputChange(e, 'chapterInfo', 'howDidYouHearAboutGRIP')}
                                >
                                    <option value="">Select an option</option>
                                    <option value="Online">Online</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Friends">Friends</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Other">Others</option>
                                    <option value="FED">FED</option>
                                    <option value="Grip">Grip</option>
                                </select>
                                {errors.chapterInfo?.howDidYouHearAboutGRIP && (
                                    <div className="">
                                        <span className='text-danger'>{errors.chapterInfo.howDidYouHearAboutGRIP}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Details */}
                <div className="card mt-24">
                    <div className="card-header">
                        <h6 className="card-title mb-0">Personal Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gy-3">
                            <div className="col-4">
                                <label className="form-label">First Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.personalDetails.firstName}
                                    onChange={(e) => handleInputChange(e, 'personalDetails', 'firstName')}
                                />
                                {errors.personalDetails?.firstName && (
                                    <div className="">
                                        <span className='text-danger'>{errors.personalDetails.firstName}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Last Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.personalDetails.lastName}
                                    onChange={(e) => handleInputChange(e, 'personalDetails', 'lastName')}
                                />
                                {errors.personalDetails?.lastName && (
                                    <div className="">
                                        <span className='text-danger'>{errors.personalDetails.lastName}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Company Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.personalDetails.companyName}
                                    onChange={(e) => handleInputChange(e, 'personalDetails', 'companyName')}
                                />
                                {errors.personalDetails?.companyName && (
                                    <div className="">
                                        <span className='text-danger'>{errors.personalDetails.companyName}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Industry</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.personalDetails.industry}
                                    onChange={(e) => handleInputChange(e, 'personalDetails', 'industry')}
                                />
                                {errors.personalDetails?.industry && (
                                    <div className="">
                                        <span className='text-danger'>{errors.personalDetails.industry}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Date of Birth</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.personalDetails.dob}
                                    onChange={(e) => handleInputChange(e, 'personalDetails', 'dob')}
                                />
                                {errors.personalDetails?.dob && (
                                    <div className="">
                                        <span className='text-danger'>{errors.personalDetails.dob}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Category You Represent</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.personalDetails.categoryRepresented}
                                    onChange={(e) => handleInputChange(e, 'personalDetails', 'categoryRepresented')}
                                />
                                {errors.personalDetails?.categoryRepresented && (
                                    <div className="">
                                        <span className='text-danger'>{errors.personalDetails.categoryRepresented}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-6">
                                <label className="form-label">Have you or your company ever been a member of GRIP chapter?</label>
                                <select
                                    className="form-control form-select"
                                    value={formData.personalDetails.previousGRIPMember}
                                    onChange={(e) => handleInputChange(e, 'personalDetails', 'previousGRIPMember')}
                                >
                                    <option value="">Select</option>
                                    <option value={true}>Yes</option>
                                    <option value={false}>No</option>
                                </select>
                                {errors.personalDetails?.previousGRIPMember && (
                                    <div className="">
                                        <span className='text-danger'>{errors.personalDetails.previousGRIPMember}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-6">
                                <label className="form-label">Do you belong to any other networking organisations?</label>
                                <select
                                    className="form-control form-select"
                                    value={belongsToOtherOrg}
                                    onChange={(e) => setBelongsToOtherOrg(e.target.value === "true")}
                                >
                                    <option value="">Select</option>
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </select>
                                {errors.personalDetails?.isOtherNetworkingOrgs && (
                                    <div className="">
                                        <span className='text-danger'>{errors.personalDetails.isOtherNetworkingOrgs}</span>
                                    </div>
                                )}
                            </div>
                            {belongsToOtherOrg === "true" && (
                                <div className="col-6">
                                    <label className="form-label">Please specify the other networking organisations</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.personalDetails.otherNetworkingOrgs}
                                        onChange={(e) => handleInputChange(e, 'personalDetails', 'otherNetworkingOrgs')}
                                    />
                                    {errors.personalDetails?.otherNetworkingOrgs && (
                                        <div className="">
                                            <span className='text-danger'>{errors.personalDetails.otherNetworkingOrgs}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="col-6">
                                <label className="form-label">Education</label>
                                <select
                                    className="form-control form-select"
                                    value={formData.personalDetails.education}
                                    onChange={(e) => handleInputChange(e, 'personalDetails', 'education')}
                                >
                                    <option value="">Select Education</option>
                                    <option value="High School">High School</option>
                                    <option value="Diploma">Diploma in Business</option>
                                    <option value="Bachelor">Bachelor's Degree</option>
                                    <option value="MBA">MBA / Master's in Business</option>
                                    <option value="Professional Degree">Professional Degree</option>
                                    <option value="Entrepreneurship Certificate">Entrepreneurship Certificate</option>
                                    <option value="Others">Others</option>
                                </select>
                                {errors.personalDetails?.education && (
                                    <div className="">
                                        <span className='text-danger'>{errors.personalDetails.education}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Address */}
                <div className="card mt-24">
                    <div className="card-header">
                        <h6 className="card-title mb-0">Business Address</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gy-3">
                            <div className="col-4">
                                <label className="form-label">Address Line 1</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.businessAddress.addressLine1}
                                    onChange={(e) => handleInputChange(e, 'businessAddress', 'addressLine1')}
                                />
                                {errors.businessAddress?.addressLine1 && (
                                    <div className="">
                                        <span className='text-danger'>{errors.businessAddress.addressLine1}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Address Line 2</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.businessAddress.addressLine2}
                                    onChange={(e) => handleInputChange(e, 'businessAddress', 'addressLine2')}
                                />
                                {errors.businessAddress?.addressLine2 && (
                                    <div className="">
                                        <span className='text-danger'>{errors.businessAddress.addressLine2}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">State / Province</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.businessAddress.state}
                                    onChange={(e) => handleInputChange(e, 'businessAddress', 'state')}
                                />
                                {errors.businessAddress?.state && (
                                    <div className="">
                                        <span className='text-danger'>{errors.businessAddress.state}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-6">
                                <label className="form-label">City</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.businessAddress.city}
                                    onChange={(e) => handleInputChange(e, 'businessAddress', 'city')}
                                />
                                {errors.businessAddress?.city && (
                                    <div className="">
                                        <span className='text-danger'>{errors.businessAddress.city}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-6">
                                <label className="form-label">Postal Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.businessAddress.postalCode}
                                    onChange={(e) => handleInputChange(e, 'businessAddress', 'postalCode')}
                                />
                                {errors.businessAddress?.postalCode && (
                                    <div className="">
                                        <span className='text-danger'>{errors.businessAddress.postalCode}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Details */}
                <div className="card mt-24">
                    <div className="card-header">
                        <h6 className="card-title mb-0">Contact Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gy-3">
                            <div className="col-4">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={formData.contactDetails.email}
                                    onChange={(e) => handleInputChange(e, 'contactDetails', 'email')}
                                />
                                {errors.contactDetails?.email && (
                                    <div className="">
                                        <span className='text-danger'>{errors.contactDetails.email}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Mobile Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.contactDetails.mobileNumber}
                                    onChange={(e) => handleInputChange(e, 'contactDetails', 'mobileNumber')}
                                />
                                {errors.contactDetails?.mobileNumber && (
                                    <div className="">
                                        <span className='text-danger'>{errors.contactDetails.mobileNumber}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4">
                                <label className="form-label">Secondary Phone</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.contactDetails.secondaryPhone}
                                    onChange={(e) => handleInputChange(e, 'contactDetails', 'secondaryPhone')}
                                />
                                {errors.contactDetails?.secondaryPhone && (
                                    <div className="">
                                        <span className='text-danger'>{errors.contactDetails.secondaryPhone}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-6">
                                <label className="form-label">Website</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.contactDetails.website}
                                    onChange={(e) => handleInputChange(e, 'contactDetails', 'website')}
                                />
                                {errors.contactDetails?.website && (
                                    <div className="">
                                        <span className='text-danger'>{errors.contactDetails.website}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-6">
                                <label className="form-label">GST Number (Optional)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.contactDetails.gstNumber}
                                    onChange={(e) => handleInputChange(e, 'contactDetails', 'gstNumber')}
                                />
                                {errors.contactDetails?.gstNumber && (
                                    <div className="">
                                        <span className='text-danger'>{errors.contactDetails.gstNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Details */}
                <div className="card mt-24">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Your Business Details</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-lg-6">
                                <label className="form-label">Describe Your Business Details</label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    value={formData.businessDetails.businessDescription}
                                    onChange={(e) => handleInputChange(e, 'businessDetails', 'businessDescription')}
                                />
                                {errors.businessDetails?.businessDescription && (
                                    <div className="">
                                        <span className='text-danger'>{errors.businessDetails.businessDescription}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-6">
                                <label className="form-label">How many years are you in the business?</label>
                                <select
                                    className="form-control form-select"
                                    value={formData.businessDetails.yearsInBusiness}
                                    onChange={(e) => handleInputChange(e, 'businessDetails', 'yearsInBusiness')}
                                >
                                    <option value="" disabled>Select duration</option>
                                    <option value="below_1_year">Below 1 year</option>
                                    <option value="1_5_years">1 to 5 years</option>
                                    <option value="6_10_years">6 to 10 years</option>
                                    <option value="11_15_years">11 to 15 years</option>
                                    <option value="above_15_years">Above 15 years</option>
                                </select>
                                {errors.businessDetails?.yearsInBusiness && (
                                    <div className="">
                                        <span className='text-danger'>{errors.businessDetails.yearsInBusiness}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business References */}
                <div className="card mt-24">
                    <div className="card-header">
                        <h6 className="card-title mb-0">Business References</h6>
                        <span>These references won't be used for promotion</span>
                    </div>
                    <div className="card-body">
                        <div className="row gy-3">
                            {formData.businessReferences.map((ref, index) => (
                                <React.Fragment key={index}>
                                    <div className="col-4">
                                        <label className="form-label">Ref {index + 1}: First Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={ref.firstName}
                                            onChange={(e) => handleReferenceChange(e, index, 'firstName')}
                                        />
                                        {errors.businessReferences?.[index]?.firstName && (
                                            <div className="">
                                                <span className='text-danger'>{errors.businessReferences[index].firstName}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-4">
                                        <label className="form-label">Ref {index + 1}: Last Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={ref.lastName}
                                            onChange={(e) => handleReferenceChange(e, index, 'lastName')}
                                        />
                                        {errors.businessReferences?.[index]?.lastName && (
                                            <div className="">
                                                <span className='text-danger'>{errors.businessReferences[index].lastName}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-4">
                                        <label className="form-label">Business Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={ref.businessName}
                                            onChange={(e) => handleReferenceChange(e, index, 'businessName')}
                                        />
                                        {errors.businessReferences?.[index]?.businessName && (
                                            <div className="">
                                                <span className='text-danger'>{errors.businessReferences[index].businessName}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={ref.phoneNumber}
                                            onChange={(e) => handleReferenceChange(e, index, 'phoneNumber')}
                                        />
                                        {errors.businessReferences?.[index]?.phoneNumber && (
                                            <div className="">
                                                <span className='text-danger'>{errors.businessReferences[index].phoneNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-6 mb-20">
                                        <label className="form-label">Relationship</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={ref.relationship}
                                            onChange={(e) => handleReferenceChange(e, index, 'relationship')}
                                        />
                                        {errors.businessReferences?.[index]?.relationship && (
                                            <div className="">
                                                <span className='text-danger'>{errors.businessReferences[index].relationship}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-12">
                                        <div className="form-check style-check d-flex align-items-center mb-10">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={ref.contactSharingGRIP}
                                                onChange={(e) => handleReferenceChange(e, index, 'contactSharingGRIP')}
                                            />
                                            <label className="form-check-label">
                                                I have/will inform the above contacts that I'm sharing their info with GRIP.
                                            </label>
                                        </div>
                                        {errors.businessReferences?.[index]?.contactSharingGRIP && (
                                            <div className="">
                                                <span className='text-danger'>{errors.businessReferences[index].contactSharingGRIP}</span>
                                            </div>
                                        )}
                                        <div className="form-check style-check d-flex align-items-center">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={ref.contactSharingGRIPReferences}
                                                onChange={(e) => handleReferenceChange(e, index, 'contactSharingGRIPReferences')}
                                            />
                                            <label className="form-check-label">
                                                I have/will inform the above contacts that I am sharing their information with GRIP for the purpose of references
                                            </label>
                                        </div>
                                        {errors.businessReferences?.[index]?.contactSharingGRIPReferences && (
                                            <div className="">
                                                <span className='text-danger'>{errors.businessReferences[index].contactSharingGRIPReferences}</span>
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Terms and Certifications */}
                <div className="card mt-24">
                    <div className="card-header">
                        <h6 className="card-title mb-0">Terms and Certifications</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gy-3">
                            <div className="col-12 pb-30">
                                <div className="form-check style-check d-flex align-items-center">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formData.termsAndCertifications.willAttendMeetingsOnTime}
                                        onChange={(e) => handleTermsChange(e, 'willAttendMeetingsOnTime')}
                                    />
                                    <label className="form-check-label">
                                        I will be able to attend our GRIP weekly meetings on time.
                                    </label>
                                </div>
                                {errors.termsAndCertifications?.willAttendMeetingsOnTime && (
                                    <div className="">
                                        <span className='text-danger'>{errors.termsAndCertifications.willAttendMeetingsOnTime}</span>
                                    </div>
                                )}
                                <div className="form-check style-check d-flex align-items-center">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formData.termsAndCertifications.willBringVisitors}
                                        onChange={(e) => handleTermsChange(e, 'willBringVisitors')}
                                    />
                                    <label className="form-check-label">
                                        I will be able to bring visitors to this GRIP chapter meetings.
                                    </label>
                                </div>
                                {errors.termsAndCertifications?.willBringVisitors && (
                                    <div className="">
                                        <span className='text-danger'>{errors.termsAndCertifications.willBringVisitors}</span>
                                    </div>
                                )}
                                <div className="form-check style-check d-flex align-items-center">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formData.termsAndCertifications.willDisplayPositiveAttitude}
                                        onChange={(e) => handleTermsChange(e, 'willDisplayPositiveAttitude')}
                                    />
                                    <label className="form-check-label">
                                        I will always display a positive attitude.
                                    </label>
                                </div>
                                {errors.termsAndCertifications?.willDisplayPositiveAttitude && (
                                    <div className="">
                                        <span className='text-danger'>{errors.termsAndCertifications.willDisplayPositiveAttitude}</span>
                                    </div>
                                )}
                                <div className="form-check style-check d-flex align-items-center">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formData.termsAndCertifications.understandsContributorsWin}
                                        onChange={(e) => handleTermsChange(e, 'understandsContributorsWin')}
                                    />
                                    <label className="form-check-label">
                                        I understand that "Contributors Win"™
                                    </label>
                                </div>
                                {errors.termsAndCertifications?.understandsContributorsWin && (
                                    <div className="">
                                        <span className='text-danger'>{errors.termsAndCertifications.understandsContributorsWin}</span>
                                    </div>
                                )}
                                <div className="form-check style-check d-flex align-items-center">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formData.termsAndCertifications.willAbideByPolicies}
                                        onChange={(e) => handleTermsChange(e, 'willAbideByPolicies')}
                                    />
                                    <label className="form-check-label">
                                        I will abide by the policies of GRIP.
                                    </label>
                                </div>
                                {errors.termsAndCertifications?.willAbideByPolicies && (
                                    <div className="">
                                        <span className='text-danger'>{errors.termsAndCertifications.willAbideByPolicies}</span>
                                    </div>
                                )}
                                <div className="form-check style-check d-flex align-items-center">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formData.termsAndCertifications.willContributeBestAbility}
                                        onChange={(e) => handleTermsChange(e, 'willContributeBestAbility')}
                                    />
                                    <label className="form-check-label">
                                        I will contribute to the best of my knowledge & ability.
                                    </label>
                                </div>
                                {errors.termsAndCertifications?.willContributeBestAbility && (
                                    <div className="">
                                        <span className='text-danger'>{errors.termsAndCertifications.willContributeBestAbility}</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-12">
                                <button type="submit" className="btn btn-primary grip">
                                    {isEditMode ? 'Update Associate' : 'Submit Application'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
            <ToastContainer />
        </div>
    );
};

export default InputStatus;