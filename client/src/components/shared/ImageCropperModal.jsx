import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropImage';
import { Button } from '@/components/ui/button';

export default function ImageCropperModal({ imageSrc, onCropComplete, onCancel, aspectRatio = 1 }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [cropping, setCropping] = useState(false);

    const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        try {
            setCropping(true);
            const croppedImageBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                0
            );
            onCropComplete(croppedImageBlob);
        } catch (e) {
            console.error(e);
        } finally {
            setCropping(false);
        }
    }, [imageSrc, croppedAreaPixels, onCropComplete]);

    if (!imageSrc) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-6 relative">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Crop Image</h2>
                </div>
                <div className="relative w-full h-[400px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={setCrop}
                        onCropComplete={handleCropComplete}
                        onZoomChange={setZoom}
                        classes={{ containerClassName: 'rounded-2xl' }}
                    />
                </div>
                <div className="flex justify-between items-center gap-4">
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => {
                            setZoom(e.target.value)
                        }}
                        className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div className="flex justify-end gap-3 mt-2">
                    <Button variant="outline" onClick={onCancel} className="rounded-xl font-bold h-10 px-6">Cancel</Button>
                    <Button onClick={showCroppedImage} disabled={cropping} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-10 px-6">
                        {cropping ? 'Cropping...' : 'Confirm & Crop'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
