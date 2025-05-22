import logging
import base64
import requests
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
import uuid
import json


from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from requests.exceptions import RequestException

import firebase_admin
from firebase_admin import credentials, storage
from werkzeug.utils import secure_filename
load_dotenv()

FIREBASE_CERTIFICATE_PATH = os.getenv("FIREBASE_CERTIFICATE_PATH")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET")
cred = credentials.Certificate(FIREBASE_CERTIFICATE_PATH)
firebase_admin.initialize_app(cred, {"storageBucket": FIREBASE_STORAGE_BUCKET})
bucket = storage.bucket()

DB_URI = os.getenv("DB_URI")
LITSERVE_URL = os.getenv("LITSERVE_URL")
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")
TOMTOM_URL_TEMPLATE = os.getenv("TOMTOM_URL_TEMPLATE")

REQUEST_TIMEOUT = 5 


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config['SQLALCHEMY_DATABASE_URI'] = DB_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    logging.basicConfig(level=logging.INFO)

    @app.route('/detect_danger', methods=['POST'])
    def detect_danger():
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
            app.logger.info(f"Danger detected at {latitude}, {longitude} with speed limit {max_speed}")
            if(max_speed is not None):
                if(max_speed == 'Unknown'):
                    insert_danger(latitude, longitude, "Unknown")
                else:
                    if(max_speed == '20.00KPH' or max_speed == '30.00KPH' or max_speed == '50.00KPH'):
                        insert_danger(latitude, longitude, "Low")
                    else:
                        insert_danger(latitude, longitude, "High")

        return jsonify({"dangers_detected": detections}), 200
    
    def get_speed_limit(lat, lon):
        try:
            url = TOMTOM_URL_TEMPLATE.format(latitude=lat, longitude=lon, key=TOMTOM_API_KEY)
            response = requests.get(url, timeout=20)
            response.raise_for_status()
            data = response.json()
            speed_limit_info = data.get("addresses", [{}])[0].get("address", {}).get("speedLimit", None)
            logging.info(f"Speed limit info: {data}")
            return speed_limit_info or "Unknown"
        except RequestException as e:
            app.logger.error(f"Error fetching speed limit from TomTom API: {e}")
            return "Error"

    @app.route('/dangers', methods=['GET'])
    def get_dangers():
        east = float(request.args["east"])
        west = float(request.args["west"])
        north = float(request.args["north"])
        south = float(request.args["south"])
        dangers = Danger.query.filter(
            Danger.latitude.between(south, north),
            Danger.longitude.between(west, east)
        ).all()
        return jsonify([{"latitude": p.latitude, "longitude": p.longitude, "severity": p.severity} for p in dangers])


    @app.route('/upload_image', methods=['POST'])
    def upload_image():
        if 'image' not in request.files:
            app.logger.warning("No image file provided.")
            return jsonify({"error": "No image file provided"}), 400

        if 'boxes' not in request.form:
            app.logger.warning("No boxes provided.")
            return jsonify({"error": "No boxes provided"}), 400


        image_file = request.files['image']
        yolo_boxes_data = request.form['boxes']

        if not image_file or image_file.filename == '':
            app.logger.warning("Empty file name.")
            return jsonify({"error": "Empty file name"}), 400

        if not yolo_boxes_data:
            app.logger.warning("No boxes provided.")
            return jsonify({"error": "No boxes provided"}), 400
        
        unique_id = uuid.uuid4().hex
        unique_filename = f"{unique_id}" + ".jpeg"
        destination_path = f"datasetImages/{unique_filename}"

        blob = bucket.blob(destination_path)
        blob.upload_from_file(image_file, content_type=image_file.content_type)
        app.logger.info(f"File {unique_filename} {image_file.content_type} uploaded to {bucket.name} in folder 'dataset_images'.")
        try:
            yolo_boxes = json.loads(yolo_boxes_data) 
        except json.JSONDecodeError as e:
            app.logger.error(f"Failed to parse YOLO boxes JSON: {e}")
            return jsonify({"error": "Invalid JSON format for YOLO boxes"}), 400

        print(yolo_boxes[0])
        insert_yolo_boxes(yolo_boxes[0]["class"], yolo_boxes[0]["x_center"], yolo_boxes[0]["y_center"], yolo_boxes[0]["w"], yolo_boxes[0]["h"], unique_filename)

        return jsonify({"message": f"File {unique_filename} uploaded successfully.", "file_url": blob.public_url}), 200

    return app


db = SQLAlchemy()

class Danger(db.Model):
    __tablename__ = 'dangers'

    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    severity = db.Column(db.String(16), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

class YoloBoxes(db.Model):
    __tablename__ = 'yoloboxes'

    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, nullable=False)
    x_center = db.Column(db.Float, nullable=False)
    y_center = db.Column(db.Float, nullable=False)
    width = db.Column(db.Integer, nullable=False) 
    height = db.Column(db.Integer, nullable=False)
    file_name = db.Column(db.String(255), nullable=False)


def insert_yolo_boxes(class_id, x_center, y_center, width, height, file_name):
    try:
        new_yolo_boxes = YoloBoxes(class_id=class_id, x_center=x_center, y_center=y_center, width=width, height=height, file_name=file_name)
        db.session.add(new_yolo_boxes)
        db.session.commit()
        logging.info(f"Inserted yolo boxes: class_id={class_id}, x_center={x_center}, y_center={y_center}, width={width}, height={height}, file_name={file_name}")
    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to insert yolo boxes: {e}")

DELTA_DEG = 0.0000900

def insert_danger(lat, lon, severity):
    try:
        min_lat, max_lat = lat - DELTA_DEG, lat + DELTA_DEG
        min_lon, max_lon = lon - DELTA_DEG, lon + DELTA_DEG
        nearby = (
            Danger.query
            .filter(Danger.latitude  >= min_lat)
            .filter(Danger.latitude  <= max_lat)
            .filter(Danger.longitude >= min_lon)
            .filter(Danger.longitude <= max_lon)
            .first()
        )
        if nearby:
            logging.info(
            f"Skipping insert: existing danger within ~2 m "
            f"at ({nearby.latitude}, {nearby.longitude})"
            )
            return
        
        new_danger = Danger(latitude=lat, longitude=lon, severity=severity)
        db.session.add(new_danger)
        db.session.commit()
        logging.info(f"Inserted danger: lat={lat}, lon={lon}, severity={severity}")
    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to insert danger: {e}")


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', debug=True, port=5000)
