import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import memberApiProvider from "../apiProvider/memberApi";
import { Country, State } from "country-state-city";
import chapterApiProvider from "../apiProvider/chapterApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import pinApiProvider from "../apiProvider/pinApi";
import userApiProvider from "../apiProvider/userApi";
import { getCurrentUser } from "../utils/auth";

const AddPrimaryMemberLayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const onboardingApp = location.state?.application;
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
  const [pinData, setPinData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Load fresh user data on mount to ensure full zone details are populated
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
          console.error("Error loading user in AddPrimaryMemberLayer:", e);
        }
      }
      if (sessionData?.data) {
        setCurrentUser(sessionData.data);
      }
    };
    loadUser();
  }, []);

  // Convert API data to { value, label } for react-select
  const pinOptions = pinData.map((pin) => ({
    value: pin._id,
    label: pin.name || pin.title || pin.image?.originalName || "Unnamed Pin",
    data: pin, // ✅ keep full pin info here
  }));

  const [formData, setFormData] = useState({
    chapterInfo: {
      countryName: "",
      stateName: "",
      zoneId: "",
      chapterId: "",
      CIDId: [],
      whoInvitedYou: "",
      howDidYouHearAboutGRIP: "",
    },
    personalDetails: {
      firstName: "",
      lastName: "",
      companyName: "",
      industry: "",
      dob: "",
      bloodGroup: "",
      anniversary: "",
      categoryRepresented: "",
      previouslyGRIPMember: "",
      isOtherNetworkingOrgs: "",
      otherNetworkingOrgs: "",
      education: "",
      pins: [],
      renewalDate: ""
    },
    businessAddress: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
    },
    contactDetails: {
      email: "",
      mobileNumber: "",
      secondaryPhone: "",
      website: "",
      gstNumber: "",
    },
    businessDetails: {
      businessDescription: "",
      yearsInBusiness: "",
    },
    businessReferences: [
      {
        firstName: "",
        lastName: "",
        businessName: "",
        phoneNumber: "",
        relationship: "",
        contactSharingGRIP: false,
        contactSharingGRIPReferences: false,
      },
    ],
    termsAndCertifications: {
      willAttendMeetingsOnTime: true,
      willBringVisitors: true,
      willDisplayPositiveAttitude: true,
      understandsContributorsWin: true,
      willAbideByPolicies: true,
      willContributeBestAbility: true,
    },
  });

  // Initialize countries on component mount
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (formData.chapterInfo.countryName) {
      const countryCode = countries.find(
        (c) => c.name === formData.chapterInfo.countryName
      )?.isoCode;
      if (countryCode) {
        setStates(State.getStatesOfCountry(countryCode));
      }
    }
  }, [formData.chapterInfo.countryName, countries]);

  // Auto-fill from Onboarding Application
  useEffect(() => {
    if (!onboardingApp || isEditMode) return;

    // Convert dobDay, dobMonth, dobYear to YYYY-MM-DD
    let dobFormatted = "";
    if (onboardingApp.dobDay && onboardingApp.dobMonth && onboardingApp.dobYear) {
      const monthMap = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
      };
      const monthKey = String(onboardingApp.dobMonth).trim().toLowerCase().slice(0, 3);
      const mStr = monthMap[monthKey] || "01";
      const dStr = String(onboardingApp.dobDay).padStart(2, "0");
      dobFormatted = `${onboardingApp.dobYear}-${mStr}-${dStr}`;
    }

    // Convert anniversaryDay, anniversaryMonth, anniversaryYear to YYYY-MM-DD
    let anniversaryFormatted = "";
    if (onboardingApp.anniversaryDay && onboardingApp.anniversaryMonth && onboardingApp.anniversaryYear) {
      const monthMap = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
      };
      const monthKey = String(onboardingApp.anniversaryMonth).trim().toLowerCase().slice(0, 3);
      const mStr = monthMap[monthKey] || "01";
      const dStr = String(onboardingApp.anniversaryDay).padStart(2, "0");
      anniversaryFormatted = `${onboardingApp.anniversaryYear}-${mStr}-${dStr}`;
    }

    // Default renewal date to 1 year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const defaultRenewal = nextYear.toISOString().split("T")[0];

    // Determine country & state
    const allCountries = Country.getAllCountries();
    const defaultCountry = allCountries.find(
      (c) => c.name.toLowerCase() === "india" || c.isoCode.toLowerCase() === "in"
    );

    let stateCode = "TN";
    if (defaultCountry) {
      const countryStates = State.getStatesOfCountry(defaultCountry.isoCode);
      setStates(countryStates);
      if (onboardingApp.state) {
        const matchedState = countryStates.find(
          (s) => s.name?.toLowerCase() === onboardingApp.state.toLowerCase() || s.isoCode?.toLowerCase() === onboardingApp.state.toLowerCase()
        );
        if (matchedState) stateCode = matchedState.isoCode;
      }
    }

    const zoneId = typeof onboardingApp.zoneId === "object" ? onboardingApp.zoneId?._id : (onboardingApp.zoneId || "");
    const chapterId = typeof onboardingApp.chapterId === "object" ? onboardingApp.chapterId?._id : (onboardingApp.chapterId || "");

    // Populate zones for state
    chapterApiProvider.getZonesByState(stateCode).then((res) => {
      if (res?.response?.status && res?.response?.data) {
        setZones(res.response.data);
      }
    }).catch(console.error);

    // Populate chapters if zone is present
    if (zoneId) {
      getChapters(zoneId);
    }

    const mapYears = (y) => {
      if (!y) return "";
      if (y === "0-1" || y.includes("0-1") || y === "below_1_year") return "below_1_year";
      if (y === "1-3" || y === "3-5" || y === "1_5_years") return "1_5_years";
      if (y === "5+" || y === "6_10_years") return "6_10_years";
      if (y === "11_15_years") return "11_15_years";
      if (y === "above_15_years") return "above_15_years";
      return y;
    };

    const mapEducation = (edu) => {
      if (!edu) return "";
      if (edu.includes("Diploma")) return "Diploma";
      if (edu.includes("Bachelor")) return "Bachelor";
      if (edu.includes("MBA") || edu.includes("Master")) return "MBA";
      return edu;
    };

    setBelongsToOtherOrg(onboardingApp.otherNetworking === "Yes");

    setFormData((prev) => ({
      ...prev,
      chapterInfo: {
        ...prev.chapterInfo,
        countryName: defaultCountry ? defaultCountry.name : "India",
        stateName: stateCode,
        zoneId: zoneId || prev.chapterInfo.zoneId,
        chapterId: chapterId || prev.chapterInfo.chapterId,
        whoInvitedYou: onboardingApp.invited_by_member || (typeof onboardingApp.invitedBy === "object" ? onboardingApp.invitedBy?.name : "") || "",
        howDidYouHearAboutGRIP: onboardingApp.hearAbout || "",
      },
      personalDetails: {
        ...prev.personalDetails,
        firstName: onboardingApp.firstName || "",
        lastName: onboardingApp.lastName || "",
        companyName: onboardingApp.companyName || "",
        industry: onboardingApp.industry || "",
        dob: dobFormatted || "",
        bloodGroup: onboardingApp.bloodGroup || "",
        anniversary: anniversaryFormatted || (onboardingApp.anniversary && onboardingApp.anniversary.includes("-") ? onboardingApp.anniversary : "") || "",
        categoryRepresented: onboardingApp.category || "",
        previouslyGRIPMember: onboardingApp.pastAssociate === "Yes",
        isOtherNetworkingOrgs: onboardingApp.otherNetworking === "Yes",
        otherNetworkingOrgs: onboardingApp.otherNetworkingOrgs || "",
        education: mapEducation(onboardingApp.education),
        renewalDate: defaultRenewal,
      },
      businessAddress: {
        addressLine1: onboardingApp.addressLine1 || "",
        addressLine2: onboardingApp.addressLine2 || "",
        city: onboardingApp.city || "",
        state: onboardingApp.state || "Tamil Nadu",
        postalCode: onboardingApp.postalCode || "",
      },
      contactDetails: {
        email: onboardingApp.email || "",
        mobileNumber: onboardingApp.mobile || "",
        secondaryPhone: onboardingApp.secondaryPhone || "",
        website: onboardingApp.website || "",
        gstNumber: onboardingApp.gstNumber || "",
      },
      businessDetails: {
        businessDescription: onboardingApp.businessDetails || "",
        yearsInBusiness: mapYears(onboardingApp.yearsInBusiness),
      },
      businessReferences: [
        {
          firstName: onboardingApp.ref1FirstName || "",
          lastName: onboardingApp.ref1LastName || "",
          businessName: onboardingApp.ref1BusinessName || "",
          phoneNumber: onboardingApp.ref1Phone || "",
          relationship: onboardingApp.ref1Relationship || "",
          contactSharingGRIP: Boolean(onboardingApp.agreeShareInfo ?? true),
          contactSharingGRIPReferences: Boolean(onboardingApp.agreeShareInfoRef ?? true),
        },
      ],
      termsAndCertifications: {
        willAttendMeetingsOnTime: Boolean(onboardingApp.attendMeetings ?? true),
        willBringVisitors: Boolean(onboardingApp.bringVisitors ?? true),
        willDisplayPositiveAttitude: Boolean(onboardingApp.positiveAttitude ?? true),
        understandsContributorsWin: Boolean(onboardingApp.contributorsWin ?? true),
        willAbideByPolicies: Boolean(onboardingApp.abidePolicies ?? true),
        willContributeBestAbility: Boolean(onboardingApp.contributeBest ?? true),
      },
    }));

    toast.info("Auto-filled available details from Associate Onboarding Application!");
  }, [onboardingApp, isEditMode]);

  // Auto-fill Country, State & Zone for single-zone restricted users (like Executive Director / Zone Admin)
  useEffect(() => {
    if (isEditMode || isSuperAdmin || !currentUser || onboardingApp) return;

    const zoneObj = typeof currentUser.zoneId === 'object' ? currentUser.zoneId : null;
    if (!zoneObj) return;

    if (countries.length > 0 && !formData.chapterInfo.countryName) {
      const targetCountry = zoneObj.countryName || "India";
      const matchedCountry = countries.find(
        (c) => c.name?.toLowerCase() === targetCountry.toLowerCase() || c.isoCode?.toLowerCase() === targetCountry.toLowerCase()
      );

      if (matchedCountry) {
        const countryStates = State.getStatesOfCountry(matchedCountry.isoCode);
        setStates(countryStates);

        const targetState = zoneObj.stateName || "Tamil Nadu";
        const matchedState = countryStates.find(
          (s) => s.name?.toLowerCase() === targetState.toLowerCase() || s.isoCode?.toLowerCase() === targetState.toLowerCase()
        );

        const stateCode = matchedState ? matchedState.isoCode : (countryStates[0]?.isoCode || "");

        setFormData((prev) => ({
          ...prev,
          chapterInfo: {
            ...prev.chapterInfo,
            countryName: matchedCountry.name,
            stateName: stateCode,
            zoneId: zoneObj._id || prev.chapterInfo.zoneId,
          },
        }));

        if (zoneObj._id) {
          setZones([zoneObj]);
          getChapters(zoneObj._id);
        }
      }
    }
  }, [currentUser, isSuperAdmin, isEditMode, countries]);

  useEffect(() => {
    const fetchZones = async () => {
      if (!formData.chapterInfo.stateName) {
        console.log("No state selected");
        setZones([]);
        return;
      }

      console.log("Fetching zones for state:", formData.chapterInfo.stateName);
      setLoadingZones(true);
      try {
        const response = await chapterApiProvider.getZonesByState(
          formData.chapterInfo.stateName
        );
        console.log("API Response:", response);
        if (response && response.response && response.response.status) {
          let fetchedZones = response.response.data || [];

          // Role-based zone restriction:
          // If not super admin and user has assigned zone, strictly filter by assigned zone!
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

          // If there is only one zone available (restricted role) and it's not yet selected
          if (fetchedZones.length === 1) {
            const singleZone = fetchedZones[0];
            setFormData((prev) => ({
              ...prev,
              chapterInfo: {
                ...prev.chapterInfo,
                zoneId: singleZone._id,
              },
            }));
            getChapters(singleZone._id);
          }
        } else {
          console.log("No zones found or error in response");
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

  useEffect(() => {
    fetchAllPins();
  }, []);

  const fetchAllPins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pinApiProvider.getPins();

      if (response && response.status) {
        const pins = response?.response?.data || [];
        setPinData(pins);
      } else {
        setError(response?.response?.message || "Failed to fetch pins");
      }
    } catch (err) {
      console.error("Error fetching pins:", err);
      setError(err.message || "Failed to fetch pins");
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberData = async (id) => {
    try {
      const response = await memberApiProvider.getMemberById(id);
      if (response.status) {
        console.log("Member data:", response.data.data);
        const data = response.data.data;
        setFormData({
          ...data,
          personalDetails: {
            ...data.personalDetails,
            dob: data.personalDetails.dob
              ? data.personalDetails.dob.split("T")[0]
              : "",
            anniversary: data.personalDetails.anniversary
              ? (data.personalDetails.anniversary.includes("T") ? data.personalDetails.anniversary.split("T")[0] : data.personalDetails.anniversary)
              : "",
            bloodGroup: data.personalDetails.bloodGroup || "",
            renewalDate: data.personalDetails.renewalDate?.split("T")[0] || "",
            previouslyGRIPMember: data.personalDetails.previouslyGRIPMember,
          },
          chapterInfo: {
            ...data.chapterInfo,
            zoneId: data.chapterInfo.zoneId?._id || data.chapterInfo.zoneId,
            chapterId:
              data.chapterInfo.chapterId?._id || data.chapterInfo.chapterId,
            CIDId: data.chapterInfo.CIDId?._id || data.chapterInfo.CIDId,
          },
        });
        getChapters(data.chapterInfo.zoneId);
        setBelongsToOtherOrg(
          data.personalDetails?.isOtherNetworkingOrgs ? "true" : "false"
        );
      }
    } catch (err) {
      console.error("Error fetching member data:", err);
    }
  };

  const handleInputChange = async (e, section, field) => {
    setErrors({});
    const newValue = e.target.value;

    // If zone is being changed, fetch chapters for that zone
    // If zone is being changed, fetch chapters for that zone
    if (section === "chapterInfo" && field === "zoneId") {
      setLoadingChapters(true);
      try {
        const response = await chapterApiProvider.getChaptersByZone(newValue);
        if (response && response.status) {
          const chaptersData = (response.response.data || []).filter(c => c.isActive === 1);
          setChapters(chaptersData);

          // Extract unique CIDs from all chapters
          const uniqueCids = [];
          const cidMap = new Map();

          chaptersData.forEach((chapter) => {
            if (chapter.cidId && Array.isArray(chapter.cidId)) {
              chapter.cidId.forEach((cid) => {
                if (cid._id && !cidMap.has(cid._id)) {
                  cidMap.set(cid._id, true);
                  uniqueCids.push({
                    _id: cid._id,
                    name: cid.name,
                    email: cid.email,
                  });
                }
              });
            }
          });

          setCids(uniqueCids);

          setFormData((prev) => {
            // If user hasn’t picked a chapter yet and we have chapters, pre-select the first one
            let chapterId = prev.chapterInfo.chapterId;
            let cidIds = prev.chapterInfo.CIDId;
            if (!chapterId && chaptersData.length > 0) {
              chapterId = chaptersData[0]._id;
              cidIds = chaptersData[0].cidId?.map((c) => c._id) || [];
            }
            return {
              ...prev,
              chapterInfo: {
                ...prev.chapterInfo,
                zoneId: newValue,
                chapterId,
                CIDId: cidIds,
              },
            };
          });
        } else {
          setChapters([]);
          setCids([]);
          console.log("No chapters found for this zone");
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
        setChapters([]);
        setCids([]);
      } finally {
        setLoadingChapters(false);
      }
    }

    // If chapter is being changed, update CID list based on the selected chapter
    if (section === "chapterInfo" && field === "chapterId") {
      const selectedChapterId = newValue;
      const selectedChapter = chapters.find(
        (ch) => ch._id === selectedChapterId
      );
      const selectedCids =
        selectedChapter && Array.isArray(selectedChapter.cidId)
          ? selectedChapter.cidId.map((cid) => cid._id)
          : [];

      setFormData((prev) => ({
        ...prev,
        chapterInfo: {
          ...prev.chapterInfo,
          chapterId: selectedChapterId,
          CIDId: selectedCids,
        },
      }));
      return;
    }

    const alphabeticFields = ["whoInvitedYou", "firstName", "lastName"];

    // Postal code validation (exactly 6 digits)
    if (field === "postalCode") {
      const regex = /^\d{0,6}$/; // Allows 0-6 digits during input
      if (regex.test(newValue)) {
        setFormData((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [field]: newValue,
            // Optional: Track if valid (exactly 6 digits)
            postalCodeValid: newValue.length === 6,
          },
        }));
      }
    }
    // Alphabetic fields validation
    else if (alphabeticFields.includes(field)) {
      const regex = /^[A-Za-z\s]*$/;
      if (regex.test(newValue) || newValue === "") {
        setFormData((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [field]: newValue,
          },
        }));
      }
    }
    if (section === "personalDetails" && field === "renewalDate") {
      const selectedDate = new Date(newValue);

      // Optional rule: renewal date must be today or in future
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setErrors({
          renewalDate: "Renewal date cannot be in the past",
        });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          renewalDate: newValue,
        },
      }));

      return;
    }
    // Normal handling for other fields
    else {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newValue,
        },
      }));
    }
  };

  const handleReferenceChange = (e, index, field) => {
    setErrors({});
    const updatedReferences = [...formData.businessReferences];
    const newValue =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const alphabeticFields = ["firstName", "lastName"];
    if (alphabeticFields.includes(field)) {
      const regex = /^[A-Za-z\s]*$/;
      const isValid = regex.test(newValue) || newValue === "";

      updatedReferences[index] = {
        ...updatedReferences[index],
        [field]: isValid ? newValue : updatedReferences[index][field],
        [`${field}Error`]: !isValid && newValue !== "",
      };
    } else {
      updatedReferences[index][field] = newValue;
    }

    setFormData((prev) => ({
      ...prev,
      businessReferences: updatedReferences,
    }));
  };

  const handleTermsChange = (e, field) => {
    setErrors({});
    setFormData((prev) => ({
      ...prev,
      termsAndCertifications: {
        ...prev.termsAndCertifications,
        [field]: e.target.checked,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.chapterInfo.countryName) {
      toast.error("Country is required");
      return false;
    }

    if (!formData.chapterInfo.stateName) {
      toast.error("State is required");
      return false;
    }

    if (!formData.chapterInfo.zoneId) {
      toast.error("Zone is required");
      return false;
    }

    if (!formData.chapterInfo.chapterId) {
      toast.error("Chapter is required");
      return false;
    }

    if (!formData.chapterInfo.whoInvitedYou) {
      toast.error("Who invited you is required");
      return false;
    }

    if (!formData.chapterInfo.howDidYouHearAboutGRIP) {
      toast.error("How did you hear about GRIP is required");
      return false;
    }

    // Personal Details Validation
    const firstName = formData.personalDetails.firstName.trim();

    if (!firstName) {
      toast.error("First name is required");
      return false;
    } else if (!/^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(firstName)) {
      toast.error("Only letters and single spaces allowed in First Name");
      return false;
    }

    if (!formData.personalDetails.companyName) {
      toast.error("Company name is required");
      return false;
    }

    if (!formData.personalDetails.dob) {
      toast.error("Date of Birth is required");
      return false;
    }

    if (!formData.personalDetails.categoryRepresented) {
      toast.error("Category Represented is required");
      return false;
    }

    if (formData.personalDetails.previouslyGRIPMember === "") {
      toast.error("Previous GRIP Member field is required");
      return false;
    }

    if (belongsToOtherOrg === "") {
      toast.error("Belongs to other organizations field is required");
      return false;
    }

    if (!formData.personalDetails.renewalDate) {
      toast.error("Renewal Date field is required");

      setErrors(prev => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          renewalDate: "Renewal Date is required"
        }
      }));

      return false;
    }


    // Business Address Validation
    const address = formData.businessAddress;

    if (!address.addressLine1) {
      toast.error("Address Line 1 is required");
      return false;
    }

    if (!address.addressLine2) {
      toast.error("Address Line 2 is required");
      return false;
    }

    if (!address.state) {
      toast.error("State is required");
      return false;
    }
    if (!/^[A-Za-z\s]+$/.test(address.state)) {
      toast.error("State can only contain letters and spaces");
      return false;
    }

    if (!address.city) {
      toast.error("City is required");
      return false;
    }
    if (!/^[A-Za-z\s]+$/.test(address.city)) {
      toast.error("City can only contain letters and spaces");
      return false;
    }

    if (!address.postalCode) {
      toast.error("Postal Code is required");
      return false;
    }
    if (!/^\d{6}$/.test(address.postalCode)) {
      toast.error("Postal Code must be exactly 6 digits");
      return false;
    }

    // Contact Details Validation
    const contact = formData.contactDetails;

    if (!contact.email) {
      toast.error("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      toast.error("Invalid email format");
      return false;
    }

    if (!contact.mobileNumber) {
      toast.error("Mobile number is required");
      return false;
    }
    if (!/^\d{10}$/.test(contact.mobileNumber)) {
      toast.error("Mobile number must be exactly 10 digits");
      return false;
    }

    // Business Details Validation
    const business = formData.businessDetails;

    if (
      !business.businessDescription ||
      business.businessDescription.trim() === ""
    ) {
      toast.error("Please describe your business details");
      return false;
    }

    if (!business.yearsInBusiness || business.yearsInBusiness.trim() === "") {
      toast.error("Please select how many years you are in business");
      return false;
    }

    try {
      const memberData = {
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          pins: Array.isArray(formData.personalDetails.pins)
            ? formData.personalDetails.pins.map((p) => ({
              _id: p._id,
              name: p.name,
              image:
                typeof p.image === "object"
                  ? p.image.docName || ""
                  : p.image || "",
            }))
            : [],
          isOtherNetworkingOrgs: belongsToOtherOrg === "true",
          otherNetworkingOrgs:
            belongsToOtherOrg === "true"
              ? formData.personalDetails.otherNetworkingOrgs
              : "",
          previouslyGRIPMember: formData.personalDetails.previouslyGRIPMember,
        },
      };

      let response;
      if (isEditMode) {
        response = await memberApiProvider.updateMember(id, memberData);
      } else {
        response = await memberApiProvider.createMember(memberData);
      }

      console.log("Response from API:", response);
      if (response.status) {
        toast.success(response.message || "Operation successful!");
        setTimeout(() => navigate("/primarymember-list"), 3000);
      } else {
        console.log("response.message", response.message); // ✅ fix here
        toast.error(response.message || "Operation failed!"); // ✅ fix here
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error(err.message || "An error occurred while submitting the form");
    }
  };

  const getChapters = async (newValue) => {
    // newValue can be a zone object or an ID string
    const zoneId = typeof newValue === "string" ? newValue : newValue?._id;
    console.log("enter here", newValue, newValue);
    setLoadingChapters(true);
    try {
      const response = await chapterApiProvider.getChaptersByZone(zoneId);
      if (response && response.status) {
        const chaptersData = (response.response.data || []).filter(c => c.isActive === 1);
        setChapters(chaptersData);
        console.log("Chapters data:", chaptersData);

        const uniqueCids = [];
        const cidMap = new Map();

        chaptersData.forEach((chapter) => {
          if (chapter.cidId && Array.isArray(chapter.cidId)) {
            chapter.cidId.forEach((cid) => {
              if (cid._id && !cidMap.has(cid._id)) {
                cidMap.set(cid._id, true);
                uniqueCids.push({
                  _id: cid._id,
                  name: cid.name,
                  email: cid.email,
                });
              }
            });
          }
        });

        setCids(uniqueCids);

        // Update chapter & CID if none chosen yet (create mode)
        setFormData((prev) => {
          let chapterId = prev.chapterInfo.chapterId;
          let selectedCidIds = prev.chapterInfo.CIDId;

          if (!chapterId && chaptersData.length > 0) {
            // Auto select first chapter when none yet chosen
            const firstChap = chaptersData[0];
            chapterId = firstChap._id;
            selectedCidIds = firstChap.cidId?.map((c) => c._id) || [];
          } else if (chapterId) {
            const selectedChap = chaptersData.find(
              (ch) => ch._id === chapterId
            );
            if (selectedChap && Array.isArray(selectedChap.cidId)) {
              selectedCidIds = selectedChap.cidId.map((cid) => cid._id);
            } else {
              selectedCidIds = [];
            }
          }

          return {
            ...prev,
            chapterInfo: {
              ...prev.chapterInfo,
              chapterId,
              CIDId: selectedCidIds,
            },
          };
        });
      } else {
        setChapters([]);
        setCids([]);
        console.log("No chapters found for this zone");
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setChapters([]);
      setCids([]);
    } finally {
      setLoadingChapters(false);
    }
  };
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
                <label className="form-label">
                  Country<span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select border"
                  value={formData.chapterInfo.countryName}
                  onChange={(e) => {
                    handleInputChange(e, "chapterInfo", "countryName");
                    setFormData((prev) => ({
                      ...prev,
                      chapterInfo: {
                        ...prev.chapterInfo,
                        stateName: "",
                      },
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
                    <span className="text-danger">
                      {errors.chapterInfo.countryName}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">
                  State<span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select border"
                  value={formData.chapterInfo.stateName}
                  onChange={(e) =>
                    handleInputChange(e, "chapterInfo", "stateName")
                  }
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
                    <span className="text-danger">
                      {errors.chapterInfo.stateName}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label d-flex align-items-center justify-content-between mb-2">
                  <span>
                    Zone<span className="text-danger">*</span>
                  </span>
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
                      className="form-control form-select border"
                      value={formData.chapterInfo.zoneId || ""}
                      onChange={(e) =>
                        handleInputChange(e, "chapterInfo", "zoneId")
                      }
                      disabled={
                        !formData.chapterInfo.stateName ||
                        !zones ||
                        zones.length === 0 ||
                        (!isSuperAdmin && zones.length === 1)
                      }
                    >
                      {(isSuperAdmin || zones.length > 1) && (
                        <option value="">Select Zone</option>
                      )}
                      {zones &&
                        zones.map((zone) => (
                          <option key={zone._id} value={zone._id}>
                            {zone.zoneName}
                          </option>
                        ))}
                    </select>
                    {errors.chapterInfo?.zoneId && (
                      <div className="">
                        <span className="text-danger">
                          {errors.chapterInfo.zoneId}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">
                  Chapter Name<span className="text-danger">*</span>
                </label>
                {loadingChapters ? (
                  <div className="form-control">Loading chapters...</div>
                ) : (
                  <>
                    <select
                      className="form-control form-select border"
                      value={formData.chapterInfo.chapterId}
                      onChange={(e) =>
                        handleInputChange(e, "chapterInfo", "chapterId")
                      }
                      disabled={
                        !formData.chapterInfo.zoneId || chapters.length === 0
                      }
                    >
                      {chapters.map((chapter) => (
                        <option key={chapter._id} value={chapter._id}>
                          {chapter.chapterName}
                        </option>
                      ))}
                    </select>
                    {errors.chapterInfo?.chapterId && (
                      <div className="">
                        <span className="text-danger">
                          {errors.chapterInfo.chapterId}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="col-6">
                <label className="form-label">
                  Who Invited You?<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.chapterInfo.whoInvitedYou}
                  onChange={(e) =>
                    handleInputChange(e, "chapterInfo", "whoInvitedYou")
                  }
                />
                {errors.chapterInfo?.whoInvitedYou && (
                  <div className="">
                    <span className="text-danger">
                      {errors.chapterInfo.whoInvitedYou}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">
                  How did you hear about GRIP?
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select border"
                  value={formData.chapterInfo.howDidYouHearAboutGRIP}
                  onChange={(e) =>
                    handleInputChange(
                      e,
                      "chapterInfo",
                      "howDidYouHearAboutGRIP"
                    )
                  }
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
                    <span className="text-danger">
                      {errors.chapterInfo.howDidYouHearAboutGRIP}
                    </span>
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
                <label className="form-label">
                  First Name<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.personalDetails.firstName}
                  onChange={(e) =>
                    handleInputChange(e, "personalDetails", "firstName")
                  }
                />
                {errors.personalDetails?.firstName && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.firstName}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.personalDetails.lastName}
                  onChange={(e) =>
                    handleInputChange(e, "personalDetails", "lastName")
                  }
                />
                {errors.personalDetails?.lastName && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.lastName}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">
                  Company Name<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.personalDetails.companyName}
                  onChange={(e) =>
                    handleInputChange(e, "personalDetails", "companyName")
                  }
                />
                {errors.personalDetails?.companyName && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.companyName}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">Industry</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.personalDetails.industry}
                  onChange={(e) =>
                    handleInputChange(e, "personalDetails", "industry")
                  }
                />
                {errors.personalDetails?.industry && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.industry}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">
                  Date of Birth <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.personalDetails.dob}
                  onChange={(e) =>
                    handleInputChange(e, "personalDetails", "dob")
                  }
                />
                {errors.personalDetails?.dob && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.dob}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">
                  Category You Represent <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.personalDetails.categoryRepresented}
                  onChange={(e) =>
                    handleInputChange(
                      e,
                      "personalDetails",
                      "categoryRepresented"
                    )
                  }
                />
                {errors.personalDetails?.categoryRepresented && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.categoryRepresented}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">
                  Blood Group
                </label>
                <select
                  className="form-control form-select border"
                  value={formData.personalDetails.bloodGroup || ""}
                  onChange={(e) =>
                    handleInputChange(e, "personalDetails", "bloodGroup")
                  }
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
                {errors.personalDetails?.bloodGroup && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.bloodGroup}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">
                  Anniversary Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.personalDetails.anniversary || ""}
                  onChange={(e) =>
                    handleInputChange(e, "personalDetails", "anniversary")
                  }
                />
                {errors.personalDetails?.anniversary && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.anniversary}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">
                  Have you or your company ever been a member of GRIP chapter?
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select border"
                  value={String(formData.personalDetails.previouslyGRIPMember)}
                  onChange={(e) =>
                    handleInputChange(
                      {
                        target: {
                          value:
                            e.target.value === "true"
                              ? true
                              : e.target.value === "false"
                                ? false
                                : "",
                        },
                      },
                      "personalDetails",
                      "previouslyGRIPMember"
                    )
                  }
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
                {errors.personalDetails?.previouslyGRIPMember && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.previouslyGRIPMember}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">
                  Do you belong to any other networking organizations?
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select border"
                  value={belongsToOtherOrg}
                  onChange={(e) =>
                    setBelongsToOtherOrg(e.target.value === "true")
                  }
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
                {errors.personalDetails?.isOtherNetworkingOrgs && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.isOtherNetworkingOrgs}
                    </span>
                  </div>
                )}
              </div>
              {belongsToOtherOrg === true && (
                <div className="col-6">
                  <label className="form-label">
                    Please specify the other networking organisations
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.personalDetails.otherNetworkingOrgs}
                    onChange={(e) =>
                      handleInputChange(
                        e,
                        "personalDetails",
                        "otherNetworkingOrgs"
                      )
                    }
                  />
                  {errors.personalDetails?.otherNetworkingOrgs && (
                    <div className="">
                      <span className="text-danger">
                        {errors.personalDetails.otherNetworkingOrgs}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="col-6">
                <label className="form-label">Education</label>
                <select
                  className="form-control form-select border"
                  value={formData.personalDetails.education}
                  onChange={(e) =>
                    handleInputChange(e, "personalDetails", "education")
                  }
                >
                  <option value="">Select Education</option>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma in Business</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="MBA">MBA / Master's in Business</option>
                  <option value="Professional Degree">
                    Professional Degree
                  </option>
                  <option value="Entrepreneurship Certificate">
                    Entrepreneurship Certificate
                  </option>
                  <option value="Others">Others</option>
                </select>
                {errors.personalDetails?.education && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.education}
                    </span>
                  </div>
                )}
              </div>
              {/* select pin */}
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  Select Pins
                </label>

                <Select
                  isMulti
                  classNamePrefix="react-select"
                  className="react-select-container"
                  options={pinOptions}
                  isLoading={loading}
                  value={
                    Array.isArray(formData.personalDetails.pins)
                      ? pinOptions.filter((opt) =>
                        formData.personalDetails.pins.some(
                          (p) => String(p._id) === String(opt.value)
                        )
                      )
                      : []
                  }
                  onChange={(selectedOptions) => {
                    const selectedPinsData =
                      selectedOptions?.map((opt) => ({
                        _id: opt.value,
                        name: opt.label,
                        image: opt.data?.image || null,
                      })) ?? [];

                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: {
                        ...prev.personalDetails,
                        pins: selectedPinsData,
                      },
                    }));
                  }}
                  placeholder="Select Pins"
                />

                {error && <div className="text-danger mt-1">{error}</div>}
              </div>
              <div className="col-4">
                <label className="form-label">
                  Renewal Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.personalDetails.renewalDate}
                  onChange={(e) =>
                    handleInputChange(e, "personalDetails", "renewalDate")
                  }
                />
                {errors.personalDetails?.renewalDate && (
                  <div className="">
                    <span className="text-danger">
                      {errors.personalDetails.renewalDate}
                    </span>
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
                <label className="form-label">
                  Address Line 1 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.businessAddress.addressLine1}
                  onChange={(e) =>
                    handleInputChange(e, "businessAddress", "addressLine1")
                  }
                />
                {errors.businessAddress?.addressLine1 && (
                  <div className="">
                    <span className="text-danger">
                      {errors.businessAddress.addressLine1}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">
                  Address Line 2 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.businessAddress.addressLine2}
                  onChange={(e) =>
                    handleInputChange(e, "businessAddress", "addressLine2")
                  }
                />
                {errors.businessAddress?.addressLine2 && (
                  <div className="">
                    <span className="text-danger">
                      {errors.businessAddress.addressLine2}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">
                  State <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.businessAddress.state}
                  onChange={(e) =>
                    handleInputChange(e, "businessAddress", "state")
                  }
                />
                {errors.businessAddress?.state && (
                  <div className="">
                    <span className="text-danger">
                      {errors.businessAddress.state}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">
                  City<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.businessAddress.city}
                  onChange={(e) =>
                    handleInputChange(e, "businessAddress", "city")
                  }
                />
                {errors.businessAddress?.city && (
                  <div className="">
                    <span className="text-danger">
                      {errors.businessAddress.city}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">
                  Postal Code<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.businessAddress.postalCode}
                  onChange={(e) =>
                    handleInputChange(e, "businessAddress", "postalCode")
                  }
                />
                {errors.businessAddress?.postalCode && (
                  <div className="">
                    <span className="text-danger">
                      {errors.businessAddress.postalCode}
                    </span>
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
                <label className="form-label">
                  Email<span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.contactDetails.email}
                  onChange={(e) =>
                    handleInputChange(e, "contactDetails", "email")
                  }
                />
                {errors.contactDetails?.email && (
                  <div className="">
                    <span className="text-danger">
                      {errors.contactDetails.email}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">
                  Mobile Number<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.contactDetails.mobileNumber}
                  onChange={(e) =>
                    handleInputChange(e, "contactDetails", "mobileNumber")
                  }
                />
                {errors.contactDetails?.mobileNumber && (
                  <div className="">
                    <span className="text-danger">
                      {errors.contactDetails.mobileNumber}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-4">
                <label className="form-label">Secondary Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.contactDetails.secondaryPhone}
                  onChange={(e) =>
                    handleInputChange(e, "contactDetails", "secondaryPhone")
                  }
                />
                {errors.contactDetails?.secondaryPhone && (
                  <div className="">
                    <span className="text-danger">
                      {errors.contactDetails.secondaryPhone}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">Website</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.contactDetails.website}
                  onChange={(e) =>
                    handleInputChange(e, "contactDetails", "website")
                  }
                />
                {errors.contactDetails?.website && (
                  <div className="">
                    <span className="text-danger">
                      {errors.contactDetails.website}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">GST Number (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.contactDetails.gstNumber}
                  onChange={(e) =>
                    handleInputChange(e, "contactDetails", "gstNumber")
                  }
                />
                {errors.contactDetails?.gstNumber && (
                  <div className="">
                    <span className="text-danger">
                      {errors.contactDetails.gstNumber}
                    </span>
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
                <label className="form-label">
                  Describe Your Business Details
                  <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.businessDetails.businessDescription}
                  onChange={(e) =>
                    handleInputChange(
                      e,
                      "businessDetails",
                      "businessDescription"
                    )
                  }
                />
                {errors.businessDetails?.businessDescription && (
                  <div className="">
                    <span className="text-danger">
                      {errors.businessDetails.businessDescription}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">
                  How many years are you in the business?
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select"
                  value={formData.businessDetails.yearsInBusiness}
                  onChange={(e) =>
                    handleInputChange(e, "businessDetails", "yearsInBusiness")
                  }
                >
                  <option value="" disabled>
                    Select duration
                  </option>
                  <option value="below_1_year">Below 1 year</option>
                  <option value="1_5_years">1 to 5 years</option>
                  <option value="6_10_years">6 to 10 years</option>
                  <option value="11_15_years">11 to 15 years</option>
                  <option value="above_15_years">Above 15 years</option>
                </select>
                {errors.businessDetails?.yearsInBusiness && (
                  <div className="">
                    <span className="text-danger">
                      {errors.businessDetails.yearsInBusiness}
                    </span>
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
                    <label className="form-label">
                      Ref {index + 1}: First Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={ref.firstName}
                      onChange={(e) =>
                        handleReferenceChange(e, index, "firstName")
                      }
                    />
                    {errors.businessReferences?.[index]?.firstName && (
                      <div className="">
                        <span className="text-danger">
                          {errors.businessReferences[index].firstName}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-4">
                    <label className="form-label">
                      Ref {index + 1}: Last Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={ref.lastName}
                      onChange={(e) =>
                        handleReferenceChange(e, index, "lastName")
                      }
                    />
                    {errors.businessReferences?.[index]?.lastName && (
                      <div className="">
                        <span className="text-danger">
                          {errors.businessReferences[index].lastName}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-4">
                    <label className="form-label">Business Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={ref.businessName}
                      onChange={(e) =>
                        handleReferenceChange(e, index, "businessName")
                      }
                    />
                    {errors.businessReferences?.[index]?.businessName && (
                      <div className="">
                        <span className="text-danger">
                          {errors.businessReferences[index].businessName}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-6">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={ref.phoneNumber}
                      onChange={(e) =>
                        handleReferenceChange(e, index, "phoneNumber")
                      }
                    />
                    {errors.businessReferences?.[index]?.phoneNumber && (
                      <div className="">
                        <span className="text-danger">
                          {errors.businessReferences[index].phoneNumber}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-6 mb-20">
                    <label className="form-label">Relationship</label>
                    <input
                      type="text"
                      className="form-control"
                      value={ref.relationship}
                      onChange={(e) =>
                        handleReferenceChange(e, index, "relationship")
                      }
                    />
                    {errors.businessReferences?.[index]?.relationship && (
                      <div className="">
                        <span className="text-danger">
                          {errors.businessReferences[index].relationship}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <div className="form-check style-check d-flex align-items-center mb-10">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={ref.contactSharingGRIP}
                        onChange={(e) =>
                          handleReferenceChange(e, index, "contactSharingGRIP")
                        }
                      />
                      <label className="form-check-label">
                        I have/will inform the above contacts that I'm sharing
                        their info with GRIP.
                      </label>
                    </div>
                    {errors.businessReferences?.[index]?.contactSharingGRIP && (
                      <div className="">
                        <span className="text-danger">
                          {errors.businessReferences[index].contactSharingGRIP}
                        </span>
                      </div>
                    )}
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={ref.contactSharingGRIPReferences}
                        onChange={(e) =>
                          handleReferenceChange(
                            e,
                            index,
                            "contactSharingGRIPReferences"
                          )
                        }
                      />
                      <label className="form-check-label">
                        I have/will inform the above contacts that I am sharing
                        their information with GRIP for the purpose of
                        references
                      </label>
                    </div>
                    {errors.businessReferences?.[index]
                      ?.contactSharingGRIPReferences && (
                        <div className="">
                          <span className="text-danger">
                            {
                              errors.businessReferences[index]
                                .contactSharingGRIPReferences
                            }
                          </span>
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
                    checked={
                      formData.termsAndCertifications.willAttendMeetingsOnTime
                    }
                    onChange={(e) =>
                      handleTermsChange(e, "willAttendMeetingsOnTime")
                    }
                  />
                  <label className="form-check-label">
                    I will be able to attend our GRIP weekly meetings on time.
                  </label>
                </div>
                {errors.termsAndCertifications?.willAttendMeetingsOnTime && (
                  <div className="">
                    <span className="text-danger">
                      {errors.termsAndCertifications.willAttendMeetingsOnTime}
                    </span>
                  </div>
                )}
                <div className="form-check style-check d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formData.termsAndCertifications.willBringVisitors}
                    onChange={(e) => handleTermsChange(e, "willBringVisitors")}
                  />
                  <label className="form-check-label">
                    I will be able to bring visitors to this GRIP chapter
                    meetings.
                  </label>
                </div>
                {errors.termsAndCertifications?.willBringVisitors && (
                  <div className="">
                    <span className="text-danger">
                      {errors.termsAndCertifications.willBringVisitors}
                    </span>
                  </div>
                )}
                <div className="form-check style-check d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      formData.termsAndCertifications
                        .willDisplayPositiveAttitude
                    }
                    onChange={(e) =>
                      handleTermsChange(e, "willDisplayPositiveAttitude")
                    }
                  />
                  <label className="form-check-label">
                    I will always display a positive attitude.
                  </label>
                </div>
                {errors.termsAndCertifications?.willDisplayPositiveAttitude && (
                  <div className="">
                    <span className="text-danger">
                      {
                        errors.termsAndCertifications
                          .willDisplayPositiveAttitude
                      }
                    </span>
                  </div>
                )}
                <div className="form-check style-check d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      formData.termsAndCertifications.understandsContributorsWin
                    }
                    onChange={(e) =>
                      handleTermsChange(e, "understandsContributorsWin")
                    }
                  />
                  <label className="form-check-label">
                    I understand that "Contributors Win"™
                  </label>
                </div>
                {errors.termsAndCertifications?.understandsContributorsWin && (
                  <div className="">
                    <span className="text-danger">
                      {errors.termsAndCertifications.understandsContributorsWin}
                    </span>
                  </div>
                )}
                <div className="form-check style-check d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      formData.termsAndCertifications.willAbideByPolicies
                    }
                    onChange={(e) =>
                      handleTermsChange(e, "willAbideByPolicies")
                    }
                  />
                  <label className="form-check-label">
                    I will abide by the policies of GRIP.
                  </label>
                </div>
                {errors.termsAndCertifications?.willAbideByPolicies && (
                  <div className="">
                    <span className="text-danger">
                      {errors.termsAndCertifications.willAbideByPolicies}
                    </span>
                  </div>
                )}
                <div className="form-check style-check d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      formData.termsAndCertifications.willContributeBestAbility
                    }
                    onChange={(e) =>
                      handleTermsChange(e, "willContributeBestAbility")
                    }
                  />
                  <label className="form-check-label">
                    I will contribute to the best of my knowledge & ability.
                  </label>
                </div>
                {errors.termsAndCertifications?.willContributeBestAbility && (
                  <div className="">
                    <span className="text-danger">
                      {errors.termsAndCertifications.willContributeBestAbility}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary grip">
                  {isEditMode ? "Update Associate" : "Submit Application"}
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

export default AddPrimaryMemberLayer;
