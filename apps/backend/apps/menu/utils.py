import io
import os

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile
from PIL import Image


def optimize_image_to_webp(
    image_file: UploadedFile,
    max_size: tuple[int, int] = (800, 800),
    quality: int = 80,
) -> ContentFile:
    """
    Optimizes and converts uploaded image to WebP format (BR-PROD-006).
    Resizes image maintaining aspect ratio within max_size and compresses as WebP.
    """
    img = Image.open(image_file)

    # Convert RGBA / P mode images to RGB if needed, or preserve RGBA for transparency
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")

    # Resize if larger than max_size
    img.thumbnail(max_size, Image.Resampling.LANCZOS)

    output = io.BytesIO()
    img.save(output, format="WEBP", quality=quality, method=6)
    output.seek(0)

    # Replace filename extension with .webp
    base_name, _ = os.path.splitext(image_file.name or "image")
    webp_filename = f"{base_name}.webp"

    return ContentFile(output.read(), name=webp_filename)
