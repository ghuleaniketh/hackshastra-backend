import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import env from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
  auth: { persistSession: false },
});

const BUCKET_NAME = 'media';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (MIME_TYPES[ext]) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function sanitizeKey(relPath) {
  return relPath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9_\-\.\/]/g, '_')
    .replace(/_+/g, '_');
}

async function ensureBucket() {
  console.log(`Checking bucket '${BUCKET_NAME}'...`);
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError);
  }

  const exists = buckets && buckets.some((b) => b.name === BUCKET_NAME);
  if (!exists) {
    console.log(`Creating public bucket '${BUCKET_NAME}'...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
    });
    if (createError) {
      console.error('Error creating bucket:', createError);
    } else {
      console.log(`Bucket '${BUCKET_NAME}' created.`);
    }
  } else {
    console.log(`Bucket '${BUCKET_NAME}' exists and is ready.`);
  }
}

async function uploadFile(filePath, baseDir, prefix) {
  const relativePath = path.relative(baseDir, filePath);
  const storagePath = `${prefix}/${sanitizeKey(relativePath)}`;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileBuffer = fs.readFileSync(filePath);
  const fileSizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(2);

  process.stdout.write(`Uploading [${fileSizeMb} MB] ${relativePath} -> ${storagePath}... `);

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, fileBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  console.log(`✅ ${publicUrlData.publicUrl}`);
  return {
    localPath: filePath,
    relativePath: relativePath.replace(/\\/g, '/'),
    filename: path.basename(filePath).toLowerCase(),
    storagePath,
    publicUrl: publicUrlData.publicUrl,
  };
}

async function main() {
  console.log('--- Starting Media Upload to Supabase Image/Media DB CDN ---');
  await ensureBucket();

  const rootDir = path.resolve(__dirname, '../../');
  const srcAssetsDir = path.resolve(rootDir, 'frontendbyantigravity/src/assets');
  const publicDir = path.resolve(rootDir, 'frontendbyantigravity/public');

  const srcFiles = getAllFiles(srcAssetsDir);
  const publicFiles = getAllFiles(publicDir);

  console.log(`Found ${srcFiles.length} media files in src/assets and ${publicFiles.length} in public.`);

  const mediaMap = {};
  const filenameMap = {};

  for (const file of srcFiles) {
    const res = await uploadFile(file, srcAssetsDir, 'assets');
    if (res) {
      const standardPath = `@/assets/${res.relativePath}`;
      const srcPath = `/src/assets/${res.relativePath}`;
      mediaMap[standardPath] = res.publicUrl;
      mediaMap[srcPath] = res.publicUrl;
      mediaMap[res.relativePath] = res.publicUrl;
      filenameMap[res.filename] = res.publicUrl;
    }
  }

  for (const file of publicFiles) {
    const res = await uploadFile(file, publicDir, 'public');
    if (res) {
      const publicPath = `/${res.relativePath}`;
      mediaMap[publicPath] = res.publicUrl;
      if (!filenameMap[res.filename]) {
        filenameMap[res.filename] = res.publicUrl;
      }
    }
  }

  const outputPayload = {
    generatedAt: new Date().toISOString(),
    bucket: BUCKET_NAME,
    totalFiles: Object.keys(mediaMap).length,
    mediaMap,
    filenameMap,
  };

  const frontendOut = path.resolve(rootDir, 'frontendbyantigravity/src/data/mediaUrls.json');
  const backendOut = path.resolve(rootDir, 'backend/src/data/mediaUrls.json');

  fs.mkdirSync(path.dirname(frontendOut), { recursive: true });
  fs.mkdirSync(path.dirname(backendOut), { recursive: true });

  fs.writeFileSync(frontendOut, JSON.stringify(outputPayload, null, 2));
  fs.writeFileSync(backendOut, JSON.stringify(outputPayload, null, 2));

  console.log(`\nMedia URL mapping written to:\n- ${frontendOut}\n- ${backendOut}`);
  console.log(`\n🎉 Successfully uploaded all images and videos to Supabase Image/Media DB!`);
}

main().catch((err) => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});
