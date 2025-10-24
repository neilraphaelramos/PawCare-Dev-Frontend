import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2 } from "lucide-react";
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

  // 🔹 Read all features from backend
  const fetchFeatures = async () => {
    try {
      const res = await axios.get("/server-api/fetchFeatures");
      if (res.data.success) {
        setFeatures(res.data.data);
        console.log('loading')
      }
    } catch (err) {
      console.error("Error fetching features:", err);
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

  // 🔹 Save feature (Add or Update)
  const handleSave = async () => {
    if (!form.icon || !form.title || !form.description) return;

    try {
      if (editingFeature) {
        await axios.put(`/server-api/update_features/${editingFeature.id}`, form);
      } else {
        await axios.post("/server-api/add_features", form);
      }
      fetchFeatures();
      closeModal();
    } catch (err) {
      console.error("Error saving feature:", err);
    }
  };

  // 🔹 Delete feature
  const handleDelete = async (featureId) => {
    if (!window.confirm("Are you sure you want to delete this feature?")) return;
    try {
      await axios.delete(`/server-api/delete_features/${featureId}`);
      fetchFeatures();
    } catch (err) {
      console.error("Error deleting feature:", err);
    }
  };

  const addCustomIcon = () => {
    if (!customIconName.startsWith("Fa")) {
      alert("Must start with 'Fa'");
      return;
    }
    const Icon = FaIcons[customIconName];
    if (!Icon) {
      alert("Invalid icon name");
      return;
    }
    setDynamicIcons((prev) => [...prev, { label: customIconName, value: customIconName, icon: Icon }]);
    setCustomIconName("");
  };

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
            {features
              .filter((f) =>
                f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((f, index) => {
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
              })}
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
              <button className="features-cancel-btn" onClick={closeModal}>
                Cancel
              </button>
              <button className="features-primary-btn" onClick={handleSave}>
                {editingFeature ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
