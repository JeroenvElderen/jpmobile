declare module "expo-image-picker" {
  export type ImagePickerAsset = {
    fileName?: string | null;
    mimeType?: string | null;
    uri: string;
  };

  export type ImagePickerResult =
    | { canceled: true; assets: null }
    | { canceled: false; assets: ImagePickerAsset[] };

  export type MediaLibraryPermissionResponse = {
    granted: boolean;
  };

  export function requestMediaLibraryPermissionsAsync(writeOnly?: boolean): Promise<MediaLibraryPermissionResponse>;

  export function launchImageLibraryAsync(options?: {
    allowsMultipleSelection?: boolean;
    mediaTypes?: string[];
    quality?: number;
  }): Promise<ImagePickerResult>;
}