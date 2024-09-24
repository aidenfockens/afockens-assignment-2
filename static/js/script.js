var should_converge = false
let selectedCentroids = [];  // Array to store manually selected centroids
let selectedCentroidTraces = [];  // To track traces added for "X" markers

// Function to handle point click events in Plotly and show an "X" at the selected point
function setupPointSelection() {
    let plotElement = document.getElementById('graphDiv');
    let numClusters = document.getElementById('textInput').value;

    console.log("numClusters:", numClusters);

    plotElement.on('plotly_click', function(data) {
        let x = data.points[0].x;
        let y = data.points[0].y;

        // Store the selected point as a potential centroid
        if (selectedCentroids.length >= numClusters) {
            alert("You've selected enough points for manual initialization.");
        } else {
            selectedCentroids.push({ x: x, y: y });
            console.log('Selected point:', x, y);

            // Add an "X" at the selected point
            let traceIndex = selectedCentroids.length - 1;  // Keep track of the trace index
            selectedCentroidTraces.push(traceIndex);  // Add to trace index array

            Plotly.addTraces('graphDiv', {
                x: [x],
                y: [y],
                mode: 'markers',
                marker: {
                    size: 15,
                    symbol: 'x',
                    color: 'red',  // Color for the X markers
                },
                name: 'Selected Centroid'
            });
        }
    });
}


function clearSelectedCentroids() {
    // Clear the selected centroids array
    selectedCentroids = [];

    // Remove the "X" markers by deleting their traces
    if (selectedCentroidTraces.length > 0) {
        // Delete the traces in reverse order (from the last trace added to the first)
        for (let i = selectedCentroidTraces.length - 1; i >= 0; i--) {
            Plotly.deleteTraces('graphDiv', selectedCentroidTraces[i]);
        }

        // Clear the selectedCentroidTraces array after deletion
        selectedCentroidTraces = [];
    }

    console.log('Selected centroids and X markers cleared.');
}

// Call this function after rendering the Plotly graph to enable manual point selection










// Disable mutually exclusive buttons
function disableConverge() {
    document.getElementById('runToConvergeBtn').disabled = true;
}

function disableStep(){
    document.getElementById('stepKMeansBtn').disabled = true
}

// Enable both buttons
function enableButtons() {
    document.getElementById('stepKMeansBtn').disabled = false;
    document.getElementById('runToConvergeBtn').disabled = false;
}




async function generateData() {
    const response = await fetch('http://127.0.0.1:5000/api/generate-data');
    const data = await response.json();
    
    // Prepare data for Plotly.js
    const x_values = data.map(point => point.x);
    const y_values = data.map(point => point.y);

    // Plot the data using Plotly.js
    const trace = {
        x: x_values,
        y: y_values,
        mode: 'markers',
        marker: { size: 8 }
    };

    const layout = {
        title: 'Random Dataset',
        xaxis: { title: 'X-axis' },
        yaxis: { title: 'Y-axis' }
    };
    enableButtons()
    Plotly.newPlot('graphDiv', [trace], layout);
    setupPointSelection();
    clearSelectedCentroids();
}

async function Converge(){
    should_converge = true
    stepKMeans()
    disableStep()
    disableConverge()
}
// Function to call Flask API and step through K-Means
async function stepKMeans() {

    // Get the number of clusters and initialization method from user input
    const numClusters = document.getElementById('textInput').value;
    const initMethod = document.getElementById('dropdownMenu').value;

    // Send data to Flask via POST
    const response = await fetch('http://127.0.0.1:5000/api/step-kmeans', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            num_clusters: parseInt(numClusters), 
            init_method: initMethod,
            should_converge: should_converge,
            centroids:selectedCentroids
        })
    });

    const data = await response.json();

    // Prepare data for Plotly.js (x, y coordinates and clusters)
    const x_values = data.points.map(point => point.x);
    const y_values = data.points.map(point => point.y);
    const cluster_colors = data.points.map(point => point.cluster);

    // Plot the data, color points by cluster
    const trace = {
        x: x_values,
        y: y_values,
        mode: 'markers',
        marker: {
            size: 8,
            color: cluster_colors  // Color points based on cluster assignments
        }
    };
    let layout;  // Declare the layout variable

    if (should_converge )  {
        layout = {
            title: 'Converged K-Means',
            xaxis: { title: 'X-axis' },
            yaxis: { title: 'Y-axis' }
        };
    } else {
        layout = {
            title: 'K-Means Step ' + data.current_step,
            xaxis: { title: 'X-axis' },
            yaxis: { title: 'Y-axis' }
        };
    }
    should_converge = false
    disableConverge()
    Plotly.newPlot('graphDiv', [trace], layout);
    setupPointSelection();
}


async function resetAlgorithm() {
    const response = await fetch('http://127.0.0.1:5000/api/reset-algorithm', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    const data = await response.json();

    // Prepare data for Plotly.js (reset points)
    const x_values = data.points.map(point => point.x);
    const y_values = data.points.map(point => point.y);

    // Plot the reset data using Plotly.js
    const trace = {
        x: x_values,
        y: y_values,
        mode: 'markers',
        marker: { size: 8 }
    };

    const layout = {
        title: 'Random Dataset',
        xaxis: { title: 'X-axis' },
        yaxis: { title: 'Y-axis' }
    };
    enableButtons()
    Plotly.newPlot('graphDiv', [trace], layout);
    setupPointSelection();
    clearSelectedCentroids();
}