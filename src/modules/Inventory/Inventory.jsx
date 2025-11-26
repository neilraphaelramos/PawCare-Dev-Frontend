import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';
import "./Inventory.css";
import jsPDF from "jspdf";

// Utility: Generate item code based on group prefix
const generateItemCode = (group = 'X') => {
  const prefix = group.charAt(0).toUpperCase();
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${randomDigits}`;
};

// CSV export helper (unchanged)
function exportToCSV(data) {
  const headers = ['Item Code', 'Item Name', 'Item Group', 'Last Purchase', 'Expiration', 'Price', 'Stocks'];

  const rows = data.map(item => {
    // Remove any currency symbols or commas from price
    const cleanPrice = item.price ? String(item.price).replace(/[₱,\s]/g, '') : '';
    return [
      item.code,
      item.name,
      item.group,
      item.date,
      item.expiration,
      cleanPrice,
      item.stock,
    ];
  });

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += headers.join(',') + '\r\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\r\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'inventory_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToPDF(data) {
  const doc = new jsPDF();

  const headers = ['Item Code', 'Item Name', 'Item Group', 'Last Purchase', 'Expiration', 'Price', 'Stocks'];

  let startX = 14;
  let startY = 20;
  let lineHeight = 10;

  doc.setFontSize(16);
  doc.text("Inventory Report", startX, startY);
  startY += 10;

  doc.setFontSize(10);

  headers.forEach((header, i) => {
    doc.text(header, startX + i * 30, startY);
  });

  startY += lineHeight;

  data.forEach((item) => {
    let cleanPrice = "";
    if (item.price !== undefined && item.price !== null && item.price !== "") {
      cleanPrice = String(
        Number(String(item.price).replace(/[₱,\s]/g, ""))
          .toFixed(2)
      );
    }

    const row = [
      item.code,
      item.name,
      item.group,
      item.date,
      item.expiration,
      cleanPrice,
      String(item.stock ?? ""),
    ];

    row.forEach((cell, i) => {
      doc.text(String(cell ?? ""), startX + i * 30, startY);
    });

    startY += lineHeight;

    // Handle page break
    if (startY > 280) {
      doc.addPage();
      startY = 20;
    }
  });

  // Save PDF
  doc.save("inventory_report.pdf");
}

// Convert a date string from database to YYYY-MM-DD in local time
function formatDateLocal(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function InventoryTable() {
  const [inventoryData, setInventoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [newItem, setNewItem] = useState({
    id: undefined, code: '', photo: '', name: '', group: '', date: '',
    expiration: '', amount: '', stock: '', price: '', unit: '',
  });
  const [messageModal, setMessageModal] = useState('');
  const [selectedInventoryId, setSelectedInventoryId] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  const getPhotoUrl = (photo) => {
    if (!photo) return "";
    if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
    return `${process.env.REACT_APP_API_URL}/uploads/${photo}`;
  };

  const mapRowToUIItem = (row) => {
    const expirationDate = row.date_expiration ? new Date(row.date_expiration) : null;
    const today = new Date();
    let expirationStatus = "";
    if (expirationDate) {
      const diffDays = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) expirationStatus = "expired";
      else if (diffDays <= 30) expirationStatus = "warning";
      else expirationStatus = "normal";
    }

    return {
      id: row.product_ID,
      code: row.item_code,
      photo: row.photo || "",
      name: row.name || "",
      group: row.item_group || "",
      date: formatDateLocal(row.date_purchase),
      expiration: formatDateLocal(row.date_expiration),
      amount: row.amount || "",
      price: row.price ? `₱ ${Number(row.price).toFixed(2)}` : "",
      unit: row.unit || "",
      stock: row.stock ?? 0,
      low: row.stock !== null && row.stock < 5,
      expirationStatus,
    };
  };

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/inventory/fetch`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setInventoryData(res.data.data.map(mapRowToUIItem));
      } else {
        setInventoryData([]);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setInventoryData([]);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleEdit = (item) => {
    const priceInput = typeof item.price === "string" ? item.price.replace(/[₱,\s]/g, "") : item.price;
    setNewItem({ ...item, price: priceInput });
    setEditingIndex(item.id);
    setShowAddModal(true);
  };

  const handleDelete = (item) => {
    setSelectedInventoryId(item.id);
    setMessageModal('Are you sure you want to delete this item?');
    setShowConfirmModal(true);
  }

  const confirmDelete = async () => {
    if (!selectedInventoryId) return;
    setIsProcessing(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/inventory/delete/${selectedInventoryId}`);
      await fetchInventory();
    } catch (err) { console.error("Error deleting inventory:", err); }
    finally { setIsProcessing(false); setShowConfirmModal(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewItem(prev => ({ ...prev, photoFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => setNewItem(prev => ({ ...prev, photoPreview: reader.result }));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (showAddModal && newItem.group) {
      setNewItem(prev => ({ ...prev, code: prev.code || generateItemCode(prev.group) }));
    }
  }, [showAddModal, newItem.group]);

  const filteredData = inventoryData.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.name || '').toLowerCase().includes(term) ||
      (item.code || '').toLowerCase().includes(term) ||
      (item.group || '').toLowerCase().includes(term);

    const matchesDate = filterDate ? item.date === filterDate : true;
    const matchesExpiring = showExpiringOnly ? item.expirationStatus === "warning" || item.expirationStatus === "expired" : true;

    return matchesSearch && matchesDate && matchesExpiring;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!a.expiration) return 1;
    if (!b.expiration) return -1;
    return new Date(a.expiration) - new Date(b.expiration);
  });

  const totalEntries = sortedData.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalEntries);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  const handleRowsPerPageChange = (e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'group' && value && !prev.code) updated.code = generateItemCode(value);
      return updated;
    });
  };
  const sanitizeNumber = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const cleaned = String(val).replace(/[₱,\s]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : '';
  };

  const handleAddItem = async () => {
    if (newItem.code && newItem.name && newItem.group && newItem.date && newItem.stock && newItem.price) {
      setIsProcessing(true);
      const quantity = sanitizeNumber(newItem.stock);
      const price = sanitizeNumber(newItem.price);
      const formData = new FormData();
      formData.append('item_code', newItem.code);
      formData.append('name', newItem.name);
      formData.append('item_group', newItem.group);
      formData.append('date_purchase', newItem.date);
      formData.append('date_expiration', newItem.expiration);
      formData.append('amount', newItem.amount);
      formData.append('stock', quantity === '' ? 0 : quantity);
      formData.append('price', price === '' ? 0 : price);
      formData.append('unit', newItem.unit);
      if (!editingIndex || newItem.photoFile instanceof File) formData.append('photo', newItem.photoFile);

      try {
        if (editingIndex !== null) {
          await axios.put(`${process.env.REACT_APP_API_URL}/inventory/update/${editingIndex}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setMessageModal("Item updated successfully!");
        } else {
          await axios.post(`${process.env.REACT_APP_API_URL}/inventory/add`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setMessageModal("Item added successfully!");
        }
        await fetchInventory();
        setNewItem({ id: undefined, code: '', photoFile: null, name: '', group: '', date: '', expiration: '', stock: '', price: '', unit: '', amount: '' });
        setEditingIndex(null);
        setShowAddModal(false);
        setShowMessageModal(true);
      } catch (err) {
        console.error("Error saving inventory:", err);
        setMessageModal("There was an error saving the item. Please try again.");
        setShowMessageModal(true);
      } finally { setIsProcessing(false); }
    } else {
      setMessageModal("Please fill all fields");
      setShowMessageModal(true);
    }
  };

  const handleExport = (type) => {
    let exportData = [...inventoryData];
    if (filterMonth) {
      const [year, month] = filterMonth.split("-");
      exportData = exportData.filter(item => {
        if (!item.date) return false;
        const [itemYear, itemMonth] = item.date.split("-");
        return itemYear === year && itemMonth === month;
      });
    }
    if (type === 'csv') exportToCSV(exportData);
    else if (type === 'pdf') exportToPDF(exportData);
  };

  return (
    <div className="admin-inventory-container">
      <div className="admin-inventory-header">
        <h2>Inventory Management</h2>
        <div className="inventory-controls">
          <div className="month-input-wrapper">
            {!filterMonth && <span className="month-placeholder">MM/YYYY</span>}
            <input
              type="month"
              className="inventory-month-filter"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </div>
          <div className="admin-inventory-export-dropdown">
            <button
              className="admin-inventory-btn admin-inventory-export-btn admin-inventory-dropdown-toggle"
              onClick={() => setShowDropdown(prev => !prev)}
            >
              Export ▼
            </button>

            {showDropdown && (
              <div className="admin-inventory-dropdown-menu">
                <div
                  className="admin-inventory-dropdown-item"
                  onClick={() => {
                    handleExport("pdf");
                    setShowDropdown(false);
                  }}
                >
                  Export PDF
                </div>
                <div
                  className="admin-inventory-dropdown-item"
                  onClick={() => {
                    handleExport("csv");
                    setShowDropdown(false);
                  }}
                >
                  Export CSV
                </div>
              </div>
            )}
          </div>

          <button
            className="admin-inventory-add-item-btn"
            onClick={() => {
              setEditingIndex(null);
              setNewItem({
                id: undefined,
                code: "",
                photo: "",
                name: "",
                group: "",
                date: "",
                expiration: "",
                amount: "",
                stock: "",
                price: "",
                unit: "",
              });
              setShowAddModal(true);
            }}
          >
            + Add Item
          </button>
        </div>
      </div>

      <div className="inventory-filters-row">
        <input
          type="text"
          placeholder="Search by code, name or group..."
          className="inventory-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <input
          type="date"
          className="inventory-date-filter"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <label style={{ marginLeft: "10px" }}>
          <input type="checkbox" checked={showExpiringOnly} onChange={(e) => setShowExpiringOnly(e.target.checked)} />
          Show expiring items only
        </label>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Photo</th>
            <th>Item Name</th>
            <th>Item Group</th>
            <th>Last Purchase</th>
            <th>Expiration</th>
            <th>Price</th>
            <th>Stocks</th>
            <th>Amount Unit</th>
            <th>Unit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan="11" style={{ textAlign: "center", padding: "20px" }}>
                <div className="loading-spinner" />
                <p>Loading inventory...</p>
              </td>
            </tr>
          ) : filteredData.length === 0 ? (
            <tr>
              <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                No inventory found.
              </td>
            </tr>
          ) : (
            paginatedData.map((item, index) => (
              <tr key={item.id ?? index}>
                <td>{item.code}</td>
                <td>
                  <img
                    src={item.photo}
                    alt={item.name}
                    style={{
                      width: '50px',
                      height: '50px',
                      objectFit: 'cover',
                      borderRadius: '0',
                    }}
                  />
                </td>
                <td>{item.name}</td>
                <td>{item.group}</td>
                <td>{item.date}</td>
                <td style={{ color: item.expirationStatus === "expired" ? "red" : item.expirationStatus === "warning" ? "orange" : "black", fontWeight: item.expirationStatus === "expired" ? "bold" : "normal" }}>
                  {item.expiration}
                  {item.expirationStatus === "expired" && " ⚠ Expired"}
                  {item.expirationStatus === "warning" && " ⚠ Soon"}
                </td>
                <td>{item.price}</td>
                <td>
                  {item.stock}
                  {item.low && <span className="status-down"> ↓</span>}
                </td>
                <td>{item.amount || 0}</td>
                <td>{item.unit}</td>
                <td>
                  <button
                    className="admin-inventory-edit-icon-btn"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    className="admin-inventory-delete-icon-btn"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>

      </table>

      {showAddModal && (
        <div className="admin-inventory-modal-overlay">
          <div className="admin-inventory-modal-content">
            <h3 className="admin-inventory-modal-title">{editingIndex !== null ? 'Edit Product' : 'Add New Product'}</h3>

            <div className="admin-inventory-modal-grid">
              {/* Image Upload */}
              <div className="admin-inventory-image-upload-wrapper">
                <div
                  className="admin-inventory-image-upload"
                  onClick={() => document.getElementById('image-upload').click()}
                >
                  {newItem.photoPreview ? (
                    <img
                      src={newItem.photoPreview}
                      alt="Preview"
                      className="admin-inventory-uploaded-image"
                    />
                  ) : newItem.photo ? (
                    // fallback: show existing photo if editing an item
                    <img
                      src={getPhotoUrl(newItem.photo)}
                      alt="Existing"
                      className="admin-inventory-uploaded-image"
                    />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="admin-inventory-upload-icon"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 3a1 1 0 112 0 1 1 0 01-2 0zM3 15l4-5 3 4 4-6 5 7H3z" />
                    </svg>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="admin-inventory-hidden-input"
                  />
                </div>
              </div>

              <div className="admin-inventory-form-grid">
                <div className="admin-inventory-form-group">
                  <label htmlFor="code">Item Code</label>
                  <input type="text" id="code" name="code" value={newItem.code} className="admin-inventory-input-field" readOnly />
                </div>

                <div className="admin-inventory-form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" value={newItem.name} onChange={handleInputChange} className="admin-inventory-input-field" />
                </div>

                <div className="admin-inventory-form-group">
                  <label htmlFor="group">Category</label>
                  <select id="group" name="group" value={newItem.group} onChange={handleInputChange} className="admin-inventory-select-field">
                    <option value="">Select Category</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Food">Food</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Vaccine">Vaccine</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Toy">Toy</option>
                    <option value="Supplies">Supplies</option>
                  </select>
                </div>

                <div className="admin-inventory-form-group">
                  <label htmlFor="price">Price</label>
                  <input type="text" id="price" name="price" value={newItem.price} onChange={handleInputChange} className="admin-inventory-input-field" />
                </div>
              </div>

              <div className="admin-inventory-date-qty-grid">
                <div className="admin-inventory-form-group">
                  <label htmlFor="date">Date Purchase</label>
                  <input type="date" id="date" name="date" value={newItem.date} onChange={handleInputChange} className="admin-inventory-input-field" />
                </div>

                <div className="admin-inventory-form-group">
                  <label htmlFor="expiration">Expiration Date</label>
                  <input type="date" id="expiration" name="expiration" value={newItem.expiration} onChange={handleInputChange} className="admin-inventory-input-field" />
                </div>

                <div className="admin-inventory-form-group">
                  <label htmlFor="stock">Quantity</label>
                  <input type="number" id="stock" name="stock" value={newItem.stock} onChange={handleInputChange} className="admin-inventory-input-field" />
                </div>

                <div className='admin-inventory-form-group'>
                  <label htmlFor="amount">Amount</label>
                  <input type="number" id="amount" name="amount" value={newItem.amount} onChange={handleInputChange} className="admin-inventory-input-field" />
                </div>

                <div className="admin-inventory-form-group">
                  <label htmlFor="unit">Unit</label>
                  <select id="unit" name="unit" value={newItem.unit} onChange={handleInputChange} className="admin-inventory-select-field">
                    <option value="">Select Unit</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="tablet">tablet</option>
                    <option value="capsule">capsule</option>
                    <option value="bottle">bottle</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                    <option value="can">can</option>
                    <option value="pouch">pouch</option>
                  </select>
                </div>
              </div>

              <div className="admin-inventory-modal-actions">
                <button
                  onClick={handleAddItem}
                  className="admin-inventory-btn primary"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="invent-loader"></span>
                      &nbsp;Processing...
                    </>
                  ) : (
                    editingIndex !== null ? "Update Item" : "Add Item"
                  )}
                </button>

                <button onClick={() => setShowAddModal(false)} className="admin-inventory-btn secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pagination">
        <span>
          Showing {totalEntries === 0 ? 0 : startIndex + 1} - {endIndex} of {totalEntries} entries
        </span>

        <div className="page-controls">
          <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>&lt;</button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={currentPage === i + 1 ? "active" : ""}
              onClick={() => goToPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>&gt;</button>
        </div>

        <div className="show-entries">
          <span>Show</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
      </div>


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
                onClick={() => confirmDelete(selectedInventoryId)}
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
