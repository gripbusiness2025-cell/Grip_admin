import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardApiProvider from "../../apiProvider/dashboardApi";

const RecentMembers = () => {
  const [recentMembers, setRecentMembers] = useState([]);

  const fetchRecentMembers = async () => {
    try {
      const result = await dashboardApiProvider.getRecentMembers();

      if (result.status) {
        setRecentMembers(result.response.data || []);
      } else {
        console.warn(
          "Failed to fetch recent associates:",
          result.response?.message
        );
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  useEffect(() => {
    fetchRecentMembers();
  }, []);

  const formatMeetingDay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { weekday: "long", month: "short", day: "numeric" };
    return `${date.toLocaleDateString("en-US", options)}`;
  };

  return (
    <div className="col-xxl-8 col-xl-8 col-12">
      <div className="card h-100 radius-8 border-0">
        <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between">
          <h6 className="text-lg fw-semibold mb-0">Recent Associates</h6>
          <Link
            to="/primarymember-list"
            className="text-primary-600 hover-text-primary d-flex align-items-center gap-1"
          >
            View All
            <iconify-icon
              icon="solar:alt-arrow-right-linear"
              className="icon"
            />
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table mb-0 rounded-0 border-0 text-nowrap">
              <thead>
                <tr>
                  <th scope="col" className="bg-transparent rounded-0">
                    S.No
                  </th>
                  <th scope="col" className="bg-transparent rounded-0">
                    Name
                  </th>
                  <th scope="col" className="bg-transparent rounded-0">
                    Designation
                  </th>
                  <th scope="col" className="bg-transparent rounded-0">
                    Company Name
                  </th>
                  <th scope="col" className="bg-transparent rounded-0">
                    Chapter
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.length > 0 ? (
                  recentMembers.map((member, index) => (
                    <tr key={member._id}>
                      <td>{index + 1}.</td>
                      <td>{member.name}</td>
                      <td>{member.designation || "N/A"}</td>
                      <td>{member.companyName || "N/A"}</td>
                      <td>
                        GRIP {member.chapter || "N/A"}{" "}
                        {member.meetingDate
                          ? `(${formatMeetingDay(member.meetingDate)})`
                          : ""}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-secondary py-24">
                      No recent associates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentMembers;
