export function SiteFooter() {
  return (
    <footer className="border-t py-10">
      <div className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Prompt Perfector</p>
          <p className="text-sm text-muted-foreground">
            Built for ChatGPT, Claude, Gemini & more. No affiliation.
          </p>
        </div>
      </div>
    </footer>
  );
}
