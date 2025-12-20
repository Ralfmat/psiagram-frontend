import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

type OtpInputProps = {
  length?: number;
  onChangeCode?: (code: string) => void;
  onComplete?: (code: string) => void; 
  autoFocus?: boolean;
};

export default function OtpInput({
  length = 6,
  onChangeCode,
  onComplete,
  autoFocus = true,
}: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputsRef = useRef<(TextInput | null)[]>([]);

  const code = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    onChangeCode?.(code);
    if (code.length === length && digits.every((d) => d !== "")) {
      onComplete?.(code);
    }
  }, [code, digits, length, onChangeCode, onComplete]);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }, [autoFocus]);

  const setAllDigitsFromPaste = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, length);
    if (!cleaned) return false;

    const next = Array(length).fill("");
    for (let i = 0; i < cleaned.length; i++) next[i] = cleaned[i];

    setDigits(next);

    const nextFocusIndex = Math.min(cleaned.length, length - 1);
    inputsRef.current[nextFocusIndex]?.focus();
    return true;
  };

  const setDigit = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = setAllDigitsFromPaste(value);
      if (pasted) return;
    }

    const cleaned = value.replace(/\D/g, "").slice(-1);

    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);

    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
      }
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(r) => {(inputsRef.current[i] = r)}}
          style={[styles.box, d ? styles.boxFilled : null]}
          value={d}
          onChangeText={(v) => setDigit(i, v)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={length} 
          returnKeyType="done"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 6 * 48 + 5 * 10,
    alignSelf: "center",
  },
  box: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#D9D9D9",
    textAlign: "center",
    fontSize: 18,
  },
  boxFilled: {
    backgroundColor: "#CFCFCF",
  },
});
