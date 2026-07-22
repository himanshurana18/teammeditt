import {
  itemType,
  type ExtendedTreeDataItem,
} from "@/components/repo-browser/types/tree";

export const getDisplayPath = (
  repo: string,
  githubUser: string,
  branch: string,
  selectedItem: ExtendedTreeDataItem | null,
  fileName: string
) => {
  let path = repo || githubUser;

  path += "/";

  if (branch) {
    path += `${branch}/`;
  }

  if (selectedItem) {
    if (selectedItem.type === itemType.DIR) {
      path += `${selectedItem.path}/`;
    } else {
      const dirPath = selectedItem.path?.split("/").slice(0, -1).join("/");
      if (dirPath) {
        path += `${dirPath}/`;
      }
    }
  }

  path += selectedItem?.name === fileName ? selectedItem.name : fileName;

  return path;
};
