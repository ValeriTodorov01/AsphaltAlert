import torch
import torchvision
from PIL import Image
import io
import base64
import litserve as ls
from ultralytics import YOLO

class YOLOLitAPI(ls.LitAPI):
    def setup(self, device):
        self.device = device if torch.cuda.is_available() else "cpu"
        self.model = YOLO("runs/detect/dataset3-train-x/weights/best.pt")
        self.transform = torchvision.transforms.ToTensor()

    def decode_request(self, request):
        if "image_data" not in request:
           raise ValueError("The request must include an 'image_data' key with base64-encoded image data.")

        image_data = request["image_data"]
        image_bytes = base64.b64decode(image_data)

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        input_tensor = self.transform(image).unsqueeze(0).to(self.device)  
        return input_tensor

    def predict(self, input_tensor):
        with torch.no_grad():
            predictions = self.model.predict(input_tensor, conf=0.3)
            
        return predictions

    def encode_response(self, predictions):
        num_potholes = 0
        for pred in predictions:
            num_potholes += len(pred.boxes)
            
        return {"detections": num_potholes}


if __name__ == "__main__":
    api = YOLOLitAPI()
    server = ls.LitServer(api, accelerator="gpu")
    server.run(port=8000)
