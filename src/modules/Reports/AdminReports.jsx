import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "./AdminReports.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UserContext } from "../../hook/authContext";

function AdminReports() {
    const [reports, setReports] = useState({
        orders: [],
        product_solds: [],
        pets: [],
        visits: [],
        appointments: [],
        stock: [],
        totalSpecies: [],
        servicesUsage: [],
        vetLogs: [],
    });

    const [startDate, setStartDate] = useState(
        new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        ).toLocaleDateString('en-CA')
    );

    const [endDate, setEndDate] = useState(
        new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0
        ).toLocaleDateString('en-CA')
    );

    const { user } = useContext(UserContext);

    const [selectedReport, setSelectedReport] = useState("All");
    const [reportOpen, setReportOpen] = useState(false);
    const [formatOpen, setFormatOpen] = useState(false);

    // 🔥 FILTER HELPER — SHOW CARD ONLY WHEN SELECTED OR WHEN "ALL"
    const isVisible = (key) => {
        return selectedReport === "All" || selectedReport === key;
    };

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const { data } = await axios.get(
                    `${process.env.REACT_APP_API_URL}/reports/range?start_date=${startDate}&end_date=${endDate}`
                );

                setReports({
                    orders: {
                        summary: data.summary.orders || {},
                        details: data.details?.orders || [],
                    },
                    pets: {
                        summary: data.summary.pets || {},
                        details: data.details?.pets || [],
                    },
                    visits: data.details.visits || [],
                    appointments: {
                        summary: data.summary.appointments || {},
                        details: data.details.appointments || []
                    },
                    product_solds: data.details?.products_sold || [],
                    stock: {
                        summary: data.summary.inventoryStock || []
                    },
                    totalSpecies: {
                        details: data.details.totalspecies || []
                    },
                    servicesUsage: data.details.servicesCount || [],
                    vetLogs: data.details.vet_logs || [],
                });

            } catch (err) {
                console.error("❌ Error fetching monthly reports:", err);
            }
        };
        fetchReports();
    }, [startDate, endDate]);

    const exportToExcel = (reportKey = "All") => {
        const workbook = XLSX.utils.book_new();
        const printedBy = `${user.firstName} ${user.lastName}`;

        const reportsToExport = reportKey === "All"
            ? reports
            : { [reportKey]: reports[reportKey] };

        Object.entries(reportsToExport).forEach(([key, data]) => {
            let sheetData = [];

            if (key === "stock") {
                sheetData = Array.isArray(data.summary) ? data.summary : [];
            } else if (Array.isArray(data)) {
                sheetData = data;
            } else if (data.details) {
                sheetData = data.details;
            } else if (data.summary) {
                sheetData = [data.summary];
            }

            if (sheetData.length) {
                sheetData.push({ "": `Printed by: ${printedBy}` });
            } else {
                sheetData = [{ "": `Printed by: ${printedBy}` }];
            }

            const worksheet = XLSX.utils.json_to_sheet(sheetData);

            // Auto-fit columns
            const colWidths = sheetData[0]
                ? Object.keys(sheetData[0]).map((_, colIndex) => {
                    let max = 10;
                    sheetData.forEach((row) => {
                        const val = Object.values(row)[colIndex];
                        if (val != null) max = Math.max(max, String(val).length);
                    });
                    return { wch: max + 2 };
                })
                : [];
            worksheet['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                key.charAt(0).toUpperCase() + key.slice(1)
            );
        });

        const fileName = `PawCareVet_Reports_${startDate}_to_${endDate}.xlsx`;
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, fileName);
    };

    const exportToPDF = (reportKey = "All") => {
        const doc = new jsPDF("p", "pt");
        const printedBy = `${user.firstName} ${user.lastName}`;
        const pageWidth = doc.internal.pageSize.getWidth();
        let yOffset = 40;

        // Header: Logo and clinic info
        const img = new Image();
        img.src = "/images/LandingPage/rivera-logo.png";
        img.onload = () => {
            const imgWidth = 60;
            const imgHeight = 60;
            doc.addImage(img, "PNG", 40, yOffset, imgWidth, imgHeight);

            const clinicText = [
                "PetCare Animal Clinic",
                "123 Veterinary Street, Bocaue, Bulacan",
                "Contact: (044) 123-4567 | Email: petcare@clinic.com",
                `Date: ${new Date().toLocaleDateString()}`
            ];
            doc.setFontSize(12);
            clinicText.forEach((line, index) => {
                doc.text(line, pageWidth / 2 + imgWidth / 2, yOffset + index * 14, { align: "center" });
            });

            yOffset += imgHeight + 20;

            doc.setFontSize(18);

            const reportTitles = {
                All: "Summary Reports",
                orders: "Order Reports",
                product_solds: "Product Sold Reports",
                pets: "Registered Pet Reports",
                visits: "Clinic Visit Reports",
                appointments: "Appointment Reports",
                stock: "Inventory Reports",
                totalSpecies: "Pet Types & Species",
                servicesUsage: "Pet Service Usage Reports",
                vetLogs: "Veterinarian Logs"
            };

            const headerTitle = reportTitles[reportKey] || "Summary Reports";
            doc.text(headerTitle, pageWidth / 2, yOffset, { align: "center" });
            yOffset += 25;

            doc.setFontSize(12);
            doc.text(`Date Range: ${startDate} to ${endDate}`, pageWidth / 2, yOffset, { align: "center" });
            yOffset += 25;

            const reportsToExport = reportKey === "All" ? reports : { [reportKey]: reports[reportKey] };

            const addTable = (title, columns, rows) => {
                if (!rows || rows.length === 0) return;

                doc.setFontSize(14);
                doc.text(title, 40, yOffset);
                yOffset += 5;

                autoTable(doc, {
                    startY: yOffset,
                    head: [columns],
                    body: rows,
                    theme: "grid",
                    headStyles: { fillColor: [50, 178, 178], textColor: 255, halign: "center" },
                    styles: { fontSize: 10 },
                    margin: { left: 40, right: 40 },
                    didDrawPage: (data) => {
                        // Update yOffset for next table
                        yOffset = data.cursor.y + 40;

                        // Add page number
                        const pageNumber = doc.internal.getNumberOfPages();
                        doc.setFontSize(10);
                        doc.text(`Page ${pageNumber}`, pageWidth - 50, doc.internal.pageSize.getHeight() - 20);
                    },
                });
            };

            // Loop through selected reports
            Object.entries(reportsToExport).forEach(([key, data]) => {
                switch (key) {
                    case "orders":
                        addTable(
                            "Order Reports",
                            ["Order ID", "Client", "Status", "Payment Status", "Items", "Total", "Date"],
                            data.details?.map((o) => [
                                o.id_order,
                                o.customer_name,
                                o.order_status,
                                o.paymentStatus,
                                o.items_purchased,
                                Number(o.total),
                                new Date(o.order_date).toLocaleDateString(),
                            ])
                        );
                        break;
                    case "product_solds":
                        addTable(
                            "Product Reports",
                            ["Item ID", "Name", "Total Sold"],
                            data.map((p) => [p.product_id, p.product_name, Number(p.total_sold)])
                        );
                        break;
                    case "pets":
                        addTable(
                            "Registered Pet Reports",
                            ["Pet Name", "Owner", "Species", "Date Added"],
                            data.details?.map((p) => [
                                p.pet_name,
                                p.owner_name,
                                p.species,
                                new Date(p.created_At).toLocaleDateString()
                            ])
                        );
                        break;
                    case "visits":
                        addTable(
                            "Clinic Visit Reports",
                            ["Visit ID", "Owner", "Pet", "Veterinarian", "Visit Date"],
                            data?.map((v) => [
                                v.id_pet_history,
                                v.owner_name,
                                v.pet_name,
                                `Dr. ${v.veterinarian_name}`,
                                new Date(v.date_visit).toLocaleDateString()
                            ])
                        );
                        break;
                    case "appointments":
                        addTable(
                            "Appointment Reports",
                            ["ID", "Owner", "Date", "Status"],
                            data.details?.map((a) => [
                                a.id_appoint,
                                a.owner_name,
                                new Date(a.set_date).toLocaleDateString(),
                                a.status
                            ])
                        );
                        break;
                    case "stock":
                        addTable(
                            "Inventory Reports",
                            ["Item Name", "Stock In", "Stock Out", "Current Stock", "Date"],
                            data.summary?.map((i) => [
                                i.product_name,
                                Number(i.total_stock_in),
                                Number(i.total_stock_out),
                                Number(i.current_stock),
                                new Date(i.last_movement_date).toLocaleDateString()
                            ])
                        );
                        break;
                    case "totalSpecies":
                        addTable(
                            "Pet Types & Species",
                            ["#", "Species", "Pet Type", "Total Species"],
                            data.details?.map((p, i) => [i + 1, p.species, p.petType, Number(p.total_species)])
                        );
                        break;
                    case "servicesUsage":
                        addTable(
                            "Pet Service Usage",
                            ["Service", "Used Count"],
                            data?.map((s) => [s.service_title, Number(s.usage_count || 0)])
                        );
                        break;
                    case "vetLogs":
                        addTable(
                            "Veterinarian Logs",
                            ["Vet Name", "Time In", "Action"],
                            data?.map((log) => [
                                log.vetName,
                                new Date(log.time_In).toLocaleString(),
                                log.action_vet
                            ])
                        );
                        break;
                    default:
                        break;
                }
            });

            // Footer signature
            const pageHeight = doc.internal.pageSize.getHeight();
            const footerHeight = 50; // space needed for signature

            // Check if we need a new page for footer
            if (yOffset + footerHeight > pageHeight) {
                doc.addPage();
                yOffset = pageHeight - footerHeight; // place at bottom of new page
            } else {
                yOffset = pageHeight - footerHeight; // place at bottom of current page
            }

            doc.setFontSize(12);
            doc.text("_________________________", pageWidth / 2, yOffset, { align: "center" });
            yOffset += 15;
            doc.setFont("helvetica", "bold");
            doc.text(`Prepared by: ${user.firstName} ${user.lastName}`, pageWidth / 2, yOffset, { align: "center" });
            yOffset += 15;
            doc.setFont("helvetica", "normal");
            doc.text("Administrator", pageWidth / 2, yOffset, { align: "center" });


            doc.save(`PawCareVet_Reports_${startDate}_to_${endDate}_${reportKey}.pdf`);
        };
    };

    return (
        <div className="admin-report-container">
            <div className="admin-report-header">
                <h2>Reports</h2>

                <div className="admin-report-actions">
                    {/* REPORT TYPE DROPDOWN */}
                    <div className="report-select-dropdown" style={{ position: "relative" }}>
                        <button
                            className="admin-export-btn"
                            onClick={() => setReportOpen(!reportOpen)}
                            style={{ padding: "8px 12px", cursor: "pointer" }}
                        >
                            {selectedReport || "All"} ▾
                        </button>

                        {reportOpen && (
                            <ul
                                style={{
                                    position: "absolute",
                                    top: "80%",
                                    left: "50%",       // center horizontally
                                    transform: "translateX(-50%)", // shift left by 50% of ul width
                                    backgroundColor: "#fff",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    listStyle: "none",
                                    padding: 0,
                                    margin: 0,
                                    minWidth: "150px",
                                    zIndex: 100,
                                    textAlign: "center"
                                }}
                            >
                                <li
                                    style={{ padding: 8, cursor: "pointer" }}
                                    onClick={() => { setSelectedReport("All"); setReportOpen(false); }}
                                >
                                    All
                                </li>

                                {Object.keys(reports).map((key) => (
                                    <li
                                        key={key}
                                        style={{ padding: 8, cursor: "pointer" }}
                                        onClick={() => { setSelectedReport(key); setReportOpen(false); }}
                                    >
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* DATE FILTERS */}
                    <div className="admin-report-filters">
                        <label>
                            Start Date:
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </label>
                        <label>
                            End Date:
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </label>
                    </div>

                    {/* EXPORT DROPDOWN */}
                    <div style={{ position: "relative" }}>
                        <button
                            className="admin-export-btn"
                            onClick={() => setFormatOpen(!formatOpen)}
                            style={{ padding: "8px 12px", cursor: "pointer" }}
                            disabled={!selectedReport}
                        >
                            Export ▾
                        </button>

                        {formatOpen && (
                            <ul
                                style={{
                                    position: "absolute",
                                    top: "80%",
                                    left: "50%",       // center horizontally
                                    transform: "translateX(-50%)", // shift left by 50% of ul width
                                    backgroundColor: "#fff",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    listStyle: "none",
                                    padding: 0,
                                    margin: 0,
                                    minWidth: "120px",
                                    zIndex: 100,
                                    textAlign: "center"
                                }}
                            >
                                <li
                                    style={{ padding: 8, cursor: "pointer" }}
                                    onClick={() => {
                                        exportToExcel(selectedReport === "All" ? "All" : selectedReport);
                                        setFormatOpen(false);
                                    }}
                                >
                                    Excel
                                </li>

                                <li
                                    style={{ padding: 8, cursor: "pointer" }}
                                    onClick={() => {
                                        exportToPDF(selectedReport === "All" ? "All" : selectedReport);
                                        setFormatOpen(false);
                                    }}
                                >
                                    PDF
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <div className="admin-report-grid">

                {isVisible("orders") && (
                    <div className="admin-report-card">
                        <h3>Order Reports</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Client</th>
                                        <th>Status</th>
                                        <th>Payment Status</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.orders.details?.length ? (
                                        reports.orders.details.map((o) => (
                                            <tr key={o.id_order}>
                                                <td>{o.id_order}</td>
                                                <td>{o.customer_name}</td>
                                                <td>{o.order_status}</td>
                                                <td>{o.paymentStatus}</td>
                                                <td>{o.items_purchased}</td>
                                                <td>₱{o.total}</td>
                                                <td>{new Date(o.order_date).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="7" className="empty-row">No orders this month</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isVisible("product_solds") && (
                    <div className="admin-report-card">
                        <h3>Item Reports</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item ID</th>
                                        <th>Name Product</th>
                                        <th>Total Sold</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.product_solds?.length ? (
                                        reports.product_solds.map((item) => (
                                            <tr key={item.product_id}>
                                                <td>{item.product_id}</td>
                                                <td>{item.product_name}</td>
                                                <td>{item.total_sold}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" className="empty-row">No orders this month</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isVisible("orders") && (
                    <div className="admin-report-card">
                        <h3>Total Order Reports</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Total Orders</th>
                                        <th>Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.orders.summary ? (
                                        <tr>
                                            <td>{reports.orders.summary.total_orders || 0}</td>
                                            <td>₱{reports.orders.summary.total_revenue?.toLocaleString() || 0}</td>
                                        </tr>
                                    ) : (
                                        <tr><td colSpan="2" className="empty-row">No orders this month</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isVisible("pets") && (
                    <div className="admin-report-card">
                        <h3>Registered Pet Reports</h3>
                        <p><strong>Total Pets:</strong> {reports.pets.summary?.total_pets || 0}</p>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Pet Name</th>
                                        <th>Owner</th>
                                        <th>Species</th>
                                        <th>Date Added</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.pets.details?.length ? (
                                        reports.pets.details.map((p) => (
                                            <tr key={p.pinfo}>
                                                <td>{p.pet_name}</td>
                                                <td>{p.owner_name}</td>
                                                <td>{p.species}</td>
                                                <td>{new Date(p.created_At).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="empty-row">No pets added this month</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isVisible("totalSpecies") && (
                    <div className="admin-report-card">
                        <h3>Pet Types & Species Report</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Species</th>
                                        <th>Pet Type</th>
                                        <th>Total Species</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.totalSpecies.details?.length ? (
                                        reports.totalSpecies.details.map((p, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{p.species}</td>
                                                <td>{p.petType}</td>
                                                <td>{p.total_species}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="empty-row">No pets added this month</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isVisible("visits") && (
                    <div className="admin-report-card">
                        <h3>Clinic Visit Reports</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Visit ID</th>
                                        <th>Owner</th>
                                        <th>Pet</th>
                                        <th>Veterinarian</th>
                                        <th>Visit Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.visits?.length ? (
                                        reports.visits.map((v) => (
                                            <tr key={v.id_pet_history}>
                                                <td>{v.id_pet_history}</td>
                                                <td>{v.owner_name}</td>
                                                <td>{v.pet_name}</td>
                                                <td>Dr. {v.veterinarian_name}</td>
                                                <td>{new Date(v.date_visit).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="empty-row">No visits this month</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isVisible("stock") && (
                    <div className="admin-report-card">
                        <h3>Inventory Reports</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Stock In</th>
                                        <th>Stock Out</th>
                                        <th>Current Stock</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.stock.summary?.length ? (
                                        reports.stock.summary.map((i, index) => (
                                            <tr key={index}>
                                                <td>{i.product_name}</td>
                                                <td>{i.total_stock_in}</td>
                                                <td>{i.total_stock_out}</td>
                                                <td>{i.current_stock}</td>
                                                <td>{new Date(i.last_movement_date).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="empty-row">No inventory updates this month</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isVisible("appointments") && (
                    <div className="admin-report-card">
                        <h3>Appointment Reports</h3>

                        <div className="admin-appoint-summary">
                            <div className="appoint-top">
                                <div className="admin-appoint-item approved">
                                    <strong>Total Approved:</strong>
                                    <span>{reports.appointments.summary?.approved || 0}</span>
                                </div>
                                <div className="admin-appoint-item pending">
                                    <strong>Total Pending:</strong>
                                    <span>{reports.appointments.summary?.pending || 0}</span>
                                </div>
                            </div>

                            <div className="appoint-bottom">
                                <div className="admin-appoint-item declined">
                                    <strong>Total Declined:</strong>
                                    <span>{reports.appointments.summary?.declined || 0}</span>
                                </div>
                                <div className="admin-appoint-item total">
                                    <strong>Total Appointments:</strong>
                                    <span>{reports.appointments.summary?.total_appointments || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Owner</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.appointments.details?.length ? (
                                        reports.appointments.details.map((a) => (
                                            <tr key={a.id_appoint}>
                                                <td>{a.id_appoint}</td>
                                                <td>{a.owner_name}</td>
                                                <td>{new Date(a.set_date).toLocaleDateString()}</td>
                                                <td>{a.status}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="empty-row">No appointments this month</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isVisible("servicesUsage") && (
                    <div className="admin-report-card">
                        <h3>Pet Service Reports</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Used Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.servicesUsage?.length ? (
                                        reports.servicesUsage.map((s) => (
                                            <tr key={s.service_id}>
                                                <td>{s.service_title}</td>
                                                <td>{s.usage_count || 0}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" className="empty-row">No service usage this month</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isVisible("vetLogs") && (
                    <div className="admin-report-card">
                        <h3>Veterinarian Logs</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Time</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.vetLogs?.length ? (
                                        reports.vetLogs.map((log) => (
                                            <tr key={log.log_ID}>
                                                <td>{log.vetName}</td>
                                                <td>{new Date(log.time_In).toLocaleString()}</td>
                                                <td>{log.action_vet}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="empty-row">No user logs available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminReports;
