import React, { useEffect, useState } from "react";
import dashboardApiProvider from "../../apiProvider/dashboardApi";
import { IMAGE_BASE_URL } from "../../network/apiClient";

const TopPerformanceTwo = () => {
  const [recentEnquiries, setRecentEnquiries] = useState([]);

  const fetchRecentEnquiries = async () => {
    try {
      const result = await dashboardApiProvider.getRecentEnquiries();

      if (result.status) {
        setRecentEnquiries(result.response.data || []);
      } else {
        console.warn("Failed to fetch recent enquiries:", result.response?.message);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  useEffect(() => {
    fetchRecentEnquiries();
  }, []);

  return (
    <div className='col-xxl-4 col-xl-4 col-12'>
      <div className='card h-100 radius-8 border-0'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between'>
          <h6 className='text-lg fw-semibold mb-0'>Recent Enquiry</h6>
        </div>
        <div className='card-body p-24'>
          <div className='d-flex flex-column gap-20'>
            {recentEnquiries.length > 0 ? (
              recentEnquiries.map((enquiry) => (
                <div
                  key={enquiry._id}
                  className='d-flex align-items-center justify-content-between gap-12'
                  style={{ minWidth: 0, width: "100%" }}
                >
                  <div className='d-flex align-items-center flex-grow-1' style={{ minWidth: 0, overflow: "hidden" }}>
                    <img
                      src={
                        enquiry?.profileImage?.docPath
                          ? `${IMAGE_BASE_URL}/${enquiry?.profileImage?.docPath}/${enquiry?.profileImage?.docName}`
                          : "/assets/images/default-avatar.png"
                      }
                      alt={enquiry.name || "User"}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/assets/images/default-avatar.png";
                      }}
                      className='rounded-circle flex-shrink-0 me-12 object-fit-cover'
                      style={{
                        width: "40px",
                        height: "40px",
                        minWidth: "40px",
                        minHeight: "40px",
                        maxWidth: "40px",
                        maxHeight: "40px",
                        backgroundColor: "#f1f5f9"
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                      <h6 
                        className='text-md mb-0 text-truncate fw-semibold' 
                        title={enquiry.name}
                        style={{ fontSize: "14px", lineHeight: "1.3" }}
                      >
                        {enquiry.name}
                      </h6>
                      <span
                        className='text-xs text-secondary-light fw-medium d-block text-truncate'
                        title={enquiry.designation}
                        style={{ fontSize: "12px", lineHeight: "1.3" }}
                      >
                        {enquiry.designation || "N/A"}
                      </span>
                    </div>
                  </div>
                  <span 
                    className='px-10 py-4 radius-8 fw-medium text-xs bg-primary-50 text-primary-600 border border-primary-100 flex-shrink-0'
                    style={{
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      lineHeight: "1.2"
                    }}
                  >
                    {enquiry.howDidYouHearAboutGRIP || "N/A"}
                  </span>
                </div>
              ))
            ) : (
              <div className='text-center text-secondary py-24'>
                No recent enquiries found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopPerformanceTwo;
