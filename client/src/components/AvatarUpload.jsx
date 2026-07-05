import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function centerInitialCrop(width, height) {
  const size = Math.min(width, height) * 0.8;
  return {
    unit: 'px',
    x: (width - size) / 2,
    y: (height - size) / 2,
    width: size,
    height: size,
  };
}

const CameraCapture = ({ onCapture, onClose }) => {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        alert(t('Camera access denied or not available'));
        onClose();
      }
    })();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onClose]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL('image/jpeg', 0.92));
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const handleRetake = async () => {
    setCaptured(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      onClose();
    }
  };

  const handleUsePhoto = () => {
    const byteString = atob(captured.split(',')[1]);
    const mimeString = 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' });
    onCapture(file);
  };

  if (captured) {
    return (
      <div className="fixed inset-0 z-[110] bg-black flex flex-col">
        <img src={captured} alt="Captured" className="flex-1 object-contain p-4" />
        <div className="flex items-center justify-center gap-6 p-6 bg-black/80">
          <button type="button" onClick={handleRetake}
            className="px-8 py-3 rounded-full bg-white/10 text-white text-base font-semibold hover:bg-white/20 transition">
            {t('Retake')}
          </button>
          <button type="button" onClick={handleUsePhoto}
            className="px-8 py-3 rounded-full bg-red-600 text-white text-base font-semibold hover:bg-red-500 shadow-lg transition">
            {t('Use Photo')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col">
      <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex items-center justify-center gap-6 p-6 bg-black/80">
        <button type="button" onClick={onClose}
          className="px-8 py-3 rounded-full bg-white/10 text-white text-base font-semibold hover:bg-white/20 transition">
          {t('Cancel')}
        </button>
        <button type="button" onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition"
          aria-label={t('Take photo')}>
          <div className="w-16 h-16 rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
};

const AvatarUpload = () => {
  const { user, updateAvatar } = useAuth();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerInitialCrop(width, height));
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(t('Image must be smaller than 10MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImgSrc(e.target.result);
      setCompletedCrop(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (file) => {
    setShowCamera(false);
    handleFile(file);
  };

  const handleFileSelect = (e) => handleFile(e.target.files?.[0]);

  const getCroppedImg = () => {
    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const cropData = completedCrop || crop;

    canvas.width = cropData.width * scaleX;
    canvas.height = cropData.height * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      image,
      cropData.x * scaleX,
      cropData.y * scaleY,
      cropData.width * scaleX,
      cropData.height * scaleY,
      0, 0,
      cropData.width * scaleX,
      cropData.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleSave = async () => {
    if (!completedCrop && !crop) return;
    setUploading(true);
    try {
      const cropped = await getCroppedImg();
      const result = await updateAvatar(cropped);
      if (result.success) {
        setImgSrc(null);
        setCrop(null);
        setCompletedCrop(null);
      } else {
        alert(result.message || t('Failed to upload avatar'));
      }
    } catch {
      alert(t('Failed to crop image'));
    }
    setUploading(false);
  };

  const handleCancelCrop = () => {
    setImgSrc(null);
    setCrop(null);
    setCompletedCrop(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-red-100 to-red-200 border-4 border-white shadow-lg">
          {user?.avatar && !imgSrc ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => setShowCamera(true)}
          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t('Camera')}
        </button>

        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {t('Upload')}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>

      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      {imgSrc && !showCamera && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('Crop Profile Photo')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('Drag to adjust the crop area')}</p>
            <div className="max-h-[60vh] overflow-auto rounded-xl bg-gray-100">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img ref={imageRef} src={imgSrc} alt="Crop preview" onLoad={onImageLoad} className="max-w-full" />
              </ReactCrop>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={handleCancelCrop} className="btn-secondary flex-1 py-3 text-sm" disabled={uploading}>
                {t('Cancel')}
              </button>
              <button type="button" onClick={handleSave} disabled={uploading || !crop}
                className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                {uploading && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {uploading ? t('Saving...') : t('Save Photo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
