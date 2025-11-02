import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2, Loader2 } from "lucide-react";
import "./Announcements.css";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    date_posted: "",
    expiration_date: "",
    button_text: "",
    button_link: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageModal, setMessageModal] = useState("");
  const [selectedAnnounceId, setSelectedAnnounceId] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // 🔹 Fetch Announcements
  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/announcements/fetch`);
      if (res.data.success) {
        setAnnouncements(res.data.data);
      } else {
        setError("Failed to fetch announcements.");
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Failed to fetch announcements.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openModal = (announcement = null) => {
    setEditingAnnouncement(announcement);
    setForm(
      announcement || {
        title: "",
        content: "",
        date_posted: new Date().toISOString().slice(0, 10),
        expiration_date: "",
        button_text: "",
        button_link: "",
      }
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({
      title: "",
      content: "",
      date_posted: "",
      expiration_date: "",
      button_text: "",
      button_link: "",
    });
    setEditingAnnouncement(null);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.title || !form.content || !form.expiration_date) {
      setMessageModal("All fields are required!");
      setShowMessageModal(true);
      return;
    }

    try {
      setIsSaving(true);
      if (editingAnnouncement) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/announcements/update/${editingAnnouncement.id}`,
          form
        );
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/announcements/add`, form);
      }
      fetchAnnouncements();
      closeModal();
    } catch (err) {
      console.error("Error saving announcement:", err);
      setMessageModal("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (index) => {
    setSelectedAnnounceId(index);
    setShowConfirmModal(true);
    setMessageModal('Are you sure you want to delete this announcement?');
  }

  const confirmDelete = async (id) => {
    try {
      setIsLoading(true);
      await axios.delete(`${process.env.REACT_APP_API_URL}/announcements/delete/${id}`);
      fetchAnnouncements();
    } catch (err) {
      console.error("Error deleting announcement:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="features-container">
      <div className="features-header">
        <h2>Manage Announcements</h2>
        <div className="services-actions">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="features-search-input"
          />
          <button className="features-primary-btn" onClick={() => openModal()}>
            Add Announcement
          </button>
        </div>
      </div>

      {/* ✅ Loading, Error, or Data State */}
      {isLoading ? (
        <div className="loading-overlay">
          <Loader2 className="loading-spinner" />
          <p>Loading announcements...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchAnnouncements}>Retry</button>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="no-data-message">
          <p>No announcements found.</p>
        </div>
      ) : (
        <div className="services-table-container">
          <table className="announcements-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Content</th>
                <th>Date Posted</th>
                <th>Expiration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map((a, index) => (
                <tr key={a.id}>
                  <td>{index + 1}</td>
                  <td>{a.title}</td>
                  <td className="announcements-content-cell">{a.content}</td>
                  <td>{a.date_posted}</td>
                  <td>{a.expiration_date}</td>
                  <td>
                    <button
                      className="features-edit-icon-btn"
                      onClick={() => openModal(a)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="features-delete-icon-btn"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Modal */}
      {modalOpen && (
        <div className="features-modal-overlay">
          <div className="features-modal">
            <h3>{editingAnnouncement ? "Edit Announcement" : "Add Announcement"}</h3>

            <input
              className="features-input-text"
              name="title"
              value={form.title}
              onChange={handleInput}
              placeholder="Announcement Title"
            />

            <textarea
              className="features-input-textarea"
              name="content"
              value={form.content}
              onChange={handleInput}
              placeholder="Announcement Content"
            />

            <label className="features-label">Date Posted</label>
            <input
              type="date"
              className="features-input-text"
              name="date_posted"
              value={form.date_posted}
              onChange={handleInput}
            />

            <label className="features-label">Expiration Date</label>
            <input
              type="date"
              className="features-input-text"
              name="expiration_date"
              value={form.expiration_date}
              onChange={handleInput}
            />

            <input
              className="features-input-text"
              name="button_text"
              value={form.button_text}
              onChange={handleInput}
              placeholder="Button Text (optional)"
            />

            <input
              className="features-input-text"
              name="button_link"
              value={form.button_link}
              onChange={handleInput}
              placeholder="Button Link (optional)"
            />

            <div className="features-modal-actions">
              <button
                className="features-primary-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="btn-spinner" /> Saving...
                  </>
                ) : editingAnnouncement ? (
                  "Update"
                ) : (
                  "Add"
                )}
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
