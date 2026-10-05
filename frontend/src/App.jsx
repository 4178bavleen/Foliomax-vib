// src/App.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import HowItWorks from './pages/HowItWorks'
import Blog from './pages/Blog'
import ContactUs from './pages/ContactUs'
import Faq from './pages/Faq'
import MakeItPlayful from './pages/MakeItPlayful'
import Foliopool from './pages/Foliopool'
import Subscription from './pages/Subscription'
import FinancialFundamental from './pages/FinancialFundamentals'
import KnowYourControls from './pages/KnowYourControls'
import Quiz from './pages/Quiz'
import Privacy from './pages/Privacy'
import TermsAndCond from './pages/TermsAndCond'
import Calculator from './pages/Calculators'
import KnowYourCom from './pages/KnowYourCom'
import LearnWithUs from "./pages/LearnWithUs";
import Login from './pages/customer/auth/Login'
import Signup from './pages/customer/auth/SignUp'
import VerifyEmail from './pages/customer/auth/VerifyEmail'
import ForgotPassword from './pages/customer/auth/ForgotPassword'
import ResetPassword from './pages/customer/auth/ResetPassword'

import CustomerLayout from './layouts/CustomerLayout'
import Dashboard from './pages/customer/Dashboard'

import ProtectedRoute from "./utils/ProtectedRoute"; 
import Profile from './pages/customer/Profile/Profile'
import Taper from './pages/taper'
import RetirementCalculator from './components/RetirementCalculator/RetirementCalc'
import ETFMutualFund from './pages/ETF&MutualFund'
import DetailedBlog from './pages/DetailedBlog'
import ExcelViewer from './pages/ExcelViewer';
import Transaction from './pages/customer/Transactions/Transactions';

function App() {
  return (
    <Router>
      <Routes>

        {/*  Public Website with MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/folio-data-pool" element={<Foliopool />} />
          <Route path="/etf-mutual-insights" element={<ETFMutualFund/>} />
          <Route path="/calculators" element={<Calculator />} />
          <Route path="/retirement-calculator" element={<RetirementCalculator/>} />
          <Route path="/know-your-company" element={<KnowYourCom />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/detailed-blog/:id" element={<DetailedBlog />} />
          <Route path="/faqs" element={<Faq />} />
          <Route path="/financial-fundamentals" element={<FinancialFundamental />} />
          <Route path="/kyc" element={<KnowYourControls />} />
          <Route path="/make-it-playful" element={<MakeItPlayful />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms-conditions" element={<TermsAndCond />} />
          <Route path="/learn-with-us" element={<LearnWithUs />} />
          <Route path="/excel/:id" element={<ExcelViewer />} />
        </Route>

        {/*  Auth pages WITHOUT MainLayout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/taper" element={<Taper/>} />

        {/*  Customer area WITHOUT MainLayout */}
      <Route element={<ProtectedRoute />}></Route>  
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile/>}/>
          <Route path="transactions" element={<Transaction/>}/>
        </Route>
        
      <Route/>
      </Routes>
    </Router>
  )
}

export default App
