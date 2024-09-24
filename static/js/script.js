var should_converge = false






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

    Plotly.newPlot('graphDiv', [trace], layout);
}

async function Converge(){
    should_converge = true
    stepKMeans()
    should_converge = false
}
// Function to call Flask API and step through K-Means
async function stepKMeans() {
    console.log('hey')
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
            should_converge: should_converge
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

    const layout = {
        title: 'K-Means Step ' + data.current_step,
        xaxis: { title: 'X-axis' },
        yaxis: { title: 'Y-axis' }
    };
    
    Plotly.newPlot('graphDiv', [trace], layout);
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

    Plotly.newPlot('graphDiv', [trace], layout);
}