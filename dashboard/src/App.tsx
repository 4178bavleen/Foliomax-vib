import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./layout/ProtectedRoute";

import AppLayout from "./layout/AppLayout";
import Home from "./pages/Dashboard/Home";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import ManagePlanTable from "./pages/KYC/ManagePlan.jsx";
import ManageCategories from "./pages/ManageCategories/ManageCategories.jsx";
import Settings from "./pages/Settings/Settings";
import ExcelUploadPage from "./pages/ExcelUpload/Excel";
import AddCompany from "./pages/Quiz/AddCompany.js";
import AddQuiz from "./pages/Quiz/AddQuiz.js";
import AllQuizzes from "./pages/Quiz/AllQuizzes.js";
import VideoUploadPage from "./pages/VideoUpload/VideoUpload";
import WordUploadPage from "./pages/WordUpload/Word.js";
import Faq from "./pages/Faq/Faq.js";
import CustomerMessage from "./pages/CustomerMessage/CustomerMessage.js";
import SiteContent from "./pages/SiteContent/SiteContent.js";
import AddCategory from "./pages/Blog/AddCategory.js";
import AddBlog from "./pages/Blog/AddBlog.js";
import AllBlogs from "./pages/Blog/AllBlog.js";
import AddInsightCategory from "./pages/ETF&Mutual/AddInsightCategory.jsx";
import AddInsight from "./pages/ETF&Mutual/AddInsights.jsx";
import AllInsights from "./pages/ETF&Mutual/AllInsights.jsx";
import PdfUploadPage from "./pages/PdfUpload/PdfUpload.js";
import Subscriptions from "./pages/Subscription/Subscriptions.jsx";
import PdfUploadSubscriptionPage from "./pages/Subscription/PdfUploadSubscriptionPage.jsx";

export default function App() {
  
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Protected dashboard layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            
            <Route index  element={<Home />} />
            <Route path="/kyc" element={<ManagePlanTable />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/excel-upload" element={<ExcelUploadPage/>} />
            <Route path="/video-upload" element={<VideoUploadPage/>} />
            <Route path="/pdf-upload" element={<PdfUploadPage/>}/>
           {/* Quiz Routes */}
            <Route path="/add-company" element={<AddCompany/>}/>
            <Route path="/add-quiz" element={<AddQuiz/>}/>
            <Route path="/all-quiz" element={<AllQuizzes/>}/>
             
            <Route path="/add-blog-category" element={<AddCategory/>}/>
            <Route path="/add-blog" element={<AddBlog/>}/>
            <Route path="/all-blog" element={<AllBlogs/>}/>
 
            <Route path="/add-insights-category" element={<AddInsightCategory/>}/>
            <Route path="/add-insights" element={<AddInsight/>}/>
            <Route path="/all-insights" element={<AllInsights/>}/>

            <Route path="/word-upload" element={<WordUploadPage/>} />
            <Route path="/add-faq" element={<Faq/>}/>

            <Route path="/subscriptions" element={<Subscriptions/>}/>
            <Route path="/subs-pdf-upload" element={<PdfUploadSubscriptionPage/>}/>
            <Route path="/site-content" element={<SiteContent/>}/>
            <Route path="/customer-message" element={<CustomerMessage/>}/>
            <Route path="/manage-category" element={<ManageCategories />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Public auth routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
