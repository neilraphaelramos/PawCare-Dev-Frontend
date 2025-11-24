import React, { useState, useEffect, useContext } from "react";
import { FaPlus, FaEdit } from "react-icons/fa";
import "./PetInfos.css";
import { UserContext } from "../../hook/authContext";
import axios from "axios";

export default function PetInfos() {
    const { user } = useContext(UserContext);
    const [pets, setPets] = useState([]);
    const [addPetInfo, setAddPetInfo] = useState(false);
    const [editPet, setEditPet] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [type, setType] = useState("");
    const [species, setSpecies] = useState("");
    const [speciesOptions, setSpeciesOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [ageValue, setAgeValue] = React.useState("");
    const [ageUnit, setAgeUnit] = React.useState("months");
    const [isNotify, setIsNotify] = useState(false);

    const fetchPets = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/pet_infos/fetch/${user.username}`
            );
            setPets(res.data || []);
        } catch (err) {
            console.error("Error fetching pets:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.username) fetchPets();
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
                setSpeciesOptions(data.map((b) => ({ id: b.id, name: b.name })));
            } catch (err) {
                console.error("Failed to load species", err);
            } finally {
                setLoading(false);
                setSpecies("");
            }
        }
        fetchBreeds();
    }, [type]);

    const handleAddPetInfo = async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData();

        const photoFile = form.photo.files[0];
        const petName = form.name.value;
        const petType = form.type.value;
        const species = form.species.value;
        const petGender = form.gender.value;
        const ownerUsername = user.username;
        const ownerName = [
            user.firstName,
            user.middleName,
            user.lastName,
            user.suffix,
        ].filter(Boolean).join(' ');

        const combinedAge = `${ageValue} ${ageUnit}`;

        formData.append("photo", photoFile);
        formData.append("petName", petName);
        formData.append("petType", petType);
        formData.append("species", species);
        formData.append("petAge", combinedAge);
        formData.append("petGender", petGender);
        formData.append("ownerUsername", ownerUsername);
        formData.append("ownerName", ownerName);

        try {
            setIsProcessing(true);
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/pet_infos/add_pet_info`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            try {
                await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api`, {
                    UID: user.id,
                    title_notify: "New Pet Added",
                    type_notify: "Pet Info",
                    details: `You added a new pet named ${form.name.value} to your pet records.`,
                });
            } catch (notifyErr) {
                console.error("Notification error:", notifyErr);
            };

            if (res.data.success) {
                setIsNotify(true);
                setMessage("✅ Pet added successfully!");
                setTimeout(() => {
                    setIsNotify(false);
                }, 3000);
                setAddPetInfo(false);
                fetchPets();
            } else {
                setMessage("Failed to add pet.");
                setIsNotify(true);
                setTimeout(() => {
                    setIsNotify(false);
                }, 3000);
            };
        } catch (err) {
            console.error(err);

            if (err.response && err.response.status == 409) {
                setMessage(err.response.data.message);
            } else {
                setMessage("Error adding pet.");
            }

            setIsNotify(true);
            setTimeout(() => {
                setIsNotify(false);
            }, 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdatePet = async (e) => {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData();

        const combinedAge = `${ageValue} ${ageUnit}`;

        if (form.photo.files[0]) formData.append("photo", form.photo.files[0]);
        formData.append("petName", form.name.value);
        formData.append("petType", form.type.value);
        formData.append("species", form.species.value);
        formData.append("petAge", combinedAge);
        formData.append("petGender", form.gender.value);

        try {
            setIsProcessing(true);
            const res = await axios.put(
                `${process.env.REACT_APP_API_URL}/pet_infos/edit_pet_info/${editPet.id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (res.data.success) {
                setMessage("✅ Pet updated successfully!");
                setIsNotify(true);
                setTimeout(() => {
                    setIsNotify(false);
                }, 3000);
                setEditPet(null);
                fetchPets();
            } else {
                setMessage("Failed to update pet.");
                setIsNotify(true);
                setTimeout(() => {
                    setIsNotify(false);
                }, 3000);
            };
        } catch (err) {
            console.error(err);
            setMessage("Error updating pet.");
            setIsNotify(true);
            setTimeout(() => {
                setIsNotify(false);
            }, 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredPets = pets.filter((p) =>
        [p.petName, p.petType, p.species, p.petAge, p.petGender]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="petinfo-wrapper">
            <h2 className="petinfo-title">My Pets</h2>

            <div className="petinfo-toolbar">
                <input
                    type="text"
                    className="petinfo-search"
                    placeholder="Search pets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="petinfo-add-btn" onClick={() => setAddPetInfo(true)}>
                    <FaPlus /> Add Pet
                </button>
            </div>

            <div className="petinfo-table-wrapper">
                {filteredPets.length > 0 ? (
                    <div className="petinfo-table-scroll">
                        <table className="petinfo-table">
                            <thead>
                                <tr>
                                    <th>Photo</th>
                                    <th>Name</th>
                                    <th>Pet Type</th>
                                    <th>Species</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPets.map((pet) => (
                                    <tr key={pet.id}>
                                        <td>
                                            <img
                                                src={pet.photo}
                                                alt={pet.petName}
                                                className="petinfo-thumb"
                                            />
                                        </td>
                                        <td>{pet.petName}</td>
                                        <td>{pet.petType}</td>
                                        <td>{pet.species}</td>
                                        <td>{pet.petAge}</td>
                                        <td>{pet.petGender}</td>
                                        <td>
                                            <button
                                                className="petinfo-edit-btn"
                                                onClick={() => {
                                                    setEditPet(pet)
                                                    const [value, unit] = pet.petAge.split(" ");
                                                    setAgeValue(value);
                                                    setAgeUnit(unit);
                                                }}
                                            >
                                                <FaEdit size={14} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="petinfo-empty">No pet records found.</div>
                )}
            </div>

            {addPetInfo && (
                <div className="petinfo-overlay">
                    <div className="petinfo-modal">
                        <button
                            className="petinfo-close-btn"
                            onClick={() => setAddPetInfo(false)}
                        >
                            ×
                        </button>
                        <h2 className="petinfo-modal-title">Add Pet Info</h2>

                        <form className="petinfo-form" onSubmit={handleAddPetInfo}>
                            <div className="petinfo-form-group">
                                <label>Photo</label>
                                <input type="file" name="photo" accept="image/*" required />
                            </div>

                            <div className="petinfo-form-group">
                                <label>Name</label>
                                <input type="text" name="name" required />
                            </div>

                            <div className="petinfo-form-group">
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

                            <div className="petinfo-form-group">
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
                                    {speciesOptions.map((s) => (
                                        <option key={s.id} value={s.name}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="petinfo-form-group">
                                <label>Age</label>
                                <div className="petinfo-age-row">
                                    <input
                                        type="number"
                                        name="age"
                                        required
                                        value={ageValue}
                                        onChange={(e) => setAgeValue(e.target.value)}
                                    />

                                    <select
                                        className="petinfo-age-unit"
                                        name="ageUnit"
                                        value={ageUnit}
                                        onChange={(e) => setAgeUnit(e.target.value)}
                                    >
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            </div>

                            <div className="petinfo-form-group">
                                <label>Gender</label>
                                <div className="petinfo-gender">
                                    <label>
                                        <input type="radio" name="gender" value="Male" required /> Male
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="Female"
                                            required
                                        />{" "}
                                        Female
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="petinfo-submit-btn" disabled={isProcessing}>
                                {isProcessing ? "Processing..." : "Add Pet"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {editPet && (
                <div className="petinfo-overlay">
                    <div className="petinfo-modal">
                        <button
                            className="petinfo-close-btn"
                            onClick={() => setEditPet(null)}
                        >
                            ×
                        </button>
                        <h2 className="petinfo-modal-title">Edit Pet Info</h2>

                        <form className="petinfo-form" onSubmit={handleUpdatePet}>
                            <div className="petinfo-form-group">
                                <div className="petinfo-img-wrapper">
                                    <label className="petinfo-label-img">Photo</label>
                                    <img
                                        src={editPet.photo}
                                        alt={editPet.petName}
                                        className="petinfo-preview"
                                    />
                                </div>
                                <input type="file" name="photo" accept="image/*" />
                            </div>

                            <div className="petinfo-form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    defaultValue={editPet.petName}
                                    required
                                />
                            </div>

                            <div className="petinfo-form-group">
                                <label>Pet Type</label>
                                <select
                                    name="type"
                                    value={type || editPet.petType}
                                    onChange={(e) => setType(e.target.value)}
                                    required
                                >
                                    <option value="Dog">Dog</option>
                                    <option value="Cat">Cat</option>
                                </select>
                            </div>

                            <div className="petinfo-form-group">
                                <label>Species</label>
                                <select
                                    name="species"
                                    value={species || editPet.species}
                                    onChange={(e) => setSpecies(e.target.value)}
                                    required
                                >
                                    <option value={editPet.species}>{editPet.species}</option>
                                    {speciesOptions.map((s) => (
                                        <option key={s.id} value={s.name}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="petinfo-form-group">
                                <label>Age</label>
                                <div className="petinfo-age-row">
                                    <input
                                        type="number"
                                        name="ageValue"
                                        required
                                        value={ageValue}
                                        onChange={(e) => setAgeValue(e.target.value)}
                                    />

                                    <select
                                        className="petinfo-age-unit"
                                        name="ageUnit"
                                        value={ageUnit}
                                        onChange={(e) => setAgeUnit(e.target.value)}
                                    >
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            </div>

                            <div className="petinfo-form-group">
                                <label>Gender</label>
                                <div className="petinfo-gender">
                                    <label >
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="Male"
                                            defaultChecked={editPet.petGender === "Male"}
                                        />
                                        Male
                                    </label>
                                    <label >
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="Female"
                                            defaultChecked={editPet.petGender === "Female"}
                                        />
                                        Female
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="petinfo-submit-btn" disabled={isProcessing}>
                                {isProcessing ? "Processing..." : "Update Pet"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isNotify && <div className="petinfo-toast">{message}</div>}
        </div>
    );
}
