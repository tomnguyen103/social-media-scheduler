import ImageKit from "imagekit";

import { requireEnv } from "@/lib/env";

let imageKitClient: ImageKit | null = null;

export function getImageKitClient() {
  if (!imageKitClient) {
    imageKitClient = new ImageKit({
      publicKey: requireEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY"),
      privateKey: requireEnv("IMAGEKIT_PRIVATE_KEY"),
      urlEndpoint: requireEnv("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT"),
    });
  }

  return imageKitClient;
}
