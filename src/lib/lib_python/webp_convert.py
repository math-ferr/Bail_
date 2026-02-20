import base64
from PIL import Image, ImageSequence
import os
import subprocess
import io
import ffmpeg
import requests
import sys
import json

__dirname = os.path.dirname(__file__)
__tmp_dir = os.path.join(__dirname, 'tmp')
__output_dir = os.path.join(__dirname, 'media')

os.makedirs(__tmp_dir, exist_ok=True)
os.makedirs(__output_dir, exist_ok=True)

def webp_convert(input_webp, frame='all'):
    if isinstance(input_webp, str):
        if input_webp.startswith('http://') or input_webp.startswith('https://'):
            response = requests.get(input_webp)
            if response.status_code == 200:
                img = Image.open(io.BytesIO(response.content))
            else:
                raise ValueError(f"Failed to download image from URL: {input_webp}")
        else:
            img = Image.open(input_webp)
    elif isinstance(input_webp, (bytes, bytearray)):
        img = Image.open(io.BytesIO(input_webp))
    elif isinstance(input_webp, io.BytesIO):
        img = Image.open(input_webp)
    else:
        raise TypeError("Unsupported input type. Must be file path, URL, bytes, bytearray, or BytesIO buffer.")

    frame_files = []
    frame_durations = []
    frame_num = 0
    total_duration = 0
    file_name = os.urandom(6).hex()

    def save_frame(Img, frame_num, _dir=__tmp_dir):
        frame_path = os.path.join(_dir, f"{file_name}_{frame_num:04d}.png")
        Img.save(frame_path, 'PNG')
        return frame_path

    if isinstance(frame, int):
        for i, Img in enumerate(ImageSequence.Iterator(img)):
            if i == frame:
                imageR = save_frame(Img, i, __output_dir)
                buffer = io.BytesIO()
                with open(imageR, 'rb') as f:
                    buffer.write(f.read())
                buffer.seek(0)
                os.remove(imageR)
                
                base64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
                return {"buffer": base64_data}
        return None
    
    for Img in ImageSequence.Iterator(img):
        frame_files.append(save_frame(Img, frame_num))
        duration = img.info.get('duration', 100)
        frame_durations.append(duration)
        total_duration += duration
        frame_num += 1

    if frame == 'all' and frame_num > 1:
        average_duration = total_duration / frame_num
        fps = 1000 / average_duration 
        
        temp_video_file = os.path.join(__tmp_dir, f"{file_name}.mp4")
        
        ffmpeg_command = [
            'ffmpeg',
            '-r', str(fps),
            '-i', os.path.join(__tmp_dir, f'{file_name}_%04d.png'),
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            temp_video_file
        ]
        
        process = subprocess.run(ffmpeg_command, capture_output=True, text=True)

        if process.returncode != 0:
            print("Error:", process.stderr)
            return None
        
        with open(temp_video_file, 'rb') as f:
            video_buffer = io.BytesIO(f.read())
        
        base64_data = base64.b64encode(video_buffer.getvalue()).decode('utf-8')
        for i in range(frame_num):
          target = os.path.join(__tmp_dir, f"{file_name}_{i:04d}.png")
          if os.path.exists(target):
            os.remove(target)
            
        os.remove(temp_video_file)

        return base64_data

    image = frame_files[0] if frame_files else None
    if image:
        buffer = io.BytesIO()
        with open(image, 'rb') as f:
            buffer.write(f.read())
        buffer.seek(0)
        os.remove(image)
        
        base64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return base64_data

    return None
    
if __name__ == "__main__":
  if len(sys.argv) > 1:
    arg = sys.argv[1]
  result = webp_convert(str(arg))
  print(result)
  
  