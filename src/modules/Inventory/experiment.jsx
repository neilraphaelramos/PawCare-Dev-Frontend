import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import "./Inventory.css";

// Utility: Generate item code based on group prefix
const generateItemCode = (group = 'X') => {
    const prefix = group.charAt(0).toUpperCase();
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return ${ prefix }${ randomDigits };
};

const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return ${ day } /${month}/${ year };
};

// CSV export helper (unchanged)
function exportToCSV(data) {
    const headers = ['Item Code', 'Item Name', 'Item Group', 'Last Purchase', 'Expiration', 'Price', 'Stocks'];
    const rows = data.map(item => [
        item.code,
        item.name,
        item.group,
        item.date,
        item.expiration,
        item.price,
        item.stock,
    ]);

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

const API_BASE = "http://localhost:5000";

export default function InventoryTable() {
    // keep your initial dummy data but we will replace it with DB data on mount
    const [inventoryData, setInventoryData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;




    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        id: undefined,      // for edits
        code: '',
        photo: '',
        name: '',
        group: '',
        date: '',
        expiration: '',
        stock: '',
        price: '',
        unit: '',
    });

    // ---- Fetch & map helpers ----
    const parseDescription = (desc) => {
        if (!desc) return {};
        try { return JSON.parse(desc); } catch { return {}; }
    };

    const getPhotoUrl = (photo) => {
        if (!photo) return "";
        if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
        return ${ API_BASE } /uploads/${ photo };
    };

    const mapRowToUIItem = (row) => {
        return {
            id: row.product_ID,
            code: row.item_code,
            photo: row.photo || "",
            name: row.name || "",
            group: row.item_group || "",
            date: row.date_purchase ? new Date(row.date_purchase).toISOString().split("T")[0] : "",
            expiration: row.date_expiration ? new Date(row.date_expiration).toISOString().split("T")[0] : "",
            price: row.price ? ₱ ${ Number(row.price).toFixed(2) } : "",
                unit: row.unit || "",
                    stock: row.stock ?? 0,
                        low: row.stock !== null && row.stock < 5, // optional: flag for low stock
    };
};



const fetchInventory = async () => {
    try {
        const res = await axios.get(${ API_BASE } / fetch_inventory);

        // ✅ Frontend fix if backend sends plain array
        if (Array.isArray(res.data)) {
            const mapped = res.data.map(mapRowToUIItem);
            setInventoryData(mapped);
            console.table(mapped);
        }
    } catch (err) {
        console.error("Error fetching inventory:", err);
    }
};



useEffect(() => {
    fetchInventory();
}, []);

// ---- UI handlers (keep your design/UX) ----
const handleEdit = (index) => {
    const item = inventoryData[index];

    const priceInput = typeof item.price === "string"
        ? item.price.replace(/[₱,\s]/g, "")
        : item.price;

    setNewItem({
        id: item.id,
        code: item.code,
        photo: item.photo,
        name: item.name,
        group: item.group,
        date: item.date,
        expiration: item.expiration,
        stock: item.stock,
        unit: item.unit,
        price: priceInput,
    });
    setEditingIndex(index);
    setShowAddModal(true);
};

const handleDelete = async (index) => {
    const item = inventoryData[index];
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    try {
        await axios.delete(${ API_BASE } / delete_inventory / ${ item.id });
        setInventoryData(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
        console.error("Error deleting inventory:", err);
    }
};

const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        setNewItem((prevItem) => ({
            ...prevItem,
            photo: reader.result, // ✅ always store base64 data URL
        }));
    };
    reader.readAsDataURL(file);
};




useEffect(() => {
    if (showAddModal && newItem.group) {
        // Only generate if group is selected
        setNewItem((prev) => ({
            ...prev,
            code: prev.code || generateItemCode(prev.group),
        }));
    }
}, [showAddModal, newItem.group]);

// Filter inventory by search term (code, name, or group)
const filteredData = inventoryData.filter(item => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
        (item.name || '').toLowerCase().includes(term) ||
        (item.code || '').toLowerCase().includes(term) ||
        (item.group || '').toLowerCase().includes(term);

    // Exact date filter
    const matchesExactDate = !filterDate || item.date === filterDate;

    // Month filter (extract YYYY-MM)
    const itemMonth = item.date ? item.date.slice(0, 7) : "";
    const matchesMonth = !filterMonth || itemMonth === filterMonth;

    return matchesSearch && matchesExactDate && matchesMonth;
});

const indexOfLastRow = currentPage * rowsPerPage;
const indexOfFirstRow = indexOfLastRow - rowsPerPage;
const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

const totalPages = Math.ceil(filteredData.length / rowsPerPage);

// Handle form input change for Add Item modal
const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewItem((prev) => {
        const updated = { ...prev, [name]: value };

        // When group is changed, regenerate the item code (keep your behavior)
        if (name === 'group' && value && !prev.code) {
            updated.code = generateItemCode(value);
        }

        return updated;
    });
};

const sanitizeNumber = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const cleaned = String(val).replace(/[₱,\s]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : '';
};

const buildPayloadFromNewItem = () => {
    return {
        item_code: newItem.code,
        photo: newItem.photo || null,
        name: newItem.name,
        item_group: newItem.group,
        date_purchase: newItem.date || null,
        date_expiration: newItem.expiration || null,
        stock: sanitizeNumber(newItem.stock),
        price: sanitizeNumber(newItem.price),
        unit: newItem.unit || null,
    };
};



// Add/Update item to DB (preserve your validation + UX)
const handleAddItem = async () => {
    if (!newItem.code || !newItem.name || !newItem.group || !newItem.date || !newItem.stock || !newItem.price) {
        alert('Please fill all required fields');
        return;
    }

    const payload = buildPayloadFromNewItem(); // Make sure it sanitizes stock/price

    try {
        if (editingIndex !== null) {
            const editingItem = inventoryData[editingIndex];

            // ✅ Only send payload, ID is already in the URL
            await axios.put(${ API_BASE } / update_inventory / ${ editingItem.id }, payload);

            setSuccessMessage("Item updated successfully!");
        } else {
            await axios.post(${ API_BASE } / add_inventory, payload);
            setSuccessMessage("Item added successfully!");
        }

        await fetchInventory();

        // Reset form
        setNewItem({
            id: undefined,
            code: '',
            photo: '',
            name: '',
            group: '',
            date: '',
            expiration: '',
            stock: '',
            price: '',
            unit: '',
        });
        setEditingIndex(null);
        setShowAddModal(false);
        setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
        console.error("Error saving inventory:", err.response?.data || err.message);
        alert("There was an error saving the item. Please try again.");
    }
};




// simple export handler to keep your dropdown working
const handleExport = (type) => {
    if (type === 'csv') {
        exportToCSV(inventoryData);
    } else if (type === 'pdf') {
        // quick print for now; you can hook a real PDF export later
        window.print();
    }
};

return (
    <div className="admin-inventory-container">
        {/* Header row */}
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

        {/* Filters row */}
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
        </div>

        {successMessage && (
            <div className="success-popup">
                {successMessage}
            </div>
        )}


        <table className="inventory-table">
            <thead>
                <tr>
                    <th>Item Code</th>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Last Purchase</th>
                    <th>Expiration</th>
                    <th>Price</th>
                    <th>Stocks</th>
                    <th>Unit</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <AnimatePresence>
                    {currentRows.map((item, index) => (
                        <motion.tr
                            key={item.id ?? index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.5 }}
                        >
                            <td>{item.code}</td>
                            <td>
                                {item.photo ? (
                                    <img
                                        src={item.photo}
                                        alt={item.name}
                                        className="inventory-img-thumb"
                                    />
                                ) : (
                                    <span>No Image</span>
                                )}
                            </td>
                            <td>{item.name}</td>
                            <td>{item.group}</td>
                            <td>{formatDate(item.date)}</td>
                            <td>{formatDate(item.expiration)}</td>
                            <td>{item.price}</td>
                            <td>
                                {item.stock}
                                {item.low && <span className="status-down"> ↓</span>}
                            </td>
                            <td>{item.unit}</td>
                            <td>
                                <button
                                    className="admin-inventory-edit-icon-btn"
                                    onClick={() => handleEdit(index)}
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    className="admin-inventory-delete-icon-btn"
                                    onClick={() => handleDelete(index)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </motion.tr>
                    ))}
                </AnimatePresence>

                {filteredData.length === 0 && (
                    <tr>
                        <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                            No items found.
                        </td>
                    </tr>
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
                                {newItem.photo ? (
                                    <img src={newItem.photo} alt="Uploaded" className="admin-inventory-uploaded-image" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="admin-inventory-upload-icon" viewBox="0 0 20 20" fill="currentColor">
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
                            <button onClick={handleAddItem} className="admin-inventory-btn primary">{editingIndex !== null ? 'Update Item' : 'Add Item'}</button>
                            <button onClick={() => setShowAddModal(false)} className="admin-inventory-btn secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="pagination">
            <span className="entries-info">
                Showing {filteredData.length === 0 ? 0 : indexOfFirstRow + 1} –{" "}
                {Math.min(indexOfLastRow, filteredData.length)} of {filteredData.length} entries
            </span>

            {/* ✅ Wrap buttons in a full-width container */}
            <div className="page-controls-wrapper">
                <div className="page-controls">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    >
                        &lt;
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            className={currentPage === i + 1 ? "active" : ""}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    </div>
);
}
