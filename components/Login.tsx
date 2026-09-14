"use client";

import React, { useState, FormEvent } from "react";
import { getSession, signIn } from "next-auth/react";
import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setStatus("Comprobando conexión y credenciales...");

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12_000);
      const validationResponse = await fetch("/api/auth/validate-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const validationText = await validationResponse.text();
      const validation = validationText ? JSON.parse(validationText) as { error?: string } : {};
      if (!validationResponse.ok) {
        setError(validation.error ?? "No se pudieron validar las credenciales.");
        setStatus("");
        setLoading(false);
        return;
      }

      setStatus("Credenciales correctas. Creando sesión segura...");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError(result?.error === "CredentialsSignin" ? "No se pudo crear la sesión. Reinicia el servidor y vuelve a intentarlo." : "El servicio de sesión no respondió correctamente.");
        setStatus("");
        setLoading(false);
        return;
      }

      const session = await getSession();
      if (!session?.user) {
        setError("La sesión no pudo recuperarse. Recarga la página e intenta nuevamente.");
        setStatus("");
        setLoading(false);
        return;
      }
      const destination = session.user.role === "ADMIN" ? "/admin" : session.user.role === "CLIENTE" ? "/cliente" : "/analista";
      window.location.assign(destination);
    } catch (caught) {
      setError(caught instanceof DOMException && caught.name === "AbortError" ? "El servidor tardó demasiado en responder. Verifica MySQL y vuelve a intentarlo." : "No fue posible conectar o interpretar la respuesta del servidor. Verifica XAMPP y reinicia la aplicación.");
      setStatus("");
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

            {status && <p className="login-status" role="status" aria-live="polite">{status}</p>}
            {error && <div className="login-error" role="alert"><strong>No fue posible iniciar sesión</strong><span>{error}</span></div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>

            <p className="login-help">Si olvidaste tu contraseña o tu cuenta está bloqueada, solicita apoyo al administrador.</p>
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
