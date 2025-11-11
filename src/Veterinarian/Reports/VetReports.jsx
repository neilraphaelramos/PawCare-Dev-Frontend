import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "./VetReports.css";
import "../../modules/Reports/AdminReports.css"
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { UserContext } from "../../hook/authContext";

function VetReports() {
    const { user } = useContext(UserContext);

    const [reports, setReports] = useState({
        orders: [],
        product_solds: [],
        pets: [],
        visits: [],
        appointments: [],
        stock: [],
        totalSpecies: [],
        servicesUsage: [],
    });
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchReports = async () => {
            console.log(month);
            console.log(year);
            try {
                const { data } = await axios.get(
                    `${process.env.REACT_APP_API_URL}/reports/monthly?month=${month}&year=${year}`
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
                    servicesUsage: data.details.servicesCount || []
                });

                console.log("✅ Monthly Reports Data:", data);
            } catch (err) {
                console.error("❌ Error fetching monthly reports:", err);
            }
        };
        fetchReports();
    }, [month, year]);

    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();
        const printedBy = `Dr. ${user.firstName}`

        Object.entries(reports).forEach(([key, data]) => {
            let sheetData = [];

            // Handle Inventory specifically
            if (key === "stock") {
                sheetData = Array.isArray(data.summary) && data.summary.length
                    ? data.summary
                    : [];
            } else if (Array.isArray(data)) {
                sheetData = data;
            } else if (data.details) {
                sheetData = data.details;
            } else if (data.summary) {
                sheetData = [data.summary]; // summary as single row
            }

            // Add footer row with "Printed by"
            if (sheetData.length) {
                sheetData.push({ "": `Printed by: ${printedBy}` });
            } else {
                // if sheet is empty, just show printed by row
                sheetData = [{ "": `Printed by: ${printedBy}` }];
            }

            const worksheet = XLSX.utils.json_to_sheet(sheetData);

            // Autofit columns
            const colWidths = sheetData[0]
                ? Object.keys(sheetData[0]).map((_, colIndex) => {
                    let max = 10; // minimum width
                    sheetData.forEach((row) => {
                        const val = Object.values(row)[colIndex];
                        if (val != null) {
                            const length = String(val).length;
                            if (length > max) max = length;
                        }
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

        const fileName = `PawCareVet_Reports_${year}-${String(month).padStart(
            2,
            "0"
        )}.xlsx`;

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, fileName);
    };

    return (
        <div className="vet-report-container">
            <div className="vet-report-header">
                <h2>Monthly Reports</h2>
                <div className="vet-report-actions">
                    <div className="vet-report-filters">
                        <select value={month} onChange={(e) => setMonth(e.target.value)}>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={year}
                            min="2020"
                            max="2100"
                            onChange={(e) => setYear(e.target.value)}
                        />
                    </div>

                    <button className="vet-export-btn" onClick={exportToExcel}>
                        Export to Excel
                    </button>
                </div>
            </div>

            <div className="vet-report-grid">
                <div className="vet-report-card">
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
                                    <tr>
                                        <td colSpan="7" className="empty-row">
                                            No orders this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="vet-report-card">
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
                                    <tr>
                                        <td colSpan="3" className="empty-row">
                                            No orders this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="vet-report-card">
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
                                    <tr>
                                        <td colSpan="2" className="empty-row">No orders this month</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="vet-report-card">
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
                                    <tr>
                                        <td colSpan="4" className="empty-row">
                                            No pets added this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="vet-report-card">
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
                                    <tr>
                                        <td colSpan="5" className="empty-row">
                                            No pets added this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Visits */}
                <div className="vet-report-card">
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
                                    <tr>
                                        <td colSpan="5" className="empty-row">
                                            No visits this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Inventory */}
                <div className="vet-report-card">
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
                                    <tr>
                                        <td colSpan="5" className="empty-row">
                                            No inventory updates this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Appointments */}
                <div className="vet-report-card">
                    <h3>Appointment Reports</h3>
                    <div className="vet-appoint-summary">
                        <div className="appoint-top">
                            <div className="vet-appoint-item approved">
                                <strong>Total Approved:</strong>{" "}
                                <span>{reports.appointments.summary?.approved || 0}</span>
                            </div>
                            <div className="vet-appoint-item pending">
                                <strong>Total Pending:</strong>{" "}
                                <span>{reports.appointments.summary?.pending || 0}</span>
                            </div>
                        </div>

                        <div className="appoint-bottom">
                            <div className="vet-appoint-item declined">
                                <strong>Total Declined:</strong>{" "}
                                <span>{reports.appointments.summary?.declined || 0}</span>
                            </div>
                            <div className="vet-appoint-item total">
                                <strong>Total Appointments:</strong>{" "}
                                <span>
                                    {reports.appointments.summary?.total_appointments || 0}
                                </span>
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
                                    <tr>
                                        <td colSpan="4" className="empty-row">
                                            No appointments this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pet Services */}
                <div className="vet-report-card">
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
                                    <tr>
                                        <td colSpan="3" className="empty-row">
                                            No service usage this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VetReports;
