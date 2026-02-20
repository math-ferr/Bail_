from mutagen.id3 import ID3, TIT2, TPE1, TALB, TYER, USLT, APIC, error
from mutagen.mp3 import MP3
from mutagen.flac import FLAC, Picture
import requests
from PIL import Image
import os, sys
from io import BytesIO

def download_image(url):
    """Mengunduh gambar dari URL dan mengembalikannya sebagai objek Image."""
    response = requests.get(url)
    response.raise_for_status() 
    return Image.open(BytesIO(response.content))

def process_image(image):
    """Memproses gambar: crop dari tengah, konversi ke PNG, dan mengembalikan bytes."""
    width, height = image.size
    min_dim = min(width, height)
    left = (width - min_dim) // 2
    top = (height - min_dim) // 2
    img = image.crop((left, top, left + min_dim, top + min_dim))

    img = img.convert('RGBA')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

def add_metadata_mp3(file_path, title, artist, album, year, lyrics, cover):
    try:
        audio = MP3(file_path, ID3=ID3)
    except error:
        audio = MP3(file_path)
        audio.add_tags()
    if title:
        audio.tags.add(TIT2(encoding=3, text=title))
    if artist:
        audio.tags.add(TPE1(encoding=3, text=artist))
    if album:
        audio.tags.add(TALB(encoding=3, text=album))
    if year:
        audio.tags.add(TYER(encoding=3, text=str(year)))
    if lyrics:
        audio.tags.add(USLT(encoding=3, lang='eng', desc='desc', text=lyrics))
    if cover is not None:
        with open(cover, "rb") as f:
          buffer = Image.open(BytesIO(f.read()))
          
        result = process_image(buffer)

        with open(cover, 'wb') as f:
            f.write(result)

    with open(cover, 'rb') as img:
        audio.tags.add(
            APIC(
                encoding=3,        
                mime='image/png', 
                type=3,            
                desc='Cover',
                data=img.read()
            )
        )
    
    audio.save()
    os.remove(cover)
    return "succes"

def add_metadata_flac(file_path, title, artist, album, year, url):
    """
    Menambahkan metadata ke file FLAC termasuk title, artist, album, year, dan gambar sampul.

    Parameters:
    - file_path: str, path ke file FLAC
    - title: str, judul lagu
    - artist: str, nama artis
    - album: str, nama album
    - year: str, tahun rilis
    - url: url gambar sampul (front cover)
    """
    try:
        # Membuka file FLAC
        audio = FLAC(file_path)

        # Menambahkan metadata
        audio['title'] = title
        audio['artist'] = artist
        audio['album'] = album
        audio['date'] = year

        save_path = 'cover2.png'
        image = download_image(url)
        if image is not None:
            result = process_image(image)

            with open(save_path, 'wb') as f:
                f.write(result)

        # Menambahkan gambar sampul
        with open(save_path, 'rb') as img_file:
            picture = Picture()
            picture.type = 3  # 3 adalah tipe untuk front cover
            picture.mime = 'image/jpeg' if save_path.lower().endswith('.jpg') else 'image/png'
            picture.data = img_file.read()
            audio.add_picture(picture)

        # Menyimpan perubahan
        audio.save()

    except Exception as e:
        print(f"Gagal menambahkan metadata: {e}")



if __name__ == "__main__":
  if len(sys.argv) > 1:
    file_path = sys.argv[1]
    title = sys.argv[2]
    artist = sys.argv[3]
    album = sys.argv[4]
    year = sys.argv[5]
    lyrics = sys.argv[6]
    url = sys.argv[7]
    
  result = add_metadata_mp3(str(file_path), str(title), str(artist), str(album), str(year), str(lyrics), str(url))
  print(result)
  
  