"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
};

export function CatalogSearch({
  value,
  onChange,
  placeholder = "Cari…",
  label = "Cari",
  className,
}: Props) {
  return (
    <label className={`catalog-search${className ? ` ${className}` : ""}`}>
      <span className="catalog-search__label">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
      />
      {value ? (
        <button
          type="button"
          className="catalog-search__clear"
          aria-label="Hapus pencarian"
          onClick={() => onChange("")}
        >
          ×
        </button>
      ) : null}
    </label>
  );
}
