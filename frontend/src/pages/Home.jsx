import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Search, MapPin, ShieldCheck } from "lucide-react";
import TurfCard from "../components/TurfCard";

const API_URL = "http://localhost:8080";

export default function Home() {
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("All");
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchTurfs() {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_URL}/api/turfs`);

        if (isMounted) {
          const data = Array.isArray(response.data)
            ? response.data
            : [];

          // Customer UI-ல் ACTIVE turfs மட்டும் காட்டப்படும்.
          setTurfs(
            data.filter((turf) => turf.status !== "INACTIVE")
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(
            "Unable to load turfs. Please check whether the backend is running."
          );
        }

        console.error("Failed to load turfs:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTurfs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTurfs = useMemo(() => {
    return turfs.filter((turf) => {
      const searchText =
        `${turf.turfName ?? ""} ${turf.location ?? ""}`.toLowerCase();

      const matchesSearch = searchText.includes(
        search.trim().toLowerCase()
      );

      // Support multiple sports
      const availableSports = (
        turf.sportTypes || turf.sportType || ""
      )
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      const matchesSport =
        sport === "All" ||
        availableSports.includes(sport.toLowerCase());

      return matchesSearch && matchesSport;
    });
  }, [turfs, search, sport]);

  return (
    <main>
      <section className="hero">
        <div className="hero-overlay">
          <span className="eyebrow">
            YOUR GAME. YOUR GROUND.
          </span>

          <h1>
            Find Your Game.
            <br />
            <span>Book Your Turf.</span>
          </h1>

          <p>
            Discover sports turfs near you and book
            your perfect playing time.
          </p>

          <div className="search-panel">
            <MapPin size={20} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search turf name or location"
              aria-label="Search turf name or location"
            />

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("turfs")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Search size={18} />
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="turfs-section" id="turfs">
        <div className="section-heading">
          <div>
            <span className="eyebrow green-text">
              PLAY MORE
            </span>

            <h2>Explore Popular Turfs</h2>

            <p>Find the right ground for your next game.</p>
          </div>

          <div className="sport-filters">
            {["All", "Football", "Cricket", "Badminton", "Basketball"].map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    sport === item ? "filter active" : "filter"
                  }
                  onClick={() => setSport(item)}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        {loading && (
          <p className="empty-state">Loading turfs...</p>
        )}

        {!loading && error && (
          <p className="empty-state">{error}</p>
        )}

        {!loading && !error && (
          <>
            <div className="turf-grid">
              {filteredTurfs.map((turf) => (
                <TurfCard key={turf.id} turf={turf} />
              ))}
            </div>

            {filteredTurfs.length === 0 && (
              <p className="empty-state">
                No turfs found. Try another search.
              </p>
            )}
          </>
        )}
      </section>

      <section className="trust-section">
        <ShieldCheck size={28} />

        <div>
          <h3>Your game starts here.</h3>
          <p>
            Explore facilities and compare prices
            before choosing your turf.
          </p>
        </div>
      </section>
    </main>
  );
}