import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";

interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface CitySearchInputProps {
  value: string;
  onChange: (city: string) => void;
}

export default function CitySearchInput({ value, onChange }: CitySearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => { setQuery(value); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en`
      );
      const data = await res.json();
      setResults(data.results || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (r: GeoResult) => {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(", ");
    setQuery(label);
    onChange(r.name);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search city…"
        className="mt-1 pr-8"
      />
      {loading && (
        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground mt-0.5" />
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {results.map((r, i) => {
            const label = [r.name, r.admin1, r.country].filter(Boolean).join(", ");
            return (
              <button
                key={`${r.latitude}-${r.longitude}-${i}`}
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left hover:bg-accent transition-colors"
                onClick={() => handleSelect(r)}
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate text-foreground">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
