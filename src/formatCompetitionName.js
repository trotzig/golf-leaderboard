export default function formatCompetitionName(name) {
  return name?.replace(/ \(Entry\)$/, '') ?? name;
}
