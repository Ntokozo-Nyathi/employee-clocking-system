// Emergency / supervisor phone number
const emergencyNumber = "0687709378"; // CHANGE THIS NUMBER
<div id="cameraSection" style="display:none; margin-top:15px;">

    <h3 style="color:#1f4e79; margin-bottom:10px;">
        📸 Clock-in Photo
    </h3>

    <video
        id="camera"
        autoplay
        playsinline
        style="
            width:100%;
            border-radius:12px;
            background:#000;
            display:block;
        ">
    </video>

    <button
        type="button"
        onclick="takeClockInPhoto()"
        style="background:#007bff;">

        📸 Take Clock-in Photo

    </button>

    <canvas
        id="photoCanvas"
        style="display:none;">
    </canvas>

    <img
        id="photoPreview"
        style="
            display:none;
            width:100%;
            margin-top:10px;
            border-radius:12px;
        ">

</div>
async function clockIn() {

    const employee =
        document
        .getElementById("employee")
        .value
        .trim();


    if (!employee) {

        showStatus(
            "Enter an employee name or ID.",
            "error"
        );

        return;

    }


    /* CHECK IF ALREADY CLOCKED IN */

    const records =
        getRecords();


    const alreadyClockedIn =
        records.some(
            record =>
                record.employee.toLowerCase() ===
                employee.toLowerCase()
                &&
                record.clockOut === null
        );


    if (alreadyClockedIn) {

        showStatus(
            employee +
            " is already clocked in.",
            "error"
        );

        return;

    }


    /* BIOMETRIC */

    const authenticated =
        await authenticateBiometric(employee);


    if (!authenticated) {

        return;

    }


    /* CAMERA */

    clockInPhoto = null;

    const cameraOpened =
        await openClockInCamera();


    if (!cameraOpened) {

        return;

    }


    /*
       The employee must press
       "Take Clock-in Photo".
    */

    showStatus(
        "Take your clock-in photo.",
        "info-status"
    );


    /*
       Wait until photo is taken.
       The photo function will continue
       the clock-in process.
    */

}
document.getElementById("panicBtn").addEventListener("click", function () {

    const employeeName = document.getElementById("employeeName").value.trim();
    const employeeId = document.getElementById("employeeId").value.trim();

    if (!employeeName || !employeeId) {
        alert("Please enter the employee name and ID first.");
        return;
    }

    const confirmPanic = confirm(
        "🚨 PANIC / SOS\n\n" +
        "This will record your emergency location.\n\n" +
        "Do you want to continue?"
    );
    

    if (!confirmPanic) {
        return;
    }

    if (!navigator.geolocation) {
        alert("GPS location is not supported on this device.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            const now = new Date();

            const panicRecord = {
                type: "PANIC / SOS",
                employeeName: employeeName,
                employeeId: employeeId,
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString(),
                latitude: latitude,
                longitude: longitude,
                accuracy: Math.round(accuracy),
                googleMaps:
                    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
                openStreetMap:
                    `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`
            };

            // Get existing records
            let panicRecords =
                JSON.parse(localStorage.getItem("panicRecords")) || [];

            panicRecords.push(panicRecord);

            // Save panic record
            localStorage.setItem(
                "panicRecords",
                JSON.stringify(panicRecords)
            );

            alert(
                "🚨 PANIC ALERT RECORDED\n\n" +
                "Employee: " + employeeName + "\n" +
                "Time: " + now.toLocaleTimeString() + "\n" +
                "GPS: " + latitude.toFixed(6) + ", " +
                longitude.toFixed(6) + "\n\n" +
                "The emergency contact can be called next."
            );

            // Open phone dialer
            const callEmergency = confirm(
                "Would you like to call the emergency/supervisor number?"
            );

            if (callEmergency) {
                window.location.href = "tel:" + emergencyNumber;
            }

        },

        function (error) {

            let message = "Unable to get your GPS location.";

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message =
                        "Location permission was denied. Please allow location access and try again.";
                    break;

                case error.POSITION_UNAVAILABLE:
                    message =
                        "Your location is currently unavailable.";
                    break;

                case error.TIMEOUT:
                    message =
                        "Getting your location timed out. Please try again.";
                    break;
            }

            alert("🚨 PANIC / SOS\n\n" + message);
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
});