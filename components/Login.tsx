"use client";

import React, { useState, FormEvent } from "react";
import Image from "next/image";
import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // La autenticación se conectará al backend en una etapa posterior.

    // Aquí conectarías tu API
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* LEFT PANEL */}
        <div className="login-left">
          <div className="logo">SP</div>

          <h2> Cliente Modelo</h2>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>

              <a href="#" className="forgot">
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="login-btn">
              Login
            </button>

            <div className="divider">
              <span>Or</span>
            </div>

            <div className="social-buttons">
              <button type="button">
                <Image src="/icon/google.png" alt="Google" width={20} height={20} />
              </button>
            </div>

            <p className="register-text">
              Don&apos;t have an account? <a href="#">Create Account</a>
            </p>
          </form>
        </div>

        {/* RIGHT PANEL */}
        <div className="login-right">
          <h1>Portal de Soporte Comercial</h1>
          <p>
            Optimiza la gestión de tickets y mejora la continuidad de tu
            operación.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
