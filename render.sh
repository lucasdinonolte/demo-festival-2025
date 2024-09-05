ffmpeg -y -framerate 25 -pattern_type glob -i './tmp/frames-1/*.png' -c:v libx264 -crf 18 -pix_fmt yuv420p './dist/demo-1.mp4'
ffmpeg -y -framerate 25 -pattern_type glob -i './tmp/frames-2/*.png' -c:v libx264 -crf 18 -pix_fmt yuv420p './dist/demo-2.mp4'
ffmpeg -y -framerate 25 -pattern_type glob -i './tmp/frames-3/*.png' -c:v libx264 -crf 18 -pix_fmt yuv420p './dist/demo-3.mp4'
ffmpeg -y -framerate 25 -pattern_type glob -i './tmp/frames-4/*.png' -c:v libx264 -crf 18 -pix_fmt yuv420p './dist/demo-4.mp4'

