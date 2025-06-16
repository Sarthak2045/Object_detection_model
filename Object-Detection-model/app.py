from flask import Flask, request, render_template, jsonify, send_from_directory
import os
import json
from werkzeug.utils import secure_filename
from model import ObjectDetector

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

# Initialize object detector
detector = ObjectDetector()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_upload_folder():
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Perform object detection
        results = detector.detect_objects(filepath)
        
        if 'error' in results:
            return jsonify({'error': results['error']}), 500
        
        # Prepare response
        response = {
            'success': True,
            'original_image': f'/static/uploads/{filename}',
            'annotated_image': f'/static/uploads/{os.path.basename(results["annotated_image_path"])}' if results["annotated_image_path"] else None,
            'detected_objects': results['detected_objects'],
            'total_objects': results['total_objects']
        }
        
        return jsonify(response)
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/classes')
def get_classes():
    """Return available object classes"""
    classes = detector.get_available_classes()
    return jsonify({'classes': classes})

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    create_upload_folder()
    print("Starting Object Detection Server...")
    print("Available classes:", len(detector.get_available_classes()))
    app.run(debug=True, port=5000)