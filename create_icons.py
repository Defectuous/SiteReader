#!/usr/bin/env python3
"""
Create placeholder PNG icons for SiteReader Chrome extension
Requires: PIL/Pillow library

Install with: pip install pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a gradient icon with 'SR' text"""
    # Create image with gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Create purple-to-blue gradient manually
    for y in range(size):
        ratio = y / size
        r = int(102 + (118 - 102) * ratio)  # 102 to 118
        g = int(126 + (75 - 126) * ratio)   # 126 to 75
        b = int(234 + (162 - 234) * ratio)  # 234 to 162
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Draw rounded rectangle (approximate with circle corners)
    corner_radius = max(2, size // 8)
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=corner_radius,
        outline=(102, 126, 234, 255),
        width=0
    )
    
    # Draw "SR" text
    font_size = max(8, size // 3)
    try:
        # Try to use a nice font
        font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Calculate text position (centered)
    text = "SR"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - font_size // 6
    
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # Draw play button symbol
    play_size = max(2, size // 12)
    play_y = size - play_size - 4
    play_x = (size - play_size) // 2
    
    # Triangle play button
    points = [
        (play_x, play_y),
        (play_x, play_y + play_size),
        (play_x + play_size, play_y + play_size // 2)
    ]
    draw.polygon(points, fill=(255, 255, 255, 255))
    
    return img

if __name__ == "__main__":
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("ERROR: PIL/Pillow not installed!")
        print("Install with: pip install pillow")
        print("\nAlternatively, download icons from:")
        print("  - https://www.flaticon.com/")
        print("  - https://www.icoconverter.com/")
        print("\nOr create manually using:")
        print("  - Figma (free)")
        print("  - Photoshop")
        print("  - GIMP (free)")
        exit(1)
    
    print("Creating SiteReader extension icons...")
    
    try:
        # Create icons
        icon_128 = create_icon(128, "icon-128.png")
        icon_48 = create_icon(48, "icon-48.png")
        icon_16 = create_icon(16, "icon-16.png")
        
        # Save icons
        icon_dir = os.path.dirname(os.path.abspath(__file__)) or "."
        icon_128.save(os.path.join(icon_dir, "icons", "icon-128.png"))
        icon_48.save(os.path.join(icon_dir, "icons", "icon-48.png"))
        icon_16.save(os.path.join(icon_dir, "icons", "icon-16.png"))
        
        print("✓ icon-128.png created (128x128)")
        print("✓ icon-48.png created (48x48)")
        print("✓ icon-16.png created (16x16)")
        print("\nIcons saved successfully! You can now load the extension in Chrome.")
        
    except Exception as e:
        print(f"ERROR: Could not create icons: {e}")
        print("\nManual alternative:")
        print("1. Download a book/speaker icon from https://www.flaticon.com/")
        print("2. Resize to 16x16, 48x48, and 128x128 pixels")
        print("3. Save as PNG in the icons/ directory")
