import { message } from 'antd';
import JSZip from 'jszip';
const sharp = window.require('sharp');
const { ipcRenderer } = window.require('electron');

export async function processImages(fileList, data, setStatus, setCountPerc) {


    const processedImages = [];

    for (let i = 0; i < fileList.length; i++) {

        const file = fileList[i];
        const fileBuffer = await file.arrayBuffer();

        const config = {
            jpg: { quality: parseInt(data.quality), mozjpeg: data.mozjpeg, progressive: data.progressive },
            webp: { quality: parseInt(data.quality), lossless: data.losscomp },
            tiff: { quality: parseInt(data.quality), force: true, compression: data.compType },
            png: { compressionLevel: parseInt(data.compression), force: true, progressive: data.progressive },
            gif: { force: true, progressive: data.progressive },
            avif: { force: true, quality: parseInt(data.quality), lossless: data.losscomp },
        };
        const qualityConfig = config[data.type || 'jpg'];
        const pipeline = sharp(fileBuffer, { animated: data.animate })
            .resize(!data.dimensions ? { width: parseInt(data.width), height: parseInt(data.height), fit: 'fill' } : undefined)
            .toFormat(data.type || 'jpg', qualityConfig)
            .rotate(data.orientation)
            .greyscale(data.grayscale);

        const processedImageBuffer = await pipeline.toBuffer();
        const fileNameParts = file.name.split('.');
        const fileNameWithoutExtension = fileNameParts[0];
        processedImages.push({ name: fileNameWithoutExtension + '.' + data.type, buffer: processedImageBuffer });

        setStatus(prevStatus => {
            const updatedStatus = [...prevStatus];
            updatedStatus[i] = 'Completed';
            return updatedStatus;
        });

        setCountPerc((prevCountPerc) => {
            const updatedCountPerc = i === fileList.length - 1 ? 100 : Math.floor((i / fileList.length) * 100);
            return updatedCountPerc;
        });
    }

    message.success("Generating Zip Files...")
    ipcRenderer.send('show-notification', {title: 'Conversion Finished', body: 'Files converted successfully'})
    const zip = new JSZip();
    for (const { name, buffer } of processedImages) {
        zip.file(name, buffer);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = zipUrl;
    downloadLink.download = 'processed_images.zip';
    downloadLink.textContent = 'Download Zip File';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

}
