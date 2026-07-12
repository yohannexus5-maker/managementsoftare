import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { PageHeader, Card, Input, EmptyState } from "../../components/ui";
import { useSearch } from "../../features/search/hooks";

function ResultGroup({ title, children, count }: { title: string; children: React.ReactNode; count: number }) {
  if (count === 0) return null;
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-200 px-5 py-3 text-sm font-semibold text-ink-900">{title}</div>
      {children}
    </Card>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { data, isFetching } = useSearch(query);

  const totalResults =
    (data?.projects.length ?? 0) +
    (data?.consultants.length ?? 0) +
    (data?.drawings.length ?? 0) +
    (data?.documents.length ?? 0) +
    (data?.rfis.length ?? 0);

  return (
    <div>
      <PageHeader title="Search" description="Search across projects, drawings, consultants, and correspondence." />
      <div className="relative mb-6 max-w-xl">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, drawings, consultants, RFIs, documents…"
          className="pl-9"
          autoFocus
        />
      </div>

      {query.trim().length > 1 && !isFetching && totalResults === 0 && (
        <EmptyState title="No results" description={`Nothing matched "${query}".`} />
      )}

      <div className="space-y-4">
        <ResultGroup title="Projects" count={data?.projects.length ?? 0}>
          {data?.projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
              <span className="text-sm font-medium text-ink-900">{p.name}</span>
              <span className="text-xs text-ink-500">{p.typology}</span>
            </Link>
          ))}
        </ResultGroup>

        <ResultGroup title="Consultants" count={data?.consultants.length ?? 0}>
          {data?.consultants.map((c) => (
            <Link key={c.id} to={`/consultants/${c.id}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
              <span className="text-sm font-medium text-ink-900">{c.name}</span>
              <span className="text-xs text-ink-500">{c.category}</span>
            </Link>
          ))}
        </ResultGroup>

        <ResultGroup title="Drawings" count={data?.drawings.length ?? 0}>
          {data?.drawings.map((d) => (
            <Link key={d.id} to={`/projects/${d.projectId}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
              <span className="text-sm font-medium text-ink-900">
                {d.drawingNumber} · {d.title}
              </span>
            </Link>
          ))}
        </ResultGroup>

        <ResultGroup title="Documents" count={data?.documents.length ?? 0}>
          {data?.documents.map((doc) => (
            <Link key={doc.id} to={`/projects/${doc.projectId}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
              <span className="text-sm font-medium text-ink-900">{doc.name}</span>
            </Link>
          ))}
        </ResultGroup>

        <ResultGroup title="RFIs" count={data?.rfis.length ?? 0}>
          {data?.rfis.map((r) => (
            <Link key={r.id} to={`/projects/${r.projectId}`} className="flex items-center justify-between border-b border-ink-100 px-5 py-3 last:border-0 hover:bg-ink-50">
              <span className="text-sm font-medium text-ink-900">{r.question}</span>
            </Link>
          ))}
        </ResultGroup>
      </div>
    </div>
  );
}
