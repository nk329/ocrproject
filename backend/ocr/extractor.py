import re
from typing import List, Dict, Optional, Tuple
import numpy as np

def extract_value(lines, keywords):
    replace_map = {
        'O': '0', 'o': '0',
        'I': '1', 'l': '1',
        'Z': '2', 'S': '5',
        'B': '8', 'A': '4',
        'G': '6', 'g': '9',
        'D': '0', 'd': '0'
    }

    def normalize_token(token):
        token = token.replace(',', '.')  # OCR 콤마 → 점 처리
        return ''.join(replace_map.get(c, c) for c in token)

    for idx, line in enumerate(lines):
        norm_line = line.replace(" ", "").lower()
        for keyword in keywords:
            if keyword in norm_line:
                for token in line.split():
                    token = normalize_token(token)
                    try:
                        return float(''.join(c for c in token if c.isdigit() or c == '.'))
                    except:
                        continue
                if idx + 1 < len(lines):
                    for token in lines[idx + 1].split():
                        token = normalize_token(token)
                        try:
                            return float(''.join(c for c in token if c.isdigit() or c == '.'))
                        except:
                            continue
    return 0.0


def extract_calorie(lines):
    keywords = ["열량", "칼로리", "kcal", "energy", "총", "총열량"]
    replace_map = {'O': '0', 'o': '0', 'I': '1', 'l': '1', 'Z': '2', 'S': '5', 'B': '8', 'A': '4'}

    def normalize_token(token):
        token = token.replace(',', '.')
        return ''.join(replace_map.get(c, c) for c in token)

    for idx, line in enumerate(lines):
        lower = line.lower().replace(" ", "")
        if any(k in lower for k in keywords):
            tokens = line.split()
            for t in tokens:
                t_norm = normalize_token(t)
                if 'kcal' in t_norm:
                    t_norm = t_norm.replace('kcal', '')
                try:
                    return float(''.join(c for c in t_norm if c.isdigit() or c == '.'))
                except:
                    continue
        # 한 줄 아래에 있는 경우도 시도
        if any(k in lower for k in keywords) and idx + 1 < len(lines):
            for t in lines[idx + 1].split():
                t_norm = normalize_token(t)
                try:
                    return float(''.join(c for c in t_norm if c.isdigit() or c == '.'))
                except:
                    continue
    return 0.0

def extract_nutrition_info(lines: List[str]) -> Dict[str, float]:
    """
    영양성분표에서 모든 영양성분을 추출하는 함수
    
    Args:
        lines: OCR로 추출된 텍스트 라인들
    
    Returns:
        영양성분 정보 딕셔너리
    """
    nutrition_data = {}
    
    # 영양성분 키워드 매핑
    nutrition_keywords = {
        '열량': ['열량', '칼로리', 'kcal', 'energy', '총열량'],
        '탄수화물': ['탄수화물', 'carbohydrate', 'carb', '당질'],
        '단백질': ['단백질', 'protein', 'pro'],
        '지방': ['지방', 'fat', '지질'],
        '당류': ['당류', 'sugar', 'sugars'],
        '나트륨': ['나트륨', 'sodium', 'na'],
        '포화지방': ['포화지방', 'saturated fat', '포화지방산'],
        '트랜스지방': ['트랜스지방', 'trans fat', '트랜스지방산'],
        '콜레스테롤': ['콜레스테롤', 'cholesterol'],
        '식이섬유': ['식이섬유', 'dietary fiber', '섬유질'],
        '칼슘': ['칼슘', 'calcium', 'ca'],
        '철': ['철', 'iron', 'fe'],
        '칼륨': ['칼륨', 'potassium', 'k'],
        '인': ['인', 'phosphorus', 'p'],
        '비타민a': ['비타민a', 'vitamin a', 'vit a'],
        '비타민c': ['비타민c', 'vitamin c', 'vit c'],
        '비타민d': ['비타민d', 'vitamin d', 'vit d'],
        '비타민e': ['비타민e', 'vitamin e', 'vit e'],
        '비타민b1': ['비타민b1', 'vitamin b1', 'thiamin'],
        '비타민b2': ['비타민b2', 'vitamin b2', 'riboflavin'],
        '니아신': ['니아신', 'niacin'],
        '엽산': ['엽산', 'folate', 'folic acid']
    }
    
    for nutrition_name, keywords in nutrition_keywords.items():
        value = extract_nutrition_value(lines, keywords)
        if value is not None and value > 0:
            nutrition_data[nutrition_name] = value
    
    return nutrition_data

def extract_nutrition_value(lines: List[str], keywords: List[str]) -> Optional[float]:
    """
    특정 영양성분의 값을 추출하는 함수
    
    Args:
        lines: OCR로 추출된 텍스트 라인들
        keywords: 검색할 키워드들
    
    Returns:
        추출된 값 (실패시 None)
    """
    # OCR 오류 수정 매핑
    replace_map = {
        'O': '0', 'o': '0', 'I': '1', 'l': '1', 'Z': '2', 'S': '5', 'B': '8', 'A': '4',
        'G': '6', 'D': '0', 'd': '0', 'Q': '0', 'q': '0'
    }
    
    def clean_and_extract_number(text: str) -> Optional[float]:
        """텍스트에서 숫자 추출 및 정리"""
        # 1. OCR 단위 관련 오류 우선 수정 (e.g., "2.69" -> "2.6g")
        text = fix_ocr_unit_errors(text)

        # 2. 쉼표를 소수점으로 변환
        text = text.replace(',', '.')

        # 3. 숫자와 단위를 찾기 위한 정규식
        # 예: "2.6g", "150 kcal", "85mg"
        # 키워드와 값이 한 줄에 같이 있는 경우가 많으므로, 키워드 뒤의 첫번째 숫자를 타겟팅합니다.
        for keyword in keywords:
            if keyword in text.lower():
                # 키워드 이후의 텍스트에서 숫자 검색
                sub_text = text[text.lower().find(keyword) + len(keyword):]
                match = re.search(r'(\d+\.?\d+)', sub_text)
                if match:
                    break
        else:
            # 키워드가 없다면, 텍스트 전체에서 숫자 검색
            match = re.search(r'(\d+\.?\d+)', text)

        if match:
            number_str = match.group(1)
            # 숫자 부분에 대해 OCR 문자 오류 수정
            corrected_number_str = ''.join(replace_map.get(c, c) for c in number_str)
            try:
                return float(corrected_number_str)
            except ValueError:
                return None
        
        return None

    for i, line in enumerate(lines):
        line_lower = line.lower()
        
        # 키워드가 포함된 라인 찾기
        if any(keyword in line_lower for keyword in keywords):
            # 현재 라인에서 숫자 추출
            value = clean_and_extract_number(line)
            if value is not None:
                return value
            
            # 다음 라인에서 숫자 추출 (테이블 형태인 경우)
            if i + 1 < len(lines):
                value = clean_and_extract_number(lines[i + 1])
                if value is not None:
                    return value
            
            # 이전 라인에서 숫자 추출
            if i > 0:
                value = clean_and_extract_number(lines[i - 1])
                if value is not None:
                    return value
    
    return None

def fix_ocr_unit_errors(text: str) -> str:
    """
    OCR에서 단위 관련 오류를 수정하는 함수
    
    Args:
        text: OCR로 추출된 텍스트
    
    Returns:
        수정된 텍스트
    """
    # g를 9로 잘못 인식한 경우 수정 (예: 2.69 → 2.6g)
    text = re.sub(r'(\d+\.\d+)9\b', r'\1g', text)
    # mg를 m9로 잘못 인식한 경우 수정
    text = re.sub(r'(\d+\.?\d*)m9\b', r'\1mg', text)
    # kcal을 kca1, kcol 등으로 잘못 인식한 경우 수정
    text = re.sub(r'kca[l1]\b', 'kcal', text, flags=re.IGNORECASE)
    return text

def extract_serving_info(lines: List[str]) -> Dict[str, str]:
    """
    ㎖당 영양성분 정보 추출
    
    Args:
        lines: OCR로 추출된 텍스트 라인들
    
    Returns:
        ㎖당 정보 딕셔너리
    """
    serving_info = {}
    
    # ㎖당 키워드들
    serving_keywords = ['㎖당', '100g당', '100ml당', 'per 100g', 'per 100ml']
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        
        if any(keyword in line_lower for keyword in serving_keywords):
            # ㎖당 정보가 있는 라인과 그 주변 라인들 처리
            for j in range(max(0, i-2), min(len(lines), i+3)):
                if '㎖당' in lines[j] or '100g당' in lines[j] or '100ml당' in lines[j]:
                    serving_info['serving_type'] = 'per_100'
                    break
    
    return serving_info

def validate_nutrition_data(nutrition_data: Dict[str, float]) -> Dict[str, float]:
    """
    추출된 영양성분 데이터의 유효성 검증
    
    Args:
        nutrition_data: 추출된 영양성분 데이터
    
    Returns:
        검증된 영양성분 데이터
    """
    validated_data = {}
    
    # 일반적인 영양성분 범위 검증
    validation_rules = {
        '열량': (0, 1000),  # kcal
        '탄수화물': (0, 100),  # g
        '단백질': (0, 50),  # g
        '지방': (0, 50),  # g
        '나트륨': (0, 2000),  # mg
        '당류': (0, 100),  # g
        '포화지방': (0, 30),  # g
        '트랜스지방': (0, 10),  # g
        '콜레스테롤': (0, 500),  # mg
        '식이섬유': (0, 50),  # g
    }
    
    for nutrient, value in nutrition_data.items():
        if nutrient in validation_rules:
            min_val, max_val = validation_rules[nutrient]
            if min_val <= value <= max_val:
                validated_data[nutrient] = value
        else:
            # 검증 규칙이 없는 영양성분은 그대로 추가
            validated_data[nutrient] = value
    
    return validated_data

def extract_nutrition_table_region(lines: List[str]) -> List[str]:
    """
    영양성분표 영역만 추출하는 함수
    
    Args:
        lines: 전체 OCR 텍스트 라인들
    
    Returns:
        영양성분표 영역의 라인들
    """
    nutrition_table_lines = []
    in_nutrition_table = False
    
    # 영양성분표 시작/끝 키워드
    start_keywords = ['영양성분표', 'nutrition facts', '영양정보', '영양분석']
    end_keywords = ['원료명', 'ingredients', '알레르기', 'allergen']
    
    for line in lines:
        line_lower = line.lower()
        
        # 영양성분표 시작 확인
        if any(keyword in line_lower for keyword in start_keywords):
            in_nutrition_table = True
        
        # 영양성분표 영역에 있는 경우 라인 추가
        if in_nutrition_table:
            nutrition_table_lines.append(line)
        
        # 영양성분표 끝 확인
        if any(keyword in line_lower for keyword in end_keywords):
            in_nutrition_table = False
    
    return nutrition_table_lines

def calculate_daily_values(nutrition_data: Dict[str, float]) -> Dict[str, float]:
    """
    일일 영양소 기준치 대비 백분율 계산
    
    Args:
        nutrition_data: 영양성분 데이터
    
    Returns:
        일일 기준치 대비 백분율
    """
    # 한국 영양소 기준치 (2020 한국인 영양소 섭취기준)
    daily_values = {
        '열량': 2000,  # kcal
        '탄수화물': 325,  # g
        '단백질': 55,  # g
        '지방': 44,  # g
        '나트륨': 2000,  # mg
        '당류': 50,  # g
        '포화지방': 22,  # g
        '트랜스지방': 2,  # g
        '콜레스테롤': 300,  # mg
        '식이섬유': 25,  # g
    }
    
    percentages = {}
    
    for nutrient, value in nutrition_data.items():
        if nutrient in daily_values:
            percentage = (value / daily_values[nutrient]) * 100
            percentages[f'{nutrient}_dv'] = round(percentage, 1)
    
    return percentages
