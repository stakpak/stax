import { gzipSync } from "node:zlib";

/**
 * Create a deterministic tar+gzip archive.
 * Rules: sorted paths, mtime=0, uid/gid=0, mode 0644/0755, gzip level 6, OS=0xFF.
 */
export async function createDeterministicTarGz(
  files: Map<string, Uint8Array>,
): Promise<Uint8Array> {
  // Validate paths
  for (const path of files.keys()) {
    if (path.startsWith("/")) {
      throw new Error(`Invalid path: "${path}". Paths must not start with /`);
    }
    if (path.startsWith("./")) {
      throw new Error(`Invalid path: "${path}". Paths must not start with ./`);
    }
    if (path.includes("..")) {
      throw new Error(`Invalid path: "${path}". Paths must not contain .. segments`);
    }
    if (path.includes("\0")) {
      throw new Error(`Invalid path: "${path}". Paths must not contain null bytes`);
    }
  }

  // Sort paths lexicographically
  const sortedPaths = [...files.keys()].sort();

  // Build tar archive
  const blocks: Uint8Array[] = [];

  for (const path of sortedPaths) {
    const content = files.get(path)!;
    const header = createTarHeader(path, content.length);
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

function createTarHeader(path: string, size: number): Uint8Array {
  const header = new Uint8Array(512);
  const encoder = new TextEncoder();

  // File name (0-99)
  const nameBytes = encoder.encode(path);
  header.set(nameBytes.slice(0, 100), 0);

  // File mode (100-107) - 0644
  writeOctal(header, 100, 8, 0o644);

  // Owner ID (108-115) - 0
  writeOctal(header, 108, 8, 0);

  // Group ID (116-123) - 0
  writeOctal(header, 116, 8, 0);

  // File size (124-135)
  writeOctal(header, 124, 12, size);

  // Modification time (136-147) - 0
  writeOctal(header, 136, 12, 0);

  // Type flag (156) - '0' for regular file
  header[156] = 0x30; // '0'

  // Magic (257-262) - "ustar\0"
  const magic = encoder.encode("ustar\0");
  header.set(magic, 257);

  // Version (263-264) - "00"
  header[263] = 0x30;
  header[264] = 0x30;

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
