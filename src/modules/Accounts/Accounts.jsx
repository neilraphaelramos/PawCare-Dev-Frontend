import React, { useState, useEffect, useContext } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import './Accounts.css';
import { UserContext } from '../../hook/authContext';
import axios from "axios";

const Accounts = () => {
  const { setAllUser, allUser } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    image: '',
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  // 🔹 Fetch all accounts
  const handleAccounts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/data`);

      if (!Array.isArray(data)) {
        setError("Invalid response format from server.");
        return;
      }

      setAllUser(data);
      setUsers(data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Failed to load accounts. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    setShowConfirmModal(true);
  };

  const confirmUpdate = async (id) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Append all user fields except imageFile
      Object.entries(newUser).forEach(([key, value]) => {
        if (key !== "imageFile") formData.append(key, value || "");
      });

      // Must include user id
      formData.append("id", id);

      // Append image file if exists
      if (newUser.imageFile) {
        formData.append("photo", newUser.imageFile); // <-- Must match backend multer
      }

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/update_account_admin`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(res.data.message || "Account updated successfully!");
      closeModal();
      handleAccounts();
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update account.");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const handleAddAccount = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      Object.entries(newUser).forEach(([key, value]) => {
        if (key !== "imageFile") formData.append(key, value);
      });

      // ✅ Must match `upload.single('photo')`
      if (newUser.imageFile) {
        formData.append("photo", newUser.imageFile);
      }

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/add_account`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data.message || "Account added successfully!");
      closeModal();
      handleAccounts();
    } catch (err) {
      console.error("Error adding account:", err);
      alert("Failed to add account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/delete_account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Account deleted successfully");
        handleAccounts();
      } else {
        alert(data.error || "Failed to delete account");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error");
    }
  };

  // 🔹 Effects
  useEffect(() => {
    handleAccounts();
  }, []);

  const openModal = (index = null) => {
    if (index !== null) {
      setNewUser(users[index]);
      setEditingIndex(index);
    } else {
      setNewUser({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        role: '',
        image: '',
      });
      setEditingIndex(null);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingIndex(null);
    setNewUser({
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      role: '',
      image: '',
    });
  };

  const handleInputChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewUser((prev) => ({
        ...prev,
        imageFile: file,
        image: URL.createObjectURL(file),
      }));
    }
  };


  const filteredUsers = users.filter(
    (user) =>
      `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>Manage Accounts</h2>
        <div className="services-actions">
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="services-search-input"
          />
          <button
            className="services-primary-btn"
            onClick={() => openModal()}
            disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.5 : 1 }}
          >
            Add Account
          </button>
        </div>
      </div>

      <div className="services-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Avatar</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", color: "red", padding: "20px" }}>
                  {error}
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                  No data found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>
                    {user.image ? (
                      <img src={user.image} alt={user.firstName} className="inventory-img-thumb" />
                    ) : (
                      <img
                        src={
                          user.role === "Admin"
                            ? "/images/logo.png"
                            : user.role === "Veterinarian" || user.role === "Veterinarian/Staff"
                              ? `/images/Default_Pic.jpg`
                              : `/images/Default_Pic.jpg`
                        }
                        alt="Default Avatar"
                        className="inventory-img-thumb"
                      />
                    )}
                  </td>
                  <td>
                    {user.role === "Admin"
                      ? "PawCare Admin"
                      : `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""} ${user.suffix || ""}`.trim() || "N/A"}
                  </td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "N/A"}</td>
                  <td>{user.role}</td>
                  <td>
                    <button className="services-edit-icon-btn" onClick={() => openModal(index)}>
                      <Edit size={16} />
                    </button>
                    <button className="services-delete-icon-btn" onClick={() => handleDeleteAccount(user.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="accounts-modal-overlay">
          <div className="accounts-modal-content">
            <h3>{editingIndex !== null ? "Edit Account" : "Add Account"}</h3>

            <div className="accounts-image-upload-wrapper">
              <div
                className="accounts-image-upload"
                onClick={() => document.getElementById("avatar-upload").click()}
              >
                {newUser.image ? (
                  <img src={newUser.image} alt="Avatar" className="uploaded-image" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="upload-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zM3 15l4-5 3 4 4-6 5 7H3z" />
                  </svg>
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden-input"
                />
              </div>
            </div>

            <div className="accounts-form-grid">
              {["firstName", "middleName", "lastName", "suffix", "username", "email", "phone", "password"].map(
                (field, i) => (
                  <input
                    key={i}
                    type={field === "email" ? "email" : field === "password" ? "password" : "text"}
                    name={field}
                    placeholder={field.replace(/([A-Z])/g, " $1")}
                    value={newUser[field]}
                    onChange={handleInputChange}
                  />
                )
              )}
              <select name="role" value={newUser.role} onChange={handleInputChange}>
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="Veterinarian">Veterinarian/Staff</option>
                <option value="User">User</option>
              </select>
            </div>

            <div className="accounts-modal-buttons">
              <button
                className="accounts-primary-btn"
                onClick={() => {
                  if (editingIndex !== null) handleUpdate(users[editingIndex].id);
                  else handleAddAccount();
                }}
                disabled={isSubmitting}
                style={{
                  backgroundColor: isSubmitting ? "#ccc" : "",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Processing..." : editingIndex !== null ? "Update" : "Add"}
              </button>
              <button className="accounts-cancel-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="profileupdateconfirm-overlay" onClick={() => setShowConfirmModal(false)}>
          <div
            className="profileupdateconfirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="profileupdateconfirm-title">Confirm Update</h3>
            <p className="profileupdateconfirm-message">
              Are you sure you want to update the Account information?
            </p>
            <div className="profileupdateconfirm-actions">
              <button
                className="profileupdateconfirm-btn cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="profileupdateconfirm-btn confirm"
                onClick={confirmUpdate}
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
