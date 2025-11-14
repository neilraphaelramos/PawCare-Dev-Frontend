import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "./VetReports.css";
import "../../modules/Reports/AdminReports.css"
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { UserContext } from "../../hook/authContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

    new Date().toLocaleDateString('en-CA');

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
                    servicesUsage: data.details.servicesCount || []
                });

                console.log("✅ Monthly Reports Data:", data);
            } catch (err) {
                console.error("❌ Error fetching monthly reports:", err);
            }
        };
        fetchReports();
    }, [startDate, endDate]);

    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();
        const printedBy = "Admin"; // or dynamically from user context

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

        const fileName = `PawCareVet_Reports_${startDate}_to_${endDate}.xlsx`;

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, fileName);
    };

    const exportToPDF = () => {
        const doc = new jsPDF("p", "pt");
        const printedBy = `${user.firstName} ${user.lastName}`;
        const pageWidth = doc.internal.pageSize.getWidth();
        let yOffset = 40;

        // Logo on left
        const img = new Image();
        img.src = "/images/LandingPage/rivera-logo.png";
        img.onload = () => {
            const imgWidth = 60;
            const imgHeight = 60;
            doc.addImage(img, "PNG", 40, yOffset, imgWidth, imgHeight);

            // Clinic info centered
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

            // Report title
            doc.setFontSize(18);
            doc.text("Summary Reports", pageWidth / 2, yOffset, { align: "center" });
            yOffset += 25;

            // Printed by and date range
            doc.setFontSize(12);
            doc.text(`Printed by: ${printedBy}`, pageWidth / 2, yOffset, { align: "center" });
            yOffset += 15;
            doc.text(`Date Range: ${startDate} to ${endDate}`, pageWidth / 2, yOffset, { align: "center" });
            yOffset += 25;

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
                        yOffset = data.cursor.y + 40;
                    },
                });
            };

            // 1️⃣ Order Reports
            addTable(
                "Order Reports",
                ["Order ID", "Client", "Status", "Payment Status", "Items", "Total", "Date"],
                reports.orders.details?.map((o) => [
                    o.id_order,
                    o.customer_name,
                    o.order_status,
                    o.paymentStatus,
                    o.items_purchased,
                    Number(o.total),
                    new Date(o.order_date).toLocaleDateString(),
                ])
            );

            // 2️⃣ Product Reports
            addTable(
                "Product Reports",
                ["Item ID", "Name", "Total Sold"],
                reports.product_solds?.map((p) => [
                    p.product_id,
                    p.product_name,
                    Number(p.total_sold)
                ])
            );

            // 3️⃣ Total Orders Summary
            addTable(
                "Total Orders Summary",
                ["Total Orders", "Total Revenue"],
                reports.orders.summary ? [[
                    Number(reports.orders.summary.total_orders),
                    Number(reports.orders.summary.total_revenue || 0)
                ]] : []
            );

            // 4️⃣ Registered Pets
            addTable(
                "Registered Pet Reports",
                ["Pet Name", "Owner", "Species", "Date Added"],
                reports.pets.details?.map((p) => [
                    p.pet_name,
                    p.owner_name,
                    p.species,
                    new Date(p.created_At).toLocaleDateString()
                ])
            );

            // 5️⃣ Pet Types & Species
            addTable(
                "Pet Types & Species",
                ["#", "Species", "Pet Type", "Total Species"],
                reports.totalSpecies.details?.map((p, i) => [
                    i + 1,
                    p.species,
                    p.petType,
                    Number(p.total_species)
                ])
            );

            // 6️⃣ Clinic Visits
            addTable(
                "Clinic Visit Reports",
                ["Visit ID", "Owner", "Pet", "Veterinarian", "Visit Date"],
                reports.visits?.map((v) => [
                    v.id_pet_history,
                    v.owner_name,
                    v.pet_name,
                    `Dr. ${v.veterinarian_name}`,
                    new Date(v.date_visit).toLocaleDateString()
                ])
            );

            // 7️⃣ Inventory Reports
            addTable(
                "Inventory Reports",
                ["Item Name", "Stock In", "Stock Out", "Current Stock", "Date"],
                reports.stock.summary?.map((i) => [
                    i.product_name,
                    Number(i.total_stock_in),
                    Number(i.total_stock_out),
                    Number(i.current_stock),
                    new Date(i.last_movement_date).toLocaleDateString()
                ])
            );

            // 8️⃣ Appointment Reports
            addTable(
                "Appointment Reports",
                ["ID", "Owner", "Date", "Status"],
                reports.appointments.details?.map((a) => [
                    a.id_appoint,
                    a.owner_name,
                    new Date(a.set_date).toLocaleDateString(),
                    a.status
                ])
            );

            // 9️⃣ Pet Service Usage
            addTable(
                "Pet Service Usage",
                ["Service", "Used Count"],
                reports.servicesUsage?.map((s) => [
                    s.service_title,
                    Number(s.usage_count || 0)
                ])
            );

            // Footer / Signature
            doc.setFontSize(12);
            doc.text("_________________________", pageWidth / 2, yOffset, { align: "center" });
            yOffset += 15;
            doc.setFont("helvetica", "bold");
            doc.text(`${user.firstName} ${user.lastName}`, pageWidth / 2, yOffset, { align: "center" });
            doc.setFont("helvetica", "normal");
            yOffset += 15;
            doc.text("Veterinarian", pageWidth / 2, yOffset, { align: "center" });

            doc.save(`PawCareVet_Reports_${startDate}_to_${endDate}.pdf`);
        };
    };

    return (
        <div className="vet-report-container">
            <div className="vet-report-header">
                <h2>Reports</h2>
                <div className="vet-report-actions">
                    <div className="vet-report-filters">
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

                    <button className="vet-export-btn" onClick={exportToExcel}>
                        Export to Excel
                    </button>
                    <button className="vet-export-btn" onClick={exportToPDF}>
                        Export to PDF
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
