#!/usr/bin/env python3
"""
이미지 압축 스크립트
GitHub Issues 업로드를 위해 이미지를 10MB 이하로 압축합니다.
"""

from PIL import Image
import os

def compress_image(input_path, output_path, max_size_mb=9):
    """
    이미지를 압축하여 지정된 크기 이하로 만듭니다.
    
    Args:
        input_path: 원본 이미지 경로
        output_path: 압축된 이미지 저장 경로
        max_size_mb: 최대 파일 크기 (MB)
    """
    # 이미지 열기
    img = Image.open(input_path)
    
    # EXIF 데이터 유지하면서 RGB 모드로 변환
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGB')
    
    # 초기 품질 설정
    quality = 95
    
    # 이미지 크기 최적화 (가로 1920px 이하로)
    max_width = 1920
    if img.width > max_width:
        ratio = max_width / img.width
        new_size = (max_width, int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # 품질을 점진적으로 낮춰가며 크기 확인
    while quality > 20:
        img.save(output_path, 'JPEG', quality=quality, optimize=True)
        
        # 파일 크기 확인 (MB)
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        
        if file_size_mb <= max_size_mb:
            print(f"✓ {os.path.basename(output_path)}: {file_size_mb:.2f}MB (품질: {quality})")
            return True
        
        quality -= 5
    
    print(f"⚠ {os.path.basename(output_path)}: 압축 실패 (최종: {file_size_mb:.2f}MB)")
    return False

def main():
    images_dir = 'images'
    
    # 압축이 필요한 파일들 (10MB 초과)
    large_files = [
        'qntks.jpg',      # 14.53 MB
        'skatks.jpg',     # 15.13 MB
        'wpwn.jpg'        # 15.43 MB
    ]
    
    print("🖼️  이미지 압축 시작...\n")
    
    success_count = 0
    for filename in large_files:
        input_path = os.path.join(images_dir, filename)
        output_path = input_path  # 같은 파일에 덮어쓰기
        
        if not os.path.exists(input_path):
            print(f"✗ {filename}: 파일을 찾을 수 없습니다")
            continue
        
        # 원본 크기 출력
        original_size = os.path.getsize(input_path) / (1024 * 1024)
        print(f"압축 중: {filename} ({original_size:.2f}MB)")
        
        # 압축 실행
        if compress_image(input_path, output_path, max_size_mb=9):
            success_count += 1
            
            # 압축 후 크기
            new_size = os.path.getsize(output_path) / (1024 * 1024)
            reduction = ((original_size - new_size) / original_size) * 100
            print(f"  → 압축 완료! {new_size:.2f}MB (감소: {reduction:.1f}%)\n")
        else:
            print(f"  → 압축 실패\n")
    
    print(f"\n✅ 완료: {success_count}/{len(large_files)}개 파일 압축 성공")
    print("\n이제 GitHub Issues에 업로드할 수 있습니다!")

if __name__ == '__main__':
    main()






































