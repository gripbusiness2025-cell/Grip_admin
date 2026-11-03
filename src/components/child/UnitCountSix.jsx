import React from "react";
import { Link } from "react-router-dom";

const UnitCountSix = ({countData}) => {
  console.log(countData,"countData");
  return (
    <>
      <div className='col-xxl-3 col-xl-3 col-sm-6 col-12'>
        <Link to="/zone-list" className="text-decoration-none d-block h-100" style={{ color: 'inherit' }}>
          <div className='card p-3 shadow-2 radius-8 h-100 bg-gradient-end-6' style={{ cursor: 'pointer' }}>
            <div className='card-body p-0'>
              <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                <div className='d-flex align-items-center gap-2'>
                  <span className='mb-0 w-48-px h-48-px bg-cyan-100 text-cyan-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                    <i className='ri-group-fill' />
                  </span>
                  <div>
                    <h6 className='fw-semibold mb-2'>{countData?.zoneCount}</h6>
                    <span className='fw-medium text-secondary-light text-sm'>
                    Zone
                    </span>
                  </div>
                </div>
              </div>
              {/* <p className='text-sm mb-0'>
                {" "}
                <span className='text-cyan-600'>4</span> Doctors joined this week
              </p> */}
            </div>
          </div>
        </Link>
      </div>
      <div className='col-xxl-3 col-xl-3 col-sm-6 col-12'>
        <div className='card p-3 shadow-2 radius-8 h-100 bg-gradient-end-4'>
          <div className='card-body p-0'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
              <div className='d-flex align-items-center gap-2'>
                <span className='mb-0 w-48-px h-48-px bg-lilac-100 text-lilac-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                  <i className='ri-award-fill' />
                </span>
                <div>
                  <h6 className='fw-semibold mb-2'>{countData?.chapterCount}</h6>
                  <span className='fw-medium text-secondary-light text-sm'>
                 Chapter
                  </span>
                </div>
              </div>
            </div>
            {/* <p className='text-sm mb-0'>
              {" "}
              <span className='text-lilac-600'>8</span> Staffs on vacation
            </p> */}
          </div>
        </div>
      </div>
      <div className='col-xxl-3 col-xl-3 col-sm-6 col-12'>
        <div className='card p-3 shadow-2 radius-8 h-100 bg-gradient-end-1'>
          <div className='card-body p-0'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
              <div className='d-flex align-items-center gap-2'>
                <span className='mb-0 w-48-px h-48-px bg-primary-100 text-primary-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                  <i className='ri-group-fill' />
                </span>
                <div>
                  <h6 className='fw-semibold mb-2'>{countData?.mentorCount}</h6>
                  <span className='fw-medium text-secondary-light text-sm'>
                 Mentor
                  </span>
                </div>
              </div>
            </div>
            {/* <p className='text-sm mb-0'>
              {" "}
              <span className='text-primary-600'>170</span>New patients admitted
            </p> */}
          </div>
        </div>
      </div>
      <div className='col-xxl-3 col-xl-3 col-sm-6 col-12'>
        <div className='card p-3 shadow-2 radius-8 h-100 bg-gradient-end-1'>
          <div className='card-body p-0'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
              <div className='d-flex align-items-center gap-2'>
                <span className='mb-0 w-48-px h-48-px bg-success-100 text-success-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                  <i className='ri-wallet-3-fill' />
                </span>
                <div>
                  <h6 className='fw-semibold mb-2'>{countData?.memberCount}</h6>
                  <span className='fw-medium text-secondary-light text-sm'>
                   {/* Member's */}
                   Associates
                  </span>
                </div>
              </div>
            </div>
            {/* <p className='text-sm mb-0'>
              {" "}
              <span className='text-success-600'>60,000 </span> Medicine on
              reserve
            </p> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default UnitCountSix;
