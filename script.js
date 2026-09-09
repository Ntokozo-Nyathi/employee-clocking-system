```javascript
// =====================================================
// EMPLOYEE CLOCKING SYSTEM - JAVASCRIPT
// =====================================================

// Change this to the supervisor/emergency number
const emergencyNumber = "0123456789";

// -----------------------------------------------------
// GLOBAL VARIABLES
// -----------------------------------------------------

let cameraStream = null;
let currentPhoto = null;
let currentLocation = null;

// -----------------------------------------------------
// PAGE LOAD
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {

    updateClock();
    setInterval(updateClock, 1000);

    checkWebAuthn();

    displayRecords();

    const registerBtn = document.getElementById("registerBtn");
    const clockInBtn = document.getElementById("clockInBtn");
    const clockOutBtn = document.getElementById("clockOutBtn");
    const panicBtn = document.getElementById("panicBtn");

    if (registerBtn) {
        registerBtn.addEventListener("click", registerBiometric);
    }

    if (clockInBtn) {
        clockInBtn.addEventListener("click", clockIn);
    }

    if (clockOutBtn) {
        clockOutBtn.addEventListener("click", clockOut);
    }

    if (panicBtn) {
        panicBtn.addEventListener("click", panicButton);
    }
});


// =====================================================
// LIVE CLOCK
// =====================================================

function updateClock() {

    const now = new Date();

    const time = now.toLocaleTimeString();

    const date = now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const clockElement = document.getElementById("clock");
    const dateElement = document.getElementById("date");

    if (clockElement) {
        clockElement.textContent = time;
    }

    if (dateElement) {
        dateElement.textContent = date;
    }
}


// =====================================================
// WEBAUTHN / BIOMETRIC SUPPORT
// =====================================================

function checkWebAuthn() {

    const biometricStatus =
        document.getElementById("biometricStatus");

    if (!window.PublicKeyCredential) {

        if (biometricStatus) {
            biometricStatus.textContent =
                "Biometric authentication is not supported on this device/browser.";
        }

        return false;
    }

    if (biometricStatus) {
        biometricStatus.textContent =
            "Biometric authentication is available.";
    }

    return true;
}


// -----------------------------------------------------
// BASE64URL FUNCTIONS
// -----------------------------------------------------

function bufferToBase64URL(buffer) {

    const bytes = new Uint8Array(buffer);

    let binary = "";

    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}


function base64URLToBuffer(base64URL) {

    const padding = "=".repeat(
        (4 - base64URL.length % 4) % 4
    );

    const base64 = (base64URL + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const binary = atob(base64);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}


// -----------------------------------------------------
// RANDOM CHALLENGE
// -----------------------------------------------------

function createChallenge() {

    const challenge = new Uint8Array(32);

    window.crypto.getRandomValues(challenge);

    return challenge;
}


// =====================================================
// REGISTER BIOMETRIC
// =====================================================

async function registerBiometric() {

    const employeeName =
        document.getElementById("employeeName").value.trim();

    const employeeID =
        document.getElementById("employeeID").value.trim();

    const biometricStatus =
        document.getElementById("biometricStatus");

    if (!employeeName || !employeeID) {

        alert("Please enter your employee name and ID first.");

        return;
    }

    if (!checkWebAuthn()) {
        return;
    }

    try {

        if (biometricStatus) {
            biometricStatus.textContent =
                "Starting biometric registration...";
        }

        const challenge = createChallenge();

        const publicKey = {

            challenge: challenge,

            rp: {
                name: "Employee Clocking System"
            },

            user: {

                id: new TextEncoder().encode(employeeID),

                name: employeeID,

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

                authenticatorAttachment: "platform",

                userVerification: "required"
            },

            timeout: 60000,

            attestation: "none"
        };

        const credential =
            await navigator.credentials.create({
                publicKey: publicKey
            });

        if (!credential) {
            throw new Error("Biometric registration failed.");
        }

        const credentialID =
            bufferToBase64URL(credential.rawId);

        localStorage.setItem(
            "biometric_" + employeeID,
            credentialID
        );

        localStorage.setItem(
            "employee_" + employeeID,
            JSON.stringify({
                name: employeeName,
                id: employeeID
            })
        );

        if (biometricStatus) {
            biometricStatus.textContent =
                "✓ Biometric registration successful.";
        }

        alert(
            "Biometric registration successful!\n\n" +
            "You can now use your device biometric/passkey to clock in or out."
        );

    } catch (error) {

        console.error(error);

        if (biometricStatus) {
            biometricStatus.textContent =
                "Biometric registration failed.";
        }

        alert(
            "Biometric registration failed.\n\n" +
            error.message
        );
    }
}


// =====================================================
// AUTHENTICATE USING BIOMETRIC
// =====================================================

async function authenticateBiometric(employeeID) {

    const storedCredential =
        localStorage.getItem("biometric_" + employeeID);

    if (!storedCredential) {

        alert(
            "No biometric registration was found for this employee."
        );

        return false;
    }

    try {

        const challenge = createChallenge();

        const publicKey = {

            challenge: challenge,

            allowCredentials: [

                {
                    type: "public-key",

                    id: base64URLToBuffer(
                        storedCredential
                    )
                }

            ],

            userVerification: "required",

            timeout: 60000
        };

        const assertion =
            await navigator.credentials.get({
                publicKey: publicKey
            });

        if (!assertion) {
            return false;
        }

        return true;

    } catch (error) {

        console.error(error);

        alert(
            "Biometric authentication failed.\n\n" +
            error.message
        );

        return false;
    }
}


// =====================================================
// GET GPS LOCATION
// =====================================================

function getLocation() {

    return new Promise(function (resolve, reject) {

        if (!navigator.geolocation) {

            reject(
                new Error(
                    "GPS location is not supported by this device."
                )
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(

            function (position) {

                currentLocation = {

                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude,

                    accuracy:
                        position.coords.accuracy
                };

                resolve(currentLocation);
            },

            function (error) {

                reject(error);
            },

            {
                enableHighAccuracy: true,

                timeout: 15000,

                maximumAge: 0
            }
        );
    });
}


// =====================================================
// OPEN CAMERA
// =====================================================

async function openCamera() {

    const video =
        document.getElementById("camera");

    const cameraSection =
        document.getElementById("cameraSection");

    try {

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: "user"
                },

                audio: false
            });

        if (video) {

            video.srcObject = cameraStream;

            video.play();
        }

        if (cameraSection) {
            cameraSection.style.display = "block";
        }

    } catch (error) {

        console.error(error);

        alert(
            "Unable to access the camera.\n\n" +
            "Please allow camera permission."
        );
    }
}


// =====================================================
// TAKE PHOTO
// =====================================================

function takeClockInPhoto() {

    const video =
        document.getElementById("camera");

    const canvas =
        document.getElementById("photoCanvas");

    const preview =
        document.getElementById("photoPreview");

    if (!video || !canvas) {
        return;
    }

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    const context =
        canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    currentPhoto =
        canvas.toDataURL("image/jpeg", 0.8);

    if (preview) {

        preview.src = currentPhoto;

        preview.style.display = "block";
    }

    alert("Photo captured successfully.");

    stopCamera();
}


// =====================================================
// STOP CAMERA
// =====================================================

function stopCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track => track.stop());

        cameraStream = null;
    }
}


// =====================================================
// CLOCK IN
// =====================================================

async function clockIn() {

    const employeeName =
        document.getElementById("employeeName").value.trim();

    const employeeID =
        document.getElementById("employeeID").value.trim();

    const status =
        document.getElementById("status");

    if (!employeeName || !employeeID) {

        alert(
            "Please enter your employee name and ID."
        );

        return;
    }

    // Authenticate
    const authenticated =
        await authenticateBiometric(employeeID);

    if (!authenticated) {
        return;
    }

    try {

        if (status) {
            status.textContent =
                "Getting your location...";
        }

        const location =
            await getLocation();

        const now = new Date();

        const record = {

            employeeName: employeeName,

            employeeID: employeeID,

            type: "Clock In",

            date: now.toLocaleDateString(),

            time: now.toLocaleTimeString(),

            timestamp: now.toISOString(),

            latitude: location.latitude,

            longitude: location.longitude,

            accuracy: location.accuracy,

            photo: currentPhoto || null
        };

        saveRecord(record);

        if (status) {

            status.textContent =
                "✓ Clocked in successfully.";
        }

        alert(
            "Clock In successful!\n\n" +
            "Employee: " + employeeName +
            "\nTime: " + record.time
        );

        displayRecords();

    } catch (error) {

        console.error(error);

        if (status) {
            status.textContent =
                "Unable to get your location.";
        }

        alert(
            "Clock In failed because your location could not be obtained."
        );
    }
}


// =====================================================
// CLOCK OUT
// =====================================================

async function clockOut() {

    const employeeName =
        document.getElementById("employeeName").value.trim();

    const employeeID =
        document.getElementById("employeeID").value.trim();

    const status =
        document.getElementById("status");

    if (!employeeName || !employeeID) {

        alert(
            "Please enter your employee name and ID."
        );

        return;
    }

    // Authenticate
    const authenticated =
        await authenticateBiometric(employeeID);

    if (!authenticated) {
        return;
    }

    try {

        if (status) {
            status.textContent =
                "Getting your location...";
        }

        const location =
            await getLocation();

        const now = new Date();

        const record = {

            employeeName: employeeName,

            employeeID: employeeID,

            type: "Clock Out",

            date: now.toLocaleDateString(),

            time: now.toLocaleTimeString(),

            timestamp: now.toISOString(),

            latitude: location.latitude,

            longitude: location.longitude,

            accuracy: location.accuracy,

            photo: null
        };

        saveRecord(record);

        if (status) {

            status.textContent =
                "✓ Clocked out successfully.";
        }

        alert(
            "Clock Out successful!\n\n" +
            "Employee: " + employeeName +
            "\nTime: " + record.time
        );

        displayRecords();

    } catch (error) {

        console.error(error);

        if (status) {
            status.textContent =
                "Unable to get your location.";
        }

        alert(
            "Clock Out failed because your location could not be obtained."
        );
    }
}


// =====================================================
// SAVE RECORD
// =====================================================

function saveRecord(record) {

    let records =
        JSON.parse(
            localStorage.getItem("clockingRecords")
        ) || [];

    records.push(record);

    localStorage.setItem(
        "clockingRecords",
        JSON.stringify(records)
    );
}


// =====================================================
// DISPLAY RECORDS
// =====================================================

function displayRecords() {

    const recordsContainer =
        document.getElementById("records");

    if (!recordsContainer) {
        return;
    }

    const records =
        JSON.parse(
            localStorage.getItem("clockingRecords")
        ) || [];

    recordsContainer.innerHTML = "";

    if (records.length === 0) {

        recordsContainer.innerHTML =
            "<p>No clocking records yet.</p>";

        return;
    }

    records
        .slice()
        .reverse()
        .forEach(function (record) {

            const item =
                document.createElement("div");

            item.className = "record";

            const googleMapsURL =
                "https://www.google.com/maps?q=" +
                record.latitude +
                "," +
                record.longitude;

            const openStreetMapURL =
                "https://www.openstreetmap.org/?mlat=" +
                record.latitude +
                "&mlon=" +
                record.longitude +
                "#map=18/" +
                record.latitude +
                "/" +
                record.longitude;

            item.innerHTML = `

                <h3>${escapeHTML(record.type)}</h3>

                <p>
                    <strong>Employee:</strong>
                    ${escapeHTML(record.employeeName)}
                </p>

                <p>
                    <strong>ID:</strong>
                    ${escapeHTML(record.employeeID)}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${escapeHTML(record.date)}
                </p>

                <p>
                    <strong>Time:</strong>
                    ${escapeHTML(record.time)}
                </p>

                <p>
                    <strong>GPS:</strong>
                    ${record.latitude.toFixed(6)},
                    ${record.longitude.toFixed(6)}
                </p>

                <p>
                    <strong>Accuracy:</strong>
                    ${Math.round(record.accuracy)} metres
                </p>

                <p>
                    <a
                        href="${googleMapsURL}"
                        target="_blank"
                        rel="noopener"
                    >
                        📍 Open in Google Maps
                    </a>
                </p>

                <p>
                    <a
                        href="${openStreetMapURL}"
                        target="_blank"
                        rel="noopener"
                    >
                        🗺️ Open in OpenStreetMap
                    </a>
                </p>

                ${
                    record.photo
                    ?
                    `<img
                        src="${record.photo}"
                        class="record-photo"
                        alt="Clocking photo"
                    >`
                    :
                    ""
                }

                <hr>
            `;

            recordsContainer.appendChild(item);
        });
}


// =====================================================
// CLEAR RECORDS
// =====================================================

function clearRecords() {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete all clocking records?"
        );

    if (!confirmDelete) {
        return;
    }

    localStorage.removeItem(
        "clockingRecords"
    );

    displayRecords();

    alert("All clocking records have been deleted.");
}


// =====================================================
// PANIC BUTTON
// =====================================================

function panicButton() {

    const employeeName =
        document.getElementById("employeeName").value.trim();

    const message =
        "EMERGENCY ALERT!\n" +
        "Employee: " +
        (employeeName || "Unknown employee") +
        "\nPlease provide assistance.";

    const confirmed =
        confirm(
            "Are you sure you want to send an emergency alert?"
        );

    if (!confirmed) {
        return;
    }

    const smsURL =
        "sms:" +
        emergencyNumber +
        "?body=" +
        encodeURIComponent(message);

    window.location.href = smsURL;
}


// =====================================================
// SECURITY - ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
```

### Your three files should now be

```text
employee-clocking-system/
│
├── index.html
├── style.css
└── script.js
```

And at the bottom of your `index.html`, just before `</body>`, make sure you have:

```html
<script src="script.js"></script>
</body>
</html>
```

And inside `<head>`:

```html
<link rel="stylesheet" href="style.css">
```

**Important:** change this line in `script.js` to the actual number you want the panic SMS sent to:

```javascript
const emergencyNumber = "0123456789";
```

Also, because you're using biometrics and GPS, the deployed site needs to run in a secure context such as **HTTPS** for those browser features to work reliably.
