import { useState, useEffect } from "react";
import firebase from "firebase/app";

export interface UseFetchAssetsReturn {
  assets: string[];
  isLoading: boolean;
}

/**
 *
 * @param path: Additional path parameter that is used in addition to the `assets/` path in the database storage.
 * @example useFetchAssets("icons")
 * @returns All assets from the provided firebase storage path.
 */
export const useFetchAssets = (path: string): UseFetchAssetsReturn => {
  const [assets, setAssets] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      const storageRef = firebase.storage().ref();

      const list = await storageRef.child(`assets/${path}`).listAll();
      const promises = list.items.map((item) => item.getDownloadURL());

      const urls: string[] = await Promise.all(promises);

      setAssets(urls);
    };

    fetchAssets().finally(() => setLoading(false));
  }, [path]);

  return { assets, isLoading };
};
