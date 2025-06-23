#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import cv2
import numpy as np
from pathlib import Path

# 현재 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr.preprocess import (
    preprocess_image, 
    enhance_text_region, 
    remove_background_noise, 
    deskew_image
)
from ocr.extractor import (
    extract_nutrition_info,
    extract_nutrition_table_region,
    validate_nutrition_data,
    calculate_daily_values,
    fix_ocr_unit_errors,
    extract_nutrition_value
)

def test_preprocessing_methods(image_path: str):
    """
    다양한 전처리 방법들을 테스트하는 함수
    
    Args:
        image_path: 테스트할 이미지 경로
    """
    print(f"테스트 이미지: {image_path}")
    print("=" * 50)
    
    # 원본 이미지 로드
    original = cv2.imread(image_path)
    if original is None:
        print("이미지를 로드할 수 없습니다.")
        return
    
    print(f"원본 이미지 크기: {original.shape}")
    
    # 다양한 전처리 방법 테스트
    methods = ["adaptive", "otsu", "gaussian", "multi_scale"]
    
    for method in methods:
        print(f"\n{method.upper()} 방법 테스트:")
        
        # 전처리 수행
        processed = preprocess_image(image_path, method)
        
        if processed is not None:
            # 결과 저장
            output_path = f"test_output_{method}.png"
            cv2.imwrite(output_path, processed)
            print(f"  - 전처리 완료: {output_path}")
            
            # 이미지 품질 평가 (간단한 메트릭)
            # 텍스트 영역의 대비 계산
            contrast = np.std(processed)
            print(f"  - 대비 (표준편차): {contrast:.2f}")
            
            # 엣지 밀도 계산
            edges = cv2.Canny(processed, 50, 150)
            edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
            print(f"  - 엣지 밀도: {edge_density:.4f}")
        else:
            print(f"  - 전처리 실패")
    
    # 추가 전처리 기법들 테스트
    print(f"\n추가 전처리 기법 테스트:")
    
    # 기본 전처리
    base_processed = preprocess_image(image_path, "adaptive")
    if base_processed is not None:
        # 텍스트 영역 강화
        enhanced = enhance_text_region(base_processed)
        cv2.imwrite("test_enhanced_text.png", enhanced)
        print("  - 텍스트 영역 강화 완료: test_enhanced_text.png")
        
        # 배경 노이즈 제거
        cleaned = remove_background_noise(base_processed)
        cv2.imwrite("test_cleaned_noise.png", cleaned)
        print("  - 배경 노이즈 제거 완료: test_cleaned_noise.png")
        
        # 기울기 보정
        deskewed = deskew_image(base_processed)
        cv2.imwrite("test_deskewed.png", deskewed)
        print("  - 기울기 보정 완료: test_deskewed.png")

def test_ocr_unit_error_fix():
    """
    OCR 단위 오류 수정 기능을 테스트하는 함수
    """
    print("\n" + "=" * 50)
    print("OCR 단위 오류 수정 테스트")
    print("=" * 50)
    
    # 테스트 케이스들
    test_cases = [
        "2.69",  # 2.6g를 2.69로 잘못 인식
        "15.89",  # 15.8g를 15.89로 잘못 인식
        "3.29mg",  # 3.2mg를 3.29mg로 잘못 인식
        "150kca1",  # 150kcal을 150kca1로 잘못 인식
        "25.59",  # 25.5g를 25.59로 잘못 인식
        "0.19",  # 0.1g를 0.19로 잘못 인식
        "12.39",  # 12.3g를 12.39로 잘못 인식
    ]
    
    print("OCR 오류 수정 테스트:")
    for test_case in test_cases:
        fixed = fix_ocr_unit_errors(test_case)
        print(f"  원본: {test_case} → 수정: {fixed}")
    
    # 실제 영양성분 추출 테스트
    print(f"\n실제 영양성분 추출 테스트:")
    
    # OCR 오류가 포함된 샘플 텍스트
    ocr_error_text = [
        "영양성분표",
        "100g당",
        "열량: 150kca1",  # kcal 오류
        "탄수화물: 25.59",  # g 오류
        "단백질: 8.29",  # g 오류
        "지방: 3.19",  # g 오류
        "나트륨: 450mg",
        "당류: 12.39",  # g 오류
        "포화지방: 1.89",  # g 오류
        "트랜스지방: 0.19",  # g 오류
        "콜레스테롤: 15mg",
        "식이섬유: 2.59",  # g 오류
        "원료명: 우유, 설탕..."
    ]
    
    print("OCR 오류가 포함된 텍스트:")
    for line in ocr_error_text:
        print(f"  {line}")
    
    # 오류 수정 적용
    corrected_text = [fix_ocr_unit_errors(line) for line in ocr_error_text]
    
    print(f"\n오류 수정 후 텍스트:")
    for line in corrected_text:
        print(f"  {line}")
    
    # 영양성분 추출 테스트
    nutrition_lines = extract_nutrition_table_region(corrected_text)
    nutrition_data = extract_nutrition_info(nutrition_lines)
    
    print(f"\n추출된 영양성분 (오류 수정 후):")
    for nutrient, value in nutrition_data.items():
        print(f"  {nutrient}: {value}")

def test_extraction_with_sample_text():
    """
    샘플 텍스트로 추출 로직을 테스트하는 함수
    """
    print("\n" + "=" * 50)
    print("추출 로직 테스트")
    print("=" * 50)
    
    # 샘플 영양성분표 텍스트
    sample_text = [
        "영양성분표",
        "100g당",
        "열량: 150 kcal",
        "탄수화물: 25.5g",
        "단백질: 8.2g",
        "지방: 3.1g",
        "나트륨: 450mg",
        "당류: 12.3g",
        "포화지방: 1.8g",
        "트랜스지방: 0.1g",
        "콜레스테롤: 15mg",
        "식이섬유: 2.5g",
        "원료명: 우유, 설탕..."
    ]
    
    print("샘플 텍스트:")
    for line in sample_text:
        print(f"  {line}")
    
    # 영양성분표 영역 추출
    nutrition_lines = extract_nutrition_table_region(sample_text)
    print(f"\n영양성분표 영역 ({len(nutrition_lines)}줄):")
    for line in nutrition_lines:
        print(f"  {line}")
    
    # 영양성분 추출
    nutrition_data = extract_nutrition_info(nutrition_lines)
    print(f"\n추출된 영양성분:")
    for nutrient, value in nutrition_data.items():
        print(f"  {nutrient}: {value}")
    
    # 데이터 검증
    validated_data = validate_nutrition_data(nutrition_data)
    print(f"\n검증된 영양성분:")
    for nutrient, value in validated_data.items():
        print(f"  {nutrient}: {value}")
    
    # 일일 기준치 대비 백분율 계산
    daily_values = calculate_daily_values(validated_data)
    print(f"\n일일 기준치 대비 백분율:")
    for nutrient, percentage in daily_values.items():
        print(f"  {nutrient}: {percentage}%")

def main():
    """
    메인 테스트 함수
    """
    print("OCR 전처리 및 추출 로직 테스트")
    print("=" * 50)
    
    # OCR 단위 오류 수정 테스트
    test_ocr_unit_error_fix()
    
    # 테스트 이미지 경로
    test_image_path = "uploads/label_sample.png"
    
    # 이미지가 존재하는지 확인
    if os.path.exists(test_image_path):
        test_preprocessing_methods(test_image_path)
    else:
        print(f"\n테스트 이미지를 찾을 수 없습니다: {test_image_path}")
        print("uploads 폴더에 테스트 이미지를 넣어주세요.")
    
    # 텍스트 추출 로직 테스트
    test_extraction_with_sample_text()
    
    print("\n테스트 완료!")
    print("생성된 파일들을 확인하여 전처리 결과를 비교해보세요.")

if __name__ == "__main__":
    main() 