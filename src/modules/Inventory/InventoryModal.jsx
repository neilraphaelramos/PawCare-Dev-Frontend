import React, { useState } from 'react';
import './InventoryModal.css';

const defaultTypes = ['Vaccine', 'Medication', 'Hygiene', 'Food', 'Supplement', 'Accessory'];

const InventoryModal = ({ onClose, onAddItem }) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [customType, setCustomType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [types, setTypes] = useState([...defaultTypes]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const finalType = selectedType || customType.trim();

    if (!name.trim() || !finalType || !quantity || !unit.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert('Quantity must be a positive number');
      return;
    }

    // Add new type if it’s valid and not already included
    if (!selectedType && customType.trim() && !types.includes(customType.trim())) {
      setTypes((prev) => [...prev, customType.trim()]);
    }

    onAddItem({
      name: name.trim(),
      type: finalType,
      quantity: quantityNum,
      unit: unit.trim(),
      image: imageFile, // send the image file object
    });

    // Reset fields
    setName('');
    setSelectedType('');
    setCustomType('');
    setQuantity('');
    setUnit('');
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <div className="invmodal-overlay" onClick={onClose}>
      <div className="invmodal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="invmodal-title">Add New Inventory Item</h3>
        <form onSubmit={handleSubmit} className="invmodal-form">
          <div className="invmodal-form-group">
            <label className="invmodal-label">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rabies Vaccine"
              className="invmodal-input"
            />
          </div>

          <div className="invmodal-form-group">
            <label className="invmodal-label">Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="invmodal-select"
            >
              <option value="">-- Select Type --</option>
              {types.map((t, idx) => (
                <option key={idx} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="invmodal-form-group">
            <label className="invmodal-label">Add New Type (if not listed):</label>
            <input
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="e.g. Cleaning Equipment"
              className="invmodal-input"
              disabled={!!selectedType}
            />
          </div>

          <div className="invmodal-form-group">
            <label className="invmodal-label">Quantity:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              placeholder="e.g. 10"
              className="invmodal-input"
            />
          </div>

          <div className="invmodal-form-group">
            <label className="invmodal-label">Unit:</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. vial, bottle, kg"
              className="invmodal-input"
            />
          </div>

          {/* New image upload input */}
          <div className="invmodal-form-group">
            <label className="invmodal-label">Upload Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="invmodal-input"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                style={{ marginTop: '10px', maxHeight: '150px', borderRadius: '8px' }}
              />
            )}
          </div>

          <div className="invmodal-buttons">
            <button type="submit" className="invmodal-btn invmodal-btn--add">Add</button>
            <button type="button" className="invmodal-btn invmodal-btn--cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;
