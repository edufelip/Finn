# Media & Assets Specification

## Purpose
Manages the selection, processing, and resolution of visual assets (images) within the application.

## Functional Requirements
...
- **FR-MEDA-06**: The system shall optimize images (resize, compress) before uploading to reduce bandwidth usage.

## Implementation Details (Optimization)
- **Library**: `expo-image-manipulator`.
- **Strategy**: 
    - Resize images to a maximum dimension (e.g., 1080px).
    - Apply JPEG compression (e.g., quality 0.7).
    - Convert to consistent format (JPEG).

## Use Cases
...### UC-MEDA-01: Pick a Profile Photo
1. User clicks "Change Photo" in Edit Profile.
2. System displays an action sheet with "Take Photo" and "Choose from Gallery".
3. User selects "Choose from Gallery".
4. System requests permission (if not already granted).
5. User selects an image.
6. System returns the local URI for further processing (upload or persistence).

## Test Cases
- **TC-MEDA-01**: Verify that denying camera permission shows an appropriate alert explaining why access is needed.
- **TC-MEDA-02**: Verify that Supabase bucket paths are correctly transformed into public URLs for display in `Image` components.

## Terminology
- **Bucket**: A container for storage objects in Supabase.
- **Public URL**: A URL accessible via the internet to view a storage object.
- **Signed URL**: A time-limited URL for accessing private objects.
