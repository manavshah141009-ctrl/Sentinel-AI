import cv2, numpy as np
from backend.workers.local_infer import get_local_yolo

yolo = get_local_yolo()
img = cv2.imread("/tmp/cam02_live.jpg")
if img is not None:
    # Manual letterbox
    orig_h, orig_w = img.shape[:2]
    max_dim = max(orig_h, orig_w)
    padded = np.zeros((max_dim, max_dim, 3), dtype=np.uint8)
    padded[0:orig_h, 0:orig_w] = img
    
    # Run YOLO on padded
    blob = cv2.dnn.blobFromImage(padded, 1 / 255.0, (640, 640), swapRB=True, crop=False).astype(np.float16)
    preds = yolo.session.run(None, {yolo.input_name: blob})[0]
    predictions = np.squeeze(preds).T
    found = 0
    for row in predictions:
        class_scores = row[4:]
        cid = int(np.argmax(class_scores))
        score = float(class_scores[cid])
        if score > 0.10:
            found += 1
    print(f"Detections with letterbox: {found}")
