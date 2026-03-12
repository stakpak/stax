import { gzipSync } from "node:zlib";

/**
 * Create a deterministic tar+gzip archive.
 * Rules: sorted paths, directory entries before children, mtime=0, uid/gid=0,
 * uname/gname empty, mode 0644/0755, gzip level 6, OS=0xFF.
 */
export async function createDeterministicTarGz(
  files: Map<string, Uint8Array>,
): Promise<Uint8Array> {
  // Validate paths
  for (const filePath of files.keys()) {
    if (filePath.startsWith("/")) {
      throw new Error(`Invalid path: "${filePath}". Paths must not start with /`);
    }
    if (filePath.startsWith("./")) {
      throw new Error(`Invalid path: "${filePath}". Paths must not start with ./`);
    }
    if (filePath.includes("..")) {
      throw new Error(`Invalid path: "${filePath}". Paths must not contain .. segments`);
    }
    if (filePath.includes("\0")) {
      throw new Error(`Invalid path: "${filePath}". Paths must not contain null bytes`);
    }
  }

  // Check for duplicate normalized paths
  const normalizedPaths = new Set<string>();
  for (const filePath of files.keys()) {
    const normalized = filePath.toLowerCase();
    if (normalizedPaths.has(normalized)) {
      throw new Error(`Duplicate normalized path: "${filePath}"`);
    }
    normalizedPaths.add(normalized);
  }

  // Sort paths lexicographically (UTF-8 byte order — for ASCII this matches JS sort)
  const sortedPaths = [...files.keys()].sort();

  // Collect directory entries that need to be emitted
  const directories = new Set<string>();
  for (const filePath of sortedPaths) {
    const parts = filePath.split("/");
    for (let i = 1; i < parts.length; i++) {
      directories.add(parts.slice(0, i).join("/") + "/");
    }
  }
  // Build tar archive with directory entries before children
  const blocks: Uint8Array[] = [];
  const emittedDirs = new Set<string>();

  for (const filePath of sortedPaths) {
    // Emit any parent directories not yet emitted
    const parts = filePath.split("/");
    for (let i = 1; i < parts.length; i++) {
      const dirPath = parts.slice(0, i).join("/") + "/";
      if (!emittedDirs.has(dirPath)) {
        blocks.push(createTarHeader(dirPath, 0, true));
        emittedDirs.add(dirPath);
      }
    }

    // Emit file entry
    const content = files.get(filePath)!;
    const header = createTarHeader(filePath, content.length, false);
    blocks.push(header);
    blocks.push(content);

    // Pad to 512-byte boundary
    const remainder = content.length % 512;
    if (remainder > 0) {
      blocks.push(new Uint8Array(512 - remainder));
    }
  }

  // End-of-archive: two 512-byte blocks of zeros
  blocks.push(new Uint8Array(1024));

  // Concatenate all blocks
  const totalSize = blocks.reduce((sum, b) => sum + b.length, 0);
  const tar = new Uint8Array(totalSize);
  let offset = 0;
  for (const block of blocks) {
    tar.set(block, offset);
    offset += block.length;
  }

  // Gzip with deterministic settings
  const gzipped = gzipSync(Buffer.from(tar), {
    level: 6,
  });

  // Patch gzip header for determinism: mtime=0, OS=0xFF
  const result = new Uint8Array(gzipped);
  // Bytes 4-7 are mtime (set to 0)
  result[4] = 0;
  result[5] = 0;
  result[6] = 0;
  result[7] = 0;
  // Byte 9 is OS (set to 0xFF for unknown)
  result[9] = 0xff;

  return result;
}

function createTarHeader(filePath: string, size: number, isDirectory: boolean): Uint8Array {
  const header = new Uint8Array(512);
  const encoder = new TextEncoder();

  // File name (0-99)
  const nameBytes = encoder.encode(filePath);
  header.set(nameBytes.slice(0, 100), 0);

  // File mode (100-107) - 0755 for directories, 0644 for regular files
  writeOctal(header, 100, 8, isDirectory ? 0o755 : 0o644);

  // Owner ID (108-115) - 0
  writeOctal(header, 108, 8, 0);

  // Group ID (116-123) - 0
  writeOctal(header, 116, 8, 0);

  // File size (124-135)
  writeOctal(header, 124, 12, size);

  // Modification time (136-147) - 0
  writeOctal(header, 136, 12, 0);

  // Type flag (156) - '5' for directory, '0' for regular file
  header[156] = isDirectory ? 0x35 : 0x30;

  // Magic (257-262) - "ustar\0"
  const magic = encoder.encode("ustar\0");
  header.set(magic, 257);

  // Version (263-264) - "00"
  header[263] = 0x30;
  header[264] = 0x30;

  // uname (265-296) - empty (already zeroed)
  // gname (297-328) - empty (already zeroed)

  // Compute checksum
  // First, fill checksum field with spaces
  for (let i = 148; i < 156; i++) {
    header[i] = 0x20; // space
  }

  let checksum = 0;
  for (let i = 0; i < 512; i++) {
    checksum += header[i]!;
  }

  writeOctal(header, 148, 7, checksum);
  header[155] = 0x20; // trailing space

  return header;
}

function writeOctal(buf: Uint8Array, offset: number, length: number, value: number): void {
  const str = value.toString(8).padStart(length - 1, "0");
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  buf.set(bytes.slice(0, length - 1), offset);
  buf[offset + length - 1] = 0; // null terminator
}
