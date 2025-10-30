import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import "./Services.css";
import axios from 'axios';

const Services = () => {
  const [services, setServices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newService, setNewService] = useState({ id: null, title: "", description: "", image: null });
  const [previewImage, setPreviewImage] = useState(""); // for showing selected image preview
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setisSumbitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messageModal, setMessageModal] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const fetchDataServices = async () => {
    try {
      setIsLoading(true);
      setError("")
      const response = await axios.post("/server-api/services/fetch");
      if (!Array.isArray(response.data)) {
        console.error("Invalid response format from server.");
        setError("Invalid data format from server.");
        return;
      }
      setServices(response.data);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataServices();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewService((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const openModal = (index = null) => {
    if (index !== null) {
      const service = services[index];
      setNewService({
        id: service.id,
        title: service.title,
        description: service.description,
        image: null,
      });
      setPreviewImage(service.image); 
      setEditingIndex(index);
    } else {
      setNewService({ id: null, title: "", description: "", image: null });
      setPreviewImage("");
      setEditingIndex(null);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewService({ id: null, title: "", description: "", image: null });
    setPreviewImage("");
    setEditingIndex(null);
  };

  const handleInputChange = (e) => {
    setNewService({ ...newService, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsProcessing(true);

    if (!newService.title || !newService.description) {
      setMessageModal("Title and description are required!");
      setIsProcessing(false);
      setShowMessageModal(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", newService.title);
      formData.append("description", newService.description);
      if (newService.image) formData.append("image", newService.image);
      setisSumbitting(true);

      if (editingIndex !== null && newService.id) {
        const response = await axios.put(`/server-api/services/update/${newService.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.data.success) {
          fetchDataServices();
          setisSumbitting(false);
          setIsProcessing(false);
          closeModal();
        } else {
          console.error("Failed to update service:", response.data.message);
        }
      } else {
        const response = await axios.post("/server-api/services/add", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.data.success) {
          fetchDataServices();
          setisSumbitting(false);
          setIsProcessing(false);
          closeModal();
        } else {
          console.error("Failed to add service:", response.data.message);
        }
      }
    } catch (err) {
      console.error("Error saving service:", err);
    }
  };

  const handleDelete = (index) => {
    setSelectedServiceId(index);
    setMessageModal("Do you want to Delete this Service?");
    setShowConfirmModal(true);
  }

  const confirmDelete = async () => {
    const service = services[selectedServiceId];

    try {
      const response = await axios.delete(`/server-api/services/delete/${service.id}`);
      if (response.data.success) {
        setMessageModal(response.data.message);
        fetchDataServices();
      } else {
        console.error("Failed to delete service:", response.data.message);
      }
    } catch (err) {
      console.error("Error deleting service:", err);
    }
  };

  return (
    <div className="admin-services-page">
      <div className="admin-services-header">
        <h2>Manage Services</h2>
        <div className="services-actions">
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="services-search-input"
          />
          <button className="services-primary-btn" onClick={() => openModal()}>
            Add Service
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="services-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
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
            ) : services.length === 0 ||
              services.filter(
                (service) =>
                  service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  service.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                  No data found.
                </td>
              </tr>
            ) : (
              services
                .filter(
                  (service) =>
                    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    service.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((service, index) => (
                  <tr key={service.id || index}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={service.image}
                        alt={service.title}
                        className="inventory-img-thumb"
                      />
                    </td>
                    <td>{service.title}</td>
                    <td>{service.description}</td>
                    <td>
                      <button
                        className="services-edit-icon-btn"
                        onClick={() => openModal(index)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="services-delete-icon-btn"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="services-modal-overlay">
          <div className="services-modal-content">
            <h3>{editingIndex !== null ? "Edit Service" : "Add Service"}</h3>

            {/* Image Upload */}
            <div className="services-image-upload-wrapper">
              <div
                className="services-image-upload"
                onClick={() => document.getElementById("image-upload").click()}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="uploaded-image" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="upload-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 3a1 1 0 112 0 1 1 0 01-2 0zM3 15l4-5 3 4 4-6 5 7H3z" />
                  </svg>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden-input"
                />
              </div>
            </div>

            <input
              type="text"
              name="title"
              placeholder="Title"
              value={newService.title}
              onChange={handleInputChange}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={newService.description}
              onChange={handleInputChange}
              style={{
                height: "120px",
                padding: "10px",
                fontSize: "14px",
                resize: "vertical",
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #ccc",
                borderRadius: "8px",
                outline: "none",
              }}
            ></textarea>

            <div className="services-modal-buttons">
              <button
                className="services-primary-btn"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? editingIndex !== null
                    ? "Updating..."
                    : "Adding..."
                  : editingIndex !== null
                    ? "Update"
                    : "Add"}
              </button>

              <button className="services-cancel-btn" onClick={closeModal}>
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
};

export default Services;
