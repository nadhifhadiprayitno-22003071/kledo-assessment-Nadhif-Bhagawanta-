import type React from "react";
import "./style.css";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";

type Province = { id: number; name: string };
type Regency = { id: number; name: string; province_id: number };
type District = { id: number; name: string; regency_id: number };

type RegionsData = {
  provinces: Province[];
  regencies: Regency[];
  districts: District[];
};

export async function loader(): Promise<RegionsData> {
  // Load the master regions data once (router loader handles it)
  const res = await fetch("/data/indonesia_regions.json");
  if (!res.ok) throw new Response("Failed to load regions", { status: 500 });
  return res.json();
}

function toInt(v: string | null) {
  // Convert query string -> number (or null if empty/invalid)
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : null;
}

export default function FilterPage() {
  const { provinces, regencies, districts } = useLoaderData() as RegionsData;

  // URL params = single source of truth, so refresh won’t reset the filters
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  // Read current selection from URL (province/regency/district)
  const provinceId = toInt(sp.get("province"));
  const regencyId = toInt(sp.get("regency"));
  const districtId = toInt(sp.get("district"));

  // Dependent dropdown options
  const availableRegencies = provinceId
    ? regencies.filter((r) => r.province_id === provinceId)
    : [];

  const availableDistricts = regencyId
    ? districts.filter((d) => d.regency_id === regencyId)
    : [];

  // Selected objects (for breadcrumb + main display)
  const selectedProvince = provinces.find((p) => p.id === provinceId) ?? null;
  const selectedRegency = regencies.find((r) => r.id === regencyId) ?? null;
  const selectedDistrict = districts.find((d) => d.id === districtId) ?? null;

  function updateParams(next: {
    province?: number | null;
    regency?: number | null;
    district?: number | null;
  }) {
    // Only keep params that actually have values
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(next)) {
      if (v !== null && v !== undefined) clean[k] = String(v);
    }
    setSp(clean, { replace: true });
  }

  function onProvinceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    // Province changed -> wipe regency + district
    const nextProvince = toInt(e.target.value);
    updateParams({ province: nextProvince, regency: null, district: null });
  }

  function onRegencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    // Regency changed -> wipe district
    const nextRegency = toInt(e.target.value);
    updateParams({ province: provinceId, regency: nextRegency, district: null });
  }

  function onDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    // District is the last level, so just set it
    const nextDistrict = toInt(e.target.value);
    updateParams({
      province: provinceId,
      regency: regencyId,
      district: nextDistrict,
    });
  }

  function onReset() {
    // Back to clean state (no query params)
    navigate("/", { replace: true });
  }

  const breadcrumbItems = [
    "Indonesia",
    selectedProvince?.name,
    selectedRegency?.name,
    selectedDistrict?.name,
  ].filter(Boolean) as string[];

  return (
    <div className="page">
      <div className="shell">
        {/* Top bar: EXACTLY 2 children (left + right) */}
        <div className="topbar">
          <div className="topbarLeft">
            <div className="brand brand--top">
              <div className="brandIcon">🌐</div>
              <div>Frontend Assessment</div>
            </div>
          </div>

          <div className="topbarRight">
            {/* Breadcrumb MUST have class "breadcrumb" */}
            <div className="breadcrumb">
              {breadcrumbItems.map((item, idx) => (
                <span key={`${item}-${idx}`}>
                  <span
                    className={
                      idx === breadcrumbItems.length - 1 ? "current" : ""
                    }
                  >
                    {item}
                  </span>
                  {idx !== breadcrumbItems.length - 1 && <span> › </span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="layout">
          <aside className="sidebar">
            <div className="sidebarTitle">FILTER WILAYAH</div>

            {/* Province */}
            <div className="field">
              <label>PROVINSI</label>
              <select
                name="province" // required name
                className="select"
                value={provinceId ?? ""}
                onChange={onProvinceChange}
              >
                <option value="" disabled>
                  Pilih Provinsi
                </option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Regency */}
            <div className="field">
              <label>KOTA/KABUPATEN</label>
              <select
                name="regency" // required name
                className="select"
                value={regencyId ?? ""}
                onChange={onRegencyChange}
                disabled={!provinceId}
              >
                <option value="" disabled>
                  {provinceId ? "Pilih Kota/Kabupaten" : "Pilih Provinsi dulu"}
                </option>
                {availableRegencies.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div className="field">
              <label>KECAMATAN</label>
              <select
                name="district" // required name
                className="select"
                value={districtId ?? ""}
                onChange={onDistrictChange}
                disabled={!regencyId}
              >
                <option value="" disabled>
                  {regencyId ? "Pilih Kecamatan" : "Pilih Kota/Kabupaten dulu"}
                </option>
                {availableDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="button" onClick={onReset} className="resetBtn">
              RESET
            </button>
          </aside>

          {/* Main content MUST use <main> as class */}
          <main className="main">
            <div className="stack">
              <Section label="PROVINSI" value={selectedProvince?.name || "-"} />
              <Arrow />
              <Section
                label="KOTA / KABUPATEN"
                value={selectedRegency?.name || "-"}
              />
              <Arrow />
              <Section
                label="KECAMATAN"
                value={selectedDistrict?.name || "-"}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="sectionLabel">{label}</div>
      <div className="sectionValue">{value}</div>
    </div>
  );
}

function Arrow() {
  return <div className="arrow">↓</div>;
}