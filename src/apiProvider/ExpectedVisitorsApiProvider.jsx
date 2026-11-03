import apiClient from "../network/apiClient";

class ExpectedVisitorsApiProvider {

  // ✅ 1. Get ALL expected visitors (no ID)
  async getExpectedVisitorsList(params = {}) {
    try {
      const token = localStorage.getItem("userToken");

      const response = await apiClient.get("/expectedvisitors", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        return { status: true, response: response.data };
      } else {
        return { status: false, response: response.data };
      }
    } catch (error) {
      console.error("Error fetching expected visitors list:", error);
      return { status: false, response: error.response?.data ?? null };
    }
  }

  // ✅ 2. Get expected visitors by chapter/member ID
  async getExpectedVisitorsById(id, params = {}) {
    try {
      const token = localStorage.getItem("userToken");

      const response = await apiClient.get(`/expectedvisitors/${id}`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        return { status: true, response: response.data };
      } else {
        return { status: false, response: response.data };
      }
    } catch (error) {
      console.error("Error fetching expected visitors by id:", error);
      return { status: false, response: error.data ?? null, httpStatus: error.status };
    }
  }

  // 3. Soft Delete Expected Visitor
async deleteExpectedVisitor(id) {
  try {
    const token = localStorage.getItem("userToken");

    const response = await apiClient.delete(
      `/expectedvisitors/delete/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      return { status: true, response: response.data };
    } else {
      return { status: false, response: response.data };
    }
  } catch (error) {
    console.error("Error deleting visitor:", error);
    return { status: false, response: error.response?.data ?? null };
  }
}

  async updateExpectedVisitor(id, data) {
    try {
      const response = await apiClient.put(`/expectedvisitors/${id}`, data);
      if (response.status === 200 || response.status === 201) {
        return { status: true, response: response.data };
      } else {
        return { status: false, response: response.data };
      }
    } catch (error) {
      console.error("Error updating expected visitor:", error);
      return { status: false, response: error.response?.data ?? null };
    }
  }

}


export default new ExpectedVisitorsApiProvider();
