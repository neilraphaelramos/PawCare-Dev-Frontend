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

  const handleAccounts = async () => {
    try {
      const { data } = await axios.post("/server-api/data");

      if (!Array.isArray(data)) {
        console.error("Invalid response format from server.");
        return;
      }

      setAllUser(data);

    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  const handleUpdate = async (id) => {
    if (!window.confirm("Are you sure you want to update this account?")) return;

    try {
      const response = await fetch("/server-api/update_account_admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          firstName: newUser.firstName,
          middleName: newUser.middleName,
          lastName: newUser.lastName,
          suffix: newUser.suffix,
          username: newUser.username,
          email: newUser.email,
          phone: newUser.phone,
          password: newUser.password,
          role: newUser.role,
          image: newUser.image
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setEditingIndex(null);
        handleAccounts();
        closeModal();
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Server error");
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/server-api/add_account", newUser);
      alert(res.data.message);
      closeModal();
      handleAccounts();
    } catch (err) {
      console.error("Error adding account:", err);
    }
  }

  useEffect(() => {
    setUsers(allUser);
  }, [allUser]);

  useEffect(() => {
    handleAccounts();
  }, []);

  const openModal = (index = null) => {
    if (index !== null) {
      setNewUser(users[index]);
      setEditingIndex(index);
    } else {
      setNewUser({
        fullName: '',
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
      fullName: '',
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewUser((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;

    try {
      const response = await fetch("/server-api/delete_account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Account deleted successfully");
        handleAccounts();
        closeModal();
      } else {
        alert(data.error || "Failed to delete account");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error");
    }
  };

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
          <button className="services-primary-btn" onClick={() => openModal()}>
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
            {users
              .filter(
                (user) =>
                  user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>
                    {user.image ? (
                      <img src={user.image} alt={user.fullName} className="inventory-img-thumb" />
                    ) : (
                      <div className="inventory-img-thumb empty-avatar" />
                    )}
                  </td>
                  <td>
                    {`${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""} ${user.suffix || ""}`.trim()}
                  </td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
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
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="accounts-modal-overlay">
          <div className="accounts-modal-content">
            <h3>{editingIndex !== null ? 'Edit Account' : 'Add Account'}</h3>

            <div className="accounts-image-upload-wrapper">
              <div
                className="accounts-image-upload"
                onClick={() => document.getElementById('avatar-upload').click()}
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
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={newUser.firstName}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="middleName"
                placeholder="Middle Name"
                value={newUser.middleName}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={newUser.lastName}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="suffix"
                placeholder="Suffix"
                value={newUser.suffix}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={newUser.username}
                onChange={handleInputChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={newUser.email}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={newUser.phone}
                onChange={handleInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={newUser.password}
                onChange={handleInputChange}

              />
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
                  if (editingIndex !== null) {
                    handleUpdate(users[editingIndex].id);  // pass id here
                  } else {
                    handleAddAccount();
                  }
                }}
              >
                {editingIndex !== null ? "Update" : "Add"}
              </button>
              <button className="accounts-cancel-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
