import type { Dispatch, SetStateAction } from "react";

import { parseError } from "@/lib/utils";

import type { ExtendedTreeDataItem } from "../types/tree";
import { transformContentsToTreeData } from "./transform-contents-to-tree";

const mergeFolderContents = (
  existingChildren: ExtendedTreeDataItem[] | undefined,
  newContents: ExtendedTreeDataItem[],
  currentPath: string
): ExtendedTreeDataItem[] => {
  if (!existingChildren) return newContents;

  const newContentsMap = new Map(newContents.map((item) => [item.id, item]));

  const updateChildrenRecursively = (
    items: ExtendedTreeDataItem[],
    targetPath: string
  ): ExtendedTreeDataItem[] => {
    return items.map((item) => {
      if (item.path === targetPath) {
        return {
          ...item,
          children: newContents,
        };
      }

      if (newContentsMap.has(item.id)) {
        return {
          ...item,
          ...newContentsMap.get(item.id),
        };
      }

      if (
        item.children &&
        item.path &&
        targetPath.startsWith(item.path + "/")
      ) {
        return {
          ...item,
          children: updateChildrenRecursively(item.children, targetPath),
        };
      }

      return item;
    });
  };

  return updateChildrenRecursively(existingChildren, currentPath);
};

export const fetchContents = async (
  repo: ExtendedTreeDataItem,
  branch: ExtendedTreeDataItem,
  path: string = "",
  setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  setItemLoading: (
    itemId: string,
    isLoading: boolean,
    setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>
  ) => void,
  setError: Dispatch<SetStateAction<string>>
) => {
  if (!repo.full_name) return;

  const getFolderIdFromPath = (
    items: ExtendedTreeDataItem[],
    targetPath: string
  ): string | undefined => {
    for (const item of items) {
      if (item.path === targetPath) {
        return item.id;
      }
      if (item.children) {
        const foundId = getFolderIdFromPath(item.children, targetPath);
        if (foundId) return foundId;
      }
    }
    return undefined;
  };

  let targetId = branch.id;
  if (path) {
    const folderId = getFolderIdFromPath(branch.children || [], path);
    if (folderId) {
      targetId = folderId;
    }
  }

  setItemLoading(targetId, true, setTreeData);
  setError("");

  try {
    const [owner, repoName] = repo.full_name.split("/");
    const response = await fetch(
      `/api/github/repos/contents/${owner}/${repoName}?path=${encodeURIComponent(
        path
      )}&ref=${encodeURIComponent(branch.name)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch contents");
    }

    const contents = await response.json();
    const contentData = transformContentsToTreeData(
      repo.id,
      branch.id,
      contents
    );

    setTreeData((prevData) => {
      return prevData.map((repoItem) => {
        if (repoItem.id === repo.id) {
          return {
            ...repoItem,
            children: repoItem.children?.map((branchItem) => {
              if (branchItem.id === branch.id) {
                const mergedChildren = mergeFolderContents(
                  branchItem.children,
                  contentData,
                  path
                );

                return {
                  ...branchItem,
                  children: mergedChildren,
                };
              }
              return branchItem;
            }),
          };
        }
        return repoItem;
      });
    });
  } catch (err) {
    setError(parseError(err));
  } finally {
    setItemLoading(targetId, false, setTreeData);
  }
};
