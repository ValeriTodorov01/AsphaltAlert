import requests

url = 'http://127.0.0.1:5000/detect_pothole'
file_path = 'C:/Users/zzz/Desktop/diplomna/ML/images/img_3.png'

with open(file_path, 'rb') as f:
    print(f)
    files = {'image': "1"}
    response = requests.post(url, files=files)

