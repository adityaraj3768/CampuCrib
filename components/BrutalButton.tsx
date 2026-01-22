import React from "react";
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  View,
} from "react-native";

interface BrutalButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "whatsapp" | "dark" | "lime";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function BrutalButton({
  title,
  variant = "primary",
  size = "md",
  icon,
  className,
  ...props
}: BrutalButtonProps) {
  const baseStyles =
    "border-2 border-brutal active:translate-x-1 active:translate-y-1";

  const variantStyles = {
    primary: "bg-orange",
    secondary: "bg-cosmic",
    whatsapp: "bg-whatsapp",
    dark: "bg-brutal",
    lime: "bg-lime",
  };

  const textVariantStyles = {
    primary: "text-cosmic",
    secondary: "text-brutal",
    whatsapp: "text-brutal",
    dark: "text-cosmic",
    lime: "text-brutal",
  };

  const sizeStyles = {
    sm: "px-4 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4",
  };

  const textSizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <TouchableOpacity
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} rounded-xl flex-row items-center justify-center ${className}`}
      style={{
        shadowColor: "#1A1A1A",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
      }}
      {...props}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text
        className={`font-grotesk ${textVariantStyles[variant]} ${textSizeStyles[size]} font-bold`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
