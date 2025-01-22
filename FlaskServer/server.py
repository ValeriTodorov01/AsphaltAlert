import requests
import base64
from flask import Flask, jsonify, request

app = Flask(__name__)

LITSERVE_URL = "http://localhost:8000/predict"

@app.route('/detect_pothole', methods=['POST'])
def detect_pothole():
    if 'image' not in request.files:
        print("No image file provided")
        return jsonify({"error": "No image file provided"}), 400

    if 'longitude' not in request.form or 'latitude' not in request.form:
        print("No geolocation provided")
        return jsonify({"error": "No geolocation provided"}), 400

    file = request.files['image']
    longitude = request.form['longitude']
    latitude = request.form['latitude']
    print(f"Received image with geolocation: {longitude}, {latitude}")
    if file.filename == '':
        return jsonify({"error": "Empty file name"}), 400


    image_data = base64.b64encode(file.read()).decode('utf-8')
    payload = {"image_data": image_data}
    response = requests.post(LITSERVE_URL, json=payload)
    if response.status_code == 200:
        print("!!!Response: ", response.json()["detections"], "!!!")
        return jsonify({"potholes_detected": response.json()["detections"]}), 200
    else:
        return jsonify({"error": "Failed to process image"}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
