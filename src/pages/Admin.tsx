import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Card } from "@/components/ui/card";

const Admin = () => {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pp-reduce-motion">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            <p className="mt-2 text-sm text-muted-foreground">Coming soon: admin tools and usage analytics.</p>
            <Card className="pp-surface mt-6 rounded-xl border p-6">
              <p className="text-sm text-muted-foreground">
                Placeholder page. Once roles are wired via Supabase RLS, only admins can access this route.
              </p>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Admin;
