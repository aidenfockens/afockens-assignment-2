from flask import Flask, jsonify, render_template, request
import random
from sklearn.cluster import KMeans
import numpy as np
import copy
app = Flask(__name__)

first_points = []
points = []
kmeans = None
current_step = 0


#k means stuff 
centroids = []
assignments = []


def has_converged(centroids, new_centroids):
    return np.all([np.array_equal(c, nc) for c, nc in zip(centroids, new_centroids)])



def euclidean_distance(point1, point2):
    return np.sqrt(np.sum((np.array(point1) - np.array(point2)) ** 2))


def initialize_centroids(X, k, method,manual_centroids):
    if method == "random":
        return X[random.sample(range(len(X)), k)]
    elif method == "KMeans++":
        # Implement K-Means++ initialization
        centroids = [X[random.randint(0, len(X)-1)]]
        for _ in range(1, k):
            distances = np.min([np.linalg.norm(X - np.array(c), axis=1) for c in centroids], axis=0)
            probabilities = distances / np.sum(distances)
            next_centroid = X[np.random.choice(len(X), p=probabilities)]
            centroids.append(next_centroid)
        return centroids
    
    elif method == "FarthestFirst":
        # Farthest First initialization
        centroids = [X[random.randint(0, len(X) - 1)]]  # Randomly pick the first centroid
        for _ in range(1, k):
            # Calculate the distance from each point to the nearest selected centroid
            distances = np.max([np.linalg.norm(X - np.array(c), axis=1) for c in centroids], axis=0)
            
            # Select the point that is farthest from any of the chosen centroids
            farthest_point_idx = np.argmax(distances)
            centroids.append(X[farthest_point_idx])
        return centroids
    elif method == "Manual":
        if manual_centroids is None:
            raise ValueError("Manual centroids must be provided.")
        return np.array([[centroid['x'], centroid['y']] for centroid in manual_centroids])
    else:
        raise ValueError(f"Unknown initialization method: {method}")
    

def assign_clusters(X, centroids):
    assignments = []
    for point in X:
        distances = [euclidean_distance(point, centroid) for centroid in centroids]
        assignments.append(np.argmin(distances))
    return assignments



def update_centroids(X, assignments, k):
    new_centroids = []
    for i in range(k):
        cluster_points = [X[j] for j in range(len(X)) if assignments[j] == i]
        if cluster_points:  # Avoid division by zero
            new_centroids.append(np.mean(cluster_points, axis=0))
        else:
            # Handle empty clusters by keeping the same centroid
            new_centroids.append(centroids[i])
    return new_centroids




@app.route('/')
def index():
    return render_template('index.html')

# API route to generate random dataset
@app.route('/api/generate-data', methods=['GET'])
def generate_data():
    global points, kmeans,current_step,first_points
    kmeans = None
    current_step = 0
    points = [{"x": random.uniform(0, 100), "y": random.uniform(0, 100)} for _ in range(100)]
    first_points = copy.deepcopy(points)
    return jsonify(points)


@app.route('/api/reset-algorithm', methods =['POST'])
def reset_algorithm():
    global points, kmeans,current_step,first_points
    kmeans = None
    current_step = 0
    points = copy.deepcopy(first_points)

    return jsonify({"points": first_points})


@app.route('/api/step-kmeans', methods=['POST'])
def step_kmeans():
    global points, kmeans, current_step, centroids, assignments

    # Ensure that points are not empty
    if len(points) == 0:
        return jsonify({"error": "Dataset is empty"}), 400

    # Convert points to a NumPy array
    X = np.array([[point['x'], point['y']] for point in points])

    # Ensure that X is a 2D array
    if X.ndim != 2 or X.shape[1] != 2:
        return jsonify({"error": "Dataset is not a valid 2D array"}), 400

    # Get the number of clusters and initialization method from the POST request
    data = request.json
    num_clusters = data['num_clusters']
    init_method = data['init_method']
    should_converge = data["should_converge"]
    manual_centroids = data.get('centroids')

    if should_converge:
        # Converge the algorithm fully
        centroids = initialize_centroids(X, num_clusters, init_method,manual_centroids)
        max_iterations = 100  # A limit to prevent infinite loops
        for iteration in range(max_iterations):
            # Assign clusters
            assignments = assign_clusters(X, centroids)

            # Update centroids
            new_centroids = update_centroids(X, assignments, num_clusters)

            # Check for convergence
            if has_converged(centroids, new_centroids):
                print(f"Converged after {iteration + 1} iterations.")
                break

            # Update centroids for next iteration
            centroids = new_centroids

    else:
        # Step through the algorithm one step at a time
        if current_step == 0:

            # On the first step, initialize centroids
            centroids = initialize_centroids(X, num_clusters, init_method,manual_centroids)
            assignments = assign_clusters(X, centroids)
        else:
            # Step through the algorithm: update centroids and assign clusters
            old_centroids = copy.deepcopy(centroids)  # Copy old centroids
            new_centroids = update_centroids(X, assignments, num_clusters)
            assignments = assign_clusters(X, new_centroids)

            # Check if the centroids have converged
            if has_converged(old_centroids, new_centroids):
                print(f"Converged after {current_step} steps.")
                # If converged, don't increment the step count
                return jsonify({
                    "points": [{"x": point[0], "y": point[1], "cluster": int(assignments[i])} for i, point in enumerate(X)],
                    "current_step": current_step,
                    "converged": True
                })
            
            # Update centroids for next iteration
            centroids = new_centroids

        # Increment the step count
        current_step += 1

    # Update points with cluster assignments
    updated_points = [{"x": point[0], "y": point[1], "cluster": int(assignments[i])} for i, point in enumerate(X)]

    return jsonify({
        "points": updated_points,
        "current_step": current_step,
        "converged": False  # Not converged if reaching this point
    })

if __name__ == '__main__':
    app.run(debug=True)