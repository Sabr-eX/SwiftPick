import "./App.css";
import React from "react";
import { Routes, Route } from "react-router-dom";
import SingUp from "./Components/SingUp";
import Login from "./Components/Login";
import ForgotPassword from "./Components/ForgotPassword";
import ViewAllRequests from "./Components/ViewAllRequests";
import ResetPassword from "./Components/ResetPassword";
import Dashboard from "./Components/Dashboard";
import AdminLogin from "./Components/AdminLogin"
import ViewAllLocations from "./Components/Admin/ViewAllLocations";
import PostNewRequest from "./Components/PostNewRequest";
import { useSelector } from "react-redux";
import Header from "./Components/Header";


const App = () => {
  const isLoggedIn = useSelector((state) => state.isLoggedIn);
  // console.log(isLoggedIn);
  return (
    <React.Fragment>
      <header>
        <Header />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/auth/signup" element={<SingUp />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/adminLogin" element={<AdminLogin />} />
          <Route path="/auth/forgotPassword" element={<ForgotPassword />} />
          <Route path="/auth/resetPassword/:token" element={<ResetPassword />} />
          {isLoggedIn && <Route path="/dashboard" element={<Dashboard />} />}
          {isLoggedIn && <Route path="/requests" element={<ViewAllRequests />} />}
          <Route path="/admin/locations" element={<ViewAllLocations />} />
        </Routes>
      </main>
    </React.Fragment>
  );
};

export default App;
