import React, { useState, useEffect, useContext } from 'react';
import { FaPlus, FaRegEye } from 'react-icons/fa';
import './PetRecords.css';
import { UserContext } from '../../hook/authContext';
import axios from 'axios';
import VisitDetailModal from '../../components/printLogic/VisitDetailModal';

export default function PetRecords() {
  const { user } = useContext(UserContext);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [messageModal, setMessageModal] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const APIENDPOINT = process.env.REACT_APP_API_URL;

  const fetchPets = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${APIENDPOINT}/pet_medical_records/fetch_user/${user.username}`);
      const data = res.data.map(pet => ({
        ...pet,
        diagnosis: pet.diagnosis || 'No Diagnosis Yet',
        condition: pet.condition || 'No Condition Yet',
        lastVisit: pet.lastVisit || 'No Last Visit Yet',
      }));
      setPets(data);
    } catch (err) {
      console.error('Error fetching pet records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.username) return;
    fetchPets();
  }, [user]);

  const handleView = async (pet) => {
    try {
      const res = await axios.get(`${APIENDPOINT}/pet_medical_records/fetch/visit_history/${pet.id}`);
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

  const handlePrint = () => {
    window.print();
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
        </div>
      </div>

      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Pet Type</th>
              <th>Species</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Condition</th>
              <th>Last Visit</th>
              <th>Diagnosis</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="10" className="user-loading">
                  Loading pet records...
                </td>
              </tr>
            ) : filteredPets.length > 0 ? (
              filteredPets.map((pet) => (
                <tr key={pet.id} className="user-row">
                  <td>
                    <img
                      src={pet.photo}
                      alt={pet.name}
                      className="user-thumb"
                    />
                  </td>
                  <td>{pet.name}</td>
                  <td>{pet.petType}</td>
                  <td>{pet.species}</td>
                  <td>{pet.age} yrs</td>
                  <td>{pet.gender}</td>
                  <td>{pet.condition}</td>
                  <td>{pet.lastVisit}</td>
                  <td className="user-diagnosis">
                    {pet.diagnosis?.length > 30
                      ? pet.diagnosis.slice(0, 30) + "…"
                      : pet.diagnosis}
                  </td>
                  <td>
                    <button
                      className="user-action-btn"
                      title="View Record"
                      onClick={() => handleView(pet)}
                    >
                      <FaRegEye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="user-no-records">
                  Records not found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                      <p>
                        <strong className='label-admin-date'>{visit.day}</strong>
                        <br />
                        <span className='label-admin-date'>{visit.date}</span>
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
        <VisitDetailModal
          selectedVisit={selectedVisit}
          selectedPet={selectedPet}
          onClose={() => setSelectedVisit(null)}
          role={user.role}
          printName={""}
        />
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
