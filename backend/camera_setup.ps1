# Laptop (Integrated Camera)
ffmpeg `
  -f dshow `
  -pixel_format yuyv422 `
  -video_size 640x480 `
  -framerate 30 `
  -i video="Integrated Camera" `
  -c:v libx264 `
  -pix_fmt yuv420p `
  -preset ultrafast `
  -tune zerolatency `
  -g 30 `
  -keyint_min 30 `
  -sc_threshold 0 `
  -rtsp_transport tcp `
  -f rtsp `
  rtsp://127.0.0.1:8554/logitech