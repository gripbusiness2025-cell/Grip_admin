import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import VisitorFeedbackListLayer from "../components/child/VisitorFeedbackListLayer";

const VisitorFeedbackListPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Visitor Feedback List" name="Visitor Feedback" />
      <VisitorFeedbackListLayer />
    </MasterLayout>
  );
};

export default VisitorFeedbackListPage;
