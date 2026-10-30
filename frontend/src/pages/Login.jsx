
import { useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserRound, LockKeyhole, Mail, ArrowRight } from "lucide-react";

const API_URL = "http://localhost:8080/api/auth";
const EMPTY_FORM = { name: "", email: "", password: "" };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleMode() {
    setIsRegister((prev) => !prev);
    setMessage("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "register" : "login";
      const payload = {
        email: form.email.trim(),
        password: form.password,
        ...(isRegister && { name: form.name.trim() }),
      };

      const response = await axios.post(`${API_URL}/${endpoint}`, payload);

      if (isRegister) {
        setIsRegister(false);
        setForm({ ...EMPTY_FORM, email: form.email.trim() });
        setMessage("Registration successful! Please login.");
        return;
      }

      const user = response.data;

      if (!user || user.id == null) {
        setError("Login response is missing user ID.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("userLogin"));
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      const data = err.response?.data;

      setError(
        !isRegister && err.response?.status === 404
          ? "Please register first, then login."
          : typeof data === "string"
            ? data
            : data?.message ||
              data?.detail ||
              (isRegister
                ? "Registration failed. Please try again."
                : "Invalid email or password. Please register if you are new.")
      );
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    ...(isRegister ? [{ name: "name", label: "Full Name", icon: UserRound, type: "text" }] : []),
    { name: "email", label: "Email Address", icon: Mail, type: "email" },
    { name: "password", label: "Password", icon: LockKeyhole, type: "password" },
  ];

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          ⚽ Turf<span>Zone</span>
        </Link>

        <h1>{isRegister ? "Create Account" : "Welcome Back!"}</h1>
        <p className="auth-description">
          {isRegister
            ? "Register to book your favourite turf."
            : "Login to manage your turf bookings."}
        </p>

        {message && <p role="status" className="auth-success">{message}</p>}

        {error && (
          <p role="alert" className="auth-error">
            {error}{" "}
            {!isRegister && (
              <button type="button" onClick={toggleMode}>Register</button>
            )}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {fields.map(({ name, label, icon: Icon, type }) => (
            <div className="auth-field" key={name}>
              <label htmlFor={name}>{label}</label>
              <div className="auth-input-wrap">
                <Icon size={18} />
                <input
                  id={name}
                  name={name}
                  type={type}
                  placeholder={`Enter your ${name === "name" ? "full name" : name}`}
                  value={form[name]}
                  onChange={handleChange}
                  autoComplete={
                    name === "name"
                      ? "name"
                      : name === "password"
                        ? isRegister ? "new-password" : "current-password"
                        : "email"
                  }
                  minLength={name === "password" ? 8 : undefined}
                  required
                />
              </div>
            </div>
          ))}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Login"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button type="button" onClick={toggleMode}>
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </section>
    </main>
  );
}
