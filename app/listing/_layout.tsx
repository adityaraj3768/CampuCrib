import React from "react";
import { Stack } from "expo-router";

export default function ListingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FFF8E7" },
        animation: "slide_from_right",
      }}
    />
  );
}
