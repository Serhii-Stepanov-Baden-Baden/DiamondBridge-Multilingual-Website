export interface MediaUploadRequest {
  file: File;
  operation: string;
}

export const apiClient = {
  uploadMedia: async (request: MediaUploadRequest): Promise<{ success: boolean }> => {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('operation', request.operation);

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    return response.json();
  },

  processMedia: async (params: { fileId: string; operation: string }): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/media/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) throw new Error(`Processing failed: ${response.status}`);
    return response.json();
  }
};
