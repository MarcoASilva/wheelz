'use client';

import { useState, useRef, useCallback } from 'react';
import styles from './page.module.css';

interface ImageState {
  image: string | null;
  fileName: string | null;
  isDragging: boolean;
  file: File | null;
}

export default function Home() {
  const [carImage, setCarImage] = useState<ImageState>({
    image: null,
    fileName: null,
    isDragging: false,
    file: null,
  });
  const [wheelzImage, setWheelzImage] = useState<ImageState>({
    image: null,
    fileName: null,
    isDragging: false,
    file: null,
  });
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const carInputRef = useRef<HTMLInputElement>(null);
  const wheelzInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File, type: 'car' | 'wheelz') => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setError(null);
    setTransformedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      if (type === 'car') {
        setCarImage({
          image: imageData,
          fileName: file.name,
          isDragging: false,
          file: file,
        });
      } else {
        setWheelzImage({
          image: imageData,
          fileName: file.name,
          isDragging: false,
          file: file,
        });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'car' | 'wheelz') => {
    e.preventDefault();
    if (type === 'car') {
      setCarImage(prev => ({ ...prev, isDragging: false }));
    } else {
      setWheelzImage(prev => ({ ...prev, isDragging: false }));
    }
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file, type);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent, type: 'car' | 'wheelz') => {
    e.preventDefault();
    if (type === 'car') {
      setCarImage(prev => ({ ...prev, isDragging: true }));
    } else {
      setWheelzImage(prev => ({ ...prev, isDragging: true }));
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, type: 'car' | 'wheelz') => {
    e.preventDefault();
    if (type === 'car') {
      setCarImage(prev => ({ ...prev, isDragging: false }));
    } else {
      setWheelzImage(prev => ({ ...prev, isDragging: false }));
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'car' | 'wheelz') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, type);
    }
  }, [handleFileSelect]);

  const handleTransform = async () => {
    if (!carImage.file) {
      setError('Please upload a car image first');
      return;
    }
    if (!wheelzImage.file) {
      setError('Please upload a wheelz image first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTransformedImage(null);

    try {
      const formData = new FormData();
      formData.append('carImage', carImage.file);
      formData.append('wheelzImage', wheelzImage.file);

      const response = await fetch('/api/transform', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transform image');
      }

      if (data.success && data.image) {
        const imageUrl = `data:${data.image.mimeType};base64,${data.image.data}`;
        setTransformedImage(imageUrl);
      } else {
        throw new Error(data.error || 'No image returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCarImage({ image: null, fileName: null, isDragging: false, file: null });
    setWheelzImage({ image: null, fileName: null, isDragging: false, file: null });
    setTransformedImage(null);
    setError(null);
    if (carInputRef.current) carInputRef.current.value = '';
    if (wheelzInputRef.current) wheelzInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!transformedImage) return;
    
    const link = document.createElement('a');
    link.href = transformedImage;
    link.download = `wheelz-transformed-${carImage.fileName || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const bothImagesUploaded = carImage.image && wheelzImage.image;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
                <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="2"/>
                <circle cx="16" cy="16" r="3" fill="currentColor"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="26" x2="16" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="2" y1="16" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="26" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className={styles.title}>Wheelz</h1>
          </div>
          <p className={styles.subtitle}>AI-Powered Wheel Swap Magic</p>
        </header>

        {/* Instructions */}
        <div className={styles.instructions}>
          <div className={styles.instructionStep}>
            <span className={styles.stepNumber}>1</span>
            <span>Upload your car photo</span>
          </div>
          <div className={styles.instructionArrow}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.instructionStep}>
            <span className={styles.stepNumber}>2</span>
            <span>Upload the new wheels</span>
          </div>
          <div className={styles.instructionArrow}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.instructionStep}>
            <span className={styles.stepNumber}>3</span>
            <span>Transform!</span>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Upload Sections */}
          <div className={styles.uploadGrid}>
            {/* Car Image Upload */}
            <section className={styles.uploadSection}>
              <div className={styles.uploadLabel}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8L5.5 4H18.5L21 8M3 8V18C3 19 4 20 5 20H19C20 20 21 19 21 18V8M3 8H21M7 14H7.01M17 14H17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Car</span>
              </div>
              <p className={styles.uploadHint}>Your vehicle photo</p>
              <div
                className={`${styles.dropzone} ${carImage.isDragging ? styles.dragging : ''} ${carImage.image ? styles.hasImage : ''}`}
                onDrop={(e) => handleDrop(e, 'car')}
                onDragOver={(e) => handleDragOver(e, 'car')}
                onDragLeave={(e) => handleDragLeave(e, 'car')}
                onClick={() => !carImage.image && carInputRef.current?.click()}
              >
                <input
                  ref={carInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleInputChange(e, 'car')}
                  className={styles.fileInput}
                />
                
                {carImage.image ? (
                  <div className={styles.imagePreview}>
                    <img src={carImage.image} alt="Car" className={styles.previewImage} />
                    <button 
                      className={styles.changeImageButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        carInputRef.current?.click();
                      }}
                    >
                      Change
                    </button>
                    {carImage.fileName && <span className={styles.fileName}>{carImage.fileName}</span>}
                  </div>
                ) : (
                  <div className={styles.dropzoneContent}>
                    <div className={styles.uploadIcon}>
                      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 32V16M24 16L18 22M24 16L30 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 32V36C8 38.2091 9.79086 40 12 40H36C38.2091 40 40 38.2091 40 36V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className={styles.dropzoneText}>
                      <span className={styles.highlight}>Click to upload</span> or drag
                    </p>
                    <p className={styles.dropzoneHintSmall}>PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
            </section>

            {/* Swap Icon */}
            <div className={styles.swapIcon}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 16L3 12M3 12L7 8M3 12H21M17 8L21 12M21 12L17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Wheelz Image Upload */}
            <section className={styles.uploadSection}>
              <div className={styles.uploadLabel}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                </svg>
                <span>Wheelz</span>
              </div>
              <p className={styles.uploadHint}>The wheels to swap in</p>
              <div
                className={`${styles.dropzone} ${wheelzImage.isDragging ? styles.dragging : ''} ${wheelzImage.image ? styles.hasImage : ''}`}
                onDrop={(e) => handleDrop(e, 'wheelz')}
                onDragOver={(e) => handleDragOver(e, 'wheelz')}
                onDragLeave={(e) => handleDragLeave(e, 'wheelz')}
                onClick={() => !wheelzImage.image && wheelzInputRef.current?.click()}
              >
                <input
                  ref={wheelzInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleInputChange(e, 'wheelz')}
                  className={styles.fileInput}
                />
                
                {wheelzImage.image ? (
                  <div className={styles.imagePreview}>
                    <img src={wheelzImage.image} alt="Wheelz" className={styles.previewImage} />
                    <button 
                      className={styles.changeImageButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        wheelzInputRef.current?.click();
                      }}
                    >
                      Change
                    </button>
                    {wheelzImage.fileName && <span className={styles.fileName}>{wheelzImage.fileName}</span>}
                  </div>
                ) : (
                  <div className={styles.dropzoneContent}>
                    <div className={styles.uploadIcon}>
                      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 32V16M24 16L18 22M24 16L30 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 32V36C8 38.2091 9.79086 40 12 40H36C38.2091 40 40 38.2091 40 36V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className={styles.dropzoneText}>
                      <span className={styles.highlight}>Click to upload</span> or drag
                    </p>
                    <p className={styles.dropzoneHintSmall}>PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              className={styles.transformButton}
              onClick={handleTransform}
              disabled={!bothImagesUploaded || isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Swapping Wheels...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Swap Wheels
                </>
              )}
            </button>
            
            {(carImage.image || wheelzImage.image) && (
              <button className={styles.resetButton} onClick={handleReset}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C8.5 3 5.5 5 4 8M4 8V3M4 8H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reset
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className={styles.error}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Result Section */}
          {transformedImage && (
            <section className={styles.resultSection}>
              <div className={styles.resultHeader}>
                <h2 className={styles.resultTitle}>
                  <span className={styles.sparkle}>✨</span>
                  New Wheels Installed!
                </h2>
                <button className={styles.downloadButton} onClick={handleDownload}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3V16M12 16L8 12M12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 17V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Download
                </button>
              </div>
              <div className={styles.resultImage}>
                <img src={transformedImage} alt="Transformed" />
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>Powered by Google AI Studio</p>
        </footer>
      </div>
    </main>
  );
}
