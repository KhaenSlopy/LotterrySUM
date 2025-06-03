// src/App.js
import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoAddCircleOutline } from "react-icons/io5";
import { IoListCircleOutline } from "react-icons/io5";
import "./App.css"; // นำเข้าไฟล์ CSS ของคุณ
import Swal from "sweetalert2";

function App() {
  const [entries, setEntries] = useState([
    { number: "", price: "", double: false },
  ]);
  const [view, setView] = useState("form"); // 'form' or 'list'
  const [savedEntries, setSavedEntries] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [showDetailVisible, setShowDetailVisible] = useState(false);
  const entriesCollection = collection(db, "lotto");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadScreen, setILoadScreen] = useState(true);


    useEffect(() => {
    // ให้ splash แสดง 3 วินาที
    const timer = setTimeout(() => setILoadScreen(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  const exportToExcel = () => {
    // เตรียมข้อมูลในรูปแบบ array ของ object
    const dataToExport = filteredData.map(([num, total]) => ({
      เลข: num,
      "จำนวนเงิน (บาท)": total.toFixed(2),
    }));

    // สร้าง worksheet และ workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lotto Data");

    // แปลง workbook เป็น binary
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    // สร้าง blob และดาวน์โหลด
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "lotto_data.xlsx");
  };
  // ดึงข้อมูลจาก Firestore
  const fetchSavedEntries = async () => {
    const querySnapshot = await getDocs(collection(db, "lotto"));
    const data = [];
    querySnapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });
    setSavedEntries(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSavedEntries();
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = field === "double" ? !updated[index][field] : value;
    setEntries(updated);
  };

  const addEntry = () => {
    try {
      setIsLoading(true);
      setEntries([...entries, { number: "", price: "", double: false }]);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const removeEntry = (index) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      for (const entry of entries) {
        if (!entry.number || !entry.price) continue;
        await addDoc(collection(db, "lotto"), entry);
      }
      Swal.fire("บันทึกสำเร็จ!", "บันทึกข้อมูลเรียบร้อยแล้ว", "success");

      setEntries([{ number: "", price: "", double: false }]);
      fetchSavedEntries();
    } catch (e) {
      Swal.fire("Error!", "เกิดข้อผิดพลาด", "error");

      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "lotto", id));
    setSavedEntries(savedEntries.filter((e) => e.id !== id));
  };
  const handleDeleteAll = async () => {
    setIsLoading(true);

    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "ข้อมูลทั้งหมดจะถูกลบแบบถาวร!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ใช่, ลบทั้งหมด",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        deletealldata(); // ← เรียกฟังก์ชันลบข้อมูลจริง
        Swal.fire({
          title: "ลบเรียบร้อย!",
          text: "ข้อมูลทั้งหมดถูกลบแล้ว",
          icon: "success",
        });
      }
    });
  };
  const deletealldata = async () => {
    try {
      const querySnapshot = await getDocs(entriesCollection);
      console.log("data : " + querySnapshot);

      console.log("พบรายการ", querySnapshot.docs.length, "รายการ");

      const deletePromises = querySnapshot.docs.map((docSnap) => {
        console.log("ลบ", docSnap.id);

        return deleteDoc(doc(db, "lotto", docSnap.id));
      });

      await Promise.all(deletePromises);
      fetchEntries();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);

      console.error("เกิดข้อผิดพลาดในการลบ:", error);
    }
  };

  const fetchEntries = async () => {
    try {
      const querySnapshot = await getDocs(entriesCollection);
      const allEntries = [];
      querySnapshot.forEach((doc) => {
        allEntries.push({ id: doc.id, ...doc.data() });
      });
      console.log("✅ Fetched entries:", allEntries);
      setSavedEntries(allEntries);
    } catch (error) {
      console.error("❌ Error fetching entries:", error);
    }
  };

  // รวมข้อมูลตัวเลขซ้ำ
  const groupedData = {};
  savedEntries.forEach((entry) => {
    const nums = entry.number.split(",").map((n) => n.trim());
    const amount = entry.double ? Number(entry.price) * 2 : Number(entry.price);
    nums.forEach((num) => {
      if (!groupedData[num]) groupedData[num] = 0;
      groupedData[num] += amount;
    });
  });

  const filteredData = Object.entries(groupedData).filter(([num]) =>
    num.includes(filterText.trim())
  );
if (isLoadScreen) {
    return (
      <div className="splash-screen">
        <img src="/LOTTERRY-LOGO.png" alt="โลโก้" className="splash-logo" />
        <h1 className="splash-title">LOTTERRY SUMMARY</h1>
      </div>
    );
  }
  return (
    <>
    {isLoading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <p className="loading-text">🔄 กำลังโหลด...</p>
        </div>
      )}
    <div className="container mt-4 mb-5" style={{ paddingBottom: "80px" }}>
      

      {view === "form" && (
        <>
          <div className="sticky-top bg-white py-2 px-3 shadow-sm z-3">
            <h3 className="mb-3 text-center fw-bold">📋 เพิ่มรายการ</h3>
            <button className="btn btn-success w-100" onClick={handleSubmit}>
              💾 บันทึก
            </button>
          </div>

          {entries.map((entry, index) => (
            <div
              className="row mb-3 bg-light p-2 rounded shadow-sm"
              key={index}
            >
              <div className="col-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="ตัวเลข"
                  value={entry.number}
                  onChange={(e) =>
                    handleChange(index, "number", e.target.value)
                  }
                />
              </div>
              <div className="col-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="ราคา"
                  value={entry.price}
                  onChange={(e) => handleChange(index, "price", e.target.value)}
                />
              </div>
              <div className="col-3 d-flex align-items-center">
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  checked={entry.double}
                  onChange={() => handleChange(index, "double")}
                />
                <label className="form-check-label">บน/ล่าง</label>
              </div>
              <div className="col-1 d-flex align-items-center">
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeEntry(index)}
                >
                  -
                </button>
              </div>
            </div>
          ))}
          <div className="d-grid gap-2 mb-3">
            <button className="btn btn-primary" onClick={addEntry}>
              <IoAddCircleOutline /> เพิ่มรายการ
            </button>
          </div>
        </>
      )}

      {view === "list" && (
        <>
          <div className="sticky-top bg-white py-2 px-3 shadow-sm z-3">
            <h3 className="mb-3 text-center fw-bold">📊 รายการทั้งหมด</h3>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="ค้นหาเลข"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />

            <div className="d-flex justify-content-between mb-3">
              <button
                className="btn btn-warning"
                onClick={() => setShowDetailVisible(!showDetailVisible)}
              >
                <small>{showDetailVisible ? "ซ่อน" : "แก้ไข"}</small>
              </button>

              <button className="btn btn-success" onClick={exportToExcel}>
                <small>ส่งออก Excel</small>
              </button>
              <button className="btn btn-danger" onClick={handleDeleteAll}>
                <small>ลบทั้งหมด</small>
              </button>
            </div>
          </div>

          {!showDetailVisible && (
            <ul className="list-group mb-4">
              {filteredData.map(([num, total]) => (
                <li
                  key={num}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{num}</span>
                  <span className="fw-bold">{total.toFixed(2)} บาท</span>
                </li>
              ))}
            </ul>
          )}

          {showDetailVisible && (
            <div id="show-detail">
              <h5 className="mb-2">📋 รายการทั้งหมด</h5>
              {savedEntries.map((entry) => (
                <div key={entry.id} className="card mb-2 p-2 shadow-sm">
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>เลข:</strong> {entry.number} <br />
                      <strong>ราคา:</strong> {entry.price} บาท{" "}
                      {entry.double && <span>(บน/ล่าง)</span>}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(entry.id)}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* เมนูด้านล่าง */}
      <nav className="navbar fixed-bottom bg-white border-top shadow-sm">
        <div className="container d-flex justify-content-around py-2">
          <button
            className={`btn d-flex flex-column align-items-center position-relative ${
              view === "form" ? "active-underline" : ""
            }`}
            onClick={() => setView("form")}
          >
            <span className="fs-4">
              <IoAddCircleOutline />
            </span>
            <small>เพิ่ม</small>
          </button>
          <button
            className={`btn d-flex flex-column align-items-center position-relative ${
              view === "list" ? "active-underline" : ""
            }`}
            onClick={() => setView("list")}
          >
            <span className="fs-4">
              <IoListCircleOutline />
            </span>
            <small>รายการ</small>
          </button>
        </div>
      </nav>
    </div>
    </>
  );
}

export default App;
