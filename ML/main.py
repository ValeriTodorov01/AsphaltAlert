from ultralytics import YOLO
from ultralytics.utils import ops, checks
import numpy as np
import cv2

model = YOLO("runs/detect/dataset3-train-m/weights/best.pt")

image_paths = [
    "images/0.jpeg", 
    "images/1.jpg", 
    "images/2.jpg", 
    "images/4.jpg", 
    "images/6.jpg", 
    "images/img_1.png", 
    "images/img_2.png", 
    "images/img_3.png", 
    "images/img_4.png", 
    "images/img_5.png", 
    "images/img_6.png", 
    "images/img.png"
]
results = model.predict(image_paths, conf=0.3)

# Process results list
for result in results:
    result.show()  # display to screen
    result.save(filename="result.jpg")  # save to disk

