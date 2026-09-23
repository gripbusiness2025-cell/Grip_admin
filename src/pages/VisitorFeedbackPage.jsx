import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import VisitorFeedbackOverallLayer from "../components/VisitorFeedbackOverallLayer";

const VisitorFeedbackPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Visitor Feedback" name="Visitor Feedback" />
      <VisitorFeedbackOverallLayer />
    </MasterLayout>
  );
};

export default VisitorFeedbackPage;
