import { StyleSheet } from "react-native";

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
    backgroundColor: "#fff",
  },
  list: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d7dee8",
  },
  name: {
    color: "#223045",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  meta: {
    color: "#6a7788",
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },
  stateCard: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  footer: {
    paddingVertical: 16,
  },
} as const;
