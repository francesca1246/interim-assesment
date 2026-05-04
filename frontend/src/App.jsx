import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import PrivateRoute from "./components/PrivateRoute";
import Header from "./components/header";
import Footer from "./components/footer";

import HeroSection from "./components/sections/HeroSection";
import ExploreCryptoSection from "./components/sections/ExploreCryptoSection";
import AdvancedTraderSection from "./components/sections/AdvancedTraderSection";
import BaseAppSection from "./components/sections/BaseAppSection";
import LearnSection from "./components/sections/LearnSection";
import TakeControlSection from "./components/sections/TakeControlSection";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AccountTypeSelect from "./pages/AccountTypeSelect";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyCode from "./pages/VerifyCode";
import ExplorePage from "./pages/ExplorePage";
import MarketStatsPage from "./pages/MarketStatsPage";
import LearnPage from "./pages/LearnPage";
import CryptoBasicsPage from "./pages/CryptoBasicsPage";
import Dashboard from "./pages/Dashboard";

import Loader from "./loader";

const GuestRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loader />;

  return user ? <Navigate to="/dashboard" replace /> : children;
};

const Home = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <HeroSection />
      <ExploreCryptoSection />
      <AdvancedTraderSection />
      <BaseAppSection />
      <LearnSection />
      <TakeControlSection />
    </main>
    <Footer />
  </div>
);

const AppRoutes = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/market-stats" element={<MarketStatsPage />} />
      <Route path="/signin" element={<GuestRoute><SignIn /></GuestRoute>} />
      <Route path="/account-type" element={<GuestRoute><AccountTypeSelect /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignUp /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/verify" element={<GuestRoute><VerifyCode /></GuestRoute>} />
      <Route path="/learn" element={<LearnPage />} />
      <Route path="/learn/crypto-basics" element={<CryptoBasicsPage />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;