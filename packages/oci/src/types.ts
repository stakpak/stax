export interface OciManifest {
  schemaVersion: 2;
  mediaType: string;
  artifactType: string;
  config: OciDescriptor;
  layers: OciLayer[];
  annotations?: Record<string, string>;
}

export interface OciLayer {
  mediaType: string;
  digest: string;
  size: number;
  annotations?: Record<string, string>;
}

export interface OciDescriptor {
  mediaType: string;
  digest: string;
  size: number;
}

export interface OciConfig {
  specVersion: string;
  name: string;
  version: string;
  description: string;
  adapter: {
    type: string;
    runtime: string;
    adapterVersion: string;
  };
}
