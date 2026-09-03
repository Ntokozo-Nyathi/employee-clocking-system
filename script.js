// Emergency / supervisor phone number
const emergencyNumber = "0687709378"; // CHANGE THIS NUMBER

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
