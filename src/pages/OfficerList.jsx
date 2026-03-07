import { useState, useEffect, useCallback } from "react";
import {
  collection, query, where, limit,
  startAfter, getDocs, deleteDoc, doc, getDoc, updateDoc, increment,
  addDoc
} from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict } from "../DistrictContext";
import { DROPDOWNS } from "../dropdownData";

const PAGE_SIZE = 50;

export default function OfficerList() {
  const { district, loading: districtLoading } = useDistrict();
  const [officers, setOfficers] = useState([]);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filterUnit, setFilterUnit] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filterLoading, setFilterLoading] = useState(false);

  // Stats for the left rail
  const [stats, setStats] = useState({ total: 0, male: 0, female: 0, units: 0, onLeave: 0 });
  const [railFilter, setRailFilter] = useState("all"); // "all" | "male" | "female"

  // Selection mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [listName, setListName] = useState("");
  const [savingList, setSavingList] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();

  // Read URL params initially (e.g. from UnitList redirection)
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const u = params.get("unit");
    if (u) {
      setFilterUnit(u);
    }
  }, [loc.search]);

  // Fetch stats from district doc
  useEffect(() => {
    if (!district || district === "Overall") return;
    getDoc(doc(db, "districts", district)).then(snap => {
      if (snap.exists()) {
        const s = snap.data().stats || {};
        setStats({ total: s.total || 0, male: s.male || 0, female: s.female || 0, units: s.units || 0 });
        setTotalCount(s.total || 0);
      }
    });
  }, [district]);

  // ── HIGH-PERFORMANCE SERVER SEARCH: Uses _searchGrams array-contains ──
  const performServerSearch = async (searchTerm) => {
    if (!district || district === "Overall") return;
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setIsSearching(false);
      loadPage(false);
      return;
    }

    setFilterLoading(true);
    setIsSearching(true);
    setOfficers([]);

    try {
      // "array-contains" is the fastest way to do partial keyword match in Firestore
      const q = query(
        collection(db, "officers"),
        where("district", "==", district),
        where("_searchGrams", "array-contains", term),
        limit(100)
      );

      const snap = await getDocs(q);
      setOfficers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setHasMore(false);
    } catch (err) {
      console.error("Search error:", err);
      // Fallback if index isn't ready or if term is complex
    }
    setFilterLoading(false);
  };

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim().length > 0) {
        performServerSearch(search);
      } else if (search.trim().length === 0 && isSearching) {
        setIsSearching(false);
        loadPage(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── UNFILTERED: regular paginated load ──
  const loadPage = useCallback(async (isLoadMore = false) => {
    if (!district || district === "Overall") return;
    if (filterRank || filterUnit || railFilter !== "all" || isSearching) return;

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
  }, [district, lastDoc, filterRank, filterUnit, railFilter, isSearching]);

  // ── FILTERED: fetch ALL matching records ──
  const loadFiltered = useCallback(async () => {
    if (!district || district === "Overall") return;
    setFilterLoading(true);
    setOfficers([]);

    try {
      const constraints = [where("district", "==", district)];
      if (filterRank) constraints.push(where("rank", "==", filterRank));
      if (filterUnit) constraints.push(where("unit", "==", filterUnit));
      if (railFilter === "male") constraints.push(where("gender", "==", "Male"));
      if (railFilter === "female") constraints.push(where("gender", "==", "Female"));
      if (railFilter === "on leave") constraints.push(where("status", "==", "On Leave"));

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
    }

    setFilterLoading(false);
  }, [district, filterRank, filterUnit, railFilter]);

  // Reload on district change
  useEffect(() => {
    if (!districtLoading && district && district !== "Overall" && !filterRank && !filterUnit && railFilter === "all" && !isSearching) {
      loadPage(false);
    }
  }, [district, districtLoading]);

  // Trigger filtered load when any filter changes
  useEffect(() => {
    if (!districtLoading && district && district !== "Overall") {
      if (filterRank || filterUnit || railFilter !== "all") {
        setSearch("");
        setIsSearching(false);
        loadFiltered();
      } else if (!isSearching) {
        setLastDoc(null);
        setHasMore(true);
        loadPage(false);
      }
    }
  }, [filterRank, filterUnit, railFilter, district, districtLoading]);

  const deleteOfficer = async (id, name) => {
    if (window.confirm(`Delete officer ${name}?`)) {
      await deleteDoc(doc(db, "officers", id));
      setOfficers(prev => prev.filter(o => o.id !== id));
      try {
        await updateDoc(doc(db, "districts", district), {
          "stats.total": increment(-1),
        });
      } catch (e) { }
    }
  };

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
      alert(`List "${listName}" saved!`);
      setShowSaveModal(false);
      setListName("");
      cancelSelect();
    } catch (err) {
      alert("Error saving list: " + err.message);
    }
    setSavingList(false);
  };

  const isFiltering = Boolean(filterRank || filterUnit || railFilter !== "all" || isSearching);
  const isLoadingAny = loading || filterLoading;

  if (district === "Overall") {
    return (
      <div className="page" style={{ textAlign: 'center', padding: 40 }}>
        <span style={{ fontSize: 60 }}>�</span>
        <h2 className="page-heading">Detailed List</h2>
        <p className="page-sub">Admins must select a specific district to view detailed officer records.</p>
        <button className="btn-primary" onClick={() => nav("/")} style={{ width: 200, margin: '20px auto' }}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav("/")}>← Back</button>
        <span className="topbar-title">{district} Officers</span>
        <div style={{ display: "flex", gap: 6 }}>
          {!selectMode ? (
            <button className="btn-select-mode" onClick={() => setSelectMode(true)}>☑ Select</button>
          ) : (
            <button className="btn-select-mode active" onClick={cancelSelect}>✕</button>
          )}
          <button className="btn-add" onClick={() => nav("/officers/add")}>+ Add</button>
        </div>
      </div>

      <div className="officer-page-layout">
        <div className="left-rail">
          {["all", "male", "female", "on leave"].map(f => (
            <button key={f}
              className={`rail-btn ${railFilter === f ? "active" : ""}`}
              onClick={() => { setRailFilter(f); setFilterRank(""); setFilterUnit(""); setSearch(""); setIsSearching(false); }}
            >
              <span className="rail-num">
                {f === "all" ? stats.total : (f === "male" ? stats.male : (f === "female" ? stats.female : (stats.onLeave || "🛌")))}
              </span>
              <span className="rail-label">{f}</span>
            </button>
          ))}
          <button className="rail-btn" onClick={() => nav("/units")}>
            <span className="rail-num">{stats.units}</span>
            <span className="rail-label">Units</span>
          </button>
        </div>

        <div className="officer-main">
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              className="search-input"
              placeholder="🔍 Search name, belt, mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 0, paddingRight: 40 }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 18, cursor: 'pointer' }}
              >✕</button>
            )}
          </div>

          <div className="filter-row">
            <select className="filter-select" value={filterRank} onChange={e => setFilterRank(e.target.value)}>
              <option value="">All Ranks</option>
              {DROPDOWNS.rank.map(r => <option key={r}>{r}</option>)}
            </select>
            <select className="filter-select" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
              <option value="">All Units</option>
              {Object.values(DROPDOWNS.unit).flat().map(u => <option key={u}>{u}</option>)}
            </select>
          </div>

          {selectMode && selected.size > 0 && (
            <div className="selection-bar">
              <span>{selected.size} selected</span>
              <div className="selection-bar-actions">
                <button className="btn-save-list" onClick={() => setShowSaveModal(true)}>💾 Save List</button>
                <button className="btn-cancel-select" onClick={cancelSelect}>Cancel</button>
              </div>
            </div>
          )}

          {isLoadingAny ? (
            <div className="loading-text">
              <div className="spinner" style={{ borderColor: 'var(--blue)', borderTopColor: 'transparent', margin: '0 auto 10px' }} />
              Searching database...
            </div>
          ) : (
            <div className="officer-list">
              {officers.length === 0 && <div className="empty-text">No officers found matching "{search}"</div>}
              {officers.map(o => (
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
                    <div className="officer-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {o.name}
                      {o.status === "On Leave" ? <span className="status-badge on-leave">On Leave</span> : <span className="status-badge active">Active</span>}
                    </div>
                    <div className="officer-rank">{o.rank} • {o.badgeNo || "—"}</div>
                    <div className="officer-unit">{o.unit}</div>
                  </div>
                  {!selectMode && (
                    <div className="officer-actions">
                      <button className="edit-btn" onClick={() => nav(`/officers/edit/${o.id}`)}>✏️</button>
                    </div>
                  )}
                </div>
              ))}

              {hasMore && !isFiltering && (
                <button className="btn-load-more" onClick={() => loadPage(true)} disabled={loadingMore}>
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Save Custom List</h2>
            <input className="field-input" placeholder="List name..." value={listName} onChange={e => setListName(e.target.value)} autoFocus />
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="modal-btn primary" onClick={saveCustomList}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}