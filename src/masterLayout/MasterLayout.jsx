import React, { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, hasPermission, setCurrentUser } from "../utils/auth";
import userApiProvider from "../apiProvider/userApi";
import notificationApiProvider from "../apiProvider/notificationApi";
import { IMAGE_BASE_URL } from "../network/apiClient";
import memberApiProvider from "../apiProvider/memberApi";

const MasterLayout = ({ children }) => {
  const navigate = useNavigate();
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const [userData, setUserData] = useState(() => getCurrentUser()?.data || null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const location = useLocation(); // Hook to get the current route

  const rawRole = userData?.role;
  const roleName = (typeof rawRole === 'object' ? rawRole?.name : rawRole) || '';
  const roleNameLower = roleName.toLowerCase();
  const isSuperAdmin = roleNameLower === 'admin' || roleNameLower === 'super admin' || roleNameLower === 'super-admin';
  const isED = roleNameLower === 'ed' || roleNameLower === 'executive director';

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000); // Polling every minute
    return () => clearInterval(intervalId);
  }, []);

  // Debounced search recommendations query
  useEffect(() => {
    if (!globalSearchQuery.trim() || globalSearchQuery.trim().length < 2) {
      setRecommendations([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const activeRes = await memberApiProvider.getRegisterUserList({
          search: globalSearchQuery.trim(),
          limit: 5,
          status: "active"
        });

        const pendingRes = await memberApiProvider.getRegisterUserList({
          search: globalSearchQuery.trim(),
          limit: 5
        });

        let list = [];
        if (activeRes && activeRes.status && activeRes.data?.data?.members) {
          list = [...list, ...activeRes.data.data.members];
        }
        if (pendingRes && pendingRes.status && pendingRes.data?.data?.members) {
          const existingIds = new Set(list.map(m => m._id));
          pendingRes.data.data.members.forEach(m => {
            if (!existingIds.has(m._id)) {
              list.push(m);
            }
          });
        }

        setRecommendations(list.slice(0, 8));
      } catch (err) {
        console.error("Error fetching search recommendations:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [globalSearchQuery]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApiProvider.getNotifications();
      if (res && res.success) {
        setNotifications(res.data);
        setUnreadCount(res.meta.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const res = await notificationApiProvider.markAllAsRead();
      if (res && res.success) {
        setUnreadCount(0);
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "onetoone": return "lucide:users";
      case "referral": return "lucide:briefcase";
      case "testimonial": return "lucide:star";
      case "visitor": return "lucide:user-plus";
      case "expectedvisitor": return "lucide:calendar-clock";
      case "thankyou": return "lucide:heart";
      default: return "lucide:bell";
    }
  };

  useEffect(() => {
    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest(".dropdown");

      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains("open");

      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
        const submenu = dropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = "0px";
        }
      });

      if (!isActive) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
        }
      }
    };

    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        submenuLinks.forEach((link) => {
          if (
            link.getAttribute("href") === location.pathname ||
            link.getAttribute("to") === location.pathname
          ) {
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) {
              submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
            }
          }
        });
      });
    };

    openActiveDropdown();

    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [location.pathname]);

  let sidebarControl = () => {
    seSidebarActive(!sidebarActive);
  };

  let mobileMenuControl = () => {
    setMobileMenu(!mobileMenu);
  };

  const logOutFunct = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/sign-in';
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const sessionData = getCurrentUser();
      const userId = sessionData?.data?.id || sessionData?.data?._id;

      if (userId) {
        const response = await userApiProvider.getUserById(userId);
        if (response?.response?.data) {
          const freshUserData = response.response.data;
          // merge fresh role data if it exists, otherwise keep existing
          const newSessionData = { ...sessionData, data: { ...sessionData.data, ...freshUserData } };
          setCurrentUser(newSessionData);
          setUserData(newSessionData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
    }
  };

  const handleGlobalSearchSubmit = (e) => {
    e.preventDefault();
    if (globalSearchQuery.trim()) {
      navigate(`/user-member-list?search=${encodeURIComponent(globalSearchQuery.trim())}`);
    }
  };

  return (
    <section className={mobileMenu ? "overlay active" : "overlay "}>
      {/* sidebar */}
      <aside
        className={
          sidebarActive
            ? "sidebar active "
            : mobileMenu
              ? "sidebar sidebar-open"
              : "sidebar"
        }
      >
        <button
          onClick={mobileMenuControl}
          type="button"
          className="sidebar-close-btn"
        >
          <Icon icon="radix-icons:cross-2" />
        </button>
        <div>
          <Link to="/" className="sidebar-logo">
            <img
              src="/assets/images/logo.png"
              alt="site logo"
              className="light-logo"
            />
            <img
              src="/assets/images/logo.png"
              alt="site logo"
              className="dark-logo"
            />
            <img
              src="/assets/images/logo.png"
              alt="site logo"
              className="logo-icon"
            />
          </Link>
        </div>
        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            {hasPermission("dashboard-list") && (
              <li>
                <NavLink
                  to="/dashboard"
                  className={(navData) => (navData.isActive ? "active-page" : "")}
                >
                  <Icon
                    icon="solar:home-smile-angle-outline"
                    className="menu-icon"
                  />
                  <span>Dashboard</span>
                </NavLink>
              </li>
            )}
            {/* Invoice Dropdown */}
            {(hasPermission("admin-users-list") || hasPermission("panel-associate-list") || hasPermission("users-list") || hasPermission("roles-list")) && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:account-cog-outline" className="menu-icon" />

                  <span>User Management</span>
                </Link>
                <ul className="sidebar-submenu">
                  {hasPermission("admin-users-list") && (
                    <li>
                      <NavLink
                        to="/users-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        <Icon icon="mdi:account-outline" className="menu-icon" />
                        Admin Users
                      </NavLink>
                    </li>
                  )}
                  {userData?.role !== "zone-admin" && hasPermission("panel-associate-list") && (
                    <>
                      <li>
                        <NavLink
                          to="/primarymember-list"
                          className={(navData) =>
                            navData.isActive ? "active-page" : ""
                          }
                        >
                          <Icon
                            icon="mdi:account-group-outline"
                            className="menu-icon"
                          />
                          Panel Associate
                        </NavLink>
                      </li>
                    </>
                  )}
                  {(isSuperAdmin || isED) && (
                    <li>
                      <NavLink
                        to="/roles-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        <Icon
                          icon="mdi:account-key-outline"
                          className="menu-icon"
                        />
                        Role
                      </NavLink>
                    </li>
                  )}
                  {/* Access Requests — visible to Admin/Super Admin only */}
                  {(userData?.role?.name?.toLowerCase() === 'admin' ||
                    userData?.role?.name?.toLowerCase() === 'super admin' ||
                    userData?.role?.name?.toLowerCase() === 'super-admin') && (
                    <li>
                      <NavLink
                        to="/access-requests"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        <Icon
                          icon="mdi:shield-account-outline"
                          className="menu-icon"
                        />
                        Access Requests
                      </NavLink>
                    </li>
                  )}

                  {/* <li>
                    <NavLink
                      to='/head-table'
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      <Icon icon='mdi:table-account' className='menu-icon' />
                      Head Table
                    </NavLink>
                  </li> */}
                </ul>
              </li>
            )}
            {hasPermission("chapters-list") && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:book-outline" className="menu-icon" />

                  <span>Chapter</span>
                </Link>
                <ul className="sidebar-submenu">
                  {(userData?.role?.name?.toLowerCase() === "admin" || userData?.role?.name?.toLowerCase() === "super admin" || userData?.role?.name?.toLowerCase() === "super-admin") && (
                    <li>
                      <NavLink
                        to="/zone-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        <Icon icon="ic:outline-map" className="menu-icon" />
                        Zones
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to="/chapter"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      <Icon icon="material-symbols:toc" className="menu-icon" />
                      Chapters
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/chapterwise"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      <Icon icon="mdi:file-chart-outline" className="menu-icon" />
                      Chapter Report
                    </NavLink>
                  </li>
                  {(userData?.role?.name?.toLowerCase() === "admin" || userData?.role?.name?.toLowerCase() === "super admin" || userData?.role?.name?.toLowerCase() === "super-admin") && (
                    <li>
                      <NavLink
                        to="/pin-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        <Icon icon="mdi:pin" className="menu-icon" />
                        Pins
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )}

            {/* Invoice Dropdown */}
            {(hasPermission("performers-list") ||
              hasPermission("121s-list") ||
              hasPermission("referrals-list") ||
              hasPermission("thank-you-slip-list") ||
              hasPermission("testimonial-list") ||
              hasPermission("visitor-guest-list") ||
              hasPermission("expected-visitors-list")) && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:account-tie" className="menu-icon" />

                  <span>Performers</span>
                </Link>
                <ul className="sidebar-submenu">
                  {hasPermission("121s-list") && (
                  <li>
                    <NavLink to="/121-list" className={(navData) => navData.isActive ? "active-page" : "" }>
                      <Icon icon="mdi:format-list-bulleted-type" className="menu-icon" />
                      121's
                    </NavLink>
                  </li>
                  )}

                  {hasPermission("referrals-list") && (

                  <li>
                    <NavLink to="/referral" className={(navData) => navData.isActive ? "active-page" : "" }>
                      <Icon icon="material-symbols:person-add-outline" className="menu-icon" />
                      Referral's
                    </NavLink>

                  </li>

                  )}

                  {hasPermission("thank-you-slip-list") && (

                  <li>
                    <NavLink to="/thankyou" className={(navData) => navData.isActive ? "active-page" : "" }>
                      <Icon icon="mdi:hand-heart-outline" className="menu-icon" />
                      Thank you Slip
                    </NavLink>

                  </li>

                  )}

                  {hasPermission("testimonial-list") && (

                  <li>
                    <NavLink to="/testimoniall" className={(navData) => navData.isActive ? "active-page" : "" }>
                      <Icon icon="mdi:message-star-outline" className="menu-icon" />
                      Testimonial
                    </NavLink>

                  </li>

                  )}

                  {hasPermission("visitor-guest-list") && (

                  <li>
                    <NavLink to="/visitor" className={(navData) => navData.isActive ? "active-page" : "" }>
                      <Icon icon="mdi:eye-outline" className="menu-icon" />
                      Visitor /Guest
                    </NavLink>

                  </li>

                  )}
                  {hasPermission("expected-visitors-list") && (
                  <li>
                    <NavLink to="/expected-visitors" className={(navData) => navData.isActive ? "active-page" : "" }>
                      <Icon icon="mdi:account-clock-outline" className="menu-icon" />
                      Expected Visitors
                    </NavLink>
                  </li>
                  )}
                  <li>
                    <NavLink to="/visitor-feedback" className={(navData) => navData.isActive ? "active-page" : "" }>
                      <Icon icon="mdi:comment-text-multiple-outline" className="menu-icon" />
                      Visitor Feedback
                    </NavLink>
                  </li>
                </ul>
              </li>

            )}
            {/* Invoice Dropdown */}
            {hasPermission("associates-list") && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="fe:vector" className="menu-icon" />
                  <span>Associate</span>
                </Link>
                <ul className="sidebar-submenu">
                  <li>
                    <NavLink
                      to="/user-member-list"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      <Icon
                        icon="mdi:account-details-outline"
                        className="menu-icon"
                      />
                      Associators
                    </NavLink>
                  </li>
                  {/* <li>
                  <NavLink
                     to='/members-grid'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
<Icon icon="mdi:badge-account-outline" className="menu-icon" />

                 Members Profile
                  </NavLink>
                </li> */}
                </ul>
              </li>
            )}
            {/* Invoice Dropdown */}
            {/* {hasPermission("enquiries-list") && (
              <li className="dropdown">
              <Link to="#">
                <Icon icon="mdi:email-outline" className="menu-icon" />
                <span>Enquiry Management</span>
              </Link>
              <ul className="sidebar-submenu">
                <li>
                  <NavLink
                    to="/enquiries"
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <Icon
                      icon="mdi:comment-question-outline"
                      className="menu-icon"
                    />
                    Enquiries
                  </NavLink>
                </li>
                <li>
                  <NavLink
                     to='/members-grid'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
<Icon icon="mdi:badge-account-outline" className="menu-icon" />

                 Members Profile
                  </NavLink>
                </li>
              </ul>
            </li>
            )} */}
            {/* Invoice Dropdown */}            {hasPermission("payments-list") && (
              <li>
                <NavLink to="/payments" className={(navData) => navData.isActive ? "active-page" : "" }>
                  <Icon icon="mdi:credit-card-outline" className="menu-icon" />
                  Payments
                </NavLink>
              </li>
            )}
            {hasPermission("meeting-list") && (
                <li>
                  <NavLink to="/payment-list" className={(navData) => navData.isActive ? "active-page" : "" }>
                    <Icon icon="mdi:credit-card-plus-outline" className="menu-icon" />
                    Meeting
                  </NavLink>
                </li>
            )}
            {hasPermission("events-list") && (
                <li>
                  <NavLink to="/attedence-list" className={(navData) => navData.isActive ? "active-page" : "" }>
                    <Icon icon="mdi:credit-card-plus-outline" className="menu-icon" />
                    Events
                  </NavLink>
                </li>
            )}
            {hasPermission("training-list") && (
                <li>
                  <NavLink to="/training-list" className={(navData) => navData.isActive ? "active-page" : "" }>
                    <Icon icon="mdi:book-open-variant" className="menu-icon" />
                    Training
                  </NavLink>
                </li>
            )}
            {hasPermission("onboarding-form-list") && (
                <li>
                  <NavLink to="/onboarding-list" className={(navData) => navData.isActive ? "active-page" : "" }>
                    <Icon icon="mdi:clipboard-text-outline" className="menu-icon" />
                    Onboarding Form
                  </NavLink>
                </li>
            )}
            {hasPermission("website-list") && (
              <li>
                <NavLink to="/website" className={(navData) => navData.isActive ? "active-page" : ""}>
                  <Icon icon="mdi:web" className="menu-icon" />
                  <span>Website</span>
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </aside>

      <main
        className={sidebarActive ? "dashboard-main active" : "dashboard-main"}
      >
        <div className="navbar-header">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-4">
                <button
                  type="button"
                  className="sidebar-toggle"
                  onClick={sidebarControl}
                >
                  {sidebarActive ? (
                    <Icon
                      icon="iconoir:arrow-right"
                      className="icon text-2xl non-active"
                    />
                  ) : (
                    <Icon
                      icon="heroicons:bars-3-solid"
                      className="icon text-2xl non-active "
                    />
                  )}
                </button>
                <button
                  onClick={mobileMenuControl}
                  type="button"
                  className="sidebar-mobile-toggle"
                >
                  <Icon icon="heroicons:bars-3-solid" className="icon" />
                </button>
              </div>
            </div>

            {/* Global Search Bar Center Column */}
            <div className="col-lg-5 d-none d-lg-block" ref={searchContainerRef} style={{ position: "relative" }}>
              <form onSubmit={handleGlobalSearchSubmit} className="navbar-search w-100 position-relative" style={{ display: "block" }}>
                <input
                  type="text"
                  name="search"
                  className="w-100 bg-neutral-50 border border-neutral-200"
                  style={{
                    height: "2.6rem",
                    paddingLeft: "2.8rem",
                    paddingRight: "1.2rem",
                    fontSize: "0.875rem",
                    outline: "none",
                    transition: "border-color 0.25s, box-shadow 0.25s",
                    borderRadius: "20px"
                  }}
                  placeholder="Search associates, chapters, meetings..."
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                />
                <Icon
                  icon="ion:search-outline"
                  className="position-absolute top-50 translate-middle-y text-secondary text-lg"
                  style={{ left: "1.2rem", pointerEvents: "none" }}
                />
              </form>

              {/* Autocomplete Recommendations Dropdown */}
              {showSearchDropdown && (globalSearchQuery.trim().length >= 2 || isSearching) && (
                <div 
                  className="position-absolute bg-white border border-neutral-200 rounded-12 shadow-lg w-100 mt-2 overflow-hidden" 
                  style={{ 
                    zIndex: 9999, 
                    top: "100%", 
                    left: 0,
                    maxHeight: "350px",
                    overflowY: "auto",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {isSearching ? (
                    <div className="d-flex align-items-center justify-content-center p-3 gap-2 text-secondary">
                      <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: "1rem", height: "1rem" }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span style={{ fontSize: "0.85rem" }}>Searching...</span>
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="py-2">
                      <div className="px-3 py-1 text-xs text-muted fw-bold text-uppercase border-bottom" style={{ letterSpacing: "0.05em", fontSize: "0.7rem" }}>
                        Associates
                      </div>
                      <ul className="list-unstyled mb-0">
                        {recommendations.map((member) => {
                          const name = `${member.personalDetails?.firstName || ""} ${member.personalDetails?.lastName || ""}`.trim();
                          const company = member.personalDetails?.companyName || "";
                          const chapter = member.chapterInfo?.chapterId?.chapterName || "";
                          const status = member.status || "active";

                          return (
                            <li key={member._id}>
                              <button
                                type="button"
                                className="w-100 text-start border-0 px-3 py-2 d-flex align-items-center justify-content-between transition-colors search-recommendation-item"
                                style={{ 
                                  backgroundColor: "transparent", 
                                  outline: "none",
                                  fontSize: "0.85rem"
                                }}
                                onClick={() => {
                                  setGlobalSearchQuery(name);
                                  setShowSearchDropdown(false);
                                  navigate(`/user-member-list?search=${encodeURIComponent(name)}`);
                                }}
                              >
                                <div className="d-flex align-items-center gap-3">
                                  <img
                                    src={
                                      member.profileImage?.docPath
                                        ? `${IMAGE_BASE_URL}/${member.profileImage?.docPath}/${member.profileImage?.docName}`
                                        : "/assets/images/user.png"
                                    }
                                    alt="profile"
                                    className="rounded-circle object-fit-cover"
                                    style={{ width: "32px", height: "32px", border: "1px solid #f3f4f6" }}
                                  />
                                  <div>
                                    <div className="fw-semibold text-dark">{name}</div>
                                    <div className="text-muted text-xs" style={{ fontSize: "0.75rem" }}>
                                      {company} {chapter ? `• ${chapter}` : ""}
                                    </div>
                                  </div>
                                </div>
                                <span 
                                  className={`badge rounded-pill text-capitalize`}
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "0.2rem 0.5rem",
                                    backgroundColor: status === "active" ? "#e8f5e9" : status === "decline" ? "#ffebee" : "#fff8e1",
                                    color: status === "active" ? "#2e7d32" : status === "decline" ? "#c62828" : "#f57f17",
                                  }}
                                >
                                  {status}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-muted" style={{ fontSize: "0.85rem" }}>
                      No matching associates found.
                    </div>
                  )}
                </div>
              )}

              <style>{`
                .search-recommendation-item:hover {
                  background-color: #f8f9fa !important;
                }
              `}</style>
            </div>

            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* <ThemeToggleButton /> */}

                {/* Language dropdown end */}

                {/* Message dropdown end */}
                {/* Notification Dropdown Start */}
                <div className="dropdown">
                  <button
                    className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                    onClick={markAllAsRead}
                  >
                    <Icon
                      icon="iconoir:bell"
                      className="text-primary-light text-xl"
                    />
                    {unreadCount > 0 && (
                      <span className="indicator bg-danger text-white rounded-circle position-absolute top-0 end-0 translate-middle" style={{ width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-lg p-0">
                    <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">
                          Notifications
                        </h6>
                      </div>
                      <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
                        {unreadCount}
                      </span>
                    </div>
                    <div className="max-h-400-px overflow-y-auto scroll-sm pe-4">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between ${notif.isRead ? "bg-base" : "bg-neutral-50"}`}
                          >
                            <div className="text-black d-flex align-items-center gap-3">
                              <span className="w-44-px h-44-px bg-primary-subtle text-primary-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                                <Icon
                                  icon={getNotificationIcon(notif.type)}
                                  className="icon text-xl"
                                />
                              </span>
                              <div>
                                <h6 className="text-md fw-semibold mb-1 text-capitalize">
                                  {(notif.type || "Notification").replace("expectedvisitor", "expected visitor")}
                                </h6>
                                <p className="mb-0 text-sm text-secondary-light">
                                  {notif.message}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-secondary-light flex-shrink-0">
                              {new Date(notif.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-secondary-light">
                          No notifications yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Notification dropdown end */}
                <div className="dropdown">
                  <button
                    className="d-flex justify-content-center align-items-center rounded-circle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <img
                      src={
                        userData?.profileImage?.docPath
                          ? `${IMAGE_BASE_URL}/${userData?.profileImage?.docPath}/${userData?.profileImage?.docName}`
                          : "/assets/images/user.png"
                      }
                      alt="image_user"
                      className="w-40-px h-40-px object-fit-cover rounded-circle"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-sm custom-dropdown-position">
                    <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-2">
                          {userData?.name}
                        </h6>
                        <span>{userData?.email}</span>
                      </div>
                      <button type="button" className="hover-text-danger">
                        <Icon
                          icon="radix-icons:cross-1"
                          className="icon text-xl"
                        />
                      </button>
                    </div>
                    <ul className="to-top-list">
                      {/* <li>
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                          to='/view-profile'
                        >
                          <Icon
                            icon='solar:user-linear'
                            className='icon text-xl'
                          />{" "}
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                          to='/email'
                        >
                          <Icon
                            icon='tabler:message-check'
                            className='icon text-xl'
                          />{" "}
                          Inbox
                        </Link>
                      </li>
                      <li>
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                          to='/company'
                        >
                          <Icon
                            icon='icon-park-outline:setting-two'
                            className='icon text-xl'
                          />
                          Setting
                        </Link>
                      </li> */}
                      <li onClick={logOutFunct}>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3"
                          to="#"
                        >
                          <Icon icon="lucide:power" className="icon text-xl" />{" "}
                          Log Out
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Profile dropdown end */}
              </div>
            </div>
          </div>
        </div>

        {/* dashboard-main-body */}
        <div className="dashboard-main-body">{children}</div>

        {/* Footer section */}
        <footer className="d-footer">
          <div className="row ">
            <div className="colauto">
              <p className="mb-0 text-center">
                © {new Date().getFullYear()} GRIP. All Rights Reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
};

export default MasterLayout;
