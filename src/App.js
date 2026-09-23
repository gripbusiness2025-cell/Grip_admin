import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import React, { useEffect, useState } from "react";
import userApiProvider from "./apiProvider/userApi";

import EmailPage from "./pages/EmailPage";
import AddUserPage from "./pages/AddUserPage";
import AddPinPage from "./pages/AddPinPage";
import AlertPage from "./pages/AlertPage";
import AssignRolePage from "./pages/AssignRolePage";
import AvatarPage from "./pages/AvatarPage";
import BadgesPage from "./pages/BadgesPage";
import ButtonPage from "./pages/ButtonPage";
import CalendarMainPage from "./pages/CalendarMainPage";
import CardPage from "./pages/CardPage";
import CarouselPage from "./pages/CarouselPage";
import ChatEmptyPage from "./pages/ChatEmptyPage";
import ChatMessagePage from "./pages/ChatMessagePage";
import ChatProfilePage from "./pages/ChatProfilePage";
import CodeGeneratorNewPage from "./pages/CodeGeneratorNewPage";
import CodeGeneratorPage from "./pages/CodeGeneratorPage";
import ColorsPage from "./pages/ColorsPage";
import ColumnChartPage from "./pages/ColumnChartPage";
import CompanyPage from "./pages/CompanyPage";
import CurrenciesPage from "./pages/CurrenciesPage";
import DropdownPage from "./pages/DropdownPage";
import ErrorPage from "./pages/ErrorPage";
import FaqPage from "./pages/FaqPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ForgotPinPage from "./pages/ForgotPinPage";
import FormLayoutPage from "./pages/FormLayoutPage";
import FormValidationPage from "./pages/FormValidationPage";
import FormPage from "./pages/FormPage";
import GalleryPage from "./pages/GalleryPage";
import ImageGeneratorPage from "./pages/ImageGeneratorPage";
import ImageUploadPage from "./pages/ImageUploadPage";
import InvoiceAddPage from "./pages/InvoiceAddPage";
import InvoiceEditPage from "./pages/InvoiceEditPage";
import InvoiceListPage from "./pages/InvoiceListPage";
import InvoicePreviewPage from "./pages/InvoicePreviewPage";
import KanbanPage from "./pages/KanbanPage";
import LanguagePage from "./pages/LanguagePage";
import LineChartPage from "./pages/LineChartPage";
import ListPage from "./pages/ListPage";
import MarketplaceDetailsPage from "./pages/MarketplaceDetailsPage";
import MarketplacePage from "./pages/MarketplacePage";
import NotificationAlertPage from "./pages/NotificationAlertPage";
import NotificationPage from "./pages/NotificationPage";
import PaginationPage from "./pages/PaginationPage";
import PaymentGatewayPage from "./pages/PaymentGatewayPage";
import PieChartPage from "./pages/PieChartPage";
import PortfolioPage from "./pages/PortfolioPage";
import PricingPage from "./pages/PricingPage";
import ProgressPage from "./pages/ProgressPage";
import RadioPage from "./pages/RadioPage";
import RoleAccessPage from "./pages/RoleAccessPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import StarRatingPage from "./pages/StarRatingPage";
import StarredPage from "./pages/StarredPage";
import SwitchPage from "./pages/SwitchPage";
import TableBasicPage from "./pages/TableBasicPage";
import TableDataPage from "./pages/TableDataPage";
import TabsPage from "./pages/TabsPage";
import TagsPage from "./pages/TagsPage";
import TermsConditionPage from "./pages/TermsConditionPage";
import TextGeneratorPage from "./pages/TextGeneratorPage";
import ThemePage from "./pages/ThemePage";
import TooltipPage from "./pages/TooltipPage";
import TypographyPage from "./pages/TypographyPage";
import UsersGridPage from "./pages/UsersGridPage";
import UsersListPage from "./pages/UsersListPage";
import ViewDetailsPage from "./pages/ViewDetailsPage";
import VideoGeneratorPage from "./pages/VideoGeneratorPage";
import VideosPage from "./pages/VideosPage";
import ViewProfilePage from "./pages/ViewProfilePage";
import VoiceGeneratorPage from "./pages/VoiceGeneratorPage";
import WalletPage from "./pages/WalletPage";
import WidgetsPage from "./pages/WidgetsPage";
import WizardPage from "./pages/WizardPage";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import TextGeneratorNewPage from "./pages/TextGeneratorNewPage";
import DashboardPage from "./pages/Dashboard";

import GalleryGridPage from "./pages/GalleryGridPage";
import GalleryMasonryPage from "./pages/GalleryMasonryPage";
import GalleryHoverPage from "./pages/GalleryHoverPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailsPage from "./pages/BlogDetailsPage";
import AddBlogPage from "./pages/AddBlogPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import MaintenancePage from "./pages/MaintenancePage";
import BlankPagePage from "./pages/BlankPagePage";
import MembershipPage from "./pages/MembershipPage";
import MemberListPage from "./pages/MemberListpage";
import RoleListPage from "./pages/RoleListPage";
import PinListPage from "./pages/PinListPage";
import ZoneListPage from "./pages/ZoneListPage";
import AddPinLayer from "./pages/AddPinPage";
import RoleAcessPage from "./pages/RolesAcessPage";
import PrimaryMemberListPage from "./pages/PrimaryMemberListPage";
import AddPrimaryMemberPage from "./pages/AddPrimaryMemberPage";
import ChapterwisePage from "./pages/ChapterwisePage";
import ChapterpinPage from "./pages/ChapterpinPage";
import OnetoOnePage from "./pages/OnetoOnePage";
import ChapterOnePage from "./pages/chapterOnePage";
import ChapterViewPage from "./pages/ChapterViewPage";
import ReferralListPage from "./pages/ReferralListPage";
import VisitorsListPage from "./pages/VisitorsListPage";
import ExpectedVisitorsListPage from "./pages/ExpectedVisitorsListPage";
import PowerDatePage from "./pages/PowerDatePage";
import ThankyouNotePage from "./pages/ThankyouNotePage";
import TestimonialPage from "./pages/TestimonialPage";
import ReferralOverallpage from "./pages/ReferralOverallPage";
import ThankyouOverallPage from "./pages/ThankyouOverallPage";
import TestimonialOverallPage from "./pages/TestimonialOverallPage";
import VisitorOverallpage from "./pages/VisitorOverallpage";
import ExpectedVisitorsOverallPage from "./pages/ExpectedVisitorsOverallpage";
import EnquiryListPage from "./pages/EnquiryListPage";

import OnetoOneAnalyticsPage from "./pages/OnetoOneAnalyticsPage";
import ReferralAnalyticsPage from "./pages/ReferralAnalyticsPage";
import ThankyouAnalyticsPage from "./pages/ThankyouAnalyticsPage";
import TestimonialAnalyticsPage from "./pages/TestimonialAnalyticsPage";
import VisitorAnalyticsPage from "./pages/VisitorAnalyticsPage";
import ExpectedVisitorsAnalyticsPage from "./pages/ExpectedVisitorsAnalyticsPage";
import PaymentListPage from "./pages/PaymentListPage";
import TransactionListPage from "./pages/TransactionListPage";
import UserRegisterMemberListLayer from "./pages/UserRegisterlistPage";
import { setCurrentUser } from "./utils/auth";
import AttedenceListPage from "./pages/AttedenceListPage";
import AttedenseMemberListPage from "./pages/AttedenceMemberPage";
import ProtectedRoute from "./utils/ProtectedRoute";
import TrainingListPage from "./pages/TrainingPage";
import MemberSixMonthReport from "./components/AssociatePerformanceReport";
import AccessRequestsPage from "./pages/AccessRequestsPage";
import OnboardingListPage from "./pages/OnboardingListPage";
import WebsitePage from "./pages/WebsitePage";
import WebsiteEditPage from "./pages/WebsiteEditPage";
import WebsiteEventsPage from "./pages/WebsiteEventsPage";
import VisitorFeedbackPage from "./pages/VisitorFeedbackPage";
import VisitorFeedbackListPage from "./pages/VisitorFeedbackListPage";


function App() {
  // Initialize auth state from sessionStorage so we know the value during the first render
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = sessionStorage.getItem("authToken");
    return !!token;
  });

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    console.log(token, "tttttttttt");

    setIsAuthenticated(!!token);
  }, []);

  console.log(isAuthenticated, "isAuthenticated");

  useEffect(() => {
    const fetchUserOnLoad = async () => {
      const userDataFromStorage = sessionStorage.getItem("userData");
      if (userDataFromStorage) {
        try {
          const user = JSON.parse(userDataFromStorage);
          if (user && user.role === 'zone-admin') {
            // Zone admins don't exist in the users table, so we restore session directly
            setCurrentUser({ data: user });
          } else if (user && user.id) {
            const response = await userApiProvider.getUserById(user.id);
            if (response.status) {
              setCurrentUser(response.response);
            }
          }
        } catch (error) {
          console.error(
            "Failed to refresh user data on application load:",
            error
          );
        }
      }
    };

    fetchUserOnLoad();
  }, []);

  return (
    <BrowserRouter>
      <RouteScrollToTop />
      <Routes>
        <Route
          path="/sign-in"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <SignInPage />
          }
        />
        <Route
          exact
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          exact
          path="/forgot-pin"
          element={<ForgotPinPage />}
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <DashboardPage /> : <Navigate to="/sign-in" />
          }
        />
        {/* <Route exact path='/index-8' element={<HomePageOne />} />
        <Route exact path='/index-2' element={<HomePageTwo />} />
        <Route exact path='/index-3' element={<HomePageThree />} />
        <Route exact path='/index-4' element={<HomePageFour />} />
        <Route exact path='/index-5' element={<HomePageFive />} />
        <Route exact path='/index-6' element={<HomePageSix />} />
        <Route exact path='/index-7' element={<HomePageSeven />} />
        <Route exact path='/index-9' element={<HomePageNine />} />
        <Route exact path='/index-10' element={<HomePageTen />} />
        <Route exact path='/index-11' element={<HomePageEleven />} /> */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route exact path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/"
            element={
              <Navigate
                to={isAuthenticated ? "/dashboard" : "/sign-in"}
                replace
              />
            }
          />
          <Route
            exact
            path="/add-primarymember"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="panel-associate-list"><AddPrimaryMemberPage /></ProtectedRoute>}
          />
          <Route
            exact
            path="/edit-primarymember/:id"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="panel-associate-list"><AddPrimaryMemberPage /></ProtectedRoute>}
          />

          <Route exact path="/chapterwise" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="chapters-list"><ChapterwisePage /></ProtectedRoute>} />
          <Route exact path="/chapterpin" element={<ChapterpinPage />} />

          <Route
            exact
            path="/chapter-view/:id?"
            element={<ChapterViewPage />}
          />
          <Route exact path="/chapter-view" element={<ChapterViewPage />} />

          <Route
            exact
            path="/referral-list/:id?"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="referrals-list"><ReferralListPage /></ProtectedRoute>}
          />

          <Route
            exact
            path="/transaction-list/:id?"
            element={<TransactionListPage />}
          />
          <Route
            exact
            path="/attedense-list/:id?"
            element={<AttedenseMemberListPage />}
          />

          <Route
            exact
            path="/visitors-list/:id?"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="visitor-guest-list"><VisitorsListPage /></ProtectedRoute>}
          />

          <Route exact path="/powerdate" element={<PowerDatePage />} />

          <Route exact path="/members-grid" element={<UsersGridPage />} />

          <Route
            exact
            path="/thankyou-slip/:id?"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="thank-you-slip-list"><ThankyouNotePage /></ProtectedRoute>}
          />

          <Route exact path="/121-list" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="121s-list"><OnetoOnePage /></ProtectedRoute>} />
          <Route exact path="/121-analytics/:chapterId?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="121s-list"><OnetoOneAnalyticsPage /></ProtectedRoute>} />

          <Route exact path="/referral" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="referrals-list"><ReferralOverallpage /></ProtectedRoute>} />
          <Route exact path="/referral-analytics/:chapterId?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="referrals-list"><ReferralAnalyticsPage /></ProtectedRoute>} />

          <Route exact path="/enquiries" element={<EnquiryListPage />} />

          <Route exact path="/thankyou" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="thank-you-slip-list"><ThankyouOverallPage /></ProtectedRoute>} />
          <Route exact path="/thankyou-analytics/:chapterId?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="thank-you-slip-list"><ThankyouAnalyticsPage /></ProtectedRoute>} />

          <Route exact path="/associate/:id/report" element={<MemberSixMonthReport />} />


          <Route
            exact
            path="/chapterone-list/:id?"
            element={<ChapterOnePage />}
          />

          <Route
            exact
            path="/testimonial-list/:id?"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="testimonial-list"><TestimonialPage /></ProtectedRoute>}
          />

          <Route exact path="/visitor" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="visitor-guest-list"><VisitorOverallpage /></ProtectedRoute>} />
          <Route exact path="/visitor-analytics/:chapterId?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="visitor-guest-list"><VisitorAnalyticsPage /></ProtectedRoute>} />
          <Route exact path="/visitor-feedback" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="visitor-guest-list"><VisitorFeedbackPage /></ProtectedRoute>} />
          <Route exact path="/visitor-feedback-list/:id?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="visitor-guest-list"><VisitorFeedbackListPage /></ProtectedRoute>} />
          
          <Route exact path="/expected-visitors" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="expected-visitors-list"><ExpectedVisitorsOverallPage /></ProtectedRoute>} />
          <Route exact path="/expected-visitors-analytics/:chapterId?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="expected-visitors-list"><ExpectedVisitorsAnalyticsPage /></ProtectedRoute>} />
          
          <Route
            exact
            path="/expected-visitors/:chapterId"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="expected-visitors-list"><ExpectedVisitorsListPage /></ProtectedRoute>}
          />


          <Route
            exact
            path="/testimoniall"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="testimonial-list"><TestimonialOverallPage /></ProtectedRoute>}
          />
          <Route exact path="/testimonial-analytics/:chapterId?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="testimonial-list"><TestimonialAnalyticsPage /></ProtectedRoute>} />

          <Route exact path="/member-list/:id?" element={<MemberListPage />} />
          <Route
            exact
            path="/user-member-list"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="associates-list"><UserRegisterMemberListLayer /></ProtectedRoute>}
          />

          <Route
            exact
            path="/primarymember-list"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="panel-associate-list"><PrimaryMemberListPage /></ProtectedRoute>}
          />

          <Route exact path="/payment-list" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="meeting-list"><PaymentListPage /></ProtectedRoute>} />
          <Route exact path="/attedence-list" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="events-list"><AttedenceListPage /></ProtectedRoute>} />
          <Route exact path="/training-list" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="training-list"><TrainingListPage /></ProtectedRoute>} />
          <Route exact path="/onboarding-list" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="onboarding-form-list"><OnboardingListPage /></ProtectedRoute>} />

          <Route
            exact
            path="/primarymember-list"
            element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="panel-associate-list"><PrimaryMemberListPage /></ProtectedRoute>}
          />

          <Route exact path="/roles-list" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="roles-list"><RoleListPage /></ProtectedRoute>} />
          <Route exact path="/access-requests" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="roles-list"><AccessRequestsPage /></ProtectedRoute>} />

          {/* ✅ Pin list page */}
          <Route path="/pin-list" element={<PinListPage />} />

          {/* ✅ Zone list page */}
          <Route path="/zone-list" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="chapters-list"><ZoneListPage /></ProtectedRoute>} />

          {/* ✅ Add new pin */}
          <Route path="/pins/add" element={<AddPinLayer />} />

          {/* ✅ Edit pin */}
          <Route path="/pins/edit/:id" element={<AddPinLayer />} />

          {/* existing routes */}
          <Route exact path="/roles-access/:id?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="roles-list"><RoleAcessPage /></ProtectedRoute>} />

          <Route exact path="/roles-access/:id?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="roles-list"><RoleAcessPage /></ProtectedRoute>} />

          {/* SL */}
          <Route exact path="/add-user/:id?" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="admin-users-list"><AddUserPage /></ProtectedRoute>} />
          <Route exact path="/add-pin/:id?" element={<AddPinPage />} />
          <Route exact path="/alert" element={<AlertPage />} />
          <Route exact path="/assign-role" element={<AssignRolePage />} />
          <Route exact path="/avatar" element={<AvatarPage />} />
          <Route exact path="/badges" element={<BadgesPage />} />
          <Route exact path="/button" element={<ButtonPage />} />
          <Route exact path="/calendar-main" element={<CalendarMainPage />} />
          <Route exact path="/calendar" element={<CalendarMainPage />} />
          <Route exact path="/card" element={<CardPage />} />
          <Route exact path="/carousel" element={<CarouselPage />} />
          <Route exact path="/chat-empty" element={<ChatEmptyPage />} />
          <Route exact path="/chat-message" element={<ChatMessagePage />} />
          <Route exact path="/chat-profile" element={<ChatProfilePage />} />
          <Route exact path="/code-generator" element={<CodeGeneratorPage />} />
          <Route
            exact
            path="/code-generator-new"
            element={<CodeGeneratorNewPage />}
          />
          <Route exact path="/colors" element={<ColorsPage />} />
          <Route exact path="/column-chart" element={<ColumnChartPage />} />
          <Route exact path="/company" element={<CompanyPage />} />
          <Route exact path="/currencies" element={<CurrenciesPage />} />
          <Route exact path="/dropdown" element={<DropdownPage />} />
          <Route exact path="/email" element={<EmailPage />} />
          <Route exact path="/faq" element={<FaqPage />} />

          <Route exact path="/form-layout" element={<FormLayoutPage />} />
          <Route
            exact
            path="/add-member/:id?"
            element={<FormValidationPage />}
          />
          <Route exact path="/form" element={<FormPage />} />

          <Route exact path="/gallery" element={<GalleryPage />} />
          <Route exact path="/gallery-grid" element={<GalleryGridPage />} />
          <Route
            exact
            path="/gallery-masonry"
            element={<GalleryMasonryPage />}
          />
          <Route exact path="/gallery-hover" element={<GalleryHoverPage />} />

          <Route exact path="/blog" element={<BlogPage />} />
          <Route exact path="/blog-details" element={<BlogDetailsPage />} />
          <Route exact path="/add-blog" element={<AddBlogPage />} />

          <Route exact path="/testimonials" element={<TestimonialsPage />} />
          <Route exact path="/coming-soon" element={<ComingSoonPage />} />
          <Route exact path="/access-denied" element={<AccessDeniedPage />} />
          <Route exact path="/maintenance" element={<MaintenancePage />} />
          <Route exact path="/blank-page" element={<BlankPagePage />} />

          <Route
            exact
            path="/image-generator"
            element={<ImageGeneratorPage />}
          />
          <Route exact path="/image-upload" element={<ImageUploadPage />} />
          <Route exact path="/invoice-add" element={<InvoiceAddPage />} />
          <Route exact path="/invoice-edit" element={<InvoiceEditPage />} />
          <Route exact path="/invoice-list" element={<InvoiceListPage />} />
          <Route
            exact
            path="/invoice-preview"
            element={<InvoicePreviewPage />}
          />
          <Route exact path="/kanban" element={<KanbanPage />} />
          <Route exact path="/language" element={<LanguagePage />} />
          <Route exact path="/line-chart" element={<LineChartPage />} />
          <Route exact path="/list" element={<ListPage />} />
          <Route
            exact
            path="/marketplace-details"
            element={<MarketplaceDetailsPage />}
          />
          <Route exact path="/marketplace" element={<MarketplacePage />} />
          <Route
            exact
            path="/notification-alert"
            element={<NotificationAlertPage />}
          />
          <Route exact path="/notification" element={<NotificationPage />} />
          <Route exact path="/pagination" element={<PaginationPage />} />
          <Route
            exact
            path="/payment-gateway"
            element={<PaymentGatewayPage />}
          />
          <Route exact path="/pie-chart" element={<PieChartPage />} />
          <Route exact path="/portfolio" element={<PortfolioPage />} />
          <Route exact path="/pricing" element={<PricingPage />} />
          <Route exact path="/progress" element={<ProgressPage />} />
          <Route exact path="/radio" element={<RadioPage />} />
          <Route exact path="/chapter" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="chapters-list"><RoleAccessPage /></ProtectedRoute>} />
          <Route exact path="/chapter/zone/:zoneId" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="chapters-list"><RoleAccessPage /></ProtectedRoute>} />
          <Route exact path="/sign-in" element={<SignInPage />} />
          <Route exact path="/sign-up" element={<SignUpPage />} />
          <Route
            exact
            path="/membership-application"
            element={<MembershipPage />}
          />
          <Route exact path="/star-rating" element={<StarRatingPage />} />
          <Route exact path="/starred" element={<StarredPage />} />
          <Route exact path="/switch" element={<SwitchPage />} />
          <Route exact path="/table-basic" element={<TableBasicPage />} />
          <Route exact path="/table-data" element={<TableDataPage />} />
          <Route exact path="/tabs" element={<TabsPage />} />
          <Route exact path="/tags" element={<TagsPage />} />
          <Route
            exact
            path="/terms-condition"
            element={<TermsConditionPage />}
          />
          <Route
            exact
            path="/text-generator-new"
            element={<TextGeneratorNewPage />}
          />
          <Route exact path="/text-generator" element={<TextGeneratorPage />} />
          <Route exact path="/theme" element={<ThemePage />} />
          <Route exact path="/tooltip" element={<TooltipPage />} />
          <Route exact path="/typography" element={<TypographyPage />} />

          <Route exact path="/users-list" element={<ProtectedRoute isAuthenticated={isAuthenticated} permission="admin-users-list"><UsersListPage /></ProtectedRoute>} />
          <Route exact path="/view-details" element={<ViewDetailsPage />} />
          <Route
            exact
            path="/video-generator"
            element={<VideoGeneratorPage />}
          />
          <Route exact path="/videos" element={<VideosPage />} />
          <Route exact path="/view-profile" element={<ViewProfilePage />} />
          <Route
            exact
            path="/voice-generator"
            element={<VoiceGeneratorPage />}
          />
          <Route exact path="/wallet" element={<WalletPage />} />
          <Route exact path="/widgets" element={<WidgetsPage />} />
          <Route exact path="/wizard" element={<WizardPage />} />

          <Route exact path="/website" element={<WebsitePage />} />
          <Route exact path="/website-edit/:chapterId" element={<WebsiteEditPage />} />
          <Route exact path="/website-events" element={<WebsiteEventsPage />} />
          <Route exact path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
