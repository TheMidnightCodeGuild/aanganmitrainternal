// Google Drive Service for file uploads
class GoogleDriveService {
  constructor() {
    this.clientId = '378153334486-um3i5t9a86e1oubft34llhi781po3euq.apps.googleusercontent.com';
    this.apiKey = ''; // Add your API key here
    this.scopes = ['https://www.googleapis.com/auth/drive.file'];
    this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
    this.gapi = null;
    this.isInitialized = false;
    this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.useMockMode = true; // Set to true for development without OAuth
  }

  async initialize() {
    if (this.isInitialized) return;

    // If in mock mode, skip real initialization
    if (this.useMockMode) {
      this.isInitialized = true;
      console.log('🔧 Development Mode: Using mock Google Drive service');
      return;
    }

    try {
      // Load the Google API client
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          window.gapi.load('client:auth2', async () => {
            try {
              await window.gapi.client.init({
                apiKey: this.apiKey,
                clientId: this.clientId,
                scope: this.scopes.join(' '),
                discoveryDocs: this.discoveryDocs,
                // Add these options for better localhost support
                ux_mode: 'popup',
                redirect_uri: this.isDevelopment ? window.location.origin : undefined,
              });
              this.gapi = window.gapi;
              this.isInitialized = true;
              resolve();
            } catch (error) {
              console.error('GAPI initialization error:', error);
              reject(error);
            }
          });
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      
      // For development, provide helpful error message
      if (this.isDevelopment) {
        console.warn('Development Mode: Make sure to add http://localhost:5173 to your Google OAuth client origins');
        console.warn('Go to: https://console.cloud.google.com/apis/credentials');
        console.warn('Find your OAuth 2.0 Client ID and add localhost origins');
        console.warn('Or set useMockMode = true in googleDriveService.js for testing without OAuth');
      }
      
      throw error;
    }
  }

  async authenticate() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // If in mock mode, return mock user
    if (this.useMockMode) {
      return {
        getBasicProfile: () => ({
          getName: () => 'Development User',
          getEmail: () => 'dev@example.com'
        })
      };
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn({
          prompt: 'select_account'
        });
      }
      return authInstance.currentUser.get();
    } catch (error) {
      console.error('Authentication failed:', error);
      
      // Provide helpful error message for common issues
      if (error.error === 'idpiframe_initialization_failed') {
        throw new Error('OAuth configuration error. Please add localhost to your Google OAuth client origins.');
      }
      
      throw error;
    }
  }

  async uploadFile(file, folderName = 'Brokerage Properties') {
    try {
      await this.authenticate();

      // If in mock mode, simulate upload
      if (this.useMockMode) {
        return new Promise((resolve) => {
          setTimeout(() => {
            const mockResult = {
              id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              webViewLink: `https://drive.google.com/file/d/mock_${Date.now()}/view`,
              size: file.size,
              mimeType: file.type,
            };
            console.log('🔧 Mock upload successful:', mockResult);
            resolve(mockResult);
          }, 1000); // Simulate network delay
        });
      }

      // Create folder if it doesn't exist
      const folderId = await this.getOrCreateFolder(folderName);

      // Create file metadata
      const metadata = {
        name: file.name,
        parents: [folderId],
        mimeType: file.type,
      };

      // Create FormData for file upload
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      // Upload file
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`,
          },
          body: form,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return {
        id: result.id,
        name: result.name,
        webViewLink: result.webViewLink,
        size: file.size,
        mimeType: file.type,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async getOrCreateFolder(folderName) {
    try {
      // If in mock mode, return mock folder ID
      if (this.useMockMode) {
        return 'mock_folder_id';
      }

      // Search for existing folder
      const response = await this.gapi.client.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)',
      });

      if (response.result.files.length > 0) {
        return response.result.files[0].id;
      }

      // Create new folder
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await this.gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      return folder.result.id;
    } catch (error) {
      console.error('Folder creation failed:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.authenticate();
      
      // If in mock mode, simulate deletion
      if (this.useMockMode) {
        console.log('🔧 Mock delete successful for file:', fileId);
        return;
      }

      await this.gapi.client.drive.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error;
    }
  }

  async getFileInfo(fileId) {
    try {
      await this.authenticate();
      
      // If in mock mode, return mock file info
      if (this.useMockMode) {
        return {
          id: fileId,
          name: 'Mock File',
          size: '1024',
          mimeType: 'image/jpeg',
          webViewLink: 'https://drive.google.com/file/d/mock/view',
          createdTime: new Date().toISOString()
        };
      }

      const response = await this.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id,name,size,mimeType,webViewLink,createdTime',
      });
      return response.result;
    } catch (error) {
      console.error('Get file info failed:', error);
      throw error;
    }
  }

  // Helper method to check if service is ready
  isReady() {
    return this.isInitialized && (this.useMockMode || (this.gapi && this.gapi.auth2 && this.gapi.auth2.getAuthInstance().isSignedIn.get()));
  }

  // Method to toggle mock mode
  setMockMode(enabled) {
    this.useMockMode = enabled;
    if (enabled) {
      this.isInitialized = true;
      console.log('🔧 Mock mode enabled - Google Drive uploads will be simulated');
    } else {
      console.log('🔧 Mock mode disabled - Real Google Drive uploads will be used');
    }
  }
}

// Create singleton instance
const googleDriveService = new GoogleDriveService();

export default googleDriveService; 