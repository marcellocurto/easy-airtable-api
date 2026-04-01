import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export async function writeAtomic(
  outputPath: string,
  content: string
): Promise<string> {
  const resolvedPath = resolve(outputPath);
  const parentDirectory = dirname(resolvedPath);
  const temporaryPath = `${resolvedPath}.tmp-${process.pid}-${Date.now()}`;

  await mkdir(parentDirectory, { recursive: true });
  await writeFile(temporaryPath, content, 'utf8');
  await rename(temporaryPath, resolvedPath);

  return resolvedPath;
}
