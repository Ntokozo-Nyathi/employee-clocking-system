async function clockIn() {

    const employeeName =
        document.getElementById("employeeName").value.trim();

    const employeeID =
        document.getElementById("employeeID").value.trim();

    const status =
        document.getElementById("status");

    if (!employeeName || !employeeID) {
        alert("Please enter your employee name and ID.");
        return;
    }

    // 1. Check biometric
    if (!await authenticateBiometric(employeeID)) {
        return;
    }

    try {

        if (status) {
            status.textContent = "Opening camera...";
        }

        // 2. Automatically take photo
        const photo = await automaticPhoto();

        if (status) {
            status.textContent = "Getting location...";
        }

        // 3. Get GPS location
        const location = await getLocation();

        // 4. Create clock-in record
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

            photo: photo
        };

        // 5. Save everything
        saveRecord(record);

        // 6. Display success
        if (status) {
            status.textContent =
                "✓ Clocked in successfully with photo.";
        }

        alert(
            "CLOCK IN SUCCESSFUL!\n\n" +
            "Employee: " + employeeName + "\n" +
            "Time: " + record.time + "\n" +
            "Location: Captured ✓\n" +
            "Photo: Captured ✓"
        );

        // 7. Show records
        displayRecords();

    } catch (error) {

        console.error(error);

        if (status) {
            status.textContent =
                "Clock in failed.";
        }

        alert(
            "Clock in failed.\n\n" +
            error.message
        );
    }
}