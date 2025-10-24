import React, { useState, useEffect } from 'react';
import './ViewOrders.css';
import axios from 'axios';
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";


export function exportToXLSX(data, filename = "orders.xlsx") {
  if (!data) {
    alert("No data to export");
    return;
  }

  // Ensure data is always an array
  const rows = Array.isArray(data) ? data : [data];

  if (rows.length === 0) {
    alert("No data to export");
    return;
  }

  // Clean and normalize values
  const cleanValue = (val) => {
    if (typeof val !== "string") return val;

    return val
      .replace(/^-\s*/, "")    // remove leading "- "
      .replace(/Ã—/g, "x")     // replace broken × with "x"
      .trim();
  };

  // Prepare cleaned data
  const cleanedData = rows.map((row) => {
    const newRow = {};
    for (const key in row) {
      newRow[key] = cleanValue(row[key]);
    }
    return newRow;
  });

  // Convert JSON to worksheet
  const worksheet = XLSX.utils.json_to_sheet(cleanedData);

  // Auto-fit columns based on max content length
  const colWidths = Object.keys(cleanedData[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...cleanedData.map((row) =>
        row[key] ? row[key].toString().length : 0
      )
    ),
  }));
  worksheet["!cols"] = colWidths;

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  // Export file
  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(data, filename = "orders.pdf") {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 5;
  let y = 20;

  // Title
  doc.setFontSize(13.5);
  doc.text("Orders Report", margin, y);
  y += 12;

  // Headers
  doc.setFontSize(10);
  const headers = ["ID", "Customer", "Address", "Date", "Total", "Status", "Items"];
  const colWidths = [12, 28, 45, 22, 22, 25, 45];
  const alignments = ["center", "left", "left", "center", "right", "center", "left"];

  // Compute col X positions
  const colX = headers.map((_, i) =>
    margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
  );
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  // Header background
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y - 5, tableWidth, 8, "F");
  headers.forEach((h, i) => {
    doc.text(h, colX[i] + 1, y, { maxWidth: colWidths[i] - 2 });
  });
  y += 8;

  // Rows
  data.forEach(order => {
    const row = [
      order.id.toString(),
      order.customer,
      order.address,
      order.date,
      order.total,   // ✅ force string with 2 decimals
      order.status,
      order.items.map(i => `${i.name} x ${i.quantity}`).join(", ")
    ];

    // Wrap text in each cell
    const wrapped = row.map((text, i) =>
      doc.splitTextToSize(String(text), colWidths[i] - 4) // ✅ ensure string
    );
    const rowHeight = Math.max(...wrapped.map(t => t.length)) * 5;

    // Draw each cell
    row.forEach((cellText, i) => {
      const cellX = colX[i];
      doc.rect(cellX, y - 4, colWidths[i], rowHeight, "S");

      const textLines = wrapped[i];
      let textY = y;
      textLines.forEach(line => {
        if (alignments[i] === "center") {
          const textWidth = doc.getTextWidth(line);
          const centerX = cellX + colWidths[i] / 2 - textWidth / 2;
          doc.text(line, centerX, textY);
        } else if (alignments[i] === "right") {
          const textWidth = doc.getTextWidth(line);
          const rightX = cellX + colWidths[i] - 2 - textWidth;
          doc.text(line, rightX, textY);
        } else {
          doc.text(line, cellX + 2, textY);
        }
        textY += 5;
      });
    });

    y += rowHeight;

    // Page break
    if (y > 270) {
      doc.addPage();
      y = 20;

      doc.setFillColor(230, 230, 230);
      doc.rect(margin, y - 5, tableWidth, 8, "F");
      headers.forEach((h, i) => {
        doc.text(h, colX[i] + 1, y);
      });
      y += 8;
    }
  });

  doc.save(filename);
}


const ViewOrders = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ Format date from yyyy-mm-dd → dd/mm/yyyy
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };


  // ✅ Normalize for input type="date" (yyyy-mm-dd)
  const toInputDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // ✅ Fetch & process orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/server-api/fetch/orders');
        if (res.data.success) {
          // Group items under each order
          const grouped = {};
          res.data.data.forEach(row => {
            if (!grouped[row.id_order]) {
              grouped[row.id_order] = {
                id: row.id_order,
                customer: row.customer_name,
                address: row.customer_address,
                date: row.order_date,
                total: row.total,
                status: row.order_status,
                items: []
              };
            }
            if (row.product_name) {
              grouped[row.id_order].items.push({
                name: row.product_name,
                quantity: row.quantity
              });
            }
          });

          // 👉 keep original DB order (no sorting)
          setOrders(Object.values(grouped));
        } else {
          console.error("Failed to fetch orders:", res.data.message);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    fetchOrders();
  }, []);

  // ✅ Apply filters
  const filteredOrders = orders.filter(order => {
    const matchesCustomer = order.customer.toLowerCase().includes(search.toLowerCase());
    const matchesItems = order.items.some(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
    const matchesSearch = matchesCustomer || matchesItems;

    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

    // Match date (compare yyyy-mm-dd)
    const matchesDate = !dateFilter || toInputDate(order.date) === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExport = (format) => {
    if (filteredOrders.length === 0) {
      alert("No data to export");
      return;
    }

    if (format === "xlsx") {
      const data = filteredOrders.map(order => ({
        ID: order.id,
        Customer: order.customer,
        Address: order.address,
        Date: formatDate(order.date),
        Total: order.total.toFixed(2),
        Status: order.status,
        Items: order.items.map(i => `${i.name} × ${i.quantity}`).join(", ")
      }));

      // ✅ must use .xlsx extension
      exportToXLSX(data, `orders_${statusFilter}.xlsx`);
    }

    if (format === "pdf") {
      const data = filteredOrders.map(order => ({
        id: order.id,
        customer: order.customer,
        address: order.address,
        date: formatDate(order.date),
        total: `PHP ${order.total}`,
        status: order.status,
        items: order.items
      }));
      exportToPDF(data, `orders_${statusFilter}.pdf`);
    }
  };

  return (
    <div className="vieworders-container">
      <div className="vieworders-header-row">
        <h2 className="vieworders-title">Manage Orders</h2>
        <div className="filters">
          <div className="vieworders-status-buttons">
            {['All', 'Pending', 'Delivery', 'Shipped', 'Cancelled'].map(status => (
              <button
                key={status}
                className={`vieworders-status-button ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}

          </div>

          <div className="vieworders-export-dropdown">
            <button
              className="vieworders-btn vieworders-export-btn vieworders-dropdown-toggle"
              onClick={() => setShowDropdown(prev => !prev)}
            >
              Export ▼
            </button>

            {showDropdown && (
              <div className="vieworders-dropdown-menu">
                <div
                  className="vieworders-dropdown-item"
                  onClick={() => { handleExport('pdf'); setShowDropdown(false); }}
                >
                  Export PDF
                </div>
                <div
                  className="vieworders-dropdown-item"
                  onClick={() => { handleExport('xlsx'); setShowDropdown(false); }}
                >
                  Export XLSX
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="search-date-row">
        <input
          type="text"
          placeholder="Search..."
          className="vieworders-search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="vieworders-date-input"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
      </div>

      <div className="vieworders-table-container">
        <table className="vieworders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Pet Product</th>
              <th>Address</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>
                    {order.items.map((item, idx) => (
                      <div key={idx}>{item.name} × {item.quantity}</div>
                    ))}
                  </td>
                  <td>{order.address}</td>
                  <td>{formatDate(order.date)}</td>
                  <td>₱{order.total.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={async e => {
                        const newStatus = e.target.value;

                        try {
                          await axios.put(`http://localhost:5000/update_status/orders/${order.id}`, {
                            status: newStatus
                          });

                          setOrders(prevOrders =>
                            prevOrders.map(o =>
                              o.id === order.id ? { ...o, status: newStatus } : o
                            )
                          );
                        } catch (err) {
                          console.error("Error updating order status:", err);
                        }
                      }}
                      className="status-select"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Delivery">Out for Delivery</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-message">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewOrders;
