import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2, Loader2 } from "lucide-react";
import * as FaIcons from "react-icons/fa";
import "./Features.css";

export default function Features() {
  const [features, setFeatures] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [form, setForm] = useState({ icon: "", title: "", description: "" });
  const [customIconName, setCustomIconName] = useState("");
  const [dynamicIcons, setDynamicIcons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messageModal, setMessageModal] = useState("");
  const [error, setError] = useState("");
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const iconOptions = [
    { label: "Bell", value: "FaBell", icon: FaIcons.FaBell },
    { label: "Camera", value: "FaCamera", icon: FaIcons.FaCamera },
    { label: "Calendar", value: "FaCalendarAlt", icon: FaIcons.FaCalendarAlt },
    { label: "Clipboard", value: "FaClipboardList", icon: FaIcons.FaClipboardList },
    { label: "Chart", value: "FaChartBar", icon: FaIcons.FaChartBar },
    { label: "Pills", value: "FaPills", icon: FaIcons.FaPills },
    { label: "Box", value: "FaBox", icon: FaIcons.FaBox },
    { label: "Robot", value: "FaRobot", icon: FaIcons.FaRobot },
  ];
  const allIcons = [...iconOptions, ...dynamicIcons];

  // 🔹 Fetch all features
  const fetchFeatures = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await axios.get("/server-api/feature/fetch");
      if (res.data.success) {
        setFeatures(res.data.data);
      } else {
        setError("Failed to fetch features from the server.");
      }
    } catch (err) {
      console.error("Error fetching features:", err);
      setError("Unable to load features. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const openModal = (feature = null) => {
    setEditingFeature(feature);
    setForm(feature || { icon: "", title: "", description: "" });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({ icon: "", title: "", description: "" });
    setEditingFeature(null);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.icon || !form.title || !form.description) {
      setMessageModal("All fields are required!");
      setShowMessageModal(true);
      return;
    }

    try {
      setIsProcessing(true);
      if (editingFeature) {
        await axios.put(`/server-api/feature/update/${editingFeature.id}`, form);
      } else {
        await axios.post("/server-api/feature/add", form);
      }
      setIsProcessing(false);
      fetchFeatures();
      closeModal();
    } catch (err) {
      console.error("Error saving feature:", err);
      setMessageModal("Failed to save feature.");
    }
  };

  const handleDelete = (f_id) => {
    setSelectedFeatureId(f_id);
    setMessageModal("Do you want to Delete this Feature?");
    setShowConfirmModal(true);
  }

  const confirmDelete = async (featureId) => {
    setIsProcessing(true);

    try {
      await axios.delete(`/server-api/feature/delete/${featureId}`);
      setIsProcessing(false);
      setShowConfirmModal(false);
      fetchFeatures();
    } catch (err) {
      console.error("Error deleting feature:", err);
      setMessageModal("Failed to delete feature.");
    }
  };

  const addCustomIcon = () => {
    if (!customIconName.startsWith("Fa")) {
      setMessageModal("Icon name must start with 'Fa'");
      return;
    }
    const Icon = FaIcons[customIconName];
    if (!Icon) {
      setMessageModal("Invalid icon name");
      return;
    }
    setDynamicIcons((prev) => [...prev, { label: customIconName, value: customIconName, icon: Icon }]);
    setCustomIconName("");
  };

  // 🔍 Filter logic
  const filteredFeatures = features.filter(
    (f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="features-container">
      <div className="features-header">
        <h2>Manage Features</h2>
        <div className="services-actions">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="features-search-input"
          />
          <button className="features-primary-btn" onClick={() => openModal()}>
            Add Feature
          </button>
        </div>
      </div>

      <div className="services-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Icon</th>
              <th>Title</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", color: "red", padding: "20px" }}>
                  {error}
                </td>
              </tr>
            ) : filteredFeatures.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                  No data found.
                </td>
              </tr>
            ) : (
              filteredFeatures.map((f, index) => {
                const Icon = FaIcons[f.icon];
                return (
                  <tr key={f.id}>
                    <td>{index + 1}</td>
                    <td className="icon-cell">{Icon && <Icon />}</td>
                    <td>{f.title}</td>
                    <td>{f.description}</td>
                    <td>
                      <button className="features-edit-icon-btn" onClick={() => openModal(f)}>
                        <Edit size={16} />
                      </button>
                      <button className="features-delete-icon-btn" onClick={() => handleDelete(f.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="features-modal-overlay">
          <div className="features-modal">
            <h3>{editingFeature ? "Edit Feature" : "Add Feature"}</h3>

            <select className="features-input-select" name="icon" value={form.icon} onChange={handleInput}>
              <option value="">Select Icon</option>
              {allIcons.map((opt, i) => (
                <option key={i} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="features-icon-preview">
              {form.icon && FaIcons[form.icon] && React.createElement(FaIcons[form.icon], { size: 28 })}
            </div>

            <input
              className="features-input-text"
              name="title"
              value={form.title}
              onChange={handleInput}
              placeholder="Feature Title"
            />
            <textarea
              className="features-input-textarea"
              name="description"
              value={form.description}
              onChange={handleInput}
              placeholder="Feature Description"
            />

            <div className="features-custom-icon-add">
              <input
                type="text"
                className="features-input-text"
                placeholder="Add icon (e.g. FaDog)"
                value={customIconName}
                onChange={(e) => setCustomIconName(e.target.value)}
              />
              <button className="features-btn-secondary" onClick={addCustomIcon}>
                Add Icon
              </button>
            </div>

            <div className="features-modal-actions">
              <button className="features-primary-btn" onClick={handleSave} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    Processing... <Loader2 size={16} className="feature-spinner" />
                  </>
                ) : editingFeature ? "Update" : "Add"}
              </button>
              <button className="features-cancel-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="All-deleteconfirm-overlay" onClick={() => setShowConfirmModal(false)}>
          <div
            className="All-deleteconfirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="All-deleteconfirm-title">Confirm Delete</h3>
            <p className="All-deleteconfirm-message">
              {messageModal}
            </p>
            <div className="All-deleteconfirm-actions">
              <button
                className="All-deleteconfirm-btn confirm"
                onClick={() => confirmDelete(selectedFeatureId)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    Processing... <Loader2 size={16} className="feature-spinner" />
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
              <button
                className="All-deleteconfirm-btn cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="All-Message-modal-overlay">
          <div className="All-Message-modal">
            <div className="All-Message-modal-header">
              <h2>Alert Message</h2>
            </div>

            <div className="All-Message-modal-body">
              <p>{messageModal}</p>
            </div>

            <div className="All-Message-modal-footer">
              <button
                className="All-Message-close-btn"
                onClick={() => setShowMessageModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
