import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Paper
} from '@mui/material';
import {
  compressImage,
  compressVideo,
  getFileType,
  formatFileSize,
  validateFile,
  getCompressionSettings
} from '../utils/imageCompressor';

const FileUpload = ({ files, setFiles, maxFiles = 20 }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const processedFiles = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Validate file format (no size limits)
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        continue;
      }

      // Update progress
      setUploadProgress((i / selectedFiles.length) * 100);

      try {
        // Get WhatsApp-style compression settings
        const settings = getCompressionSettings(file);
        const fileType = getFileType(file);
        
        let compressedFile;
        
        if (fileType === 'image') {
          compressedFile = await compressImage(file, settings.maxWidth, settings.quality);
        } else if (fileType === 'video') {
          compressedFile = await compressVideo(file);
        } else {
          compressedFile = file;
        }

        // Create file object with metadata (not uploaded yet)
        const fileObj = {
          id: Date.now() + i,
          file: compressedFile,
          name: file.name,
          type: file.type,
          size: compressedFile.size,
          originalSize: file.size,
          url: URL.createObjectURL(compressedFile),
          uploaded: false, // Will be uploaded when form is submitted
          driveId: null,
          driveUrl: null,
          compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(1)
        };

        processedFiles.push(fileObj);
      } catch (error) {
        console.error('Error processing file:', error);
        alert(`Error processing ${file.name}`);
      }
    }

    setFiles(prev => [...prev, ...processedFiles]);
    setUploading(false);
    setUploadProgress(0);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove && fileToRemove.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const renderFilePreview = (fileObj) => {
    const isImage = fileObj.type.startsWith('image/');
    const isVideo = fileObj.type.startsWith('video/');

    return (
      <Card key={fileObj.id} sx={{ position: 'relative', height: '100%' }}>
        <CardMedia
          component={isVideo ? 'video' : 'img'}
          height="200"
          image={fileObj.url}
          alt={fileObj.name}
          sx={{ objectFit: 'cover' }}
          controls={isVideo}
        />
        <CardContent sx={{ p: 2 }}>
          <Typography variant="body2" noWrap>
            {fileObj.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip
              label={isImage ? '📷 Image' : '🎥 Video'}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(fileObj.size)}
            </Typography>
          </Box>
          
          {fileObj.compressionRatio > 0 && (
            <Typography variant="caption" color="success.main" display="block">
              🗜️ Compressed {fileObj.compressionRatio}% (from {formatFileSize(fileObj.originalSize)})
            </Typography>
          )}

          <Typography variant="caption" color="info.main" display="block" sx={{ mt: 1 }}>
            ⏳ Will be uploaded when form is submitted
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleRemoveFile(fileObj.id)}
            >
              🗑️ Remove
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        📸 Photos & Videos (WhatsApp-style compression)
      </Typography>
      
      <Paper
        elevation={1}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 2,
          textAlign: 'center',
          mb: 3
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <Button
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
          size="large"
          sx={{ mb: 2 }}
        >
          📁 Select Photos & Videos
        </Button>
        
        <Typography variant="body2" color="text.secondary">
          Max {maxFiles} files. No size limits - automatic WhatsApp-style compression applied.
        </Typography>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          🗜️ Images are automatically compressed for optimal storage and upload speed.
          Videos are validated and optimized for better performance.
          Files will be uploaded to Google Drive when you submit the form.
        </Alert>
        
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" color="text.secondary">
              Processing files... {Math.round(uploadProgress)}%
            </Typography>
          </Box>
        )}
      </Paper>

      {files.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">
              Selected Files ({files.length}/{maxFiles}) - Ready for Upload
            </Typography>
            <Button
              size="small"
              color="error"
              onClick={() => {
                files.forEach(f => {
                  if (f.url) URL.revokeObjectURL(f.url);
                });
                setFiles([]);
              }}
            >
              ❌ Clear All
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {files.map(renderFilePreview)}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload; 