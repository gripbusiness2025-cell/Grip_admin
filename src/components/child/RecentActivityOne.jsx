import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import chapterApiProvider from "../../apiProvider/chapterApi";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const RecentActivityOne = () => {
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    const fetchChapters = async () => {
      const result = await chapterApiProvider.getAllChapters({
        limit: 10,
        sortField: "createdAt",
        sortOrder: "desc",
        isActive: 1
      });
      if (result.status) {
        setChapters(result.response.data || []);
      }
    };
    fetchChapters();
  }, []);

  return (
    <div className='col-12'>
      <div className='card h-100 radius-8 border-0'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between'>
          <h6 className='text-lg fw-semibold mb-0'>Recent Chapters</h6>
          <Link
            to='/chapter'
            className='text-primary-600 hover-text-primary d-flex align-items-center gap-1'
          >
            View All
            <iconify-icon
              icon='solar:alt-arrow-right-linear'
              className='icon'
            />
          </Link>
        </div>
        <div className='card-body p-0'>
          <div className='table-responsive scroll-sm'>
            <table className='table bordered-table mb-0 rounded-0 border-0 text-nowrap'>
              <thead>
                <tr>
                  <th scope='col' className='bg-transparent rounded-0'>
                    Chapter Name
                  </th>
                  <th scope='col' className='bg-transparent rounded-0'>
                    Zone
                  </th>
                  <th scope='col' className='bg-transparent rounded-0'>
                    State / Country
                  </th>
                  <th scope='col' className='bg-transparent rounded-0'>
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((chapter) => (
                  <tr key={chapter._id}>
                    <td>
                      <div className='flex-grow-1'>
                        <h6 className='text-md mb-0'>{chapter.chapterName}</h6>
                      </div>
                    </td>
                    <td>{chapter.zoneId?.zoneName || "N/A"}</td>
                    <td>
                      {chapter.stateName}, {chapter.countryName}
                    </td>
                    <td>{formatDate(chapter.createdAt)}</td>
                  </tr>
                ))}
                {chapters.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-secondary py-24">No recent chapters found.</td>
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

export default RecentActivityOne;
