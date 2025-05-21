document.addEventListener('DOMContentLoaded', function() {
    // Add Window functionality
    document.getElementById('add-window').addEventListener('click', function() {
        const windowInputs = document.getElementById('window-inputs');
        const newWindow = document.createElement('div');
        newWindow.className = 'window-entry row mb-2';
        newWindow.innerHTML = `
            <div class="col-md-3">
                <label class="form-label">Window Length:</label>
                <input type="number" class="form-control window-length" step="any" min="0" required>
            </div>
            <div class="col-md-3">
                <label class="form-label">Window Width:</label>
                <input type="number" class="form-control window-width" step="any" min="0" required>
            </div>
            <div class="col-md-3">
                <label class="form-label">Unit:</label>
                <select class="form-select window-unit" required>
                    <option value="ft">Feet</option>
                    <option value="m">Meters</option>
                </select>
            </div>
            <div class="col-md-3 d-flex align-items-end">
                <button type="button" class="btn btn-danger remove-window">Remove</button>
            </div>
        `;
        windowInputs.appendChild(newWindow);
    });

    // Remove Window functionality
    document.getElementById('window-inputs').addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-window')) {
            const windowEntries = document.querySelectorAll('.window-entry');
            if (windowEntries.length > 1) {
                e.target.closest('.window-entry').remove();
            }
        }
    });

// Form submission
document.getElementById('heat-load-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Get form values
    const unit = document.getElementById('unit').value;
    const length = parseFloat(document.getElementById('length').value);
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const outdoorTemp = parseFloat(document.getElementById('outdoor-temp').value);
    const tempUnit = document.getElementById('temp-unit').value;
    const occupants = parseInt(document.getElementById('occupants').value);
    const computerQuantity = parseInt(document.getElementById('computer-quantity').value);
    const lightingWattage = parseFloat(document.getElementById('lighting-wattage').value);
    const lightingQuantity = parseInt(document.getElementById('lighting-quantity').value);
    const wallMaterial = document.getElementById('wall-material').value;
    const wallThickness = parseFloat(document.getElementById('wall-thickness').value);
    const ceilingMaterial = document.getElementById('ceiling-material').value;
    const ceilingThickness = parseFloat(document.getElementById('ceiling-thickness').value);
    const floorMaterial = document.getElementById('floor-material').value;
    const floorThickness = parseFloat(document.getElementById('floor-thickness').value);
    const airExchange = document.getElementById('air-exchange').value;

    // Calculate window area
    const windowEntries = document.querySelectorAll('.window-entry');
    let totalWindowArea = 0;
    const windowsData = [];
    windowEntries.forEach(entry => {
        const winLength = parseFloat(entry.querySelector('.window-length').value);
        const winWidth = parseFloat(entry.querySelector('.window-width').value);
        const winUnit = entry.querySelector('.window-unit').value;
        let area = winLength * winWidth;
        if (winUnit === 'm') {
            area *= 10.7639; // Convert sq m to sq ft
        }
        totalWindowArea += area;
        windowsData.push({ length: winLength, width: winWidth, unit: winUnit, area: area.toFixed(2) });
    });

    // Calculate areas using Room Dimensions
    let wallArea = 2 * (length * height) + 2 * (width * height); // Total wall area (4 walls)
    let ceilingArea = length * width;
    let floorArea = length * width;
    let volume = length * width * height;

    // Convert units if necessary
    if (unit === 'm') {
        volume *= 35.3147; // Convert cubic meters to cubic feet
        wallArea *= 10.7639; // Convert sq m to sq ft
        ceilingArea *= 10.7639;
        floorArea *= 10.7639;
    }

    // Calculate Net Wall Area
    const netWallArea = wallArea - totalWindowArea;

    // Convert temperature to Fahrenheit if necessary and calculate temperature difference
    let tempInF = outdoorTemp;
    if (tempUnit === 'C') {
        tempInF = (outdoorTemp * 9/5) + 32;
    }
    const desiredIndoorTempF = 75; // Desired indoor temperature (typical value)
    const tempDifference = tempInF - desiredIndoorTempF;

    // Heat load calculations
    const volumeLoad = volume * tempDifference * 0.08; // 0.08 BTU/h per ft³ per °F
    const peopleLoad = occupants * 400; // 400 BTU/h per person
    const windowLoad = totalWindowArea * tempDifference * 6; // 6 BTU/h per sq ft per °F
    const lightingLoad = lightingWattage * lightingQuantity * 3.412; // 3.412 BTU/h per watt
    const equipmentLoad = (computerQuantity * 300) + lightingLoad; // 300 BTU/h per computer

    // Structural heat load based on U-values
    const uValues = {
        brick: 0.8,    // U-value for brick (4 inches)
        concrete: 1.2, // U-value for concrete (4 inches)
        cement: 1.0    // U-value for cement (4 inches)
    };
    const wallLoad = netWallArea * uValues[wallMaterial] * tempDifference;
    const ceilingLoad = ceilingArea * uValues[ceilingMaterial] * tempDifference;
    const floorLoad = floorArea * uValues[floorMaterial] * tempDifference;

    // Air exchange load
    const airExchangeFactors = { good: 0.5, normal: 1, poor: 1.5 }; // ACH values
    const airExchangeLoad = volume * airExchangeFactors[airExchange] * tempDifference * 0.018; // 0.018 BTU/h per ft³ per °F

    // Total heat load
    const totalBTU = volumeLoad + peopleLoad + windowLoad + equipmentLoad + wallLoad + ceilingLoad + floorLoad + airExchangeLoad;
    const totalKW = totalBTU * 0.000293071; // Convert BTU/h to kW

    // Display result
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h5>Heat Load Results</h5>
        <p>Total Heat Load: ${totalBTU.toFixed(2)} BTU/h</p>
        <p>Equivalent in kW: ${totalKW.toFixed(2)} kW</p>
    `;

    // Store data in localStorage for the report
    const reportData = {
        volume: volume.toFixed(2),
        volumeLoad: volumeLoad.toFixed(2),
        occupants: occupants,
        peopleLoad: peopleLoad.toFixed(2),
        windows: windowsData,
        windowArea: totalWindowArea.toFixed(2),
        windowLoad: windowLoad.toFixed(2),
        computerQuantity,
        lightingWattage,
        lightingQuantity,
        lightingLoad: lightingLoad.toFixed(2),
        equipmentLoad: equipmentLoad.toFixed(2),
        wallArea: wallArea.toFixed(2),
        netWallArea: netWallArea.toFixed(2),
        wallMaterial,
        wallThickness,
        wallLoad: wallLoad.toFixed(2),
        ceilingArea: ceilingArea.toFixed(2),
        ceilingMaterial,
        ceilingThickness,
        ceilingLoad: ceilingLoad.toFixed(2),
        floorArea: floorArea.toFixed(2),
        floorMaterial,
        floorThickness,
        floorLoad: floorLoad.toFixed(2),
        airExchange,
        airExchangeLoad: airExchangeLoad.toFixed(2),
        outdoorTemp,
        tempUnit,
        tempDifference: tempDifference.toFixed(2),
        totalBTU: totalBTU.toFixed(2),
        totalKW: totalKW.toFixed(2),
        unit
    };
    localStorage.setItem('heatLoadReport', JSON.stringify(reportData));

    // Show the View Detailed Report button
    document.getElementById('view-report').style.display = 'block';
});

    // View Report button
    document.getElementById('view-report').addEventListener('click', function() {
        window.location.href = 'report.html';
    });
});