import logging
import base64
import requests
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from requests.exceptions import RequestException

load_dotenv()

DB_URI = 'postgresql://user:password@localhost:5432/potholedb'
LITSERVE_URL = "http://localhost:8000/predict"
TOMTOM_API_KEY=os.getenv("TOMTOM_API_KEY")
TOMTOM_URL_TEMPLATE = "https://api.tomtom.com/search/2/reverseGeocode/{latitude},{longitude}.json?key={key}&radius=100&returnSpeedLimit=true"

REQUEST_TIMEOUT = 5 


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config['SQLALCHEMY_DATABASE_URI'] = DB_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    logging.basicConfig(level=logging.INFO)

    @app.route('/detect_pothole', methods=['POST'])
    def detect_pothole():
        if 'image' not in request.files:
            app.logger.warning("No image file provided.")
            return jsonify({"error": "No image file provided"}), 400

        if 'latitude' not in request.form or 'longitude' not in request.form:
            app.logger.warning("No geolocation data provided.")
            return jsonify({"error": "No geolocation provided"}), 400

        image_file = request.files['image']
        latitude_str = request.form['latitude']
        longitude_str = request.form['longitude']

        if not image_file or image_file.filename == '':
            app.logger.warning("Empty file name.")
            return jsonify({"error": "Empty file name"}), 400

        try:
            latitude = float(latitude_str)
            longitude = float(longitude_str)
        except ValueError:
            app.logger.warning(f"Invalid coordinates: {latitude_str}, {longitude_str}")
            return jsonify({"error": "Invalid latitude or longitude"}), 400

        image_data = base64.b64encode(image_file.read()).decode('utf-8')
        payload = {"image_data": image_data}

        try:
            response = requests.post(LITSERVE_URL, json=payload, timeout=REQUEST_TIMEOUT)
            response.raise_for_status() 
        except RequestException as e:
            app.logger.error(f"Error calling LITSERVE: {e}")
            return jsonify({"error": "Failed to process image"}), 503

        detections = response.json().get("detections", 0)
        app.logger.info(f"Detections from LITSERVE: {detections}")

        if detections > 0:
            max_speed = get_speed_limit(latitude, longitude)
            app.logger.info(f"Pothole detected at {latitude}, {longitude} with speed limit {max_speed}")
            if(max_speed is not None):
                if(max_speed == 'Unknown'):
                    insert_pothole(latitude, longitude, "Unknown")
                else:
                    if(max_speed == '20 km/h' or max_speed == '30 km/h'):
                        insert_pothole(latitude, longitude, "Low")
                    else:
                        insert_pothole(latitude, longitude, "High")

        return jsonify({"potholes_detected": detections}), 200
    
    def get_speed_limit(lat, lon):
        try:
            url = TOMTOM_URL_TEMPLATE.format(latitude=lat, longitude=lon, key=TOMTOM_API_KEY)
            response = requests.get(url, timeout=20)
            response.raise_for_status()
            data = response.json()
            speed_limit_info = data.get("addresses", [{}])[0].get("address", {}).get("speedLimit", None)
            return speed_limit_info or "Unknown"
        except RequestException as e:
            app.logger.error(f"Error fetching speed limit from TomTom API: {e}")
            return "Error"

    @app.route('/potholes', methods=['GET'])
    def get_potholes():
        east = float(request.args["east"])
        west = float(request.args["west"])
        north = float(request.args["north"])
        south = float(request.args["south"])
        potholes = Pothole.query.filter(
            Pothole.latitude.between(south, north),
            Pothole.longitude.between(west, east)
        ).all()
        return jsonify([{"latitude": p.latitude, "longitude": p.longitude, "severity": p.severity} for p in potholes])

    return app


db = SQLAlchemy()

class Pothole(db.Model):
    __tablename__ = 'potholes'

    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    severity = db.Column(db.String(16), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

def insert_pothole(lat, lon, severity):
    try:
        new_pothole = Pothole(latitude=lat, longitude=lon, severity=severity)
        db.session.add(new_pothole)
        db.session.commit()
        logging.info(f"Inserted pothole: lat={lat}, lon={lon}, severity={severity}")
    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to insert pothole: {e}")


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', debug=True, port=5000)
