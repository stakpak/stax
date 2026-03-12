export interface BuildOptions {
  /** Path to the agent/package definition file */
  entry: string;
  /** Output directory for the built artifact */
  outDir?: string;
  /** Specific persona to build (for multi-persona agents) */
  persona?: string;
  /** Build all personas */
  allPersonas?: boolean;
  /** Allow paths outside project root */
  allowOutsideRoot?: boolean;
  /** Symlink handling mode */
  symlinkMode?: "reject" | "flatten";
}

export interface BuildResult {
  /** The OCI manifest digest */
  digest: string;
  /** Path to the built artifact */
  artifactPath: string;
  /** Layer digests in order */
  layers: LayerResult[];
  /** Build warnings */
  warnings: string[];
}

export interface LayerResult {
  mediaType: string;
  digest: string;
  size: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}
