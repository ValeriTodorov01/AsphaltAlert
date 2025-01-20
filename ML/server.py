from flask import Flask, request, jsonify
# import os
import io
from PIL import Image
from ultralytics import YOLO
# from model import load_model, predict_image
# from utils import extract_geolocation

app = Flask(__name__)
model = YOLO("runs/detect/dataset3-train-m/weights/best.pt")

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


    try:
        img = Image.open(io.BytesIO(file.read()))

        results = model.predict(img, conf=0.1)
        for result in results:
            result.show()

        if results:
            print(f"Potholes detected: {len(results)}")
            # print(f"Details: {results}")
        else:
            print("No potholes detected")

        return jsonify({
            "potholes_detected": len(results)
        })

    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({"error": "Failed to process the image"}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)