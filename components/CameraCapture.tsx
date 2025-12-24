
import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (image: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Camera access denied or not available.');
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[300] p-0 sm:p-6">
      <div className="bg-white sm:rounded-[32px] overflow-hidden shadow-4xl w-full h-full sm:h-auto sm:max-w-md flex flex-col">
        <div className="p-4 lg:p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-widest">Biometric Check</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">✕</button>
        </div>
        
        <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-10 text-center">
               <p className="text-rose-500 font-bold mb-4">{error}</p>
               <button onClick={onClose} className="bg-white text-slate-900 px-6 py-2 rounded-xl font-black uppercase text-xs">Return</button>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover scale-x-[-1]" 
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute inset-0 pointer-events-none border-[30px] lg:border-[60px] border-black/20 flex items-center justify-center">
             <div className="w-64 h-80 lg:w-72 lg:h-96 border-2 border-dashed border-blue-500/50 rounded-[100px] shadow-[0_0_100px_rgba(37,99,235,0.2)]"></div>
          </div>
        </div>
        
        <div className="p-6 lg:p-8 flex flex-col sm:flex-row gap-4 bg-white">
          <button 
            onClick={takePhoto}
            disabled={!!error}
            className="w-full flex-1 bg-blue-600 text-white font-black py-4 lg:py-5 rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
          >
            Capture Identity
          </button>
          <button onClick={onClose} className="w-full sm:w-auto px-8 py-4 lg:py-5 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-xs">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
