# 🚚 Fleet Biometric Clocking System

A modern web-based **Fleet Biometric Clocking System** designed to help organisations manage employee attendance, vehicle inspections, biometric verification, and GPS-based clocking.

The system provides employees with a simple and user-friendly interface for securely clocking in and out while recording the vehicle they are assigned to and the location where the clocking takes place.

---

## 📌 Project Overview

The Fleet Biometric Clocking System is a front-end web application developed using:

- HTML5
- CSS3
- JavaScript
- WebAuthn / Passkeys
- Geolocation API
- Browser LocalStorage

The project is designed with **mobile and desktop users** in mind, making it suitable for employees using smartphones, tablets, laptops, or desktop computers.

---

## ✨ Key Features

### 👤 Employee Registration

Employees can be registered using:

- Employee ID
- Employee name
- Vehicle/Fleet number

The information is stored locally in the browser for the current prototype.

---

### 🔐 Biometric Authentication

The system supports browser-based biometric authentication using **WebAuthn / Passkeys**.

Depending on the employee's device, authentication may use:

- Fingerprint
- Face authentication
- Device PIN
- Passkey

Biometric authentication helps provide an additional layer of identity verification before clocking.

> **Note:** The current version is a prototype. A production system should implement server-side WebAuthn challenge and credential verification.

---

### 🟢 Clock In

Employees can clock in after biometric verification.

The system records:

- Employee ID
- Employee name
- Vehicle/Fleet number
- Date
- Time
- GPS latitude
- GPS longitude
- Location accuracy

The system requests the employee's current location when clocking in.

---

### 🔴 Clock Out

Employees can clock out using the same biometric verification process.

The system records a fresh GPS location and the exact clock-out date and time.

---

### 📍 GPS Location

The application uses the browser's **Geolocation API** to obtain the employee's current location.

Each clocking record can contain:

- Latitude
- Longitude
- GPS accuracy
- Google Maps location link

This allows authorised users to determine where the clocking event occurred.

---

### 🚛 Vehicle Inspection

Before clocking in, employees can complete a vehicle inspection.

The inspection includes:

- ⛽ Fuel level
- 🛞 Tyres
- 💡 Lights
- 🪞 Mirrors
- 🪟 Windows/Windscreen
- 🚘 Vehicle body
- 🔧 Engine/Mechanical condition
- 🛑 Brakes
- ⚠️ Damage or faults
- Overall vehicle condition

---

### 📷 Vehicle Photos

Employees can take or select multiple photographs of the vehicle.

Photos can be used to document:

- Vehicle condition
- Existing damage
- Exterior condition
- Visible faults
- Other inspection evidence

The application uses the device camera where supported by the browser.

---

### 🕐 Live Date and Time

The system displays a continuously updating:

- Current time
- Current date

The clock updates automatically every second.

---

### 📋 Attendance Records

Clocking records are displayed inside the application.

Each record can show:

- Employee
- Employee ID
- Vehicle
- Clock-in/clock-out status
- Date
- Time
- GPS coordinates
- Location accuracy
- Google Maps link

---

## 📱 Responsive Design

The interface is designed to work on:

- 📱 Smartphones
- 📲 Tablets
- 💻 Laptops
- 🖥️ Desktop computers

The layout automatically adapts to different screen sizes.

---

# 🗂️ Project Structure

```text
fleet-clocking-system/
│
├── Index.html
├── style.css
├── script.js
└── README.md
