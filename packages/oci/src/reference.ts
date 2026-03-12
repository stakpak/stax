export interface OciReference {
  registry: string;
  repository: string;
  tag?: string;
  digest?: string;
}

export function parseReference(ref: string): OciReference {
  if (!ref || ref.length === 0) {
    throw new Error("Reference must not be empty");
  }
  if (/\s/.test(ref)) {
    throw new Error("Reference must not contain whitespace");
  }

  let remaining = ref;
  let digest: string | undefined;
  let tag: string | undefined;

  // Extract digest if present
  const atIdx = remaining.indexOf("@");
  if (atIdx !== -1) {
    digest = remaining.slice(atIdx + 1);
    remaining = remaining.slice(0, atIdx);
  }

  // Split into parts by "/"
  const slashParts = remaining.split("/");

  // Determine if first part is a registry
  let registry: string;
  let repoParts: string[];

  if (slashParts.length === 1) {
    // Single name like "ubuntu" or "ubuntu:latest"
    registry = "docker.io";
    repoParts = slashParts;
  } else {
    const firstPart = slashParts[0]!;
    // First part is a registry if it contains a dot, colon, or is "localhost"
    if (firstPart.includes(".") || firstPart.includes(":") || firstPart === "localhost") {
      registry = firstPart;
      repoParts = slashParts.slice(1);
    } else {
      registry = "docker.io";
      repoParts = slashParts;
    }
  }

  // Rejoin repo parts
  let repoString = repoParts.join("/");

  // Extract tag from the last repo segment
  const lastSlash = repoString.lastIndexOf("/");
  const lastSegment = lastSlash === -1 ? repoString : repoString.slice(lastSlash + 1);
  const colonInLast = lastSegment.lastIndexOf(":");

  if (colonInLast !== -1) {
    tag = lastSegment.slice(colonInLast + 1);
    if (lastSlash === -1) {
      repoString = lastSegment.slice(0, colonInLast);
    } else {
      repoString = repoString.slice(0, lastSlash + 1) + lastSegment.slice(0, colonInLast);
    }
  }

  const result: OciReference = {
    registry,
    repository: repoString,
  };

  if (tag !== undefined) {
    result.tag = tag;
  }
  if (digest !== undefined) {
    result.digest = digest;
  }

  return result;
}
