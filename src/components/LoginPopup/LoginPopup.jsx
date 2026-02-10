import React, { useContext, useState } from "react";
import axios from "axios";
import "./LoginPopup.css";
import { API_BASE_URL } from "../../config.js";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const LoginPopup = ({ setShowLogin }) => {
  const { setToken, setUserType, loadCartData, setUserId } =
    useContext(StoreContext);

  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [loginRole, setLoginRole] = useState("user");

  const [showPassword, setShowPassword] = useState(false);

  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    userId: "",
  });

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let endpoint = "";
    let body = {};

    // --- ADMIN LOGIN ---
    if (loginRole === "admin") {
      if (!data.userId || !data.password)
        return toast.error("Admin ID and password required");

      endpoint = `${API_BASE_URL}/admin/login`;
      body = {
        userId: data.userId.trim(),
        password: data.password,
      };
    } else {
      // --- USER LOGIN ---
      if (mode === "login") {
        if (!data.email || !data.password)
          return toast.error("Email and password required");

        endpoint = `${API_BASE_URL}/user/login`;
        body = {
          email: data.email.trim(),
          password: data.password,
        };
      } else {
        // --- USER SIGNUP ---
        if (!data.username || !data.email || !data.password)
          return toast.error("All fields are required");

        endpoint = `${API_BASE_URL}/user/register`;
        body = {
          username: data.username.trim(),
          email: data.email.trim(),
          password: data.password,
          role: "user",
        };
      }
    }

    try {
      const res = await axios.post(endpoint, body, { withCredentials: true });

      if (!res.data?.success)
        return toast.error(res.data?.message || "Authentication failed");

      const payload = res.data.data || {};

      // Signup completed — switch to login
      if (loginRole === "user" && mode === "signup") {
        toast.success("Registration successful. Please login.");
        setMode("login");
        return;
      }

      const token = payload.accessToken || payload.token;
      if (!token) return toast.error("Authentication token missing");

      const role = payload.role || loginRole;

      setToken(token);
      setUserType(role);

      localStorage.setItem("token", token);
      localStorage.setItem("userType", role);

      if (payload._id) {
        setUserId(payload._id);
        localStorage.setItem("userId", payload._id);
      }

      if (role === "user") {
        await loadCartData(token);
      }

      toast.success("Login successful");
      setShowLogin(false);

      navigate(role === "admin" ? "/admin/dashboard" : "/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-popup">
      <div className="login-popup-container">
        <button className="close-btn" onClick={() => setShowLogin(false)}>
          ×
        </button>

        <h2>
          {mode === "login" ? "Login" : "Create Account"} ({loginRole})
        </h2>

        <form onSubmit={handleSubmit} className="login-form">
          {loginRole === "admin" ? (
            <>
              <input
                type="text"
                name="userId"
                value={data.userId}
                onChange={handleChange}
                placeholder="Admin User ID"
                required
              />

              {/* Password Field */}
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={data.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </>
          ) : (
            <>
              {mode === "signup" && (
                <input
                  type="text"
                  name="username"
                  value={data.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                />
              )}

              <input
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="Email"
                required
              />

              {/* Password Field */}
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={data.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    //Eye Closed Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5.52 0-10-4-10-8 0-1.61.5-3.11 1.36-4.36" />
                      <path d="M6.1 6.1A9.88 9.88 0 0 1 12 4c5.52 0 10 4 10 8 0 1.61-.5 3.11-1.36 4.36" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </span>
              </div>
            </>
          )}

          <button type="submit" className="btn-submit">
            {mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* USER MODE TOGGLE */}
        {loginRole === "user" && (
          <p className="toggle-text">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <span onClick={() => setMode("signup")}>Sign up</span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span onClick={() => setMode("login")}>Login</span>
              </>
            )}
          </p>
        )}

        {/* ROLE SWITCH */}
        <p className="toggle-text">
          {loginRole === "user" ? (
            <>
              Are you an Admin?{" "}
              <span onClick={() => setLoginRole("admin")}>Login here</span>
            </>
          ) : (
            <>
              Are you a User?{" "}
              <span onClick={() => setLoginRole("user")}>Login here</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default LoginPopup;
