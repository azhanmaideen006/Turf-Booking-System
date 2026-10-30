
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  CalendarDays, Clock, MapPin, ArrowRight,
  ClipboardList, XCircle, LoaderCircle
} from "lucide-react";

const API = "http://localhost:8080";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=600&q=80";

function formatTime(time) {
  if (!time) return "-";
  const [h, m] = time.split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function formatDate(date) {
  return date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      })
    : "-";
}

function getErrorMessage(err) {
  const data = err.response?.data;

  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    return data.detail || data.message || data.error ||
      `Request failed with HTTP ${err.response.status}.`;
  }
  if (err.response?.status) {
    return `Request failed with HTTP ${err.response.status}.`;
  }
  if (err.request) {
    return "Cannot connect to the server. Check whether Spring Boot is running.";
  }
  return err.message || "Something went wrong.";
}

function getImageUrl(url) {
  if (!url?.trim()) return DEFAULT_IMAGE;
  url = url.trim();

  if (url.startsWith("/uploads/")) return `${API}${url}`;
  if (url.startsWith("uploads/")) return `${API}/${url}`;
  return url;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  async function fetchMyBookings() {
    setLoading(true);
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user) throw new Error("Please login to view your bookings.");
      if (!user.id) throw new Error("User ID not found. Please login again.");

      const { data } = await axios.get(`${API}/api/bookings/my-bookings`, {
        params: { customerId: user.id }
      });

      if (!Array.isArray(data)) {
        throw new Error("Invalid bookings response from server.");
      }

      setBookings(data);
    } catch (err) {
      setError(err.message || getErrorMessage(err));
      if (err.response || err.request) setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMyBookings();
  }, []);

  async function cancelBooking(id) {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setCancellingId(id);
    setActionError("");
    setSuccessMessage("");

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user?.id) {
        setActionError("Please login again to cancel your booking.");
        return;
      }

      const { data } = await axios.put(
        `${API}/api/bookings/${id}/cancel`,
        null,
        { params: { customerId: user.id } }
      );

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === id
            ? { ...booking, status: data?.status || "CANCELLED" }
            : booking
        )
      );

      setSuccessMessage("Booking cancelled successfully.");
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  const filteredBookings = bookings.filter(
    (booking) => filter === "ALL" || booking.status === filter
  );

  return (
    <main className="my-bookings-page">
      <section className="bookings-header">
        <div>
          <span className="eyebrow green-text">YOUR ACTIVITY</span>
          <h1>My Bookings</h1>
          <p>View your turf reservations.</p>
        </div>
        <Link to="/" className="explore-button">
          Explore Turfs <ArrowRight size={17} />
        </Link>
      </section>

      <section className="booking-filters">
        {["ALL", "CONFIRMED", "PENDING", "CANCELLED"].map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? "booking-filter active" : "booking-filter"}
            onClick={() => setFilter(item)}
          >
            {item === "ALL"
              ? "All Bookings"
              : item.charAt(0) + item.slice(1).toLowerCase()}
          </button>
        ))}
      </section>

      {successMessage && (
        <div className="booking-success-message" role="status">
          {successMessage}
        </div>
      )}

      {actionError && (
        <div className="booking-error-message" role="alert">
          {actionError}
        </div>
      )}

      {loading && <div className="no-bookings">Loading your bookings...</div>}

      {!loading && error && (
        <div className="booking-error-message" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="explore-button"
            onClick={() => {
              setSuccessMessage("");
              fetchMyBookings();
            }}
          >
            Try Again
          </button>
          <Link to="/login" className="explore-button">Login</Link>
        </div>
      )}

      {!loading && !error && (
        <section className="booking-list">
          {filteredBookings.map((booking) => (
            <article className="booking-card" key={booking.id}>
              <img
                src={getImageUrl(booking.imageUrl)}
                alt={booking.turfName || "Turf"}
                className="booking-turf-image"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = DEFAULT_IMAGE;
                }}
              />

              <div className="booking-card-content">
                <div className="booking-title-row">
                  <div>
                    <span className="booking-sport">
                      {booking.sportType || "Sport"}
                    </span>
                    <h2>{booking.turfName || "Turf"}</h2>
                  </div>
                  <span className={`status-badge ${(booking.status || "").toLowerCase()}`}>
                    {booking.status || "UNKNOWN"}
                  </span>
                </div>

                <p className="booking-detail">
                  <MapPin size={16} />
                  {booking.location || "Location unavailable"}
                </p>

                <div className="booking-info-grid">
                  <div>
                    <CalendarDays size={17} />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div>
                    <Clock size={17} />
                    <span>
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </span>
                  </div>
                  <div>
                    <ClipboardList size={17} />
                    <span>{booking.duration ?? 0} hour(s)</span>
                  </div>
                </div>

                <div className="booking-bottom">
                  <div>
                    <span className="amount-label">Total Amount</span>
                    <strong className="booking-amount">
                      ₹{Number(booking.totalAmount ?? 0).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  {booking.status === "CONFIRMED" && (
                    <button
                      type="button"
                      className="cancel-booking-button"
                      onClick={() => cancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <LoaderCircle size={16} className="cancel-spinner" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          Cancel Booking
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {filteredBookings.length === 0 && (
            <div className="no-bookings">
              <ClipboardList size={42} />
              <h2>No bookings found</h2>
              <p>
                {bookings.length === 0
                  ? "You have not made any bookings yet."
                  : "There are no bookings in this category."}
              </p>
              <Link to="/" className="explore-button">Find a Turf</Link>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
