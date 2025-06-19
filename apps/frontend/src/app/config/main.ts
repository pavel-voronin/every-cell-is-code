interface Config {
  apiUrl: string;
  chunkPrefix: string;
  chunkPostfix: string;
  codePrefix: string;
}

export const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:9000/',
  chunkPrefix: import.meta.env.VITE_CHUNK_PREFIX || 'chunks/',
  chunkPostfix: import.meta.env.VITE_CHUNK_POSTFIX || '.json',
  codePrefix: import.meta.env.VITE_CODE_PREFIX || 'code/',
};
