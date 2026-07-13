declare module "expo-image-manipulator" {
  export enum SaveFormat {
    JPEG = "jpeg",
    PNG = "png",
    WEBP = "webp",
  }

  export type ImageResult = { uri: string; width: number; height: number };

  export function manipulateAsync(
    uri: string,
    actions?: Array<{ resize: { width?: number; height?: number } }>,
    saveOptions?: { compress?: number; format?: SaveFormat },
  ): Promise<ImageResult>;
}