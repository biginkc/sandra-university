import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

export type ContentBlock = {
  id: string;
  block_type:
    | "video"
    | "text"
    | "pdf"
    | "image"
    | "audio"
    | "download"
    | "external_link"
    | "embed"
    | "divider"
    | "callout";
  content: Record<string, unknown>;
  sort_order: number;
  is_required_for_completion: boolean;
};

export function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.block_type) {
    case "text":
      return <TextBlock html={stringOr(block.content.html, "")} />;
    case "callout":
      return (
        <CalloutBlock
          variant={stringOr(block.content.variant, "info")}
          markdown={stringOr(block.content.markdown, "")}
        />
      );
    case "external_link":
      return (
        <ExternalLinkBlock
          url={stringOr(block.content.url, "#")}
          label={stringOr(block.content.label, "Open link")}
          description={stringOr(block.content.description, null)}
          openInNewTab={boolOr(block.content.open_in_new_tab, true)}
        />
      );
    case "divider":
      return <hr className="border-border my-4" />;
    case "image":
      return (
        <ImageBlock
          filePath={stringOr(block.content.file_path, "")}
          alt={stringOr(block.content.alt, "")}
          caption={stringOr(block.content.caption, null)}
        />
      );
    case "video":
    case "audio":
    case "pdf":
    case "download":
    case "embed":
      return <UnsupportedBlock type={block.block_type} />;
    default:
      return <UnsupportedBlock type={block.block_type} />;
  }
}

function stringOr<T extends string | null>(
  value: unknown,
  fallback: T,
): string | T {
  return typeof value === "string" ? value : fallback;
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function TextBlock({ html }: { html: string }) {
  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none text-sm [&_blockquote]:text-muted-foreground [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-3 [&_p]:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const CALLOUT_CLASSES: Record<string, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  note: "border-border bg-muted/50 text-foreground",
};

function CalloutBlock({
  variant,
  markdown,
}: {
  variant: string;
  markdown: string;
}) {
  const cls = CALLOUT_CLASSES[variant] ?? CALLOUT_CLASSES.note;
  return (
    <div className={cn("rounded-md border px-4 py-3 text-sm", cls)}>
      {markdown}
    </div>
  );
}

function ExternalLinkBlock({
  url,
  label,
  description,
  openInNewTab,
}: {
  url: string;
  label: string;
  description: string | null;
  openInNewTab: boolean;
}) {
  const isExternal = url.startsWith("http") || openInNewTab;
  const className =
    "border-border hover:bg-muted/40 flex items-start gap-3 rounded-md border px-4 py-3 text-sm transition-colors";
  const content = (
    <>
      <ExternalLink className="mt-0.5 size-4 shrink-0" />
      <div>
        <div className="font-medium">{label}</div>
        {description ? (
          <div className="text-muted-foreground mt-0.5 text-xs">
            {description}
          </div>
        ) : null}
      </div>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={url}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={url} className={className}>
      {content}
    </Link>
  );
}

function ImageBlock({
  filePath,
  alt,
  caption,
}: {
  filePath: string;
  alt: string;
  caption: string | null;
}) {
  if (!filePath) return null;
  return (
    <figure className="my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={filePath} alt={alt} className="rounded-md border" />
      {caption ? (
        <figcaption className="text-muted-foreground mt-2 text-xs">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function UnsupportedBlock({ type }: { type: string }) {
  return (
    <div className="border-border bg-muted/40 text-muted-foreground rounded-md border border-dashed px-4 py-3 text-xs">
      Block type &quot;{type}&quot; isn&apos;t rendered yet.
    </div>
  );
}
