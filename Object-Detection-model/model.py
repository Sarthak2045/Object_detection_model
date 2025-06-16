import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image
import os

class ObjectDetector:
    def __init__(self):
        # Load pre-trained YOLOv8 model
        self.model = YOLO('yolov8n.pt')  # nano version for faster inference
        
    def detect_objects(self, image_path):
        """
        Detect objects in an image and return results with bounding boxes
        """
        try:
            # Run inference
            results = self.model(image_path)
            
            # Load original image
            image = cv2.imread(image_path)
            
            detected_objects = []
            
            # Process results
            for r in results:
                boxes = r.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        
                        # Get confidence score
                        confidence = box.conf[0].cpu().numpy()
                        
                        # Get class name
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = self.model.names[class_id]
                        
                        # Only include detections with confidence > 0.5
                        if confidence > 0.5:
                            detected_objects.append({
                                'class': class_name,
                                'confidence': float(confidence),
                                'bbox': [int(x1), int(y1), int(x2), int(y2)]
                            })
                            
                            # Draw bounding box on image
                            cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                            
                            # Add label
                            label = f"{class_name}: {confidence:.2f}"
                            cv2.putText(image, label, (int(x1), int(y1)-10), 
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Save annotated image
            output_path = image_path.replace('.', '_detected.')
            cv2.imwrite(output_path, image)
            
            return {
                'detected_objects': detected_objects,
                'annotated_image_path': output_path,
                'total_objects': len(detected_objects)
            }
            
        except Exception as e:
            print(f"Error in object detection: {str(e)}")
            return {
                'detected_objects': [],
                'annotated_image_path': None,
                'total_objects': 0,
                'error': str(e)
            }
    
    def get_available_classes(self):
        """
        Return list of classes that the model can detect
        """
        return list(self.model.names.values())