from ultralytics import YOLO
import cv2

model = None

def load_model(model_path):
    global model
    model = YOLO(model_path)

def predict_image(image_path):
    if model is None:
        raise Exception("Model not loaded. Please load the model first.")
    
    results = model.predict(image_path, conf=0.3)
    return results