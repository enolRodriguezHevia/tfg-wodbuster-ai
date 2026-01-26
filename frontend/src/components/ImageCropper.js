import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import './ImageCropper.css';

const ImageCropper = ({ image, onComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleComplete = () => {
    onComplete(croppedAreaPixels);
  };

  return (
    <div className="cropper-modal">
      <div className="cropper-container">
        <h3>Ajustar Imagen</h3>
        <div className="cropper-area">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div className="cropper-controls">
          <div className="zoom-control">
            <label>Zoom:</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(e.target.value)}
            />
          </div>
          <div className="cropper-buttons">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className="confirm-btn" onClick={handleComplete}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
