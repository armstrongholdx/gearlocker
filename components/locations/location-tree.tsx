import { LocationTreeNode } from "@/lib/locations";

export function LocationTree({ nodes }: { nodes: LocationTreeNode[] }) {
  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div key={node.id} className="rounded-[1.2rem] border border-slate-200 bg-white/80 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{node.name}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-xs">{node.code ?? "No code"}</span>
                {node.description ? ` · ${node.description}` : ""}
              </p>
            </div>
            <div className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{node.itemCount} items · {node.kitCount} kits</div>
          </div>
          {node.children.length > 0 ? (
            <div className="mt-4 border-l border-dashed border-slate-300 pl-4">
              <LocationTree nodes={node.children} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
