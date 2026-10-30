import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";

const API = "http://localhost:8080";

export default function TurfCard({ turf }) {

  const imageSrc = turf.imageUrl
    ? turf.imageUrl.startsWith("http")
      ? turf.imageUrl
      : `${API}/${turf.imageUrl.replace(/^\/+/, "")}`
    : "";

  // Multiple sports
  const sports = turf.sportTypes
    ? turf.sportTypes.split(",").map((sport) => sport.trim()).filter(Boolean)
    : turf.sportType
      ? [turf.sportType]
      : [];

  return (
    <article className="turf-card">

      <div className="turf-image-wrap">

        {imageSrc ? (
          <img
            src={imageSrc}
            alt={turf.turfName || "Turf"}
            className="turf-image"
            onError={(e) => {
              console.error("Image loading failed:", imageSrc);
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="turf-image-placeholder">
            Turf image not available
          </div>
        )}

        <div className="sport-badges">
          {sports.map((sport, index) => (
            <span className="sport-badge" key={index}>
              {sport}
            </span>
          ))}
        </div>

      </div>

      <div className="turf-card-content">

        <h3>{turf.turfName}</h3>

        <p className="turf-location">
          <MapPin size={16} />
          {turf.location}
        </p>

        <p className="turf-facilities">
          {turf.facilities}
        </p>

        <div className="turf-card-footer">

          <div>
            <span className="price">
              ₹{Number(turf.pricePerHour || 0).toLocaleString("en-IN")}
            </span>

            <span className="price-unit">
              {" "}/ hour
            </span>
          </div>

          <Link
            to={`/turfs/${turf.id}`}
            className="details-button"
          >
            View Details <ArrowRight size={16} />
          </Link>

        </div>

      </div>

    </article>
  );
}