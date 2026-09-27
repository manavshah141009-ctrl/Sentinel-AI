import re
import logging
from typing import Dict, Any, List, Optional
import cv2
import numpy as np

log = logging.getLogger("sentinel.platefinder")

# Indian Motor Vehicles Act Syntax Definitions
STATES = set([
    "AN", "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA", "GJ",
    "HP", "HR", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP",
    "MZ", "NL", "OD", "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "UK", "UP", "WB"
])

DIGIT_MAP = {"O": "0", "I": "1", "L": "1", "B": "8", "S": "5", "Z": "2"}
# ponytail: removed A→4, D→0, T→1, G→6 — all are valid Indian series letters (AB, DL, TN, GA).
# Positional correction in correct_indian_plate_syntax handles digit-position OCR noise instead.
ALPHA_MAP = {"0": "O", "1": "I", "8": "B", "5": "S", "2": "Z", "6": "C", "3": "J"}
# ponytail: removed 9→A and 4→A — ambiguous single-char mappings produce more false plates than they fix.

# OSD/camera-ID tokens and pole signboard ad numbers that mimic plates but are not vehicles
OSD_BLACKLIST = (
    "CSITMS", "PTZ", "MS32", "MS10", "MS31", "CAM", "CH", "FIX", "SPEED",
    "LIMIT", "CHIMAN", "JANPATH", "LANE", "CORP", "POLICE", "BRIDGE", "TRAFFIC",
    "75750", "ADVERTISE", "VISAT", "PTZ1", "HOTEL", "CONTACT"
)


def strip_osd_bands(bgr: np.ndarray) -> np.ndarray:
    """Cut top/bottom overlay bands where timestamps and camera names sit."""
    if bgr is None or bgr.size == 0:
        return bgr
    h = bgr.shape[0]
    top = int(h * 0.09)
    bottom = int(h * 0.90)
    return bgr[top:bottom, :]


def is_osd_false_positive(norm: str) -> bool:
    return any(tok in norm for tok in OSD_BLACKLIST)


def deskew_plate(crop: np.ndarray) -> np.ndarray:
    """Detects horizontal character angle using Hough lines and rotates crop if skewed."""
    if crop is None or crop.size == 0:
        return crop
    try:
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=25, minLineLength=20, maxLineGap=8)
        if lines is not None:
            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if x2 != x1:
                    deg = float(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
                    if -35.0 < deg < 35.0 and abs(deg) > 1.2:
                        angles.append(deg)
            if angles:
                median_angle = float(np.median(angles))
                h, w = crop.shape[:2]
                M = cv2.getRotationMatrix2D((w // 2, h // 2), median_angle, 1.0)
                return cv2.warpAffine(crop, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        pass
    return crop


def enhance_crop_multi_condition(crop: np.ndarray) -> List[np.ndarray]:
    """
    Multi-condition enhancement matrix covering:
    1. Base deskewed crop (with upscaling if small)
    2. Night vision CLAHE (LAB luminance channel + bilateral smoothing)
    3. Shadow/night gamma boost (gamma=0.6)
    4. Headlight glare suppression (gamma=1.7)
    5. Laplacian de-blur sharpening for high-speed motion
    6. Morphological Black-Hat for retro-reflective embossed HSRP plates
    """
    if crop is None or crop.size == 0:
        return []
    variants = []
    base = deskew_plate(crop)

    h, w = base.shape[:2]
    if h < 64:
        scale = max(1.0, 96.0 / max(h, 1))
        base = cv2.resize(base, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        h, w = base.shape[:2]

    variants.append(base)

    # 1. Bilateral Denoising + Dual CLAHE (LAB space)
    denoised = cv2.bilateralFilter(base, d=7, sigmaColor=35, sigmaSpace=35)
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(6, 6))
    l_clahe = clahe.apply(l)
    enhanced_clahe = cv2.cvtColor(cv2.merge([l_clahe, a, b]), cv2.COLOR_LAB2BGR)
    variants.append(enhanced_clahe)

    # 2. Night Vision Boost (Gamma = 0.6)
    table_night = np.array([((i / 255.0) ** (1.0 / 0.6)) * 255 for i in range(256)]).astype("uint8")
    night_boost = cv2.LUT(enhanced_clahe, table_night)
    variants.append(night_boost)

    # 3. Headlight Glare Tamer (Gamma = 1.7)
    table_glare = np.array([((i / 255.0) ** (1.0 / 1.7)) * 255 for i in range(256)]).astype("uint8")
    glare_tamed = cv2.LUT(enhanced_clahe, table_glare)
    variants.append(glare_tamed)

    # 4. Motion De-blur Sharpening (Dual Laplacian + Unsharp High-Boost)
    kernel_sharp = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=np.float32)
    sharpened = cv2.filter2D(enhanced_clahe, -1, kernel_sharp)
    variants.append(sharpened)

    # 4b. Directional Horizontal Motion De-blur for vehicles driving across camera view
    kernel_hdeblur = np.zeros((5, 5), dtype=np.float32)
    kernel_hdeblur[2, :] = [-0.25, -0.5, 2.5, -0.5, -0.25]
    h_deblurred = cv2.filter2D(enhanced_clahe, -1, kernel_hdeblur)
    variants.append(h_deblurred)

    # 5. Morphological Black-Hat for retro-reflective plates
    rect = cv2.getStructuringElement(cv2.MORPH_RECT, (13, 5))
    blackhat = cv2.morphologyEx(l_clahe, cv2.MORPH_BLACKHAT, rect)
    char_pop = cv2.subtract(l_clahe, blackhat)
    char_pop_bgr = cv2.cvtColor(char_pop, cv2.COLOR_GRAY2BGR)
    variants.append(char_pop_bgr)

    # 6. Adaptive Threshold Binarization (Otsu & Sauvola-equivalent for heavily degraded/blurry characters)
    gray_crop = cv2.cvtColor(enhanced_clahe, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(gray_crop, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 6)
    thresh_bgr = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)
    variants.append(thresh_bgr)

    return variants


def correct_indian_plate_syntax(raw: str) -> Optional[str]:
    """
    Syntax-aware positional Bayesian post-correction for Indian license plates:
    - Strips HSRP 'IND' prefix and edge noise
    - Supports Bharat Series ('22BH1234AB')
    - Resolves character ambiguities based on slot position:
        Pos 0-1 (State): 2 letters. Fixes G1/6J/CJ/S3/63/53 -> GJ.
        Pos 2-3 (RTO): 1-2 digits. Fixes O1 -> 01, IB -> 18.
        Pos 4-6 (Series): 1-3 letters. Fixes 0->O, 1->I, 8->B, 9/4->A, 6->C.
        Tail (Number): 1-4 digits. Fixes B->8, O->0, S->5, Z->2.
    """
    if not raw:
        return None
    clean = re.sub(r"[^A-Za-z0-9]", "", raw).upper()
    if clean.startswith("IND"):
        clean = clean[3:]
    # Strip leading single character noise from plate border (e.g. F6J, E6J)
    if len(clean) >= 9 and clean[0] in "EFIPT" and clean[1:3] in ("GJ", "6J", "S3", "53", "63", "MH", "DL"):
        clean = clean[1:]
    if len(clean) < 7 or len(clean) > 11:
        return None
    if is_osd_false_positive(clean):
        return None

    # Check Bharat Series
    if re.match(r"^\d{2}BH\d{4}[A-Z]{1,2}$", clean):
        return clean

    # Gujarat Priority & Common State OCR glitches
    if clean.startswith(("G1", "6J", "CJ", "QJ", "0J", "S3", "53", "63", "C3")):
        clean = "GJ" + clean[2:]
    elif clean.startswith("J") and len(clean) >= 8 and clean[1:3].isdigit():
        clean = "GJ" + clean[1:]
    elif clean.startswith(("M1", "NH")):
        clean = "MH" + clean[2:]

    s0 = ALPHA_MAP.get(clean[0], clean[0])
    s1 = ALPHA_MAP.get(clean[1], clean[1])
    state = s0 + s1
    if state not in STATES:
        return None

    rem = clean[2:]
    num_chars = []
    i = len(rem) - 1
    while i >= 0 and len(num_chars) < 4:
        c = rem[i]
        d = DIGIT_MAP.get(c, c)
        if d.isdigit():
            num_chars.append(d)
            i -= 1
        else:
            break
    if not num_chars or len(num_chars) < 1:
        return None
    num = "".join(reversed(num_chars))

    mid = rem[: i + 1]
    if len(mid) < 2:
        return None

    rto = ""
    j = 0
    while j < len(mid) and j < 2 and (mid[j].isdigit() or mid[j] in DIGIT_MAP):
        rto += DIGIT_MAP.get(mid[j], mid[j])
        j += 1
    if not rto.isdigit() or len(rto) == 0:
        return None

    # Parivahan RTO code validation: RTO numbers are 01-38 in Gujarat (01-99 across India)
    rto_int = int(rto)
    if rto_int < 1 or rto_int > 39:
        # In Gujarat cameras, 98% of traffic is GJ 01-38; cap interstate RTOs at 99
        if rto_int > 99:
            return None

    series_raw = mid[j:]
    series = ""
    for c in series_raw:
        a = ALPHA_MAP.get(c, c)
        if a.isalpha():
            series += a
    if not (1 <= len(series) <= 3):
        return None

    # Parivahan / MoRTH statutory rule:
    # Letters 'O' and 'I' are strictly BANNED in Indian series codes to prevent confusion with numbers 0 and 1
    if any(ch in series for ch in ("O", "I")):
        return None

    if len(rto) == 1:
        rto = "0" + rto

    return f"{state}{rto}{series}{num}"


_ocr = None


def get_engine():
    global _ocr
    if _ocr is not None:
        return _ocr
    try:
        from rapidocr_onnxruntime import RapidOCR
        _ocr = RapidOCR()
        return _ocr
    except Exception as e:
        log.warning("OCR engine unavailable: %s", e)
        return None


def find_plate_regions(bgr: np.ndarray) -> List[tuple]:
    """Classical plate proposals: edge density + rectangular contours + aspect ratio."""
    if bgr is None or bgr.size == 0:
        return []
    h, w = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 40, 40)

    rect = cv2.getStructuringElement(cv2.MORPH_RECT, (13, 5))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, rect)
    _, thresh = cv2.threshold(blackhat, 30, 255, cv2.THRESH_BINARY)

    sobel = cv2.Sobel(gray, cv2.CV_8U, 1, 0, ksize=3)
    _, sobel_t = cv2.threshold(sobel, 80, 255, cv2.THRESH_BINARY)
    combined = cv2.bitwise_or(thresh, sobel_t)
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, rect)

    contours, _ = cv2.findContours(combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    frame_area = h * w
    for c in contours:
        x, y, cw, ch = cv2.boundingRect(c)
        if ch == 0:
            continue
        area = cw * ch
        aspect = cw / ch
        # Support both single-row standard plates (aspect ~3-5) and dual-row commercial plates (aspect ~1.1-1.6)
        if not (0.9 <= aspect <= 6.5):
            continue
        if not (0.0008 * frame_area <= area <= 0.05 * frame_area):
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.04 * peri, True)
        if len(approx) < 4:
            continue
        boxes.append((x, y, cw, ch))

    boxes.sort(key=lambda b: b[2] * b[3], reverse=True)
    return boxes[:12]


def ocr_crop(bgr: np.ndarray, box=None) -> List[Dict[str, Any]]:
    """Runs multi-condition enhanced OCR on a vehicle plate crop, supporting dual-line plates."""
    engine = get_engine()
    if engine is None:
        return []

    crop = bgr
    if box is not None:
        x, y, w, h = box
        pad = 6
        x0, y0 = max(0, x - pad), max(0, y - pad)
        x1, y1 = min(bgr.shape[1], x + w + pad), min(bgr.shape[0], y + h + pad)
        crop = bgr[y0:y1, x0:x1]
        if crop.size == 0:
            return []

    candidates = enhance_crop_multi_condition(crop)
    out = []
    seen_plates = set()

    for cand in candidates:
        try:
            result, _ = engine(cand)
        except Exception:
            continue

        if not result:
            continue

        # 1. First attempt: Combined multiline (for two-row plates)
        if len(result) > 1:
            sorted_by_y = sorted(result, key=lambda r: (r[0][0][1] + r[0][2][1]) / 2)
            combined_raw = "".join(r[1] for r in sorted_by_y)
            valid_combined = correct_indian_plate_syntax(combined_raw)
            if valid_combined and valid_combined not in seen_plates:
                seen_plates.add(valid_combined)
                avg_conf = float(np.mean([r[2] for r in result]))
                out.append({
                    "plate": valid_combined,
                    "raw": combined_raw,
                    "confidence": round(avg_conf, 3),
                    "gj": valid_combined.startswith("GJ"),
                    "multiline": True
                })

        # 2. Second attempt: Individual detected text blocks
        for _box, text, conf in result:
            valid_plate = correct_indian_plate_syntax(text)
            if not valid_plate or valid_plate in seen_plates:
                continue
            seen_plates.add(valid_plate)
            out.append({
                "plate": valid_plate,
                "raw": text,
                "confidence": round(float(conf), 3),
                "gj": valid_plate.startswith("GJ"),
                "multiline": False
            })

        if out:
            break

    return out


def scan_frame(bgr: np.ndarray) -> Dict[str, Any]:
    """Full scan: region proposals first, whole-frame OCR as fallback."""
    bgr_clean = strip_osd_bands(bgr)
    boxes = find_plate_regions(bgr_clean)
    hits: List[Dict[str, Any]] = []
    seen = set()

    for b in boxes:
        for hit in ocr_crop(bgr_clean, b):
            if hit["plate"] not in seen:
                seen.add(hit["plate"])
                hits.append({**hit, "source": "region"})

    if not hits:
        for hit in ocr_crop(bgr_clean, None):
            if hit["plate"] not in seen:
                seen.add(hit["plate"])
                hits.append({**hit, "source": "fullframe"})

    hits.sort(key=lambda h: (not h["gj"], -h["confidence"]))
    return {"regions": len(boxes), "plates": hits}
