import { useState, useEffect } from "react";
import axios from "axios";
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  ImagePlus,
  X,
  UserPlus
} from "lucide-react";

const API_URL = "http://localhost:8080";

const emptyTurf = {
  turfName: "",
  ownerName: "",
  ownerPhone: "",
  location: "",
  sportTypes: ["Football"],
  pricePerHour: "800",
  facilities: "",
  openingTime: "06:00",
  closingTime: "23:00",
  imageUrl: "",
  status: "ACTIVE"
};

const SPORTS = ["Football", "Cricket", "Badminton", "Basketball"];

const emptyAdmin = {
  name: "",
  email: "",
  password: ""
};

function formatTimeLabel(time) {
  const [hourString, minuteString] = String(time).split(":");
  const hour = Number(hourString);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${String(hour12).padStart(2, "0")}:${minuteString} ${period}`;
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  const value =
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return {
    value,
    label: formatTimeLabel(value)
  };
});

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [credentials, setCredentials] = useState(null);

  const [turfs, setTurfs] = useState([]);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [admins, setAdmins] = useState([]);
  const [deletingAdminId, setDeletingAdminId] = useState(null);

  const [form, setForm] = useState({ ...emptyTurf });
  const [editingId, setEditingId] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [newAdmin, setNewAdmin] = useState({ ...emptyAdmin });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function getConfig(auth = credentials) {
    return {
      auth: {
        username: auth.email,
        password: auth.password
      }
    };
  }

  function getImageSrc(imageUrl) {
    if (!imageUrl) return "";

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("blob:")
    ) {
      return imageUrl;
    }

    return `${API_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }

  function showError(err) {
    if (err.response?.status === 401) {
      setError("Authentication failed. Please check your admin credentials.");
    } else if (err.response?.status === 403) {
      setError("Access denied. ADMIN role is required.");
    } else {
      const data = err.response?.data;

      setError(
        typeof data === "string"
          ? data
          : data?.detail ||
            data?.message ||
            err.message ||
            "Something went wrong. Check the backend."
      );
    }
  }

  // Admin Login
  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    const auth = {
      email: email.trim(),
      password
    };

    try {
      // Verify admin credentials
      await axios.get(
        `${API_URL}/api/admin/dashboard`,
        getConfig(auth)
      );

      // Get admin details
      const adminResponse = await axios.get(
        `${API_URL}/api/admin/admins`,
        getConfig(auth)
      );

      const currentAdmin = adminResponse.data.find(
        (admin) =>
          admin.email?.toLowerCase() === auth.email.toLowerCase()
      );

      // Clear previous customer session
      localStorage.removeItem("user");

      // Store logged-in admin details
      localStorage.setItem(
        "admin",
        JSON.stringify({
          id: currentAdmin?.id,
          name: currentAdmin?.name || auth.email.split("@")[0],
          email: auth.email,
          role: "ADMIN"
        })
      );

      // Update Navbar immediately
      window.dispatchEvent(new Event("userLogin"));

      setCredentials(auth);

      await Promise.all([
        loadTurfs(auth),
        loadAdminCount(auth),
        loadAdmins(auth)
      ]);

      setMessage("Admin login successful.");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  // Load all turfs
  async function loadTurfs(auth = credentials) {
    if (!auth) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/turfs`,
        getConfig(auth)
      );

      setTurfs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showError(err);
    }
  }

  // Load admin count
  async function loadAdminCount(auth = credentials) {
    if (!auth) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/admin/count`,
        getConfig(auth)
      );

      setTotalAdmins(
        Number(response.data?.totalAdmins ?? 0)
      );
    } catch (err) {
      showError(err);
    }
  }

  // Load all admins
  async function loadAdmins(auth = credentials) {
    if (!auth) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/admin/admins`,
        getConfig(auth)
      );

      setAdmins(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showError(err);
    }
  }

  // Delete another admin
  async function handleDeleteAdmin(admin) {
    const confirmed = window.confirm(
      `Are you sure you want to delete admin "${admin.name}" (${admin.email})?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");
    setDeletingAdminId(admin.id);

    try {
      const response = await axios.delete(
        `${API_URL}/api/admin/admins/${admin.id}`,
        getConfig()
      );

      setMessage(
        response.data?.message || "Admin deleted successfully."
      );

      await Promise.all([
        loadAdmins(),
        loadAdminCount()
      ]);
    } catch (err) {
      showError(err);
    } finally {
      setDeletingAdminId(null);
    }
  }

  // Create new admin
  async function handleCreateAdmin(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setCreatingAdmin(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/admins`,
        {
          name: newAdmin.name.trim(),
          email: newAdmin.email.trim(),
          password: newAdmin.password
        },
        getConfig()
      );

      setMessage(
        response.data?.message || "New admin created successfully."
      );

      setNewAdmin({ ...emptyAdmin });

      await Promise.all([
        loadAdminCount(),
        loadAdmins()
      ]);
    } catch (err) {
      showError(err);
    } finally {
      setCreatingAdmin(false);
    }
  }

  // Turf form change
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  // Select or unselect multiple sports
  function handleSportChange(sport, checked) {
    setForm((previous) => ({
      ...previous,
      sportTypes: checked
        ? [...previous.sportTypes, sport]
        : previous.sportTypes.filter((item) => item !== sport)
    }));
  }

  // Image selection
  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  // Edit turf
  function startEdit(turf) {
    setEditingId(turf.id);

    setForm({
      turfName: turf.turfName ?? "",
      ownerName: turf.ownerName ?? "",
      ownerPhone: turf.ownerPhone ?? "",
      location: turf.location ?? "",

      sportTypes: Array.isArray(turf.sportTypes)
        ? turf.sportTypes
        : typeof turf.sportTypes === "string" && turf.sportTypes.trim()
          ? turf.sportTypes.split(",").map((sport) => sport.trim()).filter(Boolean)
          : turf.sportType
            ? [turf.sportType]
            : ["Football"],

      pricePerHour: String(turf.pricePerHour ?? "800"),
      facilities: turf.facilities ?? "",
      openingTime: String(turf.openingTime ?? "06:00").slice(0, 5),
      closingTime: String(turf.closingTime ?? "23:00").slice(0, 5),
      imageUrl: turf.imageUrl ?? "",
      status: turf.status ?? "ACTIVE"
    });

    setSelectedImage(null);
    setImagePreview(getImageSrc(turf.imageUrl ?? ""));
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // Reset form
  function resetForm() {
    setForm({ ...emptyTurf });
    setEditingId(null);
    setSelectedImage(null);
    setImagePreview("");

    const fileInput = document.getElementById("turf-image");

    if (fileInput) {
      fileInput.value = "";
    }
  }

  // Add or update turf
  async function handleSave(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      let imageUrl = form.imageUrl;

      if (selectedImage) {
        setUploading(true);

        const imageData = new FormData();
        imageData.append("file", selectedImage);

        const uploadResponse = await axios.post(
          `${API_URL}/api/turfs/upload-image`,
          imageData,
          getConfig()
        );

        imageUrl = uploadResponse.data;
        setUploading(false);
      }

      if (form.sportTypes.length === 0) {
        setError("Please select at least one sport.");
        setLoading(false);
        setUploading(false);
        return;
      }

      const payload = {
        ...form,
        sportTypes: form.sportTypes.join(","),
        imageUrl,
        pricePerHour: Number(form.pricePerHour)
      };

      if (editingId !== null) {
        await axios.put(
          `${API_URL}/api/turfs/${editingId}`,
          payload,
          getConfig()
        );

        setMessage("Turf updated successfully.");
      } else {
        await axios.post(
          `${API_URL}/api/turfs`,
          payload,
          getConfig()
        );

        setMessage("New turf added successfully.");
      }

      resetForm();
      await loadTurfs();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  // Delete turf
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this turf?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await axios.delete(
        `${API_URL}/api/turfs/${id}`,
        getConfig()
      );

      setMessage("Turf deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadTurfs();
    } catch (err) {
      showError(err);
    }
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem("admin");

    setCredentials(null);
    setTurfs([]);
    setTotalAdmins(0);
    setAdmins([]);
    setDeletingAdminId(null);
    setEmail("");
    setPassword("");
    setMessage("");
    setError("");
    setNewAdmin({ ...emptyAdmin });

    resetForm();

    window.dispatchEvent(new Event("userLogin"));
  }

  // Admin login screen
  if (!credentials) {
    return (
      <main className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <ShieldCheck size={42} />

          <h1>Admin Login</h1>
          <p>Sign in to manage TurfZone listings.</p>

          {error && (
            <p className="admin-error">{error}</p>
          )}

          {message && (
            <p className="admin-success">{message}</p>
          )}

          <label htmlFor="admin-email">Admin Email</label>

          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="admin-password">Password</label>

          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Login as Admin"}
          </button>
        </form>
      </main>
    );
  }

  // Admin dashboard
  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">TURFZONE MANAGEMENT</p>
          <h1>Admin Dashboard</h1>
          <p>Manage turf owners and listings.</p>
        </div>

        <button
          type="button"
          className="admin-logout"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          Logout
        </button>
      </header>

      {message && (
        <p className="admin-success">{message}</p>
      )}

      {error && (
        <p className="admin-error">{error}</p>
      )}

      {/* Dashboard statistics */}
      <section className="admin-stats">
        <div className="admin-stat-card">
          <span>Total Turfs</span>
          <strong>{turfs.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Total Admins</span>
          <strong>{totalAdmins}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Active Turfs</span>
          <strong>
            {turfs.filter(
              (turf) => turf.status === "ACTIVE"
            ).length}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>Inactive Turfs</span>
          <strong>
            {turfs.filter(
              (turf) => turf.status === "INACTIVE"
            ).length}
          </strong>
        </div>
      </section>

      {/* Create admin */}
      <section className="admin-panel">
        <h2>
          <UserPlus size={21} />
          {" "}Create New Admin
        </h2>

        <p>Create another administrator account for TurfZone.</p>

        <form onSubmit={handleCreateAdmin}>
          <div className="admin-form-grid">
            <div>
              <label htmlFor="new-admin-name">Admin Name</label>

              <input
                id="new-admin-name"
                type="text"
                value={newAdmin.name}
                onChange={(event) =>
                  setNewAdmin((previous) => ({
                    ...previous,
                    name: event.target.value
                  }))
                }
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="new-admin-email">Admin Email</label>

              <input
                id="new-admin-email"
                type="email"
                value={newAdmin.email}
                onChange={(event) =>
                  setNewAdmin((previous) => ({
                    ...previous,
                    email: event.target.value
                  }))
                }
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="new-admin-password">Password</label>

              <input
                id="new-admin-password"
                type="password"
                value={newAdmin.password}
                onChange={(event) =>
                  setNewAdmin((previous) => ({
                    ...previous,
                    password: event.target.value
                  }))
                }
                minLength={8}
                autoComplete="new-password"
                required
              />

              <small>Use at least 8 characters.</small>
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="submit" disabled={creatingAdmin}>
              <UserPlus size={17} />
              {creatingAdmin ? "Creating Admin..." : "Create Admin"}
            </button>
          </div>
        </form>
      </section>

      {/* Manage admins */}
      <section className="admin-panel">
        <div className="admin-list-heading">
          <h2>Manage Admins</h2>

          <button
            type="button"
            className="admin-refresh"
            onClick={() => {
              loadAdmins();
              loadAdminCount();
            }}
          >
            Refresh
          </button>
        </div>

        <p>View all administrator accounts and delete other admins.</p>

        {admins.length === 0 ? (
          <p>No admin accounts found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Admin Name</th>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => {
                  const isCurrentAdmin =
                    admin.email?.toLowerCase() ===
                    credentials.email.trim().toLowerCase();

                  return (
                    <tr key={admin.id}>
                      <td>{admin.name}</td>
                      <td>{admin.email}</td>

                      <td>
                        {isCurrentAdmin ? (
                          <span className="admin-status">
                            Current Admin
                          </span>
                        ) : (
                          <button
                            type="button"
                            title="Delete admin"
                            className="admin-delete"
                            disabled={deletingAdminId === admin.id}
                            onClick={() => handleDeleteAdmin(admin)}
                          >
                            <Trash2 size={16} />

                            {deletingAdminId === admin.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add or edit turf */}
      <section className="admin-panel">
        <h2>
          {editingId !== null ? "Edit Turf" : "Add New Turf"}
        </h2>

        <form className="admin-turf-form" onSubmit={handleSave}>
          <div className="admin-form-grid">
            <div>
              <label htmlFor="turf-name">Turf Name</label>

              <input
                id="turf-name"
                name="turfName"
                value={form.turfName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="owner-name">Owner Name</label>

              <input
                id="owner-name"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="owner-phone">Owner Phone</label>

              <input
                id="owner-phone"
                name="ownerPhone"
                type="tel"
                value={form.ownerPhone}
                onChange={handleChange}
                pattern="[0-9]{10,15}"
                title="Enter 10 to 15 digits"
                required
              />
            </div>

            <div>
              <label htmlFor="turf-location">Location</label>

              <input
                id="turf-location"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
              />
            </div>

            {/* Multiple Sports Selection */}
            <div>
              <label>Sports (Select one or more)</label>

              <div className="admin-sports-options">
                {SPORTS.map((sport) => (
                  <label key={sport} className="admin-sport-option">
                    <input
                      type="checkbox"
                      checked={form.sportTypes.includes(sport)}
                      onChange={(event) =>
                        handleSportChange(sport, event.target.checked)
                      }
                    />

                    <span>{sport}</span>
                  </label>
                ))}
              </div>

              {form.sportTypes.length === 0 && (
                <small className="admin-error">
                  Please select at least one sport.
                </small>
              )}
            </div>

            <div>
              <label htmlFor="price-per-hour">
                Price Per Hour (₹)
              </label>

              <input
                id="price-per-hour"
                name="pricePerHour"
                type="number"
                min="1"
                step="0.01"
                value={form.pricePerHour}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="opening-time">Opening Time</label>

              <select
                id="opening-time"
                name="openingTime"
                value={form.openingTime}
                onChange={handleChange}
                required
              >
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="closing-time">Closing Time</label>

              <select
                id="closing-time"
                name="closingTime"
                value={form.closingTime}
                onChange={handleChange}
                required
              >
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="turf-status">Status</label>

              <select
                id="turf-status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div>
              <label htmlFor="turf-image">Turf Image</label>

              <input
                id="turf-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />

              <small>JPG, PNG or WEBP. Maximum size: 5 MB.</small>

              {imagePreview ? (
                <div className="admin-image-preview">
                  <img
                    src={imagePreview}
                    alt="Turf preview"
                    onError={() =>
                      setError("Could not display the selected turf image.")
                    }
                  />

                  <button
                    type="button"
                    className="admin-cancel"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview("");

                      setForm((previous) => ({
                        ...previous,
                        imageUrl: ""
                      }));

                      const input = document.getElementById("turf-image");

                      if (input) input.value = "";
                    }}
                  >
                    <X size={15} />
                    Remove Image
                  </button>
                </div>
              ) : (
                <p className="admin-image-placeholder">
                  <ImagePlus size={18} />
                  No image selected
                </p>
              )}
            </div>
          </div>

          <div className="admin-form-full">
            <label htmlFor="turf-facilities">Facilities</label>

            <textarea
              id="turf-facilities"
              name="facilities"
              value={form.facilities}
              onChange={handleChange}
              placeholder="Floodlights, Parking, Washroom"
              rows={3}
            />
          </div>

          <div className="admin-form-actions">
            <button
              type="submit"
              disabled={loading || uploading}
            >
              <Plus size={17} />

              {uploading
                ? "Uploading image..."
                : loading
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Turf"
                    : "Add Turf"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="admin-cancel"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Manage turfs */}
      <section className="admin-panel">
        <div className="admin-list-heading">
          <h2>Manage Turfs</h2>

          <button
            type="button"
            className="admin-refresh"
            onClick={() => {
              loadTurfs();
              loadAdminCount();
              loadAdmins();
            }}
          >
            Refresh
          </button>
        </div>

        {turfs.length === 0 ? (
          <p>No turfs found. Add your first turf above.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Turf</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>Sports</th>
                  <th>Price / Hour</th>
                  <th>Opening</th>
                  <th>Closing</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {turfs.map((turf) => (
                  <tr key={turf.id}>
                    <td>
                      {turf.imageUrl ? (
                        <img
                          src={getImageSrc(turf.imageUrl)}
                          alt={turf.turfName}
                          className="admin-table-image"
                        />
                      ) : (
                        <span>No image</span>
                      )}
                    </td>

                    <td>{turf.turfName}</td>
                    <td>{turf.ownerName}</td>
                    <td>{turf.location}</td>

                    <td>
                      {Array.isArray(turf.sportTypes)
                        ? turf.sportTypes.join(", ")
                        : turf.sportTypes || turf.sportType || "-"}
                    </td>

                    <td>₹{turf.pricePerHour}</td>

                    <td>
                      {formatTimeLabel(
                        String(turf.openingTime || "06:00").slice(0, 5)
                      )}
                    </td>

                    <td>
                      {formatTimeLabel(
                        String(turf.closingTime || "23:00").slice(0, 5)
                      )}
                    </td>

                    <td>
                      <span className="admin-status">
                        {turf.status}
                      </span>
                    </td>

                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          title="Edit turf"
                          onClick={() => startEdit(turf)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title="Delete turf"
                          className="admin-delete"
                          onClick={() => handleDelete(turf.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}