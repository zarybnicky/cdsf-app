import { StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";

const leftDigits: Record<string, string> = {
  "0": "0001101",
  "1": "0011001",
  "2": "0010011",
  "3": "0111101",
  "4": "0100011",
  "5": "0110001",
  "6": "0101111",
  "7": "0111011",
  "8": "0110111",
  "9": "0001011",
};

const rightDigits: Record<string, string> = {
  "0": "1110010",
  "1": "1100110",
  "2": "1101100",
  "3": "1000010",
  "4": "1011100",
  "5": "1001110",
  "6": "1010000",
  "7": "1000100",
  "8": "1001000",
  "9": "1110100",
};

function computeEan8Checksum(value: string) {
  const digits = value.split("").map(Number);
  const weightedSum = digits.reduce((sum, digit, index) => {
    const weight = index % 2 === 0 ? 3 : 1;
    return sum + digit * weight;
  }, 0);

  return (10 - (weightedSum % 10)) % 10;
}

function normalizeEan8Value(value: string | number) {
  const digits = String(value).replace(/\D/g, "");

  if (digits.length === 7) {
    return `${digits}${computeEan8Checksum(digits)}`;
  }

  if (digits.length === 8) {
    return digits;
  }

  return null;
}

function encodeEan8(value: string) {
  const left = value
    .slice(0, 4)
    .split("")
    .map((digit) => leftDigits[digit])
    .join("");
  const right = value
    .slice(4)
    .split("")
    .map((digit) => rightDigits[digit])
    .join("");

  return `101${left}01010${right}101`;
}

type Ean8BarcodeProps = {
  value: string | number;
};

export default function Ean8Barcode({ value }: Ean8BarcodeProps) {
  const digits = normalizeEan8Value(value);

  if (!digits) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackLabel}>IDT</Text>
        <Text style={styles.fallbackValue}>{String(value)}</Text>
      </View>
    );
  }

  const pattern = encodeEan8(digits);

  return (
    <View style={styles.wrapper}>
      <View style={styles.barcode}>
        {pattern.split("").map((bar, index) => (
          <View
            key={`${digits}-${index}`}
            style={[
              styles.bar,
              bar === "1" ? styles.barBlack : styles.barWhite,
            ]}
          />
        ))}
      </View>
      <Text
        style={styles.label}
      >{`${digits.slice(0, 4)} ${digits.slice(4)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  barcode: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  bar: {
    height: 64,
    width: 2,
  },
  barBlack: {
    backgroundColor: "#11181c",
  },
  barWhite: {
    backgroundColor: "transparent",
  },
  label: {
    color: "#384152",
    fontFamily: "SpaceMono",
    fontSize: 14,
    letterSpacing: 1.6,
    marginTop: 8,
  },
  fallback: {
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#f5f7fb",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  fallbackLabel: {
    color: "#7b8494",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  fallbackValue: {
    color: "#1f2937",
    fontFamily: "SpaceMono",
    fontSize: 18,
    marginTop: 4,
  },
});
