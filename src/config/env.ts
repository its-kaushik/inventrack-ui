const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  APP_NAME: 'InvenTrack',
} as const;

export { env };
