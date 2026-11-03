import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import chapterApiProvider from "../apiProvider/chapterApi";
import memberApiProvider from "../apiProvider/memberApi";
import { IMAGE_BASE_URL } from "../network/apiClient";
import { hasPermission, getCurrentUser } from "../utils/auth";
import { formatCurrencyValue } from "../utils/dateFormatter";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChapterViewLayer = () => {
  const navigate = useNavigate();
  const CHART_OPTIONS = {
    chart: {
      height: 264,
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      colors: ["#FF9F29"],
      width: 4,
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        gradientToColors: ["#0E53F4"],
        shadeIntensity: 1,
        type: "horizontal",
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    markers: {
      size: 0,
      strokeWidth: 3,
      hover: { size: 8 },
    },
    tooltip: {
      enabled: true,
      x: { show: true },
      y: {
        formatter: formatCurrencyValue,
      },
    },
    grid: {
      row: {
        colors: ["transparent", "transparent"],
        opacity: 0.5,
      },
      borderColor: "#D1D5DB",
      strokeDashArray: 3,
    },
    yaxis: {
      labels: {
        formatter: formatCurrencyValue,
        style: {
          fontSize: "14px",
        },
      },
    },
    xaxis: {
      categories: [],
      tooltip: { enabled: false },
      labels: {
        formatter: function (value) {
          return value;
        },
        style: {
          fontSize: "12px",
        },
      },
      axisBorder: { show: false },
    },
  };
  const { id } = useParams();
  const [chapterData, setChapterData] = useState("");
  const [loadingChapterData, setLoadingChapterData] = useState(true);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [gradientLineChartSeries, setGradientLineChartSeries] = useState([]);
  const [gradientLineChartOptions, setGradientLineChartOptions] =
    useState(CHART_OPTIONS);
  const [cardsCount, setCardCount] = useState([]);
  const [headTableMembersData, setHeadTableMembersData] = useState([]);
  const [headTableUsersData, setHeadTableUsersData] = useState([]);
  const [topAchieversData, setTopAchieversData] = useState({
    thankYouSlips: { totalAmount: 0, topReceivers: [] },
    testimonialSlips: { totalCount: 0, topReceivers: [] },
    oneToOneMeetings: { totalCount: 0, topMembers: [] },
    visitors: { totalCount: 0, topMembers: [] },
    referralSlips: { totalCount: 0, topReceivers: [] },
  });
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [referralMember, setReferralMember] = useState(null);
  const [businessMember, setBusinessMember] = useState(null);
  const [visitorMember, setVisitorMember] = useState(null);


  const [presidentMember, setPresidentMember] = useState(null);
  const [secretaryMember, setSecretaryMember] = useState(null);
  const [vicePresidentMember, setVicePresidentMember] = useState(null);
  const [associateCommitteeMembers, setAssociateCommitteeMembers] = useState([]);
  const [coordinatorMembers, setCoordinatorMembers] = useState([]);
  const [visitorInteractionMembers, setVisitorInteractionMembers] = useState([]);
  const [roleModalTarget, setRoleModalTarget] = useState(null);

  const customSelectStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    control: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: "#fff",
      border: isFocused ? "1.5px solid rgb(192, 34, 33)" : "1px solid #dee2e6",
      minHeight: "3rem",
      borderRadius: "8px",
      boxShadow: isFocused ? "0 0 0 3px rgba(192, 34, 33, 0.15)" : "none",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "rgb(192, 34, 33)",
      }
    }),
    option: (styles, { isSelected, isFocused }) => ({
      ...styles,
      backgroundColor: isSelected 
        ? "rgb(192, 34, 33)" 
        : isFocused 
          ? "rgba(192, 34, 33, 0.05)" 
          : "#fff",
      color: isSelected ? "#fff" : "#334155",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "rgb(192, 34, 33)",
        color: "#fff"
      }
    })
  };

  const formatOptionLabel = (option) => {
    const member = allMembers.find(m => m.id === option.value);
    const imageUrl = member?.profileImage?.docPath
      ? `${IMAGE_BASE_URL}/${member.profileImage.docPath}/${member.profileImage.docName}`
      : null;
      
    return (
      <div className="d-flex align-items-center gap-2 py-1">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={option.label}
            className="rounded-circle object-fit-cover shadow-sm"
            style={{ width: "24px", height: "24px", border: "1px solid #dee2e6" }}
            onError={(e) => { e.target.src = "/assets/images/avatar/avatar1.png"; }}
          />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "rgb(192, 34, 33)",
              fontSize: "10px"
            }}
          >
            {option.label ? option.label.charAt(0).toUpperCase() : "?"}
          </div>
        )}
        <span className="fw-medium text-dark">{option.label}</span>
      </div>
    );
  };

  const renderMemberPreview = (selectedOption, subtitle, badgeText) => {
    if (!selectedOption) return null;
    const memberObj = allMembers.find(m => m.id === selectedOption.value);
    const imageUrl = memberObj?.profileImage?.docPath
      ? `${IMAGE_BASE_URL}/${memberObj.profileImage.docPath}/${memberObj.profileImage.docName}`
      : null;

    // Use email/phone as subtitle if available
    const displaySubtitle = memberObj ? (memberObj.email || memberObj.mobileNumber || subtitle) : subtitle;

    return (
      <div 
        className="mt-3 p-12 radius-12 border d-flex align-items-center gap-12 bg-base shadow-sm"
        style={{ 
          borderLeft: "4px solid rgb(192, 34, 33)",
          animation: "fadeIn 0.3s ease-in-out",
          backgroundColor: "#fcfcfc",
          minHeight: "72px"
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={selectedOption.label}
            className="rounded-circle object-fit-cover border border-2 border-white shadow-sm flex-shrink-0"
            style={{ width: "40px", height: "40px" }}
            onError={(e) => { e.target.src = "/assets/images/avatar/avatar1.png"; }}
          />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "rgb(192, 34, 33)",
              fontSize: "15px",
            }}
          >
            {selectedOption.label ? selectedOption.label.charAt(0).toUpperCase() : "?"}
          </div>
        )}
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h6 className="mb-0 fw-bold text-dark text-sm text-truncate" style={{ maxWidth: "120px" }}>
              {selectedOption.label}
            </h6>
            <span 
              className="badge px-2 py-1 radius-4 fw-semibold flex-shrink-0"
              style={{ 
                color: "rgb(192, 34, 33)", 
                backgroundColor: "rgba(192, 34, 33, 0.08)",
                fontSize: "10px",
                lineHeight: "1"
              }}
            >
              {badgeText}
            </span>
          </div>
          <span className="text-secondary-light text-xs d-block text-truncate mt-1">
            {displaySubtitle}
          </span>
        </div>
      </div>
    );
  };


  const handleRoleSubmit = async () => {
    // FINAL PAYLOAD
    const payload = {
      president: presidentMember?.value || null,
      secretary: secretaryMember?.value || null,
      vicePresident: vicePresidentMember?.value || null,
      associateCommittee: associateCommitteeMembers ? associateCommitteeMembers.map(m => m.value) : [],
      coordinator: coordinatorMembers ? coordinatorMembers.map(m => m.value) : [],
      visitorInteraction: visitorInteractionMembers ? visitorInteractionMembers.map(m => m.value) : [],
    };

    try {
      const res = await chapterApiProvider.submitHeadTableRoles(id, payload);

      if (res.status) {
        toast.success(res.message || "Head table roles saved!");
        fetchHeadTableMembers(id); // Refresh data
      } else {
        toast.error(res.message || "Backend error");
      }
    } catch (err) {
      toast.error(err?.message || "Unexpected error occurred");
    }
  };

  useEffect(() => {
    fetchHeadTableData();
  }, []);


  const fetchHeadTableData = async () => {
    try {
      const res = await chapterApiProvider.getHeadTableRoles(id);

      if (!res?.data) return;

      const data = res.data;

      if (data.president) {
        setPresidentMember({
          label: data.president.name,
          value: data.president.id
        });
      }

      if (data.secretary) {
        setSecretaryMember({
          label: data.secretary.name,
          value: data.secretary.id
        });
      }

      if (data.vicePresident) {
        setVicePresidentMember({
          label: data.vicePresident.name,
          value: data.vicePresident.id
        });
      }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (id) {
      fetchChapterData(id);
      fetchCountData(id);
      fetchHeadTableMembers(id);
      fetchHeadTableUsers(id);
      fetchTopAchievers(id);
      fetchMonthlyRevenueforChapter(id);
      fetchAllMembers(id);
      // Load data for specific chapter
    } else {
      // Handle no ID case
    }
  }, [id]);

  // ---------------- STATE ----------------
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [membersData, setMembersData] = useState([]);
  const paginatedMembers = membersData;   // ✅ FIX HERE

  const [attendanceCounts, setAttendanceCounts] = useState({});
  const [oneToOneCounts, setOneToOneCounts] = useState({});
  const [referralCounts, setReferralCounts] = useState({});
  const [thankYouAmounts, setThankYouAmounts] = useState({});
  const [visitorCounts, setVisitorCounts] = useState({});
  const [testimonialCounts, setTestimonialCounts] = useState({});
  const [search, setSearch] = useState("");
  const [associatePerformance, setAssociatePerformance] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);


  const [palmsPeriod, setPalmsPeriod] = useState("overall");
  const [loadingPalms, setLoadingPalms] = useState(false);

  const PALMS_PERIOD_OPTIONS = [
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "3months", label: "3 Months" },
    { key: "6months", label: "6 Months" },
    { key: "yearly", label: "Yearly" },
    { key: "overall", label: "Overall" },
  ];

  const getDateRangeForPeriod = (period) => {
    const now = new Date();
    if (period === "weekly") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (period === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (period === "3months") {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (period === "6months") {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (period === "yearly") {
      const start = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    // "overall"
    return { startDate: undefined, endDate: undefined };
  };



  const fetchPalmsCounts = async (membersList, period) => {
    if (!membersList || membersList.length === 0) return;
    setLoadingPalms(true);
    try {
      const dateFilter = getDateRangeForPeriod(period);
      const memberIds = membersList.map((m) => m._id);

      const [
        attendanceRes,
        oneToOneRes,
        referralRes,
        thankYouRes,
        visitorRes,
        testimonialRes,
      ] = await Promise.all([
        chapterApiProvider.getMembersAttendanceCount(membersList, dateFilter),
        chapterApiProvider.getOneToOneCounts(memberIds, dateFilter),
        chapterApiProvider.getReferralCounts(memberIds, dateFilter),
        chapterApiProvider.getThankYouSlipAmounts(memberIds, dateFilter),
        chapterApiProvider.getVisitorCounts(memberIds, dateFilter),
        chapterApiProvider.getTestimonialCounts(memberIds, dateFilter),
      ]);

      if (attendanceRes?.success) setAttendanceCounts(attendanceRes.data);
      if (oneToOneRes?.success) setOneToOneCounts(oneToOneRes.data);
      if (referralRes?.success) setReferralCounts(referralRes.data);
      if (thankYouRes?.success) setThankYouAmounts(thankYouRes.data);
      if (visitorRes?.success) setVisitorCounts(visitorRes.data);
      if (testimonialRes?.success) setTestimonialCounts(testimonialRes.data);
    } catch (error) {
      console.error("Error fetching PALMS counts:", error);
    } finally {
      setLoadingPalms(false);
    }
  };

  // ---------------- USE EFFECT ----------------
  useEffect(() => {
    if (id) {
      fetchMembersWithAttendance(id);
    } else {
      setLoadingReports(false);
    }
  }, [id, search, pagination.page, pagination.limit]);


  const fetchAllMembers = async (chapterId) => {
    try {
      const response = await memberApiProvider.getMemberByChapterId({ limit: 1000 }, chapterId);
      const fetchedMembers = response?.data?.data?.members || [];
      const mappedMembers = fetchedMembers.map(m => ({
        id: m._id,
        name: `${m.personalDetails?.firstName || ""} ${m.personalDetails?.lastName || ""}`.trim(),
        companyName: m.personalDetails?.companyName,
        profileImage: m.personalDetails?.profileImage,
        contactDetails: m.contactDetails,
      }));
      setAllMembers(mappedMembers);
    } catch (error) {
      console.error("Error fetching all members for selection:", error);
    }
  };

  // ---------------- MAIN FUNCTION ----------------
  const fetchMembersWithAttendance = async (chapterId) => {
    setLoadingReports(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
      };

      // 1. FETCH MEMBERS
      const response = await memberApiProvider.getMemberByChapterId(params, chapterId);
      const fetchedMembers = response?.data?.data?.members || [];

      setMembersData(fetchedMembers);

      // Populate 'members' state so that Select dropdowns and Head Table UI have access to names, images, etc.
      const mappedMembers = fetchedMembers.map(m => ({
        id: m._id,
        name: `${m.personalDetails?.firstName || ""} ${m.personalDetails?.lastName || ""}`.trim(),
        companyName: m.personalDetails?.companyName,
        profileImage: m.personalDetails?.profileImage,
        contactDetails: m.contactDetails,
      }));
      setMembers(mappedMembers);

      const total = response?.data?.data?.pagination?.total || 0;
      setPagination((prev) => ({
        ...prev,
        total,
        totalPages: Math.ceil(total / prev.limit),
      }));

      if (fetchedMembers.length === 0) {
        setAttendanceCounts({});
        setOneToOneCounts({});
        setReferralCounts({});
        setThankYouAmounts({});
        setVisitorCounts({});
        setTestimonialCounts({});
        setAssociatePerformance([]);
        return;
      }

      const memberIds = fetchedMembers.map((m) => m._id);
      const dateFilter = getDateRangeForPeriod(palmsPeriod);

      // 2. PARALLEL FETCH (all PALMS counts + performance report in parallel)
      const [
        attendanceRes,
        oneToOneRes,
        referralRes,
        thankYouRes,
        visitorRes,
        testimonialRes,
        associatePerformanceRes,
      ] = await Promise.all([
        chapterApiProvider.getMembersAttendanceCount(fetchedMembers, dateFilter),
        chapterApiProvider.getOneToOneCounts(memberIds, dateFilter),
        chapterApiProvider.getReferralCounts(memberIds, dateFilter),
        chapterApiProvider.getThankYouSlipAmounts(memberIds, dateFilter),
        chapterApiProvider.getVisitorCounts(memberIds, dateFilter),
        chapterApiProvider.getTestimonialCounts(memberIds, dateFilter),

        // Associate performance report paginated
        chapterApiProvider.getAssociatePerformanceReport(memberIds, params),
      ]);

      // 3. SET PALMS STATES
      if (attendanceRes?.success) setAttendanceCounts(attendanceRes.data);
      if (oneToOneRes?.success) setOneToOneCounts(oneToOneRes.data);
      if (referralRes?.success) setReferralCounts(referralRes.data);
      if (thankYouRes?.success) setThankYouAmounts(thankYouRes.data);
      if (visitorRes?.success) setVisitorCounts(visitorRes.data);
      if (testimonialRes?.success) setTestimonialCounts(testimonialRes.data);

      // 4. ASSOCIATE PERFORMANCE PAGINATION
      if (associatePerformanceRes?.success) {
        const { data } = associatePerformanceRes;
        setAssociatePerformance(data || []);
      }
    } catch (error) {
      console.error("Error fetching members and reports:", error);
    } finally {
      setLoadingReports(false);
    }
  };



  const handleSubmit = async () => {
    if (!referralMember?.value) {
      toast.error("Referral member is required");
      return;
    }

    if (!businessMember?.value) {
      toast.error("Business member is required");
      return;
    }

    if (!visitorMember?.value) {
      toast.error("Visitor member is required");
      return;
    }

    const payload = {
      referrals: referralMember.value,
      business: businessMember.value,
      visitors: visitorMember.value,
    };

    try {
      const res = await memberApiProvider.createTopAchiver(id, payload);

      if (res.status) {
        toast.success(res.message || "Top achievers submitted successfully!");
      } else {
        toast.error(res.message || "Backend error");
      }
    } catch (err) {
      toast.error(err?.message || "Unexpected error occurred");
    }
  };

  useEffect(() => {
    if (id && allMembers.length > 0) {
      fetchSavedAchievers(id, allMembers);
    }
  }, [id, allMembers]);

  const fetchSavedAchievers = async (chapterId, members) => {
    const res = await memberApiProvider.getTopAchiver(chapterId);

    console.log("res123", res)

    if (res.status && res.data) {

      // referrals
      const refMem = members.find(m => m.id === res.data.referrals);
      if (refMem) setReferralMember({ value: refMem.id, label: refMem.name });

      // business
      const bizMem = members.find(m => m.id === res.data.business);
      if (bizMem) setBusinessMember({ value: bizMem.id, label: bizMem.name });

      // visitors
      const visMem = members.find(m => m.id === res.data.visitors);
      if (visMem) setVisitorMember({ value: visMem.id, label: visMem.name });
    }
  };

  console.log("fetchSavedAchievers", fetchSavedAchievers)

  const fetchMonthlyRevenueforChapter = async (id) => {
    if (!id) {
      console.error("No chapter ID provided for fetching revenue data");
      return;
    }

    try {
      const response = await chapterApiProvider.monthlyRevenueBasedonChapter(
        id
      );
      if (response?.status && response?.response?.data) {
        const monthlyRevenueData = response.response.data;
        setMonthlyRevenueData(monthlyRevenueData);

        const monthlyAmounts = monthlyRevenueData.data.map(
          (item) => item.amount
        );
        const monthlyLabels = monthlyRevenueData.data.map((item) => item.month);

        setGradientLineChartSeries([
          {
            name: "Thank You Slip Amount",
            data: monthlyAmounts,
          },
        ]);

        setGradientLineChartOptions((prevOptions) => ({
          ...prevOptions,
          xaxis: {
            ...prevOptions.xaxis,
            categories: monthlyLabels,
          },
        }));
      } else {
        console.error(
          response?.response?.message || "Failed to fetch chapter revenue data"
        );
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const fetchChapterData = async (id) => {
    setLoadingChapterData(true);
    const responce = await chapterApiProvider.getChaptersById(id);
    if (responce && responce.status) {
      const chapters = responce?.response?.data;
      console.log(chapters, "chapters");
      if (chapters) {
        const user = getCurrentUser()?.data;
        const rawRole = user?.role;
        const roleName = (typeof rawRole === 'object' ? rawRole?.name : rawRole) || '';
        const roleNameLower = roleName.toLowerCase();
        const isSuperAdmin = roleNameLower === 'admin' || roleNameLower === 'super admin' || roleNameLower === 'super-admin';
        const isED = roleNameLower === 'ed' || roleNameLower === 'executive director';
        const isZoneAdmin = roleNameLower === 'zone-admin';
        const isZoneLevel = isZoneAdmin || isED;
        const isChapterUser = !isSuperAdmin && !isZoneLevel;

        const rawZoneId = user?.zoneId;
        const userZoneId = typeof rawZoneId === 'object' ? rawZoneId?._id || rawZoneId?.id : rawZoneId;
        const userChapterIds = user?.chapterIds || user?.chapterId || [];

        const rawChapterZoneId = chapters?.zoneId;
        const chapterZoneId = typeof rawChapterZoneId === 'object' ? rawChapterZoneId?._id || rawChapterZoneId?.id : rawChapterZoneId;

        if (isZoneLevel) {
          if (String(chapterZoneId) !== String(userZoneId)) {
            navigate('/access-denied');
            return;
          }
        } else if (isChapterUser) {
          const allowedChapterIds = Array.isArray(userChapterIds)
            ? userChapterIds.map(c => typeof c === 'object' ? c?._id || c?.id : c)
            : [];
          const hasAccess = allowedChapterIds.some(cid => String(cid) === String(id));
          if (!hasAccess) {
            navigate('/access-denied');
            return;
          }
        }

        setChapterData(chapters);
        setLoadingChapterData(false);
      }
    } else {
      setLoadingChapterData(false);
      navigate('/access-denied');
    }
  };

  function getPeriodMonthKey(date = new Date()) {

    let year = date.getFullYear();
    let month = date.getMonth() + 1; // 1–12


    return `${year}-${String(month).padStart(2, "0")}`;
  }


  const fetchCountData = async (id) => {
    if (id) {
      const response = await chapterApiProvider.getChapterCountById(id);
      console.log(response, "response-chapterApiProvider-getChapterCountById");
      if (response && response.status) {
        const chapterCount = response?.response?.data;
        console.log(chapterCount, "chapterCount");
        transformData(chapterCount);
      } else {
        console.error(
          response?.response?.message || "Failed to fetch chapter count data"
        );
      }
    } else {
      console.error("No chapter ID provided for fetching count data");
    }
  };
  const transformData = (apiData) => {
    const transformedCards = [
      {
        count: apiData.MembersCount || 0,
        label: "Associates",
        icon: "ri-user-shared-fill",
        bg: "bggg-white",
        iconBg: "bg-primary",
      },
      {
        count: apiData.referalCount || 0,
        label: "Referrals",
        icon: "ri-share-forward-fill",
        bg: "bggg-white",
        iconBg: "bg-success",
      },
      {
        count: apiData.visitors || 0,
        label: "Visitor/Guest",
        icon: "ri-user-follow-fill",
        bg: "bggg-white",
        iconBg: "bg-info",
      },
      {
        count: apiData.eventCount || 0,
        label: "Events",
        icon: "ri-calendar-check-fill",
        bg: "bggg-white",
        iconBg: "bg-warning",
      },
      {
        count: apiData.oneTooneCount || 0,
        label: "One to One",
        icon: "ri-user-heart-fill",
        bg: "bggg-white",
        iconBg: "bg-secondary",
      },
      {
        count: apiData.testimonialCount || 0,
        label: "Testimonials",
        icon: "ri-chat-quote-fill",
        bg: "bggg-white",
        iconBg: "bg-danger",
      },
    ];

    setCardCount(transformedCards);
  };

  // const fetchHeadTableMembers = async (id) => {
  //   const response = await chapterApiProvider.getHeadTableMembersByChapterId(
  //     id
  //   );
  //   console.log(
  //     response,
  //     "response-chapterApiProvider-getHeadTableMembersByChapterId"
  //   );
  //   if (response && response.status) {
  //     const headTableMembersData = response?.response?.data || [];
  //     setHeadTableMembersData(headTableMembersData);
  //   } else {
  //     console.error(
  //       response?.response?.message || "Failed to fetch head table members data"
  //     );
  //   }
  // };

  const fetchHeadTableMembers = async (id) => {
    const response = await chapterApiProvider.getHeadTableMembersByChapterId(id);

    if (response && response.status) {
      const data = response?.response?.data || [];
      setHeadTableMembersData(data);

      // 🟩 Auto-select the roles
      const president = data.find((x) => x.roleName === "President");
      const secretary = data.find((x) => x.roleName === "Secretary");
      const vicePresident = data.find((x) => x.roleName === "Vice President");
      const associateCommittee = data.filter((x) =>
        ["Associate Committee", "associate committee"].includes(x.roleName)
      );
      const coordinator = data.filter((x) =>
        ["Coordinator", "coordinator"].includes(x.roleName)
      );
      const visitorInteraction = data.filter((x) =>
        ["Visitor Interaction Team", "visitor interaction team", "Visitor Interaction", "visitor interaction"].includes(x.roleName)
      );

      setPresidentMember(
        president
          ? { label: president.name, value: president.id }
          : null
      );

      setSecretaryMember(
        secretary
          ? { label: secretary.name, value: secretary.id }
          : null
      );

      setVicePresidentMember(
        vicePresident
          ? { label: vicePresident.name, value: vicePresident.id }
          : null
      );

      setAssociateCommitteeMembers(
        associateCommittee.map((x) => ({ label: x.name, value: x.id }))
      );

      setCoordinatorMembers(
        coordinator.map((x) => ({ label: x.name, value: x.id }))
      );

      setVisitorInteractionMembers(
        visitorInteraction.map((x) => ({ label: x.name, value: x.id }))
      );

    } else {
      console.error(
        response?.response?.message ||
        "Failed to fetch head table associates data"
      );
    }
  };

  const fetchHeadTableUsers = async (id) => {
    const response = await chapterApiProvider.getHeadTableUsersByChapterId(id);
    console.log(
      response,
      "response-chapterApiProvider-getHeadTableUsersByChapterId"
    );
    if (response && response.status) {
      const headTableUsersData = response?.response?.data || [];
      setHeadTableUsersData(headTableUsersData);
    } else {
      console.error(
        response?.response?.message || "Failed to fetch head table users data"
      );
    }
  };

  const fetchTopAchievers = async (id) => {
    // Fetch top achievers data for the chapter
    const response = await chapterApiProvider.getTopAchieversById(id);
    console.log(
      response,
      "response-chapterApiProvider-getTopAchieversByChapterId"
    );
    if (response && response.status) {
      const topAchieversData = response?.response?.data || [];
      console.log(topAchieversData, "topAchieversData");
      setTopAchieversData(topAchieversData);
      // Process top achievers data if needed
      // For now, we are not transforming it, just logging
    } else {
      console.error(
        response?.response?.message || "Failed to fetch top achievers data"
      );
    }
  };

  // Helper function to format meeting day
  const formatMeetingDay = (dateString) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  // Helper function to format meeting time
  const formatMeetingTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  // Helper to resolve Top Achiever profile image with fallback
  const getTopAchieverImageUrl = (member) => {
    const img = member?.image;
    if (img && typeof img === 'object' && img.docPath && img.docName) {
      return `${IMAGE_BASE_URL}/${img.docPath}/${img.docName}`;
    }
    if (typeof img === 'string' && img.trim() && !img.includes('default-user') && !img.includes('user.png')) {
      if (img.startsWith('http') || img.startsWith('/')) return img;
      return `${IMAGE_BASE_URL}/${img}`;
    }
    const found = allMembers?.find(
      (m) => String(m.id || m._id) === String(member?.id)
    );
    if (found?.profileImage?.docPath && found?.profileImage?.docName) {
      return `${IMAGE_BASE_URL}/${found.profileImage.docPath}/${found.profileImage.docName}`;
    }
    return '/assets/images/default-avatar.png';
  };

  // Map API data to card format
  const gripChapters = [
    {
      id: "testimonials",
      name: "Top Testimonials",
      memberCount: topAchieversData?.testimonialSlips?.totalCount,
      members: topAchieversData?.testimonialSlips?.topReceivers?.map(
        (receiver) => ({
          id: receiver.memberId,
          name: receiver.name,
          image: receiver.profileImage,
          score: receiver.count,
        })
      ),
    },
    {
      id: "meetings",
      name: "Top 1-1 Meetings",
      memberCount: topAchieversData?.oneToOneMeetings?.totalCount,
      members: topAchieversData.oneToOneMeetings?.topReceivers?.map(
        (member) => ({
          id: member.memberId,
          name: member.name,
          image: member.profileImage,
          score: member.count,
        })
      ),
    },
    {
      id: "referrals",
      name: "Top Referrals",
      memberCount: topAchieversData?.referralSlips?.totalCount,
      members: topAchieversData?.referralSlips?.topReceivers?.map(
        (receiver) => ({
          id: receiver.memberId,
          name: receiver.name,
          image: receiver.profileImage,
          score: receiver.count,
        })
      ),
    },
    {
      id: "thankYou",
      name: "Top Thank You Notes",
      memberCount: topAchieversData?.thankYouSlips?.totalAmount,
      members: topAchieversData?.thankYouSlips?.topReceivers?.map(
        (receiver) => ({
          id: receiver.memberId,
          name: receiver.name,
          image: receiver.profileImage,
          score: receiver.count || receiver.amount,
        })
      ),
    },
  ].filter((chapter) => chapter?.members?.length > 0); // Only show categories with data

  const renderProfileCard = (memberSelection, roleTitle) => {
    const themeColor = "#c02221";

    if (!memberSelection) {
      return (
        <div 
          className="card h-100 d-flex flex-column align-items-center justify-content-center p-24 cursor-pointer text-center role-assign-card"
          style={{ 
            backgroundColor: "#ffffff", 
            border: "1.5px dashed #cbd5e1", 
            borderRadius: "16px", 
            minHeight: "148px", 
            transition: "all 0.25s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
          data-bs-toggle="modal" 
          data-bs-target="#memberSelectionModal"
          onClick={() => setRoleModalTarget(roleTitle)}
        >
          <div 
            className="w-44-px h-44-px rounded-circle d-flex align-items-center justify-content-center mb-2 role-icon-circle transition-all"
            style={{ backgroundColor: "rgba(192, 34, 33, 0.08)", color: themeColor }}
          >
            <Icon icon="solar:user-plus-bold" style={{ fontSize: "22px" }} />
          </div>
          <span className="fw-bold mb-1" style={{ fontSize: "14px", color: "#0f172a" }}>+ Assign {roleTitle}</span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Click to select member</span>
        </div>
      );
    }

    const memberObj = members.find((m) => m.id === memberSelection.value);

    return (
      <div 
        className="card h-100 border-0 p-20 position-relative role-filled-card" 
        style={{ 
          backgroundColor: "#ffffff", 
          borderRadius: "16px", 
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)", 
          border: "1px solid #e2e8f0",
          minHeight: "148px",
          overflow: "hidden",
          transition: "all 0.25s ease"
        }}
      >
        <button 
          className="btn btn-sm position-absolute top-0 end-0 m-3 d-flex align-items-center gap-1 px-10 py-4 rounded-pill role-edit-btn"
          data-bs-toggle="modal" 
          data-bs-target="#memberSelectionModal"
          onClick={() => setRoleModalTarget(roleTitle)}
          style={{ 
            zIndex: 10, 
            backgroundColor: "#f8fafc", 
            color: "#475569", 
            fontSize: "12px", 
            fontWeight: "600",
            border: "1px solid #e2e8f0",
            transition: "all 0.2s ease"
          }}
        >
          <Icon icon="solar:pen-bold" style={{ fontSize: "12px" }} />
          Edit
        </button>

        <div className="d-flex align-items-center gap-3 w-100" style={{ minWidth: 0, overflow: "hidden" }}>
          <div className="position-relative flex-shrink-0" style={{ width: "52px", height: "52px" }}>
            <div 
              className="d-flex align-items-center justify-content-center rounded-circle shadow-sm fw-bold text-white fs-5 w-100 h-100"
              style={{ background: "linear-gradient(135deg, #c02221 0%, #454442 100%)" }}
            >
              {memberSelection.label ? memberSelection.label.charAt(0).toUpperCase() : "?"}
            </div>
            {memberObj?.profileImage?.docPath && (
              <img 
                src={`${IMAGE_BASE_URL}/${memberObj.profileImage.docPath}/${memberObj.profileImage.docName}`} 
                alt="" 
                className="rounded-circle object-fit-cover shadow-sm position-absolute top-0 start-0 w-100 h-100"
                style={{ border: "2px solid #fff" }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>

          <div className="flex-grow-1" style={{ minWidth: 0, paddingRight: "64px", overflow: "hidden" }}>
            <span 
              className="badge rounded-pill mb-2 px-10 py-4 fw-semibold"
              style={{ 
                backgroundColor: "rgba(192, 34, 33, 0.08)", 
                color: themeColor,
                border: "1px solid rgba(192, 34, 33, 0.15)",
                fontSize: "11px",
                display: "inline-block",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {roleTitle}
            </span>
            <h6 
              className="mb-1 fw-bold text-truncate" 
              title={memberSelection.label}
              style={{ 
                color: "#0f172a", 
                fontSize: "15px", 
                fontWeight: 700, 
                lineHeight: "1.3",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
                maxWidth: "100%"
              }}
            >
              {memberSelection.label}
            </h6>
            <div 
              className="d-flex align-items-center gap-1"
              title={memberObj?.companyName || "N/A"}
              style={{ fontSize: "12px", color: "#64748b", minWidth: 0, overflow: "hidden" }}
            >
              <Icon icon="solar:buildings-2-linear" style={{ fontSize: "13px", flexShrink: 0 }} />
              <span style={{ 
                whiteSpace: "nowrap", 
                overflow: "hidden", 
                textOverflow: "ellipsis", 
                display: "inline-block", 
                maxWidth: "100%" 
              }}>
                {memberObj?.companyName || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMemberCards = (selectedMembers, setMembersFunction, roleTitle) => {
    const themeColor = "#c02221";

    const getRoleBadgeStyle = (title) => {
      switch (title) {
        case "Associate Committee":
          return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
        case "Coordinator":
          return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
        case "Visitor Interaction Team":
          return { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" };
        default:
          return { bg: "rgba(192, 34, 33, 0.08)", color: themeColor, border: "rgba(192, 34, 33, 0.15)" };
      }
    };

    const badgeStyle = getRoleBadgeStyle(roleTitle);

    return (
      <div className="row g-3">
        {selectedMembers.map((m) => {
          const memberObj = members.find((obj) => obj.id === m.value);
          return (
            <div className="col-xxl-3 col-xl-4 col-md-6 col-12" key={m.value}>
              <div 
                className="card border-0 p-3 position-relative shadow-sm h-100 team-member-card"
                style={{ 
                  backgroundColor: "#ffffff", 
                  borderRadius: "14px", 
                  border: "1px solid #eef2f6",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  minHeight: "84px",
                  overflow: "hidden",
                  transition: "all 0.2s ease"
                }}
              >
                <button 
                  type="button"
                  className="btn btn-sm p-0 d-flex align-items-center justify-content-center rounded-circle position-absolute top-0 end-0 m-2 team-remove-btn" 
                  style={{ 
                    width: "24px", 
                    height: "24px", 
                    backgroundColor: "#f8fafc", 
                    color: "#94a3b8", 
                    border: "1px solid #e2e8f0",
                    transition: "all 0.2s ease" 
                  }}
                  onClick={() => setMembersFunction(prev => prev.filter(item => item.value !== m.value))}
                  title="Remove member"
                >
                  <Icon icon="solar:close-circle-bold" style={{ fontSize: "16px" }} />
                </button>

                <div className="d-flex align-items-center gap-3 w-100" style={{ minWidth: 0, overflow: "hidden" }}>
                  <div className="position-relative flex-shrink-0" style={{ width: "44px", height: "44px" }}>
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-circle shadow-sm fw-bold text-white fs-6 w-100 h-100"
                      style={{ background: "linear-gradient(135deg, #c02221 0%, #454442 100%)" }}
                    >
                      {m.label ? m.label.charAt(0).toUpperCase() : "?"}
                    </div>
                    {memberObj?.profileImage?.docPath && (
                      <img 
                        src={`${IMAGE_BASE_URL}/${memberObj.profileImage.docPath}/${memberObj.profileImage.docName}`} 
                        alt="" 
                        className="rounded-circle object-fit-cover shadow-sm position-absolute top-0 start-0 w-100 h-100"
                        style={{ border: "2px solid #fff" }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex-grow-1" style={{ minWidth: 0, paddingRight: "28px", overflow: "hidden" }}>
                    <h6 
                      className="mb-1 fw-bold text-truncate" 
                      title={m.label}
                      style={{ 
                        color: "#0f172a", 
                        fontSize: "14px", 
                        fontWeight: 700, 
                        lineHeight: "1.3",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                        maxWidth: "100%"
                      }}
                    >
                      {m.label}
                    </h6>
                    <span 
                      className="badge rounded-pill fw-semibold mb-1" 
                      style={{ 
                        backgroundColor: badgeStyle.bg, 
                        color: badgeStyle.color, 
                        border: `1px solid ${badgeStyle.border}`,
                        fontSize: "11px",
                        padding: "2px 8px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "inline-block",
                        maxWidth: "100%"
                      }}
                    >
                      {roleTitle}
                    </span>
                    {memberObj?.contactDetails?.email && (
                      <div 
                        className="d-flex align-items-center gap-1" 
                        title={memberObj.contactDetails.email}
                        style={{ fontSize: "12px", color: "#64748b", minWidth: 0, overflow: "hidden" }}
                      >
                        <Icon icon="solar:letter-linear" style={{ fontSize: "12px", flexShrink: 0 }} />
                        <span style={{ 
                          whiteSpace: "nowrap", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          display: "inline-block",
                          maxWidth: "100%" 
                        }}>
                          {memberObj.contactDetails.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="col-xxl-3 col-xl-4 col-md-6 col-12">
          <div 
            className="card h-100 d-flex align-items-center justify-content-center p-3 cursor-pointer team-add-card"
            style={{ 
              backgroundColor: "#ffffff", 
              border: "1.5px dashed #cbd5e1", 
              borderRadius: "14px", 
              minHeight: "84px", 
              transition: "all 0.25s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
            }}
            data-bs-toggle="modal" 
            data-bs-target="#memberSelectionModal"
            onClick={() => setRoleModalTarget(roleTitle)}
          >
            <div className="d-flex align-items-center gap-2">
              <div 
                className="w-32-px h-32-px rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: "rgba(192, 34, 33, 0.08)", color: themeColor }}
              >
                <Icon icon="solar:user-plus-bold" style={{ fontSize: "16px" }} />
              </div>
              <span className="fw-bold text-sm" style={{ color: "#0f172a" }}>
                + Add{" "}
                {roleTitle === "Associate Committee"
                  ? "Committee Member"
                  : roleTitle === "Visitor Interaction Team"
                    ? "Team Member"
                    : "Coordinator"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="card p-40 h-100 p-4 mb-5 radius-12"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        <div className="row g-4 align-items-start">
          {/* Left Section - Meeting Details */}
          <div className="col-md-3">
            <h5 className="fw-bold">
              GRIP{" "}
              <span style={{ fontWeight: 300 }}>{chapterData.chapterName}</span>
            </h5>
            <p className="text-muted mb-2">Meeting is only on invite</p>

            <div className="mt-2 mb-3 text-sm">
              {chapterData.weekday}
            </div>
            <div
              className="text-sm mb-3"
              style={{
                background: "#ccc",
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              {chapterData.meetingType}
            </div>
          </div>

          <div className="col-md-3">
            <div className="mt-0 mb-0 fw-bold">
              <h6 className="fw-bold">Meeting Details</h6>
            </div>

            <div className="text-sm mb-0">{chapterData?.meetingVenue}</div>
            <div className="text-sm text-muted">
              {chapterData?.zoneId?.zoneName}
              <br />
              {chapterData?.stateName}
            </div>
            {/* <div className="text-sm mt-1">CID: {chapterData?.cidId?.name}</div>
            <div className="text-sm mt-1">Phone: {chapterData?.cidId?.mobileNumber || 'Not available'}</div>
            <a href="#" className="text-grip text-sm mt-2 d-inline-block">
              View Map
            </a> */}
          </div>

          {/* Center Section - Member Count */}
          <div className="col-md-3 text-center">
            <h6 className="fw-bold">Associate Count</h6>
            {loadingChapterData ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "72px" }}>
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <h1 className="text-grip display-4">{chapterData?.memberCount ?? "—"}</h1>
            )}
            <Link
              to={`/member-list/${chapterData?._id}`}
              className="text-grip text-sm"
            >
              Show Associates
            </Link>
          </div>

          {/* Right Section - Buttons */}
          <div className="col-md-3 d-flex flex-column align-items-end gap-3">
            {hasPermission("panel-associate-create") && (
              <button
                type="button"
                className="btn btn-primary grip text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
              >
                <Link
                  to="/add-member"
                  className=" text-white  d-flex align-items-center gap-1"
                >
                  Add Associate
                  <Icon
                    icon="ic:baseline-plus"
                    className="icon text-xl line-height-1"
                  />
                </Link>
              </button>
            )}

            {/* <select
              className="form-select form-select-sm w-auto bg-base px-32 border text-white text-secondary-light rounded-pill"

            >
              <option value="" >
                This Week
              </option>
              <option value="Last Week">Last Week</option>
              <option value="Last Month">Last Month</option>
              <option value="This Month">This Month</option>
              <option value="This Term">This Term</option>
            </select> */}
          </div>
        </div>
      </div>

      <div className="row gy-4 mb-5">
        {cardsCount &&
          cardsCount.map((card, index) => (
            <div key={index} className="col-lg-2 col-sm-6">
              <div className={`card p-3 radius-8 h-100 ${card.bg}`}>
                <div className="card-body p-0">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`w-48-px h-48-px d-flex justify-content-center align-items-center rounded-circle bg-grip ${card.iconBg}`}
                    >
                      <i className={`${card.icon} h5 mb-0`} />
                    </span>
                    <div>
                      <h6 className="fw-bold mb-1">
                        {card.count.toLocaleString()}
                      </h6>
                      <span className="text-secondary text-sm">
                        {card.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="card h-100 p-0 mb-5 radius-12">
        <div className="card-header border-bottom bg-base py-16 px-24">
          <h6 className="text-lg fw-semibold mb-0">Chapter Leadership</h6>
        </div>

        <div className="card-body p-24">
          {headTableUsersData?.length === 0 ? (
            <div className="text-center py-4">No leadership data available</div>
          ) : (
            <div className="row g-4 justify-content-evenly">
              {headTableUsersData
                .filter((user) => {
                  const name = (user?.name || "").toLowerCase();
                  const isPreethi = name.includes("preethi");
                  const isGajendran = name.includes("gajendran");
                  return !isPreethi && !isGajendran;
                })
                .map((user, index) => (
                <div
                  key={index}
                  className="col-12 col-sm-6 col-md-4 col-lg-3 user-grid-card"
                >
                  <div className="position-relative border radius-16 bg-overlay overflow-hidden p-3">
                    <div className="text-center">
                      <img
                        src={
                          user?.profileImage?.docPath
                            ? `${IMAGE_BASE_URL}/${user.profileImage.docPath}/${user.profileImage.docName}`
                            : "/assets/images/avatar/avatar1.png"
                        }
                        alt={user.name}
                        className="border br-white border-width-2-px w-100-px mt-20 h-100-px rounded-circle object-fit-cover"
                        onError={(e) => {
                          e.target.src = "/assets/images/avatar/avatar1.png";
                        }}
                      />
                      <h6 className="text-lg mb-1 mt-3 text-white">
                        {user.name}
                      </h6>
                      <span className="text-secondary-light text-white mb-16">
                        {user.roleName}
                      </span>

                      <div className="d-flex justify-content-center gap-3 mt-16">
                        <a
                          href={`tel:${user.mobileNumber}`}
                          className="btn btn-light p-10 radius-8 d-flex align-items-center justify-content-center"
                          title="Call"
                        >
                          <Icon
                            icon="mdi:phone-outline"
                            className="text-xl text-primary-600"
                          />
                        </a>
                        <a
                          href={`mailto:${user.email}`}
                          className="btn btn-light p-10 radius-8 d-flex align-items-center justify-content-center"
                          title="Mail"
                        >
                          <Icon
                            icon="mdi:email-outline"
                            className="text-xl text-primary-600"
                          />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-body p-24">
          <div className="row g-4 justify-content-evenly">
            {headTableMembersData
              .filter((member) => {
                const name = (member?.name || "").toLowerCase();
                const isPreethi = name.includes("preethi");
                const isGajendran = name.includes("gajendran");
                return !isPreethi && !isGajendran;
              })
              .map((member, index) => (
              <div
                key={index}
                className="col-12 col-sm-6 col-md-4 col-lg-3 user-grid-card"
              >
                <div className="position-relative border radius-16 bg-overlay overflow-hidden p-3">
                  <div className="text-center">
                    <img
                      src={
                        member?.profileImage?.docPath
                          ? `${IMAGE_BASE_URL}/${member.profileImage.docPath}/${member.profileImage.docName}`
                          : "/assets/images/avatar/avatar1.png"
                      }
                      alt={member.name}
                      className="border br-white border-width-2-px w-100-px mt-20 h-100-px rounded-circle object-fit-cover"
                      onError={(e) => {
                        e.target.src = "/assets/images/avatar/avatar1.png";
                      }}
                    />
                    <h6 className="text-lg mb-1 mt-3 text-white">
                      {member.name}
                    </h6>
                    <span className="text-secondary-light text-white mb-16">
                      {member.roleName}
                    </span>

                    <div className="d-flex justify-content-center gap-3 mt-16">
                      <a
                        href={`tel:${member.mobileNumber}`}
                        className="btn btn-light p-10 radius-8 d-flex align-items-center justify-content-center"
                        title="Call"
                      >
                        <Icon
                          icon="mdi:phone-outline"
                          className="text-xl text-primary-600"
                        />
                      </a>
                      <a
                        href={`mailto:${member.email}`}
                        className="btn btn-light p-10 radius-8 d-flex align-items-center justify-content-center"
                        title="Mail"
                      >
                        <Icon
                          icon="mdi:email-outline"
                          className="text-xl text-primary-600"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card h-100 p-0 mb-5 radius-12">
        <div className="card-body p-24">
          <div className="row g-0">
            {/* Revenue Summary Card */}
            <div className="col-md-4">
              <div className="card h-100 rounded-0 border-0">
                <div className="card-header border-bottom bg-base py-16 px-24">
                  <h6 className="text-lg fw-semibold mb-0">
                    Business Achieved
                  </h6>
                </div>
                <div className="card-body p-24 d-flex flex-column justify-content-center align-items-center">
                  {monthlyRevenueData ? (
                    <>
                      <h2 className="text-success display-6 fw-bold mb-0">
                        ₹
                        {formatCurrencyValue(
                          monthlyRevenueData?.totalAmount || 0
                        )}
                      </h2>
                      <p className="text-muted mt-2">Total Revenue</p>
                      <p className="text-sm text-muted mt-1">
                        Last updated: {new Date().toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="spinner-border spinner-border-sm text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>Loading revenue data...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="col-md-8">
              <div className="card h-100 rounded-0 border-0">
                <div
                  className="card-body p-24 position-relative"
                  style={{ minHeight: "300px" }}
                >
                  {gradientLineChartSeries.length > 0 ? (
                    <ReactApexChart
                      id="gradientLineChart"
                      options={gradientLineChartOptions}
                      series={gradientLineChartSeries}
                      type="line"
                      height={264}
                    />
                  ) : (
                    <div className="d-flex flex-column justify-content-center align-items-center h-100">
                      {monthlyRevenueData?.data?.length === 0 ? (
                        <div className="text-center">
                          <Icon
                            icon="mdi:chart-line"
                            className="text-muted"
                            width={48}
                            height={48}
                          />
                          <p className="mt-2">No revenue data available</p>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="spinner-border spinner-border-sm text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span>Loading chart data...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-group label {
          transition: color 0.2s;
        }
        .form-group:focus-within label {
          color: rgb(192, 34, 33) !important;
        }
        .role-filled-card h6,
        .team-member-card h6 {
          font-size: 15px !important;
          color: #0f172a !important;
          line-height: 1.3 !important;
        }
        .role-filled-card,
        .team-member-card {
          overflow: hidden !important;
        }
        .role-assign-card:hover {
          border-color: #c02221 !important;
          background-color: #fff9f9 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(192, 34, 33, 0.08) !important;
        }
        .role-assign-card:hover .role-icon-circle {
          transform: scale(1.08);
          background-color: rgba(192, 34, 33, 0.15) !important;
        }
        .role-filled-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06) !important;
          border-color: rgba(192, 34, 33, 0.3) !important;
        }
        .role-edit-btn:hover {
          background-color: rgba(192, 34, 33, 0.08) !important;
          color: #c02221 !important;
          border-color: rgba(192, 34, 33, 0.25) !important;
        }
        .team-member-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06) !important;
          border-color: #cbd5e1 !important;
        }
        .team-remove-btn:hover {
          background-color: #fee2e2 !important;
          color: #dc2626 !important;
          border-color: #fca5a5 !important;
        }
        .team-add-card:hover {
          border-color: #c02221 !important;
          background-color: #fff9f9 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(192, 34, 33, 0.08) !important;
        }
      `}</style>

      {/* Top Achievers of the Month Form - Redesigned */}
      <div className="card h-100 p-0 mb-5 border-0 shadow-sm overflow-hidden" style={{ borderRadius: "16px", backgroundColor: "#F8F9FB", border: "1px solid #e2e8f0" }}>
        {/* Modern Header */}
        <div className="card-header border-bottom bg-white py-20 px-32 d-flex align-items-center justify-content-between" style={{ borderBottom: "1px solid #e2e8f0", padding: "20px 32px" }}>
          <div className="d-flex align-items-center gap-3">
            <div>
              <h6 className="fw-bold mb-1" style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Top Achievers of the Month</h6>
              <span className="text-sm fw-medium" style={{ color: "#64748b" }}>Manage top members with maximum contributions.</span>
            </div>
          </div>
        </div>

        <div className="card-body p-32" style={{ padding: "32px" }}>
          {/* Referrals, Business, Visitors Section */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <h6 className="fw-bold mb-3" style={{ fontSize: "14px", color: "#1e293b" }}>Maximum Referrals Contributed</h6>
              {renderProfileCard(referralMember, "Maximum Referrals")}
            </div>
            <div className="col-md-4">
              <h6 className="fw-bold mb-3" style={{ fontSize: "14px", color: "#1e293b" }}>Maximum Business Contributed</h6>
              {renderProfileCard(businessMember, "Maximum Business")}
            </div>
            <div className="col-md-4">
              <h6 className="fw-bold mb-3" style={{ fontSize: "14px", color: "#1e293b" }}>Maximum Visitors Invited</h6>
              {renderProfileCard(visitorMember, "Maximum Visitors")}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="card-footer bg-white border-top d-flex justify-content-end gap-3" style={{ padding: "20px 32px", borderTop: "1px solid #e2e8f0" }}>
          {hasPermission("topachievers-create") && (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center"
              style={{ backgroundColor: "rgb(192, 34, 33)", color: "#fff", borderColor: "rgb(192, 34, 33)", padding: "10px 32px", borderRadius: "8px", transition: "all 0.2s ease" }}
            >
              Submit Top Achievers
            </button>
          )}
        </div>
      </div>

      {/* Head Table Roles Form - Redesigned */}
      <div className="card h-100 p-0 mb-5 border-0 shadow-sm overflow-hidden" style={{ borderRadius: "16px", backgroundColor: "#F8F9FB", border: "1px solid #e2e8f0" }}>
        {/* Modern Header */}
        <div className="card-header border-bottom bg-white py-20 px-32 d-flex align-items-center justify-content-between flex-wrap gap-3" style={{ borderBottom: "1px solid #e2e8f0", padding: "20px 32px" }}>
          <div className="d-flex align-items-center gap-3">
            <div 
              className="w-48-px h-48-px rounded-12 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #c02221 0%, #454442 100%)", color: "#fff" }}
            >
              <Icon icon="solar:shield-user-bold" style={{ fontSize: "24px" }} />
            </div>
            <div>
              <h6 className="fw-bold mb-1" style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Head Table Leadership Roles</h6>
              <span className="text-sm fw-medium" style={{ color: "#64748b" }}>Manage top-level administrators and coordinators for this chapter.</span>
            </div>
          </div>
        </div>

        <div className="card-body p-32" style={{ padding: "32px" }}>
          {/* Executive Officers: President, Secretary, VP */}
          <div className="mb-32">
            <div className="d-flex align-items-center justify-content-between mb-16">
              <div className="d-flex align-items-center gap-2">
                <Icon icon="solar:crown-bold" style={{ fontSize: "18px", color: "#c02221" }} />
                <h6 className="fw-bold mb-0" style={{ fontSize: "16px", color: "#0f172a" }}>Executive Officers</h6>
              </div>
              <span className="badge rounded-pill bg-light text-secondary border px-10 py-4 text-xs fw-semibold">Primary Roles</span>
            </div>
            <div className="row g-4">
              <div className="col-lg-4 col-md-6 col-12">
                {renderProfileCard(presidentMember, "President")}
              </div>
              <div className="col-lg-4 col-md-6 col-12">
                {renderProfileCard(secretaryMember, "Secretary")}
              </div>
              <div className="col-lg-4 col-md-6 col-12">
                {renderProfileCard(vicePresidentMember, "Vice President")}
              </div>
            </div>
          </div>

          {/* Associate Committee Section */}
          <div className="p-24 rounded-16 bg-white mb-24 shadow-xs" style={{ border: "1px solid #eef2f6" }}>
            <div className="d-flex align-items-center justify-content-between mb-16 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div 
                  className="w-36-px h-36-px rounded-10 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ background: "#f0fdf4", color: "#16a34a" }}
                >
                  <Icon icon="solar:users-group-rounded-bold" style={{ fontSize: "18px" }} />
                </div>
                <div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: "15px", color: "#0f172a" }}>Associate Committee</h6>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Committee members supporting chapter operations and initiatives</span>
                </div>
              </div>
              <span className="badge rounded-pill px-10 py-4 text-xs fw-semibold" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                {associateCommitteeMembers?.length || 0} {(associateCommitteeMembers?.length === 1) ? 'Member' : 'Members'}
              </span>
            </div>
            {renderMemberCards(associateCommitteeMembers, setAssociateCommitteeMembers, "Associate Committee")}
          </div>

          {/* Coordinator Team Section */}
          <div className="p-24 rounded-16 bg-white mb-24 shadow-xs" style={{ border: "1px solid #eef2f6" }}>
            <div className="d-flex align-items-center justify-content-between mb-16 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div 
                  className="w-36-px h-36-px rounded-10 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ background: "#eff6ff", color: "#2563eb" }}
                >
                  <Icon icon="solar:user-hand-up-bold" style={{ fontSize: "18px" }} />
                </div>
                <div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: "15px", color: "#0f172a" }}>Coordinator Team</h6>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Coordinators facilitating attendance, events, and chapter growth</span>
                </div>
              </div>
              <span className="badge rounded-pill px-10 py-4 text-xs fw-semibold" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                {coordinatorMembers?.length || 0} {(coordinatorMembers?.length === 1) ? 'Member' : 'Members'}
              </span>
            </div>
            {renderMemberCards(coordinatorMembers, setCoordinatorMembers, "Coordinator")}
          </div>

          {/* Visitor Interaction Team Section */}
          <div className="p-24 rounded-16 bg-white shadow-xs" style={{ border: "1px solid #eef2f6" }}>
            <div className="d-flex align-items-center justify-content-between mb-16 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div 
                  className="w-36-px h-36-px rounded-10 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ background: "#faf5ff", color: "#7c3aed" }}
                >
                  <Icon icon="solar:user-speak-bold" style={{ fontSize: "18px" }} />
                </div>
                <div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: "15px", color: "#0f172a" }}>Visitor Interaction Team</h6>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Members dedicated to welcoming, hosting, and engaging visitors</span>
                </div>
              </div>
              <span className="badge rounded-pill px-10 py-4 text-xs fw-semibold" style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
                {visitorInteractionMembers?.length || 0} {(visitorInteractionMembers?.length === 1) ? 'Member' : 'Members'}
              </span>
            </div>
            {renderMemberCards(visitorInteractionMembers, setVisitorInteractionMembers, "Visitor Interaction Team")}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="card-footer bg-white border-top d-flex justify-content-end gap-3" style={{ padding: "20px 32px", borderTop: "1px solid #e2e8f0" }}>
          <button
            type="button"
            className="btn btn-light fw-bold px-24 py-10 radius-8"
            style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "10px 24px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRoleSubmit}
            className="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
            style={{ background: "linear-gradient(135deg, #c02221 0%, #991b1b 100%)", color: "#fff", borderColor: "#c02221", padding: "10px 32px", borderRadius: "8px", transition: "all 0.2s ease" }}
          >
            <Icon icon="solar:check-read-bold" style={{ fontSize: "18px" }} />
            Save Leadership Roles
          </button>
        </div>
      </div>
      {/* Top Achievers */}
      <div className="card h-100 p-0 radius-12 mb-5">
        <div className="card-header border-bottom bg-base py-16 px-24">
          <h6 className="text-lg fw-semibold mb-0">Top Achievers</h6>
        </div>
        <div className="card-body chapterwisebox p-24">
          {gripChapters?.length > 0 ? (
            <div className="row gy-4">
              {gripChapters?.map((chapter) => (
                <div className="col-xxl-3 col-lg-3 col-sm-12" key={chapter.id}>
                  <div className="card">
                    <div className="chapterwiseheading d-flex text-white align-items-center flex-wrap gap-2 justify-content-between">
                      <h6 className="mb-2 fw-bold text-sm mb-0">
                        {chapter.name}
                      </h6>
                      <span className="badge bg-danger">
                        {chapter.memberCount}
                      </span>
                    </div>

                    <div className="card-body p-20">
                      <div className="mt-0">
                        {chapter?.members?.map((member, index) => (
                          <div
                            className={`d-flex align-items-center justify-content-between gap-3 ${index < chapter.members?.length - 1 ? "mb-24" : ""
                              }`}
                            key={member.id || index}
                          >
                            <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
                              <img
                                src={getTopAchieverImageUrl(member)}
                                alt={member.name || "Member"}
                                className="rounded-circle flex-shrink-0 me-10 object-fit-cover shadow-sm"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  minWidth: "40px",
                                  minHeight: "40px",
                                  border: "1px solid #e2e8f0",
                                  backgroundColor: "#f1f5f9"
                                }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/assets/images/default-avatar.png';
                                }}
                              />
                              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                <h6 className="text-md mb-0 text-truncate" title={member.name} style={{ color: "#1e293b", fontWeight: 600 }}>
                                  {member.name}
                                </h6>
                              </div>
                            </div>
                            <span className="text-primary-light text-md fw-bold flex-shrink-0">
                              {member.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p>No top achievers data available</p>
            </div>
          )}
        </div>
      </div>

      {/* PALMS REPORT */}
      <div className="card h-100 p-0 radius-12">
        <div className="card-header border-bottom bg-base py-16 px-24 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <h6 className="text-lg fw-semibold mb-0">PALMS Report</h6>
            {(loadingReports || loadingPalms) && (
              <div className="d-flex align-items-center gap-2 text-danger text-sm fw-medium">
                <div className="spinner-border spinner-border-sm text-danger" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span>Updating...</span>
              </div>
            )}
          </div>

          {/* Period Filter Buttons */}
          <div className="d-flex align-items-center gap-1 bg-light p-1 radius-8 border">
            {PALMS_PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setPalmsPeriod(opt.key);
                  fetchPalmsCounts(membersData, opt.key);
                }}
                disabled={loadingReports || loadingPalms}
                className={`btn btn-sm py-1 px-3 radius-6 text-xs fw-semibold transition-2 ${
                  palmsPeriod === opt.key
                    ? "btn-danger shadow-sm text-white"
                    : "btn-outline-transparent text-secondary hover-bg-base"
                }`}
                style={{
                  backgroundColor: palmsPeriod === opt.key ? "rgb(192, 34, 33)" : "transparent",
                  borderColor: palmsPeriod === opt.key ? "rgb(192, 34, 33)" : "transparent",
                  fontSize: "12px",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body chapterwisebox p-24">
          {loadingReports ? (
            <div className="d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: "260px" }}>
              <div 
                className="spinner-border text-danger mb-3" 
                role="status" 
                style={{ width: "2.75rem", height: "2.75rem", borderWidth: "3px" }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <h6 className="fw-semibold text-secondary mb-1" style={{ fontSize: "15px" }}>Loading PALMS Report</h6>
              <p className="text-muted text-xs mb-0">Fetching member attendance, referrals, and activity metrics...</p>
            </div>
          ) : membersData?.length > 0 ? (
            <>
              {/* TABLE */}
              <div className="table-responsive" style={{ overflowX: "auto" }}>
                <table className="table table-bordered align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th>S.NO</th>
                      <th>Associate Name</th>
                      <th>Meetings</th>
                      <th>P</th>
                      <th>A</th>
                      <th>L</th>
                      <th>M</th>
                      <th>S</th>
                      <th>Training</th>    {/* NEW */}
                      <th>One-to-One</th>
                      <th>Referral Given</th>
                      <th>Referral Received</th>
                      <th>ThankYou Given</th>
                      <th>ThankYou Received</th>
                      <th>Visitors</th>
                      <th>Testimonial Given</th>
                      <th>Testimonial Received</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedMembers.map((member, index) => {
                      const defaultCounts = {
                        present: 0,
                        absent: 0,
                        late: 0,
                        managed: 0,
                        substitute: 0,
                      };


                      // FIX: read correctly from backend structure
                      const meetings = attendanceCounts?.[member._id]?.meeting || defaultCounts;
                      const training = attendanceCounts?.[member._id]?.training || 0;

                      const totalTraining =
                        training.present +
                        training.absent +
                        training.late +
                        training.managed +
                        training.substitute;


                      return (
                        <tr key={member._id}>
                          <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>

                          <td>
                            <h6 className="text-md mb-0">{member.name}</h6>
                            <small className="text-xs text-muted">{member.category}</small>
                          </td>

                          {/* Meetings */}
                          <td>{meetings.totalMeetings}</td>
                          <td>{meetings.present}</td>
                          <td>{meetings.absent}</td>
                          <td>{meetings.late}</td>
                          <td>{meetings.managed}</td>
                          <td>{meetings.substitute}</td>

                          {/* Training */}
                          <td>{totalTraining || 0}</td>

                          <td>{oneToOneCounts[member._id]?.fromCount || 0}</td>
                          <td>{referralCounts[member._id]?.given || 0}</td>
                          <td>{referralCounts[member._id]?.received || 0}</td>
                          <td>{thankYouAmounts[member._id]?.givenAmount || 0}</td>
                          <td>{thankYouAmounts[member._id]?.receivedAmount || 0}</td>
                          <td>{visitorCounts[member._id] || 0}</td>
                          <td>{testimonialCounts[member._id]?.given || 0}</td>
                          <td>{testimonialCounts[member._id]?.received || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                {/* Prev */}
                <button
                  className="btn btn-primary"
                  disabled={pagination.page === 1 || loadingReports}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Prev
                </button>

                {/* Page Info */}
                <div>
                  Page <strong>{pagination.page}</strong> of{" "}
                  <strong>{pagination.totalPages}</strong>
                </div>

                {/* Next */}
                <button
                  className="btn btn-primary"
                  disabled={pagination.page === pagination.totalPages || loadingReports}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No associates found.</p>
            </div>
          )}
        </div>
      </div>

      {/* ASSOCIATE PERFORMANCE REPORT */}
      <div className="card h-100 p-0 radius-12">
        <div className="card-header border-bottom bg-base py-16 px-24 d-flex justify-content-between align-items-center">
          <h6 className="text-lg fw-semibold mb-0">Associate Performance Report</h6>
          {loadingReports && (
            <div className="d-flex align-items-center gap-2 text-danger text-sm fw-medium">
              <div className="spinner-border spinner-border-sm text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span>Updating...</span>
            </div>
          )}
        </div>

        <div className="card-body chapterwisebox p-24">
          {loadingReports ? (
            <div className="d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: "260px" }}>
              <div 
                className="spinner-border text-danger mb-3" 
                role="status" 
                style={{ width: "2.75rem", height: "2.75rem", borderWidth: "3px" }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <h6 className="fw-semibold text-secondary mb-1" style={{ fontSize: "15px" }}>Loading Associate Performance Report</h6>
              <p className="text-muted text-xs mb-0">Calculating 1-to-1s, visitors, trainings, business scores...</p>
            </div>
          ) : membersData?.length > 0 ? (
            <>
              {/* TABLE */}
              <div className="table-responsive" style={{ overflowX: "auto" }}>
                <table className="table table-bordered align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th>S.NO</th>
                      <th>Associate</th>
                      <th>1-to-1</th>
                      <th>Referrals</th>
                      <th>Visitors</th>
                      <th>Trainings</th>
                      <th>Business</th>
                      <th>Testimonials</th>
                      <th>Attendance</th>
                      <th>Total Score</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedMembers?.length > 0 ? (
                      paginatedMembers.map((member, index) => {
                        // Find the associate report for this member
                        const report = associatePerformance?.find(r => r.memberId === member._id) || {};
                        const key = getPeriodMonthKey();   // ex → "2026-11"
                        const monthData = report?.monthlyScore?.[key] || {};

                        const oneToOne = monthData.oneToOne || 0;
                        const referrals = monthData.referrals || 0;
                        const visitors = monthData.visitors || 0;
                        const trainings = monthData.trainings || 0;
                        const business = monthData.business || 0;
                        const testimonials = monthData.testimonials || 0;
                        const attendance = monthData.attendance || 0;
                        const onTime = monthData.onTime || 0;

                        const totalScore =
                          oneToOne +
                          referrals +
                          visitors +
                          trainings +
                          business +
                          testimonials +
                          attendance +
                          onTime;

                        return (
                          <tr key={member._id}>
                            <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                            <td>
                              <Link
                                to={`/associate/${member._id}/report`}
                                style={{ color: "#007bff", fontWeight: "600", textDecoration: "underline", cursor: "pointer" }}
                              >
                                {member.name}
                              </Link>
                            </td>
                            <td>{oneToOne.toFixed(2)}</td>
                            <td>{referrals.toFixed(2)}</td>
                            <td>{visitors.toFixed(2)}</td>
                            <td>{trainings.toFixed(2)}</td>
                            <td>{business.toFixed(2)}</td>
                            <td>{testimonials.toFixed(2)}</td>
                            <td>{attendance.toFixed(2)}</td>
                            <td>
                              <div className="fw-bold">{totalScore.toFixed(2)}</div>
                              <div className="progress" style={{ height: "6px" }}>
                                <div
                                  className="progress-bar bg-success"
                                  style={{ width: `${Math.min(100, (totalScore / 50) * 100)}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} className="text-muted fw-bold">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                {/* Prev */}
                <button
                  className="btn btn-primary"
                  disabled={pagination.page === 1 || loadingReports}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Prev
                </button>

                {/* Page Info */}
                <div>
                  Page <strong>{pagination.page}</strong> of{" "}
                  <strong>{pagination.totalPages}</strong>
                </div>

                {/* Next */}
                <button
                  className="btn btn-primary"
                  disabled={pagination.page === pagination.totalPages || loadingReports}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No associates found.</p>
            </div>
          )}
        </div>
      </div>



      {/* Modal Start */}
      <div
        className="modal fade"
        id="exampleModal"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-m modal-dialog modal-dialog-centered">
          <div className="modal-content radius-16 bg-base">
            <div className="modal-header py-16 px-24 border border-top-0 border-start-0 border-end-0">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Add New Chapter
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body p-24">
              <form action="#">
                <div className="row">
                  <div className="col-12 mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Chapter Name
                    </label>
                    <input type="text" className="form-control radius-8" />
                  </div>

                  <div className="col-12 mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Region
                    </label>
                    <select class="form-control form-select">
                      <option value="Date">Select Region </option>
                      <option value="1" selected="">
                        Chennai
                      </option>
                    </select>
                  </div>

                  <div className="col-12 mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Chapter Induction Directors (CID)
                    </label>
                    <select class="form-control form-select">
                      <option value=""> Select Name </option>
                      <option value="rajesh">Rajesh</option>
                      <option value="madhu">Madhu</option>
                      <option value="praburajan">Praburajan</option>
                      <option value="gajendran">Gajendran</option>
                      <option value="kirubakaran">Kirubakaran</option>
                      <option value="Kumar Subramaniam">
                        Kumar Subramaniam
                      </option>
                      <option value="Palanikumar">Palanikumar</option>
                    </select>
                  </div>

                  <div className="col-12 mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Address
                    </label>
                    <input type="text" className="form-control radius-8" />
                  </div>

                  <div className="d-flex align-items-center gap-3 mt-24">
                    <button
                      type="reset"
                      className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-40 py-11 radius-8"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary grip border border-primary-600 text-md px-48 py-12 radius-8"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Modal End */}

      {/* Modal Start */}
      <div
        className="modal fade"
        id="exampleModalTwo"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-m modal-dialog modal-dialog-centered">
          <div className="modal-content radius-16 bg-base">
            <div className="modal-header py-16 px-24 border border-top-0 border-start-0 border-end-0">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Add New Region
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body p-24">
              <form action="#">
                <div className="row">
                  <div className="col-12 mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Region Name
                    </label>
                    <input type="text" className="form-control radius-8" />
                  </div>

                  <div className="col-12 mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Date
                    </label>
                    <input type="date" className="form-control radius-8" />
                  </div>

                  <div className="col-12 mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Region Head
                    </label>
                    <select class="form-control form-select">
                      <option value="Date">Select Region Head</option>
                      <option value="1" selected="">
                        Rajesh
                      </option>
                      <option value="1" selected="">
                        Madhu
                      </option>
                      <option value="1" selected="">
                        Prabhu
                      </option>
                    </select>
                  </div>

                  <div className="d-flex align-items-center gap-3 mt-24">
                    <button
                      type="reset"
                      className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-40 py-11 radius-8"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary grip border border-primary-600 text-md px-48 py-12 radius-8"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Modal End */}

      {/* Modal Start */}
      <div
        className="modal fade"
        id="exampleModalOne"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-m modal-dialog modal-dialog-centered">
          <div className="modal-content radius-16 bg-base">
            <div className="modal-header py-16 px-24 border border-top-0 border-start-0 border-end-0">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Edit Chapter
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body p-24">
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <tbody>
                  <tr
                    style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}
                  >
                    <td style={{ padding: "8px 0" }}>
                      <strong>Chapter Name:</strong>
                    </td>
                    <td style={{ padding: "8px 0" }}>
                      GRIP Aram <span className="chapterday">(Tuesday)</span>
                    </td>
                  </tr>
                  <tr
                    style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}
                  >
                    <td style={{ padding: "8px 0" }}>
                      <strong>Region:</strong>
                    </td>
                    <td style={{ padding: "8px 0" }}>Chennai</td>
                  </tr>
                  <tr
                    style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}
                  >
                    <td style={{ padding: "8px 0" }}>
                      <strong>CID:</strong>
                    </td>
                    <td style={{ padding: "8px 0" }}>Richard</td>
                  </tr>
                  <tr
                    style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}
                  >
                    <td style={{ padding: "8px 0" }}>
                      <strong>Location:</strong>
                    </td>
                    <td style={{ padding: "8px 0" }}>Pallavaram</td>
                  </tr>
                  <tr
                    style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}
                  >
                    <td style={{ padding: "8px 0" }}>
                      <strong>Status:</strong>
                    </td>
                    <td style={{ padding: "8px 0" }}>
                      <select
                        className="form-select"
                        style={{
                          width: "150px",
                          padding: "8px 8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          backgroundColor: "#fff",
                        }}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Upcoming</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Modal End */}

      {/* REQUIRED!! */}
      <ToastContainer position="top-right" autoClose={3000} />
      <div
        className="modal fade"
        id="memberSelectionModal"
        tabIndex="-1"
        aria-labelledby="memberSelectionModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
            <div className="modal-header border-bottom bg-light" style={{ padding: "16px 24px" }}>
              <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2" id="memberSelectionModalLabel">
                Select {roleModalTarget}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body" style={{ padding: "24px", minHeight: "300px" }}>
              <label className="form-label fw-bold text-secondary mb-3 d-flex align-items-center gap-2">
                Search Member
              </label>
              <Select
                isMulti={
                  roleModalTarget === "Associate Committee" ||
                  roleModalTarget === "Coordinator" ||
                  roleModalTarget === "Visitor Interaction Team"
                }
                menuPortalTarget={document.body}
                menuPosition="fixed"
                options={allMembers.map((m) => ({
                  label: m.name,
                  value: m.id,
                }))}
                value={
                  roleModalTarget === "President" ? presidentMember :
                  roleModalTarget === "Secretary" ? secretaryMember :
                  roleModalTarget === "Vice President" ? vicePresidentMember :
                  roleModalTarget === "Associate Committee" ? associateCommitteeMembers :
                  roleModalTarget === "Coordinator" ? coordinatorMembers :
                  roleModalTarget === "Visitor Interaction Team" ? visitorInteractionMembers :
                  roleModalTarget === "Maximum Referrals" ? referralMember :
                  roleModalTarget === "Maximum Business" ? businessMember :
                  roleModalTarget === "Maximum Visitors" ? visitorMember : null
                }
                onChange={(selected) => {
                  if (roleModalTarget === "President") setPresidentMember(selected);
                  else if (roleModalTarget === "Secretary") setSecretaryMember(selected);
                  else if (roleModalTarget === "Vice President") setVicePresidentMember(selected);
                  else if (roleModalTarget === "Associate Committee") setAssociateCommitteeMembers(selected || []);
                  else if (roleModalTarget === "Coordinator") setCoordinatorMembers(selected || []);
                  else if (roleModalTarget === "Visitor Interaction Team") setVisitorInteractionMembers(selected || []);
                  else if (roleModalTarget === "Maximum Referrals") setReferralMember(selected);
                  else if (roleModalTarget === "Maximum Business") setBusinessMember(selected);
                  else if (roleModalTarget === "Maximum Visitors") setVisitorMember(selected);
                }}
                placeholder={`Search to assign ${roleModalTarget}...`}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                  control: (styles, { isFocused }) => ({
                    ...styles,
                    backgroundColor: "#fff",
                    border: isFocused ? "1.5px solid rgb(192, 34, 33)" : "1px solid #dee2e6",
                    boxShadow: "none",
                    borderRadius: "8px",
                    padding: "4px",
                    "&:hover": {
                      border: "1.5px solid rgb(192, 34, 33)",
                    },
                  }),
                  option: (styles, { isFocused, isSelected }) => ({
                    ...styles,
                    backgroundColor: isSelected
                      ? "rgb(192, 34, 33)"
                      : isFocused
                      ? "rgba(192, 34, 33, 0.1)"
                      : "white",
                    color: isSelected ? "white" : "#333",
                    padding: "10px 14px",
                    fontWeight: isSelected ? "600" : "400",
                    cursor: "pointer",
                  }),
                }}
                formatOptionLabel={formatOptionLabel}
              />
            </div>
            <div className="modal-footer border-top bg-light d-flex justify-content-end" style={{ padding: "16px 24px" }}>
              <button
                type="button"
                className="btn btn-primary fw-semibold"
                style={{ backgroundColor: "rgb(192, 34, 33)", borderColor: "rgb(192, 34, 33)", padding: "10px 32px", borderRadius: "8px" }}
                data-bs-dismiss="modal"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterViewLayer;
