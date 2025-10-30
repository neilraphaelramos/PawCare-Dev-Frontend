import React, { useState, useContext } from "react";
import "./Profile.css";
import { UserContext } from "../../hook/authContext";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const { user, setUser } = useContext(UserContext);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    middleName: user.middleName || "",
    lastName: user.lastName || "",
    suffix: user.suffix || "",
    email: user.email || "",
    phone: user.phone || "",
    bio: user.bio || "",
    houseNumber: user.houseNum || "",
    province: user.province || "",
    municipality: user.municipality || "",
    barangay: user.barangay || "",
    zipCode: user.zipCode || "",
    currentPassword: "" || "",
    newPassword: "",
    confirmPassword: "",
    profileImage: user.pic,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;


    if (name === "profileImage" && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result,
          imageFile: file,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmUpdate = async () => {
    setShowConfirmModal(false);

    try {
      const form = new FormData();
      form.append("id", user.id);
      form.append("firstName", formData.firstName);
      form.append("middleName", formData.middleName);
      form.append("lastName", formData.lastName);
      form.append("suffix", formData.suffix);
      form.append("phone", formData.phone);
      form.append("bio", formData.bio);
      form.append("houseNumber", formData.houseNumber);
      form.append("province", formData.province);
      form.append("municipality", formData.municipality);
      form.append("barangay", formData.barangay);
      form.append("zipCode", formData.zipCode);
      form.append("currentPassword", formData.currentPassword);
      form.append("newPassword", formData.newPassword);
      form.append("password", formData.confirmPassword);

      if (formData.imageFile) {
        form.append("profile_Pic", formData.imageFile);
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/update_profile`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (response.ok) {
        setResultMessage(data.message || "Profile updated successfully!");
        setUser(data.user);
        setIsEditing(false);
        setTimeout(() => setIsEditing(true), 5000);
      } else {
        setResultMessage(data.error || "Update failed.");
      }
    } catch (err) {
      console.error("Update error:", err);
      setResultMessage("Server error. Please try again.");
    }

    setShowResultModal(true);
  };

  const toggleImageModal = () => setShowImageModal((prev) => !prev);

  return (
    <div className="pf-profile">
      <h2 className="pf-profile__title">My Profile</h2>

      <form onSubmit={handleUpdateSubmit} className="pf-profile__form">
        <div className="pf-profile__card pf-profile__card--header">
          <div className="pf-profile__avatar-section">
            <div className="pf-profile__avatar-wrapper">
              <img
                src={
                  formData.profileImage || "/images/Default_Pic.jpg"
                }
                alt="avatar"
                className="pf-profile__avatar-image"
              />
              <button
                type="button"
                className="pf-profile__edit-icon"
                onClick={toggleImageModal}
              >
                ✎
              </button>
            </div>
            <div className="pf-profile__user-info">
              <h3 className="pf-profile__user-name">
                {formData.firstName} {formData.lastName}
              </h3>
              <p className="pf-profile__user-bio">{formData.bio}</p>
              <span className="pf-profile__user-location">
                {formData.state}, {formData.country}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="pf-profile__card">
          <div className="pf-profile__card-header">
            <h4>Personal Information</h4>
          </div>
          <div className="pf-profile__card-body pf-profile__card-body--two-columns">
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">First Name</label>
              <input
                className="pf-profile__input"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Middle Name</label>
              <input
                className="pf-profile__input"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Last Name</label>
              <input
                className="pf-profile__input"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Suffix</label>
              <input
                className="pf-profile__input"
                name="suffix"
                value={formData.suffix}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Email Address</label>
              <input
                className="pf-profile__input"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Phone</label>
              <input
                className="pf-profile__input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="pf-profile__input-group pf-profile__input-group--full-width">
              <label className="pf-profile__label">Bio</label>
              <input
                className="pf-profile__input"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Address Info */}
        <div className="pf-profile__card">
          <div className="pf-profile__card-header">
            <h4>Address</h4>
          </div>
          <div className="pf-profile__card-body pf-profile__card-body--two-columns">
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">House Number</label>
              <input
                className="pf-profile__input"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Province</label>
              <input
                className="pf-profile__input"
                name="province"
                value={formData.province}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Municipality</label>
              <input
                className="pf-profile__input"
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Barangay</label>
              <input
                className="pf-profile__input"
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Zip Code</label>
              <input
                className="pf-profile__input"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="pf-profile__card">
          <div className="pf-profile__card-header">
            <h4>Change Password</h4>
          </div>
          <div className="pf-profile__card-body pf-profile__card-body--two-columns">
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">Current Password</label>
              <input
                className="pf-profile__input"
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </div>
            <div className="pf-profile__input-group">
              <label className="pf-profile__label">New Password</label>
              <input
                className="pf-profile__input"
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>
            <div className="pf-profile__input-group pf-profile__input-group--full-width">
              <label className="pf-profile__label">Confirm New Password</label>
              <input
                className="pf-profile__input"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="pf-profile__save-btn">
          Save Changes
        </button>
      </form>

      {/* Modal */}
      {showImageModal && (
        <div className="pf-profile__modal-overlay" onClick={toggleImageModal}>
          <div
            className="pf-profile__modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="pf-profile__modal-title">Change Profile Picture</h3>
            <img
              className="pf-profile__modal-avatar"
              src={
                formData.profileImage
              }
              alt="Current"
            />
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleChange}
              className="pf-profile__modal-file-input"
            />
            <button
              onClick={toggleImageModal}
              className="pf-profile__close-modal-btn"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ✅ Confirm Modal */}
      {showConfirmModal && (
        <div className="profileupdateconfirm-overlay" onClick={() => setShowConfirmModal(false)}>
          <div
            className="profileupdateconfirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="profileupdateconfirm-title">Confirm Update</h3>
            <p className="profileupdateconfirm-message">
              Are you sure you want to update your profile information?
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

      {/* ✅ Result Modal */}
      {showResultModal && (
        <div className="profileupdateresult-overlay" onClick={() => setShowResultModal(false)}>
          <div
            className="profileupdateresult-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="profileupdateresult-title">Profile Update</h3>
            <p className="profileupdateresult-message">{resultMessage}</p>
            <button
              className="profileupdateresult-btn"
              onClick={() => setShowResultModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
