import { createHash, createHmac } from 'node:crypto';
import { type LoaderFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

// ── AWS v4 signing (minimal — list objects only) ───────────────────────────────

function sha256hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function hmacSha256(key: Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function signingKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(Buffer.from(`AWS4${secretKey}`, 'utf8'), dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

interface S3SignedHeaders {
  Authorization: string;
  'x-amz-date': string;
  'x-amz-content-sha256': string;
  host: string;
}

function signS3Request(
  method: string,
  endpoint: string,
  path: string,
  query: string,
  accessKey: string,
  secretKey: string,
  region: string,
): S3SignedHeaders {
  const now = new Date();
  const amzDate = `${now.toISOString().replace(/[:-]/g, '').split('.')[0]}Z`;
  const dateStamp = amzDate.slice(0, 8);

  const host = new URL(endpoint).host;
  const canonicalUri = path;
  const canonicalQueryString = query;
  const payloadHash = sha256hex('');

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256hex(canonicalRequest)}`;

  const signature = hmacSha256(
    signingKey(secretKey, dateStamp, region, 's3'),
    stringToSign,
  ).toString('hex');

  return {
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
}

// ── R2 backup listing ─────────────────────────────────────────────────────────

export interface BackupEntry {
  key: string;
  sizeBytes: number;
  lastModified: string;
  etag: string;
}

export interface BackupStatus {
  bucket: string;
  lastBackup: BackupEntry | null;
  totalFiles: number;
  totalSizeBytes: number;
  fetchError?: string;
}

async function listR2Backups(): Promise<BackupStatus> {
  const accessKey = process.env.BACKUP_OBJ_ACCESS_KEY;
  const secretKey = process.env.BACKUP_OBJ_SECRET_KEY;
  const bucket = process.env.BACKUP_OBJ_BUCKET;
  const endpoint = process.env.BACKUP_OBJ_ENDPOINT;

  if (!accessKey || !secretKey || !bucket || !endpoint) {
    return {
      bucket: bucket ?? 'not configured',
      fetchError:
        'BACKUP_OBJ_ACCESS_KEY, BACKUP_OBJ_SECRET_KEY, BACKUP_OBJ_BUCKET, BACKUP_OBJ_ENDPOINT not all configured',
      lastBackup: null,
      totalFiles: 0,
      totalSizeBytes: 0,
    };
  }

  const region = 'auto'; // Cloudflare R2 uses "auto" as region
  const query = 'list-type=2&max-keys=1000';
  const path = `/${bucket}`;
  const fullUrl = `${endpoint}${path}?${query}`;

  const headers = signS3Request('GET', endpoint, path, query, accessKey, secretKey, region);

  const res = await fetch(fullUrl, {
    headers: {
      Authorization: headers.Authorization,
      host: headers.host,
      'x-amz-content-sha256': headers['x-amz-content-sha256'],
      'x-amz-date': headers['x-amz-date'],
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`R2 list-objects HTTP ${res.status}`);
  }

  const xml = await res.text();

  // Parse S3 XML response (minimal — no external XML parser needed)
  const entries: BackupEntry[] = [];
  const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop pattern
  while ((match = contentsRegex.exec(xml)) !== null) {
    const content = match[1] ?? '';
    const key = /<Key>(.*?)<\/Key>/.exec(content)?.[1] ?? '';
    const sizeStr = /<Size>(.*?)<\/Size>/.exec(content)?.[1] ?? '0';
    const lastModified = /<LastModified>(.*?)<\/LastModified>/.exec(content)?.[1] ?? '';
    const etag = /<ETag>(.*?)<\/ETag>/.exec(content)?.[1]?.replace(/"/g, '') ?? '';

    entries.push({ etag, key, lastModified, sizeBytes: Number(sizeStr) });
  }

  // Sort by last modified descending — latest backup first
  entries.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

  const totalSizeBytes = entries.reduce((s, e) => s + e.sizeBytes, 0);

  return {
    bucket,
    lastBackup: entries[0] ?? null,
    totalFiles: entries.length,
    totalSizeBytes,
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  try {
    const status = await listR2Backups();
    return Response.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error({ err }, 'Backups status: R2 list failed');
    return Response.json({
      bucket: 'unknown',
      fetchError: message,
      lastBackup: null,
      totalFiles: 0,
      totalSizeBytes: 0,
    } satisfies BackupStatus);
  }
}
