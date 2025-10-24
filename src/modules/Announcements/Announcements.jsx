import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2 } from "lucide-react";
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

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get("/server-api/fetchAnnouncements");
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
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

  // 🔹 Add or Update Announcement
  const handleSave = async () => {
    if (!form.title || !form.content || !form.expiration_date) return;

    try {
      if (editingAnnouncement) {
        await axios.put(
          `/server-api/updateAnnouncement/${editingAnnouncement.id}`,
          form
        );
      } else {
        await axios.post("/server-api/addAnnouncement", form);
      }
      fetchAnnouncements();
      closeModal();
    } catch (err) {
      console.error("Error saving announcement:", err);
    }
  };

  // 🔹 Delete Announcement
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await axios.delete(`/server-api/deleteAnnouncement/${id}`);
      fetchAnnouncements();
    } catch (err) {
      console.error("Error deleting announcement:", err);
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

      <div className="services-table-container">
        <table className="inventory-table">
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
              <button className="features-cancel-btn" onClick={closeModal}>
                Cancel
              </button>
              <button className="features-primary-btn" onClick={handleSave}>
                {editingAnnouncement ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
