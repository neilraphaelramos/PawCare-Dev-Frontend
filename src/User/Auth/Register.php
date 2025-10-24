<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "PawCare");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["error" => "Invalid data"]);
    exit;
}

// Extract values
$firstName = $data['firstName'];
$middleName = $data['middleName'];
$lastName = $data['lastName'];
$suffix = $data['suffix'];
$username = $data['username'];
$email = $data['email'];
$phone = $data['phone'];
$country = $data['country'];
$province = $data['province'];
$municipality = $data['municipality'];
$barangay = $data['barangay'];
$zipCode = $data['zipCode'];
$password = password_hash($data['password'], PASSWORD_DEFAULT);

// Check if username or email exists
$check = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$check->bind_param("ss", $username, $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(["error" => "Username or email already taken"]);
    exit;
}

// Insert into DB
$stmt = $conn->prepare("INSERT INTO users (firstName, middleName, lastName, suffix, username, email, phone, country, province, municipality, barangay, zipCode, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssssssssss", $firstName, $middleName, $lastName, $suffix, $username, $email, $phone, $country, $province, $municipality, $barangay, $zipCode, $password);

if ($stmt->execute()) {
    echo json_encode(["message" => "Registration successful"]);
} else {
    echo json_encode(["error" => "Registration failed"]);
}
?>
