/* =====================================================
   FLEET BIOMETRIC CLOCKING SYSTEM
   script.js
===================================================== */

const EMPLOYEE_STORAGE = "fleetEmployees";
const INSPECTION_STORAGE = "fleetVehicleInspections";
const RECORD_STORAGE = "fleetClockingRecords";

/* =====================================================
   STORAGE HELPERS
===================================================== */

function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}


/* =====================================================
   STATUS MESSAGE
===================================================== */

function showStatus(message, type = "info") {
    const status = document.getElementById("statusMessage");

    if (!status) return;

    status.textContent = message;

    status.className = "status";

    if (type === "success") {
        status.classList.add("success");
    }

    if (type === "error") {
        status.classList.add("error");
    }
}


/* =====================================================
   LIVE DATE AND TIME
===================================================== */

function updateLiveDateTime() {

    const now = new Date();

    const time = now.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    const date = now.toLocaleDateString("en-ZA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const currentTime = document.getElementById("currentTime");
    const currentDate = document.getElementById("currentDate");

    if (currentTime) {
        currentTime.textContent = time;
    }

    if (currentDate) {
        currentDate.textContent = date;
    }
}

setInterval(updateLiveDateTime, 1000);


/* =====================================================
   EMPLOYEE REGISTRATION
===================================================== */

function registerEmployee() {

    const employeeId =
        document.getElementById("employeeId")?.value.trim();

    const employeeName =
        document.getElementById("employeeName")?.value.trim();

    const vehicleNumber =
        document.getElementById("vehicleNumber")?.value.trim();

    if (!employeeId || !employeeName || !vehicleNumber) {
        showStatus(
            "Please enter Employee ID, Employee Name and Vehicle Number.",
            "error"
        );
        return;
    }

    const employees = getData(EMPLOYEE_STORAGE);

    const existing = employees.find(
        employee => employee.id.toLowerCase() === employeeId.toLowerCase()
    );

    if (existing) {
        showStatus("Employee ID already exists.", "error");
        return;
    }

    const employee = {
        id: employeeId,
        name: employeeName,
        vehicle: vehicleNumber,
        registeredAt: new Date().toISOString()
    };

    employees.push(employee);

    saveData(EMPLOYEE_STORAGE, employees);

    showStatus(
        `Employee ${employeeName} registered successfully.`,
        "success"
    );
}


/* =====================================================
   WEB AUTHN / BIOMETRICS SUPPORT
===================================================== */

function checkBiometricSupport() {

    if (!window.PublicKeyCredential) {
        showStatus(
            "Biometric authentication is not supported on this device/browser.",
            "error"
        );

        return false;
    }

    if (!window.isSecureContext) {
        showStatus(
            "Biometrics require HTTPS or localhost.",
            "error"
        );

        return false;
    }

    return true;
}


/* =====================================================
   REGISTER BIOMETRIC
===================================================== */

async function registerBiometric() {

    if (!checkBiometricSupport()) return;

    const employeeId =
        document.getElementById("employeeId")?.value.trim();

    const employeeName =
        document.getElementById("employeeName")?.value.trim();

    const vehicleNumber =
        document.getElementById("vehicleNumber")?.value.trim();

    if (!employeeId || !employeeName || !vehicleNumber) {

        showStatus(
            "Complete the employee registration details first.",
            "error"
        );

        return;
    }

    try {

        const challenge = crypto.getRandomValues(
            new Uint8Array(32)
        );

        const userId = crypto.getRandomValues(
            new Uint8Array(16)
        );

        const credential =
            await navigator.credentials.create({
                publicKey: {

                    challenge: challenge,

                    rp: {
                        name: "Fleet Biometric Clocking System"
                    },

                    user: {
                        id: userId,
                        name: employeeId,
                        displayName: employeeName
                    },

                    pubKeyCredParams: [
                        {
                            type: "public-key",
                            alg: -7
                        },
                        {
                            type: "public-key",
                            alg: -257
                        }
                    ],

                    authenticatorSelection: {
                        residentKey: "preferred",
                        userVerification: "required"
                    },

                    timeout: 60000,

                    attestation: "none"
                }
            });

        if (!credential) {
            throw new Error("Biometric registration failed.");
        }

        const biometricData = {

            credentialId: credential.id,

            employeeId: employeeId,

            employeeName: employeeName,

            vehicleNumber: vehicleNumber,

            registeredAt: new Date().toISOString()
        };

        localStorage.setItem(
            "biometric_" + employeeId.toLowerCase(),
            JSON.stringify(biometricData)
        );

        showStatus(
            "Biometric / Face ID / Passkey registered successfully.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showStatus(
            "Biometric registration was cancelled or failed.",
            "error"
        );
    }
}


/* =====================================================
   AUTHENTICATE BIOMETRIC
===================================================== */

async function authenticateBiometric(employeeId) {

    if (!checkBiometricSupport()) return false;

    const key =
        "biometric_" + employeeId.toLowerCase();

    const biometric =
        JSON.parse(localStorage.getItem(key));

    if (!biometric) {

        showStatus(
            "No biometric registration found for this employee.",
            "error"
        );

        return false;
    }

    try {

        const credential =
            await navigator.credentials.get({
                publicKey: {

                    challenge:
                        crypto.getRandomValues(
                            new Uint8Array(32)
                        ),

                    allowCredentials: [
                        {
                            type: "public-key",
                            id: base64ToArrayBuffer(
                                biometric.credentialId
                            )
                        }
                    ],

                    userVerification: "required",

                    timeout: 60000
                }
            });

        if (!credential) {
            return false;
        }

        showStatus(
            "Biometric verification successful.",
            "success"
        );

        return true;

    } catch (error) {

        console.error(error);

        showStatus(
            "Biometric verification failed.",
            "error"
        );

        return false;
    }
}


/* =====================================================
   CONVERT CREDENTIAL ID
===================================================== */

function base64ToArrayBuffer(base64) {

    try {

        const binary =
            atob(
                base64
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            );

        const bytes =
            new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return bytes.buffer;

    } catch (error) {

        return new Uint8Array();
    }
}


/* =====================================================
   GET CURRENT GPS LOCATION
===================================================== */

function getCurrentLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {

            reject(
                new Error(
                    "Geolocation is not supported."
                )
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(

            position => {

                resolve({

                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude,

                    accuracy:
                        position.coords.accuracy

                });

            },

            error => {

                reject(error);

            },

            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        );
    });
}


/* =====================================================
   VEHICLE INSPECTION
===================================================== */

function saveInspection() {

    const vehicle =
        document.getElementById("inspectionVehicle")?.value.trim();

    const fuel =
        document.getElementById("fuel")?.value;

    const tyres =
        document.getElementById("tyres")?.value;

    const lights =
        document.getElementById("lights")?.value;

    const mirrors =
        document.getElementById("mirrors")?.value;

    const windows =
        document.getElementById("windows")?.value;

    const body =
        document.getElementById("body")?.value;

    const engine =
        document.getElementById("engine")?.value;

    const brakes =
        document.getElementById("brakes")?.value;

    const damage =
        document.getElementById("damage")?.value.trim();

    const overallCondition =
        document.getElementById("overallCondition")?.value;

    if (
        !vehicle ||
        !fuel ||
        !tyres ||
        !lights ||
        !mirrors ||
        !windows ||
        !body ||
        !engine ||
        !brakes ||
        !overallCondition
    ) {

        showStatus(
            "Please complete the vehicle inspection.",
            "error"
        );

        return false;
    }

    const inspections =
        getData(INSPECTION_STORAGE);

    const inspection = {

        vehicle: vehicle,

        fuel: fuel,

        tyres: tyres,

        lights: lights,

        mirrors: mirrors,

        windows: windows,

        body: body,

        engine: engine,

        brakes: brakes,

        damage: damage,

        overallCondition: overallCondition,

        date: new Date().toISOString()
    };

    inspections.push(inspection);

    saveData(
        INSPECTION_STORAGE,
        inspections
    );

    showStatus(
        "Vehicle inspection saved successfully.",
        "success"
    );

    return true;
}


/* =====================================================
   MULTIPLE VEHICLE PHOTOS
===================================================== */

function getVehiclePhotos() {

    const photoInput =
        document.getElementById("vehiclePhotos");

    if (!photoInput || !photoInput.files) {
        return [];
    }

    const photos = [];

    for (const file of photoInput.files) {

        photos.push({

            name: file.name,

            type: file.type,

            size: file.size,

            capturedAt:
                new Date().toISOString()

        });
    }

    return photos;
}


/* =====================================================
   CLOCK IN
===================================================== */

async function clockIn() {

    const employeeId =
        document.getElementById("clockEmployeeId")
        ?.value.trim();

    if (!employeeId) {

        showStatus(
            "Please enter the Employee ID.",
            "error"
        );

        return;
    }

    showStatus(
        "Checking biometric authentication..."
    );

    const authenticated =
        await authenticateBiometric(employeeId);

    if (!authenticated) {
        return;
    }

    showStatus(
        "Getting current GPS location..."
    );

    let location;

    try {

        location =
            await getCurrentLocation();

    } catch (error) {

        showStatus(
            "Location permission is required to clock in.",
            "error"
        );

        return;
    }

    const inspectionSaved =
        saveInspection();

    if (!inspectionSaved) {
        return;
    }

    const records =
        getData(RECORD_STORAGE);

    const employee =
        getData(EMPLOYEE_STORAGE)
            .find(
                e =>
                    e.id.toLowerCase() ===
                    employeeId.toLowerCase()
            );

    const now = new Date();

    const record = {

        employeeId: employeeId,

        employeeName:
            employee?.name || "Unknown Employee",

        vehicle:
            employee?.vehicle || "Unknown Vehicle",

        type: "Clock In",

        date: now.toLocaleDateString("en-ZA"),

        time: now.toLocaleTimeString("en-ZA"),

        timestamp: now.toISOString(),

        location: location

    };

    records.push(record);

    saveData(
        RECORD_STORAGE,
        records
    );

    showStatus(
        "Clock In successful. GPS location recorded.",
        "success"
    );

    displayRecords();
}


/* =====================================================
   CLOCK OUT
===================================================== */

async function clockOut() {

    const employeeId =
        document.getElementById("clockEmployeeId")
        ?.value.trim();

    if (!employeeId) {

        showStatus(
            "Please enter the Employee ID.",
            "error"
        );

        return;
    }

    showStatus(
        "Checking biometric authentication..."
    );

    const authenticated =
        await authenticateBiometric(employeeId);

    if (!authenticated) {
        return;
    }

    showStatus(
        "Getting current GPS location..."
    );

    let location;

    try {

        location =
            await getCurrentLocation();

    } catch (error) {

        showStatus(
            "Location permission is required to clock out.",
            "error"
        );

        return;
    }

    const records =
        getData(RECORD_STORAGE);

    const employee =
        getData(EMPLOYEE_STORAGE)
            .find(
                e =>
                    e.id.toLowerCase() ===
                    employeeId.toLowerCase()
            );

    const now = new Date();

    const record = {

        employeeId: employeeId,

        employeeName:
            employee?.name || "Unknown Employee",

        vehicle:
            employee?.vehicle || "Unknown Vehicle",

        type: "Clock Out",

        date: now.toLocaleDateString("en-ZA"),

        time: now.toLocaleTimeString("en-ZA"),

        timestamp: now.toISOString(),

        location: location

    };

    records.push(record);

    saveData(
        RECORD_STORAGE,
        records
    );

    showStatus(
        "Clock Out successful. GPS location recorded.",
        "success"
    );

    displayRecords();
}


/* =====================================================
   DISPLAY ATTENDANCE RECORDS
===================================================== */

function displayRecords() {

    const container =
        document.getElementById("recordsContainer");

    if (!container) return;

    const records =
        getData(RECORD_STORAGE);

    if (records.length === 0) {

        container.innerHTML =
            `<p class="empty-records">
                No attendance records yet.
            </p>`;

        return;
    }

    container.innerHTML = "";

    [...records]
        .reverse()
        .forEach(record => {

            const div =
                document.createElement("div");

            div.className = "record";

            let mapLink = "";

            if (record.location) {

                const lat =
                    record.location.latitude;

                const lng =
                    record.location.longitude;

                mapLink =
                    `
                    <p>
                        📍 Location:
                        ${lat.toFixed(6)},
                        ${lng.toFixed(6)}
                    </p>

                    <p>
                        Accuracy:
                        ${Math.round(
                            record.location.accuracy
                        )} metres
                    </p>

                    <a
                        href="https://www.google.com/maps?q=${lat},${lng}"
                        target="_blank">
                        🗺️ View on Google Maps
                    </a>
                    `;
            }

            div.innerHTML = `

                <p>
                    <strong>
                        ${escapeHTML(
                            record.employeeName
                        )}
                    </strong>
                </p>

                <p>
                    Employee ID:
                    ${escapeHTML(
                        record.employeeId
                    )}
                </p>

                <p>
                    Vehicle:
                    ${escapeHTML(
                        record.vehicle
                    )}
                </p>

                <p>
                    Status:
                    <strong>
                        ${record.type}
                    </strong>
                </p>

                <p>
                    📅 ${record.date}
                </p>

                <p>
                    🕐 ${record.time}
                </p>

                ${mapLink}

            `;

            container.appendChild(div);
        });
}


/* =====================================================
   CLEAR RECORDS
===================================================== */

function clearRecords() {

    const confirmed =
        confirm(
            "Are you sure you want to delete all attendance records?"
        );

    if (!confirmed) return;

    localStorage.removeItem(RECORD_STORAGE);

    displayRecords();

    showStatus(
        "Attendance records cleared.",
        "success"
    );
}


/* =====================================================
   HTML SECURITY
===================================================== */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   START SYSTEM
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateLiveDateTime();

        displayRecords();

        checkBiometricSupport();

        console.log(
            "Fleet Biometric Clocking System loaded."
        );
    }
);