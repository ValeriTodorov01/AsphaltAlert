from flask import Flask, request, jsonify
import os
from model import load_model, predict_image
from utils import extract_geolocation

app = Flask(__name__)
model = load_model()

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        # Save the uploaded file temporarily
        file_path = os.path.join('uploads', file.filename)
        file.save(file_path)
        
        # Predict using the YOLO model
        results = predict_image(model, file_path)
        
        # Check if classification is successful
        if results:
            return '', 200
        else:
            return '', 404

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    app.run(debug=True)