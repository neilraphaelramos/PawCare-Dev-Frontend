import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";
import { GoogleLogin } from "@react-oauth/google";
import { UserContext } from "../../hook/authContext";
import zipCode from "../../data/zipcode.json"

export default function Register() {
  const navigate = useNavigate();
  const [agree, setAgree] = useState(false);
  const { setUser } = useContext(UserContext);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [messageModal, setMessageModal] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRegister, setIsRegister] = useState(false)

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    username: "",
    email: "",
    phone: "",
    houseNum: "",
    province: "",
    provinceCode: "",
    municipality: "",
    municipalityCode: "",
    barangay: "",
    zipCode: "",
    password: "",
    confirmPassword: "",
  });

  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const isPasswordMatch = form.confirmPassword
    ? form.password === form.confirmPassword
    : null;

  useEffect(() => {
    axios
      .get("https://psgc.gitlab.io/api/provinces.json")
      .then((res) => setProvinces(res.data))
      .catch((err) => console.error("Error loading provinces:", err));
  }, []);

  useEffect(() => {
    if (form.provinceCode) {
      axios
        .get(`https://psgc.gitlab.io/api/provinces/${form.provinceCode}/cities-municipalities.json`)
        .then((res) => setMunicipalities(res.data))
        .catch((err) => console.error("Error loading municipalities:", err));
    } else {
      setMunicipalities([]);
      setBarangays([]);
    }
  }, [form.provinceCode]);

  useEffect(() => {
    if (form.municipalityCode) {
      axios
        .get(`https://psgc.gitlab.io/api/cities-municipalities/${form.municipalityCode}/barangays.json`)
        .then((res) => setBarangays(res.data))
        .catch((err) => console.error("Error loading barangays:", err));
    } else {
      setBarangays([]);
    }
  }, [form.municipalityCode]);

  const openModal = (message) => {
    setMessageModal(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsRegister(false)
    if (isSuccess) {
      navigate("/login");
      setIsSuccess(false)
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "province") {
      const selected = provinces.find((p) => p.name === value);
      setForm((prev) => ({
        ...prev,
        province: value,
        provinceCode: selected?.code || "",
        municipality: "",
        municipalityCode: "",
        barangay: "",
        zipCode: "" // reset ZIP when province changes
      }));
    } else if (name === "municipality") {
      const selected = municipalities.find((m) => m.name === value);

      // find matching ZIP code based on province + municipality
      const zipEntry = zipCode.find(
        (z) =>
          z.location.toLowerCase() === form.province.toLowerCase() &&
          z.municipality.toLowerCase() === value.toLowerCase()
      );

      console.log("Zip entry found:", zipEntry);

      setForm((prev) => ({
        ...prev,
        municipality: value,
        municipalityCode: selected?.code || "",
        barangay: "",
        zipCode: zipEntry ? zipEntry.post_code.toString() : ""
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsRegister(true);

    if (!agree) {
      openModal("You must agree to the Terms & Conditions and Privacy Policy.");
      setIsRegister(false);
      return;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPasswordRegex.test(form.password)) {
      openModal(
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
      );
      setIsRegister(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      openModal("Passwords do not match.");
      setIsRegister(false);
      return;
    }

    try {
      const usernameRes = await axios.post("/server-api/check-username", {
        username: form.username,
      });
      if (usernameRes.data.exists) {
        openModal("Username already exists. Please choose another one.");
        setIsRegister(false);
        return;
      }

      const emailRes = await axios.post("/server-api/check-email", {
        email: form.email,
      });
      if (emailRes.data.exists) {
        openModal("Email is already registered. Please use another email.");
        setIsRegister(false);
        return;
      }

      const res = await axios.post("/server-api/register", form);

      if (res.data.message) {
        openModal("✅ " + res.data.message);

        setForm({
          firstName: "",
          middleName: "",
          lastName: "",
          suffix: "",
          username: "",
          email: "",
          phone: "",
          houseNum: "",
          province: "",
          provinceCode: "",
          municipality: "",
          municipalityCode: "",
          barangay: "",
          zipCode: "",
          password: "",
          confirmPassword: "",
        });

        setIsSuccess(true);
        setShowModal(true);
        setIsRegister(false);
      } else if (res.data.error) {
        openModal(res.data.error);
        setIsRegister(false);
      }
    } catch (err) {
      console.error(err);
      openModal("Something went wrong.");
      setIsRegister(false);
    }
  };

  const handleGoogleAuth = async (credentialResponse) => {
    try {
      const res = await axios.post("server-api/auth/google", {
        token: credentialResponse.credential,
      });

      setUser(res.data.user);
      openModal(res.data.message);

      setTimeout(() => {
        navigate("/users");
      }, 1500);
    } catch (err) {
      console.error(err);
      openModal("Something went wrong.");
    }
  };

  const handleGoogleError = () => {
    openModal("Google Login Failed");
  };

  return (
    <div className="login-container">
      <div className="login-image-section">
        <img src="images/bg5.png" alt="Dog" />
      </div>

      <div className="register-form-section">
        <div className="register-card">
          <h1>Create Account</h1>
          <p className="subtext">Join us by filling out the information below</p>

          <form onSubmit={handleSubmit}>
            <div className="forminfo">
              {/* all input fields */}
              <input type="text" name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
              <input type="text" name="middleName" placeholder="Middle Name (Optional)" value={form.middleName} onChange={handleChange} />
              <input type="text" name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
              <input type="text" name="suffix" placeholder="Suffix (Optional)" value={form.suffix} onChange={handleChange} />
              <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
              <input type="tel" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
              <input type="text" name="houseNum" placeholder="House Number & Street" value={form.houseNum} onChange={handleChange} required />

              {/* Province */}
              <select className="input-like" name="province" value={form.province} onChange={handleChange} required>
                <option value="">Select Province</option>
                {provinces.map((prov) => (
                  <option key={prov.code} value={prov.name}>{prov.name}</option>
                ))}
              </select>

              {/* Municipality */}
              <select className="input-like" name="municipality" value={form.municipality} onChange={handleChange} required disabled={!form.province}>
                <option value="">Select Municipality</option>
                {municipalities.map((mun) => (
                  <option key={mun.code} value={mun.name}>{mun.name}</option>
                ))}
              </select>

              {/* Barangay */}
              <select className="input-like" name="barangay" value={form.barangay} onChange={handleChange} required disabled={!form.municipality}>
                <option value="">Select Barangay</option>
                {barangays.map((brgy) => (
                  <option key={brgy.code} value={brgy.name}>{brgy.name}</option>
                ))}
              </select>

              <input type="text" name="zipCode" placeholder="Zip Code (Optional)" value={form.zipCode} onChange={handleChange} />
              <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
              {form.confirmPassword && (
                <p
                  className={`register-password-match ${isPasswordMatch ? "match" : "no-match"
                    }`}
                >
                  {isPasswordMatch ? "✅ Passwords match" : "❌ Passwords do not match"}
                </p>
              )}
            </div>

            <button type="submit" disabled={!agree || isRegister}>
              {isRegister ? 'Signing Up...' : 'Sign Up'}
            </button>

            <div className="terms-container">
              <label className="terms-label">
                <input type="checkbox" className="terms-input" required checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span className="terms-text">
                  I agree to the{" "}
                  <button type="button" className="link-button" onClick={() => setShowTerms(true)}>Terms & Conditions</button>{" "}
                  and{" "}
                  <button type="button" className="link-button" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
                </span>
              </label>
            </div>
          </form>

          <div className="divider"><span>Or continue with</span></div>

          <div className="social-login">
            <GoogleLogin onSuccess={handleGoogleAuth} onError={handleGoogleError} />
          </div>

          <p className="signup-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>

      {/* ✅ Terms & Conditions Modal */}
      {showTerms && (
        <div className="terms-modal" onClick={() => setShowTerms(false)}>
          <div className="terms-modal-content">
            <button className="terms-close" onClick={() => setShowTerms(false)}>&times;</button>
            <h2><strong>Terms and Conditions</strong></h2>
            <div className="terms-body">
              <p>
                By creating an account and using the <strong>PawCare System</strong>,
                you acknowledge and agree to comply with the following terms and conditions.
                Please read them carefully before proceeding.
              </p>
              <br />
              <p>
                <strong>1. Account Responsibility</strong><br />
                <br />
                When registering for a PawCare account, you agree to provide accurate,
                complete, and current information. You are solely responsible for
                safeguarding your login credentials and for all activities conducted
                under your account. Any unauthorized use or breach of security must be
                reported immediately to the system administrator. PawCare shall not be held
                liable for any loss or damage resulting from your failure to protect your
                account information.
              </p>
              <br />
              <p>
                <strong>2. Authorized Use</strong><br />
                <br />
                The PawCare System is exclusively intended for registered clients,
                licensed veterinarians, and authorized administrators of <strong>Rivera Veterinary Clinic</strong>.
                Any unauthorized access, data tampering, reverse engineering, or
                modification of system features is strictly prohibited and
                may result in account suspension and possible legal action.
              </p>
              <br />
              <p>
                <strong>3. System Content and Intellectual Property</strong><br />
                <br />
                All content within the PawCare System—including but not limited to pet health records,
                consultation notes, user information, and inventory data—remains the exclusive
                property of <strong>Rivera Veterinary Clinic</strong>. Unauthorized copying, distribution, or
                misuse of this information is prohibited. The system’s design, layout, code,
                and functionalities are protected under applicable copyright and
                intellectual property laws.
              </p>
              <br />
              <p>
                <strong>4. Privacy and Data Protection</strong><br />
                <br />
                PawCare adheres to the principles of the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>.
                All personal and medical information collected within the system is securely stored and
                used solely for veterinary and administrative purposes. Your data will not be shared with third parties without your
                consent, except when required by law or authorized by the clinic for legitimate operational purposes.
                For more information, please review our Privacy Policy.
              </p>
              <br />
              <p>
                <strong>5. Modifications to the Terms</strong><br />
                <br />
                The developers and administrators of PawCare reserve the right to update or
                modify these Terms and Conditions at any time to reflect improvements or
                legal requirements. Users will be notified of significant changes through
                the system or registered email. Continued use of the PawCare System after
                such modifications constitutes acceptance of the updated terms.
              </p>
              <br />
              <p>
                <strong>6. Limitation of Liability</strong><br />
                <br />
                While every effort is made to ensure the accuracy and reliability of PawCare,
                <strong>Rivera Veterinary Clinic</strong> and the system developers shall not be held liable
                for any direct or indirect damages, data loss, or service interruptions resulting
                from factors beyond their control, including but not limited to technical failures,
                internet connectivity issues, or unauthorized system access.
              </p>
              <br />
              <p>
                <strong>7. Acceptance of Terms</strong><br />
                <br />
                By proceeding with your registration, you confirm that you have read, understood, and agreed to these Terms and Conditions. If you do not agree with any part of these terms, you must refrain from using the PawCare System.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Privacy Policy Modal */}
      {showPrivacy && (
        <div className="privacy-modal" onClick={() => setShowPrivacy(false)}>
          <div className="privacy-modal-content">
            <button className="privacy-close" onClick={() => setShowPrivacy(false)}>&times;</button>
            <h2><strong>Privacy Policy</strong></h2>
            <div className="privacy-body">
              <p>
                This Privacy Policy explains how <strong>PawCare</strong>, developed for <strong>Rivera Veterinary Clinic</strong>,
                collects, uses, stores, and protects the personal information of its users.
                By creating an account and using the PawCare System, you consent to the data
                practices described in this policy.
              </p>
              <br />
              <hr />
              <br />
              <p>
                <strong>1. Information We Collect</strong><br />
                PawCare may collect the following types of personal and pet-related information during registration and system use:
                <br />• <strong>Personal Information:</strong> Name, contact number, email address, complete address, and account credentials.
                <br />• <strong>Pet Information:</strong> Pet name, breed, species, age, gender, and medical history.
                <br />• <strong>Transaction and Consultation Data:</strong> Appointment details, consultation notes, prescriptions, and billing records.
                <br />• <strong>System Usage Data:</strong> Login activities, communication logs, and other interactions within the system.
              </p>
              <br />
              <p>
                All data collected is used strictly for veterinary, administrative, and
                record management purposes.
              </p>
              <br />
              <hr />
              <br />
              <p>
                <strong>2. Purpose of Data Collection</strong><br />
                The information you provide is collected and processed to:
                <br />• Facilitate <strong>online consultations</strong> and <strong>appointments</strong> with veterinarians.
                <br />• Maintain accurate <strong>electronic health records</strong> (EHR) for pets.
                <br />• Support inventory and transaction management.
                <br />• Improve system services and user experience.
                <br />• Comply with applicable legal, regulatory, or clinic requirements.
              </p>
              <br />
              <p>
                Your personal information will <strong>not</strong> be sold, rented, or disclosed to any
                unauthorized party.
              </p>
              <br />
              <hr />
              <br />
              <p>
                <strong>3. Data Storage and Security</strong><br />
                PawCare implements strict technical and organizational measures to ensure the confidentiality, integrity, and security of your information. This includes encryption, secure databases, and limited access to authorized personnel only.
              </p>
              <br />
              <hr />
              <br />
              <p>
                <strong>4. Data Sharing and Disclosure</strong><br />
                Your data may be shared only under the following conditions:
                <br />• With <strong>authorized veterinarians and administrators</strong> for clinic operations.
                <br />• With <strong>third-party service providers</strong> strictly for technical support or maintenance, bound by confidentiality agreements.
                <br />• When <strong>required by law</strong> or in response to valid legal processes.
              </p>
              <br />
              <p>
                PawCare will never disclose your information without your consent, except under the conditions stated above.
              </p>
              <br />
              <hr />
              <br />
              <p>
                <strong>5. Data Retention</strong><br />
                All user and pet data will be retained for as long as necessary to fulfill the purposes outlined in this policy or as required by law. Users may request account deletion or data removal by contacting the clinic’s Data Protection Officer (DPO).
              </p>
              <br />
              <hr />
              <br />
              <p>
                <strong>6. Your Rights Under the Data Privacy Act of 2012</strong><br />
                Under <strong>Republic Act No. 10173 (Data Privacy Act of 2012)</strong>, you are entitled to the following rights:
                <br />• Right to be Informed – To know how your data is collected, used, and
                processed.
                <br />• <strong>Right to Access</strong> – To request a copy of your personal information stored
                in the system.
                <br />• <strong>Right to Rectification</strong> – To correct any inaccurate or outdated
                information.
                <br />• <strong>Right to Erasure or Blocking</strong> – To request deletion or suspension of your
                personal data under lawful circumstances.
                <br />• <strong>Right to Data Portability</strong> – To obtain and reuse your data for personal
                use.
                <br />• <strong>Right to Object</strong> – To withhold consent to data processing not aligned
                with the stated purpose.
              </p>
              <br />
              <p>
                Requests regarding these rights may be directed to the clinic’s Data
                Protection Officer.
              </p>
              <br />
              <hr />
              <br />
              <p>
                <strong>7. Updates to This Policy</strong><br />
                PawCare reserves the right to update this Privacy Policy from time to time
                to comply with new legal or technical requirements.
                Any major changes will be communicated through the
                system or via email. Continued use of the system signifies
                acceptance of the updated policy.
              </p>
              <br />
              <hr />
              <br />
              <p>
                <strong>8. Contact Information</strong><br />
                For concerns, data requests, or privacy-related inquiries, you may contact:
                <br />
                <br /><strong>Data Protection Officer (DPO)</strong>
                <br />Rivera Veterinary Clinic
                <br />Email: riveravetclinic@gmail.com
                <br />Contact No.: 0927 392 4215
              </p>
              <br />
              <hr />
              <br />
              <p>
                By using the PawCare System, you acknowledge that you have read,
                understood, and agreed to this Privacy Policy and the collection and
                processing of your data in accordance with the Data Privacy Act of
                2012.
              </p>
            </div>
          </div>
        </div>
      )};

      {showModal && (
        <div className="register-modal-overlay">
          <div className="register-modal">
            <p>{messageModal}</p>
            <button className="register-modal-close" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
