import cv2, numpy as np
import onnxruntime as ort
from backend.workers.local_infer import VEHICLE_CLASSES

def run_yolo(img_path):
    img = cv2.imread(img_path)
    if img is None: return
    orig_h, orig_w = img.shape[:2]
    
    session = ort.InferenceSession("yolov8n.onnx", providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    
    def infer(frame):
        blob = cv2.dnn.blobFromImage(frame, 1 / 255.0, (640, 640), swapRB=True, crop=False).astype(np.float16)
        preds = session.run(None, {input_name: blob})[0]
        predictions = np.squeeze(preds).T
        found = 0
        for row in predictions:
            class_scores = row[4:]
            cid = int(np.argmax(class_scores))
            score = float(class_scores[cid])
            if score > 0.10 and cid in VEHICLE_CLASSES:
                found += 1
        return found
        
    print(f"--- {img_path} ---")
    print(f"Raw frame detections: {infer(img)}")
    
    # Apply CLAHE
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(l)
    clahe_img = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
    print(f"CLAHE frame detections: {infer(clahe_img)}")

run_yolo("data/frames/cam02.jpg")
