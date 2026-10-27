// バックアップを「統合して読み込む」: 手元のデータに、読み込んだデータの手元にないものだけを足す
// 同じもの（同じ授業・同じ日の記録、同じIDの授業など）は手元を優先して、上書きしない。設定は変更しない

const mergeList = (current, incoming, keysOf) => {
  const seen = new Set(current.flatMap(keysOf));
  const added = incoming.filter((item) => {
    const keys = keysOf(item);
    if (keys.some(k => seen.has(k))) return false;
    keys.forEach(k => seen.add(k)); // 読み込むデータ内の重複も1件にする
    return true;
  });
  return { value: [...current, ...added], added: added.length, skipped: incoming.length - added.length };
};

const mergeMap = (current, incoming) => {
  const added = Object.keys(incoming).filter(k => !(k in current));
  return { value: { ...current, ...Object.fromEntries(added.map(k => [k, incoming[k]])) }, added: added.length, skipped: Object.keys(incoming).length - added.length };
};

// current / incoming: { logs, courses, courseMemos, datedMemos, campuses, campusBuildings, campusImages }
// 戻り値: { data（変わった項目だけ）, stats: { 項目名: { added, skipped } } }
export function mergeBackupData(current, incoming) {
  const data = {};
  const stats = {};
  const put = (key, merged) => { data[key] = merged.value; stats[key] = { added: merged.added, skipped: merged.skipped }; };

  // 記録は「同じ授業・同じ日」か「同じID」なら同じものとみなす
  if (incoming.logs) put('logs', mergeList(current.logs, incoming.logs, l => [`id:${l.id}`, `${l.courseId}|${l.date}`]));
  if (incoming.courses) put('courses', mergeList(current.courses, incoming.courses, c => [c.id]));
  if (incoming.campuses) put('campuses', mergeList(current.campuses, incoming.campuses, c => [c.id]));
  if (incoming.courseMemos) put('courseMemos', mergeMap(current.courseMemos, incoming.courseMemos));
  if (incoming.datedMemos) put('datedMemos', mergeMap(current.datedMemos, incoming.datedMemos));
  if (incoming.campusImages) put('campusImages', mergeMap(current.campusImages, incoming.campusImages));
  if (incoming.campusBuildings) {
    const value = { ...current.campusBuildings };
    let added = 0; let skipped = 0;
    for (const [campusId, list] of Object.entries(incoming.campusBuildings)) {
      const merged = mergeList(value[campusId] ?? [], list, b => [b.id]);
      value[campusId] = merged.value; added += merged.added; skipped += merged.skipped;
    }
    put('campusBuildings', { value, added, skipped });
  }
  return { data, stats };
}
