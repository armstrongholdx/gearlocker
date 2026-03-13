type FlatLocation = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  parentLocationId: string | null;
  itemCount: number;
  kitCount: number;
};

export type LocationTreeNode = Omit<FlatLocation, "parentLocationId"> & {
  children: LocationTreeNode[];
};

export function buildLocationTree(locations: FlatLocation[]) {
  const map = new Map<string, LocationTreeNode & { parentLocationId: string | null }>(
    locations.map((location) => [
      location.id,
      {
        ...location,
        children: [],
      },
    ]),
  );

  const roots: LocationTreeNode[] = [];

  for (const location of map.values()) {
    if (location.parentLocationId) {
      map.get(location.parentLocationId)?.children.push(location);
    } else {
      roots.push(location);
    }
  }

  return roots;
}

export function flattenLocationTreeOptions(nodes: LocationTreeNode[], depth = 0): Array<{ id: string; label: string }> {
  return nodes.flatMap((node) => [
    {
      id: node.id,
      label: `${"  ".repeat(depth)}${depth ? "└ " : ""}${node.name}`,
    },
    ...flattenLocationTreeOptions(node.children, depth + 1),
  ]);
}
