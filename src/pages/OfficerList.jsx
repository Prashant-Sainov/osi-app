import { useState, useEffect, useCallback } from "react";
import {
  collection, query, where, limit,
  startAfter, getDocs, deleteDoc, doc, getDoc, updateDoc, increment,
  addDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict } from "../DistrictContext";
import { DROPDOWNS } from "../dropdownData";

const PAGE_SIZE = 50;

export default function OfficerList() {
  const { district, loading: districtLoading } = useDistrict();
  const [officers, setOfficers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filterLoading, setFilterLoading] = useState(false);

  // Stats for the left rail
  const [stats, setStats] = useState({ total: 0, male: 0, female: 0, units: 0 });
  const [railFilter, setRailFilter] = useState("all"); // "all" | "male" | "female"

  // Selection mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [listName, setListName] = useState("");
  const [savingList, setSavingList] = useState(false);

  const nav = useNavigate();

  // Fetch stats from district doc
  useEffect(() => {
    if (!district) return;
    getDoc(doc(db, "districts", district)).then(snap => {
      if (snap.exists()) {
        const s = snap.data().stats || {};
        setStats({ total: s.total || 0, male: s.male || 0, female: s.female || 0, units: s.units || 0 });
        setTotalCount(s.total || 0);
      }
    });
  }, [district]);

  // ── UNFILTERED: regular paginated load ──
  const loadPage = useCallback(async (isLoadMore = false) => {
    if (!district) return;
    if (filterRank || filterUnit || railFilter !== "all") return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOfficers([]);
      setLastDoc(null);
      setHasMore(true);
    }

    try {
      const q = query(
        collection(db, "officers"),
        where("district", "==", district),
        limit(PAGE_SIZE),
        ...(isLoadMore && lastDoc ? [startAfter(lastDoc)] : [])
      );

      const snap = await getDocs(q);
      const newOfficers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (isLoadMore) {
        setOfficers(prev => [...prev, ...newOfficers]);
      } else {
        setOfficers(newOfficers);
      }

      if (snap.docs.length > 0) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
      }
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error loading officers:", err);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [district, lastDoc, filterRank, filterUnit, railFilter]);

  // ── FILTERED: fetch ALL matching records ──
  const loadFiltered = useCallback(async () => {
    if (!district) return;
    setFilterLoading(true);
    setOfficers([]);

    try {
      const constraints = [where("district", "==", district)];
      if (filterRank) constraints.push(where("rank", "==", filterRank));
      if (filterUnit) constraints.push(where("unit", "==", filterUnit));
      if (railFilter === "male") constraints.push(where("gender", "==", "Male"));
      if (railFilter === "female") constraints.push(where("gender", "==", "Female"));

      let allDocs = [];
      let cursor = null;
      let keepGoing = true;

      while (keepGoing) {
        const q = query(
          collection(db, "officers"),
          ...constraints,
          limit(500),
          ...(cursor ? [startAfter(cursor)] : [])
        );
        const snap = await getDocs(q);
        allDocs = [...allDocs, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];

        if (snap.docs.length < 500) {
          keepGoing = false;
        } else {
          cursor = snap.docs[snap.docs.length - 1];
        }
      }

      setOfficers(allDocs);
      setHasMore(false);
    } catch (err) {
      console.error("Error loading filtered officers:", err);
      alert("Filter query failed. Check browser console for a Firestore index link and click it.");
    }

    setFilterLoading(false);
  }, [district, filterRank, filterUnit, railFilter]);

  // Reload on district change (unfiltered)
  useEffect(() => {
    if (!districtLoading && district && !filterRank && !filterUnit && railFilter === "all") {
      loadPage(false);
    }
  }, [district, districtLoading]);

  // Trigger filtered load when any filter changes
  useEffect(() => {
    if (!districtLoading && district) {
      if (filterRank || filterUnit || railFilter !== "all") {
        loadFiltered();
      } else {
        setLastDoc(null);
        setHasMore(true);
        loadPage(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRank, filterUnit, railFilter, district, districtLoading]);

  // Client-side text search
  const filtered = officers.filter(o => {
    const q = search.toLowerCase();
    return !q ||
      o.name?.toLowerCase().includes(q) ||
      o.badgeNo?.toLowerCase().includes(q) ||
      o.mobile?.toString().includes(q);
  });

  const deleteOfficer = async (id, name) => {
    if (window.confirm(`Delete officer ${name}?`)) {
      await deleteDoc(doc(db, "officers", id));
      setOfficers(prev => prev.filter(o => o.id !== id));
      try {
        await updateDoc(doc(db, "districts", district), {
          "stats.total": increment(-1),
        });
      } catch (e) { /* stats update non-critical */ }
    }
  };

  // ── SELECTION HANDLERS ──
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cancelSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const saveCustomList = async () => {
    if (!listName.trim()) { alert("Please enter a list name"); return; }
    setSavingList(true);
    try {
      await addDoc(collection(db, "customLists"), {
        name: listName.trim(),
        district: district,
        officerIds: [...selected],
        count: selected.size,
        createdAt: new Date().toISOString(),
      });
      alert(`List "${listName}" saved with ${selected.size} officers!`);
      setShowSaveModal(false);
      setListName("");
      cancelSelect();
    } catch (err) {
      alert("Error saving list: " + err.message);
    }
    setSavingList(false);
  };

  const isFiltering = Boolean(filterRank || filterUnit || railFilter !== "all");
  const isLoadingAny = loading || filterLoading;

  return (
    <div className="page">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav("/")}>← Back</button>
        <span className="topbar-title">{district} Officers</span>
        <div style={{ display: "flex", gap: 6 }}>
          {!selectMode ? (
            <button className="btn-select-mode" onClick={() => setSelectMode(true)}>☑ Select</button>
          ) : (
            <>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, alignSelf: "center" }}>
                {selected.size} selected
              </span>
              <button className="btn-select-mode active" onClick={cancelSelect}>✕</button>
            </>
          )}
          <button className="btn-add" onClick={() => nav("/officers/add")}>+ Add</button>
        </div>
      </div>

      <div className="officer-page-layout">
        {/* ── LEFT RAIL ── */}
        <div className="left-rail">
          <button
            className={`rail-btn ${railFilter === "all" ? "active" : ""}`}
            onClick={() => { setRailFilter("all"); setFilterRank(""); setFilterUnit(""); }}
          >
            <span className="rail-num">{stats.total}</span>
            <span className="rail-label">Total</span>
          </button>
          <button
            className={`rail-btn ${railFilter === "male" ? "active" : ""}`}
            onClick={() => { setRailFilter("male"); }}
          >
            <span className="rail-num">{stats.male}</span>
            <span className="rail-label">Male</span>
          </button>
          <button
            className={`rail-btn ${railFilter === "female" ? "active" : ""}`}
            onClick={() => { setRailFilter("female"); }}
          >
            <span className="rail-num">{stats.female}</span>
            <span className="rail-label">Female</span>
          </button>
          <button
            className={`rail-btn ${railFilter === "units" ? "active" : ""}`}
            onClick={() => nav("/")}
          >
            <span className="rail-num">{stats.units}</span>
            <span className="rail-label">Units</span>
          </button>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="officer-main">
          <input
            className="search-input"
            placeholder="🔍  Search by name, badge, mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="filter-row">
            <select className="filter-select" value={filterRank}
              onChange={e => { setFilterRank(e.target.value); setSearch(""); }}>
              <option value="">All Ranks</option>
              {DROPDOWNS.rank.map(r => <option key={r}>{r}</option>)}
            </select>
            <select className="filter-select" value={filterUnit}
              onChange={e => { setFilterUnit(e.target.value); setSearch(""); }}>
              <option value="">All Units</option>
              {Object.values(DROPDOWNS.unit).flat().map(u => <option key={u}>{u}</option>)}
            </select>
            {(filterRank || filterUnit) && (
              <button className="filter-clear-btn" onClick={() => { setFilterRank(""); setFilterUnit(""); }}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Selection bar */}
          {selectMode && selected.size > 0 && (
            <div className="selection-bar">
              <span>{selected.size} officer{selected.size > 1 ? "s" : ""} selected</span>
              <div className="selection-bar-actions">
                <button className="btn-save-list" onClick={() => setShowSaveModal(true)}>
                  💾 Save List
                </button>
                <button className="btn-cancel-select" onClick={cancelSelect}>Cancel</button>
              </div>
            </div>
          )}

          {isLoadingAny ? (
            <div className="loading-text">
              {filterLoading
                ? `Loading all ${filterRank || (railFilter !== "all" ? railFilter : filterUnit)} records...`
                : "Loading officers..."}
            </div>
          ) : (
            <>
              <div className="officer-list">
                {filtered.length === 0 && <div className="empty-text">No officers found</div>}
                {filtered.map(o => (
                  <div
                    className={`officer-card ${selectMode && selected.has(o.id) ? "selected" : ""}`}
                    key={o.id}
                    onClick={selectMode ? () => toggleSelect(o.id) : undefined}
                  >
                    {selectMode && (
                      <div className={`officer-checkbox ${selected.has(o.id) ? "checked" : ""}`}>
                        {selected.has(o.id) ? "✓" : ""}
                      </div>
                    )}
                    <div className="officer-avatar">{o.gender === "Female" ? "👮‍♀️" : "👮"}</div>
                    <div className="officer-info" onClick={!selectMode ? () => nav(`/officers/${o.id}`) : undefined}>
                      <div className="officer-name">{o.name}</div>
                      <div className="officer-rank">{o.rank} • {o.badgeNo || "—"}</div>
                      <div className="officer-unit">{o.unit || "No unit assigned"}</div>
                    </div>
                    {!selectMode && (
                      <div className="officer-actions">
                        <button className="edit-btn" onClick={() => nav(`/officers/edit/${o.id}`)}>✏️</button>
                        <button className="del-btn" onClick={() => deleteOfficer(o.id, o.name)}>🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Load More — only when NOT filtering */}
              {hasMore && !isFiltering && !search && (
                <button
                  className="btn-load-more"
                  onClick={() => loadPage(true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More Officers"}
                </button>
              )}

              <div className="pagination-info">
                {isFiltering
                  ? `Showing all ${filtered.length} ${railFilter !== "all" ? railFilter : (filterRank || filterUnit)} records`
                  : `Showing ${officers.length} of ${totalCount} officers`}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── SAVE LIST MODAL ── */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Save Custom List</h2>
            <p style={{ color: "#5c6e83", fontSize: 13, marginBottom: 12 }}>
              {selected.size} officer{selected.size > 1 ? "s" : ""} selected
            </p>
            <input
              className="field-input"
              placeholder="Enter list name (e.g., Night Shift Team)"
              value={listName}
              onChange={e => setListName(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="modal-btn primary" onClick={saveCustomList} disabled={savingList}>
                {savingList ? "Saving..." : "Save List"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}