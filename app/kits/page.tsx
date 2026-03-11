import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function KitsPage() {
  const kits = await prisma.kit.findMany({
    include: {
      items: {
        include: {
          item: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Kits</h1>
        <p className="text-muted-foreground">List and inspect grouped gear. Create/edit flows are next.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {kits.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No kits yet. Seed or create one in Prisma Studio for now.</CardContent>
          </Card>
        ) : (
          kits.map((kit) => (
            <Card key={kit.id}>
              <CardHeader>
                <CardTitle>{kit.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{kit.description ?? "No description"}</p>
                <p>{kit.items.length} items</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
