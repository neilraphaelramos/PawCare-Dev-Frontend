import React, { useState, useEffect, useRef } from 'react';
import './ViewOrders.css';
import axios from 'axios';
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import './modalReceipt/receipt.css'
import html2canvas from 'html2canvas';

export function exportToXLSX(data, filename = "orders.xlsx") {
  if (!data) {
    setMessageModal("No data to export");
    return;
  }

  // Ensure data is always an array
  const rows = Array.isArray(data) ? data : [data];

  if (rows.length === 0) {
    setMessageModal("No data to export");
    setShowMessageModal(true);
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
    setMessageModal("No data to export");
    setShowMessageModal(true);
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
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageModal, setMessageModal] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef(null);

  // ✅ Format date from yyyy-mm-dd → dd/mm/yyyy
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePrintReceipt = () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) return;

    const buttons = receiptElement.querySelectorAll(".receipt-actions button");
    buttons.forEach(btn => (btn.style.display = "none"));

    const originalOpacity = receiptElement.style.opacity;
    const originalBg = receiptElement.style.backgroundColor;

    receiptElement.style.opacity = "1";
    receiptElement.style.backgroundColor = "#ffffff";

    setTimeout(() => {
      html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      }).then(canvas => {
        const imgData = canvas.toDataURL("image/png");

        receiptElement.style.opacity = originalOpacity;
        receiptElement.style.backgroundColor = originalBg;
        buttons.forEach(btn => (btn.style.display = ""));

        // Download the image
        const link = document.createElement("a");
        link.href = imgData;
        link.download = `receipt_${Date.now()}.png`;
        link.click();
      });
    }, 200); // 200ms delay
  };

  // ✅ Normalize for input type="date" (yyyy-mm-dd)
  const toInputDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/orders/fetch`);
      if (res.data.success) {
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
              items: [],
              cancel_requested: row.cancel_requested,
              methodPayments: row.methodPayments,
              paymentStatus: row.paymentStatus,
              paymentIntentId: row.payment_intent_id,
            };
          }
          if (row.product_name) {
            grouped[row.id_order].items.push({
              name: row.product_name,
              quantity: row.quantity
            });
          }
        });

        setOrders(Object.values(grouped));
      } else {
        console.error("Failed to fetch orders:", res.data.message);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fetch & process orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApproveCancel = (orderId, refund, methodPayments) => {
    setSelectedOrder({ orderId, refund, methodPayments });
    setShowConfirmModal(true);
    setMessageModal("Are you sure you want to approve this cancel request?");
  }

  const confirmApproved = async (orderId, refund, methodPayments) => {
    console.log("🟨 [Frontend] Approve cancel clicked:", {
      orderId,
      refund,
      methodPayments,
    });

    try {
      const payload = {
        id_order: orderId,
        refund,
        methodPayments,
      };

      console.log("📦 [Frontend] Sending payload to backend:", payload);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/orders/approve_cancel`,
        payload
      );

      console.log("✅ [Frontend] Response from backend:", res.data);

      setMessageModal(res.data.message);
      setShowMessageModal(true);
      fetchOrders();
    } catch (err) {
      console.error("❌ [Frontend] Error approving cancel:", err);
      setMessageModal("Error approving cancellation.");
      setShowMessageModal(true);
    }
  };


  const handleRejectCancel = async (orderId) => {
    if (!window.confirm("Reject cancel request?")) return;
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/orders/update_status/${orderId}`, {
        status: "Pending",
      });
      setMessageModal("Cancel request rejected.");
      setShowMessageModal(true);
      fetchOrders();
    } catch (err) {
      console.error("Error rejecting cancel:", err);
    }
  };

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

  const handleViewReceipt = async (orderId) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/order-receipt/receipt/${orderId}`);
      if (res.data.success) {
        setReceiptData({
          order_ref: res.data.receipt.order_ref,
          customer_name: res.data.receipt.customer_name,
          date_order: res.data.receipt.date_order,
          items: res.data.items,
          total: res.data.receipt.total
        });
        setShowReceipt(true); // show your existing receipt modal
      } else {
        setMessageModal("Receipt not found.");
        setShowMessageModal(true);
      }
    } catch (err) {
      console.error("Error loading receipt:", err);
      setMessageModal("Error loading receipt data.");
      setShowMessageModal(true);
    }
  };

  const handleExport = (format) => {
    if (filteredOrders.length === 0) {
      setMessageModal("No data to export");
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
              <th>Method</th>
              <th>Total</th>
              <th>Order Status</th>
              <th>Payment Status</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="10" className="loading-message">
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>
                    {order.items.map((item, idx) => (
                      <div key={idx}>
                        {item.name} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td>{order.address}</td>
                  <td>{formatDate(order.date)}</td>
                  <td>{order.methodPayments}</td>
                  <td>₱{order.total.toFixed(2)}</td>
                  <td>
                    {/* Status Dropdown */}
                    <select
                      value={order.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        await axios.put(
                          `${process.env.REACT_APP_API_URL}/orders/update_status/${order.id}`,
                          { status: newStatus }
                        );
                        fetchOrders();
                      }}
                      className={`badge ${order.status.toLowerCase()}`} // maintains badge color
                    >
                      <option value="Pending">Pending</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    {/* Payment Status Dropdown */}
                    <select
                      value={order.paymentStatus}
                      onChange={async (e) => {
                        const newPaymentStatus = e.target.value;
                        await axios.put(
                          `${process.env.REACT_APP_API_URL}/orders/update_payment_status/${order.id}`,
                          { paymentStatus: newPaymentStatus }
                        );
                        fetchOrders();
                      }}
                      className={`payment-badge ${order.paymentStatus.toLowerCase()}`}
                      style={{ marginTop: "0.5rem", display: "block", textAlign: "center" }} // spacing
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className='cursor-btn'
                      type='button'
                      onClick={() => handleViewReceipt(order.id)}
                    >
                      Show Receipt
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="empty-message">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                onClick={async () => {
                  if (!selectedOrder) return;
                  setIsProcessing(true);
                  await confirmApproved(
                    selectedOrder.orderId,
                    selectedOrder.refund,
                    selectedOrder.methodPayments
                  );
                  setIsProcessing(false);
                  setShowConfirmModal(false);
                }}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Confirm"}
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

      {showReceipt && receiptData && (
        <div className="admin-receipt-modal-overlay">
          <div className="admin-receipt-modal" id="admin-receipt-content" ref={receiptRef}>
            <h2>Payment Receipt</h2>
            <p><strong>Date:</strong> {new Date(receiptData.date_order).toLocaleString()}</p>
            <p><strong>Order Reference:</strong> {receiptData.order_ref}</p>
            <p><strong>Customer:</strong> {receiptData.customer_name}</p>

            <table className="admin-receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {receiptData.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.product_name}</td>
                    <td>{item.qty}</td>
                    <td>₱{item.price}</td>
                    <td>₱{(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" style={{ textAlign: "right" }}><strong>Total:</strong></td>
                  <td><strong>₱{receiptData.total}</strong></td>
                </tr>
              </tfoot>
            </table>

            <div className="admin-receipt-actions">
              <button onClick={() => setShowReceipt(false)}>Close</button>
              <button onClick={handlePrintReceipt}>Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOrders;
