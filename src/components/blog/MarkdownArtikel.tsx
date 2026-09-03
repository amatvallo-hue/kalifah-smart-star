import Markdown from "markdown-to-jsx";

export function MarkdownArtikel({ kandungan }: { kandungan: string }) {
  return (
    <div className="prose-kalifah space-y-4 text-base leading-relaxed text-foreground">
      <Markdown
        options={{
          disableParsingRawHTML: true,
          overrides: {
            h2: {
              props: {
                className: "mt-8 font-display text-2xl font-extrabold text-foreground",
              },
            },
            h3: {
              props: {
                className: "mt-6 font-display text-xl font-extrabold text-foreground",
              },
            },
            p: { props: { className: "text-base leading-relaxed text-foreground/90" } },
            ul: { props: { className: "list-disc space-y-2 pl-6 text-foreground/90" } },
            ol: { props: { className: "list-decimal space-y-2 pl-6 text-foreground/90" } },
            a: {
              props: {
                className: "font-semibold underline",
                style: { color: "#1B8A5A" },
              },
            },
            blockquote: {
              props: {
                className: "border-l-4 pl-4 italic text-muted-foreground",
                style: { borderColor: "#F5A623" },
              },
            },
            img: { props: { className: "rounded-xl", loading: "lazy" } },
            code: {
              props: { className: "rounded bg-muted px-1.5 py-0.5 text-sm" },
            },
          },
        }}
      >
        {kandungan ?? ""}
      </Markdown>
    </div>
  );
}
