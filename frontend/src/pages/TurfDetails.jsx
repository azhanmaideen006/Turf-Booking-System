
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Lock
} from "lucide-react";

const API = "http://localhost:8080";

const toMinutes = (time) => {
  if (!time) return 0;

  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
};

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = String(time).split(":").map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return "";
  }

  return `${String(hours % 12 || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
};

const imageSrc = (url) => {
  if (!url) return "";
  return url.startsWith("http")
    ? url
    : `${API}${url.startsWith("/") ? "" : "/"}${url}`;
};

function makeSlots(open, close) {
  if (!open || !close) return [];

  const start = toMinutes(open);
  const end = toMinutes(close);
  const slots = [];

  for (let time = start; time + 60 <= end; time += 60) {
    const value = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;

    slots.push({
      value,
      label: formatTime(value)
    });
  }

  return slots;
}

export default function TurfDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turf, setTurf] = useState(null);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [hours, setHours] = useState("1");
  const [booked, setBooked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load turf details
  useEffect(() => {
    let active = true;

    axios
      .get(`${API}/api/turfs/${id}`)
      .then((response) => {
        if (active) setTurf(response.data);
      })
      .catch(() => {
        if (active) setError("Unable to load turf details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Reset selected slot when date or duration changes
  useEffect(() => {
    setSlot("");
    setMessage("");
    setError("");
  }, [date, hours]);

  // Load booked slots for selected date
  useEffect(() => {
    if (!date || !id) {
      setBooked([]);
      return;
    }

    let active = true;
    setAvailabilityLoading(true);

    axios
      .get(`${API}/api/bookings/availability`, {
        params: {
          turfId: id,
          date
        }
      })
      .then((response) => {
        if (active) {
          setBooked(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch((err) => {
        if (active) {
          setBooked([]);
          setError(
            err.response?.status === 401 || err.response?.status === 403
              ? "You do not have permission to view booked slots. Check SecurityConfig."
              : "Unable to load booked slots."
          );
        }
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, date]);

  const today = new Date();

  const minDate =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (loading) {
    return (
      <main className="placeholder-page">
        <h2>Loading turf details...</h2>
      </main>
    );
  }

  if (error && !turf) {
    return (
      <main className="placeholder-page">
        <h2>{error}</h2>
        <button onClick={() => navigate("/")}>Back Home</button>
      </main>
    );
  }

  if (!turf) return null;

  const slots = makeSlots(turf.openingTime, turf.closingTime);
  const total = Number(turf.pricePerHour || 0) * Number(hours);
  const endTime = slot
    ? formatTime(
        `${String(Math.floor((toMinutes(slot) + Number(hours) * 60) / 60)).padStart(2, "0")}:${String((toMinutes(slot) + Number(hours) * 60) % 60).padStart(2, "0")}`
      )
    : "";

  function isBooked(value) {
    const start = toMinutes(value);
    const end = start + Number(hours) * 60;

    return booked.some((booking) => {
      return (
        start < toMinutes(booking.endTime) &&
        end > toMinutes(booking.startTime)
      );
    });
  }

  async function book() {
    setError("");
    setMessage("");

    let user;

    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      user = null;
    }

    if (!user) {
      navigate("/login", {
        state: { from: `/turfs/${id}` }
      });
      return;
    }

    if (!user.id) {
      setError(
        "Your saved login has no customer ID. Please log out, then log in again. If this continues, check the login page's localStorage code."
      );
      return;
    }

    if (!date || !slot) {
      setError("Please select a date and time slot.");
      return;
    }

    if (isBooked(slot)) {
      setError("This slot is already booked. Please choose another time.");
      return;
    }

    setSaving(true);

    try {
      await axios.post(`${API}/api/bookings`, {
        customerId: Number(user.id),
        turfId: Number(id),
        bookingDate: date,
        startTime: `${slot}:00`,
        durationHours: Number(hours)
      });

      setMessage("Booking confirmed successfully!");

      const response = await axios.get(
        `${API}/api/bookings/availability`,
        {
          params: { turfId: id, date }
        }
      );

      setBooked(Array.isArray(response.data) ? response.data : []);
      setSlot("");
    } catch (err) {
      const status = err.response?.status;

      if (status === 401 || status === 403) {
        setError("Booking request was denied. Check SecurityConfig and login.");
      } else if (status === 409) {
        setError("This slot was just booked. Please select another slot.");
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Booking failed. Please check the backend console."
        );
      }

      try {
        const response = await axios.get(
          `${API}/api/bookings/availability`,
          {
            params: { turfId: id, date }
          }
        );

        setBooked(Array.isArray(response.data) ? response.data : []);
      } catch {
        // Keep the original booking error visible.
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="details-page">
      <button className="back-button" onClick={() => navigate("/")}>
        <ArrowLeft size={18} />
        Back to Turfs
      </button>

      <div className="details-layout">
        <section className="details-main">
          {turf.imageUrl && (
            <img
              src={imageSrc(turf.imageUrl)}
              alt={turf.turfName}
              className="details-image"
            />
          )}

          <span className="eyebrow green-text">
            {(turf.sportType || "SPORT").toUpperCase()} TURF
          </span>

          <h1>{turf.turfName}</h1>

          <p className="turf-location">
            <MapPin size={18} />
            {turf.location}
          </p>

          <div className="details-info">
            <h3>Facilities</h3>
            <p>{turf.facilities || "Information not available."}</p>

            <h3>Opening Hours</h3>
            <p>
              <Clock size={16} />
              {formatTime(turf.openingTime)} – {formatTime(turf.closingTime)}
            </p>

            <p className="trust-note">
              <ShieldCheck size={18} />
              Check your booking details before confirming.
            </p>
          </div>
        </section>

        <aside className="booking-panel">
          <p className="booking-label">BOOK YOUR SLOT</p>

          <p>
            <strong className="price">
              ₹{Number(turf.pricePerHour || 0).toLocaleString("en-IN")}
            </strong>
            <span className="price-unit"> / hour</span>
          </p>

          <label htmlFor="booking-date">Select Date</label>
          <input
            id="booking-date"
            className="booking-input"
            type="date"
            min={minDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />

          <label>Available Time Slots</label>

          {!date && (
            <p className="booking-disclaimer">
              Please select a date to view available slots.
            </p>
          )}

          {availabilityLoading && (
            <p className="booking-disclaimer">Loading booked slots...</p>
          )}

          <div className="time-grid">
            {slots.map((timeSlot) => {
              const locked = date && isBooked(timeSlot.value);

              return (
                <button
                  key={timeSlot.value}
                  type="button"
                  disabled={!date || availabilityLoading || locked}
                  className={`time-slot ${
                    slot === timeSlot.value ? "selected" : ""
                  } ${locked ? "booked-slot" : ""}`}
                  onClick={() => {
                    setSlot(timeSlot.value);
                    setError("");
                    setMessage("");
                  }}
                >
                  {locked && <Lock size={13} />}
                  {timeSlot.label}
                </button>
              );
            })}
          </div>

          <label htmlFor="duration">Duration</label>
          <select
            id="duration"
            className="booking-input"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          >
            <option value="1">1 Hour</option>
            <option value="2">2 Hours</option>
            <option value="3">3 Hours</option>
          </select>

          {slot && (
            <div className="price-summary">
              <span>Selected Time</span>
              <strong>
                {formatTime(slot)} – {endTime}
              </strong>
            </div>
          )}

          <div className="price-summary">
            <span>Total Price</span>
            <strong>₹{total.toLocaleString("en-IN")}</strong>
          </div>

          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="auth-success">
              {message}
            </p>
          )}

          <button
            className="confirm-button"
            onClick={book}
            disabled={saving || !date || !slot || availabilityLoading}
          >
            {saving ? "Booking..." : "Confirm Booking"}
          </button>

          <p className="booking-disclaimer">
            A booking is confirmed only after the backend accepts it.
          </p>
        </aside>
      </div>
    </main>
  );
}
