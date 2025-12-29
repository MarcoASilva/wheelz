'use client';

import { useState, useRef, useCallback } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<File | null>(null);

  // The prompt to send to the AI - leave blank for user to fill in later
  const prompt = '';

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setError(null);
    setTransformedImage(null);
    setFileName(file.name);
    imageFileRef.current = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleTransform = async () => {
    if (!imageFileRef.current) {
      setError('Please upload an image first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTransformedImage(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFileRef.current);
      formData.append('prompt', prompt);

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
    setOriginalImage(null);
    setTransformedImage(null);
    setError(null);
    setFileName(null);
    imageFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!transformedImage) return;
    
    const link = document.createElement('a');
    link.href = transformedImage;
    link.download = `transformed-${fileName || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <p className={styles.subtitle}>AI-Powered Image Transformation</p>
        </header>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Upload Section */}
          <section className={styles.uploadSection}>
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${originalImage ? styles.hasImage : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !originalImage && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className={styles.fileInput}
              />
              
              {originalImage ? (
                <div className={styles.imagePreview}>
                  <img src={originalImage} alt="Original" className={styles.previewImage} />
                  <div className={styles.imageOverlay}>
                    <span className={styles.imageLabel}>Original</span>
                    {fileName && <span className={styles.fileName}>{fileName}</span>}
                  </div>
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
                    <span className={styles.highlight}>Click to upload</span> or drag and drop
                  </p>
                  <p className={styles.dropzoneHint}>PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>
          </section>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              className={styles.transformButton}
              onClick={handleTransform}
              disabled={!originalImage || isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Transforming...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Transform Image
                </>
              )}
            </button>
            
            {originalImage && (
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
                  Transformed Result
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

