"use client";

import React, { useState, FormEvent } from "react";
import Image from "next/image";
import { getSession, signIn } from "next-auth/react";
import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const validationResponse = await fetch("/api/auth/validate-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const validation = await validationResponse.json();
      if (!validationResponse.ok) {
        setError(validation.error ?? "No se pudieron validar las credenciales.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError("El usuario fue validado, pero no se pudo crear la sesión. Reinicia el servidor de desarrollo.");
        setLoading(false);
        return;
      }

      const session = await getSession();
      if (!session?.user) {
        setError("La sesión no pudo recuperarse. Recarga la página e intenta nuevamente.");
        setLoading(false);
        return;
      }
      const destination = session.user.role === "ADMIN" ? "/admin" : session.user.role === "CLIENTE" ? "/cliente" : "/analista";
      window.location.assign(destination);
    } catch {
      setError("No fue posible conectar con el servidor. Verifica XAMPP y reinicia la aplicación.");
      setLoading(false);
    }
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
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
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
                Mantener sesión
              </label>

              <a href="#" className="forgot">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>

            <div className="divider">
              <span>O</span>
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
