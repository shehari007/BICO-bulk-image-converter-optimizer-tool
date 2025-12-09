import { message } from 'antd';
import JSZip from 'jszip';

const sharp = window.require('sharp');
const { ipcRenderer } = window.require('electron');
const path = window.require('path');
const fs = window.require('fs');

// Conversion control - allows pause/stop
let conversionController = {
    isPaused: false,
    isStopped: false,
};

// Export control functions
export function pauseConversion() {
    conversionController.isPaused = true;
}

export function resumeConversion() {
    conversionController.isPaused = false;
}

export function stopConversion() {
    conversionController.isStopped = true;
    conversionController.isPaused = false;
}

export function resetConversionController() {
    conversionController.isPaused = false;
    conversionController.isStopped = false;
}

// Wait while paused
async function waitIfPaused() {
    while (conversionController.isPaused && !conversionController.isStopped) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return !conversionController.isStopped;
}

// Estimate output size based on format and quality
export function estimateOutputSize(originalSize, data) {
    const quality = parseInt(data.quality) || 80;
    const format = data.type || 'jpg';
    
    // Compression ratios are estimates based on typical results
    const compressionRatios = {
        avif: quality < 50 ? 0.08 : quality < 80 ? 0.15 : 0.25,
        webp: quality < 50 ? 0.15 : quality < 80 ? 0.25 : 0.40,
        jpg: quality < 50 ? 0.20 : quality < 80 ? 0.35 : 0.60,
        jpeg: quality < 50 ? 0.20 : quality < 80 ? 0.35 : 0.60,
        png: data.compression > 6 ? 0.70 : 0.85,
        gif: 0.80,
        tiff: data.compType === 'lzw' ? 0.60 : 1.0,
        heif: quality < 50 ? 0.10 : quality < 80 ? 0.18 : 0.30,
    };
    
    const ratio = compressionRatios[format] || 0.50;
    
    // Adjust for MozJPEG
    let adjustedRatio = ratio;
    if ((format === 'jpg' || format === 'jpeg') && data.mozjpeg) {
        adjustedRatio *= 0.85;
    }
    
    // Adjust for lossless
    if (data.losscomp && (format === 'webp' || format === 'avif')) {
        adjustedRatio = 0.90;
    }
    
    return Math.round(originalSize * adjustedRatio);
}

// Process images in parallel batches for better performance
async function processBatch(files, data, startIndex, onProgress) {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
        // Check if stopped
        if (conversionController.isStopped) {
            break;
        }
        
        // Wait if paused
        const shouldContinue = await waitIfPaused();
        if (!shouldContinue) break;
        
        const file = files[i];
        const index = startIndex + i;
        
        try {
            const result = await processImage(file, data);
            onProgress(index, 'Completed', result);
            results.push({ success: true, ...result });
        } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            onProgress(index, 'Failed', null);
            results.push({ success: false, name: file.name, error: error.message });
        }
    }
    
    return results;
}

// Process a single image with all Sharp optimizations
async function processImage(file, data) {
    const fileBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(fileBuffer);

    // Get original file info
    const metadata = await sharp(inputBuffer).metadata();
    const originalSize = inputBuffer.length;

    // Build format-specific configuration
    const formatConfig = buildFormatConfig(data);

    // Create Sharp pipeline with optimizations
    let pipeline = sharp(inputBuffer, {
        animated: data.animate,
        limitInputPixels: false, // Allow large images
        sequentialRead: true, // Memory optimization
    });

    // Apply resize if needed
    if (!data.dimensions && (data.width || data.height)) {
        pipeline = pipeline.resize({
            width: data.width ? parseInt(data.width) : undefined,
            height: data.height ? parseInt(data.height) : undefined,
            fit: 'fill',
            withoutEnlargement: false,
        });
    }

    // Apply rotation
    if (data.orientation && data.orientation !== 0) {
        pipeline = pipeline.rotate(data.orientation);
    }

    // Apply flip/flop
    if (data.flip) {
        pipeline = pipeline.flip();
    }
    if (data.flop) {
        pipeline = pipeline.flop();
    }

    // Apply effects
    if (data.grayscale) {
        pipeline = pipeline.grayscale();
    }

    if (data.normalize) {
        pipeline = pipeline.normalize();
    }

    if (data.sharpen) {
        const sigma = data.sharpenAmount || 1;
        pipeline = pipeline.sharpen({ sigma });
    }

    if (data.blur && data.blurAmount > 0.3) {
        pipeline = pipeline.blur(data.blurAmount);
    }

    if (data.gamma) {
        pipeline = pipeline.gamma(data.gammaValue || 2.2);
    }

    // Handle metadata
    if (!data.preserveMetadata) {
        pipeline = pipeline.withMetadata({ orientation: undefined });
    } else {
        pipeline = pipeline.withMetadata();
    }

    // Convert to target format
    pipeline = pipeline.toFormat(data.type || 'jpg', formatConfig);

    // Process and get buffer
    const processedBuffer = await pipeline.toBuffer();

    // Generate output filename
    const fileNameParts = file.name.split('.');
    const fileNameWithoutExtension = fileNameParts.slice(0, -1).join('.') || fileNameParts[0];
    const suffix = data.suffix || '';
    const outputName = `${fileNameWithoutExtension}${suffix}.${data.type}`;

    return {
        name: outputName,
        buffer: processedBuffer,
        originalSize,
        newSize: processedBuffer.length,
        metadata: {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
        },
    };
}

// Build format-specific configuration
function buildFormatConfig(data) {
    const type = data.type || 'jpg';
    const quality = parseInt(data.quality) || 80;

    const configs = {
        jpg: {
            quality,
            mozjpeg: data.mozjpeg || false,
            progressive: data.progressive || false,
            chromaSubsampling: quality >= 90 ? '4:4:4' : '4:2:0',
            trellisQuantisation: data.mozjpeg,
            overshootDeringing: data.mozjpeg,
            optimizeScans: data.mozjpeg,
        },
        jpeg: {
            quality,
            mozjpeg: data.mozjpeg || false,
            progressive: data.progressive || false,
            chromaSubsampling: quality >= 90 ? '4:4:4' : '4:2:0',
        },
        png: {
            compressionLevel: parseInt(data.compression) || 8,
            progressive: data.progressive || false,
            adaptiveFiltering: true,
            palette: quality < 80, // Use palette for lower quality
        },
        webp: {
            quality,
            lossless: data.losscomp || false,
            nearLossless: quality > 90 && !data.losscomp,
            smartSubsample: true,
            effort: 6, // 0-6, higher = smaller file, slower
        },
        avif: {
            quality,
            lossless: data.losscomp || false,
            effort: 5, // 0-9, higher = smaller file, slower
            chromaSubsampling: quality >= 90 ? '4:4:4' : '4:2:0',
        },
        tiff: {
            quality,
            compression: data.compType || 'none',
            predictor: data.compType === 'lzw' ? 'horizontal' : 'none',
        },
        gif: {
            progressive: data.progressive || false,
            effort: 7,
        },
        heif: {
            quality,
            compression: 'av1',
            effort: 5,
        },
    };

    return configs[type] || configs.jpg;
}

// Main export function
export async function processImages(fileList, data, setStatus, setCountPerc, outputMode = 'zip', outputFolder = '') {
    // Reset controller at start
    resetConversionController();
    
    const processedImages = [];
    const failedImages = [];
    const totalFiles = fileList.length;
    const concurrency = data.concurrency || 4;
    let wasStopped = false;

    // Progress callback
    const onProgress = (index, status, result) => {
        setStatus(prev => {
            const updated = [...prev];
            updated[index] = status;
            return updated;
        });

        const completed = processedImages.length + failedImages.length + 1;
        const percent = Math.min(Math.floor((completed / totalFiles) * 100), 99);
        setCountPerc(percent);
    };

    // Process in batches
    for (let i = 0; i < totalFiles; i += concurrency) {
        // Check if stopped
        if (conversionController.isStopped) {
            wasStopped = true;
            break;
        }
        
        // Wait if paused
        const shouldContinue = await waitIfPaused();
        if (!shouldContinue) {
            wasStopped = true;
            break;
        }
        
        const batch = fileList.slice(i, Math.min(i + concurrency, totalFiles));
        const results = await processBatch(batch, data, i, onProgress);

        results.forEach(result => {
            if (result.success) {
                processedImages.push(result);
            } else {
                failedImages.push(result);
            }
        });
    }

    // If stopped early, mark remaining as skipped
    if (wasStopped) {
        message.warning('Conversion stopped by user.');
    }

    setCountPerc(100);

    // Calculate total savings
    const totalOriginal = processedImages.reduce((sum, img) => sum + img.originalSize, 0);
    const totalNew = processedImages.reduce((sum, img) => sum + img.newSize, 0);
    const savings = totalOriginal > 0 ? ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1) : 0;

    // Only save if we have processed images
    if (processedImages.length > 0) {
        // Show notification
        ipcRenderer.send('show-notification', {
            title: 'Conversion Complete',
            body: `${processedImages.length} images processed. ${savings > 0 ? `Saved ${savings}% space` : ''}`
        });

        // Save output based on mode
        if (outputMode === 'folder' && outputFolder) {
            await saveToFolder(processedImages, outputFolder);
            message.success(`${processedImages.length} images saved to folder!`);
        } else {
            await saveAsZip(processedImages);
            message.success(`${processedImages.length} images zipped successfully!`);
        }
    }

    // Report failures if any
    if (failedImages.length > 0) {
        message.warning(`${failedImages.length} images failed to process.`);
    }

    return {
        processed: processedImages.length,
        failed: failedImages.length,
        skipped: wasStopped ? totalFiles - processedImages.length - failedImages.length : 0,
        savings: parseFloat(savings),
        totalOriginal,
        totalNew,
        wasStopped,
    };
}

// Save processed images to a folder
async function saveToFolder(images, folderPath) {
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    for (const image of images) {
        const filePath = path.join(folderPath, image.name);
        
        // Handle duplicate names
        let finalPath = filePath;
        let counter = 1;
        while (fs.existsSync(finalPath)) {
            const ext = path.extname(image.name);
            const baseName = path.basename(image.name, ext);
            finalPath = path.join(folderPath, `${baseName}_${counter}${ext}`);
            counter++;
        }

        fs.writeFileSync(finalPath, image.buffer);
    }
}

// Save as ZIP file
async function saveAsZip(images) {
    const zip = new JSZip();

    for (const image of images) {
        zip.file(image.name, image.buffer);
    }

    // Generate with best compression
    const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });

    const zipUrl = URL.createObjectURL(zipBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = zipUrl;
    downloadLink.download = `converted_images_${Date.now()}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
}

// Export individual image process function for preview
export async function processImagePreview(file, data) {
    const result = await processImage(file, data);
    return {
        buffer: result.buffer,
        mimeType: `image/${data.type === 'jpg' ? 'jpeg' : data.type}`,
    };
}

// Get image metadata
export async function getImageMetadata(file) {
    const fileBuffer = await file.arrayBuffer();
    const metadata = await sharp(Buffer.from(fileBuffer)).metadata();
    return metadata;
}
