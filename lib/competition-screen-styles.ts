export const detailScreenStyles = {
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 10,
  },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  eyebrow: {
    color: "#2457b3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
} as const;

export const listScreenStyles = {
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerMeta: {
    color: "#2457b3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 7,
    textTransform: "uppercase",
  },
  headerBody: {
    color: "#637183",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  name: {
    color: "#223045",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  meta: {
    color: "#617185",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  stateCard: {
    marginHorizontal: 12,
  },
  footer: {
    paddingVertical: 16,
  },
} as const;
