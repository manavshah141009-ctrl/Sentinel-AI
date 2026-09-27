import cv2
import numpy as np
from typing import Tuple

class MotionGateFilter:
    """
    Lightweight CPU Motion Gate Pre-filter (< 1ms execution).
    Analyzes inter-frame pixel differences to filter out 65%+ empty road frames
    before hitting heavy GPU inference, eliminating compute waste at 80,000-camera scale.
    """
    def __init__(self, min_motion_area: int = 400, threshold_val: int = 25):
        self.prev_gray = None
        self.min_motion_area = min_motion_area
        self.threshold_val = threshold_val
        self.total_frames = 0
        self.skipped_frames = 0

    def should_infer(self, frame_bgr: np.ndarray) -> Tuple[bool, float]:
        """
        Returns (should_run_ai, motion_score).
        If False, frame has no vehicle motion and can bypass GPU OCR/YOLO.
        """
        if frame_bgr is None or frame_bgr.size == 0:
            return False, 0.0

        self.total_frames += 1
        # Downscale for ultra-fast motion check
        small = cv2.resize(frame_bgr, (160, 90), interpolation=cv2.INTER_NEAREST)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)

        if self.prev_gray is None:
            self.prev_gray = gray
            return True, 1.0  # Always process first frame

        diff = cv2.absdiff(self.prev_gray, gray)
        self.prev_gray = gray

        _, thresh = cv2.threshold(diff, self.threshold_val, 255, cv2.THRESH_BINARY)
        motion_pixels = int(np.count_nonzero(thresh))
        motion_ratio = motion_pixels / float(thresh.size)

        # Vehicle motion detected if changed pixels exceed threshold
        has_motion = motion_pixels > (self.min_motion_area // 16)
        if not has_motion:
            self.skipped_frames += 1

        return has_motion, round(motion_ratio * 100, 2)

    @property
    def skip_rate(self) -> float:
        if self.total_frames == 0:
            return 0.0
        return round((self.skipped_frames / self.total_frames) * 100, 1)

motion_filter = MotionGateFilter()
