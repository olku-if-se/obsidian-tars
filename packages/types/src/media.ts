/**
 * Media and file content types
 */

/**
 * File content interface
 */
export interface FileContent {
  /** File name */
  filename: string
  /** File data (base64 encoded) */
  data: string
  /** MIME type */
  mimeType: string
  /** File size in bytes */
  size: number
  /** Optional URL */
  url?: string
  /** File hash for integrity checking */
  hash?: string
  /** File metadata */
  metadata?: FileMetadata
}

/**
 * Image content interface
 */
export interface ImageContent {
  /** Image data (base64 encoded) */
  data: string
  /** MIME type */
  mimeType: string
  /** Image dimensions */
  dimensions?: {
    width: number
    height: number
  }
  /** Image description */
  description?: string
  /** Optional URL */
  url?: string
  /** File name if available */
  filename?: string
  /** Image metadata */
  metadata?: ImageMetadata
}

/**
 * Media content (supports various media types)
 */
export interface MediaContent {
  /** Content type discriminator */
  type: 'image' | 'video' | 'audio' | 'document'
  /** Media data (base64 encoded) */
  data: string
  /** MIME type */
  mimeType: string
  /** File name */
  filename: string
  /** File size */
  size: number
  /** Duration for audio/video */
  duration?: number
  /** Dimensions for images/video */
  dimensions?: {
    width: number
    height: number
  }
  /** Media-specific metadata */
  metadata?: MediaMetadata
}

/**
 * File metadata
 */
export interface FileMetadata {
  /** Creation timestamp */
  createdAt?: Date
  /** Modification timestamp */
  modifiedAt?: Date
  /** File encoding */
  encoding?: string
  /** File checksums */
  checksums?: {
    md5?: string
    sha1?: string
    sha256?: string
  }
  /** Custom metadata */
  [key: string]: unknown
}

/**
 * Image metadata
 */
export interface ImageMetadata extends FileMetadata {
  /** EXIF data */
  exif?: Record<string, unknown>
  /** Color space */
  colorSpace?: string
  /** Bit depth */
  bitDepth?: number
  /** Has alpha channel */
  hasAlpha?: boolean
  /** Image format */
  format?: string
}

/**
 * Media metadata
 */
export interface MediaMetadata extends FileMetadata {
  /** Media title */
  title?: string
  /** Media artist/creator */
  artist?: string
  /** Media duration */
  duration?: number
  /** Media bitrate */
  bitrate?: number
  /** Media codec */
  codec?: string
  /** Thumbnail data */
  thumbnail?: string
}

/**
 * Content processing options
 */
export interface ContentProcessingOptions {
  /** Maximum file size in bytes */
  maxFileSize?: number
  /** Allowed MIME types */
  allowedMimeTypes?: string[]
  /** Whether to compress images */
  compressImages?: boolean
  /** Maximum image dimensions */
  maxImageDimensions?: {
    width: number
    height: number
  }
  /** Image quality (0-1) */
  imageQuality?: number
  /** Whether to extract metadata */
  extractMetadata?: boolean
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
  /** Whether content is valid */
  valid: boolean
  /** Validation errors */
  errors: ContentValidationError[]
  /** Validation warnings */
  warnings: ContentValidationWarning[]
  /** Extracted metadata */
  metadata?: FileMetadata | ImageMetadata | MediaMetadata
}

export interface ContentValidationError {
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Error severity */
  severity: 'error'
  /** File path */
  path?: string
}

export interface ContentValidationWarning {
  /** Warning code */
  code: string
  /** Warning message */
  message: string
  /** Warning severity */
  severity: 'warning'
  /** File path */
  path?: string
}

/**
 * Content processing functions
 */
export type SaveAttachment = (
  fileName: string,
  data: ArrayBuffer
) => Promise<void>

export type ResolveEmbedAsBinary = (embed: any) => Promise<ArrayBuffer>

export type CreatePlainText = (filePath: string, text: string) => Promise<void>

/**
 * Content type detectors
 */
export type ContentTypeDetector = (data: ArrayBuffer, filename?: string) => string

export type MimeTypeValidator = (mimeType: string) => boolean

/**
 * Content transformers
 */
export type ContentTransformer<T = unknown, R = unknown> = (input: T) => Promise<R>

export type ImageTransformer = (
  imageData: ArrayBuffer,
  options?: ImageTransformOptions
) => Promise<ArrayBuffer>

export interface ImageTransformOptions {
  /** Target width */
  width?: number
  /** Target height */
  height?: number
  /** Whether to maintain aspect ratio */
  maintainAspectRatio?: boolean
  /** Output format */
  format?: 'jpeg' | 'png' | 'webp'
  /** Image quality (0-1) */
  quality?: number
}

/**
 * Common MIME types
 */
export const MIME_TYPES = {
  // Images
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',

  // Documents
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
  TXT: 'text/plain',
  MD: 'text/markdown',

  // Audio
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',

  // Video
  MP4: 'video/mp4',
  WEBM: 'video/webm',
  AVI: 'video/x-msvideo',
} as const

/**
 * Content type utilities
 */
export function isImageMimeType(mimeType: string): boolean {
  return Object.values(MIME_TYPES).some(type =>
    type.startsWith('image/') && type === mimeType
  )
}

export function isDocumentMimeType(mimeType: string): boolean {
  return mimeType === MIME_TYPES.PDF ||
         mimeType === MIME_TYPES.DOCX ||
         mimeType === MIME_TYPES.DOC ||
         mimeType === MIME_TYPES.TXT ||
         mimeType === MIME_TYPES.MD
}

export function isAudioMimeType(mimeType: string): boolean {
  return Object.values(MIME_TYPES).some(type =>
    type.startsWith('audio/') && type === mimeType
  )
}

export function isVideoMimeType(mimeType: string): boolean {
  return Object.values(MIME_TYPES).some(type =>
    type.startsWith('video/') && type === mimeType
  )
}