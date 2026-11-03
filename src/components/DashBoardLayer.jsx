import React, { useEffect, useState } from "react";
import UnitCountSix from "./child/UnitCountSix";
import TopPerformanceTwo from "./child/TopPerformanceTwo";
import RecentMembers from "./child/LatestAppointmentsOne";
import RecentActivityOne from "./child/RecentActivityOne";
import dashboardApiProvider from "../apiProvider/dashboardApi";
import { getCurrentUser } from "../utils/auth";
import userApiProvider from "../apiProvider/userApi";

const DashBoardLayer = () => {
  const [countData, setCountData] = useState(null);
  const [user, setUser] = useState(() => getCurrentUser()?.data);

  const fetchCountData = async () => {
    try {
      const result = await dashboardApiProvider.getDashboardCounts();

      if (result.status) {
        setCountData(result.response.data);
      } else {
        console.warn("Failed to fetch counts:", result.response?.message);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  useEffect(() => {
    fetchCountData();

    const fetchFreshUser = async () => {
      const sessionData = getCurrentUser();
      const userId = sessionData?.data?.id || sessionData?.data?._id;
      if (userId) {
        try {
          const response = await userApiProvider.getUserById(userId);
          if (response && response.status) {
            setUser(response.response.data);
          }
        } catch (error) {
          console.error("Failed to load user details for banner:", error);
        }
      }
    };
    fetchFreshUser();
  }, []);
  
  const roleName = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isSuperAdmin = roleName?.toLowerCase() === 'admin' || roleName?.toLowerCase() === 'super admin' || roleName?.toLowerCase() === 'super-admin';
  const isED = roleName?.toLowerCase() === 'ed' || roleName?.toLowerCase() === 'executive director';
  const isZoneAdmin = roleName === 'zone-admin';
  
  let displayRole = roleName || 'N/A';
  if (isSuperAdmin) displayRole = 'Super Admin';
  else if (isED) displayRole = 'Executive Director';
  else if (isZoneAdmin) displayRole = 'Zone Admin';
  
  let displayZone = 'N/A';
  if (isSuperAdmin) {
    displayZone = 'All Zones';
  } else if (isZoneAdmin) {
    displayZone = user?.name || 'N/A';
  } else {
    displayZone = user?.zoneId?.zoneName || 'N/A';
  }
  
  let displayChapter = 'N/A';
  if (isSuperAdmin || isED || isZoneAdmin || user?.allChapters) {
    displayChapter = 'All Chapters';
  } else {
    displayChapter = user?.chapterNames && user.chapterNames.length > 0 ? user.chapterNames.join(', ') : 'N/A';
  }

  return (
    <>
      <div className='row gy-4'>
        {/* Logged in User Info Banner */}
        <div className='col-12'>
          <div className='card p-24 radius-12 border-0 shadow-sm' style={{ background: 'linear-gradient(135deg, #c02221 0%, #454442 100%)', color: '#fff' }}>
            <div className='d-flex align-items-center justify-content-between flex-wrap gap-4'>
              <div className='d-flex align-items-center gap-3'>
                <div 
                  className='rounded-circle bg-white text-dark d-flex justify-content-center align-items-center fw-bold shadow-sm'
                  style={{ width: '56px', height: '56px', fontSize: '20px', color: '#c02221', flexShrink: 0 }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className='fw-bold text-white mb-1'>{user?.name || 'User'}</h4>
                  <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)' }}>Logged in User Details</span>
                </div>
              </div>
              
              <div 
                className='d-flex flex-wrap gap-3 align-items-center p-16 radius-12' 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)' 
                }}
              >
                <div className='px-12 border-end' style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Email</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{user?.email || 'N/A'}</span>
                </div>
                <div className='px-12 border-end' style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Mobile Number</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{user?.mobileNumber || 'N/A'}</span>
                </div>
                <div className='px-12 border-end' style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Role</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', textTransform: 'capitalize' }}>{displayRole}</span>
                </div>
                <div className='px-12 border-end' style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Zone</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{displayZone}</span>
                </div>
                <div className='px-12'>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Chapter</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{displayChapter}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Counter Cards */}
        <UnitCountSix countData={countData} />

        {/* Recent Associates (Table) */}
        <RecentMembers />

        {/* Recent Enquiry (List) */}
        <TopPerformanceTwo />

        {/* Recent Chapters (Table) */}
        <RecentActivityOne />
      </div>
    </>
  );
};

export default DashBoardLayer;
