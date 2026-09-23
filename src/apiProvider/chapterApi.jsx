import { message, notification } from "antd";
import apiClient from "../network/apiClient";

class ChapterApiProvider {

    async createZone(input) {
        try {
            const response = await apiClient.post(`/zones`, input);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching zone:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.data ?? error.response?.data ?? null };
        }
    }

    async createChapter(input) {
        try {
            const response = await apiClient.post(`/chapters`, input);

            if (response.status === 200 || response.status === 201) {
                // notification.success({
                //   message: "Chapter created successfully",
                //   placement: "topRight",
                //   pauseOnHover: false,
                // });
                return { status: true, response: response.data };
            } else {
                notification.error({
                    message: response.data?.message ?? "❌ Failed to create chapter",
                    placement: "topRight",
                    pauseOnHover: false,
                });
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapter:", error);

            if (error.response?.status === 401) {
                notification.error({
                    message: "❌ Unauthorized access - check your token",
                    placement: "topRight",
                    pauseOnHover: false,
                });
            } else {
                notification.error({
                    message: error?.data?.message ?? "❌ Unexpected server error",
                    placement: "topRight",
                    pauseOnHover: false,
                });
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async getAllChapters(input = {}) {
        try {
            console.log("Fetching all chapters...");
            const params = {
                search: input.search || "",
                limit: input.limit || 100,
                sortField: input.sortField,
                sortOrder: input.sortOrder,
                page: input.page || 1,
                ...(input.isActive !== undefined && { isActive: input.isActive })
            };
            const response = await apiClient.get(`/chapters/list`, { params });
            console.log("Response from getAllChapters:", response);
            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch chapters:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapters:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }
    async getZonesByState(input) {
        try {
            const response = await apiClient.get(`/zones/by-state/${input}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching zone:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }
    async getZones(params) {
        try {
            const response = await apiClient.get(`/zones/list`, { params });
            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch zones:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching zones:", error);
            return { status: false, response: error.response?.data ?? null };
        }
    }
    async deleteZone(id) {
        try {
            const response = await apiClient.delete(`/zones/${id}`);
            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to delete zone:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error deleting zone:", error);
            return { status: false, response: error.response?.data ?? null };
        }
    }
    async updateZone(id, input) {
        try {
            const response = await apiClient.put(`/zones/${id}`, input);
            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to update zone:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error updating zone:", error);
            return { status: false, response: error.data ?? error.response?.data ?? null };
        }
    }
    async getChaptersByZone(input) {
        try {
            const zoneId = (input && typeof input === 'object') ? (input._id || null) : input;
            if (!zoneId || zoneId === '[object Object]') {
                console.error("getChaptersByZone called with invalid/empty zoneId:", input);
                return { status: false, response: { data: { success: false, message: "Invalid zone ID" } } };
            }
            const response = await apiClient.get(`/chapters/by-zone/${zoneId}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapter:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }
    async getCidsByZone(input) {
        try {
            const response = await apiClient.get(`/chapters`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapter:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async updateChapterStatus(id, input) {
        try {
            const data = {
                isActive: input.isActive,
                weekday: input.weekday,
                ...(input.mentorId && { mentorId: input.mentorId })
            };
            console.log(data, "ertyuiy345tyu");
            const response = await apiClient.patch(`/chapters/${id}/status`, data);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapter:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }


    async getChaptersById(input) {
        try {
            const response = await apiClient.get(`/chapters/${input}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapter:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async getChapterReport(input) {
        try {
            const response = await apiClient.get(`/chapters/report/chapter-stats`);
            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapter report:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async thankYouSlipList(input) {
        try {
            const response = await apiClient.get('/thankyouslips/list');
            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching thank you slip list:", error);
            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }
            return { status: false, response: error.response?.data ?? null };
        }
    }

    async thankYouSlipListMember(input, query) {
        try {
            const response = await apiClient.get(`/thankyouslips/member/list/${input}`, {
                params: query   // 👈 SEND pagination here
            });

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching thank you slip list member:", error);
            return { status: false, response: error.data ?? null, httpStatus: error.status };
        }
    }

    async refferalList(input) {
        try {
            const response = await apiClient.get('/referralslip/list');

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching refferal list:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async deleteReferralSlipById(referralSlipId) {
        try {
            console.log("Deleting Referral Slip ID:", referralSlipId);

            // Call the backend PATCH endpoint
            const response = await apiClient.patch(`/referralslip/delete/${referralSlipId}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error(
                    "Failed to delete Referral Slip record:",
                    response.data?.message ?? "Something went wrong"
                );
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error deleting Referral Slip record:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async deleteThankYouSlipById(thankYouSlipId) {
        try {
            console.log("Deleting Thank You Slip ID:", thankYouSlipId);

            const response = await apiClient.patch(`/thankyouslips/delete/${thankYouSlipId}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to delete Thank You Slip:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error deleting Thank You Slip:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async deleteTestimonialById(testimonialId) {
        try {
            console.log("Deleting Testimonial ID:", testimonialId);

            // Call the backend PATCH endpoint
            const response = await apiClient.patch(`/testimonialslips/delete/${testimonialId}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error(
                    "Failed to delete Testimonial record:",
                    response.data?.message ?? "Something went wrong"
                );
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error deleting Testimonial record:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async deleteVisitorById(visitorId) {
        try {
            console.log("Deleting Visitor ID:", visitorId);

            // Call the backend PATCH endpoint
            const response = await apiClient.patch(`/visitors/delete/${visitorId}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error(
                    "Failed to delete Visitor record:",
                    response.data?.message ?? "Something went wrong"
                );
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error deleting Visitor record:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }


    async refferalListMember(id, query) {
        try {
            const response = await apiClient.get(`/referralslip/member/list/${id}`, {
                params: query   // 👈 SEND pagination here
            });

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching refferal list member:", error);
            return { status: false, response: error.data ?? null, httpStatus: error.status };
        }
    }

    async testimonialSlipList(input) {
        try {
            const response = await apiClient.get('/testimonialslips/list');

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching testimonial slip list:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async testimonialSlipListMember(id, query) {
        try {
            const response = await apiClient.get(`/testimonialslips/member/list/${id}`, {
                params: query   // 👈 SEND pagination here
            });

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching testimonial slip list member:", error);
            return { status: false, response: error.data ?? null, httpStatus: error.status };
        }
    }

    async visitorsSlipList(input) {
        try {
            const response = await apiClient.get('/visitors/list', { params: input });

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch visitor feedback list:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            // apiClient interceptor transforms axios errors into { status, data, message }
            const httpStatus = error?.status;
            const errorMessage = error?.message || error?.data?.message || 'Unknown error';
            console.error("Error fetching visitors slip list:", httpStatus, errorMessage);

            if (httpStatus === 401) {
                console.error("Unauthorized - admin token expired or invalid. Please re-login.");
            }

            return { status: false, response: error?.data ?? null, httpStatus };
        }
    }



    async visitorsSlipListMember(input, query) {
        try {
            const response = await apiClient.get(`/visitors/member/list/${input}`, {
                params: query   // 👈 SEND pagination here
            });

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching visitors slip list member:", error);
            return { status: false, response: error.data ?? null, httpStatus: error.status };
        }
    }
    async monthlyRevenueBasedonChapter(input) {
        try {
            const response = await apiClient.get(`/thankyouslips/monthlyThankyouslipByChapter/${input}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch monthly revenue based on chapter:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching monthly revenue based on chapter:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }
    async onetooneSlipList() {
        try {
            const response = await apiClient.get('/onetoone/list');

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching one to one slip list:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async onetooneSlipListMember(id, query) {
        try {
            const response = await apiClient.get(`/onetoone/member/list/${id}`, {
                params: query   // 👈 SEND pagination here
            });

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching one to one slip list member:", error);
            return { status: false, response: error.data ?? null, httpStatus: error.status };
        }
    }

    async deleteOneToOneById(oneToOneId) {
        try {
            console.log("ddfdf", oneToOneId);

            const response = await apiClient.patch(`/onetoone/delete/${oneToOneId}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to delete One-to-One record:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error deleting One-to-One record:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async changeStatus(input) {
        try {
            const response = await apiClient.patch(`${input.formName}/status/${input.id}`, { status: input.status });

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapter status:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }
    // getChapterCountById

    async getChapterCountById(input) {
        try {
            const response = await apiClient.get(`/chapters/statsCount/${input}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapter count by id:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }
    async getHeadTableUsersByChapterId(input) {
        try {
            const response = await apiClient.get(`/chapters/headTableUsers/${input}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch head table users by id:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching head table users by id:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async getHeadTableMembersByChapterId(input) {
        try {
            const response = await apiClient.get(`/chapters/headTableMembers/${input}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch head table associates by id:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching head table associates by id:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }
async submitHeadTableRoles(chapterId, payload) {
  try {
    const token = sessionStorage.getItem("authToken"); // OR localStorage

    const response = await apiClient.post(
      `/chapters/headTableMembers/${chapterId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.status === 200 || response.status === 201) {
      return { status: true, message: response.data.message };
    }

    return { status: false, message: response.data.message };

  } catch (error) {
    return {
      status: false,
      message: error.response?.data?.message ?? "Error"
    };
  }
}
    async getTopAchieversById(input) {
        try {
            const response = await apiClient.get(`/chapters/topPerformersofChapter/${input}`);

            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error("Failed to fetch categories:", response.data?.message ?? "Something went wrong");
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error("Error fetching chapter top achievers by id:", error);

            if (error.response && error.response.status === 401) {
                console.error("Unauthorized access - check your token.");
                console.error("Error Response:", error.response.data);
            }

            return { status: false, response: error.response?.data ?? null };
        }
    }

    async getMembersAttendanceCount(memberIds) {
        try {
            console.log(memberIds, "memberId")
            const response = await apiClient.post('/members/meetings-attendance-count', {
                members: memberIds
            });

            if (response.status === 200 || response.status === 201) {
                return { success: true, data: response.data.data };
            } else {
                console.error("Failed to fetch attendance counts:", response.data?.message ?? "Something went wrong");
                return { success: false, data: {} };
            }
        } catch (error) {
            console.error("Error fetching attendance counts:", error);
            return { success: false, data: {} };
        }
    }

    // memberApiProvider.ts
    async getOneToOneCounts(memberIds) {
        try {
            const response = await apiClient.post('/members/one-to-one-count', {
                memberIds,
            });

            if (response.status === 200 || response.status === 201) {
                return { success: true, data: response.data.data };
            } else {
                console.error("Failed to fetch one-to-one counts:", response.data?.message);
                return { success: false, data: {} };
            }
        } catch (error) {
            console.error("Error fetching one-to-one counts:", error);
            return { success: false, data: {} };
        }
    }

    async getOneToOneGivenCounts(memberIds) {
        try {
            const response = await apiClient.post('/members/one-to-one-given-count', {
                memberIds,
            });

            if (response.status === 200 || response.status === 201) {
                return { success: true, data: response.data.data };
            } else {
                console.error("Failed to fetch one-to-one counts:", response.data?.message);
                return { success: false, data: {} };
            }
        } catch (error) {
            console.error("Error fetching one-to-one counts:", error);
            return { success: false, data: {} };
        }
    }


    async getReferralCounts(memberIds) {
        try {
            const response = await apiClient.post('/members/referral-count', {
                memberIds,
            });

            if (response.status === 200 || response.status === 201) {
                return { success: true, data: response.data.data };
            } else {
                console.error("Failed to fetch referral counts:", response.data?.message);
                return { success: false, data: {} };
            }
        } catch (error) {
            console.error("Error fetching referral counts:", error);
            return { success: false, data: {} };
        }
    }

    async getReferralGivenCounts(memberIds) {
        try {
            const response = await apiClient.post('/members/referral-given-count', {
                memberIds,
            });

            if (response.status === 200 || response.status === 201) {
                return { success: true, data: response.data.data };
            } else {
                console.error("Failed to fetch referral counts:", response.data?.message);
                return { success: false, data: {} };
            }
        } catch (error) {
            console.error("Error fetching referral counts:", error);
            return { success: false, data: {} };
        }
    }

    async getThankYouSlipAmounts(memberIds) {
        try {
            const response = await apiClient.post('/members/thank-you-slip-amounts', { memberIds });

            if (response.status === 200 || response.status === 201) {
                return { success: true, data: response.data.data };
            } else {
                console.error("Failed to fetch ThankYouSlip amounts:", response.data?.message);
                return { success: false, data: {} };
            }
        } catch (error) {
            console.error("Error fetching ThankYouSlip amounts:", error);
            return { success: false, data: {} };
        }
    }

    // memberApiProvider.ts
    async getVisitorCounts(memberIds) {
        try {
            const response = await apiClient.post('/members/visitor-count', { memberIds });

            if (response.status === 200 || response.status === 201) {
                return { success: true, data: response.data.data };
            } else {
                console.error("Failed to fetch visitor counts:", response.data?.message);
                return { success: false, data: {} };
            }
        } catch (error) {
            console.error("Error fetching visitor counts:", error);
            return { success: false, data: {} };
        }
    }



    // memberApiProvider.ts
    async getTestimonialCounts(memberIds) {
        try {
            const response = await apiClient.post('/members/testimonial-counts', {
                memberIds,
            });

            if (response.status === 200 || response.status === 201) {
                return { success: true, data: response.data.data };
            } else {
                console.error("Failed to fetch testimonial counts:", response.data?.message);
                return { success: false, data: {} };
            }
        } catch (error) {
            console.error("Error fetching testimonial counts:", error);
            return { success: false, data: {} };
        }
    }

    async getAssociatePerformanceReport(memberIds, associationParams) {
        try {
            const response = await apiClient.post("/period-report/run", {
                memberIds,
                page: associationParams.page,
                limit: associationParams.limit,
            });

            if (response.status === 200 || response.status === 201) {
                return {
                    success: true,
                    data: response.data.data,  // total count from backend
                };
            } else {
                console.error(
                    "Failed to fetch associate performance report:",
                    response.data?.message
                );
                return { success: false, data: [], total: 0 };
            }
        } catch (error) {
            console.error("Error fetching associate performance report:", error);
            return { success: false, data: [], total: 0 };
        }
    }

    // ─── Visitor Feedback (separate collection) ───────────────────────────

    async visitorFeedbackList(input) {
        try {
            const response = await apiClient.get('/visitor-feedbacks/list', { params: input });
            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error('Failed to fetch visitor feedback list:', response.data?.message ?? 'Something went wrong');
                return { status: false, response: response.data };
            }
        } catch (error) {
            const httpStatus = error?.status;
            const errorMessage = error?.message || error?.data?.message || 'Unknown error';
            console.error('Error fetching visitor feedback list:', httpStatus, errorMessage);
            if (httpStatus === 401) {
                console.error('Unauthorized - admin token expired or invalid.');
            }
            return { status: false, response: error?.data ?? null, httpStatus };
        }
    }

    async visitorFeedbackListMember(id, query) {
        try {
            const response = await apiClient.get(`/visitor-feedbacks/member/list/${id}`, {
                params: query,
            });
            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error('Failed to fetch visitor feedback by chapter:', response.data?.message ?? 'Something went wrong');
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error('Error fetching visitor feedback by chapter:', error);
            return { status: false, response: error?.data ?? null, httpStatus: error?.status };
        }
    }

    async deleteVisitorFeedbackById(feedbackId) {
        try {
            console.log('Deleting Visitor Feedback ID:', feedbackId);
            const response = await apiClient.patch(`/visitor-feedbacks/delete/${feedbackId}`);
            if (response.status === 200 || response.status === 201) {
                return { status: true, response: response.data };
            } else {
                console.error('Failed to delete Visitor Feedback record:', response.data?.message ?? 'Something went wrong');
                return { status: false, response: response.data };
            }
        } catch (error) {
            console.error('Error deleting Visitor Feedback record:', error);
            if (error.response && error.response.status === 401) {
                console.error('Unauthorized access - check your token.');
            }
            return { status: false, response: error.response?.data ?? null };
        }
    }
}
const chapterApiProvider = new ChapterApiProvider()
export default chapterApiProvider