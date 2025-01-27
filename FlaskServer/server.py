import requests
import base64
from psycopg2 import pool
from datetime import datetime
from flask import Flask, jsonify, request

app = Flask(__name__)

LITSERVE_URL = "http://localhost:8000/predict"

DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "potholedb"
DB_USER = "user"
DB_PASSWORD = "password"

db_pool = None

def init_db_pool():
    global db_pool
    try:
        db_pool = pool.SimpleConnectionPool(
            1, 20,
            host="localhost",
            port="5432",
            database="potholedb",
            user="user",
            password="password"
        )
        print("Database connection pool initialized.")
    except Exception as e:
        print(f"Error initializing database connection pool: {e}")

def close_db_pool(exception=None):
    global db_pool
    if db_pool:
        db_pool.closeall()
        print("Database connection pool closed.")

def insert_pothole(latitude, longitude, severity):
    global db_pool
    conn = None
    try:
        conn = db_pool.getconn()
        cursor = conn.cursor()

        query = """
        INSERT INTO pothole (latitude, longitude, severity)
        VALUES (%s, %s, %s);
        """
        timestamp = datetime.now()
        cursor.execute(query, (latitude, longitude, severity))

        conn.commit()
        print(f"Pothole data inserted: {latitude}, {longitude}, {severity}")
    except Exception as e:
        print(f"Error inserting data into the database: {e}")
    finally:
        if conn:
            db_pool.putconn(conn)

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
        if(response.json()["detections"] > 0):
            insert_pothole(latitude, longitude, "Low")
        return jsonify({"potholes_detected": response.json()["detections"]}), 200
    else:
        return jsonify({"error": "Failed to process image"}), 400


if __name__ == '__main__':
    init_db_pool()
    try:
        app.run(host='0.0.0.0', debug=True)
    except Exception as e:
        print(f"Application error: {e}")
    finally:
        close_db_pool()
