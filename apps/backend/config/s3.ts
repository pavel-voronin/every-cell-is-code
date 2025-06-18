interface S3Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  blocksBucket: string;
  forcePathStyle: boolean;
}

export const s3Config: S3Config = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin123',
  blocksBucket: process.env.S3_BLOCKS_BUCKET || 'blocks-storage',
  forcePathStyle: true,
};
