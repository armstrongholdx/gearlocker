import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
    include: { childLocations: true, _count: { select: { items: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Locations</h1>
        <p className="text-muted-foreground">Current storage map for shelves, truck, and remote storage.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardHeader>
              <CardTitle>{location.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{location.description ?? "No description"}</p>
              <p>{location._count.items} assigned items</p>
              {location.childLocations.length > 0 ? <p>{location.childLocations.length} child locations</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
