import type { TreeDataItem } from "@/components/tree";

export enum itemType {
  REPO = "repo",
  BRANCH = "branch",
  DIR = "dir",
  FILE = "file",
}

export interface ExtendedTreeDataItem extends TreeDataItem {
  full_name?: string;
  path?: string;
  type?: itemType;
  children?: ExtendedTreeDataItem[];
}
