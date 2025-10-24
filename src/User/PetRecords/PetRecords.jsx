import React, { useState, useEffect, useContext } from 'react';
import { FaPlus, FaRegEye } from 'react-icons/fa';
import './PetRecords.css';
import { UserContext } from '../../hook/authContext';
import axios from 'axios';

export default function PetRecords() {
  const { user } = useContext(UserContext);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [addPetInfo, setAddPetInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [messageModal, setMessageModal] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [type, setType] = useState("");
  const [species, setSpecies] = useState("");
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const APIENDPOINT = '/server-api';

  const fetchPets = async () => {
    try {
      const res = await axios.get(`${APIENDPOINT}/fetch_user/pet_medical_records/${user.username}`);
      const data = res.data.map(pet => ({
        ...pet,
        diagnosis: pet.diagnosis || 'No Diagnosis Yet',
        condition: pet.condition || 'No Condition Yet',
        lastVisit: pet.lastVisit || 'No Last Visit Yet',
      }));
      setPets(data);
    } catch (err) {
      console.error('Error fetching pet records:', err);
    }
  };

  const handleAddPetInfo = async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData();

    formData.append('photo', form.photo.files[0]);
    formData.append('name', form.name.value);
    formData.append('type', form.type.value);
    formData.append('species', form.species.value);
    formData.append('age', form.age.value);
    formData.append('gender', form.gender.value);
    formData.append('ownerUsername', user.username);

    const ownerName = [
      user.firstName,
      user.middleName,
      user.lastName,
      user.suffix,
    ].filter(Boolean).join(' ');

    formData.append('ownerName', ownerName);

    try {
      const res = await axios.post(`/server-api/add_pet_info`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      try {
        await axios.post(`/server-api/api/notifications`, {
          UID: user.id,
          title_notify: "New Pet Added",
          type_notify: "Pet Record",
          details: `You added a new pet named ${form.name.value} to your medical records.`,
        });
      } catch (notifyErr) {
        console.error("Notification error:", notifyErr);
      }

      if (res.data.success) {
        setShowMessageModal(true);
        setMessageModal('Pet added successfully!');
        setAddPetInfo(false);
        form.reset();
        fetchPets();
      } else {
        setShowMessageModal(false);
        setMessageModal('Failed to add pet.');
      }

    } catch (err) {
      console.error(err);
      setShowMessageModal(false);
      setMessageModal('Failed to add pet. Please try again.');
    }
  };

  useEffect(() => {
    if (!user?.username) return;
    fetchPets();
  }, [user]);

  useEffect(() => {
    async function fetchBreeds() {
      if (!type) {
        setSpeciesOptions([]);
        return;
      }

      setLoading(true);

      try {
        const url =
          type === "Dog"
            ? "https://api.thedogapi.com/v1/breeds"
            : "https://api.thecatapi.com/v1/breeds";

        const res = await fetch(url);
        const data = await res.json();

        const formatted = data.map((b) => ({
          id: b.id,
          name: b.name,
        }));

        setSpeciesOptions(formatted);
      } catch (err) {
        console.error("Failed to load breeds", err);
        setSpeciesOptions([]);
      } finally {
        setLoading(false);
        setSpecies("");
      }
    }

    fetchBreeds();
  }, [type]);

  const handleView = async (pet) => {
    try {
      const res = await axios.get(`${APIENDPOINT}/fetch/visit_history/${pet.id}`);
      setSelectedPet({ ...pet, checkups: res.data });
    } catch (err) {
      console.error('Error fetching visit history:', err);
    }
  };

  const handleCloseModal = () => {
    setSelectedPet(null);
    setModalSearchTerm('');
  };

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
          <button className="add-btn" onClick={() => setAddPetInfo(true)}>
            <FaPlus /> Add Pet Info
          </button>
        </div>
      </div>

      <div className="pet-records-table">
        <div className="pet-records-header">
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

        {filteredPets.length > 0 ? (
          filteredPets.map((pet) => (
            <div className="pet-records-row" key={pet.id}>
              <div>
                <img src={`${APIENDPOINT}/uploads/${pet.photo}`} alt={pet.name} className="pet-thumb" />
              </div>
              <div>{pet.name}</div>
              <div>{pet.petType}</div>
              <div>{pet.species}</div>
              <div>{pet.age} yrs</div>
              <div>{pet.gender}</div>
              <div>{pet.condition}</div>
              <div>{pet.lastVisit}</div>
              <div className="diagnosis-text">
                {pet.diagnosis.length > 30 ? pet.diagnosis.slice(0, 30) + '…' : pet.diagnosis}
              </div>
              <div>
                <button
                  className="aksi-btn"
                  title="View Record"
                  onClick={() => handleView(pet)}
                >
                  <FaRegEye size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-records">Records not found.</div>
        )}
      </div>

      {addPetInfo && (
        <div className="add-pet-overlay">
          <div className="add-pet-modal">
            <button
              className="close-btn"
              onClick={() => setAddPetInfo(false)}
            >
              &times;
            </button>

            <h2 className="modal-title">Add Pet Info</h2>

            <form className="pet-form" onSubmit={handleAddPetInfo}>
              <div className="form-group">
                <label>Pet Photo</label>
                <input type="file" accept="image/*" name="photo" required />
              </div>

              <div className="form-group">
                <label>Pet Name</label>
                <input type="text" placeholder="e.g. Bella" name='name' required />
              </div>

              <div className="form-group">
                <label>Pet Type</label>
                <select
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>

              <div className="form-group">
                <label>Species</label>
                <select
                  name="species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  required
                  disabled={!type || loading}
                >
                  <option value="">
                    {loading ? "Loading species..." : "Select species"}
                  </option>
                  {speciesOptions.map((opt) => (
                    <option key={opt.id} value={opt.name}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Age</label>
                <input type="number" placeholder="e.g. 3" name='age' required />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <div className="gender-options">
                  <label>
                    <input type="radio" name="gender" value="male" /> Male
                  </label>
                  <label>
                    <input type="radio" name="gender" value="female" /> Female
                  </label>
                </div>
              </div>

              <button type="submit" className="submit-btn">
                Save Pet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Visit History Modal */}
      {selectedPet && (
        <div className="pet-modal-overlay">
          <div className="pet-modal">
            <button className="close-btn" onClick={handleCloseModal}>×</button>
            <h3>{selectedPet.name}'s Visit History</h3>

            <input
              type="text"
              className="modal-search-input"
              placeholder="Search visit history..."
              value={modalSearchTerm}
              onChange={(e) => setModalSearchTerm(e.target.value)}
            />

            {selectedPet.checkups?.length > 0 ? (
              <div className="checkup-history-row-style">
                {filterCheckups(selectedPet.checkups).map((visit, i) => (
                  <div key={i} className="checkup-card-wide">
                    <div className="checkup-col">
                      <p className="checkup-label">Date</p>
                      <strong>{visit.day}</strong>
                      <span>{visit.date}</span>
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
                      <button
                        className="aksi-btn"
                        title="View Full Details"
                        onClick={() => setSelectedVisit(visit)}
                      >
                        <FaRegEye size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No visit records found.</p>
            )}
          </div>
        </div>
      )}

      {/* Full Visit Detail Modal (Printable) */}
      {selectedVisit && (
        <div className="visit-detail-modal-overlay">
          <div className="visit-detail-modal">
            <button className="close-btn" onClick={() => setSelectedVisit(null)}>×</button>
            <button className="print-btn" onClick={() => window.print()}>Print</button>

            <div className="visit-detail-content scrollable-print">
              {/* Printable Header */}
              <div className="mr-header-section">
                <img src="/images/LandingPage/rivera-logo.png" alt="Clinic Logo" className="mr-clinic-logo" />
                <div className="mr-clinic-details">
                  <h1>PetCare Animal Clinic</h1>
                  <p>123 Veterinary Street, Bocaue, Bulacan</p>
                  <p>Contact: (044) 123-4567 | Email: petcare@clinic.com</p>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Patient Medical Summary */}
              <h2 className="section-title">Patient Medical Summary</h2>

              <div className="detail-field">
                <div className="detail-label">Pet Name:</div>
                <div className="detail-value">{selectedPet.name}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Owner Name:</div>
                <div className="detail-value">{selectedPet.ownerName}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Species:</div>
                <div className="detail-value">{selectedPet.species}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Owner Address:</div>
                <div className="detail-value">{selectedVisit.ownerAddress}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Age:</div>
                <div className="detail-value">{selectedPet.age}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Owner Phone Number:</div>
                <div className="detail-value">{selectedVisit.ownerPhoneNum}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Diagnosis:</div>
                <div className="detail-value">{selectedVisit.diagnosis}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Owner Email:</div>
                <div className="detail-value">{selectedVisit.ownerEmail}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Date Admitted:</div>
                <div className="detail-value">{selectedVisit.date || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Date Discharged:</div>
                <div className="detail-value">{selectedVisit.completed}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Patient Status:</div>
                <div className="detail-value">{selectedVisit.status}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Nursing Issues:</div>
                <div className="detail-value">{selectedVisit.nursingIssues}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Care Plan:</div>
                <div className="detail-value">{selectedVisit.carePlan}</div>
              </div>

              {/* Medical Assessment */}
              <h2 className="section-title">Medical Assessment</h2>
              <div className="detail-field">
                <div className="detail-label">Main Complaint:</div>
                <div className="detail-value">{selectedVisit.complaint}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Additional Complaints:</div>
                <div className="detail-value">{selectedVisit.additionalComplaint}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Weight:</div>
                <div className="detail-value">{selectedVisit.weight}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Height:</div>
                <div className="detail-value">{selectedVisit.height}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">BMI:</div>
                <div className="detail-value">{selectedVisit.bmi}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Blood Pressure:</div>
                <div className="detail-value">{selectedVisit.bloodPressure}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Pulse:</div>
                <div className="detail-value">{selectedVisit.pulse}</div>
              </div>

              {/* Prescriptions */}
              <h2 className="section-title">Prescriptions</h2>
              <div className="detail-field">
                <div className="detail-label">Medications:</div>
                <div className="detail-value">
                  <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                    <li>{selectedVisit.medications}</li>
                  </ul>
                </div>
              </div>

              {/* Signature */}
              <div className="signature-block">
                <div className="signature-line"></div>
                <div className="signature-caption">Veterinarian: {selectedVisit.veterinarianName || 'Not Assigned'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="recordMessage-modal-overlay">
          <div className="recordMessage-modal">
            <div className="recordMessage-modal-header">
              <h2>Record Message</h2>
            </div>

            <div className="recordMessage-modal-body">
              <p>{messageModal}</p>
            </div>

            <div className="recordMessage-modal-footer">
              <button
                className="recordMessage-close-btn"
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
