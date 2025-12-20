import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaPlus, FaRegEye, FaEdit } from 'react-icons/fa';
import { Trash2, Loader2, Plus } from 'lucide-react';
import axios from 'axios'
import './MedicalRecords.css';
import VisitDetailModal from '../../components/printLogic/VisitDetailModal';
import { UserContext } from '../../hook/authContext';


const ServiceSelector = ({ value, onChange, options }) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setFilteredOptions(
      options.filter(opt => opt.toLowerCase().includes(val.toLowerCase()))
    );
    setShowDropdown(true);
  };

  const handleSelect = (opt) => {
    setInputValue(opt);
    onChange(opt);
    setFilteredOptions([]);
    setShowDropdown(false);
  };

  const handleBlur = () => {
    // Close dropdown after a short delay to allow clicks
    setTimeout(() => setShowDropdown(false), 100);
  };

  const handleFocus = () => {
    // Show all options when input is focused
    setFilteredOptions(options);
    setShowDropdown(true);
  };

  return (
    <div style={{ position: "relative" }}>
      <div className="addvisit-input-group">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="addvisit-input"
          autoComplete="off"
          required
        />
        {showDropdown && filteredOptions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #ccc",
              maxHeight: 150,
              overflowY: "auto",
              zIndex: 10,
              listStyle: "none",
              margin: 0,
              padding: 0,
              marginTop: -24,
            }}
          >
            {filteredOptions.map((opt, idx) => (
              <li
                key={idx}
                style={{ padding: "5px 10px", cursor: "pointer" }}
                onMouseDown={(e) => e.preventDefault()} // prevent blur
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="service" className="addvisit-label">
          Service Type
        </label>
      </div>

    </div>
  );
};

function formatTimeToAMPM(time24) {
  if (!time24) return "N/A";

  const [hour, minute] = time24.split(":");
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}

export default function PetRecords() {
  const { user } = useContext(UserContext);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [addingRecord, setAddingRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({
    ownerEmail: '',
    ownerAddress: '',
    ownerPhoneNum: '',
    day: '',
    date: '',
    time: '',
    service: '',
    complaint: '',
    diagnosis: '',
    status: '',
    completed: ''
  });

  const [showOwnerSearchModal, setShowOwnerSearchModal] = useState(false);
  const [owners, setOwners] = useState([]);
  const [autoFill, setAutoFill] = useState({
    photo_pet: "",
    ownerName: "",
    userName: "",
    name: "",
    age: "",
    type: "",
    species: "",
    gender: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [userInfo, setUserInfo] = useState([]);
  const [switchBtn, setSwitchBtn] = useState(false);

  const [petID, setPetID] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState("");
  const [services, setServices] = useState([]);
  const [timeVisit, setTimeVisit] = useState("");
  const previousTimeRef = useRef("");

  const formRef = useRef(null);

  const APIENDPOINT = process.env.REACT_APP_API_URL;

  const handleView = (pet) => {
    axios.get(`${APIENDPOINT}/pet_medical_records/fetch/visit_history/${pet.id}`)
      .then((res) => {
        setSelectedPet({ ...pet, checkups: res.data });
      })
      .catch((err) => {
        console.error("Error fetching visit history:", err);
        setSelectedPet({ ...pet, checkups: [] }); // fallback
      });
  };

  useEffect(() => {
    if (addingRecord) {
      axios.get(`${APIENDPOINT}/pet_medical_records/fetch/services`)
        .then(res => {
          // Assuming res.data = [{title: "Vaccination"}, {title: "Grooming"}]
          const serviceTitles = res.data.map(s => s.title);
          setServices(serviceTitles);
        })
        .catch(err => console.error("Error fetching services:", err));
    }
  }, [addingRecord]);

  const resetAddForm = () => {
    setAutoFill({
      photo_pet: "",
      ownerName: "",
      userName: "",
      name: "",
      age: "",
      type: "",
      species: "",
      gender: ""
    });

    setTimeVisit('');
  };

  const resetEditForm = () => {
    setEditData(null);
    setTimeVisit('');
  };

  const handleCloseModal = () => {
    setSelectedPet(null);
    setModalSearchTerm('');
    setAddingRecord(false);
    setNewRecord({
      ownerEmail: '',
      ownerAddress: '',
      ownerPhoneNum: '',
      day: '',
      date: '',
      service: '',
      complaint: '',
      diagnosis: '',
      status: '',
      completed: ''
    });
    setSwitchBtn(false);
  };

  const handleCloseModalMessage = () => {
    setShowMessageModal(false);
    fetchPets();
  }

  const handleUserInfo = async (ownerUsername) => {
    try {
      const res = await axios.get(`${APIENDPOINT}/pet_medical_records/fetch/user_medical/${ownerUsername}`);
      if (res.data?.data) {
        setUserInfo(res.data.data);
        console.log("Fetched user info:", res.data.data);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  const handleTimeChange = (e) => {
    const value = e.target.value;

    if (!value) return;

    const [hour, minute] = value.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;

    const minTime = 8 * 60;   // 08:00
    const maxTime = 17 * 60;  // 17:00

    if (totalMinutes < minTime || totalMinutes > maxTime) {
      setMessageModal("Time must be between 8:00 AM and 5:00 PM");
      setShowMessageModal(true);

      // ✅ FORCE RESET
      setTimeVisit(previousTimeRef.current || "");

      if (addingRecord) {
        setNewRecord(prev => ({
          ...prev,
          time: previousTimeRef.current || ""
        }));
      }

      return;
    }

    // ✅ VALID TIME
    previousTimeRef.current = value;
    setTimeVisit(value);

    if (addingRecord) {
      setNewRecord(prev => ({
        ...prev,
        time: value
      }));
    }
  };

  useEffect(() => {
    if (userInfo && Object.keys(userInfo).length > 0) {
      setNewRecord((prev) => ({
        ...prev,
        ownerEmail: userInfo.email || '',
        ownerAddress: userInfo.address || '',
        ownerPhoneNum: userInfo.phoneNumber || ''
      }));
    }
  }, [userInfo]);

  useEffect(() => {
    if (showAddPetModal) {
      axios.get(`${APIENDPOINT}/pet_infos/owners`)
        .then(res => setOwners(res.data))
        .catch(err => console.error("Error fetching owners:", err));
    }
  }, [showAddPetModal]);

  const handleAddPet = async (e) => {
    e.preventDefault();
    const form = e.target;

    const formdata = {
      owner_name: form.ownerName.value,
      user_name: form.userName.value,
      pet_name: form.name.value,
      petType: form.type.value,
      species: form.species.value,
      pet_age: form.age.value,
      pet_gender: form.gender.value,
      pet_condition: form.condition.value,
      last_visit: form.lastVisit.value,
      time_visit: form.timeVisit.value,
      diagnosis: form.diagnosis.value,
      photo: autoFill.photo_pet,
    }

    try {
      setIsProcessing(true);

      const res = await axios.post(`${APIENDPOINT}/pet_medical_records/add_pet`, formdata, {
        headers: { "Content-Type": "application/json" }
      });

      if (res.data.success) {
        const updatedPets = await axios.get(`${APIENDPOINT}/pet_medical_records/fetch`);
        setPets(updatedPets.data);

        setShowAddPetModal(false);
        resetAddForm();
      }
    } catch (err) {
      console.error("Error adding pet:", err);

      if (err.response && err.response.status == 409) {
        setMessageModal(err.response.data.message);
      } else {
        setMessageModal("Error adding pet:");
      }

      setShowMessageModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (data) => {
    setEditData(data);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();

    formData.append("pet_condition", form.condition.value);
    formData.append("last_visit", form.lastVisit.value);
    formData.append("time_visit", form.timeVisit.value);
    formData.append("diagnosis", form.diagnosis.value);

    try {
      setIsProcessing(true);
      const res = await axios.put(`${APIENDPOINT}/pet_medical_records/edit_pet/${editData.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        // ✅ Refresh pets
        const updatedPets = await axios.get(`${APIENDPOINT}/pet_medical_records/fetch`);
        setPets(updatedPets.data);
        setShowEditModal(false);
        setEditData(null);
      }
    } catch (err) {
      console.error("Error editing pet:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (index) => {
    setPetID(index);
    setMessageModal("Are you sure to delete pet records including the visit history?");
    setShowConfirmModal(true);
  }

  const confirmDelete = async (id) => {
    try {
      const res = await axios.delete(`${APIENDPOINT}/pet_medical_records/delete/${id}`);
      setMessageModal(res.data.message);
    } catch (error) {
      console.error("Error deleting record:", err);
    } finally {
      setShowConfirmModal(false);
      setShowMessageModal(true);
    }
  }

  const fetchPets = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${APIENDPOINT}/pet_medical_records/fetch`);
      setPets(res.data);
    } catch (err) {
      console.error("Error fetching pets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (editData?.timeVisit) {
      setTimeVisit(editData.timeVisit);
      previousTimeRef.current = editData.timeVisit; // save original
    }
  }, [editData]);

  const filteredPets = pets.filter((pet) => {
    const term = searchTerm.toLowerCase();
    return (
      pet.ownerName.toLowerCase().includes(term) ||
      pet.name.toLowerCase().includes(term) ||
      pet.petType.toLowerCase().includes(term) ||
      pet.species.toLowerCase().includes(term) ||
      pet.gender.toLowerCase().includes(term) ||
      pet.condition.toLowerCase().includes(term) ||
      pet.diagnosis.toLowerCase().includes(term) ||
      pet.lastVisit.toLowerCase().includes(term)
    );
  });

  const filterCheckups = (checkups) => {
    const term = modalSearchTerm.toLowerCase();
    return checkups.filter((visit) =>
      [visit.day, visit.date, visit.service, visit.complaint, visit.diagnosis, visit.status, visit.completed]
        .some((field) => field.toLowerCase().includes(term))
    );
  };

  const handleAddRecord = () => setAddingRecord(true);

  const handleNewRecordChange = (e) => {
    const { name, value } = e.target;

    if (name === "status" && value === "Confinement") {
      setNewRecord(prev => ({
        ...prev,
        status: value,
        completed: ""
      }));
      return;
    }

    setNewRecord(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewRecordSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsProcessing(true);
      const res = await axios.post(`${APIENDPOINT}/pet_medical_records/add_pet_history`, {
        id_pet_medical_records: selectedPet.id,
        owner_email: newRecord.ownerEmail,
        owner_address: newRecord.ownerAddress,
        owner_phonenumber: newRecord.ownerPhoneNum,
        day: newRecord.day,
        date_visit: newRecord.date,
        date_time: newRecord.time,
        service_type: newRecord.service,
        main_complaint: newRecord.complaint,
        pet_diagnosis: newRecord.diagnosis,
        treatment_status: newRecord.status,
        date_completed_on: newRecord.completed,
        nursing_issues: newRecord.nursingIssues || '',
        care_plan: newRecord.carePlan || '',
        local_status_check: newRecord.localStatus || '',
        additional_complaint: newRecord.additionalComplaint || '',
        weight: newRecord.weight || '',
        height: newRecord.height || '',
        bmi: newRecord.bmi || '',
        blood_pressure: newRecord.bloodPressure || '',
        pulse: newRecord.pulse || '',
        medications: newRecord.medications || '',
        veterinarian_name: "Admin"
      });

      if (res.data.success) {
        // ✅ Refetch updated history
        const history = await axios.get(`${APIENDPOINT}/pet_medical_records/fetch/visit_history/${selectedPet.id}`);
        setSelectedPet({ ...selectedPet, checkups: history.data });

        setAddingRecord(false);
        setNewRecord({
          day: '',
          date: '',
          service: '',
          complaint: '',
          diagnosis: '',
          status: '',
          completed: ''
        });
      }
    } catch (err) {
      console.error("Error adding new visit history:", err);

      if (err.response && err.response.status == 409) {
        setMessageModal(err.response.data.message);
      } else {
        setMessageModal("Error adding new visit history");
      }

      setShowMessageModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateVisit = async () => {
    try {
      setIsProcessing(true);
      const res = await axios.put(
        `${APIENDPOINT}/pet_medical_records/edit_pet_history/${selectedVisit.history_id}`,
        {
          owner_email: selectedVisit.ownerEmail,
          owner_address: selectedVisit.ownerAddress,
          owner_phonenumber: selectedVisit.ownerPhoneNum,
          day: selectedVisit.day,
          date_visit: selectedVisit.date,   // yyyy-MM-dd format
          date_time: selectedVisit.time,
          service_type: selectedVisit.service,
          main_complaint: selectedVisit.complaint,
          pet_diagnosis: selectedVisit.diagnosis,
          treatment_status: selectedVisit.status,
          date_completed_on: selectedVisit.completed,
          nursing_issues: selectedVisit.nursingIssues || '',
          care_plan: selectedVisit.carePlan || '',
          local_status_check: selectedVisit.localStatus || '',
          additional_complaint: selectedVisit.additionalComplaint || '',
          weight: selectedVisit.weight || '',
          height: selectedVisit.height || '',
          bmi: selectedVisit.bmi || '',
          blood_pressure: selectedVisit.bloodPressure || '',
          pulse: selectedVisit.pulse || '',
          medications: selectedVisit.medications || '',
          veterinarian_name: selectedVisit.veterinarianName || 'Not Assigned',
        }
      );

      if (res.data.success) {
        const history = await axios.get(`${APIENDPOINT}/pet_medical_records/fetch/visit_history/${selectedPet.id}`);
        setSelectedPet({ ...selectedPet, checkups: history.data });
        setSelectedVisit(null);
      }
    } catch (err) {
      console.error("Error updating visit history:", err);
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="pet-records-wrapper">
      <h2 className="pet-records-title">Pet Medical History</h2>

      <div className="pet-records-toolbar">
        <div className="pet-records-left-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="admin-add-btn" onClick={() => setShowAddPetModal(true)}>
            <FaPlus /> Add Pet
          </button>
        </div>
      </div>

      <div className="admin-pet-records-table">
        <div className="admin-pet-records-header">
          <div>Owner Name</div>
          <div>Photo</div>
          <div>Name</div>
          <div>Pet Type</div>
          <div>Species</div>
          <div>Age</div>
          <div>Gender</div>
          <div>Condition</div>
          <div>Last Visit</div>
          <div>Diagnosis</div>
          <div>Action</div>
        </div>

        {isLoading ? (
          <div className="loading-records">
            Loading pet records...
          </div>
        ) : filteredPets.length > 0 ? (
          filteredPets.map((pet) => (
            <div className="admin-pet-records-row" key={pet.id}>
              <div>{pet.ownerName}</div>
              <div>
                <img src={pet.photo} alt={pet.name} className="pet-thumb" />
              </div>
              <div>{pet.name}</div>
              <div>{pet.petType}</div>
              <div>{pet.species}</div>
              <div>{pet.age}</div>
              <div>{pet.gender}</div>
              <div>{pet.condition}</div>
              <div>{pet.lastVisit} {formatTimeToAMPM(pet.timeVisit)}</div>
              <div className="diagnosis-text">
                {pet.diagnosis?.length > 30
                  ? pet.diagnosis.slice(0, 30) + '…'
                  : pet.diagnosis || ""}
              </div>
              <div className="admin-action-buttons">
                <button
                  className="admin-aksi-btn"
                  title="View Record"
                  onClick={() => handleView(pet)}
                >
                  <Plus size={16} />
                </button>
                <button
                  className="admin-aksi-btn margin-btn"
                  title="Edit Record"
                  onClick={() => handleEdit(pet)}
                >
                  <FaEdit size={16} />
                </button>
                <button
                  className="admin-aksi-btn"
                  title="Delete Record"
                  onClick={() => handleDelete(pet.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-records">Records Not Found</div>
        )}

      </div>

      {selectedPet && (
        <div className="pet-modal-overlay">
          <div className="pet-modal">
            <div className="pet-modal-header">
              <button className="close-btn" onClick={handleCloseModal}>×</button>
              <h3>{selectedPet.name}'s Visit History</h3>

              <div className="pet-modal-top-row">
                <input
                  type="text"
                  className="modal-search-input"
                  placeholder="Search visit history..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                />
                <div className='vet-button-history'>
                  <button
                    className="add-btn margin2"
                    onClick={() => {
                      if (switchBtn) {
                        formRef.current?.requestSubmit();
                        setSwitchBtn(false);
                      } else {
                        handleUserInfo(selectedPet.userName);
                        handleAddRecord();
                        setSwitchBtn(true);
                      }
                    }}
                  >
                    {switchBtn ? "💾 Save" : <><FaPlus /> Add Record</>}
                  </button>
                  {addingRecord && (
                    <button
                      className='vet-cancel-btn'
                      onClick={() => {
                        setSwitchBtn(false);
                        setAddingRecord(false);
                        setNewRecord({
                          day: '',
                          date: '',
                          time: '',
                          service: '',
                          complaint: '',
                          diagnosis: '',
                          status: '',
                          completed: ''
                        });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {addingRecord && (
                <form className="new-record-form" ref={formRef} onSubmit={handleNewRecordSubmit}>
                  <div className="addvisit-input-group">
                    <input
                      type="text"
                      name="ownerEmail"
                      value={newRecord.ownerEmail}
                      onChange={handleNewRecordChange}
                      required
                      readOnly
                      className="addvisit-input"
                    />
                    <label htmlFor="ownerEmail" className="addvisit-label">
                      Owner Email
                    </label>
                  </div>

                  <div className="addvisit-input-group">
                    <input
                      type="text"
                      name="ownerAddress"
                      value={newRecord.ownerAddress}
                      onChange={handleNewRecordChange}
                      required
                      readOnly
                      className="addvisit-input"
                    />
                    <label htmlFor="ownerAddress" className="addvisit-label">
                      Owner Address
                    </label>
                  </div>
                  <div className="addvisit-input-group">
                    <input
                      type="text"
                      name="ownerPhoneNum"
                      value={newRecord.ownerPhoneNum}
                      onChange={handleNewRecordChange}
                      required
                      readOnly
                      className="addvisit-input"
                    />
                    <label htmlFor="ownerPhoneNum" className="addvisit-label">
                      Owner Phone Number
                    </label>
                  </div>

                  <div className="addvisit-input-group">
                    <input
                      type="text"
                      name="day"
                      value={newRecord.day}
                      onChange={handleNewRecordChange}
                      required
                      className="addvisit-input"
                    />
                    <label htmlFor="day" className="addvisit-label">
                      Day of Visit
                    </label>
                  </div>

                  <div className="addvisit-input-group">
                    <input
                      type="date"
                      name="date"
                      placeholder="Date"
                      value={newRecord.date}
                      onChange={handleNewRecordChange}
                      required
                      className="addvisit-input"
                    />
                    <label htmlFor="completed" className="addvisit-label">
                      Date Visit
                    </label>
                  </div>

                  <div className="addvisit-input-group">
                    <input
                      type="time"
                      name="time"
                      value={newRecord.time}
                      onChange={handleTimeChange}
                      required
                      className="addvisit-input"
                      min="08:00"
                      max="17:00"
                    />
                    <label htmlFor="time" className="addvisit-label">
                      Time of Visit
                    </label>
                  </div>

                  <ServiceSelector
                    value={newRecord.service}
                    onChange={(val) => setNewRecord({ ...newRecord, service: val })}
                    options={services}
                  />

                  <div className="addvisit-input-group">
                    <input
                      type="text"
                      name="complaint"
                      value={newRecord.complaint}
                      onChange={handleNewRecordChange}
                      required
                      className="addvisit-input"
                    />
                    <label htmlFor="complaint" className="addvisit-label">
                      Main Complaint
                    </label>
                  </div>

                  <div className="addvisit-input-group">
                    <input
                      type="text"
                      name="treatment"
                      value={newRecord.treatment}
                      onChange={handleNewRecordChange}
                      required
                      className="addvisit-input"
                    />
                    <label htmlFor="treatment" className="addvisit-label">
                      Diagnosis
                    </label>
                  </div>

                  <div className="addvisit-input-group">
                    <select
                      name="status"
                      value={newRecord.status}
                      onChange={handleNewRecordChange}
                      required
                      className="addvisit-input"
                    >
                      <option value="" disabled>
                        Select Treatment Status
                      </option>
                      <option value="Out Patient">Out Patient</option>
                      <option value="Confinement">Confinement</option>
                    </select>

                    <label htmlFor="status" className="addvisit-label">
                      Treatment Status
                    </label>
                  </div>

                  <div className="addvisit-input-group">
                    <input
                      type="date"
                      id="completed"
                      name="completed"
                      value={newRecord.completed}
                      onChange={handleNewRecordChange}
                      className="addvisit-input"
                      required={newRecord.status === "Out Patient"}
                      disabled={newRecord.status === "Confinement"}
                    />

                    <label htmlFor="completed" className="addvisit-label">
                      Completed On
                      {newRecord.status === "Out Patient" && " *"}
                    </label>
                  </div>
                </form>
              )}
            </div>

            <article className="pet-modal-body">
              {selectedPet.checkups?.length > 0 ? (
                <div className="checkup-history-row-style">
                  <div className="checkup-card-wide">
                    <div className="checkup-col">
                      <p className="checkup-label">Owner Name</p>
                      <p>{selectedPet.ownerName}</p>
                    </div>

                    <div className="checkup-col">
                      <p className="checkup-label">Name</p>
                      <p>{selectedPet.name}</p>
                    </div>

                    <div className="checkup-col">
                      <p className="checkup-label">Pet Type</p>
                      <p>{selectedPet.petType}</p>
                    </div>

                    <div className="checkup-col">
                      <p className="checkup-label">Species</p>
                      <p>{selectedPet.species}</p>
                    </div>

                    <div className="checkup-col">
                      <p className="checkup-label">Age</p>
                      <p>{selectedPet.age}</p>
                    </div>

                    <div className="checkup-col">
                      <p className="checkup-label">Gender</p>
                      <p>{selectedPet.gender}</p>
                    </div>

                    <div className="checkup-col">
                      <p className="checkup-label">Condition</p>
                      <p>{selectedPet.condition}</p>
                    </div>

                    <div className="checkup-col">
                      <p className="checkup-label">Last Visit</p>
                      <p>{selectedPet.lastVisit} {formatTimeToAMPM(selectedPet.timeVisit)}</p>
                    </div>

                    <div className="checkup-col">
                      <p className="checkup-label">Diagnosis</p>
                      <p>{selectedPet.diagnosis}</p>
                    </div>
                  </div>

                  {filterCheckups(selectedPet.checkups).length > 0 ? (
                    filterCheckups(selectedPet.checkups).map((visit, i) => (
                      <div key={i} className="checkup-card-wide">
                        <div className="checkup-col">
                          <p className="checkup-label">Date and Time Visit</p>
                          <p>
                            <strong className="label-admin-date">{visit.day}</strong>
                            <br />
                            <span className="label-admin-date">{visit.date} {formatTimeToAMPM(visit.time)}</span>
                          </p>
                        </div>
                        <div className="checkup-col">
                          <p className="checkup-label">Service Type</p>
                          <p>{visit.service}</p>
                        </div>
                        <div className="checkup-col">
                          <p className="checkup-label">Main Complaint</p>
                          <p>{visit.complaint}</p>
                        </div>
                        <div className="checkup-col">
                          <p className="checkup-label">Diagnosis</p>
                          <p>{visit.diagnosis}</p>
                        </div>
                        <div className="checkup-col">
                          <p className="checkup-label">Treatment Status</p>
                          <p>{visit.status}</p>
                        </div>
                        <div className="checkup-col">
                          <p className="checkup-label">Completed On</p>
                          <p>{visit.completed}</p>
                        </div>
                        <div className="checkup-col action-col">
                          <p className="checkup-label">Action</p>
                          <button className="aksi-btn" onClick={() => setSelectedVisit(visit)}>
                            <FaEdit size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-records"></div>
                  )}
                </div>
              ) : (
                <p></p>
              )}
            </article>
          </div>
        </div>
      )}

      {selectedVisit && (
        <VisitDetailModal
          selectedVisit={selectedVisit}
          selectedPet={selectedPet}
          onClose={() => setSelectedVisit(null)}
          role={user.role}
          printName={user.firstName}
          setSelectedVisit={setSelectedVisit}
          Saving={handleUpdateVisit}
          processing={isProcessing}
        />
      )}

      {showAddPetModal && (
        <div className="pet-modal-overlay">
          <div className="admin-pet-modal-add">
            <button className="close-btn" onClick={() => setShowAddPetModal(false)}>×</button>
            <h3 className="add-modal-title">Add New Pet Record</h3>
            <form onSubmit={handleAddPet} className="add-pet-form-grid">
              {/* Left Side: Image */}
              <div className="add-pet-image-upload">
                <label htmlFor="petImage" className="add-image-upload-box">
                  <img
                    src={autoFill.photo_pet || "/images/upload_placehold.jpg"}
                    alt="Upload"
                    className="add-image-placeholder"
                  />
                </label>
              </div>

              {/* Right Side: Inputs */}
              <div className="add-pet-form-fields">

                <div className="add-form-group">
                  <div className="field-with-label">
                    <label>Owner Name</label>
                    <input
                      name="ownerName"
                      type="text"
                      value={autoFill.ownerName || ""}
                      readOnly
                      onClick={() => setShowOwnerSearchModal(true)}
                      className="clickable-owner-field"
                      placeholder='Click to select owner'
                    />
                  </div>

                  <div className="field-with-label">
                    <label>Username</label>
                    <input
                      name="userName"
                      type="text"
                      value={autoFill.userName}
                      readOnly
                    />
                  </div>
                </div>

                <div className="add-form-group">
                  <div className="field-with-label">
                    <label>Pet Name</label>
                    <input name="name" type="text" value={autoFill.name} readOnly />
                  </div>

                  <div className="field-with-label">
                    <label>Age</label>
                    <input name="age" type="text" value={autoFill.age} readOnly />
                  </div>
                </div>

                <div className="add-form-group">
                  <div className="field-with-label">
                    <label>Pet Type</label>
                    <input name="type" type="text" value={autoFill.type} readOnly />
                  </div>

                  <div className="field-with-label">
                    <label>Species</label>
                    <input name="species" type="text" value={autoFill.species} readOnly />
                  </div>

                  <div className="field-with-label">
                    <label>Gender</label>
                    <input name="gender" type="text" value={autoFill.gender} readOnly />
                  </div>
                </div>

                <div className="add-form-group">
                  <div className="field-with-label">
                    <label>Condition</label>
                    <input name="condition" type="text" required />
                  </div>

                  <div className="field-with-label">
                    <label>Last Visit</label>
                    <input name="lastVisit" type="date" required />
                  </div>

                  <div className="field-with-label">
                    <label>Time Visit</label>
                    <input
                      type="time"
                      name="timeVisit"
                      value={timeVisit}
                      onChange={handleTimeChange}
                      required
                      className="addvisit-input"
                      min="08:00"
                      max="17:00"
                    />
                  </div>
                </div>

                <div className="add-form-group">
                  <div className="field-with-label">
                    <label>Diagnosis</label>
                    <input name="diagnosis" type="text" required />
                  </div>
                </div>

                <div className="add-button-row">
                  <button type="submit" className="add-add-btn" disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Add Pet"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowAddPetModal(false);
                      resetAddForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>

              </div>

            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="pet-modal-overlay">
          <div className="admin-pet-modal-edit">
            <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            <h3 className="edit-modal-title">Edit Pet Record</h3>

            <form onSubmit={handleEditSubmit} className="edit-pet-form-grid">
              {/* Left Side: Image */}
              <div className="edit-pet-image-upload">
                <label htmlFor="petImage" className="edit-image-upload-box">
                  <img
                    src={editData?.photo || "/images/upload-placeholder.png"}
                    alt="Pet"
                    className="edit-image-placeholder"
                  />
                </label>
              </div>

              {/* Right Side: Inputs */}
              <div className="edit-pet-form-fields">

                <div className="edit-form-group">
                  <div className="field-with-label">
                    <label>Owner Name</label>
                    <input
                      name="ownerName"
                      type="text"
                      placeholder="Owner Name"
                      value={editData?.ownerName || ""}
                      readOnly
                      title='Owner Name'
                    />
                  </div>

                  <div className="field-with-label">
                    <label>Username</label>
                    <input
                      name="userName"
                      type="text"
                      placeholder="Username"
                      value={editData?.userName || ""}
                      readOnly
                      title='Username'
                    />
                  </div>
                </div>

                <div className="edit-form-group">
                  <div className="field-with-label">
                    <label>Pet Name</label>
                    <input
                      name="name"
                      type="text"
                      placeholder="Pet Name"
                      value={editData?.name || ""}
                      readOnly
                      title="Pet's Name"
                    />
                  </div>
                  <div className="field-with-label">
                    <label>Age</label>
                    <input
                      name="age"
                      type="text"
                      placeholder="Age"
                      value={editData?.age || ""}
                      readOnly
                      title="Pet's Age"
                    />
                  </div>
                </div>

                <div className="edit-form-group">
                  <div className="field-with-label">
                    <label>Type</label>
                    <input
                      name="type"
                      type="text"
                      placeholder="Pet Type"
                      value={editData?.petType || ""}
                      readOnly
                      title="Pet's Type"
                    />
                  </div>
                  <div className="field-with-label">
                    <label>Species</label>
                    <input
                      name="species"
                      type="text"
                      placeholder="Species"
                      value={editData?.species || ""}
                      readOnly
                      title="Pet's Species"
                    />
                  </div>
                  <div className="field-with-label">
                    <label>Gender</label>
                    <input
                      name="gender"
                      type="text"
                      placeholder="Gender"
                      value={editData?.gender || ""}
                      readOnly
                      title="Pet's Gender"
                    />
                  </div>

                </div>

                {/* Editable Fields Only */}
                <div className="edit-form-group">
                  <div className="field-with-label">
                    <label>Condition</label>
                    <input
                      name="condition"
                      type="text"
                      placeholder="Condition"
                      defaultValue={editData?.condition || ""}
                      required
                      title="Pet's Condition"
                    />
                  </div>
                  <div className="field-with-label">
                    <label>Last Visit</label>
                    <input
                      name="lastVisit"
                      type="date"
                      placeholder="Last Visit"
                      defaultValue={editData?.lastVisit || ""}
                      required
                      title="Last Visit"
                    />
                  </div>
                  <div className="field-with-label">
                    <label>Time Visit</label>
                    <input
                      name="timeVisit"
                      type="time"
                      value={timeVisit}
                      onChange={handleTimeChange}
                      required
                      min="08:00"
                      max="17:00"
                    />
                  </div>

                </div>

                <div className="edit-form-group">
                  <div className="field-with-label">
                    <label>Diagnosis</label>
                    <input
                      name="diagnosis"
                      type="text"
                      placeholder="Diagnosis"
                      defaultValue={editData?.diagnosis || ""}
                      required
                      title="Pet's Diagnosis"
                    />
                  </div>

                </div>

                <div className="edit-button-row">
                  <button type="submit" className="edit-add-btn" disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Update Pet"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowEditModal(false);
                      resetEditForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOwnerSearchModal && (
        <div className="admin-ownersearch-overlay" onClick={() => setShowOwnerSearchModal(false)}>
          <div className="admin-ownersearch-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-ownersearch-title">Select Owner and Pet</h3>

            <input
              type="text"
              placeholder="Search owner or pet..."
              className="admin-ownersearch-input"
              onChange={(e) => {
                const val = e.target.value.toLowerCase();
                setOwners((prev) =>
                  prev.map((o) => ({
                    ...o,
                    hidden:
                      !o.owner_name.toLowerCase().includes(val) &&
                      !o.pet_name.toLowerCase().includes(val),
                  }))
                );
              }}
            />

            <div className="admin-ownersearch-table-wrapper">
              <table className="admin-ownersearch-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Owner Name</th>
                    <th>Pet Name</th>
                    <th>Type</th>
                    <th>Species</th>
                    <th>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="admin-ownersearch-loading">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    owners
                      .filter((o) => !o.hidden)
                      .map((owner, index) => (
                        <tr
                          key={index}
                          className="admin-ownersearch-row"
                          onClick={() => {
                            setAutoFill({
                              photo_pet: owner.photo_pet || owner.photo,
                              ownerName: owner.owner_name,
                              userName: owner.owner_username,
                              name: owner.pet_name,
                              age: owner.pet_age,
                              type: owner.petType,
                              species: owner.species,
                              gender: owner.pet_gender,
                            });
                            setShowOwnerSearchModal(false);
                          }}
                        >
                          <td>
                            <img
                              src={owner.photo_pet || "/images/upload_placehold.jpg"}
                              alt="pet"
                              className="admin-ownersearch-photo"
                            />
                          </td>
                          <td>{owner.owner_name}</td>
                          <td>{owner.pet_name}</td>
                          <td>{owner.petType}</td>
                          <td>{owner.species}</td>
                          <td>{owner.pet_gender}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              className="admin-ownersearch-close-btn"
              onClick={() => setShowOwnerSearchModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

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
                onClick={() => confirmDelete(petID)}
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
                onClick={handleCloseModalMessage}
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