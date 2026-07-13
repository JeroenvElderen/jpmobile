declare module "expo-document-picker" {
  export type DocumentPickerAsset = {
    mimeType?: string;
    name: string;
    size?: number;
    uri: string;
  };

  export type DocumentPickerResult =
    | { canceled: true; assets: null }
    | { canceled: false; assets: DocumentPickerAsset[] };

  export function getDocumentAsync(options?: {
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
    type?: string | string[];
  }): Promise<DocumentPickerResult>;
}