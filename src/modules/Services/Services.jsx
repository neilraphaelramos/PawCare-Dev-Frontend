import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import "./Services.css";
import axios from 'axios';

const Services = () => {
  const [services, setServices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newService, setNewService] = useState({ id: null, title: "", description: "", image: "" });
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewService((prevItem) => ({ ...prevItem, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchDataServices = async () => {
    try {
      const response = await axios.post("/server-api/fetch_services");

      if (!Array.isArray(response.data)) {
        console.error("Invalid response format from server.");
        return;
      }

      setServices(response.data);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  useEffect(() => {
    fetchDataServices();
  }, []);

  const openModal = (index = null) => {
    if (index !== null) {
      setNewService(services[index]);
      setEditingIndex(index);
    } else {
      setNewService({ id: null, title: "", description: "", image: "" });
      setEditingIndex(null);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewService({ id: null, title: "", description: "", image: "" });
    setEditingIndex(null);
  };

  const handleInputChange = (e) => {
    setNewService({ ...newService, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!newService.title || !newService.description) return;

    try {
      if (editingIndex !== null && newService.id) {
        // Update service
        const response = await axios.put(`/server-api/update_services/${newService.id}`, newService);
        if (response.data.success) {
          fetchDataServices();
          closeModal();
        } else {
          console.error("Failed to update service:", response.data.message);
        }
      } else {
        // Add new service
        const response = await axios.post("/server-api/add_services", newService);
        if (response.data.success) {
          fetchDataServices();
          closeModal();
        } else {
          console.error("Failed to add service:", response.data.message);
        }
      }
    } catch (err) {
      console.error("Error saving service:", err);
    }
  };

  const handleDelete = async (index) => {
    const service = services[index];

    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await axios.delete(`/server-api/delete_services/${service.id}`);
      if (response.data.success) {
        alert(response.data.message);
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
          <button className="services-primary-btn" onClick={() => openModal()}>Add Service</button>
        </div>
      </div>

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
            {services
              .filter(service =>
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
                    <button className="services-edit-icon-btn" onClick={() => openModal(index)}>
                      <Edit size={16} />
                    </button>
                    <button className="services-delete-icon-btn" onClick={() => handleDelete(index)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="services-modal-overlay">
          <div className="services-modal-content">
            <h3>{editingIndex !== null ? "Edit Service" : "Add Service"}</h3>

            {/* Image Upload */}
            <div className="services-image-upload-wrapper">
              <div
                className="services-image-upload"
                onClick={() => document.getElementById('image-upload').click()}
              >
                {newService.image ? (
                  <img src={newService.image} alt="Uploaded" className="uploaded-image" />
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
                height: '120px',
                padding: '10px',
                fontSize: '14px',
                resize: 'vertical',
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #ccc',
                borderRadius: '8px',
                outline: 'none',
              }}
            ></textarea>

            <div className="services-modal-buttons">
              <button className="services-primary-btn" onClick={handleSave}>
                {editingIndex !== null ? "Update" : "Add"}
              </button>
              <button className="services-cancel-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
