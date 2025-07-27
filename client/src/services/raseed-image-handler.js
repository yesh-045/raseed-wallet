

import { storage, db, auth } from '../firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { processReceipt } from './api';

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : '📝';
  console.log(`${emoji} [${timestamp}] ${message}`);
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const ensureAuthenticated = () => {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to perform this action. Please sign in first.');
  }
  return auth.currentUser;
};

const validateFile = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
    throw new Error('File must be an image or PDF');
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }
  
  return true;
};

// Create test file function (useful for testing)
export const createTestFile = async (name = 'test-image.png', size = 300, color = '#4ECDC4') => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add text
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.max(16, size/15)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('RASEED', size/2, size/2 - 20);
    ctx.font = `${Math.max(12, size/20)}px Arial`;
    ctx.fillText('TEST IMAGE', size/2, size/2 + 10);
    ctx.fillText(new Date().toLocaleString(), size/2, size/2 + 30);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], name, { type: 'image/png' });
      resolve(file);
    });
  });
};



// Core upload function
export const uploadImage = async (file, metadata = {}) => {
  try {
    log(`Starting upload: ${file.name}`);
    
    // Ensure user is authenticated
    const user = ensureAuthenticated();
    log(`User authenticated: ${user.email} (${user.uid})`);
    
    // Validate file
    validateFile(file);
    log(`File validated: ${file.name} (${file.size} bytes, ${file.type})`);
    
    // Generate unique filename with user folder
    const timestamp = Date.now();
    const uniqueId = generateId();
    const fileName = `receipts/${user.uid}/${timestamp}_${uniqueId}_${file.name}`;
    
    // Create storage reference
    const storageRef = ref(storage, fileName);
    log(`Storage reference created: ${fileName}`);
    
    // Upload to Firebase Storage
    log(`Uploading to Firebase Storage: ${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    log(`Upload snapshot received: ${snapshot.metadata.name}`);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    log(`Upload successful, URL: ${downloadURL}`);
    
    // Save metadata to Firestore
    const docData = {
      // File info
      fileName: file.name,
      originalName: file.name,
      storagePath: fileName,
      downloadURL: downloadURL,
      size: file.size,
      type: file.type,
      
      // User info
      userId: user.uid,
      userEmail: user.email,
      
      // Timestamps
      uploadedAt: serverTimestamp(),
      createdAt: new Date().toISOString(),
      
      // Metadata
      ...metadata,
      
      // System info
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      uploadMethod: 'firebase-storage',
      
      // Receipt processing status
      status: 'uploaded',
      processedAt: null,
      extractedData: null
    };
    
    log('Saving metadata to Firestore...');
    const docRef = await addDoc(collection(db, 'uploaded_receipts'), docData);
    
    const result = {
      id: docRef.id,
      downloadURL,
      storagePath: fileName,
      fileName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      success: true,
      uploadMethod: 'firebase-storage',
      metadata: docData
    };
    
    log(`Firebase Storage upload completed successfully: ${docRef.id}`, 'success');
    return result;
    
  } catch (error) {
    log(`Upload failed: ${error.message}`, 'error');
    log(`Error stack: ${error.stack}`, 'error');
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Core download function
export const downloadImageById = async (imageId) => {
  try {
    log(`Downloading image by ID: ${imageId}`);
    
    // Get document from Firestore
    const docRef = doc(db, 'uploaded_receipts', imageId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Image with ID ${imageId} not found`);
    }
    
    const imageData = {
      id: imageId,
      ...docSnap.data(),
      success: true,
      downloadedAt: new Date().toISOString()
    };
    
    log(`Download successful: ${imageData.originalName}`, 'success');
    return imageData;
    
  } catch (error) {
    log(`Download failed: ${error.message}`, 'error');
    throw new Error(`Download failed: ${error.message}`);
  }
};

// Get all images for a user
export const getUserImages = async (userId = null) => {
  try {
    // Use provided userId or current user's ID
    const targetUserId = userId || ensureAuthenticated().uid;
    log(`Getting images for user: ${targetUserId}`);
    
    // Query images for user
    const q = query(
      collection(db, 'uploaded_receipts'),
      where('userId', '==', targetUserId),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const images = [];
    
    querySnapshot.forEach((doc) => {
      images.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    log(`Found ${images.length} images for user: ${targetUserId}`, 'success');
    return images;
    
  } catch (error) {
    log(`Get user images failed: ${error.message}`, 'error');
    throw new Error(`Failed to get user images: ${error.message}`);
  }
};

// Upload multiple images
export const uploadMultipleImages = async (files, metadata = {}) => {
  try {
    log(`Uploading ${files.length} images...`);
    
    const uploadPromises = Array.from(files).map((file, index) => 
      uploadImage(file, { ...metadata, batchIndex: index })
    );
    
    const results = await Promise.all(uploadPromises);
    
    log(`Multiple upload completed: ${results.length} files`, 'success');
    return {
      uploads: results,
      success: true,
      count: results.length,
      totalSize: results.reduce((sum, r) => sum + r.size, 0)
    };
    
  } catch (error) {
    log(`Multiple upload failed: ${error.message}`, 'error');
    throw new Error(`Multiple upload failed: ${error.message}`);
  }
};

// Get fresh download URL (in case the stored URL expires)
export const getFreshDownloadURL = async (storagePath) => {
  try {
    log(`Getting fresh download URL: ${storagePath}`);
    
    const storageRef = ref(storage, storagePath);
    const downloadURL = await getDownloadURL(storageRef);
    
    log(`Fresh URL generated: ${downloadURL}`, 'success');
    return downloadURL;
    
  } catch (error) {
    log(`Failed to get fresh URL: ${error.message}`, 'error');
    throw new Error(`Failed to get fresh download URL: ${error.message}`);
  }
};

// Delete image
export const deleteImage = async (imageId) => {
  try {
    log(`Deleting image: ${imageId}`);
    
    // Get image data first
    const imageData = await downloadImageById(imageId);
    
    // Delete from Storage
    const storageRef = ref(storage, imageData.storagePath);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    const docRef = doc(db, 'uploaded_receipts', imageId);
    await deleteDoc(docRef);
    
    log(`Image deleted successfully: ${imageId}`, 'success');
    return { success: true, deletedId: imageId };
    
  } catch (error) {
    log(`Delete failed: ${error.message}`, 'error');
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

// Send receipt for AI processing
export const sendForProcessing = async (receiptId, userId) => {
  try {
    log(`Sending receipt for processing: ${receiptId}`);
    
    const receiptData = await downloadImageById(receiptId);
    
    // Send to backend for processing using our API service
    const response = await processReceipt({
      receiptId: receiptId,
      downloadURL: receiptData.downloadURL,
      userId: userId,
      fileName: receiptData.fileName,
      fileType: receiptData.type,
      storagePath: receiptData.storagePath
    });
    
    log(`Processing request sent successfully`, 'success');
    return response;
    
  } catch (error) {
    log(`Processing request failed: ${error.message}`, 'error');
    throw new Error(`Failed to send for processing: ${error.message}`);
  }
};

// Check if user is authenticated
export const isUserAuthenticated = () => {
  return !!auth.currentUser;
};

// Get current user info
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Export main functions
export default {
  // Core functions
  uploadImage,
  downloadImageById,
  getUserImages,
  
  // Utility functions
  uploadMultipleImages,
  getFreshDownloadURL,
  deleteImage,
  sendForProcessing,
  
  // Test functions
  createTestFile,
  
  // Auth functions
  isUserAuthenticated,
  getCurrentUser
};
