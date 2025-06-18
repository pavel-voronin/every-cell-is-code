import { S3Client } from '@aws-sdk/client-s3';
import { s3Config } from '../../config/s3.js';

export const s3 = new S3Client({
  endpoint: s3Config.endpoint,
  region: s3Config.region,
  credentials: {
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
  },
  forcePathStyle: s3Config.forcePathStyle,
});

export const getBlockUrl = (x: number, y: number): string => {
  return `${s3Config.endpoint}/${s3Config.blocksBucket}/${x}_${y}.json`;
};
