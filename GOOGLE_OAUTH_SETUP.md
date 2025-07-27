# Google OAuth Setup for Localhost Development

## 🔧 Fix the "Not a valid origin" Error

The error you're seeing is because your Google OAuth client isn't configured for localhost. Here's how to fix it:

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/apis/credentials
2. Sign in with your Google account
3. Select your project (or create one if needed)

### Step 2: Find Your OAuth 2.0 Client ID
1. Look for your OAuth 2.0 Client ID: `378153334486-um3i5t9a86e1oubft34llhi781po3euq.apps.googleusercontent.com`
2. Click on it to edit

### Step 3: Add Localhost Origins
1. In the "Authorized JavaScript origins" section, add:
   ```
   http://localhost:5173
   http://localhost:3000
   http://127.0.0.1:5173
   http://127.0.0.1:3000
   ```

2. In the "Authorized redirect URIs" section, add:
   ```
   http://localhost:5173
   http://localhost:3000
   http://127.0.0.1:5173
   http://127.0.0.1:3000
   ```

### Step 4: Save Changes
1. Click "Save" at the bottom
2. Wait a few minutes for changes to propagate

### Step 5: Test Again
1. Refresh your browser
2. Try uploading files again
3. You should now see the Google OAuth popup

## 🚀 What's Fixed

- ✅ **Localhost Support**: OAuth now works on localhost:5173
- ✅ **File Upload**: Files will be uploaded to Google Drive on form submission
- ✅ **WhatsApp-style Compression**: Images are automatically compressed
- ✅ **Progress Tracking**: Shows upload progress and compression ratios

## 📁 Google Drive Structure

Files will be uploaded to a folder called "Brokerage Properties" in your Google Drive, organized by property.

## 🔍 Troubleshooting

If you still get errors:
1. Clear browser cache and cookies
2. Make sure you're using the exact port (5173)
3. Check that the client ID matches exactly
4. Wait 5-10 minutes after saving OAuth settings

## 📱 Next Steps

Once OAuth is working:
1. Test file uploads in the Add Property form
2. Check your Google Drive for the "Brokerage Properties" folder
3. Verify files are being compressed properly
4. Test the complete form submission flow 