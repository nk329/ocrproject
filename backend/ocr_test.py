from main import preprocess_image, reader
import os

# 경로 수정: 상대경로 또는 절대경로 둘 다 가능
image_path = "uploads/label_sample.png"
# image_path = r"C:\Users\PC2412\ocrservice\backend\uploads\label_sample.png"  # 절대경로도 OK

# 존재 여부 체크
print(" 파일 존재 확인:", os.path.exists(image_path))

# 전처리 후 OCR
processed = preprocess_image(image_path)

if processed is not None:
    result = reader.readtext(processed, detail=0)
    print(" OCR 결과:")
    for line in result:
        print("-", line)
else:
    print(" 이미지 전처리에 실패했습니다. 경로 또는 파일 확인!")
