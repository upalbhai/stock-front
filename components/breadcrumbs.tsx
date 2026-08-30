import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbSchema } from "@/lib/jsonld";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const fullItems = [{ name: "Home", url: "/" }, ...items];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(fullItems)) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-sm text-muted-foreground">
        {fullItems.map((item, index) => {
          const isLast = index === fullItems.length - 1;
          
          return (
            <div key={item.url} className="flex items-center">
              {index === 0 ? (
                <Link href={item.url} className="flex items-center hover:text-primary transition-colors">
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Home</span>
                </Link>
              ) : (
                <Link 
                  href={item.url}
                  className={`hover:text-primary transition-colors ${isLast ? 'font-semibold text-foreground pointer-events-none' : ''}`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.name}
                </Link>
              )}
              
              {!isLast && (
                <ChevronRight className="mx-2 h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
