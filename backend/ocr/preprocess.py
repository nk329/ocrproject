#이미지 처리 전담

import cv2
import numpy as np
from typing import Optional, Tuple

def preprocess_image(image_path: str, method: str = "adaptive") -> Optional[np.ndarray]:
    """
    OCR을 위한 이미지 전처리 함수
    
    Args:
        image_path: 이미지 파일 경로
        method: 전처리 방법 ("adaptive", "otsu", "gaussian", "multi_scale")
    
    Returns:
        전처리된 이미지 또는 None
    """
    image = cv2.imread(image_path)
    if image is None:
        return None
    
    # 이미지 크기 조정 (너무 크거나 작은 경우)
    height, width = image.shape[:2]
    if width > 2000:
        scale = 2000 / width
        new_width = int(width * scale)
        new_height = int(height * scale)
        image = cv2.resize(image, (new_width, new_height))
    
    # 노이즈 제거
    denoised = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
    
    # 그레이스케일 변환
    gray = cv2.cvtColor(denoised, cv2.COLOR_BGR2GRAY)
    
    # 대비 향상
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # 블러 처리로 노이즈 제거
    blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
    
    if method == "adaptive":
        return _adaptive_threshold(blurred)
    elif method == "otsu":
        return _otsu_threshold(blurred)
    elif method == "gaussian":
        return _gaussian_threshold(blurred)
    elif method == "multi_scale":
        return _multi_scale_processing(blurred)
    else:
        return _adaptive_threshold(blurred)

def _adaptive_threshold(image: np.ndarray) -> np.ndarray:
    """적응형 임계값 처리"""
    thresh = cv2.adaptiveThreshold(
        image, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    
    # 모폴로지 연산으로 노이즈 제거
    kernel = np.ones((1, 1), np.uint8)
    opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    
    # 팽창 연산으로 텍스트 두께 증가
    dilated = cv2.dilate(opened, kernel, iterations=1)
    
    return dilated

def _otsu_threshold(image: np.ndarray) -> np.ndarray:
    """Otsu 임계값 처리"""
    _, thresh = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # 모폴로지 연산
    kernel = np.ones((2, 2), np.uint8)
    opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    
    return opened

def _gaussian_threshold(image: np.ndarray) -> np.ndarray:
    """가우시안 블러 후 임계값 처리"""
    # 가우시안 블러
    blurred = cv2.GaussianBlur(image, (5, 5), 0)
    
    # 임계값 처리
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return thresh

def _multi_scale_processing(image: np.ndarray) -> np.ndarray:
    """다중 스케일 처리"""
    # 여러 스케일에서 처리
    scales = [0.8, 1.0, 1.2]
    results = []
    
    for scale in scales:
        if scale != 1.0:
            h, w = image.shape
            new_h, new_w = int(h * scale), int(w * scale)
            scaled = cv2.resize(image, (new_w, new_h))
        else:
            scaled = image.copy()
        
        # 각 스케일에서 전처리
        thresh = cv2.adaptiveThreshold(
            scaled, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        
        if scale != 1.0:
            # 원본 크기로 복원
            thresh = cv2.resize(thresh, (image.shape[1], image.shape[0]))
        
        results.append(thresh)
    
    # 결과들을 평균
    result = np.mean(results, axis=0).astype(np.uint8)
    
    # 이진화
    _, final = cv2.threshold(result, 127, 255, cv2.THRESH_BINARY)
    
    return final

def enhance_text_region(image: np.ndarray) -> np.ndarray:
    """텍스트 영역 강화"""
    # 엣지 검출
    edges = cv2.Canny(image, 50, 150, apertureSize=3)
    
    # 수평선 검출 (영양성분표의 특징)
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
    horizontal_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, horizontal_kernel)
    
    # 수직선 검출
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25))
    vertical_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, vertical_kernel)
    
    # 선들을 결합
    lines = cv2.add(horizontal_lines, vertical_lines)
    
    # 원본 이미지와 결합
    enhanced = cv2.addWeighted(image, 0.7, lines, 0.3, 0)
    
    return enhanced

def remove_background_noise(image: np.ndarray) -> np.ndarray:
    """배경 노이즈 제거"""
    # 연결 요소 분석
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(image, connectivity=8)
    
    # 작은 노이즈 제거
    min_size = 50
    cleaned = image.copy()
    
    for i in range(1, num_labels):  # 0은 배경
        if stats[i, cv2.CC_STAT_AREA] < min_size:
            cleaned[labels == i] = 0
    
    return cleaned

def deskew_image(image: np.ndarray) -> np.ndarray:
    """이미지 기울기 보정"""
    # 이진화
    _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # 텍스트 라인 검출
    coords = np.column_stack(np.where(binary > 0))
    angle = cv2.minAreaRect(coords)[-1]
    
    # 각도 보정
    if angle < -45:
        angle = 90 + angle
    
    if abs(angle) > 0.5:  # 0.5도 이상 기울어진 경우만 보정
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return rotated
    
    return image
